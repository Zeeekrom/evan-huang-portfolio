"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { bundle, type Lang } from "@/data/content";
import { linkify } from "@/lib/linkify";

/**
 * Strengths, rebuilt to the measured section
 * (the measured spec §9 and §13).
 *
 * The cards are tabs: each one swaps the evidence panel underneath it. That
 * was the point of the row and the first build missed it — a static card row
 * claims seven areas at once, where tabs make the reader pick one and then
 * show them the places it was used.
 *
 * Deviation D3: on the original the first card stays filled whichever tab is
 * selected, so the selected tab is indistinguishable from the rest. Here the
 * fill follows the selection and the panel takes that hue.
 */

const HUES = [
  "--c1-line",
  "--c2-line",
  "--c3-line",
  "--c4-line",
  "--c5-line",
  "--c6-line",
  "--c7-line",
];

export default function Skills({ lang = "en" }: { lang?: Lang }) {
  const { skillGroups, strengths } = bundle(lang);
  const [active, setActive] = useState(0);
  const stage = strengths.stages[active];
  const hue = HUES[active % HUES.length];

  return (
    <section id="skills" className="sec pad">
      <div className="sec-h">
        <h2>{strengths.heading}</h2>
        <span className="aside">{strengths.aside}</span>
      </div>

      <p className="spine mt-8">{strengths.spine}</p>

      <div className="spec-row mt-7" role="tablist" aria-label={strengths.heading}>
        {strengths.stages.map((item, i) => {
          const group = skillGroups[i];
          return (
            <button
              key={item.label}
              type="button"
              role="tab"
              id={`spec-tab-${i}`}
              aria-selected={i === active}
              aria-controls="spec-stage"
              className="spec"
              style={{ "--line": `var(${HUES[i % HUES.length]})` } as CSSProperties}
              onClick={() => setActive(i)}
              title={group?.title}
            >
              <span className="spec-title">{item.label}</span>
              <span className="spec-sub">{group ? group.items.slice(0, 2).join(" · ") : ""}</span>
            </button>
          );
        })}
      </div>

      <div
        className="spec-stage mt-7"
        id="spec-stage"
        role="tabpanel"
        aria-labelledby={`spec-tab-${active}`}
        style={{ "--stage-line": `var(${hue})` } as CSSProperties}
      >
        <p className="stage-lead">{stage.lead}</p>
        <dl>
          {stage.rows.map((row) => (
            <div className="ev-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {linkify(row.text, row.label)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
