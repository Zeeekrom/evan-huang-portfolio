import { ImageResponse } from "next/og";
import { hero, site } from "@/data/content";

/**
 * Share preview, generated at build time.
 *
 * Applies to every route under app/, so /explore inherits it. Generated rather
 * than drawn so the wording stays tied to the site: the opening sentence lives
 * in content/hero.json, and the card that turns up on LinkedIn changes with it.
 *
 * It used to be drawn in the canvas's near-black, with a tagline of three job
 * titles — a card for a site that no longer exists. It now carries the page's
 * own palette and its own opening line, so following the link is not a
 * surprise.
 */

/** Required for a static export: the image is rendered once at build time. */
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${hero.statement.lead}`;

// The page's own tokens (src/app/globals.css).
const PAPER = "#f6f3ea";
const INK = "#14241e";
const MUTED = "#5b6662";
const BAND = "#14432f";
const ACCENT = "#c2410c";
const GOLD = "#e8a317";

export default function Image() {
  const [first, ...rest] = hero.trajectory;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 76px 0" }}>
          <span
            style={{
              fontSize: 21,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: MUTED,
              display: "flex",
            }}
          >
            {site.name} · {site.location}
          </span>

          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: INK,
              letterSpacing: -2.6,
              lineHeight: 1.04,
              marginTop: 34,
              display: "flex",
            }}
          >
            {hero.statement.lead}
          </span>

          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: ACCENT,
              letterSpacing: -2.6,
              lineHeight: 1.04,
              marginTop: 6,
              display: "flex",
            }}
          >
            {hero.statement.pivot} {hero.statement.swap[0]}
          </span>

          <span style={{ fontSize: 28, color: MUTED, marginTop: 30, display: "flex" }}>
            {[first, ...rest].join("  →  ")}.
          </span>
        </div>

        {/* The band is the page's footer, and it carries the numbers. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: BAND,
            padding: "24px 64px",
          }}
        >
          {/* Two numbers, not three: a third wrapped the band and pushed the
              address off the right edge. */}
          <span style={{ fontSize: 22, color: GOLD, letterSpacing: 1.4, display: "flex", whiteSpace: "nowrap" }}>
            {hero.metrics.slice(0, 2).join("  ·  ")}
          </span>
          <span style={{ fontSize: 20, color: "#a9c2b9", display: "flex", whiteSpace: "nowrap" }}>
            {site.url.replace("https://", "")}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
