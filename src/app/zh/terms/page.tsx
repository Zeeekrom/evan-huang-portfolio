import type { Metadata } from "next";
import Terms from "@/components/Terms";
import { bundle, site } from "@/data/content";

const { terms } = bundle("zh");

export const metadata: Metadata = {
  title: `${terms.heading} — ${site.name}`,
  description: terms.aside,
  alternates: {
    canonical: "/zh/terms/",
    languages: {
      "en-AU": "/terms/",
      "zh-Hans": "/zh/terms/",
      "x-default": "/terms/",
    },
  },
  robots: { index: true, follow: true },
};

export default function ZhTermsPage() {
  return <Terms lang="zh" />;
}
