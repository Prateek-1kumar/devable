"use client";

import { Activity, ArrowRight, AtSign, CalendarCheck, ChartPie, ListOrdered, MessagesSquare, MousePointerClick, Search, Sparkles, ThumbsUp, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";
import { Label, useInView } from "../kit";
import { MarkStack, STAMP, Tick } from "../parts";
import { MEASURE } from "./content";

// What each metric looks like, one small glyph per row, in the same order as MEASURE.groups[].items.
const ICONS: LucideIcon[][] = [
  [MessagesSquare, AtSign, ThumbsUp, Activity],
  [Search, Sparkles, ListOrdered, ChartPie],
  [MousePointerClick, UserPlus, CalendarCheck, TrendingUp],
];

// Karma is not the KPI, shown literally. On the left the vanity number: it appears in full first, then a line
// is drawn through it and it goes quiet. That is the only motion on the page section; the metrics we do report
// on are static. On the right they run Community → Discovery → Business as three cards with arrows between,
// each with its own icons and platform marks, and Business, the outcome the other two feed, raised and in green.
// Reduced motion: Karma already struck out.
export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const last = MEASURE.groups.length - 1;

  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title}
        </h2>
        <p className="mt-6 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{MEASURE.body}</p>

        <div ref={ref} className="mt-14 grid gap-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8">
          {/* The vanity metric: appears, then is crossed out. */}
          <div className="flex flex-col justify-center rounded-2xl bg-[#f6f5f1] p-7">
            <p className="flex items-center gap-2 text-[0.85rem] text-ink/50">
              <MarkStack names={["reddit"]} size="size-5" />
              Karma
            </p>
            <p className="relative mt-3 w-fit text-[clamp(2.4rem,3.6vw,3rem)] leading-none font-medium tracking-[-0.05em] tabular-nums">
              <span
                className={`block transition-[opacity,translate,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0 motion-reduce:transition-none ${
                  seen ? "translate-y-0 opacity-100 blur-0" : "translate-y-2 opacity-0 blur-[4px]"
                }`}
              >
                <span
                  style={{ transitionDelay: seen ? "1500ms" : "0ms" }}
                  className={`transition-colors duration-700 motion-reduce:text-ink/30 motion-reduce:transition-none ${seen ? "text-ink/30" : "text-ink"}`}
                >
                  {MEASURE.karma}
                </span>
              </span>
              <span
                aria-hidden="true"
                style={{ transitionDelay: seen ? "1000ms" : "0ms" }}
                className={`absolute top-1/2 -right-1.5 -left-1.5 h-[2px] origin-left rounded-full bg-accent transition-transform duration-[700ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:scale-x-100 motion-reduce:transition-none ${
                  seen ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </p>
            <p
              style={{ transitionDelay: seen ? "1700ms" : "0ms" }}
              className={`mt-4 text-[0.85rem] text-ink/50 transition-opacity duration-700 motion-reduce:opacity-100 motion-reduce:transition-none ${seen ? "opacity-100" : "opacity-0"}`}
            >
              Not what we report
            </p>
          </div>

          {/* What we report on, in the order it leads: Community, then Discovery, then Business. Static. */}
          <ol className="grid gap-5 md:grid-cols-3 md:items-stretch md:gap-10">
            {MEASURE.groups.map((g, i) => {
              const outcome = i === last;
              const Glyphs = ICONS[i];
              return (
                <li
                  key={g.name}
                  className={`relative rounded-2xl p-6 ${
                    outcome
                      ? "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--light-green-soft)_60%,white),white_70%)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_26%,var(--line)),0_1px_2px_rgb(15_26_20/0.04),0_30px_60px_-34px_rgb(15_26_20/0.3)] md:-my-2 md:py-8"
                      : "border border-line bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-9 items-center">
                      {g.marks.length > 0 ? (
                        <MarkStack names={g.marks} size="size-8" />
                      ) : (
                        <span className="grid size-8 place-items-center rounded-full bg-primary text-ink">
                          <Tick className="size-4" />
                        </span>
                      )}
                    </span>
                    {outcome ? <span className={STAMP}>The outcome</span> : <span className="font-mono text-[11px] tracking-[0.06em] text-ink/35">0{i + 1}</span>}
                  </div>
                  <h3 className="mt-5 text-[1.3rem] leading-none font-medium tracking-[-0.03em] text-ink">{g.name}</h3>
                  <ul className="mt-5">
                    {g.items.map((item, j) => {
                      const Glyph = Glyphs[j];
                      return (
                        <li key={item} className={`flex items-center gap-3 py-3 text-[0.93rem] leading-snug ${outcome ? "text-ink" : "text-ink/70"} ${j ? (outcome ? "border-t border-ink/[0.06]" : "border-t border-ink/[0.06]") : ""}`}>
                          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${outcome ? "bg-white text-[#1a7f47] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_22%,transparent)]" : "bg-ink/[0.045] text-ink/55"}`}>
                            <Glyph aria-hidden="true" strokeWidth={1.9} className="size-3.5" />
                          </span>
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                  {/* The hand-off to the next bucket: centred in the gap, level with the icon row. */}
                  {!outcome && <ArrowRight aria-hidden="true" strokeWidth={1.8} className="absolute top-[1.9rem] -right-8 hidden size-6 text-ink/30 md:block" />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
