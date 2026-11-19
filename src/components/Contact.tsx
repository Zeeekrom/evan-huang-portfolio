import { bundle, site, type Lang } from "@/data/content";

/**
 * Connect, rebuilt as the reference has it: a full-bleed dark band with the
 * invitation set large, its second line in gold, and a row of solid colour
 * pills under it.
 *
 * The first build made this a white plate with outlined pills, which read as
 * a form someone forgot to fill in. A band stops the page rather than ending
 * it politely, and the colours make each destination a different object
 * instead of four identical buttons.
 *
 * The heading is an invitation, not the word "Contact": a label asks to be
 * skipped, an invitation asks to be answered.
 */

/* Built per language: only the first label is written rather than addressed. */
const pills = (resume: string) => [
  // The PDF is out of date and is being rewritten; until it is, this
  // sends people to the profile Evan actually keeps current. The label
  // says where it goes, because a button marked PDF that opens a
  // website is the same broken promise as a dead "Live" link.
  { label: resume, href: site.linkedin, tone: "is-paper", external: true },
  { label: site.email, href: `mailto:${site.email}`, tone: "", colour: "--c2-fill" },
  { label: "LinkedIn", href: site.linkedin, tone: "", colour: "--c4-fill" },
  { label: "GitHub", href: site.github, tone: "", colour: "--c5-fill" },
];

export default function Contact({ lang = "en" }: { lang?: Lang }) {
  const { contact, ui } = bundle(lang);
  const PILLS = pills(ui.contact.resume);
  /*
   * The first word is set apart from the rest. English splits on a space;
   * Chinese has none, so the whole invitation is set as one phrase rather
   * than cut after an arbitrary character.
   */
  const [lead, ...rest] = lang === "zh" ? ["", contact.heading] : contact.heading.split(" ");

  return (
    <section id="contact" className="sec">
      <div className="connect-band">
        <div className="pad">
          <h2 className="connect-h">
            {lead} <em>{rest.join(" ")}</em>
          </h2>
          <p className="connect-p">{contact.subheading}</p>

          <div className="connect-links">
            {PILLS.map((pill) => (
              <a
                key={pill.label}
                className={pill.tone ? `lk ${pill.tone}` : "lk"}
                style={pill.colour ? { background: `var(${pill.colour})` } : undefined}
                href={pill.href}
                target={pill.href.startsWith("http") ? "_blank" : undefined}
                rel={pill.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {pill.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
