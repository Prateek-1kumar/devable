"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CASE_STUDIES, INTRO, TITLE, VIEW_ALL_HREF, type CaseStudy } from "./content";

// White tile inside an off-white card: no hard borders, only a whisper of lift.
const TILE = "rounded-xl bg-white shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_6px_18px_-10px_rgb(23_44_33_/_0.1)]";
const CARD = "rounded-3xl bg-[#f6f5f1] p-2";

type Size = "full" | "feature" | "compact";

// Where each card sits in the mosaic (lg and up).
// Up to 2 studies: equal halves. From 3: a 3-column bento where the first study is the feature
// (2 columns × 2 rows), the next two stack beside it, and the rest pair up below, alternating 1 + 2 and
// 2 + 1 column spans so rows never look repeated; an unpaired last card spans the full row.
function placement(i: number, count: number): { size: Size; span: string } {
  if (count <= 2) return { size: "full", span: "" };
  if (i === 0) return { size: "feature", span: "lg:col-span-2 lg:row-span-2" };
  if (i < 3) return { size: "compact", span: "" };
  const k = i - 3;
  const rest = count - 3;
  if (k === rest - 1 && rest % 2 === 1) return { size: "compact", span: "lg:col-span-3" };
  const row = Math.floor(k / 2);
  const first = k % 2 === 0;
  const wide = row % 2 === 0 ? !first : first;
  return { size: "compact", span: wide ? "lg:col-span-2" : "" };
}

export default function CaseStudies() {
  const count = CASE_STUDIES.length;
  return (
    <section id="case-studies" aria-labelledby="case-studies-title" className="scroll-mt-24 px-6 py-20 sm:px-12 lg:py-24 xl:px-[6vw]">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-[44rem]">
          <h2
            id="case-studies-title"
            className="text-[clamp(1.75rem,2.5vw,2.35rem)] leading-[1.14] font-normal tracking-[-0.03em] text-ink"
          >
            {TITLE}
          </h2>
          <p className="mt-4 max-w-[34rem] text-[1rem] leading-[1.6] text-pretty text-muted sm:text-[1.05rem]">{INTRO}</p>
        </div>
        {/* Minimal "View all": a 1px underline draws in from the left on hover, the arrow steps forward. */}
        <a href={VIEW_ALL_HREF} className="group inline-flex items-center gap-2 pb-1 text-[0.95rem] font-medium text-ink">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]">
            View all case studies
          </span>
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </header>

      <div className={`mt-12 grid gap-4 lg:mt-14 ${count <= 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {CASE_STUDIES.map((study, i) => {
          const { size, span } = placement(i, count);
          return <Card key={study.slug} study={study} size={size} className={span} />;
        })}
      </div>
    </section>
  );
}

// One case study as a card holding its own bento.
// full: story, chart, quote, metrics as 2 × 2 (two studies side by side).
// feature: story and quote across the top, then the chart grows to fill the card's height beside the
//   metrics; the feature is as tall as the two cards stacked next to it, and the chart absorbs that.
// compact: story and chart only (the quote and extra metrics live on the case study page); stacked in a
//   one-column slot, side by side when the slot spans two or three columns.
function Card({ study, size, className }: { study: CaseStudy; size: Size; className: string }) {
  const label = `${study.company} case study`;
  if (size === "compact") {
    const side = className.includes("col-span") ? "lg:grid-cols-2" : "";
    return (
      <article aria-label={label} className={`${CARD} grid gap-2 ${side} ${className}`}>
        {/* Side by side there is room for the description again. */}
        <Story study={study} compact={!side} />
        <Chart study={study} compact />
      </article>
    );
  }
  if (size === "feature") {
    return (
      <article aria-label={label} className={`${CARD} grid gap-2 sm:grid-cols-[1.35fr_1fr] sm:grid-rows-[auto_1fr] ${className}`}>
        <Story study={study} />
        <Quote study={study} />
        <Chart study={study} grow />
        <Metrics study={study} stacked />
      </article>
    );
  }
  return (
    <article aria-label={label} className={`${CARD} grid gap-2 sm:grid-cols-2 ${className}`}>
      <Story study={study} />
      <Chart study={study} />
      <Quote study={study} />
      <Metrics study={study} />
    </article>
  );
}

function Logo({ study }: { study: CaseStudy }) {
  const name = <span className="text-[1.35rem] leading-none font-semibold tracking-[-0.04em] text-ink">{study.company.toLowerCase()}</span>;
  if (!study.logo) return name; // wordmark until the client's logo file lands in /public/clients
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG logo, nothing to optimize
    <img
      src={study.logo.src}
      alt={study.logo.mark ? "" : study.company}
      width={study.logo.width}
      height={study.logo.height}
      className={study.logo.mark ? "size-6" : "h-5 w-auto"}
    />
  );
  if (!study.logo.mark) return img;
  // Icon-only file: the mark with the name set beside it, like the client's own lockup.
  return (
    <span className="inline-flex items-center gap-2">
      {img}
      {name}
    </span>
  );
}

function Story({ study, compact = false }: { study: CaseStudy; compact?: boolean }) {
  return (
    <div className={`${TILE} flex flex-col p-6`}>
      <div className="flex items-center justify-between gap-4">
        <Logo study={study} />
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">Case study</span>
      </div>

      <h3 className="mt-7 max-w-[24ch] text-[clamp(1.2rem,1.5vw,1.4rem)] leading-[1.22] font-normal tracking-[-0.025em] text-ink">
        {study.headline}
      </h3>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Services">
        {study.services.map((s) => (
          <li
            key={s}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2eb] px-2.5 py-1 text-[0.75rem] font-medium tracking-[-0.005em] text-ink"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: study.accent }} />
            {s}
          </li>
        ))}
      </ul>

      {!compact && <p className="mt-4 text-[0.88rem] leading-[1.6] text-ink/65">{study.description}</p>}

      <a
        href={study.href ?? "#case-studies"}
        className="group mt-auto inline-flex w-fit items-center gap-2 pt-6 text-[0.88rem] font-medium text-ink"
      >
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
          Read case study
        </span>
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
          →
        </span>
      </a>
    </div>
  );
}

// Smooth line through the points (Catmull-Rom converted to cubic Béziers).
function smooth(points: [number, number][]) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] ?? points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[i + 2] ?? points[i + 1];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`;
  }
  return d;
}

const W = 400;
const H = 180;
const PAD_TOP = 14;
const PAD_BOTTOM = 6;
const LINE = "#14b85a"; // brand-family green, deep enough to read as a thin line on white

// Reads each point the way the headline result is written: "3.2×" → multiples, "+212%" → percent change.
function formatter(result: CaseStudy["result"]) {
  const start = result.series[0];
  if (result.value.includes("×")) return (v: number) => `${(v / start).toFixed(1)}×`;
  return (v: number) => {
    const pct = Math.round((v / start - 1) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  };
}

function Chart({ study, compact = false, grow = false }: { study: CaseStudy; compact?: boolean; grow?: boolean }) {
  const gradient = useId();
  const box = useRef<HTMLElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  // The line draws itself once, the first time the chart is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { series } = study.result;
  const format = formatter(study.result);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const points = series.map((v, i): [number, number] => [
    (i / (series.length - 1)) * W,
    PAD_TOP + (1 - (v - min) / (max - min || 1)) * (H - PAD_TOP - PAD_BOTTOM),
  ]);
  const line = smooth(points);
  const last = points.length - 1;
  const pct = (i: number) => ({ left: `${(points[i][0] / W) * 100}%`, top: `${(points[i][1] / H) * 100}%` });
  const shown = active ?? last;

  return (
    <figure ref={box} className={`${TILE} flex flex-col p-6`}>
      <figcaption>
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">{study.result.label}</span>
        <span className="mt-2 block text-[clamp(2.25rem,3vw,2.75rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
          {study.result.value}
        </span>
      </figcaption>

      <div className={`mt-auto flex flex-col ${compact ? "pt-7" : "pt-10"} ${grow ? "flex-1" : ""}`}>
        {/* Dots, guide, and label sit in HTML over the SVG so they stay round and crisp while the SVG stretches. */}
        <div className={`relative ${grow ? "min-h-28 flex-1" : compact ? "h-20" : "h-28"}`} onPointerLeave={() => setActive(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={LINE} stopOpacity="0.18" />
                <stop offset="100%" stopColor={LINE} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[1 / 3, 2 / 3, 1].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(23 44 33 / 0.06)" vectorEffect="non-scaling-stroke" />
            ))}
            {/* Baseline: where the engagement started. */}
            <line
              x1="0"
              x2={W}
              y1={points[0][1]}
              y2={points[0][1]}
              stroke="rgb(23 44 33 / 0.22)"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`${line} L${W},${H} L0,${H} Z`}
              fill={`url(#${gradient})`}
              className={`transition-opacity delay-500 duration-1000 motion-reduce:transition-none ${drawn ? "opacity-100" : "opacity-0"}`}
            />
            <path
              d={line}
              pathLength={1}
              fill="none"
              stroke={LINE}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={1}
              style={{ strokeDashoffset: drawn ? 0 : 1, transition: "stroke-dashoffset 1400ms cubic-bezier(0.22,1,0.36,1)" }}
              className="motion-reduce:[stroke-dashoffset:0]!"
            />
          </svg>

          <span
            aria-hidden="true"
            className="absolute right-0 -translate-y-[calc(100%+3px)] font-mono text-[9.5px] tracking-[0.06em] text-muted/80"
            style={{ top: pct(0).top }}
          >
            Baseline
          </span>

          {/* Hover guide for the active month. */}
          {active !== null && (
            <span aria-hidden="true" className="absolute inset-y-0 w-px -translate-x-1/2 bg-ink/15" style={{ left: pct(active).left }} />
          )}

          {/* A small point per month; the active (or final) one is larger with a soft halo. */}
          {points.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,width,height] duration-300 motion-reduce:transition-none ${
                i === shown ? "size-2.5 ring-4 ring-[#14b85a]/15" : "size-1.5 border border-[#14b85a] bg-white"
              } ${drawn ? "opacity-100" : "opacity-0"}`}
              style={{ ...pct(i), background: i === shown ? LINE : undefined, transitionDelay: drawn && active === null ? `${300 + i * 120}ms` : "0ms" }}
            />
          ))}

          {/* Value label above the active (or final) point. */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -translate-y-[calc(100%+12px)] rounded-md bg-ink px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-white tabular-nums transition-opacity duration-300 ${
              drawn ? "opacity-100" : "opacity-0"
            } ${shown === last ? "-translate-x-full" : shown === 0 ? "" : "-translate-x-1/2"}`}
            style={{ ...pct(shown), transitionDelay: drawn && active === null ? "1300ms" : "0ms" }}
          >
            {shown === 0 ? "Kickoff" : `Month ${shown}`} · {format(series[shown])}
          </span>

          {/* Hover: the month nearest the pointer. */}
          <div
            className="absolute inset-0"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setActive(Math.round(((e.clientX - r.left) / r.width) * last));
            }}
          />
        </div>

        <div className="mt-3 flex justify-between font-mono text-[10px] tracking-[0.04em] text-muted">
          {series.map((_, i) => (
            <span key={i} className={i === shown ? "text-ink" : ""}>
              {i === 0 ? "Kickoff" : `M${i}`}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

function Quote({ study }: { study: CaseStudy }) {
  return (
    <blockquote className={`${TILE} flex flex-col justify-between gap-5 p-6`}>
      <div>
        <span aria-hidden="true" className="block h-5 font-serif text-[2.5rem] leading-none" style={{ color: study.accent }}>
          “
        </span>
        <p className="mt-3 text-[0.98rem] leading-[1.55] tracking-[-0.01em] text-ink">{study.quote.text}</p>
      </div>
      <footer className="text-[0.8rem] text-muted">{study.quote.by}</footer>
    </blockquote>
  );
}

function Metrics({ study, stacked = false }: { study: CaseStudy; stacked?: boolean }) {
  return (
    <dl className={`${TILE} grid content-center gap-5 p-6 ${stacked ? "grid-cols-2 sm:grid-cols-1 sm:gap-8" : "grid-cols-2"}`}>
      {study.metrics.map((m) => (
        <div key={m.label} className="flex flex-col">
          <dt className="order-2 mt-2 text-[0.8rem] leading-[1.45] text-muted">{m.label}</dt>
          <dd className="order-1 text-[clamp(1.5rem,2vw,1.85rem)] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums">
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
