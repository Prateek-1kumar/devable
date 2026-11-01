"use client";

import NumberFlow from "@number-flow/react";
import { Eye, Link2, MessageSquare, Search, Target, Users, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { ARTIFACTS } from "./content";
import { DEEP, PANEL, Titlebar, show, useBeats, type SceneProps } from "./scene";

// 01 · Product understanding → Search & AI signals → Opportunity → Priority.
// Four windows step down and to the right, each one fed by the one above through an elbow, with a packet of
// data running every live elbow. The windows get narrower in what they say and sharper in what they decide:
// facts about the product, the signals around it, the opportunities those add up to, and the one to do first.
// On a phone the staircase straightens into a stack, and the elbows into short vertical links.

const SIGNAL_ICONS: LucideIcon[] = [Search, MessageSquare, Eye, Users, Link2, Target];
const TIMES = [150, 1000, 1850, 2700, 3700];
// What each beat shows: 1 product · 2 signals (+ counts) · 3 opportunity (+ bars) · 4 priority · 5 the first pick, lit.
const OFFSET = ["", "sm:ml-[11%]", "sm:ml-[22%]", "sm:ml-[33%]"];

export default function Understand({ on }: SceneProps) {
  const a = ARTIFACTS.intelligence;
  const b = useBeats(on, TIMES);
  const lit = b >= 5;

  return (
    <div className="mx-auto flex w-full max-w-[38.5rem] flex-col gap-2">
      <Stage n={1} title={a.stages[0]} on={b >= 1} className={OFFSET[0]}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 px-3 py-1.5">
          {a.product.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-[10px] text-ink/45">{f.label}</dt>
              <dd className="text-[12px] leading-snug text-ink sm:truncate">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Stage>

      <Stage n={2} title={a.stages[1]} on={b >= 2} link={b >= 2} className={OFFSET[1]}>
        <ul className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3">
          {a.signals.map((s, i) => {
            const Icon = SIGNAL_ICONS[i];
            return (
              <li key={s.label} className="rounded-lg bg-ink/[0.035] px-2 py-1">
                <p className="flex items-center gap-1.5">
                  <Icon aria-hidden="true" strokeWidth={2} className="size-3 text-ink/45" />
                  <span className="text-[13px] leading-none font-medium tracking-[-0.02em] text-ink tabular-nums">
                    <NumberFlow value={b >= 2 ? s.value : 0} suffix={s.suffix} />
                  </span>
                </p>
                <p className="mt-1 truncate text-[10px] text-ink/50">{s.label}</p>
              </li>
            );
          })}
        </ul>
      </Stage>

      <Stage n={3} title={a.stages[2]} on={b >= 3} link={b >= 3} className={OFFSET[2]}>
        <ul className="space-y-1 px-3 py-2">
          {a.opportunities.map((o, i) => (
            <li key={o.label} className="grid grid-cols-[minmax(0,1fr)_5rem_1.5rem] items-center gap-2 text-[12px]">
              <span className="truncate text-ink">{o.label}</span>
              <span className="h-1 overflow-hidden rounded-full bg-ink/[0.07]">
                <span
                  style={{ width: `${b >= 3 ? o.score : 0}%`, transitionDelay: `${i * 160}ms` }}
                  className={`block h-full rounded-full transition-[width] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${i === 0 ? "bg-primary" : "bg-ink/25"}`}
                />
              </span>
              <span className="text-right font-mono text-[11px] text-ink/60">
                <NumberFlow value={b >= 3 ? o.score : 0} />
              </span>
            </li>
          ))}
        </ul>
      </Stage>

      <Stage n={4} title={a.stages[3]} on={b >= 4} link={b >= 4} className={OFFSET[3]} last>
        <ol className="space-y-0.5 px-2 py-1.5">
          {a.priority.map((p, i) => {
            const first = i === 0 && lit;
            return (
              <li key={p.label} className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-[12px] transition-colors duration-700 motion-reduce:transition-none ${first ? "bg-[#e8f6ed]" : ""}`}>
                <span className={`grid size-4 shrink-0 place-items-center rounded font-mono text-[10px] transition-colors duration-700 ${first ? "bg-primary text-ink" : "bg-ink/[0.06] text-ink/55"}`}>{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-ink">{p.label}</span>
                <span className="font-mono text-[10.5px] transition-colors duration-700" style={{ color: first ? DEEP : "rgb(23 44 33 / 0.4)" }}>
                  {p.when}
                </span>
              </li>
            );
          })}
        </ol>
      </Stage>
    </div>
  );
}

/** One stage's window. `link` lights the elbow that feeds it from the stage above, and starts its packet. */
function Stage({ n, title, on, link = false, last = false, className, children }: { n: number; title: string; on: boolean; link?: boolean; last?: boolean; className: string; children: ReactNode }) {
  return (
    <div className={`relative sm:w-[67%] ${className} ${show(on)}`}>
      {n > 1 && <Elbow live={link} />}
      <div className={`${PANEL} overflow-hidden`}>
        <Titlebar n={n} title={title}>
          {last && <span className="font-mono text-[10px] tracking-[0.06em] text-ink/35 uppercase">Do this first</span>}
        </Titlebar>
        {children}
      </div>
    </div>
  );
}

/** The link from the stage above: an elbow into this window's left edge on wide screens, a short drop on phones. */
function Elbow({ live }: { live: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`absolute top-[-8px] right-full hidden h-[21px] w-4 rounded-bl-lg border-b-2 border-l-2 transition-colors duration-700 motion-reduce:transition-none sm:block ${live ? "border-primary" : "border-ink/10"}`}
      >
        {live && <span className="absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-primary motion-safe:animate-[elbow-run_2.2s_ease-in-out_infinite]" />}
      </span>
      <span aria-hidden="true" className={`absolute -top-2 left-5 h-2 w-0.5 transition-colors duration-700 sm:hidden ${live ? "bg-primary" : "bg-ink/10"}`} />
    </>
  );
}
