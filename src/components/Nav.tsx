"use client";

import { useEffect, useState } from "react";
import LangSwitch from "@/components/LangSwitch";
import { bundle, type Lang } from "@/data/content";

export default function Nav({ lang = "en" }: { lang?: Lang }) {
  const { hero, nav, ui } = bundle(lang);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 backdrop-blur transition-shadow duration-300 bg-[var(--nav-bg)] ${
        scrolled ? "border-b border-border shadow-[var(--shadow-1)]" : "border-b border-transparent"
      }`}
    >
      <div className="pad h-16 flex items-center justify-between gap-6">
        {/*
          The reference stacks a field label under the name rather than putting
          a job title in the headline: the bar says what he does, so the
          opening sentence is free to say what he thinks.
        */}
        <button onClick={() => handleNavClick("home")} className="text-left leading-tight">
          <span className="block text-sm font-bold tracking-tight text-foreground">{ui.brand.name}</span>
          <span className="label block mt-0.5 text-[0.62rem]">
            {ui.brand.kicker}
            {/* The city is the first thing to go when the bar gets narrow. */}
            <span className="hidden sm:inline"> · {ui.brand.location}</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-7">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          {/* A reader who needs the Chinese page should not have to reach the
              footer to find out it exists. */}
          <LangSwitch here={lang} />

          <button
            onClick={() => handleNavClick("contact")}
            className="inline-flex items-center rounded-full px-4 py-1.5 text-[0.78rem] font-semibold bg-[var(--c1-fill)] text-[var(--c1-on)] transition-opacity hover:opacity-90"
          >
            {hero.ctaSecondary}
          </button>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <LangSwitch here={lang} />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={ui.nav.menu}
            className="text-foreground p-2 -mr-2"
          >
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border bg-background-elevated px-5 py-4 flex flex-col gap-4">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="text-left text-sm text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
