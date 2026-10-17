"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import CanvasMount from "./CanvasMount";
import Toolbar, { type Theme } from "./Toolbar";
import VoicePresenter from "./VoicePresenter";

const THEME_KEY = "explore-theme";

/** No-op on the server, where layout effects never run. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Owns the theme for the whole explore route.
 *
 * Theme has to be applied in two places at once: as `data-theme` on the root
 * element, which drives the DOM chrome through CSS variables, and as a prop to
 * the canvas, where colours are baked into each Text object at build time. It
 * is handed down as a prop and applied inside without rebuilding — see
 * Canvas.tsx.
 */
export default function ExploreShell() {
  // Default is dark — a grey table under near-black cards. Deliberate rather
  // than following the OS, because the deck is composed for it.
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  /*
   * Covers the case the boot script cannot: arriving here through a client-side
   * navigation, where no HTML is parsed and no inline script runs. A layout
   * effect still lands before the browser paints, so the deck stays hidden.
   */
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (!root.dataset.canvas) root.dataset.canvas = "on";
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // Keep the classic Tailwind hook in sync so shared components match.
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (hydrated) window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  // Mounting the canvas only after the stored preference is known avoids
  // building every slide in the wrong palette and immediately rebuilding them.
  if (!hydrated) return null;

  return (
    <>
      <CanvasMount theme={theme} startAt="intro" />
      <Toolbar theme={theme} onThemeChange={setTheme} />
      <VoicePresenter />
    </>
  );
}
