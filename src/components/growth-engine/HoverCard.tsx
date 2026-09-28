"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CHANNELS } from "./channels";
import type { StackAnchor } from "./Scene";

const GAP = 28; // px between the stack's right edge and the card
const STIFFNESS = 140;
const DAMPING = 18;
const MAX_LEAN = 4; // degrees

/**
 * The channel card for the hovered layer. It stays pinned just right of the
 * stack (never over it) and glides up and down with the cursor on a spring,
 * leaning slightly as it moves.
 */
export default function HoverCard({ index, anchor }: { index: number | null; anchor: RefObject<StackAnchor | null> }) {
  const card = useRef<HTMLDivElement>(null);
  // Keep showing the last channel while the card fades out.
  const [shown, setShown] = useState<number | null>(index);
  if (index !== null && index !== shown) setShown(index);

  useEffect(() => {
    let cursorY = 0;
    const pos = { x: 0, y: 0, vx: 0, vy: 0, seeded: false };
    const onMove = (e: PointerEvent) => {
      cursorY = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const a = anchor.current;
      const el = card.current;
      if (!a || !el) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const target = {
        x: Math.min(a.x + GAP, window.innerWidth - el.offsetWidth - 16),
        y: Math.min(Math.max(cursorY, a.top), a.bottom),
      };
      if (!pos.seeded) Object.assign(pos, { ...target, seeded: true });
      pos.vx += (STIFFNESS * (target.x - pos.x) - DAMPING * pos.vx) * dt;
      pos.vy += (STIFFNESS * (target.y - pos.y) - DAMPING * pos.vy) * dt;
      pos.x += pos.vx * dt;
      pos.y += pos.vy * dt;
      const lean = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, pos.vy * 0.01));
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translateY(-50%) rotate(${lean}deg)`;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [anchor]);

  const channel = shown === null ? null : CHANNELS[shown];
  return (
    <div ref={card} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-40 origin-left">
      <div
        className={`w-60 rounded-2xl border border-foreground/10 bg-white/95 px-4 py-3.5 text-foreground shadow-lg shadow-foreground/5 transition-[opacity,scale] duration-300 ${
          index === null ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {channel && (
          <>
            <p className="flex items-center gap-1.5 text-[11px] tracking-[0.16em] text-foreground/50 uppercase">
              <span className="size-2 rounded-full" style={{ backgroundColor: channel.color }} />
              {channel.n} · {channel.cap}
            </p>
            <p className="mt-0.5 font-heading text-base font-semibold">{channel.name}</p>
            <p className="mt-1 text-sm leading-snug">{channel.line}</p>
          </>
        )}
      </div>
    </div>
  );
}
