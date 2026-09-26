"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useState } from "react";

// Adapted from React Bits <RotatingText />: cycles through words, flipping each
// letter up on a spring with a stagger. The container animates its width
// (layout) so it glides to fit each word. Only the features we use are kept.

const SPRING: Transition = { type: "spring", damping: 30, stiffness: 400 };

type Props = {
  texts: string[];
  /** Milliseconds each word stays. */
  interval?: number;
  /** Seconds between letters. */
  stagger?: number;
  /** Classes for the container (e.g. the pill). */
  className?: string;
};

const graphemes = (text: string) => Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text), (s) => s.segment);

export default function RotatingText({ texts, interval = 2600, stagger = 0.025, className = "" }: Props) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % texts.length), interval);
    return () => clearInterval(id);
  }, [texts.length, interval, reduced]);

  // Each word's letters plus the running letter offset, for the stagger.
  const words = texts[index].split(" ").map((w) => graphemes(w));
  const starts = words.map((_, w) => words.slice(0, w).reduce((n, chars) => n + chars.length, 0));
  const total = words.reduce((n, chars) => n + chars.length, 0);

  return (
    <motion.span layout transition={SPRING} className={`relative inline-flex overflow-hidden whitespace-pre ${className}`}>
      <span className="sr-only">{texts[index]}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={index} layout aria-hidden="true" className="inline-flex">
          {words.map((chars, w) => {
            const start = starts[w];
            return (
              <span key={w} className="inline-flex overflow-hidden pb-[0.08em]">
                {chars.map((char, c) => (
                  <motion.span
                    key={c}
                    className="inline-block"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    // Stagger from the last letter, as in the reference.
                    transition={{ ...SPRING, delay: (total - 1 - (start + c)) * stagger }}
                  >
                    {char}
                  </motion.span>
                ))}
                {w < words.length - 1 && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
