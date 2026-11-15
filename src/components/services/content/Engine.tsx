"use client";

import { Mail } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Label, PATHS, PLATFORM_COLOR, useInView } from "../kit";
import { Mark } from "../parts";
import { ENGINE } from "./content";

// The engine as four cards in a 2×2 board: a title, one short line, and a small glyph that says the same thing
// without words, drawn in the landing page's dot-dither style (ink dots, a brand-green top layer, dotted green
// wires). Each glyph has a quiet hover: layers pull apart, pages fan out, the dotted wires start to march and the
// channel pills take a green edge. The cards rise in once, as they scroll into view.
//   Strategy & Research        a stack of layers, the top one lit: the right angle found among the rest
//   Technical Production       a stack of finished pages, the front one with its image and text
//   Search & AI Optimization   one page sending a dotted wire to Google, ChatGPT and Perplexity
//   Distribution & Compounding the layers again, sending wires to Reddit, LinkedIn, X and email

const GREEN = "var(--primary)";
const INK = "#172c21";

export default function Engine() {
  const glyphs = [Layers, Pages, Search, Distribute];
  return (
    <section aria-labelledby="engine-title" className="bg-white px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{ENGINE.label}</Label>
        <h2 id="engine-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {ENGINE.title}
        </h2>
        <p className="mt-5 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{ENGINE.body}</p>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:mt-14">
          {ENGINE.parts.map((part, i) => {
            const Glyph = glyphs[i];
            return (
              <Card key={part.name} i={i} {...part}>
                <Glyph />
              </Card>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Card({ i, name, body, children }: { i: number; name: string; body: string; children: ReactNode }) {
  const [ref, seen] = useInView<HTMLLIElement>(0.2);
  return (
    <li
      ref={ref}
      className={`group flex flex-col gap-7 rounded-2xl border border-line bg-[#f9f8f4] p-7 min-[1360px]:flex-row min-[1360px]:items-center min-[1360px]:justify-between min-[1360px]:gap-6 min-[1360px]:p-9 ${seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0"}`}
      style={{ animationDelay: `${(i % 2) * 0.1 + Math.floor(i / 2) * 0.15}s` }}
    >
      <div className="max-w-[16.5rem]">
        <h3 className="text-[1.5rem] leading-[1.1] font-medium tracking-[-0.035em] text-ink">{name}</h3>
        <p className="mt-3 text-[1rem] leading-relaxed text-ink/60">{body}</p>
      </div>
      <div aria-hidden="true" className="shrink-0 self-center">
        {children}
      </div>
    </li>
  );
}

// ── The glyph kit ────────────────────────────────────────────────────────────────────────────────────────────

/** A dither fill: dots on a diagonal lattice, the way the landing page prints its surfaces. */
function Dots({ id, color, o = 1 }: { id: string; color: string; o?: number }) {
  return (
    <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.25" cy="1.25" r="0.85" fill={color} fillOpacity={o} />
      <circle cx="3.75" cy="3.75" r="0.85" fill={color} fillOpacity={o} />
    </pattern>
  );
}

/** One isometric sheet, drawn flat: a dotted top and a thin front edge. `y` is its vertical place. */
function Sheet({ y, fill, edge, stroke }: { y: number; fill: string; edge: string; stroke: string }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path d="M14 49 L14 55 L100 98 L186 55 L186 49 L100 92 Z" fill={edge} />
      <path d="M100 6 L186 49 L100 92 L14 49 Z" fill="#f9f8f4" />
      <path d="M100 6 L186 49 L100 92 L14 49 Z" fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

/** Three sheets, the top one lit. They pull apart on hover. */
function LayerStack({ className = "", viewBox = "0 0 200 170" }: { className?: string; viewBox?: string }) {
  const id = useId();
  return (
    <svg viewBox={viewBox} className={`overflow-visible ${className}`}>
      <defs>
        <Dots id={`${id}i`} color={INK} o={0.5} />
        <Dots id={`${id}g`} color={GREEN} />
      </defs>
      <g className="transition-transform duration-500 ease-out group-hover:translate-y-2.5 motion-reduce:transition-none">
        <Sheet y={62} fill={`url(#${id}i)`} edge="rgb(23 44 33 / 0.18)" stroke="rgb(23 44 33 / 0.55)" />
      </g>
      <Sheet y={31} fill={`url(#${id}i)`} edge="rgb(23 44 33 / 0.18)" stroke="rgb(23 44 33 / 0.55)" />
      <g className="transition-transform duration-500 ease-out group-hover:-translate-y-2.5 motion-reduce:transition-none">
        <Sheet y={0} fill={`url(#${id}g)`} edge="rgb(25 231 110 / 0.4)" stroke={GREEN} />
      </g>
    </svg>
  );
}

function Layers() {
  return <LayerStack className="h-44 w-[15.5rem]" viewBox="-60 0 248 170" />;
}

/** Pages: a stack of finished articles; the front one carries an image and text. They fan out on hover. */
function Pages() {
  const id = useId();
  return (
    <svg viewBox="-68 0 248 170" className="h-44 w-[15.5rem] overflow-visible">
      <defs>
        <Dots id={id} color={INK} o={0.4} />
      </defs>
      <g className="transition-transform duration-500 ease-out group-hover:translate-x-2.5 group-hover:-translate-y-2.5 motion-reduce:transition-none">
        <rect x="74" y="12" width="104" height="108" rx="8" fill={`url(#${id})`} stroke="rgb(23 44 33 / 0.55)" strokeWidth="1.4" />
      </g>
      <g className="transition-transform duration-500 ease-out group-hover:translate-x-1.5 group-hover:-translate-y-1.5 motion-reduce:transition-none">
        <rect x="55" y="30" width="104" height="108" rx="8" fill="#f9f8f4" stroke="rgb(23 44 33 / 0.55)" strokeWidth="1.4" />
        <rect x="55" y="30" width="104" height="108" rx="8" fill={`url(#${id})`} />
      </g>
      <rect x="24" y="48" width="112" height="108" rx="8" fill="#fff" stroke={INK} strokeWidth="1.6" />
      <rect x="36" y="62" width="36" height="30" rx="3" fill="none" stroke={INK} strokeWidth="1.4" />
      <path d="M38 88 L50 74 L58 82 L64 76 L70 88" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="63" cy="69" r="2" fill={INK} />
      <g stroke={INK} strokeWidth="1.6" strokeLinecap="round">
        <path d="M82 66 H124 M82 76 H124 M82 86 H114" />
        <path d="M36 106 H124 M36 116 H124 M36 126 H124 M36 136 H100" />
      </g>
    </svg>
  );
}

const WIRE = "[stroke-dasharray:1_6] group-hover:animate-dash-flow motion-reduce:animate-none";

/** A dotted green wire from one point to another, with a dot at each end. It starts to march on hover. */
function Wire({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const mx = (x0 + x1) / 2;
  return (
    <>
      <path d={`M${x0} ${y0} C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`} fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" className={WIRE} />
      <circle cx={x1} cy={y1} r="2.6" fill={GREEN} />
    </>
  );
}

const PILL = "absolute flex items-center rounded-lg border border-line bg-white shadow-[0_1px_2px_rgb(23_44_33/0.05)] transition-[border-color,transform] duration-300 group-hover:border-[color-mix(in_srgb,var(--primary)_65%,transparent)] group-hover:translate-x-0.5 motion-reduce:transition-none";

/** A page of text, outlined. */
function Page({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 88" className={`overflow-visible ${className}`}>
      <rect x="1.5" y="1.5" width="61" height="85" rx="6" fill="#fff" stroke={INK} strokeWidth="1.6" />
      <g stroke={INK} strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 20 H52 M12 30 H52 M12 40 H52 M12 50 H52 M12 60 H34" />
      </g>
    </svg>
  );
}

/** Search & AI: one page, three surfaces. */
function Search() {
  const rows = [
    { name: "Google", mark: "google" as const, y: 26 },
    { name: "ChatGPT", mark: "chatgpt" as const, y: 88 },
    { name: "Perplexity", mark: "perplexity" as const, y: 150 },
  ];
  return (
    <div className="relative h-44 w-[15.5rem]">
      <Page className="absolute top-[44px] left-0 h-[88px] w-16" />
      <svg viewBox="0 0 84 176" className="absolute top-0 left-16 h-44 w-[84px] overflow-visible">
        <circle cx="0" cy="88" r="2.6" fill={GREEN} />
        {rows.map((r) => (
          <Wire key={r.name} x0={0} y0={88} x1={84} y1={r.y} />
        ))}
      </svg>
      {rows.map((r) => (
        <span key={r.name} className={`${PILL} left-[148px] h-8 w-[100px] -translate-y-1/2 gap-1.5 pl-2.5 text-[0.72rem] font-medium text-ink`} style={{ top: r.y }}>
          <Mark name={r.mark} className="size-3.5" />
          {r.name}
        </span>
      ))}
    </div>
  );
}

const CHANNELS = [
  { name: "Reddit", node: <Mark name="reddit" className="size-4" /> },
  {
    name: "LinkedIn",
    node: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill={PLATFORM_COLOR.linkedin}>
        {PATHS.linkedin}
      </svg>
    ),
  },
  { name: "X", node: <Mark name="x" className="size-3.5" /> },
  { name: "Email", node: <Mail aria-hidden="true" className="size-4 text-ink/70" strokeWidth={1.8} /> },
];

/** Distribution & Compounding: the layers, and four channels they reach. */
function Distribute() {
  const ys = [22, 66, 110, 154];
  return (
    <div className="relative h-44 w-[15.5rem]">
      <LayerStack className="absolute top-[44px] left-[16px] h-[88px] w-[104px]" />
      <svg viewBox="0 0 88 176" className="absolute top-0 left-[124px] h-44 w-[88px] overflow-visible">
        <circle cx="0" cy="88" r="2.6" fill={GREEN} />
        {ys.map((y) => (
          <Wire key={y} x0={0} y0={88} x1={88} y1={y} />
        ))}
      </svg>
      {CHANNELS.map((c, k) => (
        <span key={c.name} title={c.name} className={`${PILL} left-[212px] size-9 -translate-y-1/2 justify-center`} style={{ top: ys[k] }}>
          {c.node}
        </span>
      ))}
    </div>
  );
}
