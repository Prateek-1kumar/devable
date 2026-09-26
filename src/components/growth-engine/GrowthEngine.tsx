"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import HoverCard from "./HoverCard";
import type { StackAnchor } from "./Scene";

// The 3D bundle loads after the page, so the headline paints instantly.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

// Phones and reduced-motion users get one settled, still frame.
const STILL_QUERY = "(max-width: 1023px), (prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(STILL_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * The hero's growth engine: your devtool sends a signal through four
 * channel layers, and it comes back as pipeline. Decorative; the hero copy
 * carries the meaning.
 */
export default function GrowthEngine({ className = "" }: { className?: string }) {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(STILL_QUERY).matches, () => true);
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const anchor = useRef<StackAnchor | null>(null);
  const onAnchor = useCallback((a: StackAnchor) => {
    anchor.current = a;
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} aria-hidden="true" className={className}>
      <Scene key={String(still)} still={still} active={onScreen} onHover={setHovered} onAnchor={still ? undefined : onAnchor} />
      {!still && <HoverCard index={hovered} anchor={anchor} />}
    </div>
  );
}
