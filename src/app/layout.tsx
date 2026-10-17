import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/data/content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /*
   * Without this, Open Graph image paths stay relative and a share preview has
   * nothing to fetch — the card renders blank on every platform.
   */
  metadataBase: new URL(site.url),
  title: `${site.name} — AI & Data, Software Systems, Interactive Technology`,
  description:
    "Portfolio of Evan Huang — four industry internships across AI workflows, game systems and developer tooling, now studying Information Technology and Systems in Hobart, Tasmania.",
  openGraph: {
    title: `${site.name} — AI & Data, Software Systems, Interactive Technology`,
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
