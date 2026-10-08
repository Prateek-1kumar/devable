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
 * After completion (at `settle`), the card remains in that completed state
 * for 15 seconds before smoothly replaying if it is still in the viewport.
 */
const HOLD_SECONDS = 15;

export default function PanelPlayer({ panel, mode, playing, run }: Props) {
  const { settle, Panel } = panel;
  const [t, setT] = useState(0);
  const clock = useRef({ t: 0, run, hasStarted: false });

  useEffect(() => {
    if (mode === "still" || !playing) {
      clock.current.hasStarted = false;
      clock.current.t = 0;
      return;
    }

    const c = clock.current;
    if (!c.hasStarted || c.run !== run) {
      c.t = 0;
      c.run = run;
      c.hasStarted = true;
    }

    const totalCycle = settle + HOLD_SECONDS;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      c.t += Math.min(now - last, 100) / 1000;
      last = now;

      // After holding the complete state for 15s, replay if still in viewport
      if (c.t >= totalCycle) {
        c.t = 0;
      }

      // Advance t smoothly through totalCycle (settle + 15s hold) so continuous flow animations run
      setT(c.t);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, playing, run, settle]);

  return <Panel t={mode === "still" ? settle : !playing ? 0 : t} />;
}
