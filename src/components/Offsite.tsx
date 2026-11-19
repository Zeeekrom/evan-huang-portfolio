import { bundle, type Lang } from "@/data/content";

/**
 * The last section, and deliberately not a call to action: the measured
 * original closes on who its author is away from work and puts the contact
 * block above it. A reader who gets this far has already decided whether to
 * write; what they are owed at the end is a person, not another button.
 *
 * Every line here is something Evan actually does, drawn from
 * content/community.json.
 */
export default function Offsite({ lang = "en" }: { lang?: Lang }) {
  const { offsite } = bundle(lang);

  return (
    <section id="offsite" className="sec pad">
      <div className="sec-h">
        <h2>{offsite.heading}</h2>
        <span className="aside">{offsite.aside}</span>
      </div>

      <ul className="offsite-list mt-8">
        {offsite.lines.map((line, i) => (
          <li key={i}>
            <span />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
