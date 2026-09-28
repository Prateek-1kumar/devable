"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { clamp01, damp } from "../growth-engine/ease";
import MissionCopy, { StillExtras } from "./MissionCopy";
import MissionHud, { type DomNodes } from "./MissionHud";
import type { Progress } from "./Scene";
import { altKm, arrayGo, beatAt, captionAt, craftR, firstLit, met, payloadGo, pipeline, status, theta, velKms } from "./timeline";

// Mission DVB-01, the pinned hero: a tall section whose sticky frame holds the
// copy, the 3D world and its instruments. One smoothed scroll progress (0..1)
// drives all of it. Phones and reduced motion get one composed still frame at
// normal height (CSS decides pinning, the same query decides the scene mode).

// The 3D bundle loads after the page, so the headline paints instantly.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

// Exactly the complement of Tailwind's `motion-safe:lg:` (lg is 64rem, which follows the browser font size).
const STILL_QUERY = "(width < 64rem), (prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(STILL_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const SMOOTHING = 4.5;
const write = (el: HTMLElement | null | undefined, s: string) => {
  if (el && el.textContent !== s) el.textContent = s;
};
const flag = (el: HTMLElement | null | undefined, name: string, on: boolean) => {
  const v = on ? "true" : "false";
  if (el && el.getAttribute(name) !== v) el.setAttribute(name, v);
};

export default function MissionHero() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(STILL_QUERY).matches, () => true);
  const section = useRef<HTMLElement>(null);
  const progress = useRef<Progress>({ shown: 0 });
  const dom = useRef<DomNodes>(new Map());
  const span = useRef({ top: 0, span: 1 });
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The scroll loop: a DOM rAF that runs only while the hero is on screen.
  useEffect(() => {
    const el = section.current;
    if (still || !el || !onScreen) return;
    const box = span.current;
    const measure = () => {
      const r = el.getBoundingClientRect();
      box.top = r.top + window.scrollY;
      box.span = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    const target = () => clamp01((window.scrollY - box.top) / box.span);
    const pr = progress.current;
    pr.shown = target(); // a mid-page reload lands on its frame, never replays
    let beatNow = -1;
    let captionNow = -2;

    const writeDom = (p: number) => {
      const n = dom.current;
      const h = (key: string) => n.get(key);
      const r = craftR(p);
      const th = theta(p);
      write(h("met"), met(p));
      const st = status(p);
      write(h("status"), st.text);
      flag(h("status"), "data-act", st.act);
      write(h("alt"), `${altKm(p, r)} KM`);
      write(h("vel"), `${velKms(p, r).toFixed(2)} KM/S`);
      const pipe = `+${Math.round(pipeline(p))}%`;
      write(h("pipe"), pipe);
      flag(h("altField"), "data-on", p >= 0.125);
      flag(h("velField"), "data-on", p >= 0.125);
      flag(h("pipeField"), "data-on", p >= 0.685);
      h("rail")?.style.setProperty("--p", p.toFixed(4));
      for (let i = 0; i < 4; i++) {
        write(h(`go${i}`), arrayGo(p, i) ? "GO" : "—");
        flag(h(`go${i}`), "data-go", arrayGo(p, i));
      }
      flag(h("allGo"), "data-on", p >= 0.102 && payloadGo(p));
      for (let k = 0; k < 5; k++) flag(h(`mark${k}`), "data-lit", firstLit(k, th));
      write(h("outcome"), pipe);

      const b = beatAt(p, beatNow);
      if (b !== beatNow) setBeat((beatNow = b));
      const c = captionAt(p, captionNow);
      if (c !== captionNow) setCaption((captionNow = c));
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      pr.shown = damp(pr.shown, target(), SMOOTHING, dt);
      writeDom(pr.shown);
    };
    writeDom(pr.shown);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [still, onScreen]);

  const jump = useCallback((at: number) => {
    const { top, span: s } = span.current;
    window.scrollTo({ top: top + at * s, behavior: "smooth" });
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const bind = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) dom.current.set(key, el);
      else dom.current.delete(key);
    },
    [],
  );

  return (
    <section ref={section} aria-labelledby="hero-title" className="relative motion-safe:lg:h-[500svh]">
      <a
        href="#trusted"
        className="sr-only focus:not-sr-only focus:fixed focus:top-24 focus:left-[8vw] focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-mono focus:text-xs"
      >
        Skip the launch sequence
      </a>
      <div className="relative flex flex-col gap-10 px-6 pt-32 pb-16 sm:px-12 lg:grid lg:min-h-svh lg:content-center lg:gap-8 lg:px-[8vw] lg:py-24 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:h-svh motion-safe:lg:overflow-hidden motion-safe:lg:py-0">
        <MissionCopy caption={still ? 0 : caption} pinned={!still} bind={bind} />
        <div
          aria-hidden="true"
          className="relative -mx-6 aspect-square w-[calc(100%+3rem)] transition-opacity duration-700 sm:-mx-12 sm:w-[calc(100%+6rem)] lg:absolute lg:inset-0 lg:mx-0 lg:aspect-auto lg:w-auto"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <Scene key={String(still)} still={still} active={onScreen} progress={progress} labels={still ? undefined : dom} onReady={onReady} />
        </div>
        <StillExtras className="relative z-10 motion-safe:lg:hidden" />
        {!still && <MissionHud className="hidden motion-safe:lg:block" beat={beat} ready={ready} bind={bind} onJump={jump} />}
      </div>
    </section>
  );
}

