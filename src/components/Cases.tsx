import { bundle, type Lang } from "@/data/content";

/**
 * Case studies, the section the reference keeps between the work and the
 * record — and the one thing a card grid cannot do: show the work moving.
 *
 * Each of these three projects already has a narrated film in its own public
 * repository, so the section is three stills that open them. The stills are
 * frames from the films themselves rather than posters, because a poster is a
 * designed claim and a frame is the thing running.
 */
export default function Cases({ lang = "en" }: { lang?: Lang }) {
  const { cases } = bundle(lang);

  return (
    <section id="cases" className="sec pad">
      <div className="sec-h">
        <h2>{cases.heading}</h2>
        <span className="aside">{cases.aside}</span>
      </div>

      <div className="case-row mt-8">
        {cases.items.map((item) => (
          <a
            key={item.slug}
            className="lk-case"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.shot} alt={item.alt} loading="lazy" decoding="async" />

            <div className="lk-case-body">
              <span className="k">
                Watch · {item.length}
                <span className="arw-ne" aria-hidden>
                  ↗
                </span>
              </span>
              <h3>{item.title}</h3>
              <p>{item.line}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
