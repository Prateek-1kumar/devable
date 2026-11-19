"use client";

import { Label, useInView } from "../kit";
import { PROCESS } from "./content";
import { GREEN, INK, Layer, MOVE, Plate, SOFT, tilt, untilt } from "./PlateKit";


// The workflow as six cards in a quiet 3 × 2 board, read left to right. Each card is a small illustrated tile, a
// number, a name and one line. The tiles are built as real objects: a plate with thickness and a floor shadow, its
// artwork split into layers at different heights, each with its own soft shadow. Each icon is drawn for what its
// card says, with real contrast (solid ink, full brand green, white). Hovering a card tilts the plate toward the
// pointer, the layers separate in parallax and a green glare follows the cursor, while the icon acts out its verb:
//   Understand         a lens glides across the product (an isometric block, green on top)
//   Prioritize         a podium: the green #1 rises and its star pops
//   Build              a code editor, and a pencil that writes a green line
//   Review             a checklist on a clipboard: the last item ticks
//   Optimize & Publish the finished page, and a paper plane taking off from it along a dotted trail
//   Improve            a performance chart, its refresh badge turning a full cycle
// The cards rise in once, as they scroll into view. Reduced motion: no tilt, no movement.

export default function Process() {
  const [ref, seen] = useInView<HTMLUListElement>(0.15);
  const tiles = [Understand, Prioritize, Build, Review, Publish, Improve];
  return (
    <section aria-labelledby="process-title" className="bg-[#f6f5f1] px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
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


const DARK = "#2f4538"; // the second ink, for the shaded faces of solid objects
const EDGE = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** Understand: the product (an isometric block, green on top, solid ink sides) and a lens that reads it. */
function Understand() {
  const glide = `${MOVE} group-hover:-translate-x-[9px] group-hover:translate-y-[5px]`;
  return (
    <>
      <Layer z={4}>
        <ellipse cx="20" cy="41" rx="12" ry="3.2" fill={INK} fillOpacity="0.3" style={SOFT} />
      </Layer>
      <Layer z={9}>
        <path d="M9 22 L20 28 L20 40 L9 34 Z" fill={INK} {...EDGE} />
        <path d="M20 28 L31 22 L31 34 L20 40 Z" fill={DARK} {...EDGE} />
        <path d="M20 16 L31 22 L20 28 L9 22 Z" fill={GREEN} {...EDGE} />
        <path d="M14.5 22 L20 25 M20 19 L25.5 22" stroke={INK} strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Layer z={13}>
        <g className={glide}>
          <circle cx="33" cy="17" r="7.5" fill={INK} fillOpacity="0.22" style={SOFT} />
        </g>
      </Layer>
      <Layer z={27}>
        <g className={glide}>
          <circle cx="32" cy="14" r="7.5" fill="#fff" fillOpacity="0.9" stroke={INK} strokeWidth="2.2" />
          <path d="M28.5 11 a4.5 4.5 0 0 1 4 -1.8" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M37.4 19.4 L42.5 24.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        </g>
      </Layer>
    </>
  );
}

/** One podium step: a front face, a lighter top and a shaded side, with its place number. */
function Step({ x, y, w, place, hot }: { x: number; y: number; w: number; place: number; hot?: boolean }) {
  const d = 2.5; // depth of the top and side faces
  return (
    <g>
      <path d={`M${x} ${y} l${d} -${d} h${w} l-${d} ${d} Z`} fill={hot ? "#8ff3b8" : "#eceae3"} {...EDGE} strokeWidth="1.4" />
      <path d={`M${x + w} ${y} l${d} -${d} V${41 - d} l-${d} ${d} Z`} fill={hot ? DARK : "#d6d3ca"} {...EDGE} strokeWidth="1.4" />
      <rect x={x} y={y} width={w} height={41 - y} fill={hot ? GREEN : "#fff"} {...EDGE} strokeWidth="1.5" />
      <text x={x + w / 2} y={(y + 41) / 2 + 2.4} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={INK}>
        {place}
      </text>
    </g>
  );
}

/** Prioritize: a podium of topics, the blocks apart; the green #1 rises and its star pops. */
function Prioritize() {
  const rise = `${MOVE} group-hover:-translate-y-[3px]`;
  const pop = `${MOVE} origin-center [transform-box:fill-box] group-hover:scale-110 group-hover:-translate-y-[3px]`;
  return (
    <>
      <Layer z={4}>
        <ellipse cx="24" cy="43" rx="18" ry="2.8" fill={INK} fillOpacity="0.28" style={SOFT} />
      </Layer>
      <Layer z={8}>
        <Step x={3} y={29} w={11} place={2} />
        <Step x={33} y={32} w={11} place={3} />
      </Layer>
      <Layer z={12}>
        <g className={rise}>
          <Step x={17.5} y={19} w={12} place={1} hot />
        </g>
      </Layer>
      <Layer z={20}>
        <g className={pop}>
          <path d="M23.5 5.5 l1.5 3.1 3.4 .5 -2.5 2.4 .6 3.4 -3 -1.6 -3 1.6 .6 -3.4 -2.5 -2.4 3.4 -.5 Z" fill={GREEN} {...EDGE} strokeWidth="1.2" />
        </g>
      </Layer>
    </>
  );
}

/** Build: a code editor (solid title bar, the code in ink with a green slash) and a pencil that writes. */
function Build() {
  const write = `${MOVE} group-hover:-translate-x-[6px] group-hover:translate-y-[2px]`;
  return (
    <>
      <Layer z={4}>
        <rect x="7" y="13" width="32" height="28" rx="4" fill={INK} fillOpacity="0.28" style={SOFT} />
      </Layer>
      <Layer z={8}>
        <rect x="5" y="8" width="33" height="29" rx="4" fill="#fff" {...EDGE} strokeWidth="1.8" />
        <path d="M5 15 V12 a4 4 0 0 1 4 -4 H34 a4 4 0 0 1 4 4 V15 Z" fill={INK} />
        {[10, 14, 18].map((x) => (
          <circle key={x} cx={x} cy="11.5" r="1.1" fill="#fff" fillOpacity="0.85" />
        ))}
      </Layer>
      <Layer z={12}>
        <path d="M14 21 l-4.5 4.5 4.5 4.5 M27 21 l4.5 4.5 -4.5 4.5" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.4 19.5 L18.6 31.5" stroke={GREEN} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M10 34 H26" fill="none" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" pathLength="1" className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-700 ease-out group-hover:[stroke-dashoffset:0] motion-reduce:transition-none" />
      </Layer>
      <Layer z={16}>
        <g className={write}>
          <g transform="rotate(38 40 30)">
            <rect x="37" y="16" width="6.5" height="22" rx="1.6" fill={INK} fillOpacity="0.3" style={SOFT} />
          </g>
        </g>
      </Layer>
      <Layer z={30}>
        <g className={write}>
          <g transform="rotate(38 39 28)">
            <rect x="36" y="13" width="6.5" height="21" rx="1.6" fill={GREEN} {...EDGE} />
            <rect x="36" y="13" width="6.5" height="4" rx="1.4" fill={INK} />
            <path d="M36 34 L39.25 40.5 L42.5 34 Z" fill="#f6e7c8" {...EDGE} />
            <path d="M38.3 38.2 L39.25 40.5 L40.2 38.2 Z" fill={INK} />
          </g>
        </g>
      </Layer>
    </>
  );
}

/** One checklist row: a box (ticked green, or empty) and its line. */
function Item({ y, done, w }: { y: number; done: boolean; w: number }) {
  return (
    <g>
      <rect x="12" y={y - 3} width="6" height="6" rx="1.6" fill={done ? GREEN : "#fff"} {...EDGE} strokeWidth="1.3" />
      {done && <path d={`M13.6 ${y} l1.4 1.4 2.5 -2.8`} fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />}
      <path d={`M22 ${y} H${22 + w}`} stroke={INK} strokeOpacity="0.5" strokeWidth="1.7" strokeLinecap="round" />
    </g>
  );
}

/** Review: a checklist on a clipboard, with room around it; two items ticked, the last ticks on hover. */
function Review() {
  return (
    <>
      <Layer z={4}>
        <rect x="9" y="11" width="33" height="34" rx="4" fill={INK} fillOpacity="0.26" style={SOFT} />
      </Layer>
      <Layer z={8}>
        <rect x="7" y="8" width="33" height="35" rx="4.5" fill="#fff" {...EDGE} strokeWidth="1.8" />
        <rect x="18" y="5.5" width="11" height="5.5" rx="2" fill={INK} />
        <circle cx="23.5" cy="7.4" r="1" fill="#fff" fillOpacity="0.8" />
      </Layer>
      <Layer z={11}>
        <Item y={19} done w={13} />
        <Item y={27.5} done w={10} />
        <Item y={36} done={false} w={12} />
        {/* The last tick, drawn on hover. */}
        <rect x="12" y="33" width="6" height="6" rx="1.6" fill={GREEN} className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none" {...EDGE} strokeWidth="1.3" />
        <path d="M13.6 36 l1.4 1.4 2.5 -2.8" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] delay-200 duration-500 group-hover:[stroke-dashoffset:0] motion-reduce:transition-none" />
      </Layer>
    </>
  );
}

/** Optimize & Publish: the finished page (structured, tagged Live) and a paper plane taking off from it along a
 *  dotted trail, out to wherever it's distributed. On hover the plane flies on and the trail follows. */
function Publish() {
  const fly = `${MOVE} group-hover:translate-x-[3px] group-hover:-translate-y-[3px]`;
  return (
    <>
      <Layer z={4}>
        <rect x="6" y="20" width="22" height="26" rx="3.5" fill={INK} fillOpacity="0.26" style={SOFT} />
      </Layer>
      <Layer z={8}>
        <rect x="4" y="17" width="22" height="27" rx="3.5" fill="#fff" {...EDGE} strokeWidth="1.8" />
        <rect x="8" y="21.5" width="10" height="4.5" rx="2.25" fill={GREEN} {...EDGE} strokeWidth="1" />
        <path d="M8 31 H22 M8 35.5 H20 M8 40 H16" stroke={INK} strokeOpacity="0.5" strokeWidth="1.7" strokeLinecap="round" />
      </Layer>
      <Layer z={14}>
        {/* The trail from the page to the plane. */}
        <path d="M22 15.5 Q23 8.5 28.5 10.5" fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 3.2" />
        <g className={fly}>
          <path d="M30 17 L44 9 L36 26 Z" fill={INK} fillOpacity="0.24" style={SOFT} />
        </g>
      </Layer>
      <Layer z={26}>
        <g className={fly}>
          {/* A paper plane: a green top wing, the ink fold beneath, a white keel. */}
          <path d="M27 13.5 L43 5 L34.5 22 Z" fill={GREEN} {...EDGE} strokeWidth="1.6" />
          <path d="M34.5 22 L43 5 L36.2 15.6 Z" fill={INK} {...EDGE} strokeWidth="1.2" />
          <path d="M36.2 15.6 L34.5 22 L33 17.6 Z" fill="#fff" {...EDGE} strokeWidth="1.1" />
        </g>
      </Layer>
    </>
  );
}

/** Improve: a performance chart (an ink-edged green trend) and a refresh badge that turns a full cycle. */
function Improve() {
  return (
    <>
      <Layer z={4}>
        <rect x="8" y="12" width="32" height="30" rx="4" fill={INK} fillOpacity="0.28" style={SOFT} />
      </Layer>
      <Layer z={8}>
        <rect x="6" y="9" width="32" height="30" rx="4" fill="#fff" {...EDGE} strokeWidth="1.8" />
        <path d="M11 33 H33" stroke={INK} strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Layer z={13}>
        <path d="M11 29 L17 23 L22 26 L31 16" fill="none" stroke={INK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 29 L17 23 L22 26 L31 16" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26.5 15.5 H31.5 V20.5" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
      <Layer z={18}>
        <circle cx="37" cy="37" r="7.5" fill={INK} fillOpacity="0.3" style={SOFT} />
      </Layer>
      <Layer z={28}>
        <g className="origin-center transition-transform duration-[900ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] [transform-box:fill-box] group-hover:rotate-[360deg] motion-reduce:transition-none">
          <circle cx="36" cy="35" r="7.5" fill={INK} />
          <path d="M39.2 33.2 A3.6 3.6 0 1 0 39.4 36.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M39.8 30.6 L39.4 33.6 L36.5 33" fill="none" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </Layer>
    </>
  );
}
