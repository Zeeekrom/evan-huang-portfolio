# content/

**This is the site's only content source. Changing these JSON files changes the website.**

No code needs touching. After a commit, CI checks the content and deploys it.

## Files

| File | What it is | Where it appears |
|---|---|---|
| `site.json` | Domain, name, email, social links, résumé path | Everywhere, plus SEO metadata |
| `about.json` | **The most important one.** `paragraphs` is the "Get to know me" text | Canvas `who-am-i` · the AI guide's only source on who Evan is |
| `projects.json` | Projects | Each project makes 1 + ⌈bullets ÷ 2⌉ slides |
| `internships.json` | Internships | Each makes ⌈bullets ÷ 2⌉ slides, behind the `internships-china` summary card |
| `internship-highlights.json` | The results on the internships summary card, at most two. Each is "which company, which bullet" (counting from 0), not the text itself | Canvas `internships-china` |
| `startups.json` | Ventures | Same shape as internships |
| `community.json` | Volunteering and community roles. `status` is `current`, `completed`, `incoming` or `onboarding` | Canvas `people-place` and a card per organisation |
| `positions.json` | "How I work with AI" cards. `evidence` must name slides that exist or the build fails; `origin` is `practice` (from his own work) or `learned` (picked up from someone else, and the card says so); `source` is for tracing and is never shown | Canvas `how-i-work` and a card per position (tour stop 3) |
| `publications.json` | Papers | One slide each |
| `education.json` | Degrees | One slide for all of them |
| `skills.json` | Skill groups | Canvas `capabilities` |
| `hero.json` | Opening screen text | **Classic homepage `/` only** — not on the canvas |
| `nav.json` | Homepage navigation | Classic homepage only |
| `contact.json` | Contact section text | Canvas `contact` (the tour's last stop) |
| `footer.json` | Footer | Classic homepage only |

Which slide each field appears on: [`docs/CONTENT-SLOTS.md`](../docs/CONTENT-SLOTS.md).

## Two rules

**1. English only.**

Every text field is a plain English string. A Chinese character anywhere in these files **fails the build**.

**2. `slug` and `id` are unique, and use only lowercase letters, digits and hyphens.**

They are also the slide id, the page anchor and the navigation target. Change one and links already shared stop working.

## Adding a project

Copy an entry and change the content:

```json
{
  "slug": "short-name",
  "title": "Project Name",
  "period": "Mar 2025 – Jun 2025",
  "description": "One or two sentences: what it is and why it exists.",
  "bullets": ["What you did, with a number or a system name where possible."],
  "tags": ["Python", "FastAPI"],
  "link": "https://github.com/…",
  "featured": false
}
```

`link` and `featured` are optional. Three to five bullets read best; **every two make a slide**.

Internships and ventures use `internships.json` / `startups.json`, with `org`, `role`, `period`, `type` and `bullets`.

## Two ways to edit

**① Forms (recommended)** — sign in at [app.pagescms.org](https://app.pagescms.org) with GitHub and grant access to this repository. It reads `.pages.yml` at the root.

Lists can be added to and removed from, and required fields are enforced. It works in a phone browser. It commits to the repository exactly as a manual edit would, CI runs the same checks, and a bad edit can be reverted with `git revert`.

**② Edit the JSON directly** — on github.com, or locally.

---

## After editing

```bash
npm run content   # checks: duplicate ids, slug collisions, text that is not English, bodies too long
npm run build     # type check and build; a malformed entry fails here
```

Editing on GitHub works too: CI runs the same checks after the commit and deploys only if they pass.

## One thing to keep in mind

The AI guide **is forbidden from stating any fact that is not in these files.**

Write specifically — numbers, system names, the technical decisions you actually made — and it speaks specifically. Write vaguely and it can only be vague.
