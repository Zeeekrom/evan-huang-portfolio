"use client";

/**
 * The one place to look.
 *
 * The notes inbox and the content overview started as two separate things, one
 * of them an external service that had never been signed into — which is not
 * an admin panel, it is two errands. They are two tabs now.
 *
 * Still a static page holding no secret. The notes key is typed in and kept in
 * this browser; editing content happens in Pages CMS against the repository,
 * because a token that can push to a repository is a much bigger thing to
 * leave in a browser than a read-only key.
 */

import { useState } from "react";
import ContentOverview from "./ContentOverview";
import NotesInbox from "./NotesInbox";

type Tab = "notes" | "content";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <nav className="mb-8 flex items-center gap-1" aria-label="Sections">
        {(
          [
            ["notes", "Notes"],
            ["content", "Content"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-sm transition-colors"
            style={{
              backgroundColor: tab === id ? "var(--ui-bg-active, #8882)" : "transparent",
              fontWeight: tab === id ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/*
        Both stay mounted. The inbox holds a loaded list and an unlocked key,
        and switching tabs is not a reason to fetch it all again.
      */}
      <div hidden={tab !== "notes"}>
        <NotesInbox />
      </div>
      <div hidden={tab !== "content"}>
        <ContentOverview />
      </div>
    </main>
  );
}
