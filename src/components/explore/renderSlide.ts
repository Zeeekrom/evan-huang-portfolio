/**
 * Slide -> PixiJS Container. Renderer #2 of two (docs/ARCHITECTURE.md).
 *
 * Consumes exactly the same Slide objects as SemanticDeck.tsx, so the canvas
 * and the accessible DOM can never describe different things.
 *
 * This file is only the entry point: design tokens live in canvas/theme.ts and
 * the twelve layouts in canvas/layouts.ts.
 */

import type { Container } from "pixi.js";
import { parseLayoutId, type Slide } from "@/slides/types";
import { renderLayout } from "./canvas/layouts";
import type { Palette } from "./canvas/theme";

export { THEME, repaint } from "./canvas/theme";
export type { Palette } from "./canvas/theme";

/**
 * The palette is passed in rather than read from the slide's layoutId.
 *
 * The id still carries a theme suffix, which selects a layout variant, but the
 * colours come from whichever theme the visitor chose — otherwise the toggle
 * would leave every card exactly as it was and only repaint the background.
 */
export function renderSlide(slide: Slide, index: number, palette: Palette): Container {
  return renderLayout(slide, parseLayoutId(slide.layoutId), palette, index);
}
