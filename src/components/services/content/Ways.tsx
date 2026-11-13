"use client";

import { Users } from "lucide-react";
import { Label, useInView } from "../kit";
import { Tick } from "../parts";
import { WAYS } from "./content";

// Both models at once, read down a page: one comparison table, light, in the structure of the content team's
// reference. Each column is a model (its name, a six-segment strip of who runs what, and the count); each row is a
// question you would ask of it. First what it is, then who runs each of the six stages, one row per stage, then
// what it covers. Ownership is the point, so the stage cells carry it: green where Devable runs the stage, warm
// where your team keeps it, each with its icon and its words, so it never relies on colour alone. A row lights a
// little on hover. No tabs and no controls, and no call to action: the next section is for that.
const { options, ownership } = WAYS;
const OWNERS = [ownership.full, ownership.extend];
const CELL = "border-l border-line px-3 py-4 align-top sm:px-6 sm:py-5";
const LABEL = "px-3 py-4 align-top font-mono text-[0.58rem] leading-snug tracking-[0.03em] text-ink/55 uppercase sm:px-6 sm:py-5 sm:text-[0.7rem] sm:tracking-[0.08em]";

export default function Ways() {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  const row = (i: number) => ({ className: seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0", style: { animationDelay: `${i * 0.05}s` } });

  return (
    <section aria-labelledby="ways-title" className="bg-[#f6f5f1] px-6 py-16 sm:px-12 lg:py-24 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{WAYS.label}</Label>
        <h2 id="ways-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {WAYS.title}
        </h2>

        <div ref={ref} className="mt-12 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(23_44_33/0.04),0_24px_50px_-34px_rgb(23_44_33/0.25)] lg:mt-14">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">The two ways to work with us, compared stage by stage</caption>
            <colgroup>
              <col className="w-[6.2rem] sm:w-[11rem] lg:w-[14rem]" />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr {...row(0)}>
                <th scope="col" className="px-3 py-4 sm:px-6 sm:py-6">
                  <span className="sr-only">Question</span>
                </th>
                {options.map((o, k) => {
                  const mine = OWNERS[k].filter((x) => x === "us").length;
                  return (
                    <th key={o.name} scope="col" className={`${CELL} font-normal`}>
                      <span className="block text-[1.02rem] leading-tight font-medium tracking-[-0.02em] text-ink sm:text-[1.35rem]">{o.name}</span>
                      {/* Who runs each of the six stages, at a glance. */}
                      <span aria-hidden="true" className="mt-3.5 flex gap-1 sm:mt-4">
                        {OWNERS[k].map((who, i) => (
                          <span key={i} className={`h-1.5 flex-1 rounded-full ${who === "us" ? "bg-primary" : "bg-accent/70"}`} />
                        ))}
                      </span>
                      <span className="mt-2.5 block font-mono text-[0.64rem] tracking-[0.04em] text-ink/55 sm:text-[0.72rem]">
                        Devable runs {mine} of {OWNERS[k].length}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr {...row(1)} className={`border-t border-line ${row(1).className}`}>
                <th scope="row" className={LABEL}>
                  What it is
                </th>
                {options.map((o) => (
                  <td key={o.name} className={`${CELL} text-[0.86rem] leading-relaxed text-ink/70 sm:text-[0.98rem]`}>
                    {o.body}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-line bg-[#f9f8f4]">
                <th scope="colgroup" colSpan={3} className="px-3 py-2.5 font-mono text-[0.64rem] tracking-[0.08em] text-ink/45 uppercase sm:px-6 sm:text-[0.7rem]">
                  Who runs each stage
                </th>
              </tr>

              {ownership.stages.map((stage, i) => (
                <tr key={stage} {...row(i + 2)} className={`group border-t border-line transition-colors hover:bg-black/[0.015] ${row(i + 2).className}`}>
                  <th scope="row" className={LABEL}>
                    {stage}
                  </th>
                  {OWNERS.map((owner, k) => {
                    const mine = owner[i] === "us";
                    return (
                      <td key={options[k].name} className={`${CELL} transition-colors ${mine ? "bg-[color-mix(in_srgb,var(--primary)_8%,white)]" : "bg-[color-mix(in_srgb,var(--accent)_7%,white)]"}`}>
                        <span className="flex items-center gap-2 text-[0.84rem] font-medium text-ink sm:gap-2.5 sm:text-[0.98rem]">
                          {mine ? (
                            <Tick className="size-[1.15rem] shrink-0 sm:size-5" />
                          ) : (
                            <span aria-hidden="true" className="grid size-[1.15rem] shrink-0 place-items-center rounded-full bg-[#fbe6de] text-accent sm:size-5">
                              <Users className="size-[0.7rem]" strokeWidth={2.2} />
                            </span>
                          )}
                          {mine ? "Devable" : "Your team"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr {...row(8)} className={`border-t border-line ${row(8).className}`}>
                <th scope="row" className={LABEL}>
                  What it covers
                </th>
                {options.map((o) => (
                  <td key={o.name} className={CELL}>
                    <span className="block text-[0.8rem] leading-snug text-ink/55 sm:text-[0.88rem]">{o.listLabel}</span>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {o.items.map((item) => (
                        <li key={item} className="rounded-full bg-ink/[0.05] px-2.5 py-1 font-mono text-[0.66rem] tracking-[0.02em] text-ink/80 sm:text-[11.5px]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-[1rem] text-ink/65">
          <span className="font-medium text-ink">{WAYS.pilot.title}</span> {WAYS.pilot.body}
        </p>
      </div>
    </section>
  );
}
