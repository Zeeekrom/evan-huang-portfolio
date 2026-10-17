# Keeping the site current

The site is only as current as the last thing that went into `content/*.json`. This is the
loop that keeps it current without anyone hand-editing JSON, and without an AI quietly
inventing a stronger version of Evan's career.

## The loop

```
   phone recording, LinkedIn post, new resume, project notes
                          │
                          ▼
         E:\MaskPlan\Site-Inbox\new\        (outside this repository)
                          │
            npm run intake │  gathers, extracts text, says what is new
                          ▼
            a session proposes changes      (content/*.json, with sources)
                          │
          npm run content │ npm test │ npm run build   (the guards)
                          ▼
                Evan says yes  →  commit  →  push main  →  CI deploys
                          │
            npm run intake -- --done        files the originals into done\
```

**The inbox is outside the repository on purpose.** This repository is mirrored to a public
one, and raw transcripts, recordings and other people's words are internal. Only distilled,
approved entries reach `content/`.

## Running it

```bash
npm run intake            # what has arrived since the last run
npm run intake -- --all   # show everything in the inbox again
npm run intake -- --done  # file the originals into done\ once they are dealt with
```

`SITE_INBOX` overrides the inbox location. The script writes extracted text and a digest to
`.intake/` (gitignored); it never writes to `content/`.

It also prints what the site already says — every community id, project slug, position,
employer, paper and skill group — so a proposed entry can be checked against the site before
it is written, and duplicates are obvious.

## What goes where

| What arrived | Where it goes | Watch out for |
|---|---|---|
| A new volunteer or community role | `content/community.json` | `status` is current / completed / incoming / onboarding. A role that has not started says so on the card |
| A conference, meetup or talk he attended | `content/positions.json` with `origin: "learned"`, or community.json if he worked the event | A speaker's idea stays theirs: the card says where he picked it up. Never quote a recording |
| A new project or repository | `content/projects.json` | Bullets come in pairs: every two make a slide |
| A new job or internship | `content/internships.json` or `startups.json` | Month-level dates; `internship-highlights.json` picks the two results the summary card carries |
| A new paper | `content/publications.json` | Co-authored, never sole author |
| A new resume | check every file above against it | The resume is the source of truth for facts |
| A view he formed himself | `content/positions.json` with `origin: "practice"` | It must link to work already on the site, or the build fails |

## The rules a proposal has to pass

1. **English only.** A Chinese character in `content/*.json` fails the build.
2. **Facts only from the material or the resume.** Nothing inferred, rounded up, or made more
   impressive than the source.
3. **Raw transcripts stay out of `content/`.** Distil them; cite the source file in the
   proposal, not on the site.
4. **Evidence ids must resolve.** `npm run content`, `npm test` and `npm run build` check that,
   along with the status vocabulary and the length budgets, before anything is committed.
5. **Nothing deploys until Evan has said yes.** Pushing `main` deploys the site.

## After the content changes

```bash
npm run content && npm test && npm run build
node scripts/gen-presenter.mjs      # the voice guide's catalogue
npm run content:map                 # docs/CONTENT-SLOTS.md
```

Then commit, push `main` (CI builds and deploys), and — when the change should also reach the
public mirror and the voice guide — `npm run sync:public` and `npm run deploy:api`.
