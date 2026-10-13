"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CASE_STUDIES, INTRO, TITLE, type CaseStudy } from "./content";

// Soft white tile on the off-white band: no hard borders, the same lift as the Why Devable card.
const TILE = "rounded-2xl bg-white shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_12px_32px_-14px_rgb(23_44_33_/_0.12)]";

// Each case study is its own bento: story and results chart on top, quote and supporting metrics below.
// Every other study mirrors (chart on the left) so a stack of five keeps a rhythm instead of repeating.
export default function CaseStudies() {
  return (
    <section
      id="case-studies"
      aria-labelledby="case-studies-title"
      className="scroll-mt-24 bg-[#f4f2eb] px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]"
    >
      <header className="max-w-[44rem]">
        <h2
          id="case-studies-title"
          className="text-[clamp(1.75rem,2.5vw,2.35rem)] leading-[1.14] font-normal tracking-[-0.03em] text-ink"
        >
          {TITLE}
        </h2>
        <p className="mt-4 max-w-[34rem] text-[1rem] leading-[1.6] text-pretty text-muted sm:text-[1.05rem]">{INTRO}</p>
      </header>

      <div className="mt-12 space-y-10 lg:mt-16 lg:space-y-14">
        {CASE_STUDIES.map((study, i) => (
          <Study key={study.slug} study={study} mirrored={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function Study({ study, mirrored }: { study: CaseStudy; mirrored: boolean }) {
  // Explicit placement on a 12-column grid: 7 / 5 split, swapped when mirrored.
  const wide = mirrored ? "lg:col-start-6 lg:col-span-7" : "lg:col-start-1 lg:col-span-7";
  const narrow = mirrored ? "lg:col-start-1 lg:col-span-5" : "lg:col-start-8 lg:col-span-5";

  return (
    <article aria-label={`${study.company} case study`} className="grid gap-3 lg:grid-cols-12">
      <Story study={study} className={`${wide} lg:row-start-1 lg:row-span-2`} />
      <Chart study={study} className={`${narrow} lg:row-start-1 lg:row-span-2`} />
      <Quote study={study} className={`${wide} lg:row-start-3`} />
      <Metrics study={study} className={`${narrow} lg:row-start-3`} />
    </article>
  );
}

function Logo({ study }: { study: CaseStudy }) {
  const name = <span className="text-[1.6rem] leading-none font-semibold tracking-[-0.04em] text-ink">{study.company.toLowerCase()}</span>;
  if (!study.logo) return name; // wordmark until the client's logo file lands in /public/clients
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG logo, nothing to optimize
    <img
      src={study.logo.src}
      alt={study.logo.mark ? "" : study.company}
      width={study.logo.width}
      height={study.logo.height}
      className={study.logo.mark ? "size-7" : "h-6 w-auto"}
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

function Story({ study, className }: { study: CaseStudy; className: string }) {
  return (
    <div className={`${TILE} flex flex-col p-7 sm:p-9 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <Logo study={study} />
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Case study</span>
      </div>

      <h3 className="mt-10 max-w-[22ch] text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.15] font-normal tracking-[-0.03em] text-ink">
        {study.headline}
      </h3>

      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Services">
        {study.services.map((s) => (
          <li
            key={s}
            className="inline-flex items-center gap-2 rounded-full bg-[#f4f2eb] px-3 py-1.5 text-[0.8rem] font-medium tracking-[-0.005em] text-ink"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: study.accent }} />
            {s}
          </li>
        ))}
      </ul>

      <p className="mt-5 max-w-[46ch] text-[0.97rem] leading-[1.65] text-ink/70">{study.description}</p>

      <a
        href={study.href ?? "#case-studies"}
        className="group mt-auto inline-flex w-fit items-center gap-2 pt-8 text-[0.95rem] font-medium text-ink"
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

function Chart({ study, className }: { study: CaseStudy; className: string }) {
  const gradient = useId();
  const box = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  // The line draws itself once, the first time the chart is on screen; nothing else moves.
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
  const min = Math.min(...series);
  const max = Math.max(...series);
  const points = series.map((v, i): [number, number] => [
    (i / (series.length - 1)) * W,
    PAD_TOP + (1 - (v - min) / (max - min || 1)) * (H - PAD_TOP - PAD_BOTTOM),
  ]);
  const line = smooth(points);
  const [endX, endY] = points[points.length - 1];

  return (
    <figure ref={box} className={`${TILE} flex flex-col overflow-hidden p-7 sm:p-9 ${className}`}>
      <figcaption>
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{study.result.label}</span>
        <span className="mt-2 block text-[clamp(2.75rem,4.4vw,3.75rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
          {study.result.value}
        </span>
      </figcaption>

      <div className="relative mt-auto pt-10">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="h-44 w-full overflow-visible">
          <defs>
            <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={study.accent} stopOpacity="0.16" />
              <stop offset="100%" stopColor={study.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(23 44 33 / 0.06)" vectorEffect="non-scaling-stroke" />
          ))}
          <path
            d={`${line} L${W},${H} L0,${H} Z`}
            fill={`url(#${gradient})`}
            className={`transition-opacity delay-500 duration-1000 motion-reduce:transition-none ${drawn ? "opacity-100" : "opacity-0"}`}
          />
          <path
            d={line}
            pathLength={1}
            fill="none"
            stroke={study.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={1}
            style={{ strokeDashoffset: drawn ? 0 : 1, transition: "stroke-dashoffset 1400ms cubic-bezier(0.22,1,0.36,1)" }}
            className="motion-reduce:[stroke-dashoffset:0]!"
          />
        </svg>
        {/* End point sits in HTML so it stays a true circle while the SVG stretches. */}
        <span
          aria-hidden="true"
          className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-opacity delay-1000 duration-500 motion-reduce:transition-none ${
            drawn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: `${(endX / W) * 100}%`,
            top: `calc(2.5rem + ${(endY / H) * 11}rem)`,
            background: study.accent,
            ["--tw-ring-color" as string]: `${study.accent}26`,
          }}
        />
        <div className="mt-3 flex justify-between font-mono text-[10.5px] tracking-[0.06em] text-muted">
          <span>Kickoff</span>
          <span>Month {series.length - 1}</span>
        </div>
      </div>
    </figure>
  );
}

function Quote({ study, className }: { study: CaseStudy; className: string }) {
  return (
    <blockquote className={`${TILE} flex flex-col justify-between gap-6 p-7 sm:p-9 ${className}`}>
      <div>
        <span aria-hidden="true" className="block h-6 font-serif text-[3rem] leading-none" style={{ color: study.accent }}>
          “
        </span>
        <p className="mt-3 text-[clamp(1.1rem,1.5vw,1.3rem)] leading-[1.5] tracking-[-0.015em] text-ink">{study.quote.text}</p>
      </div>
      <footer className="text-[0.88rem] text-muted">{study.quote.by}</footer>
    </blockquote>
  );
}

function Metrics({ study, className }: { study: CaseStudy; className: string }) {
  return (
    <dl className={`${TILE} grid grid-cols-2 content-center gap-6 p-7 sm:p-9 ${className}`}>
      {study.metrics.map((m) => (
        <div key={m.label} className="flex flex-col">
          <dt className="order-2 mt-2 text-[0.85rem] leading-[1.45] text-muted">{m.label}</dt>
          <dd className="order-1 text-[clamp(1.75rem,2.4vw,2.25rem)] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums">
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
