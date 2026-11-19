import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Request guards shared by every presenter endpoint.
 *
 * These are about abuse, not load. Each endpoint handles one small request per
 * conversation, so the thing worth defending is the upstream bill, not the
 * function's own capacity.
 */

/** Offers and transcripts are small. Anything larger is not an honest client. */
export const MAX_BODY_BYTES = 64 * 1024;

/* ------------------------------------------------------------------ throttle */

const recent = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

/**
 * Best-effort per-IP throttle.
 *
 * Consumption instances come and go, so this is per-instance and cannot be the
 * budget control on its own — it is a speed bump. The hard ceilings are the
 * origin allowlist and the kill switch.
 */
export function throttled(ip, limit = MAX_PER_WINDOW) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) {
    for (const [key, times] of recent) {
      if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
    }
  }
  return hits.length > limit;
}

export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || "unknown";
}

/* ---------------------------------------------------------------------- cors */

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * With no allowlist configured this reflects nothing, so a misconfiguration
 * cannot quietly turn an endpoint into an open relay.
 */
export function corsHeaders(origin) {
  const allow = allowedOrigins().includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-admin-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Run the checks every endpoint shares, in the order they must happen.
 *
 * Origin is checked before the kill switch on purpose: a caller who is not
 * allowed here should not learn whether the feature exists or what state it is
 * in.
 *
 * Returns a response to send back, or null to continue.
 */
export function screen(request, context, { enabledFlag, rateLimit } = {}) {
  const origin = request.headers.get("origin") ?? "";
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    // 200 with an empty body, not 204. The runtime drops response headers on a
    // 204, which leaves the preflight with no Access-Control-Allow-Origin at
    // all — the browser then refuses the real request with a bare "Failed to
    // fetch" and nothing in the logs, because it never sent it.
    return { cors, response: { status: 200, headers: cors, body: "" } };
  }

  if (!cors["Access-Control-Allow-Origin"]) {
    context.warn(`rejected origin: ${origin || "(none)"}`);
    return { cors, response: { status: 403, headers: cors, body: "Origin not allowed." } };
  }

  if (enabledFlag && process.env[enabledFlag] !== "true") {
    return { cors, response: { status: 503, headers: cors, body: "Presenter is switched off." } };
  }

  if (throttled(clientIp(request), rateLimit)) {
    return {
      cors,
      response: { status: 429, headers: cors, body: "Too many requests. Try again shortly." },
    };
  }

  return { cors, response: null };
}

/* ------------------------------------------------------------------ persona */

/**
 * Persona and slide catalogue, generated from the deck that shipped.
 *
 * Read from the deployment package rather than an app setting. Once the
 * catalogue carried each slide's body text — which is what stops the model
 * answering from general knowledge — it outgrew what an environment variable
 * can reasonably hold. The file also keeps it in version control, next to the
 * script that produces it.
 *
 * PRESENTER_JSON still wins if set, so the persona can be adjusted without a
 * redeploy while it is being tuned.
 */
let cached = null;

export function presenter() {
  // Only a success is cached. Caching a failure would mean one unlucky read —
  // during a deployment swap, say — disabled the presenter until the next
  // cold start.
  if (cached) return cached;

  const override = process.env.PRESENTER_JSON;
  if (override) {
    try {
      cached = JSON.parse(override);
      return cached;
    } catch {
      /* fall through to the packaged copy rather than failing the request */
    }
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, "../../presenter.json"),
    resolve(process.cwd(), "presenter.json"),
    "/home/site/wwwroot/presenter.json",
  ];

  for (const path of candidates) {
    try {
      cached = JSON.parse(readFileSync(path, "utf8"));
      return cached;
    } catch {
      /* try the next location */
    }
  }
  return null;
}
