"use client";

/**
 * The textarea that appears when the visitor drops a sticky note pin.
 *
 * This is DOM rather than canvas text on purpose: PixiJS has no text input, and
 * hand-rolling one would break IME composition — which would lock out every
 * visitor who types through an input method.
 *
 * It is positioned in viewport pixels at the click point and commits on Enter
 * or blur, so the note lands where the visitor aimed.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { commitNote, onNoteRequest, showToast, type NoteRequest } from "./canvas/bus";
import { colourById } from "./canvas/sticky";
import { NOTE_MAX_CHARS, sendNote } from "@/lib/notes";

const COPY = {
  placeholder: "Leave a note…",
  hint: "Enter to send · Esc to cancel",
  sent: "Thanks for sending me a note, I will read it soon :)",
  failed: "Your note is on the canvas, but it could not reach me. Do try again.",
} as const;

export default function StickyComposer({
  colourId,
  slideId,
}: {
  colourId: string;
  slideId?: string;
}) {
  const [pin, setPin] = useState<NoteRequest | null>(null);
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  // Guards the blur handler: without it, committing on Enter and then losing
  // focus would place the same note twice.
  const done = useRef(false);

  useEffect(
    () =>
      onNoteRequest((next) => {
        done.current = false;
        setText("");
        setPin(next);
      }),
    [],
  );

  useLayoutEffect(() => {
    if (pin) ref.current?.focus();
  }, [pin]);

  if (!pin) return null;

  const c = COPY;
  const paint = colourById(colourId);

  const close = () => {
    done.current = true;
    setPin(null);
    setText("");
  };

  const commit = () => {
    if (done.current) return;
    const body = text.trim().slice(0, NOTE_MAX_CHARS);
    close();
    if (!body) return;

    // Draw first, send second. The note belongs to the visitor the moment they
    // press Enter; whether it also reaches Evan is a separate question, and the
    // toast is what answers it.
    commitNote(pin.worldX, pin.worldY, body, colourId);
    void sendNote({ text: body, colour: colourId, slideId }).then((ok) =>
      showToast(ok ? c.sent : c.failed),
    );
  };

  return (
    <div
      className="fixed z-[70] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: pin.screenX, top: pin.screenY }}
    >
      <textarea
        ref={ref}
        value={text}
        rows={3}
        maxLength={NOTE_MAX_CHARS}
        placeholder={c.placeholder}
        aria-label={c.placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Enter commits; Shift+Enter is a line break. Both are stopped from
          // reaching the canvas, which binds plain keys to navigation.
          e.stopPropagation();
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
        }}
        className="w-[17rem] resize-none rounded-md p-3.5 text-[13px] leading-snug outline-none placeholder:opacity-55"
        style={{
          backgroundColor: paint.paper,
          color: paint.ink,
          caretColor: paint.ink,
          boxShadow: "0 8px 24px #00000059",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      />
      <span
        className="rounded px-1.5 py-0.5 text-[10px] backdrop-blur-md"
        style={{
          backgroundColor: "var(--ui-bg)",
          color: "var(--ui-text-muted)",
          border: "1px solid var(--ui-border)",
        }}
      >
        {c.hint}
      </span>
    </div>
  );
}
