"use client";

import { ArrowUp, Search } from "lucide-react";
import { Mark } from "../parts";
import { useBeats } from "../search/scene";
import { STEPS } from "./content";

// 03 · Strengthen search and AI visibility: the wider discovery footprint, with Reddit as one part of it, not
// the whole of it, on dark results like Google's own dark mode. One query, and what comes back on the two
// surfaces a buyer meets. In Google, a Reddit thread is one result among a docs page and a comparison page. In
// the AI answer, it's one of four sources, beside the docs, a comparison and an industry publication, and the
// answer cites several of them for each point. Reddit is picked out in green in both, softly, so you can see
// where it sits without it reading as the cause of everything. Plays whenever this step is the active one.
// Reduced motion: the finished picture.
const D = STEPS.journey.discovery;
// 1 query bar · 2 query typed · 3, 4, 5 the three results · 6 the Reddit result picked out · 7 the AI answer · 8 its text · 9 its sources · 10 Reddit among them
const TIMES = [200, 700, 2100, 2500, 2900, 3500, 4300, 4900, 5700, 6500];

const rise = (on: boolean) => `transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`;
const TINT = "color-mix(in srgb, var(--primary) 12%, transparent)";
const CARD = "rounded-xl bg-[#141716] p-3.5 shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_24px_50px_-28px_rgb(0_0_0/0.75)]";

export default function Discovery({ on }: { on: boolean }) {
  const b = useBeats(on, TIMES);

  return (
    <div className="w-full min-w-0 max-w-[34rem] space-y-3">
      {/* The query. */}
      <div className={`flex items-center gap-2.5 rounded-full bg-[#1d211f] px-4 py-2.5 shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_12px_28px_-16px_rgb(0_0_0/0.8)] ${rise(b >= 1)}`}>
        <Mark name="google" className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 overflow-hidden">
          <span
            style={{ display: "inline-block", clipPath: b >= 2 ? "inset(0 0 0 0)" : "inset(0 100% 0 0)", transition: "clip-path 1300ms steps(40, end)" }}
            className="text-[13px] whitespace-nowrap text-white/90"
          >
            {D.query}
          </span>
        </span>
        <Search className="size-4 shrink-0 text-white/40" strokeWidth={2} />
      </div>

      {/* Google: the results, Reddit one of them. */}
      <div className={`${CARD} ${rise(b >= 3)}`}>
        <ul className="space-y-3">
          {D.results.map((r, i) => {
            const picked = r.reddit && b >= 6;
            return (
              <li key={r.site} className={rise(b >= 3 + i)}>
                <div style={{ backgroundColor: picked ? TINT : "transparent" }} className="relative -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-700 motion-reduce:transition-none">
                  <span className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary transition-opacity duration-700 ${picked ? "opacity-100" : "opacity-0"}`} />
                  <p className="flex items-center gap-2 text-[11px] text-white/50">
                    <span className="grid size-4 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(255_255_255/0.1)]">
                      <Mark name={r.mark as "docs" | "reddit" | "g2"} className="size-2.5" />
                    </span>
                    {r.site}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[#8ab4f8]">{r.title}</p>
                  <p className="mt-0.5 truncate text-[11.5px] leading-snug text-white/50">{r.snippet}</p>
                  {r.meta && (
                    <p className="mt-1 flex items-center gap-1 text-[10.5px] text-white/40">
                      <ArrowUp className="size-3 text-[#ff4500]" strokeWidth={2.4} />
                      {r.meta}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The AI answer: several sources, Reddit one of them. */}
      <div className={`${CARD} ${rise(b >= 7)}`}>
        <p className="flex items-center gap-2 text-[11.5px] font-medium text-white/90">
          <span className="grid size-5 place-items-center rounded-full bg-white">
            <Mark name="chatgpt" className="size-3.5" />
          </span>
          ChatGPT
        </p>
        <p className={`mt-2 text-[12.5px] leading-[1.6] text-white/75 ${rise(b >= 8)}`}>
          {D.ai.sentences.map((s) => (
            <span key={s.text}>
              {s.text}
              {s.cites.map((c) => (
                <sup key={c} className={`ml-[3px] font-mono text-[9px] font-medium transition-colors duration-700 ${c === 4 && b >= 10 ? "text-primary" : "text-white/35"}`}>
                  [{c}]
                </sup>
              ))}{" "}
            </span>
          ))}
        </p>
        <ul className={`mt-3 flex flex-wrap gap-1.5 ${rise(b >= 9)}`}>
          {D.ai.sources.map((s, i) => {
            const picked = s.reddit && b >= 10;
            return (
              <li
                key={s.label}
                style={{ backgroundColor: picked ? TINT : undefined }}
                className={`flex items-center gap-1.5 rounded-md py-1 pr-2 pl-1.5 text-[11px] transition-[background-color,box-shadow] duration-700 motion-reduce:transition-none ${
                  picked ? "text-white shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_50%,transparent)]" : "bg-white/[0.06] text-white/60"
                }`}
              >
                <span className="font-mono text-[9.5px] text-white/35">{i + 1}</span>
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white">
                  <Mark name={s.mark as "docs" | "g2" | "news" | "reddit"} className="size-2.5" />
                </span>
                {s.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
