import type { MetadataRoute } from "next";
import { site } from "@/data/content";
import { anchors } from "@/slides/slides";

/**
 * The deck is one route, so a sitemap of routes would list two URLs and hide
 * sixty-four slides behind them.
 *
 * Each section is listed by its anchor instead. That only works because the
 * slides are real text in the exported HTML rather than pixels on a canvas — a
 * crawler following #tencent finds the Tencent card's actual words. The anchors
 * come from the same Slide[] everything else is generated from, so a new
 * project appears here without anyone remembering to add it.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: site.url,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/explore`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    /*
     * The Chinese summary. Listed as its own URL rather than as an alternate
     * of the homepage, because it is a shorter page with different wording —
     * an alternate claims the two are the same page in two languages, and
     * these are not. The hreflang pair in the two routes' metadata is what
     * says they are related.
     */
    {
      url: `${site.url}/zh`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...anchors.map(({ anchor }) => ({
      url: `${site.url}/explore${anchor}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    /*
     * The PDF is not listed. It is a release behind the resume Evan keeps,
     * and it contradicts this page on his standing — a crawler indexing it
     * would be indexing the wrong facts. The file stays where it is so old
     * links do not break; it is advertised again when it is rewritten.
     */
  ];
}
