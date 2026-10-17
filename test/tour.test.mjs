/**
 * The tour's running order.
 *
 * The bug this guards against: the first version handed the model one "give a
 * tour" instruction, and it covered the first stop then asked what the visitor
 * would like to see — a tour that quits after one room. The sequencing is now
 * the client's job, so it can be checked without a microphone.
 *
 *   npx tsx --test test/tour.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { TourRunner, itinerary } from "../src/lib/tour.ts";
import {
  community,
  education,
  internshipHighlights,
  internships,
  positions,
  projects,
  publications,
  startups,
} from "../src/data/content.ts";
import { slides } from "../src/slides/slides.ts";

const STOPS = ["a", "b", "c"].map((id) => ({
  slideId: id,
  label: id.toUpperCase(),
  instructions: `say ${id}`,
}));

/** Records what the session would have done, with no gap between stops. */
function harness(stops = STOPS) {
  const log = [];
  const runner = new TourRunner(stops, {
    navigate: (id) => log.push(`nav:${id}`),
    speak: (i) => log.push(`speak:${i}`),
    gapMs: 0,
  });
  const settle = () => new Promise((r) => setTimeout(r, 5));
  return { runner, log, settle };
}

test("starts at the first stop, not the second", async () => {
  const { runner, log } = harness();
  runner.begin();
  assert.deepEqual(log, ["nav:a", "speak:say a"]);
  assert.equal(runner.position, 1);
});

test("moves the camera before asking for narration", () => {
  const { runner, log } = harness();
  runner.begin();
  assert.ok(log.indexOf("nav:a") < log.indexOf("speak:say a"));
});

test("visits every stop in order, one turn each", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  for (let i = 0; i < 3; i++) {
    runner.onTurnComplete();
    await settle();
  }
  assert.deepEqual(log, [
    "nav:a", "speak:say a",
    "nav:b", "speak:say b",
    "nav:c", "speak:say c",
  ]);
});

test("a second turn-complete for one stop does not skip the next", async () => {
  // A tool call produces its own completion event; without a guard that would
  // silently swallow a stop.
  const { runner, log, settle } = harness();
  runner.begin();
  runner.onTurnComplete();
  runner.onTurnComplete();
  runner.onTurnComplete();
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a", "nav:b", "speak:say b"]);
});

test("ends after the last stop instead of looping", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  for (let i = 0; i < 6; i++) {
    runner.onTurnComplete();
    await settle();
  }
  assert.equal(runner.active, false);
  assert.equal(log.filter((l) => l.startsWith("nav:")).length, 3);
});

test("stops for good once the visitor speaks", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.onTurnComplete();
  await settle();
  const atInterrupt = [...log];

  runner.abandon();
  runner.onTurnComplete();
  await settle();

  assert.equal(runner.active, false);
  assert.deepEqual(log, atInterrupt);
});

test("an interrupt during the gap cancels the pending stop", async () => {
  const log = [];
  const runner = new TourRunner(STOPS, {
    navigate: (id) => log.push(`nav:${id}`),
    speak: (i) => log.push(`speak:${i}`),
    gapMs: 30,
  });
  runner.begin();
  runner.onTurnComplete();
  runner.abandon(); // visitor speaks while the next stop is still queued
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(log, ["nav:a", "speak:say a"]);
});

test("begin is idempotent", () => {
  const { runner, log } = harness();
  runner.begin();
  runner.begin();
  assert.equal(log.length, 2);
});

test("an empty itinerary does nothing rather than throwing", () => {
  const { runner, log } = harness([]);
  runner.begin();
  assert.deepEqual(log, []);
  assert.equal(runner.active, false);
});

/* ------------------------------------------------------------- itinerary */

test("the route starts on the landing slide", () => {
  assert.equal(itinerary()[0].slideId, "intro");
});

test("the route covers the top-level sections and no project sub-slides", () => {
  const stops = itinerary();
  assert.ok(stops.length >= 6 && stops.length <= 8, `got ${stops.length} stops`);
  assert.deepEqual(
    stops.map((s) => s.slideId),
    [...new Set(stops.map((s) => s.slideId))],
    "a stop is repeated",
  );
});

test("every stop is told not to sign off, except the last", () => {
  const stops = itinerary();
  for (const s of stops.slice(0, -1)) {
    assert.match(s.instructions, /Do NOT greet/, `stop ${s.slideId} may end the tour early`);
    assert.doesNotMatch(s.instructions, /final stop/);
  }
  assert.match(stops.at(-1).instructions, /final stop/);
});

test("only the first stop introduces the guide", () => {
  const stops = itinerary();
  assert.match(stops[0].instructions, /introducing yourself/);
  for (const s of stops.slice(1)) assert.doesNotMatch(s.instructions, /introducing yourself/);
});

test("every stop forbids inventing facts and self-navigation", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /Never state a fact that is not written above/i, `stop ${s.slideId}`);
    assert.match(s.instructions, /Do not call navigate_to_slide/, `stop ${s.slideId}`);
  }
});

/* --------------------------------------------------- speaking about Evan */

/**
 * `response.create` with `instructions` replaces the session instructions, so
 * the persona the broker set up is gone on every tour turn. Without the
 * framing restated here, the guide addressed Evan directly — "this slide is
 * all about who you are, your background, the persona you bring" — describing
 * the portfolio to its owner rather than its owner to a visitor.
 */
test("every stop restates who the guide is talking to", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /speaking aloud to a visitor/i, `stop ${s.slideId}`);
    assert.match(s.instructions, /third person/i, `stop ${s.slideId}`);
    assert.match(s.instructions, /not Evan and must never claim to be/i, `stop ${s.slideId}`);
  }
});

test("every stop forbids addressing Evan as 'you'", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /"You" always means the visitor, never Evan/i, `stop ${s.slideId}`);
  }
});

test("no stop asks the guide to narrate the slide as a slide", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /Never describe the slide as a slide/i, `stop ${s.slideId}`);
    // The old wording — "say what is on it" — is what invited a description of
    // the page rather than of Evan.
    assert.doesNotMatch(s.instructions, /what is on it/i, `stop ${s.slideId}`);
  }
});

test("the framing comes before the stop's own direction", () => {
  const first = itinerary()[0].instructions;
  assert.ok(
    first.indexOf("third person") < first.indexOf("Stop 1 of"),
    "who to speak to must be established before what to speak about",
  );
});

/* ----------------------------------------------- narrating the real content */

/**
 * `response.create` with `instructions` replaces the session instructions, and
 * the slide catalogue lives in those — so a tour turn ran with no idea what was
 * on the page and filled the gap with commentary about the page itself: "this
 * part is Evan's introduction, a brief overview, best seen as opening context".
 * True of any introduction anywhere. The text has to travel on the turn.
 */
/**
 * The route is a written list now, so a section can be on the site without
 * being narrated. These check what a stop carries *when it is on the route*,
 * rather than assuming every section is on it.
 */
const stopFor = (id) => itinerary().find((s) => s.slideId === id);

test("each stop carries the facts it needs", () => {
  const stops = itinerary();

  const intro = stops.find((s) => s.slideId === "who-am-i");
  assert.ok(intro, "the tour should visit who-am-i");
  assert.match(intro.instructions, /what you know about this/);
  assert.match(intro.instructions, /University of Tasmania/, "the degree is missing");
  assert.match(intro.instructions, /Tencent/, "the employers are missing");

  const skills = stopFor("capabilities");
  if (skills) assert.match(skills.instructions, /TypeScript|Python/, "the technologies are missing");
});

/**
 * The guide used to read the page aloud: every employer in turn, every
 * technology in the list, a grade point average to two decimal places. Third
 * person and slightly shorter, but still a page being read out. These pin the
 * altitude a person actually speaks at.
 */
test("a section leads with how many, not with its first item", () => {
  const stops = itinerary();

  const work = stops.find((s) => s.slideId === "experience-index");
  assert.match(
    work.instructions,
    new RegExp(`${internships.length} industry internships and ${startups.length} ventures`),
    "the experience stop does not state the counts",
  );
  assert.match(work.instructions, /Lead with the count/, "it is not told to lead with them");

  const made = stops.find((s) => s.slideId === "projects-index");
  assert.match(made.instructions, new RegExp(`${projects.length} projects`), "no project count");
  assert.match(made.instructions, /take two — no more/, "it is not held to two");

  const papers = stopFor("research-index");
  if (papers) assert.match(papers.instructions, new RegExp(`${publications.length} published papers`));
});

test("every stop is told not to work through a list", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /Give the shape before the parts/, `stop ${s.slideId}`);
    assert.match(s.instructions, /Never work through a list/, `stop ${s.slideId}`);
  }
});

test("grades are spoken as standing, never as decimals", () => {
  // The content genuinely says GPA 3.77/4.00 and Rank 1/206, so the fact is
  // there and true — it is the reading-out that has to go.
  const edu = itinerary().find((s) => s.slideId === "education");
  assert.match(edu.instructions, /Never read a grade point average out as a number/);
  const rank = education.map((e) => /Rank\s*1\s*\/\s*(\d+)/.exec(e.detail ?? "")?.[1]).find(Boolean);
  assert.ok(rank && edu.instructions.includes(`first of ${rank}`), "the standing itself is missing");

  for (const s of itinerary()) {
    assert.match(s.instructions, /Numbers are for standing, not for precision/, `stop ${s.slideId}`);
  }
});

test("section stops name what they lead to", () => {
  // A heading slide is thin by design; the substance is indented under it, and
  // the guide needs to know what is there. A section with a prepared brief
  // names its own children, so the "It leads to" fallback would only repeat
  // them — directly under the direction not to work through a list.
  const work = itinerary().find((s) => s.slideId === "projects-index");
  assert.ok(work, "the tour should visit the work section");
  for (const p of projects) {
    assert.ok(work.instructions.includes(p.title), `${p.title} is missing from the work stop`);
  }
  assert.ok(
    !work.instructions.includes("It leads to:"),
    "the child list is repeated after the brief already named them",
  );

  // A section the route does not visit is still on the site and still in
  // search; it simply is not narrated, and the guide answers about it if asked.
  assert.equal(stopFor("research-index"), undefined);
});

test("every stop bans describing the page instead of the person", () => {
  for (const s of itinerary()) {
    for (const phrase of ["this section", "this slide", "an overview of", "a deep dive"]) {
      assert.ok(
        s.instructions.includes(phrase),
        `stop ${s.slideId} does not ban "${phrase}"`,
      );
    }
    assert.match(s.instructions, /Talk about Evan/, `stop ${s.slideId}`);
  }
});

test("every stop asks for specifics rather than a gloss", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /Specifics are what a summary is made of/i, `stop ${s.slideId}`);
    assert.match(s.instructions, /Denser than the page, not vaguer than it/i, `stop ${s.slideId}`);
  }
});

test("every stop asks for English", () => {
  for (const s of itinerary()) {
    assert.match(s.instructions, /Speak English\./, `stop ${s.slideId}`);
  }
});

test("every stop warns that the page is written in Evan's own voice", () => {
  // The slide text says "I'm a Master of...". Read back verbatim that is the
  // guide claiming to be Evan, which the framing forbids in the abstract but
  // the source text invites in practice.
  for (const s of itinerary()) {
    assert.match(s.instructions, /written in Evan's own voice/i, `stop ${s.slideId}`);
    assert.match(s.instructions, /Never read it back in the first person/i, `stop ${s.slideId}`);
  }
});

/* ------------------------------------------- surviving a false interrupt */

/**
 * The tour used to die on `input_audio_buffer.speech_started`. That fires on
 * the guide's own voice coming back through the speakers and on any room
 * noise, so a tour would stop dead on a section heading — a blank Research
 * page — while the guide carried on talking and nothing ever advanced again.
 *
 * A detection now holds position; only a transcript with words in it ends the
 * tour.
 */
test("a voice detection holds the tour instead of ending it", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.onTurnComplete();      // stop A done, stop B queued
  runner.pause();               // noise
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a"], "advanced while held");
  assert.equal(runner.active, true, "the tour gave up");
  assert.equal(runner.held, true);
});

test("it carries on from where it was once the noise turns out to be nothing", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.onTurnComplete();
  runner.pause();
  await settle();
  runner.resume();
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a", "nav:b", "speak:say b"]);
  assert.equal(runner.held, false);
});

test("a turn finishing while held does not advance until it resumes", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.pause();
  runner.onTurnComplete();      // stop A finishes during the hold
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a"], "advanced while held");
  runner.resume();
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a", "nav:b", "speak:say b"]);
});

test("words from the visitor still end the tour for good", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.pause();
  runner.abandon();             // a transcript came back with something in it
  runner.resume();              // must not undo that
  runner.onTurnComplete();
  await settle();
  assert.equal(runner.active, false);
  assert.deepEqual(log, ["nav:a", "speak:say a"]);
});

test("resuming a tour that was never held changes nothing", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.resume();
  runner.resume();
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a"]);
});

test("repeated detections do not queue up extra stops", async () => {
  const { runner, log, settle } = harness();
  runner.begin();
  runner.onTurnComplete();
  runner.pause();
  runner.pause();
  runner.pause();
  await settle();
  runner.resume();
  await settle();
  assert.deepEqual(log, ["nav:a", "speak:say a", "nav:b", "speak:say b"]);
});

test("pausing after the tour has finished is harmless", async () => {
  const { runner, settle } = harness();
  runner.begin();
  for (let i = 0; i < 3; i++) { runner.onTurnComplete(); await settle(); }
  assert.equal(runner.active, false);
  runner.pause();
  runner.resume();
  assert.equal(runner.active, false);
});

/* --------------------------------------------------------- people & place */

test("the tour reaches what he does outside the paid work", () => {
  const stop = stopFor("people-place");
  assert.ok(stop, "the tour should visit people & place");
  for (const item of community) {
    assert.ok(stop.instructions.includes(item.org), `${item.org} is missing from the stop`);
  }
});

test("a role that has not started cannot read as one that has", () => {
  // The failure this guards against put a project on the site as a current
  // achievement while it was still looking for investment. A date range on its
  // own does not stop a reader taking away something untrue.
  const notYet = community.filter((c) => c.status === "incoming" || c.status === "onboarding");
  assert.ok(notYet.length >= 2, "expected roles that have not begun");
  for (const item of notYet) {
    const slide = slides.find((s) => s.id === item.id);
    assert.ok(slide, `${item.id} has no slide`);
    const body = typeof slide.body === "string" ? slide.body : slide.body.en;
    assert.match(body, /not started|not yet contributing/, `${item.org} does not say it has not begun`);
  }
});

/* ----------------------------------------------------------- how he works */

test("the tour says how he works, and whose idea each one was", () => {
  const stop = stopFor("how-i-work");
  assert.ok(stop, "the tour should visit how-i-work");
  for (const p of positions) {
    assert.ok(stop.instructions.includes(p.claim), `"${p.label}" is missing from the stop`);
  }
  assert.match(stop.instructions, /Never present it as his own idea/);
  assert.match(stop.instructions, /not settled facts/);
});

test("each position arrives with the work that shows it", () => {
  // The guide may not say anything that is not written into the stop, so a
  // position whose evidence is not named there is one it cannot back up aloud.
  const stop = stopFor("how-i-work");
  for (const p of positions) {
    for (const id of p.evidence) {
      const title = slides.find((s) => s.id === id)?.title;
      const text = typeof title === "string" ? title : title?.en;
      assert.ok(text && stop.instructions.includes(text), `${p.id} does not name ${id}`);
    }
  }
});

test("the experience stop carries the results that weigh the most", () => {
  const stop = stopFor("experience-index");
  for (const h of internshipHighlights) {
    assert.ok(stop.instructions.includes(h.bullet), `${h.org}'s highlight is missing`);
  }
});
