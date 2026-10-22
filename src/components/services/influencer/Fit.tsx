"use client";

import { Label, useInView } from "../kit";
import { FIT } from "./content";

// Who actually builds with the product, out of each audience (illustrative, 1 dot = 1K followers).
const AUDIENCES = [
  { name: "Generic creator", size: 300, relevant: 12, cols: 25 },
  { name: "Technical creator", size: 30, relevant: 21, cols: 10 },
];
// Exactly `count` of `size` dots, scattered by a fixed shuffle (37 is coprime with both sizes).
const isRelevant = (i: number, size: number, count: number) => (i * 37) % size < count;

// The section's claim made literal: two audiences, one ten times bigger. When it scrolls in, the people who
// would actually use the product light up green, and the small technical audience ends up with more of
// them. The four reasons sit beside it on hairlines.
export default function Fit() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <section aria-labelledby="fit-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Label>{FIT.label}</Label>
          <h2 id="fit-title" className="mt-6 max-w-[16ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
            {FIT.title}
          </h2>

          <div ref={ref} aria-hidden="true" className="mt-10 rounded-2xl bg-[#f9f8f4] p-6 sm:p-7">
            <div className="grid items-end gap-8 sm:grid-cols-[1fr_auto]">
              {AUDIENCES.map((a) => {
                return (
                  <div key={a.name}>
                    <div className="grid w-fit gap-[4px]" style={{ gridTemplateColumns: `repeat(${a.cols}, 6px)` }}>
                      {Array.from({ length: a.size }, (_, i) => (
                        <span
                          key={i}
                          style={{ transitionDelay: `${(i % 40) * 15}ms` }}
                          className={`size-[6px] rounded-full transition-colors duration-500 ${
                            isRelevant(i, a.size, a.relevant) && seen ? "bg-primary" : "bg-ink/15"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-[0.82rem] font-medium text-ink">{a.name}</p>
                    <p className="font-mono text-[0.66rem] tracking-[0.06em] text-muted">
                      {a.size}K followers · <span className="text-ink">{a.relevant}K relevant</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ul className="divide-y divide-line border-y border-line self-end lg:col-span-6 lg:col-start-7">
          {FIT.points.map((p, i) => (
            <li key={p.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-7">
              <span className="pt-1 font-mono text-[0.7rem] tracking-[0.1em] text-muted">0{i + 1}</span>
              <div>
                <h3 className="text-[1.2rem] font-medium tracking-[-0.025em] text-ink">{p.title}</h3>
                <p className="mt-2 max-w-[32rem] text-[0.98rem] leading-relaxed text-ink/65">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
