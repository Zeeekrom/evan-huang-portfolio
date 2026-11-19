/**
 * The twelve layouts.
 *
 * Each renderer receives a prepared card and fills it. They compose primitives
 * from theme.ts and never build a TextStyle directly, so the type scale stays
 * consistent across the deck.
 *
 * Layouts are adaptive: a slide with no media uses the full measure rather than
 * leaving a hole, and content that would overflow the 1000x600 card is dropped
 * by Flow rather than spilling past the edge.
 */

import { Container, Graphics, Text } from "pixi.js";
import { SLIDE_H, SLIDE_W } from "@/slides/grid";
import { t, type LayoutBase, type LayoutSpec, type Slide } from "@/slides/types";
import {
  COL,
  Flow,
  HALF,
  MEDIA_W,
  MEDIA_X,
  PAD,
  SCALE,
  bulletList,
  detailGrid,
  ghostNumber,
  hairline,
  headline,
  kicker,
  label,
  linkList,
  linkRow,
  paint,
  prose,
  slideCard,
  style,
  type Palette,
} from "./theme";

interface Ctx {
  slide: Slide;
  spec: LayoutSpec;
  c: Palette;
  body: Container;
  index: number;
}

const BOTTOM = SLIDE_H - PAD;

/* ------------------------------------------------------------------ helpers */

/** True when this slide actually has something to put in a media slot. */
function hasMedia(s: Slide): boolean {
  return Boolean(s.image || s.video || s.youtubeUrl || s.images?.length);
}

/** Measure available to text, accounting for a media slot on the right. */
function measure(ctx: Ctx): number {
  return ctx.spec.media === "right" && hasMedia(ctx.slide) ? HALF : COL;
}

/** Bottom-anchored link row. Returns the y it occupies. */
function anchorLinks(ctx: Ctx, wrap: number = COL, size: number = SCALE.body.size): number {
  const { slide, c, body } = ctx;
  if (!slide.links?.length) return BOTTOM;
  const row = linkRow(slide.links, c, wrap, size);
  const y = BOTTOM - row.height;
  row.position.set(PAD, y);
  body.addChild(row);
  return y;
}

/** A framed media slot. Images load lazily; the frame reserves the space. */
function mediaBox(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const { slide, c, body } = ctx;
  const frame = paint(
    new Graphics().rect(x, y, w, h).fill({ color: 0xffffff, alpha: 0.45 }),
    "surface",
    c,
  );
  body.addChild(frame);

  const src = slide.image ?? slide.images?.[0]?.src;
  if (src) {
    // Deferred so a slow or missing asset never blocks the deck from drawing.
    import("pixi.js").then(({ Assets, Sprite }) =>
      Assets.load(src)
        .then((tex) => {
          if (frame.destroyed) return;
          const sp = new Sprite(tex);
          const k = Math.min(w / sp.width, h / sp.height);
          sp.scale.set(k);
          sp.position.set(x + (w - sp.width) / 2, y + (h - sp.height) / 2);
          body.addChild(sp);
        })
        .catch(() => {
          /* frame stands in for the missing asset */
        }),
    );
    return;
  }

  const note = label(slide.video ? "video" : slide.youtubeUrl ? "youtube" : "media", c);
  note.position.set(x + 16, y + h - note.height - 14);
  body.addChild(note);
}

/** Ghost index, bottom-right. Fills the visual gap when a slide has no media. */
function ghost(ctx: Ctx) {
  const g = ghostNumber(ctx.index, ctx.c);
  g.position.set(SLIDE_W - PAD - g.width, SLIDE_H - PAD - g.height + 30);
  ctx.body.addChildAt(g, 0);
}

/* ------------------------------------------------------------------ layouts */

function heroLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const title = t(slide.title);
  const head = headline(title, t(slide.highlightText), SCALE.hero.size, COL, c);

  const sub = slide.subtitle
    ? paint(
        new Text({
          text: t(slide.subtitle),
          style: style({ size: 22, lh: 1.4, wrap: COL * 0.7 }),
        }),
        "muted",
        c,
      )
    : null;

  const linkTop = anchorLinks(ctx, COL, 20);
  const block = head.height + (sub ? sub.height + 22 : 0);
  const top = Math.max(PAD + 40, (linkTop - block) / 2);

  head.position.set(PAD, top);
  body.addChild(head);
  if (sub) {
    sub.position.set(PAD, top + head.height + 22);
    body.addChild(sub);
  }
}

function indexLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const flow = new Flow(body, PAD, PAD);
  if (slide.intro) flow.add(kicker(slide.intro, c), 14);
  if (slide.title) {
    flow.add(headline(t(slide.title), "", SCALE.display.size, COL, c), 12);
  }
  flow.add(hairline(COL, c), 26);

  const links = slide.links ?? [];
  if (!links.length) return;

  // Two columns once the list is long enough that one would run off the card.
  const twoCol = links.length > 6;
  const colW = twoCol ? (COL - 44) / 2 : COL;
  const size = links.length > 10 ? 17 : 20;
  const gap = links.length > 10 ? 8 : 12;
  const half = Math.ceil(links.length / (twoCol ? 2 : 1));

  const left = linkList(links.slice(0, half), c, colW, size, gap);
  left.position.set(PAD, flow.y);
  body.addChild(left);

  if (twoCol) {
    const right = linkList(links.slice(half), c, colW, size, gap);
    right.position.set(PAD + colW + 44, flow.y);
    body.addChild(right);
  }
}

function aboutLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const flow = new Flow(body, PAD, PAD);
  if (slide.intro) flow.add(kicker(slide.intro, c), 16);
  if (slide.title) {
    flow.add(
      headline(t(slide.title), t(slide.highlightText), SCALE.title.size, COL * 0.82, c),
      24,
    );
  }
  flow.add(hairline(COL, c), 22);

  /*
   * Prose runs in two columns, split by count rather than by overflow.
   *
   * Filling the first column until something did not fit, then starting the
   * second, left the last paragraph with nowhere to go while the second column
   * still had room — and a paragraph that does not fit is dropped silently. A
   * fourth paragraph about the current job disappeared that way.
   */
  const paras = slide.paragraphs ?? (slide.body ? [slide.body] : []);
  const colW = (COL - 48) / 2;
  const half = Math.ceil(paras.length / 2);
  const columns = [paras.slice(0, half), paras.slice(half)];
  const GAP = 14;

  /*
   * The type steps down until everything fits, rather than the last paragraph
   * disappearing. A paragraph that overran the card by two slide units was
   * dropped in silence, which is how a paragraph about the current job went
   * missing from this card.
   */
  const fits = (size: number) =>
    columns.every((column) => {
      let y = flow.y;
      for (const p of column) {
        const probe = prose(p, c, colW, size);
        y += probe.height + GAP;
        probe.destroy();
      }
      return y - GAP <= BOTTOM;
    });

  const SIZES = [16, 15, 14, 13];
  const size = SIZES.find(fits) ?? SIZES[SIZES.length - 1];

  columns.forEach((column, colIndex) => {
    let y = flow.y;
    for (const p of column) {
      const node = prose(p, c, colW, size);
      if (y + node.height > BOTTOM) break;
      node.position.set(PAD + colIndex * (colW + 48), y);
      body.addChild(node);
      y += node.height + GAP;
    }
  });
}

function statementLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const paras = slide.paragraphs ?? (slide.body ? [slide.body] : []);
  const wrap = COL * 0.78;

  const nodes = paras.map((p) => prose(p, c, wrap, 21));
  const kick = slide.intro ? kicker(slide.intro, c) : null;
  const total =
    nodes.reduce((s, n) => s + n.height + 20, 0) + (kick ? kick.height + 26 : 0);
  let y = Math.max(PAD, (SLIDE_H - total) / 2);

  if (kick) {
    kick.position.set(PAD, y);
    body.addChild(kick);
    y += kick.height + 26;
  }
  for (const n of nodes) {
    if (y + n.height > BOTTOM) break;
    n.position.set(PAD, y);
    body.addChild(n);
    y += n.height + 20;
  }
}

function projectCoverLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const media = ctx.spec.media === "right" && hasMedia(slide);
  const wrap = media ? HALF : COL * 0.78;

  if (media) mediaBox(ctx, MEDIA_X, PAD, MEDIA_W, SLIDE_H - PAD * 2);
  else ghost(ctx);

  const flow = new Flow(body, PAD, PAD);
  if (slide.intro) flow.add(kicker(slide.intro, c, wrap), 18);
  if (slide.title) {
    flow.add(headline(t(slide.title), t(slide.highlightText), SCALE.display.size, wrap, c), 18);
  }
  if (slide.subtitle) flow.add(prose(slide.subtitle, c, wrap, 17), 12);
  if (slide.body) flow.add(prose(slide.body, c, wrap, 18), 12);

  anchorLinks(ctx, wrap, 19);
}

function projectIntroLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const wrap = measure(ctx);
  if (ctx.spec.media === "right" && hasMedia(slide)) {
    mediaBox(ctx, MEDIA_X, PAD, MEDIA_W, SLIDE_H - PAD * 2);
  }

  const flow = new Flow(body, PAD, PAD);
  if (slide.intro) flow.add(kicker(slide.intro, c, wrap), 16);
  if (slide.title) {
    flow.add(headline(t(slide.title), t(slide.highlightText), SCALE.title.size, wrap, c), 20);
  }
  flow.add(hairline(Math.min(wrap, 200), c), 20);
  if (slide.body) flow.add(prose(slide.body, c, wrap, 18), 14);
  for (const p of slide.paragraphs ?? []) {
    if (!flow.fits(60)) break;
    flow.add(prose(p, c, wrap, 17), 12);
  }

  // The stack, which used to be a slide of its own carrying nothing but this
  // and the title over again. Flow.add declines when there is no room, so a
  // project with a long description keeps its description.
  const groups = slide.projectDetails ?? [];
  if (groups.length) {
    flow.add(detailGrid(groups, c, wrap, Math.min(groups.length, 2)), 16);
  }

  anchorLinks(ctx, wrap, 18);
}

function projectDetailsLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const flow = new Flow(body, PAD, PAD);
  if (slide.intro) flow.add(kicker(slide.intro, c), 12);
  if (slide.title) {
    flow.add(headline(t(slide.title), "", SCALE.heading.size, COL, c), 20);
  }
  flow.add(hairline(COL, c), 30);

  const groups = slide.projectDetails ?? [];
  if (groups.length) {
    const cols = groups.length <= 2 ? groups.length : groups.length <= 4 ? 2 : 3;
    const grid = detailGrid(groups, c, COL, cols);
    grid.position.set(PAD, flow.y);
    body.addChild(grid);
  }
  anchorLinks(ctx);
}

function projectContentLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const media = ctx.spec.media !== "none" && hasMedia(slide);
  const wrap = media && ctx.spec.media === "right" ? HALF : COL;

  if (media) {
    if (ctx.spec.media === "right") mediaBox(ctx, MEDIA_X, PAD, MEDIA_W, SLIDE_H - PAD * 2);
    else if (ctx.spec.media === "bottom") mediaBox(ctx, PAD, SLIDE_H - 230, COL, 174);
  }

  const flow = new Flow(body, PAD, PAD, media && ctx.spec.media === "bottom" ? SLIDE_H - 250 : BOTTOM);
  if (slide.intro) flow.add(kicker(slide.intro, c, wrap), 14);
  if (slide.title) {
    flow.add(headline(t(slide.title), t(slide.highlightText), SCALE.heading.size, wrap, c), 18);
  }
  flow.add(hairline(Math.min(wrap, 160), c), 22);

  if (slide.body) flow.add(prose(slide.body, c, wrap, 18), 16);
  if (slide.bullets?.length) {
    const list = bulletList(slide.bullets, c, wrap, 17, 14);
    flow.add(list, 14);
  }
  for (const p of slide.paragraphs ?? []) {
    if (!flow.fits(50)) break;
    flow.add(prose(p, c, wrap, 17), 12);
  }
  if (!media) anchorLinks(ctx, wrap, 18);
}

function mediaLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  mediaBox(ctx, 0, 0, SLIDE_W, SLIDE_H);
  if (slide.title) {
    const cap = paint(
      new Text({
        text: t(slide.title),
        style: style({ ...SCALE.small, weight: "500", wrap: COL }),
      }),
      "fg",
      c,
    );
    const plate = paint(
      new Graphics()
        .rect(PAD - 12, BOTTOM - cap.height - 10, cap.width + 24, cap.height + 18)
        .fill({ color: 0xffffff, alpha: 0.85 }),
      "bg",
      c,
    );
    cap.position.set(PAD, BOTTOM - cap.height - 2);
    body.addChild(plate, cap);
  }
}

function galleryLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const flow = new Flow(body, PAD, PAD);
  if (slide.intro) flow.add(kicker(slide.intro, c), 12);
  if (slide.title) flow.add(headline(t(slide.title), "", SCALE.heading.size, COL, c), 20);

  const images = slide.images ?? [];
  const cols = Math.min(3, Math.max(1, images.length));
  const cellW = (COL - (cols - 1) * 20) / cols;
  const cellH = Math.min(240, BOTTOM - flow.y);
  images.slice(0, cols * 2).forEach((im, i) => {
    const cx = PAD + (i % cols) * (cellW + 20);
    const cy = flow.y + Math.floor(i / cols) * (cellH + 20);
    if (cy + cellH > BOTTOM) return;
    mediaBox({ ...ctx, slide: { ...slide, image: im.src } }, cx, cy, cellW, cellH);
  });
  void c;
}

function contactLayout(ctx: Ctx) {
  const { slide, c, body } = ctx;
  const flow = new Flow(body, PAD, PAD + 20);
  if (slide.intro) flow.add(kicker(slide.intro, c), 22);
  if (slide.title) {
    flow.add(headline(t(slide.title), "", SCALE.display.size, COL, c), 20);
  }
  if (slide.body) flow.add(prose(slide.body, c, COL * 0.7, 19), 20);

  if (slide.links?.length) {
    const list = linkList(slide.links, c, COL, 20, 14);
    list.position.set(PAD, Math.max(flow.y + 10, BOTTOM - list.height));
    body.addChild(list);
  }
}

function blankLayout(_ctx: Ctx) {
  /* the card itself is the content */
}

/* ----------------------------------------------------------------- registry */

const RENDERERS: Record<LayoutBase, (ctx: Ctx) => void> = {
  blank: blankLayout,
  hero: heroLayout,
  index: indexLayout,
  about: aboutLayout,
  statement: statementLayout,
  "project-cover": projectCoverLayout,
  "project-intro": projectIntroLayout,
  "project-details": projectDetailsLayout,
  "project-content": projectContentLayout,
  media: mediaLayout,
  gallery: galleryLayout,
  contact: contactLayout,
};

/** Entry point used by Canvas.tsx. */
export function renderLayout(
  slide: Slide,
  spec: LayoutSpec,
  palette: Palette,
  index: number,
): Container {
  const root = new Container();
  root.label = slide.id;
  root.addChild(slideCard(palette));

  const body = new Container();
  root.addChild(body);

  const ctx: Ctx = { slide, spec, c: palette, body, index };
  (RENDERERS[spec.base] ?? projectContentLayout)(ctx);

  // Slide stamp, bottom-right, always last so it sits above any media.
  const stamp = label(slide.id, palette);
  stamp.position.set(SLIDE_W - PAD - stamp.width, SLIDE_H - PAD + 8);
  root.addChild(stamp);

  return root;
}
