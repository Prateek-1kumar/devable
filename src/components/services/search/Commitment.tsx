"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Label, useInView } from "../kit";
import { COMMITMENT } from "./content";

// Our commitment to a client: the claim set large and centred, its two key phrases in the brand green ("90-day plan"
// fills in as a pill, "commercial impact" gets a highlighter stroke), and under it the three horizons as one compact
// panel, read left to right as a zoom into time. Each column carries a small brand scale instead of an icon:
//   01 Long-term strategy   the year, four quarters, the first marked green: the next 90 days
//   02 90-day priorities    that quarter, three months, the first lit
//   03 Monthly execution    that month, four weekly sprints, filling in green one after another
// Hairlines divide the columns; no arrows. Plays once when scrolled to; reduced motion shows it finished.

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const EASE = "ease-[cubic-bezier(0.65,0,0.35,1)]";
const SOFT = "color-mix(in srgb, var(--primary) 42%, transparent)";

export default function Commitment() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const on = seen || still;
  const t = COMMITMENT.title;

  return (
    <section aria-labelledby="commitment-title" className="px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <div ref={ref} className="mx-auto flex max-w-[64rem] flex-col items-center text-center">
        <Label>{COMMITMENT.label}</Label>

        <h2 id="commitment-title" className="mt-8 max-w-[19ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-balance text-ink">
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

        <ol className="mt-14 grid w-full overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_1px_2px_rgb(23_44_33/0.04),0_24px_50px_-36px_rgb(23_44_33/0.25)] max-lg:divide-y max-lg:divide-line lg:mt-16 lg:grid-cols-3 lg:divide-x lg:divide-line">
          {COMMITMENT.horizons.map((h, i) => {
            const Scale = SCALES[i];
            const start = 1.8 + i * 0.3; // when this column arrives
            return (
              <li
                key={h.name}
                style={{ transitionDelay: on ? `${start}s` : "0s" }}
                className={`group flex flex-col p-6 transition-[opacity,translate,background-color] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfdfb] motion-reduce:transition-none sm:p-7 ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <p className="flex items-center justify-between font-mono text-[0.7rem] tracking-[0.08em] text-ink/45 uppercase">
                  <span className="flex items-center gap-2">
                    <span className="size-[7px] bg-primary" />
                    {HORIZON[i]}
                  </span>
                  <span>0{i + 1}</span>
                </p>
                <Scale on={on} wait={start + 0.4} />
                <h3 className="mt-6 text-[1.3rem] leading-[1.15] font-medium tracking-[-0.03em] text-ink">{h.name}</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-ink/60">{h.body}</p>
              </li>
            );
          })}
        </ol>
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

// ── The three scales: one zoom into time ───────────────────────────────────────────────────────────────────

/** The time span each column covers. */
const HORIZON = ["12 months", "90 days", "Each month"];

type ScaleProps = { on: boolean; wait: number };
const GROW = "origin-left transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** A row of segments with labels under them; `lit(k)` says how each fills (0 empty, 1 soft, 2 full green). */
function Segments({ labels, lit, on, wait, step = 0.12 }: { labels: string[]; lit: (k: number) => 0 | 1 | 2; on: boolean; wait: number; step?: number }) {
  return (
    <div className="mt-5">
      <div className="flex gap-1">
        {labels.map((l, k) => {
          const f = lit(k);
          return (
            <span key={l} className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
              {f > 0 && (
                <span
                  style={{ transitionDelay: on ? `${wait + k * step}s` : "0s" }}
                  className={`absolute inset-0 rounded-full ${f === 2 ? "bg-primary" : "bg-light-green-soft"} ${GROW} ${on ? "scale-x-100" : "scale-x-0"}`}
                />
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 font-mono text-[0.66rem] tracking-[0.04em] text-ink/40">
        {labels.map((l, k) => (
          <span key={l} className={`flex-1 ${lit(k) === 2 ? "font-medium text-[#1a7f47]" : ""}`}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 01 · Long-term strategy: the year, four quarters; the direction covers it all, the first quarter is next. */
const Year = ({ on, wait }: ScaleProps) => <Segments labels={["Q1", "Q2", "Q3", "Q4"]} lit={(k) => (k === 0 ? 2 : 1)} on={on} wait={wait} />;

/** 02 · 90-day priorities: that quarter, three months; the first is in focus. */
const Quarter = ({ on, wait }: ScaleProps) => <Segments labels={["Month 1", "Month 2", "Month 3"]} lit={(k) => (k === 0 ? 2 : 1)} on={on} wait={wait} />;

/** 03 · Monthly execution: that month, four weekly sprints, filling in one after another. */
const Month = ({ on, wait }: ScaleProps) => <Segments labels={["Wk 1", "Wk 2", "Wk 3", "Wk 4"]} lit={() => 2} on={on} wait={wait} step={0.22} />;

const SCALES = [Year, Quarter, Month];
