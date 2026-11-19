import type { ReactNode } from "react";
import { links } from "@/data/content";

/**
 * Turn the proper nouns the page names into links to their official sites.
 *
 * Written as a pass over finished text rather than as markup in the content,
 * because the same names appear in prose, in bullets, in a metric line and on
 * the canvas, and nobody is going to remember to mark up all four. The
 * registry is checked by hand — every URL in links.json was opened before it
 * was added — so a name with no verified home simply stays plain text.
 *
 * Rules that keep this from doing damage:
 *
 *   · Longest name first, so "Mother's Day Classic Foundation" is matched
 *     before "Mother's Day Classic" and the shorter one never wins.
 *   · Word boundaries on both sides, so "Raise" inside "Raised" is not a
 *     company and "AFK Journey" inside a longer title still is.
 *   · Once per block. A paragraph that says Tencent three times gets one
 *     link, not a paragraph that looks like a spam page.
 *   · No event handlers. This runs inside server components, and a
 *     handler cannot cross that boundary — the build refuses it. The one
 *     place it would have earned its keep is a company name inside a
 *     <summary>, where following the link also opens the row; that is a
 *     harmless second effect, and not worth making the section a client
 *     component to avoid.
 *   · Apostrophes are normalised, because the content uses the typographic
 *     one and a registry entry typed with the straight one would silently
 *     never match.
 */

const FLAT = (s: string) => s.replace(/[‘’]/g, "'");

/** Longest first; built once, not per render. */
const ENTRIES = [...links].sort((a, b) => b.name.length - a.name.length);

const PATTERN = new RegExp(
  `(${ENTRIES.map((e) => FLAT(e.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

const URL_FOR = new Map(ENTRIES.map((e) => [FLAT(e.name), e.url]));

export function linkify(text: string, key = ""): ReactNode {
  const flat = FLAT(text);
  PATTERN.lastIndex = 0;

  const out: ReactNode[] = [];
  const used = new Set<string>();
  let at = 0;
  let match: RegExpExecArray | null;

  while ((match = PATTERN.exec(flat)) !== null) {
    const name = match[1];
    const start = match.index;
    const end = start + name.length;

    // A match has to stand alone: "Tencent" yes, "Tencents" no.
    const before = start === 0 ? " " : flat[start - 1];
    const after = end >= flat.length ? " " : flat[end];
    if (/[A-Za-z0-9]/.test(before) || /[A-Za-z0-9]/.test(after)) continue;

    if (used.has(name)) continue;
    used.add(name);

    if (start > at) out.push(text.slice(at, start));
    out.push(
      <a
        key={`${key}-${name}-${start}`}
        className="pn-link"
        href={URL_FOR.get(name)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text.slice(start, end)}
      </a>,
    );
    at = end;
  }

  if (at === 0) return text;
  if (at < text.length) out.push(text.slice(at));
  return out;
}
