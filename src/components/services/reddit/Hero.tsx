"use client";

import { ChevronDown, ChevronUp, CornerDownRight } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { Mark, STAMP, TAG, Tick } from "../parts";
import { HERO, type Part, type Thread } from "./content";

const TURN = 5200; // ms each thread holds the spotlight

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The first viewport, centered on the warm hero panel, with a feed of three real conversations under the claim:
// a recommendation thread, a problem someone is solving, and an experience comparing options. In each, the
// helpful comment is useful first and mentions the product second, and the three differ on purpose (length,
// votes, age, and what sits under the comment) so they don't read as one template. The spotlight moves card to
// card, and the active one is unmistakable without being loud: it lifts and grows on a deep, soft shadow, its
// comment settles onto a faint green panel, the product and the useful part of the comment are picked out (a
// marker stroke under the product, a light tint on the point), and the thread line, the vertical line Reddit
// draws down a comment, lights up green from the vote arrows to the reply nested under it, while the other
// two sit back, quieter. Hovering a card holds the spotlight on it. Reduced motion: all three, finished and still.
export default function Hero() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  // Turns taken so far; the thread in the spotlight is turn % 3, and each turn replays its moment. A hover holds it.
  const [turn, setTurn] = useState(0);
  const [pin, setPin] = useState<number | null>(null);
  const k = pin ?? turn % HERO.threads.length;
  const stamp = pin === null ? turn : -(pin + 1); // changes whenever the spotlight changes, so the moment replays

  useEffect(() => {
    if (!seen || still || pin !== null) return;
    const id = setTimeout(() => setTurn((v) => v + 1), TURN);
    return () => clearTimeout(id);
  }, [seen, still, pin, turn]);

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
          aria-label={`Example Reddit threads in ${HERO.threads.map((t) => t.sub).join(", ")}, each a different kind of conversation, where a helpful comment mentions your product.`}
          className="mt-14 grid gap-4 sm:mt-16 md:grid-cols-3 md:items-start md:gap-5 md:pt-5"
        >
          {HERO.threads.map((t, i) => (
            <div key={t.sub} aria-hidden="true" onPointerEnter={() => setPin(i)} onPointerLeave={() => setPin(null)}>
              <ThreadCard thread={t} on={still || k === i} quiet={!still && k !== i} play={seen && !still && k === i} stamp={stamp} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/** One thread: its question, the helpful comment (with the product and its point picked out), and what sits under it. */
function ThreadCard({ thread: t, on, quiet, play, stamp }: { thread: Thread; on: boolean; quiet: boolean; play: boolean; stamp: number }) {
  return (
    <article
      className={`relative rounded-[14px] bg-white text-left transition-[opacity,translate,scale,box-shadow,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        on && !quiet
          ? "z-10 shadow-[0_0_0_1px_rgb(15_26_20/0.07),0_2px_4px_rgb(15_26_20/0.04),0_36px_70px_-26px_rgb(15_26_20/0.3)] md:-translate-y-3 md:scale-[1.03]"
          : quiet
            ? "scale-[0.985] opacity-65 shadow-[0_0_0_1px_rgb(15_26_20/0.05),0_6px_16px_-8px_rgb(15_26_20/0.08)] saturate-[0.65]"
            : "shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_8px_24px_-12px_rgb(15_26_20/0.14)]"
      }`}
    >
      <div className="border-b border-line px-4 pt-4 pb-3">
        <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/70">
          <Mark name="reddit" className="size-4" />
          {t.sub}
          <span className="ml-auto font-normal text-ink/40">
            {t.meta.score} · {t.meta.comments} comments
          </span>
        </p>
        <p className="mt-1.5 text-[13.5px] leading-snug font-medium tracking-[-0.01em] text-ink">{t.title}</p>
      </div>

      {/* Replays from the start each time this thread takes the spotlight. */}
      <div key={play ? stamp : "rest"} className={`flex gap-3 rounded-b-[14px] px-4 pt-3.5 pb-4 transition-colors duration-700 motion-reduce:transition-none ${on ? "bg-[color-mix(in_srgb,var(--primary)_5%,white)]" : ""}`}>
        <div className="flex w-7 shrink-0 flex-col items-center text-ink/35">
          <ChevronUp className={`size-4 transition-[color,translate] duration-500 ${on ? "-translate-y-0.5 text-[#ff4500]" : ""}`} strokeWidth={2.4} />
          <Votes from={t.reply.from} to={t.reply.votes} play={play} />
          <ChevronDown className="size-4" strokeWidth={2.4} />
          {/* The thread line, running the rest of the comment: it draws down in green when this thread is active. */}
          <span aria-hidden="true" className="relative mt-1.5 w-0.5 flex-1 rounded-full bg-ink/10">
            <span
              style={{ transitionDelay: on ? "600ms" : "0ms" }}
              className={`absolute inset-0 origin-top rounded-full bg-primary transition-transform duration-[1400ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${on ? "scale-y-100" : "scale-y-0"}`}
            />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] text-ink/55">{t.reply.user}</span>
            <span className="text-[11px] text-ink/35">{t.reply.age}</span>
            {t.reply.badge === "Top comment" && (
              <span className={STAMP} style={arrive(play, 1100)}>
                <Tick className="size-3" />
                Top comment
              </span>
            )}
            {t.reply.badge === "OP replied" && (
              <span className={`${TAG} border border-line bg-white text-ink/65`} style={arrive(play, 1100)}>
                <CornerDownRight className="size-3" strokeWidth={2.2} />
                OP replied
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink/80">
            {t.reply.parts.map((p, i) => (
              <Piece key={i} part={p} on={on} />
            ))}
          </p>

          {"replies" in t.under ? (
            <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-ink/45" style={arrive(play, 1500)}>
              <ChevronDown className="size-3.5" strokeWidth={2.4} />
              {t.under.replies} replies
            </p>
          ) : (
            <div className={`mt-3 border-l-2 pl-3 transition-colors duration-700 motion-reduce:transition-none ${on ? "border-primary/70" : "border-line"}`} style={{ ...arrive(play, 1500), transitionDelay: on ? "1400ms" : "0ms" }}>
              <p className="flex items-center gap-1.5 text-[11px] text-ink/50">
                {t.under.user}
                {t.under.op && <span className="rounded-[3px] bg-ink/[0.06] px-1 text-[9.5px] font-medium tracking-[0.04em] text-ink/55 uppercase">OP</span>}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-ink/70">{t.under.text}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** A stretch of the comment. Plain text, or highlighted once the card is active: the product in solid green, the useful part in a softer one. */
function Piece({ part, on }: { part: Part; on: boolean }) {
  if (!part.mark) return <>{part.t}</>;
  const product = part.mark === "product";
  // The product gets a marker stroke along the lower half of the word; the point a light tint behind the whole stretch.
  const tint = product ? "color-mix(in srgb, var(--primary) 46%, transparent)" : "color-mix(in srgb, var(--primary) 13%, transparent)";
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(${tint}, ${tint})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 100%",
        backgroundSize: on ? `100% ${product ? "55%" : "100%"}` : `0% ${product ? "55%" : "100%"}`,
        transitionDelay: on ? (product ? "350ms" : "800ms") : "0ms",
      }}
      className={`box-decoration-clone rounded-[3px] px-[2px] transition-[background-size] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${product ? "font-medium text-ink" : ""}`}
    >
      {part.t}
    </span>
  );
}

/** The comment's score: counts up from `from` to `to` while the thread plays, otherwise sits at `to`. */
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
