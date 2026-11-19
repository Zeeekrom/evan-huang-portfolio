import { bundle, links, type Lang } from "@/data/content";
import { linkify } from "@/lib/linkify";

/**
 * About, rebuilt to the measured section (the measured spec §8).
 *
 * The shape is a claim first, evidence second: a portrait and one large
 * sentence on the left, the paragraphs on the right at 0.87 : 1. The first
 * paragraph is set larger and darker than the rest so the reader is told
 * where to start rather than left to pick.
 *
 * Under the claim is one line of monospace capitals, the same move the
 * reference uses for its numbers. It is a count, not a resume header: five
 * internships, four volunteer roles, three countries, two startups, one of
 * him. A label and a value with no colon between them, because "5" is not a
 * field name — it is the number, and the word after it is the unit.
 */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function About({ lang = "en" }: { lang?: Lang }) {
  const { about, ui } = bundle(lang);

  return (
    <section id="about" className="sec pad">
      <div className="sec-h">
        <h2>{about.heading}</h2>
        <span className="aside">{about.aside}</span>
      </div>

      <div className="about-grid mt-9">
        <div className="about-intro">
          {about.portrait ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="about-photo" src={about.portrait.src} alt={about.portrait.alt} loading="lazy" />
          ) : (
            <span className="about-photo" aria-hidden>
              {initials(ui.brand.name)}
            </span>
          )}

          <p className="about-lead">{about.lead}</p>

          <p className="scope">
            {about.facts.map((fact) => `${fact.label} ${fact.value}`).join(" · ")}
          </p>

          {/*
            The marks, in colour, on a plate that stays light in both themes.

            Colour is the ask, and colour is what breaks on a dark page: Lilith
            and Libraries Tasmania set their names in near-black, Perfect World
            publishes only a white wordmark, and no single page background
            suits all of them. One light plate behind the rows is the thing
            that makes every logo legible without touching any of them — and
            it groups the two rows as one object rather than as stray images.

            Perfect World is the exception that is touched: its file is the
            white lockup for its own dark header, so the stored copy is the
            same single-tone mark inverted, which is the version every brand
            keeps for light backgrounds.

            No caption. The marks are links and say what they are to a screen
            reader through alt text; a reader with eyes does not need to be
            told that a logo is a logo.
          */}
          <div className="lg-plate">
            {[about.logos.employers, about.logos.community].map((group, g) => (
              <ul className="lg-row" key={g}>
                {group.map((logo) => {
                  const url = links.find((l) => l.name === logo.org)?.url;
                  const img = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  );
                  return (
                    <li
                      className={`lg lg-${logo.src.split("/").pop()?.replace(/\.(png|svg)$/, "")}`}
                      key={logo.org}
                    >
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" title={logo.alt}>
                          {img}
                        </a>
                      ) : (
                        img
                      )}
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>

        <div className="about-body">
          {about.paragraphs.map((paragraph, i) => (
            <p key={i}>{linkify(paragraph, `about-${i}`)}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
