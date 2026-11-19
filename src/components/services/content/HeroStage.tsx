"use client";

import { BookOpen } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Mark, Tick, type Icon } from "../parts";
import { HERO } from "./content";

// The hover pill rising in with a slight overshoot.
const KEYFRAMES = `
@keyframes pop-in { from { opacity: 0; transform: translateY(6px) scale(0.9); } }
`;

// The hero visual: one article, written in front of you, then put to work. Read left to right.
//   Inputs  → four signals, each a pill with its brand mark. Each one sends a packet into the article.
//   Brief   → the packets land as the four rows of a content brief (a properties list, in each input's colour).
//   Build   → the title types itself; the brief steps aside for the page, which was waiting as quiet placeholders.
//             Four review layers then run in turn along the stepper at the foot; each one fills in a part of the page
//             (writing, a code sample, the second half, the key takeaways), so the page is visibly more complete.
//   Publish → the status flips to Published and the article sends a packet to Developers, Google and AI search.
// One clock (seconds) drives every value through easing, with no CSS transitions on driven values, so every
// hand-off is continuous. Hovering an input or outcome spotlights its path: everything else dims, its wire stays
// lit and a pill over the article names the link (the brief row lights too while it shows).
// Below xl the same story stacks vertically (no wires). The still frame is the finished picture, shown before the
// loop runs and with reduced motion. Between loops nothing leaves the stage: the inputs, wires, card and outcomes
// stay put; the ticks, lit wires and glows ease off and the card's contents cross-fade back to the empty draft.

const CYCLE = 26.5;
const FINAL = 24;
const LEAD = 0.6; // the loop waits this long after the stage scrolls in, so it opens on an empty, settled picture

// The timeline, in seconds.
const IN_AT = (i: number) => 0.5 + 0.5 * i; // input i appears
const BEAT = [0, 3.4, 8.4, 18]; // where each beat starts
const PACKET = (i: number) => 3.6 + 0.6 * i; // brief packet i leaves…
const TRAVEL = 1.3; // …and takes this long
const LAND = (i: number) => PACKET(i) + TRAVEL; // its brief row lands
const TYPE = 8.4; // the title starts typing…
const TYPE_FOR = 1.5; // …for this long
const SWAP = 8.7; // the brief steps aside for the page
const LAYER = 2.2; // each review layer
const LAYER_AT = (j: number) => 9.2 + LAYER * j;
const PUB = 18.2; // published
const SEND = (k: number) => 18.8 + 0.6 * k; // outcome packet k leaves
const SEND_FOR = 1.4;
const FADE = 25.2; // the picture rewinds before it replays: the frame stays, only its state eases back
const REFILL = 0.7; // after the loop restarts, the article's contents ease back in over this long

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const out3 = (v: number) => 1 - (1 - v) ** 3;
const io3 = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
const lin = (v: number) => v;
/** Progress 0–1 from `a` to `b` seconds, eased out by default. */
const seg = (s: number, a: number, b: number, f = out3) => f(clamp01((s - a) / (b - a)));

function useClock() {
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(FINAL);
  const [looped, setLooped] = useState(false); // a full loop has played: the inputs are already on stage
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const t = Math.max(0, (now - start) / 1000 - LEAD);
      setS(t % CYCLE);
      setLooped(t >= CYCLE);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(raf);
        start = 0;
        setS(0);
        setLooped(false);
        if (e.isIntersecting) raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return [box, s, looped] as const;
}

// Desktop geometry (px). Rows and wires share these numbers, so they line up by construction.
const H = 440; // stage height
const MID = H / 2;
const GAP = 80; // width of each wire column
const IN_H = 62;
const IN_Y = [-114, -38, 38, 114]; // input row centres, from the middle
const OUT_H = 68;
const OUT_Y = [-98, 0, 98];
const COLS = "xl:grid-cols-[minmax(0,1fr)_80px_minmax(0,1.6fr)_80px_minmax(0,1fr)]";

/** A point on the cubic from (0, y0) to (GAP, y1) that leaves and arrives horizontally. */
function bez(y0: number, y1: number, u: number): [number, number] {
  const v = 1 - u;
  const x = 3 * v * v * u * (GAP / 2) + 3 * v * u * u * (GAP / 2) + u ** 3 * GAP;
  const y = v ** 3 * y0 + 3 * v * v * u * y0 + 3 * v * u * u * y1 + u ** 3 * y1;
  return [x, y];
}
const wire = (y0: number, y1: number) => `M0 ${y0} C${GAP / 2} ${y0} ${GAP / 2} ${y1} ${GAP} ${y1}`;

export default function HeroStage() {
  const [box, s, looped] = useClock();
  const beat = s < BEAT[1] ? 0 : s < BEAT[2] ? 1 : s < BEAT[3] ? 2 : 3;
  const keep = 1 - seg(s, FADE, CYCLE, io3); // 1, easing to 0 as the picture rewinds at the end of a loop
  const veil = s >= FADE ? keep : looped ? seg(s, 0, REFILL) : 1; // the article's contents: out, then back in

  // Per-input and per-outcome progress.
  const appear = HERO.inputs.map((_, i) => (looped ? 1 : seg(s, IN_AT(i), IN_AT(i) + 0.8)));
  const go = HERO.inputs.map((_, i) => seg(s, PACKET(i), PACKET(i) + TRAVEL, io3));
  const spent = go.map((u) => seg(u, 0.92, 1) * keep);
  const send = HERO.outcomes.map((_, k) => seg(s, SEND(k), SEND(k) + SEND_FOR, io3));
  const lit = send.map((u) => seg(u, 0.9, 1) * keep);
  const ripple = HERO.outcomes.map((_, k) => clamp01((s - (SEND(k) + SEND_FOR)) / 1));

  const [hot, setHot] = useState<{ side: "in" | "out"; i: number } | null>(null);
  const hotIn = hot?.side === "in" && appear[hot.i] > 0.5 ? hot.i : -1;
  const hotOut = hot?.side === "out" ? hot.i : -1;
  const focus = hotIn >= 0 || hotOut >= 0;
  const link =
    hotIn >= 0 ? { dot: HERO.inputs[hotIn].dot, text: `${HERO.inputs[hotIn].name} → ${HERO.brief.find((f) => f.input === hotIn)?.field}` }
    : hotOut >= 0 ? { dot: HERO.outcomes[hotOut].dot, text: `Article → ${HERO.outcomes[hotOut].name}` }
    : null;
  const fade = (on: boolean): CSSProperties => ({ opacity: !focus || on ? 1 : 0.28, transition: "opacity 200ms" });

  return (
    <div ref={box} aria-hidden="true" className="w-full">
      {/* Desktop: inputs → article → outcomes on fixed rows, joined by wires. */}
      <div className={`hidden xl:grid ${COLS}`}>
        <Stages beat={beat} slot={0} />
        <span />
        <Stages beat={beat} slot={1} />
        <span />
        <Stages beat={beat} slot={2} />
      </div>
      <div className={`relative mt-4 hidden xl:grid ${COLS}`} style={{ height: H }}>
        <div className="relative">
          {HERO.inputs.map((inp, i) => (
            <div
              key={inp.name}
              className="absolute inset-x-0"
              style={{ top: MID + IN_Y[i] - IN_H / 2, height: IN_H, ...fade(hotIn === i) }}
              onPointerEnter={() => setHot({ side: "in", i })}
              onPointerLeave={() => setHot(null)}
            >
              <InputRow inp={inp} a={appear[i]} spent={spent[i]} hot={hotIn === i} />
            </div>
          ))}
        </div>
        <svg width={GAP} height={H} className="overflow-visible">
          {HERO.inputs.map((inp, i) => {
            const y0 = MID + IN_Y[i];
            const [px, py] = bez(y0, MID, go[i]);
            return (
              <g key={i} style={fade(hotIn === i)}>
                <path d={wire(y0, MID)} fill="none" stroke="var(--ink)" strokeOpacity={0.1 * appear[i]} strokeWidth={1.25} />
                <path d={wire(y0, MID)} pathLength={1} fill="none" stroke={inp.dot} strokeOpacity={0.6 * keep} strokeWidth={1.25} strokeDasharray="1 1" strokeDashoffset={1 - go[i]} />
                <path d={wire(y0, MID)} fill="none" stroke={inp.dot} strokeWidth={10} strokeLinecap="round" style={{ opacity: hotIn === i ? 0.14 : 0, transition: "opacity 200ms" }} />
                <path d={wire(y0, MID)} fill="none" stroke={inp.dot} strokeWidth={2.25} strokeLinecap="round" style={{ opacity: hotIn === i ? 1 : 0, transition: "opacity 200ms" }} />
                {go[i] > 0 && go[i] < 1 && (
                  <>
                    <circle cx={px} cy={py} r={9} fill={inp.dot} opacity={0.16} />
                    <circle cx={px} cy={py} r={4} fill={inp.dot} stroke="#fff" strokeWidth={1.5} />
                  </>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex items-center">
          <Article s={s} veil={veil} hotIn={hotIn} hotOut={hotOut} link={link} />
        </div>
        <svg width={GAP} height={H} className="overflow-visible">
          {HERO.outcomes.map((o, k) => {
            const y1 = MID + OUT_Y[k];
            const [px, py] = bez(MID, y1, send[k]);
            return (
              <g key={k} style={fade(hotOut === k)}>
                <path d={wire(MID, y1)} fill="none" stroke="var(--ink)" strokeOpacity={0.1} strokeWidth={1.25} />
                <path d={wire(MID, y1)} pathLength={1} fill="none" stroke={o.dot} strokeOpacity={0.6 * keep} strokeWidth={1.25} strokeDasharray="1 1" strokeDashoffset={1 - send[k]} />
                <path d={wire(MID, y1)} fill="none" stroke={o.dot} strokeWidth={10} strokeLinecap="round" style={{ opacity: hotOut === k ? 0.14 : 0, transition: "opacity 200ms" }} />
                <path d={wire(MID, y1)} fill="none" stroke={o.dot} strokeWidth={2.25} strokeLinecap="round" style={{ opacity: hotOut === k ? 1 : 0, transition: "opacity 200ms" }} />
                {send[k] > 0 && send[k] < 1 && (
                  <>
                    <circle cx={px} cy={py} r={9} fill={o.dot} opacity={0.16} />
                    <circle cx={px} cy={py} r={4} fill={o.dot} stroke="#fff" strokeWidth={1.5} />
                  </>
                )}
              </g>
            );
          })}
        </svg>
        <div className="relative">
          {HERO.outcomes.map((o, k) => (
            <div
              key={o.name}
              className="absolute inset-x-0"
              style={{ top: MID + OUT_Y[k] - OUT_H / 2, height: OUT_H, ...fade(hotOut === k) }}
              onPointerEnter={() => setHot({ side: "out", i: k })}
              onPointerLeave={() => setHot(null)}
            >
              <OutRow o={o} lit={lit[k]} ripple={ripple[k]} hot={hotOut === k} />
            </div>
          ))}
        </div>
      </div>

      {/* Below xl: the same story, stacked. */}
      <div className="space-y-6 xl:hidden">
        <Stages beat={beat} slot={0} />
        <div className="mx-auto grid max-w-[34rem] grid-cols-1 gap-3 sm:grid-cols-2">
          {HERO.inputs.map((inp, i) => (
            <div key={inp.name} className="h-[3.75rem]">
              <InputRow inp={inp} a={appear[i]} spent={spent[i]} hot={false} compact />
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-[26rem] space-y-6">
          <Stages beat={beat} slot={1} />
          <Article s={s} veil={veil} hotIn={-1} hotOut={-1} link={null} />
        </div>
        <Stages beat={beat} slot={2} />
        <div className="mx-auto max-w-[34rem] space-y-3">
          {HERO.outcomes.map((o, k) => (
            <div key={o.name} className="h-[4.25rem]">
              <OutRow o={o} lit={lit[k]} ripple={ripple[k]} hot={false} compact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One stage title, kept small: its number, a status dot and the name. Playing = ink, with a brand-green dot that
 *  breathes; done = muted, with a solid green dot; to come = faint, with a hollow dot. */
function Stage({ n, state, children }: { n: number; state: "todo" | "on" | "done"; children: ReactNode }) {
  const text = state === "on" ? "text-ink" : state === "done" ? "text-ink/50" : "text-ink/30";
  return (
    <p className={`mx-auto flex w-fit items-center gap-2 font-mono text-[0.7rem] tracking-[0.1em] whitespace-nowrap uppercase transition-colors duration-300 ${text}`}>
      <span className="text-ink/30 tabular-nums">0{n}</span>
      <span className="relative grid size-2 place-items-center">
        {state === "on" && <span className="absolute inset-0 animate-ping rounded-full bg-primary/50 [animation-duration:1.8s] motion-reduce:hidden" />}
        <span className={`relative size-1.5 rounded-full transition-colors duration-300 ${state === "todo" ? "border border-ink/30" : state === "on" ? "bg-primary" : "bg-[#1a7f47]/70"}`} />
      </span>
      {children}
    </p>
  );
}

/** The title over a column: Inputs on the left, Brief then Build & review (it swaps) over the article, Published on the right. */
function Stages({ beat, slot }: { beat: number; slot: 0 | 1 | 2 }) {
  if (slot === 0)
    return (
      <Stage n={1} state={beat === 0 ? "on" : "done"}>
        {HERO.beats[0]}
      </Stage>
    );
  if (slot === 2)
    return (
      <Stage n={3} state={beat === 3 ? "on" : "todo"}>
        {HERO.beats[3]}
      </Stage>
    );
  const review = beat >= 2;
  return (
    <Stage n={2} state={beat === 0 ? "todo" : beat === 3 ? "done" : "on"}>
      <span key={review ? 2 : 1} className="motion-safe:animate-fade-up">
        {HERO.beats[review ? 2 : 1]}
      </span>
    </Stage>
  );
}

const PILL = "relative isolate flex h-full items-center gap-3 rounded-2xl border border-ink/[0.12] bg-white px-3 transition-shadow duration-200";
const PILL_REST = "0 1px 2px rgb(23 44 33 / 0.06), 0 8px 18px -12px rgb(23 44 33 / 0.16)";
const PILL_HOT = (c: string) => `0 16px 30px -18px color-mix(in srgb, ${c} 75%, transparent), 0 1px 2px rgb(23 44 33 / 0.05)`;
/** The hover wash: the pill's own colour, pooling from the side its wire meets it. No outline. */
const WASH = (c: string, side: "left" | "right", on: boolean): CSSProperties => ({
  background: `linear-gradient(${side === "left" ? 90 : 270}deg, color-mix(in srgb, ${c} 15%, white), color-mix(in srgb, ${c} 3%, white) 75%)`,
  opacity: on ? 1 : 0,
});
const TILE = "grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#f6f6f2] ring-1 ring-black/[0.05] transition-colors duration-200";
const tint = (c: string, on: boolean): CSSProperties | undefined => (on ? { background: `color-mix(in srgb, ${c} 16%, white)` } : undefined);

function Glyph({ icon }: { icon: Icon }) {
  return icon === "docs" ? <BookOpen className="size-[18px] text-ink/70" strokeWidth={1.8} /> : <Mark name={icon} className="size-[18px]" />;
}

/** An input signal: a white pill with its brand mark and name; the wire leaves from a port on its right edge. Hot = washed in its colour. */
function InputRow({ inp, a, spent, hot, compact = false }: { inp: (typeof HERO.inputs)[number]; a: number; spent: number; hot: boolean; compact?: boolean }) {
  return (
    <div className={PILL} style={{ opacity: a * (1 - 0.22 * spent), transform: `translateX(${(a - 1) * 14}px)`, boxShadow: hot ? PILL_HOT(inp.dot) : PILL_REST }}>
      <span aria-hidden className="absolute inset-0 -z-10 rounded-2xl transition-opacity duration-200" style={WASH(inp.dot, "right", hot)} />
      <span className={TILE} style={tint(inp.dot, hot)}>
        <Glyph icon={inp.mark} />
      </span>
      <span className="min-w-0 flex-1 text-[0.92rem] leading-tight font-medium text-ink">{inp.name}</span>
      <span className={`absolute top-1/2 -right-2 size-4 -translate-y-1/2 place-items-center transition-[scale] duration-200 ${compact ? "hidden" : "grid"}`} style={{ scale: hot ? 1.35 : 1 }}>
        <span className="size-2.5 rounded-full" style={{ background: inp.dot, opacity: 1 - spent, boxShadow: `0 0 0 3px #fff, 0 0 0 4.5px color-mix(in srgb, ${inp.dot} 26%, transparent)` }} />
        <span className="absolute inset-0" style={{ opacity: spent }}>
          <Tick className="size-4 ring-[3px] ring-white" />
        </span>
      </span>
    </div>
  );
}

/** An outcome: a white pill with a port on its left edge where the wire arrives, in the outcome's colour. Once lit it rings out and takes a faint wash; hot deepens it. */
function OutRow({ o, lit, ripple, hot, compact = false }: { o: (typeof HERO.outcomes)[number]; lit: number; ripple: number; hot: boolean; compact?: boolean }) {
  return (
    <div className={PILL} style={{ opacity: hot ? 1 : 0.88 + 0.12 * lit, boxShadow: hot ? PILL_HOT(o.dot) : PILL_REST }}>
      <span aria-hidden className="absolute inset-0 -z-10 rounded-2xl" style={{ ...WASH(o.dot, "left", true), opacity: hot ? 1 : 0.38 * lit }} />
      {!compact && (
        <span className="absolute top-1/2 -left-[5px] size-2.5 -translate-y-1/2 transition-[scale] duration-200" style={{ scale: hot ? 1.35 : 1 }}>
          <span className="absolute inset-0 rounded-full border" style={{ borderColor: o.dot, opacity: (1 - ripple) * 0.6 * (ripple > 0 ? 1 : 0), transform: `scale(${1 + 2.4 * ripple})` }} />
          <span className="absolute inset-0 rounded-full" style={{ background: `color-mix(in srgb, ${o.dot} ${Math.round(30 + 70 * lit)}%, white)`, boxShadow: `0 0 0 3px #fff, 0 0 0 4.5px color-mix(in srgb, ${o.dot} 26%, transparent)` }} />
        </span>
      )}
      <span className={TILE} style={tint(o.dot, hot)}>
        <Glyph icon={o.icon} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.98rem] leading-tight font-medium text-ink">{o.name}</span>
        <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink/60">{o.line}</span>
      </span>
    </div>
  );
}

const fadeIn = (v: number, rise = 6): CSSProperties => ({ opacity: v, transform: `translateY(${(1 - v) * rise}px)` });

/** A line of placeholder text: a quiet track that fills left to right as it is "written". */
function Line({ w, p, tone = "bg-ink/[0.17]" }: { w: number; p: number; tone?: string }) {
  return (
    <span className="relative block h-2 overflow-hidden rounded-full bg-ink/[0.055]" style={{ width: `${w}%` }}>
      <span className={`absolute inset-0 origin-left rounded-full ${tone}`} style={{ transform: `scaleX(${p})` }} />
    </span>
  );
}

const STATUS_TONE = { Draft: "bg-ink/[0.05] text-ink/55", Brief: "bg-accent/10 text-[#b8561b]", "In review": "bg-accent/10 text-[#b8561b]", Published: "bg-[#e3f3e8] text-[#1a7f47]" } as const;
const STATUS_DOT = { Draft: "bg-ink/30", Brief: "bg-accent", "In review": "bg-accent", Published: "bg-[#1a7f47]" } as const;

/**
 * The article, as one document that never changes shape: a tag and status up top, the title, a body, and the
 * review stepper below. The body shows the brief at first, then the page itself.
 */
function Article({ s, veil = 1, hotIn, hotOut, link }: { s: number; veil?: number; hotIn: number; hotOut: number; link: { dot: string; text: string } | null }) {
  const g = HERO.guide;
  const waiting = 1 - seg(s, BEAT[1] - 0.2, BEAT[1] + 0.6);
  const typed = seg(s, TYPE, TYPE + TYPE_FOR, lin);
  const built = seg(s, TYPE, TYPE + 0.8); // the tag settles as the guide takes shape
  const lp = HERO.reviews.map((_, j) => clamp01((s - LAYER_AT(j)) / LAYER));
  const ghost = (m: number) => seg(s, SWAP + 0.45 + 0.1 * m, SWAP + 1.15 + 0.1 * m); // body block m eases in
  const published = s >= PUB;
  const status = published ? "Published" : s >= TYPE ? "In review" : s >= BEAT[1] ? "Brief" : "Draft";
  const inBrief = hotIn >= 0 && s < SWAP;
  const dim = (hotIn >= 0 && !inBrief) || hotOut >= 0; // the spotlight is elsewhere: step the page back
  const cut = Math.round(g.title.length * typed);

  return (
    <div className="relative w-full">
<style href="content-hero-stage" precedence="default">{KEYFRAMES}</style>
      {link && (
        <span className="absolute -top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-ink/[0.08] bg-white py-1.5 pr-4 pl-3 text-[0.8rem] font-medium whitespace-nowrap text-ink shadow-[0_12px_26px_-12px_rgb(23_44_33/0.4)] motion-safe:animate-[pop-in_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <span className="size-2 rounded-full" style={{ background: link.dot, boxShadow: `0 0 0 3px color-mix(in srgb, ${link.dot} 22%, transparent)` }} />
          {link.text}
        </span>
      )}

      <div
        className={`flex h-[29rem] flex-col overflow-hidden rounded-[20px] border bg-white ring-1 ring-black/[0.02] transition-[border-color,opacity] duration-300 sm:h-[26rem] [&>*]:[opacity:var(--veil)] ${published ? "border-[#1a7f47]/25" : "border-black/[0.07]"}`}
        style={{ opacity: dim ? 0.5 : 1, ["--veil" as string]: veil, boxShadow: "0 1px 1px rgb(23 44 33 / 0.04), 0 2px 4px rgb(23 44 33 / 0.04), 0 28px 50px -24px rgb(23 44 33 / 0.3)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <span
            className="rounded-full border border-[color-mix(in_srgb,var(--primary)_40%,var(--line))] bg-[color-mix(in_srgb,var(--light-green-soft)_75%,white)] px-3 py-1 text-[0.76rem] font-medium text-[#1a7f47]"
            style={{ opacity: 0.35 + 0.65 * built }}
          >
            {g.tag}
          </span>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.76rem] font-medium transition-colors duration-300 ${STATUS_TONE[status]}`}>
            <span className={`size-1.5 rounded-full transition-colors duration-300 ${STATUS_DOT[status]}`} />
            {status}
          </span>
        </div>

        {/* The title: an "Untitled" placeholder until the guide's title types itself in. The rest of the words are laid out, unseen, so lines never re-wrap mid-type. */}
        <div className="relative mt-4 h-[5.2rem] px-5 sm:h-[3.5rem]">
          <p className="absolute inset-x-5 text-[1.5rem] leading-[1.12] font-semibold tracking-[-0.035em] text-ink/20" style={{ opacity: 1 - seg(s, TYPE - 0.1, TYPE + 0.15) }}>
            Untitled
          </p>
          <p className="text-[1.5rem] leading-[1.12] font-semibold tracking-[-0.035em] text-ink">
            {g.title.slice(0, cut)}
            <span className="ml-px inline-block h-[0.95em] w-[2px] translate-y-[0.12em] bg-accent" style={{ opacity: typed > 0 && typed < 1 ? 1 : 0 }} />
            <span className="opacity-0">{g.title.slice(cut)}</span>
          </p>
        </div>

        {/* The body: one area, two states. The brief's rows exit upward as the page's blocks ease in from below. */}
        <div className="relative mt-4 min-h-0 flex-1 px-5">
          <div className="absolute inset-x-5 inset-y-0 grid place-content-center rounded-xl border border-dashed border-ink/15 text-center" style={{ opacity: waiting }}>
            <p className="text-[1.02rem] font-medium tracking-[-0.01em] text-ink">{HERO.label}</p>
            <p className="mt-1 text-[0.86rem] text-ink/45">Gathering inputs…</p>
          </div>

          <ul className="absolute inset-x-5 inset-y-0">
            <li className="pb-2 text-[0.7rem] tracking-[0.1em] text-ink/40 uppercase" style={{ opacity: seg(s, BEAT[1], BEAT[1] + 0.6) * (1 - seg(s, SWAP, SWAP + 0.4)) }}>
              Content brief
            </li>
            {HERO.brief.map((f, r) => {
              const land = seg(s, LAND(f.input) - 0.1, LAND(f.input) + 0.6);
              const out = seg(s, SWAP + 0.07 * r, SWAP + 0.07 * r + 0.45);
              const flash = 1 - seg(s, LAND(f.input) + 0.3, LAND(f.input) + 1.4);
              const dot = HERO.inputs[f.input].dot;
              const lit = hotIn === f.input;
              return (
                <li
                  key={f.field}
                  className="relative border-t border-line"
                  style={{ opacity: land * (1 - out) * (inBrief && !lit ? 0.3 : 1), transform: `translateY(${(1 - land) * 8 - out * 10}px)` }}
                >
                  <span className="absolute inset-0 -mx-2 rounded-lg" style={{ background: `color-mix(in srgb, ${dot} ${Math.round(14 * Math.max(flash, lit ? 1 : 0))}%, transparent)` }} />
                  <span className="relative flex items-baseline justify-between gap-4 py-[0.68rem] sm:py-[0.62rem]">
                    <span className="flex shrink-0 items-center gap-2 text-[0.8rem] text-ink/50">
                      <span className="size-1.5 rounded-full" style={{ background: dot }} />
                      {f.field}
                    </span>
                    <span className="text-right text-[0.9rem] leading-snug text-ink">{f.value}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          {/* The page. Every block waits as a quiet placeholder and fills when its review layer runs. */}
          <div className="absolute inset-x-5 inset-y-0 flex flex-col justify-start gap-2.5">
            <div className="rounded-xl border border-ink/[0.07] p-3" style={{ ...fadeIn(ghost(0), 10), background: `rgb(26 127 71 / ${0.075 * seg(lp[3], 0, 0.4, lin)})` }}>
              <p className="text-[0.68rem] font-medium tracking-[0.06em] text-[#1a7f47] uppercase" style={{ opacity: 0.3 + 0.7 * seg(lp[3], 0, 0.35, lin) }}>
                Key takeaways
              </p>
              <span className="mt-2 block space-y-1.5">
                <Line w={92} p={seg(lp[3], 0.25, 0.7, lin)} tone="bg-[#1a7f47]/30" />
                <Line w={64} p={seg(lp[3], 0.5, 0.95, lin)} tone="bg-[#1a7f47]/30" />
              </span>
            </div>
            <div className="space-y-1.5 px-0.5" style={fadeIn(ghost(1), 10)}>
              <Line w={100} p={seg(lp[0], 0, 0.45, lin)} />
              <Line w={94} p={seg(lp[0], 0.25, 0.7, lin)} />
              <Line w={58} p={seg(lp[0], 0.5, 0.95, lin)} />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-ink/[0.07] px-3 py-2.5" style={{ ...fadeIn(ghost(2), 10), background: `rgb(23 44 33 / ${0.035 * seg(lp[1], 0, 0.4, lin)})` }}>
              {[
                ["#1f9e8f", 22, 0.25],
                ["#7a5af5", 34, 0.45],
                ["#e8833a", 26, 0.65],
              ].map(([c, w, a]) => (
                <span key={c as string} className="relative block h-2 overflow-hidden rounded-full bg-ink/[0.055]" style={{ width: `${w}%` }}>
                  <span className="absolute inset-0 origin-left rounded-full" style={{ background: c as string, opacity: 0.55, transform: `scaleX(${seg(lp[1], a as number, (a as number) + 0.3, lin)})` }} />
                </span>
              ))}
              <span className="ml-auto" style={{ opacity: seg(lp[1], 0.85, 1, lin) }}>
                <Tick className="size-4" />
              </span>
            </div>
            <div className="space-y-1.5 px-0.5" style={fadeIn(ghost(3), 10)}>
              <Line w={100} p={seg(lp[2], 0, 0.5, lin)} />
              <Line w={80} p={seg(lp[2], 0.4, 0.95, lin)} />
            </div>
          </div>
        </div>

        {/* The review stepper: four segments. Each one runs in coral while its layer works, then settles to ink with a tick. */}
        <ol className="mt-3 grid grid-cols-4 gap-3 border-t border-line bg-paper/60 px-5 pt-3.5 pb-4">
          {HERO.reviews.map((r, j) => {
            const on = lp[j] > 0 && lp[j] < 1;
            const done = lp[j] >= 1;
            return (
              <li key={r.name} className={`transition-colors duration-300 ${on ? "text-ink" : done ? "text-ink/70" : "text-ink/35"}`}>
                <span className="block h-[3px] overflow-hidden rounded-full bg-ink/[0.07]">
                  <span className="block h-full origin-left rounded-full" style={{ background: done ? "var(--ink)" : "var(--accent)", transform: `scaleX(${lp[j]})` }} />
                </span>
                <span className="mt-2.5 flex items-center gap-1.5 text-[0.74rem] leading-none whitespace-nowrap">
                  {done ? (
                    <Tick className="size-4" />
                  ) : on ? (
                    <span className="relative grid size-4 place-items-center">
                      <span className="absolute size-4 rounded-full bg-accent/25 motion-safe:animate-ping" />
                      <span className="size-2 rounded-full bg-accent" />
                    </span>
                  ) : (
                    <span className="size-4 rounded-full border border-ink/20" />
                  )}
                  <span className={on ? "" : "hidden sm:inline"}>{r.short}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
