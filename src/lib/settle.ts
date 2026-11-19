/**
 * Wait for a condition to hold, then act once.
 *
 * Used to hold the tour back until the guide has actually stopped talking.
 * Kept apart from the WebRTC session so the two failure modes that matter —
 * never firing, and firing twice — can be tested without a microphone.
 */

export interface SettleOptions {
  /** How often to re-check. */
  pollMs?: number;
  /**
   * Give up and act anyway after this long.
   *
   * A stuck condition should not strand the caller forever: a tour that
   * continues slightly early beats one that stops dead.
   */
  deadlineMs?: number;
  /** Injectable for tests. */
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

/**
 * Poll `ready` until it returns true, then call `act` exactly once.
 *
 * Returns a cancel function. Cancelling after `act` has run is a no-op, and so
 * is cancelling twice.
 */
export function whenReady(
  ready: () => boolean,
  act: () => void,
  opts: SettleOptions = {},
): () => void {
  const pollMs = opts.pollMs ?? 150;
  const deadlineMs = opts.deadlineMs ?? 45_000;
  const now = opts.now ?? (() => performance.now());
  const setTimer =
    opts.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms) as unknown);
  const clearTimer =
    opts.clearTimer ?? ((h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>));

  const startedAt = now();
  let handle: unknown = null;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    handle = null;
    act();
  };

  const tick = () => {
    if (done) return;
    handle = null;
    if (ready() || now() - startedAt >= deadlineMs) {
      finish();
      return;
    }
    handle = setTimer(tick, pollMs);
  };

  handle = setTimer(tick, pollMs);

  return () => {
    if (done) return;
    done = true;
    if (handle !== null) {
      clearTimer(handle);
      handle = null;
    }
  };
}
