"use client";

import NumberFlow from "@number-flow/react";
import { Layers } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { Beacon, CANVAS, FRAME, Mark, delay, rise } from "../parts";
import { VIS } from "./content";
import { citationsAt, eventsFor, frame, mentionsAt, sourceAt, sovAt } from "./frame";

// The hero visual: one AI visibility dashboard for one product, the whole picture across the four AI engines
// we track, sitting inside the hero panel. Built like a real product screen: hairlines and tonal panels
// instead of outlines, small type, real marks, numbers that roll.
//   Engines      All engines, or one of ChatGPT, Perplexity, Google AI, Claude, each with its share of voice.
//   Metrics      share of voice (the raised tile), citations, mentions: each against 30 days ago, with a live line.
//   Answer rank  you and four competitors by share of voice; rows trade places as the numbers move.
//   Trend        everyone's share of voice scrolling by; a crosshair reads off all five (hover to move it).
//   Perception   you vs the average competitor on six attributes, what AI says about you, and its tone.
//   Citations    where answers cite you, and a live feed of each new citation: engine, source and page.
// One clock (in loop steps) drives it: lines scroll continuously and whole-step values are what the numbers show.
// Same interaction as the Engine and Case-study sections: hovering or focusing anywhere pauses the clock, and an
// engine in the strip pins the whole dashboard to that engine until the pointer leaves (tap an engine on touch).
// Reduced motion: the finished dashboard, still; engines still switch, instantly.

const TICK = 2600; // ms per loop step
const WIN = 24; // the trend's window, in steps
const SPARK = 16; // a sparkline's window, in steps
const ROW = 25; // answer-rank row height, px
const FEED = 34; // citation feed row height, px
const FEED_N = 4;
const MAX_SOV = 45; // top of the rank bars, %
const LO = 2; // the trend's range, %
const HI = 44;
const yOf = (v: number) => 100 - ((v - LO) / (HI - LO)) * 100; // % from the top of the trend

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// Surfaces: hairlines and tonal panels, never outlines.
const PANEL = "rounded-[10px] bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.055),0_1px_2px_rgb(15_26_20/0.03)]";
const HAIR = "border-ink/[0.06]";
const LIFT = "transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_10px_24px_-8px_rgb(15_26_20/0.14)]";

const r1 = (n: number) => Math.round(n * 10) / 10;
// Server and browser can differ in the last digits of Math.sin/cos, so every computed coordinate is rounded: identical markup on both.
const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** The loop's clock in steps: advances while `run`, about 30 times a second. */
function useClock(run: boolean) {
  const [t, setT] = useState(3);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      last ||= now;
      const dt = now - last;
      if (dt >= 33) {
        last = now;
        setT((v) => v + Math.min(dt, 100) / TICK);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return t;
}

/** The numbers in `target`, eased toward it on the frame clock, so rows glide and shapes morph. */
function useEased(target: number[], still: boolean) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  const key = target.join(",");
  useEffect(() => {
    if (still) return;
    const goal = key.split(",").map(Number);
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const k = 1 - Math.exp(-(last ? Math.min((now - last) / 1000, 0.05) : 0) * 7);
      last = now;
      let done = true;
      cur.current = cur.current.map((c, i) => {
        const d = goal[i] - c;
        if (Math.abs(d) < 0.002) return goal[i];
        done = false;
        return c + d * k;
      });
      setV(cur.current);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, still]);
  return still ? target : v;
}

// Slices of the eased vector, in the order `target` is built below.
const N_P = VIS.products.length;
const N_AX = VIS.axes.length;
const RANK = 0;
const BAR = N_P;
const YOU = BAR + N_P;
const FIELD = YOU + N_AX;
const TONE = FIELD + N_AX;

// The radar: axes clockwise from the top.
const CX = 150;
const CY = 88;
const R = 64;
const angle = (i: number) => ((-90 + (360 / N_AX) * i) * Math.PI) / 180;
const at = (i: number, pct: number) => [r2(CX + Math.cos(angle(i)) * ((R * pct) / 100)), r2(CY + Math.sin(angle(i)) * ((R * pct) / 100))];
const poly = (vals: number[]) => vals.map((p, i) => at(i, p).join(",")).join(" ");

/** Each brand's mark on its colour: you in the ink, the rest in muted brand hues. Fictional, like the sample data. */
const BRAND = ["#172c21", "#3a63c9", "#7a5fc7", "#d99a2b", "#2b9a88"];
export function Brand({ i, size = 18 }: { i: number; size?: number }) {
  const glyph = [
    <path key="y" d="M4.2 10.6 8 5.4l3.8 5.2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    <g key="n" fill="#fff">
      <rect x="4" y="4.6" width="8" height="1.9" rx=".9" />
      <rect x="4" y="7.1" width="8" height="1.9" rx=".9" />
      <rect x="4" y="9.6" width="5.2" height="1.9" rx=".9" />
    </g>,
    <g key="l" fill="#fff">
      <circle cx="5.6" cy="5.6" r="1.35" />
      <circle cx="10.4" cy="5.6" r="1.35" />
      <circle cx="5.6" cy="10.4" r="1.35" />
      <circle cx="10.4" cy="10.4" r="1.35" />
    </g>,
    <g key="m" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3.6" />
      <path d="M2.8 8h10.4" />
    </g>,
    <circle key="o" cx="8" cy="8" r="3.4" fill="none" stroke="#fff" strokeWidth="1.8" />,
  ];
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="16" height="16" rx="4" fill={BRAND[i]} />
      {glyph[i]}
    </svg>
  );
}

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className={`size-[7px] fill-current ${down ? "rotate-180" : ""}`}>
      <path d="M4 1 7.5 7h-7z" />
    </svg>
  );
}

/** A change against 30 days ago, in the page's deep green. */
function Up({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1a7f47]">
      <Arrow />
      {children}
    </span>
  );
}

/** A line over the last `SPARK` steps ending at `t`, scaled to its own range. */
function Spark({ at: f, t, className = "" }: { at: (u: number) => number; t: number; className?: string }) {
  const n = SPARK * 2;
  const vals = Array.from({ length: n + 1 }, (_, j) => f(t - SPARK + j / 2));
  const lo = Math.min(...vals);
  const span = Math.max(...vals) - lo || 1;
  const d = vals.map((v, j) => `${j ? "L" : "M"}${r2((j / n) * 100)} ${r2(22 - ((v - lo) / span) * 18)}`).join("");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true" className={`h-5 ${className}`}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const ago = (s: number) => (s < 3 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);

/** Everyone's share of voice scrolling by under a crosshair that reads all five off; move the pointer to move it. */
function Trend({ view, t }: { view: number; t: number }) {
  const [hx, setHx] = useState<number | null>(null);
  const x = hx ?? 0.78;
  const u = t - WIN * (1 - x); // the moment under the crosshair
  const n = WIN * 4;
  const pts = (i: number) =>
    Array.from({ length: n + 1 }, (_, j) => `${j ? "L" : "M"}${r2((j / n) * 100)} ${r2(yOf(sovAt(view, i, t - WIN + j / 4)))}`).join("");
  const rows = VIS.products.map((name, i) => ({ i, name, v: r1(sovAt(view, i, Math.floor(u))) })).sort((a, b) => b.v - a.v);
  const day = x > 0.97 ? "Today" : `${Math.round((1 - x) * 30)} days ago`;
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    setHx(clamp((e.clientX - b.left) / b.width, 0.04, 0.97));
  };

  return (
    <div className="flex flex-1 flex-col px-4 pt-4 pb-2.5">
      <div onPointerMove={move} onPointerLeave={() => setHx(null)} className="relative min-h-[10.5rem] flex-1 cursor-crosshair">
        {[10, 20, 30, 40].map((g) => (
          <div key={g} style={{ top: `${yOf(g)}%` }} className={`absolute inset-x-0 border-t ${HAIR}`}>
            <span className="absolute -top-2 left-0 bg-white pr-1 font-mono text-[10px] text-ink/35">{g}%</span>
          </div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          {VIS.products.map((_, i) =>
            i ? <path key={i} d={pts(i)} fill="none" stroke={BRAND[i]} strokeOpacity="0.85" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null,
          )}
          <path d={pts(0)} fill="none" stroke={BRAND[0]} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* The crosshair, a dot on each line, and the readout. */}
        <div style={{ left: `${x * 100}%` }} className="pointer-events-none absolute inset-y-0 w-px bg-ink/15" />
        {VIS.products.map((_, i) => (
          <span
            key={i}
            style={{ left: `${x * 100}%`, top: `${r2(yOf(sovAt(view, i, u)))}%`, borderColor: BRAND[i] }}
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-white"
          />
        ))}
        <div
          style={{ left: `${x * 100}%`, translate: x > 0.5 ? "calc(-100% - 12px) 0" : "12px 0" }}
          className="pointer-events-none absolute top-1 w-[10.5rem] rounded-lg bg-white p-2.5 shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_10px_28px_-8px_rgb(15_26_20/0.2)]"
        >
          <p className="mb-1.5 text-[11px] text-ink/50">{day}</p>
          <ul className="space-y-1">
            {rows.map((r) => (
              <li key={r.name} className="flex items-center gap-2 text-[11.5px]">
                <Brand i={r.i} size={14} />
                <span className={`min-w-0 flex-1 truncate ${r.i ? "text-ink/65" : "font-medium text-ink"}`}>{r.name}</span>
                <NumberFlow value={r.v} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="%" className={`font-mono tabular-nums ${r.i ? "text-ink/65" : "text-ink"}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-1.5 flex justify-between text-[10.5px] text-ink/35">
        <span>30 days ago</span>
        <span>Today</span>
      </p>
    </div>
  );
}

export default function HeroStage() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false); // the pointer or focus is on the dashboard: stop the clock
  const [pin, setPin] = useState(0); // 0 = all engines, else that engine's place + 1

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const t = useClock(visible && !held && !still);
  const step = Math.floor(t);
  const on = seen || still;
  const f = frame(pin, step);
  const feed = eventsFor(pin, step, FEED_N + 1); // one extra, on its way out
  const latest = feed[0];

  // Built once seen: bars, shapes and the tone bar grow from nothing; rows are already in place.
  const full = [...f.rank, ...f.sov, ...f.you, ...f.field, ...f.tone];
  const e = useEased(on ? full : [...f.rank, ...full.slice(N_P).map(() => 0)], still);

  const release = () => {
    setHeld(false);
    setPin(0);
  };
  const tabs = ["All engines", ...VIS.engines.map((x) => x.name)];

  return (
    <figure
      ref={ref}
      aria-label="Example AI visibility dashboard: share of voice, citations, mentions, answer rank, a trend of every competitor, perception and a live feed of citations for one product across ChatGPT, Perplexity, Google AI and Claude. Choose an engine to see its numbers."
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={release}
      onFocus={() => setHeld(true)}
      onBlur={(ev) => {
        if (!ev.currentTarget.contains(ev.relatedTarget)) release();
      }}
      className={`${FRAME} mx-auto mt-12 max-w-[68rem] text-left shadow-[0_1px_2px_rgb(23_44_33/0.04),0_30px_60px_-34px_rgb(23_44_33/0.3)] sm:mt-14`}
    >
      <div className={`${CANVAS} px-2.5 py-3 sm:px-6 sm:py-3`}>
        <div className="overflow-hidden rounded-xl bg-[#f8f8f6] shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_1px_2px_rgb(15_26_20/0.04),0_24px_48px_-24px_rgb(15_26_20/0.2)]">
          {/* Who, the engines we track (the whole dashboard follows whichever is chosen), and whether the clock is running. */}
          <div className={`${rise(on)} flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b ${HAIR} bg-white px-3 py-2.5 sm:px-4`}>
            <p className="flex min-w-0 items-center gap-2.5 text-[12.5px] font-medium tracking-[-0.005em] text-ink">
              <Brand i={0} size={20} />
              <span className="whitespace-nowrap">{VIS.products[0]}</span>
              <span className="truncate font-normal text-ink/45 max-xl:hidden">
                up <NumberFlow value={f.sovDelta} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> pts this month
              </span>
            </p>
            <p className="ml-auto flex shrink-0 items-center gap-3 text-[11px] text-ink/45 lg:order-last lg:ml-0">
              <span className="max-xl:hidden">{VIS.period}</span>
              <span className="flex items-center gap-2 font-mono tracking-[0.04em] text-ink/60 uppercase">
                {held || still ? <span aria-hidden="true" className="size-2 rounded-full bg-ink/20" /> : <Beacon />}
                {held || still ? "Paused" : "Live"}
              </span>
            </p>
            <div role="group" aria-label="AI engine" className="order-last grid w-full grid-cols-5 gap-1 rounded-lg bg-ink/[0.04] p-1 lg:order-none lg:ml-auto lg:w-[33rem]">
              {tabs.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  aria-pressed={pin === i}
                  onPointerEnter={() => setPin(i)}
                  onFocus={() => setPin(i)}
                  onClick={() => setPin(i)}
                  className={`flex min-w-0 flex-col items-center justify-center gap-0 rounded-md px-1 py-1 text-[11.5px] transition-[background-color,color,box-shadow] duration-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink/40 ${
                    pin === i ? "bg-white text-ink shadow-[0_0_0_1px_rgb(15_26_20/0.05),0_1px_2px_rgb(15_26_20/0.08)]" : "text-ink/55 hover:text-ink"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {i ? <Mark name={VIS.engines[i - 1].mark} className="size-3.5" /> : <Layers aria-hidden="true" strokeWidth={1.8} className="size-3.5" />}
                    <span className="truncate max-sm:sr-only">{name}</span>
                  </span>
                  <NumberFlow value={frame(i, step).sov[0]} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="%" className="font-mono text-[11px] tabular-nums" />
                </button>
              ))}
            </div>
          </div>

          {/* Everything below follows the engine above; decorative, so hidden from assistive tech. */}
          <div aria-hidden="true" className="grid grid-cols-1 gap-2 p-2.5 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
            <div className="flex min-w-0 flex-col gap-2">
              {/* Share of voice is the one that matters, so it's raised; citations and mentions sit recessed beside it. */}
              <div style={delay(250)} className={`${rise(on)} grid grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 rounded-[10px] bg-ink/[0.035] p-1`}>
                <div className={`${LIFT} rounded-lg bg-white p-2 shadow-[0_0_0_1px_rgb(15_26_20/0.05),0_6px_16px_-8px_rgb(15_26_20/0.12)]`}>
                  <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5">
                    <p className="whitespace-nowrap text-[11px] text-ink/55">Share of voice</p>
                    <Up>
                      <NumberFlow value={f.sovDelta} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }} suffix=" pts" />
                    </Up>
                  </div>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="text-[1.5rem] leading-none font-medium tracking-[-0.035em] text-ink sm:text-[1.65rem]">
                      <NumberFlow value={f.sov[0]} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="%" />
                    </p>
                    <Spark at={(u) => sovAt(pin, 0, u)} t={t} className="w-10 shrink-0 text-ink" />
                  </div>
                </div>
                {[
                  { label: "Citations", value: f.citations, delta: f.citationsDelta, at: (u: number) => citationsAt(pin, u) },
                  { label: "Mentions", value: f.mentions, delta: f.mentionsDelta, at: (u: number) => mentionsAt(pin, u) },
                ].map((m) => (
                  <div key={m.label} className={`${LIFT} rounded-lg p-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5">
                      <p className="text-[11px] text-ink/55">{m.label}</p>
                      <Up>
                        <NumberFlow value={m.delta} format={{ style: "percent", maximumFractionDigits: 0 }} />
                      </Up>
                    </div>
                    <div className="mt-1.5 flex items-end justify-between gap-1">
                      <p className="text-[1.1rem] leading-none font-medium tracking-[-0.03em] text-ink sm:text-[1.25rem]">
                        <NumberFlow value={m.value} locales="en-US" />
                      </p>
                      <Spark at={m.at} t={t} className="w-7 shrink-0 text-ink/45 max-sm:hidden" />
                    </div>
                  </div>
                ))}
              </div>

              {/* You and four competitors by share of voice. Rows glide to their new place as the numbers move. */}
              <div style={delay(400)} className={`${rise(on)} ${PANEL} flex flex-1 flex-col`}>
                <div className={`flex items-center justify-between border-b ${HAIR} px-3.5 py-1.5`}>
                  <p className="text-[12.5px] font-medium text-ink">Answer rank</p>
                  <span className="text-[11px] text-ink/45">Share of voice</span>
                </div>
                <div className="relative mx-1.5 my-1" style={{ height: ROW * N_P }}>
                  {VIS.products.map((name, i) => {
                    const you = i === 0;
                    const d = f.rankPrev[i] - f.rank[i];
                    return (
                      <div key={name} className="absolute inset-x-0 top-0" style={{ height: ROW, transform: `translateY(${e[RANK + i] * ROW}px)` }}>
                        <div className={`flex h-full items-center gap-2 rounded-md px-2 transition-colors duration-300 ${you ? "bg-[#f1f7f3]" : "hover:bg-ink/[0.025]"}`}>
                          <span className={`w-3 font-mono text-[10.5px] ${you ? "text-ink" : "text-ink/35"}`}>{f.rank[i] + 1}</span>
                          <Brand i={i} size={16} />
                          <span className={`w-[5.2rem] shrink-0 truncate text-[12.5px] tracking-[-0.01em] ${you ? "font-medium text-ink" : "text-ink/65"}`}>{name}</span>
                          <span className="h-1 min-w-4 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                            <span className="block h-full rounded-full" style={{ width: `${(e[BAR + i] / MAX_SOV) * 100}%`, background: BRAND[i], opacity: you ? 1 : 0.55 }} />
                          </span>
                          <span className={`w-[2.7rem] text-right font-mono text-[11.5px] ${you ? "text-ink" : "text-ink/60"}`}>
                            <NumberFlow value={f.sov[i]} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="%" className="tabular-nums" />
                          </span>
                          <span className={`flex w-5 items-center justify-end gap-0.5 font-mono text-[10px] ${d > 0 ? "text-[#1a7f47]" : d < 0 ? "text-accent" : "text-ink/25"}`}>
                            {d === 0 ? (
                              "–"
                            ) : (
                              <>
                                <Arrow down={d < 0} />
                                {Math.abs(d)}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Where you land in an answer. */}
                <dl className={`mt-auto grid grid-cols-3 divide-x divide-ink/[0.06] border-t ${HAIR}`}>
                  {[
                    { label: "Avg. position", value: f.position, format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }, prefix: "#" },
                    { label: "In the top 3", value: f.top3, format: { maximumFractionDigits: 0 }, suffix: "%" },
                    { label: "Prompts", value: VIS.views[pin].prompts, format: { maximumFractionDigits: 0 } },
                  ].map((m) => (
                    <div key={m.label} className="flex flex-col gap-0 px-3 py-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-1.5">
                      <dt className="truncate text-[10.5px] text-ink/45">{m.label}</dt>
                      <dd className="text-[0.85rem] leading-tight font-medium tracking-[-0.02em] text-ink">
                        <NumberFlow value={m.value} format={m.format} prefix={m.prefix} suffix={m.suffix} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div style={delay(500)} className={`${rise(on)} ${PANEL} flex flex-col`}>
              <div className={`flex items-center justify-between border-b ${HAIR} px-3.5 py-1.5`}>
                <p className="text-[12.5px] font-medium text-ink">Share of voice over time</p>
                <span className="text-[11px] text-ink/45">All products</span>
              </div>
              <Trend view={pin} t={t} />
            </div>

            <div className="grid grid-cols-1 gap-2 lg:col-span-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              {/* How AI perceives you next to the field, and what it gets right and wrong about you. */}
              <div style={delay(600)} className={`${rise(on)} ${PANEL} flex flex-col`}>
                <div className={`flex items-center justify-between border-b ${HAIR} px-3.5 py-1.5`}>
                  <p className="text-[12.5px] font-medium text-ink">Perception</p>
                  <span className="flex items-center gap-3 text-[11px] text-ink/50">
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-3 rounded-full bg-[#1a7f47]" />
                      You
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-3 rounded-full bg-ink/30" />
                      Competitors
                    </span>
                  </span>
                </div>
                <div className="grid flex-1 grid-cols-1 items-center gap-3 p-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                  <svg viewBox="0 0 300 176" className="mx-auto w-full max-w-[19rem]">
                    {[100 / 3, 200 / 3, 100].map((p) => (
                      <polygon key={p} points={poly(Array(N_AX).fill(p))} className="fill-none stroke-ink/[0.08]" strokeWidth="1" />
                    ))}
                    {VIS.axes.map((a, i) => {
                      const [x, y] = at(i, 100);
                      const [lx, ly] = at(i, 126);
                      const c = Math.cos(angle(i));
                      return (
                        <g key={a}>
                          <line x1={CX} y1={CY} x2={x} y2={y} className="stroke-ink/[0.08]" strokeWidth="1" />
                          <text x={lx} y={ly} textAnchor={c > 0.3 ? "start" : c < -0.3 ? "end" : "middle"} dominantBaseline="middle" className="fill-ink/55 text-[13px]">
                            {a}
                          </text>
                        </g>
                      );
                    })}
                    <polygon points={poly(e.slice(FIELD, FIELD + N_AX))} className="fill-ink/[0.04] stroke-ink/30" strokeWidth="1.2" strokeLinejoin="round" />
                    <polygon points={poly(e.slice(YOU, YOU + N_AX))} className="fill-[#1a7f47]/10 stroke-[#1a7f47]" strokeWidth="1.6" strokeLinejoin="round" />
                    {Array.from({ length: N_AX }, (_, i) => {
                      const [x, y] = at(i, e[YOU + i]);
                      return <circle key={i} cx={x} cy={y} r="2.6" className="fill-white stroke-[#1a7f47]" strokeWidth="1.4" />;
                    })}
                  </svg>

                  <div>
                    <p className="text-[11px] text-ink/45">What AI says about you</p>
                    <ul key={pin} className="mt-0.5 divide-y divide-ink/[0.06] motion-safe:animate-fade-up">
                      {f.claims.map((c) => (
                        <li key={c.text} className="flex items-center justify-between gap-2 py-1">
                          <span className="min-w-0 text-[12px] leading-snug text-ink">{c.text}</span>
                          <span className={`flex shrink-0 items-center gap-1.5 text-[11px] ${c.ok ? "text-ink/55" : "text-accent"}`}>
                            <span className={`size-1.5 rounded-full ${c.ok ? "bg-[#1a7f47]" : "bg-accent"}`} />
                            {c.ok ? "Accurate" : "Out of date"}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-2 text-[11px] text-ink/45">Tone of answers</p>
                    <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                      <span className="bg-[#1a7f47]" style={{ width: `${e[TONE]}%` }} />
                      <span className="bg-ink/15" style={{ width: `${e[TONE + 1]}%` }} />
                      <span className="bg-accent" style={{ width: `${e[TONE + 2]}%` }} />
                    </div>
                    <p className="mt-1.5 flex flex-wrap justify-between gap-x-2 text-[10.5px] text-ink/45">
                      {["Positive", "Neutral", "Negative"].map((label, i) => (
                        <span key={label}>
                          {label} <NumberFlow value={f.tone[i]} suffix="%" className="font-mono text-[11.5px] text-ink tabular-nums" />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Where the answers cite you, and each new citation as it lands. */}
              <div style={delay(750)} className={`${rise(on)} ${PANEL} flex flex-col`}>
                <div className={`flex items-center justify-between border-b ${HAIR} px-3.5 py-1.5`}>
                  <p className="text-[12.5px] font-medium text-ink">Cited from</p>
                  <span className="flex items-center gap-2 text-[11px] text-ink/45">
                    {held || still ? <span className="size-1.5 rounded-full bg-ink/20" /> : <Beacon />}
                    Citations as they land
                  </span>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-3 p-2 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <ul className="grid grid-cols-2 grid-rows-2 gap-1.5 max-md:min-h-28">
                    {VIS.sources.map((s, i) => (
                      <li key={s.label} className={`${LIFT} relative flex flex-col justify-between overflow-hidden rounded-lg bg-ink/[0.025] p-2`}>
                        {/* A hush of light each time this source is cited. */}
                        {latest?.source === i && <span key={latest.k} className="pointer-events-none absolute inset-0 bg-ink/[0.07] motion-safe:animate-[soft-in_1.6s_ease-out_reverse_both]" />}
                        <span className="relative flex items-center gap-1.5 text-[11px] text-ink/65">
                          <Mark name={s.mark} className="size-3" />
                          <span className="truncate">{s.label}</span>
                        </span>
                        <span className="relative flex items-end justify-between gap-1">
                          <span className="text-[1.1rem] leading-none font-medium tracking-[-0.03em] text-ink">
                            <NumberFlow value={f.sources[i]} locales="en-US" />
                          </span>
                          <Spark at={(u) => sourceAt(pin, i, u)} t={t} className="w-10 shrink-0 text-ink/45" />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <ul className="relative" style={{ height: FEED * FEED_N }}>
                    {feed.map((ev, slot) => {
                      const eng = VIS.engines[ev.engine];
                      const src = VIS.sources[ev.source];
                      return (
                        <li
                          key={ev.k}
                          style={{ height: FEED, transform: `translateY(${slot * FEED}px)`, opacity: slot === FEED_N ? 0 : 1, transition: still ? "none" : "transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms" }}
                          className={`absolute inset-x-0 top-0 ${slot === 0 && seen ? "motion-safe:animate-[arrive_600ms_ease-out_both]" : ""}`}
                        >
                          <div className={`flex h-full items-center gap-2.5 border-t ${slot ? HAIR : "border-transparent"}`}>
                            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.06)]">
                              <Mark name={eng.mark} className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[12px] leading-tight text-ink">
                                {eng.name} <span className="text-ink/45">cited</span>
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-ink/60">
                                <Mark name={src.mark} className="size-3" />
                                <span className="truncate">{ev.page}</span>
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-ink/35">{ago(Math.round((t - ev.k) * (TICK / 1000)))}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
