"use client";

import { motion } from "motion/react";
import ChannelParagraph from "../ChannelParagraph";
import { CHANNELS } from "../growth-engine/channels";
import { MARKS } from "../growth-engine/marks";
import WaveButton from "../WaveButton";
import type { Bind } from "./MissionHud";
import { OUTCOME, STATIONS } from "./timeline";

// The hero's words. The intro block (the page H1) opens the sequence and stays
// in the DOM; each beat then gets one caption: an index line, a title and a
// short body. The loop in MissionHero writes the live parts (lit marks, the
// pipeline number) straight to the nodes registered here.


const rise = "animate-fade-up motion-reduce:animate-none";
const EASE = [0.22, 1, 0.36, 1] as const;
const MONO = "font-mono uppercase tracking-[0.12em] tabular-nums";

type Caption = { index: string; title: string; body?: string; extra?: "marks" | "outcome" };
const CAPTIONS: Record<number, Caption> = {
  1: { index: "01 / 07 · TERMINAL COUNT", title: "Integrated. Go for launch.", body: "Your product rides on top. Devable carries it, with four channel systems latched on." },
  2: { index: "02 / 07 · LAUNCH", title: "A launch is a burst.", body: "Show HN, the creator drop, the announcement, sequenced to the hour. It gets you off the pad." },
  3: { index: "03 / 07 · TRAJECTORY", title: "Most launches are suborbital.", body: "A spike, then gravity. We plan the path to orbit before anything lights." },
  4: {
    index: "04 / 07 · DEPLOY",
    title: "Four systems. One mission.",
    body: "Technical content, SEO and AI search, Reddit and creators deploy together, on one craft that stays in orbit with your product.",
  },
  5: { index: "05 / 07 · DOWNLINK", title: "In contact where developers look.", body: "Every pass puts your product in front of them again.", extra: "marks" },
  6: {
    index: "06 / 07 · COURSE CORRECTION",
    title: "Measured every day. Corrected every week.",
    body: "Telemetry from every channel steers the next burn: what ranks, what gets cited, what converts.",
  },
  7: { index: "07 / 07 · SUSTAINED ORBIT", title: "Launches spike. Orbits compound.", extra: "outcome" },
};

function Mark({ mark, size }: { mark: keyof typeof MARKS; size: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d={MARKS[mark]} />
    </svg>
  );
}

function Ctas() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <WaveButton href="#contact">Speak with the team</WaveButton>
      <WaveButton href="#case-studies" tone="secondary">
        View case studies
      </WaveButton>
    </div>
  );
}

type Props = {
  /** Which caption shows: 0 the intro, 2..7 a beat, -1 none. */
  caption: number;
  /** Pinned, scroll-driven mode (desktop with motion). */
  pinned: boolean;
  bind: Bind;
};

export default function MissionCopy({ caption, pinned, bind }: Props) {
  const intro = !pinned || caption === 0;
  return (
    <div className="relative z-10 max-w-[38rem] text-foreground">
      <motion.div initial={false} animate={{ opacity: intro ? 1 : 0, y: intro ? 0 : -16 }} transition={{ duration: 0.45, ease: EASE }}>
        {/* Light, precise type: the weight comes from size and tracking, not boldness. */}
        <h1 id="hero-title" className={`text-[clamp(2.6rem,4.6vw,4.4rem)] leading-[1.02] font-normal tracking-[-0.045em] ${rise}`} style={{ animationDelay: "0.1s" }}>
          Growth Marketing for AI&#8209;Native DevTools and Platforms
        </h1>
        {/* Once the intro has faded, its channel words and buttons leave the tab order (the H1 stays readable). */}
        <div inert={!intro}>
          <ChannelParagraph
            className={`mt-6 max-w-[30rem] text-lg leading-relaxed tracking-[-0.01em] text-foreground/60 sm:text-xl ${rise}`}
            style={{ animationDelay: "0.25s" }}
          />
          <div className={`mt-10 ${rise}`} style={{ animationDelay: "0.4s" }}>
            <Ctas />
          </div>
          <p aria-hidden="true" className={`mt-8 hidden items-center gap-2.5 ${MONO} text-[11px] text-foreground/45 motion-safe:lg:flex ${rise}`} style={{ animationDelay: "0.55s" }}>
            <svg viewBox="0 0 8 12" width="8" height="12" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 0v11M0.5 7.5 4 11l3.5-3.5" />
            </svg>
            Scroll to begin countdown
          </p>
        </div>
      </motion.div>

      {pinned && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          {/* Every caption is stacked in one grid cell and shown by a CSS state, so a fast glide through
              several beats (an anchor link) can never leave a stale caption behind. */}
          <div className="grid">
            {Object.entries(CAPTIONS).map(([id, c]) => {
              const on = caption === Number(id);
              return (
                <div
                  key={id}
                  data-on={on}
                  inert={!on}
                  className="invisible translate-y-3.5 self-center opacity-0 transition-[opacity,translate,visibility] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] [grid-area:1/1] data-[on=true]:visible data-[on=true]:translate-y-0 data-[on=true]:opacity-100 data-[on=true]:delay-150 data-[on=true]:duration-550"
                >
                  <div aria-hidden="true">
                    <p className={`${MONO} text-[11px] text-foreground/45`}>{c.index}</p>
                    <p className="mt-5 max-w-[30rem] text-[clamp(2rem,3.4vw,3.2rem)] leading-[1.05] font-normal tracking-[-0.035em] text-balance">{c.title}</p>
                    {c.body && <p className="mt-4 max-w-[26rem] text-lg leading-relaxed text-foreground/60">{c.body}</p>}
                    {c.extra === "marks" && <MarksRow bind={bind} />}
                  </div>
                  {c.extra === "outcome" && (
                    <div className="mt-8">
                      <p aria-hidden="true" className="flex items-baseline gap-4">
                        <span ref={bind("outcome")} className="text-[clamp(4rem,7vw,6.5rem)] leading-none tracking-[-0.05em] tabular-nums">
                          +{OUTCOME}%
                        </span>
                        <span className={`${MONO} text-[12px] text-foreground/50`}>pipeline growth · illustrative</span>
                      </p>
                      <div className="mt-9">
                        <Ctas />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ol className="sr-only">
            {Object.values(CAPTIONS).map((c) => (
              <li key={c.index}>
                {c.title} {c.body} {c.extra === "outcome" ? `+${OUTCOME}% pipeline growth (illustrative).` : ""}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Beat 5: the five platforms, lighting up as the craft first makes contact with each. */
function MarksRow({ bind }: { bind: Bind }) {
  return (
    <ul className="mt-7 flex items-center gap-6 text-foreground">
      {STATIONS.map((s, k) => (
        <li
          key={s.mark}
          ref={bind(`mark${k}`)}
          data-lit="false"
          className="group flex flex-col items-center gap-2.5"
        >
          <span className="opacity-25 transition-opacity duration-500 group-data-[lit=true]:opacity-100">
            <Mark mark={s.mark} size={20} />
          </span>
          <span className="sr-only">{s.name}</span>
          <span
            className="h-[2px] w-5 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[lit=true]:scale-x-100"
            style={{ background: CHANNELS[s.channel].color }}
          />
        </li>
      ))}
    </ul>
  );
}

/** Phones and reduced motion: the channel key, the platforms and the outcome, under the still frame. */
export function StillExtras({ className = "" }: { className?: string }) {
  return (
    <div className={`max-w-[38rem] ${className}`}>
      <ul className={`grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 ${MONO} text-[11px] text-foreground/60`}>
        {CHANNELS.map((c) => (
          <li key={c.n} className="flex items-center gap-2.5">
            <span className="h-[2px] w-2 shrink-0" style={{ background: c.color }} />
            <span>
              {c.n} {c.name} <span className="normal-case">· {c.cap}</span>
            </span>
          </li>
        ))}
      </ul>
      <ul className="mt-6 flex items-center gap-5 text-foreground/70">
        {STATIONS.map((s) => (
          <li key={s.mark}>
            <Mark mark={s.mark} size={16} />
            <span className="sr-only">{s.name}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-baseline gap-3">
        <span className="text-3xl tracking-[-0.03em] tabular-nums">+{OUTCOME}%</span>
        <span className={`${MONO} text-[11px] text-foreground/50`}>pipeline growth · illustrative</span>
      </p>
    </div>
  );
}

