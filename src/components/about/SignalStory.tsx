"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const SignalMark = dynamic(() => import("./SignalMark"), { ssr: false });

// *Starred* phrases get the green terminal-select sweep.
const STATEMENT =
  "Most marketing partners never really understand the product. So we built the team that does: we *learn the product deeply*, *know exactly who it’s for*, and *own the execution* across every channel that drives growth.";
// Plain and marked segments alternate; tokens keep their spaces so commas sit flush. Each word knows its
// place in the reveal.
const SEGMENTS = (() => {
  let w = 0;
  return STATEMENT.split("*").map((text, k) => ({
    mark: k % 2 === 1,
    tokens: text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((t) => ({ text: t, word: t.trim() ? w++ : -1 })),
  }));
})();
const WORD_COUNT = SEGMENTS.flatMap((s) => s.tokens).filter((t) => t.word >= 0).length;

// Where each beat of the scroll lands (0 → 1 across the pinned stage). SignalMark uses the same timeline.
const LOCK = 0.44; // halves fully joined
const REVEAL_FROM = 0.62;
const REVEAL_TO = 0.94;
const STEP = (REVEAL_TO - REVEAL_FROM) / WORD_COUNT;
const wordAt = (i: number) => REVEAL_FROM + i * STEP;

// How far a marked phrase is selected (0 → 1): from its first word lighting to just after its last.
const fillOf = (first: number, last: number) => {
  const from = wordAt(first);
  return `clamp(0, (var(--p) - ${from.toFixed(4)}) * ${(1 / (wordAt(last) + 2.5 * STEP - from)).toFixed(2)}, 1)`;
};

// "Why Devable exists" as a pinned, scroll-driven stage on warm charcoal (#1a1918):
// 1. Two halves of the Devable "D" built from mono glyphs, one mirrored, start at the edges as scrambling
//    noise; as they glide in they resolve into solid cells and lock into one mark: product and audience,
//    understood together.
// 2. The mark splits; the halves swing out to frame the screen.
// 3. The statement between them lights up word by word, its key phrases selected like terminal text: a
//    green marker with a block cursor sweeps across and the words invert to ink.
// Scroll position is written to `--p` on the stage, so the DOM reveal is pure CSS and the 3D reads a ref.
export default function SignalStory() {
  const track = useRef<HTMLElement>(null);
  const progress = useRef(0);
  // The mark's own timeline, which starts at the top of the page rather than when the stage pins: 0 at
  // load (halves parked small in the visible strip of the band), 1 once they've locked (pinned, p = LOCK).
  const approach = useRef(0);
  // How much of the viewport the band fills at load (0..1), so the parked halves sit inside that strip.
  const reveal = useRef(0.3);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      progress.current = p;
      el.style.setProperty("--p", p.toFixed(4));
      const top = rect.top + window.scrollY;
      approach.current = Math.min(1, Math.max(0, window.scrollY / (top + LOCK * total)));
      reveal.current = Math.min(1, Math.max(0.2, 1 - top / window.innerHeight));
      // Leaving: as the band's bottom rises from the viewport's foot to its middle, the paper creeps in
      // from the sides and the band's corners round off.
      const out = Math.min(1, Math.max(0, 2 - (2 * rect.bottom) / window.innerHeight));
      el.style.setProperty("--out", out.toFixed(4));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      io.disconnect();
    };
  }, []);

  return (
    <section
      ref={track}
      aria-labelledby="why-devable-title"
      style={
        {
          "--p": 0,
          "--out": 0,
          clipPath: "inset(0 calc(var(--out) * 2.5vw) 0 round 0 0 calc(var(--out) * 1.25rem) calc(var(--out) * 1.25rem))",
        } as CSSProperties
      }
      className="relative h-[340svh] bg-[#1a1918] text-white"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Above the premise: the cells are solid, so they occlude it as they sweep past. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
          <SignalMark progress={progress} approach={approach} reveal={reveal} active={onScreen} />
        </div>

        {/* Beat 1: the premise, under the forming mark; it steps aside as the mark splits. */}
        <div
          className="absolute inset-x-0 bottom-[9svh] px-6 text-center"
          style={{
            opacity: "clamp(0, calc((0.56 - var(--p)) * 9), 1)",
            transform: "translateY(calc(clamp(0, (var(--p) - 0.45) * 9, 1) * -1.5rem))",
          }}
        >
          <h2
            id="why-devable-title"
            className="mx-auto mt-4 max-w-[22ch] text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.08] font-medium tracking-[-0.04em]"
          >
            Technical products deserve more than generic marketing.
          </h2>
        </div>

        {/* Beats 2–3: the statement, framed by the split halves (fading back to give it focus), lighting up as
            you scroll. Above the mark, so where the halves can't clear it the copy stays on top. */}
        <div
          className="absolute inset-0 z-20 grid place-items-center px-6"
          style={{ opacity: "clamp(0, calc((var(--p) - 0.62) * 12.5), 1)" }}
        >
          <p className="max-w-[min(34rem,72vw)] text-center text-[clamp(1.45rem,2.9vw,2.6rem)] leading-[1.15] font-medium tracking-[-0.035em] text-balance max-sm:max-w-full">
            {SEGMENTS.map(({ mark, tokens }, k) => {
              const ids = tokens.filter((t) => t.word >= 0).map((t) => t.word);
              const fill = mark ? fillOf(ids[0], ids[ids.length - 1]) : "";
              const words = tokens.map(({ text, word }, j) => {
                if (word < 0) return text;
                const style: CSSProperties = {
                  opacity: `clamp(0.16, calc(0.16 + (var(--p) - ${wordAt(word).toFixed(4)}) * ${(1 / (STEP * 3)).toFixed(2)}), 1)`,
                };
                // Selected text inverts: each word turns ink as the marker reaches it.
                if (mark) style.color = `color-mix(in srgb, var(--ink) calc(clamp(0, ${fill} * ${ids.length} - ${word - ids[0]}, 1) * 100%), white)`;
                return (
                  <span key={j} style={style}>
                    {text}
                  </span>
                );
              });
              if (!mark) return <span key={k}>{words}</span>;
              // A green marker growing with the selection and a white block cursor at its edge. Unbroken
              // (sliced) backgrounds, so across a line wrap the sweep carries on in reading order.
              return (
                <span
                  key={k}
                  className="rounded-[3px] px-[0.08em]"
                  style={{
                    backgroundImage: "linear-gradient(#fff, #fff), linear-gradient(var(--primary), var(--primary))",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: `calc(${fill} * 100%) 60%, 0 60%`,
                    backgroundSize: `calc(clamp(0, min(${fill}, 1 - ${fill}) * 30, 1) * 0.14em) 82%, calc(${fill} * 100%) 82%`,
                  }}
                >
                  {words}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
