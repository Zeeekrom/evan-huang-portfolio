/**
 * Sending a sticky note to Evan.
 *
 * The note is drawn on the canvas immediately and posted to the broker in the
 * background. Those two are deliberately independent: a visitor who leaves a
 * note should see it land whether or not the network cooperates, and a failed
 * send should not delete what they just wrote.
 */

import { PRESENTER_API } from "./presenter";

/** Matches the cap the endpoint enforces; kept here so the UI can stop earlier. */
export const NOTE_MAX_CHARS = 280;

/** How long to wait before giving up — a note is not worth a hung tab. */
const TIMEOUT_MS = 8000;

export interface NoteDraft {
  text: string;
  colour: string;
  /** Which slide the visitor was looking at, for context when reading later. */
  slideId?: string;
}

export async function sendNote(draft: NoteDraft): Promise<boolean> {
  const text = draft.text.trim().slice(0, NOTE_MAX_CHARS);
  if (!text) return false;

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${PRESENTER_API}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, colour: draft.colour, slideId: draft.slideId }),
      signal: abort.signal,
    });
    return res.ok;
  } catch {
    // Offline, blocked, or the endpoint is switched off. The caller says so;
    // there is nothing here worth retrying.
    return false;
  } finally {
    clearTimeout(timer);
  }
}
