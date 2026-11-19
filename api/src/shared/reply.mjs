/**
 * Separate what the model meant to say from what it meant to do.
 *
 * `navigate_to_slide` is a tool, and this endpoint does not offer it (see
 * USE_TOOLS in ask.mjs — a tool round costs a whole extra request on a free
 * tier to decide something relevance.mjs works out locally). The persona still
 * asks for navigation because the voice endpoint does offer the tool, so the
 * model dutifully performs a call it was never given, in prose, ahead of the
 * answer. ask.mjs now tells it not to; this is the net under that.
 *
 * Five shapes measured against the live broker, in five questions:
 *
 *   navigate_to_slide(contact)
 *   [navigate_to_slide: rivulet-localops]
 *   navigate_to_slide([experience, internships-china])
 *   Navigate to slide [work-tencent-work-1]. At Tencent, Evan worked as…
 *   Navigate to slide 15, "Rivulet LocalOps".
 *
 * The first three put the call on its own line. The fourth puts the answer on
 * the same line, so dropping the line would delete the answer — which is why
 * this cuts the call's own sentence rather than the line it sits in. The fifth
 * is the whole reply, names no id at all, and leaves nothing behind; ask.mjs
 * supplies a line for that case, which beats showing a visitor a stage
 * direction.
 */

/** The call, spelled as a function or as English. */
const MARKER = /\[?\s*navigate[\s_]*to[\s_]*slide\b/i;

/** Slide ids are lowercase and hyphenated; three characters is the shortest real one. */
const TOKEN = /[a-z][a-z0-9-]{2,}/gi;

/** End of the call's own sentence: a stop, or the end of the line. */
function sentenceEnd(text) {
  const stop = text.search(/[.。](\s|$)/);
  return stop === -1 ? text.length : stop + 1;
}

/** The slide a call names, by id or — when it only gives a title — by title. */
function destination(span, slides) {
  for (const token of span.match(TOKEN) ?? []) {
    if (slides.some((s) => s.id === token)) return token;
  }
  const lower = span.toLowerCase();
  for (const slide of slides) {
    const title = (slide.title ?? "").trim().toLowerCase();
    if (title.length > 3 && lower.includes(title)) return slide.id;
  }
  return null;
}

/**
 * Strip printed tool calls out of a reply, keeping any destination they named.
 *
 * @param {string} text the model's answer, as written
 * @param {{id: string, title?: string}[]} slides the catalogue, so only a real slide is returned
 * @returns {{reply: string, slideId: string|null}}
 */
export function extractNavigation(text, slides = []) {
  if (typeof text !== "string" || text === "") return { reply: "", slideId: null };

  const kept = [];
  let slideId = null;

  for (const line of text.split("\n")) {
    const found = MARKER.exec(line);
    if (!found) {
      kept.push(line);
      continue;
    }

    const rest = line.slice(found.index);
    const span = rest.slice(0, sentenceEnd(rest));

    // Keep the first real destination. A later one in the same answer would
    // leave the visitor somewhere the words no longer describe.
    if (!slideId) slideId = destination(span, slides);

    const left = (line.slice(0, found.index) + rest.slice(span.length)).trim();
    // A line that was nothing but the call leaves no blank line behind. A
    // blank line the model actually wrote is not touched, because it never
    // reaches here.
    if (left !== "") kept.push(left);
  }

  // Collapse the hole the removal left behind.
  const reply = kept
    .join("\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { reply, slideId };
}
