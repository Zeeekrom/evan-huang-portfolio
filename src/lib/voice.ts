/**
 * WebRTC client for the voice presenter.
 *
 * The browser holds no credential. It sends its SDP offer to our broker, which
 * mints a short-lived secret with the real key and exchanges the SDP on its
 * behalf; only the answer comes back. After that, audio streams directly
 * between here and the provider — the broker is not in the audio path.
 *
 * The session's persona and tools are set server-side when the secret is
 * minted, so nothing about them is visible in this bundle.
 */

import { PRESENTER_API } from "./presenter";
import { TourRunner, type TourStop } from "./tour";
import { AudioLevelMonitor } from "./audio-level";
import { whenReady } from "./settle";
import { TurnTracker, responseIdOf } from "./turn";

/**
 * How long the guide must be silent before the tour moves on.
 *
 * A fallback now, and only reached when the provider is not sending
 * `output_audio_buffer.*` — see handleEvent. Loudness cannot tell the pause
 * between two sentences from the end of a turn, and at 700ms it regularly
 * mistook one for the other: the tour advanced mid-sentence, so the camera was
 * on the next slide while the visitor was still hearing the last one. Long
 * enough here to clear any pause a speaker actually leaves.
 */
const QUIET_MS = 1500;

/**
 * Give up waiting for silence after this. Only reachable if the level monitor
 * is stuck reporting sound; better a tour that continues than one that hangs.
 */
const QUIET_DEADLINE_MS = 45_000;

/**
 * How long to hold the tour after a voice detection before deciding it was
 * nothing. Long enough for a transcript to come back, short enough that a
 * false alarm is barely noticeable.
 */
const FALSE_ALARM_MS = 3500;

export type VoiceStatus = "idle" | "connecting" | "live" | "ended" | "error";

export interface VoiceHandlers {
  onStatus(status: VoiceStatus, detail?: string): void;
  /** The model asked to move the view. */
  onNavigate(slideId: string, reason: string | null): void;
  /** True while the guide is speaking, for the level meter. */
  onSpeaking(speaking: boolean): void;
  /**
   * Something went wrong but the call is still up.
   *
   * Kept apart from onStatus("error") on purpose. The provider emits error
   * events for things that do not end anything — a cancel with no response in
   * flight, an unrecognised field — and routing those through the status would
   * drop the UI back to "Start AI Presenter" in the middle of a working
   * conversation.
   */
  onIssue(message: string): void;
}

/** Named by the provider; the channel only exists under this exact name. */
const EVENT_CHANNEL = "oai-events";

/**
 * A running account of what the tour did, in the browser console.
 *
 * This is not debug scaffolding to be removed. Every fault in the tour so far
 * has been invisible from the outside — it speaks once and stops, and the only
 * evidence available afterwards was a recording of the room. Three separate
 * causes produced that same symptom, and each cost a round of guessing. A line
 * per decision turns "it stopped" into "it stopped because", which is the
 * difference between a diagnosis and another hypothesis.
 */
const log = (...args: unknown[]) => console.info("[tour]", ...args);

/**
 * An error whose message is written for the visitor.
 *
 * Everything else that can be thrown here — a TypeError from fetch, a
 * DOMException from the microphone — carries wording aimed at whoever wrote
 * the code. "Failed to fetch" on screen tells a visitor nothing at all, so
 * only messages tagged this way are shown as they are.
 */
class PresenterError extends Error {}

/** Turn whatever was thrown into something worth reading. */
function explain(err: unknown): string {
  if (err instanceof PresenterError) return err.message;

  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") return "Microphone access is needed for the voice guide.";
    if (err.name === "NotFoundError") return "No microphone was found on this device.";
    return "This browser would not start the voice guide.";
  }

  // fetch rejects with a TypeError for DNS failures, offline, blocked
  // requests, and CORS — the browser deliberately does not say which.
  if (err instanceof TypeError) return "Could not reach the voice guide. Check your connection.";

  return "Could not start the voice guide.";
}

export class VoiceSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private tour_: TourRunner;
  private level: AudioLevelMonitor | null = null;
  private cancelSettle_: (() => void) | null = null;
  private falseAlarmTimer: number | null = null;
  private audio: HTMLAudioElement | null = null;
  private closed = false;

  private liveAnnounced = false;

  /**
   * Whether `output_audio_buffer.*` is arriving on this call.
   *
   * These are WebRTC and SIP only, which is why they are absent from the
   * general event reference — and why the first version of this measured
   * loudness instead of asking. If they ever stop arriving the silence
   * fallback still ends each turn, so a change upstream degrades the timing
   * rather than stalling the tour.
   */
  private bufferEvents = false;

  /**
   * The two halves of "the guide has finished this stop", matched by response
   * id. See lib/turn.ts for why they are matched rather than counted.
   */
  private readonly turns = new TurnTracker();

  /**
   * True between the guide's audio buffer opening and draining.
   *
   * Used to tell the guide's own voice, arriving back through the speakers,
   * from the visitor actually speaking — see the transcription handler.
   */
  private guideSpeaking = false;

  /** What the visitor asked for, as opposed to what the guide is doing. */
  private micWanted = true;

  /**
   * Whether the sound now being transcribed began while the guide was talking.
   *
   * Recorded when the provider first hears it, not when the words come back.
   * Transcription only completes once the speaker has stopped, which is often
   * after the guide has too — so asking "is the guide speaking?" at that point
   * answers about the wrong moment.
   */
  private heardOverGuide = false;

  /**
   * @param tour The running order. Driven from here one stop at a time rather
   *   than handed over as a single instruction, because a model told to give a
   *   tour covers the first stop and then asks what you would like to see. See
   *   lib/tour.ts.
   */
  constructor(
    private readonly h: VoiceHandlers,
    tour: TourStop[],
  ) {
    this.tour_ = new TourRunner(tour, {
      navigate: (slideId) => {
        log(`stop ${this.tour_.position}/${tour.length}: ${slideId}`);
        this.h.onNavigate(slideId, "tour");
      },
      speak: (instructions) =>
        this.send({ type: "response.create", response: { instructions } }),
    });
  }

  get active(): boolean {
    return !this.closed && this.pc !== null;
  }

  async start(): Promise<void> {
    this.h.onStatus("connecting");
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      this.pc = pc;

      // Remote audio needs an element to play through; it never reaches the DOM.
      const audio = document.createElement("audio");
      audio.autoplay = true;
      this.audio = audio;
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        audio.srcObject = stream;
        // Level comes from the track the visitor is actually hearing. The
        // provider's audio-delta events describe generation instead, which
        // runs several times faster than playback.
        this.level?.stop();
        this.level = new AudioLevelMonitor(stream, (speaking) => {
          if (!this.closed) this.h.onSpeaking(speaking);
        });
      };

      /*
       * Three-way processing on. Without echo cancellation the guide hears
       * itself through the visitor's speakers and interrupts its own sentence.
       */
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      for (const track of this.mic.getTracks()) pc.addTrack(track, this.mic);

      const dc = pc.createDataChannel(EVENT_CHANNEL);
      this.dc = dc;
      dc.onmessage = (e) => this.handleEvent(e.data);
      dc.onopen = () => {
        this.markLive();
        // Start talking immediately. Someone who has just granted microphone
        // access needs to hear that something is listening, and silence while
        // they work out what to ask is the worst first second this can have.
        this.tour_.begin();
      };

      pc.onconnectionstatechange = () => {
        if (this.closed) return;
        // A second way to reach "live". The data channel's open event is the
        // usual signal, but if it is missed the call still works and the UI
        // would sit on "Start AI Presenter" through a working conversation.
        if (pc.connectionState === "connected") this.markLive();
        // "disconnected" is routinely transient — ICE recovers from it, and
        // tearing the call down on it kills calls that were about to be fine.
        // "failed" is the terminal one.
        if (pc.connectionState === "failed") {
          this.h.onStatus("error", "The connection dropped.");
          this.stop();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch(`${PRESENTER_API}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp ?? "",
      });

      if (!res.ok) {
        throw new PresenterError(
          res.status === 503
            ? "The voice guide is switched off right now."
            : res.status === 429
              ? "Too many sessions just now — try again shortly."
              : res.status === 403
                ? "This page is not allowed to start the voice guide."
                : "Could not start the voice guide.",
        );
      }

      await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
    } catch (err) {
      // Logged in full because the visitor-facing text is deliberately vague
      // about which of several causes it was.
      console.error("[voice] could not start:", err);
      this.h.onStatus("error", explain(err));
      this.stop();
    }
  }

  stop(): void {
    if (this.closed) return;
    this.closed = true;
    try {
      this.dc?.close();
    } catch {
      /* already gone */
    }
    this.cancelSettle();
    this.clearFalseAlarm();
    this.tour_.abandon();
    this.level?.stop();
    this.level = null;
    this.mic?.getTracks().forEach((t) => t.stop());
    if (this.audio) this.audio.srcObject = null;
    try {
      this.pc?.close();
    } catch {
      /* already gone */
    }
    this.pc = null;
    this.dc = null;
    this.mic = null;
    this.audio = null;
    this.h.onSpeaking(false);
    this.h.onStatus("ended");
  }

  setMuted(muted: boolean): void {
    this.micWanted = !muted;
    this.applyMic();
  }

  /**
   * The microphone is closed while the guide is speaking.
   *
   * Echo cancellation is not enough. Anyone listening through speakers feeds
   * the guide's own voice back in, the provider's turn detection hears a
   * visitor, and it does what it is supposed to do about that: it cuts the
   * guide off mid-sentence and answers. What the visitor gets is the tour
   * breaking off to say "OK, alright, let's talk about…" to nobody.
   *
   * No amount of bookkeeping on this side fixes that, because the decision is
   * made on the other one — before any event reaches us. The only reliable
   * answer is for there to be nothing on the wire to mistake.
   *
   * The cost is that talking over the guide no longer interrupts it. The
   * microphone button does, which is what it has always been for, and it is
   * unambiguous in a way that voice detection has never been here.
   *
   * Only ever engaged when the provider is sending the buffer events that say
   * when the guide starts and stops — otherwise there would be no reliable
   * signal to reopen on, and a missed one would leave the microphone shut for
   * the rest of the call.
   */
  private applyMic(): void {
    const shut = this.bufferEvents && this.guideSpeaking;
    const on = this.micWanted && !shut;
    let changed = false;
    this.mic?.getAudioTracks().forEach((t) => {
      if (t.enabled !== on) changed = true;
      t.enabled = on;
    });
    if (changed) log(on ? "microphone open" : "microphone closed while the guide talks");
  }

  private send(payload: unknown): void {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(payload));
  }

  /** Both halves of a turn have arrived: the guide has finished this stop. */
  private endOfTurn(): void {
    this.cancelSettle();
    if (this.closed) return;
    const was = this.tour_.position;
    this.tour_.onTurnComplete();
    const now = this.tour_.position;
    if (now === was) log(`stop ${was} finished; the tour is over`);
    else log(`stop ${was} finished -> stop ${now}`);
  }

  /**
   * Advance the tour once the room has been quiet for a while.
   *
   * The fallback path. `output_audio_buffer.stopped` says outright that
   * playback is over and is what normally advances the tour; this guesses from
   * loudness, and guesses wrong whenever a speaker pauses for longer than
   * QUIET_MS. It runs only when those events are not arriving at all.
   */
  private settleThenAdvance(): void {
    if (this.cancelSettle_) return; // already waiting on this turn
    this.cancelSettle_ = whenReady(
      () => this.closed || (this.level?.quietFor(QUIET_MS) ?? true),
      () => {
        this.cancelSettle_ = null;
        if (!this.closed) this.tour_.onTurnComplete();
      },
      { deadlineMs: QUIET_DEADLINE_MS },
    );
  }

  /**
   * Resume the tour if a voice detection produces no transcript.
   *
   * Not every detection is followed by an event — a very short burst can be
   * dropped silently — so without this the tour would stay held forever on the
   * strength of one cough.
   */
  private armFalseAlarm(): void {
    this.clearFalseAlarm();
    this.falseAlarmTimer = window.setTimeout(() => {
      this.falseAlarmTimer = null;
      if (!this.closed) this.tour_.resume();
    }, FALSE_ALARM_MS);
  }

  private clearFalseAlarm(): void {
    if (this.falseAlarmTimer !== null) {
      clearTimeout(this.falseAlarmTimer);
      this.falseAlarmTimer = null;
    }
  }

  private cancelSettle(): void {
    this.cancelSettle_?.();
    this.cancelSettle_ = null;
  }

  private markLive(): void {
    if (this.liveAnnounced || this.closed) return;
    this.liveAnnounced = true;
    this.h.onStatus("live");
  }

  /**
   * Cut the guide off mid-sentence.
   *
   * Server-side turn detection already yields to speech, but the tour is one
   * long response and a visitor who reaches for the microphone button has
   * decided they are done listening. Without this they would have to wait out
   * the sentence in flight.
   */
  interrupt(): void {
    this.cancelSettle();
    this.clearFalseAlarm();
    this.guideSpeaking = false;
    this.heardOverGuide = false;
    this.applyMic();
    // Pressing the microphone is unambiguous in a way voice detection is not.
    log("the visitor took the microphone; ending the tour");
    this.tour_.abandon();
    this.send({ type: "response.cancel" });
    this.h.onSpeaking(false);
  }

  /* --------------------------------------------------------------- events */

  private handleEvent(raw: unknown): void {
    if (typeof raw !== "string") return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    switch (event.type) {
      // Deltas mean audio is being *generated*. Playback is what the level
      // monitor reports, so these no longer drive the meter.
      case "response.output_audio.delta":
      case "response.audio.delta":
      case "response.audio.done":
      case "response.output_audio.done":
        break;

      // The guide's audio has started reaching the visitor.
      case "output_audio_buffer.started":
        this.bufferEvents = true;
        this.guideSpeaking = true;
        this.applyMic();
        this.cancelSettle();
        break;

      // The buffer has drained: the visitor has now heard everything.
      case "output_audio_buffer.stopped":
        this.bufferEvents = true;
        this.guideSpeaking = false;
        this.applyMic();
        this.cancelSettle();
        if (this.turns.played(responseIdOf(event))) this.endOfTurn();
        break;

      /*
       * Cleared is the buffer being thrown away — an interruption, or a
       * cancelled response. Not an ending, so the turn is closed rather than
       * completed: its `response.done` must not advance the tour later.
       */
      case "output_audio_buffer.cleared":
        this.bufferEvents = true;
        this.guideSpeaking = false;
        this.applyMic();
        this.cancelSettle();
        this.turns.discarded(responseIdOf(event));
        log("the guide was cut off mid-sentence");
        break;

      /*
       * Generation finished, which is not the guide having stopped talking: a
       * fifteen-second answer is composed in about two. One half of the signal
       * when the buffer events are arriving, and the trigger for the silence
       * fallback when they are not.
       */
      case "response.done": {
        // Always recorded, even while the fallback is the active path. The
        // first turn of a call has not yet proved the buffer events exist, and
        // an earlier version therefore skipped the tracker and armed the
        // fallback instead — which the buffer then opened and cancelled,
        // leaving a turn with one half recorded and no way to fill the other.
        // That is the deadlock that stopped the tour after its first stop.
        const id = responseIdOf(event);
        if (this.turns.generated(id)) this.endOfTurn();
        else if (!this.bufferEvents) this.settleThenAdvance();
        break;
      }

      /*
       * Voice activity, which is not the same as the visitor speaking.
       *
       * This fires on the guide's own voice returning through the speakers and
       * on any room noise. Abandoning the tour here stopped it dead on a
       * section heading while the guide carried on talking. So it only holds
       * position; whether the tour is over is decided by whether words come
       * back from the transcriber.
       */
      case "input_audio_buffer.speech_started":
        this.heardOverGuide = this.guideSpeaking;
        log(this.guideSpeaking ? "sound while the guide is talking" : "sound; holding the tour");
        this.cancelSettle();
        this.tour_.pause();
        this.armFalseAlarm();
        break;

      /*
       * What the visitor said — or what the guide said, arriving back through
       * their speakers.
       *
       * Echo cancellation is not perfect, and anyone listening without
       * headphones feeds the guide's own voice into the microphone. It comes
       * back from the transcriber as words, and words used to end the tour for
       * good: one stop, then silence, with nothing to say why.
       *
       * Sound that started while the guide was mid-sentence is treated as that
       * echo. A visitor who genuinely talks over the guide still ends the
       * tour: the provider truncates the response as soon as it hears them, so
       * by the time they have finished a sentence the guide has stopped and
       * anything further is heard in the clear.
       */
      case "conversation.item.input_audio_transcription.completed": {
        const text = typeof event.transcript === "string" ? event.transcript.trim() : "";
        const echo = this.heardOverGuide;
        this.heardOverGuide = false;
        this.clearFalseAlarm();
        if (text && !echo) {
          log(`the visitor spoke: ${JSON.stringify(text.slice(0, 60))} — ending the tour`);
          this.tour_.abandon();
        } else {
          // Noise, or the guide hearing itself. Either way, carry on.
          log(
            echo
              ? `heard over the guide, treating as echo: ${JSON.stringify(text.slice(0, 60))}`
              : "noise with no words in it; carrying on",
          );
          this.tour_.resume();
        }
        break;
      }

      // The transcriber gave up, which means there was nothing to hear.
      case "conversation.item.input_audio_transcription.failed":
        this.heardOverGuide = false;
        this.clearFalseAlarm();
        this.tour_.resume();
        break;

      case "error": {
        const err = event.error as { message?: string } | undefined;
        const message = err?.message ?? "The voice guide hit a problem.";
        // Only before the call is up does an error mean the call failed. After
        // that the connection is the thing that decides, not the event stream.
        log("provider error:", message);
        if (this.liveAnnounced) this.h.onIssue(message);
        else this.h.onStatus("error", message);
        break;
      }

      default:
        this.maybeToolCall(event);
    }
  }

  /**
   * A completed function call arrives as an output item on response.done, or as
   * a standalone done event depending on the shape the provider uses. Handle
   * both rather than pinning to one.
   */
  private maybeToolCall(event: Record<string, unknown>): void {
    const isCallDone =
      event.type === "response.function_call_arguments.done" ||
      event.type === "response.output_item.done";
    if (!isCallDone) return;

    const item = (event.item ?? event) as {
      name?: string;
      call_id?: string;
      arguments?: string;
      type?: string;
    };
    const name = item.name ?? (event.name as string | undefined);
    const callId = item.call_id ?? (event.call_id as string | undefined);
    const rawArgs = item.arguments ?? (event.arguments as string | undefined);
    if (name !== "navigate_to_slide" || !callId) return;

    let slideId: string | null = null;
    let reason: string | null = null;
    try {
      const parsed = JSON.parse(rawArgs ?? "{}");
      slideId = typeof parsed.slide_id === "string" ? parsed.slide_id : null;
      reason = typeof parsed.reason === "string" ? parsed.reason : null;
    } catch {
      /* a malformed call moves nothing */
    }

    /*
     * While the tour is running it owns the camera.
     *
     * Each stop's instruction says not to call this, but an instruction is not
     * a guarantee, and one stray call mid-sentence jumps the slide out from
     * under whatever is being said. The call is acknowledged rather than
     * refused outright — the model needs its loop closed either way.
     */
    const duringTour = this.tour_.active;
    if (slideId && !duringTour) this.h.onNavigate(slideId, reason);

    // Close the loop. Without this the model waits silently for a turn that
    // never comes.
    this.send({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(
          duringTour
            ? { success: false, reason: "A guided tour is in progress and controls the view." }
            : slideId
              ? { success: true, navigated_to: slideId }
              : { success: false },
        ),
      },
    });

    // Asking for another turn mid-tour would stack a second response on top of
    // the stop already being narrated, and produce a second response.done that
    // skips a stop. The tour prompts every turn it needs.
    if (!duringTour) this.send({ type: "response.create" });
  }
}
