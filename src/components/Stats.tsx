"use client";

import { useEffect, useRef, useState } from "react";

// Four quiet stats under the landed pill. Numbers count up to their value
// the first time the row scrolls into view.

const STATS = [
  { prefix: "", value: 14, suffix: " days", label: "to first content live", note: "From onboarding to published — not months." },
  { prefix: "", value: 48, suffix: " hrs", label: "to campaign kickoff", note: "Once aligned, we move at startup speed." },
  { prefix: "", value: 200, suffix: "+", label: "developer influencers", note: "Pre-built relationships, 200 to 1M+ followers." },
  { prefix: "$", value: 150, suffix: "K+", label: "saved vs. in-house DevRel", note: "Full-stack marketing without the headcount." },
];
const DURATION = 1400; // ms

export default function Stats() {
  const ref = useRef<HTMLDListElement>(null);
  const [t, setT] = useState(0); // 0 → 1 count progress

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setT(1);
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          setT(1 - (1 - p) ** 3);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <dl
      ref={ref}
      className="grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-8 transition-opacity duration-700 md:grid-cols-4 md:gap-0 md:divide-x md:divide-foreground/10"
      style={{ opacity: t > 0 ? 1 : 0 }}
    >
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col-reverse items-center gap-1 px-4 text-center">
          <p className="max-w-[22ch] text-xs leading-relaxed text-foreground/50">{s.note}</p>
          <dt className="text-sm text-foreground/80">{s.label}</dt>
          <dd className="font-heading text-3xl font-medium tracking-tight text-foreground tabular-nums sm:text-4xl">
            {s.prefix}
            {Math.round(s.value * t)}
            <span className="text-accent">{s.suffix}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
