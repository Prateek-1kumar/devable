"use client";

import { ArrowUp, Box, ChartColumn, Search, Target, Users } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useSpring } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "../services/kit";
import { ContentCard, CreatorCard, RedditCard, SearchCard } from "./cards";
import type { CardState } from "./clock";
import { BEATS, HEAD, INPUTS, OUTCOMES } from "./content";

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
const W = 1424;
const H = 624; // two card rows of ROW_H and a 124px gutter for the hub and its feeds
const PANEL_W = 208;
const CARD_W = 406;
const ROW_H = 250;
const C1 = 244; // left card column x
const C2 = 774; // right card column x (a 124px gutter between the columns)
const R2 = H - ROW_H; // bottom row y
const CX = W / 2; // hub centre
const CY = H / 2;
const HUB = 104; // hub diameter
const ARC_R = 60; // radius of the progress arc around it
const FEED_R = 67; // where the lines meet the hub
const HALF = HUB / 2;
const PANEL_H = 336;
const LIFT = 1.22; // how much a card grows when it takes focus

const ICON = { cube: Box, users: Users, target: Target, search: Search, bars: ChartColumn } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

// ── Browser facts, read without a hydration mismatch (the server assumes desktop, motion on) ──
const media = (q: string) => (cb: () => void) => {
  const m = window.matchMedia(q);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useMedia = (q: string, server: boolean) => useSyncExternalStore(media(q), () => window.matchMedia(q).matches, () => server);

/* ── The four services: slot, card, tube ─────────────────────────────────────────────────────────── */

type Slot = { key: string; Card: ComponentType<{ state?: CardState; className?: string }>; x: number; y: number; side: -1 | 1; up: -1 | 1 };
const SLOTS: Slot[] = [
  { key: "content", Card: ContentCard, x: C1, y: 0, side: -1, up: -1 },
  { key: "search", Card: SearchCard, x: C2, y: 0, side: 1, up: -1 },
  { key: "creators", Card: CreatorCard, x: C1, y: R2, side: -1, up: 1 },
  { key: "reddit", Card: RedditCard, x: C2, y: R2, side: 1, up: 1 },
];

/**
 * The lines. Each service has its own curved feed: it leaves the middle of the card's inner edge, runs into the
 * gutter and bends into the hub, the two upper feeds meeting at its top and the two lower at its bottom, like
 * cables converging on a socket. Product understanding comes in from the left as a quieter dotted line; the
 * output leaves on the right as a solid line that splits into the four outcome rows. Every path runs in the
 * direction its signal travels (cards and inputs into the hub, the hub out to outcomes).
 */
type Line = { d: string; angle: number };
const pt = (deg: number, r: number) => [Math.round(CX + r * Math.cos((deg * Math.PI) / 180)), Math.round(CY + r * Math.sin((deg * Math.PI) / 180))];
/** Where each service's feed meets the hub, in degrees (screen coordinates, 0 = right, 90 = down). */
const FEED_ANGLE = [-122, -58, 122, 58];
const feed = (s: Slot, angle: number): Line => {
  const x = s.side < 0 ? C1 + CARD_W - 8 : C2 + 8; // starts just under the card's inner edge
  const y = s.up < 0 ? Math.round(ROW_H * 0.55) : Math.round(R2 + ROW_H * 0.45);
  const [ex, ey] = pt(angle, FEED_R);
  const [cx2, cy2] = pt(angle, FEED_R + 46);
  return { d: `M${x} ${y} C${x - s.side * 52} ${y} ${cx2} ${cy2} ${ex} ${ey}`, angle };
};
const FEEDS = SLOTS.map((s, i) => feed(s, FEED_ANGLE[i]));
const INPUT = `M${PANEL_W + 6} ${CY} H${CX - FEED_R}`;
/** Row centres of the outcomes panel, from its layout (padding, label, centred list of 48px rows, 10px gaps). */
const OUT_ROWS = [0, 1, 2, 3].map((i) => Math.round(CY - PANEL_H / 2 + 98.5 + i * 58));
const OUT_X = W - PANEL_W - 6; // just short of the panel
const OUTPUTS = OUT_ROWS.map((y) => `M${CX + FEED_R} ${CY} H${OUT_X - 74} C${OUT_X - 34} ${CY} ${OUT_X - 40} ${y} ${OUT_X} ${y}`);

/**
 * How a card takes focus: it grows in its own quadrant, anchored at its inner corner (the one facing the engine),
 * so it opens outward, away from the core. It then steps a little further out and is nudged back inside the
 * stage's top or bottom edge if it would cross it.
 */
const ROOM = 14; // px a lifted card may overhang the stage's top or bottom edge
function lift(s: Slot) {
  const h = ROW_H * LIFT;
  const dx = s.side * 28;
  const dy = s.up < 0 ? Math.max(0, -ROOM - (ROW_H - h)) : -Math.max(0, R2 + h - (H + ROOM));
  return { x: dx, y: dy, originX: s.side < 0 ? 1 : 0, originY: s.up < 0 ? 1 : 0 };
}

/**
 * The focused card's 3D: it leans a few degrees toward the cursor (from a resting lean that faces its quadrant
 * out to the viewer), the glare on its face follows, and its preview layers part from it in depth.
 */
function Tilt({ active, side, up, children }: { active: boolean; side: -1 | 1; up: -1 | 1; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const spring = { stiffness: 140, damping: 20, mass: 0.8 };
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  useEffect(() => {
    const el = ref.current;
    const base = { x: up < 0 ? 2.5 : -2.5, y: side < 0 ? -3.5 : 3.5 };
    if (!active || !el) {
      rx.set(0);
      ry.set(0);
      return;
    }
    rx.set(base.x);
    ry.set(base.y);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      ry.set(base.y + px * 6);
      rx.set(base.x - py * 5);
      el.style.setProperty("--gx", `${Math.round(50 + px * 45)}%`);
      el.style.setProperty("--gy", `${Math.round(30 + py * 40)}%`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [active, side, up, rx, ry]);
  return (
    <motion.div ref={ref} className="h-full [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200, ["--glare" as string]: active ? 0.55 : 0 }}>
      {children}
    </motion.div>
  );
}

/* ── Engine ──────────────────────────────────────────────────────────────────────────────────────── */

/** The Devable D: four bars inside a D outline (straight left edge, rounded right). */
function DMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="gs-d">
          <path d="M6 4h14a16 16 0 0 1 16 16v0a16 16 0 0 1-16 16H6Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#gs-d)" fill="currentColor">
        {[0, 1, 2, 3].map((b) => (
          <rect key={b} x="6" y={4 + b * 8.5} width="32" height="6.4" />
        ))}
      </g>
    </svg>
  );
}

/** An arc of the hub's progress ring, centred on `angle`, `span` degrees wide, at radius ARC_R around (0, 0). */
function arc(angle: number, span: number) {
  const a0 = ((angle - span / 2) * Math.PI) / 180;
  const a1 = ((angle + span / 2) * Math.PI) / 180;
  const f = (n: number) => Math.round(n * 100) / 100;
  return `M${f(ARC_R * Math.cos(a0))} ${f(ARC_R * Math.sin(a0))} A${ARC_R} ${ARC_R} 0 0 1 ${f(ARC_R * Math.cos(a1))} ${f(ARC_R * Math.sin(a1))}`;
}

/**
 * The hub: a raised porcelain puck in the cards' own material (a soft top light, a recessed face, layered
 * shadows), the Devable D in ink. Around it a hairline ring holds four arcs, one where each service's feed comes
 * in; each draws itself green as that service docks, and a soft ring rolls out once.
 */
function Engine({ lit, sides, style }: { lit: number; sides: boolean[]; style?: CSSProperties }) {
  const box = ARC_R * 2 + 12;
  return (
    <div className="absolute grid place-items-center" style={{ width: HUB, height: HUB, ...style }}>
      {/* Progress ring. */}
      <svg aria-hidden="true" viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`} className="pointer-events-none absolute" style={{ width: box, height: box }}>
        <circle r={ARC_R} fill="none" stroke="rgb(23 44 33 / 0.08)" strokeWidth="1" />
        {sides.map((on, i) => (
          <path
            key={i}
            d={arc(FEED_ANGLE[i], 44)}
            pathLength={1}
            fill="none"
            stroke="#16b058"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeDasharray="1 1"
            style={{ strokeDashoffset: on ? 0 : 1, transition: "stroke-dashoffset 0.9s cubic-bezier(0.45,0,0.25,1) 0.9s" }}
          />
        ))}
      </svg>
      {/* A soft ring that rolls out once each time a service lands. */}
      <AnimatePresence>
        {lit > 0 && (
          <motion.span
            key={lit}
            aria-hidden="true"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 1.1 }}
            className="absolute rounded-full border border-primary/70"
            style={{ width: HUB, height: HUB }}
          />
        )}
      </AnimatePresence>
      {/* The puck. */}
      <div
        className="relative grid size-full place-items-center rounded-full bg-[linear-gradient(180deg,#ffffff_0%,#f1f4f2_100%)] shadow-[inset_0_1px_0_#fff,inset_0_-2px_3px_rgb(23_44_33/0.06),0_0_0_1px_rgb(23_44_33/0.07),0_2px_3px_rgb(23_44_33/0.08),0_16px_26px_-12px_rgb(23_44_33/0.32),0_36px_56px_-28px_rgb(23_44_33/0.4)]"
      >
        <div className="absolute inset-[9px] rounded-full bg-[radial-gradient(circle_at_50%_28%,#ffffff_0%,#f4f6f5_70%)] shadow-[inset_0_1px_2px_rgb(23_44_33/0.12),inset_0_-1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.03)]" />
        <div className="relative flex flex-col items-center text-ink">
          <DMark className="size-[28px]" />
          <span className="mt-1 text-[11.5px] font-medium tracking-[-0.01em]">Devable</span>
        </div>
      </div>
      <span className="sr-only">Devable: {lit} of 4 services connected</span>
    </div>
  );
}

/* ── Lines: hairlines at rest, drawn green as each part connects, and a soft pulse running through ──── */

const LINE_CSS = `
@keyframes gs-pulse { from { stroke-dashoffset: 0.32 } to { stroke-dashoffset: -1 } }
.gs-pulse { animation: gs-pulse var(--dur) cubic-bezier(0.4, 0, 0.3, 1) var(--delay) var(--count) both; }
@media (prefers-reduced-motion: reduce) { .gs-pulse { display: none } }
`;

/** A soft band of light sweeping a path once (or on a loop): a blurred, brighter stretch of the line. */
function Pulse({ d, duration = 1.6, delay = 0, loop = false }: { d: string; duration?: number; delay?: number; loop?: boolean }) {
  const style = { "--dur": `${duration}s`, "--delay": `${delay}s`, "--count": loop ? "infinite" : "1" } as CSSProperties;
  return (
    <g style={style} fill="none" strokeLinecap="round">
      <path className="gs-pulse" d={d} pathLength={1} stroke="#4ff09a" strokeOpacity="0.55" strokeWidth="7" strokeDasharray="0.32 2" filter="url(#gs-soft)" />
      <path className="gs-pulse" d={d} pathLength={1} stroke="#7cf7b8" strokeWidth="2" strokeDasharray="0.32 2" filter="url(#gs-soft-sm)" />
    </g>
  );
}

/** One line: a hairline track and the green that draws along it when `on`. */
function Track({ d, on, dotted = false, delay = 0.25 }: { d: string; on: boolean; dotted?: boolean; delay?: number }) {
  if (dotted)
    return (
      <path
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeWidth="2"
        strokeDasharray="0.1 6"
        className="transition-[stroke] duration-700"
        style={{ stroke: on ? "#16b058" : "rgb(23 44 33 / 0.28)", transitionDelay: on ? `${delay}s` : "0s" }}
      />
    );
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="rgb(23 44 33 / 0.13)" strokeWidth="1" />
      <path
        d={d}
        pathLength={1}
        stroke="#16b058"
        strokeWidth="1.6"
        strokeDasharray="1 1"
        style={{ strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 1s cubic-bezier(0.45,0,0.25,1) ${on ? delay : 0}s` }}
      />
    </g>
  );
}

function Wires({ lit, beat, epoch, live }: { lit: boolean[]; beat: number; epoch: number; live: boolean }) {
  const [inOn, outOn] = [lit[4], lit[5]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <filter id="gs-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="gs-soft-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <style>{LINE_CSS}</style>
      {FEEDS.map((f, i) => (
        <Track key={i} d={f.d} on={lit[i]} />
      ))}
      <Track d={INPUT} on={inOn} dotted />
      {OUTPUTS.map((d, i) => (
        <Track key={i} d={d} on={outOn} delay={0.25 + i * 0.12} />
      ))}
      {/* Arrowheads into the outcome rows. */}
      {OUT_ROWS.map((y, i) => (
        <path
          key={i}
          d={`M${OUT_X - 5} ${y - 4} l5 4 -5 4`}
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-[stroke] duration-500"
          style={{ stroke: outOn ? "#16b058" : "rgb(23 44 33 / 0.25)", transitionDelay: outOn ? `${1 + i * 0.12}s` : "0s" }}
        />
      ))}

      {/* One pulse as each part connects; in the final frame a pulse sweeps each line in turn. */}
      {beat >= 2 && beat <= 5 && <Pulse key={`dock-${epoch}`} d={FEEDS[beat - 2].d} delay={0.2} />}
      {beat === 5 && <Pulse key={`in-${epoch}`} d={INPUT} duration={1.8} delay={0.5} />}
      {beat === FINAL && OUTPUTS.map((d, i) => <Pulse key={`out-${epoch}-${i}`} d={d} duration={1.8} delay={0.3} />)}
      {live && (
        <>
          <Pulse d={INPUT} duration={2.4} delay={2.2} loop />
          {FEEDS.map((f, i) => (
            <Pulse key={`f${i}`} d={f.d} duration={2.2} delay={2.8 + i * 0.6} loop />
          ))}
          {OUTPUTS.map((d, i) => (
            <Pulse key={`o${i}`} d={d} duration={2.4} delay={3.6 + i * 0.25} loop />
          ))}
        </>
      )}
    </svg>
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

function Stage({ beat, epoch, onScreen }: { beat: number; epoch: number; onScreen: boolean }) {
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
  const wiresLit = [...SLOTS.map((_, i) => beat > i + 1), beat >= 5, beat >= 6];

  return (
    <div ref={box} className="relative h-full w-full">
      <div className="absolute top-1/2 left-1/2" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div aria-hidden="true" className="absolute -inset-x-24 -inset-y-16 bg-[radial-gradient(42%_48%_at_50%_50%,rgb(23_44_33/0.06),transparent_70%)]" />
        <Wires lit={wiresLit} beat={beat} epoch={epoch} live={beat === FINAL && onScreen} />

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
              style={{ ...at(s.x, s.y, CARD_W, ROW_H), zIndex: lifted ? 30 : 10, originX: to.originX, originY: to.originY }}
              initial={false}
              animate={{
                x: lifted ? to.x : 0,
                y: lifted ? to.y : 0,
                scale: lifted ? LIFT : 1,
                opacity: lifted ? 1 : state === "done" ? (focus >= 0 ? 0.3 : 1) : focus >= 0 ? 0.16 : 0.4,
                filter: state === "ghost" && !lifted ? "saturate(0.2)" : "none",
              }}
              transition={{ duration: 1.1, ease: EASE }}
            >
              <Tilt active={lifted} side={s.side} up={s.up}>
                <s.Card
                  key={state === "play" ? `play-${epoch}` : "rest"}
                  state={state}
                  className={cn("h-full transition-shadow duration-700", lifted && "shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.08),0_2px_4px_rgb(23_44_33/0.06),0_24px_40px_-24px_rgb(23_44_33/0.35),0_60px_90px_-50px_rgb(23_44_33/0.6)]")}
                />
              </Tilt>
            </motion.div>
          );
        })}

        <Engine lit={docked} sides={wiresLit.slice(0, 4)} style={{ left: CX - HALF, top: CY - HALF, zIndex: 25 }} />
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
            <Stage beat={beat} epoch={epoch} onScreen={onScreen} />
          </div>

          {/* Below lg: the same parts, stacked in reading order. */}
          <div className="mx-auto mt-10 flex max-w-[26rem] flex-col gap-4 lg:hidden">
            <Inputs />
            <div className="relative mx-auto my-2 size-[140px]">
              <Engine lit={4} sides={[true, true, true, true]} style={{ left: 70 - HALF, top: 70 - HALF }} />
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
