"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

export type PanelModule = {
  /** Loop length in seconds. */
  duration: number;
  /** The frame shown when motion is reduced. */
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

export default function PanelPlayer({ panel, mode, playing, run }: Props) {
  const { duration, settle, Panel } = panel;
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

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      c.t = (c.t + Math.min(now - last, 100) / 1000) % duration;
      last = now;
      setT(c.t);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, playing, run, duration]);

  return <Panel t={mode === "still" ? settle : !playing ? 0 : t} />;
}
