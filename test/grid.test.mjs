/**
 * Arrow-key movement across the grid.
 *
 * Two bugs live here. At the end of a row nothing happened at all: the deck
 * carried on, but the key the visitor had been pressing to move through it
 * stopped responding, so a run of slides that straddled the wrap — most of the
 * longer projects — looked like it simply ended. And while the rows alternated
 * direction, the key that advanced the deck alternated with them, so on every
 * second row pressing Right moved backwards.
 *
 * The walk tests below are the ones that matter: they press one key from one
 * end of the deck to the other and check every slide arrives in order. Both
 * bugs fail that, and neither is visible in the arithmetic.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  COL_PITCH,
  SLIDE_H,
  SLIDE_W,
  COLS,
  ROW_PITCH,
  gridCell,
  nearestSlide,
  neighbour,
  slideFocus,
} from "../src/slides/grid.ts";

/** Several full rows, and deliberately not a whole number of them. */
const COUNT = 40;

test("the grid reads left to right, top to bottom", () => {
  for (let i = 0; i < COUNT; i++) {
    const { row, col } = gridCell(i);
    assert.equal(row, Math.floor(i / COLS), `slide ${i} is on the wrong row`);
    assert.equal(col, i % COLS, `slide ${i} is in the wrong column`);
  }
});

test("Right walks the whole deck in order", () => {
  let at = 0;
  for (let expected = 1; expected < COUNT; expected++) {
    const next = neighbour(at, "right", COUNT);
    assert.equal(next, expected, `walking right stalled at ${at}`);
    at = next;
  }
});

test("Left walks the whole deck in reverse", () => {
  let at = COUNT - 1;
  for (let expected = COUNT - 2; expected >= 0; expected--) {
    const prev = neighbour(at, "left", COUNT);
    assert.equal(prev, expected, `walking left stalled at ${at}`);
    at = prev;
  }
});

test("Right at the end of a row lands on the first column of the next", () => {
  for (let i = COLS - 1; i + 1 < COUNT; i += COLS) {
    assert.equal(gridCell(i).col, COLS - 1, `slide ${i} is not at the end of a row`);
    const next = neighbour(i, "right", COUNT);
    const cell = gridCell(next);
    assert.equal(cell.col, 0, `wrapping from ${i} did not land in the first column`);
    assert.equal(cell.row, gridCell(i).row + 1, `wrapping from ${i} did not go down one row`);
  }
});

test("Left at the start of a row lands on the last column of the previous", () => {
  for (let i = COLS; i < COUNT; i += COLS) {
    const prev = neighbour(i, "left", COUNT);
    const cell = gridCell(prev);
    assert.equal(cell.col, COLS - 1, `wrapping back from ${i} did not land in the last column`);
    assert.equal(cell.row, gridCell(i).row - 1, `wrapping back from ${i} did not go up one row`);
  }
});

test("the ends of the deck stay closed", () => {
  assert.equal(neighbour(0, "left", COUNT), null, "something precedes the first slide");
  assert.equal(neighbour(COUNT - 1, "right", COUNT), null, "something follows the last slide");
});

test("vertical moves do not wrap", () => {
  for (let i = 0; i < COLS && i < COUNT; i++) {
    assert.equal(neighbour(i, "up", COUNT), null, `slide ${i} has something above it`);
  }
  // The last row is usually a partial one, so the row decides this rather than
  // a count back from the end: the slide above a short last row still has
  // something below it.
  const lastRow = gridCell(COUNT - 1).row;
  for (let i = 0; i < COUNT; i++) {
    if (gridCell(i).row !== lastRow) continue;
    assert.equal(neighbour(i, "down", COUNT), null, `slide ${i} has something below it`);
  }
});

test("mid-row, the horizontal arrows move exactly one column", () => {
  // The wrap must not fire where there is a real neighbour to move to.
  for (let i = 0; i < COUNT; i++) {
    const { row, col } = gridCell(i);
    if (col === 0 || col === COLS - 1) continue;
    for (const dir of ["left", "right"]) {
      const got = neighbour(i, dir, COUNT);
      if (got === null) continue; // ran past the end of the deck
      assert.equal(gridCell(got).row, row, `${dir} from ${i} changed row`);
      assert.equal(Math.abs(gridCell(got).col - col), 1, `${dir} from ${i} moved oddly`);
    }
  }
});

/**
 * Which slide the camera is looking at.
 *
 * The bug this exists for: `current` only changed when a flight landed, so
 * panning by hand left it behind — the counter named the slide you came from
 * and the arrow keys stepped from there. Answering it needs a function that
 * always names a slide, which a containment test does not: the focal point
 * spends much of a pan in the gutter between two cards.
 */
test("the centre of a slide is that slide", () => {
  for (let i = 0; i < COUNT; i++) {
    const f = slideFocus(i);
    assert.equal(nearestSlide(f.x, f.y, COUNT), i, `slide ${i} did not find itself`);
  }
});

test("the gutter between two slides picks one of them", () => {
  for (let i = 0; i + 1 < COUNT; i++) {
    if (gridCell(i).row !== gridCell(i + 1).row) continue; // not a side-by-side pair
    const a = slideFocus(i);
    const b = slideFocus(i + 1);
    const got = nearestSlide((a.x + b.x) / 2, (a.y + b.y) / 2, COUNT);
    assert.ok(got === i || got === i + 1, `the gutter after ${i} chose ${got}`);
  }
});

test("a point outside the world still names the nearest slide", () => {
  // Panning past an edge must not leave the counter with no answer. Note that
  // past the bottom-right corner the answer is not the last slide: the final
  // row is a partial one, so the card nearest that corner is on the row above.
  const dist = (i, x, y) => (slideFocus(i).x - x) ** 2 + (slideFocus(i).y - y) ** 2;
  for (const [x, y] of [
    [-9e5, -9e5],
    [9e5, 9e5],
    [-9e5, 9e5],
    [9e5, -9e5],
  ]) {
    const got = nearestSlide(x, y, COUNT);
    assert.ok(got >= 0 && got < COUNT, `${x},${y} named slide ${got}`);
    for (let i = 0; i < COUNT; i++) {
      assert.ok(dist(got, x, y) <= dist(i, x, y), `slide ${i} is nearer ${x},${y} than ${got}`);
    }
  }
  assert.equal(nearestSlide(-9e5, -9e5, COUNT), 0, "far above and left is not the first slide");
});

test("it tracks a pan across a row one slide at a time", () => {
  // Walking the focal point rightwards must report 0, 1, 2 … in order and
  // never skip: a counter that jumps two at a time is the same bug wearing a
  // different face.
  const seen = [];
  const start = slideFocus(0);
  for (let step = 0; step <= COL_PITCH * (COLS - 1); step += 40) {
    const at = nearestSlide(start.x + step, start.y, COUNT);
    if (seen[seen.length - 1] !== at) seen.push(at);
  }
  assert.deepEqual(
    seen,
    Array.from({ length: COLS }, (_, i) => i),
    "panning right did not visit every slide in the row in order",
  );
});

test("it tracks a pan down a column", () => {
  const seen = [];
  const start = slideFocus(0);
  const rows = Math.ceil(COUNT / COLS);
  for (let step = 0; step <= ROW_PITCH * (rows - 1); step += 40) {
    const at = nearestSlide(start.x, start.y + step, COUNT);
    if (seen[seen.length - 1] !== at) seen.push(at);
  }
  assert.deepEqual(
    seen,
    Array.from({ length: rows }, (_, r) => r * COLS),
    "panning down did not visit the first slide of each row in order",
  );
});

test("the changeover sits exactly in the middle of the gutter", () => {
  // The specification, not an approximation of it. A card owns half a pitch to
  // each side of its centre, so the counter changes 550 past the centre —
  // which is 50 past the card's own edge, the middle of the 100 gutter.
  const half = COL_PITCH / 2;
  for (let i = 0; i + 1 < COLS; i++) {
    const c = slideFocus(i);
    assert.equal(nearestSlide(c.x + half - 1, c.y, COUNT), i, `left of the gutter at ${i}`);
    assert.equal(nearestSlide(c.x + half + 1, c.y, COUNT), i + 1, `right of the gutter at ${i}`);
    // Still the same card right up to its own edge.
    assert.equal(nearestSlide(c.x + SLIDE_W / 2 - 1, c.y, COUNT), i, `inside card ${i}`);
  }
});

test("the vertical changeover is half a row pitch", () => {
  const half = ROW_PITCH / 2;
  const rows = Math.ceil(COUNT / COLS);
  for (let r = 0; r + 1 < rows; r++) {
    const i = r * COLS;
    const c = slideFocus(i);
    if (i + COLS >= COUNT) break;
    assert.equal(nearestSlide(c.x, c.y + half - 1, COUNT), i, `above the gutter on row ${r}`);
    assert.equal(nearestSlide(c.x, c.y + half + 1, COUNT), i + COLS, `below it on row ${r}`);
    assert.equal(nearestSlide(c.x, c.y + SLIDE_H / 2 - 1, COUNT), i, `inside row ${r}`);
  }
});
