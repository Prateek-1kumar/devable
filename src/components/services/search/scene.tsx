"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

// Shared by the four Workbench scenes. Every scene builds in beats (moments in time) while it's the active
// one, and sits finished and still under reduced motion. Same surfaces as the rest of the page: a hairline
// ring and a soft lift, never an outline; the brand green for what's live or done, the coral accent for gaps.

export type SceneProps = { on: boolean };

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * How many of `times` (ms after `on` turns true, ascending) have passed: 0 at rest, `times.length` when the
 * scene is done. Turning `on` off rewinds to 0, so the scene plays again each time it's active. Reduced
 * motion jumps straight to the end.
 */
export function useBeats(on: boolean, times: readonly number[]) {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [n, setN] = useState(0);
  useEffect(() => {
    const ids = times.map((t, i) => setTimeout(() => setN((p) => (on ? Math.max(p, i + 1) : 0)), on ? t : 0));
    return () => ids.forEach(clearTimeout);
  }, [on, times]);
  return still ? times.length : n;
}

/** A window: white, with a hairline ring and a soft lift. */
export const PANEL = "rounded-xl bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_1px_2px_rgb(15_26_20/0.04),0_12px_28px_-18px_rgb(15_26_20/0.18)]";
export const HAIR = "border-ink/[0.06]";
export const DEEP = "#1a7f47"; // the page's deep green, for text and ticks

/** Fades and settles into place when `on`. */
export const show = (on: boolean) =>
  `transition-[opacity,translate,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
    on ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.985] opacity-0"
  }`;

/** A window's title row: an optional step number, the title, and anything on the right. */
export function Titlebar({ n, title, children }: { n?: number; title: string; children?: ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b ${HAIR} px-3 py-1`}>
      <p className="flex items-center gap-2 text-[12px] font-medium text-ink">
        {n !== undefined && <span className="grid size-4 place-items-center rounded bg-ink/[0.06] font-mono text-[10px] text-ink/60">{n}</span>}
        {title}
      </p>
      {children}
    </div>
  );
}
