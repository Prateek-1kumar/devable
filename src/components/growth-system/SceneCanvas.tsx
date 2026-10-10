"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

// Mounts the stage's 3D layer (the engine and its pipes) only where the
// diagram is drawn (xl and up), after the page has painted, and pauses it while
// it's off screen. Reduced motion gets one settled frame.
const GrowthScene = dynamic(() => import("./GrowthScene"), { ssr: false });

const media = (query: string) => ({
  subscribe(onChange: () => void) {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(query).matches,
});
const desktop = media("(min-width: 1280px)");
const reduced = media("(prefers-reduced-motion: reduce)");

export default function SceneCanvas({ style }: { style: CSSProperties }) {
  const show = useSyncExternalStore(desktop.subscribe, desktop.get, () => false);
  const still = useSyncExternalStore(reduced.subscribe, reduced.get, () => true);
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [show]);

  return (
    <div ref={box} aria-hidden="true" style={style} className="pointer-events-none absolute">
      {show && <GrowthScene key={String(still)} still={still} active={onScreen} />}
    </div>
  );
}
