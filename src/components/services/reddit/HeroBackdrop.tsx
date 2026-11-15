"use client";

import { useEffect, useRef, useState } from "react";
import { Mark } from "../parts";

// The Reddit hero's backdrop: a recommendation spreading outward. Behind the cards, many very light semicircles sweep out past
// both sides of the page and run all the way down to the section's edge. A few communities are pinned to them: each a small dot on
// an arc, and for some a stem up or down to a chip (the Reddit mark and the subreddit's name), set in the margins higher and further
// round than the cards, differently on each side so the two never mirror one another. Three things move, all slowly and softly:
// a ripple that widens across the margins like a shadow (each community lights as it reaches it), and a few thin streams of green
// that flow along different arcs, each on its own timing, like replies passing through. Nothing passes under the headline: a soft
// mask clears it, and the cards sit over the middle. Shown from 1280px up, where there are margins to use; reduced motion draws the
// still arcs, dots and chips.

const CYCLE = 11; // seconds from one ripple to the next
const SPREAD = 8.5; // seconds a ripple takes to widen from its start to its end
const R0 = 400; // px, the ripple's radius when it starts
const R1 = 1700; // and when it has faded out
const RADII = [480, 570, 670, 780, 900, 1030, 1170, 1320, 1480, 1660]; // px; the gaps widen outward
const SHIFT = 56; // px the centre of the arcs and of the ripple sits left of the page's centre
const HALF = 430; // half-width of the headline block, px
const STEM = 30; // px from a dot to its chip

// The communities, pinned to the arcs by hand and differently on each side: [side (0 left, 1 right), arc, degrees above the horizontal]. A dot each.
const DOTS: [number, number, number][] = [
  [0, 1, 14],
  [0, 2, 24],
  [0, 3, 30],
  [0, 5, 44],
  [1, 2, 40],
  [1, 3, 20],
  [1, 4, 30],
  [1, 6, 36],
];
// And the ones that are chips: [side, arc, degrees, name, stem direction (-1 up, 1 down)].
const CHIPS: [number, number, number, string, number][] = [
  [0, 4, 52, "r/LangChain", 1],
  [0, 2, 36, "r/MLOps", -1],
  [1, 4, 43, "r/artificial", 1],
  [1, 3, 34, "r/Agents", -1],
  [1, 1, 25, "r/SaaS", 1],
];
// Streams of green flowing along some of the arcs, left to right: [arc, seconds per lap, start offset in seconds]. Uneven on purpose.
const STREAMS: [number, number, number][] = [
  [2, 13, -2],
  [4, 18, -9],
  [6, 22, -14],
  [3, 16, -6],
  [8, 25, -19],
];

const KEYFRAMES = `
@keyframes ripple-out { 0% { transform: scale(${R0 / R1}); opacity: 0; } 14% { opacity: 1; } ${(SPREAD / CYCLE) * 100}% { transform: scale(1); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }
@keyframes ripple-hit { 0% { opacity: 0; transform: scale(0.7); } 3% { opacity: 0.8; transform: scale(1); } 14%, 100% { opacity: 0; transform: scale(2.4); } }
@keyframes chip-hit { 0% { box-shadow: 0 0 0 1px rgb(23 44 33 / 0.07), 0 6px 14px -10px rgb(23 44 33 / 0.25); } 4% { box-shadow: 0 0 0 1px rgb(25 231 110 / 0.55), 0 0 16px 1px rgb(25 231 110 / 0.22), 0 6px 14px -10px rgb(23 44 33 / 0.25); } 18%, 100% { box-shadow: 0 0 0 1px rgb(23 44 33 / 0.07), 0 6px 14px -10px rgb(23 44 33 / 0.25); } }
@keyframes ripple-glow { 0% { opacity: 0; } 3% { opacity: 1; } 15%, 100% { opacity: 0; } }
@keyframes stream-run { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
`;

export default function HeroBackdrop() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { w, h } = size;
  const mid = w / 2; // the page's centre: the headline's
  const cx = mid - SHIFT; // the arcs' centre
  const cy = h - 420; // behind the middle card
  const drop = h - cy; // how far below the centre the arcs run: to the bottom of the section

  const arc = (r: number) => {
    const s = Math.sqrt(Math.max(0, r * r - drop * drop));
    return `M${cx - s} ${h} A${r} ${r} 0 1 1 ${cx + s} ${h}`;
  };
  const at = (side: number, r: number, deg: number) => [Math.round(cx + (side ? 1 : -1) * r * Math.cos((deg * Math.PI) / 180)), Math.round(cy - r * Math.sin((deg * Math.PI) / 180))] as const;
  const free = (x: number, y: number, edge: number) => Math.abs(x - mid) > HALF + 24 && x > edge && x < w - edge && y > 60; // clear of the headline, and far enough from the page edge

  // The communities that are on the page, with the moment in each cycle that the ripple reaches them.
  const dots = DOTS.flatMap(([side, k, deg]) => {
    const [x, y] = at(side, RADII[k], deg);
    return free(x, y, 24) ? [{ x, y, at: (SPREAD * (RADII[k] - R0)) / (R1 - R0), key: `d${side}-${k}-${deg}` }] : [];
  });
  const chips = CHIPS.flatMap(([side, k, deg, name, dir]) => {
    const [x, y] = at(side, RADII[k], deg);
    return free(x, y, 96) ? [{ x, y, dir, name, at: (SPREAD * (RADII[k] - R0)) / (R1 - R0), key: `c${side}-${k}-${deg}` }] : [];
  });

  return (
    <div ref={box} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden xl:block">
      <style href="reddit-hero-backdrop" precedence="default">
        {KEYFRAMES}
      </style>
      {/* a fine dot texture along the page edges only */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgb(23 44 33 / 0.14) 1px, transparent 1.3px)",
          backgroundSize: "16px 16px",
          maskImage: "linear-gradient(90deg, #000 0, transparent 20%, transparent 80%, #000 100%), linear-gradient(180deg, transparent 0, #000 22%, #000 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      {w > 0 && (
        <svg width={w} height={h} className="absolute inset-0" style={{ maskImage: "linear-gradient(180deg, transparent 0, #000 10%, #000 88%, transparent 100%)" }}>
          <defs>
            <filter id="rp-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <filter id="rp-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <mask id="rp-clear" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
              <rect width={w} height={h} fill="white" />
              <rect x={mid - HALF} y={90} width={HALF * 2} height={560} rx={28} fill="black" filter="url(#rp-soft)" />
            </mask>
          </defs>
          <g mask="url(#rp-clear)" fill="none" strokeLinecap="round">
            {/* the arcs: many, light, and running all the way down */}
            {RADII.map((r, k) => (
              <path key={r} d={arc(r)} stroke={`rgb(23 44 33 / ${(0.1 - k * 0.006).toFixed(3)})`} strokeWidth="1" />
            ))}

            {/* the ripple: a soft green shadow widening from behind the cards, fading as it goes */}
            <g className="motion-reduce:hidden" style={{ transformOrigin: `${cx}px ${cy}px`, animation: `ripple-out ${CYCLE}s linear infinite`, opacity: 0 }}>
              <g filter="url(#rp-shadow)">
                <path d={arc(R1)} stroke="rgb(25 231 110 / 0.11)" strokeWidth="46" className="[vector-effect:non-scaling-stroke]" />
              </g>
            </g>

            {/* streams of green flowing along some of the arcs, each on its own timing */}
            {STREAMS.map(([k, secs, from]) => (
              <g key={k} className="motion-reduce:hidden" style={{ animation: `stream-run ${secs}s linear infinite`, animationDelay: `${from}s` }}>
                <path d={arc(RADII[k])} pathLength={1000} stroke="rgb(25 231 110 / 0.1)" strokeWidth="5" strokeDasharray="170 830" />
                <path d={arc(RADII[k])} pathLength={1000} stroke="rgb(25 231 110 / 0.35)" strokeWidth="1.6" strokeDasharray="90 910" />
              </g>
            ))}

            {/* the stems from a chip's dot to the chip */}
            {chips.map((c) => (
              <line key={`s${c.key}`} x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.dir * (STEM + 2)} stroke="rgb(23 44 33 / 0.22)" strokeWidth="1" />
            ))}

            {/* the communities: a dot each on its arc, and a soft light when the ripple reaches it */}
            {[...dots, ...chips].map((n) => (
              <g key={n.key}>
                <circle cx={n.x} cy={n.y} r="4" fill="white" stroke="rgb(23 44 33 / 0.22)" strokeWidth="1.1" />
                <g className="motion-reduce:hidden">
                  <circle cx={n.x} cy={n.y} r="11" fill="rgb(25 231 110 / 0.14)" style={{ animation: `ripple-glow ${CYCLE}s ease-out infinite backwards`, animationDelay: `${n.at}s` }} />
                  <circle cx={n.x} cy={n.y} r="3.4" fill="rgb(25 231 110)" style={{ animation: `ripple-glow ${CYCLE}s ease-out infinite backwards`, animationDelay: `${n.at}s` }} />
                  <circle cx={n.x} cy={n.y} r="6" fill="none" stroke="rgb(25 231 110 / 0.8)" strokeWidth="1.1" style={{ transformBox: "fill-box", transformOrigin: "center", animation: `ripple-hit ${CYCLE}s ease-out infinite backwards`, animationDelay: `${n.at}s` }} />
                </g>
              </g>
            ))}
          </g>
        </svg>
      )}
      {w > 0 && (
        <div className="absolute inset-0" style={{ maskImage: "linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%)" }}>
          {chips.map((c) => (
            <span
              key={c.key}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white py-[3px] pr-2.5 pl-[3px] text-[11.5px] font-medium tracking-[-0.01em] text-ink/60 shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_6px_14px_-10px_rgb(23_44_33/0.25)] motion-safe:animate-[chip-hit_11s_ease-out_infinite_backwards]"
              style={{ left: c.x, top: c.y + c.dir * (STEM + 13), animationDelay: `${c.at}s` }}
            >
              <Mark name="reddit" className="size-[1.1rem]" />
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
