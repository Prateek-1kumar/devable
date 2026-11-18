"use client";

import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { useState } from "react";
import { QUOTES, type Quote } from "./content";

// Three client quotes taking turns. Each one rises in word by word with a whisper of blur (the homepage ClientProof
// motion) and plays for HOLD seconds while its hairline fills; then the next comes in. The three hairlines are also the
// controls. All quotes sit stacked in one grid cell (the hidden ones only for sizing), so the block holds the height
// of the longest and nothing below it jumps. Reduced motion never autoplays.

const HOLD = 8;
const EASE = [0.22, 1, 0.36, 1] as const;

const words: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.012 } },
  exit: { opacity: 0, filter: "blur(2px)", transition: { duration: 0.22, ease: "easeIn" } },
};
const word: Variants = {
  enter: { opacity: 0, y: "0.35em", filter: "blur(3px)" },
  center: { opacity: 1, y: "0em", filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
};
const fade: Variants = {
  enter: { opacity: 0, y: 4 },
  center: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

function Avatar({ q }: { q: Quote }) {
  return q.photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- small fixed-size avatar
    <img src={q.photo} alt="" className="size-9 rounded-full object-cover grayscale" />
  ) : (
    <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-ink/[0.07] text-[0.72rem] font-medium tracking-wide text-ink/70">
      {q.initials}
    </span>
  );
}

// `live` is the shown quote (word-split, animated); the sizing copies are plain text. The live tree is the same
// with or without reduced motion, so server and browser render identical markup; reduced motion only skips the
// entrance (MotionConfig below turns the transitions off).
const Mark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 18" className="mb-4 h-[14px] w-auto text-primary">
    <path fill="currentColor" d="M0 18V10.6C0 4.7 3.3 1.1 9 0l1 2.4C6.9 3.4 5.4 5.6 5.2 8.4H9.6V18H0Zm14.4 0V10.6C14.4 4.7 17.7 1.1 23.4 0l1 2.4c-3.1 1-4.6 3.2-4.8 6H24V18h-9.6Z" />
  </svg>
);

function Body({ q, live }: { q: Quote; live: boolean }) {
  const text = `\u201C${q.quote}\u201D`;
  const quote = "text-[clamp(0.98rem,1.15vw,1.1rem)] leading-[1.55] tracking-[-0.01em] text-pretty text-ink";
  const caption = (
    <>
      <Avatar q={q} />
      <span className="min-w-0 flex-1 text-[0.9rem] leading-snug">
        <span className="block font-medium text-ink">{q.name ?? q.company}</span>
        <span className="block text-ink/50">
          {q.role}, {q.company}
        </span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo at its natural aspect */}
      <img src={q.logo} alt={q.company} className="h-5 w-auto shrink-0 opacity-70 grayscale" />
    </>
  );
  if (!live)
    return (
      <div>
        <Mark />
        <blockquote className={quote}>{text}</blockquote>
        <div className="mt-4 flex items-center gap-3">{caption}</div>
      </div>
    );
  return (
    <motion.div variants={words} initial="enter" animate="center" exit="exit">
      <motion.div variants={fade}>
        <Mark />
      </motion.div>
      <blockquote className={quote}>
        {text.split(" ").map((w, i) => (
          <motion.span key={i} variants={word} className="inline-block whitespace-pre">
            {w}{" "}
          </motion.span>
        ))}
      </blockquote>
      <motion.div variants={fade} className="mt-4 flex items-center gap-3">
        {caption}
      </motion.div>
    </motion.div>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const next = () => setActive((a) => (a + 1) % QUOTES.length);

  return (
    <MotionConfig reducedMotion="user">
    <figure aria-roledescription="carousel" aria-label="What clients say" className="relative">

      <div className="grid">
        {QUOTES.map((q, i) => (
          <div key={i} aria-hidden="true" className="invisible col-start-1 row-start-1 self-end">
            <Body q={q} live={false} />
          </div>
        ))}
        <div aria-live="polite" className="col-start-1 row-start-1 self-end">
          <AnimatePresence mode="wait" initial={false}>
            <Body key={active} q={QUOTES[active]} live />
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 flex gap-2" role="group" aria-label="Choose a quote">
        {QUOTES.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Quote ${i + 1} of ${QUOTES.length}: ${q.company}`}
            aria-current={i === active}
            className="group relative h-6 w-10 outline-none"
          >
            <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-ink/12 transition-colors group-hover:bg-ink/25 group-focus-visible:bg-ink/35">
              {i === active && (
                <span
                  key={active}
                  onAnimationEnd={next}
                  className="absolute inset-0 origin-left rounded-full bg-ink motion-safe:animate-[quote-fill_var(--hold)_linear_both] motion-reduce:scale-x-100"
                  style={{ ["--hold" as string]: `${HOLD}s` }}
                />
              )}
            </span>
          </button>
        ))}
      </div>
      <style href="book-quote-fill" precedence="default">{`@keyframes quote-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </figure>
    </MotionConfig>
  );
}
