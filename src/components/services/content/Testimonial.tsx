"use client";

import { useMemo, type CSSProperties } from "react";
import { useInView } from "../kit";
import { TESTIMONIAL, type TestimonialData } from "./content";
import { clamp01, io3, seg, usePlay } from "./play";
import TestimonialBars from "./TestimonialBars";

// A standalone credibility band under the hero: the quote, large and centred in solid ink, with the thin ledger bars
// along its top and bottom edges (see TestimonialBars) and, when the quote has been read, one hairline wire with a
// coral packet running down from it into the attribution pill, arriving at a port that rings out.
//   1. The quote rises in word by word, with a soft blur.
//   2. The wire draws down; the attribution pill (photo, name, role, logo) settles in at its end.
//   3. A packet travels the wire and reaches the port on the pill's top edge, which rings out once.
// Plays once, when scrolled into view. Reduced motion: the finished picture.

const STEP = 0.024; // seconds between words
const WIRE = 64; // px, the wire's length

// The quote as words, each with the time it starts to rise in; the quotation marks sit on the first and last.
type Node = { kind: "word"; text: string; at: number } | { kind: "space" };
function buildNodes(quote: string): Node[] {
  const nodes: Node[] = [];
  let n = 0;
  quote.split(/(\s+)/).forEach((tok) => {
    if (!tok) return;
    if (/^\s+$/.test(tok)) return void nodes.push({ kind: "space" });
    nodes.push({ kind: "word", text: tok, at: 0.2 + n++ * STEP });
  });
  const words = nodes.filter((x): x is Extract<Node, { kind: "word" }> => x.kind === "word");
  words[0].text = `\u201C${words[0].text}`;
  words[words.length - 1].text += "\u201D";
  return nodes;
}

const fadeIn = (v: number, rise = 8): CSSProperties => ({ opacity: v, transform: `translateY(${(1 - v) * rise}px)` });

// Used by the Technical Content and Influencer Marketing pages, each with its own client's quote.
export default function Testimonial({ data: T = TESTIMONIAL }: { data?: TestimonialData }) {
  const NODES = useMemo(() => buildNodes(T.quote), [T]);
  const W0 = useMemo(() => NODES.reduce((m, x) => (x.kind === "word" ? Math.max(m, x.at) : m), 0) + STEP + 0.6, [NODES]); // the wire starts once the quote has been read
  const TOTAL = W0 + 3.2; // seconds
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const s = usePlay(seen, TOTAL * 1000) * TOTAL;
  const hide = seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0";

  const draw = seg(s, W0, W0 + 0.8);
  const pill = seg(s, W0 + 0.3, W0 + 1);
  const go = seg(s, W0 + 0.9, W0 + 1.9, io3);
  const ripple = clamp01((s - (W0 + 1.9)) / 1);

  return (
    <section ref={ref} aria-label="Client testimonial" className="relative isolate bg-white px-6 pt-32 pb-36 sm:pt-44 sm:pb-48">
      <TestimonialBars seen={seen} />
      <figure className="mx-auto max-w-[68rem]">
        <div className="px-2 pb-14 sm:px-10 sm:pb-16">
          <blockquote className="mx-auto max-w-[56rem] text-center text-[clamp(1.4rem,2.55vw,2.4rem)] leading-[1.3] font-normal tracking-[-0.03em] text-balance text-ink">
            {NODES.map((n, i) =>
              n.kind === "space" ? (
                " "
              ) : (
                <span key={i} className={`inline-block ${hide}`} style={{ animationDelay: `${n.at}s` }}>
                  {n.text}
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
              <Avatar t={T} />
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

/** The client's photo in a circle; their initials sit underneath and show until a photo exists at `t.photo`. */
function Avatar({ t: T }: { t: TestimonialData }) {
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
