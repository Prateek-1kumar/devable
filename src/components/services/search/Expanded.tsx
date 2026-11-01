"use client";

import NumberFlow from "@number-flow/react";
import { Check, Link2, Quote, ThumbsUp, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Label } from "../kit";
import { CANVAS, FRAME, Mark, MarkStack, Tick, type Icon } from "../parts";
import { EXPANDED } from "./content";

// The core idea: search visibility and AI visibility are two different surfaces, worked as one system.
// So the section is two columns, each with its own words and its own window on the How We Work canvas, with
// one band beneath them for the signals that feed both (content, authority, third-party), joined by a bus.
//   Search   a rank tracker: for each query the ranking page, a trend line that draws itself upward in green,
//            and a rank badge that rolls to its new position (top three take the solid brand green).
//   AI       per engine, three steps that tick over in turn (Mentioned, Cited, Recommended) and a ring
//            that fills to its share of answers.
// It plays in three beats as the section scrolls in: Search wakes first, then AI, then both are on together
// (the band lights and the bus says so). Scroll away and back and it plays again. Each beat waits for its own
// block to be on screen, so on a phone, where the blocks stack, they wake as you reach them.
// Reduced motion: the finished picture, still.

const HOLD_SEARCH = 3000; // ms Search is alone before AI wakes
const HOLD_AI = 2800; // ms both sides are shown before the band lights

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** Flags that flip on one after another once `on` (each after its own delay), and all off at once when it isn't. */
function useStaged(on: boolean, delays: number[], still: boolean) {
  const [v, setV] = useState(() => delays.map(() => false));
  useEffect(() => {
    const ids = delays.map((d, i) => setTimeout(() => setV((p) => p.map((x, j) => (j === i ? on : x))), on && !still ? d : 0));
    return () => ids.forEach(clearTimeout);
  }, [on, delays, still]);
  return v;
}

const SEARCH_ROWS = [350, 850, 1350];
const SEARCH_FOOT = [1800];
const AI_ROWS = [250, 850, 1450];
const AI_FOOT = [2200];
const BAND = [0, 300, 600];

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
// Surfaces: a hairline ring and a soft lift, never an outline.
const WINDOW = "flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_1px_2px_rgb(15_26_20/0.04),0_16px_32px_-20px_rgb(15_26_20/0.2)]";
const HAIR = "border-ink/[0.06]";

export default function Expanded() {
  const { search, ai, signals } = EXPANDED;
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const wrap = useRef<HTMLDivElement>(null);
  const searchBlock = useRef<HTMLDivElement>(null);
  const aiBlock = useRef<HTMLDivElement>(null);
  const bandBlock = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState([false, false, false]); // which blocks are on screen
  const [beat, setBeat] = useState(0); // 0 idle, 1 Search awake, 2 AI awake too, 3 the band lit: both together
  const began = useRef(0);

  useEffect(() => {
    const els = [searchBlock.current, aiBlock.current, bandBlock.current];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = els.indexOf(e.target as HTMLDivElement);
          setSeen((s) => s.map((x, j) => (j === i ? e.isIntersecting : x)));
        }
      },
      { threshold: 0.35 },
    );
    els.forEach((el) => el && io.observe(el));
    // Once the whole thing has left the screen, rewind so it plays again on the way back.
    const out = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) setBeat(0);
    });
    if (wrap.current) out.observe(wrap.current);
    return () => {
      io.disconnect();
      out.disconnect();
    };
  }, []);

  useEffect(() => {
    if (still || beat >= 3 || !seen[beat]) return;
    const wait = beat === 0 ? 300 : Math.max(0, (beat === 1 ? HOLD_SEARCH : HOLD_AI) - (performance.now() - began.current));
    const id = setTimeout(() => {
      began.current = performance.now();
      setBeat(beat + 1);
    }, wait);
    return () => clearTimeout(id);
  }, [beat, seen, still]);

  const b = still ? 3 : beat;
  const sOn = b >= 1;
  const aOn = b >= 2;
  const both = b >= 3;
  const sRows = useStaged(sOn, SEARCH_ROWS, still);
  const sFoot = useStaged(sOn, SEARCH_FOOT, still)[0];
  const aRows = useStaged(aOn, AI_ROWS, still);
  const aFoot = useStaged(aOn, AI_FOOT, still)[0];
  const band = useStaged(both, BAND, still);

  return (
    <section aria-labelledby="expanded-title" className="px-6 py-20 sm:px-12 lg:py-24 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{EXPANDED.label}</Label>
        <h2 id="expanded-title" className="mt-5 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {EXPANDED.title}
        </h2>
        <p className="mt-3 max-w-[44rem] text-[1.05rem] leading-relaxed text-ink/65">{EXPANDED.body}</p>
        <p className="sr-only">
          Search rankings climb toward first place in Google, and AI engines move from mentioning your product to citing and recommending it. Both are fed by the same content, authority and third-party signals.
        </p>

        <div ref={wrap} className="mt-6 lg:mt-7">
          <div className="grid gap-x-6 gap-y-3 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
            <Words on={sOn} marks={["google"]} name={search.name} title={search.title} body={search.body} className="max-lg:order-1" />
            <Words on={aOn} marks={["chatgpt", "perplexity", "claude"]} name={ai.name} title={ai.title} body={ai.body} className="max-lg:order-3 max-lg:mt-8" />

            {/* Search: a rank tracker. Where the product ranks for the queries that matter, before and after. */}
            <div ref={searchBlock} aria-hidden="true" className={`${FRAME} ${CANVAS} flex p-2.5 sm:p-3.5 max-lg:order-2`}>
              <Dim on={sOn}>
                <Head title="Search rankings" mark="google">
                  <Metric label="Page one">
                    <NumberFlow value={sFoot ? search.pageOne.to : search.pageOne.from} />
                    <Gain on={sFoot} by={search.pageOne.to - search.pageOne.from} />
                  </Metric>
                </Head>
                <ul className="flex flex-1 flex-col">
                  {search.queries.map((q, i) => {
                    const done = sRows[i];
                    const pos = done ? q.to : q.from;
                    const top3 = done && q.to <= 3;
                    return (
                      <li key={q.q} className={`flex flex-1 items-center gap-3 px-3 py-2 sm:px-4 ${i ? `border-t ${HAIR}` : ""}`}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-ink">“{q.q}”</p>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px]">
                            <span className="shrink-0 rounded-[5px] bg-ink/[0.05] px-1.5 py-0.5 text-ink/55">{q.kind}</span>
                            <span className="truncate font-mono text-ink/40">{q.url}</span>
                          </p>
                        </div>
                        <Trail from={q.from} to={q.to} seed={i * 2.3} on={done} />
                        <div className="flex shrink-0 items-center gap-2">
                          <Gain on={done} by={q.from - q.to} sign="" />
                          <span
                            className={`grid h-7 min-w-10 place-items-center rounded-md px-1.5 font-mono text-[12.5px] transition-[background-color,color,box-shadow] duration-500 motion-reduce:transition-none ${
                              top3
                                ? "bg-primary text-ink shadow-[0_0_0_1px_rgb(25_231_110/0.45)]"
                                : done
                                  ? "bg-[#e3f3e8] text-[#1a7f47] shadow-[0_0_0_1px_rgb(26_127_71/0.15)]"
                                  : "bg-ink/[0.05] text-ink/50"
                            }`}
                          >
                            <NumberFlow value={pos} prefix="#" />
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Dim>
            </div>

            {/* AI: whether each engine mentions, cites and recommends the product, and its share of answers. */}
            <div ref={aiBlock} aria-hidden="true" className={`${FRAME} ${CANVAS} flex p-2.5 sm:p-3.5 max-lg:order-4`}>
              <Dim on={aOn}>
                <Head title="AI answers" marks={["chatgpt", "perplexity", "claude"]}>
                  <Metric label="Avg. share">
                    <NumberFlow value={avg(ai.engines.map((e) => e.share[aFoot ? 1 : 0]))} suffix="%" />
                    <Gain on={aFoot} by={avg(ai.engines.map((e) => e.share[1])) - avg(ai.engines.map((e) => e.share[0]))} unit="pts" />
                  </Metric>
                </Head>
                <ul className="flex flex-1 flex-col">
                  {ai.engines.map((e, i) => {
                    const done = aRows[i];
                    const share = done ? e.share[1] : e.share[0];
                    return (
                      <li key={e.name} className={`flex flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4 ${i ? `border-t ${HAIR}` : ""}`}>
                        <span className="flex w-[6.5rem] shrink-0 items-center gap-2 text-[13px] font-medium text-ink max-sm:order-1">
                          <Mark name={e.mark} className="size-4" />
                          {e.name}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 max-sm:order-3 max-sm:w-full sm:flex-1">
                          {ai.steps.map((s, k) => (
                            <Step key={s} on={done ? e.to[k] : e.from[k]} icon={STEP_ICONS[k]} label={s} wait={k * 160} />
                          ))}
                        </span>
                        <span className="ml-auto flex shrink-0 items-center gap-2 max-sm:order-2">
                          <Ring pct={share} />
                          <span className="w-9 text-right font-mono text-[12px] text-ink">
                            <NumberFlow value={share} suffix="%" />
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Dim>
            </div>
          </div>

          {/* The bus: the shared signals feed Search first, then AI, and once both are on it says so. */}
          <div aria-hidden="true" className="relative h-9 max-lg:hidden">
            <Run on={sOn} wait={0} origin="origin-bottom" axis="y" style={{ left: "calc(50% - 1px)", top: "50%", bottom: 0, width: 2 }} />
            <Run on={sOn} wait={450} origin="origin-right" axis="x" style={{ left: "calc(25% - 7px)", width: "calc(25% + 7px)", top: "calc(50% - 1px)", height: 2 }} />
            <Run on={sOn} wait={1000} origin="origin-bottom" axis="y" style={{ left: "calc(25% - 7px)", top: 0, height: "50%", width: 2 }} />
            <Run on={aOn} wait={0} origin="origin-left" axis="x" style={{ left: "50%", width: "calc(25% + 7px)", top: "calc(50% - 1px)", height: 2 }} />
            <Run on={aOn} wait={550} origin="origin-bottom" axis="y" style={{ left: "calc(75% + 5px)", top: 0, height: "50%", width: 2 }} />
            <Node on={sOn} wait={1300} style={{ left: "calc(25% - 6px)", top: -5 }} />
            <Node on={aOn} wait={850} style={{ left: "calc(75% + 6px)", top: -5 }} />
            <span
              className={`absolute top-1/2 left-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white py-1 pr-3.5 pl-1.5 text-[11.5px] font-medium whitespace-nowrap text-ink shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_6px_16px_-6px_rgb(15_26_20/0.18)] transition-[opacity,scale] duration-700 motion-reduce:transition-none ${
                both ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
            >
              <Tick className="size-4" />
              Search + AI, working together
            </span>
          </div>
          <div aria-hidden="true" className="mx-auto mt-6 h-6 w-0.5 bg-ink/[0.09] lg:hidden">
            <span className={`block h-full w-full origin-bottom bg-primary transition-transform duration-700 motion-reduce:transition-none ${both ? "scale-y-100" : "scale-y-0"}`} />
          </div>

          {/* What feeds both. */}
          <div ref={bandBlock} aria-hidden="true" className="rounded-2xl bg-[#f7f6f2] p-1.5 sm:p-2 lg:flex lg:items-center lg:gap-3">
            <p className="px-2 pb-2.5 text-[12.5px] leading-snug text-ink/65 lg:w-[11.5rem] lg:shrink-0 lg:pb-0">{signals.label}</p>
            <ul className="grid flex-1 gap-2 sm:grid-cols-3">
              {signals.items.map((it, i) => (
                <li
                  key={it.name}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2 transition-[background-color,box-shadow] duration-700 motion-reduce:transition-none ${
                    band[i] ? "bg-white shadow-[0_1px_2px_rgb(23_44_33/0.04),0_10px_24px_-12px_rgb(23_44_33/0.14)]" : "bg-white/50"
                  }`}
                >
                  <span className={`transition-[opacity,filter] duration-700 ${band[i] ? "" : "opacity-50 grayscale"}`}>
                    <MarkStack names={it.marks} size="size-[26px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium tracking-[-0.01em] text-ink">{it.name}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink/55">{it.note}</span>
                  </span>
                  <span className={`transition-[opacity,scale] duration-500 ${band[i] ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                    <Tick />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEP_ICONS: LucideIcon[] = [Quote, Link2, ThumbsUp];

/** One surface's words: what it is, whether it's awake, what it does, and how. Dim until its beat. */
function Words({ on, marks, name, title, body, className = "" }: { on: boolean; marks: Icon[]; name: string; title: string; body: string; className?: string }) {
  return (
    <div className={`transition-opacity duration-700 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-45"} ${className}`}>
      <span className="inline-flex items-center gap-2.5 rounded-full bg-paper py-1 pr-3.5 pl-1.5">
        <span className={`transition-[opacity,filter] duration-700 ${on ? "" : "opacity-50 grayscale"}`}>
          <MarkStack names={marks} size="size-[22px]" />
        </span>
        <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink/80 uppercase">{name}</span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.04em] uppercase">
          <span className="relative grid size-2 place-items-center">
            {on && <span className="absolute inset-0 rounded-full bg-primary opacity-60 motion-safe:animate-[ping_1.6s_ease-out_2]" />}
            <span className={`size-2 rounded-full transition-colors duration-500 ${on ? "bg-primary" : "bg-ink/20"}`} />
          </span>
          <span className={on ? "text-[#1a7f47]" : "text-ink/35"}>{on ? "Active" : "Standby"}</span>
        </span>
      </span>
      <h3 className="mt-3 text-[clamp(1.3rem,1.7vw,1.55rem)] leading-[1.12] font-normal tracking-[-0.03em] text-ink">{title}</h3>
      <p className="mt-2 max-w-[32rem] text-[0.95rem] leading-relaxed text-ink/65">{body}</p>
    </div>
  );
}

/** A window that sits greyed back until its beat, then comes forward in full colour. */
function Dim({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <div className={`${WINDOW} transition-[opacity,filter] duration-700 motion-reduce:transition-none ${on ? "opacity-100 saturate-100" : "opacity-60 saturate-0"}`}>{children}</div>
  );
}

/** A window's title bar: what it is on the left, the one number the work adds up to on the right. */
function Head({ title, mark, marks, children }: { title: string; mark?: Icon; marks?: Icon[]; children: ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b ${HAIR} px-3 py-2 sm:px-4`}>
      <p className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
        {mark && <Mark name={mark} className="size-3.5" />}
        {marks && <MarkStack names={marks} size="size-[18px]" />}
        {title}
      </p>
      {children}
    </div>
  );
}

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex items-baseline gap-2 text-[11px] text-ink/50">
      {label}
      <span className="flex items-baseline gap-2 text-[13.5px] leading-none font-medium tracking-[-0.02em] text-ink">{children}</span>
    </span>
  );
}

/** The gain, in the page's deep green; it appears once the number has moved. */
function Gain({ on, by, unit = "", sign = "+" }: { on: boolean; by: number; unit?: string; sign?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium tracking-normal text-[#1a7f47] transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`}>
      <svg viewBox="0 0 8 8" aria-hidden="true" className="size-[7px] fill-current">
        <path d="M4 1 7.5 7h-7z" />
      </svg>
      {sign}
      {by}
      {unit && ` ${unit}`}
    </span>
  );
}

// A query's position over twelve steps, as a line: stuck where it was, or (after the work) climbing to where
// it is now. Position 1 is the top, so a climb reads as a line going up. Rounded, so server and browser agree.
const TN = 12;
const r2 = (n: number) => Math.round(n * 100) / 100;
const smooth = (x: number) => x * x * (3 - 2 * x);
const history = (from: number, to: number, seed: number, climb: boolean) =>
  Array.from({ length: TN }, (_, i) => {
    const x = i / (TN - 1);
    const base = climb ? from + (to - from) * (x < 0.25 ? 0 : smooth((x - 0.25) / 0.75)) : from;
    return base + Math.sin(i * 1.9 + seed) * 0.8 * (1 - x);
  });
// Each line is scaled to its own climb (from the position it started at to the one it reached), so any climb fills the height.
const yOf = (p: number, from: number, to: number) => r2(3 + ((Math.min(from + 0.8, Math.max(to - 0.8, p)) - (to - 0.8)) / (from - to + 1.6)) * 22);
const line = (ps: number[], from: number, to: number) => ps.map((p, i) => `${i ? "L" : "M"}${r2((i / (TN - 1)) * 96)} ${yOf(p, from, to)}`).join("");

/** The position trend: a grey line while it's stuck, and once the work lands, a green one that draws upward over it. */
function Trail({ from, to, seed, on }: { from: number; to: number; seed: number; on: boolean }) {
  return (
    <svg viewBox="0 0 96 28" aria-hidden="true" className="h-7 w-24 shrink-0 overflow-visible max-sm:hidden">
      <path d={line(history(from, to, seed, false), from, to)} fill="none" stroke="rgb(23 44 33 / 0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={line(history(from, to, seed, true), from, to)}
        pathLength={1}
        fill="none"
        stroke="#19e76e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: on ? "stroke-dashoffset 1500ms cubic-bezier(0.22,1,0.36,1)" : "none" }}
      />
      <circle cx={96} cy={yOf(to, from, to)} r="3" fill="#fff" stroke="#1a7f47" strokeWidth="1.5" style={{ opacity: on ? 1 : 0, transition: on ? "opacity 400ms ease 1200ms" : "none" }} />
    </svg>
  );
}

/** One step of an answer: a quiet chip until it's true, then a green one with a tick; each flips in turn along a row. */
function Step({ on, icon: Icon, label, wait }: { on: boolean; icon: LucideIcon; label: string; wait: number }) {
  return (
    <span
      style={{ transitionDelay: on ? `${wait}ms` : "0ms" }}
      className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[11px] transition-[background-color,color,box-shadow] duration-500 motion-reduce:transition-none ${
        on ? "bg-[#e8f6ed] text-[#1a7f47] shadow-[0_0_0_1px_rgb(26_127_71/0.16)]" : "bg-ink/[0.04] text-ink/35"
      }`}
    >
      <span className="relative size-3">
        <Icon aria-hidden="true" strokeWidth={2} className={`absolute inset-0 size-3 transition-[opacity,scale] duration-300 ${on ? "scale-50 opacity-0" : "scale-100 opacity-100"}`} />
        <Check aria-hidden="true" strokeWidth={2.6} className={`absolute inset-0 size-3 transition-[opacity,scale] duration-500 ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
      </span>
      {label}
    </span>
  );
}

const RING = r2(2 * Math.PI * 11);
/** An engine's share of answers as a ring that fills. */
function Ring({ pct }: { pct: number }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className="size-7 -rotate-90">
      <circle cx="14" cy="14" r="11" fill="none" className="stroke-ink/[0.07]" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={RING}
        style={{ strokeDashoffset: r2(RING * (1 - Math.max(pct, 2) / 100)), transition: "stroke-dashoffset 1200ms cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

/** One run of the bus: a hairline with the brand green filling along it, from the `origin` end. */
function Run({ on, wait, origin, axis, style }: { on: boolean; wait: number; origin: string; axis: "x" | "y"; style: CSSProperties }) {
  return (
    <>
      <span className="absolute bg-ink/[0.09]" style={style} />
      <span
        className={`absolute bg-primary transition-transform duration-700 ${EASE} motion-reduce:transition-none ${origin}`}
        style={{ ...style, transform: on ? "none" : axis === "x" ? "scaleX(0)" : "scaleY(0)", transitionDelay: on ? `${wait}ms` : "0ms" }}
      />
    </>
  );
}

/** Where the bus meets a window: a small ring that turns green when the run reaches it. */
function Node({ on, wait, style }: { on: boolean; wait: number; style: CSSProperties }) {
  return (
    <span
      style={{ ...style, transitionDelay: on ? `${wait}ms` : "0ms" }}
      className={`absolute size-2.5 -translate-x-1/2 rounded-full border-2 bg-white transition-colors duration-500 motion-reduce:transition-none ${on ? "border-primary" : "border-ink/15"}`}
    />
  );
}
