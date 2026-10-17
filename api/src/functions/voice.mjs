import { app } from "@azure/functions";
import { MAX_BODY_BYTES, presenter, screen } from "../shared/guards.mjs";

/**
 * Voice presenter — the same guide as ask.mjs, spoken instead of typed.
 *
 * Switched off. Text was built first because it is what actually works in the
 * places this portfolio needs to work: locked-down networks and open-plan
 * offices. Realtime audio is also billed per second of speech, where text on a
 * free model is not. This endpoint is kept because it is verified and the
 * upgrade path is a transport swap, not a rewrite — turn on PRESENTER_VOICE
 * once there is a reason to pay for it.
 *
 * The browser never holds a credential. It POSTs its WebRTC SDP offer here and
 * this function makes both upstream calls on its behalf, so neither the API key
 * nor the ephemeral secret reaches the client:
 *
 *   1. POST /v1/realtime/client_secrets   real key      -> ephemeral value
 *   2. POST /v1/realtime/calls            ephemeral key -> SDP answer
 *
 * Everything expensive happens after this returns: audio streams directly
 * between browser and provider. This function sees one small request per
 * conversation.
 */

const OPENAI_CLIENT_SECRETS = "https://api.openai.com/v1/realtime/client_secrets";
const OPENAI_CALLS = "https://api.openai.com/v1/realtime/calls";

function sessionConfig(p) {
  return {
    type: "realtime",
    model: process.env.VOICE_MODEL ?? "gpt-realtime-2.1-mini",
    audio: { output: { voice: process.env.VOICE_NAME ?? "marin" } },
    instructions: p.instructions,
    tools: [
      {
        type: "function",
        name: "navigate_to_slide",
        description:
          "Move the visitor's view to a slide in the portfolio. Call this before " +
          "describing anything the slide contains.",
        parameters: {
          type: "object",
          properties: {
            slide_id: { type: "string", enum: p.slides.map((s) => s.id) },
            reason: { type: "string" },
          },
          required: ["slide_id"],
        },
      },
    ],
    tool_choice: "auto",
  };
}

app.http("voice", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "voice",
  handler: async (request, context) => {
    const { cors, response } = screen(request, context, {
      enabledFlag: "PRESENTER_VOICE",
      rateLimit: 4,
    });
    if (response) return response;

    const apiKey = process.env.OPENAI_API_KEY;
    const p = presenter();
    if (!apiKey || !p) {
      context.error(`not configured: key=${Boolean(apiKey)} presenter=${Boolean(p)}`);
      return { status: 500, headers: cors, body: "Voice presenter is not configured." };
    }

    const offer = await request.text();
    if (!offer || !offer.startsWith("v=")) {
      return { status: 400, headers: cors, body: "Expected an SDP offer." };
    }
    if (offer.length > MAX_BODY_BYTES) {
      return { status: 413, headers: cors, body: "SDP offer too large." };
    }

    try {
      const secretRes = await fetch(OPENAI_CLIENT_SECRETS, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionConfig(p) }),
      });
      if (!secretRes.ok) {
        context.error(`client_secrets ${secretRes.status}: ${(await secretRes.text()).slice(0, 500)}`);
        return { status: 502, headers: cors, body: "Could not start a voice session." };
      }

      const secret = await secretRes.json();
      const ephemeral = secret?.value ?? secret?.client_secret?.value;
      if (!ephemeral) {
        context.error(`no ephemeral key: ${JSON.stringify(secret).slice(0, 300)}`);
        return { status: 502, headers: cors, body: "Could not start a voice session." };
      }

      const callRes = await fetch(OPENAI_CALLS, {
        method: "POST",
        headers: { Authorization: `Bearer ${ephemeral}`, "Content-Type": "application/sdp" },
        body: offer,
      });
      if (!callRes.ok) {
        context.error(`calls ${callRes.status}: ${(await callRes.text()).slice(0, 500)}`);
        return { status: 502, headers: cors, body: "Could not negotiate the voice session." };
      }

      return {
        status: 200,
        headers: { ...cors, "Content-Type": "application/sdp", "Cache-Control": "no-store" },
        body: await callRes.text(),
      };
    } catch (err) {
      context.error("voice broker failed", err);
      return { status: 502, headers: cors, body: "Could not start a voice session." };
    }
  },
});
