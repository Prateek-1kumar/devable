"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Label, useInView } from "../kit";
import { COMMITMENT } from "./content";

// Our commitment to a client, mostly typography. The claim is set large and centred; its two key phrases take
// the brand green, in the site's own text-led language: "90-day plan" fills in as a pill (colour sweeps in from
// the left, then the word inks in), and "commercial impact" gets a highlighter stroke under it. Beneath, the
// three horizons sit in three lanes of one twelve-month timeline, so their lengths mean something: long-term
// strategy runs the whole way and fades out (it has no end), the 90-day priorities are one green bar over the
// first three months, and monthly execution is three sprints, one per month inside that window. A green band
// runs behind those three months in every lane. Plays once when scrolled to; reduced motion shows it finished.

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const MONTHS = 12; // the timeline
const PLAN = 3; // months in the 90-day plan
const EASE = "ease-[cubic-bezier(0.65,0,0.35,1)]";
const SOFT = "color-mix(in srgb, var(--primary) 42%, transparent)";

export default function Commitment() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const on = seen || still;
  const t = COMMITMENT.title;

  return (
    <section aria-labelledby="commitment-title" className="px-6 py-24 sm:px-12 lg:py-32 xl:px-[6vw]">
      <div ref={ref} className="mx-auto flex max-w-[64rem] flex-col items-center text-center">
        <Label>{COMMITMENT.label}</Label>

        <h2 id="commitment-title" className="mt-8 max-w-[19ch] text-[clamp(2.4rem,5.4vw,4.5rem)] leading-[1.08] font-medium tracking-[-0.05em] text-balance text-ink">
          <Ink on={on} wait={0.1}>
            {t.a}
          </Ink>{" "}
          <Plan on={on}>{t.plan}</Plan>{" "}
          <Ink on={on} wait={1.1}>
            {t.b}
          </Ink>{" "}
          <Stroke on={on}>{t.impact}</Stroke>
          <Ink on={on} wait={1.1}>
            {t.end}
          </Ink>
        </h2>

        <p
          style={{ transitionDelay: on ? "1.5s" : "0s" }}
          className={`mt-8 max-w-[40rem] text-[1.1rem] leading-relaxed tracking-[-0.01em] text-pretty text-ink/65 transition-[opacity,translate] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:text-[1.2rem] ${
            on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {COMMITMENT.body}
        </p>

        <div className="mt-16 w-full text-left lg:mt-20">
          {/* The scale: the 90-day window is the first three months. */}
          <div className="hidden gap-x-8 pb-3 md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)]">
            <span />
            <div aria-hidden="true" className="grid grid-cols-12 font-mono text-[10.5px] tracking-[0.06em] uppercase">
              <span className="col-span-3 text-[#1a7f47]">90 days</span>
              <span className="col-span-9 text-right text-ink/35">Ongoing</span>
            </div>
          </div>
          <ol className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
            {COMMITMENT.horizons.map((text, i) => (
              <li key={text} className="grid items-center gap-x-8 gap-y-3 py-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] md:py-6">
                <p
                  style={{ transitionDelay: on ? `${1.9 + i * 0.5}s` : "0s" }}
                  className={`text-[clamp(1.3rem,2vw,1.7rem)] leading-tight font-medium tracking-[-0.03em] transition-colors duration-700 motion-reduce:transition-none ${on ? "text-ink" : "text-ink/25"}`}
                >
                  {text}
                </p>
                <Lane kind={i} on={on} wait={1.9 + i * 0.5} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** A plain word, inking in from grey as the wave reaches it. */
function Ink({ on, wait, children }: { on: boolean; wait: number; children: ReactNode }) {
  return (
    <span style={{ transitionDelay: on ? `${wait}s` : "0s" }} className={`transition-colors duration-700 motion-reduce:transition-none ${on ? "text-ink" : "text-ink/25"}`}>
      {children}
    </span>
  );
}

/** The first key phrase, as a pill: soft green sweeps in from the left, the brand green settles on top, then the word inks in. */
function Plan({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className="relative inline-block rounded-full px-[0.3em]">
      {/* The layers are clipped in their own wrapper so the pill keeps the text baseline. */}
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full">
        {["bg-light-green-soft", "bg-primary"].map((c, i) => (
          <span
            key={c}
            style={{ transitionDelay: on ? `${0.3 + i * 0.14}s` : "0s" }}
            className={`absolute inset-0 rounded-full ${c} transition-transform duration-[900ms] ${EASE} motion-reduce:transition-none ${on ? "translate-x-0" : "-translate-x-full"}`}
          />
        ))}
      </span>
      <span style={{ transitionDelay: on ? "0.75s" : "0s" }} className={`relative transition-colors duration-700 motion-reduce:transition-none ${on ? "text-ink" : "text-ink/25"}`}>
        {children}
      </span>
    </span>
  );
}

/** The second key phrase: ink, with a highlighter stroke in the brand green drawn under the lower half of it. */
function Stroke({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span
      style={{ backgroundImage: `linear-gradient(${SOFT}, ${SOFT})`, backgroundRepeat: "no-repeat", backgroundPosition: "0 88%", backgroundSize: on ? "100% 0.42em" : "0% 0.42em", transitionDelay: on ? "1.3s" : "0s" }}
      className="box-decoration-clone px-[0.04em] transition-[background-size] duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
    >
      <span style={{ transitionDelay: on ? "1.1s" : "0s" }} className={`transition-colors duration-700 motion-reduce:transition-none ${on ? "text-ink" : "text-ink/25"}`}>
        {children}
      </span>
    </span>
  );
}

/** One horizon's lane of the twelve-month timeline: month lines, the green 90-day band, and its bar(s) drawing in from the left. */
function Lane({ kind, on, wait }: { kind: number; on: boolean; wait: number }) {
  const grow = (d: number) => ({ transitionDelay: on ? `${d}s` : "0s" });
  const bar = `h-3 origin-left rounded-full transition-transform duration-[1100ms] ${EASE} motion-reduce:transition-none ${on ? "scale-x-100" : "scale-x-0"}`;
  return (
    <div aria-hidden="true" className="relative h-9">
      <div className="absolute inset-0 grid grid-cols-12">
        {Array.from({ length: MONTHS }, (_, m) => (
          <span key={m} className={`${m ? "border-l border-ink/[0.07]" : ""} ${m < PLAN ? "bg-primary/[0.08]" : ""}`} />
        ))}
      </div>
      <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 grid-cols-12 items-center">
        {kind === 0 && <span style={grow(wait)} className={`${bar} col-span-12 bg-[linear-gradient(90deg,var(--ink)_0%,var(--ink)_55%,transparent_100%)] duration-[1600ms]!`} />}
        {kind === 1 && <span style={grow(wait)} className={`${bar} col-span-3 bg-primary`} />}
        {kind === 2 &&
          Array.from({ length: PLAN }, (_, m) => (
            <span key={m} className="px-[3px]">
              <span style={grow(wait + m * 0.35)} className={`${bar} block bg-ink`} />
            </span>
          ))}
      </div>
    </div>
  );
}
