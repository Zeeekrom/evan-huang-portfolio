"use client";

import { useEffect } from "react";

/**
 * Scroll reveal, the measured original's `.obs → .on` mechanic (§5.2 of the
 * spec), with one change: the page is readable first and animated second.
 *
 * There, elements start hidden and are revealed by script. If the script
 * never runs — no JavaScript, a blocked bundle, a crawler — the page stays
 * blank. Here the hiding rule only exists once this component has marked the
 * document, so the exported HTML is fully visible on its own and the fade is
 * something JavaScript adds rather than something it rescues.
 *
 * Reduced motion is handled in CSS: the class is still added, the movement
 * is not.
 */
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".sec, .hero"));
    if (!sections.length || !("IntersectionObserver" in window)) return;

    root.classList.add("js-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          /*
           * A data attribute, not a class. className is a React prop: the
           * moment a section with state re-rendered, React wrote its own
           * className back and the section it had already revealed went
           * invisible for good. React does not manage attributes it was
           * never given, so this one survives a re-render.
           */
          (entry.target as HTMLElement).dataset.reveal = "on";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    for (const section of sections) observer.observe(section);

    return () => {
      observer.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
