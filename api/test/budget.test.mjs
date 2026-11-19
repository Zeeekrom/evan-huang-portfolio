/**
 * The daily ceiling on voice.
 *
 * This is the only part of the gate that money depends on. The length cap runs
 * in the browser and could be ignored; this is counted on the server before a
 * session is minted, so the cases worth testing are the refusals and the
 * arithmetic under contention — not the happy path.
 *
 * The table is faked. A test that needed Azurite running would be a test
 * nobody runs, and the thing under test here is the decision, not the SDK.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { DAILY_MAX, claim, release, reset, spent, today } from "../src/shared/budget.mjs";

const ctx = { log() {}, warn() {}, error() {} };

/** A table that behaves like the one entity this module ever touches. */
function fakeTable({ sessions = null, failWrites = 0, readError = null } = {}) {
  const state = { sessions, etag: "e0", writes: 0, reads: 0 };
  let remainingFailures = failWrites;

  return {
    state,
    async getEntity(partitionKey, rowKey) {
      state.reads += 1;
      if (readError) throw readError;
      if (state.sessions === null) throw Object.assign(new Error("not found"), { statusCode: 404 });
      return { partitionKey, rowKey, sessions: state.sessions, etag: state.etag };
    },
    async createEntity(entity) {
      if (remainingFailures-- > 0) throw Object.assign(new Error("exists"), { statusCode: 409 });
      state.writes += 1;
      state.sessions = entity.sessions;
      state.etag = `e${state.writes}`;
    },
    async updateEntity(entity, _mode, opts) {
      if (remainingFailures-- > 0) {
        /* Somebody else moved the row: bump it so the retry reads the new value. */
        state.sessions += 1;
        state.etag = `${state.etag}x`;
        throw Object.assign(new Error("etag"), { statusCode: 412 });
      }
      assert.equal(opts.etag, state.etag, "a write must carry the etag it read");
      state.writes += 1;
      state.sessions = entity.sessions;
      state.etag = `e${state.writes}`;
    },
  };
}

test("the day is a UTC date, so it turns over at one fixed moment", () => {
  assert.equal(today(new Date("2026-11-15T13:30:00Z")), "2026-11-15");
  assert.equal(today(new Date("2026-11-15T23:59:59Z")), "2026-11-15");
  assert.equal(today(new Date("2026-11-16T00:00:01Z")), "2026-11-16");
});

test("the first call of the day creates the row", async () => {
  const table = fakeTable();
  reset(table);
  const got = await claim(ctx, { limit: 5 });
  assert.deepEqual(got, { ok: true, used: 1, limit: 5, reason: null });
  assert.equal(table.state.sessions, 1);
});

test("calls accumulate up to the ceiling and then stop", async () => {
  const table = fakeTable({ sessions: 4 });
  reset(table);
  assert.equal((await claim(ctx, { limit: 5 })).ok, true, "the fifth is allowed");
  assert.equal(table.state.sessions, 5);

  const over = await claim(ctx, { limit: 5 });
  assert.equal(over.ok, false);
  assert.equal(over.reason, "spent");
  assert.equal(over.used, 5, "and reports where it stopped, so the page can say so");
  assert.equal(table.state.sessions, 5, "a refused call must not count");
});

test("two visitors pressing at once add up to two", async () => {
  /* One contended write, then the retry reads the value the other one wrote. */
  const table = fakeTable({ sessions: 1, failWrites: 1 });
  reset(table);
  const got = await claim(ctx, { limit: 10 });
  assert.equal(got.ok, true);
  assert.equal(got.used, 3, "1 from us losing the race, +1 from the winner, +1 for ours");
});

test("a budget that cannot be reached refuses", async () => {
  /*
   * Deliberately fails closed. A gate that opens when its storage is down is
   * not a gate, and the cost of being wrong is asymmetric: a visitor loses a
   * voice tour, or Evan loses money he did not agree to spend.
   */
  reset(fakeTable({ readError: Object.assign(new Error("boom"), { statusCode: 500 }) }));
  const got = await claim(ctx, { limit: 5 });
  assert.equal(got.ok, false);
  assert.equal(got.reason, "unavailable");
});

test("no storage configured refuses rather than waving calls through", async () => {
  reset(null);
  const conn = process.env.AzureWebJobsStorage;
  const own = process.env.VOICE_BUDGET_STORAGE;
  delete process.env.AzureWebJobsStorage;
  delete process.env.VOICE_BUDGET_STORAGE;
  try {
    const got = await claim(ctx, { limit: 5 });
    assert.equal(got.ok, false);
    assert.equal(got.reason, "unavailable");
  } finally {
    if (conn) process.env.AzureWebJobsStorage = conn;
    if (own) process.env.VOICE_BUDGET_STORAGE = own;
  }
});

test("a session that was never minted gives its claim back", async () => {
  /*
   * Otherwise a provider outage costs twice: twenty visitors press the button,
   * twenty mints fail, and voice is off for the day on a budget that bought
   * nothing.
   */
  const table = fakeTable({ sessions: 3 });
  reset(table);
  await release(ctx, {});
  assert.equal(table.state.sessions, 2);
});

test("releasing an empty day does not go negative", async () => {
  const table = fakeTable({ sessions: 0 });
  reset(table);
  await release(ctx, {});
  assert.equal(table.state.sessions, 0);
});

test("the ceiling is small by default, because raising it is a decision about money", () => {
  assert.ok(DAILY_MAX <= 50, `${DAILY_MAX} is not a ceiling anyone chose deliberately`);
});

test("spent reports the day's count, and nothing when it cannot tell", async () => {
  reset(fakeTable({ sessions: 7 }));
  assert.equal(await spent(ctx, {}), 7);

  reset(fakeTable());
  assert.equal(await spent(ctx, {}), 0, "no row yet means none spent");

  reset(fakeTable({ readError: Object.assign(new Error("boom"), { statusCode: 500 }) }));
  assert.equal(await spent(ctx, {}), null, "unknown is not zero");
});
