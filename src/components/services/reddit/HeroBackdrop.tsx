"use client";

import { useEffect, useRef, useState } from "react";

// The Reddit hero's backdrop: ripples. A recommendation in the right thread travels outward, so a set of very faint, wide
// arcs rises from behind the middle card and sweeps out past both sides of the page, each one wider and fainter than the
// last, like rings on water. A few tiny nodes sit on the arcs (the communities it reaches), one stretch of one arc is lit
// in brand green on each side, and a single soft glint of light glides slowly along that arc. A fine dot texture runs along
// the page edges only. Nothing passes under the headline: a soft mask clears it, and the cards sit over the middle.
// Shown from 1280px up, where there are margins to use; reduced motion draws it still.

const KEYFRAMES = `
@keyframes ripple-run { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
@keyframes ripple-breathe { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
`;

const RADII = Array.from({ length: 17 }, (_, k) => Math.round(360 * 1.13 ** k)); // px; the gaps widen outward
const LIT = [3, 6]; // the arcs with a lit stretch
const DY = 140; // arcs are drawn down to this far below their centre, then fade out
const HALF = 430; // half-width of the headline block, px
// Tiny nodes on the arcs: [arc, height on the left, height on the right], px from the top of the hero.
const NODES: [number, number, number][] = [[1, 640, 560], [2, 540, 650], [3, 450, 380], [4, 360, 470], [5, 290, 230], [6, 400, 330], [7, 210, 300], [8, 520, 180], [9, 140, 420], [10, 330, 540], [11, 600, 250], [12, 260, 480], [13, 460, 160]];

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
  const cx = w / 2;
  const cy = h - 420; // behind the middle card

  const arc = (r: number) => {
    const s = Math.sqrt(r * r - DY * DY);
    return `M${cx - s} ${cy + DY} A${r} ${r} 0 1 1 ${cx + s} ${cy + DY}`;
  };

  return (
    <div ref={box} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden xl:block">
      <style href="reddit-hero-backdrop" precedence="default">
        {KEYFRAMES}
      </style>
      {/* a fine dot texture along the page edges only */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgb(23 44 33 / 0.16) 1px, transparent 1.3px)",
          backgroundSize: "14px 14px",
          maskImage: "linear-gradient(90deg, #000 0, transparent 24%, transparent 76%, #000 100%), linear-gradient(180deg, transparent 0, #000 22%, #000 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      {w > 0 && (
        <svg width={w} height={h} className="absolute inset-0" style={{ maskImage: "linear-gradient(180deg, transparent 0, #000 12%, #000 74%, transparent 96%)" }}>
          <defs>
            <filter id="rp-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <mask id="rp-clear" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
              <rect width={w} height={h} fill="white" />
              <rect x={cx - HALF} y={90} width={HALF * 2} height={560} rx={28} fill="black" filter="url(#rp-soft)" />
            </mask>
            {LIT.flatMap((k, n) =>
              [0, 1].map((side) => {
                // the stretch sits where this arc is in the margin beside the headline
                const dx = Math.sqrt(Math.max(0, RADII[k] ** 2 - (cy - (n ? 330 : 470)) ** 2));
                const x0 = side ? cx + dx - 90 : cx - dx - 90;
                return (
                  <linearGradient key={`${k}-${side}`} id={`rp-lit-${n}-${side}`} gradientUnits="userSpaceOnUse" x1={x0} x2={x0 + 180} y1="0" y2="0">
                    <stop offset="0" stopColor="rgb(25 231 110)" stopOpacity="0" />
                    <stop offset="0.5" stopColor="rgb(25 231 110)" stopOpacity="1" />
                    <stop offset="1" stopColor="rgb(25 231 110)" stopOpacity="0" />
                  </linearGradient>
                );
              }),
            )}
          </defs>
          <g mask="url(#rp-clear)" fill="none" strokeLinecap="round">
            {/* fine arcs between the main ones, for density */}
            {RADII.slice(0, -1).flatMap((r, k) =>
              [1 / 3, 2 / 3].map((f) => <path key={`f${r}-${f}`} d={arc(r + (RADII[k + 1] - r) * f)} stroke={`rgb(23 44 33 / ${(0.065 - k * 0.001).toFixed(3)})`} strokeWidth="1" />),
            )}
            {RADII.map((r, k) => (
              <path key={r} d={arc(r)} stroke={`rgb(23 44 33 / ${(0.125 - k * 0.0025).toFixed(3)})`} strokeWidth="1.1" />
            ))}
            {/* lit stretches, breathing slowly, out of step */}
            {LIT.flatMap((k, n) =>
              [0, 1].map((side) => (
                <path key={`${k}-${side}`} d={arc(RADII[k])} stroke={`url(#rp-lit-${n}-${side})`} strokeWidth="1.6" className="motion-safe:animate-[ripple-breathe_9s_ease-in-out_infinite]" style={{ animationDelay: `${-(n * 3 + side * 4.5)}s` }} />
              )),
            )}
            {/* one soft glint of light, gliding slowly along the first lit arc */}
            <g className="motion-reduce:hidden" style={{ animation: "ripple-run 11s linear infinite" }}>
              <path d={arc(RADII[LIT[0]])} pathLength={1000} stroke="rgb(25 231 110 / 0.14)" strokeWidth="3.4" strokeDasharray="170 830" />
              <path d={arc(RADII[LIT[0]])} pathLength={1000} stroke="rgb(25 231 110 / 0.34)" strokeWidth="1.5" strokeDasharray="55 945" />
            </g>
            {/* the communities it reaches */}
            {NODES.flatMap(([k, yl, yr]) =>
              [yl, yr].map((y, side) => {
                const r = RADII[k];
                const dx = Math.sqrt(Math.max(0, r * r - (cy - y) ** 2));
                const x = side ? cx + dx : cx - dx;
                if (x < 14 || x > w - 14 || Math.abs(x - cx) < HALF + 20) return null;
                const lit = LIT.includes(k);
                return (
                  <g key={`${k}-${side}`}>
                    {lit && <circle cx={x} cy={y} r="9" fill="rgb(25 231 110 / 0.14)" />}
                    <circle cx={x} cy={y} r="4.5" fill={lit ? "rgb(25 231 110)" : "white"} stroke={lit ? "none" : "rgb(23 44 33 / 0.18)"} strokeWidth="1.1" />
                  </g>
                );
              }),
            )}
          </g>
        </svg>
      )}
    </div>
  );
}
