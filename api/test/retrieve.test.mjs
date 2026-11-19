/**
 * Retrieval: which slides a question is about.
 *
 * Two kinds of test here, deliberately.
 *
 * The first kind is arithmetic — folding, question words, the floor — and
 * needs no catalogue. The second runs real questions against the real
 * `presenter.json` and asserts the right slide reaches the prompt. That ties
 * the test to generated content, which is the point: if an edit to the deck
 * makes the guide stop finding the Tencent internship, somebody should hear
 * about it from a failing test rather than from a visitor.
 *
 * Expectations are loose on purpose — a prefix, and anywhere in the top k
 * rather than first. What the guide needs is the slide in front of it; which
 * of three Rivulet cards sorts highest is not worth pinning.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FLOOR, TOP_K, index, rank, retrieve, terms } from "../src/shared/retrieve.mjs";

const presenter = JSON.parse(readFileSync(new URL("../presenter.json", import.meta.url), "utf8"));
const built = index(presenter.slides);
const OPTS = { spine: presenter.spine, always: ["contact"] };

/* ------------------------------------------------------------- tokenising */

test("inflections fold onto the form a slide is likely to use", () => {
  const pairs = {
    values: "value",
    papers: "paper",
    published: "publish",
    volunteering: "volunteer",
    studies: "study",
    capabilities: "capability",
    systems: "system",
  };
  for (const [from, to] of Object.entries(pairs)) {
    assert.deepEqual(terms(from), [to], `${from} should fold to ${to}`);
  }
});

test("'es' is only stripped where English adds it", () => {
  /* The blunt rule turned "values" into "valu", which matched nothing. */
  assert.deepEqual(terms("boxes"), ["box"]);
  assert.deepEqual(terms("values"), ["value"]);
  assert.deepEqual(terms("business"), ["business"], "a stem ending in s keeps it");
});

test("question words are dropped, however rare they are in the deck", () => {
  /*
   * "tell" appears on exactly one slide — the contact card, which opens "Tell
   * me what keeps breaking" — so IDF rated it the most informative word in the
   * question and returned that card for anything phrased "tell me about…".
   */
  assert.deepEqual(terms("Tell me about his volunteering"), ["volunteer"]);
  assert.deepEqual(terms("How do I contact him?"), ["contact"]);
  assert.deepEqual(terms("What are his values?"), ["value"]);
});

test("the subject's own name carries no signal on his own portfolio", () => {
  assert.deepEqual(terms("Evan Huang Yuxiang"), []);
});

/* -------------------------------------------------------------- retrieval */

test("the slide a question is about reaches the prompt", () => {
  const cases = {
    "What is Rivulet LocalOps?": "rivulet-localops",
    "What did Evan do at Tencent?": "work-tencent-work",
    "What is AgriSentry?": "agrisentry",
    "What papers has he published?": "paper-",
    "Does he know Python?": "capabilities",
    "How do I contact him?": "contact",
    "What is LifeOps Atlas?": "lifeops-atlas",
    "Tell me about the motorsport team": "utas-motorsport",
    "What did he do at Perfect World?": "work-perfect-world",
    "Has he used Power BI?": "agrisentry",
    "What are his values?": "position-",
  };

  for (const [question, want] of Object.entries(cases)) {
    const { ids } = retrieve(question, built, OPTS);
    assert.ok(
      ids.some((id) => id.startsWith(want)),
      `"${question}" retrieved ${ids.join(", ")} — nothing starting ${want}`,
    );
  }
});

test("a question with no subject falls back to the spine rather than to noise", () => {
  for (const question of ["hello", "What can you tell me", "Who is he?"]) {
    const found = retrieve(question, built, OPTS);
    assert.equal(found.matched, false, `"${question}" should not claim a match`);
    assert.deepEqual(found.ids, presenter.spine.slice(0, TOP_K));
  }
});

test("the contact card is always in reach, whatever was asked", () => {
  const { ids } = retrieve("What is AgriSentry?", built, OPTS);
  assert.ok(ids.includes("contact"), "a question can always end with how to reach him");
});

test("the prompt stays small", () => {
  const { ids } = retrieve("What did Evan do at Tencent?", built, OPTS);
  assert.ok(ids.length <= TOP_K + 1, `${ids.length} slides is more than the budget`);

  const chars = ids
    .map((id) => presenter.slides.find((s) => s.id === id))
    .reduce((n, s) => n + (s?.body.length ?? 0), 0);
  assert.ok(
    chars < presenter.instructions.length / 2,
    `retrieved ${chars} chars against a whole-deck prompt of ${presenter.instructions.length}`,
  );
});

test("the spine names real slides", () => {
  assert.ok(presenter.spine?.length > 0, "a missing spine would make every vague question noise");
  for (const id of presenter.spine) {
    assert.ok(
      presenter.slides.some((s) => s.id === id),
      `spine names "${id}", which is not in the deck`,
    );
  }
});

test("scores are ordered, and the floor is above what a vague question reaches", () => {
  const ranked = rank("What is AgriSentry?", built);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].score >= ranked[i].score, "ranking must be sorted");
  }
  assert.ok(ranked[0].score >= FLOOR, "a clear question must clear the floor");
  assert.equal(rank("hello", built).filter((r) => r.score >= FLOOR).length, 0);
});
