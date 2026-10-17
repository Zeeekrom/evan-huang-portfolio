/**
 * World geometry and camera constants.
 *
 * These are the parameters the whole feel of the canvas rests on — zoom range,
 * momentum, flight timing, the serpentine grid. They were arrived at
 * deliberately rather than tuned by hand, and docs/ARCHITECTURE.md §4 records
 * what each one is for. Change them only on purpose.
 */

/* ------------------------------------------------------------------- layout */

/** A slide's own coordinate space. All layouts position elements inside this box. */
export const SLIDE_W = 1000;
export const SLIDE_H = 600;

/** Cell pitch = slide size + 100px gutter. */
export const COL_PITCH = 1100;
export const ROW_PITCH = 700;

/** Slides per row before wrapping. Raise for a wider, flatter world. */
export const COLS = 9;

/**
 * Plain reading order: left to right, then down to the start of the next row.
 *
 * Rows used to alternate direction, so that consecutive slides were always
 * geometrically adjacent and a step between two of them never sent the camera
 * across the world. It cost more than it bought. Every second row read
 * backwards, which nobody expects of a grid, and the arrow keys inherited the
 * confusion: on a right-to-left row the key that advanced the deck was Left,
 * so pressing Right at the end of a row moved *backwards* through it.
 *
 * The long flight at the end of a row is the price, and it is a legible one —
 * a carriage return, which is what it looks like.
 */
export function gridCell(index: number): { row: number; col: number } {
  return { row: Math.floor(index / COLS), col: index % COLS };
}

export function indexAtCell(row: number, col: number, count: number): number | null {
  if (row < 0 || col < 0 || col >= COLS) return null;
  const i = row * COLS + col;
  return i >= 0 && i < count ? i : null;
}

/**
 * Slide world position is a pure function of its index — there is no
 * hand-maintained coordinate table (docs/ARCHITECTURE.md). Adding content means pushing to
 * the array; positions follow.
 */
export function slidePos(index: number): { x: number; y: number } {
  const { row, col } = gridCell(index);
  return { x: col * COL_PITCH, y: row * ROW_PITCH };
}

/** Centre of a slide, in world space. This is what the camera actually tracks. */
export function slideFocus(index: number): { x: number; y: number } {
  const p = slidePos(index);
  return { x: p.x + SLIDE_W / 2, y: p.y + SLIDE_H / 2 };
}

/** Inverse: which slide (if any) contains a world-space point. */
export function slideAt(
  worldX: number,
  worldY: number,
  count: number,
): number | null {
  for (let i = 0; i < count; i++) {
    const { x, y } = slidePos(i);
    if (worldX >= x && worldX <= x + SLIDE_W && worldY >= y && worldY <= y + SLIDE_H) {
      return i;
    }
  }
  return null;
}

/**
 * The slide nearest a world-space point — which slide the camera is over.
 *
 * `slideAt` answers "which slide *contains* this point", and between two cards
 * the honest answer is none. That is useless when the question is "which slide
 * is the visitor looking at": the focal point spends much of a pan in a gutter.
 * This one always names a slide.
 *
 * The rule, stated in numbers, because "nearest" is not a specification:
 *
 *     a card is 1000 wide, the column pitch 1100, so the gutter is 100
 *     card N's centre sits at  N × 1100 + 500
 *     the changeover is at     N × 1100 + 1050   — halfway between centres
 *
 * So a slide owns the world for half a pitch in each direction: ±550
 * horizontally, ±350 vertically. The counter changes when the viewport centre
 * passes a card's edge and reaches the middle of the gutter beyond it, and
 * test/grid.test.mjs pins those two numbers so the range cannot drift.
 */
export function nearestSlide(worldX: number, worldY: number, count: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < count; i++) {
    const f = slideFocus(i);
    const d = (f.x - worldX) ** 2 + (f.y - worldY) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Grid neighbours.
 *
 * At the end of a row there is no cell to the right, and doing nothing there
 * strands the visitor: the deck carries on, but the key they have been
 * pressing to move through it stops responding, and a project whose slides
 * straddle the wrap looks like it simply ends. So a horizontal move that runs
 * off the edge wraps the way reading does — Right at the end of a row goes to
 * the first slide of the next, Left at the start of a row goes to the last
 * slide of the previous.
 */
export function neighbour(
  index: number,
  dir: "left" | "right" | "up" | "down",
  count: number,
): number | null {
  const { row, col } = gridCell(index);
  const d = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }[dir];
  const within = indexAtCell(row + d[0], col + d[1], count);
  if (within !== null) return within;

  // Vertical moves have nowhere to wrap to: off the top is before the deck
  // begins and off the bottom is after it ends.
  if (dir === "up" || dir === "down") return null;

  const next = index + (dir === "right" ? 1 : -1);
  return next >= 0 && next < count ? next : null;
}

/* --------------------------------------------------------------- camera math */

/**
 * The camera is defined by a focal point in world space and a scale — never by
 * the container offset directly. Interpolating the offset while the scale is
 * also changing does not move the focal point in a straight line: it overshoots
 * the destination and snaps back at the end of the flight.
 */
export function cameraFor(
  screenW: number,
  screenH: number,
  focusX: number,
  focusY: number,
  scale: number,
): { x: number; y: number } {
  return { x: screenW / 2 - focusX * scale, y: screenH / 2 - focusY * scale };
}

/** Recover the focal point from a container transform. */
export function focusFrom(
  screenW: number,
  screenH: number,
  worldX: number,
  worldY: number,
  scale: number,
): { x: number; y: number } {
  return { x: (screenW / 2 - worldX) / scale, y: (screenH / 2 - worldY) / scale };
}

/* ------------------------------------------------------------------- camera */

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5;

/** Wheel delta -> scale factor. */
export const ZOOM_SENSITIVITY = 0.01;

/** Double-click only dives into a slide below this scale (docs/ARCHITECTURE.md). */
export const DIVE_THRESHOLD = 0.8;

/** Momentum stops once |velocity| drops under this, in px/frame. */
export const MOMENTUM_CUTOFF = 0.5;

/** Per-frame velocity decay during coasting. Lower = stickier. */
export const MOMENTUM_DECAY = 0.72;

/** Wheel panning: leaky integrator coefficients. */
export const WHEEL_VELOCITY_DECAY = 0.8;
export const WHEEL_VELOCITY_GAIN = 0.3;

/** Touch panning: time-normalised velocity estimate, then flick boost on release. */
export const TOUCH_VELOCITY_GAIN = 6.4;
export const TOUCH_VELOCITY_SMOOTHING = 0.6;
export const TOUCH_FLICK_BOOST = 1.8;

/** Fly-to duration envelope, in ms. */
export const FLY_DURATION_MIN = 1600;
export const FLY_DURATION_SPAN = 1000;

/** Reference viewport the "fit" scale is computed against (slide + margin). */
export const FIT_REF_W = 1200;
export const FIT_REF_H = 720;

/** Max perspective tilt during travel, in degrees. */
export const TILT_MAX_DEG = 8;

/**
 * How much of the computed tilt is actually applied as skew. The reference
 * value describes a 3D camera; in 2D the full amount shears the cards, so we
 * take a quarter of it — enough to read as perspective, not as distortion.
 */
export const TILT_FACTOR = 0.25;

/**
 * Below this scale a card's text is unreadable, so only the card is drawn.
 * With 64 slides this is the difference between an establishing shot that
 * glides and one that stutters.
 */
export const LOD_TEXT_SCALE = 0.3;

/** Establishing shot: how long the world is held in view before descending. */
export const OPENING_HOLD_MS = 900;
/** And how long the descent itself takes. */
export const OPENING_DESCENT_MS = 2600;

/* ------------------------------------------------------------------- easing */

export function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/**
 * Sine arch: 0 at both ends, 1 at the midpoint.
 * This single term is what produces the "lift off, fly, descend" feeling —
 * position interpolates on easeInOutCubic while scale rides this envelope.
 */
export function arch(p: number): number {
  return Math.sin(p * Math.PI);
}

export interface FlyPlan {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Travel distance measured in slide-widths. */
  distance: number;
  durationMs: number;
  tiltX: number;
  tiltY: number;
}

/** Precompute everything about a camera move that does not depend on time. */
export function planFlight(fromIndex: number, toIndex: number): FlyPlan {
  const from = slidePos(fromIndex);
  const to = slidePos(toIndex);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) / SLIDE_W;

  const clamp = (v: number) => Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, v));

  return {
    from,
    to,
    distance,
    durationMs: FLY_DURATION_MIN + FLY_DURATION_SPAN * Math.min(0.3 * distance, 0.8),
    tiltY: clamp((dx / SLIDE_W) * 15),
    tiltX: clamp((-dy / SLIDE_H) * 12),
  };
}
