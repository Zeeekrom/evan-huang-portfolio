/**
 * Which slides a question is about.
 *
 * The guide used to be handed the whole deck — 27,526 characters of system
 * prompt — and asked to answer from it. That works, and it pays for all sixty
 * slides to answer one question, and it leaves the source of an answer a
 * guess: navigation was derived *from the reply* afterwards, which means the
 * line under an answer could name a slide the model never read.
 *
 * Retrieving first fixes the third thing, which is the one that matters. The
 * guide is given the handful of slides a question is actually about, and the
 * source is then a fact about the request rather than an inference about the
 * response.
 *
 * BM25 over the deck, built at load. No embeddings: an index would cost model
 * calls to build and the student credit behind this site is not permanent (see
 * docs/GUIDE.md). At sixty records a term-frequency ranker is the right size of
 * tool, and it has the property an embedding does not — you can read it and
 * say why a slide was chosen.
 *
 * IDF is what makes this work without a hand-tuned stoplist. "Work", "project"
 * and "system" appear on nearly every slide, so they carry almost no weight on
 * their own; "agrisentry" appears on two and carries a lot. The list that
 * relevance.mjs maintains by hand is a worse version of what the arithmetic
 * does here for free — and would have been actively wrong for questions, where
 * "worked" is the whole of what is being asked.
 */

/** Standard BM25 constants: term saturation, and how hard to punish long slides. */
const K1 = 1.2;
/*
 * Measured down from the usual 0.75. The deck mixes two-line cover cards with
 * two-thousand-character bodies, and at 0.75 the short ones won everything:
 * "tell me about his volunteering" returned the contact card, whose entire
 * text is "Tell me what keeps breaking".
 */
const B = 0.3;

/** A title match is worth this many body matches. A slide named for the thing asked about is the thing asked about. */
const TITLE_WEIGHT = 3;

/**
 * The id, indexed like a title.
 *
 * This is the cheapest fix for the gap between the words a visitor uses and
 * the words a slide happens to contain. The contact card never says "contact"
 * — its title is an email address and its body invites you to describe what is
 * broken — but its id is `contact`. Likewise `education`, `research-index`,
 * `work-tencent-work-1`. The ids were written to be read by people, so they
 * already carry the vocabulary questions arrive in, and they cost nothing to
 * index.
 */
const ID_WEIGHT = 3;

/** Evan's own name is on a portfolio about Evan: it distinguishes nothing and the title weight amplified it into noise. */
const SUBJECT = new Set(["evan", "huang", "yuxiang"]);

/**
 * Question words, which IDF gets exactly backwards.
 *
 * The arithmetic rewards a term for being rare in the deck, and "tell" is rare
 * in the deck — it appears on one slide, whose body opens "Tell me what keeps
 * breaking". So "tell me about his volunteering" returned the contact card at
 * nearly twice the score of anything about volunteering, and "what are his
 * values?" returned it too, on the strength of "what".
 *
 * This is not the corpus stoplist that relevance.mjs keeps by hand and that
 * IDF exists to avoid. It is about the query: these words carry no subject in
 * a question, however rare they happen to be in the answers.
 */
const ASKING = new Set(
  ("about also any are been being can could did does doing done for from had has have her here him his how"
    + " into its just know let like many more much need please say said see she should show some tell thanks"
    + " that the their them there these they this those use used using want was were what when where which"
    + " who whom whose why will with would you your hello hey hi").split(" "),
);

/**
 * Crude suffix folding, deliberately not a stemmer.
 *
 * Questions arrive inflected and slides are written in whatever form suited
 * the sentence: "papers"/"paper", "worked"/"work", "volunteering"/"volunteer",
 * "published"/"publish". Three suffixes recover most of that. A real stemmer
 * would be more correct and would also be a dependency, and at sixty records
 * the difference is not measurable.
 */
function fold(word) {
  if (word.length <= 4) return word;
  // "es" only after a sibilant, which is where English actually adds it.
  // Stripping it blindly turned "values" into "valu" and stopped it matching
  // the "value" that a slide id already carried.
  if (/(sses|shes|ches|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (/ies$/.test(word)) return `${word.slice(0, -3)}y`;
  if (/ings?$/.test(word)) return word.replace(/ings?$/, "");
  if (/ed$/.test(word)) return word.slice(0, -2);
  if (/[^s]s$/.test(word)) return word.slice(0, -1);
  return word;
}

/** How many slides the guide is given. Enough for a comparison, few enough to stay cheap. */
export const TOP_K = 6;

/**
 * Below this, the question is not about anything in particular — "hello",
 * "what can you tell me" — and the ranking is noise. The caller falls back to
 * the spine rather than handing over six arbitrary slides and inviting an
 * answer built from them.
 */
export const FLOOR = 1.6;

/** Words, lowercased, three characters or more. Hyphens survive because slide ids use them. */
export function terms(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2)
    .map(fold)
    /* Folded before filtering, so "telling" and "using" are caught as well. */
    .filter((w) => w.length > 2 && !SUBJECT.has(w) && !ASKING.has(w));
}

/**
 * Build the index once per process.
 *
 * Document frequency over the deck, plus each slide's own term counts. Sixty
 * slides of a couple of thousand characters is a few milliseconds and a few
 * hundred kilobytes, so this happens at first use and never again.
 */
export function index(slides) {
  const df = new Map();
  const docs = slides.map((slide) => {
    const title = terms(slide.title);
    const body = terms(slide.body);
    const name = terms(slide.id);
    const counts = new Map();
    for (const t of body) counts.set(t, (counts.get(t) ?? 0) + 1);
    for (const t of title) counts.set(t, (counts.get(t) ?? 0) + TITLE_WEIGHT);
    for (const t of name) counts.set(t, (counts.get(t) ?? 0) + ID_WEIGHT);
    for (const t of new Set([...title, ...body, ...name])) df.set(t, (df.get(t) ?? 0) + 1);
    return {
      id: slide.id,
      counts,
      length: body.length + title.length * TITLE_WEIGHT + name.length * ID_WEIGHT,
    };
  });

  const n = docs.length || 1;
  const avg = docs.reduce((sum, d) => sum + d.length, 0) / n || 1;

  const idf = new Map();
  for (const [term, count] of df) {
    // The +1 keeps a term that is on every slide at a small positive weight
    // rather than a negative one, which would make a common word evidence
    // against the slides that have it.
    idf.set(term, Math.log(1 + (n - count + 0.5) / (count + 0.5)));
  }

  return { docs, idf, avg };
}

/** Score every slide against a question, best first. */
export function rank(question, built) {
  const asked = [...new Set(terms(question))];
  if (asked.length === 0) return [];

  const scored = built.docs.map((doc) => {
    let score = 0;
    for (const term of asked) {
      const f = doc.counts.get(term);
      if (!f) continue;
      const weight = built.idf.get(term) ?? 0;
      score += (weight * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * doc.length) / built.avg));
    }
    return { id: doc.id, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * The slides to put in front of the model for this question.
 *
 * `spine` is what a question with no subject falls back to: the handful of
 * slides that answer "who is this" and "how do I reach him". Returning those
 * is honest — it is what a guide does when someone says hello — where
 * returning the top six of a meaningless ranking is not.
 *
 * @returns {{ids: string[], top: string|null, matched: boolean}}
 */
export function retrieve(question, built, { spine = [], always = [], k = TOP_K, floor = FLOOR } = {}) {
  const ranked = rank(question, built);
  const best = ranked[0];

  if (!best || best.score < floor) {
    const ids = [...new Set([...spine, ...always])].slice(0, k);
    return { ids, top: null, matched: false };
  }

  const ids = ranked
    .slice(0, k)
    .filter((r) => r.score > 0)
    .map((r) => r.id);

  /*
   * `always` earns its place in every answer: a question about anything can
   * end with "and how do I reach him", and the guide cannot say so if it was
   * never given the address.
   */
  for (const id of always) if (!ids.includes(id)) ids.push(id);

  return { ids, top: best.id, matched: true };
}
