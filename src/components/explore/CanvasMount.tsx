"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the WebGL canvas.
 *
 * PixiJS touches `window` at import time, so the module must never be pulled
 * into the server graph — and `ssr: false` is only legal inside a client
 * component. This file exists purely to hold that boundary.
 */
const Canvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => null,
});

export default function CanvasMount(props: { theme?: "light" | "dark"; startAt?: string }) {
  return <Canvas {...props} />;
}
