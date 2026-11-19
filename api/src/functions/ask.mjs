import { app } from "@azure/functions";
import { MAX_BODY_BYTES, presenter, screen } from "../shared/guards.mjs";
import { bestSlide } from "../shared/relevance.mjs";
import { extractNavigation } from "../shared/reply.mjs";
import { index, retrieve } from "../shared/retrieve.mjs";

/**
 * The BM25 index over the deck, built once per instance.
 *
 * Sixty slides is a few milliseconds and a few hundred kilobytes, so it is
 * built on first use and kept. Only a success is cached, for the same reason
 * the presenter is.
 */
let built = null;
function catalogue(p) {
  if (!built) built = index(p.slides);
  return built;
}

/**
 * Text presenter.
 *
 * The visitor types a question; the model answers and, when the answer is about
 * something in the portfolio, calls navigate_to_slide. The browser flies the
 * camera there and shows the reply.
 *
 * This is the same behaviour as the voice presenter minus the audio, and it is
 * deliberately the version built first. The thing that makes this site unusual
 * is an assistant that *moves the site while it answers*, not the timbre of a
 * voice — and text works in the places voice does not: locked-down corporate
 * and government networks, and open-plan offices where nobody is going to talk
 * to a web page.
 *
 * Runs on GLM-4.7-Flash, which is free and supports tool calling, so a visitor
 * asking questions costs nothing.
 */

const GLM_ENDPOINT =
  process.env.GLM_ENDPOINT ?? "https://open.bigmodel.cn/api/paas/v4/chat/completions";
/**
 * Tried in order. Both are free, and free capacity on this provider is shared:
 * it answers 429 with a "model overloaded" message under load, which is congestion rather
 * than a quota the caller can do anything about. Retrying, then stepping to the
 * second model, turns a dead end into a slower answer.
 */
const GLM_MODELS = (process.env.GLM_MODELS ?? "glm-4.7-flash,glm-4-flash-250414")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/** Backoff between attempts on the same model, in ms. */
const RETRY_DELAYS = [600, 1400];

/**
 * Total time allowed for one question, upstream calls and backoff included.
 *
 * Without this the retry policy could outlast the browser: four tool rounds
 * against two models with three attempts each is twenty-four upstream calls,
 * which ran for minutes and returned nothing at all. A visitor will wait
 * seconds, so the request is bounded and answers with whatever it has.
 */
const DEADLINE_MS = 24_000;

/** Individual calls get their own ceiling, so one stall cannot eat the budget. */
const CALL_TIMEOUT_MS = 12_000;

/** Enough for a real conversation, short enough that nobody can replay a novel. */
const MAX_TURNS = 16;
const MAX_MESSAGE_CHARS = 2000;

/**
 * GLM-4.7 defaults to forced thinking, and reasoning is charged against the
 * same output budget as the answer. A guide that replies in two or three
 * sentences does not need it, and with it enabled the model spent its budget
 * reasoning and returned an empty `content` with finish_reason "length".
 */
const THINKING = { type: "disabled" };

/** The docs advise against anything under 1024; the default is lower. */
const MAX_TOKENS = 1024;

/**
 * Whether to offer the navigation tool at all.
 *
 * Off by default, which looks backwards until you count the round trips. A tool
 * call costs a whole extra request — five to twenty seconds on this free tier —
 * to decide something relevance.mjs works out locally in microseconds from the
 * answer itself. The visitor cannot tell the difference; they see the view move
 * to what they asked about either way.
 *
 * Worth turning on once the model answering is fast enough that a second call
 * is not most of the wait.
 */
const USE_TOOLS = process.env.PRESENTER_TOOLS === "true";

/** Only meaningful when tools are offered. Two calls is the ceiling. */
const MAX_TOOL_ROUNDS = 1;

/* -------------------------------------------------------------------- helpers */

function toolDefinition(shown) {
  return {
    type: "function",
    function: {
      name: "navigate_to_slide",
      description:
        "Move the visitor's view to a slide in the portfolio. Call this before " +
        "describing anything the slide contains, so the visitor is looking at " +
        "what you are talking about.",
      parameters: {
        type: "object",
        properties: {
          slide_id: {
            type: "string",
            description: "The slide to move to.",
            enum: shown.map((s) => s.id),
          },
          reason: {
            type: "string",
            description: "One short phrase on why this slide answers the question.",
          },
        },
        required: ["slide_id"],
      },
    },
  };
}

/** Keep only what we recognise, and only as much as we are willing to relay. */
function sanitise(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

/** Diagnostic only: log streaming is unavailable on Linux Consumption. */
let lastUpstreamError = null;
let lastModelUsed = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Congestion and transport hiccups are worth another go; a bad request is not. */
const isTransient = (status) => status === 429 || status >= 500;

async function attempt(apiKey, model, messages, tools, context) {
  let res;
  try {
    res = await fetch(GLM_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        ...(tools ? { tools, tool_choice: "auto" } : {}),
        thinking: THINKING,
        max_tokens: MAX_TOKENS,
        stream: false,
      }),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (err) {
    // A stalled connection looks the same as congestion from here, and both
    // are worth one more go if there is time left.
    lastUpstreamError = `GLM ${model} did not respond: ${err?.name ?? "error"}`;
    context.error(lastUpstreamError);
    return { message: null, transient: true };
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    lastUpstreamError = `GLM ${res.status} on ${model}: ${detail}`;
    context.error(lastUpstreamError);
    return { message: null, transient: isTransient(res.status) };
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  // finish_reason separates "nothing to say" from "cut off", which look
  // identical from an empty content field.
  if (choice?.finish_reason && choice.finish_reason !== "stop") {
    context.warn(`GLM finish_reason=${choice.finish_reason} on ${model}`);
  }
  lastModelUsed = model;
  return { message: choice?.message ?? null, transient: false };
}

async function callModel(apiKey, messages, tools, context, deadline) {
  for (const model of GLM_MODELS) {
    for (let i = 0; i <= RETRY_DELAYS.length; i++) {
      if (Date.now() >= deadline) {
        context.warn("deadline reached before a model answered");
        return null;
      }
      const { message, transient } = await attempt(apiKey, model, messages, tools, context);
      if (message) return message;
      if (!transient) break; // a real rejection will not fix itself
      if (i < RETRY_DELAYS.length && Date.now() + RETRY_DELAYS[i] < deadline) {
        await sleep(RETRY_DELAYS[i]);
      }
    }
  }
  return null;
}

/* -------------------------------------------------------------------- handler */

app.http("ask", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "ask",
  handler: async (request, context) => {
    const { cors, response } = screen(request, context, {
      enabledFlag: "PRESENTER_ENABLED",
      rateLimit: 12,
    });
    if (response) return response;

    const apiKey = process.env.GLM_API_KEY;
    const p = presenter();
    if (!apiKey || !p) {
      context.error(`not configured: key=${Boolean(apiKey)} presenter=${Boolean(p)}`);
      return { status: 500, headers: cors, body: "Presenter is not configured." };
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return { status: 413, headers: cors, body: "Request too large." };
    }

    let payload;
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      return { status: 400, headers: cors, body: "Expected JSON." };
    }

    const history = sanitise(payload.messages);
    if (history.length === 0) {
      return { status: 400, headers: cors, body: "No question to answer." };
    }

    /*
     * The persona is shared with the voice endpoint, which does offer the
     * navigation tool, so it tells the model to call navigate_to_slide before
     * it speaks. Here the tool is usually not offered at all — and a model
     * asked to call something it was never given performs the call in prose
     * instead: "Navigate to slide 15, \"Rivulet LocalOps\"." was once an
     * entire answer. shared/reply.mjs cleans that up, but the cheaper fix is
     * not to ask for it. The page moves itself from the slide this endpoint
     * derives.
     */
    const NO_TOOL = `
IN THIS CONVERSATION
- You have no navigation tool and cannot move the view. Do not write
  navigate_to_slide, "Navigate to slide", a slide id or a slide number in your
  reply, and do not announce where you are taking the visitor. The page follows
  your answer on its own. Just answer the question.`;

    /*
     * Retrieve, then answer.
     *
     * The guide used to be handed all sixty slides on every question. That
     * worked, and it paid for the whole deck to answer one thing, and — the
     * part that actually mattered — it left the source of an answer a guess,
     * because navigation was derived from the reply afterwards. The line under
     * an answer could name a slide the model had never read.
     *
     * Giving it only the slides the question is about makes the source a fact
     * about the request instead of an inference about the response. The model
     * can only point at something it was shown.
     */
    const asked = [...history].reverse().filter((m) => m.role === "user");
    const built_ = catalogue(p);
    let found = retrieve(asked[0]?.content ?? "", built_, {
      spine: p.spine ?? [],
      always: ["contact"],
    });
    /*
     * A follow-up — "and what about there?", "tell me more" — carries no
     * subject of its own, so it ranks nothing and would fall back to the
     * spine mid-conversation. The turn before it is what the visitor is still
     * talking about.
     */
    if (!found.matched && asked[1]) {
      found = retrieve(`${asked[1].content} ${asked[0].content}`, built_, {
        spine: p.spine ?? [],
        always: ["contact"],
      });
    }

    /** In rank order, so the most relevant slide is the one the model reads first. */
    const shown = found.ids
      .map((id) => p.slides.find((s) => s.id === id))
      .filter(Boolean);

    const lines = shown.map((s) => `[${s.id}] ${s.title}\n${s.body}`).join("\n\n");
    /* p.persona is absent from a catalogue generated before retrieval existed. */
    const base = p.persona
      ? `${p.persona}\n\nTHE SLIDES YOU HAVE FOR THIS QUESTION — answer only from these\n${lines}`
      : p.instructions;

    const persona = USE_TOOLS ? base : base + NO_TOOL;
    context.log(`retrieved ${shown.length} (${found.matched ? found.top : "spine"}) ${persona.length} chars`);

    const messages = [{ role: "system", content: persona }, ...history];
    const tools = USE_TOOLS ? [toolDefinition(shown)] : undefined;

    try {
      const convo = [...messages];
      const deadline = Date.now() + DEADLINE_MS;
      let navigate = null;
      let reply = "";

      /*
       * Close the tool loop here rather than making the browser do it. The
       * client would otherwise need a round trip per tool call before it had
       * anything to display, and the visitor would watch the camera move in
       * silence.
       */
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
        // Another tool round is only worth starting if there is time to finish
        // it; otherwise navigation is already known and the answer can stand.
        if (round > 0 && Date.now() >= deadline) {
          context.warn("deadline reached mid tool loop");
          break;
        }
        const message = await callModel(apiKey, convo, tools, context, deadline);
        if (!message) {
          if (navigate) break; // partial result beats no result

          return {
            status: 502,
            headers: cors,
            body: process.env.PRESENTER_DEBUG === "true"
              ? `The presenter could not answer just now. [model=${lastModelUsed ?? "none"} ${lastUpstreamError ?? "no detail"}]`
              : "The presenter could not answer just now.",
          };
        }

        const call = message.tool_calls?.[0];
        if (!call) {
          /*
           * Not every model honours the tool protocol — this one usually
           * prints the call as prose and answers underneath. Take the
           * destination out of the machinery, then take the machinery out of
           * the answer. See shared/reply.mjs for the shapes it comes in.
           */
          const spoken = extractNavigation((message.content ?? "").trim(), shown);
          if (spoken.slideId && !navigate) navigate = { slideId: spoken.slideId, reason: null };
          reply = spoken.reply;
          break;
        }

        let args = {};
        try {
          args = JSON.parse(call.function?.arguments ?? "{}");
        } catch {
          /* a malformed tool call is treated as no navigation */
        }
        const slideId = typeof args.slide_id === "string" ? args.slide_id : null;
        const known = Boolean(slideId) && shown.some((sl) => sl.id === slideId);

        // Keep the first destination. Later hops in the same answer would leave
        // the visitor somewhere the words no longer describe.
        if (known && !navigate) navigate = { slideId, reason: args.reason ?? null };

        // Rebuild the assistant turn from only the fields the API accepts on
        // input. Echoing the provider's own message object back can carry
        // response-only fields that it then refuses.
        convo.push({ role: "assistant", content: message.content ?? null, tool_calls: message.tool_calls }, {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(
            known
              ? { success: true, navigated_to: slideId }
              : { success: false, error: "Unknown slide. Answer without navigating." },
          ),
        });
      }

      /*
       * The model is asked to navigate but this provider only supports
       * tool_choice "auto", and with slide bodies in the prompt it can answer
       * without reaching for the tool. Derive the destination rather than
       * leaving the visitor reading about one thing while looking at another.
       */
      if (!navigate && reply) {
        /*
         * Among the slides it was given, which is the answer about? Six
         * candidates instead of sixty, so this is a much easier question than
         * it used to be — and when it still cannot be answered, the slide the
         * question retrieved is an honest fallback, because that is the one
         * the answer was written from.
         */
        const derived = bestSlide(reply, shown) ?? (found.matched ? found.top : null);
        if (derived) {
          navigate = { slideId: derived, reason: null };
          context.log(`derived navigation -> ${derived}`);
        }
      }

      if (!reply) {
        context.warn("model returned no text after the tool loop");
        reply = navigate
          ? "Here's the part of the portfolio that covers that."
          : "I don't have anything on that — email Evan and he'll answer directly.";
      }

      /*
       * Carry the slide's title back with its id.
       *
       * The page shows it as the source under the answer — the one thing that
       * makes a reply checkable rather than merely believable. It is resolved
       * here because the broker already holds the catalogue; doing it in the
       * browser would mean shipping all sixty slides to the homepage to look
       * up one string.
       */
      if (navigate) {
        navigate.title = p.slides.find((sl) => sl.id === navigate.slideId)?.title ?? null;
      }

      return {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
        // Only ever name a slide that exists; a hallucinated id would leave the
        // camera somewhere the answer does not describe.
        jsonBody: { reply, navigate },
      };
    } catch (err) {
      context.error("presenter failed", err);
      return { status: 502, headers: cors, body: "The presenter could not answer just now." };
    }
  },
});
