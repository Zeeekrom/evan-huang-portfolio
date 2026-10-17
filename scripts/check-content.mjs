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
