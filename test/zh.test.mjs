/**
 * The Chinese page's pairing to the English one.
 *
 * The site carries two languages over one component tree, and the deal that
 * bought the second one is `assertParity`: content/zh/ may exist as long as it
 * cannot quietly fall behind. A project added in English with no Chinese row,
 * a bullet that exists on one side only, a slug "translated" into something
 * that no longer matches its poster — each has to fail the build rather than
 * ship a page that was true last month.
 *
 * So these tests are mostly about the guard failing. A drift check nobody has
 * watched fail is a comment, and the first time it matters will be months from
 * now when someone adds a project and does not read this file.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { CHINESE, bundle, englishOnly, parity } from "../src/data/content.ts";
import { assertParity, isProse } from "../src/data/parity.ts";

const en = bundle("en");
const zh = bundle("zh");

/** A fresh report per call, so a count from one test cannot reach the next. */
const report = () => ({ shared: 0 });

/** Asserts that the guard rejects this pair, and that it says why. */
function rejects(a, b, expected, file = "projects.json") {
  assert.throws(
    () => assertParity(file, a, b, report()),
    (err) => {
      assert.match(err.message, /^content\/zh\//, "the message should name the file to fix");
      assert.match(err.message, expected);
      return true;
    },
  );
}

/* ----------------------------------------------------------- as it stands */

test("every Chinese file as committed matches its English counterpart", () => {
  /* content.ts runs the guard on import; reaching here means it passed. */
  assert.ok(parity.shared >= 0);
});

test("the two bundles carry the same number of everything a reader sees", () => {
  for (const key of ["nav", "projects", "internships", "startups", "publications", "education", "positions"]) {
    assert.equal(zh[key].length, en[key].length, `${key} differs in length between the languages`);
  }
  assert.equal(zh.about.paragraphs.length, en.about.paragraphs.length);
  assert.equal(zh.strengths.stages.length, en.strengths.stages.length);
  assert.equal(zh.cases.items.length, en.cases.items.length);
  assert.equal(zh.ahead.blocks.length, en.ahead.blocks.length);
});

test("the Chinese bundle is actually in Chinese", () => {
  assert.ok(CHINESE.test(zh.about.lead), "the About lead should be Chinese");
  assert.ok(CHINESE.test(zh.ui.values.heading), "the Values heading should be Chinese");
  assert.ok(CHINESE.test(zh.projects[0].description), "a project description should be Chinese");
});

test("the English bundle still refuses a second language", () => {
  assert.throws(() => englishOnly("about.json", { lead: zh.about.lead }), /English only/);
});

/* ------------------------------------------------------- what it refuses */

test("a project added in English with no Chinese row fails the build", () => {
  rejects([{ slug: "a" }, { slug: "b" }], [{ slug: "a" }], /has 1 entry and the English file has 2 entries/);
});

test("a bullet added on one side only fails the build", () => {
  rejects({ bullets: ["one", "two"] }, { bullets: ["一"] }, /every row has to exist in both/);
});

test("a key that exists in one language and not the other fails the build", () => {
  rejects({ line: "a line of prose here" }, { note: "另一个键" }, /keys do not match/);
});

test("a translated slug fails the build, because it keys the poster and the slide", () => {
  rejects([{ slug: "little-red-sequel" }], [{ slug: "小红帽" }], /identity, not a sentence/);
});

test("a published title must not be translated", () => {
  rejects(
    [{ title: "Rivulet LocalOps" }],
    [{ title: "溪流本地运维" }],
    /identity, not a sentence/,
  );
});

test("a word-cloud weight that drifts fails the build", () => {
  rejects({ weight: 3 }, { weight: 2 }, /identity, not a sentence/, "ahead.json");
});

test("a sentence left in English fails the build", () => {
  const line = "Open a row for what the work actually was.";
  rejects({ aside: line }, { aside: line }, /still the English sentence/, "ui.json");
});

/* ------------------------------------------------------- what it allows */

test("a product name identical in both languages is not a missing translation", () => {
  const same = { items: ["Power BI", "ROS 2", "Hesai ROS 2 Driver", "Next.js"] };
  const r = report();
  assert.doesNotThrow(() => assertParity("skills.json", same, structuredClone(same), r));
  assert.equal(r.shared, 4, "each should be counted as deliberately shared");
});

test("a heading is translated even though a published title is not", () => {
  /* `title` is pinned in publications.json and free in skills.json. */
  assert.doesNotThrow(() =>
    assertParity("skills.json", { title: "Data Analytics & Business Intelligence" },
      { title: "数据分析与商业智能" }, report()),
  );
  rejects([{ title: "Some Paper" }], [{ title: "某篇论文" }], /identity/, "publications.json");
});

/* ------------------------------------------------------------- the test */

test("prose is told apart from a name", () => {
  for (const name of ["Power BI", "ROS 2", "Hesai Pandar40P", "AI-Native Payment & Agent Engineering Lab"]) {
    assert.equal(isProse(name), false, `${name} is a name, not a sentence`);
  }
  for (const line of [
    "Open a row for what the work actually was.",
    "How I actually work with people.",
    "Numbers somebody has to act on.",
  ]) {
    assert.equal(isProse(line), true, `${line} is a sentence`);
  }
});
