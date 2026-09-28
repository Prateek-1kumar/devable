"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import ChannelParagraph from "../ChannelParagraph";
import WaveButton from "../WaveButton";
import { CHANNELS } from "../growth-engine/channels";
import { anchors, setProgress } from "./store";
import { BEATS, DAMP, SECTION_SVH, beatAt, clamp01, damp, growth, mastRise, readout, sparkline, subAt } from "./timeline";
import { SECTIONS } from "./track";

// "The Long Race": the hero as a pinned, scroll-scrubbed stadium model.
// Sprints spike. Distance compounds. Devable runs both.
// The copy is server-rendered and works above the fold; the 3D loads after.
// Layout is CSS-first (lg: pins, motion-reduce: un-pins), so SSR never shifts;
// JS only picks still vs. scrub. Every visual state is a pure function of p.

const RaceScene = dynamic(() => import("./RaceScene"), { ssr: false });

// Phones and reduced-motion users get one composed still frame.
const STILL_QUERY = "(max-width: 1023px), (prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(STILL_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const noop = () => () => {};

const rise = "animate-fade-up motion-reduce:animate-none";
const MONO = "font-mono text-[11px] uppercase tracking-[0.12em]";
// Copy fades out over p 0.05 → 0.09.
const OUT = "clamp(0, (var(--p, 0) - 0.05) * 25, 1)";

// Tailwind needs literal class names, so each beat's "active" classes are spelled out.
const CAPTION = "[grid-area:1/1] opacity-0 translate-y-4 transition duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]";
const SHOW: Record<number, string> = {
  1: "group-data-[beat=1]/race:opacity-100 group-data-[beat=1]/race:translate-y-0 group-data-[beat=1]/race:duration-500 group-data-[beat=1]/race:delay-150",
  2: "group-data-[beat=2]/race:opacity-100 group-data-[beat=2]/race:translate-y-0 group-data-[beat=2]/race:duration-500 group-data-[beat=2]/race:delay-150",
  3: "group-data-[beat=3]/race:opacity-100 group-data-[beat=3]/race:translate-y-0 group-data-[beat=3]/race:duration-500 group-data-[beat=3]/race:delay-150",
  4: "group-data-[beat=4]/race:opacity-100 group-data-[beat=4]/race:translate-y-0 group-data-[beat=4]/race:duration-500 group-data-[beat=4]/race:delay-150",
  5: "group-data-[beat=5]/race:opacity-100 group-data-[beat=5]/race:translate-y-0 group-data-[beat=5]/race:duration-500 group-data-[beat=5]/race:delay-150",
  6: "group-data-[beat=6]/race:opacity-100 group-data-[beat=6]/race:translate-y-0 group-data-[beat=6]/race:duration-500 group-data-[beat=6]/race:delay-150",
};
const RAIL_ACTIVE = [
  "group-data-[beat=0]/race:text-foreground",
  "group-data-[beat=1]/race:text-foreground",
  "group-data-[beat=2]/race:text-foreground",
  "group-data-[beat=3]/race:text-foreground",
  "group-data-[beat=4]/race:text-foreground",
  "group-data-[beat=5]/race:text-foreground",
  "group-data-[beat=6]/race:text-foreground",
];
const SUB = [
  "group-data-[sub=0]/race:opacity-100 group-data-[sub=0]/race:translate-y-0",
  "group-data-[sub=1]/race:opacity-100 group-data-[sub=1]/race:translate-y-0",
  "group-data-[sub=2]/race:opacity-100 group-data-[sub=2]/race:translate-y-0",
];
// Platforms, in the order they're named; each inks to its channel's deep color once its mast is up.
const PLATFORMS: { key: string; name: string; ink: string }[] = [
  { key: "hn", name: "Hacker News", ink: "group-data-[hn=1]/race:text-[#4338ca]" },
  { key: "g", name: "Google", ink: "group-data-[g=1]/race:text-[#0369a1]" },
  { key: "gpt", name: "ChatGPT", ink: "group-data-[gpt=1]/race:text-[#0369a1]" },
  { key: "rd", name: "Reddit", ink: "group-data-[rd=1]/race:text-[#047857]" },
  { key: "yt", name: "YouTube", ink: "group-data-[yt=1]/race:text-[#b45309]" },
];

// The HUD sparkline: the sprint spike and its fade, the compounding curve, the launch on top of it.
const COMPOUND = Array.from({ length: 16 }, (_, i) => {
  const t = i / 15;
  return `${(150 * t).toFixed(1)} ${(40 - (28 * (Math.exp(2.6 * t) - 1)) / (Math.exp(2.6) - 1)).toFixed(2)}`;
}).join(" L");
const SPARK = [
  { d: "M0 40 L10 40 C14 40 16 6 20 6 C26 6 30 32 44 36 L60 38", stroke: "#f5b301", width: 1.5 },
  { d: `M${COMPOUND}`, stroke: "#0f1a14", width: 1.25 },
  { d: "M150 12 C153 12 155 2 158 2 C162 2 165 8 170 9", stroke: "#f5b301", width: 1.5 },
];

function Caption({ beat, kicker, children }: { beat: number; kicker: string; children: ReactNode }) {
  return (
    <div className={`${CAPTION} ${SHOW[beat]}`}>
      <p className={`${MONO} text-foreground/50`}>{kicker}</p>
      {children}
    </div>
  );
}
const LINE = "mt-3 text-[clamp(2.25rem,3.6vw,3.5rem)] leading-[1.02] font-normal tracking-[-0.04em] text-foreground";
const SUPPORT = "mt-4 max-w-[24rem] text-lg leading-relaxed text-foreground/60";

export default function RaceHero() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(STILL_QUERY).matches, () => true);
  // Mount the 3D once, after hydration, when "still" is known (the server snapshot is only a guess).
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const readoutEl = useRef<HTMLParagraphElement>(null);
  const figureEl = useRef<HTMLParagraphElement>(null);
  const spark = useRef<(SVGPathElement | null)[]>([]);
  const [active, setActive] = useState(true);

  const onReady = useCallback(() => {
    if (canvasBox.current) canvasBox.current.dataset.ready = "true";
  }, []);

  // Render the scene only while the hero is on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll → weighted progress p → camera progress (trailing like an operator).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (still) {
      // The still frame tells the whole story; the copy is always fully shown.
      setProgress(1, 1);
      el.style.setProperty("--p", "0");
      if (copy.current) copy.current.inert = false;
      return;
    }

    // Write each DOM value only when it changes.
    const last: Record<string, string> = {};
    let beat = -1;
    const attr = (name: string, value: string) => {
      if (last[name] === value) return;
      last[name] = value;
      el.setAttribute(name, value);
    };
    const flag = (name: string, on: boolean) => attr(`data-${name}`, on ? "1" : "0");
    const writeDom = (p: number) => {
      const pStr = p.toFixed(4);
      if (last.p !== pStr) {
        last.p = pStr;
        el.style.setProperty("--p", pStr);
      }
      beat = beatAt(p, beat);
      attr("data-beat", String(beat));
      attr("data-sub", String(subAt(beat, p)));
      flag("tool", p >= 0.07 && p < 0.175);
      flag("devable", p >= 0.12 && p < 0.26);
      flag("aside", p >= 0.43 && p < 0.48);
      flag("cta", p >= 0.95);
      flag("roll", p >= 0.905);
      SECTIONS.forEach((s, i) => flag(s.key, mastRise(i, p) >= 0.8));
      if (copy.current && copy.current.inert !== p > 0.09) copy.current.inert = p > 0.09;
      if (cta.current && cta.current.inert !== p < 0.95) cta.current.inert = p < 0.95;
      const text = readout(p);
      if (readoutEl.current && last.readout !== text) {
        last.readout = text;
        readoutEl.current.textContent = text;
      }
      const figure = `+${growth(p)}%`; // counts up with the monolith's display
      if (figureEl.current && last.figure !== figure) {
        last.figure = figure;
        figureEl.current.textContent = figure;
      }
      sparkline(p).forEach((k, i) => {
        const v = (1 - k).toFixed(3);
        const path = spark.current[i];
        if (path && last[`s${i}`] !== v) {
          last[`s${i}`] = v;
          path.style.strokeDashoffset = v;
        }
      });
    };

    const target = () => {
      const r = el.getBoundingClientRect();
      return clamp01(-r.top / Math.max(1, r.height - innerHeight));
    };

    // Dev: ?p=0.42 freezes the whole hero at that progress (for framing screenshots).
    if (process.env.NODE_ENV !== "production") {
      const fixed = new URLSearchParams(location.search).get("p");
      if (fixed !== null && !Number.isNaN(Number(fixed))) {
        const p = clamp01(Number(fixed));
        setProgress(p, p);
        writeDom(p);
        return;
      }
    }

    let p = target();
    let cam = p; // a restored scroll position doesn't whip
    let raf = 0;
    let lastT = 0;
    setProgress(p, cam);
    writeDom(p);
    const tick = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 1 / 30);
      lastT = now;
      const t = target();
      p = Math.abs(t - p) < 1e-5 ? t : damp(p, t, DAMP.p, dt);
      cam = Math.abs(p - cam) < 1e-5 ? p : damp(cam, p, DAMP.cam, dt);
      setProgress(p, cam);
      writeDom(p);
      raf = Math.abs(t - p) > 1e-4 || Math.abs(p - cam) > 1e-4 ? requestAnimationFrame(tick) : 0;
      if (!raf) {
        // Settle exactly; an idle page does no work.
        p = cam = t;
        setProgress(t, t);
        writeDom(t);
      }
    };
    const kick = () => {
      if (raf) return;
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", kick);
      removeEventListener("resize", kick);
    };
  }, [still]);

  const jump = (to: number) => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + to * (el.offsetHeight - innerHeight), behavior: "smooth" });
  };

  const anchor = (name: string) => (node: HTMLDivElement | null) => {
    if (node) anchors.set(name, node);
    else anchors.delete(name);
  };

  return (
    <section
      ref={root}
      id="hero"
      data-beat="0"
      data-sub="0"
      style={{ "--p": 0, "--race-h": `${SECTION_SVH}svh` } as CSSProperties}
      className="group/race relative lg:h-(--race-h) lg:motion-reduce:h-auto"
    >
      {/* The sticky frame is the only element that clips: no ancestor may, or sticky breaks. */}
      <div className="relative lg:sticky lg:top-0 lg:h-svh lg:overflow-clip lg:motion-reduce:static lg:motion-reduce:h-auto lg:motion-reduce:min-h-svh">
        {/* Opening copy: server-rendered, fades up and away as the race begins. */}
        <div
          ref={copy}
          className="relative z-10 px-6 pt-32 pb-10 sm:px-12 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:justify-center lg:px-[8vw] lg:pt-24 lg:pb-0"
          style={{ opacity: `calc(1 - ${OUT})`, transform: `translateY(calc(${OUT} * -24px))` }}
        >
          <div className="max-w-[38rem] text-foreground lg:max-w-[min(38rem,44vw)]">
            <h1 className={`text-[clamp(2.6rem,4.6vw,4.4rem)] leading-[1.02] font-normal tracking-[-0.045em] ${rise}`} style={{ animationDelay: "0.1s" }}>
              Growth Marketing for AI&#8209;Native DevTools and Platforms
            </h1>
            <ChannelParagraph
              className={`mt-6 max-w-[30rem] text-lg leading-relaxed tracking-[-0.01em] text-foreground/60 sm:text-xl ${rise}`}
              style={{ animationDelay: "0.25s" }}
            />
            <div className={`mt-10 flex flex-wrap items-center gap-4 ${rise}`} style={{ animationDelay: "0.4s" }}>
              <WaveButton href="#contact">Speak with the team</WaveButton>
              <WaveButton href="#case-studies" tone="secondary">
                View case studies
              </WaveButton>
            </div>
            <p className={`mt-8 ${MONO} text-foreground/55 lg:motion-safe:hidden ${rise}`} style={{ animationDelay: "0.55s" }}>
              Sprints spike. Distance compounds. Devable runs both.
            </p>
          </div>
        </div>

        {/* The stadium. Fades in once its first frame is on screen. */}
        <div
          ref={canvasBox}
          aria-hidden="true"
          className="relative aspect-[4/5] w-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100 lg:absolute lg:inset-0 lg:aspect-auto lg:w-auto lg:motion-reduce:left-[40%]"
        >
          {hydrated && <RaceScene key={String(still)} still={still} active={active} onReady={onReady} />}
          <Callout name="YOUR TOOL" align="left" show="group-data-[tool=1]/race:opacity-100" nodeRef={anchor("tool")} />
          <Callout name="DEVABLE" align="above" show="group-data-[devable=1]/race:opacity-100" nodeRef={anchor("devable")} />
        </div>

        {/* Page fog: the model dissolves into white behind the copy column, so type always sits on paper. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5] hidden lg:block lg:motion-reduce:hidden"
          style={{ background: "linear-gradient(90deg, rgb(255 255 255 / 0.97) 0%, rgb(255 255 255 / 0.9) 30%, rgb(255 255 255 / 0.55) 43%, rgb(255 255 255 / 0) 56%)" }}
        />

        {/* Beat captions, stacked in one cell; data-beat on the section picks one. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[calc(8vw+24rem)] items-center pl-[8vw] lg:flex lg:motion-reduce:hidden">
          <div className="grid w-full pt-10">
            <Caption beat={1} kicker="01 · The baton">
              <h2 className={LINE}>Your tool is the baton.</h2>
              <p className={SUPPORT}>Hand it to one team that runs every lane.</p>
            </Caption>
            <Caption beat={2} kicker="02 · The start">
              <h2 className={`${LINE} grid`}>
                {["On your marks.", "Set.", "Go."].map((line, i) => (
                  <span key={line} className={`[grid-area:1/1] translate-y-2 opacity-0 transition duration-300 ${SUB[i]}`}>
                    {line}
                  </span>
                ))}
              </h2>
              <ul className="mt-6 grid w-max grid-cols-2 gap-x-8 gap-y-2 font-mono text-[12px] uppercase tracking-[0.08em] whitespace-nowrap text-foreground/60">
                {CHANNELS.map((c) => (
                  <li key={c.n}>
                    <span style={{ color: c.deep }}>{c.n}</span> {c.name}
                  </li>
                ))}
              </ul>
            </Caption>
            <Caption beat={3} kicker="03 · Sprint · Lane 04">
              <h2 className={LINE}>Sprints hit fast.</h2>
              <p className={SUPPORT}>Launches and creator campaigns. Kicked off in 48 hours, peaking within days.</p>
              <p className={`mt-5 ${MONO} text-foreground/55 opacity-0 transition-opacity duration-500 group-data-[aside=1]/race:opacity-100`}>
                Attention spikes. Then it fades.
              </p>
            </Caption>
            <Caption beat={4} kicker="04 · Distance · Lanes 01–03">
              <h2 className={LINE}>Distance compounds.</h2>
              <p className={SUPPORT}>Technical content, search, AI visibility and community. Every lap builds on the last.</p>
            </Caption>
            <Caption beat={5} kicker="05 · Both">
              <h2 className={LINE}>Launch into a full stadium.</h2>
              <p className={SUPPORT}>Distance fills the stands. Sprints land harder when they&apos;re already full.</p>
            </Caption>
            <Caption beat={6} kicker="06 · Finish">
              <p
                ref={figureEl}
                className="mt-4 font-heading text-[clamp(4rem,7vw,7rem)] leading-none tracking-[-0.05em] tabular-nums text-foreground opacity-0 transition-opacity duration-500 group-data-[roll=1]/race:opacity-100"
              >
                +312%
              </p>
              <p className={`mt-2 ${MONO} text-foreground/50`}>pipeline growth</p>
              <h2 className={`${LINE} mt-6`}>Devable runs both.</h2>
              <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-foreground/55">Sprints spike. Distance compounds.</p>
              <div
                ref={cta}
                inert
                className="pointer-events-auto mt-8 flex w-max items-center gap-4 opacity-0 transition-opacity duration-500 group-data-[cta=1]/race:opacity-100"
              >
                <WaveButton href="#contact">Speak with the team</WaveButton>
                <WaveButton href="#case-studies" tone="secondary">
                  View case studies
                </WaveButton>
              </div>
            </Caption>
          </div>
        </div>

        {/* HUD: race clock, sparkline, platforms, and the chapter rail. */}
        <div className="absolute inset-x-0 bottom-0 z-10 hidden px-[8vw] pb-9 lg:block lg:motion-reduce:hidden">
          <div aria-hidden="true" className="flex items-end justify-between gap-8">
            <div className="flex items-end gap-5">
              <svg viewBox="0 0 180 44" width={180} height={44} fill="none" className="shrink-0 overflow-visible">
                <line x1="0" y1="40.5" x2="180" y2="40.5" stroke="#0f1a14" strokeOpacity="0.12" />
                {SPARK.map((s, i) => (
                  <path
                    key={i}
                    ref={(el) => {
                      spark.current[i] = el;
                    }}
                    d={s.d}
                    stroke={s.stroke}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset="1"
                  />
                ))}
              </svg>
              <p ref={readoutEl} className={`${MONO} whitespace-nowrap text-foreground/60 tabular-nums`}>
                STATUS · READY
              </p>
            </div>
            <p className={`${MONO} whitespace-nowrap`}>
              {PLATFORMS.map((pl, i) => (
                <span key={pl.key}>
                  {i > 0 && <span className="text-foreground/20"> · </span>}
                  <span className={`text-foreground/30 transition-colors duration-500 ${pl.ink}`}>{pl.name}</span>
                </span>
              ))}
            </p>
          </div>
          <nav aria-label="Hero chapters" className="relative mt-5 h-px bg-foreground/15">
            {BEATS.map((b, i) => (
              <button
                key={b.label}
                type="button"
                onClick={() => jump(b.jump)}
                aria-label={`Jump to ${b.label}`}
                className={`absolute top-[-3px] cursor-pointer pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/40 transition-colors duration-300 hover:text-foreground/80 focus-visible:text-foreground focus-visible:outline-none ${RAIL_ACTIVE[i]}`}
                style={{ left: `${b.start * 100}%` }}
              >
                <span aria-hidden="true" className="absolute top-0 left-0 h-[7px] w-px bg-foreground/30" />
                {b.label}
              </button>
            ))}
            <span aria-hidden="true" className="absolute -top-1 size-[9px] rounded-[2px] bg-[#0b0c0e]" style={{ left: "calc(var(--p) * 100% - 4.5px)" }} />
          </nav>
        </div>
      </div>
    </section>
  );
}

/**
 * A mono label on a hairline, pinned by the scene to a 3D point (canvas px).
 * "above" stands on the point; "left" reaches in from the left (for things that fly near the top).
 */
function Callout({ name, show, align, nodeRef }: { name: string; show: string; align: "above" | "left"; nodeRef: (node: HTMLDivElement | null) => void }) {
  const left = align === "left";
  return (
    <div
      ref={nodeRef}
      data-align={align}
      className={`pointer-events-none absolute top-0 left-0 hidden items-center opacity-0 transition-opacity duration-300 lg:flex lg:motion-reduce:hidden ${left ? "flex-row pr-5" : "flex-col"} ${show}`}
    >
      <span className={`${MONO} whitespace-nowrap text-foreground/70`}>{name}</span>
      <span className={`bg-foreground/30 ${left ? "ml-3 h-px w-12" : "mt-2 h-9 w-px"}`} />
    </div>
  );
}
