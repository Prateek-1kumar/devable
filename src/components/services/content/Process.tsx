"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Label, useInView } from "../kit";
import { Beacon, SHEET, SheetHead, StepChip, Tick, delay, rise } from "../parts";
import { HERO, PROCESS } from "./content";

const RAISED = "bg-white shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_12px_32px_-12px_rgb(23_44_33_/_0.12)]";
const OPEN_WASH = "bg-[color-mix(in_srgb,var(--accent)_9%,white)]";
const DONE_WASH = "bg-[color-mix(in_srgb,var(--light-green-soft)_65%,white)]";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The signature section: all six steps at once on Why Devable's warm tray, with Review raised as the white
// column and opening, like a tab, into a wide panel that shows a real review. On the left the draft, with
// the lines under review highlighted; on the right the reviewers' comments, numbered to those lines. Once in
// view the comments resolve one by one (each highlight turns from coral to green, the code and the
// benchmark update), then nothing moves. Phones: a vertical list with the review opening under step 04.
export default function Process() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [n, setN] = useState(0);
  const total = PROCESS.review.comments.length;

  useEffect(() => {
    if (!seen || still) return;
    const ids = PROCESS.review.comments.map((_, i) => setTimeout(() => setN(i + 1), 1600 + i * 1300));
    return () => ids.forEach(clearTimeout);
  }, [seen, still]);

  const done = still ? total : n;
  const resolved = (i: number) => i < done;
  const sig = PROCESS.signature;

  return (
    <section aria-labelledby="process-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{PROCESS.label}</Label>
        <h2 id="process-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {PROCESS.title}
        </h2>

        <div ref={ref} className="mt-14 rounded-3xl bg-[#f7f6f2] p-2 sm:p-3">
          <ol className="grid lg:grid-cols-6">
            {PROCESS.steps.map((step, i) => (
              <li
                key={step.name}
                className={`px-5 py-5 lg:order-none lg:px-4 lg:pt-5 lg:pb-7 ${i <= sig ? "max-lg:order-1" : "max-lg:order-3"} ${
                  i === sig ? `${RAISED} rounded-t-2xl` : ""
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <StepChip n={i + 1} />
                  {i === sig && (done < total ? <Beacon /> : <Tick className="size-4" />)}
                </span>
                <h3 className="mt-4 text-[1.05rem] font-medium tracking-[-0.015em] text-ink">{step.name}</h3>
                <p className={`mt-2 text-[0.88rem] leading-relaxed ${i === sig ? "text-ink/75" : "text-ink/60"}`}>{step.body}</p>
              </li>
            ))}

            {/* The review itself, opening out of step 04. */}
            <li aria-label="Example review" className={`${RAISED} rounded-b-2xl max-lg:order-2 max-lg:mb-2 lg:col-span-6 lg:rounded-2xl`}>
              <div className="grid gap-4 border-t border-line p-3 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6 lg:border-t-0 lg:p-7">
                <Draft resolved={resolved} />
                <div className="flex flex-col gap-3">
                  <p className="flex items-center justify-between px-1 text-[12px] text-ink/50">
                    <span>Comments</span>
                    <span className="tabular-nums">
                      {done} of {total} resolved
                    </span>
                  </p>
                  {PROCESS.review.comments.map((c, i) => (
                    <div key={i} style={delay(300 + i * 200)} className={`${SHEET} ${rise(seen)} p-3.5`}>
                      <div className="flex items-center gap-2.5">
                        <Badge n={i + 1} done={resolved(i)} />
                        <p className="text-[12.5px] font-medium text-ink">{c.who}</p>
                        <p className="text-[11px] text-ink/45">{c.kind === "technical" ? "Technical review" : "Editorial review"}</p>
                        <span className="ml-auto">
                          {resolved(i) ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-[#1a7f47]">
                              <Tick className="size-4" />
                              Resolved
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[11px] text-ink/50">
                              <span className="size-2 rounded-full bg-accent" />
                              Open
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="mt-2 text-[12.5px] leading-snug text-ink/70">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

/** A comment's number, matching its highlight in the draft: coral while open, green once resolved. */
function Badge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] transition-colors duration-700 ${
        done ? "bg-[#e3f3e8] text-[#1a7f47]" : "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[color-mix(in_srgb,var(--accent)_85%,var(--ink))]"
      }`}
    >
      {n}
    </span>
  );
}

const ink = (o: number) => `color-mix(in srgb, var(--ink) ${o}%, transparent)`;

/** Skeleton prose lines. */
function Lines({ widths }: { widths: number[] }) {
  return (
    <span className="block space-y-[7px]">
      {widths.map((w, i) => (
        <span key={i} className="block h-[4.5px] rounded-full" style={{ width: `${w}%`, background: ink(13) }} />
      ))}
    </span>
  );
}

/** A highlighted passage under review, tagged with its comment's number. */
function Mark({ n, done, children }: { n: number; done: boolean; children: ReactNode }) {
  return (
    <span className={`relative -mx-2 block rounded-lg px-2 py-2 pr-9 transition-colors duration-700 ${done ? DONE_WASH : OPEN_WASH}`}>
      {children}
      <span className="absolute top-2 right-2">
        <Badge n={n} done={done} />
      </span>
    </span>
  );
}

/** The draft under review, comments numbered top to bottom: 1 the opening, 2 the code sample, 3 the benchmark. */
function Draft({ resolved }: { resolved: (i: number) => boolean }) {
  return (
    <div className={`${SHEET} overflow-hidden`}>
      <SheetHead title={PROCESS.review.file}>
        <span className="text-[11px] text-ink/45">Draft</span>
      </SheetHead>
      <div className="space-y-4 px-4 py-4">
        <p className="text-[14px] leading-snug font-semibold tracking-[-0.015em] text-ink">{HERO.article.title}</p>
        <Mark n={1} done={resolved(0)}>
          <Lines widths={[96, 88, 54]} />
        </Mark>
        <Mark n={2} done={resolved(1)}>
          <span className="block rounded-md bg-paper px-3 py-2.5 font-mono text-[11px] leading-relaxed [overflow-wrap:anywhere]">
            <span className="text-ink/40">{"# split a bundled PDF"}</span>
            <br />
            {resolved(1) ? (
              <span className="text-ink">{HERO.article.code}</span>
            ) : (
              <span className="text-ink/45 line-through decoration-accent/60">{'client.split_pdf("bundle.pdf", mode="auto")'}</span>
            )}
          </span>
        </Mark>
        <Lines widths={[92, 70]} />
        <Mark n={3} done={resolved(2)}>
          <span className="block text-[12px] text-ink/70">
            A 400-page bundle splits in{" "}
            <span className={`font-medium tabular-nums transition-colors duration-700 ${resolved(2) ? "text-[#1a7f47]" : "text-ink/45 line-through"}`}>
              {resolved(2) ? "38s" : "52s"}
            </span>
            .
          </span>
        </Mark>
        <Lines widths={[84, 60]} />
      </div>
    </div>
  );
}
