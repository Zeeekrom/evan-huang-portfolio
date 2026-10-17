"use client";

/**
 * What is on the site right now, and where to change it.
 *
 * Everything here is read from the same bundle the site is built from, so it
 * cannot disagree with what is live — it is the deployed content, not a
 * description of it.
 *
 * Editing happens in Pages CMS against the repository. This does not try to be
 * an editor: a static page cannot write to a repository without holding a
 * token, and a token that can push to the repository is a far bigger thing to
 * keep in a browser than a read-only notes key.
 */

import {
  about,
  community,
  education,
  internshipHighlights,
  internships,
  positions,
  projects,
  publications,
  site,
  skillGroups,
  startups,
} from "@/data/content";
import { anchors, menu, slides } from "@/slides/slides";
import { itinerary } from "@/lib/tour";

const REPO = "Zeeekrom/evan-canvas-portfolio";
const CMS = "https://app.pagescms.org";

interface Collection {
  file: string;
  label: string;
  entries: string[];
  note?: string;
}

const COLLECTIONS: Collection[] = [
  {
    file: "projects.json",
    label: "Projects",
    entries: projects.map((p) => p.title),
    note: "Each makes 1 + ⌈bullets ÷ 2⌉ slides",
  },
  {
    file: "internships.json",
    label: "Internships",
    entries: internships.map((e) => `${e.org} — ${e.role}`),
  },
  {
    file: "internship-highlights.json",
    label: "Internship highlights",
    entries: internshipHighlights.map((h) => h.org),
    note: "The results on the internships summary card",
  },
  {
    file: "startups.json",
    label: "Ventures",
    entries: startups.map((e) => `${e.org} — ${e.role}`),
  },
  {
    file: "community.json",
    label: "Community",
    entries: community.map((c) => `${c.org} — ${c.role} (${c.status})`),
  },
  {
    file: "positions.json",
    label: "How I work with AI",
    entries: positions.map((p) => p.label),
    note: "Each position must link to work on the site",
  },
  {
    file: "publications.json",
    label: "Publications",
    entries: publications.map((p) => `${p.venue} · ${p.date}`),
  },
  {
    file: "education.json",
    label: "Education",
    entries: education.map((e) => `${e.school} — ${e.degree}`),
  },
  {
    file: "skills.json",
    label: "Skill groups",
    entries: skillGroups.map((g) => `${g.title} (${g.items.length})`),
  },
  {
    file: "about.json",
    label: "About",
    entries: [`${about.paragraphs.length} paragraphs`, `${about.facts.length} quick facts`],
    note: "The guide's only source on who Evan is",
  },
];

/** Mirrors gen-presenter.mjs, so the warning means what it says. */
const CATALOGUE_CHARS = 2000;

function bodyLength(id: string): number {
  const s = slides.find((x) => x.id === id);
  if (!s) return 0;
  const parts: string[] = [];
  const push = (v: string | undefined) => {
    if (v) parts.push(v);
  };
  push(s.title);
  push(s.subtitle);
  push(s.body);
  s.paragraphs?.forEach((p) => push(p));
  s.bullets?.forEach((b) => push(b));
  s.projectDetails?.forEach((g) => {
    push(g.title);
    g.items.forEach((i) => push(i));
  });
  return parts.join("\n").length;
}

export default function ContentOverview() {
  const stops = itinerary();
  // The guide may not say anything a slide does not contain, so a thin stop is
  // one where it has nothing to say.
  const thin = stops.filter((s) => bodyLength(s.slideId) < 150);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-current/15 p-4">
        <h2 className="mb-3 font-mono text-sm font-semibold">What is live right now</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          {[
            ["Slides", slides.length],
            ["Menu entries", menu.length],
            ["Anchor URLs", anchors.length],
            ["Tour stops", stops.length],
          ].map(([label, n]) => (
            <p key={String(label)} className="flex justify-between gap-2">
              <span className="opacity-60">{label}</span>
              <span className="font-mono">{n}</span>
            </p>
          ))}
        </div>
      </section>

      {thin.length > 0 && (
        <section className="rounded-lg border border-current/25 p-4 text-sm">
          <h2 className="mb-2 font-mono font-semibold">Worth a look</h2>
          <ul className="space-y-1 opacity-80">
            {thin.map((s) => (
              <li key={s.slideId}>
                Tour stop {stops.findIndex((x) => x.slideId === s.slideId) + 1} &ldquo;{s.label}&rdquo;
                has only {bodyLength(s.slideId)} characters — the guide has little to say there
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-55">
            The limit is {CATALOGUE_CHARS} characters. This is a content problem, not a code problem.
          </p>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-sm font-semibold">Content collections</h2>
          <a
            href={CMS}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-current/25 px-3 py-1 text-sm"
          >
            Edit in Pages CMS ↗
          </a>
        </div>

        <ul className="space-y-2">
          {COLLECTIONS.map((c) => (
            <li key={c.file} className="rounded-lg border border-current/15 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium">
                  {c.label}
                  <span className="ml-2 font-mono text-xs opacity-50">{c.file}</span>
                </h3>
                <a
                  href={`https://github.com/${REPO}/blob/main/content/${c.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline opacity-60"
                >
                  Edit on GitHub
                </a>
              </div>
              {c.note && <p className="mt-1 text-xs opacity-50">{c.note}</p>}
              <ul className="mt-2 space-y-0.5 text-sm opacity-80">
                {c.entries.map((e, i) => (
                  <li key={i} className="truncate">
                    {e}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-current/15 p-4 text-sm">
        <h2 className="mb-2 font-mono font-semibold">Using Pages CMS for the first time</h2>
        <ol className="list-decimal space-y-1 pl-5 opacity-80">
          <li>
            Open{" "}
            <a href={CMS} target="_blank" rel="noreferrer" className="underline">
              app.pagescms.org
            </a>{" "}
            and sign in with GitHub
          </li>
          <li>
            Grant access to <code className="font-mono text-xs">{REPO}</code> (not the public mirror)
          </li>
          <li>
            It reads <code className="font-mono text-xs">.pages.yml</code> at the root, and the forms
            appear
          </li>
        </ol>
        <p className="mt-2 text-xs opacity-55">
          Edits commit to the repository, and CI checks and deploys them. A bad edit is one git revert
          away.
        </p>
      </section>

      <section className="flex flex-wrap gap-x-5 gap-y-2 text-sm opacity-70">
        {[
          ["Live homepage", site.url],
          ["Canvas", `${site.url}/explore/`],
          ["Repository", `https://github.com/${REPO}`],
          ["Deployments", `https://github.com/${REPO}/actions`],
        ].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="underline">
            {label} ↗
          </a>
        ))}
      </section>
    </div>
  );
}
