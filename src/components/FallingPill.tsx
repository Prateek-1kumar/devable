"use client";

import { useEffect, useRef, type ReactNode } from "react";
import PixelField from "./PixelField";

// A tall grey pill stands behind the hero headline, then tips over to the
// right as you scroll, pivoting on its bottom-right corner, and lands lying
// flat on the second screen, a little above center, with its rounded end facing right.

// How far above screen 2's center the pill lands. The fall's translate, the
// landed content box and the space below all subtract it, so they stay aligned.
const RAISE = "15vh";

// Standing geometry (viewport units): left L, top T, width W, height H.
// Rotating 90° clockwise about the bottom-right corner lays it across
// [L+W, L+W+H] × [T+H−W, T+H]; the translate below then centers that on screen 2.
const PILL = { left: "13vw", top: "8vh", width: "26vw", height: "150vh" };
const LAND = {
  x: "calc(50vw - 13vw - 26vw - 75vh)", // center − (L + W) − H/2
  y: `calc(150vh - 8vh - 150vh + 13vw - ${RAISE})`, // screen-2 center − (T + H) + W/2, raised
};
// Slightly uneven top radii give the hand-drawn, organic edge from the sketch.
const RADIUS = "13vw 11vw 2.5vw 2.5vw / 15vw 12vw 2.5vw 2.5vw";
const SMOOTHING = 8; // higher follows scroll more tightly
// The fall completes by this share of the first screen's scroll, so it always
// lands fully (and triggers the landed content) even if scrolling stops short.
const LAND_BY = 0.8;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

type Props = {
  /** The first screen (the hero), drawn in front of the pill. */
  children: ReactNode;
  /** Content shown inside the pill once it has landed on screen 2. */
  landed?: ReactNode;
  /** Content in the open space below the landed pill. */
  below?: ReactNode;
};

export default function FallingPill({ children, landed, below }: Props) {
  const root = useRef<HTMLDivElement>(null);

  // Scroll progress over the first screen drives --fall (0 standing → 1 landed),
  // smoothed so the fall feels weighty; reduced motion follows scroll directly.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shown = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const target = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * LAND_BY)));
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      shown = reduced ? target : shown + (target - shown) * (1 - Math.exp(-SMOOTHING * dt));
      el.style.setProperty("--fall", easeInOut(shown).toFixed(4));
      // Mark the first full landing once; landed content animates off this (in-data-landed:).
      if (shown > 0.97) el.dataset.landed = "true";
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className="relative isolate overflow-x-clip [--fall:0]">
      {/* Dot field spans both screens: the hero and where the pill lands. */}
      <PixelField className="z-0" />
      <div
        aria-hidden="true"
        className="absolute z-0 origin-bottom-right bg-surface will-change-transform"
        style={{
          left: PILL.left,
          top: PILL.top,
          width: PILL.width,
          height: PILL.height,
          borderRadius: RADIUS,
          transform: `translate(calc(var(--fall) * ${LAND.x}), calc(var(--fall) * ${LAND.y})) rotate(calc(var(--fall) * 90deg))`,
        }}
      />
      {children}
      {/* Screen 2: the pill lands here; its content fades in once it's down. */}
      <section className="relative h-svh">
        {landed && (
          <div
            className="absolute flex items-center justify-center px-[6vw] text-center"
            style={{
              left: "calc(50vw - 75vh)",
              top: `calc(50% - 13vw - ${RAISE})`,
              width: "150vh",
              height: "26vw",
              opacity: "clamp(0, calc((var(--fall) - 0.95) * 20), 1)", // only once the pill is flat
            }}
          >
            {landed}
          </div>
        )}
        {below && (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center px-[6vw]"
            style={{ top: `calc(50% + 13vw - ${RAISE})` }} // from the pill's bottom edge to the screen's end
          >
            {below}
          </div>
        )}
      </section>
    </div>
  );
}
