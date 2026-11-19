import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { bundle, type Lang } from "@/data/content";

/**
 * The page the footer's copyright line points at, in one language.
 *
 * Four blocks, in the order a reader needs them: what is mine, what you may
 * not do with it, what is borrowed and therefore not mine to restrict, and
 * what the site records about the person reading it. The last one is written
 * from what the code actually does — no cookies, no analytics, no webfonts,
 * what Cloudflare adds at the edge, two things in localStorage, two outbound
 * calls the reader starts — rather than from the boilerplate every site
 * carries.
 *
 * It says on its face that no lawyer has read it. Publishing terms drafted
 * with AI and letting them look like advice would be the dishonest version.
 *
 * Both routes render this, for the same reason both routes render Site: terms
 * that drift between languages are worse than terms in one language, because
 * two readers would be told different things and only one of them would be
 * right. `assertParity` holds them row for row.
 */
export default function Terms({ lang }: { lang: Lang }) {
  const { terms } = bundle(lang);
  const home = lang === "zh" ? "/zh/" : "/";

  return (
    <div
      lang={lang === "zh" ? "zh-Hans" : "en-AU"}
      className={`flex-1 flex flex-col${lang === "zh" ? " zh" : ""}`}
    >
      <Nav lang={lang} />
      <main className="flex-1">
        <section className="sec pad terms-top">
          <div className="sec-h">
            <h2>{terms.heading}</h2>
            <span className="aside">{terms.aside}</span>
          </div>

          <p className="scope mt-5">
            {terms.updated} · {terms.notice}
          </p>

          <div className="terms-body mt-9">
            {terms.sections.map((block) => (
              <section key={block.heading} className="terms-block">
                <h3>{block.heading}</h3>
                {block.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-9">
            {/* Plain anchor — see the note in LangSwitch. The rule that used to
                need silencing here does not fire on a computed href. */}
            <a className="lk" href={home}>
              {terms.backLabel}
            </a>
          </p>
        </section>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
