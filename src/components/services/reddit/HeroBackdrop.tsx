"use client";

import { useEffect, useRef, useState } from "react";

// The Reddit hero's backdrop, drawn from the thing Reddit is made of: the comment thread. In each margin a fine vertical
// line runs down the page like the line beside a comment, and replies branch off it with a soft curve, some branching
// again, each ending in a small avatar-sized node. The two margins are different trees. One branch is the lit one,
// the reply that was upvoted, in brand green, with a slow glint of light passing along it. Everything is a hairline;
// a fine dot texture sits only along the page edges. Nothing passes under the headline: a soft mask clears it, and
// the cards sit over the rest. Shown from 1280px up, where there are margins; reduced motion draws it still.

const KEYFRAMES = `
@keyframes thread-run { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
@keyframes thread-breathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
`;

const R = 58; // how wide a branch's curve sweeps out of its line, px
const HALF = 430; // half-width of the headline block, px

type Tree = { x: number; from: number; to: number; leaves: [y: number, end: number][]; kids?: { at: number; y: number; to: number; leaves: [number, number][] }[]; lit?: number };

// One tree per margin, measured from its page edge. `leaves`: [height a reply leaves the line at, how far it runs].
const TREES: Tree[] = [
  { x: 44, from: 96, to: 1160, leaves: [[250, 110], [430, 150], [700, 120], [940, 150]], kids: [{ at: 430, y: 560, to: 600, leaves: [[500, 90]] }], lit: 700 },
  { x: 62, from: 120, to: 1120, leaves: [[190, 120], [340, 90], [600, 140], [840, 110], [1010, 70]], kids: [{ at: 600, y: 700, to: 760, leaves: [[660, 80]] }] },
];

/** A reply leaving a vertical line at height y: a soft curve out of the line, then straight along to `end`. */
const leaf = (x: number, y: number, end: number) => `M${x} ${y - R} C${x} ${y - R * 0.45} ${x + R * 0.45} ${y} ${x + R} ${y} H${x + R + end}`;

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

  return (
    <div ref={box} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden xl:block">
      <style href="reddit-hero-backdrop" precedence="default">
        {KEYFRAMES}
      </style>
      {/* a fine dot texture along the page edges only */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgb(23 44 33 / 0.13) 1px, transparent 1.3px)",
          backgroundSize: "16px 16px",
          maskImage: "linear-gradient(90deg, #000 0, transparent 17%, transparent 83%, #000 100%), linear-gradient(180deg, transparent 0, #000 22%, #000 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      {w > 0 && (
        <svg width={w} height={h} className="absolute inset-0 overflow-visible" style={{ maskImage: "linear-gradient(180deg, transparent 0, #000 14%, #000 88%, transparent 100%)" }}>
          <defs>
            <filter id="rd-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <mask id="rd-clear" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
              <rect width={w} height={h} fill="white" />
              <rect x={w / 2 - HALF} y={90} width={HALF * 2} height={560} rx={28} fill="black" filter="url(#rd-soft)" />
            </mask>
          </defs>
          <g mask="url(#rd-clear)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {TREES.map((t, side) => (
              <g key={side} transform={side ? `translate(${w} 0) scale(-1 1)` : undefined}>
                <g stroke="rgb(23 44 33 / 0.1)" strokeWidth="1.1">
                  <path d={`M${t.x} ${t.from} V${t.to}`} />
                  {t.leaves.map(([y, end]) => (
                    <path key={y} d={leaf(t.x, y, end)} />
                  ))}
                  {t.kids?.map((k) => {
                    const cx = t.x + R + 62; // the nested thread's own line, set in from its parent's
                    return (
                      <g key={k.at}>
                        <path d={`M${cx} ${k.at} V${k.to}`} />
                        {k.leaves.map(([y, end]) => (
                          <path key={y} d={leaf(cx, y, end)} />
                        ))}
                      </g>
                    );
                  })}
                </g>
                {/* the avatar-sized node at the end of each reply */}
                <g fill="white" stroke="rgb(23 44 33 / 0.16)" strokeWidth="1.1">
                  {t.leaves.map(([y, end]) => (
                    <circle key={y} cx={t.x + R + end} cy={y} r="5" />
                  ))}
                  {t.kids?.flatMap((k) => k.leaves.map(([y, end]) => <circle key={`${k.at}-${y}`} cx={t.x + R + 62 + R + end} cy={y} r="5" />))}
                </g>
                {/* the lit reply: the upvoted one, in green, with a glint of light along it */}
                {t.lit && (
                  <g className="motion-safe:animate-[thread-breathe_8s_ease-in-out_infinite]">
                    <path d={`M${t.x} ${t.lit - 150} V${t.lit - R} C${t.x} ${t.lit - R * 0.45} ${t.x + R * 0.45} ${t.lit} ${t.x + R} ${t.lit} H${t.x + R + t.leaves.find(([y]) => y === t.lit)![1]}`} stroke="rgb(25 231 110 / 0.5)" strokeWidth="1.6" />
                    <path d={`M${t.x} ${t.lit - 150} V${t.lit - R} C${t.x} ${t.lit - R * 0.45} ${t.x + R * 0.45} ${t.lit} ${t.x + R} ${t.lit} H${t.x + R + t.leaves.find(([y]) => y === t.lit)![1]}`} pathLength={1000} stroke="rgb(25 231 110 / 0.5)" strokeWidth="3.4" strokeDasharray="130 870" className="motion-safe:animate-[thread-run_9s_linear_infinite] motion-reduce:hidden" />
                    <circle cx={t.x + R + t.leaves.find(([y]) => y === t.lit)![1]} cy={t.lit} r="5" fill="rgb(25 231 110)" />
                    <circle cx={t.x + R + t.leaves.find(([y]) => y === t.lit)![1]} cy={t.lit} r="9" fill="rgb(25 231 110 / 0.16)" />
                  </g>
                )}
              </g>
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
