import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/data/content";

/*
 * No webfonts, by decision (spec §2.3). System faces mean the first paint is
 * already the final one: no reflow, no flash, nothing to download before the
 * page reads correctly.
 */

export const metadata: Metadata = {
  /*
   * Without this, Open Graph image paths stay relative and a share preview has
   * nothing to fetch — the card renders blank on every platform.
   */
  metadataBase: new URL(site.url),
  title: `${site.name} — Applied AI Agent Engineer`,
  description:
    "Portfolio of Evan Huang — five industry internships across AI workflows, game systems and developer tooling, now studying Information Technology and Systems in Hobart, Tasmania.",
  openGraph: {
    title: `${site.name} — Applied AI Agent Engineer`,
    description:
      "An explorable map of his work, with a guide you can ask out loud.",
    url: site.url,
    siteName: `${site.name} Portfolio`,
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      /*
       * The explore route's boot script stamps data-theme and data-canvas onto
       * this element before React runs, which is the whole point of it — it has
       * to beat first paint. React would otherwise report the resulting
       * attribute difference as a hydration mismatch on every load.
       */
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
