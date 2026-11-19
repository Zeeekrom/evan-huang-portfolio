"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_ROUTE, itinerary } from "@/lib/tour";
import { VoiceSession, type VoiceStatus } from "@/lib/voice";
import { sectionFor } from "@/lib/sections";

/**
 * The voice guide, on the page.
 *
 * The same guide and the same catalogue as the text panel it sits inside, and
 * the same one that talks on the canvas — only the transport and the
 * destination differ. `onNavigate` hands back a slide; here a slide is a
 * section, so the page scrolls instead of the camera flying.
 *
 * **This component is never loaded until someone asks for it.** It pulls in
 * the tour, which builds its narration from the deck, which is most of the
 * site's content — a visitor who never presses the button should not pay for
 * that in JavaScript, and a landing page is mostly visitors who never press
 * the button. Guide.tsx imports it through next/dynamic on first click.
 *
 * Opt-in for a second reason: audio is billed by the second, and this button
 * is on the landing page where the canvas link was not. Nothing starts until
 * it is pressed, a call stops itself at MAX_CALL_MS, and the broker refuses
 * past a daily ceiling it counts server-side (docs/GUIDE.md).
 */

/**
 * The longest one tour runs.
 *
 * Seven stops at twenty to thirty seconds each is three or four minutes, so
 * this leaves room for a conversation afterwards without leaving a microphone
 * open on a tab somebody walked away from.
 */
const MAX_CALL_MS = 6 * 60_000;

const COPY = {
  idle: "Listen instead",
  connecting: "Connecting…",
  live: "Playing the tour",
  stop: "Stop",
  hint: "It talks you through the page. Interrupt whenever you like.",
} as const;

export interface GuideVoiceProps {
  /** Scroll to a section and mark it, without closing the panel. */
  onReveal(section: string): void;
  /** A stop the page has no section for — the canvas does. */
  onCanvas(slideId: string): void;
  /** Put a line in the transcript: an error, a refusal, the end of the tour. */
  onMessage(text: string): void;
  /** So the panel can hide the question box while the guide is talking. */
  onLive(live: boolean): void;
}

export default function GuideVoice({ onReveal, onCanvas, onMessage, onLive }: GuideVoiceProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [speaking, setSpeaking] = useState(false);
  const session = useRef<VoiceSession | null>(null);

  const live = status === "live";
  const busy = status === "connecting";

  useEffect(() => onLive(live), [live, onLive]);

  const stop = useCallback(() => {
    session.current?.stop();
    session.current = null;
  }, []);

  /* A call left running when the panel unmounts keeps the microphone open. */
  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (session.current?.active) return;

    const next = new VoiceSession(
      {
        onStatus: (s, detail) => {
          setStatus(s);
          if (s === "error" && detail) onMessage(detail);
        },
        onNavigate: (slideId) => {
          const section = sectionFor(slideId);
          if (section) onReveal(section);
          else onCanvas(slideId);
        },
        onSpeaking: setSpeaking,
        onIssue: onMessage,
      },
      itinerary(PAGE_ROUTE),
      { maxMs: MAX_CALL_MS },
    );

    session.current = next;
    await next.start();
  }, [onCanvas, onMessage, onReveal]);

  if (live || busy) {
    return (
      <div className="guide-voice is-live">
        <span className={speaking ? "gv-state is-speaking" : "gv-state"}>
          <i aria-hidden />
          {busy ? COPY.connecting : COPY.live}
        </span>
        <button type="button" onClick={stop}>
          {COPY.stop}
        </button>
      </div>
    );
  }

  return (
    <div className="guide-voice">
      <button type="button" className="gv-start" onClick={start}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 3v12M8 6v6M16 6v6M4 9v2M20 9v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {COPY.idle}
      </button>
      <span className="gv-hint">{COPY.hint}</span>
    </div>
  );
}
