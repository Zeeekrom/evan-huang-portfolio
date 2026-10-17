import { ImageResponse } from "next/og";
import { site } from "@/data/content";

/**
 * Share preview, generated at build time.
 *
 * Applies to every route under app/, so /explore inherits it. Generated rather
 * than drawn so the wording stays tied to the site: change the tagline in one
 * place and the card that shows up on LinkedIn changes with it.
 *
 * The faint grid is the actual world — nine columns of cards — at a size where
 * it reads as texture. Anyone who follows the link recognises it a second later.
 */

/** Required for a static export: the image is rendered once at build time. */
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — an explorable map of his work`;

// Matches the canvas: near-black cards on a grey table (docs/ARCHITECTURE.md).
const SURFACE = "#1c1c1c";
const CARD = "#141414";
const RULE = "#2f2f2f";
const TEXT = "#ffffff";
const MUTED = "#a3a3a3";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: SURFACE,
          padding: "68px 76px",
          position: "relative",
        }}
      >
        {/* The world, reduced to texture. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 26,
            opacity: 0.5,
            transform: "rotate(-4deg) scale(1.25)",
          }}
        >
          {[0, 1, 2, 3].map((row) => (
            <div key={row} style={{ display: "flex", gap: 26 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
                <div
                  key={col}
                  style={{
                    width: 178,
                    height: 106,
                    background: CARD,
                    border: `2px solid ${RULE}`,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Everything below sits above the texture. */}
        <div style={{ display: "flex", position: "relative" }}>
          <span
            style={{
              fontSize: 21,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {site.location}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <span style={{ fontSize: 116, fontWeight: 600, color: TEXT, letterSpacing: -2 }}>
            {site.name}
          </span>
          <span style={{ fontSize: 39, color: MUTED, marginTop: 14 }}>
            AI &amp; Data · Software Systems · Interactive Technology
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 25, color: TEXT }}>
            An explorable map of his work — ask it out loud.
          </span>
          <span style={{ fontSize: 22, color: MUTED }}>{site.url.replace("https://", "")}</span>
        </div>
      </div>
    ),
    size,
  );
}
