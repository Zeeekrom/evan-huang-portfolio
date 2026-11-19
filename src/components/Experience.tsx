"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { bundle, type ExperienceItem, type Lang } from "@/data/content";
import { linkify } from "@/lib/linkify";

/**
 * Record, rebuilt to the measured section
 * (the measured spec §11, §13).
 *
 * Every role is one row that can be opened: employer and badge, role and what
 * changed, dates. The badge is the reason this section was rebuilt — Tencent,
 * Perfect World and Lilith Games are household names in one country and
 * unknown in this one.
 *
 * The two modes come from the measured original: a resume reads newest first,
 * a journey reads in the order it happened. Which one a reader wants depends
 * on whether they are checking a claim or following a path.
 */

const HUES = ["--c3-line", "--c4-line", "--c5-line", "--c2-line", "--c1-line", "--c6-line", "--c8-line"];

type Mode = "resume" | "journey";
const MODE_KEYS: Mode[] = ["resume", "journey"];

function Row({ item, hue }: { item: ExperienceItem; hue: string }) {
  return (
    <details className="rrow-wrap">
      <summary className="rrow">
        <i className="not-italic">
          <span className="exp-co">{linkify(item.org, item.org)}</span>
          {item.badge && (
            <b className="exp-tag" style={{ "--line": `var(${hue})` } as CSSProperties}>
              {linkify(item.badge, `${item.org}-badge`)}
            </b>
          )}
        </i>

        <span>
          <span className="rrow-role">{item.role}</span>
          {item.metric && <span className="rrow-metric">{linkify(item.metric, `${item.org}-m`)}</span>}
        </span>

        <time className="rrow-time">
          {item.period}
          {item.location && <small>{item.location}</small>}
        </time>

        <span className="rrow-arw" aria-hidden>
          +
        </span>
      </summary>

      <ul className="rrow-detail">
        {item.bullets.map((bullet, i) => (
          <li key={i}>{linkify(bullet, `${item.org}-${i}`)}</li>
        ))}
      </ul>
    </details>
  );
}

export default function Experience({ lang = "en" }: { lang?: Lang }) {
  const { education, internships, startups, ui } = bundle(lang);
  const [mode, setMode] = useState<Mode>("resume");

  /*
   * Sorted, not concatenated. Work and ventures live in two files and run
   * through each other in time, so sticking one list after the other and
   * reversing it for Journey produced neither order: it read Lilith, Perfect
   * World, Tencent... and then both startups at the end, years out of place.
   */
  const roles = [...internships, ...startups];
  const ordered = [...roles].sort((a, b) => (mode === "resume" ? b.seq - a.seq : a.seq - b.seq));

  return (
    <section id="experience" className="sec pad">
      <div className="sec-h">
        <h2>{ui.experience.heading}</h2>
        <span className="aside">{ui.experience.aside}</span>
      </div>

      {/*
        Two sub-headings, not one. The section used to name the work in its own
        h2 and then label the schools with a field name, which left a reader
        asking what the rows above the label had been and why the two blocks
        were set in different registers. They are siblings: same mark, same
        size, each with the line of aside that belongs to it.
      */}
      <div className="sub-h mt-8">
        <h3 className="subhead">{ui.experience.work}</h3>
        <span className="aside">{ui.experience.workAside}</span>
      </div>

      <div className="exp-modes mt-4">
        {/*
          One capsule with two segments, as the reference has it: a pair of
          separate pills reads as two unrelated buttons rather than a switch
          with a position.
        */}
        <div className="seg" role="group" aria-label={ui.experience.order}>
          {MODE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="seg-btn"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {ui.experience.modes[key]}
            </button>
          ))}
        </div>
        <span className="note">{ui.experience[mode]}</span>
      </div>

      <div className="rrow-list mt-5">
        {ordered.map((item, i) => (
          <Row key={item.org + item.period} item={item} hue={HUES[i % HUES.length]} />
        ))}
      </div>

      {/*
        The aside is doing real work here: four schools in two countries with a
        rank on two of them reads as a scoreboard unless something says it is a
        path.
      */}
      <div className="sub-h mt-12">
        <h3 className="subhead">{ui.experience.education}</h3>
        <span className="aside">{ui.experience.educationAside}</span>
      </div>

      <div className="rrow-list mt-3">
        {education.map((item) => (
          <div className="rrow-wrap" key={item.school + item.period}>
            <div className="rrow">
              <i className="not-italic">
                <span className="exp-co">{linkify(item.school, item.school)}</span>
              </i>
              <span>
                <span className="rrow-role">{item.degree}</span>
                {item.detail && <span className="rrow-metric">{item.detail}</span>}
              </span>
              <time className="rrow-time">{item.period}</time>
              <span />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
