"use client";

import { Label, useInView } from "../kit";
import { MEASURE } from "./content";

// Bar height and green strength per layer: reach is broad and light, business is narrow and strong. The
// shortest bar still holds its number comfortably.
const LEVELS = [
  { h: "100%", tone: "bg-primary/20" },
  { h: "68%", tone: "bg-primary/50" },
  { h: "42%", tone: "bg-primary" },
];

// The three layers we report on, left to right as a narrowing funnel. Each column's figure is its main
// element, sitting inside a bar that shrinks and deepens in green; what we track at that layer follows below.
// On first view the bars unveil bottom to top, staggered, and each number lifts into place once (no loop).
export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title} <span className="block text-ink/40">{MEASURE.subtitle}</span>
        </h2>

        <div ref={ref} className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {MEASURE.layers.map((layer, i) => (
            <div key={layer.name} className="flex flex-col bg-white p-6 sm:p-8">
              {/* Stepped heights only side by side; stacked on phones, each bar just fits its figure. */}
              <div className="flex items-end md:h-[19rem]">
                <div
                  style={{
                    ["--h" as string]: LEVELS[i].h,
                    clipPath: seen ? "inset(0 0 0 0 round 10px)" : "inset(100% 0 0 0 round 10px)",
                    transitionDelay: `${i * 120}ms`,
                  }}
                  className={`flex w-full flex-col rounded-[10px] p-5 md:h-(--h) transition-[clip-path] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:[clip-path:none] sm:p-6 ${LEVELS[i].tone}`}
                >
                  <p
                    style={{ transitionDelay: `${i * 120 + 250}ms` }}
                    className={`transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
                      seen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                  >
                    <span className="block text-[clamp(2.6rem,4.4vw,4rem)] leading-[0.95] font-medium tracking-[-0.055em] text-ink tabular-nums">{layer.stat}</span>
                    <span className="mt-2 block text-[0.98rem] font-medium tracking-[-0.01em] text-ink/70">{layer.unit}</span>
                  </p>
                </div>
              </div>
              <h3 className="mt-7 flex items-center gap-2.5 text-[1.2rem] font-medium tracking-[-0.025em] text-ink">
                <span className="grid h-6 min-w-6 place-items-center rounded-[5px] bg-ink/[0.06] px-1.5 font-mono text-[0.68rem] tracking-normal text-ink/70">0{i + 1}</span>
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
