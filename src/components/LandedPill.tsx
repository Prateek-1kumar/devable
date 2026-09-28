"use client";

import { useEffect, useRef, type ReactNode } from "react";
import PixelField from "./PixelField";

// FallingPill's landed state, drawn static: the grey pill lies flat a little
// above center with its rounded end to the right. It follows the pinned hero,
// so nothing tips over; the landed content plays its reveal once in view.

const RAISE = "15vh"; // how far above center the pill lies (as in FallingPill)

type Props = {
  /** Content inside the pill; animates off data-landed (in-data-landed:). */
  landed?: ReactNode;
  /** Content in the open space below the pill. */
  below?: ReactNode;
};

export default function LandedPill({ landed, below }: Props) {
  const root = useRef<HTMLDivElement>(null);

  // Mark landed once 40% is in view. The attribute stays absent until then:
  // in-data-landed: checks for its presence.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.landed = "true";
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const box = { left: "calc(50vw - 75vh)", top: `calc(50% - 13vw - ${RAISE})`, width: "150vh", height: "26vw" };
  return (
    <div ref={root} className="relative isolate overflow-x-clip">
      <PixelField className="z-0" />
      <section className="relative h-svh">
        {/* The standing pill's radii turned 90° clockwise: the rounded end faces right. */}
        <div
          aria-hidden="true"
          className="absolute z-0 bg-surface"
          style={{ ...box, borderRadius: "2.5vw 15vw 12vw 2.5vw / 2.5vw 13vw 11vw 2.5vw" }}
        />
        {landed && (
          <div className="absolute z-10 flex items-center justify-center px-[6vw] text-center" style={box}>
            {landed}
          </div>
        )}
        {below && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center px-[6vw]" style={{ top: `calc(50% + 13vw - ${RAISE})` }}>
            {below}
          </div>
        )}
      </section>
    </div>
  );
}
