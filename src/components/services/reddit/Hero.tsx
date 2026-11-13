"use client";

import { ArrowBigDown, ArrowBigUp, Ellipsis, MessageSquare, Plus, Share } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { Mark, STAMP, Tick } from "../parts";
import { HERO, type Part, type Thread } from "./content";
import HeroBackdrop from "./HeroBackdrop";

// A word or result arriving: a short rise and fade.
const KEYFRAMES = `
@keyframes arrive { from { opacity: 0; transform: translateY(3px); } }
`;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// Where each slot sits on the stage, as a fraction of the card's width: the middle card is the focal point and the
// two outer ones sit back (a little smaller, a little lower, turned a few degrees toward it), tucked under its edges.
const SLOT = [
  { x: -0.94, y: 30, r: -2.4, s: 0.93 },
  { x: 0, y: 0, r: 0, s: 1 },
  { x: 0.94, y: 30, r: 2.4, s: 0.93 },
];
const EASE = "cubic-bezier(0.22,1,0.36,1)";

// Each commenter's avatar colour, as Reddit hands them out.
const AVATAR = [["#ff6a3d", "#b5391a"], ["#5b8def", "#2c58b4"], ["#3fb985", "#1f7a55"], ["#9a7be8", "#5f45a8"], ["#f2b134", "#a8741a"], ["#37b6c4", "#1d7480"]];

// The first viewport: the claim centred on the page (label, headline, body, one button) and under it three real-looking
// Reddit threads (see ThreadCard). The middle one is lit from the start; the other two sit back, still fully legible.
// Moving onto a side card (or tapping it, on touch) glides it into the middle and sends the old middle card out to
// its place, and the card now in the middle is the one that draws its highlights. There is no timer: nothing moves
// until the visitor does. Reduced motion: the same, with the swap instant.
export default function Hero() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  // The thread in each slot (left, middle, right), and how many swaps so far (so a card replays its moment).
  const [slots, setSlots] = useState([0, 1, 2]);
  const [swaps, setSwaps] = useState(0);
  const [lit, setLit] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const locked = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  const activate = (i: number) => {
    if (locked.current) return;
    const s = slots.indexOf(i);
    if (s === 1) return;
    locked.current = true; // the old middle card slides in under a still pointer; don't swap straight back
    setTimeout(() => (locked.current = false), 900);
    setSlots((v) => v.map((c, n) => (n === s ? v[1] : n === 1 ? i : c)));
    setLit(i);
    setSwaps((n) => n + 1);
  };
  // A mouse has to rest on a side card a moment, so sweeping across the row does not shuffle it.
  const intent = (i: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => activate(i), 120);
  };

  return (
    <section className="relative isolate overflow-hidden px-4 pt-24 pb-14 sm:px-8 sm:pt-28 lg:pb-20">
<style href="reddit-hero" precedence="default">{KEYFRAMES}</style>
      <HeroBackdrop />
      <div className="mx-auto max-w-[84rem]">
        <div className="mx-auto flex max-w-[50rem] flex-col items-center px-3 pt-14 text-center sm:px-4 sm:pt-20">
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.3rem,4.6vw,4.1rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink">{HERO.title}</h1>
          <p className="mt-6 max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
          <div className="mt-9">
            <ArcButton href="#contact" arrow tone="primary">
              {HERO.cta}
            </ArcButton>
          </div>
        </div>

        <div className="@container mt-14 sm:mt-16">
          <div
            ref={ref}
            role="img"
            aria-label={`Example Reddit threads in ${HERO.threads.map((t) => t.sub).join(", ")}, each a different kind of conversation, where a helpful comment mentions your product.`}
            style={{ "--w": "min(30rem, 34.5cqw)" } as CSSProperties}
            className="flex flex-col items-center gap-4 lg:grid lg:justify-items-center lg:pb-10"
          >
            {HERO.threads.map((t, i) => {
              const slot = slots.indexOf(i);
              const p = SLOT[slot];
              return (
                <article
                  key={t.sub}
                  aria-hidden="true"
                  onPointerEnter={(e) => e.pointerType === "mouse" && intent(i)}
                  onPointerLeave={() => clearTimeout(timer.current)}
                  onClick={() => activate(i)}
                  style={
                    {
                      "--x": `calc(var(--w) * ${p.x})`,
                      "--y": `${p.y}px`,
                      "--r": `${p.r}deg`,
                      "--s": p.s,
                      zIndex: slot === 1 ? 20 : 10,
                      transition: `translate 850ms ${EASE}, rotate 850ms ${EASE}, scale 850ms ${EASE}, box-shadow 700ms ease, z-index 0s 280ms`,
                    } as CSSProperties
                  }
                  className={`relative w-full max-w-[32rem] cursor-default text-left lg:w-(--w) lg:max-w-none lg:self-start lg:[grid-area:1/1] lg:[rotate:var(--r)] lg:[scale:var(--s)] lg:[translate:var(--x)_var(--y)] motion-reduce:![transition:none] ${
                    lit === i
                      ? "shadow-[0_0_0_1px_rgb(15_26_20/0.07),0_2px_4px_rgb(15_26_20/0.04),0_44px_80px_-34px_rgb(15_26_20/0.34)]"
                      : "shadow-[0_0_0_1px_rgb(15_26_20/0.06),0_16px_32px_-22px_rgb(15_26_20/0.2)]"
                  } rounded-[20px] bg-white`}
                >
                  <div className="motion-safe:animate-fade-up" style={{ animationDelay: `${0.3 + (i === 1 ? 0 : 0.12)}s` }}>
                    <ThreadCard thread={t} i={i} on={lit === i} play={seen && !still && lit === i} stamp={swaps} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A default Reddit avatar: the snoo on a coloured disc. */
function Avatar({ n, className = "size-7" }: { n: number; className?: string }) {
  const [bg, eye] = AVATAR[n % AVATAR.length];
  return (
    <svg viewBox="0 0 28 28" className={`${className} shrink-0`} aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill={bg} />
      <path d="M14 10.2 15.2 6l3.4.9" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19.6" cy="6.8" r="1.5" fill="#fff" />
      <circle cx="7.6" cy="13.2" r="2.1" fill="#fff" />
      <circle cx="20.4" cy="13.2" r="2.1" fill="#fff" />
      <ellipse cx="14" cy="16.4" rx="7.4" ry="5.6" fill="#fff" />
      <circle cx="11.2" cy="15.6" r="1.25" fill={eye} />
      <circle cx="16.8" cy="15.6" r="1.25" fill={eye} />
      <path d="M11.4 18.6q2.6 1.7 5.2 0" fill="none" stroke={eye} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** "4h" the way Reddit writes it: "4 hr. ago", "1 day ago", "2 days ago". */
const ago = (a: string) => {
  const n = parseInt(a, 10);
  return a.endsWith("h") ? `${n} hr. ago` : `${n} ${n === 1 ? "day" : "days"} ago`;
};

/** One thread as Reddit draws it: the post (community, age, title, votes, comments), then the helpful comment with its reply under it. */
function ThreadCard({ thread: t, i, on, play, stamp }: { thread: Thread; i: number; on: boolean; play: boolean; stamp: number }) {
  return (
    <>
      <div className="px-5 pt-4 pb-4">
        <p className="flex items-center gap-2 text-[12.5px] text-ink/55">
          <Mark name="reddit" className="size-7" />
          <span className="font-semibold text-ink">{t.sub}</span>
          <span aria-hidden="true">•</span>
          <span>{ago(t.meta.age)}</span>
          <Ellipsis className="ml-auto size-[18px] text-ink/40" />
        </p>
        <p className="mt-3 text-[17px] leading-snug font-semibold tracking-[-0.015em] text-ink">{t.title}</p>
        <div className="mt-3.5 flex items-center gap-2 text-[12.5px] font-semibold text-ink/65">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-ink/[0.05] px-1.5 py-1">
            <ArrowBigUp className="size-[18px]" strokeWidth={1.8} />
            <span className="px-0.5 tabular-nums">{t.meta.score}</span>
            <ArrowBigDown className="size-[18px]" strokeWidth={1.8} />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-3 py-1.5">
            <MessageSquare className="size-4" strokeWidth={1.8} />
            {t.meta.comments}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-3 py-1.5">
            <Share className="size-4" strokeWidth={1.8} />
            Share
          </span>
        </div>
      </div>

      {/* The comment. It replays from the start each time this thread takes the middle. */}
      <div key={play ? stamp : "rest"} className={`rounded-b-[20px] border-t border-line px-5 pt-4 pb-5 transition-colors duration-700 motion-reduce:transition-none ${on ? "bg-[color-mix(in_srgb,var(--primary)_5%,white)]" : ""}`}>
        <div className="flex gap-3">
          <div className="flex w-7 shrink-0 flex-col items-center">
            <Avatar n={i * 2} />
            {/* Reddit's thread line, down the whole comment: it draws in green when this thread is in the middle. */}
            <span aria-hidden="true" className="relative mt-1.5 w-0.5 flex-1 rounded-full bg-ink/10">
              <span
                style={{ transitionDelay: on ? "600ms" : "0ms" }}
                className={`absolute inset-0 origin-top rounded-full bg-primary transition-transform duration-[1400ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${on ? "scale-y-100" : "scale-y-0"}`}
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-ink/55">
              <span className="font-semibold text-ink">{t.reply.user}</span>
              <span aria-hidden="true">•</span>
              <span>{ago(t.reply.age)}</span>
              {t.reply.badge === "Top comment" && (
                <span className={`${STAMP} ml-1`} style={arrive(play, 1100)}>
                  <Tick className="size-3" />
                  Top comment
                </span>
              )}
              {t.reply.badge === "OP replied" && (
                <span className="ml-1 rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-ink/65" style={arrive(play, 1100)}>
                  OP replied
                </span>
              )}
            </p>
            <p className="mt-2 text-[14px] leading-[1.6] text-ink/85">
              {t.reply.parts.map((p, n) => (
                <Piece key={n} part={p} on={on} />
              ))}
            </p>
            <div className="mt-2.5 -ml-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-ink/55">
              <span className="inline-flex items-center gap-0.5 px-1">
                <ArrowBigUp className={`size-[18px] transition-colors duration-500 ${on ? "fill-[#ff4500] text-[#ff4500]" : ""}`} strokeWidth={1.8} />
                <Votes from={t.reply.from} to={t.reply.votes} play={play} on={on} />
                <ArrowBigDown className="size-[18px]" strokeWidth={1.8} />
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1">
                <MessageSquare className="size-4" strokeWidth={1.8} />
                Reply
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1">
                <Share className="size-4" strokeWidth={1.8} />
                Share
              </span>
            </div>

            {"replies" in t.under ? (
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink/55" style={arrive(play, 1500)}>
                <Plus className="size-4" strokeWidth={2.2} />
                {t.under.replies} more replies
              </p>
            ) : (
              <div className="mt-3 flex gap-2.5" style={arrive(play, 1500)}>
                <Avatar n={i * 2 + 1} className="size-[22px]" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[12px] text-ink/55">
                    <span className="font-semibold text-ink">{t.under.user}</span>
                    {t.under.op && <span className="text-[11px] font-bold text-[#0d6cc5]">OP</span>}
                    <span aria-hidden="true">•</span>
                    <span>{ago(t.under.age)}</span>
                  </p>
                  <p className="mt-1 text-[13.5px] leading-snug text-ink/80">{t.under.text}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** A stretch of the comment. Plain text, or highlighted once the card is active: the product in solid green, the useful part in a softer one. */
export function Piece({ part, on }: { part: Part; on: boolean }) {
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
function Votes({ from, to, play, on }: { from: number; to: number; play: boolean; on: boolean }) {
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
  return <span className={`px-0.5 tabular-nums transition-colors duration-500 ${on ? "text-[#ff4500]" : "text-ink"}`}>{n}</span>;
}

/** A short rise-and-fade arrival after `delay` ms when `play`; otherwise it's simply there. */
const arrive = (play: boolean, delay: number): CSSProperties | undefined =>
  play ? { animation: `arrive 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms both` } : undefined;
