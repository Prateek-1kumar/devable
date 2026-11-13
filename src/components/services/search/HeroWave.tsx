"use client";

import { useEffect, useRef, useState } from "react";
import { Mark, type Icon } from "../parts";

// The lit stretches of line: a slow breath, each out of step with the others.
const KEYFRAMES = `
@keyframes glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.95; } }
`;

// The hero's backdrop for Search & AI Visibility: a woven ribbon of lines flowing from one side of the page to the
// other. Twelve distinct lanes, each its own wave (a different height, depth and rhythm, so the two margins do not
// mirror each other), run right across the page and weave past one another, with two bundles of much fainter lines
// behind them for density. Each of the twelve places buyers look rides its own lane, and only the stretch of that
// lane around its logo glows, fading out either side, so the light is local and not a lit-up line. Wherever the
// ribbon would pass under the text block, the button or the tile row it is simply not there: a soft mask takes every
// line to no opacity, so it appears to run behind the content and swell out again in the two margins. The glows
// breathe, slowly and out of step with one another; nothing else moves.
//
// Shown from 1280px up, where there are margins to use; reduced motion draws it all, still.

// One lane per logo. Left margin: Search Console, X, Google, Perplexity, Gemini, YouTube. Right: Hacker News,
// Stack Overflow, ChatGPT, Claude, Reddit, G2. `lane` is the wave it rides.
const MARKS: { icon: Icon; side: 0 | 1; lane: number }[] = [
  { icon: "googlesearchconsole", side: 0, lane: 0 },
  { icon: "x", side: 0, lane: 5 },
  { icon: "google", side: 0, lane: 2 },
  { icon: "perplexity", side: 0, lane: 7 },
  { icon: "gemini", side: 0, lane: 4 },
  { icon: "youtube", side: 0, lane: 9 },
  { icon: "hackernews", side: 1, lane: 11 },
  { icon: "stackoverflow", side: 1, lane: 6 },
  { icon: "chatgpt", side: 1, lane: 1 },
  { icon: "claude", side: 1, lane: 8 },
  { icon: "reddit", side: 1, lane: 3 },
  { icon: "g2", side: 1, lane: 10 },
];

// The lanes: centre height (px from the top of the hero), depth, rhythm (px per wave) and two phases each.
const LANES = [
  { cy: 372, a: 34, l: 560, p: 0.3, q: 1.1 },
  { cy: 398, a: 44, l: 610, p: 1.4, q: 0.4 },
  { cy: 424, a: 38, l: 570, p: 2.5, q: 2.3 },
  { cy: 450, a: 52, l: 640, p: 0.9, q: 3.1 },
  { cy: 476, a: 40, l: 580, p: 3.6, q: 0.7 },
  { cy: 502, a: 48, l: 620, p: 2.0, q: 4.2 },
  { cy: 528, a: 36, l: 560, p: 4.4, q: 1.9 },
  { cy: 554, a: 50, l: 650, p: 1.1, q: 5.1 },
  { cy: 580, a: 40, l: 590, p: 3.1, q: 2.8 },
  { cy: 606, a: 46, l: 630, p: 0.2, q: 0.2 },
  { cy: 630, a: 34, l: 570, p: 4.9, q: 3.7 },
  { cy: 654, a: 42, l: 600, p: 2.7, q: 1.4 },
];
const BUNDLES = [{ lane: 3, sign: 1 }, { lane: 8, sign: -1 }]; // two fine bundles, following these lanes
const BUNDLE_LINES = 9;
const BUNDLE_GAP = 8;

const STEP = 4; // px between sampled points
const HALF = 350; // half-width of the text block, px
const REACH = 85; // px either side of a logo that its lane glows

/** Lane `k`'s height at x. */
const laneY = (k: number, x: number) => {
  const L = LANES[k];
  return L.cy + L.a * Math.sin((2 * Math.PI * x) / L.l + L.p) + 0.25 * L.a * Math.sin((2 * Math.PI * x) / (L.l * 0.62) + L.q);
};

/** A lane as a polyline from `x0` to `x1`, shifted down by `dy`. */
function trace(k: number, x0: number, x1: number, dy = 0) {
  let d = "";
  for (let x = x0; x <= x1; x += STEP) d += `${x === x0 ? "M" : "L"}${x} ${(laneY(k, x) + dy).toFixed(1)}`;
  return d;
}

export default function HeroWave() {
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

  // Each logo's x: six slots across its margin, from near the page edge to the text block. The lanes are not in slot order,
  // so neighbouring logos sit on far-apart lanes; and the right margin takes its slots from the right edge, on its own lanes.
  const beads = w
    ? MARKS.map((m, i) => {
        const k = i % 6;
        const edge = 0.045 * w;
        const inner = w / 2 - HALF - 44;
        const slot = edge + ((inner - edge) * k) / 5;
        const x = Math.round(m.side === 0 ? slot : w - slot);
        return { ...m, x, y: laneY(m.lane, x), i };
      })
    : [];

  return (
    <div ref={box} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden xl:block">
<style href="hero-wave" precedence="default">{KEYFRAMES}</style>
      {w > 0 && (
        <>
          <svg width={w} height={h} className="absolute inset-0 overflow-visible" style={{ maskImage: "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)" }}>
            <defs>
              <filter id="wave-soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
              <filter id="wave-bloom" x="-10%" y="-200%" width="120%" height="500%">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
              <mask id="wave-clear" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
                <rect width={w} height={h} fill="white" />
                <g fill="black" filter="url(#wave-soft)">
                  {/* the text block and the button, down from just under the nav */}
                  <rect x={w / 2 - HALF} y={96} width={HALF * 2} height={594} rx={28} />
                  {/* the tile row and its label */}
                  <rect x={w / 2 - 540} y={690} width={1080} height={Math.max(0, h - 690)} rx={28} />
                </g>
              </mask>
              {beads.map((b) => (
                <linearGradient key={b.i} id={`wave-glow-${b.i}`} gradientUnits="userSpaceOnUse" x1={b.x - REACH} y1="0" x2={b.x + REACH} y2="0">
                  <stop offset="0" stopColor="rgb(25 231 110)" stopOpacity="0" />
                  <stop offset="0.5" stopColor="rgb(25 231 110)" stopOpacity="1" />
                  <stop offset="1" stopColor="rgb(25 231 110)" stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            <g mask="url(#wave-clear)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* two fine bundles behind everything, for density */}
              {BUNDLES.map((b) =>
                Array.from({ length: BUNDLE_LINES }, (_, j) => {
                  const k = j + 1;
                  return <path key={`${b.lane}-${j}`} d={trace(b.lane, -20, w + 20, b.sign * (30 + k * BUNDLE_GAP))} stroke={`rgb(25 231 110 / ${(0.1 * Math.exp(-k / 6)).toFixed(3)})`} strokeWidth="1" />;
                }),
              )}
              {/* the twelve lanes */}
              {LANES.map((_, k) => (
                <path key={k} d={trace(k, -20, w + 20)} stroke="rgb(25 231 110 / 0.17)" strokeWidth="1" />
              ))}
              {/* the lit stretch around each logo: a soft bloom and a crisp line, fading out either side */}
              {beads.map((b) => (
                <g key={b.i} className="motion-safe:animate-[glow_9s_ease-in-out_infinite]" style={{ animationDelay: `${-b.i * 1.7}s` }}>
                  <path d={trace(b.lane, Math.max(-20, b.x - REACH), Math.min(w + 20, b.x + REACH))} stroke={`url(#wave-glow-${b.i})`} strokeWidth="5" opacity="0.3" filter="url(#wave-bloom)" />
                  <path d={trace(b.lane, Math.max(-20, b.x - REACH), Math.min(w + 20, b.x + REACH))} stroke={`url(#wave-glow-${b.i})`} strokeWidth="1.5" />
                </g>
              ))}
            </g>
          </svg>
          {beads.map((b) => (
            <span
              key={b.icon}
              className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_6px_14px_-8px_rgb(23_44_33/0.3)]"
              style={{ left: b.x, top: b.y }}
            >
              <Mark name={b.icon} className="size-[1.05rem]" />
            </span>
          ))}
        </>
      )}
    </div>
  );
}
