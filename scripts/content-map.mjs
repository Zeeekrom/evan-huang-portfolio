/**
 * Generate docs/CONTENT-SLOTS.md — every writable piece of text on the site.
 *
 *   npm run content:map
 *
 * The point is to be able to write content away from the code: each slot is
 * listed with the field path to put it in, its current value, and where it
 * comes out on screen.
 *
 * The slot-to-slide mapping is *derived*, not written down. Each content value
 * is searched for in the rendered text of every slide, so if the generator in
 * slides.ts changes, this follows it instead of quietly going stale.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import * as content from "../src/data/content.ts";
import { menu, slides } from "../src/slides/slides.ts";
import { itinerary } from "../src/lib/tour.ts";

/** A value in this many slides is a common word, not a locatable slot. */
const UBIQUITOUS = 6;
/** Below this, a match is coincidence rather than provenance. */
const MATCHABLE = 8;
/** Mirrors lib/tour.ts and scripts/gen-presenter.mjs. */
const TOUR_CHARS = 1200;
const CATALOGUE_CHARS = 2000;

/* ------------------------------------------------------ flatten content.ts */

/*
 * The only exports worth walking.
 *
 * tsx's CommonJS interop puts a `module.exports` key in the namespace holding a
 * second copy of everything, so walking the namespace blindly visits every
 * value twice. The paths differ, so the tables looked fine — but the
 * duplicate-text check saw every string twice and flagged all of them as
 * ambiguous.
 */
const GROUP_KEYS = new Set([
  "site", "nav", "hero", "about", "positions", "community", "skillGroups", "projects",
  "internships", "startups", "publications", "education", "contact", "footer",
]);

const slots = [];
function walk(node, path) {
  if (typeof node === "string") {
    slots.push({ path, value: node });
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  }
}
for (const [name, value] of Object.entries(content)) {
  if (!GROUP_KEYS.has(name)) continue;
  walk(value, name);
}

/* --------------------------------------------------- flatten the rendered deck */

function slideText(s) {
  const parts = [s.intro, s.title, s.subtitle, s.body];
  s.paragraphs?.forEach((p) => parts.push(p));
  s.bullets?.forEach((b) => parts.push(b));
  s.links?.forEach((l) => parts.push(l.text, l.url));
  s.projectDetails?.forEach((g) => {
    parts.push(g.title);
    g.items.forEach((i) => parts.push(i));
  });
  return parts.filter(Boolean).join("\n");
}

const rendered = slides.map((s) => ({ id: s.id, text: slideText(s) }));

/*
 * Which classic-homepage component renders each content group.
 *
 * Without this a field that only appears on `/` shows as "—", which reads as
 * unused — and most of `hero`, `about.facts` and `footer` are exactly that.
 * Read from the imports rather than listed here, so it cannot go stale.
 */
const classicByGroup = new Map();
const componentsDir = resolve(process.cwd(), "src/components");
for (const file of readdirSync(componentsDir)) {
  if (!file.endsWith(".tsx")) continue;
  const src = readFileSync(resolve(componentsDir, file), "utf8");
  const imported = src.match(/import\s*\{([^}]+)\}\s*from\s*"@\/data\/content"/s);
  if (!imported) continue;
  for (const raw of imported[1].split(",")) {
    const name = raw.replace(/type/, "").trim();
    if (!name) continue;
    if (!classicByGroup.has(name)) classicByGroup.set(name, []);
    classicByGroup.get(name).push(file.replace(/\.tsx$/, ""));
  }
}
const tourStops = itinerary().map((s) => s.slideId);
const menuIds = new Set(menu.map((m) => m.slideId));
const anchored = new Set(slides.filter((s) => s.anchor).map((s) => s.id));

/*
 * Two different slots can hold the same words — `hero.ctaSecondary` and
 * `contact.heading` are both "Get in Touch" — and matching on text alone then
 * credits one for the other's appearance. Those are marked rather than guessed
 * at.
 *
 * Technology names, ids and dates are left out: "Python" in three projects'
 * tags is the normal case, not two pieces of writing that happen to agree.
 */
const NOT_PROSE = /\.(tags|items|evidence)\[\d+\]$|\.(slug|id|source|origin|status|period|date)$/;
const sharedValues = new Set();
{
  const seen = new Map();
  for (const s of slots) {
    if (NOT_PROSE.test(s.path) || s.value.length < MATCHABLE) continue;
    if (seen.has(s.value)) sharedValues.add(s.value);
    seen.set(s.value, s.path);
  }
}

/** Which slides show this value. */
function whereShown(value) {
  if (!value || value.length < MATCHABLE) return null;
  const hits = rendered.filter((r) => r.text.includes(value)).map((r) => r.id);
  if (!hits.length) return [];
  if (hits.length > UBIQUITOUS) return "many";
  return { hits, shared: sharedValues.has(value) };
}

/* -------------------------------------------------------------- rendering */

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const clip = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);

function reach(found, group) {
  if (found === "many") return "many slides";
  if (!found || !found.hits?.length) {
    const classic = classicByGroup.get(group);
    return classic ? `classic homepage only: \`${classic.join("`, `")}\`` : "—";
  }
  const marks = found.hits.map((id) => {
    const flags = [];
    if (tourStops.includes(id)) flags.push(`tour #${tourStops.indexOf(id) + 1}`);
    if (menuIds.has(id)) flags.push("menu");
    if (anchored.has(id)) flags.push("anchor");
    return flags.length ? `\`${id}\` (${flags.join(" · ")})` : `\`${id}\``;
  });
  const note = found.shared ? "<br>⚠️ same text as another slot; attribution may be wrong" : "";
  return marks.join("<br>") + note;
}

const GROUPS = [
  ["site", "Site constants", "Domain, email, social links, résumé file. These feed the SEO metadata and the contact slide."],
  ["nav", "Classic homepage navigation", "Only affects the classic homepage `/`, not the canvas."],
  ["hero", "Homepage hero", "Only affects the classic homepage `/`. The canvas opens on the `intro` slide, whose title is written in `slides.ts`."],
  ["about", "About", "**The most important group.** `paragraphs` is the body of the canvas `who-am-i` slide and the guide's only source on who Evan is."],
  ["positions", "How I work with AI", "The `how-i-work` index plus one card per position. `evidence` must name slides that exist or the build fails; `source` is for tracing a position back and is never shown."],
  ["community", "Community", "The `people-place` index plus one card per organisation. `status` is a controlled vocabulary, and a role that has not started says so on its card."],
  ["skillGroups", "Skill groups", "Generate the `capabilities` slide; `items` are technology names."],
  ["projects", "Projects", "Each project makes 1 + ⌈bullets/2⌉ slides."],
  ["internships", "Internships", "Each makes ⌈bullets/2⌉ slides, ids prefixed `work-`, behind the `internships-china` summary card."],
  ["startups", "Ventures", "Same shape as internships, ids prefixed `venture-`."],
  ["publications", "Publications", "One slide each, ids `paper-1`, `paper-2`… by position."],
  ["education", "Education", "All on one `education` slide."],
  ["contact", "Contact", "Heading and subheading of the `contact` slide, the tour's last stop."],
  ["footer", "Footer", "Classic homepage only."],
];

const out = [];
out.push("# Content slots");
out.push("");
out.push("> **Generated — do not edit by hand.** `npm run content:map`");
out.push(">");
out.push("> Every writable piece of text on the site: **which field it lives in, and where it appears**.");
out.push("> Use it to write content away from the code, then hand the entries back.");
out.push(">");
out.push("> How content flows and what an entry generates: [CONTENT.md](CONTENT.md).");
out.push("");
out.push("The site is English only. A Chinese character in any content file fails the build.");
out.push("");
out.push("## Legend");
out.push("");
out.push("| Mark | Meaning |");
out.push("|---|---|");
out.push("| tour #N | The slide is stop N of the voice tour and is read aloud |");
out.push("| menu | Appears in the top-left menu |");
out.push("| anchor | Goes in the sitemap as a crawlable URL |");
out.push("| many slides | The text appears on many slides (usually a technology name) and is not located |");
out.push("| classic homepage only | Rendered only on `/` — **not on the canvas, and the guide cannot read it** |");
out.push("| — | Nothing renders it at the moment |");
out.push("| ⚠️ | Same text as another slot; \"appears on\" was matched by text and may be misattributed |");
out.push("");
out.push(`Current size: **${slides.length} slides**, of which ${tourStops.length} are tour stops and ${anchored.size} have anchors.`);
out.push("");

for (const [key, title, note] of GROUPS) {
  const mine = slots.filter((s) => s.path === key || s.path.startsWith(key + ".") || s.path.startsWith(key + "["));
  if (!mine.length) continue;

  out.push("---");
  out.push("");
  out.push(`## ${title} — \`${key}\``);
  out.push("");
  out.push(note);
  out.push("");
  out.push("| Field path | Current value | Appears on |");
  out.push("|---|---|---|");
  for (const s of mine) {
    out.push(`| \`${s.path}\` | ${esc(clip(s.value, 70))} | ${reach(whereShown(s.value), key)} |`);
  }
  out.push("");
}

/* ------------------------------------------------------------- templates */

out.push("---");
out.push("");
out.push("## Templates for new entries");
out.push("");
out.push("Copy one and change the content. Field order does not matter.");
out.push("");
out.push("### New project → `projects.json`");
out.push("");
out.push("```json");
out.push(`{
  "slug": "short-name",
  "title": "Project Name",
  "period": "Mar 2025 – Jun 2025",
  "description": "One or two sentences: what it is and why it exists.",
  "bullets": ["One thing per bullet, with a number or a system name where possible."],
  "tags": ["Python", "FastAPI"],
  "link": "https://github.com/…",
  "featured": false
}`);
out.push("```");
out.push("");
out.push("`slug` must be unique and use only `[a-z0-9-]`; it becomes the slide id and the anchor. `link` and `featured` are optional. Every two bullets make a slide.");
out.push("");
out.push("### New internship → `internships.json` (or a venture → `startups.json`)");
out.push("");
out.push("```json");
out.push(`{
  "org": "Company Name",
  "role": "Software Engineer Intern",
  "period": "Jun 2025 – Sep 2025",
  "type": "Full-time",
  "bullets": ["What you did."]
}`);
out.push("```");
out.push("");
out.push("### New volunteer role → `community.json`");
out.push("");
out.push("```json");
out.push(`{
  "id": "short-name",
  "org": "Organisation",
  "role": "Role",
  "period": "2026 – Present",
  "status": "current",
  "field": "Education",
  "location": "Hobart, TAS",
  "bullets": ["What the role is."],
  "evidence": []
}`);
out.push("```");
out.push("");
out.push("`status` is one of `current`, `completed`, `incoming` (not started) or `onboarding` (not yet contributing).");
out.push("");
out.push("### New position → `positions.json`");
out.push("");
out.push("```json");
out.push(`{
  "id": "short-name",
  "label": "Under forty characters",
  "claim": "The position, in one or two sentences.",
  "origin": "practice",
  "source": "where the wording came from",
  "evidence": ["payment-agent-lab"]
}`);
out.push("```");
out.push("");
out.push("`origin` is `practice` (from his own work) or `learned` (picked up from someone else, and the card says so). `evidence` lists slide ids; at least one is required.");
out.push("");

/* ------------------------------------------------------------ empty slots */

out.push("---");
out.push("");
out.push("## Slots nothing fills yet");
out.push("");
out.push("| Slot | State |");
out.push("|---|---|");
out.push("| `ExperienceItem.location` | In the type, but **no slide renders it**. Change `experienceSlides()` to show it |");
out.push("| `Slide.image` / `images` / `video` / `youtubeUrl` | Supported by the type and the canvas layouts, but no generator sets them. Decide how media is expressed in `content/` first |");
out.push("| Behavioural stories / STAR | **No data structure.** `positions.json` holds one-line positions with evidence links; a full situation–action–result story still has nowhere to go |");
out.push("| `intro` title and subtitle | Written in `slides.ts`, not in `content/` |");
out.push("| `main-menu` slide | Entries written in `slides.ts` |");
out.push("");

/* ------------------------------------------------------------ AI reach */

out.push("---");
out.push("");
out.push("## How much the AI guide can read");
out.push("");
out.push("Two paths, with **different limits**:");
out.push("");
out.push("| Path | Per-slide limit | When it is used |");
out.push("|---|---|---|");
out.push(`| Tour stop instructions | ${TOUR_CHARS} characters | The ${tourStops.length} stops narrated after connecting |`);
out.push(`| \`presenter.json\` session catalogue | ${CATALOGUE_CHARS} characters | Conversation once the visitor speaks |`);
out.push("");
out.push("The guide may not state a fact that is not on a slide. **Write specifically and it speaks specifically; write vaguely and it can only be vague.**");
out.push("");
out.push("Tour route, in order:");
out.push("");
for (const [i, id] of tourStops.entries()) {
  const s = slides.find((x) => x.id === id);
  out.push(`${i + 1}. \`${id}\` — ${esc(clip(s.title || id, 60))}`);
}
out.push("");

const path = resolve(process.cwd(), "docs/CONTENT-SLOTS.md");
writeFileSync(path, out.join("\n"), "utf8");
console.log(`wrote ${path}`);
console.log(`  ${slots.length} content slots · ${slides.length} slides · ${tourStops.length} tour stops`);
