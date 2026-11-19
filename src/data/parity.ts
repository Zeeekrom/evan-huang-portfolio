/**
 * What keeps the Chinese page from drifting away from the English one.
 *
 * The site used to carry a hand-written Chinese summary at /zh: a different
 * page, a different layout and a different subset of the work. It drifted,
 * which is what the note on the old `zh` export predicted it would do. The
 * fix is not more discipline — it is that the two pages are now the same
 * components over two content sets, so the only thing that *can* differ is
 * the words.
 *
 * This is the other half of that: every file in content/zh/ has to be the
 * same shape as its English counterpart, key for key and row for row. Add a
 * project, a position or a bullet in English and the build fails until the
 * Chinese catches up — which is the price of a second language, paid at build
 * time instead of by a reader finding a half-translated page.
 */

/**
 * Keys whose value is an identity, not a sentence.
 *
 * These must be byte-identical across the two files. A slug that was
 * "translated" would silently unlink a card from its poster, its case study
 * and its slide; a weight that drifted would size the word cloud differently
 * in each language.
 */
const BASE_PINNED = [
  "id",
  "slug",
  "link",
  "url",
  "href",
  "src",
  "demo",
  "poster",
  "evidence",
  "tags",
  "origin",
  "source",
  "status",
  "featured",
  "kind",
  "weight",
  "seq",
  "for",
  "creditUrl",
  "licence",
  "licenceUrl",
  "credit",
  "length",
];

/**
 * The names a file carries that are published rather than written.
 *
 * `title` is the paper's title in publications.json and the group's heading in
 * skills.json, so this cannot be one global list: a published title must not
 * be translated and a heading must be. Same for `shot`, a path in
 * projects.json and an object with its own alt text in hero.json.
 */
const PINNED_BY_FILE: Record<string, string[]> = {
  "projects.json": ["title", "shot"],
  "cases.json": ["title", "shot"],
  "publications.json": ["title", "venue"],
  "internships.json": ["org"],
  "startups.json": ["org"],
  "community.json": ["org"],
  "about.json": ["org"],
};

const pinnedFor = (file: string) => new Set([...BASE_PINNED, ...(PINNED_BY_FILE[file] ?? [])]);

/**
 * Is this string a sentence somebody has to read, rather than a name?
 *
 * Product and organisation names are the same in both languages — "Power BI"
 * is "Power BI" in Hobart and in Shanghai — so an identical string is only
 * suspicious when it reads as prose. Two or more lowercase words is the test:
 * it clears "ROS 2", "Hesai Pandar40P" and "AI-Native Payment & Agent
 * Engineering Lab", and catches "Open a row for what the work actually was."
 */
export function isProse(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const lower = words.filter((w) => /^[a-z]{2,}[.,;:!?]?$/.test(w));
  return lower.length >= 2;
}

/** "1 entry", "2 entries" — the message is read by whoever has to fix it. */
const rows = (n: number) => `${n} ${n === 1 ? "entry" : "entries"}`;

export interface ParityReport {
  /** Strings left identical that did not look like prose — names, almost always. */
  shared: number;
}

/**
 * Walk both trees together. Throws on the first difference that matters.
 */
export function assertParity(
  file: string,
  en: unknown,
  zh: unknown,
  report: ParityReport,
  path = "",
  pinned: Set<string> = pinnedFor(file),
): void {
  const where = `content/zh/${file}${path ? ` at ${path}` : ""}`;

  if (Array.isArray(en)) {
    if (!Array.isArray(zh)) throw new Error(`${where}: expected a list, as the English file has one`);
    if (en.length !== zh.length) {
      throw new Error(
        `${where}: has ${rows(zh.length)} and the English file has ${rows(en.length)} — ` +
          `every row has to exist in both languages`,
      );
    }
    en.forEach((v, i) => assertParity(file, v, zh[i], report, `${path}[${i}]`, pinned));
    return;
  }

  if (en && typeof en === "object") {
    if (!zh || typeof zh !== "object" || Array.isArray(zh)) {
      throw new Error(`${where}: expected an object, as the English file has one`);
    }
    const a = Object.keys(en as object).sort();
    const b = Object.keys(zh as object).sort();
    const missing = a.filter((k) => !b.includes(k));
    const extra = b.filter((k) => !a.includes(k));
    if (missing.length || extra.length) {
      throw new Error(
        `${where}: keys do not match the English file` +
          (missing.length ? ` — missing ${missing.join(", ")}` : "") +
          (extra.length ? ` — unexpected ${extra.join(", ")}` : ""),
      );
    }
    for (const k of a) {
      const ev = (en as Record<string, unknown>)[k];
      const zv = (zh as Record<string, unknown>)[k];
      if (pinned.has(k) && !(ev && typeof ev === "object" && !Array.isArray(ev))) {
        if (JSON.stringify(ev) !== JSON.stringify(zv)) {
          throw new Error(
            `${where}.${k}: is an identity, not a sentence — it has to be identical in both languages, ` +
              `and is ${JSON.stringify(zv)} against ${JSON.stringify(ev)}`,
          );
        }
        continue;
      }
      assertParity(file, ev, zv, report, path ? `${path}.${k}` : k, pinned);
    }
    return;
  }

  if (typeof en === "string") {
    if (typeof zh !== "string") throw new Error(`${where}: expected text`);
    if (en === zh && isProse(en)) {
      throw new Error(`${where}: is still the English sentence — ${JSON.stringify(en.slice(0, 60))}`);
    }
    if (en === zh) report.shared += 1;
    return;
  }

  if (en !== zh) {
    throw new Error(`${where}: is ${JSON.stringify(zh)} and the English file has ${JSON.stringify(en)}`);
  }
}
