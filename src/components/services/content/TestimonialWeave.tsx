"use client";

import { useEffect, useRef, useState } from "react";

// The testimonial's backdrop: soft green lines flowing in from both page edges toward the quote and gone before they
// reach it. Eleven lanes, each its own gentle wave, with a fine bundle either side for density, and on each side a
// short stretch of two lanes lit a little brighter, breathing slowly, and a soft streak of light travels along a few lanes, out of step with one another. The lines are masked out across the quote and
// the attribution, so nothing ever passes under the text. The only motion is slow: the lanes drift a few pixels up and
// down in two groups moving against each other, and the lit stretches breathe, and the streaks glide. Shown from 1280px up, where the margins are wide enough; reduced motion
// draws it still.

const KEYFRAMES = `
@keyframes weave-drift-a { from { transform: translateY(-9px); } to { transform: translateY(9px); } }
@keyframes weave-drift-b { from { transform: translateY(8px); } to { transform: translateY(-8px); } }
@keyframes weave-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes weave-run { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
`;

// Lanes a soft streak of light travels along, left to right: [lane, seconds per lap, start offset in seconds].
const STREAKS: Record<number, [number, number]> = { 2: [14, -3], 5: [17, -10], 8: [13, -6], 10: [16, -12] };

const LANES = 11;
const STEP = 5; // px between sampled points
const QUOTE = 470; // half-width of the area the lines stay out of, px

/** Lane `k` of `n`: its own wave around the vertical middle. */
function lane(k: number, w: number, h: number) {
  const mid = h * 0.5 + (k - (LANES - 1) / 2) * 30;
  const a = 34 + ((k * 7) % 5) * 11;
  const l = 520 + ((k * 3) % 4) * 70;
  const p = k * 1.3 + 0.4;
  let d = "";
  for (let x = -20; x <= w + 20; x += STEP) d += `${x === -20 ? "M" : "L"}${x} ${(mid + a * Math.sin((2 * Math.PI * x) / l + p) + 0.28 * a * Math.sin((2 * Math.PI * x) / (l * 0.6) + k)).toFixed(1)}`;
  return d;
}

export default function TestimonialWeave() {
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
  const clear = Math.min(QUOTE, w / 2 - 24);

  return (
    <div
      ref={box}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden xl:block"
      style={{ maskImage: "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)" }}
    >
      <style href="testimonial-weave" precedence="default">
        {KEYFRAMES}
      </style>
      {w > 0 && (
        <svg
          width={w}
          height={h}
          className="absolute inset-0"
          style={{ maskImage: `linear-gradient(90deg, #000 0, #000 ${w / 2 - clear - 140}px, transparent ${w / 2 - clear}px, transparent ${w / 2 + clear}px, #000 ${w / 2 + clear + 140}px, #000 100%)` }}
        >
          <defs>
            {[0, 1].map((side) => (
              <linearGradient key={side} id={`tw-lit-${side}`} gradientUnits="userSpaceOnUse" x1={side ? w * 0.82 : w * 0.06} x2={side ? w * 0.94 : w * 0.18} y1="0" y2="0">
                <stop offset="0" stopColor="rgb(25 231 110)" stopOpacity="0" />
                <stop offset="0.5" stopColor="rgb(25 231 110)" stopOpacity="1" />
                <stop offset="1" stopColor="rgb(25 231 110)" stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {[0, 1].map((g) => (
              <g key={g} style={{ animation: `weave-drift-${g ? "b" : "a"} ${g ? 19 : 15}s ease-in-out infinite alternate` }} className="motion-reduce:[animation:none]">
                {Array.from({ length: LANES }, (_, k) => k)
                  .filter((k) => k % 2 === g)
                  .map((k) => (
                    <g key={k}>
                      <path d={lane(k, w, h)} stroke={`rgb(25 231 110 / ${(0.3 - Math.abs(k - (LANES - 1) / 2) * 0.03).toFixed(3)})`} strokeWidth="1.1" />
                      {STREAKS[k] && (
                        <g className="motion-reduce:hidden" style={{ animation: `weave-run ${STREAKS[k][0]}s linear infinite`, animationDelay: `${STREAKS[k][1]}s` }}>
                          <path d={lane(k, w, h)} pathLength={1000} stroke="rgb(25 231 110 / 0.16)" strokeWidth="3.2" strokeDasharray="190 810" />
                          <path d={lane(k, w, h)} pathLength={1000} stroke="rgb(25 231 110 / 0.34)" strokeWidth="1.5" strokeDasharray="60 940" />
                        </g>
                      )}
                    </g>
                  ))}
              </g>
            ))}
            {/* fine lines either side, for density */}
            {[-1, 1].flatMap((sgn) =>
              Array.from({ length: 5 }, (_, j) => (
                <path key={`${sgn}${j}`} d={lane(sgn < 0 ? 0 : LANES - 1, w, h)} transform={`translate(0 ${sgn * (34 + j * 12)})`} stroke={`rgb(25 231 110 / ${(0.12 * Math.exp(-j / 2.5)).toFixed(3)})`} strokeWidth="1" />
              )),
            )}
            {/* a lit stretch on two lanes each side */}
            {[0, 1].flatMap((side) =>
              [3, 7].map((k, i) => (
                <path key={`${side}${k}`} d={lane(k, w, h)} stroke={`url(#tw-lit-${side})`} strokeWidth="2" className="motion-safe:[animation:weave-breathe_9s_ease-in-out_infinite]" style={{ animationDelay: `${-(side * 4 + i * 3)}s` }} />
              )),
            )}
          </g>
        </svg>
      )}
    </div>
  );
}
