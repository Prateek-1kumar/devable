"use client";

import { Box, Check, FileText, Search, Sparkles, TriangleAlert, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PROBLEM } from "./content";
import { clamp01, io3, linear, seg, useStill } from "./play";

// The three visuals on the Problem board, one per card. Each is a quiet dark scene with the content team's own
// words in it; the colour logic is the hero's: brand green is what is right, coral is what is missing or blocked.
//   Depth         One article, shallow on a single "Product summary" layer, then built up: a Shallow / Technical
//                 switch slides across, its title retypes itself and a green spine grows down through four layers,
//                 each lighting as it is reached. The missing layers wait as dashed slots.
//   Direction     Product relevance against audience / search demand. Four topics land in their quadrants, a scan
//                 passes over the three that miss, and the one that is both relevant and wanted lights up, with its own tile
//                 turning green and glowing.
//   Distribution  A published article sends a packet to Search, AI search and Communities; each is turned back at a
//                 blocked port on the channel's edge. The packets keep trying, quietly, while the card is on screen.
// One clock per card, in seconds, running while the card is in view (pausing off-screen). Reduced motion: each
// scene's finished picture.

/** The card's clock: seconds since it first scrolled into view, running only while it is on screen. */
export function useScene() {
  const ref = useRef<HTMLLIElement>(null);
  const still = useStill();
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      setT((v) => v + (last ? (now - last) / 1000 : 0));
      last = now;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(raf);
        last = 0;
        if (e.isIntersecting) raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [still]);
  return [ref, still ? 9 : t, still] as const;
}

const PAPER = "#f7f6f1";
const GREEN = "#19e76e";
const CORAL = "var(--accent)";
const mix = (a: string, b: string, k: number) => `color-mix(in srgb, ${a} ${Math.round(clamp01(k) * 100)}%, ${b})`;
const rise = (v: number, px = 10): CSSProperties => ({ opacity: v, transform: `translateY(${(1 - v) * px}px)` });

// ── 1 · Technical depth ──────────────────────────────────────────────────────────────────────────────────────

const ICON = { product: Box, docs: FileText, users: Users, edge: TriangleAlert } as const;

/** A paper placeholder line. */
const Line = ({ w, tone }: { w: number; tone: number }) => <span className="block h-[7px] rounded-full" style={{ width: `${w}%`, background: `rgb(23 44 33 / ${0.09 + 0.09 * tone})` }} />;

const ROW_H = 30;
const ROW_GAP = 4;
const SP = 4.5; // px, the spine's centre from the left of the layer list; ports and stubs are measured from it
const INDENT = 22; // px, where the layer pills start
const LEAD = 10; // px the spine runs up to meet the article
const centre = (j: number) => LEAD + ROW_H / 2 + j * (ROW_H + ROW_GAP);
const SPINE = centre(3);

export function Depth({ t }: { t: number }) {
  const { tag, shallow, deep, layers } = PROBLEM.visuals.depth;
  const intro = seg(t, 0.15, 1);
  const d = seg(t, 1.9, 4.6, io3); // 0 = shallow, 1 = technical
  const typed = Math.round(deep.title.length * seg(d, 0.2, 0.7, linear));
  const reach = centre(0) + (SPINE - centre(0)) * seg(d, 0.15, 0.92, linear); // how far down the green spine has grown, px
  const lit = (j: number) => (j === 0 ? seg(d, 0.1, 0.3) : seg(reach, centre(j) - 10, centre(j) + 2));
  const label0 = seg(d, 0.1, 0.3);
  const all = [{ label: layers[0].label, icon: "product" as const }, ...layers.slice(1)];

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-4 pb-5">
      {/* Shallow or technical: the thumb slides across as the article deepens. */}
      <div className="relative mx-auto grid grid-cols-2 rounded-full bg-white/[0.05] p-[3px] text-[0.74rem] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06),inset_0_1px_2px_rgb(0_0_0/0.35)]" style={rise(intro, 4)}>
        <span className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full" style={{ transform: `translateX(${d * 100}%)`, background: mix("rgb(25 231 110 / 0.18)", "rgb(255 255 255 / 0.1)", d), boxShadow: `inset 0 0 0 1px ${mix("rgb(25 231 110 / 0.4)", "rgb(255 255 255 / 0.12)", d)}` }} />
        <span className="relative px-4 py-1.5 text-center" style={{ color: mix("rgb(255 255 255 / 0.9)", "rgb(255 255 255 / 0.4)", 1 - d) }}>
          {shallow.name}
        </span>
        <span className="relative px-4 py-1.5 text-center" style={{ color: mix("rgb(255 255 255 / 0.95)", "rgb(255 255 255 / 0.4)", d) }}>
          {deep.name}
        </span>
      </div>

      <article className="relative z-10 mt-3 rounded-[14px] p-3" style={{ background: PAPER, ...rise(intro, 14), transform: `translateY(${(1 - intro) * 14 - 3 * d}px)`, boxShadow: `0 1px 2px rgb(0 0 0 / 0.3), 0 ${12 + 10 * d}px ${24 + 8 * d}px -12px rgb(0 0 0 / ${0.55 + 0.15 * d})` }}>
        <span className="inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium" style={{ background: mix("#d8f8e5", "#e8e7e1", d), color: mix("#1a7f47", "#6b7570", d) }}>
          {tag}
        </span>
        <div className="relative mt-2" style={{ height: `${1.15 + 1.15 * seg(d, 0.2, 0.5)}rem` }}>
          <p className="absolute inset-x-0 text-[1rem] leading-[1.15] font-semibold tracking-[-0.025em] text-ink" style={{ opacity: 1 - seg(d, 0, 0.2) }}>
            {shallow.title}
          </p>
          <p className="text-[1rem] leading-[1.15] font-semibold tracking-[-0.025em] text-ink">
            {deep.title.slice(0, typed)}
            <span className="ml-px inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-accent" style={{ opacity: typed > 0 && typed < deep.title.length ? 1 : 0 }} />
            <span className="opacity-0">{deep.title.slice(typed)}</span>
          </p>
        </div>
        <div className="mt-2.5 space-y-[6px]">
          <Line w={100} tone={d} />
          <Line w={90 + 10 * d} tone={d} />
        </div>
      </article>

      {/* What it stands on: a spine grows down from the article, lighting each layer as it reaches it. */}
      <div className="relative" style={{ paddingTop: LEAD, paddingLeft: INDENT }}>
        <span aria-hidden="true" className="absolute w-px bg-white/12" style={{ left: SP - 0.5, top: 0, height: SPINE }} />
        <span aria-hidden="true" className="absolute w-px" style={{ left: SP - 0.5, top: 0, height: reach, background: mix(GREEN, "rgb(255 255 255 / 0.35)", seg(d, 0.1, 0.4)) }} />
        <ol className="flex flex-col" style={{ gap: ROW_GAP }}>
          {all.map((l, j) => {
            const m = lit(j);
            const Icon = ICON[l.icon as keyof typeof ICON];
            return (
              <li key={l.label} className="relative" style={{ height: ROW_H }}>
                {/* the port on the spine and the stub across to the layer */}
                <span aria-hidden="true" className="absolute top-1/2 h-px -translate-y-1/2" style={{ left: SP - INDENT, width: INDENT - SP, background: mix("rgb(25 231 110 / 0.55)", "rgb(255 255 255 / 0.12)", m) }} />
                <span aria-hidden="true" className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full ring-[3px] ring-[#0e0e0e]" style={{ left: SP - INDENT - 4, background: mix(GREEN, "rgb(255 255 255 / 0.25)", m) }} />
                {/* a dashed slot until the layer exists */}
                {j > 0 && <span aria-hidden="true" className="absolute inset-0 rounded-[10px] border border-dashed border-white/[0.09]" style={{ opacity: 1 - m }} />}
                <span className="absolute inset-0 flex items-center gap-2.5 rounded-[10px] bg-[linear-gradient(180deg,#1b1b1b,#141414)] px-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.055),inset_0_1px_0_rgb(255_255_255/0.08),0_8px_14px_-10px_rgb(0_0_0/0.9)]" style={{ opacity: j === 0 ? 1 : m, transform: `translateX(${(1 - (j === 0 ? 1 : m)) * 8}px)` }}>
                  <Icon className="size-[15px] shrink-0" strokeWidth={1.8} style={{ color: mix(GREEN, "rgb(255 255 255 / 0.45)", m) }} />
                  <span className="grid text-[0.8rem] leading-none [&>*]:col-start-1 [&>*]:row-start-1" style={{ color: mix("rgb(255 255 255 / 0.9)", "rgb(255 255 255 / 0.5)", m) }}>
                    {j === 0 ? (
                      <>
                        <span style={{ opacity: 1 - label0 }}>{shallow.layer}</span>
                        <span style={{ opacity: label0 }}>{l.label}</span>
                      </>
                    ) : (
                      l.label
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ── 2 · Strategic direction ──────────────────────────────────────────────────────────────────────────────────

/** A pulse that rises and falls between `a` and `a + 0.55`. */
const bump = (t: number, a: number) => seg(t, a, a + 0.2) * (1 - seg(t, a + 0.2, a + 0.55));
const AXIS = "font-mono text-[0.64rem] tracking-[0.08em] uppercase";
const AXIS_LINE = "rgb(255 255 255 / 0.42)";

export function Direction({ t }: { t: number }) {
  const { x, y, topics } = PROBLEM.visuals.direction;
  const [hot, setHot] = useState(-1);
  const axes = seg(t, 0.1, 1);
  const head = seg(t, 0.9, 1.3);
  // Grid order is top-left, top-right, bottom-left, bottom-right; the scan visits the three that miss.
  const cell = [0, 1, 2, 3].map((i) => topics.find((q) => q.rel === (i < 2 ? 1 : 0) && q.dem === (i % 2 === 0 ? 0 : 1))!);
  const scanAt = [2.2, 0, 2.55, 2.9];
  const verdict = seg(t, 3.5, 4.2);
  const rel = hot >= 0 ? cell[hot].rel : -1;
  const dem = hot >= 0 ? cell[hot].dem : -1;
  const tick = (on: boolean): CSSProperties => ({ color: on ? "#fff" : "rgb(255 255 255 / 0.38)", transition: "color 150ms" });

  return (
    <div className="absolute inset-0 grid grid-cols-[3.7rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-y-2 px-5 pt-5 pb-4 @min-[22rem]:grid-cols-[4.6rem_minmax(0,1fr)]">
      {/* The up axis: High at the top, Low at the bottom, and what it measures between them. */}
      <div className="flex flex-col items-end justify-between py-2.5 pr-2.5 text-right @min-[22rem]:pr-3.5">
        <span className={AXIS} style={tick(rel === 1)}>
          {y.high}
        </span>
        <span className="text-[0.74rem] leading-[1.25] font-medium text-white/80 @min-[22rem]:text-[0.8rem]" style={{ opacity: axes }}>
          {y.name.split(" ").map((w) => (
            <span key={w} className="block">
              {w}
            </span>
          ))}
        </span>
        <span className={AXIS} style={tick(rel === 0)}>
          {y.low}
        </span>
      </div>

      {/* The plot: the axes run along its left and bottom, meeting at the origin, each ending in an arrowhead. */}
      <div className="relative pb-2.5 pl-2.5">
        <span aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-[1.5px] origin-bottom rounded-full" style={{ background: AXIS_LINE, transform: `scaleY(${axes})` }} />
        <span aria-hidden="true" className="absolute right-0 bottom-0 left-0 h-[1.5px] origin-left rounded-full" style={{ background: AXIS_LINE, transform: `scaleX(${axes})` }} />
        <span aria-hidden="true" className="absolute -top-px -left-[3.5px] size-2 rotate-45 border-t-[1.5px] border-l-[1.5px]" style={{ borderColor: AXIS_LINE, opacity: head }} />
        <span aria-hidden="true" className="absolute -right-px -bottom-[3.5px] size-2 rotate-45 border-t-[1.5px] border-r-[1.5px]" style={{ borderColor: AXIS_LINE, opacity: head }} />

        <div className="relative h-full rounded-2xl bg-white/[0.02] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04),inset_0_1px_0_rgb(255_255_255/0.07)]" style={{ opacity: 0.4 + 0.6 * axes }}>
          {/* Four equal tiles fill the plot, one per quadrant; the gap between them is the cross. */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5">
            {cell.map((q, i) => {
              const win = !!q.win;
              const land = seg(t, 0.8 + 0.18 * i, 1.5 + 0.18 * i);
              const scan = win ? 0 : bump(t, scanAt[i]);
              const dim = win ? 0 : verdict;
              const green = win && verdict > 0.5;
              return (
                <div
                  key={q.title}
                  className="relative grid place-items-center rounded-[14px] px-2.5 transition-[background-color,box-shadow] duration-300"
                  onPointerEnter={() => setHot(i)}
                  onPointerLeave={() => setHot(-1)}
                  style={{
                    ...rise(land, 8),
                    background: green ? "linear-gradient(180deg, rgb(25 231 110 / 0.3), rgb(25 231 110 / 0.13))" : hot === i ? "linear-gradient(180deg, #262626, #1c1c1c)" : `linear-gradient(180deg, rgb(${27 + 22 * scan} ${27 + 22 * scan} ${27 + 22 * scan}), rgb(${19 + 22 * scan} ${19 + 22 * scan} ${19 + 22 * scan}))`,
                    boxShadow: green
                      ? "inset 0 1px 0 rgb(255 255 255 / 0.2), 0 0 0 1px rgb(25 231 110 / 0.3), 0 16px 34px -12px rgb(25 231 110 / 0.5)"
                      : `inset 0 1px 0 rgb(255 255 255 / ${0.06 + 0.06 * scan}), inset 0 0 0 1px rgb(255 255 255 / 0.03)`,
                  }}
                >
                  <p className="max-w-full text-center text-[0.74rem] leading-[1.3] font-medium tracking-[-0.01em] text-balance [overflow-wrap:anywhere] @min-[22rem]:text-[0.82rem]" style={{ color: `rgb(255 255 255 / ${0.92 - 0.42 * dim})` }}>
                    {q.title}
                  </p>
                  {win && (
                    <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full ring-2 ring-[#14201a]" style={{ background: GREEN, opacity: verdict, transform: `scale(${0.4 + 0.6 * seg(verdict, 0, 1, (v) => 1 - (1 - v) ** 3 * Math.cos(v * 6))})` }}>
                      <Check className="size-3 text-black" strokeWidth={3.2} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* The across axis: Low at the left, High at the right, and what it measures between them. */}
      <span />
      <div className="flex items-center justify-between pl-2.5">
        <span className={AXIS} style={tick(dem === 0)}>
          {x.low}
        </span>
        <span className="text-[0.72rem] font-medium whitespace-nowrap text-white/80 @min-[22rem]:text-[0.8rem]" style={{ opacity: axes }}>
          {x.name}
        </span>
        <span className={AXIS} style={tick(dem === 1)}>
          {x.high}
        </span>
      </div>
    </div>
  );
}

// ── 3 · Distribution ─────────────────────────────────────────────────────────────────────────────────────────

const CHANNEL = { search: Search, ai: Sparkles, people: Users } as const;
const H = 352; // px, the visual's height; the wires' rows are measured against it
const MID = H / 2;
const ROWS = [-100, 0, 100].map((dy) => MID + dy);
const START = 0.9; // seconds before the first packet leaves
const EVERY = 3.9; // seconds between one packet's tries
const STAGGER = 0.5;
const TRAVEL = 1.4;

const sine = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v)); // an even, unhurried ease: no sharp start or stop
const TAIL = 0.34; // how much of the wire the light's tail trails behind its head

/** Where packet `k` is: whether it is in flight, how far along its wire (0–1), and how far into dissolving at the port (0–1). */
function packet(t: number, k: number) {
  const ph = (((t - START - STAGGER * k) % EVERY) + EVERY) % EVERY;
  const live = t >= START + STAGGER * k && ph <= TRAVEL + 0.6;
  return { live, p: sine(ph / TRAVEL), born: seg(ph, 0, 0.35), gone: seg(ph, TRAVEL, TRAVEL + 0.6, sine) };
}

/** A point on the cubic from (0, MID) to (1, y1) that leaves and arrives horizontally: x as a fraction of the column, y in px. */
function bez(y1: number, u: number): [number, number] {
  const v = 1 - u;
  return [3 * v * u * u * 0.5 + 3 * v * v * u * 0.5 + u ** 3, v ** 3 * MID + 3 * v * v * u * MID + 3 * v * u * u * y1 + u ** 3 * y1];
}

export function Distribution({ t, still }: { t: number; still: boolean }) {
  const { badge, channels } = PROBLEM.visuals.distribution;
  const intro = seg(t, 0.1, 0.9);

  return (
    <div className="absolute inset-0 flex items-stretch px-5">
      {/* The article: one published piece, with the others behind it. */}
      <div className="relative my-auto h-[10.2rem] w-[5.2rem] shrink-0" style={rise(intro, 12)}>
        <span className="absolute inset-0 rounded-xl bg-[#171717] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]" style={{ transform: "translate(-7px, 6px) rotate(-4deg)", opacity: 0.6 }} />
        <div className="absolute inset-0 rounded-xl p-2.5 shadow-[0_18px_30px_-14px_rgb(0_0_0/0.8)]" style={{ background: PAPER }}>
          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.58rem] font-medium" style={{ background: "#d8f8e5", color: "#1a7f47" }}>
            <Check className="size-2.5" strokeWidth={3.2} />
            {badge}
          </span>
          <div className="mt-2 space-y-[5px]">
            <Line w={100} tone={1} />
            <Line w={68} tone={1} />
          </div>
          <div className="mt-2.5 h-9 rounded-md" style={{ background: "linear-gradient(135deg, rgb(23 44 33 / 0.1), rgb(23 44 33 / 0.04))" }} />
          <div className="mt-2.5 space-y-[5px]">
            <Line w={100} tone={1} />
            <Line w={90} tone={1} />
            <Line w={58} tone={1} />
          </div>
        </div>
      </div>

      {/* The wires, one packet each. */}
      <div className="relative min-w-10 flex-1">
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          {ROWS.map((y, k) => (
            <path key={k} d={`M0 ${MID} C50 ${MID} 50 ${y} 100 ${y}`} fill="none" stroke="white" strokeOpacity={0.2 * intro} strokeWidth={1.25} strokeDasharray="3 5" className="[vector-effect:non-scaling-stroke]" />
          ))}
          {/* The light's tail: the wire glows along the stretch the packet has just crossed, brightest at the head, and cools once it has gone. */}
          {!still &&
            ROWS.map((y, k) => {
              const { live, p, born, gone } = packet(t, k);
              if (!live) return null;
              const d = `M0 ${MID} C50 ${MID} 50 ${y} 100 ${y}`;
              const tail = Math.max(0, p - TAIL);
              return Array.from({ length: 6 }, (_, i) => {
                const a = tail + ((p - tail) * i) / 6;
                const b = tail + ((p - tail) * (i + 1)) / 6;
                const o = ((i + 1) / 6) ** 2 * 0.55 * born * (1 - gone);
                return <path key={`${k}-${i}`} d={d} pathLength={1} fill="none" stroke="white" strokeOpacity={o} strokeWidth={1.6 + i * 0.25} strokeLinecap="round" strokeDasharray={`${Math.max(0, b - a)} 2`} strokeDashoffset={-a} className="[vector-effect:non-scaling-stroke]" />;
              });
            })}
        </svg>
        {!still &&
          ROWS.map((y, k) => {
            const { live, p, born, gone } = packet(t, k);
            if (!live) return null;
            const [bx, by] = bez(y, p);
            return (
              <span key={k} className="absolute" style={{ left: `${bx * 100}%`, top: by, opacity: born * (1 - gone), transform: `translate(-50%, -50%) scale(${(0.7 + 0.3 * born) * (1 + 0.9 * gone)})` }}>
                <span className="absolute -inset-[11px] rounded-full bg-white/10 blur-[3px]" />
                <span className="absolute -inset-[5px] rounded-full bg-white/25" />
                <span className="block size-[7px] rounded-full bg-white shadow-[0_0_12px_2px_rgb(255_255_255/0.55)]" />
              </span>
            );
          })}
      </div>

      {/* Where it was meant to go: each channel's edge carries a blocked port that flashes when a packet is turned away. */}
      <div className="relative w-[8.7rem] shrink-0">
        {channels.map((c, k) => {
          const Icon = CHANNEL[c.icon as keyof typeof CHANNEL];
          const ph = (((t - START - STAGGER * k) % EVERY) + EVERY) % EVERY;
          // The port warms as the light arrives, flashes, and settles, and stays blocked once the first packet has been turned away.
          const blocked = still ? 1 : seg(t - (START + STAGGER * k + TRAVEL - 0.2), 0, 0.5, sine);
          const flash = still || t <= START + STAGGER * k ? 0 : seg(ph, TRAVEL - 0.3, TRAVEL, sine) * (1 - seg(ph, TRAVEL, TRAVEL + 1.1, sine));
          return (
            <div key={c.name} className="absolute inset-x-0 -translate-y-1/2" style={{ top: ROWS[k], ...rise(seg(t, 0.4 + 0.12 * k, 1.1 + 0.12 * k), 8) }}>
              <span className="flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(180deg,#1b1b1b,#141414)] pr-3 pl-5 text-[0.8rem] whitespace-nowrap text-white/65 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.055),inset_0_1px_0_rgb(255_255_255/0.08),0_8px_14px_-10px_rgb(0_0_0/0.9)]">
                <Icon className="size-4 shrink-0 text-white/45" strokeWidth={1.8} />
                {c.name}
              </span>
              <span aria-hidden="true" className="absolute top-1/2 -left-[11px] size-[22px] -translate-y-1/2">
                <span className="absolute inset-0 rounded-full border" style={{ borderColor: CORAL, opacity: flash * 0.7, transform: `scale(${1 + 0.9 * (1 - flash)})` }} />
                <span className="absolute inset-0 grid place-items-center rounded-full border ring-[3px] ring-[#0e0e0e]" style={{ background: mix("rgb(217 101 67 / 0.2)", "#1d1d1d", blocked * (0.55 + 0.45 * flash)), borderColor: mix("rgb(217 101 67 / 0.7)", "rgb(255 255 255 / 0.18)", blocked) }}>
                  <X className="size-3" strokeWidth={2.6} style={{ color: mix("rgb(217 101 67)", "rgb(255 255 255 / 0.5)", blocked) }} />
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
