/**
 * Where a slide lives on the page.
 *
 * An answer from the guide names a place in the portfolio, and that place has
 * two forms: a slide on the canvas and a section on the page. The broker only
 * knows about slides, because the catalogue is built from the deck — so the
 * translation happens here, once, for whichever surface is listening.
 *
 * Keyed by prefix rather than listed slide by slide. The ids are generated
 * (`work-<org>-work-1`, `position-<claim>`, `<project>-highlight-2`), so a new
 * project or a new employer lands in the right section without anyone editing
 * this file — and `test/sections.test.mjs` fails the build if a slide appears
 * that matches no rule at all.
 *
 * Nothing here imports the deck. This module is loaded by the guide on the
 * homepage, and pulling in `slides` would put the whole slide generator in the
 * homepage bundle to answer a question about prefixes. The test does the
 * importing, where the weight costs nothing.
 */

/** Section ids on the homepage, in page order. */
export type Section =
  | "home"
  | "about"
  | "skills"
  | "projects"
  | "cases"
  | "values"
  | "experience"
  | "publications"
  | "contact"
  | "offsite";

/**
 * First match wins, so order matters: `research-index` has to be tested before
 * anything looser would claim it.
 */
const RULES: { test: RegExp; section: Section }[] = [
  { test: /^(intro|main-menu)$/, section: "home" },
  { test: /^(who-am-i|current-focus|how-i-work)$/, section: "about" },
  { test: /^capabilities/, section: "skills" },
  { test: /^position-/, section: "values" },
  { test: /^(projects-index|rivulet-localops|lifeops-atlas|agrisentry|evan-h-portfolio|tasmania-student-notes|payment-agent-lab|ue5-financial-education|little-red-sequel)/, section: "projects" },
  { test: /^(experience-index|internships-china|work-|venture-)/, section: "experience" },
  { test: /^(research-index|paper-)/, section: "publications" },
  { test: /^contact$/, section: "contact" },
];

/**
 * Slides the canvas carries and the page does not.
 *
 * The deck is longer than the page: the community and volunteering work has
 * eight slides and no section, and so does education. This is not an
 * oversight to be fixed by padding the page — it is why `/explore` still
 * exists. When an answer comes from one of these, the guide links out to the
 * slide instead of scrolling to nothing.
 *
 * Listed explicitly so that a slide which maps nowhere is a decision somebody
 * wrote down, not a gap nobody noticed.
 */
const CANVAS_ONLY = new Set([
  "people-place",
  "inspired-mind-lab",
  "utas-motorsport",
  "libraries-tasmania",
  "utas-student-ambassador",
  "raise-foundation",
  "mothers-day-classic",
  "hospitals-south",
  "education",
]);

/** The section a slide belongs to, or null when the page has nowhere to go. */
export function sectionFor(slideId: string): Section | null {
  if (CANVAS_ONLY.has(slideId)) return null;
  return RULES.find((r) => r.test.test(slideId))?.section ?? null;
}

/** True for a slide the deck carries and the page does not. The test reads this. */
export function isCanvasOnly(slideId: string): boolean {
  return CANVAS_ONLY.has(slideId);
}

/**
 * The canvas-only list itself, so the test can catch an entry for a slide that
 * no longer exists. Checking the list against the deck only finds slides that
 * are missing from the page; checking the deck against the list finds names
 * left behind after a rename.
 */
export function canvasOnlyIds(): string[] {
  return [...CANVAS_ONLY];
}

/** Whether any rule claims this id at all. The test reads this. */
export function hasRule(slideId: string): boolean {
  return RULES.some((r) => r.test.test(slideId));
}

/** The canvas address for a slide, used when the page cannot show it. */
export function canvasHref(slideId: string): string {
  return `/explore/#${slideId}`;
}
