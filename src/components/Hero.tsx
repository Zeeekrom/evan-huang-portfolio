"use client";

import { useEffect, useState } from "react";
import { bundle, type Lang } from "@/data/content";

/**
 * The opening screen, rebuilt to the measured geometry of the reference site
 * (the measured spec §2–§4): one bordered plate split 1.105 : 1,
 * text left, a single block of image weight right, nothing floating.
 *
 * What the measurements changed from the first attempt: the plate carries a
 * 2px solid border and no shadow at all, the two halves live inside one
 * rounded box with overflow hidden rather than sitting apart as separate
 * cards, and the heading is set tighter than its own font size
 * (line-height 0.9) so the sentence reads as a single block.
 *
 * The three lines are the reference's argument order, carrying Evan's own
 * material: a position (R7), a trajectory (R2), then numbers a reader can
 * check (R1).
 */

/*
 * 2600ms was the old deck's pace and it reads as hesitant next to the
 * reference. 1800 leaves 1.4s of hold after the 0.4s change.
 */
const SWAP_PERIOD = 1400;

export default function Hero({ lang = "en" }: { lang?: Lang }) {
  const { hero, ui } = bundle(lang);
  const words = hero.statement.swap;
  const [live, setLive] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => setLive((i) => (i + 1) % words.length), SWAP_PERIOD);
    return () => window.clearInterval(id);
  }, [words.length]);

  const trajectory = hero.trajectory;

  return (
    <header id="home" className="hero pad">
      <div className="hero-split">
        <div className="hero-type">
          <h1 className="big">
            {hero.statement.lead}
            <br />
            {hero.statement.pivot}{" "}
            <span className="swap">
              {words.map((word, i) => (
                <b key={word} className={i === live ? "live" : undefined} aria-hidden={i !== live}>
                  {word}
                </b>
              ))}
            </span>
          </h1>

          <p className="arc">
            {trajectory.map((step, i) => (
              <span key={step}>
                {i > 0 && <span className="arw"> ⟶ </span>}
                {i === trajectory.length - 1 ? <b>{step}</b> : step}
              </span>
            ))}
            {/* A full stop, in the width the language sets for one. */}
            {lang === "zh" ? "。" : "."}
          </p>

          <p className="scope">{hero.metrics.join(" · ")}</p>
        </div>

        {/*
          The other half is a photograph of the city, and on the reference it
          is the only large block of colour on the screen. This one is
          borrowed rather than taken by Evan, so the credit sits on it: the
          licence asks for attribution, and a picture that is not yours should
          say so where it is used, not in a file nobody opens.
        */}
        <div className="hero-shot">
          {hero.shot ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.shot.src} alt={hero.shot.alt} fetchPriority="high" decoding="async" />
              <span className="shot-caption">
                {hero.shot.caption}
                <small>
                  <a href={hero.shot.creditUrl} target="_blank" rel="noopener noreferrer">
                    {hero.shot.credit}
                  </a>
                  {" · "}
                  <a href={hero.shot.licenceUrl} target="_blank" rel="noopener noreferrer">
                    {hero.shot.licence}
                  </a>
                </small>
              </span>
            </>
          ) : (
            <span className="shot-caption">{ui.brand.location}</span>
          )}
        </div>
      </div>
    </header>
  );
}
