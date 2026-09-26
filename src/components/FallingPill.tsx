"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A tall white pill stands behind the hero headline, then tips over to the
// right as you scroll, pivoting on its bottom-right corner, and lands lying
// flat and centered on the second screen with its rounded end facing right.
//
// Standing geometry (viewport units): left L, top T, width W, height H.
// Rotating 90° clockwise about the bottom-right corner lays it across
// [L+W, L+W+H] × [T+H−W, T+H]; the translate below then centers that on screen 2.
const PILL = { left: "13vw", top: "8vh", width: "26vw", height: "150vh" };
const LAND = {
  x: "calc(50vw - 13vw - 26vw - 75vh)", // center − (L + W) − H/2
  y: "calc(150vh - 8vh - 150vh + 13vw)", // screen-2 center − (T + H) + W/2
};
// Slightly uneven top radii give the hand-drawn, organic edge from the sketch.
const RADIUS = "13vw 11vw 2.5vw 2.5vw / 15vw 12vw 2.5vw 2.5vw";
const SMOOTHING = 8; // higher follows scroll more tightly

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

type Props = {
  /** The first screen (the hero), drawn in front of the pill. */
  children: ReactNode;
  /** Content shown inside the pill once it has landed on screen 2. */
  landed?: ReactNode;
};

export default function FallingPill({ children, landed }: Props) {
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
      const target = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      shown = reduced ? target : shown + (target - shown) * (1 - Math.exp(-SMOOTHING * dt));
      el.style.setProperty("--fall", easeInOut(shown).toFixed(4));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className="relative isolate overflow-x-clip [--fall:0]">
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
            className="absolute flex items-center px-[6vw]"
            style={{
              left: "calc(50vw - 75vh)",
              top: "calc(50% - 13vw)",
              width: "150vh",
              height: "26vw",
              opacity: "clamp(0, calc((var(--fall) - 0.85) * 6.67), 1)",
            }}
          >
            {landed}
          </div>
        )}
      </section>
    </div>
  );
}
