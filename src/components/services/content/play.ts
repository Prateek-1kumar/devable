"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// Shared by the Technical Content sections: a one-shot clock for artifacts that play once when scrolled into view.

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const out3 = (v: number) => 1 - (1 - v) ** 3;
export const io3 = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
export const linear = (v: number) => v;
/** Progress 0–1 of `p` between `a` and `b`, eased out by default. */
export const seg = (p: number, a: number, b: number, f = out3) => f(clamp01((p - a) / (b - a)));

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** 0 → 1 over `ms` once `on`, then holds. With reduced motion it is 1 straight away (the finished picture). */
export function usePlay(on: boolean, ms: number) {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!on || still) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const k = Math.min((now - start) / ms, 1);
      setP(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, still, ms]);
  return still ? 1 : p;
}
