/**
 * Slide deck, derived from src/data/content.ts.
 *
 * Nothing here is hand-positioned and almost nothing is hand-written: slides are
 * generated from the structured content that already powers the classic site.
 * Adding a project to content.ts adds its slides here automatically, and
 * grid.ts assigns world coordinates from the index (docs/ARCHITECTURE.md).
 */

import {
  COMMUNITY_STATUS,
  POSITION_ORIGIN,
  about,
  community,
  contact,
  education,
  internshipHighlights,
  internships,
  positions,
  projects,
  publications,
  site,
  skillGroups,
  startups,
  type ExperienceItem,
  type Project,
} from "@/data/content";
import { layoutId, type MenuEntry, type Slide } from "./types";

/* ---------------------------------------------------------------- vocabulary */

const L = {
  openRepo: "Open repository ↗",
  getToKnowMe: "Get to know me",
  howIWork: "How I work with AI",
  myWork: "My work",
  experience: "Experience",
  internshipsChina: "Industry internships in China",
  research: "Research",
  education: "Education",
  resume: "Résumé",
  reachOut: "Reach out",
  stack: "Stack",
  whatIDid: "What I did",
  skills: "Capabilities",
  currentFocus: "Current focus",
  peoplePlace: "People & place",
  seeTheWork: "See the work ↗",
} as const;

/* ------------------------------------------------------------------ builders */

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/** Split a long bullet list into content slides of at most `per` bullets. */
function chunk<T>(items: T[], per: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += per) out.push(items.slice(i, i + per));
  return out;
}

/**
 * A project opens on one slide, not three.
 *
 * It used to be a cover, an intro and a details card. The cover and the intro
 * carried the same title and the same description, and the cover's only
 * unique content was a link to the slide immediately after it; the details
 * card repeated the title a third time to show a period that was already the
 * intro's kicker. Three cards, one card's worth of information, and a visitor
 * paging through met the same sentence twice before reaching anything new.
 *
 * What is left says what the project is, when it was, what it was built with
 * and where the code lives.
 */
function projectSlides(p: Project): Slide[] {
  const out: Slide[] = [];
  const dark = p.featured === true;

  out.push({
    id: p.slug,
    layoutId: layoutId({ base: "project-intro", theme: dark ? "dark" : "light" }),
    intro: p.period,
    title: p.title,
    body: p.description,
    projectDetails: p.tags.length ? [{ title: L.stack, items: p.tags }] : undefined,
    anchor: `#${p.slug}`,
    links: p.link ? [{ text: L.openRepo, url: p.link }] : undefined,
  });

  chunk(p.bullets, 2).forEach((group, i) => {
    out.push({
      id: `${p.slug}-highlight-${i + 1}`,
      layoutId: layoutId({ base: "project-content", theme: dark ? "dark" : "light" }),
      intro: L.whatIDid,
      title: p.title,
      bullets: group,
    });
  });

  return out;
}

/** The four in China are told as one run of work; anything local stands on its own. */
const inChina = (e: ExperienceItem) => e.location === "China";

/** When it was, what kind of work, and where — the line under the org name. */
function orgMeta(e: ExperienceItem): string {
  return [e.period, e.type ?? "", e.location ?? ""].filter(Boolean).join(" · ");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Dec 2025" as a sortable month count. Null for anything else, "Present" included. */
function monthOf(s: string): number | null {
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(s);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  return m && month >= 0 ? Number(m[2]) * 12 + month : null;
}

/**
 * First start to last finish across "Mon YYYY – Mon YYYY" periods.
 *
 * Null if any period is written another way, so an unusual date leaves the
 * span off the card rather than misstating it.
 */
function span(periods: string[]): string | null {
  const pairs = periods.map((p) => p.split("–").map((s) => s.trim()));
  if (pairs.some((p) => p.length !== 2 || monthOf(p[0]) === null || monthOf(p[1]) === null)) {
    return null;
  }
  const first = pairs.map((p) => p[0]).sort((a, b) => monthOf(a)! - monthOf(b)!)[0];
  const last = pairs.map((p) => p[1]).sort((a, b) => monthOf(b)! - monthOf(a)!)[0];
  return `${first} – ${last}`;
}

/**
 * An employer gets its content slides and nothing else.
 *
 * There used to be a cover and a details card in front of them. The cover was
 * the complaint that started this: a company name set large, a role, a date
 * range, and the rest of the card empty. The details card behind it listed
 * that same role and that same date range as a table. Neither said anything
 * the other did not.
 *
 * The identity rides on the first slide that has something to show instead —
 * which also puts `location` on screen, having sat in the content unused.
 */
function experienceSlides(e: ExperienceItem, prefix: string): Slide[] {
  const id = `${prefix}-${slug(e.org)}`;
  const groups = chunk(e.bullets, 2);

  // Nothing to say about it yet. One slide rather than none, so the menu entry
  // and the anchor still lead somewhere.
  if (!groups.length) {
    return [
      {
        id: `${id}-work-1`,
        layoutId: layoutId({ base: "project-content", theme: "light" }),
        intro: e.role,
        title: e.org,
        body: orgMeta(e),
        anchor: `#${id}`,
      },
    ];
  }

  return groups.map((group, i) => ({
    id: `${id}-work-${i + 1}`,
    layoutId: layoutId({ base: "project-content", theme: "light" }),
    intro: e.role,
    title: e.org,
    // Only the first card introduces the employer; the rest carry on from it.
    ...(i === 0 ? { body: orgMeta(e), anchor: `#${id}` } : {}),
    bullets: group,
  }));
}

/**
 * The internships, told as one run of work.
 *
 * Four short internships listed as four equal entries read as someone moving
 * on every few months. One card names the span, carries the results that weigh
 * the most, and links to each placement — every detail is still a tap away,
 * but the first impression is the work rather than the churn.
 */
function internshipsSummarySlide(): Slide {
  const china = internships.filter(inChina);
  const when = span(china.map((e) => e.period));

  return {
    id: "internships-china",
    layoutId: layoutId({ base: "project-content", theme: "light" }),
    intro: L.experience,
    title: L.internshipsChina,
    body: [`${china.length} internships`, when].filter(Boolean).join(" · "),
    bullets: internshipHighlights.map((h) => `${h.org} — ${h.bullet}`),
    links: china.map((e) => ({ text: e.org, url: `slide://work-${slug(e.org)}-work-1` })),
    anchor: "#internships-china",
  };
}

/**
 * Volunteering and community involvement.
 *
 * Its own section rather than a line in the résumé, because what someone does
 * when nobody is paying them is a different kind of fact — and in Tasmania it
 * is one employers actively look for.
 *
 * Every card shows its status in the body, not only its dates. A reader who
 * skims "Aug 2026 – Present" on a role that has not begun would take away
 * something untrue, and the dates alone cannot stop them.
 */
function communitySlides(): Slide[] {
  const out: Slide[] = [];

  out.push({
    id: "people-place",
    layoutId: layoutId({ base: "index", theme: "dark" }),
    intro: L.peoplePlace,
    // Evan's own words, from a post about the day he volunteered at the
    // Festival of Bright Ideas. A heading written here would have been a guess
    // at why he does this; this is the reason he gave.
    title: "Not only studying technology here",
    body: "Since coming to Tasmania, one thing I have been trying to do is not only study technology here, but also understand and become part of the local technology community.",
    bullets: community.map((c) => `${c.org} — ${c.role}`),
    links: community.map((c) => ({ text: c.org, url: `slide://${c.id}` })),
    anchor: "#people-place",
  });

  for (const item of community) {
    out.push({
      id: item.id,
      layoutId: layoutId({ base: "project-content", theme: "dark" }),
      intro: item.role,
      title: item.org,
      body: `${item.period} · ${item.location} · ${item.field} · ${COMMUNITY_STATUS[item.status]}`,
      bullets: [...item.bullets],
      links: item.evidence.map((slug) => ({ text: L.seeTheWork, url: `slide://${slug}` })),
    });
  }

  return out;
}

/**
 * How he works with AI: an index, then one card per position.
 *
 * Each card says where the position came from and links to the work that
 * shows it. The links are the point — a stated view is worth what a visitor
 * finds when they follow it. Their wording is left empty here and filled in
 * from the slide each one lands on (settleLinks), which does not exist yet.
 */
function positionSlides(): Slide[] {
  const out: Slide[] = [
    {
      id: "how-i-work",
      layoutId: layoutId({ base: "index", theme: "dark" }),
      title: L.howIWork,
      bullets: positions.map((p) => p.label),
      links: positions.map((p) => ({ text: p.label, url: `slide://position-${p.id}` })),
      anchor: "#how-i-work",
    },
  ];

  for (const p of positions) {
    out.push({
      id: `position-${p.id}`,
      layoutId: layoutId({ base: "project-content", theme: "dark" }),
      intro: POSITION_ORIGIN[p.origin],
      title: p.label,
      body: p.claim,
      links: p.evidence.map((id) => ({ text: "", url: `slide://${id}` })),
    });
  }

  return out;
}

/**
 * Resolve every in-canvas link against the finished deck.
 *
 * A link to a slide that is not there does nothing when tapped, and nothing
 * else would notice: take a project off the site and every card that pointed
 * at it goes quietly dead. So an unresolved link fails the build.
 *
 * A link written with no wording takes the title of the slide it lands on.
 */
function settleLinks(deck: Slide[]): Slide[] {
  const byId = new Map(deck.map((s) => [s.id, s]));
  for (const s of deck) {
    for (const link of s.links ?? []) {
      if (!link.url.startsWith("slide://")) continue;
      const target = byId.get(link.url.slice("slide://".length));
      if (!target) {
        throw new Error(`slide "${s.id}" links to ${link.url}, which is not in the deck`);
      }
      if (!link.text) link.text = `${target.title ?? target.id} ↗`;
    }
  }
  return deck;
}

/* ---------------------------------------------------------------- assembly */

function buildSlides(): Slide[] {
  const deck: Slide[] = [];

  /* — opening ————————————————————————————————————————————— */

  deck.push({
    id: "intro",
    layoutId: layoutId({ base: "hero", theme: "dark" }),
    title: site.name,
    // His LinkedIn title, less "Cybersecurity". Nothing on the site shows that
    // work yet, and the title is the one claim every visitor reads — a skill
    // named here with no card behind it is the first thing a sceptic checks.
    subtitle: "Applied AI Agent Engineer · Data Business Analytics · Interactive & Game Dev",
    highlightText: "AI Agent",
    links: [{ text: "Explore ↓", url: "slide://main-menu" }],
    anchor: "#home",
  });

  deck.push({
    id: "main-menu",
    layoutId: layoutId({ base: "index", theme: "dark" }),
    title: "Explore",
    bullets: [L.getToKnowMe, L.howIWork, L.myWork, L.experience, L.resume, L.reachOut],
    links: [
      { text: L.getToKnowMe, url: "slide://who-am-i" },
      { text: L.howIWork, url: "slide://how-i-work" },
      { text: L.myWork, url: "slide://projects-index" },
      { text: L.experience, url: "slide://experience-index" },
      { text: L.resume, url: site.resumeFile },
      { text: L.reachOut, url: "slide://contact" },
    ],
  });

  deck.push({
    id: "who-am-i",
    layoutId: layoutId({ base: "about", theme: "dark" }),
    intro: L.getToKnowMe,
    title: "I work between technology and the people who use it",
    highlightText: "the people who use it",
    paragraphs: about.paragraphs,
    anchor: "#about",
  });

  deck.push({
    id: "current-focus",
    layoutId: layoutId({ base: "statement", theme: "dark" }),
    intro: L.currentFocus,
    paragraphs: about.paragraphs.slice(2),
  });

  // Straight after who he is: how he works, each view tied to the work further
  // on that shows it.
  deck.push(...positionSlides());

  // Before the evidence sections: this is part of who he is, not a credential.
  deck.push(...communitySlides());

  // Four groups to a card. Seven on one card ran the third row of skills off
  // the bottom edge, and shrinking them would put this card's type scale out of
  // step with every other card's.
  chunk(skillGroups, 4).forEach((groups, i) =>
    deck.push({
      id: i === 0 ? "capabilities" : `capabilities-${i + 1}`,
      layoutId: layoutId({ base: "project-details", theme: "dark" }),
      intro: L.skills,
      title: "What I work with",
      projectDetails: groups.map((g) => ({ title: g.title, items: g.items })),
      ...(i === 0 ? { anchor: "#skills" } : {}),
    }),
  );

  /* — projects ————————————————————————————————————————————— */

  deck.push({
    id: "projects-index",
    layoutId: layoutId({ base: "index", theme: "dark" }),
    title: L.myWork,
    bullets: projects.map((p) => p.title),
    links: projects.map((p) => ({ text: p.title, url: `slide://${p.slug}` })),
    anchor: "#projects",
  });

  projects.forEach((p) => deck.push(...projectSlides(p)));

  /* — experience ——————————————————————————————————————————— */

  const allExperience = [
    ...internships.map((e) => ({ e, prefix: "work" })),
    ...startups.map((e) => ({ e, prefix: "venture" })),
  ];

  // The role he is in now leads; the four in China go in as one entry behind
  // it; the ventures, which he started rather than joined, stay on their own.
  const current = internships.filter((e) => !inChina(e));
  deck.push({
    id: "experience-index",
    layoutId: layoutId({ base: "index", theme: "dark" }),
    title: L.experience,
    bullets: [...current.map((e) => e.org), L.internshipsChina, ...startups.map((e) => e.org)],
    links: [
      ...current.map((e) => ({ text: e.org, url: `slide://work-${slug(e.org)}-work-1` })),
      { text: L.internshipsChina, url: "slide://internships-china" },
      ...startups.map((e) => ({ text: e.org, url: `slide://venture-${slug(e.org)}-work-1` })),
    ],
    anchor: "#experience",
  });

  deck.push(internshipsSummarySlide());

  allExperience.forEach(({ e, prefix }) => deck.push(...experienceSlides(e, prefix)));

  /* — research & education ————————————————————————————————— */

  deck.push({
    id: "research-index",
    layoutId: layoutId({ base: "index", theme: "light" }),
    title: L.research,
    bullets: publications.map((p) => p.title),
    anchor: "#publications",
  });

  publications.forEach((p, i) =>
    deck.push({
      id: `paper-${i + 1}`,
      layoutId: layoutId({ base: "project-content", theme: "light" }),
      intro: `${p.venue} · ${p.date}`,
      title: p.title,
      body: p.note,
    }),
  );

  deck.push({
    id: "education",
    layoutId: layoutId({ base: "project-details", theme: "light" }),
    intro: L.education,
    title: "Where I studied",
    projectDetails: education.map((e) => ({
      title: e.school,
      items: [e.degree, e.period, ...(e.detail ? [e.detail] : [])],
    })),
    anchor: "#education",
  });

  /* — contact ——————————————————————————————————————————————— */

  deck.push({
    id: "contact",
    layoutId: layoutId({ base: "contact", theme: "dark" }),
    intro: contact.heading,
    title: site.email,
    body: contact.subheading,
    links: [
      { text: site.email, url: `mailto:${site.email}` },
      { text: "LinkedIn ↗", url: site.linkedin },
      { text: "GitHub ↗", url: site.github },
      { text: L.resume, url: site.resumeFile },
    ],
    anchor: "#contact",
  });

  return settleLinks(deck);
}

/* ------------------------------------------------------------------ exports */

export const slides: Slide[] = buildSlides();

export const slideIndexById: ReadonlyMap<string, number> = new Map(
  slides.map((s, i) => [s.id, i]),
);

export function indexOfSlide(id: string): number | null {
  const i = slideIndexById.get(id);
  return i === undefined ? null : i;
}

/** Menu registry (docs/ARCHITECTURE.md). Indented entries are children of the row above. */
export const menu: MenuEntry[] = [
  { label: "Home", slideId: "intro" },
  { label: L.getToKnowMe, slideId: "who-am-i" },
  { label: L.howIWork, slideId: "how-i-work" },
  ...positions.map((p) => ({ label: p.label, slideId: `position-${p.id}`, indent: true })),
  { label: L.peoplePlace, slideId: "people-place" },
  ...community.map((c) => ({ label: c.org, slideId: c.id, indent: true })),
  { label: L.skills, slideId: "capabilities" },
  { label: L.myWork, slideId: "projects-index" },
  ...projects.map((p) => ({ label: p.title, slideId: p.slug, indent: true })),
  { label: L.experience, slideId: "experience-index" },
  ...internships.filter((e) => !inChina(e)).map((e) => ({
    label: e.org,
    slideId: `work-${slug(e.org)}-work-1`,
    indent: true,
  })),
  { label: L.internshipsChina, slideId: "internships-china", indent: true },
  ...internships.filter(inChina).map((e) => ({
    label: e.org,
    slideId: `work-${slug(e.org)}-work-1`,
    indent: true,
  })),
  ...startups.map((e) => ({
    label: e.org,
    slideId: `venture-${slug(e.org)}-work-1`,
    indent: true,
  })),
  { label: L.research, slideId: "research-index" },
  { label: L.education, slideId: "education" },
  { label: L.reachOut, slideId: "contact" },
];

/** Anchors for the sitemap and the semantic nav (docs/ARCHITECTURE.md). */
export const anchors = slides
  .filter((s) => s.anchor)
  .map((s) => ({ id: s.id, anchor: s.anchor as string }));
