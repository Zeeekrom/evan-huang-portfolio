# The guide

One guide, two outlets.

The corner panel on the page and the voice tour on the canvas are not two
features. They are the same guide answering from the same catalogue, over two
transports, into two renderers. Everything below follows from that.

---

## 1. What exists

| | where | state |
| --- | --- | --- |
| Catalogue | `api/presenter.json`, built by `scripts/gen-presenter.mjs` | 60 slides with bodies, generated from the exported deck |
| Text guide | `POST /api/ask` → `{ reply, navigate }` | live, free (GLM-4.7-Flash) |
| Voice guide | `POST /api/voice`, WebRTC SDP broker | live, **billed per second of audio** |
| Tour itinerary | `src/lib/tour.ts` | drives one stop per turn, interruptible |
| Corner panel | `src/components/Guide.tsx` | shell only until Phase 1 |

The catalogue is generated from the same `Slide[]` that renders both surfaces,
so the guide cannot be told about a slide that does not exist, or miss one that
does. That property is the whole reason this is worth building rather than
buying: a hand-written profile blurb drifts from the page it sits beside within
a release or two, and the visitor is the one who finds out.

## 2. What the reference does, and does not

The reference site's assistant is a Cloudflare Worker behind
`POST { message, history } → { reply }`. Non-streaming, history kept in the
browser, capped at 20 turns. No retrieval, no citations, no navigation, no
voice.

Its knowledge is a hand-maintained profile summary, and it has already come
apart from the site: asked how many cats its owner has — a fact in the last
paragraph of the page it is sitting on — it does not know, and it describes a
shipped project as one still being built.

So what is worth taking is the **shape**, not the intelligence: a resident
corner button, two opening chips, follow-up chips after every answer, a typing
indicator, and one animation whose entire state API is a rate (idle, thinking,
a burst on send).

## 3. The one idea: a destination has two forms

An answer names a place in the portfolio. That place is a slide on the canvas
and a section on the page:

```
{ slideId: "rivulet-localops-highlight-1", section: "projects" }
```

The canvas flies the camera to the slide. The page scrolls to the section and
marks it. Same answer, same contract, two renderers — which is how the rest of
this site already works, with the guide as the third consumer of `Slide[]`
rather than a bolt-on with its own copy of the content.

The mapping lives in `src/lib/sections.ts`, keyed by slide-id prefix, and a test
asserts every slide in the deck either maps to a section on the page or is
listed as deliberately canvas-only.

**Canvas-only slides are a bridge, not a gap.** Fourteen community and
volunteering slides and `education` have no section on the page. When the best
source for an answer is one of them, the reply carries a link to that slide on
the canvas. The limitation becomes the passage between the two surfaces, and
gives `/explore` a reason to exist that is not nostalgia.

## 4. Phases

### Phase 1 — correctness, then the text panel (no new cost) — **done**

Nothing ships to the corner of the homepage until the guide is right. A wrong
answer in the most visible position on the site is worse than no answer.

1. **Stop the tool call leaking into the reply.** The model prints its
   navigation as prose in at least three forms — `navigate_to_slide(contact)`,
   `[navigate_to_slide: rivulet-localops]`,
   `navigate_to_slide([experience, internships-china])` — and the recovery in
   `ask.mjs` only matched a fourth, JSON one. Every live answer currently opens
   with a leaked line. Recover the destination from any of them, then strip the
   line.
2. **Put availability in the catalogue.** `hero.available` never reached it, and
   the persona went further and listed availability among the things the guide
   does not have. Asked whether Evan is free for work — the first question a
   recruiter asks — the live guide answers that he is not, which is the
   opposite of true. The line goes in as a fact block and the persona is told
   to quote it rather than reason about it.
3. **Wire the panel** to `/api/ask`, with the reference's shape: opening chips,
   follow-up chips, typing indicator, and a send that moves the page.
4. **Warm the broker on open.** Consumption plans cold-start; a measured
   14.1s first answer against 2.6s and 1.6s warm. Firing a warm-up when the
   panel opens hides the cold start behind the seconds the visitor spends
   typing.

### Phase 2 — retrieval, and therefore citations — **done**

The persona currently carries the whole catalogue: 26,959 characters of system
prompt on every question. It works, and it pays for the whole deck to answer
one question, and it can never say where an answer came from.

Embeddings would mean paying a model to build an index. There is a free
alternative already in the repository: `api/src/shared/relevance.mjs` is a term
overlap scorer, used today to *derive* navigation after the fact. Turn it
around and it is retrieval — pick the top-k slides for the question, send only
those. Local, deterministic, free, and at 60 records a BM25-shaped scorer is
the right size of tool.

The gain is not a cleverer answer. It is **a checkable one**: every reply
carries the slide it came from, and the visitor can go and read it. That is the
argument this site makes everywhere else — evidence a reader can check rather
than claims they have to take — and the guide was the one part not holding to
it.

**What it took.** The first version scored 7 of 16 on real questions, and each
failure was worth the measurement:

- IDF removes the need for a corpus stoplist and gets *questions* exactly
  backwards. "Tell" appears on one slide, whose body opens "Tell me what keeps
  breaking", so it was the most informative word in the question and "tell me
  about his volunteering" returned the contact card. Question words are
  dropped — a query-side list, which is a different thing from the corpus-side
  one IDF exists to avoid.
- Length normalisation at the usual B=0.75 let two-line cover cards beat
  two-thousand-character bodies. B is 0.3.
- The subject's own name is on every slide of his own portfolio, and the title
  weight made it the strongest term in "What did Evan do at Tencent?".
- Indexing the **slide id** closes most of the gap between a visitor's words
  and a slide's: the contact card never says "contact", but its id does.
- Suffix folding needs the English plural rule. Stripping "es" blindly turned
  "values" into "valu", which matched nothing.

Measured after that: the right slide reaches the prompt for **19 of 19** real
questions, the prompt drops from 27,526 characters to the persona (2,698) plus
six slides, and live latency tightened from a 1.6–16.3s spread to 4.4–5.3s.

### Phase 3 — voice on the page — **done**

Last because of dependency, not doubt: voice needed the section mapping and the
corrections from Phase 1, and both are in place now. Adding speech to a guide that answers the
availability question backwards only says the wrong thing louder.

- **Opt in, never automatic.** A "listen instead" control inside the panel
  opens the WebRTC session. Audio is billed by the second and the corner button
  is on the landing page, where the canvas link was not.
- The tour keeps `tour.ts`'s one-stop-per-turn driving and stays interruptible;
  only its destinations change from slides to sections.
- **A budget gate:** a daily ceiling and a per-session length cap. On reaching
  either, the panel falls back to text and says why. When the student credit
  ends the site keeps working, which is the standing constraint on everything
  here.

**The page needed its own route.** Two of the canvas tour's eight stops — the
community work and education — have no section on this page, and a guide
narrating a stop while the page sits still reads as the site being broken.
`PAGE_ROUTE` visits seven stops that all exist here, in the order the page
itself argues. Nothing is hidden by that: ask about the volunteering and the
answer still comes, carrying a link to the canvas.

**Only one of the two caps is enforceable, and it is worth being plain about
which.** Once the SDP has been exchanged, audio runs directly between the
browser and the provider with the broker out of the path, so nothing on the
server can end a call that is already running. The length cap therefore lives
in the browser and a determined visitor could defeat it. The ceiling money
depends on is the daily one: claimed in `api/src/shared/budget.mjs` before a
session is minted, with an ETag so two visitors pressing at once count as two,
and **failing closed** — a budget that opens when its storage is down is not a
budget. A claim is given back when the session it paid for was never minted,
so a provider outage cannot spend the day on nothing.

**The voice client is never downloaded until someone asks for it.** It pulls in
the tour, which builds its narration from the deck, which is most of the site's
content — and a landing page is mostly visitors who never press the button.
`Guide.tsx` loads it through `next/dynamic` on first click; the homepage's
eight chunks contain none of it.

## 5. What is not covered

A spoken tour needs a microphone and a listener, so the parts verified here are
the ones that can be: the control, the lazy load, the microphone refusal, the
budget refusal, and that every stop on the page route has somewhere to go.
Whether the tour *sounds* right is Evan's to judge, out loud, once.

## 6. Decisions already taken

- Correctness before reach: Phase 1 ships before the panel is advertised.
- Voice is opt-in, not the default.
- Canvas-only slides link out to `/explore` rather than earning a new homepage
  section.
