"use client";

import { useState } from "react";
import { contact, site } from "@/data/content";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <section id="contact" className="py-24 border-t border-border bg-background-elevated/40">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
        <p className="section-heading justify-center inline-flex mb-3">06 · Contact</p>
        <h3 className="text-2xl sm:text-3xl font-semibold mb-4">{contact.heading}</h3>
        <p className="text-muted mb-10 max-w-xl mx-auto">{contact.subheading}</p>

        <div className="grid sm:grid-cols-3 gap-4">
          <a href={`mailto:${site.email}`} className="card p-5 flex flex-col items-center gap-2">
            <span className="text-2xl">✉️</span>
            <span className="text-sm font-medium">Email</span>
            <span className="text-xs text-muted break-all">{site.email}</span>
          </a>

          <a
            href={site.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-5 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">💼</span>
            <span className="text-sm font-medium">LinkedIn</span>
            <span className="text-xs text-muted">/in/evan-h-165976301</span>
          </a>

          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-5 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">💻</span>
            <span className="text-sm font-medium">GitHub</span>
            <span className="text-xs text-muted">@Zeeekrom</span>
          </a>
        </div>

        <button
          onClick={copyEmail}
          className="mt-8 chip hover:border-accent-teal/60 hover:text-foreground cursor-pointer"
        >
          {copied ? "Copied email!" : "Copy email address"}
        </button>
      </div>
    </section>
  );
}
