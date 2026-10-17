import type { Metadata } from "next";
import ExploreShell from "@/components/explore/ExploreShell";
import SemanticDeck from "@/components/explore/SemanticDeck";
import { site } from "@/data/content";
import { slides } from "@/slides/slides";

export const metadata: Metadata = {
  title: `${site.name} — Explore`,
  description:
    "An explorable map of Evan Huang's projects, internships, research and skills — structured slides that render both as accessible HTML and as an interactive canvas.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: `${site.name} — Explore`,
    description: `${slides.length} slides covering projects, experience, research and education.`,
    url: "/explore",
    type: "website",
  },
};

/**
 * Runs during parse, before the deck below it is painted.
 *
 * React cannot do this job: by the time it has hydrated, resolved the dynamic
 * import and initialised WebGL, the raw deck has already been on screen for
 * seconds. Only a synchronous script beats first paint.
 *
 * The watchdog matters as much as the hiding. Without it a visitor whose
 * browser cannot start WebGL would sit in front of a loading screen for ever;
 * dropping the attribute hands them the readable HTML version instead.
 */
const BOOT = `(function(){var d=document.documentElement;var t=null;
try{t=localStorage.getItem('explore-theme')}catch(e){}
d.dataset.theme=(t==='light'||t==='dark')?t:'dark';
d.dataset.canvas='on';
setTimeout(function(){if(d.dataset.canvas!=='ready'){delete d.dataset.canvas}},8000)})()`;

/**
 * Two renderers over one Slide[] (docs/ARCHITECTURE.md):
 *   SemanticDeck — always in the exported HTML. SEO, screen readers, no-JS.
 *   ExploreShell — theme owner; mounts the canvas and its chrome over the top
 *                  once WebGL is available.
 */
export default function ExplorePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />

      {/*
        Server-rendered so it exists in the very first paint. CSS keeps it
        invisible unless the boot script confirmed JavaScript is running.
      */}
      <div id="explore-loader" role="status" aria-live="polite">
        <p className="loader-name">{site.name}</p>
        <div className="loader-track">
          <div className="loader-fill" id="explore-loader-fill" />
        </div>
        <p className="loader-count" id="explore-loader-count">
          preparing
        </p>
      </div>

      <ExploreShell />
      <SemanticDeck />
    </>
  );
}
