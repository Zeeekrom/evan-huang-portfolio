# Content slots

> **Generated — do not edit by hand.** `npm run content:map`
>
> Every writable piece of text on the site: **which field it lives in, and where it appears**.
> Use it to write content away from the code, then hand the entries back.
>
> How content flows and what an entry generates: [CONTENT.md](CONTENT.md).

The site is English only. A Chinese character in any content file fails the build.

## Legend

| Mark | Meaning |
|---|---|
| tour #N | The slide is stop N of the voice tour and is read aloud |
| menu | Appears in the top-left menu |
| anchor | Goes in the sitemap as a crawlable URL |
| many slides | The text appears on many slides (usually a technology name) and is not located |
| classic homepage only | Rendered only on `/` — **not on the canvas, and the guide cannot read it** |
| — | Nothing renders it at the moment |
| ⚠️ | Same text as another slot; "appears on" was matched by text and may be misattributed |

Current size: **59 slides**, of which 8 are tour stops and 27 have anchors.

---

## Site constants — `site`

Domain, email, social links, résumé file. These feed the SEO metadata and the contact slide.

| Field path | Current value | Appears on |
|---|---|---|
| `site.url` | https://evanh.dev | classic homepage only: `Contact`, `Guide` |
| `site.name` | Evan Huang | `intro` (tour #1 · menu · anchor) |
| `site.legalName` | Yuxiang Huang | classic homepage only: `Contact`, `Guide` |
| `site.location` | Hobart, Tasmania, Australia | classic homepage only: `Contact`, `Guide` |
| `site.kicker` | Applied AI Agent Engineer | classic homepage only: `Contact`, `Guide` |
| `site.email` | yuxianghuang2026@gmail.com | `contact` (tour #8 · menu · anchor) |
| `site.linkedin` | https://www.linkedin.com/in/evan-h-165976301/ | `contact` (tour #8 · menu · anchor) |
| `site.github` | https://github.com/Zeeekrom | many slides |
| `site.resumeFile` | /resume/Evan-Huang-Resume.pdf | `main-menu`<br>`contact` (tour #8 · menu · anchor) |

---

## Classic homepage navigation — `nav`

Only affects the classic homepage `/`, not the canvas.

| Field path | Current value | Appears on |
|---|---|---|
| `nav[0].id` | home | — |
| `nav[0].label` | Top | — |
| `nav[1].id` | about | — |
| `nav[1].label` | About | — |
| `nav[2].id` | skills | — |
| `nav[2].label` | Strengths | — |
| `nav[3].id` | projects | `main-menu`<br>`contact` (tour #8 · menu · anchor) |
| `nav[3].label` | Building | — |
| `nav[4].id` | cases | — |
| `nav[4].label` | Cases | — |
| `nav[5].id` | values | — |
| `nav[5].label` | Values | — |
| `nav[6].id` | experience | `main-menu`<br>`who-am-i` (tour #2 · menu · anchor)<br>`ue5-financial-education-highlight-1` |
| `nav[6].label` | Record | — |
| `nav[7].id` | publications | — |
| `nav[7].label` | Published | — |

---

## Homepage hero — `hero`

Only affects the classic homepage `/`. The canvas opens on the `intro` slide, whose title is written in `slides.ts`.

| Field path | Current value | Appears on |
|---|---|---|
| `hero.statement.lead` | A model that answers is not a system that runs. | — |
| `hero.statement.pivot` | The distance between them is | — |
| `hero.statement.swap[0]` | permission. | — |
| `hero.statement.swap[1]` | review. | — |
| `hero.statement.swap[2]` | ownership. | — |
| `hero.statement.swap[3]` | accountability. | — |
| `hero.trajectory[0]` | Tools for art teams | `intro` (tour #1 · menu · anchor) |
| `hero.trajectory[1]` | tools for developers | `intro` (tour #1 · menu · anchor) |
| `hero.trajectory[2]` | systems people actually run | `intro` (tour #1 · menu · anchor) |
| `hero.metrics[0]` | Acting CTO of an AI platform | — |
| `hero.metrics[1]` | 5 industry internships | — |
| `hero.metrics[2]` | 2 startups | — |
| `hero.metrics[3]` | Studied in 3 countries | — |
| `hero.metrics[4]` | 2 ACM papers | — |
| `hero.now[0].label` | Role | — |
| `hero.now[0].value` | Chief Technology Officer (Acting), AIA-Institute | — |
| `hero.now[1].label` | Study | — |
| `hero.now[1].value` | Master of Information Technology and Systems, University of Tasmania | — |
| `hero.now[2].label` | Building | — |
| `hero.now[2].value` | LiDAR perception for the UTAS Motorsport driverless car | — |
| `hero.now[3].label` | Based | — |
| `hero.now[3].value` | Hobart, Tasmania | — |
| `hero.ctaPrimary` | See the work | — |
| `hero.ctaSecondary` | Get in touch | — |
| `hero.available` | Full-time over the UTAS summer break (26 Oct 2026 – 21 Feb 2027); part… | — |
| `hero.shot.src` | /shots/hobart.jpg | — |
| `hero.shot.alt` | Hobart in daylight seen from the eastern shore: the city on the far ba… | — |
| `hero.shot.caption` | Hobart, Tasmania | — |
| `hero.shot.credit` | jacobharrisau | — |
| `hero.shot.creditUrl` | https://commons.wikimedia.org/wiki/File:Hobart,_kunanyi,_the_river_and… | — |
| `hero.shot.licence` | CC BY-SA 2.0 | — |
| `hero.shot.licenceUrl` | https://creativecommons.org/licenses/by-sa/2.0 | — |

---

## About — `about`

**The most important group.** `paragraphs` is the body of the canvas `who-am-i` slide and the guide's only source on who Evan is.

| Field path | Current value | Appears on |
|---|---|---|
| `about.heading` | About Me | classic homepage only: `Guide` |
| `about.aside` | How I got here, and what I am useful for. | classic homepage only: `Guide` |
| `about.portrait.src` | /shots/avatar.jpg | classic homepage only: `Guide` |
| `about.portrait.alt` | Evan Huang's avatar | classic homepage only: `Guide` |
| `about.lead` | I build and test software other people have to rely on: IT, data and A… | classic homepage only: `Guide` |
| `about.paragraphs[0]` | I'm finishing a Master of Information Technology and Systems at the Un… | `who-am-i` (tour #2 · menu · anchor) |
| `about.paragraphs[1]` | At an AI developer-tools company I did AI agent development, integrati… | `who-am-i` (tour #2 · menu · anchor) |
| `about.paragraphs[2]` | I co-founded an augmented-reality company planning location-based AR g… | `who-am-i` (tour #2 · menu · anchor) |
| `about.paragraphs[3]` | I volunteer the same way I work. At Glenorchy Library I give one-to-on… | `who-am-i` (tour #2 · menu · anchor) |
| `about.paragraphs[4]` | Right now I'm acting CTO at AIA-Institute, building an AI platform for… | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus` |
| `about.paragraphs[5]` | I'm open to graduate and junior roles, part-time work, placements and … | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus` |
| `about.logos.employers[0].org` | AIA-Institute | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-aia-institute-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[0].src` | /logos/aia-institute.png | classic homepage only: `Guide` |
| `about.logos.employers[0].alt` | AIA-Institute | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-aia-institute-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[1].org` | Strategy&Ops Consultancy | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-strategy-ops-consultancy-work-1` (menu · anchor)<br>`work-strategy-ops-consultancy-work-2`<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[1].src` | /logos/strategy-and-ops.png | classic homepage only: `Guide` |
| `about.logos.employers[1].alt` | Strategy&Ops Consultancy | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-strategy-ops-consultancy-work-1` (menu · anchor)<br>`work-strategy-ops-consultancy-work-2`<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[2].org` | Tencent | classic homepage only: `Guide` |
| `about.logos.employers[2].src` | /logos/tencent.png | classic homepage only: `Guide` |
| `about.logos.employers[2].alt` | Tencent | classic homepage only: `Guide` |
| `about.logos.employers[3].org` | Perfect World | `who-am-i` (tour #2 · menu · anchor)<br>`position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[3].src` | /logos/perfect-world.png | classic homepage only: `Guide` |
| `about.logos.employers[3].alt` | Perfect World | `who-am-i` (tour #2 · menu · anchor)<br>`position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[4].org` | Lilith Games | `who-am-i` (tour #2 · menu · anchor)<br>`position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.employers[4].src` | /logos/lilith-games.png | classic homepage only: `Guide` |
| `about.logos.employers[4].alt` | Lilith Games | `who-am-i` (tour #2 · menu · anchor)<br>`position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[0].org` | Libraries Tasmania | `people-place` (tour #4 · menu · anchor)<br>`libraries-tasmania` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[0].src` | /logos/libraries-tasmania.png | classic homepage only: `Guide` |
| `about.logos.community[0].alt` | Libraries Tasmania | `people-place` (tour #4 · menu · anchor)<br>`libraries-tasmania` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[1].org` | Tasmanian Health Service | `people-place` (tour #4 · menu · anchor)<br>`hospitals-south` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[1].src` | /logos/tasmanian-health.svg | classic homepage only: `Guide` |
| `about.logos.community[1].alt` | Tasmanian Health Service | `people-place` (tour #4 · menu · anchor)<br>`hospitals-south` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[2].org` | Raise Foundation | `people-place` (tour #4 · menu · anchor)<br>`raise-foundation` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[2].src` | /logos/raise.svg | classic homepage only: `Guide` |
| `about.logos.community[2].alt` | Raise Foundation | `people-place` (tour #4 · menu · anchor)<br>`raise-foundation` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[3].org` | Mother's Day Classic Foundation | `people-place` (tour #4 · menu · anchor)<br>`mothers-day-classic` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `about.logos.community[3].src` | /logos/mothers-day-classic.png | classic homepage only: `Guide` |
| `about.logos.community[3].alt` | Mother's Day Classic | `who-am-i` (tour #2 · menu · anchor)<br>`people-place` (tour #4 · menu · anchor)<br>`mothers-day-classic` (menu) |
| `about.facts[0].label` | 5 | classic homepage only: `Guide` |
| `about.facts[0].value` | internships | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`internships-china` (menu · anchor) |
| `about.facts[1].label` | 4 | classic homepage only: `Guide` |
| `about.facts[1].value` | volunteer roles | classic homepage only: `Guide` |
| `about.facts[2].label` | 3 | classic homepage only: `Guide` |
| `about.facts[2].value` | countries | classic homepage only: `Guide` |
| `about.facts[3].label` | 2 | classic homepage only: `Guide` |
| `about.facts[3].value` | startups | `who-am-i` (tour #2 · menu · anchor) |
| `about.facts[4].label` | 1 | classic homepage only: `Guide` |
| `about.facts[4].value` | of me | classic homepage only: `Guide` |

---

## How I work with AI — `positions`

The `how-i-work` index plus one card per position. `evidence` must name slides that exist or the build fails; `source` is for tracing a position back and is never shown.

| Field path | Current value | Appears on |
|---|---|---|
| `positions[0].id` | autonomy-and-accountability | `how-i-work` (tour #3 · menu · anchor) |
| `positions[0].label` | More autonomy, more accountability | `how-i-work` (tour #3 · menu · anchor)<br>`position-autonomy-and-accountability` (menu) |
| `positions[0].claim` | The more autonomy an agent has, the more identity, permissions, data b… | `position-autonomy-and-accountability` (menu) |
| `positions[0].origin` | practice | `raise-foundation` (menu) |
| `positions[0].source` | NPC-AI-040 | — |
| `positions[0].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-tested-or-assumed` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[0].keyword` | Autonomy | — |
| `positions[1].id` | agent-is-what-it-can-reach | `how-i-work` (tour #3 · menu · anchor) |
| `positions[1].label` | An agent is what it can reach | `how-i-work` (tour #3 · menu · anchor)<br>`position-agent-is-what-it-can-reach` (menu) |
| `positions[1].claim` | An agent's real role is not the job title written in its prompt, but t… | `position-agent-is-what-it-can-reach` (menu) |
| `positions[1].origin` | learned | — |
| `positions[1].source` | NPC-SEC-002 | — |
| `positions[1].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-tested-or-assumed` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[2].id` | short-loops | `how-i-work` (tour #3 · menu · anchor) |
| `positions[2].label` | Short loops, a person in the loop | `how-i-work` (tour #3 · menu · anchor)<br>`position-short-loops` (menu) |
| `positions[2].claim` | Rather than handing an agent a task overnight, I prefer small task blo… | `position-short-loops` (menu) |
| `positions[2].origin` | learned | — |
| `positions[2].source` | NPC-AI-005 | — |
| `positions[2].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-tested-or-assumed` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[2].evidence[1]` | work-qingqiu-technology-co-ltd-work-1 | `position-short-loops` (menu)<br>`internships-china` (menu · anchor) |
| `positions[3].id` | human-judgement-sets-value | `how-i-work` (tour #3 · menu · anchor) |
| `positions[3].label` | Human judgement sets the value | `how-i-work` (tour #3 · menu · anchor)<br>`position-human-judgement-sets-value` (menu) |
| `positions[3].claim` | AI should extend professional knowledge, not replace creative judgemen… | `position-human-judgement-sets-value` (menu) |
| `positions[3].origin` | practice | `raise-foundation` (menu) |
| `positions[3].source` | NPC-AI-009 | — |
| `positions[3].evidence[0]` | work-perfect-world-co-ltd-work-1 | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor) |
| `positions[3].evidence[1]` | work-lilith-games-work-1 | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor) |
| `positions[3].keyword` | Judgement | — |
| `positions[4].id` | tested-or-assumed | `how-i-work` (tour #3 · menu · anchor) |
| `positions[4].label` | Say what is tested, and what is assumed | `how-i-work` (tour #3 · menu · anchor)<br>`position-tested-or-assumed` (menu) |
| `positions[4].claim` | A prototype should say that it is a prototype. I keep what has been te… | `position-tested-or-assumed` (menu) |
| `positions[4].origin` | practice | `raise-foundation` (menu) |
| `positions[4].source` | Own event debriefs and project notes, 2026 | — |
| `positions[4].evidence[0]` | tasmania-student-notes | `position-tested-or-assumed` (menu)<br>`position-people-who-bridge` (menu)<br>`projects-index` (tour #5 · menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `positions[4].evidence[1]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-tested-or-assumed` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[4].keyword` | Evidence | — |
| `positions[5].id` | people-who-bridge | `how-i-work` (tour #3 · menu · anchor) |
| `positions[5].label` | AI needs people who bridge | `how-i-work` (tour #3 · menu · anchor)<br>`position-people-who-bridge` (menu) |
| `positions[5].claim` | Putting AI to work needs hybrid roles that understand the business, di… | `position-people-who-bridge` (menu) |
| `positions[5].origin` | practice | `raise-foundation` (menu) |
| `positions[5].source` | NPC-AI-016 | — |
| `positions[5].evidence[0]` | tasmania-student-notes | `position-tested-or-assumed` (menu)<br>`position-people-who-bridge` (menu)<br>`projects-index` (tour #5 · menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `positions[5].keyword` | Bridge | — |
| `positions[6].id` | model-is-not-a-workflow | `how-i-work` (tour #3 · menu · anchor) |
| `positions[6].label` | A model is not a workflow | `how-i-work` (tour #3 · menu · anchor)<br>`position-model-is-not-a-workflow` (menu) |
| `positions[6].claim` | The gap that matters is between a model that can answer a question and… | `position-model-is-not-a-workflow` (menu) |
| `positions[6].origin` | learned | — |
| `positions[6].source` | ICT award nomination statement, 24 Sep 2026 | — |
| `positions[6].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-tested-or-assumed` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |

---

## Community — `community`

The `people-place` index plus one card per organisation. `status` is a controlled vocabulary, and a role that has not started says so on its card.

| Field path | Current value | Appears on |
|---|---|---|
| `community[0].id` | inspired-mind-lab | `people-place` (tour #4 · menu · anchor) |
| `community[0].org` | Inspired Mind Lab | `people-place` (tour #4 · menu · anchor)<br>`inspired-mind-lab` (menu) |
| `community[0].role` | STEAMM Workshop Volunteer | `people-place` (tour #4 · menu · anchor)<br>`inspired-mind-lab` (menu) |
| `community[0].period` | 2026 – Present | many slides |
| `community[0].status` | current | — |
| `community[0].field` | Education | many slides |
| `community[0].location` | Rokeby, TAS | `inspired-mind-lab` (menu) |
| `community[0].bullets[0]` | Set up and tested the Dash robots and iPads for two children's STEAMM … | `inspired-mind-lab` (menu) |
| `community[1].id` | utas-motorsport | `people-place` (tour #4 · menu · anchor) |
| `community[1].org` | UTAS Motorsport | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`people-place` (tour #4 · menu · anchor)<br>`utas-motorsport` (menu) |
| `community[1].role` | LiDAR & Autonomous Systems Contributor | `people-place` (tour #4 · menu · anchor)<br>`utas-motorsport` (menu) |
| `community[1].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`rivulet-localops` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `community[1].status` | current | — |
| `community[1].field` | Science and technology | `utas-motorsport` (menu) |
| `community[1].location` | Hobart, TAS | `utas-motorsport` (menu)<br>`utas-student-ambassador` (menu)<br>`hospitals-south` (menu)<br>`education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[1].bullets[0]` | A multidisciplinary student engineering team, testing autonomous-vehic… | `utas-motorsport` (menu) |
| `community[2].id` | libraries-tasmania | `people-place` (tour #4 · menu · anchor) |
| `community[2].org` | Libraries Tasmania — Glenorchy Library | `people-place` (tour #4 · menu · anchor)<br>`libraries-tasmania` (menu) |
| `community[2].role` | Digital Mentor | `people-place` (tour #4 · menu · anchor)<br>`libraries-tasmania` (menu) |
| `community[2].period` | Aug 2026 – Present | `libraries-tasmania` (menu)<br>`hospitals-south` (menu) |
| `community[2].status` | current | — |
| `community[2].field` | Education | many slides |
| `community[2].location` | Glenorchy, TAS | `libraries-tasmania` (menu) |
| `community[2].bullets[0]` | Provide one-to-one digital inclusion support, guiding community member… | `libraries-tasmania` (menu) |
| `community[3].id` | utas-student-ambassador | `people-place` (tour #4 · menu · anchor) |
| `community[3].org` | University of Tasmania | `who-am-i` (tour #2 · menu · anchor)<br>`people-place` (tour #4 · menu · anchor)<br>`utas-student-ambassador` (menu)<br>`education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[3].role` | Student Social Media Ambassador | `people-place` (tour #4 · menu · anchor)<br>`utas-student-ambassador` (menu) |
| `community[3].period` | Starting 2027 | `utas-student-ambassador` (menu)<br>`mothers-day-classic` (menu) |
| `community[3].status` | incoming | — |
| `community[3].field` | Education | many slides |
| `community[3].location` | Hobart, TAS | `utas-motorsport` (menu)<br>`utas-student-ambassador` (menu)<br>`hospitals-south` (menu)<br>`education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[3].bullets[0]` | Will create photo and video content on student life for the University… | `utas-student-ambassador` (menu) |
| `community[4].id` | raise-foundation | `people-place` (tour #4 · menu · anchor) |
| `community[4].org` | Raise Foundation | `people-place` (tour #4 · menu · anchor)<br>`raise-foundation` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[4].role` | Volunteer Youth Mentor | `people-place` (tour #4 · menu · anchor)<br>`raise-foundation` (menu) |
| `community[4].period` | Starting Apr 2027 | `raise-foundation` (menu) |
| `community[4].status` | incoming | — |
| `community[4].field` | Education | many slides |
| `community[4].location` | Hobart High School, TAS | `raise-foundation` (menu) |
| `community[4].bullets[0]` | Selected and trained for Raise's in-school mentoring program; complete… | `raise-foundation` (menu) |
| `community[5].id` | mothers-day-classic | `people-place` (tour #4 · menu · anchor) |
| `community[5].org` | Mother's Day Classic Foundation | `people-place` (tour #4 · menu · anchor)<br>`mothers-day-classic` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[5].role` | Local Sponsorships Lead | `people-place` (tour #4 · menu · anchor)<br>`mothers-day-classic` (menu) |
| `community[5].period` | Starting 2027 | `utas-student-ambassador` (menu)<br>`mothers-day-classic` (menu) |
| `community[5].status` | incoming | — |
| `community[5].field` | Fundraising | `mothers-day-classic` (menu) |
| `community[5].location` | Tasmania | many slides |
| `community[5].bullets[0]` | Will grow local business sponsorship and in-kind support in Hobart, La… | `mothers-day-classic` (menu) |
| `community[6].id` | hospitals-south | `people-place` (tour #4 · menu · anchor) |
| `community[6].org` | Tasmanian Health Service — Hospitals South | `people-place` (tour #4 · menu · anchor)<br>`hospitals-south` (menu) |
| `community[6].role` | Consumer Representative (Register) | `people-place` (tour #4 · menu · anchor)<br>`hospitals-south` (menu) |
| `community[6].period` | Aug 2026 – Present | `libraries-tasmania` (menu)<br>`hospitals-south` (menu) |
| `community[6].status` | onboarding | `who-am-i` (tour #2 · menu · anchor)<br>`venture-malou-media-ltd-startup-work-1` (menu · anchor) |
| `community[6].field` | Health | — |
| `community[6].location` | Hobart, TAS | `utas-motorsport` (menu)<br>`utas-student-ambassador` (menu)<br>`hospitals-south` (menu)<br>`education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[6].bullets[0]` | Selected for the Hospitals South Consumer Representative Register, wit… | `hospitals-south` (menu) |
| `community[6].bullets[1]` | Met the consumer engagement team in September 2026 to talk through the… | `hospitals-south` (menu) |

---

## Skill groups — `skillGroups`

Generate the `capabilities` slide; `items` are technology names.

| Field path | Current value | Appears on |
|---|---|---|
| `skillGroups[0].label` | Data & BI | — |
| `skillGroups[0].title` | Data Analytics & Business Intelligence | `capabilities` (menu · anchor) |
| `skillGroups[0].items[0]` | Python | — |
| `skillGroups[0].items[1]` | SQL | — |
| `skillGroups[0].items[2]` | Power BI | `capabilities` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`agrisentry-highlight-1` |
| `skillGroups[0].items[3]` | Pandas | — |
| `skillGroups[0].items[4]` | NumPy | — |
| `skillGroups[0].items[5]` | Data Cleaning | `capabilities` (menu · anchor) |
| `skillGroups[0].items[6]` | Data Processing | `capabilities` (menu · anchor) |
| `skillGroups[0].items[7]` | Data Visualisation | `capabilities` (menu · anchor) |
| `skillGroups[0].items[8]` | Dashboard Development | `capabilities` (menu · anchor) |
| `skillGroups[0].items[9]` | Reporting | `capabilities` (menu · anchor) |
| `skillGroups[0].items[10]` | Data Quality | `capabilities` (menu · anchor) |
| `skillGroups[0].items[11]` | CSV/JSON Processing | `capabilities` (menu · anchor) |
| `skillGroups[1].label` | Business Analysis | `capabilities` (menu · anchor) |
| `skillGroups[1].title` | Business Analysis & IT Systems | `capabilities` (menu · anchor) |
| `skillGroups[1].items[0]` | Workflow Analysis | `capabilities` (menu · anchor) |
| `skillGroups[1].items[1]` | Process Improvement | `capabilities` (menu · anchor) |
| `skillGroups[1].items[2]` | Process Standardisation | `capabilities` (menu · anchor) |
| `skillGroups[1].items[3]` | Stakeholder Coordination | `capabilities` (menu · anchor) |
| `skillGroups[1].items[4]` | Application Integration | `capabilities` (menu · anchor) |
| `skillGroups[1].items[5]` | Database Management | `capabilities` (menu · anchor) |
| `skillGroups[1].items[6]` | System Configuration | `capabilities` (menu · anchor) |
| `skillGroups[1].items[7]` | Technical Documentation | `capabilities` (menu · anchor) |
| `skillGroups[1].items[8]` | Troubleshooting | `capabilities` (menu · anchor) |
| `skillGroups[2].label` | AI & Agents | — |
| `skillGroups[2].title` | AI Applications, Agents & Automation | `capabilities` (menu · anchor) |
| `skillGroups[2].items[0]` | LLM Integration | `capabilities` (menu · anchor) |
| `skillGroups[2].items[1]` | Retrieval-Augmented Generation (RAG) | `capabilities` (menu · anchor) |
| `skillGroups[2].items[2]` | Prompt Engineering | `capabilities` (menu · anchor) |
| `skillGroups[2].items[3]` | Context Management | `capabilities` (menu · anchor) |
| `skillGroups[2].items[4]` | Multi-Agent Systems | `capabilities` (menu · anchor) |
| `skillGroups[2].items[5]` | AI Workflow Automation | `capabilities` (menu · anchor) |
| `skillGroups[2].items[6]` | Model Evaluation | `capabilities` (menu · anchor) |
| `skillGroups[2].items[7]` | PyTorch | — |
| `skillGroups[2].items[8]` | Stable Diffusion | `capabilities` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor) |
| `skillGroups[2].items[9]` | LoRA Fine-Tuning | `capabilities` (menu · anchor) |
| `skillGroups[2].items[10]` | ComfyUI | — |
| `skillGroups[3].label` | Software & Web | — |
| `skillGroups[3].title` | Software Engineering, Web & Backend | `capabilities` (menu · anchor) |
| `skillGroups[3].items[0]` | Python | — |
| `skillGroups[3].items[1]` | JavaScript | `capabilities` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-2` |
| `skillGroups[3].items[2]` | TypeScript | `capabilities` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`lifeops-atlas-highlight-1`<br>`evan-h-portfolio` (menu · anchor) |
| `skillGroups[3].items[3]` | Node.js | — |
| `skillGroups[3].items[4]` | Express.js | `capabilities` (menu · anchor) |
| `skillGroups[3].items[5]` | React | — |
| `skillGroups[3].items[6]` | Next.js | — |
| `skillGroups[3].items[7]` | PixiJS | — |
| `skillGroups[3].items[8]` | Framer Motion | `capabilities` (menu · anchor) |
| `skillGroups[3].items[9]` | Django | — |
| `skillGroups[3].items[10]` | FastAPI | — |
| `skillGroups[3].items[11]` | REST APIs | `capabilities` (menu · anchor) |
| `skillGroups[3].items[12]` | SQL | — |
| `skillGroups[3].items[13]` | SQLite | — |
| `skillGroups[3].items[14]` | Azure Functions | `capabilities` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`agrisentry-highlight-1` |
| `skillGroups[3].items[15]` | HTML | — |
| `skillGroups[3].items[16]` | CSS | — |
| `skillGroups[4].label` | Testing & Support | — |
| `skillGroups[4].title` | Testing, DevOps & IT Support | `capabilities-2` |
| `skillGroups[4].items[0]` | Technical Support | `capabilities-2` |
| `skillGroups[4].items[1]` | Application Support | `capabilities-2` |
| `skillGroups[4].items[2]` | Software Testing | `capabilities-2` |
| `skillGroups[4].items[3]` | Quality Assurance (QA) | `capabilities-2` |
| `skillGroups[4].items[4]` | Debugging | `capabilities-2` |
| `skillGroups[4].items[5]` | Validation | `capabilities-2` |
| `skillGroups[4].items[6]` | User Training | `capabilities-2` |
| `skillGroups[4].items[7]` | Git | — |
| `skillGroups[4].items[8]` | Linux | — |
| `skillGroups[4].items[9]` | Docker | — |
| `skillGroups[4].items[10]` | Jenkins | — |
| `skillGroups[4].items[11]` | CI/CD | — |
| `skillGroups[4].items[12]` | Agile Development | `capabilities-2` |
| `skillGroups[5].label` | Interactive | `capabilities-2`<br>⚠️ same text as another slot; attribution may be wrong |
| `skillGroups[5].title` | Game & Interactive Technology | `capabilities-2` |
| `skillGroups[5].items[0]` | Unreal Engine | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `skillGroups[5].items[1]` | Unity | — |
| `skillGroups[5].items[2]` | Blueprint | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `skillGroups[5].items[3]` | C++ | — |
| `skillGroups[5].items[4]` | C# | — |
| `skillGroups[5].items[5]` | Lua | — |
| `skillGroups[5].items[6]` | Game Systems Design | `capabilities-2` |
| `skillGroups[5].items[7]` | Interaction Design | `capabilities-2` |
| `skillGroups[5].items[8]` | AR/VR | — |
| `skillGroups[5].items[9]` | Quest & Dialogue Systems | `capabilities-2` |
| `skillGroups[5].items[10]` | AI-driven NPCs | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`ue5-financial-education-highlight-1` |
| `skillGroups[6].label` | Autonomy & Sim | — |
| `skillGroups[6].title` | Autonomous & Simulation Systems | `capabilities-2` |
| `skillGroups[6].items[0]` | ROS 2 | — |
| `skillGroups[6].items[1]` | CARLA | — |
| `skillGroups[6].items[2]` | RViz | — |
| `skillGroups[6].items[3]` | WSL 2 | — |
| `skillGroups[6].items[4]` | LiDAR | — |
| `skillGroups[6].items[5]` | Point Clouds | `capabilities-2` |
| `skillGroups[6].items[6]` | DBSCAN | — |
| `skillGroups[6].items[7]` | KISS-ICP | `capabilities-2` |
| `skillGroups[6].items[8]` | Hesai ROS 2 Driver | `capabilities-2` |
| `skillGroups[6].items[9]` | Pandar40P | `capabilities-2` |

---

## Projects — `projects`

Each project makes 1 + ⌈bullets/2⌉ slides.

| Field path | Current value | Appears on |
|---|---|---|
| `projects[0].slug` | rivulet-localops | `projects-index` (tour #5 · menu · anchor)<br>`rivulet-localops` (menu · anchor) |
| `projects[0].title` | Rivulet LocalOps | `projects-index` (tour #5 · menu · anchor)<br>`rivulet-localops` (menu · anchor)<br>`rivulet-localops-highlight-1`<br>`rivulet-localops-highlight-2` |
| `projects[0].kind` | AI agents | — |
| `projects[0].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`rivulet-localops` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `projects[0].link` | https://github.com/Zeeekrom/rivulet-localops | `rivulet-localops` (menu · anchor) |
| `projects[0].demo` | https://zeeekrom.github.io/rivulet-localops/film/ | — |
| `projects[0].shot` | /shots/rivulet.jpg | — |
| `projects[0].description` | Turns a written service policy into decisions that can be executed, ch… | `rivulet-localops` (menu · anchor) |
| `projects[0].bullets[0]` | AI-assisted and policy-gated: a model reads the request and suggests t… | `rivulet-localops-highlight-1` |
| `projects[0].bullets[1]` | Every request is diagnosed, tested against the approved policy, record… | `rivulet-localops-highlight-1` |
| `projects[0].bullets[2]` | An independent prototype, not an official council service: no real res… | `rivulet-localops-highlight-2` |
| `projects[0].tags[0]` | Python 3.12 | `rivulet-localops` (menu · anchor) |
| `projects[0].tags[1]` | Claude on Bedrock | `rivulet-localops` (menu · anchor) |
| `projects[0].tags[2]` | Policy gating | `rivulet-localops` (menu · anchor) |
| `projects[0].tags[3]` | Audit ledger | `rivulet-localops` (menu · anchor) |
| `projects[0].poster` | /posters/rivulet-localops.jpg | — |
| `projects[1].slug` | lifeops-atlas | `projects-index` (tour #5 · menu · anchor)<br>`lifeops-atlas` (menu · anchor) |
| `projects[1].title` | LifeOps Atlas | `projects-index` (tour #5 · menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`lifeops-atlas-highlight-1` |
| `projects[1].kind` | Tooling | — |
| `projects[1].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`rivulet-localops` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `projects[1].link` | https://github.com/Zeeekrom/lifeops-atlas-showcase | `lifeops-atlas` (menu · anchor) |
| `projects[1].demo` | https://zeeekrom.github.io/lifeops-atlas-showcase/ | — |
| `projects[1].shot` | /shots/lifeops-atlas.jpg | — |
| `projects[1].description` | A single-user operations system that brings tasks, relationships, even… | `lifeops-atlas` (menu · anchor) |
| `projects[1].bullets[0]` | Durable records live in PostgreSQL with append-only corrections and so… | `lifeops-atlas-highlight-1` |
| `projects[1].bullets[1]` | Node.js 24, TypeScript, Fastify 5, Zod, PostgreSQL 17 and Docker Compo… | `lifeops-atlas-highlight-1` |
| `projects[1].tags[0]` | TypeScript | `capabilities` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`lifeops-atlas-highlight-1`<br>`evan-h-portfolio` (menu · anchor) |
| `projects[1].tags[1]` | Fastify | — |
| `projects[1].tags[2]` | PostgreSQL | `lifeops-atlas` (menu · anchor)<br>`lifeops-atlas-highlight-1` |
| `projects[1].tags[3]` | Docker | — |
| `projects[1].poster` | /posters/lifeops-atlas.jpg | — |
| `projects[2].slug` | agrisentry | `projects-index` (tour #5 · menu · anchor)<br>`agrisentry` (menu · anchor) |
| `projects[2].title` | AgriSentry | `projects-index` (tour #5 · menu · anchor)<br>`agrisentry` (menu · anchor)<br>`agrisentry-highlight-1` |
| `projects[2].kind` | Data | — |
| `projects[2].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`rivulet-localops` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `projects[2].link` | https://github.com/Zeeekrom/agrisentry | `agrisentry` (menu · anchor) |
| `projects[2].demo` | https://zeeekrom.github.io/agrisentry/ | — |
| `projects[2].shot` | /shots/agrisentry.jpg | — |
| `projects[2].description` | A configurable farm-monitoring system on the Microsoft Power Platform:… | `agrisentry` (menu · anchor) |
| `projects[2].bullets[0]` | A person approves every alert before anything happens, with an immutab… | `agrisentry-highlight-1` |
| `projects[2].bullets[1]` | Power Apps, Dataverse, Power Automate and Power BI with an Azure Funct… | `agrisentry-highlight-1` |
| `projects[2].tags[0]` | Power Platform | `agrisentry` (menu · anchor) |
| `projects[2].tags[1]` | Power BI | `capabilities` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`agrisentry-highlight-1` |
| `projects[2].tags[2]` | Azure Functions | `capabilities` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`agrisentry-highlight-1` |
| `projects[2].tags[3]` | Dataverse | `agrisentry` (menu · anchor)<br>`agrisentry-highlight-1` |
| `projects[2].poster` | /posters/agrisentry.jpg | — |
| `projects[3].slug` | evan-h-portfolio | `projects-index` (tour #5 · menu · anchor) |
| `projects[3].title` | Evan.H Portfolio | `projects-index` (tour #5 · menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`evan-h-portfolio-highlight-1` |
| `projects[3].kind` | Tooling | — |
| `projects[3].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`rivulet-localops` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `projects[3].link` | https://github.com/Zeeekrom/evan-huang-portfolio | `evan-h-portfolio` (menu · anchor) |
| `projects[3].demo` | https://evanh.dev/ | — |
| `projects[3].shot` | /shots/portfolio.jpg | — |
| `projects[3].description` | This site. A portfolio has two readers — someone skimming for facts, a… | `evan-h-portfolio` (menu · anchor) |
| `projects[3].bullets[0]` | Every word lives in content/*.json behind a typed loader that fails th… | `evan-h-portfolio-highlight-1` |
| `projects[3].bullets[1]` | The same content renders as this page and as an explorable canvas deck… | `evan-h-portfolio-highlight-1` |
| `projects[3].tags[0]` | Next.js | — |
| `projects[3].tags[1]` | TypeScript | `capabilities` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`lifeops-atlas-highlight-1`<br>`evan-h-portfolio` (menu · anchor) |
| `projects[3].tags[2]` | Azure Storage | `evan-h-portfolio` (menu · anchor) |
| `projects[3].tags[3]` | GitHub Actions | `evan-h-portfolio` (menu · anchor) |
| `projects[3].poster` | /posters/evan-h-portfolio.jpg | — |
| `projects[4].slug` | tasmania-student-notes | `position-tested-or-assumed` (menu)<br>`position-people-who-bridge` (menu)<br>`projects-index` (tour #5 · menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `projects[4].title` | Tasmania Student Notes | `position-tested-or-assumed` (menu)<br>`position-people-who-bridge` (menu)<br>`projects-index` (tour #5 · menu · anchor)<br>`tasmania-student-notes` (menu · anchor)<br>`tasmania-student-notes-highlight-1`<br>`tasmania-student-notes-highlight-2` |
| `projects[4].kind` | Tooling | — |
| `projects[4].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`rivulet-localops` (menu · anchor)<br>`lifeops-atlas` (menu · anchor)<br>`agrisentry` (menu · anchor)<br>`evan-h-portfolio` (menu · anchor)<br>`tasmania-student-notes` (menu · anchor) |
| `projects[4].link` | https://github.com/Zeeekrom/tasmania-student-notes-showcase | `tasmania-student-notes` (menu · anchor) |
| `projects[4].demo` | https://tas-stu-notes-preview.azurewebsites.net/ | — |
| `projects[4].shot` | /shots/tasmania-student-notes.jpg | — |
| `projects[4].description` | An independent, student-led publication for Tasmania in six languages,… | `tasmania-student-notes` (menu · anchor) |
| `projects[4].bullets[0]` | A six-language preview site on Ghost's Headline theme, with a pixel of… | `tasmania-student-notes-highlight-1` |
| `projects[4].bullets[1]` | The newsroom — Coordinator, Researcher, Writer and Checker — runs priv… | `tasmania-student-notes-highlight-1` |
| `projects[4].bullets[2]` | A prototype with no published stories yet: the pilot runs used fiction… | `tasmania-student-notes-highlight-2` |
| `projects[4].tags[0]` | Ghost | — |
| `projects[4].tags[1]` | Docker | — |
| `projects[4].tags[2]` | Multi-agent | `tasmania-student-notes` (menu · anchor) |
| `projects[4].tags[3]` | Six languages | `tasmania-student-notes` (menu · anchor) |
| `projects[4].poster` | /posters/tasmania-student-notes.jpg | — |
| `projects[5].slug` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-tested-or-assumed` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `projects[5].title` | AI-Native Payment & Agent Engineering Lab | many slides |
| `projects[5].kind` | AI agents | — |
| `projects[5].period` | Jul 2026 – Aug 2026 | `payment-agent-lab` (menu · anchor) |
| `projects[5].description` | A payment-processing prototype and a read-only operations copilot, bui… | `payment-agent-lab` (menu · anchor) |
| `projects[5].bullets[0]` | Designed a FastAPI/SQLite payment-processing prototype normalising syn… | `payment-agent-lab-highlight-1` |
| `projects[5].bullets[1]` | Verified a read-only RAG operations copilot with three tools and a Pla… | `payment-agent-lab-highlight-1` |
| `projects[5].tags[0]` | FastAPI | — |
| `projects[5].tags[1]` | SQLite | — |
| `projects[5].tags[2]` | Python | — |
| `projects[5].tags[3]` | RAG | — |
| `projects[5].tags[4]` | pytest | — |
| `projects[5].tags[5]` | Agent workflows | `payment-agent-lab` (menu · anchor) |
| `projects[5].link` | https://github.com/Zeeekrom/payment-reconciliation-engine | `payment-agent-lab` (menu · anchor) |
| `projects[5].shot` | /shots/payment-agent-lab.jpg | — |
| `projects[5].poster` | /posters/payment-agent-lab.jpg | — |
| `projects[6].slug` | ue5-financial-education | `projects-index` (tour #5 · menu · anchor) |
| `projects[6].title` | Cyber Finance City | `projects-index` (tour #5 · menu · anchor)<br>`ue5-financial-education` (menu · anchor)<br>`ue5-financial-education-highlight-1` |
| `projects[6].kind` | Interactive | `capabilities-2`<br>⚠️ same text as another slot; attribution may be wrong |
| `projects[6].period` | Oct 2025 – Feb 2026 | `ue5-financial-education` (menu · anchor) |
| `projects[6].description` | Modular UE5 financial-education system with AI-driven NPCs and a FastA… | `ue5-financial-education` (menu · anchor) |
| `projects[6].bullets[0]` | Created a modular UE5 interactive experience with AI-driven NPCs, conf… | `ue5-financial-education-highlight-1` |
| `projects[6].bullets[1]` | Connected the UE5 client to FastAPI, structured question data, RAG ret… | `ue5-financial-education-highlight-1` |
| `projects[6].tags[0]` | Unreal Engine 5 | `ue5-financial-education` (menu · anchor) |
| `projects[6].tags[1]` | Blueprint | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[6].tags[2]` | C++ | — |
| `projects[6].tags[3]` | FastAPI | — |
| `projects[6].tags[4]` | RAG | — |
| `projects[6].tags[5]` | VR | — |
| `projects[6].link` | https://github.com/Zeeekrom/cyber-finance-city | `ue5-financial-education` (menu · anchor) |
| `projects[6].shot` | /shots/ue5-financial-education.jpg | — |
| `projects[6].demo` | https://zeeekrom.github.io/cyber-finance-city/ | — |
| `projects[6].poster` | /posters/ue5-financial-education.jpg | — |
| `projects[7].slug` | little-red-sequel | `projects-index` (tour #5 · menu · anchor)<br>`little-red-sequel` (menu · anchor) |
| `projects[7].title` | Little Red: Sequel | `projects-index` (tour #5 · menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[7].kind` | Interactive | `capabilities-2`<br>⚠️ same text as another slot; attribution may be wrong |
| `projects[7].period` | Dec 2023 – May 2024 | `little-red-sequel` (menu · anchor) |
| `projects[7].description` | Independently developed story-driven 3D pixel-style Unreal Engine indi… | `little-red-sequel` (menu · anchor) |
| `projects[7].bullets[0]` | Developed a story-driven 3D pixel-style Unreal Engine game demo featur… | `little-red-sequel-highlight-1` |
| `projects[7].bullets[1]` | Modified and combined Marketplace quest, dialogue and menu systems wit… | `little-red-sequel-highlight-1` |
| `projects[7].tags[0]` | Unreal Engine | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[7].tags[1]` | Blueprint | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[7].tags[2]` | Game Design | `little-red-sequel` (menu · anchor) |
| `projects[7].tags[3]` | AIGC | — |
| `projects[7].link` | https://github.com/Zeeekrom/little-red-sequel | `little-red-sequel` (menu · anchor) |
| `projects[7].shot` | /shots/little-red-sequel.jpg | — |
| `projects[7].poster` | /posters/little-red-sequel.jpg | — |

---

## Internships — `internships`

Each makes ⌈bullets/2⌉ slides, ids prefixed `work-`, behind the `internships-china` summary card.

| Field path | Current value | Appears on |
|---|---|---|
| `internships[0].org` | AIA-Institute | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-aia-institute-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[0].role` | Chief Technology Officer (Acting) | `work-aia-institute-work-1` (menu · anchor) |
| `internships[0].period` | 2026 – Present | many slides |
| `internships[0].type` | Remote, part-time | `work-aia-institute-work-1` (menu · anchor)<br>`work-strategy-ops-consultancy-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[0].bullets[0]` | Leading the technical design and build of an AI platform for Australia… | `work-aia-institute-work-1` (menu · anchor) |
| `internships[0].bullets[1]` | The platform is pre-release, so there is no detail about it here. | `work-aia-institute-work-1` (menu · anchor) |
| `internships[0].badge` | Early-stage AI platform | — |
| `internships[0].metric` | Technical lead on a pre-release AI platform | — |
| `internships[1].org` | Strategy&Ops Consultancy | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-strategy-ops-consultancy-work-1` (menu · anchor)<br>`work-strategy-ops-consultancy-work-2`<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[1].role` | IT Systems Intern | `work-strategy-ops-consultancy-work-1` (menu · anchor)<br>`work-strategy-ops-consultancy-work-2` |
| `internships[1].period` | 2026 | — |
| `internships[1].type` | Remote, part-time | `work-aia-institute-work-1` (menu · anchor)<br>`work-strategy-ops-consultancy-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[1].bullets[0]` | Redesigned and launched the company's Net-Zero Global Network page in … | `work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[1].bullets[1]` | Maintained the WordPress site and Tutor LMS under change control — sta… | `work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[1].bullets[2]` | Audited the videos embedded across 300+ public pages and 84 lessons in… | `work-strategy-ops-consultancy-work-2` |
| `internships[1].badge` | Strategy and operations consultancy | — |
| `internships[1].metric` | 18-member directory shipped · 300+ pages and 84 lessons audited | — |
| `internships[2].org` | Qingqiu Technology Co., Ltd. | `position-short-loops` (menu)<br>`internships-china` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-2` |
| `internships[2].role` | Software Engineer Intern | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-2` |
| `internships[2].period` | 2025 – 2026 | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[2].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[2].bullets[0]` | Developed a Cursor-style AI coding IDE for an indie game studio. | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[2].bullets[1]` | Integrated OpenAI Codex and Anthropic Claude into developer workflows,… | `internships-china` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[2].bullets[2]` | Built context-processing and web workflow features in JavaScript/Node.… | `work-qingqiu-technology-co-ltd-work-2` |
| `internships[2].location` | China | — |
| `internships[2].badge` | AI developer-tooling startup | — |
| `internships[2].metric` | A Cursor-style AI coding IDE · Codex and Claude in the developer workf… | — |
| `internships[3].org` | Tencent | — |
| `internships[3].role` | Technical Game Systems Intern | `work-tencent-work-1` (menu · anchor)<br>`work-tencent-work-2` |
| `internships[3].period` | 2025 | — |
| `internships[3].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[3].bullets[0]` | Analysed win rates, pick rates, skill effectiveness, player feedback a… | `internships-china` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor) |
| `internships[3].bullets[1]` | Modelled and iterated skill configurations and numerical parameters in… | `work-tencent-work-1` (menu · anchor) |
| `internships[3].bullets[2]` | Prototyped and debugged Lua gameplay modules and collaborated with eng… | `work-tencent-work-2` |
| `internships[3].location` | China | — |
| `internships[3].badge` | World's largest games company | — |
| `internships[3].metric` | Telemetry read to support balancing on Honor of Kings | — |
| `internships[4].org` | Perfect World Co., Ltd. | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor) |
| `internships[4].role` | AI Workflow Engineering Intern | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[4].period` | 2023 – 2024 | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`venture-ar-platform-ltd-startup-work-1` (menu · anchor) |
| `internships[4].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[4].bullets[0]` | Built and maintained 2D/3D asset datasets for an internationally relea… | `work-perfect-world-co-ltd-work-1` (menu · anchor) |
| `internships[4].bullets[1]` | Trained and refined LoRA models with Stable Diffusion and ComfyUI, and… | `work-perfect-world-co-ltd-work-1` (menu · anchor) |
| `internships[4].location` | China | — |
| `internships[4].badge` | Listed games publisher | — |
| `internships[4].metric` | LoRA fine-tuning · 2D/3D dataset curation for an internationally relea… | — |
| `internships[5].org` | Lilith Games | `who-am-i` (tour #2 · menu · anchor)<br>`position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[5].role` | AI Workflow Engineering Intern | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[5].period` | 2023 | — |
| `internships[5].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[5].bullets[0]` | Automated Unity batch operations with Python and C#, streamlining asse… | `work-lilith-games-work-1` (menu · anchor) |
| `internships[5].bullets[1]` | Built AIGC pipelines for AFK Journey and Rise of Kingdoms: dataset pre… | `work-lilith-games-work-1` (menu · anchor) |
| `internships[5].location` | China | — |
| `internships[5].badge` | AFK Journey · Rise of Kingdoms | — |
| `internships[5].metric` | AIGC pipelines across global live-service titles · training for non-te… | — |

---

## Ventures — `startups`

Same shape as internships, ids prefixed `venture-`.

| Field path | Current value | Appears on |
|---|---|---|
| `startups[0].org` | Malou Media Ltd (Startup) | `experience-index` (tour #6 · menu · anchor)<br>`venture-malou-media-ltd-startup-work-1` (menu · anchor) |
| `startups[0].role` | Co-Founder & Recruitment Manager | `venture-malou-media-ltd-startup-work-1` (menu · anchor) |
| `startups[0].period` | 2024 – 2025 | `venture-malou-media-ltd-startup-work-1` (menu · anchor) |
| `startups[0].type` | Part-time, Remote | `venture-malou-media-ltd-startup-work-1` (menu · anchor)<br>`venture-ar-platform-ltd-startup-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `startups[0].bullets[0]` | Independently ran recruitment, onboarding and people operations for a … | `venture-malou-media-ltd-startup-work-1` (menu · anchor) |
| `startups[0].bullets[1]` | Screened 300+ candidates and standardised the end-to-end recruitment p… | `venture-malou-media-ltd-startup-work-1` (menu · anchor) |
| `startups[0].badge` | Startup · 20 people | — |
| `startups[0].metric` | 300+ candidates screened · recruitment run single-handed for 20 people | — |
| `startups[1].org` | AR Platform Ltd (Startup) | `experience-index` (tour #6 · menu · anchor)<br>`venture-ar-platform-ltd-startup-work-1` (menu · anchor) |
| `startups[1].role` | Co-Founder & AIGC Technical Lead | `venture-ar-platform-ltd-startup-work-1` (menu · anchor) |
| `startups[1].period` | 2023 – 2024 | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`venture-ar-platform-ltd-startup-work-1` (menu · anchor) |
| `startups[1].type` | Part-time, Remote | `venture-malou-media-ltd-startup-work-1` (menu · anchor)<br>`venture-ar-platform-ltd-startup-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `startups[1].bullets[0]` | Co-founded a 4–5 person AR content startup as AIGC lead and designed t… | `venture-ar-platform-ltd-startup-work-1` (menu · anchor) |
| `startups[1].bullets[1]` | Coordinated with 20+ external stakeholders and prepared B2B use cases … | `venture-ar-platform-ltd-startup-work-1` (menu · anchor) |
| `startups[1].badge` | Startup · co-founded | — |
| `startups[1].metric` | 4–5 person team · 20+ external stakeholders · a seed-round business pl… | — |

---

## Publications — `publications`

One slide each, ids `paper-1`, `paper-2`… by position.

| Field path | Current value | Appears on |
|---|---|---|
| `publications[0].title` | Exploring User Experience and Learning Motivation as Key Mediators in … | `research-index` (menu · anchor)<br>`paper-1` |
| `publications[0].venue` | ACM, IECA 2026 | `paper-1` |
| `publications[0].date` | May 2026 | `paper-1` |
| `publications[0].note` | Contributed to immersive environment design, questionnaire data analys… | `paper-1` |
| `publications[0].link` | https://dl.acm.org/doi/10.1145/3802133.3802247 | — |
| `publications[1].title` | Predicting Student Performance in Software Engineering Education Using… | `research-index` (menu · anchor)<br>`paper-2` |
| `publications[1].venue` | ACM International Conference Proceedings Series, DEIT 2025 | `paper-2` |
| `publications[1].date` | Jun 2025 | `paper-2` |
| `publications[1].note` | Co-authored a machine-learning study involving feature engineering, Ra… | `paper-2` |
| `publications[1].link` | https://dl.acm.org/doi/10.1145/3732299.3732326 | — |

---

## Education — `education`

All on one `education` slide.

| Field path | Current value | Appears on |
|---|---|---|
| `education[0].degree` | Master of Information Technology and Systems | `who-am-i` (tour #2 · menu · anchor)<br>`education` (tour #7 · menu · anchor) |
| `education[0].school` | University of Tasmania | `who-am-i` (tour #2 · menu · anchor)<br>`people-place` (tour #4 · menu · anchor)<br>`utas-student-ambassador` (menu)<br>`education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `education[0].period` | Jul 2026 – Jul 2028 | `education` (tour #7 · menu · anchor) |
| `education[0].detail` | Hobart, TAS | `utas-motorsport` (menu)<br>`utas-student-ambassador` (menu)<br>`hospitals-south` (menu)<br>`education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `education[1].degree` | Bachelor of Software Engineering | `education` (tour #7 · menu · anchor) |
| `education[1].school` | Sanda University | `education` (tour #7 · menu · anchor) |
| `education[1].period` | Sep 2024 – Jun 2026 | `education` (tour #7 · menu · anchor) |
| `education[1].detail` | Rank 1st in the major | `education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `education[2].degree` | Undergraduate Exchange Program, Information Technology | `education` (tour #7 · menu · anchor) |
| `education[2].school` | Saint Martin's University | `education` (tour #7 · menu · anchor) |
| `education[2].period` | Jan 2025 – May 2025 | `education` (tour #7 · menu · anchor) |
| `education[2].detail` | USA · Dean's List | `education` (tour #7 · menu · anchor) |
| `education[3].degree` | Associate Degree in Digital Media Technology | `education` (tour #7 · menu · anchor) |
| `education[3].school` | Nanhu Vocational and Technical College | `education` (tour #7 · menu · anchor) |
| `education[3].period` | Sep 2021 – Jun 2024 | `education` (tour #7 · menu · anchor) |
| `education[3].detail` | Rank 1st in the major | `education` (tour #7 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |

---

## Contact — `contact`

Heading and subheading of the `contact` slide, the tour's last stop.

| Field path | Current value | Appears on |
|---|---|---|
| `contact.heading` | Tell me what keeps breaking. | `contact` (tour #8 · menu · anchor) |
| `contact.subheading` | Roles, projects, volunteering, or a coffee in Hobart. The messy ones a… | `contact` (tour #8 · menu · anchor) |

---

## Footer — `footer`

Classic homepage only.

| Field path | Current value | Appears on |
|---|---|---|
| `footer.rights` | All rights reserved | — |
| `footer.terms` | Copyright and terms | — |

---

## Templates for new entries

Copy one and change the content. Field order does not matter.

### New project → `projects.json`

```json
{
  "slug": "short-name",
  "title": "Project Name",
  "period": "Mar 2025 – Jun 2025",
  "description": "One or two sentences: what it is and why it exists.",
  "bullets": ["One thing per bullet, with a number or a system name where possible."],
  "tags": ["Python", "FastAPI"],
  "link": "https://github.com/…",
  "featured": false
}
```

`slug` must be unique and use only `[a-z0-9-]`; it becomes the slide id and the anchor. `link` and `featured` are optional. Every two bullets make a slide.

### New internship → `internships.json` (or a venture → `startups.json`)

```json
{
  "org": "Company Name",
  "role": "Software Engineer Intern",
  "period": "Jun 2025 – Sep 2025",
  "type": "Full-time",
  "bullets": ["What you did."]
}
```

### New volunteer role → `community.json`

```json
{
  "id": "short-name",
  "org": "Organisation",
  "role": "Role",
  "period": "2026 – Present",
  "status": "current",
  "field": "Education",
  "location": "Hobart, TAS",
  "bullets": ["What the role is."],
  "evidence": []
}
```

`status` is one of `current`, `completed`, `incoming` (not started) or `onboarding` (not yet contributing).

### New position → `positions.json`

```json
{
  "id": "short-name",
  "label": "Under forty characters",
  "claim": "The position, in one or two sentences.",
  "origin": "practice",
  "source": "where the wording came from",
  "evidence": ["payment-agent-lab"]
}
```

`origin` is `practice` (from his own work) or `learned` (picked up from someone else, and the card says so). `evidence` lists slide ids; at least one is required.

---

## Slots nothing fills yet

| Slot | State |
|---|---|
| `ExperienceItem.location` | In the type, but **no slide renders it**. Change `experienceSlides()` to show it |
| `Slide.image` / `images` / `video` / `youtubeUrl` | Supported by the type and the canvas layouts, but no generator sets them. Decide how media is expressed in `content/` first |
| Behavioural stories / STAR | **No data structure.** `positions.json` holds one-line positions with evidence links; a full situation–action–result story still has nowhere to go |
| `intro` title and subtitle | Written in `slides.ts`, not in `content/` |
| `main-menu` slide | Entries written in `slides.ts` |

---

## How much the AI guide can read

Two paths, with **different limits**:

| Path | Per-slide limit | When it is used |
|---|---|---|
| Tour stop instructions | 1200 characters | The 8 stops narrated after connecting |
| `presenter.json` session catalogue | 2000 characters | Conversation once the visitor speaks |

The guide may not state a fact that is not on a slide. **Write specifically and it speaks specifically; write vaguely and it can only be vague.**

Tour route, in order:

1. `intro` — Evan Huang
2. `who-am-i` — I work between technology and the people who use it
3. `how-i-work` — How I work with AI
4. `people-place` — Not only studying technology here
5. `projects-index` — My work
6. `experience-index` — Experience
7. `education` — Where I studied
8. `contact` — yuxianghuang2026@gmail.com
