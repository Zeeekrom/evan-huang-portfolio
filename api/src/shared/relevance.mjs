/**
 * Pick the slide an answer is about, without asking the model again.
 *
 * The guide is supposed to call navigate_to_slide, but this provider only
 * supports tool_choice "auto" and, now that the catalogue carries each slide's
 * body, the model can often answer without reaching for the tool at all. That
 * leaves the visitor reading about the Tencent internship while looking at the
 * title card — the one thing this site exists to avoid.
 *
 * So navigation is derived when it is not requested. Deterministic, instant,
 * and it cannot fail the way another round trip to a congested free tier can.
 */

/** Words too common to distinguish one slide from another. */
const STOP = new Set(
  ("a an and are as at be been by for from had has have he her his i in is it its of on or "
    + "our she that the their they this to was were what when where which who will with you your "
    + "evan huang his him portfolio slide about into over also his role work worked working "
    + "experience project projects using used use various different additionally during").split(" "),
);

function terms(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

/**
 * Overlap scored against the slide's own length, so a long slide cannot win on
 * volume alone. Titles count double: a reply that names the project is almost
 * certainly about it.
 */
function score(replyTerms, slide) {
  const body = terms(`${slide.body ?? ""}`);
  const title = terms(slide.title ?? "");
  if (body.size === 0 && title.size === 0) return 0;

  let hits = 0;
  for (const w of replyTerms) {
    if (title.has(w)) hits += 2;
    else if (body.has(w)) hits += 1;
  }
  return hits / Math.sqrt(body.size + title.size + 1);
}

/**
 * Best matching slide, or null when nothing is a clear enough match.
 *
 * The threshold matters more than the ranking: moving the camera somewhere
 * loosely related is worse than not moving it, because the visitor reads the
 * new slide as the answer.
 */
export function bestSlide(reply, slides, { minScore = 1.1 } = {}) {
  if (!reply || slides.length === 0) return null;
  const replyTerms = terms(reply);
  if (replyTerms.size < 3) return null;

  let best = null;
  let bestScore = 0;
  for (const slide of slides) {
    const s = score(replyTerms, slide);
    if (s > bestScore) {
      bestScore = s;
      best = slide;
    }
  }
  return bestScore >= minScore ? best.id : null;
}
