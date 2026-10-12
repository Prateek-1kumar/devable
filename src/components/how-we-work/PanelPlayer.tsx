"use client";

import { useEffect, useState, type ComponentType } from "react";

export type PanelModule = {
  /** Loop length in seconds. */
  duration: number;
  /** The frame shown when motion is reduced. */
  settle: number;
  Panel: ComponentType<{ t: number }>;
};

/**
 * Plays a panel's endless loop from page load, whether or not it is on screen,
 * so every card is always mid-story and scrolling never restarts or interrupts it.
 */
export default function PanelPlayer({ panel, still }: { panel: PanelModule; still: boolean }) {
  const { duration, settle, Panel } = panel;
  const [t, setT] = useState(0);

  useEffect(() => {
    if (still) return;
    let raf = 0;
    let clock = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // A frame's timestamp can predate `last`; never let the clock run backwards.
      clock = (clock + Math.min(Math.max(now - last, 0), 100) / 1000) % duration;
      last = now;
      setT(clock);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [still, duration]);

  return <Panel t={still ? settle : t} />;
}
