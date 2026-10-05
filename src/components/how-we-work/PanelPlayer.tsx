"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

export type PanelModule = {
  /** Loop length in seconds. */
  duration: number;
  /** The settled final frame (story complete, before the loop's fade-out): the still and the end of a play-once. */
  settle: number;
  Panel: ComponentType<{ t: number }>;
};

export type PlayMode = "loop" | "once" | "still";

type Props = {
  panel: PanelModule;
  mode: PlayMode;
  /** Advance the clock (active step on screen, or a stacked panel in view). */
  playing: boolean;
  /** Bumped each time the step becomes active, so its story starts from the beginning. */
  run: number;
};

/**
 * Drives one panel's clock with requestAnimationFrame. The panel is a pure
 * function of t, so every frame is deterministic; the clock only runs while
 * `playing`, which pauses everything off screen.
 */
export default function PanelPlayer({ panel, mode, playing, run }: Props) {
  const { duration, settle, Panel } = panel;
  const [t, setT] = useState(0);
  const clock = useRef({ t: 0, run });

  useEffect(() => {
    if (mode === "still" || !playing) return;
    const c = clock.current;
    if (c.run !== run) Object.assign(c, { t: 0, run });
    if (mode === "once" && c.t >= settle) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      c.t += Math.min(now - last, 100) / 1000; // a long frame (tab switch) never skips the story
      last = now;
      if (mode === "loop") c.t %= duration;
      else if (c.t >= settle) {
        c.t = settle;
        setT(settle);
        return;
      }
      setT(c.t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, playing, run, duration, settle]);

  return <Panel t={mode === "still" ? settle : t} />;
}
