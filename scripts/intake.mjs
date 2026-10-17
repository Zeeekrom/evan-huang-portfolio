/**
 * Content intake: gather what has been dropped in the inbox, and say what is new.
 *
 *   npm run intake           # what has arrived since the last run
 *   npm run intake -- --all  # show everything in the inbox again
 *   npm run intake -- --done # file what has been dealt with into done/
 *
 * This never writes content. It extracts the text, remembers what it has
 * already shown, and prints what the site already says — so a proposed entry
 * can be checked against the site before anyone writes it.
 *
 * The inbox lives outside the repository on purpose. Raw transcripts and
 * recordings are internal; only distilled, approved entries belong in
 * content/*.json, which is published to the public mirror.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const INBOX = process.env.SITE_INBOX ?? "E:/MaskPlan/Site-Inbox";
const NEW = join(INBOX, "new");
const DONE = join(INBOX, "done");
const LEDGER = join(INBOX, "ledger.json");
/** Normalised copies live here, gitignored: the originals stay in the inbox. */
const WORK = resolve(".intake");

const args = new Set(process.argv.slice(2));
const SHOW_ALL = args.has("--all");
const FILE_THEM = args.has("--done");

/* ------------------------------------------------------------------ files */

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    if (e.name.startsWith(".") || e.name === "ledger.json") return [];
    return [full];
  });
}

/** docx is a zip; python is already a dependency of the deploy scripts. */
function docxText(file) {
  const code = [
    "import re,sys,zipfile",
    "sys.stdout.reconfigure(encoding='utf-8')",
    "xml=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode('utf-8','ignore')",
    "ps=[''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>',p)).strip() for p in re.findall(r'<w:p[ >].*?</w:p>',xml,re.S)]",
    "print('\\n'.join(p for p in ps if p))",
  ].join("\n");
  return execFileSync("python", ["-c", code, file], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function textOf(file) {
  const ext = extname(file).toLowerCase();
  if ([".txt", ".md", ".json", ".csv", ".yml", ".yaml", ".html"].includes(ext)) {
    return readFileSync(file, "utf8");
  }
  if (ext === ".docx") return docxText(file);
  return null; // pdf, images, audio: export the text and drop that instead
}

/* ----------------------------------------------------------------- ledger */

const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {};
const saveLedger = () => writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n", "utf8");

/* ----------------------------------------------- what the site already says */

const content = (name) => JSON.parse(readFileSync(resolve("content", name), "utf8"));

function inventory() {
  const lines = [];
  const list = (label, items) => lines.push(`- **${label}** (${items.length}): ${items.join(" · ")}`);
  list("Volunteer and community", content("community.json").map((c) => `${c.org} [${c.id}, ${c.status}]`));
  list("Projects", content("projects.json").map((p) => `${p.title} [${p.slug}]`));
  list("Positions", content("positions.json").map((p) => `${p.label} [${p.id}, ${p.origin}]`));
  list("Internships", content("internships.json").map((e) => `${e.org} (${e.period})`));
  list("Ventures", content("startups.json").map((e) => `${e.org} (${e.period})`));
  list("Publications", content("publications.json").map((p) => `${p.venue} ${p.date}`));
  list("Skill groups", content("skills.json").map((g) => g.title));
  list("Education", content("education.json").map((e) => e.school));
  return lines.join("\n");
}

const WHERE = `
| What arrived | Where it goes | Watch out for |
|---|---|---|
| A new volunteer or community role | \`content/community.json\` | \`status\` is current / completed / incoming / onboarding — a role that has not started says so |
| A conference, meetup or talk he attended | \`content/positions.json\` as a view with \`origin: "learned"\`, or an entry in community.json if he worked the event | A speaker's idea stays theirs: the card says where he picked it up. Never quote a recording |
| A new project or repository | \`content/projects.json\` | Bullets come in pairs: every two make a slide |
| A new job or internship | \`content/internships.json\` or \`startups.json\` | Month-level dates; the summary card picks two results from \`internship-highlights.json\` |
| A new paper | \`content/publications.json\` | Co-authored, never sole author |
| A new resume | check every file above against it | The resume is the source of truth for facts |
| A view he formed himself | \`content/positions.json\` with \`origin: "practice"\` | It must link to work already on the site, or the build fails |
`.trim();

const RULES = `
1. English only. A Chinese character in content/*.json fails the build.
2. Facts only from the material in the inbox or the current resume. Nothing is inferred, rounded up or made more impressive.
3. Raw transcripts never reach content/*.json. Distil, then cite the source file in the proposal, not on the site.
4. \`evidence\` ids must name slides that exist. \`npm run content\` and \`npm test\` check this before anything is committed.
5. Nothing is committed or deployed until Evan has said yes.
`.trim();

/* -------------------------------------------------------------------- run */

const files = walk(NEW);
const fresh = [];
mkdirSync(WORK, { recursive: true });

for (const file of files) {
  const bytes = readFileSync(file);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const seen = ledger[hash];
  if (seen && !SHOW_ALL && !FILE_THEM) continue;

  let text = null;
  let note = "";
  try {
    text = textOf(file);
    if (text === null) note = "no text extractor for this type — export the text and drop that instead";
  } catch (e) {
    note = `could not read: ${e.message.split("\n")[0]}`;
  }

  const stat = statSync(file);
  const entry = {
    hash,
    file,
    name: basename(file),
    kb: Math.round(stat.size / 1024),
    modified: stat.mtime.toISOString().slice(0, 10),
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
    note,
  };
  fresh.push(entry);

  if (text) {
    const copy = join(WORK, `${hash}-${basename(file, extname(file)).replace(/[^\w.-]+/g, "-").slice(0, 60)}.txt`);
    writeFileSync(copy, text, "utf8");
    entry.copy = copy;
    entry.head = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 25);
    entry.signals = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 30 && /volunteer|intern|role|project|selected|appointed|award|publish|conference|workshop|meetup|mentor|committee|launch|release|certificat/i.test(l))
      .slice(0, 12);
  }

  ledger[hash] = { file, name: entry.name, firstSeen: seen?.firstSeen ?? new Date().toISOString().slice(0, 10), status: seen?.status ?? "shown" };
}

if (FILE_THEM) {
  mkdirSync(DONE, { recursive: true });
  let moved = 0;
  for (const [hash, record] of Object.entries(ledger)) {
    if (record.status === "filed" || !existsSync(record.file)) continue;
    let target = join(DONE, basename(record.file));
    if (existsSync(target)) target = join(DONE, `${hash}-${basename(record.file)}`);
    renameSync(record.file, target);
    ledger[hash] = { ...record, file: target, status: "filed", filed: new Date().toISOString().slice(0, 10) };
    moved++;
  }
  saveLedger();
  console.log(`filed ${moved} file(s) into ${DONE}`);
  process.exit(0);
}

saveLedger();

const out = [];
out.push(`# Intake — ${new Date().toISOString().slice(0, 10)}`);
out.push("");
out.push(`Inbox: \`${NEW}\` · ${files.length} file(s) waiting · ${fresh.length} ${SHOW_ALL ? "shown" : "new since the last run"}`);
out.push("");

if (!fresh.length) {
  out.push("Nothing new. Drop files in the inbox, then run this again.");
} else {
  for (const f of fresh) {
    out.push(`## ${f.name}`);
    out.push("");
    out.push(`\`${f.file}\` · ${f.kb} KB · modified ${f.modified}${f.words ? ` · ${f.words} words` : ""}${f.note ? ` · ${f.note}` : ""}`);
    if (f.copy) out.push(`Text: \`${f.copy}\``);
    if (f.head?.length) {
      out.push("");
      out.push("Opening lines:");
      out.push("");
      out.push(f.head.map((l) => `> ${l.slice(0, 160)}`).join("\n"));
    }
    if (f.signals?.length) {
      out.push("");
      out.push("Lines worth reading:");
      out.push("");
      out.push(f.signals.map((l) => `- ${l.slice(0, 200)}`).join("\n"));
    }
    out.push("");
  }
}

out.push("## What the site already says");
out.push("");
out.push(inventory());
out.push("");
out.push("## Where new material usually goes");
out.push("");
out.push(WHERE);
out.push("");
out.push("## Rules");
out.push("");
out.push(RULES);
out.push("");

const digest = join(WORK, "digest.md");
writeFileSync(digest, out.join("\n"), "utf8");
console.log(out.join("\n"));
console.log(`\n(written to ${digest})`);
