import { TableClient } from "@azure/data-tables";

/**
 * How many voice calls this site will pay for in a day.
 *
 * Text answers run on a free model and cost nothing, which is why the corner
 * button could be put on the landing page at all. Realtime audio is billed by
 * the second, and the student credit behind this site runs out — the standing
 * constraint on everything here is that the site keeps working after it does
 * (docs/GUIDE.md). So voice is the one thing on the site with a ceiling.
 *
 * This is the only part of the gate that is actually enforceable. The
 * per-session length cap lives in the browser, where a determined visitor
 * could ignore it; this one is counted here, before the secret is minted, and
 * nothing the client does can spend past it.
 *
 * It counts sessions, not seconds. A ceiling on length would need the provider
 * to tell us when a call ended, and it does not — audio goes straight between
 * the browser and the provider once the SDP has been exchanged, with the
 * broker out of the path. So the honest statement is: this bounds how many
 * calls are started, the browser bounds how long each one runs, and
 * PRESENTER_VOICE=false stops all of them.
 */

const TABLE = process.env.VOICE_BUDGET_TABLE ?? "voicebudget";
const PARTITION = "day";

/** Deliberately small. Raising it is a decision about money, not a tuning knob. */
export const DAILY_MAX = Number(process.env.VOICE_DAILY_MAX ?? 20);

/** UTC, so the day rolls over at a fixed moment rather than wherever the caller is. */
export function today(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

let client = null;

/** The table, created on first use. `createTable` is idempotent. */
async function table(context) {
  if (client) return client;

  const conn = process.env.VOICE_BUDGET_STORAGE ?? process.env.AzureWebJobsStorage;
  if (!conn) {
    context?.error("voice budget: no storage connection string configured");
    return null;
  }

  try {
    const local = conn.includes("127.0.0.1") || conn.includes("localhost");
    const next = TableClient.fromConnectionString(conn, TABLE, { allowInsecureConnection: local });
    await next.createTable();
    client = next;
    return client;
  } catch (err) {
    context?.error(`voice budget: could not reach the table: ${err?.message ?? err}`);
    return null;
  }
}

/**
 * Claim one call against today's budget.
 *
 * Claimed *before* the session is minted rather than counted after, so a call
 * that is started but never reported cannot be free. The ETag check is what
 * makes two visitors pressing the button at the same moment add up to two
 * rather than one.
 *
 * Returns `{ ok, used, limit, reason }`. When the table cannot be reached it
 * refuses: a budget that fails open is not a budget, and the failure here
 * costs a visitor a voice tour rather than costing Evan money he did not
 * agree to spend.
 *
 * @param {{error?: Function, warn?: Function, log?: Function}} context
 */
export async function claim(context, { limit = DAILY_MAX, now = new Date() } = {}) {
  const day = today(now);
  const store = await table(context);
  if (!store) {
    return { ok: false, used: 0, limit, reason: "unavailable" };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    let current = null;
    try {
      current = await store.getEntity(PARTITION, day);
    } catch (err) {
      if (err?.statusCode !== 404) {
        context?.error(`voice budget: read failed: ${err?.message ?? err}`);
        return { ok: false, used: 0, limit, reason: "unavailable" };
      }
    }

    const used = Number(current?.sessions ?? 0);
    if (used >= limit) {
      return { ok: false, used, limit, reason: "spent" };
    }

    try {
      if (current) {
        await store.updateEntity(
          { partitionKey: PARTITION, rowKey: day, sessions: used + 1 },
          "Merge",
          { etag: current.etag },
        );
      } else {
        await store.createEntity({ partitionKey: PARTITION, rowKey: day, sessions: 1 });
      }
      return { ok: true, used: used + 1, limit, reason: null };
    } catch (err) {
      // 412 (etag moved) and 409 (someone else created the row first) both
      // mean "read it again"; anything else is a real failure.
      if (err?.statusCode === 412 || err?.statusCode === 409) continue;
      context?.error(`voice budget: write failed: ${err?.message ?? err}`);
      return { ok: false, used, limit, reason: "unavailable" };
    }
  }

  context?.warn("voice budget: gave up after three contended writes");
  return { ok: false, used: limit, limit, reason: "unavailable" };
}

/**
 * Give a claim back, when the call it was for never happened.
 *
 * Without this, a provider outage is twice as expensive as it looks: twenty
 * visitors press the button, twenty mints fail, and voice is off for the rest
 * of the day on a budget that bought nothing. Best effort — a failure to
 * release is logged and dropped, because the caller is already handling a
 * failure and a lost claim costs one call, not a bill.
 */
export async function release(context, { now = new Date() } = {}) {
  const store = await table(context);
  if (!store) return;
  const day = today(now);
  try {
    const current = await store.getEntity(PARTITION, day);
    const used = Number(current.sessions ?? 0);
    if (used <= 0) return;
    await store.updateEntity(
      { partitionKey: PARTITION, rowKey: day, sessions: used - 1 },
      "Merge",
      { etag: current.etag },
    );
  } catch (err) {
    context?.warn(`voice budget: could not release a claim: ${err?.message ?? err}`);
  }
}

/** Today's count, for the status line. Never throws. */
export async function spent(context, { now = new Date() } = {}) {
  const store = await table(context);
  if (!store) return null;
  try {
    const row = await store.getEntity(PARTITION, today(now));
    return Number(row.sessions ?? 0);
  } catch (err) {
    if (err?.statusCode === 404) return 0;
    return null;
  }
}

/** Test seam: forget the cached client so a fake can be installed. */
export function reset(fake = null) {
  client = fake;
}
