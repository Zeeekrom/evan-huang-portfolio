import type { Metadata } from "next";
import Site from "@/components/Site";
import { bundle, site } from "@/data/content";

/**
 * The Chinese page.
 *
 * It used to be a summary: its own layout, its own 310 lines of JSX, and
 * about a third of the sections the English page carries. That was a
 * deliberate choice and it was the wrong one — a reader arriving in Chinese
 * got a smaller site, and the two drifted apart exactly as the note on the
 * old `zh` export predicted.
 *
 * There is no second page now. This route renders the same component tree as
 * `/` with the other content set behind it, so the only thing that differs is
 * the words — see components/Site.tsx and data/parity.ts.
 */

const { ui } = bundle("zh");

export const metadata: Metadata = {
  title: ui.meta.title,
  description: ui.meta.description,
  alternates: {
    canonical: "/zh/",
    languages: {
      "en-AU": "/",
      "zh-Hans": "/zh/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: ui.meta.title,
    description: ui.meta.description,
    url: `${site.url}/zh/`,
    siteName: site.legalName,
    locale: "zh_CN",
    type: "website",
  },
};

export default function ZhPage() {
  return <Site lang="zh" />;
}
