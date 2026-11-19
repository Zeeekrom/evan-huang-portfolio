"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { bundle, type Lang } from "@/data/content";
import type { Project } from "@/data/content";
import CardStage from "./CardStage";

/**
 * Building, rebuilt to the measured section
 * (the measured spec §10, §13, §14).
 *
 * The first build read this as a grid. It is not: the cards are absolutely
 * positioned, rotated a degree or five, stepped about 100px apart so they
 * overlap into a pile, and draggable. A TIDY button puts them back. That pile
 * is the whole character of the section — it says these are things somebody
 * made rather than entries in a table.
 *
 * Each card turns over, and the front carries a real screenshot out of the
 * project's own public repository.
 *
 * Below 860px the pile becomes a column: a stack you have to drag apart is
 * not something to hand a phone.
 */

const HUE: Record<string, string> = {
  Autonomy: "--c7-line",
  "AI agents": "--c5-line",
  Data: "--c4-line",
  Tooling: "--c8-line",
  Interactive: "--c6-line",
};

/*
 * Measured at ~100px apart with four cards. With eight the pile closes up
 * until the titles are buried, so the step opens to 128: 16 + 7 × 128 + 240
 * still lands inside the 1162px row, and every card keeps its name visible.
 */
const STEP = 128;
/** The card's own width, from the stylesheet. The pile is laid out against it. */
const CARD_W = 240;
const ANGLES = [-5, -1, 3, -4, 2, -3, 5, -2];

type Offset = { x: number; y: number };

export default function Projects({ lang = "en" }: { lang?: Lang }) {
  const { projects, ui } = bundle(lang);
  const ALL = ui.projects.all;
  /*
   * The kind stays English in the data because it keys the card hues and
   * the canvas; only the word on the button is translated.
   */
  const kinds = useMemo(
    () => [ALL, ...Array.from(new Set(projects.map((p) => p.kind)))],
    [ALL, projects],
  );
  const [active, setActive] = useState(ALL);
  const [flipped, setFlipped] = useState<string | null>(null);
  /* The card lifted out of the pile, or null when the pile is just a pile. */
  const [opened, setOpened] = useState<Project | null>(null);
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number; from: Offset } | null>(null);
  const moved = useRef(false);
  /*
   * Which card is under the pointer lives in a ref, not in state. State does
   * not update until React re-renders, so a pointermove arriving in the same
   * tick as the pointerdown read the previous value and the drag never
   * started — the card just flipped instead.
   */
  const held = useRef<string | null>(null);

  const shown = active === ALL ? projects : projects.filter((p) => p.kind === active);

  /*
   * The step used to be a constant, measured against a wide desktop. Below
   * that width the last cards hung off the edge — first giving the page a
   * horizontal scrollbar, then, once that was clipped, becoming unclickable
   * altogether. Measuring the row means the pile always closes up enough to
   * fit, and every card stays reachable.
   */
  const pile = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(STEP);
  useEffect(() => {
    const node = pile.current;
    if (!node) return;
    const fit = () => {
      const room = node.clientWidth - CARD_W - 32;
      const gaps = Math.max(1, shown.length - 1);
      setStep(Math.max(44, Math.min(STEP, Math.floor(room / gaps))));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown.length]);

  const onPointerDown = useCallback(
    (slug: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("a, button")) return;
      moved.current = false;
      held.current = slug;
      start.current = { x: event.clientX, y: event.clientY, from: offsets[slug] ?? { x: 0, y: 0 } };
      setDragging(slug);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [offsets],
  );

  const onPointerMove = useCallback(
    (slug: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (held.current !== slug || !start.current) return;
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      // A few pixels of slop, so a click that wobbles still counts as a click.
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
      setOffsets((all) => ({ ...all, [slug]: { x: start.current!.from.x + dx, y: start.current!.from.y + dy } }));
    },
    [],
  );

  /*
   * A click used to turn the card over, which buried the one thing a reader
   * wants from a project card behind a second click. The card is now a link
   * to the repository and the turn has its own control, so the detail on the
   * back is still reachable without making the repository harder to get to.
   */
  const onPointerUp = useCallback(
    (project: Project) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (held.current !== project.slug) return;
      held.current = null;
      setDragging(null);
      start.current = null;
      /*
       * Hand the pointer back. A capture that is taken and never released
       * survives the gesture, and the element goes on owning events that are
       * no longer about it.
       */
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  /*
   * Opening is on click, not on pointerup. Pointer events are what the drag
   * needs, but they are not guaranteed to arrive for every input path — a
   * click synthesised by assistive technology or by a test harness can skip
   * them entirely, and the card then looked dead. Click always arrives, and
   * `moved` still holds the result of the gesture that just finished, so a
   * drag does not open anything.
   */
  const onClick = useCallback(
    (project: Project) => (event: ReactMouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("a, button")) return;
      if (moved.current) return;
      setOpened(project);
    },
    [],
  );

  return (
    <section
      id="projects"
      className="sec pad"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => event.preventDefault()}
    >
      <div className="sec-h">
        <h2>{ui.projects.heading}</h2>
        <span className="aside">{ui.projects.aside}</span>
      </div>

      <div className="bfilter mt-7">
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            className="bf"
            aria-pressed={kind === active}
            onClick={() => setActive(kind)}
          >
            {kind === ALL ? kind : (ui.projects.kinds[kind] ?? kind)}
          </button>
        ))}

        <span className="hint">{ui.projects.hint}</span>
        <button type="button" className="bf tidy" onClick={() => setOffsets({})}>
          {ui.projects.tidy}
        </button>
      </div>

      <div className="pgrid is-scatter mt-5" ref={pile}>
        {shown.map((project, i) => {
          const isFlipped = flipped === project.slug;
          const offset = offsets[project.slug] ?? { x: 0, y: 0 };
          const angle = ANGLES[i % ANGLES.length];
          const baseX = 16 + i * step;
          const baseY = i % 2 === 0 ? 14 : 30;

          return (
            <div
              key={project.slug}
              className={`pcard${isFlipped ? " is-flipped" : ""}${dragging === project.slug ? " is-dragging" : ""}`}
              role="button"
              tabIndex={0}
              aria-pressed={isFlipped}
              aria-label={`${project.title} — open the card`}
              style={
                {
                  transform: `translate(${baseX + offset.x}px, ${baseY + offset.y}px) rotate(${angle}deg)`,
                  zIndex: dragging === project.slug || isFlipped ? 40 : 2 + i,
                } as CSSProperties
              }
              onPointerDown={onPointerDown(project.slug)}
              onPointerMove={onPointerMove(project.slug)}
              onPointerUp={onPointerUp(project)}
              onClick={onClick(project)}
              /*
               * A card is a picture inside a box, and a browser will happily
               * start a native drag of either — which, depending on where it
               * is dropped, the browser reads as a navigation. The pile has
               * its own drag; this stops the browser starting a second one.
               */
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setOpened(project);
                }
              }}
            >
              <div className="pc-inner">
                <div className="pc-face pc-front">
                  <span
                    className="pc-head"
                    style={{ background: `var(${HUE[project.kind] ?? "--c8-line"})` } as CSSProperties}
                  >
                    <span className="k">
                      {ui.projects.kinds[project.kind] ?? project.kind} · {project.period}
                    </span>
                    <h3>{project.title}</h3>
                  </span>

                  {project.shot ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="pc-shot" src={project.shot} alt="" loading="lazy" decoding="async" draggable={false} />
                  ) : (
                    <div className="pc-body">
                      <p>{project.description}</p>
                    </div>
                  )}

                  <div className="pc-foot">
                    <button
                      type="button"
                      className="pc-hint pc-flip"
                      aria-expanded={isFlipped}
                      onClick={(event) => {
                        event.stopPropagation();
                        setFlipped((current) => (current === project.slug ? null : project.slug));
                      }}
                    >
                      {ui.card.peek} ↻
                    </button>
                  </div>
                </div>

                <div className="pc-face pc-back">
                  <div className="pc-body">
                    {project.shot && <p>{project.description}</p>}
                    {project.bullets.map((bullet, index) => (
                      <p key={index}>{bullet}</p>
                    ))}
                    {project.bullets.length === 0 && !project.shot && <p>{project.description}</p>}
                  </div>

                  <div className="pc-foot">
                    <button
                      type="button"
                      className="pc-hint pc-flip"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFlipped(null);
                      }}
                    >
                      {ui.card.back} ↺
                    </button>
                    <span className="pc-tags">{project.tags.slice(0, 3).join(" · ")}</span>
                    <span className="pc-links">
                      {/*
                        Live first, and only when something really is running:
                        a button that says live and opens a repository is the
                        one promise a portfolio should never break.
                      */}
                      {project.demo && (
                        <a
                          className="pc-hint is-live"
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {ui.card.live}
                        </a>
                      )}
                      {project.link && (
                        <a
                          className="pc-hint"
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {ui.card.repo}
                        </a>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {opened && <CardStage project={opened} ui={ui} onClose={() => setOpened(null)} />}
    </section>
  );
}
