"use client";

import type { CSSProperties } from "react";
import Highlight from "../../Highlight";
import { useInView } from "../kit";
import { TESTIMONIAL as T } from "./content";
import { clamp01, io3, seg, usePlay } from "./play";

// A standalone credibility band under the hero, in the hero's own language: a large quote framed by the same corner
// brackets as its stage titles, and, when the quote has been read, one hairline wire with a
// coral packet running down from it into the attribution pill, arriving at a port that rings out, like the outcomes
// in the hero.
//   1. The brackets close in around the quote while it rises in word by word, with a soft blur. The quote sits in a
//      soft grey-green; two phrases stay inked.
//   2. The two phrases are then lit in turn with the site's own Highlight sweep, settling on the brand green.
//   3. The wire draws down; the attribution pill (photo, name, role, logo) settles in at its end.
//   4. A packet travels the wire and reaches the port on the pill's top edge, which rings out once.
// Plays once, when scrolled into view (the Highlight sweeps are held until then). Reduced motion: the finished picture.

const STEP = 0.028; // seconds between words
const HOLD = 0.45; // seconds between one phrase's highlight and the next
const WIRE = 64; // px, the wire's length

// The quote as words and highlighted phrases. A phrase is one unit, and whatever punctuation follows it travels with
// it, so a full stop can never wrap onto a line of its own. `at` is when a unit starts to rise in.
type Node = { kind: "word"; text: string; at: number } | { kind: "space" } | { kind: "lit"; text: string; tail: string; at: number; k: number };
const NODES: Node[] = (() => {
  const nodes: Node[] = [];
  let n = 0;
  let k = 0;
  let tail = ""; // punctuation owed to the phrase just before
  T.quote.split(new RegExp(`(${T.lit.join("|")})`)).forEach((part) => {
    if (T.lit.includes(part)) {
      nodes.push({ kind: "lit", text: part, tail: "", at: 0.2 + n * STEP, k: k++ });
      n += part.split(" ").length;
      tail = "lit";
      return;
    }
    part.split(/(\s+)/).forEach((tok) => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) return void nodes.push({ kind: "space" });
      const prev = nodes[nodes.length - 1];
      if (tail === "lit" && prev?.kind === "lit") prev.tail = tok;
      else nodes.push({ kind: "word", text: tok, at: 0.2 + n * STEP });
      tail = "";
      n++;
    });
  });
  // The quotation marks sit on the first and last units.
  const first = nodes.find((x) => x.kind === "word");
  if (first?.kind === "word") first.text = `\u201C${first.text}`;
  const last = nodes[nodes.length - 1];
  if (last.kind === "lit") last.tail += "\u201D";
  else if (last.kind === "word") last.text += "\u201D";
  return nodes;
})();
const WORDS = NODES.reduce((m, x) => (x.kind === "space" ? m : Math.max(m, x.at)), 0) + STEP; // when the last unit starts
const HL0 = WORDS + 0.5; // the first highlight sweeps once the quote has been read
const W0 = HL0 + HOLD * (T.lit.length - 1) + 0.9; // the wire starts as the last highlight lands
const TOTAL = W0 + 3.2; // seconds

const fadeIn = (v: number, rise = 8): CSSProperties => ({ opacity: v, transform: `translateY(${(1 - v) * rise}px)` });

export default function Testimonial() {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const s = usePlay(seen, TOTAL * 1000) * TOTAL;
  const hide = seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0";

  const frame = seg(s, 0, 1);
  const draw = seg(s, W0, W0 + 0.8);
  const pill = seg(s, W0 + 0.3, W0 + 1);
  const go = seg(s, W0 + 0.9, W0 + 1.9, io3);
  const ripple = clamp01((s - (W0 + 1.9)) / 1);

  return (
    <section ref={ref} aria-label="Client testimonial" className="bg-white px-6 pt-14 pb-24 sm:pt-20 sm:pb-32">
      <figure className="mx-auto max-w-[68rem]">
        <div className="relative px-6 py-14 sm:px-16 sm:py-20">
          {[
            ["top-0 left-0 border-t-2 border-l-2", -1, -1],
            ["top-0 right-0 border-t-2 border-r-2", 1, -1],
            ["bottom-0 left-0 border-b-2 border-l-2", -1, 1],
            ["right-0 bottom-0 border-r-2 border-b-2", 1, 1],
          ].map(([cls, dx, dy]) => (
            <span
              key={cls as string}
              aria-hidden="true"
              className={`absolute size-9 border-ink/55 ${cls}`}
              style={{ opacity: frame, transform: `translate(${(dx as number) * 18 * (1 - frame)}px, ${(dy as number) * 18 * (1 - frame)}px)` }}
            />
          ))}

          <blockquote className={`mx-auto max-w-[56rem] text-center text-[clamp(1.4rem,2.55vw,2.4rem)] leading-[1.3] font-normal tracking-[-0.03em] text-balance text-ink/60 ${seen ? "" : "[&_*]:[animation-play-state:paused]"}`}>
            {NODES.map((n, i) =>
              n.kind === "space" ? (
                " "
              ) : n.kind === "word" ? (
                <span key={i} className={`inline-block ${hide}`} style={{ animationDelay: `${n.at}s` }}>
                  {n.text}
                </span>
              ) : (
                <span key={i} className="whitespace-nowrap">
                  <span className={`inline-block ${hide}`} style={{ animationDelay: `${n.at}s` }}>
                    <Highlight tone="brand" delay={HL0 + HOLD * n.k}>
                      {n.text}
                    </Highlight>
                  </span>
                  {n.tail && (
                    <span className={`inline-block ${hide}`} style={{ animationDelay: `${n.at}s`, marginLeft: "-0.3em" }}>
                      {n.tail}
                    </span>
                  )}
                </span>
              ),
            )}
          </blockquote>
        </div>

        <figcaption className="flex flex-col items-center" aria-label={`${T.name}, ${T.role}, ${T.company}`}>
          {/* The wire: a quiet track, the coral line drawn over it, and a packet travelling down it. */}
          <span aria-hidden="true" className="relative block w-px" style={{ height: WIRE, opacity: seg(s, W0 - 0.3, W0) }}>
            <span className="absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-ink/25" />
            <span className="absolute inset-0 bg-ink/10" />
            <span className="absolute inset-0 origin-top bg-accent/60" style={{ transform: `scaleY(${draw})` }} />
            {go > 0 && go < 1 && (
              <>
                <span className="absolute left-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15" style={{ top: go * WIRE }} />
                <span className="absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-[1.5px] ring-white" style={{ top: go * WIRE }} />
              </>
            )}
          </span>

          <span className="relative flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border border-ink/[0.08] bg-white py-3 pr-6 pl-3 shadow-[0_1px_2px_rgb(23_44_33/0.04),0_14px_30px_-20px_rgb(23_44_33/0.25)]" style={fadeIn(pill)}>
            <span aria-hidden="true" className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2">
              <span className="absolute inset-0 rounded-full border border-accent" style={{ opacity: (1 - ripple) * 0.7 * (ripple > 0 ? 1 : 0), transform: `scale(${1 + 2.6 * ripple})` }} />
              <span className="absolute inset-0 rounded-full bg-accent ring-[3px] ring-white" style={{ opacity: 0.35 + 0.65 * seg(go, 0.9, 1) }} />
            </span>
            <span className="flex items-center gap-3.5">
              <Avatar />
              <span className="text-left">
                <span className="block text-[1rem] leading-tight font-medium tracking-[-0.01em] text-ink">{T.name}</span>
                <span className="mt-1 block text-[0.88rem] leading-tight text-ink/55">{T.role}</span>
              </span>
            </span>
            <span aria-hidden="true" className="hidden h-8 w-px bg-ink/10 sm:block" />
            {/* eslint-disable-next-line @next/next/no-img-element -- a small SVG logo from /public */}
            <img src={T.logo} alt={T.company} className="h-7 w-auto" />
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

/** The client's photo in a circle; their initials sit underneath and show until a photo exists at `T.photo`. */
function Avatar() {
  const hideIfMissing = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) img.style.display = "none";
  };
  return (
    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e3f3e8] text-[0.95rem] font-medium tracking-[0.04em] text-[#1a7f47] ring-1 ring-black/[0.06]">
      {T.initials}
      {/* eslint-disable-next-line @next/next/no-img-element -- the photo may not exist yet; the initials show instead */}
      <img src={T.photo} alt="" ref={hideIfMissing} onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 size-full object-cover" />
    </span>
  );
}
