"use client";

import { Terminal } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mark, Tick, type Icon } from "../parts";
import { HERO } from "./content";

// The hero visual: one article, built in front of you, then put to work. Read left to right.
//   Inputs  → four signals (product context, developer pain points, search + AI opportunities, research).
//   Brief   → each sends a packet into the article and becomes one field of its brief, keeping its colour.
//   Build   → the draft replaces the brief; four review layers run in turn, each adding a visible part.
//   Publish → the article sends a packet to Developers, Google and AI tools, each lighting up with its proof.
// Only the article is a card; inputs and outcomes sit on the page with a brand tile and a port, joined to the
// article by wires. One clock (seconds) drives every value through easing, with no CSS transitions on driven
// values, so every hand-off is continuous. Below lg the same story stacks vertically (no wires).
// The still frame is the finished picture, shown before the loop runs and with reduced motion.

const CYCLE = 28;
const FINAL = 23;

// The timeline, in seconds.
const IN_AT = (i: number) => 0.7 + 0.6 * i; // input i appears
const BEAT = [0, 3.6, 8.4, 17.8]; // where each beat starts
const PACKET = (i: number) => 4.0 + 0.7 * i; // brief packet i leaves…
const TRAVEL = 1.5; // …and takes this long
const BUILD = 8.6; // the draft takes over from the brief
const LAYER = 2.3; // each review layer
const LAYER_AT = (j: number) => 9.0 + LAYER * j;
const PUB = 18.2; // published
const SEND = (k: number) => 18.8 + 0.7 * k; // outcome packet k leaves
const FADE = 26.8; // the whole picture eases away before it replays

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const out3 = (v: number) => 1 - (1 - v) ** 3;
const io3 = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
/** Progress 0–1 from `a` to `b` seconds, eased out by default. */
const seg = (s: number, a: number, b: number, f = out3) => f(clamp01((s - a) / (b - a)));

function useClock() {
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(FINAL);
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      setS(((now - start) / 1000) % CYCLE);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      start = 0;
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return [box, s] as const;
}

// Desktop geometry (px). Rows and wires share these numbers, so they line up by construction.
const H = 440; // stage height
const MID = H / 2;
const GAP = 80; // width of each wire column
const IN_H = 60;
const IN_Y = [-111, -37, 37, 111]; // input row centres, from the middle
const OUT_H = 76;
const OUT_Y = [-100, 0, 100];

/** A point on the cubic from (0, y0) to (GAP, y1) that leaves and arrives horizontally. */
function bez(y0: number, y1: number, u: number): [number, number] {
  const v = 1 - u;
  const x = 3 * v * v * u * (GAP / 2) + 3 * v * u * u * (GAP / 2) + u ** 3 * GAP;
  const y = v ** 3 * y0 + 3 * v * v * u * y0 + 3 * v * u * u * y1 + u ** 3 * y1;
  return [x, y];
}
const wire = (y0: number, y1: number) => `M0 ${y0} C${GAP / 2} ${y0} ${GAP / 2} ${y1} ${GAP} ${y1}`;

export default function HeroStage() {
  const [box, s] = useClock();
  const beat = s < BEAT[1] ? 0 : s < BEAT[2] ? 1 : s < BEAT[3] ? 2 : 3;
  const live = 1 - seg(s, FADE, CYCLE); // everything fades with the picture before it replays

  // Per-input and per-outcome progress.
  const appear = HERO.inputs.map((_, i) => seg(s, IN_AT(i), IN_AT(i) + 0.8));
  const go = HERO.inputs.map((_, i) => seg(s, PACKET(i), PACKET(i) + TRAVEL, io3));
  const spent = go.map((u) => seg(u, 0.92, 1));
  const send = HERO.outcomes.map((_, k) => seg(s, SEND(k), SEND(k) + TRAVEL, io3));
  const lit = send.map((u) => seg(u, 0.9, 1));

  const active = beat === 2 ? Math.min(3, Math.floor((s - BEAT[2]) / LAYER)) : -1;
  const caption =
    beat === 0 ? "Product, audience, search and research signals come in."
    : beat === 1 ? "They are distilled into one content brief."
    : beat === 2 ? `${HERO.reviews[Math.max(0, active)].name}. ${HERO.reviews[Math.max(0, active)].note}`
    : "Published, it pays off three ways: developers, search and AI.";

  return (
    <div ref={box} aria-hidden="true" className="w-full" style={{ opacity: live }}>
      {/* Desktop: inputs → article → outcomes on fixed rows, joined by wires. */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_80px_minmax(0,1.5fr)_80px_minmax(0,1fr)]">
        <Eyebrow beat={beat} steps={[0]} />
        <span />
        <Eyebrow beat={beat} steps={[1, 2]} />
        <span />
        <Eyebrow beat={beat} steps={[3]} />
      </div>
      <div className="relative mt-4 hidden lg:grid lg:grid-cols-[minmax(0,1fr)_80px_minmax(0,1.5fr)_80px_minmax(0,1fr)]" style={{ height: H }}>
        <div className="relative">
          {HERO.inputs.map((inp, i) => (
            <div key={inp.name} className="absolute inset-x-0" style={{ top: MID + IN_Y[i] - IN_H / 2, height: IN_H }}>
              <InputRow inp={inp} a={appear[i]} spent={spent[i]} />
            </div>
          ))}
        </div>
        <svg width={GAP} height={H} className="overflow-visible">
          {HERO.inputs.map((inp, i) => {
            const y0 = MID + IN_Y[i];
            const [px, py] = bez(y0, MID, go[i]);
            return (
              <g key={i}>
                <path d={wire(y0, MID)} fill="none" stroke="var(--ink)" strokeOpacity={0.1 * appear[i]} strokeWidth={1.5} />
                <path d={wire(y0, MID)} pathLength={1} fill="none" stroke={inp.dot} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="1 1" strokeDashoffset={1 - go[i]} />
                {go[i] > 0 && go[i] < 1 && <circle cx={px} cy={py} r={5} fill={inp.dot} stroke="#fff" strokeWidth={2} />}
              </g>
            );
          })}
        </svg>
        <div className="flex items-center">
          <Article s={s} />
        </div>
        <svg width={GAP} height={H} className="overflow-visible">
          {HERO.outcomes.map((_, k) => {
            const y1 = MID + OUT_Y[k];
            const [px, py] = bez(MID, y1, send[k]);
            return (
              <g key={k}>
                <path d={wire(MID, y1)} fill="none" stroke="var(--ink)" strokeOpacity={0.1} strokeWidth={1.5} />
                <path d={wire(MID, y1)} pathLength={1} fill="none" stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="1 1" strokeDashoffset={1 - send[k]} />
                {send[k] > 0 && send[k] < 1 && <circle cx={px} cy={py} r={5} fill="var(--ink)" stroke="#fff" strokeWidth={2} />}
              </g>
            );
          })}
        </svg>
        <div className="relative">
          {HERO.outcomes.map((o, k) => (
            <div key={o.name} className="absolute inset-x-0" style={{ top: MID + OUT_Y[k] - OUT_H / 2, height: OUT_H }}>
              <OutRow o={o} lit={lit[k]} />
            </div>
          ))}
        </div>
      </div>

      {/* Below lg: the same story, stacked. */}
      <div className="space-y-5 lg:hidden">
        <Eyebrow beat={beat} steps={[0]} />
        <div className="-mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
          {HERO.inputs.map((inp, i) => (
            <div key={inp.name} className="min-h-11">
              <InputRow inp={inp} a={appear[i]} spent={spent[i]} compact />
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-[26rem] space-y-3">
          <Eyebrow beat={beat} steps={[1, 2]} />
          <Article s={s} />
        </div>
        <Eyebrow beat={beat} steps={[3]} />
        <div className="-mt-2 space-y-4">
          {HERO.outcomes.map((o, k) => (
            <OutRow key={o.name} o={o} lit={lit[k]} compact />
          ))}
        </div>
      </div>

      <p className="mx-auto mt-7 min-h-[2.8rem] max-w-[34rem] text-center text-[0.95rem] leading-snug text-ink/65">{caption}</p>
    </div>
  );
}

/** A column's eyebrow: the beat(s) it shows, as small mono labels. The playing one has a coral dot, finished ones a tick. */
function Eyebrow({ beat, steps }: { beat: number; steps: number[] }) {
  return (
    <p className="flex items-center gap-5 font-mono text-[0.68rem] tracking-[0.1em] uppercase">
      {steps.map((i) => {
        const on = beat === i;
        const done = beat > i && i < 3;
        return (
          <span key={i} className={`flex items-center gap-1.5 ${on ? "text-ink" : done ? "text-ink/55" : "text-ink/30"}`}>
            {done ? <Tick className="size-3.5" /> : <span className={`size-1.5 rounded-full ${on ? "bg-accent" : "border border-ink/25"}`} />}
            0{i + 1} {HERO.beats[i]}
          </span>
        );
      })}
    </p>
  );
}

const TILE = "grid size-9 shrink-0 place-items-center rounded-[10px] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_6px_14px_-6px_rgb(23_44_33/0.28)]";

function Glyph({ icon }: { icon: Icon }) {
  return icon === "docs" ? <Terminal className="size-[18px] text-ink/70" strokeWidth={1.8} /> : <Mark name={icon} className="size-[18px]" />;
}

/** An input signal: its brand tile, name and a mono detail, with a port (its colour) where the wire leaves. */
function InputRow({ inp, a, spent, compact = false }: { inp: (typeof HERO.inputs)[number]; a: number; spent: number; compact?: boolean }) {
  return (
    <div className="flex h-full items-center gap-3" style={{ opacity: a * (1 - 0.45 * spent), transform: `translateX(${(a - 1) * 16}px)` }}>
      <span className={TILE}>
        <Glyph icon={inp.mark} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[0.88rem] leading-tight font-medium text-ink sm:text-[0.92rem] ${compact ? "" : "truncate"}`}>{inp.name}</span>
        {!compact && <span className="mt-1 block truncate font-mono text-[0.7rem] text-ink/50">{inp.detail}</span>}
      </span>
      <span className={`relative size-4 shrink-0 place-items-center ${compact ? "hidden" : "grid"}`}>
        <span className="size-2.5 rounded-full" style={{ background: inp.dot, opacity: 1 - spent }} />
        <span className="absolute inset-0" style={{ opacity: spent }}>
          <Tick className="size-4" />
        </span>
      </span>
    </div>
  );
}

/** An outcome: a port where the wire arrives, then its tile, name and, once lit, its proof. */
function OutRow({ o, lit, compact = false }: { o: (typeof HERO.outcomes)[number]; lit: number; compact?: boolean }) {
  const dim = 0.38 + 0.62 * lit;
  return (
    <div className="flex h-full items-center gap-3" style={{ opacity: dim }}>
      {!compact && <span className="size-2.5 shrink-0 rounded-full" style={{ background: `color-mix(in srgb, var(--ink) ${Math.round(18 + 82 * lit)}%, white)` }} />}
      <span className={TILE} style={{ boxShadow: `0 0 0 1px rgb(23 44 33 / ${0.07 + 0.13 * lit}), 0 ${6 + 6 * lit}px ${14 + 6 * lit}px -6px rgb(23 44 33 / ${0.28 + 0.1 * lit})` }}>
        <Glyph icon={o.icon} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.92rem] leading-tight font-medium text-ink">{o.name}</span>
        <span className="mt-0.5 block text-[0.78rem] leading-snug text-ink/55">{o.line}</span>
        <span className="mt-1.5 block truncate font-mono text-[0.7rem] text-[#1a7f47]" style={{ opacity: seg(lit, 0.2, 1), transform: `translateY(${(1 - lit) * 4}px)` }}>
          {o.proof}
        </span>
      </span>
    </div>
  );
}

const fadeIn = (v: number, rise = 6): CSSProperties => ({ opacity: v, transform: `translateY(${(1 - v) * rise}px)` });

/** The article: waits for inputs, shows its brief, then its draft, gaining a part with each review layer. */
function Article({ s }: { s: number }) {
  const a = HERO.article;
  const waiting = 1 - seg(s, BEAT[1] - 0.2, BEAT[1] + 0.6);
  const brief = seg(s, BEAT[1], BEAT[1] + 0.6) * (1 - seg(s, BUILD - 0.2, BUILD + 0.8));
  const draft = seg(s, BUILD, BUILD + 0.8);
  const layer = HERO.reviews.map((_, j) => clamp01((s - LAYER_AT(j)) / LAYER));
  const published = s >= PUB;
  const status = published ? "Published" : s >= BUILD ? "In review" : s >= BEAT[1] ? "Brief" : "Waiting for inputs";

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgb(23_44_33/0.05),0_26px_50px_-26px_rgb(23_44_33/0.35)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3 text-[0.78rem] text-ink/50">
        <span>{a.client} blog</span>
        <span className="flex items-center gap-1.5" style={{ color: published ? "#1a7f47" : undefined }}>
          <span className="size-1.5 rounded-full" style={{ background: published ? "#1a7f47" : s >= BEAT[1] ? "var(--accent)" : "rgb(23 44 33 / 0.25)" }} />
          {status}
        </span>
      </div>

      <div className="relative h-[20.5rem] sm:h-[18.5rem]">
        {/* Waiting: an empty page. */}
        <div className="absolute inset-0 space-y-3.5 px-5 pt-5" style={{ opacity: waiting }}>
          <span className="block h-5 w-3/4 rounded-md border border-dashed border-ink/20" />
          <span className="block space-y-2.5">
            {[100, 94, 72].map((w) => (
              <span key={w} style={{ width: `${w}%` }} className="block h-2 rounded-full border border-dashed border-ink/15" />
            ))}
          </span>
          <span className="block h-14 rounded-lg border border-dashed border-ink/15" />
          <span className="flex gap-2">
            <span className="block h-6 w-28 rounded-full border border-dashed border-ink/15" />
            <span className="block h-6 w-20 rounded-full border border-dashed border-ink/15" />
          </span>
        </div>

        {/* Brief: four fields, each landing when its packet arrives. */}
        <div className="absolute inset-0 px-5 pt-4" style={{ opacity: brief }}>
          <p className="text-[0.7rem] tracking-[0.08em] text-ink/40 uppercase">Content brief</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-5">
            {HERO.brief.map((f) => {
              const land = seg(s, PACKET(f.input) + TRAVEL - 0.1, PACKET(f.input) + TRAVEL + 0.6);
              return (
                <li key={f.field} className="border-b border-line py-3.5 [&:nth-last-child(-n+2)]:border-0" style={fadeIn(land, 8)}>
                  <p className="flex items-center gap-1.5 font-mono text-[0.68rem] text-ink/50">
                    <span className="size-1.5 rounded-full" style={{ background: HERO.inputs[f.input].dot }} />
                    {f.field}
                  </p>
                  <p className="mt-1 text-[0.88rem] leading-snug text-ink">{f.value}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Draft: each review layer adds its part. */}
        <div className="absolute inset-0 space-y-3 px-5 pt-5" style={{ opacity: draft }}>
          <p className="text-[1.02rem] leading-snug font-semibold tracking-[-0.015em] text-ink" style={fadeIn(seg(s, LAYER_AT(0) + 0.1, LAYER_AT(0) + 0.8))}>
            {a.title}
          </p>
          <p
            className="-mx-2 rounded-lg px-2 py-1.5 text-[0.84rem] leading-[1.55] text-ink/65"
            style={{ ...fadeIn(seg(s, LAYER_AT(0) + 0.5, LAYER_AT(0) + 1.2)), background: `rgb(232 131 58 / ${0.1 * (1 - seg(s, LAYER_AT(2) + 0.5, LAYER_AT(2) + 1.3))})` }}
          >
            {a.intro}
          </p>
          <p className="rounded-lg bg-paper px-3 py-2.5 font-mono text-[0.74rem] leading-relaxed [overflow-wrap:anywhere] text-ink/75" style={fadeIn(seg(s, LAYER_AT(0) + 0.9, LAYER_AT(0) + 1.6))}>
            {a.code}
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--primary)_40%,var(--line))] bg-[color-mix(in_srgb,var(--light-green-soft)_75%,white)] px-2.5 py-1 text-[0.74rem] text-[#1a7f47]"
            style={fadeIn(seg(s, LAYER_AT(1) + 0.4, LAYER_AT(1) + 1.1), 4)}
          >
            <Tick className="size-3.5" />
            {a.tested}
          </span>
          <div className="flex gap-1.5" style={fadeIn(seg(s, LAYER_AT(3) + 0.4, LAYER_AT(3) + 1.1), 4)}>
            {["Key takeaways", "FAQ schema"].map((x) => (
              <span key={x} className="rounded-full border border-ink/12 bg-paper px-2.5 py-1 font-mono text-[0.72rem] text-ink/70">
                {x}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The four review layers: a hairline fills while each one runs. */}
      <ol className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-line bg-paper/50 px-5 py-3.5">
        {HERO.reviews.map((r, j) => {
          const on = layer[j] > 0 && layer[j] < 1;
          const done = layer[j] >= 1;
          return (
            <li key={r.name} className={on ? "text-ink" : done ? "text-ink/70" : "text-ink/35"}>
              <span className="block h-px bg-ink/12">
                <span className="block h-px origin-left bg-ink" style={{ transform: `scaleX(${layer[j]})` }} />
              </span>
              <span className="mt-2 flex items-center gap-2 text-[0.76rem] leading-tight">
                {done ? <Tick className="size-3.5" /> : on ? <span className="size-2 rounded-full bg-accent" /> : <span className="size-2 rounded-full border border-ink/20" />}
                <span className="truncate">
                  <span className="sm:hidden">{r.short}</span>
                  <span className="hidden sm:inline">{r.name}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
