# Evan.H Portfolio

**English** · [简体中文](README.zh-CN.md)

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Live](https://img.shields.io/badge/live-evanh.dev-2F855A)

A personal portfolio written once and rendered three ways — a page, a sixty-slide WebGL deck and a Chinese summary — with a guide you can ask, which answers only from the records that render the page and names the one it used. An answer you can check beats an answer you have to believe.

**[Open the site](https://evanh.dev/)** · **[The canvas deck](https://evanh.dev/explore/)** · **[中文摘要](https://evanh.dev/zh/)**

## What you can check, in two minutes

- **Ask the guide something and look underneath the answer.** The underlined line names the slide the model was given, and clicking it scrolls the page there. [Try it](https://evanh.dev/).
- **Turn JavaScript off, or read the page source.** The content is in the exported HTML, not drawn into the canvas. The canvas goes over the top.
- **Open a deep link.** [`/explore#how-i-work`](https://evanh.dev/explore#how-i-work) lands on that slide rather than playing the opening at you. There are twenty-six of them in the sitemap.
- **Read the Chinese page.** [`/zh`](https://evanh.dev/zh/) states no fact of its own: every line is keyed to the same record as the English, and the build fails when the two fall out of step.
- **Read why it is built this way.** [The decisions](docs/DECISIONS.md) that were hard to walk back, each with what it costs and what would make it wrong.

An independent personal project. Evan's own material only: no third-party personal data, no client work, nothing behind a login. **Source, architecture and a code walkthrough are available on request** — [message me on LinkedIn](https://www.linkedin.com/in/evan-h-165976301/) or email [yuxianghuang2026@gmail.com](mailto:yuxianghuang2026@gmail.com).

## The problem

A portfolio is read in two incompatible ways. A recruiter has thirty seconds and wants facts: what was built, what changed, is he available. Another engineer wants to wander around and see how it works.

Serve the first and the site is a résumé in HTML. Serve the second and the facts are buried in an experience. Write it twice and it works for a week — then one copy gets a new project and the other does not, and the visitor is the one who finds out.

Three things go wrong after that. Text drawn into a canvas is pixels: no crawler, no screen reader, no Ctrl+F. A number written in prose goes stale, and a claim nobody checks is decoration. And an assistant bolted onto a portfolio answers from a hand-written summary in its prompt — a second copy of the content, which drifts from the first within a release or two.

## Who it is for

Recruiters and hiring managers who want facts quickly. Engineers who want to see how it is put together. Visitors who read Chinese. And anyone arriving with a screen reader, a crawler, or JavaScript switched off — for whom the semantic HTML is the artifact, not a fallback.

## One question, start to finish

A visitor opens the panel in the corner and asks *what is Rivulet LocalOps?*

1. **The panel wakes the broker** with a preflight that makes no model call and costs nothing, so the function is warm by the time the question is typed. Cold start measured 14.1 seconds against 2.6 warm.
2. **Retrieval picks the slides** — the top six of sixty for this question. Ask something with no subject, like "hello", and it falls back to a spine of seven slides that answer *who is this* and *how do I reach him*, rather than the top six of a meaningless ranking.
3. **Only those slides go in the prompt**, with the persona. Not the whole deck.
4. **The answer names its source**, chosen from the slides the model was actually shown — so it cannot cite one it never read.
5. **The page moves** to that section and marks it. For the fourteen slides the deck carries and the page does not, the source links to the canvas instead.

Measured on the live site: 4.4 to 5.3 seconds, consistently.

## What it guarantees

Boundaries, rather than features — what the thing will and will not do.

- **The guide answers from the site, or not at all.** Its whole knowledge is generated from the records that render the page, so it cannot describe a version of the site that no longer exists.
- **Availability is quoted, never reasoned about.** It is the first question a recruiter asks, and a model reasoning from *he is studying and interning* arrives at *he is not available*, which is false.
- **The source line is a fact about the request, not about the reply.** Retrieval happens first; the slide named underneath is one the model was handed.
- **The guide is read-only.** Nothing it says can reach the content. Content changes go through the build like any other change.
- **The build refuses, not the page.** A link that resolves to nothing, a status nobody defined, a stray second language, or a test count that no longer matches the suite stops the build.
- **Asking costs nothing, and the ceiling that matters is enforced server-side.** Text runs on a free model. The voice tour is opt-in and capped at twenty sessions a day, counted before a session is minted. The per-call length cap runs in the browser and a determined visitor could defeat it — that is a courtesy, and it is labelled as one rather than glossed.
- **Nothing reaches the site that has not passed the same checks twice.** Every change is built, type-checked, tested, and audited for known vulnerabilities in what it depends on — on the machine it was written on, and again before it is allowed to deploy. A failure stops the release rather than the visitor.
- **The page runs only the scripts its own policy already names, and can reach nothing but this site's own interface.** A script that somehow got in would have nowhere to send anything. A test holds the policy in place, because this kind of protection fails quietly: the page still loads, it is simply no longer defended.
- **What becomes public is named in advance, not tidied up afterwards.** This repository is published from a list of files allowed to leave; anything new stays private until someone adds it to that list. The site itself sets no cookie that follows anyone.

## What works today, and what does not

Working: one content source behind a typed loader, with the page, the deck, the menu, the search index, the sitemap, the Chinese page and the guide's catalogue all derived from it. Both renderers, with the DOM left in the accessibility tree. The text guide and the opt-in voice tour. 110 unit tests for the site and 47 for the broker.

Not finished: there is no recommendations section — it needs real quotes from people Evan has worked with, and placeholders would be worse than the gap. The Chinese page's share card is still drawn in English, because `next/og` needs an embedded CJK font. And there is no authentication anywhere; everything here is public by design.

## Want to see more?

The code is not in this repository, and that is deliberate rather than coy. A portfolio site is the one thing every graduate is short of, and with the source attached this one is a few hundred files away from being someone else's with the names swapped. Reading about how it works should cost nothing; taking it wholesale is a different thing.

Offered on request, over a call: the source, the architecture — the grid and camera parameters, the routing, the notes backend, the voice broker — the retrieval work behind the guide, the bilingual content model and the build check that holds the two languages equal, the test suite and the evidence behind the numbers above, and the problems that became rules.

**[Message me on LinkedIn](https://www.linkedin.com/in/evan-h-165976301/)**, or email **[yuxianghuang2026@gmail.com](mailto:yuxianghuang2026@gmail.com)**. For both of us that is a better half hour than a `git clone`.

## Status, copyright and terms

Live at **[evanh.dev](https://evanh.dev)**, maintained — a personal site, not a product and not for reuse. This repository holds the writing and the reasoning: this README in both languages, the decision record, and the licence.

© 2026 Evan Huang. All rights reserved; see [LICENSE](LICENSE). Published to be read, and sharing links is welcome. Not licensed for reuse: the code, design, written content, images and CV may not be republished, copied or adapted without written permission. The borrowed photograph on the opening plate keeps its own licence and carries its credit on the page.
