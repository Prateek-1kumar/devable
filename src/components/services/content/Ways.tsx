"use client";

import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { CANVAS, FRAME, PILL, delay, rise } from "../parts";
import { WAYS } from "./content";

// Two ways in, told by who runs which stage before you read a word: each card opens on an ownership strip
// across the six stages of the engine, ink where Devable runs it and outlined where your team does. Full
// Content Program is ink end to end; Extend Your Content Team leaves strategy, planning and distribution
// with you. The segments fill in once, left to right. A pilot strip below catches anyone undecided.
export default function Ways() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const owners = [WAYS.ownership.full, WAYS.ownership.extend];
  return (
    <section aria-labelledby="ways-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{WAYS.label}</Label>
        <h2 id="ways-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {WAYS.title}
        </h2>

        <div ref={ref} className="mt-14 grid gap-5 lg:grid-cols-2">
          {WAYS.options.map((o, k) => (
            <article key={o.name} className={`${FRAME} flex flex-col`}>
              <div className={`${CANVAS} border-b border-line px-5 py-6 sm:px-8`}>
                <p className="flex items-center gap-4 text-[11.5px] text-ink/55">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px] bg-ink" />
                    Devable
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px] border border-ink/25 bg-white" />
                    Your team
                  </span>
                </p>
                <ol className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {WAYS.ownership.stages.map((stage, i) => {
                    const us = owners[k][i] === "us";
                    return (
                      <li
                        key={stage}
                        style={delay(k * 200 + i * 120)}
                        className={`${rise(seen)} truncate rounded-lg px-1.5 py-2 text-center text-[11px] ${
                          us ? "border border-ink bg-ink text-white" : "border border-ink/15 bg-white text-ink/60"
                        }`}
                      >
                        {stage}
                        <span className="sr-only">{us ? ": Devable" : ": your team"}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div className="flex flex-1 flex-col p-7 sm:p-9">
                <h3 className="text-[clamp(1.4rem,2vw,1.75rem)] leading-tight font-medium tracking-[-0.035em] text-ink">{o.name}</h3>
                <p className="mt-3 max-w-[32rem] text-[1rem] leading-relaxed text-ink/65">{o.body}</p>
                <p className="mt-7 text-[0.85rem] text-ink/50">{o.listLabel}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {o.items.map((item) => (
                    <li key={item} className={PILL}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f9f8f4] px-7 py-5">
          <p className="text-[1.02rem] text-ink/75">
            <span className="font-medium text-ink">{WAYS.pilot.title}</span> {WAYS.pilot.body}
          </p>
          <ArcButton href="#contact" arrow tone="primary" size="sm">
            Speak with the Team
          </ArcButton>
        </div>
      </div>
    </section>
  );
}
