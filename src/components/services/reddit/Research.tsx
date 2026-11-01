"use client";

import NumberFlow from "@number-flow/react";
import { ArrowRight, Check, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Mark } from "../parts";
import { Brand } from "../search/HeroStage";
import { useBeats } from "../search/scene";
import { STEPS } from "./content";

// 01 · Find the conversations that matter: research, on a dark analyst surface unlike the other two steps.
// The console scans the threads in a category, scores each one, and ranks them; the best one is opened and
// shows why it's worth entering, in three signals read off the thread itself: high intent, competitors are
// already in it, your product isn't. Those add up to an opportunity. The point is the reasoning, not the
// subreddit: why this conversation, out of everything that was scanned. Plays whenever this step is the active
// one. Reduced motion: the finished console.
const R = STEPS.journey.research;
// 1 console in · 2 scan (counts and scores roll) · 3 ranked · 4 best thread opened · 5, 6, 7 its three signals · 8 opportunity
const TIMES = [200, 700, 2400, 3100, 3700, 4200, 4700, 5400];
const ROW = 50; // px between ranked rows
const START = [2, 0, 3, 1]; // where each thread sits before it's ranked (a shuffle of the ranked order)

export default function Research({ on }: { on: boolean }) {
  const b = useBeats(on, TIMES);
  const scanned = b >= 2;
  const ranked = b >= 3;
  const picked = b >= 4;
  const top = R.threads[0];

  return (
    <div className="w-full max-w-[34rem] rounded-2xl bg-[#101312] p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_30px_60px_-30px_rgb(0_0_0/0.7)] sm:p-5">
      {/* The console's header: what it's doing, and the two numbers that matter. */}
      <div className={`flex items-center justify-between gap-3 transition-opacity duration-700 motion-reduce:transition-none ${b >= 1 ? "opacity-100" : "opacity-0"}`}>
        <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.08em] text-white/50 uppercase">
          <span className={`size-1.5 rounded-full ${scanned && !ranked ? "bg-primary motion-safe:animate-pulse" : "bg-white/25"}`} />
          Thread research
        </p>
        <p className="flex items-center gap-4 font-mono text-[10.5px] text-white/45">
          <span>
            Scanned <NumberFlow value={scanned ? R.scanned : 0} locales="en-US" className="text-white/85" />
          </span>
          <span>
            Opportunities <NumberFlow value={ranked ? R.opportunities : 0} className="text-primary" />
          </span>
        </p>
      </div>

      {/* The threads: scanned top to bottom, scored, then ranked. */}
      <div className="relative mt-3.5" style={{ height: ROW * R.threads.length }}>
        <span
          aria-hidden="true"
          style={{ top: scanned ? ROW * R.threads.length - 2 : 0, transition: "top 1600ms linear, opacity 600ms" }}
          className={`absolute inset-x-0 z-10 h-px bg-primary/70 ${scanned && !ranked ? "opacity-100" : "opacity-0"}`}
        />
        {R.threads.map((t, i) => {
          const sel = picked && i === 0;
          return (
            <div
              key={t.sub}
              style={{ transform: `translateY(${(ranked ? i : START[i]) * ROW}px)`, transition: "transform 900ms cubic-bezier(0.22,1,0.36,1), opacity 700ms", transitionDelay: ranked ? `${i * 70}ms` : "0ms" }}
              className={`absolute inset-x-0 top-0 ${b >= 1 ? "opacity-100" : "opacity-0"}`}
            >
              <div className={`relative flex h-[44px] items-center gap-3 rounded-lg px-3 transition-colors duration-700 motion-reduce:transition-none ${sel ? "bg-white/[0.08]" : picked ? "bg-white/[0.02]" : "bg-white/[0.035]"}`}>
                <span className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-opacity duration-700 ${sel ? "opacity-100" : "opacity-0"}`} />
                <Mark name="reddit" className="size-4 shrink-0" />
                <span className={`w-[6.6rem] shrink-0 text-[12px] font-medium max-sm:flex-1 transition-colors duration-700 motion-reduce:transition-none ${sel ? "text-white" : scanned ? (picked ? "text-white/40" : "text-white/80") : "text-white/35"}`}>{t.sub}</span>
                <span className={`min-w-0 flex-1 truncate text-[12px] max-sm:hidden transition-colors duration-700 motion-reduce:transition-none ${sel ? "text-white/80" : scanned ? (picked ? "text-white/30" : "text-white/55") : "text-white/25"}`}>{t.title}</span>
                <span className={`w-7 shrink-0 text-right font-mono text-[12px] transition-colors duration-700 ${sel ? "text-primary" : "text-white/45"}`}>
                  <NumberFlow value={scanned ? t.score : 0} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* The best one, opened: why this conversation. */}
      <div
        className={`mt-3 rounded-xl bg-white/[0.05] p-4 ring-1 ring-white/10 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          picked ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <p className="flex items-center gap-2 text-[11px] text-white/45">
          <Mark name="reddit" className="size-3.5" />
          {top.sub}
        </p>
        <p className="mt-1.5 text-[13.5px] leading-snug text-white/90">“{top.title}”</p>

        <ul className="mt-3.5 grid gap-2 sm:grid-cols-3">
          <Signal on={b >= 5} icon={<Check aria-hidden="true" strokeWidth={3} className="size-2.5 text-ink" />} dot="bg-primary" label={`${top.intent} intent`} />
          <Signal
            on={b >= 6}
            icon={
              <span className="flex -space-x-1">
                {top.rivals.map((r) => (
                  <Brand key={r} i={r} size={14} />
                ))}
              </span>
            }
            label="Competitors mentioned"
          />
          <Signal on={b >= 7} icon={<Minus aria-hidden="true" strokeWidth={3} className="size-2.5 text-white" />} dot="bg-accent" label="Your product missing" />
        </ul>

        {/* Which adds up to this. */}
        <div className={`mt-3.5 flex items-center gap-2.5 border-t border-white/10 pt-3.5 transition-opacity duration-700 motion-reduce:transition-none ${b >= 8 ? "opacity-100" : "opacity-0"}`}>
          <ArrowRight aria-hidden="true" strokeWidth={2} className="size-4 text-white/35" />
          <span className="inline-flex items-center gap-2 rounded-full bg-primary py-1 pr-1 pl-3 text-[12px] font-medium text-ink">
            Opportunity
            <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] text-primary">{top.score}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** One signal read off the thread: an icon, and the plain words for it. It arrives on its beat. */
function Signal({ on, icon, dot, label }: { on: boolean; icon: ReactNode; dot?: string; label: string }) {
  return (
    <li className={`flex items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 py-2 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"}`}>
      {dot ? <span className={`grid size-4 shrink-0 place-items-center rounded-full ${dot}`}>{icon}</span> : icon}
      <span className="text-[11px] leading-tight text-white/75">{label}</span>
    </li>
  );
}
