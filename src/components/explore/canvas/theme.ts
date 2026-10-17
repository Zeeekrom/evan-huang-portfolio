/**
 * Canvas design tokens and drawing primitives.
 *
 * Everything the twelve layouts are built from lives here, so type scale and
 * spacing stay consistent across them. Layouts compose these; they never
 * construct a TextStyle themselves.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { SLIDE_H, SLIDE_W } from "@/slides/grid";
import { t, type Text as SText } from "@/slides/types";

/* -------------------------------------------------------------------- theme */

/**
 * `bg` is the slide card. `surface` is the table the cards sit on and must
 * differ from `bg` — when they match, slides stop reading as objects.
 */
export const THEME = {
  light: {
    bg: 0xe8e8e8,
    surface: 0xffffff,
    fg: 0x171717,
    muted: 0x6b7280,
    faint: 0xd4d4d4,
    rule: 0xc9c9c9,
    link: 0x171717,
    accent: 0x1f3a8a,
  },
  dark: {
    bg: 0x141414,
    surface: 0x3a3a3a,
    fg: 0xffffff,
    muted: 0xa3a3a3,
    faint: 0x262626,
    rule: 0x3d3d3d,
    link: 0xffffff,
    accent: 0x8ab4ff,
  },
} as const;

export type Palette = (typeof THEME)[keyof typeof THEME];

/* ------------------------------------------------------------------ tinting */

/**
 * Which palette entry a display object takes its colour from.
 *
 * Everything is rasterised white and coloured with `tint`, which is a GPU-side
 * multiply. Baking colour into a TextStyle instead would mean re-rasterising
 * every glyph on the canvas to change theme — and with sixty-odd slides that is
 * a full rebuild behind a loading screen, for what should be a toggle.
 */
export type Role = "fg" | "muted" | "faint" | "rule" | "link" | "bg" | "surface" | "accent";

interface Tinted {
  __role?: Role;
  /** Graphics carry a redraw closure; geometry is unchanged, only alpha/colour. */
  __alpha?: number;
}

/** Tag a display object with its palette role and colour it now. */
export function paint<T extends Container>(node: T, role: Role, c: Palette): T {
  (node as T & Tinted).__role = role;
  node.tint = c[role];
  return node;
}

/** Recolour a subtree in place. No re-layout, no re-rasterisation. */
export function repaint(root: Container, c: Palette): number {
  let touched = 0;
  const stack: Container[] = [root];
  while (stack.length > 0) {
    const node = stack.pop() as Container & Tinted;
    if (node.__role) {
      node.tint = c[node.__role];
      touched++;
    }
    for (let i = 0; i < node.children.length; i++) {
      stack.push(node.children[i] as Container);
    }
  }
  return touched;
}

/* ------------------------------------------------------------------ metrics */

export const PAD = 56;
export const COL = SLIDE_W - PAD * 2; // 888
export const HALF = 452; // text column when media occupies the right side
export const MEDIA_X = PAD + HALF + 44;
export const MEDIA_W = SLIDE_W - MEDIA_X - PAD;

/** Type scale. Sizes are in slide units; the camera does the rest. */
export const SCALE = {
  hero: { size: 78, lh: 1.04, weight: "500" },
  display: { size: 52, lh: 1.08, weight: "500" },
  title: { size: 36, lh: 1.16, weight: "500" },
  heading: { size: 27, lh: 1.22, weight: "500" },
  body: { size: 18, lh: 1.56, weight: "400" },
  small: { size: 15, lh: 1.5, weight: "400" },
  kicker: { size: 12.5, lh: 1.4, weight: "500" },
  micro: { size: 11, lh: 1.4, weight: "400" },
} as const;

/** Resolve whatever font the document actually uses, so canvas matches DOM. */
let cachedSans: string | null = null;
export function sansStack(): string {
  if (cachedSans) return cachedSans;
  if (typeof document === "undefined") return "system-ui, sans-serif";
  const f = getComputedStyle(document.body).fontFamily;
  cachedSans = f && f.trim().length > 0 ? f : "system-ui, sans-serif";
  return cachedSans;
}

/**
 * Accent face for `highlightText`. The reference site licenses Ivy Ora Display;
 * this is a free stand-in filling the same role — a serif italic against a sans
 * body. Swap the stack here, not in the layouts.
 */
export const SERIF_STACK = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

/* -------------------------------------------------------------- text styles */

export interface StyleOpts {
  size: number;
  weight?: string;
  lh?: number;
  wrap?: number;
  letterSpacing?: number;
  italic?: boolean;
  serif?: boolean;
  align?: "left" | "center" | "right";
}

export function style(o: StyleOpts): TextStyle {
  return new TextStyle({
    fontFamily: o.serif ? SERIF_STACK : sansStack(),
    fontSize: o.size,
    fontWeight: (o.weight ?? "400") as TextStyle["fontWeight"],
    fontStyle: o.italic ? "italic" : "normal",
    // Always white. Colour arrives via tint — see `paint`.
    fill: 0xffffff,
    letterSpacing: o.letterSpacing ?? 0,
    lineHeight: Math.round(o.size * (o.lh ?? 1.4)),
    align: o.align ?? "left",
    wordWrap: o.wrap !== undefined,
    wordWrapWidth: o.wrap ?? 0,
  });
}

/* ---------------------------------------------------------------- vertical flow */

/** Tracks a cursor down the slide so layouts read as a sequence, not arithmetic. */
export class Flow {
  y: number;
  constructor(
    private parent: Container,
    private x: number,
    start: number,
    private limit = SLIDE_H - PAD,
  ) {
    this.y = start;
  }
  get room(): number {
    return this.limit - this.y;
  }
  fits(h: number): boolean {
    return this.y + h <= this.limit;
  }
  add(node: Container, gap = 0, x = this.x): boolean {
    if (!this.fits(node.height)) return false;
    node.position.set(x, this.y);
    this.parent.addChild(node);
    this.y += node.height + gap;
    return true;
  }
  skip(px: number) {
    this.y += px;
  }
}

/* ------------------------------------------------------------------ atoms */

export function kicker(value: SText, c: Palette, wrap = COL): Text {
  return paint(
    new Text({
      text: t(value).toUpperCase(),
      style: style({ ...SCALE.kicker, letterSpacing: 2.6, wrap }),
    }),
    "muted",
    c,
  );
}

export function prose(
  value: SText,
  c: Palette,
  wrap: number = COL,
  size: number = SCALE.body.size,
): Text {
  return paint(
    new Text({
      text: t(value),
      style: style({ size, lh: SCALE.body.lh, weight: "400", wrap }),
    }),
    "fg",
    c,
  );
}

export function label(text: string, c: Palette, wrap?: number): Text {
  return paint(
    new Text({
      text: text.toUpperCase(),
      style: style({ ...SCALE.micro, letterSpacing: 1.6, wrap }),
    }),
    "muted",
    c,
  );
}

export function hairline(width: number, c: Palette, alpha = 1): Graphics {
  return paint(new Graphics().rect(0, 0, width, 1).fill({ color: 0xffffff, alpha }), "rule", c);
}

/**
 * Headline with `highlight` set in the serif italic face, flowing inline across
 * wraps. Falls back to plain text when the highlight is not a verbatim
 * substring, so bad data can never corrupt a heading.
 */
export function headline(
  full: string,
  highlight: string,
  size: number,
  wrap: number,
  c: Palette,
  weight = "500",
): Container {
  const box = new Container();
  const lh = Math.round(size * (size >= 60 ? 1.04 : size >= 40 ? 1.08 : 1.16));
  const at = highlight ? full.indexOf(highlight) : -1;

  if (at === -1) {
    box.addChild(
      paint(new Text({ text: full, style: style({ size, lh: lh / size, weight, wrap }) }), "fg", c),
    );
    return box;
  }

  const runs = [
    { text: full.slice(0, at), serif: false },
    { text: highlight, serif: true },
    { text: full.slice(at + highlight.length), serif: false },
  ].filter((r) => r.text.length > 0);

  let cx = 0;
  let cy = 0;
  for (const run of runs) {
    const st = style({
      size,
      lh: lh / size,
      weight: run.serif ? "400" : weight,
      italic: run.serif,
      serif: run.serif,
    });
    // Split on explicit newlines first, then flow words.
    const segments = run.text.split("\n");
    segments.forEach((seg, si) => {
      if (si > 0) {
        cx = 0;
        cy += lh;
      }
      for (const word of seg.split(/(\s+)/)) {
        if (word === "") continue;
        const node = new Text({ text: word, style: st });
        if (cx > 0 && cx + node.width > wrap && word.trim() !== "") {
          cx = 0;
          cy += lh;
        }
        if (cx === 0 && word.trim() === "") continue; // no leading spaces
        node.position.set(cx, cy);
        box.addChild(paint(node, "fg", c));
        cx += node.width;
      }
    });
  }
  return box;
}

/* ------------------------------------------------------------- interactive */

export type LinkNode = Text & { __url?: string };

/**
 * Interactive link with an underline and a hover glitch, mirroring the
 * reference site's micro-interaction. Routing is not decided here — the URL is
 * stashed on the node and Canvas.tsx owns the rules.
 */
export function linkText(
  value: SText,
  url: string,
  c: Palette,
  size: number = SCALE.body.size,
): Container {
  const box = new Container();
  const final = t(value);
  const st = style({ size, lh: 1.3, weight: "500" });
  const node = paint(new Text({ text: final, style: st }), "link", c) as LinkNode;
  node.__url = url;
  node.eventMode = "static";
  node.cursor = "pointer";

  const rule = paint(
    new Graphics()
      .rect(0, Math.round(size * 1.35), Math.max(node.width, 1), 1)
      .fill({ color: 0xffffff, alpha: 0.45 }),
    "link",
    c,
  );

  box.addChild(rule, node);

  // Glitch: scramble a few characters, then settle back. Short enough to read
  // as texture rather than as the text being broken.
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*/\\<>";
  let timer: ReturnType<typeof setInterval> | null = null;
  let ticks = 0;

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    node.text = final;
  };

  node.on("pointerover", () => {
    if (timer) return;
    ticks = 0;
    timer = setInterval(() => {
      ticks++;
      if (ticks > 6) return stop();
      node.text = final
        .split("")
        .map((ch) =>
          ch === " " || Math.random() > 0.28 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0],
        )
        .join("");
    }, 34);
  });
  node.on("pointerout", stop);
  node.on("destroyed", stop);

  return box;
}

/** Horizontal row of links that wraps within `wrap`. */
export function linkRow(
  links: { text: SText; url: string }[],
  c: Palette,
  wrap: number = COL,
  size: number = SCALE.body.size,
): Container {
  const box = new Container();
  let x = 0;
  let y = 0;
  const lineH = Math.round(size * 2);
  for (const l of links) {
    const node = linkText(l.text, l.url, c, size);
    if (x > 0 && x + node.width > wrap) {
      x = 0;
      y += lineH;
    }
    node.position.set(x, y);
    box.addChild(node);
    x += node.width + 34;
  }
  return box;
}

/** Vertical stack of links, used by index layouts. */
export function linkList(
  links: { text: SText; url: string }[],
  c: Palette,
  wrap: number,
  size: number,
  gap: number,
): Container {
  const box = new Container();
  let y = 0;
  for (const l of links) {
    const node = linkText(l.text, l.url, c, size);
    node.position.set(0, y);
    box.addChild(node);
    y += Math.round(size * 1.35) + gap;
  }
  return box;
}

export function bulletList(
  items: SText[],
  c: Palette,
  wrap: number,
  size: number = SCALE.body.size,
  gap = 14,
): Container {
  const box = new Container();
  let y = 0;
  for (const item of items) {
    const dash = paint(
      new Text({ text: "—", style: style({ size, lh: SCALE.body.lh }) }),
      "muted",
      c,
    );
    const body = paint(
      new Text({
        text: t(item),
        style: style({ size, lh: SCALE.body.lh, weight: "400", wrap: wrap - 30 }),
      }),
      "fg",
      c,
    );
    dash.position.set(0, y);
    body.position.set(30, y);
    box.addChild(dash, body);
    y += body.height + gap;
  }
  return box;
}

/** The role / tools / team / duration block. */
export function detailGrid(
  groups: { title: SText; items: SText[] }[],
  c: Palette,
  width: number,
  cols: number,
): Container {
  const box = new Container();
  const colW = Math.floor((width - (cols - 1) * 32) / cols);
  let rowTop = 0;
  let rowMax = 0;

  groups.forEach((g, i) => {
    const col = i % cols;
    if (col === 0 && i > 0) {
      rowTop += rowMax + 30;
      rowMax = 0;
    }
    const x = col * (colW + 32);
    const head = label(t(g.title), c, colW);
    head.position.set(x, rowTop);
    const rule = hairline(colW, c, 0.8);
    rule.position.set(x, rowTop + head.height + 7);
    const value = paint(
      new Text({
        text: g.items.map((it) => t(it)).join(" · "),
        style: style({ ...SCALE.small, wrap: colW }),
      }),
      "fg",
      c,
    );
    value.position.set(x, rowTop + head.height + 16);
    box.addChild(head, rule, value);
    rowMax = Math.max(rowMax, head.height + 16 + value.height);
  });
  return box;
}

/** Oversized ghosted index number — an editorial anchor, not decoration. */
export function ghostNumber(n: number, c: Palette): Text {
  return paint(
    new Text({
      text: String(n + 1).padStart(2, "0"),
      style: style({ size: 190, lh: 1, weight: "500" }),
    }),
    "faint",
    c,
  );
}

/**
 * The card is two objects, not one: fill and border take different palette
 * entries and a single Graphics can only carry one tint.
 */
export function slideCard(c: Palette): Container {
  const box = new Container();
  box.addChild(
    paint(new Graphics().rect(0, 0, SLIDE_W, SLIDE_H).fill({ color: 0xffffff }), "bg", c),
    paint(
      new Graphics()
        .rect(0, 0, SLIDE_W, SLIDE_H)
        .stroke({ color: 0xffffff, width: 2, alignment: 1 }),
      "rule",
      c,
    ),
  );
  return box;
}
