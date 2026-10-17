/**
 * Slide content model.
 *
 * The same Slide[] feeds two renderers (docs/ARCHITECTURE.md §1):
 *   1. semantic DOM  -> SEO, accessibility, no-JS fallback
 *   2. PixiJS canvas -> the explorable experience
 */

/** Any user-facing string. */
export type Text = string;

export interface SlideLink {
  text: Text;
  /**
   * Routing is decided by prefix (docs/ARCHITECTURE.md) — this is the hub of the whole system.
   *   "slide://<id>"  -> in-canvas navigation
   *   "#<anchor>"     -> in-canvas navigation
   *   "<number>"      -> jump to slide by index
   *   "mailto:..."    -> location.href
   *   anything else   -> new tab
   */
  url: string;
}

export interface SlideImage {
  src: string;
  caption?: Text;
  /** Shown as a floating preview when hovering the link that points here (docs/ARCHITECTURE.md). */
  preview?: boolean;
}

export interface Testimonial {
  quote: Text;
  name: string;
  company?: string;
}

/** The "My Role / Tools & Methods / Team / Duration" block. */
export interface DetailGroup {
  title: Text;
  items: Text[];
}

/* ------------------------------------------------------------------ layouts */

/**
 * 12 base layouts. The upstream site ships 24 `layoutId` strings, but 12 of those
 * are just theme/media variants (docs/ARCHITECTURE.md) — we generate variants instead of
 * hand-writing them.
 */
export type LayoutBase =
  | "blank"
  | "hero" // big statement, particle field behind
  | "index" // menu of links, e.g. "Explore" / "My work"
  | "about" // kicker + headline + highlight + prose
  | "statement" // prose only, no headline
  | "project-cover" // title + one-liner + cover image + Explore link
  | "project-intro" // kicker + "How might we…" + body + external links
  | "project-details" // role / tools / team / duration
  | "project-content" // section block: Challenge, Solution, Impact…
  | "media" // image or video, full bleed
  | "gallery" // multiple images
  | "contact";

export type LayoutTheme = "light" | "dark";
export type MediaSlot = "none" | "right" | "bottom" | "full";

export interface LayoutSpec {
  base: LayoutBase;
  theme: LayoutTheme;
  media: MediaSlot;
}

/**
 * Serialised form, e.g. "project-content-dark-full-bottom".
 * Kept as a string so slide data stays JSON-serialisable.
 */
export type LayoutId = string;

const THEMES: LayoutTheme[] = ["light", "dark"];
const MEDIA: MediaSlot[] = ["right", "bottom", "full"];

export function layoutId(spec: Partial<LayoutSpec> & { base: LayoutBase }): LayoutId {
  const parts: string[] = [spec.base];
  if (spec.media && spec.media !== "none") parts.push(spec.media);
  if (spec.theme === "dark") parts.push("dark");
  return parts.join("-");
}

export function parseLayoutId(id: LayoutId): LayoutSpec {
  let rest = id;
  let theme: LayoutTheme = "light";
  let media: MediaSlot = "none";

  if (rest.endsWith("-dark")) {
    theme = "dark";
    rest = rest.slice(0, -"-dark".length);
  } else if (rest.endsWith("-light")) {
    rest = rest.slice(0, -"-light".length);
  }
  for (const m of MEDIA) {
    if (rest.endsWith(`-${m}`)) {
      media = m;
      rest = rest.slice(0, -(m.length + 1));
      break;
    }
  }
  void THEMES;
  return { base: rest as LayoutBase, theme, media };
}

/* -------------------------------------------------------------------- slide */

export interface Slide {
  id: string;
  layoutId: LayoutId;

  /** Small label above the title, e.g. "Project" / "Get to know me". */
  intro?: Text;
  title?: Text;
  subtitle?: Text;
  /**
   * A substring of `title` rendered in the serif italic accent face.
   * Must appear verbatim inside the title or it is ignored.
   */
  highlightText?: Text;

  body?: Text;
  paragraphs?: Text[];
  bullets?: Text[];

  links?: SlideLink[];

  image?: string;
  images?: SlideImage[];
  video?: string;
  youtubeUrl?: string;

  testimonials?: Testimonial[];
  projectDetails?: DetailGroup[];

  /** Anchor exposed in the semantic DOM and sitemap, e.g. "#copilot". */
  anchor?: string;
  /** Excluded from ⌘K search when true (pure media / spacer slides). */
  unsearchable?: boolean;
}

export interface MenuEntry {
  label: Text;
  slideId: string;
  indent?: boolean;
}

/* ------------------------------------------------------------------ helpers */

/** An optional text as a string, empty when it is absent. */
export function t(value: Text | undefined): string {
  return value ?? "";
}
