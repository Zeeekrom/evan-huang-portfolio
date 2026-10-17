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

Current size: **58 slides**, of which 8 are tour stops and 26 have anchors.

---

## Site constants — `site`

Domain, email, social links, résumé file. These feed the SEO metadata and the contact slide.

| Field path | Current value | Appears on |
|---|---|---|
| `site.url` | https://evanhuangportfolio.z44.web.core.windows.net | classic homepage only: `Contact`, `Footer`, `Hero`, `Nav` |
| `site.name` | Evan Huang | `intro` (tour #1 · menu · anchor) |
| `site.legalName` | Yuxiang Huang | classic homepage only: `Contact`, `Footer`, `Hero`, `Nav` |
| `site.location` | Hobart, Tasmania, Australia | classic homepage only: `Contact`, `Footer`, `Hero`, `Nav` |
| `site.email` | yuxianghuang2026@gmail.com | `contact` (tour #8 · menu · anchor) |
| `site.linkedin` | https://www.linkedin.com/in/evan-h-165976301/ | `contact` (tour #8 · menu · anchor) |
| `site.github` | https://github.com/Zeeekrom | `motorsport` (menu · anchor)<br>`bili-cache-watch` (menu · anchor)<br>`tasmania-tech-dashboard` (menu · anchor)<br>`personal-english-bank` (menu · anchor)<br>`contact` (tour #8 · menu · anchor) |
| `site.resumeFile` | /resume/Evan-Huang-Resume.pdf | `main-menu`<br>`contact` (tour #8 · menu · anchor) |

---

## Classic homepage navigation — `nav`

Only affects the classic homepage `/`, not the canvas.

| Field path | Current value | Appears on |
|---|---|---|
| `nav[0].id` | home | classic homepage only: `Nav` |
| `nav[0].label` | Home | classic homepage only: `Nav` |
| `nav[1].id` | about | classic homepage only: `Nav` |
| `nav[1].label` | About | classic homepage only: `Nav` |
| `nav[2].id` | skills | classic homepage only: `Nav` |
| `nav[2].label` | Skills | classic homepage only: `Nav` |
| `nav[3].id` | projects | `main-menu`<br>`tasmania-tech-dashboard` (menu · anchor)<br>`tasmania-tech-dashboard-highlight-1`<br>`contact` (tour #8 · menu · anchor) |
| `nav[3].label` | Projects | classic homepage only: `Nav` |
| `nav[4].id` | experience | `main-menu`<br>`fobi-2026` (menu)<br>`ue5-financial-education-highlight-1` |
| `nav[4].label` | Experience | `main-menu`<br>`experience-index` (tour #6 · menu · anchor)<br>`internships-china` (menu · anchor)<br>`research-index` (menu · anchor)<br>`paper-1` |
| `nav[5].id` | publications | classic homepage only: `Nav` |
| `nav[5].label` | Publications | classic homepage only: `Nav` |
| `nav[6].id` | contact | classic homepage only: `Nav` |
| `nav[6].label` | Contact | classic homepage only: `Nav` |

---

## Homepage hero — `hero`

Only affects the classic homepage `/`. The canvas opens on the `intro` slide, whose title is written in `slides.ts`.

| Field path | Current value | Appears on |
|---|---|---|
| `hero.greeting` | Hi, I'm | classic homepage only: `Hero` |
| `hero.role` | Applied AI Agent Engineer \| Data Business Analytics \| Interactive & Ga… | classic homepage only: `Hero` |
| `hero.tagline` | I bring a practical, user-centred perspective on responsible technolog… | classic homepage only: `Hero` |
| `hero.ctaPrimary` | View Projects | classic homepage only: `Hero` |
| `hero.ctaSecondary` | Get in Touch | `contact` (tour #8 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `hero.available` | Part-time/casual during semester; full-time during the UTAS summer bre… | classic homepage only: `Hero` |

---

## About — `about`

**The most important group.** `paragraphs` is the body of the canvas `who-am-i` slide and the guide's only source on who Evan is.

| Field path | Current value | Appears on |
|---|---|---|
| `about.heading` | About Me | classic homepage only: `About` |
| `about.paragraphs[0]` | I'm a Master of Information Technology and Systems student at the Univ… | `who-am-i` (tour #2 · menu · anchor) |
| `about.paragraphs[1]` | Those roles taught me as much about people as about systems. I coordin… | `who-am-i` (tour #2 · menu · anchor) |
| `about.paragraphs[2]` | Since moving to Hobart I've tried to be part of the community, not jus… | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus` |
| `about.paragraphs[3]` | Right now I'm interning in IT and digital systems at Strategy&Ops Cons… | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus` |
| `about.facts[0].label` | Based in | classic homepage only: `About` |
| `about.facts[0].value` | Hobart, Tasmania | classic homepage only: `About` |
| `about.facts[1].label` | Degree | classic homepage only: `About` |
| `about.facts[1].value` | MIT&S, University of Tasmania | classic homepage only: `About` |
| `about.facts[2].label` | Internships | classic homepage only: `About` |
| `about.facts[2].value` | 4 completed | classic homepage only: `About` |
| `about.facts[3].label` | Languages | classic homepage only: `About` |
| `about.facts[3].value` | English, Mandarin (native) | classic homepage only: `About` |

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
| `positions[0].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[1].id` | agent-is-what-it-can-reach | `how-i-work` (tour #3 · menu · anchor) |
| `positions[1].label` | An agent is what it can reach | `how-i-work` (tour #3 · menu · anchor)<br>`position-agent-is-what-it-can-reach` (menu) |
| `positions[1].claim` | An agent's real role is not the job title written in its prompt, but t… | `position-agent-is-what-it-can-reach` (menu) |
| `positions[1].origin` | learned | — |
| `positions[1].source` | NPC-SEC-002 | — |
| `positions[1].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[2].id` | short-loops | `how-i-work` (tour #3 · menu · anchor) |
| `positions[2].label` | Short loops, a person in the loop | `how-i-work` (tour #3 · menu · anchor)<br>`position-short-loops` (menu) |
| `positions[2].claim` | Rather than handing an agent a task overnight, I prefer small task blo… | `position-short-loops` (menu) |
| `positions[2].origin` | learned | — |
| `positions[2].source` | NPC-AI-005 | — |
| `positions[2].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `positions[2].evidence[1]` | work-qingqiu-technology-co-ltd-work-1 | `position-short-loops` (menu)<br>`internships-china` (menu · anchor) |
| `positions[3].id` | human-judgement-sets-value | `how-i-work` (tour #3 · menu · anchor) |
| `positions[3].label` | Human judgement sets the value | `how-i-work` (tour #3 · menu · anchor)<br>`position-human-judgement-sets-value` (menu) |
| `positions[3].claim` | AI should extend professional knowledge, not replace creative judgemen… | `position-human-judgement-sets-value` (menu) |
| `positions[3].origin` | practice | `raise-foundation` (menu) |
| `positions[3].source` | NPC-AI-009 | — |
| `positions[3].evidence[0]` | work-perfect-world-co-ltd-work-1 | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor) |
| `positions[3].evidence[1]` | work-lilith-games-work-1 | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor) |
| `positions[4].id` | people-who-bridge | `how-i-work` (tour #3 · menu · anchor) |
| `positions[4].label` | AI needs people who bridge | `how-i-work` (tour #3 · menu · anchor)<br>`position-people-who-bridge` (menu) |
| `positions[4].claim` | Putting AI to work needs hybrid roles that understand the business, di… | `position-people-who-bridge` (menu) |
| `positions[4].origin` | practice | `raise-foundation` (menu) |
| `positions[4].source` | NPC-AI-016 | — |
| `positions[4].evidence[0]` | be-hers | — |
| `positions[5].id` | model-is-not-a-workflow | `how-i-work` (tour #3 · menu · anchor) |
| `positions[5].label` | A model is not a workflow | `how-i-work` (tour #3 · menu · anchor)<br>`position-model-is-not-a-workflow` (menu) |
| `positions[5].claim` | The gap that matters is between a model that can answer a question and… | `position-model-is-not-a-workflow` (menu) |
| `positions[5].origin` | learned | — |
| `positions[5].source` | ICT award nomination statement, 24 Sep 2026 | — |
| `positions[5].evidence[0]` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |

---

## Community — `community`

The `people-place` index plus one card per organisation. `status` is a controlled vocabulary, and a role that has not started says so on its card.

| Field path | Current value | Appears on |
|---|---|---|
| `community[0].id` | darling-downs-environment-council | `people-place` (tour #4 · menu · anchor) |
| `community[0].org` | Darling Downs Environment Council | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`people-place` (tour #4 · menu · anchor)<br>`darling-downs-environment-council` (menu) |
| `community[0].role` | AI-Enabled Web Application Developer | `people-place` (tour #4 · menu · anchor)<br>`darling-downs-environment-council` (menu) |
| `community[0].period` | 2026 – Present | many slides |
| `community[0].status` | current | — |
| `community[0].field` | Environment | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`people-place` (tour #4 · menu · anchor)<br>`darling-downs-environment-council` (menu) |
| `community[0].location` | Queensland (remote) | `darling-downs-environment-council` (menu) |
| `community[0].bullets[0]` | Selected to develop an open-source, AI-enabled doorknocking web applic… | `darling-downs-environment-council` (menu) |
| `community[1].id` | ict-peer-support | `people-place` (tour #4 · menu · anchor) |
| `community[1].org` | UTAS School of ICT | `people-place` (tour #4 · menu · anchor)<br>`ict-peer-support` (menu) |
| `community[1].role` | Peer learning support | `people-place` (tour #4 · menu · anchor)<br>`ict-peer-support` (menu) |
| `community[1].period` | 2026 – Present | many slides |
| `community[1].status` | current | — |
| `community[1].field` | Education | many slides |
| `community[1].location` | Hobart, TAS | many slides |
| `community[1].bullets[0]` | Ongoing one-to-one support for a fellow ICT student from a non-IT back… | `ict-peer-support` (menu) |
| `community[2].id` | tas-ict-community | `people-place` (tour #4 · menu · anchor) |
| `community[2].org` | Tasmanian ICT and AI community | `people-place` (tour #4 · menu · anchor)<br>`tas-ict-community` (menu) |
| `community[2].role` | Regular participant | `people-place` (tour #4 · menu · anchor)<br>`tas-ict-community` (menu) |
| `community[2].period` | 2026 – Present | many slides |
| `community[2].status` | current | — |
| `community[2].field` | Science and technology | `tas-ict-community` (menu)<br>`utas-motorsport` (menu)<br>`tech-events` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[2].location` | Hobart, TAS | many slides |
| `community[2].bullets[0]` | Nine local ICT and professional activities in one semester: the TasICT… | `tas-ict-community` (menu) |
| `community[2].bullets[1]` | Keeps structured notes after each event and follows up on them: a ques… | `tas-ict-community` (menu) |
| `community[3].id` | inspired-mind-lab | `people-place` (tour #4 · menu · anchor) |
| `community[3].org` | Inspired Mind Lab | `people-place` (tour #4 · menu · anchor)<br>`inspired-mind-lab` (menu) |
| `community[3].role` | STEAMM Workshop Volunteer | `people-place` (tour #4 · menu · anchor)<br>`inspired-mind-lab` (menu) |
| `community[3].period` | 2026 – Present | many slides |
| `community[3].status` | current | — |
| `community[3].field` | Education | many slides |
| `community[3].location` | Rokeby, TAS | `inspired-mind-lab` (menu) |
| `community[3].bullets[0]` | Supported a hands-on STEAMM robotics workshop for children aged 6 to 1… | `inspired-mind-lab` (menu) |
| `community[4].id` | utas-motorsport | `people-place` (tour #4 · menu · anchor) |
| `community[4].org` | UTAS Motorsport | many slides |
| `community[4].role` | LiDAR & Autonomous Systems Contributor | `people-place` (tour #4 · menu · anchor)<br>`utas-motorsport` (menu) |
| `community[4].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`motorsport` (menu · anchor) |
| `community[4].status` | current | — |
| `community[4].field` | Science and technology | `tas-ict-community` (menu)<br>`utas-motorsport` (menu)<br>`tech-events` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[4].location` | Hobart, TAS | many slides |
| `community[4].bullets[0]` | A multidisciplinary student engineering team, testing autonomous-vehic… | `utas-motorsport` (menu) |
| `community[4].evidence[0]` | motorsport | `people-place` (tour #4 · menu · anchor)<br>`utas-motorsport` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `community[5].id` | be-hers | — |
| `community[5].org` | Be Hers Ltd | `position-people-who-bridge` (menu)<br>`people-place` (tour #4 · menu · anchor)<br>`be-hers` (menu) |
| `community[5].role` | Web Developer | `people-place` (tour #4 · menu · anchor)<br>`be-hers` (menu) |
| `community[5].period` | 2026 – Present | many slides |
| `community[5].status` | current | — |
| `community[5].field` | Community organisation | `be-hers` (menu) |
| `community[5].location` | Hobart, TAS | many slides |
| `community[5].bullets[0]` | Rebuilding the organisation's website around updated business and comm… | `be-hers` (menu) |
| `community[6].id` | libraries-tasmania | `people-place` (tour #4 · menu · anchor) |
| `community[6].org` | Libraries Tasmania — Glenorchy Library | `people-place` (tour #4 · menu · anchor)<br>`libraries-tasmania` (menu) |
| `community[6].role` | Digital Mentor | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`people-place` (tour #4 · menu · anchor)<br>`libraries-tasmania` (menu) |
| `community[6].period` | Aug 2026 – Present | `libraries-tasmania` (menu)<br>`hospitals-south` (menu) |
| `community[6].status` | current | — |
| `community[6].field` | Education | many slides |
| `community[6].location` | Glenorchy, TAS | `libraries-tasmania` (menu) |
| `community[6].bullets[0]` | Provide one-to-one digital inclusion support, guiding community member… | `libraries-tasmania` (menu) |
| `community[7].id` | fobi-2026 | `people-place` (tour #4 · menu · anchor) |
| `community[7].org` | Festival of Bright Ideas 2026 | `people-place` (tour #4 · menu · anchor)<br>`fobi-2026` (menu) |
| `community[7].role` | VR Volunteer | `people-place` (tour #4 · menu · anchor)<br>`fobi-2026` (menu) |
| `community[7].period` | Aug 2026 | `libraries-tasmania` (menu)<br>`fobi-2026` (menu)<br>`hospitals-south` (menu) |
| `community[7].status` | completed | `raise-foundation` (menu) |
| `community[7].field` | Education | many slides |
| `community[7].location` | Hobart, TAS | many slides |
| `community[7].bullets[0]` | Supported Healthy Shack Tech's VR and 3D digital twin exhibit, assisti… | `fobi-2026` (menu) |
| `community[7].bullets[1]` | Technology is not only about whether we can build something. It also m… | `fobi-2026` (menu) |
| `community[8].id` | raise-foundation | `people-place` (tour #4 · menu · anchor) |
| `community[8].org` | Raise Foundation | `people-place` (tour #4 · menu · anchor)<br>`raise-foundation` (menu) |
| `community[8].role` | Volunteer Youth Mentor | `people-place` (tour #4 · menu · anchor)<br>`raise-foundation` (menu) |
| `community[8].period` | Starting Apr 2027 | `raise-foundation` (menu) |
| `community[8].status` | incoming | — |
| `community[8].field` | Education | many slides |
| `community[8].location` | Hobart High School, TAS | `raise-foundation` (menu) |
| `community[8].bullets[0]` | Selected and trained for Raise's in-school mentoring program; complete… | `raise-foundation` (menu) |
| `community[9].id` | hospitals-south | `people-place` (tour #4 · menu · anchor) |
| `community[9].org` | Tasmanian Health Service — Hospitals South | `people-place` (tour #4 · menu · anchor)<br>`hospitals-south` (menu) |
| `community[9].role` | Consumer Representative (Register) | `people-place` (tour #4 · menu · anchor)<br>`hospitals-south` (menu) |
| `community[9].period` | Aug 2026 – Present | `libraries-tasmania` (menu)<br>`hospitals-south` (menu) |
| `community[9].status` | onboarding | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor) |
| `community[9].field` | Health | — |
| `community[9].location` | Hobart, TAS | many slides |
| `community[9].bullets[0]` | Selected for the Hospitals South Consumer Representative Register, wit… | `hospitals-south` (menu) |
| `community[9].bullets[1]` | Met the consumer engagement team in September 2026 to talk through the… | `hospitals-south` (menu) |
| `community[10].id` | tianyun-community | `people-place` (tour #4 · menu · anchor) |
| `community[10].org` | Tianyun Community Committee | `people-place` (tour #4 · menu · anchor)<br>`tianyun-community` (menu) |
| `community[10].role` | Community Volunteer | `people-place` (tour #4 · menu · anchor)<br>`tianyun-community` (menu) |
| `community[10].period` | Jul 2025 – Oct 2025 | `tianyun-community` (menu) |
| `community[10].status` | completed | `raise-foundation` (menu) |
| `community[10].field` | Community services | `tianyun-community` (menu) |
| `community[10].location` | China | — |
| `community[10].bullets[0]` | 175 hours of recurring community service: information registration, re… | `tianyun-community` (menu) |
| `community[10].bullets[1]` | Coordinated event preparation and routine support for residents and vi… | `tianyun-community` (menu) |
| `community[11].id` | tech-events | `people-place` (tour #4 · menu · anchor) |
| `community[11].org` | World Artificial Intelligence Conference · Huawei Connect | `people-place` (tour #4 · menu · anchor)<br>`tech-events` (menu) |
| `community[11].role` | Public Technology Event Volunteer | `people-place` (tour #4 · menu · anchor)<br>`tech-events` (menu) |
| `community[11].period` | Jul 2023 – Sep 2024 | `tech-events` (menu) |
| `community[11].status` | completed | `raise-foundation` (menu) |
| `community[11].field` | Science and technology | `tas-ict-community` (menu)<br>`utas-motorsport` (menu)<br>`tech-events` (menu)<br>⚠️ same text as another slot; attribution may be wrong |
| `community[11].location` | China | — |
| `community[11].bullets[0]` | Guided visitors and supported venue operations at two major technology… | `tech-events` (menu) |

---

## Skill groups — `skillGroups`

Generate the `capabilities` slide; `items` are technology names.

| Field path | Current value | Appears on |
|---|---|---|
| `skillGroups[0].title` | Data Analytics & Business Intelligence | `capabilities` (menu · anchor) |
| `skillGroups[0].items[0]` | Python | classic homepage only: `Skills` |
| `skillGroups[0].items[1]` | SQL | classic homepage only: `Skills` |
| `skillGroups[0].items[2]` | Power BI | `capabilities` (menu · anchor)<br>`tasmania-tech-dashboard` (menu · anchor)<br>`tasmania-tech-dashboard-highlight-1` |
| `skillGroups[0].items[3]` | Pandas | classic homepage only: `Skills` |
| `skillGroups[0].items[4]` | NumPy | classic homepage only: `Skills` |
| `skillGroups[0].items[5]` | Data Cleaning | `capabilities` (menu · anchor) |
| `skillGroups[0].items[6]` | Data Processing | `capabilities` (menu · anchor) |
| `skillGroups[0].items[7]` | Data Visualisation | `capabilities` (menu · anchor) |
| `skillGroups[0].items[8]` | Dashboard Development | `capabilities` (menu · anchor) |
| `skillGroups[0].items[9]` | Reporting | `capabilities` (menu · anchor) |
| `skillGroups[0].items[10]` | Data Quality | `capabilities` (menu · anchor) |
| `skillGroups[0].items[11]` | CSV/JSON Processing | `capabilities` (menu · anchor) |
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
| `skillGroups[2].title` | AI Applications, Agents & Automation | `capabilities` (menu · anchor) |
| `skillGroups[2].items[0]` | LLM Integration | `capabilities` (menu · anchor) |
| `skillGroups[2].items[1]` | Retrieval-Augmented Generation (RAG) | `capabilities` (menu · anchor) |
| `skillGroups[2].items[2]` | Prompt Engineering | `capabilities` (menu · anchor) |
| `skillGroups[2].items[3]` | Context Management | `capabilities` (menu · anchor) |
| `skillGroups[2].items[4]` | Multi-Agent Systems | `capabilities` (menu · anchor)<br>`ai-town` (menu · anchor) |
| `skillGroups[2].items[5]` | AI Workflow Automation | `capabilities` (menu · anchor) |
| `skillGroups[2].items[6]` | Model Evaluation | `capabilities` (menu · anchor) |
| `skillGroups[2].items[7]` | PyTorch | classic homepage only: `Skills` |
| `skillGroups[2].items[8]` | Stable Diffusion | `capabilities` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor) |
| `skillGroups[2].items[9]` | LoRA Fine-Tuning | `capabilities` (menu · anchor) |
| `skillGroups[2].items[10]` | ComfyUI | classic homepage only: `Skills` |
| `skillGroups[3].title` | Software Engineering, Web & Backend | `capabilities` (menu · anchor) |
| `skillGroups[3].items[0]` | Python | classic homepage only: `Skills` |
| `skillGroups[3].items[1]` | JavaScript | `capabilities` (menu · anchor)<br>`internships-china` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `skillGroups[3].items[2]` | TypeScript | `capabilities` (menu · anchor)<br>`personal-english-bank` (menu · anchor) |
| `skillGroups[3].items[3]` | Node.js | classic homepage only: `Skills` |
| `skillGroups[3].items[4]` | Express.js | `capabilities` (menu · anchor)<br>`bili-cache-watch` (menu · anchor) |
| `skillGroups[3].items[5]` | React | classic homepage only: `Skills` |
| `skillGroups[3].items[6]` | Next.js | classic homepage only: `Skills` |
| `skillGroups[3].items[7]` | PixiJS | classic homepage only: `Skills` |
| `skillGroups[3].items[8]` | Framer Motion | `capabilities` (menu · anchor) |
| `skillGroups[3].items[9]` | Django | classic homepage only: `Skills` |
| `skillGroups[3].items[10]` | FastAPI | classic homepage only: `Skills` |
| `skillGroups[3].items[11]` | REST APIs | `capabilities` (menu · anchor) |
| `skillGroups[3].items[12]` | SQL | classic homepage only: `Skills` |
| `skillGroups[3].items[13]` | SQLite | classic homepage only: `Skills` |
| `skillGroups[3].items[14]` | Azure Functions | `capabilities` (menu · anchor) |
| `skillGroups[3].items[15]` | HTML | classic homepage only: `Skills` |
| `skillGroups[3].items[16]` | CSS | classic homepage only: `Skills` |
| `skillGroups[4].title` | Testing, DevOps & IT Support | `capabilities-2` |
| `skillGroups[4].items[0]` | Technical Support | `capabilities-2` |
| `skillGroups[4].items[1]` | Application Support | `capabilities-2` |
| `skillGroups[4].items[2]` | Software Testing | `capabilities-2` |
| `skillGroups[4].items[3]` | Quality Assurance (QA) | `capabilities-2` |
| `skillGroups[4].items[4]` | Debugging | `capabilities-2` |
| `skillGroups[4].items[5]` | Validation | `capabilities-2` |
| `skillGroups[4].items[6]` | User Training | `capabilities-2` |
| `skillGroups[4].items[7]` | Git | classic homepage only: `Skills` |
| `skillGroups[4].items[8]` | Linux | classic homepage only: `Skills` |
| `skillGroups[4].items[9]` | Docker | classic homepage only: `Skills` |
| `skillGroups[4].items[10]` | Jenkins | classic homepage only: `Skills` |
| `skillGroups[4].items[11]` | CI/CD | classic homepage only: `Skills` |
| `skillGroups[4].items[12]` | Agile Development | `capabilities-2` |
| `skillGroups[5].title` | Game & Interactive Technology | `capabilities-2` |
| `skillGroups[5].items[0]` | Unreal Engine | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `skillGroups[5].items[1]` | Unity | classic homepage only: `Skills` |
| `skillGroups[5].items[2]` | Blueprint | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `skillGroups[5].items[3]` | C++ | classic homepage only: `Skills` |
| `skillGroups[5].items[4]` | C# | classic homepage only: `Skills` |
| `skillGroups[5].items[5]` | Lua | classic homepage only: `Skills` |
| `skillGroups[5].items[6]` | Game Systems Design | `capabilities-2` |
| `skillGroups[5].items[7]` | Interaction Design | `capabilities-2` |
| `skillGroups[5].items[8]` | AR/VR | classic homepage only: `Skills` |
| `skillGroups[5].items[9]` | Quest & Dialogue Systems | `capabilities-2` |
| `skillGroups[5].items[10]` | AI-driven NPCs | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`ue5-financial-education-highlight-1` |
| `skillGroups[6].title` | Autonomous & Simulation Systems | `capabilities-2` |
| `skillGroups[6].items[0]` | ROS 2 | classic homepage only: `Skills` |
| `skillGroups[6].items[1]` | CARLA | classic homepage only: `Skills` |
| `skillGroups[6].items[2]` | RViz | classic homepage only: `Skills` |
| `skillGroups[6].items[3]` | WSL 2 | classic homepage only: `Skills` |
| `skillGroups[6].items[4]` | LiDAR | classic homepage only: `Skills` |
| `skillGroups[6].items[5]` | Point Clouds | `capabilities-2` |
| `skillGroups[6].items[6]` | DBSCAN | classic homepage only: `Skills` |
| `skillGroups[6].items[7]` | KISS-ICP | `capabilities-2`<br>`motorsport` (menu · anchor)<br>`motorsport-highlight-1` |
| `skillGroups[6].items[8]` | Hesai ROS 2 Driver | `capabilities-2` |
| `skillGroups[6].items[9]` | Pandar40P | `capabilities-2`<br>`motorsport-highlight-2` |

---

## Projects — `projects`

Each project makes 1 + ⌈bullets/2⌉ slides.

| Field path | Current value | Appears on |
|---|---|---|
| `projects[0].slug` | motorsport | `people-place` (tour #4 · menu · anchor)<br>`utas-motorsport` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `projects[0].title` | UTAS Motorsport — LiDAR Autonomy | `projects-index` (tour #5 · menu · anchor)<br>`motorsport` (menu · anchor)<br>`motorsport-highlight-1`<br>`motorsport-highlight-2` |
| `projects[0].period` | Jul 2026 – Present | `utas-motorsport` (menu)<br>`motorsport` (menu · anchor) |
| `projects[0].link` | https://github.com/Zeeekrom/MotorSport | `motorsport` (menu · anchor) |
| `projects[0].description` | End-to-end autonomous-vehicle software prototype for UTAS Motorsport's… | `motorsport` (menu · anchor) |
| `projects[0].bullets[0]` | Built a full pipeline in CARLA, ROS 2 and RViz: virtual 40-channel LiD… | `motorsport-highlight-1` |
| `projects[0].bullets[1]` | Validated with multi-lap, multi-track, sensor-fault and dynamic-obstac… | `motorsport-highlight-1` |
| `projects[0].bullets[2]` | Built the official Hesai ROS 2 driver for upcoming Pandar40P hardware … | `motorsport-highlight-2` |
| `projects[0].tags[0]` | Python | classic homepage only: `Projects` |
| `projects[0].tags[1]` | ROS 2 | classic homepage only: `Projects` |
| `projects[0].tags[2]` | CARLA | classic homepage only: `Projects` |
| `projects[0].tags[3]` | RViz | classic homepage only: `Projects` |
| `projects[0].tags[4]` | LiDAR | classic homepage only: `Projects` |
| `projects[0].tags[5]` | DBSCAN | classic homepage only: `Projects` |
| `projects[0].tags[6]` | KISS-ICP | `capabilities-2`<br>`motorsport` (menu · anchor)<br>`motorsport-highlight-1` |
| `projects[1].slug` | payment-agent-lab | `position-autonomy-and-accountability` (menu)<br>`position-agent-is-what-it-can-reach` (menu)<br>`position-short-loops` (menu)<br>`position-model-is-not-a-workflow` (menu)<br>`projects-index` (tour #5 · menu · anchor) |
| `projects[1].title` | AI-Native Payment & Agent Engineering Lab | many slides |
| `projects[1].period` | 2026 | classic homepage only: `Projects` |
| `projects[1].description` | A payment-processing prototype and a read-only operations copilot, bui… | `payment-agent-lab` (menu · anchor) |
| `projects[1].bullets[0]` | Designed a FastAPI/SQLite payment-processing prototype normalising syn… | `payment-agent-lab-highlight-1` |
| `projects[1].bullets[1]` | Verified a read-only RAG operations copilot with three tools and a Pla… | `payment-agent-lab-highlight-1` |
| `projects[1].tags[0]` | FastAPI | classic homepage only: `Projects` |
| `projects[1].tags[1]` | SQLite | classic homepage only: `Projects` |
| `projects[1].tags[2]` | Python | classic homepage only: `Projects` |
| `projects[1].tags[3]` | RAG | classic homepage only: `Projects` |
| `projects[1].tags[4]` | pytest | classic homepage only: `Projects` |
| `projects[1].tags[5]` | Agent workflows | `payment-agent-lab` (menu · anchor) |
| `projects[2].slug` | bili-cache-watch | `projects-index` (tour #5 · menu · anchor)<br>`bili-cache-watch` (menu · anchor) |
| `projects[2].title` | Bili Cache Watch | `projects-index` (tour #5 · menu · anchor)<br>`bili-cache-watch` (menu · anchor)<br>`bili-cache-watch-highlight-1` |
| `projects[2].period` | Feb 2026 – Apr 2026 | `bili-cache-watch` (menu · anchor)<br>`tasmania-tech-dashboard` (menu · anchor) |
| `projects[2].link` | https://github.com/Zeeekrom/bili-cache-watch | `bili-cache-watch` (menu · anchor) |
| `projects[2].description` | Local full-stack web app for managing cached Bilibili videos across fo… | `bili-cache-watch` (menu · anchor) |
| `projects[2].bullets[0]` | Created a local full-stack application managing three cache sources - … | `bili-cache-watch-highlight-1` |
| `projects[2].bullets[1]` | Implemented API-based availability checks, local playback, time-synchr… | `bili-cache-watch-highlight-1` |
| `projects[2].tags[0]` | Node.js | classic homepage only: `Projects` |
| `projects[2].tags[1]` | Express.js | `capabilities` (menu · anchor)<br>`bili-cache-watch` (menu · anchor) |
| `projects[2].tags[2]` | SQLite | classic homepage only: `Projects` |
| `projects[2].tags[3]` | Docker | classic homepage only: `Projects` |
| `projects[2].tags[4]` | FFmpeg | classic homepage only: `Projects` |
| `projects[3].slug` | tasmania-tech-dashboard | `projects-index` (tour #5 · menu · anchor) |
| `projects[3].title` | Tasmania Tech / Research Intelligence Dashboard | `projects-index` (tour #5 · menu · anchor)<br>`tasmania-tech-dashboard` (menu · anchor)<br>`tasmania-tech-dashboard-highlight-1` |
| `projects[3].period` | Feb 2026 – Apr 2026 | `bili-cache-watch` (menu · anchor)<br>`tasmania-tech-dashboard` (menu · anchor) |
| `projects[3].link` | https://github.com/Zeeekrom/TamaniaGithubResearch | `tasmania-tech-dashboard` (menu · anchor) |
| `projects[3].description` | Dashboard analysing GitHub repositories and research projects connecte… | `tasmania-tech-dashboard` (menu · anchor) |
| `projects[3].bullets[0]` | Built a Tasmania-focused dashboard to analyse GitHub repositories and … | `tasmania-tech-dashboard-highlight-1` |
| `projects[3].bullets[1]` | Processed and classified repository data, visualised project activity … | `tasmania-tech-dashboard-highlight-1` |
| `projects[3].tags[0]` | Node.js | classic homepage only: `Projects` |
| `projects[3].tags[1]` | Neo4j | classic homepage only: `Projects` |
| `projects[3].tags[2]` | Power BI | `capabilities` (menu · anchor)<br>`tasmania-tech-dashboard` (menu · anchor)<br>`tasmania-tech-dashboard-highlight-1` |
| `projects[3].tags[3]` | RAG | classic homepage only: `Projects` |
| `projects[4].slug` | personal-english-bank | `projects-index` (tour #5 · menu · anchor)<br>`personal-english-bank` (menu · anchor) |
| `projects[4].title` | Personal English Bank | `projects-index` (tour #5 · menu · anchor)<br>`personal-english-bank` (menu · anchor) |
| `projects[4].period` | 2026 | classic homepage only: `Projects` |
| `projects[4].link` | https://github.com/Zeeekrom/personal-english-bank | `personal-english-bank` (menu · anchor) |
| `projects[4].description` | A traceable personal English-learning workflow built with Next.js, Nes… | `personal-english-bank` (menu · anchor) |
| `projects[4].tags[0]` | Next.js | classic homepage only: `Projects` |
| `projects[4].tags[1]` | NestJS | classic homepage only: `Projects` |
| `projects[4].tags[2]` | Prisma | classic homepage only: `Projects` |
| `projects[4].tags[3]` | SQL Server | `personal-english-bank` (menu · anchor) |
| `projects[4].tags[4]` | TypeScript | `capabilities` (menu · anchor)<br>`personal-english-bank` (menu · anchor) |
| `projects[5].slug` | ue5-financial-education | `projects-index` (tour #5 · menu · anchor) |
| `projects[5].title` | UE5 Financial Education Capstone | `projects-index` (tour #5 · menu · anchor)<br>`ue5-financial-education` (menu · anchor)<br>`ue5-financial-education-highlight-1` |
| `projects[5].period` | Oct 2025 – Feb 2026 | `ue5-financial-education` (menu · anchor) |
| `projects[5].description` | Modular UE5 financial-education system with AI-driven NPCs and a FastA… | `ue5-financial-education` (menu · anchor) |
| `projects[5].bullets[0]` | Created a modular UE5 interactive experience with AI-driven NPCs, conf… | `ue5-financial-education-highlight-1` |
| `projects[5].bullets[1]` | Connected the UE5 client to FastAPI, structured question data, RAG ret… | `ue5-financial-education-highlight-1` |
| `projects[5].tags[0]` | Unreal Engine 5 | `ue5-financial-education` (menu · anchor) |
| `projects[5].tags[1]` | Blueprint | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[5].tags[2]` | C++ | classic homepage only: `Projects` |
| `projects[5].tags[3]` | FastAPI | classic homepage only: `Projects` |
| `projects[5].tags[4]` | RAG | classic homepage only: `Projects` |
| `projects[5].tags[5]` | VR | classic homepage only: `Projects` |
| `projects[6].slug` | ai-town | classic homepage only: `Projects` |
| `projects[6].title` | AI Town Multi-Agent Simulation | `projects-index` (tour #5 · menu · anchor)<br>`ai-town` (menu · anchor)<br>`ai-town-highlight-1` |
| `projects[6].period` | Oct 2025 – Dec 2025 | `ai-town` (menu · anchor) |
| `projects[6].description` | Django-based virtual town simulation focused on multi-agent behaviour … | `ai-town` (menu · anchor) |
| `projects[6].bullets[0]` | Architected a Django-based multi-agent virtual town implementing obser… | `ai-town-highlight-1` |
| `projects[6].tags[0]` | Python | classic homepage only: `Projects` |
| `projects[6].tags[1]` | Django | classic homepage only: `Projects` |
| `projects[6].tags[2]` | Multi-Agent Systems | `capabilities` (menu · anchor)<br>`ai-town` (menu · anchor) |
| `projects[6].tags[3]` | LLM Agents | `ai-town` (menu · anchor) |
| `projects[7].slug` | little-red-sequel | `projects-index` (tour #5 · menu · anchor) |
| `projects[7].title` | Little Red: Sequel | `projects-index` (tour #5 · menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[7].period` | Dec 2023 – May 2024 | `little-red-sequel` (menu · anchor) |
| `projects[7].description` | Independently developed story-driven 3D pixel-style Unreal Engine indi… | `little-red-sequel` (menu · anchor) |
| `projects[7].bullets[0]` | Developed a story-driven 3D pixel-style Unreal Engine game demo featur… | `little-red-sequel-highlight-1` |
| `projects[7].bullets[1]` | Designed Blueprint systems for quests, dialogue, levels, scenes, menus… | `little-red-sequel-highlight-1` |
| `projects[7].tags[0]` | Unreal Engine | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[7].tags[1]` | Blueprint | `capabilities-2`<br>`ue5-financial-education` (menu · anchor)<br>`little-red-sequel` (menu · anchor)<br>`little-red-sequel-highlight-1` |
| `projects[7].tags[2]` | Game Design | `little-red-sequel` (menu · anchor) |
| `projects[7].tags[3]` | AIGC | classic homepage only: `Projects` |

---

## Internships — `internships`

Each makes ⌈bullets/2⌉ slides, ids prefixed `work-`, behind the `internships-china` summary card.

| Field path | Current value | Appears on |
|---|---|---|
| `internships[0].org` | Strategy&Ops Consultancy | `who-am-i` (tour #2 · menu · anchor)<br>`current-focus`<br>`experience-index` (tour #6 · menu · anchor)<br>`work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[0].role` | IT & Digital Systems Intern | `work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[0].period` | Sep 2026 – Present | `work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[0].location` | Hobart, TAS | many slides |
| `internships[0].type` | Internship, three months | `work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[0].bullets[0]` | Working on the organisation's website and learning management system, … | `work-strategy-ops-consultancy-work-1` (menu · anchor) |
| `internships[1].org` | Qingqiu Technology Co., Ltd. | `position-short-loops` (menu)<br>`internships-china` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[1].role` | Software Engineer Intern | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[1].period` | Dec 2025 – Apr 2026 | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[1].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[1].bullets[0]` | Integrated OpenAI Codex and Anthropic Claude into AI-enabled developer… | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[1].bullets[1]` | Developed context-processing and web workflow features for CLAW using … | `internships-china` (menu · anchor)<br>`work-qingqiu-technology-co-ltd-work-1` (menu · anchor) |
| `internships[1].location` | China | classic homepage only: `Experience` |
| `internships[2].org` | Tencent | classic homepage only: `Experience` |
| `internships[2].role` | Technical Game Systems Intern | `work-tencent-work-1` (menu · anchor)<br>`work-tencent-work-2` |
| `internships[2].period` | Jun 2025 – Aug 2025 | `work-tencent-work-1` (menu · anchor) |
| `internships[2].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[2].bullets[0]` | Analysed win rates, pick rates, skill effectiveness, player feedback, … | `internships-china` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor) |
| `internships[2].bullets[1]` | Modelled and iterated skill configurations and numerical parameters in… | `work-tencent-work-1` (menu · anchor) |
| `internships[2].bullets[2]` | Prototyped and debugged Lua gameplay modules and collaborated with eng… | `work-tencent-work-2` |
| `internships[2].location` | China | classic homepage only: `Experience` |
| `internships[3].org` | Perfect World Co., Ltd. | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor) |
| `internships[3].role` | AI Workflow Engineering Intern | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[3].period` | Nov 2023 – Jan 2024 | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor) |
| `internships[3].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[3].bullets[0]` | Curated structured datasets for One Punch Man: World through data coll… | `work-perfect-world-co-ltd-work-1` (menu · anchor) |
| `internships[3].bullets[1]` | Trained and refined LoRA models with Stable Diffusion and ComfyUI, and… | `work-perfect-world-co-ltd-work-1` (menu · anchor) |
| `internships[3].location` | China | classic homepage only: `Experience` |
| `internships[4].org` | Lilith Games | `position-human-judgement-sets-value` (menu)<br>`internships-china` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor) |
| `internships[4].role` | AI Workflow Engineering Intern | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[4].period` | Jun 2023 – Sep 2023 | `work-lilith-games-work-1` (menu · anchor) |
| `internships[4].type` | Full-time | `work-qingqiu-technology-co-ltd-work-1` (menu · anchor)<br>`work-tencent-work-1` (menu · anchor)<br>`work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`work-lilith-games-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `internships[4].bullets[0]` | Automated Unity batch operations with Python and C#, streamlining asse… | `work-lilith-games-work-1` (menu · anchor) |
| `internships[4].bullets[1]` | Developed AIGC production pipelines across global live-service titles,… | `work-lilith-games-work-1` (menu · anchor) |
| `internships[4].location` | China | classic homepage only: `Experience` |

---

## Ventures — `startups`

Same shape as internships, ids prefixed `venture-`.

| Field path | Current value | Appears on |
|---|---|---|
| `startups[0].org` | Malou Cultural Media Co., Ltd. (Startup) | `experience-index` (tour #6 · menu · anchor)<br>`venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor) |
| `startups[0].role` | Recruitment Manager | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor) |
| `startups[0].period` | Apr 2024 – Aug 2025 | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor) |
| `startups[0].type` | Part-time, Remote | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor)<br>`venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `startups[0].bullets[0]` | Coordinated recruitment, onboarding, and people operations with a thre… | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor) |
| `startups[0].bullets[1]` | Screened 300+ candidates and standardised the end-to-end recruitment p… | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor) |
| `startups[1].org` | AR Metaverse Content Platform (Startup) | `experience-index` (tour #6 · menu · anchor)<br>`venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor) |
| `startups[1].role` | Co-Founder & AIGC Technical Lead | `venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor) |
| `startups[1].period` | Nov 2023 – Jan 2024 | `work-perfect-world-co-ltd-work-1` (menu · anchor)<br>`venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor) |
| `startups[1].type` | Part-time, Remote | `venture-malou-cultural-media-co-ltd-startup-work-1` (menu · anchor)<br>`venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `startups[1].bullets[0]` | Co-founded a 4-5 person startup and led development of an AR content p… | `venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor) |
| `startups[1].bullets[1]` | Coordinated with 20+ external stakeholders and prepared B2B use cases … | `venture-ar-metaverse-content-platform-startup-work-1` (menu · anchor) |

---

## Publications — `publications`

One slide each, ids `paper-1`, `paper-2`… by position.

| Field path | Current value | Appears on |
|---|---|---|
| `publications[0].title` | Exploring User Experience and Learning Motivation as Key Mediators in … | `research-index` (menu · anchor)<br>`paper-1` |
| `publications[0].venue` | ACM, IECA 2026 | `paper-1` |
| `publications[0].date` | May 2026 | `paper-1` |
| `publications[0].note` | Contributed to immersive environment design, questionnaire data analys… | `paper-1` |
| `publications[1].title` | Predicting Student Performance in Software Engineering Education Using… | `research-index` (menu · anchor)<br>`paper-2` |
| `publications[1].venue` | ACM International Conference Proceedings Series, DEIT 2025 | `paper-2` |
| `publications[1].date` | Jun 2025 | `work-tencent-work-1` (menu · anchor)<br>`paper-2` |
| `publications[1].note` | Co-authored a machine-learning study involving feature engineering, Ra… | `paper-2` |

---

## Education — `education`

All on one `education` slide.

| Field path | Current value | Appears on |
|---|---|---|
| `education[0].degree` | Master of Information Technology and Systems | `who-am-i` (tour #2 · menu · anchor)<br>`education` (tour #7 · menu · anchor) |
| `education[0].school` | University of Tasmania | `who-am-i` (tour #2 · menu · anchor)<br>`tasmania-tech-dashboard-highlight-1`<br>`education` (tour #7 · menu · anchor) |
| `education[0].period` | Jul 2026 – Jul 2028 | `education` (tour #7 · menu · anchor) |
| `education[0].detail` | Hobart, TAS | many slides |
| `education[1].degree` | Bachelor of Software Engineering | `education` (tour #7 · menu · anchor) |
| `education[1].school` | Sanda University | `education` (tour #7 · menu · anchor) |
| `education[1].period` | Sep 2024 – Jun 2026 | `education` (tour #7 · menu · anchor) |
| `education[1].detail` | GPA 3.82/4.00 · Rank 1/153 in the major | `education` (tour #7 · menu · anchor) |
| `education[2].degree` | Undergraduate Exchange Program, Information Technology | `education` (tour #7 · menu · anchor) |
| `education[2].school` | Saint Martin's University | `education` (tour #7 · menu · anchor) |
| `education[2].period` | Jan 2025 – May 2025 | `education` (tour #7 · menu · anchor) |
| `education[2].detail` | USA · GPA 4.00/4.00 · Dean's List | `education` (tour #7 · menu · anchor) |
| `education[3].degree` | Associate Degree in Digital Media Technology | `education` (tour #7 · menu · anchor) |
| `education[3].school` | Nanhu Vocational and Technical College | `education` (tour #7 · menu · anchor) |
| `education[3].period` | Sep 2021 – Jun 2024 | `education` (tour #7 · menu · anchor) |
| `education[3].detail` | GPA 3.73/4.00 · Rank 1/46 | `education` (tour #7 · menu · anchor) |

---

## Contact — `contact`

Heading and subheading of the `contact` slide, the tour's last stop.

| Field path | Current value | Appears on |
|---|---|---|
| `contact.heading` | Get in Touch | `contact` (tour #8 · menu · anchor)<br>⚠️ same text as another slot; attribution may be wrong |
| `contact.subheading` | Happy to talk about roles, projects or volunteering — or to meet for a… | `contact` (tour #8 · menu · anchor) |

---

## Footer — `footer`

Classic homepage only.

| Field path | Current value | Appears on |
|---|---|---|
| `footer.builtWith` | Built with Next.js & Tailwind CSS · Deployed on Microsoft Azure | classic homepage only: `Footer` |

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
