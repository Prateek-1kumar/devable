"use client";

import { ArrowRight } from "lucide-react";
import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { Label, useInView } from "../kit";
import { GREEN, INK, LINE, Layer, MOVE, Plate, tilt, untilt } from "../content/PlateKit";
import { COMMITMENT } from "./content";

// Our commitment to a client: the claim set large and centred, its two key phrases in the brand green ("90-day plan"
// fills in as a pill, "commercial impact" gets a highlighter stroke), and under it the three horizons as three cards in
// the order the work runs: long-term strategy, then the highest-impact 90-day priorities, then monthly execution. A
// green link with an arrow joins each card to the next, so the progression reads without a word. Each card has a 3D
// plate icon in the same family as How the work gets done (see PlateKit), which acts out its idea on hover:
//   01 Long-term strategy   three layers pull apart, the top one lighting green
//   02 90-day priorities    a crosshair turns onto the target and the centre lights
//   03 Monthly execution    a calendar fills three days in green, one sprint at a time
// Plays once when scrolled to; reduced motion shows it finished.

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

        <ol className="mt-16 grid w-full text-left lg:mt-20 lg:grid-cols-[minmax(0,1fr)_4.25rem_minmax(0,1fr)_4.25rem_minmax(0,1fr)]">
          {COMMITMENT.horizons.map((h, i) => {
            const Icon = ICONS[i];
            return (
              <Fragment key={h.name}>
              <li
                onPointerMove={tilt}
                onPointerLeave={untilt}
                style={{ transitionDelay: on ? `${1.8 + i * 0.25}s` : "0s" }}
                className={`group relative flex flex-col gap-6 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_100%)] p-7 shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.04),0_28px_50px_-34px_rgb(23_44_33/0.28),inset_0_1px_0_#fff] transition-[opacity,translate,box-shadow] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_0_0_1px_rgb(25_231_110/0.3),0_1px_2px_rgb(23_44_33/0.04),0_30px_50px_-30px_rgb(25_231_110/0.4),inset_0_1px_0_#fff] motion-reduce:transition-none sm:p-8 ${
                  on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <span className="absolute top-7 right-8 font-mono text-[0.78rem] tracking-[0.08em] text-ink/30 transition-colors duration-300 group-hover:text-[#1a7f47] sm:top-8">0{i + 1}</span>
                <Plate>
                  <Icon />
                </Plate>
                <div>
                  <h3 className="text-[clamp(1.4rem,1.75vw,1.7rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-ink">{h.name}</h3>
                  <p className="mt-3 max-w-[24rem] text-[1.02rem] leading-relaxed text-ink/60">{h.body}</p>
                </div>
              </li>
              {/* The link to the next stage: a dotted line out of this card, an arrow, a dotted line into the next. */}
              {i < COMMITMENT.horizons.length - 1 && (
                <li aria-hidden="true" className="flex h-14 items-center justify-center lg:h-auto">
                  {/* It appears once both cards it joins are in place: after the next card has landed. */}
                  <span
                    style={{ transitionDelay: on ? `${2.3 + (i + 1) * 0.25}s` : "0s" }}
                    className={`flex items-center transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-lg:flex-col ${on ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
                  >
                    <span className="h-px w-2 bg-[repeating-linear-gradient(90deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_7px)] max-lg:h-3 max-lg:w-px max-lg:bg-[repeating-linear-gradient(180deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_7px)]" />
                    <span className="mx-1 grid size-10 shrink-0 place-items-center rounded-full bg-primary text-ink shadow-[0_0_0_4px_#fff,0_0_0_5px_rgb(25_231_110/0.3),0_10px_18px_-8px_rgb(25_231_110/0.6)] max-lg:my-1.5 max-lg:mx-0">
                      <ArrowRight className="size-[1.1rem] max-lg:rotate-90" strokeWidth={2.4} />
                    </span>
                    <span className="h-px w-2 bg-[repeating-linear-gradient(90deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_7px)] max-lg:h-3 max-lg:w-px max-lg:bg-[repeating-linear-gradient(180deg,rgb(25_231_110/0.7)_0_3px,transparent_3px_7px)]" />
                  </span>
                </li>
              )}
              </Fragment>
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

// ── The three icons, each a few layers at different heights ─────────────────────────────────────────────────

/** 01 · Long-term strategy: three layers that pull apart, the top one lighting green. */
function Layers() {
  const sheet = (y: number, fill: string, stroke: string) => <path d={`M24 ${y} L41 ${y + 8.5} L24 ${y + 17} L7 ${y + 8.5} Z`} fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />;
  return (
    <>
      <Layer z={5}>
        <g className={`${MOVE} group-hover:translate-y-[5px]`}>{sheet(23, "#f1f0ea", INK)}</g>
      </Layer>
      <Layer z={13}>
        <g>{sheet(16, "#ffffff", INK)}</g>
      </Layer>
      <Layer z={24}>
        <g className={`${MOVE} group-hover:-translate-y-[5px]`}>
          <path d="M24 11 L41 19.5 L24 28 L7 19.5 Z" fill="#fff" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" className="transition-[fill,stroke] duration-500 group-hover:fill-[#d8f8e5] group-hover:stroke-[var(--primary)]" />
        </g>
      </Layer>
    </>
  );
}

/** 02 · 90-day priorities: a crosshair that turns onto the target, the centre lighting green. */
function Target() {
  return (
    <>
      <Layer z={5}>
        <circle cx="24" cy="24" r="15" {...LINE} strokeOpacity="0.55" />
        <circle cx="24" cy="24" r="8" {...LINE} strokeOpacity="0.4" strokeDasharray="2 3" />
      </Layer>
      <Layer z={14}>
        <g className={`${MOVE} origin-center [transform-box:fill-box] group-hover:rotate-90`}>
          <path d="M24 5 V13 M24 35 V43 M5 24 H13 M35 24 H43" {...LINE} strokeWidth="2" />
        </g>
      </Layer>
      <Layer z={26}>
        <g className={`${MOVE} origin-center [transform-box:fill-box] group-hover:scale-125`}>
          <circle cx="24" cy="24" r="4.4" fill={GREEN} stroke={INK} strokeWidth="1.5" />
        </g>
      </Layer>
    </>
  );
}

/** 03 · Monthly execution: a calendar, and three sprints that fill in green, one after another. */
function Calendar() {
  const days = [0, 1, 2, 3, 4, 5, 6, 7];
  const sprint = new Set([1, 4, 6]);
  return (
    <>
      <Layer z={5}>
        <rect x="7" y="10" width="34" height="31" rx="5" fill="#fff" stroke={INK} strokeWidth="1.7" />
        <path d="M7 19 H41" {...LINE} strokeWidth="1.5" />
      </Layer>
      <Layer z={13}>
        {days.map((d) => {
          const x = 13 + (d % 4) * 7.4;
          const y = 25 + Math.floor(d / 4) * 7.6;
          return sprint.has(d) ? null : <rect key={d} x={x} y={y} width="4.6" height="4.6" rx="1.2" fill={INK} fillOpacity="0.14" />;
        })}
      </Layer>
      <Layer z={22}>
        <path d="M15 6 V13 M33 6 V13" {...LINE} strokeWidth="2.2" />
        {days.filter((d) => sprint.has(d)).map((d, k) => {
          const x = 13 + (d % 4) * 7.4;
          const y = 25 + Math.floor(d / 4) * 7.6;
          return (
            <rect
              key={d}
              x={x}
              y={y}
              width="4.6"
              height="4.6"
              rx="1.2"
              fill={GREEN}
              stroke={INK}
              strokeWidth="1"
              className="origin-center [transform-box:fill-box] group-hover:animate-[grow_0.7s_cubic-bezier(0.34,1.56,0.64,1)_both] motion-reduce:animate-none"
              style={{ animationDelay: `${k * 0.14}s` }}
            />
          );
        })}
      </Layer>
    </>
  );
}

const ICONS = [Layers, Target, Calendar];
