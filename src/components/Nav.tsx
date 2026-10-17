"use client";

import { useEffect, useState } from "react";
import { nav, site } from "@/data/content";

export default function Nav() {
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
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/85 backdrop-blur border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => handleNavClick("home")}
          className="font-mono text-sm sm:text-base tracking-tight text-foreground hover:text-accent-teal transition-colors"
        >
          {site.name}
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

        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
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
