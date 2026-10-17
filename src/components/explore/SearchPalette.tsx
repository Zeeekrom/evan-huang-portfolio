"use client";

/**
 * ⌘K palette.
 *
 * An infinite canvas has one structural weakness: you know something is out
 * there but you cannot find it. This is the answer to that, and it is why the
 * canvas hijacks ⌘F as well — the browser's own find bar cannot see text drawn
 * into WebGL, so leaving it bound would be a dead end for the visitor.
 *
 * Slides carry real text rather than images, so the whole deck is searchable.
 *
 * With an empty query it shows Quick Access instead of an arbitrary first
 * twelve slides: someone who opens the palette with nothing typed does not
 * know what is here, and a list of section names answers that better than a
 * slice of the deck.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { menu, slides } from "@/slides/slides";
import { t, type Slide } from "@/slides/types";

interface Entry {
  id: string;
  title: string;
  context: string;
  haystack: string;
}

/* -------------------------------------------------------------------- icons */

const S = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, React.ReactNode> = {
  intro: <path d="M4 11 12 4l8 7v9H4Z" />,
  "who-am-i": <><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  capabilities: <path d="m12 3 1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9ZM18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9Z" />,
  "projects-index": <path d="M3 7h6l2 2.5h10V19H3Z" />,
  "experience-index": <><rect x="3" y="7.5" width="18" height="11.5" rx="2" /><path d="M9 7.5V5.5h6v2" /></>,
  "research-index": <path d="M9.5 3v6L4.6 17.4A2 2 0 0 0 6.3 20.5h11.4a2 2 0 0 0 1.7-3.1L14.5 9V3M9 3h6M8 14h8" />,
  education: <path d="M12 4 2.5 8.8 12 13.6l9.5-4.8Zm-6 6.9v4.4c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.4" />,
  contact: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
};

const IconSearch = () => (<svg {...S} width={19} height={19}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className="inline-grid min-w-[1.4rem] place-items-center rounded px-1.5 py-0.5 font-sans text-[10px] font-medium"
    style={{ backgroundColor: "var(--ui-bg-active)", color: "var(--ui-text-muted)" }}
  >
    {children}
  </kbd>
);

/* ------------------------------------------------------------------- search */

/** Flatten every readable field of a slide into one searchable record. */
function indexSlide(s: Slide): Entry {
  const parts: string[] = [];
  const push = (v: unknown) => {
    const str = typeof v === "string" ? v : "";
    if (str) parts.push(str);
  };

  push(s.intro);
  push(s.title);
  push(s.subtitle);
  push(s.body);
  s.paragraphs?.forEach(push);
  s.bullets?.forEach(push);
  s.links?.forEach((l) => push(l.text));
  s.projectDetails?.forEach((g) => {
    push(g.title);
    g.items.forEach(push);
  });
  s.testimonials?.forEach((q) => {
    push(q.quote);
    parts.push(q.name);
  });

  return {
    id: s.id,
    title: t(s.title) || s.id,
    context: t(s.intro) || s.id,
    haystack: `${s.id} ${parts.join(" ")}`.toLowerCase(),
  };
}

export default function SearchPalette({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (slideId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const index = useMemo(() => slides.map((s) => indexSlide(s)), []);

  /**
   * Derived from the menu rather than hand-listed, so adding a section to the
   * deck adds it here too and the two can never disagree.
   */
  const quick = useMemo(
    () => menu.filter((m) => !m.indent).map((m) => ({ id: m.slideId, title: t(m.label) })),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Every whitespace-separated term must appear, so refining a query narrows
    // rather than widens it.
    const terms = q.split(/\s+/);
    return index.filter((e) => terms.every((term) => e.haystack.includes(term))).slice(0, 40);
  }, [query, index]);

  const browsing = query.trim() === "";
  const options = browsing ? quick : results;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    // Focus directly: the effect already runs after commit, and deferring to
    // rAF would make the palette unusable whenever frames are not being
    // scheduled — a background tab, or a throttled one.
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Quick Access wraps as a grid, so left/right move through it as well.
      const forward = e.key === "ArrowDown" || (browsing && e.key === "ArrowRight");
      const back = e.key === "ArrowUp" || (browsing && e.key === "ArrowLeft");

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (forward) {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, options.length - 1));
      } else if (back) {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = options[cursor];
        if (hit) onPick(hit.id);
      }
    };
    // Capture phase: the canvas also binds arrow keys, and while the palette is
    // open those keystrokes belong to the list, not the camera.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, options, cursor, browsing, onClose, onPick]);

  useEffect(() => {
    if (!browsing) listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor, browsing]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center px-5 pt-[14vh]"
      style={{ backgroundColor: "#00000066" }}
      onPointerDown={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl backdrop-blur-md"
        style={{
          backgroundColor: "var(--ui-bg)",
          border: "1px solid var(--ui-border)",
          boxShadow: "var(--ui-shadow)",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search slides"
      >
        {/* -------------------------------------------------------- input */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--ui-border)" }}
        >
          <span style={{ color: "var(--ui-text-muted)" }}>
            <IconSearch />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search slides…"
            aria-label="Search slides"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:opacity-60"
            style={{ color: "var(--ui-text)" }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 rounded px-2 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors"
            style={{ backgroundColor: "var(--ui-bg-active)", color: "var(--ui-text-muted)" }}
          >
            esc
          </button>
        </div>

        {/* --------------------------------------------------- quick access */}
        {browsing ? (
          <div className="px-5 pb-4 pt-4">
            <p
              className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "var(--ui-text-muted)" }}
            >
              Quick access
            </p>
            <div className="flex flex-wrap gap-2">
              {quick.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onPick(q.id)}
                  onPointerEnter={() => setCursor(i)}
                  className="flex items-center gap-2 rounded-full py-2 pl-3 pr-4 text-[13px] transition-all active:scale-95"
                  style={{
                    color: "var(--ui-text)",
                    backgroundColor: "var(--ui-bg-active)",
                    boxShadow: i === cursor ? "inset 0 0 0 1.5px var(--ui-text)" : "none",
                  }}
                >
                  <svg {...S} width={15} height={15} style={{ opacity: 0.7 }}>
                    {ICONS[q.id] ?? ICONS.intro}
                  </svg>
                  <span className="truncate">{q.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul ref={listRef} className="max-h-[46vh] overflow-y-auto py-1.5" role="listbox">
            {results.map((r, i) => (
              <li key={r.id} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  onClick={() => onPick(r.id)}
                  onPointerEnter={() => setCursor(i)}
                  className="flex w-full items-baseline gap-3 px-5 py-2 text-left"
                  style={{
                    backgroundColor: i === cursor ? "var(--ui-selected)" : "transparent",
                    color: "var(--ui-text)",
                  }}
                >
                  <span className="truncate text-sm">{r.title}</span>
                  <span
                    className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.12em]"
                    style={{ color: "var(--ui-text-muted)" }}
                  >
                    {r.context}
                  </span>
                </button>
              </li>
            ))}

            {results.length === 0 && (
              <li className="px-5 py-6 text-sm" style={{ color: "var(--ui-text-muted)" }}>
                No matching slides
              </li>
            )}
          </ul>
        )}

        {/* ------------------------------------------------------- footer */}
        <div
          className="px-5 py-3 text-center text-[11px]"
          style={{ color: "var(--ui-text-muted)", borderTop: "1px solid var(--ui-border)" }}
        >
          {browsing ? (
            <>
              <p className="flex items-center justify-center gap-1.5">
                <Key>⌘</Key> <span className="opacity-60">+</span> <Key>K</Key>
                <span className="ml-1">
                  to open anytime
                </span>
              </p>
              <p className="mt-1.5 opacity-70">
                Search for projects, slides, or keywords
              </p>
            </>
          ) : (
            <p className="flex items-center gap-4">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
              <span className="ml-auto">
                {results.length} / {slides.length}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
