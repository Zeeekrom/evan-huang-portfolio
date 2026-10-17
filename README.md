# Evan Huang — Portfolio

An interactive portfolio that renders the same content two ways: a semantic HTML
document that crawlers and screen readers can read, and a pan-and-zoom WebGL
canvas of 36 slides you can fly through — with a voice guide that gives you a
tour and moves the camera while it talks.

**Live:** https://evanhuangportfolio.z44.web.core.windows.net/
· [`/`](https://evanhuangportfolio.z44.web.core.windows.net/) the classic page
· [`/explore`](https://evanhuangportfolio.z44.web.core.windows.net/explore/) the canvas

---

## What is interesting about it

**One content source, every surface.** All copy lives in
[`src/data/content.ts`](src/data/content.ts) as a structured, bilingual model.
Everything else is derived from it — 36 slides, the menu, the search index, the
sitemap, and the knowledge base the voice guide answers from. Adding a project
is one entry; nothing else is touched.

**Two renderers, one model.** Text drawn into WebGL is pixels: crawlers cannot
read it, screen readers cannot speak it, Ctrl+F cannot find it. So the semantic
DOM is not a fallback — it is the exported HTML, complete, and the canvas hides
it visually once it starts while leaving it in the accessibility tree. With
JavaScript off the site degrades to a plain, whole page.

**A guide that drives the view.** Start the presenter and it walks the deck on
its own, flying the camera to each stop as it narrates, and you can interrupt it
at any point to ask about something. The browser never holds a credential — an
Azure Function mints a short-lived secret and exchanges the SDP, after which
audio streams directly and the broker is out of the path.

**Content checks that run like tests.** `npm run content` validates the content
model the way a build validates types: key uniqueness, referential integrity,
bilingual completeness, per-field length budgets against what the guide can
actually read.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, `output: "export"`) |
| Canvas | PixiJS v8 (WebGL2) |
| Styling | Tailwind CSS 4 |
| Hosting | Azure Storage static website |
| API | Azure Functions (Consumption, Node 24) |
| Storage | Azure Table Storage |
| Voice | OpenAI Realtime over WebRTC |
| CI/CD | GitHub Actions |

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # static export to out/
npm test             # 39 unit tests
npm run content      # content model checks
npm run content:map  # regenerate the content slot inventory
```

The voice guide and sticky notes call a deployed Azure Function, so they need
that origin allow-listed; everything else runs locally without it.

---

## Documentation

| | |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the system works: grid and camera parameters, routing, theming, the tools, the notes backend, the voice guide, deployment — and the traps hit along the way |
| [docs/CONTENT.md](docs/CONTENT.md) | The content layer: what one entry turns into, and what updates on its own |
| [docs/CONTENT-SLOTS.md](docs/CONTENT-SLOTS.md) | Every writable field, its format, and where it appears (generated) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hosting choices and the deploy pipeline |
| [content/README.md](content/README.md) | For whoever edits the words rather than the code |

## Editing

Content is edited through a form at [Pages CMS](https://pagescms.org) — it reads
`.pages.yml`, writes to `content/*.json`, and commits like any other change, so
CI validates and deploys it. Editing the JSON directly works just as well.

`/admin` shows the notes visitors have left. It is a static page holding no
secret: the admin key is typed once and kept in that browser.

---

## Usage

All rights reserved. This repository is public to be read — the architecture,
the content model and the notes in `docs/` are meant to be useful to anyone
looking at how it is put together. It is not licensed for reuse, and the
written content, images and CV are personal material.

If something here would help you, get in touch.
