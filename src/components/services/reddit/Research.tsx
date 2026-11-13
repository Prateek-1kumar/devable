"use client";

import NumberFlow from "@number-flow/react";
import { ArrowBigDown, ArrowBigUp, Bot, Brain, Check, Cpu, Ellipsis, Info, MessageSquare, Minus, Share, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Mark } from "../parts";
import { PANEL, show, useBeats } from "../search/scene";
import { STEPS } from "./content";
import { Avatar } from "./Hero";

// 01 · Find the conversations that matter: research, drawn as the Reddit window an analyst would actually have open,
// built to sit in half a row. Across the top the communities they have been in; under it the thread; under that the
// opportunity analysis. The communities are scanned one after another until it settles on the right one; its thread
// opens, and the analysis reads three signals off it (high intent, competitors are in the conversation, your product
// isn't), which add up to an opportunity score. The point is the reasoning: why this conversation, out of everything.
// Plays whenever this step is the active one. Reduced motion: the finished window.
const R = STEPS.journey.research;
// 1 window · 2, 3, 4 three communities scanned in turn · 5 the right one selected, its thread opens · 6 the comment · 7, 8, 9 the three signals · 10 opportunity
const TIMES = [200, 900, 1300, 1700, 2400, 3200, 3900, 4400, 4900, 5600];

// Each community's avatar, as it would be on Reddit.
const AVATARS: ReactNode[] = [
  <Mark key="ml" name="reddit" className="size-5" />,
  <span key="lm" className="grid size-5 place-items-center rounded-full bg-[#454b48]"><Brain className="size-3 text-white" strokeWidth={2} /></span>,
  <span key="ll" className="grid size-5 place-items-center rounded-full bg-[#e3e7e4]"><Cpu className="size-3 text-ink/70" strokeWidth={2} /></span>,
  <span key="ag" className="grid size-5 place-items-center rounded-full bg-[#5a605d]"><Bot className="size-3 text-white" strokeWidth={2} /></span>,
];

export default function Research({ on }: { on: boolean }) {
  const b = useBeats(on, TIMES);
  const opened = b >= 5;
  // The community lit now: while scanning it walks down the list, then settles on the first.
  const lit = b >= 5 ? 0 : b >= 4 ? 3 : b >= 3 ? 2 : b >= 2 ? 1 : -1;
  const p = R.post;
  const c = R.comment;

  return (
    <div aria-hidden="true" className="w-full max-w-[34rem] min-w-0">
      <div className={`${PANEL} overflow-hidden rounded-2xl ${show(b >= 1)}`}>
        {/* The window's top bar: Reddit, and the communities you've been in. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ink/[0.06] px-4 py-3">
          <p className="flex items-center gap-1.5">
            <Mark name="reddit" className="size-6" />
            <span className="text-[17px] font-bold tracking-[-0.04em] text-ink">reddit</span>
          </p>
          <ul className="flex flex-wrap items-center gap-1 sm:ml-auto">
            {R.recent.map((sub, i) => (
              <li
                key={sub}
                className={`flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1.5 text-[11.5px] transition-colors duration-500 motion-reduce:transition-none ${
                  lit === i ? (opened ? "bg-[color-mix(in_srgb,var(--primary)_14%,white)] font-medium text-ink" : "bg-ink/[0.06] text-ink") : "text-ink/60"
                }`}
              >
                {AVATARS[i]}
                {sub}
              </li>
            ))}
          </ul>
        </div>

        {/* The thread. Before it opens, the same shape in grey: the window is waiting on a community. */}
        <div className="grid px-4 pt-4 pb-4 sm:px-5">
          <div className={`[grid-area:1/1] transition-opacity duration-700 motion-reduce:transition-none ${opened ? "opacity-0" : "opacity-100"}`}>
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-full bg-ink/[0.07]" />
              <span className="h-2.5 w-28 rounded-full bg-ink/[0.07]" />
            </div>
            <div className="mt-3.5 space-y-2">
              <span className="block h-3 w-full rounded-full bg-ink/[0.07]" />
              <span className="block h-3 w-4/5 rounded-full bg-ink/[0.07]" />
            </div>
            <div className="mt-4 flex gap-2">
              <span className="h-7 w-16 rounded-full bg-ink/[0.05]" />
              <span className="h-7 w-14 rounded-full bg-ink/[0.05]" />
            </div>
            <div className="mt-5 flex gap-2.5">
              <span className="size-7 shrink-0 rounded-full bg-ink/[0.07]" />
              <div className="flex-1 space-y-2 pt-1.5">
                <span className="block h-2.5 w-4/5 rounded-full bg-ink/[0.06]" />
                <span className="block h-2.5 w-3/5 rounded-full bg-ink/[0.06]" />
              </div>
            </div>
          </div>

          <div className={`[grid-area:1/1] transition-opacity duration-700 motion-reduce:transition-none ${opened ? "opacity-100" : "opacity-0"}`}>
            <p className="flex items-center gap-2 text-[12px] text-ink/55">
              <Mark name="reddit" className="size-7" />
              <span className="font-semibold text-ink">{p.sub}</span>
              <span>•</span>
              <span>{p.age}</span>
              <Ellipsis className="ml-auto size-4 text-ink/40" />
            </p>
            <p className="mt-2.5 text-[16px] leading-snug font-semibold tracking-[-0.015em] text-ink">{p.title}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-ink/65">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-ink/[0.05] px-1.5 py-1">
                <ArrowBigUp className="size-[17px]" strokeWidth={1.8} />
                <span className="px-0.5 tabular-nums text-ink">{p.score}</span>
                <ArrowBigDown className="size-[17px]" strokeWidth={1.8} />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-2.5 py-1.5">
                <MessageSquare className="size-3.5" strokeWidth={1.8} />
                {p.comments}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1.5">
                <Share className="size-3.5" strokeWidth={1.8} />
                Share
              </span>
            </div>

            <div className={`mt-3 flex gap-2.5 border-t border-ink/[0.06] pt-3 ${show(b >= 6)}`}>
              <Avatar n={5} className="size-7" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12px] text-ink/55">
                  <span className="font-semibold text-ink">{c.user}</span>
                  <span>•</span>
                  <span>{c.age}</span>
                </p>
                <p className="mt-1 text-[13px] leading-[1.55] text-ink/85">{c.text}</p>
                <div className="mt-1.5 -ml-1 flex flex-wrap items-center gap-0.5 text-[12px] font-semibold text-ink/55">
                  <span className="inline-flex items-center gap-0.5 px-1">
                    <ArrowBigUp className="size-[17px]" strokeWidth={1.8} />
                    <span className="px-0.5 tabular-nums text-ink">{c.votes}</span>
                    <ArrowBigDown className="size-[17px]" strokeWidth={1.8} />
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1">
                    <MessageSquare className="size-3.5" strokeWidth={1.8} />
                    Reply
                  </span>
                  <span className="px-2 py-1">Share</span>
                  <Ellipsis className="size-4 text-ink/40" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The analysis: why this conversation. */}
        <div className="mx-2.5 mb-2.5 rounded-2xl bg-[color-mix(in_srgb,var(--primary)_6%,white)] p-3 ring-1 ring-[color-mix(in_srgb,var(--primary)_14%,transparent)]">
          <p className="flex items-center gap-2 px-1 pb-2.5 text-[13px] font-semibold tracking-[-0.01em] text-ink">
            <Sparkles className="size-4 text-[#19c864]" strokeWidth={2} />
            Opportunity analysis
          </p>
          <ul className="grid grid-cols-1 gap-x-3 border-t border-ink/[0.06] pt-1 sm:grid-cols-3">
            <Signal on={b >= 7} icon={<span className="grid size-5 place-items-center rounded-full bg-[#2fcf76]"><Check className="size-3 text-white" strokeWidth={3.2} /></span>} label={R.signals[0]} />
            <Signal on={b >= 8} icon={<Users className="size-[19px] text-[#7a5fd0]" strokeWidth={2.2} />} label={R.signals[1]} />
            <Signal on={b >= 9} icon={<span className="grid size-5 place-items-center rounded-full bg-accent"><Minus className="size-3 text-white" strokeWidth={3.4} /></span>} label={R.signals[2]} />
          </ul>
          <div className={`mt-1.5 flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--primary)_20%,white)] px-3 py-2.5 text-[13px] font-semibold text-ink ${show(b >= 10)}`}>
            <Sparkles className="size-4 text-[#19c864]" strokeWidth={2.2} fill="currentColor" />
            Opportunity
            <span className="ml-auto rounded-full bg-[#1fb865] px-2.5 py-0.5 text-[12.5px] text-white tabular-nums">
              <NumberFlow value={b >= 10 ? R.score : 0} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One signal read off the thread: an icon and its plain words. It arrives on its beat. */
function Signal({ on, icon, label }: { on: boolean; icon: ReactNode; label: string }) {
  return (
    <li className={`flex items-center gap-2 px-1 py-2 text-[12px] text-ink ${show(on)}`}>
      <span className="grid w-5 shrink-0 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1 leading-tight">{label}</span>
      <Info className="size-3.5 shrink-0 text-ink/30 sm:hidden" strokeWidth={1.8} />
    </li>
  );
}
