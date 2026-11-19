import type { Metadata } from "next";
import Terms from "@/components/Terms";
import { bundle, site } from "@/data/content";

const { terms } = bundle("en");

export const metadata: Metadata = {
  title: `${terms.heading} — ${site.name}`,
  description: terms.aside,
  alternates: {
    canonical: "/terms/",
    languages: {
      "en-AU": "/terms/",
      "zh-Hans": "/zh/terms/",
      "x-default": "/terms/",
    },
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <Terms lang="en" />;
}
