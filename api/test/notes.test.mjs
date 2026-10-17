/**
 * Exercises the notes endpoint against a local Azurite table service.
 *
 * This is the only endpoint on the site that accepts anonymous writes, so the
 * cases that matter here are the refusals, not the happy path.
 *
 *   npx --package azurite azurite-table --location <dir> --silent
 *   node --test api/test/notes.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";

const AZURITE =
  "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  "TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;";

process.env.NOTES_STORAGE = AZURITE;
process.env.NOTES_TABLE = `notestest${Date.now()}`;
process.env.NOTES_ENABLED = "true";
process.env.ALLOWED_ORIGINS = "https://evan.example";
process.env.NOTES_ADMIN_KEY = "let-me-in";
process.env.NOTES_IP_SALT = "pepper";

const { handler } = await import("../src/functions/notes.mjs");

const ctx = { log() {}, warn() {}, error() {} };

/** Minimal stand-in for the runtime's HttpRequest. */
function req({
  method = "POST",
  origin = "https://evan.example",
  body,
  query = {},
  ip = "1.2.3.4",
  headers = {},
} = {}) {
  const h = new Map(
    Object.entries({ origin, "x-forwarded-for": ip, ...headers }).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ]),
  );
  const q = new Map(Object.entries(query));
  return {
    method,
    headers: { get: (k) => h.get(k.toLowerCase()) ?? null },
    query: { get: (k) => (q.has(k) ? String(q.get(k)) : null) },
    json: async () => {
      if (body === undefined) throw new Error("no body");
      return body;
    },
  };
}

const readAll = () =>
  handler(req({ method: "GET", query: { key: "let-me-in", limit: 500 } }), ctx);

test("saves a well-formed note", async () => {
  const res = await handler(
    req({ body: { text: "Grüß dich, Evan", colour: "pink", slideId: "contact" } }),
    ctx,
  );
  assert.equal(res.status, 200);
  assert.deepEqual(res.jsonBody, { ok: true });
});

test("reflects the allowed origin so the browser accepts the reply", async () => {
  const res = await handler(req({ body: { text: "hi" }, ip: "1.2.3.5" }), ctx);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://evan.example");
});

test("refuses an origin that is not on the allowlist", async () => {
  const res = await handler(
    req({ origin: "https://evil.example", body: { text: "hi" }, ip: "9.9.9.1" }),
    ctx,
  );
  assert.equal(res.status, 403);
});

test("answers the preflight with headers attached", async () => {
  const res = await handler(req({ method: "OPTIONS" }), ctx);
  assert.equal(res.status, 200);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://evan.example");
});

test("refuses an empty note", async () => {
  const res = await handler(req({ body: { text: "   " }, ip: "1.2.3.6" }), ctx);
  assert.equal(res.status, 400);
});

test("refuses a body that is not JSON", async () => {
  const res = await handler(req({ ip: "1.2.3.7" }), ctx);
  assert.equal(res.status, 400);
});

test("truncates an overlong note rather than storing it whole", async () => {
  const res = await handler(req({ body: { text: "x".repeat(5000) }, ip: "1.2.3.8" }), ctx);
  assert.equal(res.status, 200);
  const read = await readAll();
  assert.equal(read.jsonBody.notes.find((n) => n.text.startsWith("xxxx")).text.length, 280);
});

test("falls back to a known colour when given one that is not offered", async () => {
  await handler(req({ body: { text: "forged colour", colour: "<script>" }, ip: "1.2.3.9" }), ctx);
  const read = await readAll();
  assert.equal(read.jsonBody.notes.find((n) => n.text === "forged colour").colour, "amber");
});

test("throttles one caller flooding the table", async () => {
  const flood = [];
  for (let i = 0; i < 9; i++) {
    flood.push(await handler(req({ body: { text: `spam ${i}` }, ip: "7.7.7.7" }), ctx));
  }
  assert.equal(flood[0].status, 200);
  assert.equal(flood.at(-1).status, 429);
});

test("hides the notes from a reader with no key", async () => {
  assert.equal((await handler(req({ method: "GET" }), ctx)).status, 404);
});

test("hides the notes from a reader with the wrong key", async () => {
  const res = await handler(req({ method: "GET", query: { key: "guess" } }), ctx);
  assert.equal(res.status, 404);
});

test("returns notes newest first, with the slide they came from", async () => {
  const res = await handler(
    req({ method: "GET", headers: { "x-admin-key": "let-me-in" } }),
    ctx,
  );
  assert.equal(res.status, 200);
  assert.ok(res.jsonBody.count > 0);

  const note = res.jsonBody.notes.find((n) => n.text === "Grüß dich, Evan");
  assert.equal(note.colour, "pink");
  assert.equal(note.slideId, "contact");
  assert.match(note.author, /^[0-9a-f]{16}$/); // salted hash, never the address

  const times = res.jsonBody.notes.map((n) => n.at);
  assert.deepEqual(times, [...times].sort().reverse());
});

test("stores no author at all when no salt is configured", async () => {
  const salt = process.env.NOTES_IP_SALT;
  delete process.env.NOTES_IP_SALT;
  await handler(req({ body: { text: "unsalted" }, ip: "4.4.4.4" }), ctx);
  process.env.NOTES_IP_SALT = salt;

  const read = await readAll();
  assert.equal(read.jsonBody.notes.find((n) => n.text === "unsalted").author, "");
});

/* ------------------------------------------- reading from a browser */

/**
 * The /admin page reads these notes from the deployed site's origin. A browser
 * will not hand a response to script without the CORS headers, and it will not
 * distinguish a rejected key from a dead network either — so the refusals need
 * them as much as the success does.
 *
 * Reading from a terminal sends no Origin at all and must keep working.
 */
test("a successful read from an allowed origin can be read by the browser", async () => {
  const res = await handler(
    req({ method: "GET", origin: "https://evan.example", query: { key: "let-me-in" } }),
    ctx,
  );
  assert.equal(res.status, 200);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://evan.example");
});

test("a rejected key is still readable, so the page can say why", async () => {
  const res = await handler(
    req({ method: "GET", origin: "https://evan.example", query: { key: "wrong" } }),
    ctx,
  );
  assert.equal(res.status, 404);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://evan.example");
});

test("a foreign origin gets no permission to read the response", async () => {
  const res = await handler(
    req({ method: "GET", origin: "https://evil.example", query: { key: "let-me-in" } }),
    ctx,
  );
  // The key still decides the status; CORS decides who may look at it.
  assert.equal(res.headers["Access-Control-Allow-Origin"], "");
});

test("reading from a terminal, with no Origin at all, still works", async () => {
  const res = await handler(req({ method: "GET", query: { key: "let-me-in" } }), ctx);
  assert.equal(res.status, 200);
  assert.ok(res.jsonBody.count >= 0);
});

test("the preflight advertises GET and the admin-key header", async () => {
  const res = await handler(req({ method: "OPTIONS" }), ctx);
  assert.match(res.headers["Access-Control-Allow-Methods"], /GET/);
  assert.match(res.headers["Access-Control-Allow-Headers"], /x-admin-key/);
});

test("hammering the read endpoint is throttled", async () => {
  const hits = [];
  for (let i = 0; i < 70; i++) {
    hits.push(await handler(req({ method: "GET", query: { key: "nope" }, ip: "8.8.8.8" }), ctx));
  }
  assert.equal(hits.at(-1).status, 429, "no throttle on reads");
});
