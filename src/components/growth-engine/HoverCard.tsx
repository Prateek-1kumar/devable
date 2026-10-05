"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CHANNELS } from "./channels";
import type { StackAnchor } from "./Scene";

const GAP = 22; // px below the anchor (the tile row's front edge)

/**
 * The channel card for the hovered layer. It sits in the open floor space
 * under the destination row, following the canvas as the page scrolls, and
 * simply fades in and out: no spring, no lean.
 */
export default function HoverCard({ index, anchor }: { index: number | null; anchor: RefObject<StackAnchor | null> }) {
  const card = useRef<HTMLDivElement>(null);
  // Keep showing the last channel while the card fades out.
  const [shown, setShown] = useState<number | null>(index);
  if (index !== null && index !== shown) setShown(index);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const a = anchor.current;
      const el = card.current;
      if (!a || !el) return;
      const x = Math.min(a.x, window.innerWidth - el.offsetWidth - 16);
      el.style.transform = `translate3d(${x}px, ${a.y + GAP}px, 0)`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  const channel = shown === null ? null : CHANNELS[shown];
  return (
    <div ref={card} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-40">
      <div
        className={`w-60 rounded-xl border border-line bg-card px-4 py-3.5 text-ink shadow-[0_1px_2px_rgb(15_26_20/0.05),0_8px_24px_rgb(15_26_20/0.06)] transition-opacity duration-200 ${
          index === null ? "opacity-0" : "opacity-100"
        }`}
      >
        {channel && (
          <>
            <p className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">
              <span className="size-2 rounded-[2px] bg-accent" />
              {channel.n} · {channel.cap}
            </p>
            <p className="mt-1 font-heading text-base font-semibold">{channel.name}</p>
            <p className="mt-1 text-sm leading-snug text-muted">{channel.line}</p>
          </>
        )}
      </div>
    </div>
  );
}
