"use client";

import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";

// Four quiet stats under the landed pill. Numbers roll up to their value
// (via NumberFlow) the first time the row scrolls into view.

const STATS = [
  { prefix: "", value: 14, suffix: " days", label: "to first content live", note: "From onboarding to published — not months." },
  { prefix: "", value: 48, suffix: " hrs", label: "to campaign kickoff", note: "Once aligned, we move at startup speed." },
  { prefix: "", value: 200, suffix: "+", label: "developer influencers", note: "Pre-built relationships, 200 to 1M+ followers." },
  { prefix: "$", value: 150, suffix: "K+", label: "saved vs. in-house DevRel", note: "Full-stack marketing without the headcount." },
];

export default function Stats() {
  const ref = useRef<HTMLDListElement>(null);
  const [shown, setShown] = useState(false);

  // Flip to the real values once the row scrolls into view; NumberFlow rolls the digits.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setShown(true);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <dl
      ref={ref}
      className="grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-8 transition-opacity duration-700 md:grid-cols-4 md:gap-0 md:divide-x md:divide-foreground/10"
      style={{ opacity: shown ? 1 : 0 }}
    >
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col-reverse items-center gap-1 px-4 text-center">
          <p className="max-w-[22ch] text-xs leading-relaxed text-foreground/50">{s.note}</p>
          <dt className="text-sm text-foreground/80">{s.label}</dt>
          <dd className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {s.prefix}
            <NumberFlow value={shown ? s.value : 0} />
            <span className="text-accent">{s.suffix}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
