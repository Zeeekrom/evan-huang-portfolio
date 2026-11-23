# Decisions

Decisions that are hard to walk back, and the reasoning that is otherwise
lost. Each entry says what was decided, why, what it costs, and what would
make it wrong — that last line is the one that matters, because a decision
recorded without its expiry condition becomes dogma.

One file rather than one file per decision. The convention is a file each;
this is a one-person repository and a single page gets read, where a folder
of twenty does not. Split it when it stops being readable.

Not here: how things work (`ARCHITECTURE.md`), how to deploy
(`DEPLOYMENT.md`), or what is in flight (`WORK-STATUS.md`, private).

---

## 1. The site is a static export, with no server

**Decided** early, still true. `output: "export"` in `next.config.ts`; the
deployed artifact is HTML, CSS and JS on Cloudflare Pages.

**Why.** A portfolio has to outlive its hosting credit. Static files cost
nothing to serve and can move hosts in an afternoon. The one piece that
genuinely needs a server — the AI guide — is a separate Azure Function App,
so the site survives it being switched off.

**Costs.** No server means no nonce for CSP (see 7), no server-side
redirects (see 2), no incremental rendering, and `next build` has to run
before anything that reads the output: type checking, the presenter
catalogue, the CSP.

**What would change it.** Needing per-request logic in the page itself. The
guide does not count; it is already elsewhere.

---

## 2. Host-level rules live in Cloudflare, not in the repository

**Decided** 2026-11, after a wrong turn.

`public/_headers` sets headers per path. It cannot match a hostname, so
`www.evanh.dev` → `evanh.dev` is a **zone Redirect Rule** in the Cloudflare
dashboard, not a file here. A `_redirects` file was written for this and
deleted: Cloudflare's own documentation lists domain-level redirects as
unsupported in it.

**Costs.** One rule lives outside version control. If the zone is ever
rebuilt, the www redirect has to be recreated by hand, and nothing in this
repository will say so except this paragraph.

**What would change it.** Moving off Cloudflare, or Pages learning hostname
matching.

---

## 3. The two languages are held equal by a build check, not by discipline

**Decided** 2026-11. `src/data/parity.ts` fails the build when `content/` and
`content/zh/` disagree in shape, when a pinned field (ids, slugs, links,
dates) differs, or when prose is byte-identical across languages — which
means someone pasted English into the Chinese file.

**Why.** The Chinese pages are not a translation layer bolted on; they are a
second content set rendered by the same components. Without the check they
drift silently, and a visitor reading `/zh/` gets a page that quietly lies
about a date or links somewhere else.

**Costs.** Every content change is two changes. Adding a field means adding
it to the parity lists. This is the intended friction.

**What would change it.** Dropping the Chinese pages entirely. Note the
scope that was set deliberately: `/explore` and the AI guide are
English-only, by the author's own decision, and that is not an oversight to
be fixed.

---

## 4. The public mirror exists to be read, not reused

**Decided** 2026-08, revisited 2026-11-22.

`Zeeekrom/evan-huang-portfolio` is a public mirror of this private
repository, pushed by `scripts/sync-public.py`. The LICENCE says all rights
reserved: published to be read, not reused.

**Revisited because** the mirror was a complete, runnable clone — 194 files,
including `src/`, `api/`, the tests and `package-lock.json`. Every other
project's showcase repository carries evidence and documents and no source.
That makes this one the exception, against the author's own standing rule
that public repositories hold showcase material only.

**Costs either way.** Making it private breaks any link already printed on a
CV. Reducing it to showcase material keeps the link and loses the ability to
point an interviewer at the code — which is what the "source and a code
walkthrough on request" line in the README is for: it turns a copy into a
conversation.

**What would change it.** Deciding the code itself is the portfolio piece.
That is a real position; it is just not the one that was chosen.

---

## 5. A button that says "live" must open something live

**Decided** 2026-11.

Project cards list what a reader can actually open, each named by its kind:
`live`, `live-invite`, `replay`, `walkthrough`, `film`. Three of the live
demos sit behind Cloudflare Access and answer 302 to a login page, so they
are labelled **by invitation** before they are clicked, not after.

**Why.** A single `demo` field could only name one thing, and it was naming
whichever happened to exist. Sending someone to a login page from a button
marked "live" is the one promise a portfolio should not break.

**Costs.** Five kinds to keep straight in two languages, and the labels are
content, so parity (3) applies.

---

## 6. The old Azure address is a redirect page, kept until roughly 2027-05

**Decided** 2026-11-20.

`evanhuangportfolio.z44.web.core.windows.net` no longer receives a copy of
the site. Azure Storage serves one page — `scripts/azure-redirect/index.html`
— as both the index and the 404 document, so deep links keep their path on
the way to `evanh.dev`.

**Why.** CVs and emails already carry the old address. Azure Storage static
websites cannot issue a server-side 301, so the redirect is a page.

**Costs.** It is a client-side redirect: slower, and it needs JavaScript,
which is why there is also a meta refresh and a visible link. The CI step
that updates it retries, because `az storage blob service-properties update`
is eventually consistent and the status code immediately afterwards means
nothing.

**What would change it.** The old address going out of circulation, or Azure
being switched off.

---

## 7. The Content Security Policy is hashed per page, with two concessions

**Decided** 2026-11-23. `scripts/gen-csp.mjs`, held by `test/csp.test.mjs`.

No server means no nonce (1), and every page carries inline `<script>` blocks
that *are* the rendered page — Next's RSC flight data — so their hashes
change whenever the content does. Hence a generator that runs after the
build and writes one rule per page into `out/_headers`, and a test, because a
hash policy fails **silently**: the browser blocks the script, the canvas
watchdog falls back to readable HTML, and the page still answers 200.

**Concession one: `style-src-attr 'unsafe-inline'`.** The project cards are
positioned with React-computed `style="transform: …"` attributes, 59 on the
home page. A style attribute has no hash form in CSP. The alternative is
generating a stylesheet of per-card transforms, which is worse code for no
attacker anyone can name.

**Concession two was avoided, and is worth recording.** PixiJS compiles
shaders with `new Function`, so a policy without `'unsafe-eval'` stops the
canvas dead. Rather than weaken the policy, `Canvas.tsx` imports
`pixi.js/unsafe-eval` — a module whose name reads backwards: it is what makes
Pixi work *without* unsafe-eval. **Do not delete that import to tidy the
file.**

**Honest about the value.** There is no known injection path here: nothing
calls `innerHTML` except the deliberate boot script, the guide's answers
render as React text and are escaped, and the rest is author-written JSON
baked in at build time. This is defence in depth, for a later mistake, and
`connect-src` is the part that earns its keep — it stops anything that does
get in from talking to a host that is not ours.

**What would change it.** Server-side rendering, which would bring nonces
and make all of this unnecessary.

---

## 8. CodeQL is kept although it cannot run

**Decided** 2026-11-22.

`.github/workflows/codeql.yml` exists with no automatic triggers. Code
scanning on a private repository needs GitHub Advanced Security, which a
personal account cannot buy: the API returns 403, and a push-triggered run
completes the analysis and then fails on the upload (run 45027645724).

The triggers are off rather than the file deleted, because a permanently red
workflow is worse than no workflow — it teaches you to ignore a red X, and
the next one will be real. `workflow_dispatch` stays so the day it becomes
possible can be tested in one click.

**Why keep it.** It starts working the day the repository is public or moves
into an organisation, and deleting it means re-deriving this in a year.
Until then the gate that actually catches vulnerable dependencies is
`npm audit` inside `npm run check`, plus Dependabot alerts — which is not
theoretical: wiring Dependabot up immediately surfaced a critical Next.js
advisory that an exact version pin had hidden from `npm audit fix`.

**What would change it.** The mirror decision (4), either way.

---

## 9. Visitor numbers come from Cloudflare's edge, and nothing is added to the page

**Decided** 2026-11-23.

No analytics script, no beacon, no cookie. The zone's own edge analytics
already report requests, visits, top paths, countries, browsers, operating
systems and device types, server-side, on the free plan.

**This started as a correction, not a choice.** Cloudflare Web Analytics had
been enabled on the zone with automatic setup since 2026-11-20, during the
move to this domain, and was injecting `static.cloudflareinsights.com/
beacon.min.js` into every HTML page. Nobody had decided that; it came with
the migration, and it was invisible to `curl` because the injection only
happens for requests that ask for HTML the way a browser does. The CSP in
(7) is what found it — the browser refused the script and said so. Which
means the terms page had been telling readers the site "runs no analytics"
while a third-party analytics script loaded on every page. RUM is now set to
Disable, verified gone from `/`, `/explore/`, `/zh/` and `/terms/`, and a
browser on the live site reports no cookies and no third-party scripts at
all.

**Worth knowing before reversing this.** The beacon was the only thing
separating people from bots: it counted 22 page views and 15 visits in the
same 24 hours that the edge counted 10.18k requests and 2.73k "visits". The
edge numbers are mostly scanners. If visitor counts ever need to mean
readers, this is the trade being made — and the terms page is what changes
first.

**Why this rather than Cloudflare Web Analytics.** The beacon would cost a
third-party script in `connect-src` and `script-src` (7), and — the real
reason — the terms page tells readers this site "sets no cookies, runs no
analytics, and loads no webfonts" and that server logs are kept by the hosts
with "I add nothing to them". Adding a beacon would make two published
sentences false. A published promise is worth more than finer-grained
numbers.

**Costs.** No per-visitor funnels, no events, no retention cohorts. Edge
numbers also count bots, which on a public domain is most of the traffic.

**What would change it.** Needing to know what a *reader* did on the page
rather than what was requested — at which point the terms page changes
first, in both languages, and then the code.

---

## 10. Removing something from a public repository means deleting the repository

**Decided** 2026-11-23, after measuring rather than assuming.

Reducing this repository to showcase material (4) was done with a force push
to a fresh root commit. That is not removal. The replaced commit stayed
fully readable: `raw.githubusercontent.com` served a 26KB source file from it
to an anonymous request, and the SHA needed to ask for it was published in
the repository's own anonymous events feed, which GH Archive mirrors
permanently.

So the repository was deleted and recreated under the same name, with the
showcase content as its first commit. Verified afterwards: the old commit
returns 422 from the API and 404 from the web. A `raw` URL fetched minutes
earlier kept answering 200 from a Fastly cache with a five-minute TTL, which
is worth knowing before anyone takes one 200 as proof that a deletion
failed.

**This only works without forks.** A fork keeps the objects alive in the
network and deleting the original removes nothing. This repository had none;
check before relying on it.

**Costs.** The creation date resets, and that is all — the URL is unchanged,
so printed links keep working, and there were no stars, forks or watchers to
lose. What cannot be undone is a copy someone already cloned.

**What would change it.** Nothing about the method. The decision worth
revisiting is (4): whether the repository should be public at all.
