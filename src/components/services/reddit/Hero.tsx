"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { Mark, STAMP, Tick } from "../parts";
import { HERO, type Thread } from "./content";

const TURN = 3800; // ms each thread holds the spotlight

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The first viewport, centered on the warm hero panel, with a feed of three real-looking threads from three
// communities under the claim. In each, a helpful technical reply recommends your product in context, and
// someone follows up. Every card is complete from the first frame; a spotlight then moves card to card, and
// the active thread plays out: its votes climb, it earns "Top comment", the follow-up arrives. The middle
// card sits a little forward for depth. Reduced motion: all three threads, finished and still.
export default function Hero() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  // Turns taken so far; the thread in the spotlight is turn % 3, and each turn replays its moment.
  const [turn, setTurn] = useState(0);
  const k = turn % HERO.threads.length;

  useEffect(() => {
    if (!seen || still) return;
    const id = setTimeout(() => setTurn((v) => v + 1), TURN);
    return () => clearTimeout(id);
  }, [seen, still, turn]);

  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="mx-auto max-w-[76rem] rounded-2xl bg-[#f9f8f4] px-4 pt-14 pb-10 sm:px-10 sm:pt-20 sm:pb-14">
        <div className="mx-auto flex max-w-[50rem] flex-col items-center text-center">
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.3rem,4.6vw,4.1rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink">{HERO.title}</h1>
          <p className="mt-6 max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
          <div className="mt-9">
            <ArcButton href="#contact" arrow tone="primary">
              {HERO.cta}
            </ArcButton>
          </div>
        </div>

        <div
          ref={ref}
          role="img"
          aria-label="Example threads in r/devops, r/LocalLLaMA and r/MachineLearning where a helpful reply recommends your product and becomes the top comment."
          className="mt-14 grid gap-3 sm:mt-16 md:grid-cols-3 md:items-start md:gap-4 md:pt-4"
        >
          {HERO.threads.map((t, i) => (
            // The middle thread sits a step forward, so the row has a front and a back.
            <div key={t.sub} aria-hidden="true" className={i === 1 ? "md:-translate-y-4" : ""}>
              <ThreadCard thread={t} on={still || k === i} play={seen && !still && k === i} turn={turn} front={i === 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** One thread: the question, the reply that recommends your product, and a follow-up under it. */
function ThreadCard({ thread: t, on, play, turn, front }: { thread: Thread; on: boolean; play: boolean; turn: number; front: boolean }) {
  const [before, after] = t.reply.text.split(t.reply.mention);
  return (
    <article
      className={`rounded-[14px] border border-line bg-white text-left transition-[opacity,translate,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        on
          ? "-translate-y-1 opacity-100 shadow-[0_1px_1.6px_rgb(15_26_20/0.05),0_18px_40px_rgb(15_26_20/0.12)]"
          : `opacity-70 ${front ? "shadow-[0_1px_1.6px_rgb(15_26_20/0.05),0_14px_32px_rgb(15_26_20/0.09)]" : "shadow-[0_1px_1.6px_rgb(15_26_20/0.04),0_8px_24px_rgb(15_26_20/0.06)]"}`
      }`}
    >
      <div className="border-b border-line px-4 pt-3.5 pb-3">
        <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/70">
          <Mark name="reddit" className="size-4" />
          {t.sub}
        </p>
        <p className="mt-1.5 text-[13.5px] leading-snug font-medium tracking-[-0.01em] text-ink">{t.title}</p>
      </div>

      {/* Replays from the start each time this thread takes the spotlight. */}
      <div key={play ? turn : "rest"} className="flex gap-3 px-4 pt-3.5 pb-4">
        <div className="flex w-7 shrink-0 flex-col items-center text-ink/35">
          <ChevronUp className={`size-4 ${on ? "text-[#ff4500]" : ""}`} strokeWidth={2.4} />
          <Votes from={t.reply.from} to={t.reply.votes} play={play} />
          <ChevronDown className="size-4" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-ink/50">{t.reply.user}</span>
            <span className={STAMP} style={arrive(play, 900)}>
              <Tick className="size-3" />
              Top comment
            </span>
          </p>
          <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink/80">
            {before}
            <span className="rounded-[4px] bg-[color-mix(in_srgb,var(--light-green-soft)_70%,white)] px-1 font-medium text-ink">{t.reply.mention}</span>
            {after}
          </p>
          <div className="mt-3 border-l-2 border-line pl-3" style={arrive(play, 1300)}>
            <p className="text-[11px] text-ink/50">{t.followUp.user}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink/70">{t.followUp.text}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

/** The reply's score: counts up from `from` to `to` while the thread plays, otherwise sits at `to`. */
function Votes({ from, to, play }: { from: number; to: number; play: boolean }) {
  const [n, setN] = useState(play ? from : to);
  useEffect(() => {
    if (!play) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0 - 250) / 1200);
      setN(Math.round(from + (to - from) * (1 - (1 - Math.max(0, k)) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [play, from, to]);
  return <span className="my-0.5 text-[12px] font-semibold text-ink tabular-nums">{n}</span>;
}

/** A short rise-and-fade arrival after `delay` ms when `play`; otherwise it's simply there. */
const arrive = (play: boolean, delay: number): CSSProperties | undefined =>
  play ? { animation: `arrive 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms both` } : undefined;
