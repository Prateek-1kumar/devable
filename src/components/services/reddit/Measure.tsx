"use client";

import { Label, useInView } from "../kit";
import { FRAME, MarkStack, Tick, delay, rise } from "../parts";
import { MEASURE } from "./content";

// Karma is not the KPI, shown literally: on the left the vanity number, big but greyed, with a line drawing
// through it once ("Not what we report"); on the right the three groups we do report on, as three columns in
// one card. Business closes the row with a soft green header, the outcome the other two feed. The strike is
// the only motion; reduced motion shows it already drawn.
export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title}
        </h2>
        <p className="mt-6 max-w-[36rem] text-[1.05rem] leading-relaxed text-ink/65">{MEASURE.body}</p>

        <div ref={ref} className="mt-14 grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          {/* The vanity metric. */}
          <div className="flex flex-col justify-center rounded-2xl bg-[#f6f5f1] p-7">
            <p className="flex items-center gap-2 text-[0.85rem] text-ink/50">
              <MarkStack names={["reddit"]} size="size-5" />
              Karma
            </p>
            <p className="relative mt-3 w-fit text-[clamp(2.4rem,3.6vw,3rem)] leading-none font-medium tracking-[-0.05em] text-ink/30 tabular-nums">
              {MEASURE.karma}
              <span
                aria-hidden="true"
                style={delay(400)}
                className={`absolute top-1/2 -right-1.5 -left-1.5 h-[2px] origin-left rounded-full bg-accent transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:scale-x-100 motion-reduce:transition-none ${
                  seen ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </p>
            <p className="mt-4 text-[0.85rem] text-ink/50">Not what we report</p>
          </div>

          {/* What we report on. */}
          <div className={`${FRAME} grid md:grid-cols-3`}>
            {MEASURE.groups.map((g, i) => {
              const outcome = i === MEASURE.groups.length - 1;
              return (
                <div key={g.name} style={delay(150 + i * 140)} className={`${rise(seen)} ${i ? "border-line max-md:border-t md:border-l" : ""}`}>
                  <h3
                    className={`flex h-14 items-center gap-2.5 border-b border-line px-6 text-[1.05rem] font-medium tracking-[-0.02em] text-ink ${
                      outcome ? "bg-[color-mix(in_srgb,var(--light-green-soft)_45%,white)]" : ""
                    }`}
                  >
                    {g.marks.length > 0 ? <MarkStack names={g.marks} size="size-5" /> : <Tick className="size-5" />}
                    {g.name}
                  </h3>
                  <ul className="px-6 py-2">
                    {g.items.map((item, j) => (
                      <li key={item} className={`py-3 text-[0.93rem] ${outcome ? "text-ink" : "text-ink/65"} ${j ? "border-t border-ink/[0.05]" : ""}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
