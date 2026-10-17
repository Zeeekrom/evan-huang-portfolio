import type { MetadataRoute } from "next";
import { site } from "@/data/content";

/**
 * AI crawlers are named and allowed, not merely left unblocked.
 *
 * Search engines are the smaller half of this. When somebody asks an assistant
 * "who works on AI and data in Tasmania", the answer is drawn from what those
 * crawlers were allowed to read — and the deck is real text in real HTML, so
 * there is something worth reading. The cost of appearing there is this file.
 *
 * Named explicitly because several of these ignore a bare `User-agent: *` and
 * look for their own entry before deciding.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // None of these is content. The API rejects anything off its origin
        // allowlist anyway, and /admin shows nothing without a key — this just
        // keeps crawlers from wasting requests on them.
        disallow: ["/api/", "/_next/", "/admin"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin"],
      })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
