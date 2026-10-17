/**
 * Sticky notes (docs/ARCHITECTURE.md).
 *
 * Drawn straight into the annotation layer with fixed colours rather than
 * theme roles — a post-it that turned grey in dark mode would stop reading as
 * a post-it. `repaint` only touches nodes tagged with a role, so these survive
 * a theme switch untouched.
 *
 * The palette is shared with the DOM composer so the paper the visitor types
 * on is the paper the note lands on.
 */

import { Container, Graphics, Text as PixiText } from "pixi.js";

/** World units. Roughly a third of a slide, which is what a post-it looks like. */
export const NOTE_W = 300;
export const NOTE_H = 230;

export interface NoteColour {
  id: string;
  /** Paper, as CSS. The canvas reads the same value through `hexToInt`. */
  paper: string;
  /** Ink, chosen for contrast against the paper rather than by theme. */
  ink: string;
}

export const NOTE_COLOURS: NoteColour[] = [
  { id: "amber", paper: "#f7c948", ink: "#3a3222" },
  { id: "pink", paper: "#ec4899", ink: "#ffffff" },
  { id: "blue", paper: "#3b82f6", ink: "#ffffff" },
  { id: "green", paper: "#22c55e", ink: "#0f2e1a" },
  { id: "purple", paper: "#c084fc", ink: "#2e1544" },
];

export const DEFAULT_COLOUR = NOTE_COLOURS[0];

export function colourById(id: string | undefined): NoteColour {
  return NOTE_COLOURS.find((c) => c.id === id) ?? DEFAULT_COLOUR;
}

const hexToInt = (css: string) => Number.parseInt(css.slice(1), 16);

/** Deterministic tilt from the drop point, so a note never sits perfectly square. */
function tiltFor(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n) - 0.5) * 0.14; // ±4°
}

export function makeSticky(
  text: string,
  worldX: number,
  worldY: number,
  colourId?: string,
): Container {
  const c = colourById(colourId);

  const note = new Container();
  note.position.set(worldX, worldY);
  note.rotation = tiltFor(worldX, worldY);

  const shadow = new Graphics()
    .roundRect(-NOTE_W / 2 + 6, -NOTE_H / 2 + 10, NOTE_W, NOTE_H, 6)
    .fill({ color: 0x000000, alpha: 0.22 });
  note.addChild(shadow);

  const paper = new Graphics()
    .roundRect(-NOTE_W / 2, -NOTE_H / 2, NOTE_W, NOTE_H, 6)
    .fill(hexToInt(c.paper));
  note.addChild(paper);

  const body = new PixiText({
    text,
    style: {
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: 26,
      lineHeight: 34,
      fill: hexToInt(c.ink),
      wordWrap: true,
      wordWrapWidth: NOTE_W - 44,
      align: "center",
      // A note longer than the paper would spill over the edge; the composer
      // caps the length, and this is the backstop.
      breakWords: true,
    },
  });
  body.anchor.set(0.5);
  body.position.set(0, 0);
  note.addChild(body);

  return note;
}
