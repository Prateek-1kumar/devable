"use client";

import { useId } from "react";
import { Label, useInView } from "../kit";
import { PROCESS } from "./content";
import { GREEN, INK, LINE, Layer, MOVE, Plate, SOFT, tilt, untilt } from "./PlateKit";

// The arrow that launches off its tray and lands again.
const KEYFRAMES = `
@keyframes launch {
  0% { transform: translateY(0); opacity: 1; }
  40% { transform: translateY(-16px); opacity: 0; }
  41% { transform: translateY(14px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
`;

// The workflow as six cards in a quiet 3 × 2 board, read left to right. Each card is a small illustrated tile, a
// number, a name and one line. No scroll-driven stage: the tiles are the personality, and they are built as real
// objects. Every tile is a plate with thickness and a floor shadow; its artwork is split into layers at different
// heights, each with its own drop shadow. Hovering a card tilts the plate toward the pointer, the layers separate in
// parallax and a green glare follows the cursor, while the icon acts out its verb with a springy ease:
//   Understand         a glass lens slides over a dotted page and the dots under it turn green
//   Prioritize         three items re-sort themselves, the long green one rising to the top
//   Build              a pencil writes a green line onto the page
//   Review             the comment bubble's badge fills green and draws its tick
//   Optimize & Publish an arrow launches off its tray and lands again while three surfaces light up
//   Improve            the bars grow in, one after another, the last one green
// The cards rise in once, as they scroll into view. Reduced motion: no tilt, no movement.

export default function Process() {
  const [ref, seen] = useInView<HTMLUListElement>(0.15);
  const tiles = [Understand, Prioritize, Build, Review, Publish, Improve];
  return (
    <section aria-labelledby="process-title" className="bg-[#f6f5f1] px-6 py-16 sm:px-12 lg:py-24 xl:px-[6vw]">
<style href="content-process" precedence="default">{KEYFRAMES}</style>
      <div className="mx-auto max-w-[76rem]">
        <Label>{PROCESS.label}</Label>
        <h2 id="process-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {PROCESS.title}
        </h2>
        <p className="mt-5 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{PROCESS.body}</p>

        <ul ref={ref} className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {PROCESS.steps.map((step, i) => {
            const Tile = tiles[i];
            return (
              <li
                key={step.name}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                className={`group relative flex flex-col gap-6 bg-white p-7 sm:p-8 ${seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0"}`}
                style={{ animationDelay: `${(i % 3) * 0.08 + Math.floor(i / 3) * 0.12}s` }}
              >
                <span className="absolute top-7 right-8 font-mono text-[0.72rem] tracking-[0.08em] text-ink/25 transition-colors duration-300 group-hover:text-ink/70">0{i + 1}</span>
                <Plate>
                  <Tile />
                </Plate>
                <div className="min-w-0">
                  <h3 className="text-[1.3rem] leading-[1.15] font-medium tracking-[-0.03em] text-ink">{step.name}</h3>
                  <p className="mt-2.5 max-w-[22rem] text-[0.97rem] leading-relaxed text-ink/60">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}


/** A dot-dither fill, as on the Engine glyphs. */
function Dots({ id, color, o = 0.55 }: { id: string; color: string; o?: number }) {
  return (
    <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.7" fill={color} fillOpacity={o} />
      <circle cx="3" cy="3" r="0.7" fill={color} fillOpacity={o} />
    </pattern>
  );
}

/** Understand: a glass lens over a dotted page; sliding it across turns the dots it covers green. */
function Understand() {
  const id = useId();
  const slide = `${MOVE} group-hover:translate-x-[-7px] group-hover:translate-y-[9px]`;
  return (
    <>
      <Layer z={6}>
        <defs>
          <Dots id={`${id}i`} color={INK} o={0.5} />
        </defs>
        <rect x="6" y="10" width="26" height="31" rx="4" fill={`url(#${id}i)`} stroke={INK} strokeOpacity="0.5" strokeWidth="1.5" />
      </Layer>
      <Layer z={10}>
        <g className={slide}>
          <circle cx="31" cy="22" r="9" fill={INK} fillOpacity="0.26" style={SOFT} />
        </g>
      </Layer>
      <Layer z={26}>
        <defs>
          <Dots id={`${id}g`} color={GREEN} o={1} />
        </defs>
        <g className={slide}>
          <circle cx="29" cy="18" r="9" fill="#fff" fillOpacity="0.88" stroke={INK} strokeWidth="1.8" />
          <circle cx="29" cy="18" r="6.6" fill={`url(#${id}g)`} />
          <path d="M26 14 a5 5 0 0 1 4 -2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M35.6 24.6 L42 31" {...LINE} strokeWidth="2.4" />
        </g>
      </Layer>
    </>
  );
}

const ROWS = [
  { w: 18, from: 0 }, // medium: moves down a place
  { w: 11, from: 10 }, // short: moves down a place
  { w: 28, from: 20, hot: true }, // long and green: rises to the top
];

/** One row of the priority list. */
function Row({ w, from, hot, shadow = false }: { w: number; from: number; hot?: boolean; shadow?: boolean }) {
  return (
    <g transform={`translate(0 ${from + 13})`}>
      {shadow ? (
        <rect x="16" y="3.5" width={w} height="7" rx="3.5" fill={INK} fillOpacity="0.3" style={SOFT} />
      ) : (
        <>
          <circle cx="9" cy="5" r="2.3" fill={hot ? GREEN : "#fff"} stroke={hot ? GREEN : INK} strokeOpacity={hot ? 1 : 0.5} strokeWidth="1.5" />
          <rect x="15" y="1.5" width={w} height="7" rx="3.5" fill={hot ? GREEN : INK} fillOpacity={hot ? 0.4 : 0.1} stroke={hot ? GREEN : INK} strokeOpacity={hot ? 1 : 0.5} strokeWidth="1.5" />
        </>
      )}
    </g>
  );
}

/** Prioritize: three items out of order; they re-sort, and the long green one comes to the top. */
function Prioritize() {
  const up = `${MOVE} group-hover:-translate-y-5`;
  const down = `${MOVE} group-hover:translate-y-2.5`;
  return (
    <>
      <Layer z={5}>
        {ROWS.map((r) => (
          <rect key={r.from} x="6" y={r.from + 11} width="36" height="11" rx="5.5" fill="none" stroke={INK} strokeOpacity="0.16" strokeWidth="1.2" strokeDasharray="2 3" />
        ))}
      </Layer>
      <Layer z={11}>
        <g className={down}>
          <Row {...ROWS[0]} />
        </g>
        <g className={down}>
          <Row {...ROWS[1]} />
        </g>
      </Layer>
      <Layer z={13}>
        <g className={up}>
          <Row {...ROWS[2]} shadow />
        </g>
      </Layer>
      <Layer z={25}>
        <g className={up}>
          <Row {...ROWS[2]} />
        </g>
      </Layer>
    </>
  );
}

/** Build: a page, and a pencil that writes a green line onto it. */
function Build() {
  const write = `${MOVE} group-hover:-translate-x-4`;
  return (
    <>
      <Layer z={6}>
        <rect x="7" y="7" width="29" height="35" rx="4.5" fill="#fff" stroke={INK} strokeWidth="1.7" />
      </Layer>
      <Layer z={9}>
        <path d="M13 16 H30 M13 23 H25" {...LINE} strokeOpacity="0.55" />
        <path d="M13 31 H30" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" pathLength="1" className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-700 ease-out group-hover:[stroke-dashoffset:0] motion-reduce:transition-none" />
      </Layer>
      <Layer z={12}>
        <g className={write}>
          <g transform="rotate(40 39 33)">
            <rect x="36" y="16" width="6.5" height="21" rx="1.6" fill={INK} fillOpacity="0.3" style={SOFT} />
          </g>
        </g>
      </Layer>
      <Layer z={28}>
        <g className={write}>
          <g transform="rotate(40 38 31)">
            <rect x="35" y="14" width="6.5" height="21" rx="1.6" fill="#fff" stroke={INK} strokeWidth="1.7" />
            <path d="M35 35 L38.25 41.5 L41.5 35 Z" fill={INK} />
            <path d="M35 20 H41.5" stroke={INK} strokeWidth="1.5" />
          </g>
        </g>
      </Layer>
    </>
  );
}

/** Review: a comment bubble whose badge fills green and draws its tick. */
function Review() {
  const pop = `${MOVE} origin-center [transform-box:fill-box] group-hover:scale-110`;
  return (
    <>
      <Layer z={6}>
        <path d="M10 8 H34 a5 5 0 0 1 5 5 V25 a5 5 0 0 1 -5 5 H22 L14 37 V30 H10 a5 5 0 0 1 -5 -5 V13 a5 5 0 0 1 5 -5 Z" fill="#fff" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
      </Layer>
      <Layer z={9}>
        <path d="M11 16 H29 M11 22.5 H22" {...LINE} strokeOpacity="0.55" />
      </Layer>
      <Layer z={14}>
        <g className={pop}>
          <circle cx="38" cy="37" r="8" fill={INK} fillOpacity="0.28" style={SOFT} />
        </g>
      </Layer>
      <Layer z={28}>
        <g className={pop}>
          <circle cx="37" cy="34" r="8" className="fill-white stroke-ink/30 transition-[fill,stroke] duration-500 group-hover:fill-[var(--primary)] group-hover:stroke-[var(--primary)] motion-reduce:transition-none" strokeWidth="1.7" />
          <path d="M33 34.2 L36 37.2 L41.2 31.4" fill="none" stroke={INK} strokeOpacity="0.22" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M33 34.2 L36 37.2 L41.2 31.4" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] delay-150 duration-500 group-hover:[stroke-dashoffset:0] motion-reduce:transition-none" />
        </g>
      </Layer>
    </>
  );
}

/** Optimize & Publish: an arrow launches off its tray and lands again, lighting three surfaces on the way. */
function Publish() {
  const fly = "group-hover:animate-[launch_1s_cubic-bezier(0.5,0,0.2,1)] motion-reduce:animate-none";
  return (
    <>
      <Layer z={6}>
        <path d="M9 30 V38 a3.5 3.5 0 0 0 3.5 3.5 H35.5 A3.5 3.5 0 0 0 39 38 V30" {...LINE} />
      </Layer>
      <Layer z={16}>
        {[14, 24, 34].map((x, k) => (
          <circle key={x} cx={x} cy="8" r="2.6" className="fill-ink/15 transition-colors duration-300 group-hover:fill-[var(--primary)] motion-reduce:transition-none" style={{ transitionDelay: `${0.28 + k * 0.1}s` }} />
        ))}
      </Layer>
      <Layer z={12}>
        <g className={fly}>
          <path d="M25.5 36 V17 M18 24 L25.5 16.5 L33 24" fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={SOFT} />
        </g>
      </Layer>
      <Layer z={28}>
        <g className={fly}>
          <path d="M24 33 V14" {...LINE} strokeWidth="2" />
          <path d="M16.5 21 L24 13.5 L31.5 21" {...LINE} strokeWidth="2" />
        </g>
      </Layer>
    </>
  );
}

const BARS = [10, 17, 24, 33];

/** Improve: four bars; they grow in one after another, the last one green. */
function Improve() {
  const grow = "origin-bottom [transform-box:fill-box] group-hover:animate-[grow_0.7s_cubic-bezier(0.34,1.56,0.64,1)_both] motion-reduce:animate-none";
  return (
    <>
      <Layer z={5}>
        <path d="M6 41 H42" {...LINE} strokeOpacity="0.4" />
        {BARS.map((h, k) => (
          <rect key={h} x={12 + k * 9} y={42 - h} width="6.5" height={h} rx="2" fill={INK} fillOpacity="0.25" className={grow} style={{ animationDelay: `${k * 0.09}s`, ...SOFT }} />
        ))}
      </Layer>
      {BARS.map((h, k) => (
        <Layer key={h} z={8 + k * 6}>
          <rect
            x={9 + k * 9}
            y={40 - h}
            width="6.5"
            height={h}
            rx="2"
            fill={k === 3 ? GREEN : "#fff"}
            fillOpacity={k === 3 ? 0.5 : 1}
            stroke={k === 3 ? GREEN : INK}
            strokeOpacity={k === 3 ? 1 : 0.6}
            strokeWidth="1.6"
            className={grow}
            style={{ animationDelay: `${k * 0.09}s` }}
          />
        </Layer>
      ))}
    </>
  );
}
