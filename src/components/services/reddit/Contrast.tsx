"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Label, useInView } from "../kit";
import { CANVAS, FRAME, GAP, Mark, SHEET, STAMP, Tick, delay, rise } from "../parts";
import { CONTRAST } from "./content";

// Reddit's verdict on marketing, shown the way Reddit delivers it: one question, two answers. The helpful
// technical answer that mentions the product in passing sits on top, upvoted to 214; the forced plug sinks
// below it, downvoted and collapsed under the score threshold. Readable in two seconds without the copy.
// The thread builds once on view, then holds.
export default function Contrast() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const h = CONTRAST.helpful;
  const f = CONTRAST.forced;
  const [before, after] = h.text.split("Your product");

  return (
    <section aria-labelledby="contrast-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <Label>{CONTRAST.label}</Label>
          <h2 id="contrast-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
            {CONTRAST.title}
          </h2>
          <p className="mt-6 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink">{CONTRAST.body}</p>
          <p className="mt-4 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink/65">{CONTRAST.body2}</p>
        </div>

        <div ref={ref} aria-hidden="true" className={`${FRAME} ${CANVAS} px-3 py-6 sm:px-10 sm:py-10`}>
          <div style={delay(100)} className={`${SHEET} ${rise(seen)} overflow-hidden`}>
            <div className="border-b border-line px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/70">
                <Mark name="reddit" className="size-4" />
                {CONTRAST.thread.sub}
              </p>
              <p className="mt-1.5 text-[14px] leading-snug font-medium tracking-[-0.01em] text-ink">{CONTRAST.thread.title}</p>
            </div>

            {/* The helpful answer, upvoted to the top. */}
            <div style={delay(450)} className={`${rise(seen)} flex gap-3 px-4 pt-4 pb-4`}>
              <Score n={h.votes} up />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-ink/50">{h.user}</span>
                  <span className={STAMP}>
                    <Tick className="size-3" />
                    Helpful
                  </span>
                </p>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink/80">
                  {before}
                  <span className="rounded-[4px] bg-[color-mix(in_srgb,var(--light-green-soft)_70%,white)] px-1 font-medium text-ink">Your product</span>
                  {after}
                </p>
              </div>
            </div>

            {/* The forced plug, sunk and collapsed. */}
            <div style={delay(900)} className={`${rise(seen)} flex gap-3 border-t border-line bg-paper/60 px-4 pt-3.5 pb-4`}>
              <Score n={f.votes} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-ink/50">{f.user}</span>
                  <span className={GAP}>Comment score below threshold</span>
                </p>
                <p className="mt-1.5 truncate text-[12.5px] text-ink/50">{f.text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A reply's vote column: orange up arrow on the upvoted answer, the score in coral when negative. */
function Score({ n, up = false }: { n: number; up?: boolean }) {
  return (
    <div className="flex w-7 shrink-0 flex-col items-center text-ink/30">
      <ChevronUp className={`size-4 ${up ? "text-[#ff4500]" : ""}`} strokeWidth={2.4} />
      <span className={`my-0.5 text-[12px] font-semibold tabular-nums ${n < 0 ? "text-accent" : "text-ink"}`}>{n < 0 ? `−${-n}` : n}</span>
      <ChevronDown className={`size-4 ${n < 0 ? "text-accent" : ""}`} strokeWidth={2.4} />
    </div>
  );
}
