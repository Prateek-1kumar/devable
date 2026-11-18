"use client";

import { ArrowUp, Box, ChartColumn, Search, Target, Users } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "../services/kit";
import { ContentCard, CreatorCard, RedditCard, SearchCard } from "./cards";
import type { CardState } from "./clock";
import { BEATS, HEAD, INPUTS, OUTCOMES } from "./content";

const Engine3D = dynamic(() => import("./Engine3D"), { ssr: false });

// The Devable Growth System (homepage band). One composition on a fixed design stage (W × H), scaled as a whole
// to fit: product understanding on the left, the four services in a 2×2 around the Devable engine, business
// outcomes on the right, joined by soft tubes. Every element sits where it ends from the first frame; the scroll
// only moves focus.
//
// Desktop: the band pins for one beat per BEATS entry. 0 the engine, everything else soft. 1–4 one service at a
// time lifts out beside the engine (the engine stays in view) and plays its demo on its own clock; when the story
// moves on it docks: a signal runs its tube into the core and one bar of the D lights. 5 product understanding
// feeds in. 6 the outcomes light and the whole system runs. Scrolling past a beat skips its demo to the finished
// picture. Below lg: the parts stack and each card plays as it scrolls in. Reduced motion: the final frame, unpinned.

// ── Stage geometry (design px) ──────────────────────────────────────────────
const W = 1396;
const H = 596; // two card rows of ROW_H and a 96px gutter for the tubes
const PANEL_W = 208;
const CARD_W = 406;
const ROW_H = 250;
const C1 = 244; // left card column x
const C2 = 746; // right card column x
const R2 = H - ROW_H; // bottom row y
const CX = W / 2; // engine centre
const CY = H / 2;
const ENGINE = 112; // engine tile side (it sits turned 45°)
const HALF = Math.round((ENGINE / 2) * Math.SQRT2); // centre to a corner of the turned tile
const PANEL_H = 336;
const LIFT = 1.2; // how much a card grows when it takes focus

const ICON = { cube: Box, users: Users, target: Target, search: Search, bars: ChartColumn } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

// ── Browser facts, read without a hydration mismatch (the server assumes desktop, motion on, no WebGL) ──
const media = (q: string) => (cb: () => void) => {
  const m = window.matchMedia(q);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useMedia = (q: string, server: boolean) => useSyncExternalStore(media(q), () => window.matchMedia(q).matches, () => server);
let webgl: boolean | undefined;
const hasWebGL = () =>
  (webgl ??= (() => {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  })());
const useWebGL = () => useSyncExternalStore(() => () => {}, hasWebGL, () => false);

/* ── The four services: slot, card, tube ─────────────────────────────────────────────────────────── */

type Slot = { key: string; Card: ComponentType<{ state?: CardState; className?: string }>; x: number; y: number; side: -1 | 1; up: -1 | 1 };
const SLOTS: Slot[] = [
  { key: "content", Card: ContentCard, x: C1, y: 0, side: -1, up: -1 },
  { key: "search", Card: SearchCard, x: C2, y: 0, side: 1, up: -1 },
  { key: "creators", Card: CreatorCard, x: C1, y: R2, side: -1, up: 1 },
  { key: "reddit", Card: RedditCard, x: C2, y: R2, side: 1, up: 1 },
];

/** A card's tube: from the middle of the engine edge facing it, through the gutter, into the card's inner edge. */
function tube(s: Slot) {
  const x = s.side < 0 ? C1 + Math.round(CARD_W * 0.56) : C2 + Math.round(CARD_W * 0.44);
  const y = s.up < 0 ? ROW_H : R2;
  const ex = CX + s.side * HALF * 0.5;
  const ey = CY + s.up * HALF * 0.5;
  const lane = CY + s.up * 26;
  return `M${ex} ${ey} C${ex - s.side * 30} ${lane} ${x} ${lane} ${x} ${y}`;
}
const INPUT_TUBE = `M${PANEL_W} ${CY} H${CX - HALF}`;
const OUTPUT_TUBE = `M${CX + HALF} ${CY} H${W - PANEL_W - 10}`;

/** Where a card goes when it takes focus: beside the engine on its own side, vertically centred. */
function lift(s: Slot) {
  const w = CARD_W * LIFT;
  const cx = s.side < 0 ? CX - HALF - 26 - w / 2 : CX + HALF + 26 + w / 2;
  return { x: cx - (s.x + CARD_W / 2), y: CY - (s.y + ROW_H / 2) };
}

/* ── Engine ──────────────────────────────────────────────────────────────────────────────────────── */

function DMark({ lit, className }: { lit: number; className?: string }) {
  // The Devable D: four bars inside a D outline (straight left edge, rounded right). Each bar is one service.
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="gs-d">
          <path d="M6 4h14a16 16 0 0 1 16 16v0a16 16 0 0 1-16 16H6Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#gs-d)">
        {[0, 1, 2, 3].map((b) => (
          <rect
            key={b}
            x="6"
            y={4 + b * 8.5}
            width="32"
            height="6.4"
            className="transition-[fill] duration-700"
            style={{ fill: b < lit ? "var(--primary)" : "rgb(255 255 255 / 0.92)", transitionDelay: b < lit ? "450ms" : "0ms" }}
          />
        ))}
      </g>
    </svg>
  );
}

function Engine({ lit, active, three, style }: { lit: number; active: boolean; three: boolean; style?: CSSProperties }) {
  const [ready, setReady] = useState(false);
  const size = HALF * 2 + 64;
  return (
    <div className="absolute grid place-items-center" style={{ width: HALF * 2, height: HALF * 2, ...style }}>
      {/* Contact shadow under the tile. */}
      <span aria-hidden="true" className="absolute top-[58%] h-1/2 w-[86%] rounded-full bg-[radial-gradient(closest-side,rgb(23_44_33/0.32),transparent)] blur-[10px]" />
      {/* CSS tile: the server's picture, the fallback without WebGL, and what the 3D body replaces once ready. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute rotate-45 rounded-[26px] bg-[linear-gradient(135deg,#2b4a38_0%,#14271c_45%,#0b1610_100%)] shadow-[0_0_0_5px_#fff,0_0_0_6.5px_rgb(25_231_110/0.85),inset_0_1.5px_0_rgb(255_255_255/0.22),inset_0_-10px_22px_rgb(0_0_0/0.35),inset_0_0_0_1px_rgb(255_255_255/0.06)] transition-opacity duration-700",
          three && ready ? "opacity-0" : "opacity-100",
        )}
        style={{ width: ENGINE, height: ENGINE }}
      >
        <span className="absolute inset-[7px] rounded-[20px] bg-[linear-gradient(135deg,rgb(255_255_255/0.12),transparent_45%)]" />
      </div>
      {three && (
        <div aria-hidden="true" className={cn("pointer-events-none absolute transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")} style={{ width: size, height: size }}>
          <Engine3D lit={lit} active={active} size={size} onReady={() => setReady(true)} />
        </div>
      )}
      {/* A ring that rolls out once each time a service lands. */}
      <AnimatePresence>
        {lit > 0 && (
          <motion.span
            key={lit}
            aria-hidden="true"
            initial={{ opacity: 0.55, scale: 0.92, rotate: 45 }}
            animate={{ opacity: 0, scale: 1.45, rotate: 45 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.45 }}
            className="absolute rounded-[30px] border border-primary"
            style={{ width: ENGINE + 14, height: ENGINE + 14 }}
          />
        )}
      </AnimatePresence>
      <div className="relative flex flex-col items-center">
        <DMark lit={lit} className="size-[30px]" />
        <span className="mt-1 text-[13px] font-medium tracking-[-0.01em] text-white">Devable</span>
      </div>
    </div>
  );
}

/* ── Tubes and the signals that run them ─────────────────────────────────────────────────────────── */

function TubeSvg({ lit }: { lit: boolean[] }) {
  const paths = [...SLOTS.map(tube), INPUT_TUBE, OUTPUT_TUBE];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <linearGradient id="gs-tube" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#19e76e" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#19e76e" stopOpacity="0.26" />
          <stop offset="1" stopColor="#19e76e" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round" className="transition-opacity duration-700" style={{ opacity: lit[i] ? 1 : 0.35 }}>
          <path d={d} stroke="#e9fbf1" strokeWidth="12" />
          <path d={d} stroke="url(#gs-tube)" strokeWidth="12" />
          <path d={d} stroke="#fff" strokeOpacity="0.85" strokeWidth="4.5" />
          <path d={d} stroke="#19c862" strokeOpacity="0.75" strokeWidth="1.6" />
        </g>
      ))}
      <circle cx={PANEL_W} cy={CY} r="4.5" fill="#fff" stroke="#19c862" strokeWidth="1.6" className="transition-opacity duration-700" style={{ opacity: lit[4] ? 1 : 0.35 }} />
      <path
        d={`M${W - PANEL_W - 18} ${CY - 6} l8 6 -8 6`}
        fill="none"
        stroke="#19c862"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-opacity duration-700"
        style={{ opacity: lit[5] ? 1 : 0.35 }}
      />
    </svg>
  );
}

const SIGNAL_CSS = `
@keyframes gs-to-start { 0% { offset-distance: 100%; opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { offset-distance: 0%; opacity: 0 } }
@keyframes gs-to-end { 0% { offset-distance: 0%; opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0 } }
`;

/** A small green packet running a tube: `in` runs end → start (a card into the engine), `out` start → end. */
function Signal({ d, dir, duration = 1, delay = 0, loop = false }: { d: string; dir: "in" | "out"; duration?: number; delay?: number; loop?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0 left-0 h-[5px] w-4 rounded-full bg-[#19c862] shadow-[0_0_0_1.5px_#fff] motion-reduce:hidden"
      style={{
        offsetPath: `path("${d}")`,
        offsetRotate: "auto",
        opacity: 0,
        animation: `${dir === "in" ? "gs-to-start" : "gs-to-end"} ${duration}s cubic-bezier(0.45,0,0.25,1) ${delay}s ${loop ? "infinite" : "1 forwards"}`,
      }}
    />
  );
}

/* ── Side panels ─────────────────────────────────────────────────────────────────────────────────── */

const PANEL =
  "rounded-[18px] bg-white/90 p-4 shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.05),0_24px_44px_-30px_rgb(23_44_33/0.3)] backdrop-blur-[2px]";
const LABEL = "font-mono text-[10px] tracking-[0.12em] text-ink/45 uppercase";
const ROW_IN = "transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

function Inputs({ shown = true, style, className }: { shown?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <section aria-label={INPUTS.label} className={cn(PANEL, "flex flex-col", className)} style={style}>
      <p className={LABEL}>{INPUTS.label}</p>
      <ul className="mt-5 flex flex-1 flex-col justify-center gap-6">
        {INPUTS.rows.map((r, i) => {
          const Icon = ICON[r.icon];
          return (
            <li key={r.name} className={cn("flex gap-3", ROW_IN, shown ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-60")} style={{ transitionDelay: shown ? `${150 + i * 120}ms` : "0ms" }}>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-paper text-ink/75 shadow-[inset_0_0_0_1px_rgb(23_44_33/0.06)]">
                <Icon className="size-[17px]" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] leading-tight font-medium tracking-[-0.01em] text-ink">{r.name}</p>
                <p className="mt-1 text-[11.5px] leading-snug text-ink/50">{r.line}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Outcomes({ shown = true, style, className }: { shown?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <section aria-label={OUTCOMES.label} className={cn(PANEL, "flex flex-col", className)} style={style}>
      <p className={LABEL}>{OUTCOMES.label}</p>
      <ul className="mt-5 flex flex-1 flex-col justify-center gap-2.5">
        {OUTCOMES.rows.map((r, i) => {
          const Icon = ICON[r.icon];
          return (
            <li
              key={r.name}
              className={cn(
                "flex items-center gap-3 rounded-[12px] p-2 pr-2.5 transition-[background-color,box-shadow,opacity,translate] duration-500",
                shown ? "translate-x-0 bg-[linear-gradient(90deg,rgb(216_248_229/0.6),rgb(216_248_229/0.15))] opacity-100 shadow-[inset_0_0_0_1px_rgb(25_150_80/0.12)]" : "translate-x-2 bg-paper/60 opacity-60",
              )}
              style={{ transitionDelay: shown ? `${350 + i * 160}ms` : "0ms" }}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-white text-ink/80 shadow-[0_0_0_1px_rgb(23_44_33/0.07)]">
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <p className="min-w-0 flex-1 text-[13px] leading-tight font-medium tracking-[-0.01em] text-ink">{r.name}</p>
              <ArrowUp
                className={cn("size-4 shrink-0 text-[#16a34a] transition-[opacity,translate] duration-500", shown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0")}
                style={{ transitionDelay: shown ? `${550 + i * 160}ms` : "0ms" }}
                strokeWidth={2.4}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Scroll beats ────────────────────────────────────────────────────────────────────────────────── */

const COUNT = BEATS.length; // 0 intro · 1–4 services · 5 inputs · 6 outcomes
const FINAL = COUNT - 1;

/** The beat the pinned band is on, from how far its track has scrolled; `epoch` ticks on every change. */
function useBeat(track: RefObject<HTMLElement | null>, enabled: boolean) {
  const [s, setS] = useState({ beat: 0, epoch: 0 });
  useEffect(() => {
    const el = track.current;
    if (!el || !enabled) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      if (span <= 0) return;
      const p = Math.min(1, Math.max(0, -r.top / span));
      const beat = Math.min(FINAL, Math.floor(p * COUNT));
      setS((c) => (c.beat === beat ? c : { beat, epoch: c.epoch + 1 }));
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    ask();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
    };
  }, [track, enabled]);
  return s;
}

/* ── The stage, scaled to fit its box ────────────────────────────────────────────────────────────── */

const at = (x: number, y: number, w: number, h: number): CSSProperties => ({ left: x, top: y, width: w, height: h });

function Stage({ beat, epoch, onScreen, three }: { beat: number; epoch: number; onScreen: boolean; three: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.max(0.5, Math.min(1.12, el.clientWidth / W, el.clientHeight / (H + 24))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const focus = beat >= 1 && beat <= 4 ? beat - 1 : -1; // the lifted card, if any
  const docked = Math.min(4, Math.max(0, beat - 1)); // services landed so far
  const tubesLit = [...SLOTS.map((_, i) => beat > i + 1), beat >= 5, beat >= 6];

  return (
    <div ref={box} className="relative h-full w-full">
      <div className="absolute top-1/2 left-1/2" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div aria-hidden="true" className="absolute -inset-x-24 -inset-y-16 bg-[radial-gradient(42%_48%_at_50%_50%,rgb(23_44_33/0.06),transparent_70%)]" />
        <TubeSvg lit={tubesLit} />

        <motion.div
          className="absolute"
          style={at(0, CY - PANEL_H / 2, PANEL_W, PANEL_H)}
          initial={false}
          animate={{ opacity: beat >= 5 ? 1 : focus >= 0 ? 0.2 : 0.42, x: beat >= 5 ? 0 : -10 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Inputs shown={beat >= 5} className="h-full" />
        </motion.div>
        <motion.div
          className="absolute"
          style={at(W - PANEL_W, CY - PANEL_H / 2, PANEL_W, PANEL_H)}
          initial={false}
          animate={{ opacity: beat >= 6 ? 1 : focus >= 0 ? 0.2 : 0.42, x: beat >= 6 ? 0 : 10 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Outcomes shown={beat >= 6} className="h-full" />
        </motion.div>

        {SLOTS.map((s, i) => {
          const state: CardState = beat > i + 1 ? "done" : beat === i + 1 ? "play" : "ghost";
          const lifted = focus === i;
          const to = lift(s);
          return (
            <motion.div
              key={s.key}
              className="absolute"
              style={{ ...at(s.x, s.y, CARD_W, ROW_H), zIndex: lifted ? 30 : 10 }}
              initial={false}
              animate={{
                x: lifted ? to.x : 0,
                y: lifted ? to.y : 0,
                scale: lifted ? LIFT : 1,
                opacity: lifted ? 1 : state === "done" ? (focus >= 0 ? 0.3 : 1) : focus >= 0 ? 0.16 : 0.4,
                filter: state === "ghost" && !lifted ? "saturate(0.2)" : "saturate(1)",
              }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <s.Card
                key={state === "play" ? `play-${epoch}` : "rest"}
                state={state}
                className={cn("h-full transition-shadow duration-700", lifted && "shadow-[0_0_0_1px_rgb(23_44_33/0.08),0_2px_4px_rgb(23_44_33/0.06),0_50px_80px_-40px_rgb(23_44_33/0.55)]")}
              />
            </motion.div>
          );
        })}

        {/* Signals: one per dock as the story moves on, then the whole system running in the final frame. */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <style href="gs-signals" precedence="default">{SIGNAL_CSS}</style>
          {beat >= 2 && beat <= 5 && <Signal key={`dock-${epoch}`} d={tube(SLOTS[beat - 2])} dir="in" duration={1.1} delay={0.5} />}
          {beat === 5 && <Signal key={`in-${epoch}`} d={INPUT_TUBE} dir="out" duration={1.3} delay={0.9} />}
          {beat === FINAL && <Signal key={`out-${epoch}`} d={OUTPUT_TUBE} dir="out" duration={1.3} delay={0.2} />}
          {beat === FINAL && onScreen && (
            <>
              {SLOTS.map((s, i) => (
                <Signal key={s.key} d={tube(s)} dir="in" duration={1.6} delay={1.8 + i * 0.45} loop />
              ))}
              <Signal d={INPUT_TUBE} dir="out" duration={2.2} delay={1.6} loop />
              <Signal d={OUTPUT_TUBE} dir="out" duration={2.2} delay={2.7} loop />
            </>
          )}
        </div>

        <Engine lit={docked} active={onScreen} three={three} style={{ left: CX - HALF, top: CY - HALF, zIndex: 25 }} />
      </div>
    </div>
  );
}

/* ── Small screens: the parts stacked, each card playing as it scrolls in ──────────────────────────── */

function StackCard({ Card, reduced }: { Card: Slot["Card"]; reduced: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.45);
  return (
    <div ref={ref}>
      <Card state={reduced ? "done" : seen ? "play" : "ghost"} />
    </div>
  );
}

export default function GrowthSystem() {
  const track = useRef<HTMLElement>(null);
  const reduced = useMedia("(prefers-reduced-motion: reduce)", false);
  const desktop = useMedia("(min-width: 1024px)", true);
  const pinned = desktop && !reduced;
  const three = useWebGL() && pinned;
  const { beat: scrolled, epoch } = useBeat(track, pinned);
  const beat = pinned ? scrolled : FINAL;

  // Pause the 3D engine and the final frame's signals while the band is off screen.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <section ref={track} aria-labelledby="growth-system-title" className="relative bg-white lg:h-[640vh] lg:motion-reduce:h-auto">
        <div className="px-5 pt-20 pb-16 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:pt-[104px] lg:pb-5 lg:motion-reduce:static lg:motion-reduce:h-auto lg:motion-reduce:pb-16">
          <header className="mx-auto max-w-[46rem] shrink-0 text-center">
            <h2 id="growth-system-title" className="text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink lg:text-[clamp(1.8rem,min(2.8vw,5vh),2.6rem)]">
              {HEAD.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[44rem] text-[1rem] leading-relaxed text-pretty text-ink/60 lg:mt-2">{HEAD.sub}</p>
            {/* Where the story is. */}
            <div className="mt-3 hidden h-6 items-center justify-center lg:flex lg:motion-reduce:hidden" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={beat}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex items-center gap-2 rounded-full bg-paper px-3 py-1 font-mono text-[10.5px] tracking-[0.1em] text-ink/60 uppercase shadow-[inset_0_0_0_1px_rgb(23_44_33/0.06)]"
                >
                  <span className={cn("size-1.5 rounded-full", beat === 0 ? "bg-ink/30" : "bg-primary")} />
                  {BEATS[beat]}
                </motion.p>
              </AnimatePresence>
            </div>
          </header>

          <div className="mx-auto mt-4 hidden min-h-0 w-full max-w-[90rem] flex-1 lg:block lg:motion-reduce:h-[640px] lg:motion-reduce:flex-none">
            <Stage beat={beat} epoch={epoch} onScreen={onScreen} three={three} />
          </div>

          {/* Below lg: the same parts, stacked in reading order. */}
          <div className="mx-auto mt-10 flex max-w-[26rem] flex-col gap-4 lg:hidden">
            <Inputs />
            <div className="relative mx-auto my-2 size-[140px]">
              <Engine lit={4} active={false} three={false} style={{ left: 70 - HALF, top: 70 - HALF }} />
            </div>
            {SLOTS.map((s) => (
              <StackCard key={s.key} Card={s.Card} reduced={reduced} />
            ))}
            <Outcomes />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
