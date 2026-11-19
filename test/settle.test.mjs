/**
 * Holding the tour back until the guide has stopped talking.
 *
 * The bug this exists for: the tour advanced on `response.done`, which is the
 * provider saying it finished *composing* the answer. Audio then plays out over
 * WebRTC for several times longer, so the slide changed while the visitor was
 * still listening to the previous one.
 *
 * Both failure modes here are silent in a live call — never firing looks like a
 * stalled tour, firing twice looks like a skipped slide — so they are pinned
 * with a fake clock rather than tried by ear.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { whenReady } from "../src/lib/settle.ts";

/** A clock and timer queue that only move when the test says so. */
function fakeClock() {
  let t = 0;
  const queue = [];
  return {
    opts: {
      pollMs: 100,
      now: () => t,
      setTimer: (fn, ms) => {
        const h = { at: t + ms, fn, dead: false };
        queue.push(h);
        return h;
      },
      clearTimer: (h) => {
        if (h) h.dead = true;
      },
    },
    /** Run every timer due within `ms`, advancing time as it goes. */
    advance(ms) {
      const until = t + ms;
      for (;;) {
        const next = queue
          .filter((h) => !h.dead && h.at <= until)
          .sort((a, b) => a.at - b.at)[0];
        if (!next) break;
        next.dead = true;
        t = next.at;
        next.fn();
      }
      t = until;
    },
  };
}

test("acts once the condition holds", () => {
  const c = fakeClock();
  let fired = 0;
  whenReady(() => true, () => fired++, c.opts);
  assert.equal(fired, 0, "should not fire synchronously");
  c.advance(100);
  assert.equal(fired, 1);
});

test("waits while the guide is still audible", () => {
  const c = fakeClock();
  let quiet = false;
  let fired = 0;
  whenReady(() => quiet, () => fired++, c.opts);

  c.advance(5000);
  assert.equal(fired, 0, "advanced while audio was still playing");

  quiet = true;
  c.advance(200);
  assert.equal(fired, 1);
});

test("fires exactly once, however long it keeps polling", () => {
  const c = fakeClock();
  let quiet = false;
  let fired = 0;
  whenReady(() => quiet, () => fired++, c.opts);
  c.advance(1000);
  quiet = true;
  c.advance(10_000);
  assert.equal(fired, 1);
});

test("gives up at the deadline rather than stranding the tour", () => {
  const c = fakeClock();
  let fired = 0;
  whenReady(() => false, () => fired++, { ...c.opts, deadlineMs: 3000 });
  c.advance(2900);
  assert.equal(fired, 0);
  c.advance(300);
  assert.equal(fired, 1, "a stuck level meter must not hang the tour forever");
});

test("cancelling stops it firing", () => {
  const c = fakeClock();
  let fired = 0;
  const cancel = whenReady(() => true, () => fired++, c.opts);
  cancel();
  c.advance(1000);
  assert.equal(fired, 0);
});

test("cancelling after it has fired changes nothing", () => {
  const c = fakeClock();
  let fired = 0;
  const cancel = whenReady(() => true, () => fired++, c.opts);
  c.advance(100);
  cancel();
  cancel();
  c.advance(1000);
  assert.equal(fired, 1);
});

test("a visitor interrupting mid-wait cancels the pending advance", () => {
  const c = fakeClock();
  let quiet = false;
  let fired = 0;
  const cancel = whenReady(() => quiet, () => fired++, c.opts);

  c.advance(500);      // still talking
  cancel();            // visitor speaks
  quiet = true;        // and the guide then stops
  c.advance(5000);
  assert.equal(fired, 0, "the tour resumed over the top of the visitor");
});
