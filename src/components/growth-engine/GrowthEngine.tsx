"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} aria-hidden="true" className={className}>
      <Scene key={String(still)} still={still} active={onScreen} />
    </div>
  );
}
