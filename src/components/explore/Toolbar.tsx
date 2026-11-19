"use client";

/**
 * Canvas chrome, arranged as the reference implementation arranges it:
 *
 *   top left      menu, and the theme toggle inside its panel
 *   bottom centre tools — search, select, highlight, sticky note, emoji
 *   bottom right  the navigation dial
 *
 * (The AI presenter sits top right and lives in its own component.)
 *
 * Rendered as DOM rather than into the canvas so it stays keyboard accessible
 * and readable by assistive tech. It never touches PixiJS — commands go out
 * over the bus and state comes back the same way (canvas/bus.ts).
 */

import { useEffect, useRef, useState } from "react";
import { menu, slides } from "@/slides/slides";
import {
  clearAnnotations,
  navigateTo,
  onAnnotationCount,
  onCanvasState,
  onPresenter,
  onSearchRequest,
  onToolChanged,
  openSearch,
  setTool,
  step,
  toOverview,
  type CanvasState,
  type Tool,
} from "./canvas/bus";
import { DEFAULT_COLOUR, NOTE_COLOURS } from "./canvas/sticky";
import SearchPalette from "./SearchPalette";
import StickyComposer from "./StickyComposer";
import Toast from "./Toast";

export type Theme = "light" | "dark";

/** Reactions (docs/ARCHITECTURE.md). */
const EMOJI = ["👍", "❤️", "😂", "🎉", "🔥", "⭐"];

/** Chrome labels: the tooltips and the screen-reader names. */
const UI = {
  openMenu: "Open menu", closeMenu: "Close menu",
  slides: "Slides", light: "Light theme", dark: "Dark theme",
  search: "Search slides (⌘K)", select: "Select", highlight: "Highlight",
  note: "Leave a sticky note", emoji: "Drop an emoji",
  paper: (c: string) => `${c} paper`, use: (g: string) => `Use ${g}`,
  clear: "Clear",
  up: "Slide above", down: "Slide below",
  prev: "Previous slide", next: "Next slide", overview: "Zoom out to overview",
} as const;

/* -------------------------------------------------------------------- icons */

const S = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconMenu = () => (<svg {...S} width={17} height={17}><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
const IconClose = () => (<svg {...S} width={17} height={17}><path d="M6 6l12 12M18 6L6 18" /></svg>);
const IconSearch = () => (<svg {...S} width={19} height={19}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
const IconCursor = () => (<svg {...S} width={19} height={19}><path d="m4 3 7.5 17 2.2-6.8L20.5 11Z" /></svg>);
const IconMarker = () => (<svg {...S} width={19} height={19}><path d="M15 4.5 19.5 9 9 19.5H4.5V15Z" /><path d="M13 6.5 17.5 11" /></svg>);
const IconNote = () => (<svg {...S} width={19} height={19}><path d="M20 4H4v16h9l7-7Z" /><path d="M13 20v-7h7" /></svg>);
const IconSmile = () => (<svg {...S} width={19} height={19}><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></svg>);
const IconSun = () => (<svg {...S} width={14} height={14}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>);
const IconMoon = () => (<svg {...S} width={14} height={14}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>);
const Chevron = ({ dir }: { dir: "up" | "down" | "left" | "right" }) => {
  const d = { up: "m6 15 6-6 6 6", down: "m6 9 6 6 6-6", left: "m15 6-6 6 6 6", right: "m9 6 6 6-6 6" }[dir];
  return (<svg {...S} width={15} height={15}><path d={d} /></svg>);
};

/* ------------------------------------------------------------------ helpers */

const surface = {
  backgroundColor: "var(--ui-bg)",
  border: "1px solid var(--ui-border)",
  boxShadow: "var(--ui-shadow)",
} as const;

function Btn({
  onClick,
  label,
  disabled,
  active,
  ring,
  size = 40,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
  /** Outline instead of fill — for a tool whose options sit beside it. */
  ring?: boolean;
  size?: number;
  children: React.ReactNode;
}) {
  const rest = active && !ring ? "var(--ui-selected)" : "transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className="grid shrink-0 place-items-center rounded-full transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
      style={{
        width: size,
        height: size,
        color: "var(--ui-text)",
        backgroundColor: rest,
        // A filled tool button next to a filled options pill reads as two
        // separate selections, so an expanded tool gets a ring instead.
        boxShadow: active && ring ? "inset 0 0 0 1.5px var(--ui-text)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = "var(--ui-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = rest;
      }}
    >
      {children}
    </button>
  );
}

const Divider = () => (
  <div className="mx-1.5 h-6 w-px shrink-0" style={{ backgroundColor: "var(--ui-border)" }} />
);

/**
 * A tool and its options in one pill.
 *
 * The options only exist while the tool is armed, so the dock stays short until
 * you actually need them. They expand inline rather than as a popover above:
 * a floating panel covers the canvas the visitor is about to mark up.
 */
function ToolGroup({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full transition-all"
      style={{
        backgroundColor: expanded ? "var(--ui-selected)" : "transparent",
        padding: expanded ? "4px 9px 4px 4px" : "0",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ toolbar */

export default function Toolbar({
  theme,
  onThemeChange,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}) {
  const [state, setState] = useState<CanvasState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tool, setActiveTool] = useState<Tool>("select");
  const [emoji, setEmoji] = useState(EMOJI[4]);
  const [colour, setColour] = useState(DEFAULT_COLOUR.id);
  const [marks, setMarks] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => onCanvasState(setState), []);
  useEffect(() => onAnnotationCount(setMarks), []);
  useEffect(() => onSearchRequest(() => setSearchOpen(true)), []);
  // The presenter takes the bottom of the screen for its own controls while a
  // call is live, so the dock stands down rather than stacking with it.
  useEffect(() => onPresenter(setPresenting), []);
  // The canvas owns Escape and ⌘K, so the armed tool is echoed back rather
  // than assumed.
  useEffect(() => onToolChanged(setActiveTool), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const ui = UI;
  const can = state?.can ?? { left: false, right: false, up: false, down: false };

  const pick = (next: Tool, glyph?: string) => {
    setActiveTool(next);
    setTool(next, glyph);
  };

  return (
    <>
      <Toast />

      {/* ---------------------------------------------------------- menu */}
      <div ref={menuRef} className="fixed left-6 top-6 z-[60]">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? ui.closeMenu : ui.openMenu}
          aria-expanded={menuOpen}
          className="grid h-[52px] w-[52px] place-items-center rounded-full backdrop-blur-md transition-transform active:scale-95"
          style={{ ...surface, color: "var(--ui-text)" }}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>

        {menuOpen && (
          <div
            className="mt-3 overflow-hidden rounded-3xl backdrop-blur-md"
            style={{ ...surface, width: "min(19rem, calc(100vw - 3rem))" }}
          >
            <div className="flex items-center justify-end px-5 pb-1 pt-4">
              <span
                className="text-sm font-medium tracking-tight"
                style={{ color: "var(--ui-text)" }}
              >
                Evan Huang
              </span>
            </div>

            <nav aria-label={ui.slides} className="max-h-[58vh] overflow-y-auto px-3 pb-2">
              {menu.map((m) => {
                const active = state?.slideId === m.slideId;
                return (
                  <button
                    key={m.slideId}
                    type="button"
                    onClick={() => {
                      navigateTo(m.slideId);
                      setMenuOpen(false);
                    }}
                    className={`block w-full truncate rounded-xl px-4 py-2 text-left font-mono text-[13px] transition-colors ${
                      m.indent ? "pl-8" : "font-semibold"
                    }`}
                    style={{
                      color: m.indent ? "var(--ui-text-muted)" : "var(--ui-text)",
                      backgroundColor: active ? "var(--ui-bg-active)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.backgroundColor = "var(--ui-bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = active
                        ? "var(--ui-bg-active)"
                        : "transparent";
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </nav>

            {/*
              Preferences live here rather than in the tool dock: the dock is
              for things that change what the pointer does, and the theme
              does not.
            */}
            <div className="flex items-center justify-between gap-2 px-5 pb-5 pt-2">
              <div
                className="inline-flex items-center gap-1 rounded-full p-1"
                style={{ backgroundColor: "var(--ui-selected)" }}
              >
                <Btn onClick={() => onThemeChange("light")} label={ui.light} active={theme === "light"} size={28}>
                  <IconSun />
                </Btn>
                <Btn onClick={() => onThemeChange("dark")} label={ui.dark} active={theme === "dark"} size={28}>
                  <IconMoon />
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------- tool dock */}
      <div
        aria-hidden={presenting}
        className={`fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full p-2 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          presenting ? "pointer-events-none translate-y-24 opacity-0" : ""
        }`}
        style={{ ...surface, maxWidth: "calc(100vw - 2rem)" }}
      >
        <Btn onClick={openSearch} label={ui.search}>
          <IconSearch />
        </Btn>

        <Divider />

        <Btn onClick={() => pick("select")} label={ui.select} active={tool === "select"}>
          <IconCursor />
        </Btn>
        <Btn onClick={() => pick("highlight")} label={ui.highlight} active={tool === "highlight"}>
          <IconMarker />
        </Btn>

        {/* Sticky note, with its paper colours alongside once armed. */}
        <ToolGroup expanded={tool === "note"}>
          <Btn onClick={() => pick("note")} label={ui.note} active={tool === "note"} ring>
            <IconNote />
          </Btn>
          {tool === "note" &&
            NOTE_COLOURS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColour(c.id)}
                aria-label={ui.paper(c.id)}
                aria-pressed={c.id === colour}
                title={c.id}
                className="h-[27px] w-[27px] shrink-0 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: c.paper,
                  boxShadow:
                    c.id === colour ? "0 0 0 2px var(--ui-bg), 0 0 0 3.5px var(--ui-text)" : "none",
                }}
              />
            ))}
        </ToolGroup>

        {/* Reactions, likewise. */}
        <ToolGroup expanded={tool === "emoji"}>
          <Btn onClick={() => pick("emoji", emoji)} label={ui.emoji} active={tool === "emoji"} ring>
            <IconSmile />
          </Btn>
          {tool === "emoji" &&
            EMOJI.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setEmoji(g);
                  pick("emoji", g);
                }}
                aria-label={ui.use(g)}
                aria-pressed={g === emoji}
                className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full text-[18px] transition-transform hover:scale-125 active:scale-95"
                style={{ backgroundColor: g === emoji ? "var(--ui-bg-active)" : "transparent" }}
              >
                {g}
              </button>
            ))}
        </ToolGroup>

        {marks > 0 && (
          <>
            <Divider />
            <button
              type="button"
              onClick={clearAnnotations}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors"
              style={{ color: "var(--ui-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ui-text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ui-text-muted)")}
            >
              {ui.clear}
            </button>
          </>
        )}
      </div>

      {/* --------------------------------------------------------- dial */}
      <div
        className={`fixed bottom-[7rem] right-4 z-[60] grid h-[90px] w-[90px] place-items-center rounded-full backdrop-blur-md transition-all duration-500 sm:bottom-6 sm:right-6 sm:h-[102px] sm:w-[102px] ${
          presenting ? "max-sm:pointer-events-none max-sm:translate-x-28 max-sm:opacity-0" : ""
        }`}
        style={surface}
      >
        <div className="grid grid-cols-3 grid-rows-3 place-items-center">
          <div className="col-start-2 row-start-1">
            <Btn onClick={() => step("up")} label={ui.up} disabled={!can.up} size={30}>
              <Chevron dir="up" />
            </Btn>
          </div>
          <div className="col-start-1 row-start-2">
            <Btn onClick={() => step("left")} label={ui.prev} disabled={!can.left} size={30}>
              <Chevron dir="left" />
            </Btn>
          </div>
          <div className="col-start-2 row-start-2">
            <button
              type="button"
              onClick={toOverview}
              aria-label={ui.overview}
              title={ui.overview}
              disabled={state?.atOverview}
              className="h-3 w-3 rounded-full transition-transform hover:scale-125 active:scale-95 disabled:opacity-30"
              style={{ backgroundColor: "var(--ui-text-muted)" }}
            />
          </div>
          <div className="col-start-3 row-start-2">
            <Btn onClick={() => step("right")} label={ui.next} disabled={!can.right} size={30}>
              <Chevron dir="right" />
            </Btn>
          </div>
          <div className="col-start-2 row-start-3">
            <Btn onClick={() => step("down")} label={ui.down} disabled={!can.down} size={30}>
              <Chevron dir="down" />
            </Btn>
          </div>
        </div>
      </div>

      {/* Position readout, clear of both bottom clusters. */}
      <div
        className={`pointer-events-none fixed bottom-8 left-6 z-[60] hidden text-[11px] uppercase tracking-[0.14em] transition-opacity duration-500 sm:block ${
          presenting ? "opacity-0" : ""
        }`}
        style={{ color: "var(--ui-text-muted)" }}
      >
        {state ? `${String(state.index + 1).padStart(2, "0")} / ${slides.length}` : ""}
      </div>

      <StickyComposer colourId={colour} slideId={state?.slideId} />

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={(id) => {
          setSearchOpen(false);
          navigateTo(id);
        }}
      />
    </>
  );
}
