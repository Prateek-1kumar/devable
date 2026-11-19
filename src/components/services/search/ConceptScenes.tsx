"use client";

import { BarChart3, Check, Code2, Crosshair, Home, Image as ImageIcon, Layers, Link2, Puzzle, Search, X, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Mark, type Icon } from "../parts";
import { useStill } from "../content/play";
import { show, type SceneProps } from "./scene";

// The lit tile's slow breath and the pages floating a few pixels.
const KEYFRAMES = `
@keyframes breathe { 0%, 100% { box-shadow: 0 0 0 0 rgb(25 231 110 / 0.28); } 50% { box-shadow: 0 0 0 9px rgb(25 231 110 / 0); } }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes gap-ripple { 0% { transform: scale(1); opacity: 0.45; } 70%, 100% { transform: scale(1.32); opacity: 0; } }
`;

// The four pictures beside "How we improve search & AI visibility", one idea each, drawn as concept and not as a
// dashboard: a few short labels, a lot of white space, a green line for what matters.
//   01 Search Intelligence      four signals feed "your category"; out of it comes the high-impact gap
//   02 Content & Pages          four pages, each tagged for what it needs: new, refresh or optimize
//   03 Third-Party Visibility   six outside sources, drawn as present, weak or missing, all around "your product"
//   04 Technical Foundation     a site tree: healthy pages ticked, and what blocks the rest
// Everything sits on one 520 × 400 drawing: lines are SVG, words and icons are HTML laid on the same grid, and the
// whole thing scales with its box (sizes are in em, and the em follows the box's width). It rises in when its area
// is active, then the wires move quietly. Reduced motion: the finished picture.

const W = 520;
const H = 400;
const GREEN = "var(--primary)";
const INK = "#172c21";

const pos = (x: number, y: number): CSSProperties => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
const delay = (s: number): CSSProperties => ({ transitionDelay: `${s}s` });

/** The drawing's frame: an aspect-locked box whose em tracks its width, with room for the lines beneath the words. */
function Stage({ children, lines }: { children: ReactNode; lines: ReactNode }) {
  return (
    <div className="w-full max-w-[40rem] [container-type:inline-size]">
<style href="concept-scenes" precedence="default">{KEYFRAMES}</style>
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}`, fontSize: "2.5cqw" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible">
          {lines}
        </svg>
        {children}
      </div>
    </div>
  );
}

/** Something placed at (x, y) on the drawing, centred, rising in once `on`. */
function At({ x, y, on, d = 0, children, className = "" }: { x: number; y: number; on: boolean; d?: number; children: ReactNode; className?: string }) {
  return (
    <div className={`absolute -translate-x-1/2 -translate-y-1/2 ${className}`} style={pos(x, y)}>
      <div className={show(on)} style={delay(d)}>
        {children}
      </div>
    </div>
  );
}

/** A short label in a pill. */
const Tag = ({ children, icon, small = false }: { children: ReactNode; icon?: ReactNode; small?: boolean }) => (
  <span className={`flex items-center gap-[0.5em] rounded-full bg-white leading-none font-medium whitespace-nowrap text-ink ${small ? "px-[0.7em] py-[0.45em] text-[0.88em]" : "px-[0.95em] py-[0.5em] text-[1em]"} shadow-[0_0_0_1px_rgb(23_44_33/0.1),0_1px_2px_rgb(23_44_33/0.05),0_8px_14px_-10px_rgb(23_44_33/0.25)]`}>
    {icon}
    {children}
  </span>
);

/** An icon tile. `lit` gives it the green. */
function Tile({ icon: I, mark, lit = false, glow = false }: { icon?: LucideIcon; mark?: Icon; lit?: boolean; glow?: boolean }) {
  return (
    <span
      className={`grid size-[3.7em] place-items-center rounded-[1em] shadow-[0_0_0_1px_rgb(23_44_33/0.1),0_1px_2px_rgb(23_44_33/0.05),0_12px_20px_-12px_rgb(23_44_33/0.3),inset_0_1px_0_#fff] ${lit ? "bg-[linear-gradient(180deg,#45f28f_0%,#19d466_100%)] !shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_0_-1px_0_rgb(0_80_40/0.18),0_0_0_1px_rgb(20_150_75/0.35),0_2px_3px_rgb(20_120_60/0.2),0_14px_22px_-12px_rgb(20_150_75/0.75)]" : "bg-white"} ${glow ? "motion-safe:animate-[breathe_5s_ease-in-out_infinite]" : ""}`}
    >
      {mark ? <Mark name={mark} className="size-[1.7em]" /> : I && <I className="size-[1.7em]" strokeWidth={1.7} color={INK} />}
    </span>
  );
}

/** A status chip: present is green, weak is amber, missing is coral. */
const STATUS = {
  Present: { dot: "bg-primary", text: "text-[#14632f]", ring: "shadow-[inset_0_0_0_1px_rgb(25_231_110/0.45)] bg-[color-mix(in_srgb,var(--primary)_12%,white)]" },
  Weak: { dot: "bg-[#e2a336]", text: "text-[#8a5a0c]", ring: "shadow-[inset_0_0_0_1px_rgb(226_163_54/0.5)] bg-[#fdf4e3]" },
  Missing: { dot: "bg-accent", text: "text-[#a43f20]", ring: "shadow-[inset_0_0_0_1px_rgb(217_101_67/0.4)] bg-[#fbeae4]" },
} as const;
type Status = keyof typeof STATUS;
const Chip = ({ s }: { s: Status }) => (
  <span className={`inline-flex w-fit items-center gap-[0.45em] rounded-full px-[0.8em] py-[0.35em] text-[0.82em] leading-none font-medium ${STATUS[s].ring} ${STATUS[s].text}`}>
    <span className={`size-[0.6em] rounded-full ${STATUS[s].dot}`} />
    {s}
  </span>
);

// ── An isometric slab, for "your category" and "your product" ─────────────────────────────────────────────
const K = 0.866;
const P = (x: number, y: number, z = 0) => `${((x - y) * K).toFixed(1)},${((x + y) * 0.5 - z).toFixed(1)}`;
const poly = (pts: [number, number, number][]) => `M${pts.map(([x, y, z]) => P(x, y, z)).join(" L")} Z`;

/** Three stacked sheets, the top one lit, centred on (cx, cy): a floor shadow, dithered sides and, when `green`, a green rim. */
function Stack({ cx, cy, on, id, green = false }: { cx: number; cy: number; on: boolean; id: string; green?: boolean }) {
  const s = 30;
  const rim = green ? GREEN : INK;
  const sheet = (z: number, top: string, k: number, lit: boolean) => (
    <g key={z} className={show(on)} style={delay(0.1 + k * 0.08)}>
      <path d={poly([[s, -s, z], [s, s, z], [s, s, z + 8], [s, -s, z + 8]])} fill="#e4e3dc" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={poly([[-s, s, z], [s, s, z], [s, s, z + 8], [-s, s, z + 8]])} fill="#f1f0ea" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={poly([[-s, s, z], [s, s, z], [s, s, z + 8], [-s, s, z + 8]])} fill={`url(#${id})`} fillOpacity="0.6" />
      <path d={poly([[-s, -s, z + 8], [s, -s, z + 8], [s, s, z + 8], [-s, s, z + 8]])} fill={top} stroke={lit ? rim : INK} strokeWidth={lit ? 1.5 : 1.1} strokeLinejoin="round" />
      <path d={poly([[-s, -s, z + 8], [s, -s, z + 8], [s, s, z + 8], [-s, s, z + 8]])} fill={`url(#${id})`} fillOpacity={lit ? 0.45 : 1} />
    </g>
  );
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <defs>
        <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.25" cy="1.25" r="0.8" fill={INK} fillOpacity="0.28" />
          <circle cx="3.75" cy="3.75" r="0.8" fill={INK} fillOpacity="0.28" />
        </pattern>
        <radialGradient id={`${id}-f`}>
          <stop offset="0" stopColor={INK} stopOpacity="0.3" />
          <stop offset="1" stopColor={INK} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="34" rx="78" ry="22" fill={`url(#${id}-f)`} className={show(on)} />
      {sheet(0, "#f6f5f0", 0, false)}
      {sheet(18, "#f6f5f0", 1, false)}
      {sheet(36, green ? "#d8f8e5" : "#ffffff", 2, true)}
    </g>
  );
}

/** A small packet that runs a path again and again, once the scene is on (and never under reduced motion). */
function Packet({ d, on, dur = 3.6, begin = 0, color = GREEN }: { d: string; on: boolean; dur?: number; begin?: number; color?: string }) {
  const still = useStill();
  if (!on || still) return null;
  return (
    <circle r="3.2" fill={color} stroke="#fff" strokeWidth="1.4">
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.85;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    </circle>
  );
}

/** A port: a dot with a white ring where a wire meets something. */
const Port = ({ x, y, color = GREEN }: { x: number; y: number; color?: string }) => (
  <g>
    <circle cx={x} cy={y} r="5.6" fill="#fff" />
    <circle cx={x} cy={y} r="3.2" fill={color} />
  </g>
);

/** A dotted wire that starts to move once the scene is on. */
const Wire = ({ d, on, color = GREEN, w = 1.6, o = 1 }: { d: string; on: boolean; color?: string; w?: number; o?: number }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeOpacity={o} strokeLinecap="round" strokeDasharray="1 6" className={on ? "motion-safe:animate-dash-flow" : ""} />
);

// ── 01 · Search Intelligence ─────────────────────────────────────────────────────────────────────────────
export function Intelligence({ on }: SceneProps) {
  const sats: { x: number; y: number; label: string; tile: ReactNode; tagAbove: boolean; to: [number, number]; c: [number, number] }[] = [
    { x: 92, y: 118, label: "Search demand", tile: <Tile icon={Search} />, tagAbove: true, to: [168, 190], c: [112, 176] },
    { x: 300, y: 96, label: "AI prompts", tile: <Tile mark="chatgpt" />, tagAbove: true, to: [256, 172], c: [304, 128] },
    { x: 86, y: 300, label: "Competitor coverage", tile: <Tile icon={BarChart3} />, tagAbove: false, to: [170, 242], c: [108, 262] },
    { x: 296, y: 304, label: "Citations & sources", tile: <Tile icon={Layers} />, tagAbove: false, to: [248, 252], c: [268, 274] },
  ];
  return (
    <Stage
      lines={
        <>
          {sats.map((s) => (
            <Wire key={s.label} on={on} d={`M${s.x} ${s.y} Q ${s.c[0]} ${s.c[1]} ${s.to[0]} ${s.to[1]}`} color={INK} o={0.35} />
          ))}
          <Stack cx={206} cy={214} on={on} id="intel-dots" />
          {sats.map((s, i) => (
            <g key={s.label}>
              <Port x={s.to[0]} y={s.to[1]} color={INK} />
              <Packet on={on} d={`M${s.x} ${s.y} Q ${s.c[0]} ${s.c[1]} ${s.to[0]} ${s.to[1]}`} begin={i * 0.9} dur={3.8} />
            </g>
          ))}
          <Wire on={on} d="M268 214 H390" w={1.8} />
          <Packet on={on} d="M268 214 H390" begin={0.6} dur={2.6} />
          <path d="M398 214 l-7.5 -4.6 v9.2 z" fill={GREEN} className={show(on)} style={delay(0.6)} />
          {/* The gap: a soft green halo with one hairline edge, and a ripple that rolls out of it now and then. */}
          <g className={show(on)} style={delay(0.8)}>
            <defs>
              <radialGradient id="gap-halo">
                <stop offset="0.55" stopColor={GREEN} stopOpacity="0.16" />
                <stop offset="1" stopColor={GREEN} stopOpacity="0.03" />
              </radialGradient>
            </defs>
            <circle cx="444" cy="214" r="44" fill="url(#gap-halo)" />
            <circle cx="444" cy="214" r="44" fill="none" stroke={GREEN} strokeOpacity="0.35" strokeWidth="1" />
            <circle cx="444" cy="214" r="44" fill="none" stroke={GREEN} strokeWidth="1" className={on ? "motion-safe:animate-[gap-ripple_3.6s_cubic-bezier(0.2,0.6,0.3,1)_infinite]" : "opacity-0"} style={{ transformOrigin: "444px 214px", transformBox: "view-box" }} />
          </g>
        </>
      }
    >
      {sats.map((s, i) => (
        <At key={s.label} x={s.x} y={s.y} on={on} d={0.15 + i * 0.1}>
          <div className="flex flex-col items-center gap-[0.8em]">
            {s.tagAbove && <Tag>{s.label}</Tag>}
            {s.tile}
            {!s.tagAbove && <Tag>{s.label}</Tag>}
          </div>
        </At>
      ))}
      <At x={206} y={124} on={on} d={0.4}>
        <Tag>Your category</Tag>
      </At>
      <At x={444} y={146} on={on} d={0.7}>
        <span className="flex items-center gap-[0.5em] rounded-full bg-white px-[0.95em] py-[0.5em] text-[1em] leading-none font-semibold whitespace-nowrap text-ink shadow-[0_0_0_1px_rgb(25_200_100/0.45),0_1px_2px_rgb(23_44_33/0.05),0_8px_16px_-10px_rgb(25_160_80/0.55)]">
          <span className="size-[0.55em] rounded-full bg-primary shadow-[0_0_0_0.22em_rgb(25_231_110/0.2)]" />
          High-impact gap
        </span>
      </At>
      <At x={444} y={214} on={on} d={0.7}>
        <Tile icon={Crosshair} lit />
      </At>
    </Stage>
  );
}

// ── 02 · Content & Pages ─────────────────────────────────────────────────────────────────────────────────
const PAGES: { name: string; icon: LucideIcon; chip: "NEW" | "REFRESH" | "OPTIMIZE" }[] = [
  { name: "Comparison page", icon: ImageIcon, chip: "NEW" },
  { name: "Integration page", icon: Puzzle, chip: "NEW" },
  { name: "Use case page", icon: Layers, chip: "REFRESH" },
  { name: "Product page", icon: Code2, chip: "OPTIMIZE" },
];
export function Pages({ on }: SceneProps) {
  const xs = [66, 196, 326, 456];
  return (
    <Stage
      lines={
        <>
          {xs.map((x, i) => (
            <g key={x} className={show(on)} style={delay(0.2 + i * 0.1)}>
              <path d={`M${x} 262 V282 M${x} 318 V338`} stroke={INK} strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="1.5 3.5" strokeLinecap="round" />
              <ellipse cx={x} cy="238" rx="40" ry="6" fill={INK} fillOpacity="0.1" />
              <circle cx={x} cy="262" r="3" fill={GREEN} />
              <circle cx={x} cy="338" r="3" fill={GREEN} />
              {/* a bed of dots under each page */}
              {Array.from({ length: 5 }).map((_, r) =>
                Array.from({ length: 9 }).map((_, c) => (
                  <circle key={`${r}-${c}`} cx={x - 40 + c * 10 + (r % 2) * 5} cy={226 + r * 6} r="0.9" fill={INK} fillOpacity={0.22 - r * 0.03} />
                ))
              )}
            </g>
          ))}
        </>
      }
    >
      {PAGES.map((p, i) => {
        const I = p.icon;
        return (
          <div key={p.name}>
            <At x={xs[i]} y={150} on={on} d={0.15 + i * 0.1}>
              <div className="motion-safe:animate-[bob_5.5s_ease-in-out_infinite]" style={{ animationDelay: `${i * -1.1}s` }}>
                <div className="relative">
                <span className="absolute inset-x-[0.7em] -top-[0.55em] h-[1em] rounded-t-[0.8em] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.1)]" />
                <span className="absolute inset-x-[1.4em] -top-[1.05em] h-[1em] rounded-t-[0.8em] bg-[#f4f3ee] shadow-[0_0_0_1px_rgb(23_44_33/0.07)]" />
                <div className="relative w-[7.4em] overflow-hidden rounded-[0.9em] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.12),0_1px_2px_rgb(23_44_33/0.05),0_18px_24px_-16px_rgb(23_44_33/0.35),inset_0_1px_0_#fff]">
                  <div className="flex gap-[0.3em] border-b border-ink/10 bg-[#f6f5f0] px-[0.7em] py-[0.55em]">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-[0.45em] rounded-full bg-ink/20" />
                    ))}
                  </div>
                  <div className="grid h-[6.4em] place-items-center">
                    <span className={`grid size-[4.2em] place-items-center rounded-[1em] ${p.chip === "NEW" ? "bg-[color-mix(in_srgb,var(--primary)_14%,white)]" : "bg-[#f4f3ee]"}`}>
                      <I className="size-[2.3em]" strokeWidth={1.5} color={INK} />
                    </span>
                  </div>
                  <div className="space-y-[0.4em] px-[0.9em] pb-[0.9em]">
                    <span className="block h-[0.4em] rounded-full bg-ink/15" />
                    <span className="block h-[0.4em] w-2/3 rounded-full bg-ink/10" />
                  </div>
                </div>
                </div>
              </div>
            </At>
            <At x={xs[i]} y={300} on={on} d={0.3 + i * 0.1}>
              <Tag small>{p.name}</Tag>
            </At>
            <At x={xs[i]} y={352} on={on} d={0.4 + i * 0.1}>
              <span
                className={`inline-flex rounded-md px-[0.85em] py-[0.45em] font-mono text-[0.95em] leading-none font-semibold tracking-[0.06em] ${p.chip === "NEW" ? "bg-primary text-ink" : "bg-white text-[#14632f] shadow-[inset_0_0_0_1.5px_rgb(25_231_110/0.8)]"}`}
              >
                {p.chip}
              </span>
            </At>
          </div>
        );
      })}
    </Stage>
  );
}

// ── 03 · Third-Party Visibility ──────────────────────────────────────────────────────────────────────────
const LEFT: { name: string; mark?: Icon; icon?: LucideIcon; s: Status }[] = [
  { name: "Reddit", mark: "reddit", s: "Present" },
  { name: "G2", mark: "g2", s: "Weak" },
  { name: "Comparison sites", icon: Layers, s: "Missing" },
];
const RIGHT: typeof LEFT = [
  { name: "YouTube", mark: "youtube", s: "Present" },
  { name: "Industry pubs", icon: Code2, s: "Weak" },
  { name: "Partner ecosystem", icon: Puzzle, s: "Missing" },
];
const ROWS = [88, 200, 312];
export function ThirdParty({ on }: SceneProps) {
  const wire = (s: Status) => ({ color: s === "Present" ? GREEN : s === "Weak" ? "#e2a336" : "rgb(217 101 67)", w: s === "Present" ? 1.8 : 1.4, o: s === "Present" ? 1 : s === "Weak" ? 0.7 : 0.55 });
  return (
    <Stage
      lines={
        <>
          {LEFT.map((c, i) => {
            const k = wire(c.s);
            return (
              <g key={c.name}>
                <Wire on={on} d={`M170 ${ROWS[i]} H194 V204 H204`} color={k.color} w={k.w} o={k.o} />
                <circle cx="170" cy={ROWS[i]} r="3.4" fill={k.color} className={show(on)} style={delay(0.2 + i * 0.1)} />
                {c.s === "Present" && <Packet on={on} d={`M170 ${ROWS[i]} H194 V204 H204`} begin={i * 0.8} dur={2.4} />}
                <path d="M206 204 l-7 -4.5 v9 z" fill={k.color} fillOpacity={k.o} className={show(on)} style={delay(0.5)} />
              </g>
            );
          })}
          {RIGHT.map((c, i) => {
            const k = wire(c.s);
            return (
              <g key={c.name}>
                <Wire on={on} d={`M350 ${ROWS[i]} H326 V204 H316`} color={k.color} w={k.w} o={k.o} />
                <circle cx="350" cy={ROWS[i]} r="3.4" fill={k.color} className={show(on)} style={delay(0.2 + i * 0.1)} />
                {c.s === "Present" && <Packet on={on} d={`M350 ${ROWS[i]} H326 V204 H316`} begin={0.4 + i * 0.8} dur={2.4} />}
                <path d="M314 204 l7 -4.5 v9 z" fill={k.color} fillOpacity={k.o} className={show(on)} style={delay(0.5)} />
              </g>
            );
          })}
          <Stack cx={260} cy={212} on={on} id="third-dots" green />
        </>
      }
    >
      {[LEFT, RIGHT].map((col, side) =>
        col.map((c, i) => (
          <At key={c.name} x={side === 0 ? 84 : 436} y={ROWS[i]} on={on} d={0.1 + i * 0.1 + side * 0.05}>
            <div className="relative flex w-[13.8em] flex-col gap-[0.6em] overflow-hidden rounded-[0.9em] bg-white px-[0.9em] py-[0.8em] shadow-[0_0_0_1px_rgb(23_44_33/0.1),0_1px_2px_rgb(23_44_33/0.05),0_12px_18px_-14px_rgb(23_44_33/0.3)]">
              <span className={`absolute inset-y-0 ${side === 0 ? "right-0" : "left-0"} w-[0.22em] ${STATUS[c.s].dot}`} />
              <span className="flex items-center gap-[0.6em] text-[1em] leading-none font-medium text-ink">
                <span className="grid size-[2em] shrink-0 place-items-center rounded-[0.6em] bg-[#f4f3ee]">
                  {c.mark ? <Mark name={c.mark} className="size-[1.3em]" /> : c.icon && <c.icon className="size-[1.25em]" strokeWidth={1.7} color={INK} />}
                </span>
                <span className="whitespace-nowrap">{c.name}</span>
              </span>
              <Chip s={c.s} />
            </div>
          </At>
        ))
      )}
      <At x={260} y={116} on={on} d={0.4}>
        <Tag>Your product</Tag>
      </At>
    </Stage>
  );
}

// ── 04 · Technical Foundation ────────────────────────────────────────────────────────────────────────────
function Mini({ ok }: { ok?: boolean | null }) {
  return (
    <div className="relative w-[6.4em]">
      <div className="overflow-hidden rounded-[0.7em] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.14),0_1px_2px_rgb(23_44_33/0.05),0_14px_18px_-14px_rgb(23_44_33/0.35)]">
        <div className="flex gap-[0.28em] border-b border-ink/10 bg-[#f6f5f0] px-[0.6em] py-[0.45em]">
          {[0, 1, 2].map((d) => (
            <span key={d} className="size-[0.4em] rounded-full bg-ink/20" />
          ))}
        </div>
        <div className="space-y-[0.4em] px-[0.8em] py-[0.9em]">
          <span className="block h-[0.38em] rounded-full bg-ink/20" />
          <span className="block h-[0.38em] rounded-full bg-ink/12" />
          <span className="block h-[0.38em] w-3/5 rounded-full bg-ink/12" />
        </div>
      </div>
      {ok !== undefined && ok !== null && (
        <span className={`absolute -right-[0.7em] -bottom-[0.7em] grid size-[1.9em] place-items-center rounded-full shadow-[0_0_0_0.2em_#fff] ${ok ? "bg-primary" : "bg-accent"}`}>
          {ok ? <Check className="size-[1.1em]" strokeWidth={3.4} color={INK} /> : <X className="size-[1.1em]" strokeWidth={3.4} color="#fff" />}
        </span>
      )}
    </div>
  );
}
export function Foundation({ on }: SceneProps) {
  const xs = [76, 206, 336];
  return (
    <Stage
      lines={
        <>
          {/* the tree: home to the healthy pages (solid green), and to the one search can't see (dashed) */}
          <g fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={show(on)} style={delay(0.2)}>
            <path d="M260 84 V106 M76 106 H336 M260 106 H336 M76 106 V132 M206 106 V132 M336 106 V132" />
          </g>
          <path d="M336 106 H466 V132" fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="1.5 3.5" strokeLinecap="round" className={show(on)} style={delay(0.35)} />
          {/* what blocks: an orphan with no way in, and a link that goes nowhere */}
          <path d="M206 218 V252" fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="1.3" strokeDasharray="1.5 3.5" strokeLinecap="round" className={show(on)} style={delay(0.5)} />
          <path d="M336 218 V262" fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="1.3" strokeDasharray="1.5 3.5" strokeLinecap="round" className={show(on)} style={delay(0.6)} />
          <Wire on={on} d="M260 84 V106 M76 106 H336 M76 106 V132 M206 106 V132 M336 106 V132" w={2.2} o={0.9} />
          {[76, 206, 336].map((x, i) => (
            <Packet key={x} on={on} d={`M260 84 V106 H${x} V132`} begin={i * 0.7} dur={2.8} />
          ))}
          <Port x={260} y={106} />
          {[76, 206, 336].map((x) => (
            <Port key={x} x={x} y={132} />
          ))}
          {[76, 206, 336, 466].map((x) => (
            <ellipse key={x} cx={x} cy="214" rx="34" ry="5" fill={INK} fillOpacity="0.09" />
          ))}
        </>
      }
    >
      <At x={260} y={58} on={on} d={0.05}>
        <Tile icon={Home} glow />
      </At>
      {xs.map((x, i) => (
        <At key={x} x={x} y={176} on={on} d={0.2 + i * 0.1}>
          <Mini ok />
        </At>
      ))}
      <At x={466} y={176} on={on} d={0.5}>
        <Mini ok={false} />
      </At>
      <At x={466} y={236} on={on} d={0.6}>
        <Tag>Not indexed</Tag>
      </At>
      <At x={206} y={304} on={on} d={0.7}>
        <div className="flex flex-col items-center gap-[0.8em]">
          <Mini ok={false} />
          <Tag>Orphan page</Tag>
        </div>
      </At>
      <At x={336} y={300} on={on} d={0.8}>
        <div className="flex flex-col items-center gap-[0.8em]">
          <span className="relative">
            <Tile icon={Link2} />
            <span className="absolute -right-[0.5em] -bottom-[0.5em] grid size-[1.8em] place-items-center rounded-full bg-accent shadow-[0_0_0_0.2em_#fff]">
              <X className="size-[1em]" strokeWidth={3.4} color="#fff" />
            </span>
          </span>
          <Tag>Broken link</Tag>
        </div>
      </At>
    </Stage>
  );
}
