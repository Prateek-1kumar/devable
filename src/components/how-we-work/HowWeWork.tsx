"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { STILL_OVERVIEW } from "./content";
import {
  IGNITE_TRACK_TOP,
  LATCH,
  PINNED_QUERY,
  PINNED_VH,
  SMOOTHING,
  activePhase,
  beatAt,
  beatP,
  clamp01,
  damp,
  journey,
  phaseAt,
  railFill,
  readDevParams,
  stepFill,
  type Beat,
} from "./journey";
import StepColumn from "./StepColumn";

// The 3D bundle loads only when the pinned story is about to scroll in.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

const dev = process.env.NODE_ENV !== "production";
const noop = () => () => {};
const subscribePinned = (onChange: () => void) => {
  const mq = window.matchMedia(PINNED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
let gl2: boolean | undefined;
const hasGl2 = () =>
  (gl2 ??= (() => {
    const c = document.createElement("canvas").getContext("webgl2");
    c?.getExtension("WEBGL_lose_context")?.loseContext(); // the probe must not hold a live context
    return !!c;
  })());
const hasParam = (key: string) => dev && window.location.search.includes(key);
const STEPS = [1, 2, 3, 4, 5] as const;

function Still() {
  return <Image src={STILL_OVERVIEW} alt="" fill sizes="100vw" className="object-cover" />;
}

/** If the scene throws, the stage keeps the overview still instead of a blank canvas. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[how-we-work] scene failed to render", error);
  }
  render() {
    return this.state.failed ? <Still /> : this.props.children;
  }
}

/**
 * How we work: a lighthouse built while you scroll. On wide screens the stage pins and the copy column
 * switches step by step over the 3D story; everywhere else it is one stacked column of stills and copy.
 */
export default function HowWeWork() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pinned = useSyncExternalStore(subscribePinned, () => window.matchMedia(PINNED_QUERY).matches, () => false);
  const webgl = useSyncExternalStore(noop, hasGl2, () => false);
  const shooting = useSyncExternalStore(noop, () => hasParam("hww"), () => false);
  const clean = useSyncExternalStore(noop, () => hasParam("hwwClean=1"), () => false);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => readDevParams(window.location.search), []);

  // Mount the scene ~1.5 screens early; run it only while the track is on screen.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const early = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "150% 0px" });
    // …or at the first idle moment after load, so the mount (chunk, geometry, env bake) never lands mid-scroll.
    const idle = window.setTimeout(() => (window.requestIdleCallback ?? ((f: () => void) => f()))(() => setNear(true)), 1500);
    const seen = new IntersectionObserver(([e]) => {
      journey.onScreen = e.isIntersecting;
      setOnScreen(e.isIntersecting);
      if (e.isIntersecting) setEntered(true);
    });
    early.observe(el);
    seen.observe(el);
    return () => {
      window.clearTimeout(idle);
      early.disconnect();
      seen.disconnect();
    };
  }, []);

  // The driver: scroll → smoothed progress, the clock, latches and loop clocks, then CSS vars for the column
  // and rail. Runs first each frame, before the canvas, and only while the track is on screen.
  useEffect(() => {
    const el = track.current;
    const box = stage.current;
    if (!el || !box || !pinned) return;
    let raf = 0;
    let last = 0;
    let primed = false;
    let beat: Beat | null = null;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect(); // measured every frame: never cache the track's offset
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      const j = journey;
      j.time = j.frozen ?? now / 1000;
      j.target = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
      const snap = !primed || j.snapOnce || j.frozen !== null || j.frozenLoop !== null;
      j.progress = j.forced ?? (snap ? j.target : damp(j.progress, j.target, SMOOTHING, dt));
      j.snapOnce = false;
      primed = true;
      j.phase = phaseAt(j.progress);
      for (let i = 0; i < 5; i++) {
        if (j.latchedAt[i] === null && j.progress >= LATCH[i]) j.latchedAt[i] = j.time;
        const at = j.latchedAt[i];
        j.loopT[i] = j.frozenLoop !== null ? j.frozenLoop + i * j.loopOffset : at === null ? 0 : j.time - at;
      }
      if (j.igniteAt === Infinity && r.top <= IGNITE_TRACK_TOP * window.innerHeight) j.igniteAt = j.time;
      j.frames++;
      activePhase.set(j.phase);

      const k = j.phase - 1;
      const live = k >= 0 && k < 5;
      const next: Beat = !live ? -1 : j.frozenLoop === null && j.latchedAt[k] === null ? -2 : beatAt(j.loopT[k]);
      const s = box.style;
      s.setProperty("--hww-p", j.progress.toFixed(4));
      s.setProperty("--hww-rail", railFill(j.progress).toFixed(4));
      for (const n of STEPS) s.setProperty(`--hww-f${n}`, stepFill(n, j.progress).toFixed(4));
      s.setProperty("--hww-beat-p", live ? beatP(j.loopT[k]).toFixed(4) : "0");
      box.dataset.phase = String(j.phase);
      if (next !== beat) {
        beat = next;
        box.dataset.beat = String(next);
        // The checklist reads a number: the rest shows every item done, before the latch none.
        s.setProperty("--hww-beat", String(next === -1 ? 5 : next === -2 ? -1 : next));
        s.setProperty("--hww-next", next === -2 ? "1" : "0");
      }
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      primed = false;
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      activePhase.set(0);
    };
  }, [pinned]);

  const overlay = clean ? "hidden!" : ""; // important: beats the pinned layout's display utilities

  return (
    <section id="how-we-work" aria-labelledby="how-we-work-title" className="relative isolate overflow-x-clip bg-white">
      <div
        ref={track}
        data-shot-target={dev ? "" : undefined}
        style={{ "--hww-track": `${(PINNED_VH + 1) * 100}svh` } as CSSProperties}
        className="relative hww-pinned:h-(--hww-track)"
      >
        <div ref={stage} data-phase="0" data-beat="-1" className="relative hww-pinned:sticky hww-pinned:top-0 hww-pinned:h-svh hww-pinned:overflow-hidden">
          {/* The canvas box, faded into the page white at the top and bottom. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden hww-pinned:block [mask-image:linear-gradient(to_bottom,transparent_40px,rgb(0_0_0/0.55)_110px,#000_180px,#000_calc(100%-118px),transparent_calc(100%-36px))]"
          >
            {pinned &&
              (webgl ? (
                <SceneBoundary>{(near || shooting) && <Scene key="pinned" active={onScreen} />}</SceneBoundary>
              ) : (
                <Still />
              ))}
          </div>
          <StepColumn entered={entered} className={overlay} />
        </div>
      </div>
    </section>
  );
}
