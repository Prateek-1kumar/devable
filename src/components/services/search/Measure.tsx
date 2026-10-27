"use client";

import { Label, useInView } from "../kit";
import { MEASURE } from "./content";
import { MarkStack, Tick, delay, rise, type Icon } from "./parts";

const MARKS: Record<string, Icon[]> = { Search: ["google"], AI: ["chatgpt", "perplexity", "claude"] };

// What changed, and what it contributed to, in Why Devable's tray: the two signal groups (Search, AI) sit
// recessed on the warm tray, and the outcome (Business) is the raised white column with the green checks,
// the one place the eye lands. The tray fades up once; the Business column rises a beat later.
export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title}
        </h2>

        <div ref={ref} className={`${rise(seen)} mt-14 grid gap-3 rounded-3xl bg-[#f7f6f2] p-3 md:grid-cols-3 md:gap-0`}>
          {MEASURE.signals.map((g) => (
            <div key={g.name} className="px-5 pt-5 pb-3 md:px-7 md:pt-7">
              <h3 className="flex items-center gap-3 text-[1.15rem] font-medium tracking-[-0.02em] text-ink">
                <MarkStack names={MARKS[g.name]} />
                {g.name}
              </h3>
              <ul className="mt-5">
                {g.items.map((item, i) => (
                  <li key={item} className={`py-3.5 text-[0.95rem] text-muted ${i ? "border-t border-ink/[0.05]" : ""}`}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div
            style={delay(350)}
            className={`${rise(seen)} rounded-2xl bg-white px-5 pt-5 pb-3 shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_12px_32px_-12px_rgb(23_44_33_/_0.12)] md:px-7 md:pt-7`}
          >
            <h3 className="flex items-center justify-between gap-3 text-[1.15rem] font-medium tracking-[-0.02em] text-ink">
              {MEASURE.outcome.name}
              <span className="text-[0.78rem] font-normal tracking-normal text-[#1a7f47]">What it contributes to</span>
            </h3>
            <ul className="mt-5">
              {MEASURE.outcome.items.map((item, i) => (
                <li key={item} className={`flex items-center gap-3 py-3.5 text-[0.95rem] text-ink ${i ? "border-t border-ink/[0.05]" : ""}`}>
                  <Tick />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
