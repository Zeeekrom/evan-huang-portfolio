/**
 * The deck, mapped onto the page.
 *
 * The guide answers by naming a slide, and the page has to know where that is.
 * The mapping is by prefix, which is what makes it survive a new project or a
 * new employer — and also what makes it able to quietly miss one. These tests
 * are the thing that notices: a slide that matches no rule and is not on the
 * canvas-only list fails the build rather than sending a visitor nowhere.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { slides } from "../src/slides/slides.ts";
import { PAGE_ROUTE, itinerary } from "../src/lib/tour.ts";
import { canvasOnlyIds, hasRule, isCanvasOnly, sectionFor } from "../src/lib/sections.ts";

/** The section ids that actually exist on the homepage (src/components/*.tsx). */
const ON_THE_PAGE = new Set([
  "home",
  "about",
  "skills",
  "projects",
  "cases",
  "values",
  "experience",
  "publications",
  "contact",
  "offsite",
]);

test("every slide is either placed on the page or deliberately canvas-only", () => {
  const lost = slides.map((s) => s.id).filter((id) => !isCanvasOnly(id) && !hasRule(id));
  assert.deepEqual(
    lost,
    [],
    `these slides map to no section and are not on the canvas-only list: ${lost.join(", ")}`,
  );
});

test("every section a slide maps to exists on the page", () => {
  for (const slide of slides) {
    const section = sectionFor(slide.id);
    if (section === null) continue;
    assert.ok(ON_THE_PAGE.has(section), `${slide.id} maps to "${section}", which is not a section`);
  }
});

test("the canvas-only list names real slides and nothing else", () => {
  /*
   * Checked in this direction on purpose. Walking the deck only finds slides
   * missing from the page; walking the list finds a name left behind after a
   * slide was renamed, which would silently send its answers to the canvas
   * link for a slide that is no longer there.
   */
  const ids = new Set(slides.map((s) => s.id));
  const stale = canvasOnlyIds().filter((id) => !ids.has(id));
  assert.deepEqual(stale, [], `listed canvas-only but no longer a slide: ${stale.join(", ")}`);

  assert.ok(
    slides.some((s) => isCanvasOnly(s.id)),
    "nothing is canvas-only, which would make the link-out path dead code",
  );
});

test("a canvas-only slide returns no section, so the guide links out instead", () => {
  assert.equal(sectionFor("utas-motorsport"), null);
  assert.equal(sectionFor("education"), null);
});

test("the slides the guide reaches for most land where a reader expects", () => {
  const expected = {
    "who-am-i": "about",
    "current-focus": "about",
    "capabilities": "skills",
    "position-short-loops": "values",
    "rivulet-localops": "projects",
    "rivulet-localops-highlight-1": "projects",
    "little-red-sequel-highlight-1": "projects",
    "work-tencent-work-1": "experience",
    "venture-malou-cultural-media-co-ltd-startup-work-1": "experience",
    "internships-china": "experience",
    "paper-1": "publications",
    "research-index": "publications",
    contact: "contact",
    intro: "home",
  };
  for (const [id, section] of Object.entries(expected)) {
    assert.equal(sectionFor(id), section, `${id} should map to ${section}`);
  }
});

test("an id nobody has ever seen maps nowhere rather than guessing", () => {
  assert.equal(sectionFor("some-slide-that-does-not-exist"), null);
});

/* ------------------------------------------------------------ voice tour */

test("every stop on the spoken page tour lands somewhere the page can show", () => {
  /*
   * The failure this prevents is specific and bad: the guide talks through a
   * stop while the page sits still, which reads as the site being broken
   * rather than as a deliberate omission. The canvas route legitimately
   * visits two slides the page has no section for — the community work and
   * education — which is why the page has a route of its own.
   */
  const stops = itinerary(PAGE_ROUTE);
  assert.ok(stops.length >= 5, `a tour of ${stops.length} stops is not a tour`);

  for (const stop of stops) {
    assert.ok(
      sectionFor(stop.slideId),
      `the tour stops at ${stop.slideId}, which the page has nowhere to show`,
    );
  }
});

test("the page tour visits each section at most once", () => {
  /* Scrolling back to a section already narrated reads as the tour losing its place. */
  const visited = itinerary(PAGE_ROUTE).map((s) => sectionFor(s.slideId));
  assert.deepEqual(visited, [...new Set(visited)], `the tour revisits a section: ${visited.join(", ")}`);
});

test("the page tour follows the page, top to bottom", () => {
  /*
   * A guide that jumps backwards and forwards through a document the visitor
   * is watching is harder to follow than one that walks it.
   */
  const order = ["home", "about", "skills", "projects", "cases", "values", "experience", "publications", "contact", "offsite"];
  const positions = itinerary(PAGE_ROUTE).map((s) => order.indexOf(sectionFor(s.slideId)));
  const sorted = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sorted, "the tour doubles back on itself");
});
