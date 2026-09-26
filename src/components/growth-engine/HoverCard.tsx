"use client";

import { useEffect, useRef, useState } from "react";
import { CHANNELS } from "./channels";

const OFFSET = { x: 22, y: 0 }; // just right of the cursor
const STIFFNESS = 140;
const DAMPING = 18;
const MAX_LEAN = 6; // degrees

/**
 * The channel card that trails the cursor on a spring while a stack layer is
 * hovered, leaning slightly in the direction of travel like a carried object.
 */
export default function HoverCard({ index }: { index: number | null }) {
  const card = useRef<HTMLDivElement>(null);
  // Keep showing the last channel while the card fades out.
  const [shown, setShown] = useState<number | null>(index);
  if (index !== null && index !== shown) setShown(index);

  useEffect(() => {
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0, vx: 0, vy: 0, seeded: false };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX + OFFSET.x;
      target.y = e.clientY + OFFSET.y;
      if (!pos.seeded) Object.assign(pos, { x: target.x, y: target.y, seeded: true });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      pos.vx += (STIFFNESS * (target.x - pos.x) - DAMPING * pos.vx) * dt;
      pos.vy += (STIFFNESS * (target.y - pos.y) - DAMPING * pos.vy) * dt;
      pos.x += pos.vx * dt;
      pos.y += pos.vy * dt;
      const lean = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, pos.vx * 0.01));
      if (card.current) card.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translateY(-50%) rotate(${lean}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const channel = shown === null ? null : CHANNELS[shown];
  return (
    <div ref={card} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-40 origin-left">
      <div
        className={`w-80 rounded-3xl border border-foreground/10 bg-white/95 px-6 py-5 text-foreground shadow-lg shadow-foreground/5 transition-[opacity,scale] duration-300 ${
          index === null ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {channel && (
          <>
            <p className="text-xs tracking-[0.18em] text-foreground/50 uppercase">
              {channel.n} · {channel.cap}
            </p>
            <p className="mt-1 font-heading text-xl font-semibold">{channel.name}</p>
            <p className="mt-2 text-base leading-snug">{channel.line}</p>
          </>
        )}
      </div>
    </div>
  );
}
