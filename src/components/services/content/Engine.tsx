"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Label } from "../kit";
import { CANVAS, FRAME, StepChip } from "../parts";
import { ENGINE } from "./content";

// One engine, not four services: a single card split into four columns, with a shared track across the top
// on the dotted canvas. A small article travels it slowly, pausing at each stage (its node turns deep green),
// then rides a soft curve back under the track to Strategy: what one piece learns feeds the next cycle.
// Phones: the same track runs down a rail beside the stacked stages, with the return as a note below.
// Runs only while on screen; reduced motion parks the article at the end with every stage lit.

const HOLD = 0.8; // s at each node
const MOVE = 2.2; // s between nodes
const BACK = 2.4; // s along the return curve
const PASS = HOLD + 3 * (MOVE + HOLD) + BACK;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The article at `t` seconds into a pass: `p` is its stage (0–3, fractional while moving); `back` is its
 *  progress along the return curve (−1 when not returning). */
function at(t: number) {
  let s = t - HOLD;
  if (s < 0) return { p: 0, back: -1 };
  for (let i = 0; i < 3; i++) {
    if (s < MOVE) return { p: i + ease(s / MOVE), back: -1 };
    s -= MOVE;
    if (s < HOLD) return { p: i + 1, back: -1 };
    s -= HOLD;
  }
  return { p: 3, back: ease(clamp01(s / BACK)) };
}

// Desktop strip geometry (px). Nodes sit at the column centers: (2i + 1) / 8 of the width.
const TRACK_Y = 62;
const LIFT = 26; // the article rides this far above the track
const DIP = 46; // the return curve's control depth below the track
const nodeX = (p: number) => ((2 * p + 1) / 8) * 100;
/** A point on the return curve (cubic from Distribution's node, under, to Strategy's), as [x%, y px]. */
function curve(k: number): [number, number] {
  const u = 1 - k;
  const x = u ** 3 * 0.875 + 3 * u * u * k * 0.875 + 3 * u * k * k * 0.125 + k ** 3 * 0.125;
  const y = 3 * u * u * k * DIP + 3 * u * k * k * DIP;
  return [x * 100, y];
}

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export default function Engine() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || still) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(Math.max(now - last, 0), 100) / 1000;
      last = now;
      setT((v) => (v + dt) % PASS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, still]);

  const { p, back } = still ? { p: 3, back: -1 } : at(t);
  // How lit each stage is: reached this pass; on the way back the later stages fade for the next cycle.
  const lit = (i: number) => (back < 0 ? (p >= i - 1e-3 ? 1 : 0) : i === 0 ? 1 : 1 - back);

  // Desktop article position: above the track while travelling; dropping onto the curve, round, and back up.
  let x = nodeX(p);
  let y = TRACK_Y - LIFT;
  if (back >= 0 && back < 0.12) y = TRACK_Y - LIFT * (1 - back / 0.12);
  else if (back >= 0.12 && back <= 0.88) {
    const [cx, cy] = curve((back - 0.12) / 0.76);
    x = cx;
    y = TRACK_Y + cy;
  } else if (back > 0.88) {
    x = nodeX(0);
    y = TRACK_Y - LIFT * ((back - 0.88) / 0.12);
  }
  const fill = back < 0 ? nodeX(p) - nodeX(0) : nodeX(3) - nodeX(0);
  const fillO = back < 0 ? 1 : 1 - back;
  // Phones: the article fades out at the end and back in at the start instead of taking the curve.
  const mobileO = back >= 0 ? clamp01(1 - back * 2) : still ? 1 : clamp01(t / 0.4);

  return (
    <section aria-labelledby="engine-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{ENGINE.label}</Label>
        <h2 id="engine-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {ENGINE.title}
        </h2>
        <p className="mt-6 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{ENGINE.body}</p>

        <div ref={box} className={`${FRAME} mt-14`}>
          {/* The shared track, desktop. */}
          <div aria-hidden="true" className={`${CANVAS} relative hidden h-[8.5rem] border-b border-line lg:block`}>
            <span className="absolute h-[1.5px] rounded-full bg-ink/12" style={{ left: `${nodeX(0)}%`, width: `${nodeX(3) - nodeX(0)}%`, top: TRACK_Y }} />
            <span
              className="absolute h-[1.5px] rounded-full bg-[#1a7f47]/45"
              style={{ left: `${nodeX(0)}%`, width: `${fill}%`, top: TRACK_Y, opacity: fillO }}
            />
            <svg className="absolute inset-x-0 w-full overflow-visible" style={{ top: TRACK_Y + 1, height: DIP }} viewBox={`0 0 1000 ${DIP}`} preserveAspectRatio="none">
              <path
                d={`M875 0 C875 ${DIP}, 125 ${DIP}, 125 0`}
                fill="none"
                stroke="var(--ink)"
                strokeOpacity={0.16 + 0.2 * (back >= 0 ? Math.sin(back * Math.PI) : 0)}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <p className="absolute inset-x-0 text-center text-[11.5px] text-ink/50" style={{ top: TRACK_Y + DIP * 0.75 + 8 }}>
              Compounds into the next cycle
            </p>
            {ENGINE.parts.map((_, i) => (
              <Node key={i} lit={lit(i)} style={{ left: `${nodeX(i)}%`, top: TRACK_Y }} />
            ))}
            <Article style={{ left: `${x}%`, top: y }} />
          </div>

          <ol className="relative grid auto-rows-fr divide-y divide-line lg:auto-rows-auto lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            {ENGINE.parts.map((part, i) => (
              <li key={part.name} className="py-6 pr-6 pl-16 lg:px-7 lg:pt-7 lg:pb-9">
                <StepChip n={i + 1} />
                <h3 className="mt-4 text-[1.15rem] font-medium tracking-[-0.02em] text-ink">{part.name}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">{part.body}</p>
              </li>
            ))}
            {/* The same track as a rail, phones. */}
            <li aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-14 border-0! lg:hidden">
              <span className="absolute left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-ink/12" style={{ top: 37, bottom: `calc(25% - 37px)` }} />
              {ENGINE.parts.map((_, i) => (
                <Node key={i} lit={lit(i)} style={{ left: "50%", top: `calc(${i * 25}% + 37px)` }} />
              ))}
              <Article style={{ left: "50%", top: `calc(${p * 25}% + 37px)`, opacity: mobileO }} small />
            </li>
          </ol>
          <p className="border-t border-line px-6 py-4 text-[0.85rem] text-ink/55 lg:hidden">↺ Compounds into the next cycle</p>
        </div>
      </div>
    </section>
  );
}

/** A stage node on the track: a hairline ring that turns deep green when the article reaches it. */
function Node({ lit, style }: { lit: number; style: CSSProperties }) {
  return (
    <span className="absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-line bg-white" style={style}>
      <span className="absolute inset-[-1.5px] rounded-full border-[1.5px] border-[#1a7f47]" style={{ opacity: lit }} />
      <span className="size-1.5 rounded-full bg-[#1a7f47]" style={{ opacity: lit }} />
    </span>
  );
}

/** The travelling article: a mini sheet with a doc glyph. */
function Article({ style, small = false }: { style: CSSProperties; small?: boolean }) {
  return (
    <span
      className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-line bg-white shadow-[0_1px_1.6px_rgb(15_26_20/0.05),0_6px_14px_rgb(15_26_20/0.1)] ${
        small ? "h-7 w-6" : "h-9 w-[30px]"
      }`}
      style={style}
    >
      <FileText className={small ? "size-3.5 text-ink/60" : "size-4 text-ink/60"} strokeWidth={1.8} />
    </span>
  );
}
