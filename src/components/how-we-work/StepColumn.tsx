"use client";

import Image from "next/image";
import { useSyncExternalStore, type CSSProperties } from "react";
import { EYEBROWS, GOAL, INCLUDES_LABEL, INTRO, STEPS, STILL_OVERVIEW, TITLE } from "./content";
import { activePhase } from "./journey";

// Crops for the stacked still layout: each 4:5 box shows the half of the frame that holds the scene.
const CROP_X = [92, 90, 74, 90, 94];

const H2 = "text-[clamp(2.2rem,3.4vw,3.6rem)] font-normal leading-[1.04] tracking-[-0.04em] text-foreground";
const MONO = "font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/70 2xl:text-[12px]";
const BODY = "text-[clamp(0.9375rem,0.4375rem+0.625vw,1.0625rem)] leading-[1.6] text-foreground/70";
// The card's heading and small print, pinned only.
const CARD_H = "hww-pinned:text-[24px] hww-pinned:font-medium hww-pinned:leading-[1.2] hww-pinned:tracking-[-0.02em]";
const CARD_P = "hww-pinned:mt-3 hww-pinned:text-[13.5px] hww-pinned:leading-[1.55]";

// Switching blocks share one grid cell. The outgoing block fades out, then the incoming one rises in.
const SHOWN =
  "hww-pinned:[transition:opacity_360ms_cubic-bezier(.22,1,.36,1)_120ms,transform_360ms_cubic-bezier(.22,1,.36,1)_120ms]";
const HIDDEN =
  "hww-pinned:pointer-events-none hww-pinned:translate-y-2 hww-pinned:opacity-0 hww-pinned:[transition:opacity_180ms_cubic-bezier(.4,0,1,1),transform_0s_180ms]";
const cell = (shown: boolean) => `hww-pinned:[grid-area:1/1] ${shown ? SHOWN : HIDDEN}`;

// The live checklist is pure CSS on the driver's vars: --hww-beat (the lit item; 5 = all done, -1 = none),
// --hww-beat-p (progress through that beat) and --hww-next (item 1 is next, before the latch).
// With no driver (the still layout) every item reads as done.
const REACHED = "clamp(0, calc(var(--hww-beat, 5) - var(--i) + 1), 1)";
const DONE = "clamp(0, calc(var(--hww-beat, 5) - var(--i)), 1)";
const itemStyle = (i: number) =>
  ({
    "--i": i,
    "--r": REACHED,
    "--d": DONE,
    color: "rgb(15 26 20 / calc(0.7 + 0.3 * (var(--r) - var(--d)) + 0.1 * var(--d)))",
  }) as CSSProperties;

function Still({ src, x, className = "" }: { src: string; x: number; className?: string }) {
  return (
    <div className={`relative aspect-[4/5] max-h-[70svh] w-full overflow-hidden rounded-2xl hww-pinned:hidden ${className}`}>
      <Image src={src} alt="" fill sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover" style={{ objectPosition: `${x}% 50%` }} />
    </div>
  );
}

/**
 * The intro, the five steps and the goal line. Pinned, they switch in place inside one bottom-right card
 * (sized to its tallest state) so the scene keeps the stage; the in-scene callouts carry the checklists.
 */
export default function StepCard({ entered, className = "" }: { entered: boolean; className?: string }) {
  const phase = useSyncExternalStore(activePhase.subscribe, activePhase.get, () => 0);

  return (
    <div
      className={`relative z-10 mx-auto max-w-2xl px-6 py-24 sm:px-12 hww-pinned:absolute hww-pinned:right-[max(24px,2vw)] hww-pinned:bottom-[max(24px,3vh)] hww-pinned:mx-0 hww-pinned:w-[clamp(340px,26vw,420px)] hww-pinned:max-w-none hww-pinned:rounded-2xl hww-pinned:border hww-pinned:border-foreground/[0.08] hww-pinned:bg-white hww-pinned:p-6 hww-pinned:shadow-[0_1px_2px_rgb(15_26_20/0.06),0_16px_40px_-16px_rgb(15_26_20/0.22)] ${entered ? "hww-pinned:animate-fade-up" : ""} ${className}`}
    >
      <p className="sr-only">{EYEBROWS.join(", ")}</p>

      <div className="hww-pinned:grid">
        <div className={cell(phase === 0)}>
          <h2 id="how-we-work-title" className={`${H2} ${CARD_H}`}>
            {TITLE}
          </h2>
          <p className={`mt-6 text-[clamp(1rem,0.5rem+0.625vw,1.125rem)] leading-[1.6] text-foreground/70 ${CARD_P} hww-pinned:text-foreground/65`}>
            {INTRO}
          </p>
          <Still src={STILL_OVERVIEW} x={90} className="mt-12" />
        </div>

        <ol className="mt-16 space-y-16 hww-pinned:mt-0 hww-pinned:grid hww-pinned:space-y-0 hww-pinned:[grid-area:1/1]">
          {STEPS.map((step, k) => (
            <li
              key={step.n}
              aria-current={phase === k + 1 ? "step" : undefined}
              className={cell(phase === k + 1)}
              style={phase === k + 1 ? undefined : ({ "--hww-beat": 5, "--hww-beat-p": 0, "--hww-next": 0 } as CSSProperties)}
            >
              <h3 className={`text-[clamp(0.9375rem,0.4375rem+0.625vw,1.0625rem)] font-medium tracking-[-0.01em] text-foreground ${CARD_H}`}>
                {step.title}
              </h3>
              <p className="mt-4 text-[clamp(1.625rem,0.8125rem+1.25vw,2.3rem)] font-normal leading-[1.14] tracking-[-0.03em] text-foreground hww-pinned:mt-2 hww-pinned:text-[16px] hww-pinned:leading-[1.4] hww-pinned:tracking-[-0.01em] hww-pinned:text-foreground/85">
                {step.headline}
              </p>
              <p className={`mt-4 ${BODY} ${CARD_P} hww-pinned:text-foreground/60`}>{step.body}</p>
              <Still src={step.still} x={CROP_X[k]} className="mt-8" />
              {/* Pinned, the in-scene callouts show the checklist; it stays here for assistive tech. */}
              <p className={`mt-6 ${MONO} hww-pinned:sr-only`}>{INCLUDES_LABEL}</p>
              <ul className="mt-3 space-y-[5px] text-[clamp(0.875rem,0.625rem+0.3125vw,0.9375rem)] leading-[1.45] hww-pinned:sr-only">
                {step.includes.map((item, i) => (
                  <li key={item} className="flex items-start gap-[6px]" style={itemStyle(i)}>
                    <span
                      aria-hidden="true"
                      className="relative mt-[0.45em] size-[7px] shrink-0 border border-foreground/25"
                      style={i === 0 ? { boxShadow: "0 0 0 1px rgb(15 26 20 / var(--hww-next, 0))" } : undefined}
                    >
                      <span className="absolute -inset-px" style={{ background: step.squares[i], opacity: "var(--r)" }} />
                    </span>
                    <span className="relative">
                      {item}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px h-px origin-left bg-foreground"
                        style={{ transform: "scaleX(calc((var(--r) - var(--d)) * var(--hww-beat-p, 0)))" }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        {/* The close repeats the intro's last line, so assistive tech hears it once. */}
        <p aria-hidden="true" className={`hidden hww-pinned:block hww-pinned:self-center hww-pinned:text-[28px] hww-pinned:leading-[1.15] ${H2} ${CARD_H} ${cell(phase === 6)}`}>
          {GOAL}
        </p>
      </div>

      {/* Progress: one hairline per step, filled by the driver (past 1, current live, future 0). */}
      <div aria-hidden="true" className="hidden gap-[6px] hww-pinned:mt-5 hww-pinned:flex">
        {STEPS.map((step) => (
          <span key={step.n} className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-foreground/[0.12]">
            <span
              className="absolute inset-0 origin-left bg-foreground"
              style={{ transform: `scaleX(var(--hww-f${Number(step.n)}, 0))` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
