"use client";

import NumberFlow from "@number-flow/react";
import { ArrowRight, Layers, MessageSquare, Search, type LucideIcon } from "lucide-react";
import { Label, useInView } from "../kit";
import { Mark } from "../parts";
import { MEASURE } from "./content";

// The arrow between the cards, nudging toward the next one.
const KEYFRAMES = `
@keyframes nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
`;

// What we measure, as one infographic with one message: better visibility becomes business impact. Two cards joined
// by an arrow. Left, Search + AI visibility: the one number that matters, from where it started to where it is, over
// the three things that move it (rankings, mentions, citations). Right, Business impact, the green card: the outcome
// as the biggest number on the page, over the four business results it is made of (qualified traffic, signups, demos
// and pipeline). Everything else is left out. The figures are illustrative and every card says so.
// Motion is minimal: the numbers roll once as the section comes into view, and the arrow between the cards nudges.
// Reduced motion: the finished numbers, still.
const { visibility, impact, figures, note } = MEASURE;

const CARD = "relative flex flex-col rounded-[28px] p-7 sm:p-9";
const EDGE = "shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.04),0_28px_50px_-34px_rgb(23_44_33/0.28),inset_0_1px_0_#fff]";
const TAG = "rounded-full bg-ink/[0.05] px-2.5 py-1 font-mono text-[0.64rem] tracking-[0.08em] text-ink/50 uppercase";

const MONTHS = [26, 34, 42, 55, 70, 100]; // illustrative, like every figure here
const VIS_ICONS: LucideIcon[] = [Search, MessageSquare, Layers];

export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const [from, to] = figures.visibility;
  const rise = seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0";
  const out = [
    { label: impact.signals[0], value: figures.traffic },
    { label: impact.signals[1], value: String(figures.signups) },
    { label: impact.signals[2], value: String(figures.demos) },
    { label: impact.signals[3], value: figures.pipeline },
  ];

  return (
    <section aria-labelledby="measure-title" className="bg-white px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
<style href="search-measure" precedence="default">{KEYFRAMES}</style>
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 max-w-[20ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title}
        </h2>

        <div ref={ref} className="mt-12 lg:mt-14">
          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1.1fr)] lg:gap-0">
            {/* Visibility */}
            <article className={`${CARD} ${EDGE} bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_100%)] ${rise}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-[1.5rem] leading-none font-semibold tracking-[-0.035em] text-ink">{visibility.title}</h3>
                <span aria-hidden="true" className="flex gap-2">
                  {(["google", "chatgpt", "perplexity", "claude"] as const).map((m) => (
                    <span key={m} className="grid size-10 place-items-center rounded-xl bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.08),0_1px_2px_rgb(23_44_33/0.05)]">
                      <Mark name={m} className="size-[1.2rem]" />
                    </span>
                  ))}
                </span>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
                <NumberFlow value={seen ? from : 0} suffix="%" className="text-[clamp(3rem,5.6vw,4.6rem)] leading-none font-medium tracking-[-0.05em] text-ink/45 tabular-nums" />
                <ArrowRight aria-hidden="true" className="size-8 text-primary" strokeWidth={2.2} />
                <span className="rounded-2xl bg-[color-mix(in_srgb,var(--primary)_16%,white)] px-5 py-2 shadow-[inset_0_0_0_1px_rgb(25_231_110/0.3)]">
                  <NumberFlow value={seen ? to : 0} suffix="%" className="text-[clamp(3rem,5.6vw,4.6rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums" />
                </span>
              </div>
              <p className="mt-3 text-[1.2rem] font-medium tracking-[-0.02em] text-ink/70">{visibility.metric}</p>

              {/* Where it started, and how far it has come. */}
              <div aria-hidden="true" className="relative mt-9 h-2.5 rounded-full bg-ink/[0.07]">
                <span className={`absolute inset-y-0 left-0 origin-left rounded-full bg-primary transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${seen ? "scale-x-100" : "scale-x-0"}`} style={{ width: `${to}%`, transitionDelay: "0.3s" }} />
                <span className="absolute top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-ink/40" style={{ left: `${from}%` }} />
                <span className="absolute top-full mt-2 -translate-x-1/2 font-mono text-[0.64rem] tracking-[0.06em] text-ink/45 uppercase" style={{ left: `${from}%` }}>
                  Start
                </span>
              </div>

              <ul className="mt-auto grid grid-cols-3 gap-2 border-t border-ink/10 pt-6 sm:mt-14">
                {visibility.signals.map((s, i) => {
                  const Icon = VIS_ICONS[i];
                  return (
                    <li key={s} className={`flex items-center justify-center gap-2 text-[0.95rem] font-medium text-ink/75 sm:justify-start ${i ? "sm:border-l sm:border-ink/10 sm:pl-4" : ""}`}>
                      <Icon className="size-[1.1rem] shrink-0 text-ink/55" strokeWidth={1.8} />
                      {s}
                    </li>
                  );
                })}
              </ul>
            </article>

            {/* The link: a wire out of the first card, an arrow, a wire into the second, each with a port. */}
            <div aria-hidden="true" className="flex items-center justify-center max-lg:h-16 max-lg:flex-col lg:px-0">
              <span className="relative grid h-px w-full place-items-center max-lg:h-full max-lg:w-px lg:flex-1">
                <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_8px)] max-lg:bg-[repeating-linear-gradient(180deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_8px)]" />
                <span className="absolute left-0 size-2.5 rounded-full bg-primary shadow-[0_0_0_3px_#fff,0_0_0_4.5px_rgb(25_231_110/0.3)] max-lg:top-0 max-lg:left-auto" />
              </span>
              <span className="z-10 mx-1 grid size-11 shrink-0 place-items-center rounded-full bg-primary text-ink shadow-[0_0_0_5px_#fff,0_0_0_6px_rgb(25_231_110/0.3),0_12px_22px_-10px_rgb(25_231_110/0.7)] max-lg:my-1 max-lg:rotate-90">
                <ArrowRight className="size-5 motion-safe:animate-[nudge_2.6s_ease-in-out_infinite]" strokeWidth={2.4} />
              </span>
              <span className="relative grid h-px w-full place-items-center max-lg:h-full max-lg:w-px lg:flex-1">
                <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_8px)] max-lg:bg-[repeating-linear-gradient(180deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_8px)]" />
                <span className="absolute right-0 size-2.5 rounded-full bg-primary shadow-[0_0_0_3px_#fff,0_0_0_4.5px_rgb(25_231_110/0.3)] max-lg:right-auto max-lg:bottom-0" />
              </span>
            </div>

            {/* Business impact */}
            <article className={`${CARD} bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_13%,white)_0%,color-mix(in_srgb,var(--primary)_6%,white)_100%)] shadow-[0_0_0_1px_rgb(25_231_110/0.3),0_1px_2px_rgb(23_44_33/0.04),0_30px_54px_-34px_rgb(25_231_110/0.55),inset_0_1px_0_rgb(255_255_255/0.8)] ${rise}`} style={{ animationDelay: "0.12s" }}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[1.5rem] leading-none font-semibold tracking-[-0.035em] text-ink">{impact.title}</h3>
                <span className={`${TAG} bg-white/70`}>Illustrative</span>
              </div>

              <div className="mt-8 flex items-end justify-between gap-6">
                <div>
                  <NumberFlow value={seen ? figures.demosSignups : 0} className="text-[clamp(4.4rem,8vw,7rem)] leading-[0.95] font-medium tracking-[-0.06em] text-ink tabular-nums" />
                  <p className="mt-3 text-[1.2rem] font-medium tracking-[-0.02em] text-ink/70">{impact.metric}</p>
                </div>
                {/* By month: the outcome building up, the latest month in green. */}
                <div aria-hidden="true" className="hidden w-[9.5rem] shrink-0 pb-1 sm:block">
                  <div className="flex h-24 items-end gap-1.5">
                    {MONTHS.map((h, i) => (
                      <span
                        key={i}
                        className={`flex-1 origin-bottom rounded-t-md transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${i === MONTHS.length - 1 ? "bg-primary" : "bg-primary/35"} ${seen ? "scale-y-100" : "scale-y-0"}`}
                        style={{ height: `${h}%`, transitionDelay: `${0.3 + i * 0.09}s` }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 border-t border-[rgb(25_231_110/0.28)] pt-2 font-mono text-[0.64rem] tracking-[0.08em] text-ink/50 uppercase">By month</p>
                </div>
              </div>

              {/* What the 22 is made of. */}
              <div aria-hidden="true" className="mt-7 flex h-2.5 gap-1">
                <span className={`origin-left rounded-full bg-ink transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${seen ? "scale-x-100" : "scale-x-0"}`} style={{ flex: figures.signups, transitionDelay: "0.5s" }} />
                <span className={`origin-left rounded-full bg-primary transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${seen ? "scale-x-100" : "scale-x-0"}`} style={{ flex: figures.demos, transitionDelay: "0.7s" }} />
              </div>
              <p className="mt-2.5 flex gap-5 text-[0.82rem] text-ink/60">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ink" />
                  {impact.signals[1]} {figures.signups}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  {impact.signals[2]} {figures.demos}
                </span>
              </p>

              <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[rgb(25_231_110/0.28)] pt-6 sm:grid-cols-4 sm:gap-x-4">
                {out.map((o) => {
                  return (
                    <li key={o.label}>
                      <p className="flex items-center gap-1.5 text-[0.84rem] leading-tight font-medium whitespace-nowrap text-ink/65">
                        {o.label}
                      </p>
                      <p className="mt-1.5 text-[1.5rem] leading-none font-medium tracking-[-0.035em] text-ink tabular-nums">{o.value}</p>
                    </li>
                  );
                })}
              </ul>
            </article>
          </div>

          <p className="mt-6 text-[0.88rem] text-ink/50">
            {note}
          </p>
        </div>
      </div>
    </section>
  );
}
