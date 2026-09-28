"use client";

import { useEffect, useRef, type ReactNode } from "react";
import PixelField from "./PixelField";

// The "Trusted by" screen with the grey pill already lying flat: FallingPill's
// landed geometry, without the fall (the pinned hero replaces it). data-landed
// is set on first view, not at render, so TrustedBy's colour sweep still plays.

const BOX = { left: "calc(50vw - 75vh)", top: "calc(50% - 13vw - 15vh)", width: "150vh", height: "26vw" };
// The standing pill's radii turned 90° clockwise: rounded end on the right.
const RADIUS = "2.5vw 15vw 12vw 2.5vw / 2.5vw 13vw 11vw 2.5vw";

export default function LandedPill({ children, below }: { children: ReactNode; below?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.landed = "true";
        io.disconnect();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} id="trusted" className="relative isolate overflow-x-clip">
      <PixelField className="z-0" />
      <section className="relative h-svh">
        <div aria-hidden="true" className="absolute z-0 bg-surface" style={{ ...BOX, borderRadius: RADIUS }} />
        <div className="absolute flex items-center justify-center px-[6vw] text-center" style={BOX}>
          {children}
        </div>
        {below && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center px-[6vw]" style={{ top: "calc(50% + 13vw - 15vh)" }}>
            {below}
          </div>
        )}
      </section>
    </div>
  );
}
