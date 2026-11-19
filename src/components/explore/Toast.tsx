"use client";

/**
 * Transient message at the top of the screen.
 *
 * Sending a note is the one thing on this site that reaches a server the
 * visitor cannot see, so it is the one thing that needs an acknowledgement.
 * Without it there is no way to tell a delivered note from a swallowed one.
 */

import { useEffect, useRef, useState } from "react";
import { onToast } from "./canvas/bus";

const VISIBLE_MS = 4000;

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const off = onToast((next) => {
      // A second message while one is up replaces it rather than queueing —
      // stale acknowledgements are worse than none.
      clear();
      setMessage(next);
      setShown(true);
      timers.current.push(
        window.setTimeout(() => setShown(false), VISIBLE_MS),
        // Cleared after the fade so the text does not vanish mid-transition.
        window.setTimeout(() => setMessage(null), VISIBLE_MS + 400),
      );
    });

    return () => {
      off();
      clear();
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-full px-5 py-3 text-center text-[13px] leading-snug transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
      style={{
        maxWidth: "min(30rem, calc(100vw - 3rem))",
        // Deliberately not theme-tokened: this is a system message, and it
        // should look the same whichever theme the visitor is in.
        backgroundColor: "#101010",
        color: "#ffffff",
        boxShadow: "0 12px 40px #00000073",
      }}
    >
      {message}
    </div>
  );
}
