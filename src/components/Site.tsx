import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Cases from "@/components/Cases";
import Ahead from "@/components/Ahead";
import Values from "@/components/Values";
import Offsite from "@/components/Offsite";
import Guide from "@/components/Guide";
import Reveal from "@/components/Reveal";
import Publications from "@/components/Publications";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { bundle, type Lang } from "@/data/content";

/**
 * The page, in one language.
 *
 * Both routes render this. That is the whole design: /zh was a separate
 * 310-line page with its own layout and about a third of the sections, and it
 * drifted from the English one exactly as the old note predicted it would.
 * Two routes over one component tree can differ in their words and in nothing
 * else, and `assertParity` in data/parity.ts holds the words themselves row
 * for row.
 *
 * The guide is the one thing that is still English only. Its catalogue is
 * scraped from the exported English canvas, so a Chinese page carrying an
 * English-speaking guide would be worse than a Chinese page carrying none —
 * `ui.notice` says so at the top instead of letting a reader find out by
 * asking it something.
 *
 * `lang` goes on the wrapper rather than on <html>: the root layout is shared
 * by every route and a static export has no place to vary it. A `lang` on the
 * subtree is what a screen reader reads for voice selection, so the page is
 * announced correctly either way.
 */
export default function Site({ lang }: { lang: Lang }) {
  const { ui } = bundle(lang);

  return (
    /*
     * The `zh` class is the layout adjustment the second language needs and
     * the English page must not get: CJK wants more leading and no negative
     * tracking, and it breaks between any two characters rather than at
     * spaces. The rules are in globals.css under `.zh`.
     */
    <div
      lang={lang === "zh" ? "zh-Hans" : "en-AU"}
      className={`flex-1 flex flex-col${lang === "zh" ? " zh" : ""}`}
    >
      <Nav lang={lang} />
      <main className="flex-1">
        <Hero lang={lang} />
        {ui.notice && (
          <p className="pad site-notice" role="note">
            {ui.notice}
          </p>
        )}
        <About lang={lang} />
        <Skills lang={lang} />
        <Projects lang={lang} />
        <Cases lang={lang} />
        <Ahead lang={lang} />
        <Values lang={lang} />
        <Experience lang={lang} />
        <Publications lang={lang} />
        <Contact lang={lang} />
        <Offsite lang={lang} />
      </main>
      <Footer lang={lang} />
      {lang === "en" && <Guide />}
      <Reveal />
    </div>
  );
}
