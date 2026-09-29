"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { clamp01, damp } from "../growth-engine/ease";
import MissionCopy, { StillExtras } from "./MissionCopy";
import MissionHud, { type DomNodes } from "./MissionHud";
import type { Progress } from "./Scene";
import { altKm, arrayGo, beatAt, captionAt, craftR, firstLit, met, payloadGo, pipeline, R0, scrimOpacity, scrollS, skyAt, status, STILL_QUERY, storyP, theta, velKms } from "./timeline";

// Mission DVB-01, the pinned hero: a tall section whose sticky frame holds the
// copy, the 3D world and its instruments. One smoothed scroll progress (0..1)
// drives all of it. Phones and reduced motion get one composed still frame at
// normal height (CSS decides pinning, the same query decides the scene mode).

// The 3D bundle loads after the page, so the headline paints instantly.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(STILL_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// Lenis already smooths the scroll; this only absorbs frame jitter on top of it.
const SMOOTHING = 20;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const write = (el: HTMLElement | null | undefined, s: string) => {
  if (el && el.textContent !== s) el.textContent = s;
};
const flag = (el: HTMLElement | null | undefined, name: string, on: boolean) => {
  const v = on ? "true" : "false";
  if (el && el.getAttribute(name) !== v) el.setAttribute(name, v);
};

const sky0 = skyAt(0);
/** The server-rendered sky (p 0); the loop rewrites it before the first pinned paint. */
const SKY_START = { "--sky-z": sky0.z, "--sky-h": sky0.h } as CSSProperties;
const sky1 = skyAt(1);
/** The still (phones, reduced motion): space. */
const SKY_STILL = { "--sky-z": sky1.z, "--sky-h": sky1.h } as CSSProperties;

export default function MissionHero() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(STILL_QUERY).matches, () => true);
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const progress = useRef<Progress>({ shown: 0 });
  const dom = useRef<DomNodes>(new Map());
  const span = useRef({ top: 0, span: 1 });
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState(0);
  const [beat, setBeat] = useState(0);
  const [padShadows, setPadShadows] = useState(true);
  const lenis = useLenis();
  const lenisRef = useRef<Lenis | undefined>(undefined);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Screenshot and test hook: the scroll fraction for a story p.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __missionScrollS?: typeof scrollS }).__missionScrollS = scrollS;
  }, []);

  // The scroll loop: a DOM rAF that runs only while the hero is on screen. A layout effect, so a
  // mid-hero reload paints its own sky, never the pad's.
  useLayoutEffect(() => {
    const el = section.current;
    if (still || !el || !onScreen) return;
    const box = span.current;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const [top, span] = [r.top + window.scrollY, Math.max(1, el.offsetHeight - window.innerHeight)];
      const s = scrolled();
      const moved = box.span > 1 && (Math.abs(top - box.top) > 0.5 || Math.abs(span - box.span) > 0.5);
      box.top = top;
      box.span = span;
      // A resize or zoom mid-hero keeps the story where it was, instead of jumping by the span change.
      if (moved && s > 0 && s < 1) {
        const y = top + s * span;
        if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo({ top: y, behavior: "instant" });
      }
    };
    // The section scroll fraction, read from Lenis's animated scroll when it runs.
    const scrolled = () => clamp01(((lenisRef.current?.animatedScroll ?? window.scrollY) - box.top) / box.span);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    const pr = progress.current;
    pr.shown = storyP(scrolled()); // a mid-page reload lands on its frame, never replays
    let beatNow = -1;
    let captionNow = -2;
    let padNow: boolean | null = null;
    let inkNow: "light" | "dark" | undefined;

    const writeDom = (p: number, s: number) => {
      const n = dom.current;
      const h = (key: string) => n.get(key);
      const r = craftR(p);
      const th = theta(p);
      write(h("met"), met(p));
      const st = status(p);
      write(h("status"), st.text);
      flag(h("status"), "data-act", st.act);
      const alt = altKm(p, r);
      write(h("alt"), `${alt} KM`);
      flag(h("karman"), "data-on", alt >= 100 && alt < 160);
      write(h("nowVal"), String(alt));
      write(h("residualVal"), `−${Math.max(0, (100 * (R0 - r)) / R0).toFixed(1)}%`);
      h("scrim")?.style.setProperty("opacity", scrimOpacity(p).toFixed(3));
      write(h("vel"), `${velKms(p, r).toFixed(2)} KM/S`);
      const pipe = `+${Math.round(pipeline(p))}%`;
      write(h("pipe"), pipe);
      flag(h("altField"), "data-on", p >= 0.125);
      flag(h("velField"), "data-on", p >= 0.125);
      flag(h("pipeField"), "data-on", p >= 0.685);
      h("rail")?.style.setProperty("--p", s.toFixed(4)); // the rail tracks scroll linearly
      for (let i = 0; i < 4; i++) {
        write(h(`go${i}`), arrayGo(p, i) ? "GO" : "—");
        flag(h(`go${i}`), "data-go", arrayGo(p, i));
      }
      flag(h("allGo"), "data-on", p >= 0.102 && payloadGo(p));
      for (let k = 0; k < 5; k++) flag(h(`mark${k}`), "data-lit", firstLit(k, th));
      write(h("outcome"), pipe);

      // The sky behind the canvas and the ink over it.
      const pn = panel.current;
      if (pn) {
        const sky = skyAt(p, inkNow);
        pn.style.setProperty("--sky-z", sky.z);
        pn.style.setProperty("--sky-h", sky.h);
        if (sky.ink !== inkNow) pn.setAttribute("data-ink", (inkNow = sky.ink));
      }

      const b = beatAt(p, beatNow);
      if (b !== beatNow) setBeat((beatNow = b));
      const ps = p < 0.3; // the pad's contact shadow: only while the pad is on screen (the apron is gone by 0.36)
      if (ps !== padNow) setPadShadows((padNow = ps));
      const c = captionAt(p, captionNow);
      if (c !== captionNow) setCaption((captionNow = c));
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const s = scrolled();
      pr.shown = damp(pr.shown, storyP(s), SMOOTHING, dt);
      writeDom(pr.shown, s);
    };
    writeDom(pr.shown, scrolled());
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [still, onScreen]);

  const jump = useCallback((at: number) => {
    const { top, span: s } = span.current;
    const to = top + scrollS(at) * s;
    const l = lenisRef.current;
    if (!l) return window.scrollTo({ top: to, behavior: "smooth" });
    const ds = Math.abs(to - l.animatedScroll) / s;
    l.scrollTo(to, { duration: 1.1 + 1.3 * Math.min(1, ds / 0.35), easing: easeInOutCubic });
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
    <section ref={section} aria-labelledby="hero-title" className="relative motion-safe:lg:h-[1000svh]">
      <a
        href="#trusted"
        className="sr-only focus:not-sr-only focus:fixed focus:top-24 focus:left-[8vw] focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-mono focus:text-xs"
      >
        Skip the launch sequence
      </a>
      <div className="relative flex flex-col gap-10 px-6 pt-32 pb-16 sm:px-12 lg:grid lg:min-h-svh lg:content-center lg:gap-8 lg:px-[8vw] lg:py-24 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:h-svh motion-safe:lg:overflow-hidden motion-safe:lg:py-0">
        {/* The feed panel (desktop): a rounded frame under the navbar holding the sky, the scene and every
            instrument, so the navbar stays on white. On phones it is layout-transparent. */}
        <div
          ref={panel}
          data-ink={still ? "still" : "light"}
          className="mission-panel contents lg:absolute lg:inset-x-3 lg:top-[88px] lg:bottom-3 lg:grid lg:content-center lg:gap-8 lg:overflow-hidden lg:rounded-[24px] lg:px-[calc(8vw-12px)] lg:[background:linear-gradient(180deg,var(--sky-z)_0%,var(--sky-h)_72%,var(--sky-h)_100%)]"
          style={still ? SKY_STILL : SKY_START}
        >
          <MissionCopy caption={still ? 0 : caption} pinned={!still} bind={bind} />
          <StillExtras className="relative z-10 motion-safe:lg:hidden" />
          {/* Phones: a square card of space under the copy. Desktop: the whole panel. */}
          <div
            aria-hidden="true"
            className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#03060d] ring-1 ring-black/5 transition-opacity duration-700 lg:absolute lg:inset-0 lg:aspect-auto lg:w-auto lg:rounded-none lg:bg-transparent lg:ring-0"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <Scene key={String(still)} still={still} active={onScreen} progress={progress} labels={still ? undefined : dom} padShadows={padShadows} onReady={onReady} />
          </div>
          {!still && (
            <>
              {/* The copy scrim: shade behind the caption column over space (the loop writes its opacity). */}
              <div
                ref={bind("scrim")}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1] hidden bg-[linear-gradient(90deg,rgb(2_5_12/0.55)_0,rgb(2_5_12/0.3)_38%,transparent_58%)] opacity-0 motion-safe:lg:block"
              />
              <MissionHud className="hidden motion-safe:lg:block" beat={beat} ready={ready} bind={bind} onJump={jump} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

