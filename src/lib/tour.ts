/**
 * The opening tour.
 *
 * When a visitor starts the presenter they have said nothing yet, so waiting
 * for a question wastes the one moment they are certain to be paying attention.
 * The guide takes them through the deck instead, and they interrupt whenever
 * they want.
 *
 * The tour is driven from here, one stop per turn, rather than handed to the
 * model as a single "give a tour" instruction. That was the first attempt and
 * it does not work: the model treats the whole tour as one turn, covers the
 * first stop, then closes with "what would you like to know?" — a tour that
 * quits after one room. Asking for exactly one stop at a time, and advancing
 * when that turn finishes, makes the running order the client's decision
 * instead of the model's.
 *
 * The itinerary is fixed so every visitor gets the same tour.
 *
 * What the guide *says* is not scripted. It narrates each slide from that
 * slide's own text, which the broker already holds in the presenter catalogue.
 * Prose written here would be a second copy of the site's content, free to
 * drift out of step with it.
 */

import {
  POSITION_ORIGIN,
  about,
  education,
  internshipHighlights,
  internships,
  positions,
  projects,
  publications,
  site,
  skillGroups,
  startups,
} from "@/data/content";
import { menu, slides } from "@/slides/slides";
import type { Slide } from "@/slides/types";

/**
 * The route, written down.
 *
 * It used to be the first eight top-level menu entries, which held only while
 * the menu was a résumé and every section was equally worth a minute. Adding
 * one section pushed "Reach out" off the end of the slice and nothing failed —
 * the tour simply stopped inviting anyone to get in touch.
 *
 * The order is the argument: who he is, how he works, and what he does with
 * his own time first, then the evidence for it. Capabilities and research are
 * on the site and the guide can answer about them; neither is worth a minute
 * of a stranger's attention unprompted, one being a list of technologies and
 * the other two papers. Nor is current-focus, which is the last two paragraphs
 * of who-am-i again — the guide was handed those at the stop before.
 */
const ROUTE = [
  "intro",
  "who-am-i",
  "how-i-work",
  "people-place",
  "projects-index",
  "experience-index",
  "education",
  "contact",
];

/** Plenty for a stop's worth of narration without bloating every turn. */
const MAX_SOURCE_CHARS = 1200;

/**
 * Flatten a slide into the text the guide narrates from.
 *
 * The broker's catalogue holds this too, but the catalogue lives in the
 * *session* instructions — and `response.create` with `instructions` replaces
 * those. Every tour turn therefore ran with no idea what was on the slide, and
 * filled the gap with commentary about the page itself: "this part is Evan's
 * introduction, a brief overview, best seen as opening context". True of any
 * introduction anywhere, and useless.
 *
 * Carrying the text on the turn removes the dependency entirely.
 */
function slideText(slide: Slide): string {
  const parts: string[] = [];
  const push = (v: string | undefined) => {
    if (v) parts.push(v);
  };

  push(slide.title);
  push(slide.subtitle);
  push(slide.body);
  slide.paragraphs?.forEach((p) => push(p));
  slide.bullets?.forEach((b) => push(b));
  slide.projectDetails?.forEach((g) => parts.push(`${g.title}: ${g.items.join(" · ")}`));
  slide.testimonials?.forEach((q) => push(q.quote));

  return parts.join("\n").slice(0, MAX_SOURCE_CHARS);
}

/**
 * What the guide knows when it arrives at a stop.
 *
 * Not the slide's text, which is what this used to hand over — and it sounded
 * like it. Given a page it read the page: every employer in turn, every
 * technology in the list, a grade point average to two decimal places. Third
 * person and slightly shorter, but still a page being read aloud.
 *
 * A person who had read all of this and was telling you about Evan would not
 * do that. They would say there were four internships and two ventures of his
 * own, name the one you have heard of, and move on. So each stop gets the
 * *shape* of its section — how many of a thing, and the two or three that
 * carry the weight — assembled from the same content the slides are built
 * from, so it cannot drift out of step with them.
 *
 * Returns null for a section with no brief of its own, and the caller falls
 * back to the slide's text: a section added to the deck still joins the tour
 * rather than arriving mute.
 */
function brief(slideId: string): string[] | null {
  const roles = internships.length + startups.length;

  switch (slideId) {
    case "intro":
      return [
        `${site.name}, based in ${site.location}.`,
        "He describes himself as an applied AI agent engineer working across data and business analytics, and interactive and game development.",
        "Beyond the title: four industry internships, a startup he co-founded, and volunteer work in mentoring, digital inclusion and community technology.",
        `Ahead of the visitor: who he is, what he can do, ${projects.length} projects, ` +
          `${roles} places he has worked, published research, and how to reach him.`,
        "This is the doorstep. One or two sentences on who he is and what is coming, then stop.",
      ];

    case "who-am-i":
      // Genuine prose rather than a list, so the guide gets it whole — but the
      // first paragraph is where the grade point averages live.
      return [
        "Evan in his own words:",
        ...about.paragraphs,
        "",
        "Standing, not decimals: he finished first in his cohort and took a perfect " +
          "record on exchange. That is the fact. The numbers themselves belong on a " +
          "transcript, not in a sentence spoken out loud.",
      ];

    case "how-i-work": {
      const titleOf = (id: string) => slides.find((s) => s.id === id)?.title ?? id;
      return [
        `${positions.length} positions on working with AI, each tied to work on this site:`,
        ...positions.map(
          (p) =>
            `· ${p.label} [${POSITION_ORIGIN[p.origin]}] — ${p.claim} ` +
            `Shown in: ${p.evidence.map(titleOf).join("; ")}.`,
        ),
        "",
        "These are how he works, not settled facts about AI. Say them as his view.",
        `Where one is marked "${POSITION_ORIGIN.learned}", say that is where he picked it up. ` +
          "Never present it as his own idea.",
        "Take two, and for each say what work of his shows it. Do not recite all of them.",
      ];
    }

    case "capabilities":
      return [
        `${skillGroups.length} areas, ${skillGroups.reduce((n, g) => n + g.items.length, 0)} ` +
          "named technologies between them:",
        ...skillGroups.map((g) => `${g.title} — ${g.items.slice(0, 4).join(", ")}…`),
        "",
        "Name at most three areas. A visitor cannot hold a list of technologies read " +
          "aloud, and reciting one says nothing a strong candidate would not also say.",
      ];

    case "projects-index": {
      const featured = projects.filter((p) => p.featured);
      const rest = projects.filter((p) => !p.featured);
      return [
        `${projects.length} projects.`,
        "The ones he leads with:",
        ...featured.map((p) => `· ${p.title} (${p.period}) — ${p.description}`),
        `The rest, in one breath: ${rest.map((p) => p.title).join("; ")}.`,
        "",
        "Say how many there are, then take two — no more — and say what they actually " +
          "do. Do not work through the list.",
      ];
    }

    case "experience-index": {
      const china = internships.filter((e) => e.location === "China");
      const current = internships.filter((e) => e.location !== "China");
      return [
        `${internships.length} industry internships and ${startups.length} ventures of his own.`,
        ...current.map((e) => `· In Hobart now: ${e.org} — ${e.role}, ${e.period}. ${e.bullets[0] ?? ""}`),
        `The other ${china.length} were in China and are best told as one run of work. What weighs the most:`,
        ...internshipHighlights.map((h) => `· ${h.org} — ${h.bullet}`),
        "Every placement:",
        ...china.map((e) => `· ${e.org} — ${e.role}, ${e.period}`),
        ...startups.map((e) => `· ${e.org} — ${e.role}, ${e.period}`),
        "",
        `Lead with the count — ${internships.length} internships, ${startups.length} ventures — ` +
          "then say he is working in Hobart now, name the employers a stranger would recognise, " +
          "and say what the work was. Do not visit each one in turn.",
      ];
    }

    case "research-index":
      return [
        `${publications.length} published papers, both with ACM.`,
        ...publications.map((p) => `· ${p.title} — ${p.venue}, ${p.date}. ${p.note}`),
        "",
        "Say what the research is about, not the full titles. Nobody says a conference " +
          "paper's title out loud.",
      ];

    case "education": {
      // Read out of the content rather than written here. These are claims
      // about someone's degrees: a sentence typed into this file would go on
      // being said long after the transcript behind it changed.
      const firsts = education
        .map((e) => /Rank\s*1\s*\/\s*(\d+)/.exec(e.detail ?? "")?.[1])
        .filter((n): n is string => Boolean(n));
      const perfect = education.filter((e) => /GPA\s*4\.00\s*\/\s*4\.00/.test(e.detail ?? ""));

      const standing: string[] = [];
      if (firsts.length) {
        standing.push(`he finished first in his cohort — first of ${firsts.join(", and first of ")}`);
      }
      if (perfect.length) {
        standing.push(`he took a perfect record at ${perfect.map((e) => e.school).join(" and ")}`);
      }

      return [
        `${education.length} entries.`,
        ...education.map(
          (e) => `· ${e.degree}, ${e.school}, ${e.period}${e.detail ? ` (${e.detail})` : ""}`,
        ),
        "",
        standing.length
          ? `The standing is the story: ${standing.join("; and ")}. Say it that way.`
          : "Say where he studied and what he read, not the marks.",
        "Never read a grade point average out as a number — \"3.77 out of 4.00\" is a " +
          "transcript talking, not a person.",
      ];
    }

    case "contact":
      return [
        `His email, GitHub and LinkedIn are all on this page. He is based in ${site.location}.`,
        "",
        "Do not read the email address out. Spelling an address aloud is the one thing " +
          "nobody wants read to them, and it is on the screen in front of them.",
        "This is the last stop. Close the tour: say the ways to reach him are here, invite " +
          "them to ask about anything they saw, and stop.",
      ];

    default:
      return null;
  }
}

/**
 * Section headings are thin by design — the substance is on the slides indented
 * under them. Naming those gives the guide something to actually say.
 */
function childrenOf(slideId: string): string[] {
  const at = menu.findIndex((m) => m.slideId === slideId);
  if (at < 0) return [];
  const out: string[] = [];
  for (let i = at + 1; i < menu.length && menu[i].indent; i++) {
    out.push(menu[i].label);
  }
  return out;
}

export interface TourStop {
  slideId: string;
  label: string;
  /** What the guide is asked to say once the camera has arrived. */
  instructions: string;
}

/**
 * Who the guide is, restated on every single turn.
 *
 * This is not redundant. `response.create` with `instructions` *replaces* the
 * session instructions for that response, so each tour turn throws away the
 * persona the broker set up — including the part that says to speak about Evan
 * in the third person. Without this the guide starts addressing Evan directly:
 * "this slide is all about who you are, your background, the persona you
 * bring" — describing the portfolio to its owner instead of describing its
 * owner to a visitor.
 */
const FRAMING = [
  "You are the guide to Evan Huang's portfolio, speaking aloud to a visitor who is browsing it.",
  "You are not Evan and must never claim to be. Speak about Evan in the third person — \"Evan\", \"he\", \"his work\".",
  "\"You\" always means the visitor, never Evan. Never address Evan, describe the portfolio to Evan, or narrate what \"you\" bring or \"your\" background.",
  "Never describe the slide as a slide. Talk about Evan, not about what the page is doing.",
];

/**
 * One stop's instruction.
 *
 * Every stop gets the same shape, which is what keeps the tour recognisably the
 * same tour each time. The prohibitions carry the weight: without them the
 * model ends each turn by offering help, which reads as the tour finishing over
 * and over.
 */
function stopInstructions(slideId: string, label: string, index: number, total: number): string {
  const prepared = brief(slideId);
  const slide = slides.find((sl) => sl.id === slideId);
  const source = prepared ?? (slide ? [slideText(slide)] : []);
  const children = childrenOf(slideId);
  const lines: string[] = [...FRAMING, ""];

  if (index === 0) {
    lines.push(
      "You are giving the visitor a guided tour of Evan's portfolio and it starts now.",
      "Open with one short sentence introducing yourself as the guide to Evan's work, then continue straight into this stop.",
      "",
    );
  }

  lines.push(
    `Stop ${index + 1} of ${total}. The visitor is looking at the "${label}" part of the portfolio.`,
    "",
    "--- what you know about this ---",
    ...source.filter(Boolean),
    // Only on the fallback path. A prepared brief has already named these, and
    // repeating the list here sits directly under "do not work through a list".
    !prepared && children.length ? `It leads to: ${children.join(", ")}.` : "",
    "--- end of what you know ---",
    "",
    "Talk the way someone would who has read all of that and is telling a friend about Evan. Not the way a page reads.",
    "",
    "Give the shape before the parts. How many of a thing there are, of what kind, and then the one or two that carry the most weight. Never work through a list: if there are four internships, say there are four and name the ones a stranger would recognise. Do not visit each in turn, and do not end on \"and more\".",
    "Numbers are for standing, not for precision. \"First in his cohort\" and \"a perfect record on exchange\" are what a person says out loud; a grade point average to two decimal places is what a transcript says.",
    "That still means saying the actual things: the employers, the technologies, the places, what the work was. Specifics are what a summary is made of.",
    "Two to four sentences. Denser than the page, not vaguer than it.",
    "",
    "Some of the above is written in Evan's own voice — \"I'm a…\", \"I worked on…\". You are not Evan, so say it as \"he\": \"Evan is a…\", \"he worked on…\". Never read it back in the first person.",
    "Never talk about the page. Do not say \"this section\", \"this slide\", \"this part\", \"an overview of\", \"it sets the tone\", \"a deep dive\", \"you'll hear\", or that something is short or brief. The visitor can see the page; describing it back to them is worthless. Talk about Evan.",
    "Never state a fact that is not written above. If something is not there, leave it out rather than hedging.",
    "Do not call navigate_to_slide; the tour moves the view for you.",
  );

  if (index === total - 1) {
    lines.push(
      "This is the final stop. Finish by inviting them to ask about anything they saw, then stop.",
    );
  } else {
    lines.push(
      "Do NOT greet the visitor, ask what they would like to see, offer help, or say anything that sounds like an ending.",
      "There are more stops after this one and you will be prompted for each. Cover this one, then stop talking.",
    );
  }

  lines.push("Speak English.");
  return lines.join("\n");
}

/**
 * The whole route, starting at the first slide.
 *
 * Top-level menu entries only — the per-project and per-employer slides are
 * indented under them and would turn a minute into ten.
 */
export function itinerary(): TourStop[] {
  const labels = new Map(menu.map((m) => [m.slideId, m.label]));
  // A stop naming a slide that no longer exists is dropped rather than
  // narrated as an empty room, and the content check reports the gap.
  const stops = ROUTE.filter((id) => slides.some((s) => s.id === id));

  return stops.map((slideId, i) => {
    const slide = slides.find((s) => s.id === slideId);
    const label = labels.get(slideId) || slide?.title || slideId;
    return {
      slideId,
      label,
      instructions: stopInstructions(slideId, label, i, stops.length),
    };
  });
}

/** Route stops that name a slide the deck does not have. */
export function missingStops(): string[] {
  return ROUTE.filter((id) => !slides.some((s) => s.id === id));
}

/* ---------------------------------------------------------------- sequencing */

export interface TourIO {
  /** Move the camera. Called before the guide is asked to describe the stop. */
  navigate(slideId: string): void;
  /** Ask the guide for exactly one turn. */
  speak(instructions: string): void;
  /**
   * Pause between stops, in ms. Back to back, the camera move and the next
   * sentence land on top of each other and it stops reading as a tour.
   */
  gapMs?: number;
}

/**
 * Runs the itinerary, one stop per turn.
 *
 * Kept apart from the WebRTC session so the running order can be tested
 * without a microphone — which matters, because "it covered one stop and then
 * asked what I wanted" is exactly the bug this exists to prevent.
 */
export class TourRunner {
  private index = -1;
  /**
   * True while a stop's narration is outstanding. A turn can end more than
   * once — a tool call produces its own completion — and without this each
   * would advance the tour and skip a stop.
   */
  private awaiting = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Held rather than abandoned.
   *
   * The provider's voice detection is a hair trigger — it fires on the guide's
   * own voice coming back through the speakers, or a cough. Treating that as
   * "the visitor took over" killed the tour outright: it stopped on a section
   * heading and never moved again while the guide talked on. So a detection
   * pauses, and only a transcript with actual words in it abandons.
   */
  private paused = false;
  /** A stop was due while paused and still owes a run. */
  private pending = false;

  constructor(
    private readonly stops: TourStop[],
    private readonly io: TourIO,
  ) {}

  get active(): boolean {
    return this.index >= 0;
  }

  /** Which stop is showing, 1-based. 0 when the tour is not running. */
  get position(): number {
    return this.index + 1;
  }

  get held(): boolean {
    return this.paused;
  }

  begin(): void {
    if (!this.stops.length || this.index >= 0) return;
    this.index = 0;
    this.paused = false;
    this.pending = false;
    this.run();
  }

  /** Call when a turn of speech finishes. */
  onTurnComplete(): void {
    if (this.index < 0 || !this.awaiting) return;
    this.awaiting = false;

    if (this.index + 1 >= this.stops.length) {
      this.index = -1;
      return;
    }
    this.index += 1;

    if (this.paused) {
      this.pending = true;
      return;
    }
    this.schedule();
  }

  private schedule(): void {
    const gap = this.io.gapMs ?? 900;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.index >= 0 && !this.paused) this.run();
    }, gap);
  }

  /**
   * Someone may be talking. Hold position; do not give up on the itinerary.
   */
  pause(): void {
    if (this.index < 0 || this.paused) return;
    this.paused = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
      this.pending = true;
    }
  }

  /** It turned out to be nothing. Carry on from where the tour was. */
  resume(): void {
    if (this.index < 0 || !this.paused) return;
    this.paused = false;
    if (this.pending) {
      this.pending = false;
      this.schedule();
    }
  }

  /**
   * Give up on the running order.
   *
   * Once the visitor has said something, marching on to stop four is the wrong
   * thing to do — they are in a conversation now, not an audio guide.
   */
  abandon(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.index = -1;
    this.awaiting = false;
    this.paused = false;
    this.pending = false;
  }

  private run(): void {
    const stop = this.stops[this.index];
    if (!stop) {
      this.index = -1;
      return;
    }
    // The client navigates rather than leaving it to the model to call the
    // tool. The running order is the whole point of a tour, and a model that
    // forgets one call skips a slide in silence.
    this.io.navigate(stop.slideId);
    this.awaiting = true;
    this.io.speak(stop.instructions);
  }
}
