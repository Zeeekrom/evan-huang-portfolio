/**
 * Content inventory and sanity check.
 *
 *   npm run content
 *
 * `npm run build` catches anything that breaks the types; this catches the
 * things that build perfectly well and are still wrong — a duplicate slug that
 * silently overwrites a slide, a company name whose slug collides after
 * truncation, a body long enough that the AI guide never sees the end of it,
 * a line of Chinese written straight into a generator.
 *
 * Exits non-zero on a problem, and CI runs it.
 */

import { readFileSync, readdirSync } from "node:fs";

import {
  CHINESE,
  about,
  community,
  education,
  internships,
  positions,
  projects,
  publications,
  skillGroups,
  startups,
} from "../src/data/content.ts";
import { anchors, menu, slides } from "../src/slides/slides.ts";
import { itinerary, missingStops } from "../src/lib/tour.ts";

/** Mirrors the truncation in lib/tour.ts and gen-presenter.mjs. */
const TOUR_CHARS = 1200;
const CATALOGUE_CHARS = 2000;
/** Mirrors slug() in slides.ts. */
const SLUG_MAX = 40;

const problems = [];
const warnings = [];

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX);

/* ------------------------------------------------------------- inventory */

const counts = {
  projects: projects.length,
  internships: internships.length,
  startups: startups.length,
  community: community.length,
  positions: positions.length,
  publications: publications.length,
  education: education.length,
  skillGroups: skillGroups.length,
  "about.paragraphs": about.paragraphs.length,
};

console.log("Content entries");
for (const [k, n] of Object.entries(counts)) console.log(`  ${k.padEnd(20)} ${n}`);

console.log("\nGenerated");
console.log(`  slides               ${slides.length}`);
console.log(`  menu entries         ${menu.length}  (top level ${menu.filter((m) => !m.indent).length})`);
console.log(`  anchors              ${anchors.length}`);

/* ------------------------------------------------------- identity checks */

const seenSlideId = new Map();
for (const s of slides) {
  if (seenSlideId.has(s.id)) problems.push(`duplicate slide id: ${s.id}`);
  seenSlideId.set(s.id, true);
}

const seenSlug = new Map();
for (const p of projects) {
  if (!/^[a-z0-9-]+$/.test(p.slug)) problems.push(`project slug has characters outside [a-z0-9-]: ${p.slug}`);
  if (seenSlug.has(p.slug)) problems.push(`duplicate project slug: ${p.slug}`);
  seenSlug.set(p.slug, p.title);
}

// Two employers whose names slug down to the same thing would overwrite each
// other's slides, and nothing else would notice.
const seenOrg = new Map();
for (const [group, list] of [["work", internships], ["venture", startups]]) {
  for (const e of list) {
    const key = `${group}-${slug(e.org)}`;
    if (seenOrg.has(key)) {
      problems.push(`company slugs collide: "${e.org}" and "${seenOrg.get(key)}" both become ${key}`);
    }
    seenOrg.set(key, e.org);
    if (slug(e.org).length >= SLUG_MAX) {
      warnings.push(`"${e.org}" slugs to the ${SLUG_MAX}-character limit; a similar name would collide`);
    }
  }
}

/* --------------------------------------------------------- bracketed names */

/*
 * About names its employers in the sentence, not in brackets after it.
 *
 * The brackets were added so an abstract phrase could name the real place,
 * and they read as footnotes to a reader who wanted a sentence: "at one of the
 * world's largest technology and gaming companies (Tencent)" is the same fact
 * as "at Tencent, one of the world's largest technology and gaming companies",
 * one clause shorter and with nothing bolted on.
 *
 * A warning, not a failure — a bracket may one day be the right call, and the
 * person adding it should see this and decide, not be blocked by it.
 */
for (const [i, para] of about.paragraphs.entries()) {
  for (const m of para.matchAll(/[(（]([^)）]{0,60})[)）]/g)) {
    warnings.push(`about.paragraphs[${i}] brackets "${m[1]}" — About says its names in the sentence`);
  }
}

/* ------------------------------------------------------------ chronology */

/*
 * Journey mode claims to read in the order it happened, which is a claim the
 * data has to be able to keep. `seq` is written by hand because the periods
 * cannot settle it on their own, and a number written by hand goes wrong the
 * first time a role is added: two roles numbered 6, or a 9 with no 8, and the
 * page quietly loses or doubles a row in one of its two orders.
 *
 * A complete 1..N run is the whole requirement. The start years are checked
 * against it too — not to derive the order, but because a sequence that walks
 * backwards through the years is a typo, not a decision.
 */
const chronology = [...internships, ...startups].sort((a, b) => a.seq - b.seq);
const expected = chronology.length;

for (let i = 0; i < chronology.length; i += 1) {
  if (chronology[i].seq !== i + 1) {
    problems.push(
      `experience seq is not a 1..${expected} run: ${chronology[i].org} is ${chronology[i].seq} where ${i + 1} was due`,
    );
    break;
  }
}

const startYear = (e) => Number(/\d{4}/.exec(e.period)?.[0] ?? 0);
for (let i = 1; i < chronology.length; i += 1) {
  if (startYear(chronology[i]) < startYear(chronology[i - 1])) {
    problems.push(
      `${chronology[i].org} (${chronology[i].period}) is ordered after ` +
        `${chronology[i - 1].org} (${chronology[i - 1].period}) but starts earlier`,
    );
  }
}

console.log("\nChronology");
console.log(`  roles in order       ${chronology.length}  ${chronology.map((e) => e.seq).join("")}`);

/* -------------------------------------------------------------- language */

// The loader already refuses Chinese in content/*.json. This checks what
// actually renders — slides, menu and tour — so text written into a generator
// is caught as well.
const rendered = JSON.stringify({ slides, menu, tour: itinerary() });
const chinese = CHINESE.exec(rendered);

console.log("\nLanguage");
console.log(`  Chinese on the page  ${chinese ? "yes" : "none"}`);
if (chinese) {
  const near = rendered.slice(Math.max(0, chinese.index - 40), chinese.index);
  problems.push(`Chinese text reaches the page, just after "${near}" — the site is English only`);
}

/* ------------------------------------------------------------- lengths */

/** The same flattening lib/tour.ts does, so the number means something. */
function bodyLength(s) {
  const parts = [];
  const push = (v) => {
    if (typeof v === "string" && v) parts.push(v);
  };
  push(s.title);
  push(s.subtitle);
  push(s.body);
  s.paragraphs?.forEach(push);
  s.bullets?.forEach(push);
  s.projectDetails?.forEach((g) => {
    push(g.title);
    g.items.forEach(push);
  });
  return parts.join("\n").length;
}

const overTour = slides.filter((s) => bodyLength(s) > TOUR_CHARS);
const overCatalogue = slides.filter((s) => bodyLength(s) > CATALOGUE_CHARS);

console.log("\nLength");
console.log(`  over the tour's ${TOUR_CHARS}     ${overTour.length}${overTour.length ? "  ← the tour never reaches the end" : ""}`);
console.log(`  over the catalogue's ${CATALOGUE_CHARS} ${overCatalogue.length}${overCatalogue.length ? "  ← conversation never sees the end" : ""}`);
overTour.forEach((s) => warnings.push(`${s.id} body is ${bodyLength(s)} characters; tour instructions cut it at ${TOUR_CHARS}`));
overCatalogue.forEach((s) => warnings.push(`${s.id} body is ${bodyLength(s)} characters; presenter.json cuts it at ${CATALOGUE_CHARS}`));

/* ---------------------------------------------------------- tour stops */

/*
 * The guide may not say anything a slide does not contain, so a thin slide is
 * a stop where it has nothing to say.
 *
 * Only the tour's own stops are worth reporting. Cover slides are thin by
 * design — a title and a role — and the tour never visits them, so flagging
 * those was noise that buried the ones that matter.
 */
const stops = itinerary().map((s) => s.slideId);
const stopIds = new Set(stops);
const thin = slides.filter((s) => stopIds.has(s.id) && bodyLength(s) < 150);

console.log("\nTour stops");
console.log(`  stops                ${stops.length}`);
console.log(`  thin                 ${thin.length}${thin.length ? "  ← the guide has little to say at these" : ""}`);
thin.forEach((s) =>
  warnings.push(`tour stop ${stops.indexOf(s.id) + 1} ${s.id} has only ${bodyLength(s)} characters to say`),
);
for (const id of missingStops()) problems.push(`the tour route names ${id}, which is not in the deck`);

/* --------------------------------------------------------- test count */

/*
 * The number of tests, where the site claims it.
 *
 * "97 tests behind it" is evidence, which is why it is written out rather than
 * waved at — and evidence is exactly the kind of number that goes stale the
 * first time somebody adds a test. It has now drifted twice. Counting the
 * `test(` calls agrees exactly with what the runner reports, and is instant,
 * so the claim is checked rather than remembered.
 *
 * The patterns are anchored to this site's own phrasing on purpose. Another
 * project's bullet says "77 automated tests", which is true and is not this
 * number.
 */
const SUITE = "test";
const CLAIMS = [
  /(\d+) tests behind it/g,
  /(\d+) tests sit behind it/g,
  /(\d+) unit tests/g,
  /(\d+) 个单元测试/g,
];
const CLAIMED_IN = [
  "content/projects.json",
  "content/strengths.json",
  /* The Chinese page makes the same claim, so it has to be as true. */
  "content/zh/projects.json",
  "content/zh/strengths.json",
  "README.md",
  "README.zh-CN.md",
];

const suite = readdirSync(SUITE)
  .filter((f) => f.endsWith(".test.mjs"))
  .reduce((n, f) => n + (readFileSync(`${SUITE}/${f}`, "utf8").match(/^test\(/gm) ?? []).length, 0);

let claims = 0;
for (const file of CLAIMED_IN) {
  const text = readFileSync(file, "utf8");
  for (const pattern of CLAIMS) {
    for (const m of text.matchAll(pattern)) {
      claims += 1;
      if (Number(m[1]) !== suite) {
        problems.push(`${file} says ${m[1]} tests; the suite has ${suite}`);
      }
    }
  }
}

console.log("\nTest count");
console.log(`  in the suite         ${suite}`);
console.log(`  claimed on the site  ${claims} place${claims === 1 ? "" : "s"}`);

/* -------------------------------------------------- the confidential role

 * AIA-Institute is under a confidentiality agreement and the product is not
 * released. The rule is that the site says the shape of the role and nothing
 * else — and a rule that lives only in someone's memory is one release away
 * from being forgotten, so it fails the build instead.
 *
 * Two halves: a budget on how much the site says about it at all, and a list
 * of specifics that are in the resume and must not reach a public page.
 */
const CONFIDENTIAL = "AIA-Institute";
const CONFIDENTIAL_BUDGET = 320;
const NEVER_PUBLIC = [
  "Snapshot AI Blueprint",
  "AI-readiness",
  "scoring methodology",
  "mutation score",
  "DynamoDB",
  "API Gateway",
  "CloudTrail",
  "sovereign",
  "survey results",
  "survey service",
];

/*
 * Both languages, counted apart.
 *
 * The ceiling is what one reader can learn about the role, so it is a
 * per-language limit and not a shared pot: adding a second language must not
 * halve what the English page may say, and must not let the Chinese page say
 * more than the English one was allowed to.
 */
const confidentialChars = { en: 0, zh: 0 };
for (const [lang, dir] of [
  ["en", "content"],
  ["zh", "content/zh"],
]) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const text = readFileSync(`${dir}/${file}`, "utf8");

    for (const term of NEVER_PUBLIC) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        problems.push(`${dir}/${file} says "${term}" — that detail stays off the public page`);
      }
    }

    if (!text.includes(CONFIDENTIAL)) continue;
    for (const role of JSON.parse(text).filter?.((r) => r?.org === CONFIDENTIAL) ?? []) {
      confidentialChars[lang] += [role.role, ...(role.bullets ?? []), role.metric ?? "", role.badge ?? ""]
        .join(" ")
        .length;
    }
  }
}
for (const [lang, chars] of Object.entries(confidentialChars)) {
  if (chars > CONFIDENTIAL_BUDGET) {
    problems.push(
      `the ${CONFIDENTIAL} role runs to ${chars} characters in ${lang}; the ceiling is ${CONFIDENTIAL_BUDGET}`,
    );
  }
}

console.log("\nConfidential role");
for (const [lang, chars] of Object.entries(confidentialChars)) {
  console.log(`  characters on the page (${lang})  ${chars} of ${CONFIDENTIAL_BUDGET}`);
}

/* ------------------------------------------------------------- verdict */

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length})`);
  warnings.forEach((w) => console.log(`  · ${w}`));
}

if (problems.length) {
  console.log(`\nProblems (${problems.length})`);
  problems.forEach((p) => console.log(`  ✖ ${p}`));
  process.exit(1);
}

console.log("\nNo problems.");
