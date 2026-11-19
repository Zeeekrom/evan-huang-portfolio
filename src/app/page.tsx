import type { Metadata } from "next";
import Site from "@/components/Site";

/*
 * The English and Chinese pages point at each other, with `/` named as the
 * default: without x-default a crawler has to guess which one to show a
 * reader whose language is neither.
 *
 * This sits on the route rather than in the root layout because `alternates`
 * is inherited — a canonical declared up there would have told crawlers that
 * every other route is a duplicate of this one.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      "en-AU": "/",
      "zh-Hans": "/zh/",
      "x-default": "/",
    },
  },
};

export default function Home() {
  return <Site lang="en" />;
}
