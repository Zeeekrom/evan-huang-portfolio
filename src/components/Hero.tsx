"use client";

import { hero, site } from "@/data/content";

export default function Hero() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="home" className="relative overflow-hidden bg-grid pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[26rem] w-[26rem] rounded-full bg-accent-teal/20 blur-[110px] animate-blob"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 right-0 h-[20rem] w-[20rem] rounded-full bg-accent-violet/20 blur-[110px] animate-blob"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <p className="section-heading justify-center inline-flex items-center gap-2 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" />
          {site.location}
        </p>

        <p className="text-muted text-sm sm:text-base mb-2">{hero.greeting}</p>
        <h1 className="glow-outline font-mono font-bold text-4xl sm:text-6xl md:text-7xl leading-tight mb-4">
          {site.name}
        </h1>
        <h2 className="gradient-text font-semibold text-xl sm:text-2xl md:text-3xl mb-6">{hero.role}</h2>

        <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {hero.tagline}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => scrollTo("projects")}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-accent-teal to-accent-blue text-background font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {hero.ctaPrimary}
          </button>
          <button
            onClick={() => scrollTo("contact")}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-border text-foreground font-medium text-sm hover:border-accent-teal/60 transition-colors"
          >
            {hero.ctaSecondary}
          </button>
        </div>

        <div className="mt-10 inline-flex items-center gap-2 chip">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse" />
          {hero.available}
        </div>
      </div>
    </section>
  );
}
