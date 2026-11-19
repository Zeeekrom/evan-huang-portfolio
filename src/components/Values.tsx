import { bundle, type Lang } from "@/data/content";

/**
 * Values, rebuilt to the measured section
 * (the measured spec §15).
 *
 * The first build made this three columns on the page background and lost
 * the whole point. In the original it is the only full-bleed black on the
 * page, led by a marquee of the claims themselves at 47px — the loudest
 * thing on the site, because values are the part a reader is least likely to
 * go looking for.
 *
 * The marquee's track is written twice and slid by half its width, which is
 * what makes the loop seamless; the dots between the claims cycle through
 * three hues. It holds still under prefers-reduced-motion.
 */
export default function Values({ lang = "en" }: { lang?: Lang }) {
  const { positions, ui } = bundle(lang);
  const own = positions.filter((p) => p.origin === "practice").slice(0, 3);
  const run = [...own, ...own];

  return (
    <section id="values" className="sec">
      <div className="pad">
        <div className="sec-h">
          <h2>{ui.values.heading}</h2>
          <span className="aside">{ui.values.aside}</span>
        </div>
      </div>

      <div className="vband">
        <div className="vband-marquee" aria-hidden>
          <div className="vm-track">
            {run.map((position, i) => (
              <span key={`${position.id}-${i}`} className="contents">
                {position.label}
                <i>●</i>
              </span>
            ))}
          </div>
        </div>

        <div className="vcols">
          {own.map((position, i) => (
            <div className="vcol" key={position.id}>
              <span className="vcol-n" style={{ color: ["#6e93cc", "#3fa588", "#e8a317"][i] }}>
                {String(i + 1).padStart(2, "0")} · {position.keyword ?? ui.values.fallbackKeyword}
              </span>
              <h3>{position.label}</h3>
              <p>{position.claim}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
