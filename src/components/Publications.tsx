import { bundle, type Lang } from "@/data/content";

/**
 * Two co-authored papers, in the same row grammar as the work record: what it
 * is on the left, where and when on the right. They are listed, not
 * advertised — co-authored means co-authored, and the note says what the
 * contribution actually was.
 */
export default function Publications({ lang = "en" }: { lang?: Lang }) {
  const { publications, ui } = bundle(lang);

  return (
    <section id="publications" className="sec pad">
      <div className="sec-h">
        <h2>{ui.publications.heading}</h2>
        <span className="aside">{ui.publications.aside}</span>
      </div>

      <div className="rrow-list mt-8">
        {publications.map((pub) => (
          <div className="rrow-wrap" key={pub.venue + pub.date}>
            <div className="rrow">
              <i className="not-italic">
                <span className="exp-co">{pub.venue}</span>
              </i>
              <span>
                <span className="rrow-role">{pub.title}</span>
                <span className="rrow-metric">
                  {pub.note}
                  {pub.link && (
                    <a className="ev-link" href={pub.link} target="_blank" rel="noopener noreferrer">
                      {ui.publications.read}
                    </a>
                  )}
                </span>
              </span>
              <time className="rrow-time">{pub.date}</time>
              <span />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
