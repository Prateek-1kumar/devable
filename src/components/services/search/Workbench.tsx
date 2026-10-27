"use client";

import { useEffect, useRef, useState } from "react";
import { smooth } from "../../case-studies/CaseStudies";
import { Label, useInView } from "../kit";
import { ARTIFACTS, AREAS } from "./content";
import { Beacon, CANVAS, FRAME, GAP, Mark, PILL, SHEET, STAMP, SheetHead, StepChip, Tick, delay, rise } from "./parts";

// The page's signature section, in How We Work's language: the four areas of work down the left (step chip,
// title, mono "includes" pills), and on the right, pinned while you scroll, a How We Work card whose dotted
// canvas shows what that area actually produces as layered sheets. The area crossing the middle of the
// screen is active; its scene builds once, slowly, and then only its focal item moves (a coral beacon, or
// the audit's one fix still in progress). On phones each scene sits under its own area and builds when seen.
export default function Workbench() {
  const [active, setActive] = useState(0);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    blocks.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="areas-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{AREAS.label}</Label>
        <h2 id="areas-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {AREAS.title}
        </h2>
        <p className="mt-6 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{AREAS.body}</p>

        <div className="mt-14 grid gap-16 lg:mt-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="min-w-0">
            {AREAS.areas.map((a, i) => (
              <div
                key={a.name}
                data-i={i}
                ref={(el) => {
                  blocks.current[i] = el;
                }}
                className={`transition-opacity duration-500 motion-reduce:transition-none max-lg:mt-16 max-lg:first:mt-0 lg:flex lg:min-h-[66vh] lg:flex-col lg:justify-center ${
                  active === i ? "" : "lg:opacity-35"
                }`}
              >
                <StepChip n={i + 1} />
                <h3 className="mt-5 text-[clamp(1.5rem,2.1vw,2.05rem)] leading-[1.12] font-normal tracking-[-0.03em] text-ink">{a.name}</h3>
                <p className="mt-4 max-w-[30rem] text-[0.97rem] leading-relaxed text-ink/70">{a.summary}</p>
                <p className="mt-6 text-[0.82rem] text-ink/50">{a.listLabel}</p>
                <ul className="mt-2.5 flex max-w-[30rem] flex-wrap gap-1.5">
                  {a.items.map((item) => (
                    <li key={item} className={PILL}>
                      {item}
                    </li>
                  ))}
                </ul>
                <InlineScene i={i} />
              </div>
            ))}
          </div>

          {/* Pinned scene, desktop only. All four share one cell and crossfade, so nothing jumps. */}
          <div aria-hidden="true" className="hidden lg:block">
            <div className={`${FRAME} sticky top-[calc(50vh-16.5rem)] h-[33rem]`}>
              <div className={`${CANVAS} grid h-full`}>
                {SCENES.map((Scene, i) => (
                  <div
                    key={i}
                    className={`[grid-area:1/1] flex items-center justify-center p-8 transition-opacity duration-500 motion-reduce:transition-none xl:p-10 ${
                      active === i ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <Scene on={active === i} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-16 max-w-[44rem] border-t border-line pt-8 text-[1.02rem] leading-relaxed text-ink/70 lg:mt-10">{AREAS.note}</p>
      </div>
    </section>
  );
}

/** Phones: the area's scene in its own card, building once when it scrolls into view. */
function InlineScene({ i }: { i: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const Scene = SCENES[i];
  return (
    <div ref={ref} aria-hidden="true" className={`${FRAME} mt-8 lg:hidden`}>
      <div className={`${CANVAS} px-3 py-6 sm:p-8`}>
        <Scene on={seen} />
      </div>
    </div>
  );
}

type SceneProps = { on: boolean };

/** 01 · Where demand is and who wins it: two counts, then the map with one priority flagged. */
function Intelligence({ on }: SceneProps) {
  const a = ARTIFACTS.intelligence;
  return (
    <div className="w-full max-w-[30rem]">
      <div className="grid grid-cols-2 gap-3">
        {a.metrics.map((m, i) => (
          <div key={m.label} style={delay(i * 150)} className={`${SHEET} ${rise(on)} px-4 py-3`}>
            <p className="text-[11px] text-ink/50">{m.label}</p>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">{m.value}</p>
              <Trend on={on} />
            </div>
          </div>
        ))}
      </div>
      <div style={delay(450)} className={`${SHEET} ${rise(on)} relative mt-3 overflow-hidden sm:ml-6`}>
        <SheetHead title="Opportunity map">
          <span className="flex gap-6 text-[11px] text-ink/45">
            <span>You</span>
            <span className="w-[5.5rem] text-right max-sm:hidden">Leader</span>
          </span>
        </SheetHead>
        <ul className="divide-y divide-line">
          {a.rows.map((r, i) => (
            <li
              key={r.query}
              style={delay(800 + i * 220)}
              className={`${rise(on)} flex items-center gap-3 px-4 py-3 ${r.priority ? "bg-[color-mix(in_srgb,var(--accent)_6%,white)]" : ""}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-white">
                <Mark name={r.mark} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] text-ink">{r.query}</span>
                {r.priority && (
                  <span className={`${GAP} mt-1`}>
                    <Beacon />
                    Priority
                  </span>
                )}
              </span>
              <span className={`text-[12px] whitespace-nowrap tabular-nums ${r.you === "Not mentioned" ? "text-accent" : "text-ink"}`}>{r.you}</span>
              <span className="w-[5.5rem] truncate text-right text-[12px] text-ink/45 max-sm:hidden">{r.leader}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// A path drawing itself on (pathLength 1); reduced motion jumps straight to the drawn line.
const DRAW = "transition-[stroke-dashoffset] delay-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** The metric tile's small green trend, drawing on once. */
function Trend({ on }: SceneProps) {
  return (
    <svg viewBox="0 0 48 18" className="h-[18px] w-12 overflow-visible">
      <path
        d="M1 16 L12 13 L20 14 L32 7 L47 2"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.75"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        className={`${DRAW} duration-[1600ms] ${on ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]"}`}
      />
    </svg>
  );
}

const ink = (o: number) => `color-mix(in srgb, var(--ink) ${o}%, transparent)`;
const GROW = "origin-left rounded-full transition-transform duration-700 motion-reduce:transition-none motion-reduce:scale-x-100";

/** 02 · The page plan, with its first page already drafting on top. */
function ContentPlan({ on }: SceneProps) {
  const a = ARTIFACTS.content;
  return (
    <div className="relative w-full max-w-[30rem] sm:pb-10">
      <div style={delay(100)} className={`${SHEET} ${rise(on)} overflow-hidden sm:w-[62%]`}>
        <SheetHead title="Page plan" />
        <ul className="divide-y divide-line">
          {a.pages.map((p, i) => (
            <li key={p.path} style={delay(400 + i * 200)} className={`${rise(on)} px-4 py-3`}>
              <p className="truncate font-mono text-[11.5px] text-ink">{p.path}</p>
              <p className="mt-1 flex items-center gap-2 text-[11px] text-ink/50">
                {p.type}
                <span className={`rounded-full px-1.5 text-[10px] ${p.action === "New" ? "bg-ink text-white" : "border border-line text-ink/65"}`}>{p.action}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* The draft, in skeleton lines like the homepage Content Engine's draft. */}
      <div style={delay(1100)} className={`${SHEET} ${rise(on)} mt-3 p-4 sm:absolute sm:top-10 sm:right-0 sm:mt-0 sm:w-[52%]`}>
        <p className="text-[11px] text-ink/45">Draft · /compare/northwind</p>
        <p className="mt-2.5 text-[13.5px] leading-snug font-semibold tracking-[-0.015em] text-ink">{a.draft.title}</p>
        <Bars on={on} at={1400} widths={[100, 92, 64]} />
        <div className="mt-3 space-y-[7px] rounded-lg bg-paper p-2.5">
          {[
            [18, 30, 14],
            [26, 44],
            [20, 28, 18],
          ].map((line, i) => (
            <span key={i} className="flex gap-1" style={{ paddingLeft: i === 1 ? 10 : 0 }}>
              {line.map((w, j) => (
                <span
                  key={j}
                  style={{ width: `${w}%`, background: j === 0 ? "color-mix(in srgb, var(--accent) 70%, transparent)" : j === 1 ? ink(45) : "var(--sage)", ...delay(1700 + i * 120) }}
                  className={`h-[4px] ${GROW} ${on ? "scale-x-100" : "scale-x-0"}`}
                />
              ))}
            </span>
          ))}
        </div>
        <Bars on={on} at={2000} widths={[96, 70]} />
        <span style={delay(2400)} className={`${STAMP} ${rise(on)} mt-3.5`}>
          <Tick className="size-3" />
          Targets “{a.draft.target}”
        </span>
      </div>
    </div>
  );
}

/** Skeleton prose that writes in left to right. */
function Bars({ on, at, widths }: { on: boolean; at: number; widths: number[] }) {
  return (
    <span className="mt-3 block space-y-[7px]">
      {widths.map((w, i) => (
        <span key={i} style={{ width: `${w}%`, background: ink(14), ...delay(at + i * 140) }} className={`block h-[4.5px] ${GROW} ${on ? "scale-x-100" : "scale-x-0"}`} />
      ))}
    </span>
  );
}

/** 03 · The sources AI leans on in the category, with the biggest gap called out on top. */
function ThirdParty({ on }: SceneProps) {
  const a = ARTIFACTS.thirdParty;
  return (
    <div className="w-full max-w-[30rem]">
      <div style={delay(100)} className={`${SHEET} ${rise(on)} overflow-hidden`}>
        <SheetHead title="What AI answers cite in your category" />
        <ul className="space-y-3.5 px-4 pt-4 pb-4 sm:pb-12">
          {a.sources.map((s, i) => (
            <li key={s.name} style={delay(350 + i * 200)} className={`${rise(on)} flex items-center gap-3`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-white">
                <Mark name={s.mark} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2 text-[12.5px] text-ink">
                  {s.name}
                  <span className="text-[11px] text-ink/50 tabular-nums">{s.share}%</span>
                </p>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                  <span
                    style={{ width: `${(s.share / 40) * 100}%`, ...delay(700 + i * 200) }}
                    className={`block h-full duration-[1200ms]! ${GROW} ${s.present ? "bg-ink/55" : "bg-accent/80"} ${on ? "scale-x-100" : "scale-x-0"}`}
                  />
                </span>
              </div>
              {s.present ? <Tick /> : <span className={GAP}>Gap</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* The thread AI keeps citing, where you're absent. */}
      <div style={delay(1500)} className={`${SHEET} ${rise(on)} relative mt-3 p-3.5 sm:-mt-8 sm:mr-5 sm:ml-auto sm:w-[64%]`}>
        <p className="flex items-center gap-2 text-[11px] text-ink/50">
          <Mark name="reddit" className="size-3.5" />
          {a.thread.sub}
          <span className="ml-auto tabular-nums">▲ {a.thread.votes}</span>
        </p>
        <p className="mt-1.5 text-[12.5px] leading-snug font-medium text-ink">{a.thread.title}</p>
        <span className={`${GAP} mt-2`}>
          <Beacon />
          Your product isn’t mentioned
        </span>
      </div>
    </div>
  );
}

/** 04 · The audit: indexation climbing on a Search Console-style chart, and the fixes behind it. */
function Technical({ on }: SceneProps) {
  const a = ARTIFACTS.technical;
  const W = 300;
  const H = 70;
  const pts = a.series.map((v, i): [number, number] => [(i / (a.series.length - 1)) * W, H - ((v - 55) / 45) * H]);
  const line = smooth(pts);
  return (
    <div className="w-full max-w-[30rem]">
      <div style={delay(100)} className={`${SHEET} ${rise(on)} p-4`}>
        <p className="flex items-center gap-2 text-[11px] text-ink/50">
          <Mark name="googlesearchconsole" className="size-3.5" />
          Pages indexed
        </p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-[24px] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">{a.after}%</span>
          <span className="text-[12px] text-ink/45 tabular-nums">from {a.before}%</span>
        </p>
        <svg viewBox={`0 -6 ${W} ${H + 12}`} className="mt-3 h-[76px] w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wb-index" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#14b85a" stopOpacity="0.16" />
              <stop offset="1" stopColor="#14b85a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${line} L${W},${H + 6} L0,${H + 6} Z`}
            fill="url(#wb-index)"
            className={`transition-opacity delay-[1400ms] duration-[1200ms] motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`}
          />
          <path
            d={line}
            fill="none"
            stroke="#14b85a"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray="1 1"
            className={`${DRAW} duration-[2000ms] ${on ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]"}`}
          />
        </svg>
      </div>
      <div style={delay(700)} className={`${SHEET} ${rise(on)} relative mt-3 overflow-hidden sm:mx-6`}>
        <SheetHead title="Crawl audit">
          <span className="text-[11px] text-ink/45">3 of 4 fixed</span>
        </SheetHead>
        <ul className="divide-y divide-line">
          {a.issues.map((r, i) => (
            <li key={r.issue} style={delay(1000 + i * 200)} className={`${rise(on)} flex items-center gap-3 px-4 py-2.5`}>
              <span className="w-8 font-mono text-[11px] text-ink/45 tabular-nums">{r.count}</span>
              <span className={`min-w-0 flex-1 truncate text-[12px] ${r.fixed ? "text-ink/55" : "text-ink"}`}>{r.issue}</span>
              {r.fixed ? (
                <Tick />
              ) : (
                <span className="size-[18px] shrink-0 rounded-full border-[1.5px] border-line border-t-accent motion-safe:animate-[spin_2.4s_linear_infinite]" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SCENES = [Intelligence, ContentPlan, ThirdParty, Technical];
