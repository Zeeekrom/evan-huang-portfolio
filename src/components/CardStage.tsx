"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Project, Ui } from "@/data/content";

/**
 * The card, opened.
 *
 * Clicking a card in the pile used to turn it over in place, which meant the
 * detail arrived at the size of a postcard. This lifts the card out of the
 * page instead: large, tilting under the pointer, with the project's poster
 * on the back rather than a wall of body text.
 *
 * The foil is written here rather than taken from a library. The best-known
 * implementation of this effect, simeydotme/pokemon-cards-css, is GPL-3.0 —
 * lifting it would relicense a repository that is published all rights
 * reserved. The technique it documents is not the licensed part: a pointer
 * position written to custom properties, two gradient layers blended over
 * the art, and @property so the numbers tween instead of jumping.
 *
 * The pointer writes straight to the node's style. Putting it through state
 * would re-render the whole card on every pointermove, and the tilt would
 * stutter on exactly the machines that can least afford it.
 */

const TILT = 13; // degrees at the edge of the card
const SWING = 420; // ms for the flip

export default function CardStage({
  project,
  ui,
  onClose,
}: {
  project: Project;
  ui: Ui;
  onClose: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const still = useRef(false);

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dialog.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    /* The page behind must not scroll while this is open. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const track = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const node = frame.current;
    if (!node || still.current) return;
    const box = node.getBoundingClientRect();
    /* −1 … 1 from the centre, which is what both the tilt and the foil want. */
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    node.style.setProperty("--px", `${x}`);
    node.style.setProperty("--py", `${y}`);
    node.style.setProperty("--rx", `${(0.5 - y) * TILT * 2}deg`);
    node.style.setProperty("--ry", `${(x - 0.5) * TILT * 2}deg`);
    node.style.setProperty("--lit", "1");
  }, []);

  const rest = useCallback(() => {
    const node = frame.current;
    if (!node) return;
    node.style.setProperty("--rx", "0deg");
    node.style.setProperty("--ry", "0deg");
    node.style.setProperty("--lit", "0");
  }, []);

  /*
   * The back is a picture, not a paragraph. Where a project has no poster of
   * its own, its screenshot stands in — the written bullets are on the small
   * card in the pile and on the canvas, and repeating them here at full size
   * was the thing that made the opened card feel like a document.
   */
  const back = project.poster ?? project.shot;

  return (
    <div
      className="stage"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      tabIndex={-1}
      ref={dialog}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="stage-inner">
        <div
          className="stage-frame"
          ref={frame}
          onPointerMove={track}
          onPointerLeave={rest}
          onDragStart={(event) => event.preventDefault()}
          style={{ ["--swing" as string]: `${SWING}ms` }}
        >
          <div className={`stage-card${flipped ? " is-flipped" : ""}`}>
            {/* ---------------------------------------------------- front */}
            <div className="stage-face stage-front">
              {project.shot ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="stage-art" src={project.shot} alt="" draggable={false} />
              ) : (
                <div className="stage-art stage-art-empty" aria-hidden />
              )}

              <div className="stage-text">
                <span className="k">
                  {ui.projects.kinds[project.kind] ?? project.kind} · {project.period}
                </span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>

              <span className="stage-foil" aria-hidden />
              <span className="stage-glare" aria-hidden />
            </div>

            {/* ----------------------------------------------------- back */}
            <div className="stage-face stage-back">
              {back ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className={project.poster ? "stage-poster" : "stage-poster is-shot"}
                  src={back}
                  alt={`${project.title} — project poster`}
                  draggable={false}
                />
              ) : (
                <div className="stage-text stage-text-only">
                  <span className="k">{project.tags.join(" · ")}</span>
                  {project.bullets.map((bullet, i) => (
                    <p key={i}>{bullet}</p>
                  ))}
                </div>
              )}

              <span className="stage-foil" aria-hidden />
              <span className="stage-glare" aria-hidden />
            </div>
          </div>
        </div>

        <div className="stage-bar">
          <button type="button" className="bf" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped}>
            {flipped ? ui.card.unflip : ui.card.flip}
          </button>

          {project.demo && (
            <a className="bf" href={project.demo} target="_blank" rel="noopener noreferrer">
              {ui.card.live} ↗
            </a>
          )}
          {project.link && (
            <a className="bf" href={project.link} target="_blank" rel="noopener noreferrer">
              {ui.card.repo} ↗
            </a>
          )}

          <button type="button" className="bf stage-close" onClick={onClose}>
            {ui.card.close} ✕
          </button>
        </div>
      </div>
    </div>
  );
}
