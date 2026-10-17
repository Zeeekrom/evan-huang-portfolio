/**
 * Where the presenter broker lives.
 *
 * The site is a static export and has no server of its own, so the broker runs
 * as an Azure Function on a separate origin. That origin is baked in at build
 * time; the function only answers callers on its allowlist, so publishing the
 * URL costs nothing.
 *
 * The broker also exposes /api/ask, a text version of the same guide. Nothing
 * in the UI calls it today — the site asks by voice — but it is kept because it
 * is the answer for the visitors voice cannot serve: locked-down corporate and
 * government networks where microphone access is blocked, and open-plan offices
 * where nobody is going to talk to a web page.
 */

export const PRESENTER_API =
  process.env.NEXT_PUBLIC_PRESENTER_API ?? "https://evan-voice-api.azurewebsites.net/api";
