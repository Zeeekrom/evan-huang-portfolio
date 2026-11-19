import { app } from "@azure/functions";
import { randomUUID, createHash } from "node:crypto";
import { TableClient } from "@azure/data-tables";
import { clientIp, corsHeaders, screen, throttled } from "../shared/guards.mjs";

/**
 * Sticky notes.
 *
 * A visitor writes a note on the canvas and it lands here. This is the only
 * endpoint on the site that accepts writes from anonymous callers, so it is
 * also the only real abuse surface — every limit below exists for that reason,
 * not for load.
 *
 * Stored in Azure Table Storage on the same account that already serves the
 * static site: no new resource, and a few thousand notes cost cents.
 *
 * There is no admin UI yet, by decision. GET with the admin key returns the
 * notes as JSON, which is enough to read them from a terminal; a panel with
 * proper CRUD can come later without changing what is stored.
 */

const TABLE = process.env.NOTES_TABLE ?? "stickynotes";

/** Long enough for a real message, short enough that nobody stores a payload. */
const MAX_TEXT = 280;
/** Must match the palette the canvas offers; anything else is a forged client. */
const COLOURS = new Set(["amber", "pink", "blue", "green", "purple"]);
/** Newest first: Table Storage sorts rowKey ascending, so the key counts down. */
const END_OF_TIME = 9_999_999_999_999;

let client = null;
let clientFailed = false;

/**
 * Created once per instance and reused. `createTable` is idempotent, so this
 * also means the table does not have to exist before the first note arrives.
 */
async function table(context) {
  if (client) return client;
  if (clientFailed) return null;

  const conn = process.env.NOTES_STORAGE ?? process.env.AzureWebJobsStorage;
  if (!conn) {
    context.error("notes: no NOTES_STORAGE connection string configured");
    clientFailed = true;
    return null;
  }

  // Plain http is allowed only against loopback, which is Azurite during
  // local testing. A real endpoint can never match this.
  const local = /\/\/(127\.0\.0\.1|localhost)[:/]/.test(conn);

  try {
    const next = TableClient.fromConnectionString(conn, TABLE, {
      allowInsecureConnection: local,
    });
    await next.createTable();
    client = next;
    return client;
  } catch (err) {
    // A creation race between two cold instances is fine — the table exists,
    // which is all that matters.
    if (err?.statusCode === 409) {
      client = TableClient.fromConnectionString(conn, TABLE, { allowInsecureConnection: local });
      return client;
    }
    context.error(`notes: cannot reach table storage: ${err?.message ?? err}`);
    clientFailed = true;
    return null;
  }
}

/**
 * Salted hash of the caller's address, for spotting one person flooding the
 * table. Stored only when a salt is configured — an unsalted IP hash is
 * trivially reversible, so no salt means no record.
 */
function author(request) {
  const salt = process.env.NOTES_IP_SALT;
  if (!salt) return "";
  return createHash("sha256").update(salt).update(clientIp(request)).digest("hex").slice(0, 16);
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/* ------------------------------------------------------------------- write */

async function post(request, context, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { status: 400, headers: cors, body: "Expected JSON." };
  }

  const text = clean(body?.text, MAX_TEXT);
  if (!text) return { status: 400, headers: cors, body: "A note needs some text." };

  const colour = COLOURS.has(body?.colour) ? body.colour : "amber";
  const slideId = clean(body?.slideId, 64);

  const store = await table(context);
  if (!store) return { status: 503, headers: cors, body: "Notes are not available right now." };

  const now = new Date();
  try {
    await store.createEntity({
      // One partition per month keeps listing cheap without ever needing a scan
      // across the whole table.
      partitionKey: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
      rowKey: `${END_OF_TIME - now.getTime()}-${randomUUID().slice(0, 8)}`,
      text,
      colour,
      slideId,
      at: now.toISOString(),
      author: author(request),
    });
  } catch (err) {
    context.error(`notes: write failed: ${err?.message ?? err}`);
    return { status: 502, headers: cors, body: "Could not save the note." };
  }

  context.log(`note saved (${text.length} chars, ${colour}, from ${slideId || "unknown slide"})`);
  return {
    status: 200,
    headers: { ...cors, "content-type": "application/json" },
    jsonBody: { ok: true },
  };
}

/* -------------------------------------------------------------------- read */

async function get(request, context) {
  /*
   * Reading is done two ways: from a terminal, which sends no Origin, and from
   * the /admin page in a browser, which does and will refuse to hand the
   * response to script without these headers. Both paths are authorised by the
   * key; the headers only decide whether the browser is allowed to read what
   * came back.
   *
   * They go on the refusals too. Without them a browser cannot tell a wrong
   * key from a dead network, and the page would have nothing useful to say.
   */
  const origin = request.headers.get("origin") ?? "";
  const cors = origin ? corsHeaders(origin) : {};

  // The key is 48 hex characters, so this is not about guessing it — it is
  // about nobody running up a bill hammering the endpoint.
  if (throttled(`read:${clientIp(request)}`, 60)) {
    return { status: 429, headers: cors, body: "Too many requests." };
  }

  const key = process.env.NOTES_ADMIN_KEY;
  const given = request.headers.get("x-admin-key") ?? request.query.get("key") ?? "";
  // No key configured means reading is off, not open. A missing setting must
  // never be the thing that publishes every note.
  if (!key || given !== key) {
    return { status: 404, headers: cors, body: "Not found." };
  }

  const store = await table(context);
  if (!store) {
    return { status: 503, headers: cors, body: "Notes are not available right now." };
  }

  const limit = Math.min(Number(request.query.get("limit")) || 100, 500);
  const notes = [];
  try {
    for await (const e of store.listEntities()) {
      notes.push({
        at: e.at,
        text: e.text,
        colour: e.colour,
        slideId: e.slideId,
        author: e.author,
        id: `${e.partitionKey}/${e.rowKey}`,
      });
      if (notes.length >= limit) break;
    }
  } catch (err) {
    context.error(`notes: read failed: ${err?.message ?? err}`);
    return { status: 502, headers: cors, body: "Could not read the notes." };
  }

  // rowKey counts down, so partitions come back newest-first internally; sort
  // across partitions to make that true overall.
  notes.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return {
    status: 200,
    headers: { ...cors, "content-type": "application/json" },
    jsonBody: { count: notes.length, notes },
  };
}

/* ---------------------------------------------------------------- endpoint */

/** Exported so it can be exercised directly, without the Functions host. */
export async function handler(request, context) {
  // Reading is for Evan, from a terminal, with no Origin header — so it is
  // authorised by key and must not go through the browser origin allowlist.
  if (request.method === "GET") return get(request, context);

  const { cors, response } = screen(request, context, {
    enabledFlag: "NOTES_ENABLED",
    // Tighter than the presenter: nobody legitimately leaves six notes a
    // minute, and unlike a question a note costs storage forever.
    rateLimit: 6,
  });
  if (response) return response;

  return post(request, context, cors);
}

app.http("notes", {
  methods: ["POST", "GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "notes",
  handler,
});
