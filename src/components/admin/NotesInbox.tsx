"use client";

/**
 * Reads the sticky notes visitors have left.
 *
 * The admin key lives in this browser and nowhere else: not in the bundle, not
 * in the repository, not on a server. Typed once, kept in localStorage, and
 * cleared with one button.
 *
 * The endpoint answers 404 rather than 403 to a wrong key, so it does not
 * confirm itself to anyone probing. That is right for the endpoint and unhelpful
 * for the one person who is allowed in, which is why the failure copy here says
 * what a 404 actually means in this context.
 */

import { useCallback, useEffect, useState } from "react";
import { PRESENTER_API } from "@/lib/presenter";
import { NOTE_COLOURS } from "@/components/explore/canvas/sticky";
import { menu, slides } from "@/slides/slides";

const KEY_STORAGE = "notes-admin-key";

interface Note {
  id: string;
  at: string;
  text: string;
  colour: string;
  slideId: string;
  author: string;
}

type State =
  | { phase: "locked" }
  | { phase: "loading" }
  | { phase: "ready"; notes: Note[] }
  | { phase: "error"; message: string };

const paperOf = (colour: string) =>
  NOTE_COLOURS.find((c) => c.id === colour)?.paper ?? "#f7c948";

/**
 * A human name for where a note was left.
 *
 * The menu already holds one for every slide a visitor is likely to be looking
 * at, and it is the better label: a slide's own title is the headline, which
 * for the contact page is the email address and for the about page is seventy
 * characters of tagline. "Left on Reach out" is what a person means.
 */
const MENU_LABELS = new Map(menu.map((m) => [m.slideId, m.label]));

function whereLeft(slideId: string): string {
  if (!slideId) return "an unknown slide";
  const named = MENU_LABELS.get(slideId);
  if (named) return named;
  const slide = slides.find((s) => s.id === slideId);
  return slide?.intro || slide?.title || slideId;
}

function when(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(then).toLocaleDateString();
}

export default function NotesInbox() {
  const [key, setKey] = useState("");
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<State>({ phase: "locked" });

  const load = useCallback(async (adminKey: string) => {
    setState({ phase: "loading" });
    try {
      const res = await fetch(`${PRESENTER_API}/notes?limit=200`, {
        headers: { "x-admin-key": adminKey },
      });

      if (res.status === 404) {
        // The endpoint hides itself from a wrong key rather than saying "no".
        // Drop it rather than keep it: a stored key that does not work turns
        // every future visit into the same error instead of the form.
        window.localStorage.removeItem(KEY_STORAGE);
        setState({ phase: "error", message: "That key was not accepted." });
        return;
      }
      if (res.status === 429) {
        setState({ phase: "error", message: "Too many requests just now. Wait a moment." });
        return;
      }
      if (!res.ok) {
        setState({ phase: "error", message: `The server answered ${res.status}.` });
        return;
      }

      const data = (await res.json()) as { notes: Note[] };
      setState({ phase: "ready", notes: data.notes ?? [] });
    } catch {
      // fetch rejects the same way for offline, blocked and CORS.
      setState({ phase: "error", message: "Could not reach the notes endpoint." });
    }
  }, []);

  // A key kept from last time means this opens straight onto the notes.
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY_STORAGE);
    if (saved) {
      setKey(saved);
      void load(saved);
    }
  }, [load]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    window.localStorage.setItem(KEY_STORAGE, trimmed);
    setKey(trimmed);
    setDraft("");
    void load(trimmed);
  };

  const forget = () => {
    window.localStorage.removeItem(KEY_STORAGE);
    setKey("");
    setState({ phase: "locked" });
  };

  const notes = state.phase === "ready" ? state.notes : [];

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-mono text-lg font-semibold">Notes</h2>
        {key && (
          <div className="flex items-center gap-3 text-sm">
            {state.phase === "ready" && (
              <span className="opacity-60">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
            )}
            <button
              type="button"
              onClick={() => void load(key)}
              disabled={state.phase === "loading"}
              className="rounded-md border border-current/25 px-3 py-1 disabled:opacity-40"
            >
              {state.phase === "loading" ? "Loading…" : "Refresh"}
            </button>
            <button type="button" onClick={forget} className="opacity-60 underline">
              Forget key
            </button>
          </div>
        )}
      </header>

      {!key && (
        <form onSubmit={unlock} className="max-w-md">
          <p className="mb-3 text-sm opacity-75">
            Paste the admin key. It is kept in this browser and sent only to the notes
            endpoint — it is never part of this page.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Admin key"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-md border border-current/25 bg-transparent px-3 py-2 font-mono text-sm outline-none"
            />
            <button type="submit" className="rounded-md border border-current/25 px-4 py-2 text-sm">
              Open
            </button>
          </div>
          <p className="mt-3 text-xs opacity-50">
            Retrieve it with: az functionapp config appsettings list --name evan-voice-api
            --resource-group personal-website-rg
          </p>
        </form>
      )}

      {state.phase === "error" && (
        <div className="rounded-lg border border-current/20 p-4 text-sm">
          <p>{state.message}</p>
          <button type="button" onClick={forget} className="mt-2 underline opacity-70">
            Use a different key
          </button>
        </div>
      )}

      {state.phase === "ready" && notes.length === 0 && (
        <p className="text-sm opacity-60">No notes yet.</p>
      )}

      {state.phase === "ready" && notes.length > 0 && (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex gap-3 rounded-lg border border-current/15 p-4"
            >
              <span
                aria-hidden="true"
                title={note.colour}
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: paperOf(note.colour) }}
              />
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words">{note.text}</p>
                <p className="mt-2 text-xs opacity-55">
                  {when(note.at)} · left on {whereLeft(note.slideId)}
                  {note.author && ` · ${note.author.slice(0, 8)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
