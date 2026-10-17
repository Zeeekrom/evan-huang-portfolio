/**
 * The site's content, and the shape it has to be in.
 *
 * The words themselves live in `content/*.json` at the repository root, one
 * file per collection. They used to be written inline here, which meant every
 * edit was a code edit — no editor, no phone, and nothing but a CMS written in
 * TypeScript could ever have touched them.
 *
 * This file is now the seam between that data and the rest of the site: it
 * declares what each collection must look like and asserts the JSON against
 * it. A project without a slug, a status nobody defined, a line that is not in
 * English — all of it fails `npm run build` rather than reaching a page.
 *
 * Everything downstream imports from here exactly as before.
 * See docs/CONTENT.md for what one entry turns into.
 */

import aboutData from "../../content/about.json";
import communityData from "../../content/community.json";
import contactData from "../../content/contact.json";
import educationData from "../../content/education.json";
import footerData from "../../content/footer.json";
import heroData from "../../content/hero.json";
import internshipHighlightsData from "../../content/internship-highlights.json";
import internshipsData from "../../content/internships.json";
import navData from "../../content/nav.json";
import positionsData from "../../content/positions.json";
import projectsData from "../../content/projects.json";
import publicationsData from "../../content/publications.json";
import siteData from "../../content/site.json";
import skillsData from "../../content/skills.json";
import startupsData from "../../content/startups.json";

/* --------------------------------------------------------------- language */

const range = (from: number, to: number) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`;

/**
 * The site is English only.
 *
 * It used to carry every sentence twice, and the second copy cost more than it
 * gave: it drifted from the English, and on the canvas it ran past the edge of
 * the card, because a line of Chinese has no spaces to wrap at. One language,
 * and a build that refuses a second one creeping back in.
 *
 * CJK punctuation, the unified ideographs and their extension, compatibility
 * ideographs, and full-width forms. Built from code points so that this file
 * does not contain the characters it is looking for.
 */
export const CHINESE = new RegExp(
  `[${range(0x3000, 0x303f)}${range(0x3400, 0x9fff)}${range(0xf900, 0xfaff)}${range(0xff00, 0xffef)}]`,
);

/** Throws on the first string anywhere in `value` that is not in English. */
export function englishOnly(file: string, value: unknown, path = ""): void {
  if (typeof value === "string") {
    if (CHINESE.test(value)) {
      throw new Error(`content/${file}: ${path || "a value"} is not in English — the site is English only`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => englishOnly(file, v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) englishOnly(file, v, path ? `${path}.${k}` : k);
  }
}

const RAW: Record<string, unknown> = {
  "about.json": aboutData,
  "community.json": communityData,
  "contact.json": contactData,
  "education.json": educationData,
  "footer.json": footerData,
  "hero.json": heroData,
  "internship-highlights.json": internshipHighlightsData,
  "internships.json": internshipsData,
  "nav.json": navData,
  "positions.json": positionsData,
  "projects.json": projectsData,
  "publications.json": publicationsData,
  "site.json": siteData,
  "skills.json": skillsData,
  "startups.json": startupsData,
};
for (const [file, data] of Object.entries(RAW)) englishOnly(file, data);

/* ------------------------------------------------------------------- site */

export interface Site {
  /**
   * Canonical origin, absolute. The sitemap, robots.txt and the share card
   * all need it in that form.
   */
  url: string;
  name: string;
  legalName: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  /** Path under `public/`, served as-is. */
  resumeFile: string;
}

export const site: Site = siteData;

/* -------------------------------------------------------------- homepage */

export interface NavItem {
  /** Matches a section id on the classic homepage. */
  id: string;
  label: string;
}

export const nav: NavItem[] = navData;

export interface Hero {
  greeting: string;
  role: string;
  tagline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  available: string;
}

export const hero: Hero = heroData;

/* ------------------------------------------------------------------ about */

export interface Fact {
  label: string;
  value: string;
}

export interface About {
  heading: string;
  /**
   * The body of the `who-am-i` slide, and the guide's only source on who Evan
   * is. The last two also carry the `current-focus` slide.
   */
  paragraphs: string[];
  /** Classic homepage only — these never reach the canvas or the guide. */
  facts: Fact[];
}

export const about: About = aboutData;

/* ----------------------------------------------------------------- skills */

export interface SkillGroup {
  title: string;
  /** Technology names. */
  items: string[];
}

export const skillGroups: SkillGroup[] = skillsData;

/* --------------------------------------------------------------- projects */

export interface Project {
  /** Unique, `[a-z0-9-]` only. Becomes the slide ids and the anchor. */
  slug: string;
  title: string;
  period: string;
  description: string;
  /** Two per slide. Three to five reads best. */
  bullets: string[];
  tags: string[];
  /** Repository or demo. Adds a button to the slide when present. */
  link?: string;
  /** Renders this project's slides in the dark palette. */
  featured?: boolean;
}

export const projects: Project[] = projectsData;

/* ------------------------------------------------------------- experience */

export interface ExperienceItem {
  /** Slugged for the slide ids, and truncated to 40 characters when it is. */
  org: string;
  role: string;
  period: string;
  location?: string;
  type?: string;
  bullets: string[];
}

export const internships: ExperienceItem[] = internshipsData;
export const startups: ExperienceItem[] = startupsData;

/**
 * A result that carries the internships' summary card.
 *
 * Four short internships laid out as four equal sections read as someone
 * moving on every few months. Told as one run of work, with the results that
 * weigh the most, they read as the same abilities tested in different places.
 */
export interface InternshipHighlight {
  org: string;
  bullet: string;
}

/**
 * The JSON holds pointers — an org and a bullet index — not text, so the
 * wording lives in internships.json once and cannot drift from it. A pointer
 * that no longer lands fails the build.
 */
export function resolveHighlights(
  raw: { org: string; bullet: number }[],
  from: ExperienceItem[],
): InternshipHighlight[] {
  const file = "content/internship-highlights.json";
  if (raw.length > 2) {
    throw new Error(`${file}: ${raw.length} highlights — the card holds two`);
  }
  return raw.map(({ org, bullet }) => {
    const item = from.find((e) => e.org === org);
    if (!item) throw new Error(`${file}: no internship at "${org}"`);
    const text = item.bullets[bullet];
    if (!text) {
      throw new Error(`${file}: "${org}" has ${item.bullets.length} bullets, so there is no bullet ${bullet}`);
    }
    return { org, bullet: text };
  });
}

export const internshipHighlights: InternshipHighlight[] = resolveHighlights(
  internshipHighlightsData,
  internships,
);

/* ----------------------------------------------------------- publications */

export interface PublicationItem {
  title: string;
  venue: string;
  date: string;
  /** Becomes the body of that paper's slide. */
  note: string;
}

export const publications: PublicationItem[] = publicationsData;

/* -------------------------------------------------------------- education */

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
  detail?: string;
}

export const education: EducationItem[] = educationData;

/* ------------------------------------------------------------- community */

/**
 * How far along a volunteer role actually is.
 *
 * This is a controlled vocabulary and not a free-text field, because the
 * difference between a role that has started and one that has not is the
 * difference between a true statement and a false one. A site that showed a
 * project as a current achievement while it was still looking for investment
 * had to be taken down; the fix for that class of mistake is a type, not a
 * resolution to be careful.
 */
export type CommunityStatus = "current" | "completed" | "incoming" | "onboarding";

/**
 * What each status is shown as.
 *
 * Rendered, always, next to the role. An incoming placement must not be able
 * to read as a finished one just because a reader skims the dates.
 */
export const COMMUNITY_STATUS: Record<CommunityStatus, string> = {
  current: "Current",
  completed: "Completed",
  incoming: "Incoming — not started",
  onboarding: "Onboarding — not yet contributing",
};

export interface CommunityItem {
  id: string;
  org: string;
  role: string;
  period: string;
  status: CommunityStatus;
  /** The domain it sits in: education, health, community services… */
  field: string;
  location: string;
  bullets: string[];
  /** Project slugs that show the work behind it. */
  evidence: string[];
}

/** Volunteering and community involvement. */
export const community: CommunityItem[] = (() => {
  const raw = communityData as { id: string; status: string }[];
  for (const item of raw) {
    if (!(item.status in COMMUNITY_STATUS)) {
      throw new Error(
        `content/community.json: "${item.id}" has status "${item.status}" — expected one of ` +
          Object.keys(COMMUNITY_STATUS).join(", "),
      );
    }
  }
  return raw as unknown as CommunityItem[];
})();

/* -------------------------------------------------------------- positions */

/**
 * Where a position came from.
 *
 * Controlled for the same reason CommunityStatus is. A principle Evan reached
 * through his own work and one he took from someone else's talk are different
 * claims, and a card that blurs them puts another person's idea under his name.
 */
export type PositionOrigin = "practice" | "learned";

/** Shown above every position, so the difference is on the card and not in a footnote. */
export const POSITION_ORIGIN: Record<PositionOrigin, string> = {
  practice: "From my own work",
  learned: "Picked up in Tasmania's tech community",
};

export interface Position {
  id: string;
  /** Short enough for a menu row. */
  label: string;
  claim: string;
  origin: PositionOrigin;
  /** Where the wording was drawn from, so it can be traced back. Never rendered. */
  source: string;
  /** Ids of slides whose work shows it. At least one. */
  evidence: string[];
}

const LABEL_MAX = 40;

/**
 * How he works with AI, one position per card.
 *
 * Every position has to point at work on the site. A view with nothing behind
 * it is one anyone could hold, and the site is where a reader goes to check —
 * so a position with no evidence fails the build instead of going up. Whether
 * each id lands on a real slide is checked in slides.ts, the only place that
 * knows which slides exist.
 */
export const positions: Position[] = (() => {
  const raw = positionsData as (Omit<Position, "origin"> & { origin: string })[];
  const seen = new Set<string>();
  for (const p of raw) {
    const where = `content/positions.json: "${p.id}"`;
    if (seen.has(p.id)) throw new Error(`${where} appears twice`);
    seen.add(p.id);
    if (!(p.origin in POSITION_ORIGIN)) {
      throw new Error(
        `${where} has origin "${p.origin}" — expected one of ${Object.keys(POSITION_ORIGIN).join(", ")}`,
      );
    }
    if (!p.evidence.length) throw new Error(`${where} points at no work on the site`);
    if (p.label.length > LABEL_MAX) {
      throw new Error(`${where} label is ${p.label.length} characters; a menu row fits ${LABEL_MAX}`);
    }
  }
  return raw as Position[];
})();

/* ------------------------------------------------------- contact & footer */

export interface Contact {
  heading: string;
  subheading: string;
}

export const contact: Contact = contactData;

export interface Footer {
  builtWith: string;
}

export const footer: Footer = footerData;
