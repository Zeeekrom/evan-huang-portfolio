/**
 * The deck's structure: where links land, what a card is allowed to claim, and
 * what language it is in.
 *
 *   npx tsx --test test/deck.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  CHINESE,
  POSITION_ORIGIN,
  englishOnly,
  internships,
  positions,
  resolveHighlights,
} from "../src/data/content.ts";
import { menu, slides } from "../src/slides/slides.ts";
import { itinerary } from "../src/lib/tour.ts";

const byId = new Map(slides.map((s) => [s.id, s]));

test("every in-canvas link lands on a slide and says where", () => {
  for (const s of slides) {
    for (const l of s.links ?? []) {
      if (!l.url.startsWith("slide://")) continue;
      assert.ok(byId.has(l.url.slice("slide://".length)), `${s.id} links to ${l.url}`);
      assert.ok(l.text, `${s.id} has a link to ${l.url} with no wording`);
    }
  }
});

/* ---------------------------------------------------------------- language */

test("nothing on a slide, in the menu or in the tour is in Chinese", () => {
  assert.doesNotMatch(JSON.stringify(slides), CHINESE, "a slide");
  assert.doesNotMatch(JSON.stringify(menu), CHINESE, "the menu");
  for (const stop of itinerary()) {
    assert.doesNotMatch(stop.instructions, CHINESE, `tour stop ${stop.slideId}`);
  }
});

test("a line of Chinese in the content stops the build", () => {
  // Built from code points, so this file has no Chinese in it either.
  const hello = String.fromCodePoint(0x4f60, 0x597d);
  assert.throws(
    () => englishOnly("about.json", { paragraphs: ["Fine", hello] }),
    /paragraphs\[1\].*English only/,
  );
  assert.doesNotThrow(() => englishOnly("about.json", { paragraphs: ["Résumé — 2026 · ↗"] }));
});

/* ------------------------------------------------------------ internships */

test("the China internships are one entry, and the current role leads the card", () => {
  const index = byId.get("experience-index");
  assert.ok(index.links.some((l) => l.url === "slide://internships-china"), "the summary is not linked");
  for (const e of internships) {
    const listed = index.links.some((l) => l.text === e.org);
    if (e.location === "China") {
      assert.ok(!listed, `${e.org} is still listed on its own`);
    } else {
      assert.ok(listed, `${e.org} is current and should lead the card`);
    }
  }
});

test("nothing about an internship became harder to reach", () => {
  const card = byId.get("internships-china");
  assert.ok(card, "no summary card");
  const index = byId.get("experience-index");
  for (const e of internships) {
    const reachable =
      card.links.some((l) => l.text === e.org) || index.links.some((l) => l.text === e.org);
    assert.ok(reachable, `${e.org} cannot be reached from the experience section`);
    assert.ok(menu.some((m) => m.label === e.org), `${e.org} left the menu`);
  }
});

test("a highlight has to point at a bullet that exists", () => {
  const org = internships[0].org;
  assert.throws(() => resolveHighlights([{ org: "Nowhere Ltd", bullet: 0 }], internships), /no internship/);
  assert.throws(() => resolveHighlights([{ org, bullet: 99 }], internships), /no bullet 99/);
  assert.throws(
    () => resolveHighlights([0, 1, 2].map((bullet) => ({ org, bullet })), internships),
    /holds two/,
  );
});

/* -------------------------------------------------------------- positions */

test("every position points at work on the site", () => {
  for (const p of positions) {
    const card = byId.get(`position-${p.id}`);
    assert.ok(card, `${p.id} has no card`);
    const work = (card.links ?? []).filter((l) => l.url.startsWith("slide://"));
    assert.ok(work.length > 0, `${p.id} stands on nothing`);
    assert.equal(work.length, p.evidence.length, `${p.id} lost an evidence link`);
  }
});

test("a position taken from someone else says so on its card", () => {
  // A principle picked up at a talk, shown without saying so, is someone
  // else's idea with his name on it.
  const learned = positions.filter((p) => p.origin === "learned");
  assert.ok(learned.length > 0, "expected at least one position picked up from others");
  for (const p of learned) {
    assert.equal(byId.get(`position-${p.id}`).intro, POSITION_ORIGIN.learned);
  }
});

test("where a position was traced from stays off the page", () => {
  for (const p of positions) {
    const card = JSON.stringify(byId.get(`position-${p.id}`));
    assert.ok(!card.includes(p.source), `${p.id} shows its source id`);
  }
});
