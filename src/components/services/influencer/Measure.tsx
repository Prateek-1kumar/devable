"use client";

import { Label, useInView } from "../kit";
import { MEASURE } from "./content";

// Bar height and green strength per layer: reach is broad and light, business is narrow and strong.
const LEVELS = [
  { h: "100%", tone: "bg-primary/20" },
  { h: "62%", tone: "bg-primary/50" },
  { h: "34%", tone: "bg-primary" },
];

// The three layers we report on, left to right as a narrowing funnel: each column opens on a bar that
// shrinks and deepens in green (grown in once on view), then names what we track at that layer.
export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title} <span className="block text-ink/40">{MEASURE.subtitle}</span>
        </h2>

        <div ref={ref} className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {MEASURE.layers.map((layer, i) => (
            <div key={layer.name} className="bg-white p-7 sm:p-8">
              <div aria-hidden="true" className="flex h-28 items-end">
                <span
                  style={{ height: seen ? LEVELS[i].h : "4%", transitionDelay: `${i * 150}ms` }}
                  className={`w-full rounded-[6px] transition-[height] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${LEVELS[i].tone}`}
                />
              </div>
              <h3 className="mt-6 flex items-baseline gap-3 text-[1.25rem] font-medium tracking-[-0.025em] text-ink">
                <span className="font-mono text-[0.7rem] tracking-[0.1em] text-muted">0{i + 1}</span>
                {layer.name}
              </h3>
              <ul className="mt-4 space-y-2 text-[0.95rem] text-ink/65">
                {layer.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="size-1 rounded-full bg-ink/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
