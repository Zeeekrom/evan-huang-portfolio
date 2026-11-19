import { bundle, type Lang } from "@/data/content";

/**
 * The canvas deck lives on as a link from here, which is the demotion the
 * spec settled on (§7.3, option a): the persuading is done by this page, and
 * the thing built to show off is one line at the bottom for whoever is
 * curious enough to click it.
 *
 * The other line used to advertise the toolchain — built with X, deployed on
 * Y — which tells a reader nothing they came for. What belongs at the foot of
 * a page is who owns the work and where the terms are, so that is what is
 * there now.
 */
export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const { footer, ui } = bundle(lang);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8">
      <div className="pad flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <p>
          © {year} {ui.brand.name}. {footer.rights}.
        </p>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono">
          <a href="/explore/" className="hover:text-foreground transition-colors">
            {ui.footer.explore}
          </a>
          <span aria-hidden>·</span>
          <a
            href={lang === "zh" ? "/zh/terms/" : "/terms/"}
            className="hover:text-foreground transition-colors"
          >
            {footer.terms}
          </a>
        </p>
      </div>
    </footer>
  );
}
