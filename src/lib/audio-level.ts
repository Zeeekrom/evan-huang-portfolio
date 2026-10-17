/**
 * Watches how loud the guide actually is.
 *
 * The obvious signals for "has it finished talking" are the provider's
 * `response.done` and audio-delta events, and both are wrong here. They report
 * on *generation*: the model finishes composing a fifteen-second answer in
 * about two, and the audio then plays out over the WebRTC track for the
 * remaining thirteen. Advancing a tour on `response.done` therefore moves the
 * slide while the visitor is still listening to the previous one — which is
 * exactly the bug this exists to fix.
 *
 * Measuring the remote track directly is the only signal that matches what a
 * person hears.
 */

/** Below this RMS the stream counts as silence rather than room tone. */
const SILENCE_RMS = 0.006;

/** How often to sample. Fine enough to feel responsive, coarse enough to be free. */
const SAMPLE_MS = 80;

export class AudioLevelMonitor {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private timer: number | null = null;

  /** When sound was last heard. Starts in the past so silence is the default. */
  private lastLoudAt = 0;
  private loud = false;

  /**
   * @param stream The remote track.
   * @param onChange Fired when the guide starts or stops being audible.
   */
  constructor(
    stream: MediaStream,
    private readonly onChange: (speaking: boolean) => void,
  ) {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      this.ctx = new Ctor();
      // Started from a click, so this should already be running; resuming is
      // harmless and covers browsers that suspend it anyway.
      void this.ctx.resume();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.buffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));

      this.source = this.ctx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      // Deliberately not connected to the destination: the <audio> element is
      // what the visitor hears. Wiring this up as well would double the volume.

      this.timer = window.setInterval(() => this.sample(), SAMPLE_MS);
    } catch {
      // Web Audio unavailable or the stream cannot be tapped. quietFor() then
      // reports silence, so a tour still advances — just on the old, slightly
      // early signal rather than on playback.
      this.stop();
    }
  }

  /** True when nothing has been heard for at least `ms`. */
  quietFor(ms: number): boolean {
    if (!this.analyser) return true;
    return performance.now() - this.lastLoudAt >= ms;
  }

  get speaking(): boolean {
    return this.loud;
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      this.source?.disconnect();
      void this.ctx?.close();
    } catch {
      /* already torn down */
    }
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.buffer = null;
    if (this.loud) {
      this.loud = false;
      this.onChange(false);
    }
  }

  private sample(): void {
    if (!this.analyser || !this.buffer) return;
    this.analyser.getFloatTimeDomainData(this.buffer);

    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) sum += this.buffer[i] * this.buffer[i];
    const rms = Math.sqrt(sum / this.buffer.length);

    const now = performance.now();
    if (rms > SILENCE_RMS) this.lastLoudAt = now;

    // Hysteresis on the way down only. The meter should react the instant the
    // guide speaks, but a gap between words is not it stopping.
    const next = rms > SILENCE_RMS || now - this.lastLoudAt < 250;
    if (next !== this.loud) {
      this.loud = next;
      this.onChange(next);
    }
  }
}
