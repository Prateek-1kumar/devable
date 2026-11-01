"use client";

import { type CSSProperties } from "react";
import { BookOpen, Check, FileText, GitCompare, Plug, Plus, RefreshCw, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { ARTIFACTS } from "./content";
import { DEEP, PANEL, show, useBeats, type SceneProps } from "./scene";

// 02 · Opportunity → Page → what happens to it.
// Every row is one decision: the opportunity that earned a page, the page itself, and whether it's New, a
// Refresh or an Optimize. Each kind is shown differently, so the difference is the picture: a new page writes
// itself in from nothing, a refreshed page is swept over and turns green, an optimized page ticks off its
// checklist. A packet runs each arrow. Nothing is published for its own sake: every page traces back to a signal.

type Action = "New" | "Refresh" | "Optimize";
const SIGNAL_ICONS: LucideIcon[] = [GitCompare, Plug, FileText, BookOpen];
const COLS = "sm:grid-cols-[minmax(0,0.78fr)_1.25rem_minmax(0,1.5fr)_5.4rem]";
// Three beats a row (its opportunity, its page, its action), a row every 900ms.
const TIMES = ARTIFACTS.content.plan.flatMap((_, i) => [250 + i * 900, 650 + i * 900, 1100 + i * 900]);

export default function PagePlan({ on }: SceneProps) {
  const a = ARTIFACTS.content;
  const b = useBeats(on, TIMES);

  return (
    <div className="mx-auto w-full max-w-[38.5rem]">
      <div className={`mb-2 hidden gap-x-2 px-1 font-mono text-[10px] tracking-[0.06em] text-ink/40 uppercase sm:grid ${COLS}`}>
        <span>{a.head[0]}</span>
        <span />
        <span>{a.head[1]}</span>
        <span>{a.head[2]}</span>
      </div>
      <ul className="space-y-2.5">
        {a.plan.map((p, i) => {
          const sig = b >= 3 * i + 1;
          const page = b >= 3 * i + 2;
          const act = b >= 3 * i + 3;
          const Icon = SIGNAL_ICONS[i];
          return (
            <li key={p.path} className={`grid items-center gap-x-2 gap-y-2 max-sm:grid-cols-[minmax(0,1fr)_auto] ${COLS}`}>
              <div className={`${PANEL} flex items-center gap-2 px-2.5 py-2 max-sm:col-span-2 ${show(sig)}`}>
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-ink/[0.05]">
                  <Icon aria-hidden="true" strokeWidth={2} className="size-3.5 text-ink/60" />
                </span>
                <span className="text-[12px] leading-tight text-ink">{p.signal}</span>
              </div>

              <Arrow live={page} />

              <div className={`${PANEL} flex items-center gap-2.5 p-2 ${show(page)}`}>
                <Thumb action={p.action} page={page} act={act} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-tight font-medium text-ink">{p.page}</p>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-ink/45">{p.path}</p>
                  {p.action === "Optimize" ? (
                    <p className="mt-1.5 flex flex-wrap gap-1">
                      {a.checks.map((c, k) => (
                        <Check3 key={c} label={c} on={act} wait={k * 170} />
                      ))}
                    </p>
                  ) : (
                    <p className="mt-0.5 truncate text-[10.5px] text-ink/50">{p.action === "Refresh" && act ? "Updated today" : p.note}</p>
                  )}
                </div>
              </div>

              <Stamp action={p.action} act={act} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The arrow from an opportunity to its page. It isn't there until its turn, then draws itself in green, and a packet runs it. */
function Arrow({ live }: { live: boolean }) {
  return (
    <>
      <span aria-hidden="true" className="-my-0.5 ml-5 block h-3 w-0.5 sm:hidden max-sm:col-span-2">
        <span className={`block h-full w-full origin-top rounded-full bg-primary transition-transform duration-700 motion-reduce:transition-none ${live ? "scale-y-100" : "scale-y-0"}`} />
      </span>
      <ArrowRun live={live} />
    </>
  );
}

function ArrowRun({ live }: { live: boolean }) {
  return (
    <span aria-hidden="true" className="relative block h-0.5 w-full max-sm:hidden">
      <span className={`absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${live ? "scale-x-100" : "scale-x-0"}`} />
      <span className={`absolute -top-[3px] -right-px size-2 rotate-45 border-t-2 border-r-2 border-primary transition-opacity duration-300 motion-reduce:transition-none ${live ? "opacity-100 delay-500" : "opacity-0"}`} />
      {live && (
        <span
          style={{ "--x0": "0%", "--y0": "50%", "--x1": "100%", "--y1": "50%" } as CSSProperties}
          className="absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-primary motion-safe:animate-[line-run_1.8s_ease-in-out_infinite]"
        />
      )}
    </span>
  );
}

/** The page as a small document. New writes in from nothing; Refresh is swept over and goes green; Optimize just gets its badge. */
function Thumb({ action, page, act }: { action: Action; page: boolean; act: boolean }) {
  return (
    <span className="relative h-11 w-9 shrink-0">
      <span className="absolute inset-0 grid content-center gap-[3px] overflow-hidden rounded-md bg-paper px-1.5 shadow-[0_0_0_1px_rgb(15_26_20/0.07)]">
        {[100, 78, 92, 58].map((w, i) => (
          <span
            key={i}
            style={{ width: `${w}%`, transitionDelay: `${i * 110}ms` }}
            className={`h-[3px] origin-left rounded-full transition-[transform,background-color] duration-700 motion-reduce:transition-none ${
              action === "New" && !page ? "scale-x-0" : "scale-x-100"
            } ${action === "Refresh" ? (act ? "bg-primary" : "bg-ink/20") : action === "New" ? "bg-ink/35" : "bg-ink/25"}`}
          />
        ))}
        {action === "Refresh" && act && <span className="absolute inset-y-0 left-0 w-1/2 bg-white/80 motion-safe:animate-[sheen_1.1s_ease-out_both]" />}
      </span>
      <span
        className={`absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full shadow-[0_0_0_1.5px_white] transition-[opacity,scale] duration-500 motion-reduce:transition-none ${
          action === "New" ? "bg-primary text-ink" : action === "Refresh" ? "bg-white text-ink" : "bg-[#e8f6ed]"
        } ${act ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
      >
        {action === "New" && <Plus aria-hidden="true" strokeWidth={3} className="size-2.5" />}
        {action === "Refresh" && <RefreshCw aria-hidden="true" strokeWidth={2.4} className="size-2.5 motion-safe:animate-[spin_0.9s_ease-out_1]" />}
        {action === "Optimize" && <Check aria-hidden="true" strokeWidth={3} className="size-2.5" style={{ color: DEEP }} />}
      </span>
    </span>
  );
}

/** One item of the optimize checklist, quiet until its turn, then green with a tick. */
function Check3({ label, on, wait }: { label: string; on: boolean; wait: number }) {
  return (
    <span
      style={{ transitionDelay: on ? `${wait}ms` : "0ms" }}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-[background-color,color] duration-500 motion-reduce:transition-none ${on ? "bg-[#e8f6ed] text-[#1a7f47]" : "bg-ink/[0.045] text-ink/40"}`}
    >
      <Check aria-hidden="true" strokeWidth={3} className={`size-2.5 transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`} />
      {label}
    </span>
  );
}

/** What happens to the page. New takes the solid brand green; Refresh and Optimize are quieter. */
function Stamp({ action, act }: { action: Action; act: boolean }) {
  const Icon = action === "New" ? Plus : action === "Refresh" ? RefreshCw : SlidersHorizontal;
  return (
    <span
      className={`inline-flex h-6 w-fit items-center gap-1.5 justify-self-start rounded-md px-2 text-[11.5px] font-medium transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
        action === "New" ? "bg-primary text-ink" : "bg-white text-ink shadow-[0_0_0_1px_rgb(15_26_20/0.1)]"
      } ${act ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
    >
      <Icon aria-hidden="true" strokeWidth={2.4} className="size-3" />
      {action}
    </span>
  );
}
