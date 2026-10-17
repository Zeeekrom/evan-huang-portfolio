"use client";

/**
 * PixiJS canvas — renderer #2 (docs/ARCHITECTURE.md) and the camera (docs/ARCHITECTURE.md).
 *
 * Every constant this file reads from grid.ts was recovered from the reference
 * implementation, so the feel should be right on first run. If motion feels
 * wrong, suspect this wiring before you touch the numbers.
 */

import { useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Text as PixiText, type Text } from "pixi.js";
import {
  COLS,
  COL_PITCH,
  DIVE_THRESHOLD,
  MOMENTUM_CUTOFF,
  MOMENTUM_DECAY,
  ROW_PITCH,
  SLIDE_H,
  SLIDE_W,
  TOUCH_FLICK_BOOST,
  TOUCH_VELOCITY_GAIN,
  TOUCH_VELOCITY_SMOOTHING,
  WHEEL_VELOCITY_DECAY,
  WHEEL_VELOCITY_GAIN,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_SENSITIVITY,
  OPENING_DESCENT_MS,
  OPENING_HOLD_MS,
  TILT_FACTOR,
  LOD_TEXT_SCALE,
  FIT_REF_H,
  FIT_REF_W,
  arch,
  cameraFor,
  easeInOutCubic,
  focusFrom,
  neighbour,
  planFlight,
  nearestSlide,
  slideAt,
  slideFocus,
  slidePos,
} from "@/slides/grid";
import { indexOfSlide, slides } from "@/slides/slides";
import { THEME, renderSlide, repaint } from "./renderSlide";
import { EV, publishState, type StepDir, type Tool } from "./canvas/bus";
import { makeSticky } from "./canvas/sticky";

export default function Canvas({
  theme = "dark",
  startAt = "intro",
}: {
  theme?: "light" | "dark";
  startAt?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  /**
   * Switching theme rebuilds every slide, because text colour is baked into
   * each Text object. Without this the camera would snap back to the opening
   * shot on every toggle, which reads as the site resetting itself.
   */
  const cameraRef = useRef<{ x: number; y: number; scale: number; index: number } | null>(null);
  const saveCamera = useRef<(() => void) | null>(null);
  /**
   * Set once the world exists. Theme is applied through this rather than by
   * re-running the effect, so switching costs a tint pass instead of rebuilding
   * every slide behind a loading screen.
   */
  const applyTheme = useRef<((next: "light" | "dark") => void) | null>(null);
  /** Read during the build so the first paint is already the chosen palette. */
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let app: Application | null = null;
    let detach: (() => void) | null = null;

    // Only lock scrolling once JS is actually driving the canvas — without JS
    // the semantic deck underneath must stay scrollable.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Signals globals.css to visually hide the semantic deck. It stays in the
    // DOM and the accessibility tree; it just must not paint over the canvas.
    document.documentElement.dataset.canvas = "on";

    const failOpen = (err: unknown) => {
      console.error("[Canvas] failed to start, falling back to the deck:", err);
      delete document.documentElement.dataset.canvas;
      document.body.style.overflow = prevOverflow;
    };

    (async () => {
      const instance = new Application();
      await instance.init({
        resizeTo: host,
        antialias: true,
        backgroundColor: THEME[themeRef.current].surface,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
      if (disposed) {
        instance.destroy(true, { children: true, texture: true });
        return;
      }
      app = instance;
      host.appendChild(instance.canvas);

      // The PixiJS DevTools extension looks for this global. Dev only — it
      // pins the app, and shipping it would keep the whole scene graph alive.
      if (process.env.NODE_ENV === "development") {
        (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = instance;
      }

      /* ---------------------------------------------------------- world */

      const world = new Container();
      instance.stage.addChild(world);

      const fillEl = document.getElementById("explore-loader-fill");
      const countEl = document.getElementById("explore-loader-count");
      const BUILD_CHUNK = 4;

      const nodes: Container[] = [];
      for (let i = 0; i < slides.length; i += BUILD_CHUNK) {
        // Bail out only. Teardown belongs to the cleanup function, which has
        // already been handed this instance — destroying it here as well runs
        // Application.destroy twice and throws out of the build.
        if (disposed) return;
        const end = Math.min(i + BUILD_CHUNK, slides.length);
        for (let j = i; j < end; j++) {
          const node = renderSlide(slides[j], j, THEME[themeRef.current]);
          const { x, y } = slidePos(j);
          node.position.set(x, y);
          world.addChild(node);
          nodes[j] = node;
        }
        if (fillEl) fillEl.style.width = `${Math.round((end / slides.length) * 100)}%`;
        if (countEl) countEl.textContent = `${end} / ${slides.length}`;
        // setTimeout rather than rAF: frames are not scheduled in a background
        // tab, and the build must still finish there.
        await new Promise((r) => setTimeout(r, 0));
      }

      /*
       * Annotations live in world space, above the slides. Drawing into the
       * viewport instead would leave a highlight hanging in mid-air the moment
       * the camera moved.
       */
      const annotations = new Container();
      world.addChild(annotations);

      let current = indexOfSlide(startAt) ?? 0;
      let activeTool: Tool = "select";
      let activeEmoji = "🔥";
      let stroke: Graphics | null = null;

      /** Pointer position in world coordinates. */
      const toWorld = (clientX: number, clientY: number) => {
        const r = instance.canvas.getBoundingClientRect();
        return {
          x: (clientX - r.left - world.x) / world.scale.x,
          y: (clientY - r.top - world.y) / world.scale.y,
        };
      };

      /* ------------------------------------------------- visibility cull */

      // Only slides near the viewport are renderable (docs/ARCHITECTURE.md). With 60+
      // slides this is the difference between 60fps and a slideshow.
      const cull = () => {
        const s = world.scale.x;
        const left = -world.x / s;
        const top = -world.y / s;
        const right = left + instance.screen.width / s;
        const bottom = top + instance.screen.height / s;
        for (let i = 0; i < nodes.length; i++) {
          const p = slidePos(i);
          const visible =
            p.x + SLIDE_W > left - SLIDE_W &&
            p.x < right + SLIDE_W &&
            p.y + SLIDE_H > top - SLIDE_H &&
            p.y < bottom + SLIDE_H;
          nodes[i].visible = visible;
          nodes[i].renderable = visible;
          // Level of detail: below this scale the body text is illegible, so
          // draw the card alone. Keeps the establishing shot cheap.
          const bodyLayer = nodes[i].children[1];
          if (bodyLayer) bodyLayer.visible = visible && s >= LOD_TEXT_SCALE;
        }
      };

      /* ------------------------------------------------------- camera */

      const centreOn = (index: number, scale: number) => {
        const f = slideFocus(index);
        world.scale.set(scale);
        const cam = cameraFor(instance.screen.width, instance.screen.height, f.x, f.y, scale);
        world.x = cam.x;
        world.y = cam.y;
      };

      const fitScale = () =>
        Math.min(instance.screen.width / FIT_REF_W, instance.screen.height / FIT_REF_H);

      /** Full extent of the laid-out world, used for the establishing shot. */
      const rows = Math.ceil(nodes.length / COLS);
      const worldW = (Math.min(nodes.length, COLS) - 1) * COL_PITCH + SLIDE_W;
      const worldH = (rows - 1) * ROW_PITCH + SLIDE_H;

      const overviewScale = () =>
        Math.max(
          ZOOM_MIN,
          Math.min(
            (instance.screen.width * 0.86) / worldW,
            (instance.screen.height * 0.86) / worldH,
          ),
        );

      const showOverview = () => {
        const s = overviewScale();
        world.scale.set(s);
        world.x = (instance.screen.width - worldW * s) / 2;
        world.y = (instance.screen.height - worldH * s) / 2;
      };

      const reduceMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // A remembered camera means this mount is a theme rebuild, not a fresh
      // visit: restore exactly where the visitor was and skip the opening.
      const resumed = cameraRef.current;
      if (resumed) {
        current = resumed.index;
        world.scale.set(resumed.scale);
        world.x = resumed.x;
        world.y = resumed.y;
      } else if (reduceMotion) {
        centreOn(current, fitScale());
      } else {
        showOverview();
      }
      cull();

      saveCamera.current = () => {
        if (world.destroyed) return;
        cameraRef.current = { x: world.x, y: world.y, scale: world.scale.x, index: current };
      };

      let vx = 0;
      let vy = 0;
      let coastRaf: number | null = null;
      let flying = false;

      /** Inertial coasting: v *= 0.72 each frame until it drops under 0.5px. */
      const coast = () => {
        if (coastRaf !== null) cancelAnimationFrame(coastRaf);
        const step = () => {
          if (disposed || world.destroyed) {
            coastRaf = null;
            return;
          }
          if (Math.abs(vx) < MOMENTUM_CUTOFF && Math.abs(vy) < MOMENTUM_CUTOFF) {
            vx = 0;
            vy = 0;
            coastRaf = null;
            return;
          }
          world.x += vx;
          world.y += vy;
          vx *= MOMENTUM_DECAY;
          vy *= MOMENTUM_DECAY;
          panned();
          coastRaf = requestAnimationFrame(step);
        };
        coastRaf = requestAnimationFrame(step);
      };

      /**
       * Cinematic move. Position interpolates on easeInOutCubic while scale
       * rides a sine arch — that decoupling is what reads as "lift off, fly,
       * descend" rather than a plain tween (docs/ARCHITECTURE.md).
       */
      const flyTo = (target: number) => {
        if (flying || target === current || target < 0 || target >= nodes.length) return;
        flying = true;
        if (coastRaf !== null) cancelAnimationFrame(coastRaf);
        vx = 0;
        vy = 0;

        nodes[current].visible = nodes[current].renderable = true;
        nodes[target].visible = nodes[target].renderable = true;

        const plan = planFlight(current, target);
        const fit = fitScale();
        const startScale = world.scale.x;
        const { width: sw, height: sh } = instance.screen;

        // Start from where the camera actually is, not from where the current
        // slide sits: the visitor may have panned away before navigating.
        const startFocus = focusFrom(sw, sh, world.x, world.y, startScale);
        const endFocus = slideFocus(target);

        // Pull back exactly far enough to frame the whole journey and no
        // further. A short hop barely dips; a long one lifts to show the route.
        const spanW = Math.abs(endFocus.x - startFocus.x) + SLIDE_W;
        const spanH = Math.abs(endFocus.y - startFocus.y) + SLIDE_H;
        const dipScale = Math.max(
          ZOOM_MIN,
          Math.min(sw / spanW, sh / spanH, startScale, fit),
        );

        /** Jump straight to the destination and clear the in-flight lock. */
        const settle = () => {
          world.skew.set(0, 0);
          world.scale.set(fit);
          const cam = cameraFor(sw, sh, endFocus.x, endFocus.y, fit);
          world.x = cam.x;
          world.y = cam.y;
          current = target;
          flying = false;
          cull();
          publish();
          history.replaceState(null, "", `#${slides[target].id}`);
        };

        // rAF is suspended while the tab is hidden. Without this, a flight
        // started just before the user switches away never finishes and the
        // canvas stays locked against all further navigation.
        const onHidden = () => {
          if (document.hidden && flying) settle();
        };
        document.addEventListener("visibilitychange", onHidden);

        const t0 = performance.now();
        const tick = () => {
          if (disposed || world.destroyed) {
            flying = false;
            document.removeEventListener("visibilitychange", onHidden);
            return;
          }
          if (!flying) {
            document.removeEventListener("visibilitychange", onHidden);
            return; // settled early
          }
          const p = Math.min((performance.now() - t0) / plan.durationMs, 1);
          const e = easeInOutCubic(p);
          const a = arch(p);

          // The focal point travels a straight line through world space while
          // scale rides the arch around it. Keeping the two independent is what
          // stops the camera overshooting and snapping back at the end.
          const fx = startFocus.x + (endFocus.x - startFocus.x) * e;
          const fy = startFocus.y + (endFocus.y - startFocus.y) * e;
          const base = startScale + (fit - startScale) * e;
          const scale = base + (dipScale - base) * a;

          // 2D stand-in for perspective tilt: lean into the direction of travel
          // on the same arch, so the world is level at both ends.
          const rad = Math.PI / 180;
          world.skew.set(plan.tiltX * rad * TILT_FACTOR * a, plan.tiltY * rad * TILT_FACTOR * a);

          world.scale.set(scale);
          const cam = cameraFor(sw, sh, fx, fy, scale);
          world.x = cam.x;
          world.y = cam.y;
          cull();

          if (p < 1) requestAnimationFrame(tick);
          else {
            world.skew.set(0, 0);
            current = target;
            flying = false;
            document.removeEventListener("visibilitychange", onHidden);
            history.replaceState(null, "", `#${slides[target].id}`);
            publish();
          }
        };
        requestAnimationFrame(tick);
      };

      /**
       * Establishing shot -> slide. Distinct from flyTo: we are already zoomed
       * out, so the camera descends on a single eased curve instead of arcing
       * up and back down.
       */
      const descend = (target: number, durationMs = 2400) =>
        new Promise<void>((resolve) => {
          if (flying) return resolve();
          flying = true;
          const fit = fitScale();
          const startScale = world.scale.x;
          const { width: sw, height: sh } = instance.screen;
          const startFocus = focusFrom(sw, sh, world.x, world.y, startScale);
          const endFocus = slideFocus(target);

          const land = () => {
            world.scale.set(fit);
            const cam = cameraFor(sw, sh, endFocus.x, endFocus.y, fit);
            world.x = cam.x;
            world.y = cam.y;
            current = target;
            flying = false;
            cull();
            publish();
            history.replaceState(null, "", `#${slides[target].id}`);
          };
          const onHidden = () => {
            if (document.hidden && flying) {
              land();
              document.removeEventListener("visibilitychange", onHidden);
              resolve();
            }
          };
          document.addEventListener("visibilitychange", onHidden);

          const t0 = performance.now();
          const tick = () => {
            if (disposed || world.destroyed || !flying) {
              flying = false;
              document.removeEventListener("visibilitychange", onHidden);
              return resolve();
            }
            const p = Math.min((performance.now() - t0) / durationMs, 1);
            const e = easeInOutCubic(p);
            const scale = startScale + (fit - startScale) * e;
            const fx = startFocus.x + (endFocus.x - startFocus.x) * e;
            const fy = startFocus.y + (endFocus.y - startFocus.y) * e;
            world.scale.set(scale);
            const cam = cameraFor(sw, sh, fx, fy, scale);
            world.x = cam.x;
            world.y = cam.y;
            cull();
            if (p < 1) requestAnimationFrame(tick);
            else {
              land();
              document.removeEventListener("visibilitychange", onHidden);
              resolve();
            }
          };
          requestAnimationFrame(tick);
        });

      /** Tell the toolbar where the camera ended up. */
      const publish = () => {
        publishState({
          index: current,
          slideId: slides[current]?.id ?? "",
          atOverview: world.scale.x <= overviewScale() * 1.35,
          scale: world.scale.x,
          can: {
            left: neighbour(current, "left", nodes.length) !== null,
            right: neighbour(current, "right", nodes.length) !== null,
            up: neighbour(current, "up", nodes.length) !== null,
            down: neighbour(current, "down", nodes.length) !== null,
          },
        });
      };

      /**
       * Follow the camera when the visitor moves it themselves.
       *
       * `current` used to change only when a flight landed. Panning by hand
       * left it behind: the counter went on naming the slide you came from,
       * and the dial stepped from there — pan three slides away, press Right,
       * and the camera flew to the neighbour of where it used to be rather
       * than of where you were.
       *
       * Coalesced to one check per frame, and it only tells the toolbar when
       * something it displays has actually changed.
       */
      let hashTimer: ReturnType<typeof setTimeout> | null = null;
      let lastOverview: boolean | null = null;

      const syncToCamera = () => {
        // A flight owns `current` until it lands, and assigns it itself.
        if (disposed || world.destroyed || flying) return;

        // Cheap enough to run on every pointer move: a few dozen squared
        // distances, no allocation. Deferring it to a frame would only buy
        // back work that costs less than scheduling it.
        const { width: sw, height: sh } = instance.screen;
        const f = focusFrom(sw, sh, world.x, world.y, world.scale.x);
        const at = nearestSlide(f.x, f.y, nodes.length);
        const overview = world.scale.x <= overviewScale() * 1.35;
        if (at === current && overview === lastOverview) return;

        const moved = at !== current;
        current = at;
        lastOverview = overview;
        publish();

        // The URL trails the counter deliberately. replaceState is rate
        // limited by browsers and a quick pan crosses a lot of slides, so it
        // settles once the camera has.
        if (!moved) return;
        if (hashTimer !== null) clearTimeout(hashTimer);
        hashTimer = setTimeout(() => {
          hashTimer = null;
          if (!disposed && !flying) {
            history.replaceState(null, "", `#${slides[current].id}`);
          }
        }, 400);
      };

      /**
       * The camera was moved by the visitor rather than by a flight. Flights
       * call cull() on its own, because they keep `current` themselves.
       */
      const panned = () => {
        cull();
        syncToCamera();
      };

      /** Pull back to the establishing shot. The inverse of `descend`. */
      const zoomToOverview = (durationMs = 1400) => {
        if (flying) return;
        flying = true;
        const target = overviewScale();
        const startScale = world.scale.x;
        const { width: sw, height: sh } = instance.screen;
        const startFocus = focusFrom(sw, sh, world.x, world.y, startScale);
        const endFocus = { x: worldW / 2, y: worldH / 2 };

        const land = () => {
          world.skew.set(0, 0);
          world.scale.set(target);
          const cam = cameraFor(sw, sh, endFocus.x, endFocus.y, target);
          world.x = cam.x;
          world.y = cam.y;
          flying = false;
          cull();
          publish();
        };
        const onHidden = () => {
          if (document.hidden && flying) {
            land();
            document.removeEventListener("visibilitychange", onHidden);
          }
        };
        document.addEventListener("visibilitychange", onHidden);

        const t0 = performance.now();
        const tick = () => {
          if (disposed || world.destroyed || !flying) {
            flying = false;
            document.removeEventListener("visibilitychange", onHidden);
            return;
          }
          const p = Math.min((performance.now() - t0) / durationMs, 1);
          const e = easeInOutCubic(p);
          const scale = startScale + (target - startScale) * e;
          const fx = startFocus.x + (endFocus.x - startFocus.x) * e;
          const fy = startFocus.y + (endFocus.y - startFocus.y) * e;
          world.scale.set(scale);
          const cam = cameraFor(sw, sh, fx, fy, scale);
          world.x = cam.x;
          world.y = cam.y;
          cull();
          if (p < 1) requestAnimationFrame(tick);
          else {
            land();
            document.removeEventListener("visibilitychange", onHidden);
          }
        };
        requestAnimationFrame(tick);
      };

      const goToId = (id: string) => {
        const i = indexOfSlide(id);
        if (i !== null) flyTo(i);
      };

      /* -------------------------------------------------------- routing */

      // Single hub for every navigation source: links, menu, keyboard, and
      // later the AI's navigate_to_slide tool (docs/ARCHITECTURE.md).
      const route = (url: string) => {
        if (url.startsWith("slide://")) return goToId(url.slice("slide://".length));
        if (url.startsWith("#")) return goToId(url.slice(1));
        if (/^\d+$/.test(url)) return flyTo(Number(url));
        if (url.startsWith("mailto:")) {
          window.location.href = url;
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      };

      world.eventMode = "static";
      world.on("pointertap", (e) => {
        const target = e.target as Text & { __url?: string };
        if (target?.__url) route(target.__url);
      });

      /* --------------------------------------------------------- input */

      const canvas = instance.canvas;
      let dragging = false;
      let last = { x: 0, y: 0 };
      let lastT = 0;

      /**
       * Start a tool gesture. Returns true when a tool claimed the input, in
       * which case the caller must not pan.
       */
      const toolDown = (clientX: number, clientY: number): boolean => {
        if (activeTool === "select") return false;
        const p = toWorld(clientX, clientY);

        if (activeTool === "emoji") {
          const mark = new PixiText({
            text: activeEmoji,
            style: { fontSize: 48, fill: 0xffffff },
          });
          mark.anchor.set(0.5);
          mark.position.set(p.x, p.y);
          annotations.addChild(mark);
          publishAnnotations();
          return true;
        }

        if (activeTool === "note") {
          window.dispatchEvent(
            new CustomEvent(EV.noteRequest, {
              detail: { screenX: clientX, screenY: clientY, worldX: p.x, worldY: p.y },
            }),
          );
          return true;
        }

        // highlight
        stroke = new Graphics();
        stroke.moveTo(p.x, p.y);
        annotations.addChild(stroke);
        publishAnnotations();
        return true;
      };

      /** Continue a highlighter stroke. True if a stroke is in progress. */
      const toolMove = (clientX: number, clientY: number): boolean => {
        if (!stroke) return false;
        const p = toWorld(clientX, clientY);
        stroke
          .lineTo(p.x, p.y)
          // Translucent and thick, so it reads as marker over the text rather
          // than a line drawn through it.
          .stroke({ color: 0xffe066, width: 18, alpha: 0.38, cap: "round", join: "round" })
          .moveTo(p.x, p.y);
        return true;
      };

      /** End a tool gesture. True if one was in progress. */
      const toolUp = (): boolean => {
        if (!stroke) return false;
        stroke = null;
        return true;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        if (toolDown(e.clientX, e.clientY)) return;

        dragging = true;
        last = { x: e.clientX, y: e.clientY };
        if (coastRaf !== null) cancelAnimationFrame(coastRaf);
        vx = vy = 0;
      };
      const onPointerMove = (e: PointerEvent) => {
        if (toolMove(e.clientX, e.clientY)) return;
        if (!dragging) return;
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        world.x += dx;
        world.y += dy;
        vx = dx;
        vy = dy;
        last = { x: e.clientX, y: e.clientY };
        panned();
      };
      const onPointerUp = () => {
        if (toolUp()) return;
        if (!dragging) return;
        dragging = false;
        if (Math.abs(vx) > MOMENTUM_CUTOFF || Math.abs(vy) > MOMENTUM_CUTOFF) coast();
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (flying) return;
        if (e.ctrlKey) {
          // Trackpad pinch arrives as ctrl+wheel.
          if (coastRaf !== null) cancelAnimationFrame(coastRaf);
          vx = vy = 0;
          const next = world.scale.x * (1 - ZOOM_SENSITIVITY * e.deltaY);
          if (next < ZOOM_MIN || next > ZOOM_MAX) return;
          const r = canvas.getBoundingClientRect();
          const px = e.clientX - r.left;
          const py = e.clientY - r.top;
          const wx = (px - world.x) / world.scale.x;
          const wy = (py - world.y) / world.scale.y;
          world.scale.set(next);
          world.x = px - wx * next; // keep the point under the cursor fixed
          world.y = py - wy * next;
        } else {
          world.x -= e.deltaX;
          world.y -= e.deltaY;
          vx = WHEEL_VELOCITY_DECAY * vx - WHEEL_VELOCITY_GAIN * e.deltaX;
          vy = WHEEL_VELOCITY_DECAY * vy - WHEEL_VELOCITY_GAIN * e.deltaY;
          if (coastRaf === null) coast();
        }
        panned();
      };

      let pinchFrom: number | null = null;
      const onTouchStart = (e: TouchEvent) => {
        if (coastRaf !== null) cancelAnimationFrame(coastRaf);
        vx = vy = 0;
        if (e.touches.length === 2) {
          pinchFrom = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
        } else if (e.touches.length === 1) {
          // Two fingers always mean pinch-zoom, tool or not; one finger goes to
          // the armed tool first.
          if (toolDown(e.touches[0].clientX, e.touches[0].clientY)) return;
          last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          lastT = performance.now();
        }
      };
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && toolMove(e.touches[0].clientX, e.touches[0].clientY)) return;
        if (e.touches.length === 2 && pinchFrom !== null) {
          const d = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
          const next = world.scale.x * (d / pinchFrom);
          pinchFrom = d;
          if (next < ZOOM_MIN || next > ZOOM_MAX) return;
          const r = canvas.getBoundingClientRect();
          const px = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
          const py = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
          const wx = (px - world.x) / world.scale.x;
          const wy = (py - world.y) / world.scale.y;
          world.scale.set(next);
          world.x = px - wx * next;
          world.y = py - wy * next;
        } else if (e.touches.length === 1) {
          const now = performance.now();
          const dt = now - lastT;
          const dx = e.touches[0].clientX - last.x;
          const dy = e.touches[0].clientY - last.y;
          world.x += dx;
          world.y += dy;
          if (dt > 0) {
            // Time-normalised so velocity survives dropped frames.
            vx = (dx / dt) * TOUCH_VELOCITY_GAIN + TOUCH_VELOCITY_SMOOTHING * vx;
            vy = (dy / dt) * TOUCH_VELOCITY_GAIN + TOUCH_VELOCITY_SMOOTHING * vy;
          }
          last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          lastT = now;
        }
        panned();
      };
      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length === 0) {
          pinchFrom = null;
          // A tool gesture leaves no momentum behind — a flick of the
          // highlighter should not send the camera coasting.
          if (toolUp()) {
            vx = vy = 0;
            return;
          }
          vx *= TOUCH_FLICK_BOOST; // release gives the flick its punch
          vy *= TOUCH_FLICK_BOOST;
          if (Math.abs(vx) > MOMENTUM_CUTOFF || Math.abs(vy) > MOMENTUM_CUTOFF) coast();
        }
      };

      /** Dive in — only from an overview, so close-up double-clicks never fire. */
      const onDblClick = (e: MouseEvent) => {
        if (world.scale.x >= DIVE_THRESHOLD) return;
        const r = canvas.getBoundingClientRect();
        const wx = (e.clientX - r.left - world.x) / world.scale.x;
        const wy = (e.clientY - r.top - world.y) / world.scale.y;
        const hit = slideAt(wx, wy, nodes.length);
        if (hit !== null) flyTo(hit);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("canvas:search"));
          return;
        }
        if (e.key === "Escape" && activeTool !== "select") {
          e.preventDefault();
          activeTool = "select";
          instance.canvas.style.cursor = "";
          publishTool();
          return;
        }
        const dir =
          e.key === "ArrowLeft" ? "left"
          : e.key === "ArrowRight" ? "right"
          : e.key === "ArrowUp" ? "up"
          : e.key === "ArrowDown" ? "down"
          : null;
        if (!dir) return;
        e.preventDefault();
        const next = neighbour(current, dir, nodes.length);
        if (next !== null) flyTo(next);
      };

      /** External navigation entry point — the AI tool will call through this. */
      const onNavigate = (e: Event) => {
        const id = (e as CustomEvent<{ slideId: string }>).detail?.slideId;
        if (id) goToId(id);
      };

      const onStep = (e: Event) => {
        const dir = (e as CustomEvent<{ dir: StepDir }>).detail?.dir;
        if (!dir) return;
        const next = neighbour(current, dir, nodes.length);
        if (next !== null) flyTo(next);
      };

      const onOverview = () => zoomToOverview();

      /** Echo the tool back so the dock can show which one is armed. */
      const publishTool = () => {
        window.dispatchEvent(new CustomEvent(EV.toolChanged, { detail: { tool: activeTool } }));
      };

      /**
       * The Clear button has to survive the tool that drew the marks — a
       * visitor who doodles and then switches back to Select still needs a way
       * to undo it. So the dock tracks the mark count, not the active tool.
       */
      const publishAnnotations = () => {
        window.dispatchEvent(
          new CustomEvent(EV.annotations, { detail: { count: annotations.children.length } }),
        );
      };

      const onTool = (e: Event) => {
        const detail = (e as CustomEvent<{ tool: Tool; emoji?: string }>).detail;
        if (!detail) return;
        activeTool = detail.tool;
        if (detail.emoji) activeEmoji = detail.emoji;
        // Panning is abandoned mid-gesture if a tool is armed while dragging.
        dragging = false;
        stroke = null;
        instance.canvas.style.cursor = activeTool === "select" ? "" : "crosshair";
        publishTool();
      };

      const onNoteCommit = (e: Event) => {
        const d = (
          e as CustomEvent<{ worldX: number; worldY: number; text: string; colour: string }>
        ).detail;
        if (!d?.text.trim()) return;
        annotations.addChild(makeSticky(d.text.trim(), d.worldX, d.worldY, d.colour));
        publishAnnotations();
      };

      const onClearAnnotations = () => {
        annotations.removeChildren().forEach((child) => child.destroy());
        publishAnnotations();
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerUp);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("touchstart", onTouchStart, { passive: false });
      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
      canvas.addEventListener("touchend", onTouchEnd);
      canvas.addEventListener("dblclick", onDblClick);
      /*
       * `resizeTo` keeps the canvas the right size but says nothing about what
       * is inside it. Widening the window enlarges the viewport, so slides that
       * should now be on screen stay hidden until the next camera move — and
       * after a language switch they would come back in the previous language
       * for the same reason. Culling on resize covers both.
       */
      const onResize = () => cull();
      window.addEventListener("resize", onResize);

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener(EV.navigate, onNavigate);
      window.addEventListener(EV.step, onStep);
      window.addEventListener(EV.overview, onOverview);
      window.addEventListener(EV.tool, onTool);
      window.addEventListener(EV.clearAnnotations, onClearAnnotations);
      window.addEventListener(EV.noteCommit, onNoteCommit);

      detach = () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerUp);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
        canvas.removeEventListener("dblclick", onDblClick);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener(EV.navigate, onNavigate);
        window.removeEventListener(EV.step, onStep);
        window.removeEventListener(EV.overview, onOverview);
        window.removeEventListener(EV.tool, onTool);
        window.removeEventListener(EV.clearAnnotations, onClearAnnotations);
        window.removeEventListener(EV.noteCommit, onNoteCommit);
        if (coastRaf !== null) cancelAnimationFrame(coastRaf);
        if (hashTimer !== null) clearTimeout(hashTimer);
      };

      applyTheme.current = (next) => {
        const palette = THEME[next];
        instance.renderer.background.color = palette.surface;
        repaint(world, palette);
      };

      // Dev-only inspection handle. The camera is otherwise a closed system, and
      // debugging motion without a way to read its state is guesswork.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__canvas = {
          get state() {
            return {
              current,
              currentId: slides[current]?.id,
              flying,
              scale: world.scale.x,
              x: world.x,
              y: world.y,
              slideCount: nodes.length,
              visible: nodes.filter((n) => n.visible).length,
            };
          },
          flyTo,
          goToId,
          route,
          world,
        };
      }

      setReady(true);

      // Establishing shot: hold the whole world, then descend into the entry
      // slide. Skipped entirely when the visitor asks for reduced motion, and
      // abandoned if they grab the canvas first — their input outranks ours.
      publish();

      // Everything is drawn and the camera is placed: let the loader fade.
      document.documentElement.dataset.canvas = "ready";

      // Then take it out of the document entirely. The fade is a CSS
      // transition, and transitions do not advance while a tab is not being
      // painted — so a visitor who switched away during the build could come
      // back to a loading screen that never cleared. setTimeout still fires.
      window.setTimeout(() => {
        document.getElementById("explore-loader")?.remove();
      }, 700);

      if (!reduceMotion && !resumed) {
        let interrupted = false;
        const cancelOpening = () => {
          interrupted = true;
        };
        canvas.addEventListener("pointerdown", cancelOpening, { once: true });
        canvas.addEventListener("wheel", cancelOpening, { once: true, passive: true });

        const runOpening = () => {
          canvas.removeEventListener("pointerdown", cancelOpening);
          canvas.removeEventListener("wheel", cancelOpening);
          if (disposed || interrupted) return;
          void descend(current, OPENING_DESCENT_MS);
        };

        window.setTimeout(() => {
          if (disposed || interrupted) return;
          if (!document.hidden) return runOpening();
          // Opened in a background tab: wait for the visitor to actually arrive,
          // otherwise the descent plays to nobody and strands the camera.
          const onVisible = () => {
            if (document.hidden) return;
            document.removeEventListener("visibilitychange", onVisible);
            runOpening();
          };
          document.addEventListener("visibilitychange", onVisible);
        }, OPENING_HOLD_MS);
      }
    })().catch(failOpen);

    return () => {
      disposed = true;
      saveCamera.current?.();
      detach?.();
      app?.destroy(true, { children: true, texture: true });
      document.body.style.overflow = prevOverflow;
      // Step back to "on", never clear it. A theme change tears this effect
      // down and builds it again; clearing the flag would expose the raw deck
      // for the length of that rebuild. Only failOpen clears it, because only
      // then is the deck genuinely the right thing to show.
      document.documentElement.dataset.canvas = "on";
    };
    // `theme` is deliberately absent: it is applied through its ref, not by
    // rebuilding. Rebuilding on every toggle is what put a loading screen in
    // front of a switch that should be instant.
  }, [startAt]);

  useEffect(() => {
    applyTheme.current?.(theme);
  }, [theme, ready]);

  return (
    <div
      ref={hostRef}
      className="fixed inset-0 z-50 touch-none"
      style={{ background: theme === "dark" ? "#050505" : "#b4b4b4" }}
      aria-hidden="true"
      data-ready={ready}
    />
  );
}
