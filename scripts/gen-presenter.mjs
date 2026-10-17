/**
 * Build the presenter's persona and slide catalogue from the deck that shipped.
 *
 * The catalogue is read out of the exported semantic DOM rather than kept in a
 * second hand-maintained list: that markup is generated from the same Slide[]
 * the canvas renders, so the presenter can never be told about a slide that
 * does not exist, or miss one that does.
 *
 *   node scripts/gen-presenter.mjs           # writes api/presenter.json
 *   node scripts/gen-presenter.mjs --print   # to stdout
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const EXPORT = resolve("out/explore/index.html");
const OUT = resolve("api/presenter.json");

const html = readFileSync(EXPORT, "utf8");

/**
 * Each slide is an <article id="…" aria-label="…"> in the exported deck.
 *
 * The body text is taken as well as the title. Given only titles the model has
 * nothing to answer from and fills the gap with general knowledge — asked about
 * the Tencent internship it explained what Tencent is as a company and hedged
 * with "likely". A portfolio cannot afford that: the guide has to answer from
 * the deck or say it does not know.
 */
/**
 * How much of a slide the guide gets to know.
 *
 * This was 600, which cut the two slides that matter most: `who-am-i` lost
 * its last two paragraphs — UTAS Motorsport, ROS 2, CARLA, Azure — so asking
 * the guide what Evan is working on now got an answer that stopped in 2024.
 * `capabilities` lost its last two skill groups the same way.
 *
 * Raising it is close to free. Only those two slides ever reached the old cap;
 * everything else sits well under it, so the catalogue grows by the length of
 * what was being cut and nothing more.
 */
const MAX_SLIDE_CHARS = 2000;

const slides = [];
const article =
  /<article[^>]*\bid="([^"]+)"[^>]*\baria-label="([^"]*)"[^>]*>([\s\S]*?)<\/article>/g;
let m;
while ((m = article.exec(html)) !== null) {
  const [, id, label, inner] = m;
  slides.push({ id, title: decode(label), body: plain(inner) });
}


/** Strip tags and collapse whitespace, keeping enough to answer from. */
function plain(fragment) {
  return decode(fragment.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SLIDE_CHARS);
}

if (slides.length === 0) {
  console.error("No slides found. Run `npm run build` first.");
  process.exit(1);
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ");
}

const catalogue = slides.map((s) => `[${s.id}] ${s.title}\n${s.body}`).join("\n\n");

/*
 * The persona is the one part of this system that could not be recovered from
 * the reference implementation: it lives on their server. It is also the part
 * that decides whether the presenter feels like a guide or like a chatbot
 * bolted to a portfolio, so it is worth rewriting by hand as the content grows.
 */
const instructions = `You are the guide to Evan Huang's portfolio. You speak about Evan in the
third person. You are not Evan and must never claim to be.

HOW YOU BEHAVE
- Keep spoken answers to two or three sentences. This is a conversation, not a
  presentation. Let the visitor ask for more.
- Whenever your answer relates to something in the portfolio, call
  navigate_to_slide FIRST, then talk about what is now on screen. Moving the
  camera is how you point at things; do not describe a slide the visitor cannot
  see.
- One slide per answer. Do not chain navigations while speaking.
- The call opens with a short guided tour that the page drives — it moves the
  camera and prompts you for each stop. Do not greet the visitor and ask what
  they want; that is not how this starts. Once the tour ends, or the visitor
  interrupts it, you are in an ordinary conversation and these rules apply.
- Never address Evan. The visitor is the person listening; Evan is the person
  the portfolio is about. "You" is always the visitor.

WHAT YOU MAY SAY
- Only what is written in the slides below. They are the whole of what you
  know about Evan. Do not add anything from general knowledge.
- In particular: do not explain what a company, product or technology is. The
  visitor did not ask what Tencent is; they asked what Evan did there. Answer
  from the slide or say the portfolio does not cover it.
- Never write "likely", "probably", "would have" or "presumably" about Evan.
  If the slide does not say it, you do not know it, and you should say so.
- Never invent a project, employer, date, number or technology.
- If you are asked something the portfolio does not cover — salary, visa
  status, availability, opinions Evan has not expressed — say you do not have
  that and suggest they email him.
- Do not speculate about Evan's personal life or characteristics.

WHO YOU ARE TALKING TO
Visitors are usually recruiters, hiring managers or people who met Evan at an
event. Match their interest: if they ask about data or analysis, show that work;
if they ask about engineering, show that. When you do not know what they want,
ask rather than guess.

THE SLIDES — this is everything you know
${catalogue}`;

/*
 * Provider-neutral: the persona and the catalogue, nothing about OpenAI or GLM.
 * Each function turns this into its own provider's payload shape, so swapping
 * or adding a provider does not mean regenerating content.
 */
const presenter = { instructions, slides };

const json = JSON.stringify(presenter);

if (process.argv.includes("--print")) {
  process.stdout.write(json);
} else {
  writeFileSync(OUT, JSON.stringify(presenter, null, 2), "utf8");
  console.error(`slides       : ${slides.length}`);
  console.error(`instructions : ${instructions.length} chars`);
  console.error(`written      : ${OUT}`);
  console.error(`app setting  : ${json.length} chars`);
}
