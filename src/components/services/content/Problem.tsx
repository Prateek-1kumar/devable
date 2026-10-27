"use client";

import { Label, useInView } from "../kit";
import { CANVAS, SHEET, SheetHead, delay, rise } from "../parts";
import { PROBLEM } from "./content";

const [DEPTH, DIRECTION, DISTRIBUTION] = PROBLEM.items;
const DAYS = ["Mon", "Wed", "Fri"]; // SAMPLE: a full week of posts
const WARN = "color-mix(in srgb, var(--accent) 85%, var(--ink))";

// Three ways developer content fails, one card each. The top of every card shows the failure itself, small
// and on the How We Work canvas, so it reads before the text does: a code sample that throws, a busy calendar
// of topics nobody searches for, and a good article flatlining at 212 views. Name and explanation sit below.
// Each sheet rises in once when the row is seen; nothing moves after.
export default function Problem() {
  const [ref, seen] = useInView<HTMLOListElement>(0.25);
  const visuals = [<Depth key="d" />, <Direction key="s" />, <Distribution key="x" />];
  return (
    <section aria-labelledby="problem-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{PROBLEM.label}</Label>
        <h2 id="problem-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {PROBLEM.title}
        </h2>

        <ol ref={ref} className="mt-14 grid gap-5 lg:grid-cols-3">
          {PROBLEM.items.map((item, i) => (
            <li key={item.name} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <div aria-hidden="true" className={`${CANVAS} flex h-[15.5rem] items-center justify-center border-b border-line px-6`}>
                <div style={delay(i * 180)} className={`${rise(seen)} w-full max-w-[18.5rem]`}>
                  {visuals[i]}
                </div>
              </div>
              <div className="flex-1 px-7 pt-6 pb-8">
                <h3 className="text-[1.25rem] leading-snug font-medium tracking-[-0.025em] text-ink">{item.name}</h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-ink/65">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Technical depth: the snippet in the post, and what it does when a developer runs it. */
function Depth() {
  const ex = DEPTH.example as { code: string; error: string };
  return (
    <div className={`${SHEET} overflow-hidden`}>
      <SheetHead title="quickstart.py" />
      <div className="space-y-2.5 p-3">
        <p className="flex gap-2.5 rounded-lg bg-paper px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink/75">
          <span className="text-ink/30">1</span>
          <span>{ex.code}</span>
        </p>
        <p
          className="flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--accent)_8%,white)] px-3 py-2.5 font-mono text-[11px] leading-relaxed"
          style={{ color: WARN }}
        >
          <span aria-hidden="true" className="mt-px grid size-3.5 shrink-0 place-items-center rounded-full bg-accent text-[9px] leading-none text-white">
            ×
          </span>
          {ex.error}
        </p>
      </div>
    </div>
  );
}

/** Strategic direction: a full calendar, and how little anyone searches for any of it. */
function Direction() {
  const ex = DIRECTION.example as { topic: string; demand: number }[];
  return (
    <div className={`${SHEET} overflow-hidden`}>
      <SheetHead title="Content calendar">
        <span className="text-[11px] text-ink/45">Search demand</span>
      </SheetHead>
      <ul className="divide-y divide-line">
        {ex.map((row, i) => (
          <li key={row.topic} className="flex items-center gap-3 px-4 py-3">
            <span className="w-7 shrink-0 text-[11px] text-ink/45">{DAYS[i]}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{row.topic}</span>
            <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-ink/[0.06]">
              <span className="block h-full rounded-full bg-accent/80" style={{ width: `${Math.max(row.demand, 4)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Distribution: a strong article nobody found. */
function Distribution() {
  const ex = DISTRIBUTION.example as { title: string; views: string; days: string };
  return (
    <div className={`${SHEET} p-4`}>
      <p className="text-[13px] leading-snug font-semibold tracking-[-0.01em] text-ink">{ex.title}</p>
      <span className="mt-2.5 block space-y-[6px]">
        <span className="block h-[4px] w-full rounded-full bg-ink/[0.1]" />
        <span className="block h-[4px] w-[72%] rounded-full bg-ink/[0.1]" />
      </span>
      <svg viewBox="0 0 240 48" className="mt-4 h-12 w-full" preserveAspectRatio="none">
        <path d="M0 42 C 30 41, 50 39, 70 40 S 120 41, 150 41 S 210 42, 240 42" fill="none" stroke={WARN} strokeOpacity="0.75" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-2 flex justify-between text-[11px] text-ink/50">
        <span className="font-medium text-ink/75">{ex.views}</span>
        <span>{ex.days}</span>
      </p>
    </div>
  );
}
