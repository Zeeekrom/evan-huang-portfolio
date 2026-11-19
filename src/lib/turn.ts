/**
 * When a turn of speech is over.
 *
 * Two events say so and neither is enough on its own. `response.done` is
 * generation finished — a fifteen-second answer is composed in about two, so
 * acting on it changes the slide while the visitor is still listening to the
 * last one. `output_audio_buffer.stopped` is the audio having drained, which
 * is what a listener experiences as the end.
 *
 * They are matched by response id rather than counted, because they do not
 * arrive in a fixed order and a turn that produces no audio must not complete
 * at all.
 *
 * The version this replaces kept one pair of booleans and cleared them
 * whenever a buffer opened. That deadlocked the very first turn of a call
 * whenever generation finished before the audio started flowing: the reset
 * cleared a `response.done` that had already been and gone, so its half could
 * never be filled in again. The tour spoke once and then stopped for good,
 * with nothing in the logs to say why.
 */

/** Responses whose events arrive without an id are tracked under one key. */
const ANON = "";

/** Long enough that a completed turn cannot be revived; short enough to bound. */
const REMEMBER = 64;

export class TurnTracker {
  private parts = new Map<string, { gen: boolean; play: boolean }>();
  /** Turns already reported, so a late duplicate event cannot report twice. */
  private closed: string[] = [];

  private close(key: string): void {
    this.parts.delete(key);
    if (key === ANON) return;
    this.closed.push(key);
    if (this.closed.length > REMEMBER) this.closed.shift();
  }

  private mark(id: string | null | undefined, which: "gen" | "play"): boolean {
    const key = id ?? ANON;
    // Without ids there is nothing to remember a turn by, so the anonymous
    // slot is reused rather than closed. Advancing twice for one turn is
    // guarded downstream; never advancing is not.
    if (key !== ANON && this.closed.includes(key)) return false;

    const part = this.parts.get(key) ?? { gen: false, play: false };
    part[which] = true;
    if (!part.gen || !part.play) {
      this.parts.set(key, part);
      return false;
    }
    this.close(key);
    return true;
  }

  /** Generation finished. Returns true if that completes the turn. */
  generated(id: string | null | undefined): boolean {
    return this.mark(id, "gen");
  }

  /** The audio buffer drained. Returns true if that completes the turn. */
  played(id: string | null | undefined): boolean {
    return this.mark(id, "play");
  }

  /**
   * The buffer was thrown away rather than drained — the visitor interrupted,
   * or the response was cancelled. That is not an ending, and the turn must
   * not complete later when its `response.done` arrives.
   */
  discarded(id: string | null | undefined): void {
    this.close(id ?? ANON);
  }

  /** For a fresh call. */
  reset(): void {
    this.parts.clear();
    this.closed = [];
  }
}

/**
 * The response id an event belongs to, whichever way the provider spells it.
 *
 * `response.done` nests it under `response`; the WebRTC-only
 * `output_audio_buffer.*` events carry it flat. Returns null when neither is
 * present, which the tracker handles rather than rejects — a provider that
 * stops sending ids should cost timing accuracy, not the whole tour.
 */
export function responseIdOf(event: Record<string, unknown>): string | null {
  const flat = event.response_id;
  if (typeof flat === "string" && flat) return flat;
  const nested = (event.response as { id?: unknown } | undefined)?.id;
  return typeof nested === "string" && nested ? nested : null;
}
