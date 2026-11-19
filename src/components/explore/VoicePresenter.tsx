"use client";

/**
 * The voice guide.
 *
 * Starting it does not open a question box — the guide begins a short tour of
 * its own accord and flies the camera as it goes. Someone who has just granted
 * microphone access has said nothing yet, and asking them what they want at
 * that moment wastes the one second they are certain to be paying attention.
 * They interrupt whenever they like.
 *
 * Navigation goes out over the same bus the menu and keyboard use, so the guide
 * has no privileged path into the canvas — it issues exactly the command a menu
 * click issues.
 *
 * While a call is live the presenter owns the bottom of the screen: the tool
 * dock steps aside for a stop button and a microphone (docs/ARCHITECTURE.md).
 *
 * There are no captions. Two attempts at them ran out of step with the voice
 * in opposite directions, and a subtitle that disagrees with what you are
 * hearing is worse than none — so the decision was to drop them (docs/ARCHITECTURE.md).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { navigateTo, publishPresenter } from "./canvas/bus";
import { VoiceSession, type VoiceStatus } from "@/lib/voice";
import { itinerary } from "@/lib/tour";
import { slides } from "@/slides/slides";

const COPY = {
  start: "Start AI Presenter",
  connecting: "Connecting…",
  live: "Live Presenter",
  muted: "Muted",
  mute: "Mute microphone",
  unmute: "Take over and speak",
  end: "End call",
  showed: "Showing",
  hint: "It gives you a tour. Press the microphone to take over.",
} as const;

/** Five bars, each with its own period so the meter never looks mechanical. */
const BARS = [0, 1, 2, 3, 4];

function titleOf(slideId: string): string {
  const slide = slides.find((s) => s.id === slideId);
  return slide?.title || slideId;
}

export default function VoicePresenter() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showing, setShowing] = useState<string | null>(null);
  const [issue, setIssue] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  /** Read inside a callback that must not be rebuilt on every level change. */
  const speakingRef = useRef(false);

  const c = COPY;
  const live = status === "live";
  const busy = status === "connecting";

  // Tells the tool dock to step aside; see canvas/bus.ts.
  useEffect(() => publishPresenter(live), [live]);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
  }, []);

  // A call left running after the page changes keeps the microphone open.
  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (sessionRef.current?.active) return;
    setError(null);
    setShowing(null);
    setIssue(null);
    setMuted(false);

    const session = new VoiceSession(
      {
        onStatus: (s, detail) => {
          setStatus(s);
          if (s === "error") setError(detail ?? null);
        },
        onNavigate: (slideId) => {
          navigateTo(slideId);
          setShowing(titleOf(slideId));
        },
        onSpeaking: (v) => {
          speakingRef.current = v;
          setSpeaking(v);
        },
        // Non-fatal: shown under the pill and cleared, without ending the call.
        onIssue: (message) => {
          setIssue(message);
          window.setTimeout(() => setIssue(null), 5000);
        },
      },
      itinerary(),
    );
    sessionRef.current = session;
    await session.start();
  }, []);

  /**
   * The microphone button doubles as the interrupt.
   *
   * While the guide is talking the microphone is already closed on the
   * visitor's behalf — otherwise the guide's own voice comes back through the
   * speakers and the provider answers it. So pressing the button then can only
   * mean one thing: stop, I want to say something. Muting a microphone that is
   * already shut is not a thing anyone is asking for.
   *
   * The rest of the time it is an ordinary mute toggle, and unmuting still
   * interrupts: starting to talk while the guide is mid-sentence would have
   * them talking over each other.
   */
  const toggleMute = useCallback(() => {
    if (speakingRef.current) {
      sessionRef.current?.interrupt();
      sessionRef.current?.setMuted(false);
      setMuted(false);
      return;
    }
    setMuted((m) => {
      const next = !m;
      sessionRef.current?.setMuted(next);
      if (!next) sessionRef.current?.interrupt();
      return next;
    });
  }, []);

  const surface = {
    backgroundColor: "var(--ui-bg)",
    border: "1px solid var(--ui-border)",
    boxShadow: "var(--ui-shadow)",
    color: "var(--ui-text)",
  } as const;

  return (
    <>
      {/* Start control, top right — opposite the menu, clear of the dock. */}
      {!live && (
        <div className="fixed right-6 top-6 z-[60] flex flex-col items-end gap-1.5">
          {error && (
            <p
              role="alert"
              className="max-w-[18rem] rounded-lg px-3 py-1.5 text-center text-[11px] leading-snug backdrop-blur-md"
              style={{ ...surface, color: "var(--ui-text-muted)" }}
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="flex h-[52px] items-center justify-center gap-2 rounded-full px-0 text-sm font-medium backdrop-blur-md transition-transform active:scale-95 disabled:opacity-60 max-sm:w-[52px] sm:px-5"
            style={surface}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5Z" />
            </svg>
            <span className="max-sm:hidden">{busy ? c.connecting : c.start}</span>
          </button>
          {status === "idle" && (
            <p className="pr-1 text-[11px] max-sm:hidden" style={{ color: "var(--ui-text-muted)" }}>
              {c.hint}
            </p>
          )}
        </div>
      )}

      {/* ------------------------------------------------- live: status pill */}
      {/*
        Top centre while live, where the start button was not. The guide is
        driving the view at this point, so its status belongs above the thing
        it is moving rather than tucked in a corner.
      */}
      <div
        aria-hidden={!live}
        className={`pointer-events-none fixed left-1/2 top-6 z-[60] flex -translate-x-1/2 flex-col items-center gap-1.5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          live ? "" : "-translate-y-24 opacity-0"
        }`}
      >
        <div
          className="flex items-center gap-2.5 rounded-full py-2 pl-3.5 pr-4 backdrop-blur-md"
          style={surface}
        >
          {/* Level meter. Flat when the guide is listening, moving when it talks. */}
          <span className="flex h-3.5 items-center gap-[3px]" aria-hidden="true">
            {BARS.map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-full transition-all duration-150"
                style={{
                  backgroundColor: "var(--ui-text)",
                  height: speaking && !muted ? "100%" : "3px",
                  opacity: muted ? 0.35 : speaking ? 1 : 0.5,
                  animation:
                    speaking && !muted
                      ? `voiceBar ${0.3 + i * 0.1}s ease-in-out infinite alternate`
                      : "none",
                }}
              />
            ))}
          </span>
          <span className="text-[12px] font-medium">{muted ? c.muted : c.live}</span>
        </div>

        {showing && (
          <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--ui-text-muted)" }}>
            {c.showed} — {showing}
          </p>
        )}

        {issue && (
          <p
            role="status"
            className="rounded-lg px-3 py-1.5 text-center text-[11px] leading-snug backdrop-blur-md"
            style={{ ...surface, color: "var(--ui-text-muted)", maxWidth: "min(24rem, calc(100vw - 3rem))" }}
          >
            {issue}
          </p>
        )}
      </div>

      {/* ---------------------------------------------------- live: controls */}
      {/*
        Bottom centre, standing exactly where the tool dock was. During a call
        the pointer is not for marking up the canvas, so the dock has nothing to
        offer and the two never need to be on screen together.
      */}
      <div
        aria-hidden={!live}
        className={`fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full p-2 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          live ? "" : "pointer-events-none translate-y-24 opacity-0"
        }`}
        style={surface}
      >
        <button
          type="button"
          onClick={stop}
          aria-label={c.end}
          title={c.end}
          className="grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-95"
          style={{ backgroundColor: "var(--ui-selected)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="2.5" />
          </svg>
        </button>

        <div className="mx-1 h-6 w-px" style={{ backgroundColor: "var(--ui-border)" }} />

        {/* While the guide is talking this press interrupts rather than mutes,
            so the label has to say so. */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={speaking || muted ? c.unmute : c.mute}
          aria-pressed={muted}
          title={speaking || muted ? c.unmute : c.mute}
          className="grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-95"
          style={{
            backgroundColor: muted ? "#dc2626" : "transparent",
            color: muted ? "#ffffff" : "var(--ui-text)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
            {muted && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
    </>
  );
}
