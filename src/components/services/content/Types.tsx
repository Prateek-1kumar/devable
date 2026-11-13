"use client";

import type { ReactNode } from "react";
import { Label, useInView } from "../kit";
import { TYPES } from "./content";

// The six formats as one board, all visible at once, in the structure of the content team's mock and the line quality
// of the Threadslab reference. Each column has a mono label strip with its number, a dashed rule, a fine-line
// isometric drawing that says what the format is without the words, another dashed rule, then the name and one
// line. Hovering a column tints it green, fills its marker and sets its drawing moving, one gesture each:
//   Technical Articles   an article slab with a code block, and a pin that rises: it ranks
//   Tutorials & Guides   numbered steps climbing to a green top step: build it, one step at a time
//   Product-Led Content  a workflow running through the product: something goes in, value comes out
//   Comparisons          a balance that settles level: an objective look at two options
//   Integration Content  two blocks and the code that bridges them; they draw together
//   Thought Leadership   bars of what is known, and a dotted path toward a green spark: what is next
// The cards rise in once, as they scroll into view.

export default function Types() {
  const [ref, seen] = useInView<HTMLUListElement>(0.12);
  const scenes = [Article, Steps, Workflow, Balance, Bridge, Horizon];
  return (
    <section aria-labelledby="types-title" className="px-6 py-16 sm:px-12 lg:py-24 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{TYPES.label}</Label>
        <h2 id="types-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {TYPES.title}
        </h2>

        <ul ref={ref} className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {TYPES.types.map((t, i) => {
            const Scene = scenes[i];
            return (
              <li
                key={t.name}
                className={`group flex flex-col bg-[#f9f8f4] transition-[background-color,box-shadow] duration-500 hover:bg-[#f0fbf4] hover:shadow-[inset_0_0_0_1px_rgb(25_231_110/0.45)] ${seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0"}`}
                style={{ animationDelay: `${(i % 3) * 0.08 + Math.floor(i / 3) * 0.12}s` }}
              >
                <div className="flex items-center justify-between border-b border-dashed border-ink/15 px-6 py-4 font-mono text-[0.7rem] tracking-[0.06em] text-ink/80 uppercase">
                  <span className="flex items-center gap-2.5">
                    <span className="size-[7px] bg-primary transition-transform duration-500 group-hover:scale-125" />
                    {t.tag}
                  </span>
                  <span className="text-ink/45">[{String(i + 1).padStart(2, "0")}]</span>
                </div>
                <div aria-hidden="true" className="relative grid h-60 place-items-center border-b border-dashed border-ink/15">
                  {["top-4 left-5", "top-4 right-5", "bottom-4 left-5", "bottom-4 right-5"].map((c) => (
                    <span key={c} className={`absolute font-mono text-[0.85rem] leading-none text-ink/35 ${c}`}>
                      +
                    </span>
                  ))}
                  <Scene />
                </div>
                <div className="flex-1 p-6 pb-8">
                  <h3 className="text-[1.45rem] leading-[1.1] font-medium tracking-[-0.035em] text-ink">{t.name}</h3>
                  <p className="mt-3 max-w-[22rem] text-[0.98rem] leading-relaxed text-ink/60">{t.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ── An isometric line-drawing kit ────────────────────────────────────────────────────────────────────────────
// x runs right-down, y runs left-down, z is up (all in drawing units). Boxes are drawn back to front.

const INK = "#172c21";
const GREEN = "var(--primary)";
const K = 0.866;
const P = (x: number, y: number, z = 0) => `${((x - y) * K).toFixed(1)},${((x + y) * 0.5 - z).toFixed(1)}`;
const poly = (pts: [number, number, number][]) => `M${pts.map(([x, y, z]) => P(x, y, z)).join(" L")} Z`;
const seg = (x1: number, y1: number, x2: number, y2: number, z = 0) => `M${P(x1, y1, z)} L${P(x2, y2, z)}`;
const SPRING = "ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const MOVE = `transition-transform duration-700 ${SPRING} motion-reduce:transition-none`;

type BoxProps = { x: number; y: number; z?: number; w: number; d: number; h: number; top?: string; left?: string; right?: string; sw?: number };
/** A box: three faces, white with hairline edges. */
function Box({ x, y, z = 0, w, d, h, top = "#fff", left = "#f3f2ed", right = "#e8e7e0", sw = 1.15 }: BoxProps) {
  const s = { stroke: INK, strokeWidth: sw, strokeLinejoin: "round" } as const;
  return (
    <g>
      <path d={poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={right} {...s} />
      <path d={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={left} {...s} />
      <path d={poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} {...s} />
    </g>
  );
}

const Line = ({ d, w = 1.1, o = 0.7, color = INK }: { d: string; w?: number; o?: number; color?: string }) => <path d={d} fill="none" stroke={color} strokeOpacity={o} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="-110 -92 220 184" className="h-full max-h-56 w-full max-w-[19rem] overflow-visible">
      {children}
    </svg>
  );
}

/** A small arrowhead pointing right at (x, y). */
const Arrow = ({ x, y }: { x: number; y: number }) => <path d={`M${x - 6} ${y - 4} L${x} ${y} L${x - 6} ${y + 4}`} fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;

/** Technical Articles: an article slab, with a heading, text and a code block; a pin rises off it. */
function Article() {
  const pin = P(24, 38, 54).split(",").map(Number);
  return (
    <Frame>
      <g transform="translate(0 26)">
        <g className={`${MOVE} group-hover:-translate-y-1`}>
          <Box x={-30} y={-44} w={60} d={88} h={5} />
          <Line d={seg(-21, -36, -21, -8, 5)} w={2.6} o={0.9} />
          {[-12, -5, 2, 9].map((x, k) => (
            <Line key={x} d={seg(x, -36, x, 30 - k * 6, 5)} w={1} o={0.5} />
          ))}
          <path d={poly([[14, -36, 5], [26, -36, 5], [26, 6, 5], [14, 6, 5]])} fill={GREEN} fillOpacity="0.55" stroke={GREEN} strokeWidth="1.1" />
          <Line d={seg(17, -31, 17, -10, 5)} w={0.9} o={0.7} />
          <Line d={seg(21, -31, 21, -18, 5)} w={0.9} o={0.7} />
        </g>
        <g className={`${MOVE} group-hover:-translate-y-3`}>
          <Line d={`M${P(24, 38, 6)} L${P(24, 38, 44)}`} w={1.2} o={0.6} />
          <circle cx={pin[0]} cy={pin[1]} r="10" fill="#fff" stroke={GREEN} strokeWidth="1.7" />
          <text x={pin[0]} y={pin[1] + 3.4} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono), monospace" fontWeight="600" fill={INK}>
            #1
          </text>
        </g>
      </g>
    </Frame>
  );
}

/** Centre a box of side `s` on floor point (cx, cy). */
const at = (cx: number, cy: number, w: number, d = w) => ({ x: cx - w / 2, y: cy - d / 2, w, d });

/** Tutorials & Developer Guides: numbered steps, each higher than the last, up to a green finish. */
function Steps() {
  const steps = [
    { t: -44, h: 14 },
    { t: 0, h: 30 },
    { t: 44, h: 46 },
  ];
  return (
    <Frame>
      <g transform="translate(0 30)">
        {steps.map((s, k) => {
          const [cx, cy] = P(s.t, -s.t, s.h).split(",").map(Number);
          const last = k === 2;
          return (
            <g key={s.t} className={`${MOVE} ${last ? "group-hover:-translate-y-2.5" : k === 1 ? "group-hover:-translate-y-1.5" : "group-hover:-translate-y-0.5"}`}>
              <Box {...at(s.t, -s.t, 30)} h={s.h} top={last ? "#d8f8e5" : "#fff"} />
              <circle cx={cx} cy={cy} r="8" fill="#fff" stroke={last ? GREEN : INK} strokeWidth="1.4" />
              <text x={cx} y={cy + 3.4} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono), monospace" fontWeight="600" fill={INK}>
                {k + 1}
              </text>
            </g>
          );
        })}
      </g>
    </Frame>
  );
}

/** Product-Led Content: a workflow that runs through the product cube. */
function Workflow() {
  return (
    <Frame>
      <g transform="translate(0 24)">
        <Box {...at(-50, 50, 20)} h={14} />
        <g className={`${MOVE} group-hover:-translate-y-2`}>
          <Box {...at(0, 0, 34)} h={36} top="#d8f8e5" />
        </g>
        <Box {...at(50, -50, 20)} h={14} />
        <Box {...at(50, -50, 20)} z={14} h={14} />
        <g className="[stroke-dasharray:1.5_4] group-hover:animate-dash-flow motion-reduce:animate-none">
          <path d="M-62 -9 H-40" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M34 -9 H56" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <Arrow x={-34} y={-9} />
        <Arrow x={62} y={-9} />
      </g>
    </Frame>
  );
}

/** Comparisons & Alternatives: a balance that settles level, one option in each pan. */
function Balance() {
  const beam = `${MOVE} -rotate-[7deg] group-hover:rotate-0`;
  const pan = `${MOVE} rotate-[7deg] group-hover:rotate-0`;
  return (
    <Frame>
      <g transform="translate(0 30)">
        <Line d="M0 44 V-40" w={1.5} o={0.9} />
        <path d="M-24 44 H24" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-11 44 L0 26 L11 44" fill="#fff" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        <g className={beam} style={{ transformOrigin: "0px -40px" }}>
          <Line d="M-72 -40 H72" w={1.6} o={0.95} />
          {[-72, 72].map((x, k) => (
            <g key={x} transform={`translate(${x} -40)`}>
              <g className={pan} style={{ transformOrigin: "0px 0px" }}>
                <Line d="M0 0 L-19 46 M0 0 L19 46" w={1} o={0.6} />
                <path d="M-24 46 q 24 16 48 0 Z" fill="#fff" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
                <g transform="translate(0 42)">
                  <Box {...at(0, 0, 18)} h={16} top={k === 1 ? "#d8f8e5" : "#fff"} />
                </g>
              </g>
            </g>
          ))}
        </g>
        <circle cx="0" cy="-40" r="4" fill="#fff" stroke={INK} strokeWidth="1.4" />
      </g>
    </Frame>
  );
}

/** Integration Content: two blocks and the code that bridges them; they draw together. */
function Bridge() {
  return (
    <Frame>
      <g transform="translate(0 30)">
        <g className={`${MOVE} group-hover:translate-x-2.5`}>
          <Box {...at(-48, 48, 32)} h={32} top="#d8f8e5" />
        </g>
        <g className={`${MOVE} group-hover:-translate-x-2.5`}>
          <Box {...at(48, -48, 32)} h={32} />
        </g>
        <path d="M-66 -30 C -66 -92, 66 -92, 66 -30" fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="1.3" strokeDasharray="1.5 3.5" strokeLinecap="round" className="group-hover:animate-dash-flow motion-reduce:animate-none" />
        <g className={`${MOVE} group-hover:-translate-y-1.5`}>
          <rect x="-21" y="-79" width="42" height="24" rx="7" fill="#fff" stroke={GREEN} strokeWidth="1.7" />
          <text x="0" y="-63" textAnchor="middle" fontSize="12" fontFamily="var(--font-mono), monospace" fontWeight="600" fill={INK}>
            {"</>"}
          </text>
        </g>
      </g>
    </Frame>
  );
}

/** Thought Leadership: bars of what is known, and a dotted path toward a green spark: what is next. */
function Horizon() {
  const heights = [16, 28, 42];
  return (
    <Frame>
      <g transform="translate(-14 40)">
        <Box x={-54} y={-34} w={84} d={72} h={5} />
        {heights.map((h, k) => (
          <g key={h} className={`${MOVE} origin-bottom [transform-box:fill-box] group-hover:scale-y-110`}>
            <Box x={-42 + k * 24} y={-10} z={5} w={15} d={20} h={h} top={k === 2 ? "#d8f8e5" : "#fff"} />
          </g>
        ))}
        <path d="M16 -46 C 34 -68, 50 -72, 70 -98" fill="none" stroke={GREEN} strokeWidth="1.8" strokeDasharray="1.5 4" strokeLinecap="round" className="group-hover:animate-dash-flow motion-reduce:animate-none" />
        <g className={`${MOVE} group-hover:-translate-y-2 group-hover:scale-110`} style={{ transformOrigin: "74px -112px" }}>
          <path d="M80 -128 L66 -110 H76 L70 -92 L86 -113 H76 Z" fill={GREEN} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        </g>
      </g>
    </Frame>
  );
}
