/**
 * Knowing when the guide has finished a stop.
 *
 * This is the third bug in this one place, so it is a unit now rather than a
 * few flags inside the WebRTC session where nothing could reach it.
 *
 *   1. advancing on `response.done` moved the slide while the visitor was
 *      still listening — generation finishes several times sooner than audio
 *   2. advancing on measured silence mistook the pause between two sentences
 *      for the end of a turn
 *   3. and the pair of booleans that replaced it deadlocked the first turn of
 *      a call, which is the case pinned below
 */
import test from "node:test";
import assert from "node:assert/strict";
import { TurnTracker, responseIdOf } from "../src/lib/turn.ts";

test("a turn needs both halves", () => {
  const t = new TurnTracker();
  assert.equal(t.generated("r1"), false, "generation alone ended the turn");
  assert.equal(t.played("r1"), true, "the second half did not end it");
});

test("the halves may arrive in either order", () => {
  const t = new TurnTracker();
  assert.equal(t.played("r1"), false);
  assert.equal(t.generated("r1"), true);
});

test("generation finishing before the audio starts still completes", () => {
  // The deadlock. On the first turn of a call the provider had not yet shown
  // that it sends buffer events, so `response.done` went down the fallback
  // path — and the buffer opening then cleared the very half that had just
  // arrived. The turn could never complete: the tour spoke once and stopped.
  const t = new TurnTracker();
  t.generated("r1"); // response.done, before any audio flowed
  // output_audio_buffer.started happens here and must not disturb anything
  assert.equal(t.played("r1"), true, "the first turn deadlocked");
});

test("a turn that produces no audio never completes", () => {
  // A response that only calls a tool. Under the old rule its `response.done`
  // ended the stop and the tour skipped a slide.
  const t = new TurnTracker();
  assert.equal(t.generated("tool-call"), false);
  assert.equal(t.generated("tool-call"), false, "repeating it completed the turn");
});

test("an interrupted turn does not complete when its generation lands", () => {
  const t = new TurnTracker();
  t.played("r1");
  t.discarded("r1"); // the buffer was thrown away, not drained
  assert.equal(t.generated("r1"), false, "a discarded turn advanced the tour");
});

test("two responses in flight do not complete each other", () => {
  const t = new TurnTracker();
  assert.equal(t.generated("r1"), false);
  assert.equal(t.played("r2"), false, "r2's audio completed r1");
  assert.equal(t.played("r1"), true);
  assert.equal(t.generated("r2"), true);
});

test("a duplicate event does not complete a turn twice", () => {
  const t = new TurnTracker();
  t.generated("r1");
  assert.equal(t.played("r1"), true);
  assert.equal(t.played("r1"), false, "the turn completed a second time");
  assert.equal(t.generated("r1"), false, "the turn completed a third time");
});

test("it keeps working across many turns", () => {
  const t = new TurnTracker();
  for (let i = 0; i < 200; i++) {
    assert.equal(t.generated(`r${i}`), false, `turn ${i} completed early`);
    assert.equal(t.played(`r${i}`), true, `turn ${i} never completed`);
  }
});

test("it still completes turns when the provider sends no ids", () => {
  // Degraded rather than broken: without an id there is nothing to tell two
  // turns apart, so the slot is reused instead of being closed for good.
  const t = new TurnTracker();
  for (let i = 0; i < 5; i++) {
    assert.equal(t.generated(null), false, `turn ${i} completed early`);
    assert.equal(t.played(null), true, `turn ${i} never completed`);
  }
});

test("reset clears a finished call", () => {
  const t = new TurnTracker();
  t.generated("r1");
  t.played("r1");
  t.reset();
  assert.equal(t.generated("r1"), false);
  assert.equal(t.played("r1"), true, "a reused id stayed closed after reset");
});

test("the response id is read from either shape the provider uses", () => {
  // output_audio_buffer.* carry it flat; response.done nests it.
  assert.equal(responseIdOf({ response_id: "resp_1" }), "resp_1");
  assert.equal(responseIdOf({ response: { id: "resp_2" } }), "resp_2");
  assert.equal(responseIdOf({}), null);
  assert.equal(responseIdOf({ response_id: "" }), null, "an empty id is not an id");
  assert.equal(responseIdOf({ response: {} }), null);
});
