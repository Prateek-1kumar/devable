"use client";

import NumberFlow from "@number-flow/react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Label } from "../kit";
import { CANVAS, FRAME, Mark, STAMP, Tick } from "../parts";
import { HAIR, PANEL, show, useBeats } from "../search/scene";
import { CONTRAST } from "./content";
import { Piece } from "./Hero";

// Reddit's verdict on marketing, shown the way Reddit delivers it: one question, two answers, and the thread
// does the explaining. It plays in order, so the contrast is a sequence you watch happen:
//   1 the question
//   2 the useful answer arrives, gets upvoted to 214 and earns "Top comment", its product mention picked out
//   3 the plug arrives, is downvoted to −14, fades, and folds into the one-line row Reddit leaves behind
//     (a [+], the name, "−14 points"), with no label explaining it
// Plays when scrolled to and again on the way back. Reduced motion shows the end: the useful answer on top,
// the plug folded away beneath it.
const TIMES = [200, 650, 1800, 3500, 4600, 5700, 6500];

export default function Contrast() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const b = useBeats(on, TIMES);
  const h = CONTRAST.helpful;
  const f = CONTRAST.forced;

  return (
    <section aria-labelledby="contrast-title" className="px-6 pt-10 pb-0 sm:px-12 lg:pt-12 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
        <div>
          <Label>{CONTRAST.label}</Label>
          <h2 id="contrast-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
            {CONTRAST.title}
          </h2>
          <p className="mt-6 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink">{CONTRAST.body}</p>
          <p className="mt-4 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink/65">{CONTRAST.body2}</p>
        </div>

        <div ref={ref} aria-hidden="true" className={`${FRAME} ${CANVAS} px-3 py-5 sm:px-8 sm:py-7`}>
          <div className={`${PANEL} overflow-hidden ${show(b >= 1)}`}>
            <div className={`border-b ${HAIR} px-4 py-3.5`}>
              <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/70">
                <Mark name="reddit" className="size-4" />
                {CONTRAST.thread.sub}
                <span className="ml-auto font-normal text-ink/40">
                  {CONTRAST.thread.meta.score} · {CONTRAST.thread.meta.comments} comments
                </span>
              </p>
              <p className="mt-1.5 text-[14px] leading-snug font-medium tracking-[-0.01em] text-ink">{CONTRAST.thread.title}</p>
            </div>
            <p className={`flex items-center gap-1 border-b ${HAIR} bg-paper/50 px-4 py-1.5 text-[11px] text-ink/45`}>
              Sort by <span className="font-medium text-ink/65">Best</span>
              <ChevronDown className="size-3" strokeWidth={2.4} />
            </p>

            {/* The useful answer: upvoted, and it earns the top spot. */}
            <div className={`flex gap-3 px-4 pt-4 pb-3.5 ${show(b >= 2)}`}>
              <Votes n={b >= 3 ? h.votes : h.from} state={b >= 3 ? "up" : "none"} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[11px] text-ink/55">{h.user}</span>
                  <span className="text-[11px] text-ink/35">{h.age}</span>
                  <span className={`${STAMP} transition-opacity duration-700 motion-reduce:transition-none ${b >= 3 ? "opacity-100" : "opacity-0"}`}>
                    <Tick className="size-3" />
                    Top comment
                  </span>
                </p>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink/80">
                  {h.parts.map((p, i) => (
                    <Piece key={i} part={p} on={b >= 3} />
                  ))}
                </p>
                <p className="mt-2.5 flex gap-4 text-[11px] font-medium text-ink/40">
                  <span>Reply</span>
                  <span>Share</span>
                </p>
              </div>
            </div>

            {/* The plug: it arrives, is downvoted, fades, and folds into the line Reddit leaves behind. */}
            <div className={`border-t ${HAIR} ${show(b >= 4)}`}>
              <Fold open={b < 7}>
                <div className={`flex gap-3 bg-paper/50 px-4 pt-3.5 pb-4 transition-[opacity,filter] duration-1000 motion-reduce:transition-none ${b >= 6 ? "opacity-30 blur-[0.5px]" : ""}`}>
                  <Votes n={b >= 5 ? f.votes : f.from} state={b >= 5 ? "down" : "none"} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[11px]">
                      <span className="text-ink/55">{f.user}</span>
                      <span className="text-ink/35">{f.age}</span>
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink/75">{f.text}</p>
                  </div>
                </div>
              </Fold>
              <Fold open={b >= 7}>
                <p className="flex items-center gap-2 bg-paper/50 px-4 py-2.5 text-[11.5px] text-ink/45">
                  <span className="grid size-4 place-items-center rounded-[4px] border border-ink/20 text-ink/45">
                    <Plus className="size-3" strokeWidth={2.4} />
                  </span>
                  <span>{f.user}</span>
                  <span className="text-ink/25">·</span>
                  <span>
                    <NumberFlow value={f.votes} /> points
                  </span>
                  <span className="text-ink/25">·</span>
                  <span>{f.age}</span>
                </p>
              </Fold>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A reply's vote column: up arrow orange when upvoted, the score and down arrow in coral when downvoted. The score rolls. */
function Votes({ n, state }: { n: number; state: "up" | "down" | "none" }) {
  return (
    <div className="flex w-7 shrink-0 flex-col items-center text-ink/30">
      <ChevronUp className={`size-4 transition-[color,translate] duration-500 ${state === "up" ? "-translate-y-0.5 text-[#ff4500]" : ""}`} strokeWidth={2.4} />
      <span className={`my-0.5 text-[12px] font-semibold tabular-nums transition-colors duration-500 ${state === "down" ? "text-accent" : "text-ink"}`}>
        <NumberFlow value={n} />
      </span>
      <ChevronDown className={`size-4 transition-[color,translate] duration-500 ${state === "down" ? "translate-y-0.5 text-accent" : ""}`} strokeWidth={2.4} />
    </div>
  );
}

/** Content that folds open or shut: its height eases to nothing, so what's beneath rises into place. */
function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
