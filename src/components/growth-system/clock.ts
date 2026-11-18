"use client";

import { useEffect, useState } from "react";

/**
 * A card's state in the story. `ghost`: not reached yet (shown soft, nothing started). `play`: its turn, the
 * demo runs on its own clock. `done`: played (or skipped past), the finished picture.
 */
export type CardState = "ghost" | "play" | "done";

/**
 * Seconds into a card's demo: -1 before it starts, Infinity once done, and a live clock while playing (it stops
 * itself at `duration`). Mount the card with a fresh key for each play so the clock starts from zero.
 */
export function usePlayhead(state: CardState, duration: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (state !== "play") return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const s = (now - start) / 1000;
      setT(Math.min(s, duration));
      if (s < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, duration]);
  return state === "done" ? Infinity : state === "ghost" ? -1 : t;
}

/** 0 → 1 as t runs from a to b. */
export const seg = (t: number, a: number, b: number) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
/** Ease-out cubic. */
export const out = (x: number) => 1 - (1 - x) ** 3;

/** A count rising from `from` to `to` between a and b, formatted the way the platform shows it. */
export function count(t: number, a: number, b: number, to: number, from = 0) {
  return Math.round(from + (to - from) * out(seg(t, a, b)));
}
export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : String(n));
