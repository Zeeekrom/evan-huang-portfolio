/**
 * Semantic DOM renderer — renderer #1 of two (docs/ARCHITECTURE.md).
 *
 * This is the layer that search engines, screen readers, AI crawlers and
 * no-JavaScript visitors actually consume. It renders the same Slide[] that the
 * PixiJS canvas will render, so the two can never drift apart.
 *
 * Deliberately a server component: it must exist in the exported HTML, not be
 * assembled at runtime.
 */

import { parseLayoutId, t, type Slide, type SlideLink, type Text } from "@/slides/types";
import { menu, slides } from "@/slides/slides";
import { site } from "@/data/content";

/* ------------------------------------------------------------------ helpers */

/**
 * Render `title` with `highlight` wrapped in <em>. Falls back to the plain
 * title when the highlight is not a verbatim substring, so a bad highlight can
 * never corrupt the heading.
 */
function Highlighted({ title, highlight }: { title: Text; highlight?: Text }) {
  const mark = t(highlight);
  const at = mark ? title.indexOf(mark) : -1;

  if (at === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, at)}
      <em className="font-serif italic">{mark}</em>
      {title.slice(at + mark.length)}
    </>
  );
}

/** Mirrors the canvas link router (docs/ARCHITECTURE.md) into real anchors. */
function slideHref(url: string): string {
  if (url.startsWith("slide://")) return `#${url.slice("slide://".length)}`;
  if (/^\d+$/.test(url)) return `#slide-${url}`;
  return url;
}

function isExternal(url: string): boolean {
  return !url.startsWith("slide://") && !url.startsWith("#") && !/^\d+$/.test(url);
}

function LinkList({ links }: { links: SlideLink[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {links.map((l, i) => {
        const href = slideHref(l.url);
        const external = isExternal(l.url) && !l.url.startsWith("mailto:");
        return (
          <li key={i}>
            <a
              href={href}
              className="underline underline-offset-4 hover:no-underline"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {l.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------- slide */

function SlideArticle({ slide, index }: { slide: Slide; index: number }) {
  const { base, theme } = parseLayoutId(slide.layoutId);
  const heading = t(slide.title);

  /*
   * Index slides carry both `bullets` and `links` because the canvas draws the
   * label text and the hit area separately. In the DOM the links already render
   * those labels, so emitting the bullets too would duplicate every entry.
   */
  const linkLabels = new Set((slide.links ?? []).map((l) => l.text));
  const bulletsAreLinks =
    !!slide.bullets?.length && slide.bullets.every((b) => linkLabels.has(b));
  const bullets = bulletsAreLinks ? undefined : slide.bullets;

  return (
    <article
      id={slide.id}
      aria-label={heading || `Slide ${index + 1}`}
      data-layout={base}
      data-theme={theme}
      data-slide-index={index}
      className="scroll-mt-24 border-t border-black/10 py-10 dark:border-white/10"
    >
      <header>
        {slide.intro && (
          <p className="text-xs uppercase tracking-[0.18em] opacity-60">{slide.intro}</p>
        )}
        {heading && (
          <h2 className="mt-2 text-balance text-2xl font-medium leading-snug sm:text-3xl">
            <Highlighted title={heading} highlight={slide.highlightText} />
          </h2>
        )}
        {slide.subtitle && <p className="mt-1 text-sm opacity-70">{slide.subtitle}</p>}
      </header>

      {slide.body && <p className="mt-4 max-w-2xl leading-relaxed opacity-90">{slide.body}</p>}

      {slide.paragraphs?.map((p, i) => (
        <p key={i} className="mt-4 max-w-2xl leading-relaxed opacity-90">
          {p}
        </p>
      ))}

      {bullets && bullets.length > 0 && (
        <ul className="mt-4 max-w-2xl list-disc space-y-2 pl-5 leading-relaxed opacity-90">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      {slide.projectDetails && (
        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {slide.projectDetails.map((g, i) => (
            <div key={i}>
              <dt className="text-xs uppercase tracking-[0.14em] opacity-55">{g.title}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed opacity-90">{g.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      )}

      {slide.testimonials?.map((q, i) => (
        <figure key={i} className="mt-6 max-w-2xl border-l-2 border-current/20 pl-4">
          <blockquote className="italic leading-relaxed">{q.quote}</blockquote>
          <figcaption className="mt-2 text-sm opacity-65">
            {q.name}
            {q.company ? ` — ${q.company}` : ""}
          </figcaption>
        </figure>
      ))}

      {slide.image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={slide.image}
          alt={heading}
          loading="lazy"
          className="mt-6 max-w-full rounded-lg"
        />
      )}

      {slide.images?.map((im, i) => (
        <figure key={i} className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.src} alt={t(im.caption)} loading="lazy" className="max-w-full rounded-lg" />
          {im.caption && <figcaption className="mt-2 text-sm opacity-65">{im.caption}</figcaption>}
        </figure>
      ))}

      {slide.links && slide.links.length > 0 && <LinkList links={slide.links} />}
    </article>
  );
}

/* --------------------------------------------------------------------- deck */

export default function SemanticDeck() {
  const summary = slides.find((s) => s.id === "who-am-i");

  return (
    /*
     * `data-deck` is the hook globals.css uses to visually hide this tree once
     * the canvas mounts. It is never removed from the DOM: crawlers, screen
     * readers and no-JS visitors read exactly this markup.
     */
    <main data-deck className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {site.name} — Work &amp; Experience
      </h1>

      <section aria-label={`About ${site.name}`} className="mt-5">
        <p className="max-w-2xl leading-relaxed opacity-90">{t(summary?.paragraphs?.[0])}</p>
      </section>

      <nav aria-label="Portfolio sections" className="mt-8">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {menu.map((m) => (
            <li key={m.slideId} className={m.indent ? "opacity-60" : "font-medium"}>
              <a href={`#${m.slideId}`} className="hover:underline underline-offset-4">
                {m.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div role="feed" aria-label="Portfolio Slides" aria-busy="false" className="mt-10">
        {slides.map((s, i) => (
          <SlideArticle key={s.id} slide={s} index={i} />
        ))}
      </div>
    </main>
  );
}
