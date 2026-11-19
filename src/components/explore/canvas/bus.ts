/**
 * Toolbar <-> canvas messaging.
 *
 * The toolbar is React DOM and the world is PixiJS; neither should hold a
 * reference to the other. Commands travel down as events, state travels back up
 * the same way, so either side can be replaced without touching the other.
 *
 * This is also the seam the AI presenter will use: its `navigate_to_slide` tool
 * dispatches `canvas:navigate`, exactly like a menu click (docs/ARCHITECTURE.md).
 */

export type StepDir = "left" | "right" | "up" | "down";

/**
 * Canvas tools (docs/ARCHITECTURE.md). `select` is the resting state — panning, clicking
 * links, everything the canvas normally does. The others take over the pointer
 * until Escape or another tool is chosen.
 */
export type Tool = "select" | "highlight" | "emoji" | "note";

export const EV = {
  /** Command: fly to a slide by id. */
  navigate: "canvas:navigate",
  /** Command: move one cell in the grid. */
  step: "canvas:step",
  /** Command: pull back to the establishing shot. */
  overview: "canvas:overview",
  /** Command/notification: open the search palette. */
  search: "canvas:search",
  /** Command: switch the active tool. */
  tool: "canvas:tool",
  /** Command: clear every annotation the visitor has drawn. */
  clearAnnotations: "canvas:clear-annotations",
  /** Notification: the active tool changed. */
  toolChanged: "canvas:tool-changed",
  /** Notification: how many marks are on the canvas right now. */
  annotations: "canvas:annotations",
  /**
   * Notification: the visitor dropped a note pin and needs somewhere to type.
   * Text editing stays in the DOM — an IME cannot compose into a WebGL canvas,
   * which would lock out anyone typing Chinese.
   */
  noteRequest: "canvas:note-request",
  /** Command: turn the pending pin into a note, or discard it if text is empty. */
  noteCommit: "canvas:note-commit",
  /** Command: show a transient message at the top of the screen. */
  toast: "canvas:toast",
  /** Notification: the presenter went live, or hung up. */
  presenter: "canvas:presenter",
  /** Notification: the camera settled somewhere new. */
  state: "canvas:state",
} as const;

export interface CanvasState {
  index: number;
  slideId: string;
  /** True while the camera is pulled back far enough to see the whole world. */
  atOverview: boolean;
  scale: number;
  /** Which grid directions have a slide to move to. */
  can: Record<StepDir, boolean>;
}

/* ------------------------------------------------------------------ senders */

export function navigateTo(slideId: string) {
  window.dispatchEvent(new CustomEvent(EV.navigate, { detail: { slideId } }));
}

export function step(dir: StepDir) {
  window.dispatchEvent(new CustomEvent(EV.step, { detail: { dir } }));
}

export function toOverview() {
  window.dispatchEvent(new CustomEvent(EV.overview));
}

export function openSearch() {
  window.dispatchEvent(new CustomEvent(EV.search));
}

export function setTool(tool: Tool, emoji?: string) {
  window.dispatchEvent(new CustomEvent(EV.tool, { detail: { tool, emoji } }));
}

export function clearAnnotations() {
  window.dispatchEvent(new CustomEvent(EV.clearAnnotations));
}

export interface NoteRequest {
  /** Where the composer should appear, in viewport pixels. */
  screenX: number;
  screenY: number;
  /** Where the note will land, in world units. */
  worldX: number;
  worldY: number;
}

export function commitNote(
  worldX: number,
  worldY: number,
  text: string,
  colour: string,
) {
  window.dispatchEvent(
    new CustomEvent(EV.noteCommit, { detail: { worldX, worldY, text, colour } }),
  );
}

/**
 * The presenter takes over the bottom of the screen while a call is live, so
 * the tool dock has to know. It is announced rather than lifted into shared
 * state because the two components are otherwise unrelated.
 */
export function publishPresenter(live: boolean) {
  window.dispatchEvent(new CustomEvent(EV.presenter, { detail: { live } }));
}

export function onPresenter(fn: (live: boolean) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<{ live: boolean }>).detail.live);
  window.addEventListener(EV.presenter, handler);
  return () => window.removeEventListener(EV.presenter, handler);
}

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent(EV.toast, { detail: { message } }));
}

export function onToast(fn: (message: string) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<{ message: string }>).detail.message);
  window.addEventListener(EV.toast, handler);
  return () => window.removeEventListener(EV.toast, handler);
}

export function onNoteRequest(fn: (r: NoteRequest) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<NoteRequest>).detail);
  window.addEventListener(EV.noteRequest, handler);
  return () => window.removeEventListener(EV.noteRequest, handler);
}

export function publishState(state: CanvasState) {
  window.dispatchEvent(new CustomEvent(EV.state, { detail: state }));
}

/* ---------------------------------------------------------------- listeners */

export function onCanvasState(fn: (s: CanvasState) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<CanvasState>).detail);
  window.addEventListener(EV.state, handler);
  return () => window.removeEventListener(EV.state, handler);
}

export function onToolChanged(fn: (tool: Tool) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<{ tool: Tool }>).detail.tool);
  window.addEventListener(EV.toolChanged, handler);
  return () => window.removeEventListener(EV.toolChanged, handler);
}

/** Drives the Clear button, which must outlive the tool that drew the marks. */
export function onAnnotationCount(fn: (count: number) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<{ count: number }>).detail.count);
  window.addEventListener(EV.annotations, handler);
  return () => window.removeEventListener(EV.annotations, handler);
}

export function onSearchRequest(fn: () => void): () => void {
  const handler = () => fn();
  window.addEventListener(EV.search, handler);
  return () => window.removeEventListener(EV.search, handler);
}
