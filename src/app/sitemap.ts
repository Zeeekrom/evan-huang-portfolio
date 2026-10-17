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
    ...anchors.map(({ anchor }) => ({
      url: `${site.url}/explore${anchor}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    {
      url: `${site.url}${site.resumeFile}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];
}
