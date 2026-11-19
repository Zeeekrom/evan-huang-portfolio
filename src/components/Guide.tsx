"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { about, site } from "@/data/content";
import { PRESENTER_API } from "@/lib/presenter";
import { canvasHref, sectionFor } from "@/lib/sections";

/**
 * The corner guide.
 *
 * Same guide as the one that talks on the canvas, same catalogue, typed
 * instead of spoken. Text first on purpose: it works on the locked-down
 * corporate and government networks where microphone access is blocked and in
 * the open-plan offices where nobody is going to talk to a web page — and on
 * the free model it costs nothing, which matters for a button that sits on the
 * landing page rather than behind a footer link. See docs/GUIDE.md.
 *
 * What makes it worth having over a chatbot bolted to a portfolio is that it
 * does two things that one cannot. It answers only from the catalogue built
 * out of the same records that render this page, so it cannot drift from what
 * the visitor is looking at. And it **moves the page to what it is talking
 * about**: the broker names a slide, and a slide is a section here and a
 * camera position on the canvas.
 *
 * Every answer shows where it came from. That is the argument this site makes
 * everywhere else — evidence a reader can check rather than claims they have
 * to take — and the guide has to hold to it too.
 */

/**
 * The voice guide, loaded on demand.
 *
 * It pulls in the tour, which builds its narration out of the deck, which is
 * most of the site's content. A landing page is mostly visitors who never
 * press the button, and they should not download a voice tour to read a page.
 */
const GuideVoice = dynamic(() => import("@/components/GuideVoice"), {
  ssr: false,
  loading: () => null,
});

/** Opening chips. The second does not need a model to answer it. */
const OPENERS = [
  { label: "What does Evan do?", ask: "What does Evan do?" },
  { label: "How to get in touch", scrollTo: "contact" },
] as const;

/** After every answer, in the shape the reference uses. */
const FOLLOW_UPS = [
  "Is he available for work?",
  "What has he built?",
  "Where has he worked?",
];

/** Long enough to find the section, short enough not to become decoration. */
const MARK_MS = 1800;

/** The broker is on a consumption plan; a cold start measured 14s against 2s warm. */
const WARM_TIMEOUT_MS = 4000;

type Source = { slideId: string; title: string | null };
type Turn = { role: "user" | "guide"; text: string; source?: Source };

export default function Guide() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState("");
  const [voiceLive, setVoiceLive] = useState(false);

  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const warmed = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /*
   * Wake the broker when the panel opens rather than when the question
   * arrives. A preflight is enough to start the instance and costs no model
   * call, and the visitor spends the cold start typing instead of waiting.
   */
  useEffect(() => {
    if (!open || warmed.current) return;
    warmed.current = true;
    fetch(`${PRESENTER_API}/ask`, {
      method: "OPTIONS",
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
    }).catch(() => {
      /* the real request will report anything that matters */
    });
  }, [open]);

  /** Keep the newest turn in view. */
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [turns, asking]);

  /**
   * Take the visitor to the thing just described, and say which thing it is.
   *
   * Clicking a source closes the panel — it has served its purpose and the
   * visitor is going to read the section. A voice tour keeps it open, because
   * it is the only way to stop the call.
   */
  const reveal = useCallback((section: string, close = true) => {
    const el = document.getElementById(section);
    if (!el) return;
    if (close) setOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.dataset.guided = "on";
    window.setTimeout(() => delete el.dataset.guided, MARK_MS);
  }, []);

  /* Stable identities, so the voice component is not rebuilt on every render. */
  const revealOnly = useCallback((section: string) => reveal(section, false), [reveal]);

  /** The guide said something that is not an answer: an error, a refusal, the end. */
  const say = useCallback((text: string) => {
    setTurns((prev) => [...prev, { role: "guide", text }]);
  }, []);

  /** A stop the page has no section for. The canvas does; the source line links there. */
  const toCanvas = useCallback((slideId: string) => {
    setTurns((prev) => [
      ...prev,
      { role: "guide", text: "That part of the portfolio lives on the canvas.", source: { slideId, title: null } },
    ]);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || asking) return;

      setDraft("");
      setAsking(true);
      /*
       * The transcript is the history. Reading it back here rather than
       * keeping a second array means the two can never disagree about what
       * was said.
       */
      const asked: Turn[] = [...turns, { role: "user", text }];
      setTurns(asked);

      try {
        const res = await fetch(`${PRESENTER_API}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: asked.map((t) => ({
              role: t.role === "user" ? "user" : "assistant",
              content: t.text,
            })),
          }),
        });

        if (!res.ok) {
          setTurns([
            ...asked,
            {
              role: "guide",
              text:
                res.status === 429
                  ? "That's a lot of questions at once — give me a moment and try again."
                  : `I couldn't reach the guide just then. ${site.email} always works.`,
            },
          ]);
          return;
        }

        const data: {
          reply?: string;
          navigate?: { slideId?: string; title?: string | null } | null;
        } = await res.json();

        const slideId = data.navigate?.slideId;
        setTurns([
          ...asked,
          {
            role: "guide",
            text: data.reply?.trim() || "I don't have anything on that one.",
            source: slideId ? { slideId, title: data.navigate?.title ?? null } : undefined,
          },
        ]);
      } catch {
        setTurns([
          ...asked,
          {
            role: "guide",
            text: `I couldn't reach the guide just then. ${site.email} always works.`,
          },
        ]);
      } finally {
        setAsking(false);
        input.current?.focus();
      }
    },
    [asking, turns],
  );

  const answered = turns.length > 0 && turns[turns.length - 1].role === "guide";

  return (
    <>
      {open && (
        <div className="guide-panel" role="dialog" aria-label="Ask the guide">
          <header className="guide-head">
            {about.portrait && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={about.portrait.src} alt="" />
            )}
            <div>
              <strong>The Guide</strong>
              <span className="k">Ask me about {site.name.split(" ")[0]}</span>
            </div>
          </header>

          <div className="guide-body" ref={log} role="log" aria-live="polite">
            <p className="guide-bubble">
              Ask me anything about {site.name.split(" ")[0]} — his work, where he has been, or
              whether he is free. I answer from this site and I will take you to the part I am
              talking about.
            </p>

            {turns.length === 0 && (
              <div className="guide-chips">
                {OPENERS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => ("ask" in chip ? ask(chip.ask) : reveal(chip.scrollTo))}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {turns.map((turn, i) => (
              <div key={i} className={turn.role === "user" ? "guide-said" : "guide-bubble"}>
                {turn.text}
                {turn.source && <SourceLine source={turn.source} onReveal={reveal} />}
              </div>
            ))}

            {asking && (
              <p className="guide-bubble is-typing" aria-label="The guide is answering">
                <span />
                <span />
                <span />
              </p>
            )}

            {answered && !asking && (
              <div className="guide-chips">
                {FOLLOW_UPS.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <GuideVoice
            onReveal={revealOnly}
            onCanvas={toCanvas}
            onMessage={say}
            onLive={setVoiceLive}
          />

          <form
            className="guide-ask"
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
          >
            <input
              ref={input}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={asking ? "Thinking…" : "Ask about his work"}
              aria-label="Ask a question"
              autoComplete="off"
              disabled={asking}
            />
            <button type="submit" disabled={asking || !draft.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`fab${open ? " is-open" : ""}${asking || voiceLive ? " is-thinking" : ""}`}
        aria-expanded={open}
        aria-label={open ? "Close the guide" : "Ask the guide"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <span className="fab-x" aria-hidden>
            ✕
          </span>
        ) : (
          <svg viewBox="0 0 40 16" aria-hidden className="fab-wave">
            <path
              d="M1 8c3 0 3-6 6-6s3 12 6 12 3-10 6-10 3 8 6 8 3-5 6-5 3 3 8 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}

/**
 * Where the answer came from.
 *
 * A slide is a section on this page and a position on the canvas. When the
 * page has the section, the source scrolls there and marks it. When it does
 * not — the volunteering and community work live on the canvas and nowhere
 * else — the source links out to the canvas instead. That is not a gap being
 * papered over: it is the passage between the two surfaces, and the reason
 * /explore is still worth having.
 */
/** A few slides are titled by position rather than subject, and "Slide 4" names nothing. */
const UNHELPFUL = /^slide \d+$/i;

function SourceLine({ source, onReveal }: { source: Source; onReveal: (id: string) => void }) {
  const section = sectionFor(source.slideId);
  const named = source.title && !UNHELPFUL.test(source.title) ? source.title : null;
  const label = named ?? "this part of the site";

  return (
    <span className="guide-source">
      {section ? (
        <button type="button" onClick={() => onReveal(section)}>
          {label}
        </button>
      ) : (
        <a href={canvasHref(source.slideId)}>{label} — on the canvas ↗</a>
      )}
    </span>
  );
}
