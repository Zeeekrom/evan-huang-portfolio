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
import casesData from "../../content/cases.json";
import communityData from "../../content/community.json";
import contactData from "../../content/contact.json";
import educationData from "../../content/education.json";
import footerData from "../../content/footer.json";
import termsData from "../../content/terms.json";
import aheadData from "../../content/ahead.json";
import linksData from "../../content/links.json";
import heroData from "../../content/hero.json";
import internshipHighlightsData from "../../content/internship-highlights.json";
import internshipsData from "../../content/internships.json";
import navData from "../../content/nav.json";
import offsiteData from "../../content/offsite.json";
import positionsData from "../../content/positions.json";
import projectsData from "../../content/projects.json";
import publicationsData from "../../content/publications.json";
import siteData from "../../content/site.json";
import skillsData from "../../content/skills.json";
import startupsData from "../../content/startups.json";
import strengthsData from "../../content/strengths.json";
import uiData from "../../content/ui.json";
import { assertParity, type ParityReport } from "./parity";
import zhAbout from "../../content/zh/about.json";
import zhTerms from "../../content/zh/terms.json";
import zhAhead from "../../content/zh/ahead.json";
import zhCases from "../../content/zh/cases.json";
import zhCommunity from "../../content/zh/community.json";
import zhContact from "../../content/zh/contact.json";
import zhEducation from "../../content/zh/education.json";
import zhFooter from "../../content/zh/footer.json";
import zhHero from "../../content/zh/hero.json";
import zhInternships from "../../content/zh/internships.json";
import zhNav from "../../content/zh/nav.json";
import zhOffsite from "../../content/zh/offsite.json";
import zhPositions from "../../content/zh/positions.json";
import zhProjects from "../../content/zh/projects.json";
import zhPublications from "../../content/zh/publications.json";
import zhSkills from "../../content/zh/skills.json";
import zhStartups from "../../content/zh/startups.json";
import zhStrengths from "../../content/zh/strengths.json";
import zhUi from "../../content/zh/ui.json";

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

/**
 * Every collection that has to be in English.
 *
 * content/zh/ is absent on purpose, and absent rather than exempted: an
 * exemption is a flag someone can set by accident, an absence is a line
 * someone has to write. Those files are held to their own standard instead,
 * by assertParity below.
 */
const RAW: Record<string, unknown> = {
  "about.json": aboutData,
  "cases.json": casesData,
  "community.json": communityData,
  "contact.json": contactData,
  "education.json": educationData,
  "footer.json": footerData,
  "hero.json": heroData,
  "internship-highlights.json": internshipHighlightsData,
  "internships.json": internshipsData,
  "nav.json": navData,
  "offsite.json": offsiteData,
  "positions.json": positionsData,
  "projects.json": projectsData,
  "publications.json": publicationsData,
  "site.json": siteData,
  "skills.json": skillsData,
  "startups.json": startupsData,
  "strengths.json": strengthsData,
  "ahead.json": aheadData,
  "links.json": linksData,
  "terms.json": termsData,
  "ui.json": uiData,
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
  /** The line of monospace capitals under the name in the bar. */
  kicker: string;
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
  /** R7: the page opens on a position, not an introduction. */
  statement: { lead: string; pivot: string; swap: string[] };
  /** R2: one path with arrows, never a list of titles with pipes. */
  trajectory: string[];
  /** R1: numbers a reader could check, not adjectives. */
  metrics: string[];
  now: { label: string; value: string }[];
  /**
   * The photograph in the other half of the opening plate. Not Evan's own, so
   * it carries its credit on the page: the licence requires attribution and a
   * borrowed picture should say it is borrowed.
   */
  shot?: {
    src: string;
    alt: string;
    caption: string;
    credit: string;
    creditUrl: string;
    licence: string;
    licenceUrl: string;
  };
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

export interface LogoMark {
  /** The key into links.json, which is where the URL comes from. */
  org: string;
  src: string;
  alt: string;
}

export interface About {
  /** The claim that opens the section, set large beside the portrait. */
  lead: string;
  /** The circle beside it. Initials stand in when there is no image. */
  portrait?: { src: string; alt: string };
  /** One line, right-aligned against the section title. */
  aside: string;
  heading: string;
  /**
   * The body of the `who-am-i` slide, and the guide's only source on who Evan
   * is. The last two also carry the `current-focus` slide.
   */
  paragraphs: string[];
  /**
   * Employer marks under the claim, painted as masks rather than pictures so
   * they take one ink from the theme. `org` is the key into links.json, which
   * is where each one's URL comes from — a second copy of the URL here would
   * be a second thing to keep true.
   */
  logos: {
    employers: LogoMark[];
    community: LogoMark[];
  };
  /** Classic homepage only — these never reach the canvas or the guide. */
  facts: Fact[];
}

export const about: About = aboutData;

/* ----------------------------------------------------------------- skills */

export interface SkillGroup {
  /** Two words at most: the card is 150px wide, the full title is not. */
  label: string;
  title: string;
  /** Technology names. */
  items: string[];
}

export const skillGroups: SkillGroup[] = skillsData;

/**
 * The strengths section's own copy. The cards claim an area; these rows are
 * where that area was actually used, which is the only part a reader can
 * check.
 */
export interface Strengths {
  heading: string;
  aside: string;
  spine: string;
  /** One per card. Selecting a card swaps the panel below it. */
  stages: {
    label: string;
    lead: string;
    /*
     * Text only. These rows used to carry a demo or repository link each,
     * which put the same six destinations on the page twice — the project
     * cards and the case studies below already lead to every one of them.
     */
    rows: { label: string; text: string }[];
  }[];
}

export const strengths: Strengths = strengthsData;

/**
 * The narrated walkthroughs. A still from the film rather than a poster: a
 * poster is a designed claim, a frame is the thing running.
 */
export interface Cases {
  heading: string;
  aside: string;
  items: {
    slug: string;
    title: string;
    line: string;
    length: string;
    shot: string;
    alt: string;
    url: string;
  }[];
}

export const cases: Cases = casesData;

/** The closing section: who he is away from the work. */
export interface Offsite {
  heading: string;
  aside: string;
  lines: string[];
}

export const offsite: Offsite = offsiteData;

/* --------------------------------------------------------------- projects */

export interface Project {
  /** Unique, `[a-z0-9-]` only. Becomes the slide ids and the anchor. */
  slug: string;
  title: string;
  /** The filter this project sits under, and the colour of its header. */
  kind: string;
  period: string;
  description: string;
  /** Two per slide. Three to five reads best. */
  bullets: string[];
  tags: string[];
  /** Repository or demo. Adds a button to the slide when present. */
  link?: string;
  /** A real screenshot of the work, served from public/shots. */
  shot?: string;
  /** Something running that a visitor can open. Not a repository. */
  demo?: string;
  /**
   * The project's poster, served from public/posters. It is the back of the
   * card when one is opened; without it the back falls back to the bullets.
   */
  poster?: string;
  /** Renders this project's slides in the dark palette. */
  featured?: boolean;
}

export const projects: Project[] = projectsData;

/* ------------------------------------------------------------- experience */

export interface ExperienceItem {
  /** Who this employer is, for a reader who has never heard of them (R4). */
  badge?: string;
  /** One monospace line of what changed, under the role (R1). */
  metric?: string;
  /** Slugged for the slide ids, and truncated to 40 characters when it is. */
  org: string;
  role: string;
  period: string;
  /**
   * Where this role falls in time, 1 = earliest.
   *
   * Recorded rather than derived: AR Platform and Perfect World both read
   * "2023 - 2024", so no amount of date parsing puts them in the right order,
   * and the two lists interleave — concatenating work and ventures and
   * reversing it, which is what Journey used to do, is not a chronology.
   */
  seq: number;
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
  /** Where the paper can be read. Empty until the DOI is to hand. */
  link?: string;
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
  /** One word for the dark band's label; only the values carry it. */
  keyword?: string;
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
  /** Completes “© 2026 Evan Huang. …” — no full stop, the component adds it. */
  rights: string;
  /** The label on the link to /terms/. */
  terms: string;
}

export interface TermsBlock {
  heading: string;
  paragraphs: string[];
}

export interface Terms {
  heading: string;
  aside: string;
  updated: string;
  /**
   * Nobody has had this page in front of a lawyer. Saying so on the page is
   * the honest version of publishing it anyway, and it is a standing rule
   * here rather than a decision taken once.
   */
  notice: string;
  sections: TermsBlock[];
  backLabel: string;
}

export const footer: Footer = footerData;

export const terms: Terms = termsData;

export interface AheadWord {
  text: string;
  /** 3 centre, 2 middle ring, 1 outer ring. Nothing else is laid out. */
  weight: number;
}

export interface AheadBlock {
  heading: string;
  line: string;
  words: AheadWord[];
}

export interface Ahead {
  heading: string;
  aside: string;
  /** Says out loud that this section is intent, not evidence. */
  note: string;
  blocks: AheadBlock[];
}

export const ahead: Ahead = validateAhead(aheadData as Ahead);

export interface OfficialLink {
  /** Exactly as the name is written in the content. */
  name: string;
  url: string;
}

/**
 * Every URL here was opened and checked before it was added. A name whose
 * official site could not be reached is left out rather than guessed at —
 * a portfolio that links somewhere wrong is worse than one that does not
 * link at all.
 */
export const links: OfficialLink[] = (linksData as { links: OfficialLink[] }).links.map((l) => {
  if (!/^https:\/\//.test(l.url)) throw new Error(`links.json: ${l.name} is not an https URL`);
  return l;
});

function validateAhead(raw: Ahead): Ahead {
  for (const block of raw.blocks) {
    for (const word of block.words) {
      if (![1, 2, 3].includes(word.weight)) {
        throw new Error(`ahead.json: "${word.text}" has weight ${word.weight}; only 1, 2 or 3 are laid out`);
      }
    }
    if (!block.words.some((w) => w.weight === 3)) {
      throw new Error(`ahead.json: "${block.heading}" has no weight-3 word, so the cloud has no centre`);
    }
  }
  return raw;
}


/* ------------------------------------------------------------- languages */

/**
 * The Chinese page, as the same page.
 *
 * /zh used to be a hand-written summary: fewer sections, its own layout, its
 * own 310 lines of JSX. It drifted, which the note on `zh` above predicted,
 * and a reader arriving in Chinese got a different and smaller site.
 *
 * It is now the same components over a second content set. Everything a
 * reader sees comes from here, so the two pages cannot differ in anything but
 * their words — and `assertParity` makes sure even those stay row for row
 * with the English. What is deliberately *not* translated is named in
 * parity.ts: slugs, links, published titles, product names and the weights
 * that size the word cloud.
 *
 * `zh.json` and the old summary page are gone. The canvas and the guide are
 * still English only; `ui.notice` says so on the Chinese page rather than
 * leaving a reader to find out by clicking.
 */
export type Lang = "en" | "zh";

export interface Ui {
  /** Shown above the page when it is not the original. Empty in English. */
  notice: string;
  /** The <title> and meta description for this language's route. */
  meta: { title: string; description: string };
  /** The name and line in the bar. site.json keeps the addresses; these are read. */
  brand: { name: string; kicker: string; location: string };
  /** Read aloud rather than seen, so it is translated like everything else. */
  nav: { menu: string };
  values: { heading: string; aside: string; fallbackKeyword: string };
  publications: { heading: string; aside: string; read: string };
  experience: {
    heading: string;
    aside: string;
    order: string;
    resume: string;
    journey: string;
    work: string;
    workAside: string;
    education: string;
    educationAside: string;
    /** The two switch positions, as the buttons read. */
    modes: { resume: string; journey: string };
  };
  projects: {
    heading: string;
    aside: string;
    all: string;
    hint: string;
    tidy: string;
    /** The kind as a reader sees it. The data keeps the English, which keys the hues. */
    kinds: Record<string, string>;
  };
  card: {
    flip: string;
    unflip: string;
    live: string;
    repo: string;
    close: string;
    /** The small card in the pile, which has room for one word. */
    peek: string;
    back: string;
  };
  footer: { explore: string };
  contact: { resume: string };
  status: Record<CommunityStatus, string>;
  origin: Record<PositionOrigin, string>;
}

export const ui: Ui = uiData as Ui;

/** Every Chinese file, against the English one it has to match. */
const ZH_RAW: Record<string, [unknown, unknown]> = {
  "terms.json": [termsData, zhTerms],
  "about.json": [aboutData, zhAbout],
  "ahead.json": [aheadData, zhAhead],
  "cases.json": [casesData, zhCases],
  "community.json": [communityData, zhCommunity],
  "contact.json": [contactData, zhContact],
  "education.json": [educationData, zhEducation],
  "footer.json": [footerData, zhFooter],
  "hero.json": [heroData, zhHero],
  "internships.json": [internshipsData, zhInternships],
  "nav.json": [navData, zhNav],
  "offsite.json": [offsiteData, zhOffsite],
  "positions.json": [positionsData, zhPositions],
  "projects.json": [projectsData, zhProjects],
  "publications.json": [publicationsData, zhPublications],
  "skills.json": [skillsData, zhSkills],
  "startups.json": [startupsData, zhStartups],
  "strengths.json": [strengthsData, zhStrengths],
  "ui.json": [uiData, zhUi],
};

export const parity: ParityReport = { shared: 0 };
for (const [file, [en, zhv]] of Object.entries(ZH_RAW)) assertParity(file, en, zhv, parity);

/** Everything a rendered page needs, in one language. */
export interface Bundle {
  lang: Lang;
  ui: Ui;
  nav: NavItem[];
  hero: Hero;
  about: About;
  skillGroups: SkillGroup[];
  strengths: Strengths;
  cases: Cases;
  offsite: Offsite;
  projects: Project[];
  internships: ExperienceItem[];
  startups: ExperienceItem[];
  internshipHighlights: InternshipHighlight[];
  publications: PublicationItem[];
  education: EducationItem[];
  community: CommunityItem[];
  positions: Position[];
  contact: Contact;
  footer: Footer;
  ahead: Ahead;
  terms: Terms;
}

const EN: Bundle = {
  lang: "en",
  ui,
  nav,
  hero,
  about,
  skillGroups,
  strengths,
  cases,
  offsite,
  projects,
  internships,
  startups,
  internshipHighlights,
  publications,
  education,
  community,
  positions,
  contact,
  footer,
  ahead,
  terms: termsData as Terms,
};

const ZH: Bundle = {
  lang: "zh",
  ui: zhUi as Ui,
  nav: zhNav as NavItem[],
  hero: zhHero as Hero,
  about: zhAbout as About,
  skillGroups: zhSkills as SkillGroup[],
  strengths: zhStrengths as Strengths,
  cases: zhCases as Cases,
  offsite: zhOffsite as Offsite,
  projects: zhProjects as Project[],
  internships: zhInternships as ExperienceItem[],
  startups: zhStartups as ExperienceItem[],
  /* Pointers, resolved against the Chinese bullets rather than the English. */
  internshipHighlights: resolveHighlights(internshipHighlightsData, zhInternships as ExperienceItem[]),
  publications: zhPublications as PublicationItem[],
  education: zhEducation as EducationItem[],
  community: zhCommunity as CommunityItem[],
  positions: zhPositions as Position[],
  contact: zhContact as Contact,
  footer: zhFooter as Footer,
  ahead: zhAhead as Ahead,
  terms: zhTerms as Terms,
};

export function bundle(lang: Lang): Bundle {
  return lang === "zh" ? ZH : EN;
}
