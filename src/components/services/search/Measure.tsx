"use client";

import NumberFlow from "@number-flow/react";
import { CalendarCheck, CircleDollarSign, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Label } from "../kit";
import { Mark, MarkStack } from "../parts";
import { MEASURE } from "./content";
import { Brand } from "./HeroStage";
import { DEEP, HAIR, PANEL, show, useBeats } from "./scene";

// What we measure, as a live measurement view instead of three lists. Three windows in a chain, Search → AI →
// Business, joined by links with data running down them: visibility is won in Search and in AI answers, and
// the Business window is where it lands, raised, as the outcome the other two feed. Each shows the same
// account on day 1 and day 90, so every number is a number that moved.
//   Search    a ranking going from #8 to #3, visibility and traffic climbing, high-intent pages converting better
//   AI        share of voice against two rivals (visibility, average position, tone), mentions by model,
//             recommendations by sentiment, citations by source type
//   Business  signups, demo requests, pipeline and revenue where measurable
// As the section scrolls in the windows wake in that order and their numbers roll from day 1 to day 90 and their
// lines draw in. Scroll away and back and it plays again. Reduced motion shows day 90, still.

const F = MEASURE.figures;
// 1 Search in · 2 Search rolls · 3 link + AI in · 4 AI rolls · 5 link + Business in · 6 Business rolls · 7 the outcome lit
const TIMES = [150, 700, 1500, 2050, 2900, 3450, 4400];
const [S_RANK, S_VIS, S_TRAFFIC, S_PERF] = MEASURE.signals[0].items;
const [A_MENTIONS, A_RECS, A_CITES, A_SOV] = MEASURE.signals[1].items;
const B_ICONS: LucideIcon[] = [UserPlus, CalendarCheck, TrendingUp, CircleDollarSign];
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const TONE_DOT = { Positive: "bg-[#1a7f47]", Neutral: "bg-ink/30", Negative: "bg-accent" } as const;

export default function Measure() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const b = useBeats(on, TIMES);
  const rs = b >= 2;
  const ra = b >= 4;
  const rb = b >= 6;

  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title}
        </h2>

        <div ref={ref} className="mt-12 rounded-3xl bg-[#f7f6f2] p-2 sm:p-3 lg:mt-14">
          <div className="grid items-stretch gap-0 lg:grid-cols-[minmax(0,1fr)_2.25rem_minmax(0,1.18fr)_2.25rem_minmax(0,1fr)]">
            {/* 1 · Search */}
            <div className={`${PANEL} flex flex-col ${show(b >= 1)}`}>
              <Head right={F.window}>
                <Mark name="google" className="size-3.5" />
                {MEASURE.signals[0].name}
              </Head>
              <div className="flex flex-1 flex-col divide-y divide-ink/[0.06] px-3.5">
                <Metric grow label={S_RANK} extra={<MoreRanks rolled={rs} />} sub={`“${F.search.rank.query}”`} delta={<Up on={rs}>{F.search.rank.from - F.search.rank.to}</Up>} chart={<Trail series={F.search.rank.series} on={rs} flip />}>
                  <NumberFlow value={rs ? F.search.rank.to : F.search.rank.from} prefix="#" />
                </Metric>
                <Metric grow label={S_VIS} delta={<Up on={rs}>{F.search.visibility.to - F.search.visibility.from} pts</Up>} chart={<Trail series={F.search.visibility.series} on={rs} />}>
                  <NumberFlow value={rs ? F.search.visibility.to : F.search.visibility.from} suffix="%" />
                </Metric>
                <Metric grow label={S_TRAFFIC} delta={<Up on={rs}>{Math.round((F.search.traffic.to / F.search.traffic.from - 1) * 100)}%</Up>} chart={<Bars values={F.search.traffic.bars} on={rs} />}>
                  <NumberFlow value={rs ? F.search.traffic.to : F.search.traffic.from} locales="en-US" />
                </Metric>
                <Metric grow label={S_PERF} sub={F.search.performance.note} delta={<Up on={rs}>{Math.round((F.search.performance.to - F.search.performance.from) * 10) / 10} pts</Up>} chart={<Trail series={F.search.performance.series} on={rs} />}>
                  <NumberFlow value={rs ? F.search.performance.to : F.search.performance.from} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="%" />
                </Metric>
              </div>
            </div>

            <Link live={b >= 3} />

            {/* 2 · AI */}
            <div className={`${PANEL} flex flex-col ${show(b >= 3)}`}>
              <Head right="All models">
                <MarkStack names={["chatgpt", "perplexity", "claude", "google"]} size="size-[18px]" />
                {MEASURE.signals[1].name}
              </Head>
              <div className="flex-1 divide-y divide-ink/[0.06] px-3.5">
                {/* Share of voice: each brand's visibility, average position and tone, and who moved. */}
                <div className="py-3">
                  <p className="text-[12px] text-ink/55">{A_SOV}</p>
                  <ul className="mt-2 space-y-1.5">
                    {F.ai.brands.map((br, i) => (
                      <li key={br.name} className="grid grid-cols-[1.25rem_minmax(0,1fr)_3.1rem_2.75rem_auto] items-center gap-x-2 text-[12px]">
                        <Brand i={i} size={18} />
                        <span className={`min-w-0 truncate ${i ? "text-ink/60" : "font-medium text-ink"}`}>{br.name}</span>
                        <span className="text-right font-mono text-[12px] text-ink tabular-nums">
                          <NumberFlow value={ra ? br.visibility[1] : br.visibility[0]} suffix="%" />
                        </span>
                        <span className={`grid h-5 place-items-center rounded px-1 font-mono text-[10.5px] transition-colors duration-700 ${ra && i === 0 ? "bg-primary text-ink" : "bg-ink/[0.06] text-ink/60"}`}>
                          <NumberFlow value={ra ? br.position[1] : br.position[0]} prefix="#" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
                        </span>
                        <Tone tone={ra ? br.tone[1] : br.tone[0]} />
                        <span className="col-span-5 -mt-0.5 ml-[1.75rem] block h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                          <span
                            style={{ width: `${((ra ? br.visibility[1] : br.visibility[0]) / 50) * 100}%` }}
                            className={`block h-full rounded-full transition-[width] duration-[1200ms] ${EASE} motion-reduce:transition-none ${i === 0 ? "bg-primary" : "bg-ink/25"}`}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Metric label={A_MENTIONS} delta={<Up on={ra}>{Math.round((F.ai.mentions.to / F.ai.mentions.from - 1) * 100)}%</Up>} chart={null}>
                  <NumberFlow value={ra ? F.ai.mentions.to : F.ai.mentions.from} locales="en-US" />
                </Metric>
                {/* ...and where those mentions come from. */}
                <ul className="-mt-1 flex flex-wrap gap-x-4 gap-y-1.5 pb-3 pl-0">
                  {F.ai.mentions.models.map((m) => (
                    <li key={m.name} className="flex items-center gap-1.5 text-[11.5px] text-ink/60">
                      <Mark name={m.mark} className="size-3.5" />
                      {m.name}
                      <span className="font-mono text-ink">
                        <NumberFlow value={ra ? m.count[1] : m.count[0]} />
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-ink/55">{A_RECS}</span>
                    <Up on={ra}>{F.ai.recommendations.to - F.ai.recommendations.from}</Up>
                  </div>
                  <p className="mt-1.5 text-[1.45rem] leading-none font-medium tracking-[-0.04em] text-ink">
                    <NumberFlow value={ra ? F.ai.recommendations.to : F.ai.recommendations.from} />
                  </p>
                  {/* How they describe you when they recommend you. */}
                  <span className="mt-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                    {(["Positive", "Neutral", "Negative"] as const).map((t, k) => (
                      <span key={t} style={{ width: `${F.ai.recommendations.tone[ra ? 1 : 0][k]}%` }} className={`${TONE_DOT[t]} transition-[width] duration-[1200ms] ${EASE} motion-reduce:transition-none`} />
                    ))}
                  </span>
                  <p className="mt-1.5 flex gap-3 text-[10.5px] text-ink/50">
                    {(["Positive", "Neutral", "Negative"] as const).map((t, k) => (
                      <span key={t} className="flex items-center gap-1">
                        <span className={`size-1.5 rounded-full ${TONE_DOT[t]}`} />
                        {t}
                        <NumberFlow value={F.ai.recommendations.tone[ra ? 1 : 0][k]} suffix="%" className="font-mono text-ink/70" />
                      </span>
                    ))}
                  </p>
                </div>

                <div className="py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-ink/55">{A_CITES}</span>
                    <Up on={ra}>{F.ai.citations.to - F.ai.citations.from}</Up>
                  </div>
                  <p className="mt-1.5 text-[1.45rem] leading-none font-medium tracking-[-0.04em] text-ink">
                    <NumberFlow value={ra ? F.ai.citations.to : F.ai.citations.from} />
                  </p>
                  {/* Cited from: the source, what kind of source it is, and how often. */}
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {F.ai.citations.sources.map((s) => (
                      <li key={s.name} className="flex items-center gap-1.5 rounded-md bg-ink/[0.04] py-1 pr-2 pl-1.5 text-[11px] text-ink/70">
                        <Mark name={s.mark} className="size-3.5" />
                        {s.name}
                        <span className="rounded-[3px] bg-white px-1 text-[9.5px] text-ink/45 shadow-[0_0_0_1px_rgb(15_26_20/0.07)]">{s.type}</span>
                        <span className="font-mono text-ink">
                          <NumberFlow value={ra ? s.count[1] : s.count[0]} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Link live={b >= 5} />

            {/* 3 · Business: the outcome the other two feed, raised. */}
            <div
              className={`${PANEL} flex flex-col transition-shadow duration-1000 ${show(b >= 5)} ${b >= 7 ? "shadow-[0_0_0_1.5px_var(--primary),0_1px_2px_rgb(23_44_33/0.04),0_22px_44px_-22px_rgb(23_44_33/0.3)]!" : ""}`}
            >
              <Head right="What it contributes to" rightClass="text-[#1a7f47]">
                {MEASURE.outcome.name}
              </Head>
              <ul className="flex flex-1 flex-col divide-y divide-ink/[0.06] px-3.5">
                {MEASURE.outcome.items.map((label, i) => {
                  const f = F.business[i];
                  const Icon = B_ICONS[i];
                  const key = i === 2;
                  return (
                    <li key={label} className={`flex flex-1 items-center gap-3 py-3.5 transition-colors duration-700 ${key && b >= 7 ? "-mx-3.5 bg-[#f1f8f3] px-3.5" : ""}`}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05]">
                        <Icon aria-hidden="true" strokeWidth={1.8} className="size-4 text-ink/60" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] leading-tight text-ink/60">{label}</span>
                        <span className={`mt-1 block leading-none font-medium tracking-[-0.04em] text-ink ${key ? "text-[1.9rem]" : "text-[1.5rem]"}`}>
                          <NumberFlow value={rb ? f.to : f.from} prefix={f.prefix} suffix={f.suffix} locales="en-US" />
                        </span>
                      </span>
                      <Up on={rb}>{Math.round((f.to / f.from - 1) * 100)}%</Up>
                    </li>
                  );
                })}
              </ul>
              {/* Where the pipeline came from: Search and AI, and AI's share growing. */}
              <div className={`border-t ${HAIR} px-3.5 py-3`}>
                <p className="text-[11.5px] text-ink/55">{MEASURE.outcome.items[2]} by source</p>
                <span className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full">
                  <span style={{ width: `${F.pipelineSplit.search[rb ? 1 : 0]}%` }} className={`bg-ink/70 transition-[width] duration-[1300ms] ${EASE} motion-reduce:transition-none`} />
                  <span style={{ width: `${F.pipelineSplit.ai[rb ? 1 : 0]}%` }} className={`bg-primary transition-[width] duration-[1300ms] ${EASE} motion-reduce:transition-none`} />
                </span>
                <p className="mt-2 flex items-center justify-between text-[11.5px] text-ink/60">
                  <span className="flex items-center gap-1.5">
                    <Mark name="google" className="size-3.5" />
                    {MEASURE.signals[0].name}
                    <NumberFlow value={F.pipelineSplit.search[rb ? 1 : 0]} suffix="%" className="font-mono text-ink" />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MarkStack names={["chatgpt", "perplexity", "claude"]} size="size-4" />
                    {MEASURE.signals[1].name}
                    <NumberFlow value={F.pipelineSplit.ai[rb ? 1 : 0]} suffix="%" className="font-mono text-ink" />
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A window's title bar: what it is on the left, a quiet note on the right. */
function Head({ children, right, rightClass = "text-ink/45" }: { children: ReactNode; right: string; rightClass?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b ${HAIR} px-3.5 py-2.5`}>
      <p className="flex items-center gap-2 text-[12.5px] font-medium text-ink">{children}</p>
      <span className={`text-[11px] ${rightClass}`}>{right}</span>
    </div>
  );
}

/** The two other tracked rankings under the headline one: where each was on day 1, and where it is now. */
function MoreRanks({ rolled }: { rolled: boolean }) {
  return (
    <ul className="mt-2.5 space-y-1 text-[11.5px]">
      {F.search.rank.more.map((r) => (
        <li key={r.query} className="flex items-center justify-between gap-2 text-ink/55">
          <span className="min-w-0 truncate">“{r.query}”</span>
          <span className="font-mono text-[11px] text-ink">
            <span className="text-ink/30 line-through decoration-ink/20">#{r.from}</span> <NumberFlow value={rolled ? r.to : r.from} prefix="#" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** One metric: its name, its number (rolling from day 1 to day 90), its change, and a chart if it has one. */
function Metric({ label, sub, delta, chart, grow = false, extra, children }: { label: string; sub?: string; delta: ReactNode; chart: ReactNode; grow?: boolean; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className={grow ? "flex flex-1 flex-col justify-center py-3" : "py-3"}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[12px] text-ink/55">
          {label}
          {sub && <span className="ml-1.5 text-[10.5px] text-ink/35">{sub}</span>}
        </span>
        {delta}
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <p className="text-[1.45rem] leading-none font-medium tracking-[-0.04em] text-ink">{children}</p>
        {chart}
      </div>
      {extra}
    </div>
  );
}

/** The change since day 1, in the page's deep green; it arrives once the number has moved. */
function Up({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`} style={{ color: DEEP }}>
      <svg viewBox="0 0 8 8" aria-hidden="true" className="size-[7px] fill-current">
        <path d="M4 1 7.5 7h-7z" />
      </svg>
      {children}
    </span>
  );
}

/** A trend line that draws itself in. `flip` is for positions, where a lower number is better, so an improvement still climbs. */
function Trail({ series, on, flip = false }: { series: number[]; on: boolean; flip?: boolean }) {
  const lo = Math.min(...series);
  const span = Math.max(...series) - lo || 1;
  const pts = series.map((v, i) => {
    const t = (v - lo) / span;
    return [Math.round((i / (series.length - 1)) * 7200) / 100, Math.round((3 + (flip ? t : 1 - t) * 16) * 100) / 100];
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("");
  const end = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 72 22" aria-hidden="true" className="h-[22px] w-[72px] shrink-0 overflow-visible">
      <path d={d} fill="none" stroke="rgb(23 44 33 / 0.14)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke="#19e76e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: on ? "stroke-dashoffset 1500ms cubic-bezier(0.22,1,0.36,1)" : "none" }}
      />
      <circle cx={end[0]} cy={end[1]} r="2.6" fill="#fff" stroke="#1a7f47" strokeWidth="1.4" style={{ opacity: on ? 1 : 0, transition: on ? "opacity 400ms ease 1200ms" : "none" }} />
    </svg>
  );
}

/** Bars that rise from where they were on day 1 to where they are on day 90. */
function Bars({ values, on }: { values: number[]; on: boolean }) {
  const max = Math.max(...values);
  return (
    <span aria-hidden="true" className="flex h-[22px] w-[72px] shrink-0 items-end gap-[3px]">
      {values.map((v, i) => (
        <span
          key={i}
          style={{ height: `${on ? (v / max) * 100 : (values[0] / max) * 100}%`, transitionDelay: on ? `${i * 70}ms` : "0ms" }}
          className={`flex-1 rounded-[2px] transition-[height,background-color] duration-[900ms] ${EASE} motion-reduce:transition-none ${on && i === values.length - 1 ? "bg-primary" : "bg-ink/20"}`}
        />
      ))}
    </span>
  );
}

/** How a brand is described: a coloured dot and a word. */
function Tone({ tone }: { tone: "Positive" | "Neutral" | "Negative" }) {
  return (
    <span className="flex items-center gap-1 text-[10.5px] text-ink/55">
      <span className={`size-1.5 rounded-full transition-colors duration-700 ${TONE_DOT[tone]}`} />
      {tone}
    </span>
  );
}

/** The link between two windows, with data running along it once it's live: across on wide screens, down on phones. */
function Link({ live }: { live: boolean }) {
  return (
    <>
      <div aria-hidden="true" className="relative hidden items-center px-2 lg:flex">
        <span className="relative block h-0.5 w-full">
          <span className="absolute inset-0 rounded-full bg-ink/10" />
          <span className={`absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-700 ${EASE} motion-reduce:transition-none ${live ? "scale-x-100" : "scale-x-0"}`} />
          <span className={`absolute top-1/2 right-0 size-2 -translate-y-1/2 rotate-45 border-t-2 border-r-2 border-primary transition-opacity duration-300 ${live ? "opacity-100 delay-500" : "opacity-0"}`} />
          {live && (
            <span
              style={{ "--x0": "0%", "--y0": "50%", "--x1": "100%", "--y1": "50%" } as CSSProperties}
              className="absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-primary motion-safe:animate-[line-run_1.8s_ease-in-out_infinite]"
            />
          )}
        </span>
      </div>
      <div aria-hidden="true" className="mx-auto my-1 h-6 w-0.5 rounded-full bg-ink/10 lg:hidden">
        <span className={`block h-full w-full origin-top rounded-full bg-primary transition-transform duration-700 motion-reduce:transition-none ${live ? "scale-y-100" : "scale-y-0"}`} />
      </div>
    </>
  );
}
