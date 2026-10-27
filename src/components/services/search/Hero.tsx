"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { ANSWER, HERO } from "./content";
import { CANVAS, FRAME, Mark, SHEET, STAMP, TAG, Tick } from "./parts";

const CYCLE = 6500; // ms each engine's answer stays up

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The first viewport, stacked like the homepage hero: the claim centered on the warm panel, and hanging off
// its lower edge a How We Work-style card telling one story. A buyer asks one question; the card steps slowly
// through ChatGPT, Perplexity, Google AI and Claude (a thin bar under the active engine shows time left), and
// each engine's answer re-forms with your product recommended first and the sources behind it named right
// under it. The last engine's sheet stays stacked behind the new one. Reduced motion: ChatGPT's answer, still.
export default function Hero() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [k, setK] = useState(0);

  useEffect(() => {
    if (!seen || still) return;
    const id = setTimeout(() => setK((v) => (v + 1) % ANSWER.engines.length), CYCLE);
    return () => clearTimeout(id);
  }, [seen, still, k]);

  const engine = ANSWER.engines[k];
  // Rivals trade places between engines; yours holds first.
  const [you, ...rivals] = ANSWER.products;
  const ranked = [you, ...(k % 2 ? [...rivals].reverse() : rivals)];

  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="mx-auto max-w-[76rem]">
        <div className="rounded-2xl bg-[#f9f8f4] px-6 pt-14 pb-40 text-center sm:px-12 sm:pt-20 sm:pb-48">
          <div className="mx-auto flex max-w-[50rem] flex-col items-center">
            <Label>{HERO.label}</Label>
            <h1 className="mt-7 text-[clamp(2.3rem,4.6vw,4.1rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink">
              {HERO.title}
            </h1>
            <p className="mt-6 max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
            <div className="mt-9">
              <ArcButton href="#contact" arrow tone="primary">
                {HERO.cta}
              </ArcButton>
            </div>
          </div>
        </div>

        <figure
          ref={ref}
          aria-label={`Example: asked “${ANSWER.question}”, ChatGPT, Perplexity, Google AI and Claude each recommend your product first, citing your docs, a Reddit thread and a G2 comparison.`}
          className={`${FRAME} relative mx-auto -mt-28 max-w-[64rem] text-left shadow-[0_1px_2px_rgb(23_44_33/0.04),0_30px_60px_-34px_rgb(23_44_33/0.3)] sm:-mt-32`}
        >
          <div aria-hidden="true" className={`${CANVAS} px-3 py-5 sm:px-10 sm:py-10`}>
            <div className="mx-auto max-w-[44rem]">
              {/* The question, and the engine it's being asked in. */}
              <div className={`${SHEET} p-2`}>
                <div className="grid grid-cols-4 gap-1 rounded-[10px] bg-paper p-1">
                  {ANSWER.engines.map((e, i) => (
                    <span
                      key={e.name}
                      className={`relative flex items-center justify-center gap-1.5 overflow-hidden rounded-[7px] py-1.5 text-[11.5px] transition-[background-color,color,box-shadow] duration-700 ${
                        i === k ? "bg-white text-ink shadow-[0_1px_2px_rgb(15_26_20/0.08)]" : "text-ink/40"
                      }`}
                    >
                      <span className={`transition-opacity duration-700 ${i === k ? "" : "opacity-40 grayscale"}`}>
                        <Mark name={e.mark} className="size-3.5" />
                      </span>
                      <span className="max-sm:sr-only">{e.name}</span>
                      {i === k && !still && seen && (
                        <span
                          key={k}
                          style={{ animationDuration: `${CYCLE}ms` }}
                          className="absolute inset-x-2 bottom-0 h-px origin-left animate-fill bg-ink/30"
                        />
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 px-2.5 pt-3 pb-1.5">
                  <p className="min-w-0 flex-1 text-[14px] leading-snug font-medium tracking-[-0.01em] text-ink sm:text-[15px]">{ANSWER.question}</p>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-white">
                    <ArrowUp className="size-3.5" strokeWidth={2.2} />
                  </span>
                </div>
              </div>

              {/* The answer, over the last engine's (stacked behind for depth). */}
              <div className="relative mt-3">
                <div className={`${SHEET} absolute inset-x-4 -bottom-2.5 top-3 opacity-70`} />
                <div className={`${SHEET} relative overflow-hidden`}>
                  <div key={k} className="flex items-center gap-2 border-b border-line px-4 py-3 motion-safe:animate-fade-up">
                    <Mark name={engine.mark} className="size-3.5" />
                    <p className="text-[12.5px] font-medium text-ink">{engine.name}</p>
                    <p className="text-[12.5px] text-ink/45">recommends</p>
                  </div>
                  <ol className="divide-y divide-line">
                    {ranked.map((p, i) => (
                      <li
                        key={`${k}-${p.name}`}
                        style={{ animationDelay: `${250 + i * 220}ms` }}
                        className={`flex gap-3 px-4 py-3.5 motion-safe:animate-fade-up ${p.you ? "bg-[color-mix(in_srgb,var(--light-green-soft)_28%,white)]" : ""}`}
                      >
                        <span className={`mt-px font-mono text-[11px] ${p.you ? "text-ink" : "text-ink/35"}`}>0{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className={`text-[14px] font-medium tracking-[-0.01em] ${p.you ? "text-ink" : "text-ink/45"}`}>{p.name}</span>
                            {p.you && (
                              <span style={{ animationDelay: "900ms" }} className={`${STAMP} motion-safe:animate-fade-up`}>
                                <Tick className="size-3" />
                                Recommended
                              </span>
                            )}
                          </p>
                          <p className={`mt-1 text-[12.5px] leading-snug ${p.you ? "text-ink/65" : "text-ink/40"}`}>{p.note}</p>
                          {/* The sources behind this pick. */}
                          <p className={`mt-2.5 flex flex-wrap items-center gap-1.5 ${p.you ? "" : "opacity-50 max-sm:hidden"}`}>
                            <span className="text-[11px] text-ink/45">Cited from</span>
                            {p.cites.map((n, j) => {
                              const s = ANSWER.sources[n - 1];
                              return (
                                <span
                                  key={n}
                                  style={{ animationDelay: `${p.you ? 1150 + j * 200 : 900}ms` }}
                                  className={`${TAG} border border-line bg-white text-ink/75 motion-safe:animate-fade-up`}
                                >
                                  <Mark name={s.mark} className="size-3" />
                                  {s.label}
                                </span>
                              );
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
