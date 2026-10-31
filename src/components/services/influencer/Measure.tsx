"use client";

import { useEffect, useState, useSyncExternalStore, type PointerEvent } from "react";
import { Label, useInView } from "../kit";
import { MEASURE } from "./content";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The drop is the point: lots of reach, then a focused number that matters. So the three bars are no longer even steps:
// reach stands far taller than the other two, engagement is about half of it, and high-intent actions is the short, deep
// one. `md` is the height beside each other; `sm` the height when they stack on a phone (still stepped down). `size` is
// the figure's type size: the largest number belongs to the broadest layer.
const LEVELS = [
  { md: "100%", sm: "13rem", tone: "bg-primary/20", size: "clamp(3.4rem,5.8vw,5.4rem)" },
  { md: "52%", sm: "9.5rem", tone: "bg-primary/50", size: "clamp(2.5rem,4vw,3.5rem)" },
  { md: "34%", sm: "7.75rem", tone: "bg-primary", size: "clamp(2.5rem,4vw,3.5rem)" },
];
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const GROW = 1400; // ms a bar takes to rise
const STAGGER = 170; // ms between the bars

// The three layers we report on, left to right as a narrowing funnel. Each column's figure is its main element, in a
// bar that stands from a shared baseline.
//
// On first view the bars grow up from that baseline one after another (each figure rides its bar's rising top edge and
// counts up to its value), a band of light crosses each bar once as it lands, and the supporting metrics settle in
// beneath. Nothing loops. On hover (or touch) the bar under the pointer lifts and catches a soft spotlight that follows
// the pointer, and the other two recede a little so the one you are on reads. Reduced motion: no growth, count or sheen;
// the finished picture, with the hover lift softened to a colour change.
export default function Measure() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const [hover, setHover] = useState<number | null>(null);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);

  return (
    <section aria-labelledby="measure-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MEASURE.label}</Label>
        <h2 id="measure-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MEASURE.title} <span className="block text-ink/40">{MEASURE.subtitle}</span>
        </h2>

        <div ref={ref} onPointerLeave={() => setHover(null)} className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {MEASURE.layers.map((layer, i) => {
            const lv = LEVELS[i];
            const delay = i * STAGGER;
            const landed = delay + GROW; // when this bar has finished rising
            const on = hover === i;
            const dim = hover !== null && !on;
            return (
              <div key={layer.name} onPointerEnter={() => setHover(i)} className="flex flex-col bg-white p-6 sm:p-8">
                {/* The bars share a baseline; heights step down hard side by side, and a little when stacked. */}
                <div className="flex items-end md:h-[29rem]">
                  <div
                    onPointerMove={(e: PointerEvent<HTMLDivElement>) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                      e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                    }}
                    style={{
                      ["--sm" as string]: lv.sm,
                      ["--md" as string]: lv.md,
                      height: seen ? "var(--hh)" : "0px",
                      transform: on && !reduced ? "translateY(-8px)" : "none",
                      opacity: dim ? 0.72 : 1,
                      boxShadow: on ? "0 26px 44px -26px rgb(23 44 33 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.7)" : "0 0 0 rgb(23 44 33 / 0), inset 0 1px 0 rgb(255 255 255 / 0.55)",
                      transition: reduced ? "box-shadow 300ms ease, opacity 300ms ease" : `height ${GROW}ms ${EASE} ${delay}ms, transform 520ms ${EASE}, box-shadow 520ms ease, opacity 400ms ease`,
                    }}
                    className={`relative flex w-full flex-col overflow-hidden rounded-[12px] p-5 [--hh:var(--sm)] sm:p-6 md:[--hh:var(--md)] ${lv.tone}`}
                  >
                    {/* A soft spotlight under the pointer. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                      style={{ opacity: on ? 1 : 0, background: "radial-gradient(220px circle at var(--mx,50%) var(--my,30%), rgb(255 255 255 / 0.5), transparent 70%)" }}
                    />
                    {/* A band of light, once, as the bar lands. */}
                    {seen && !reduced && (
                      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.55),transparent)]" style={{ animation: `sheen 1300ms ${EASE} ${landed - 500}ms both` }} />
                    )}

                    <p
                      className="relative transition-[opacity,translate] duration-700 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none"
                      style={{ transitionDelay: `${delay + 250}ms`, transitionTimingFunction: EASE, opacity: seen ? 1 : 0, translate: seen ? "0 0" : "0 18px" }}
                    >
                      <span className="sr-only">
                        {layer.stat} {layer.unit}
                      </span>
                      <span aria-hidden="true" className="block leading-[0.95] font-medium tracking-[-0.055em] text-ink tabular-nums" style={{ fontSize: lv.size }}>
                        <CountUp value={layer.stat} run={seen} delay={delay + 300} still={reduced} />
                      </span>
                      <span aria-hidden="true" className="mt-2 block text-[0.98rem] font-medium tracking-[-0.01em] text-ink/70">
                        {layer.unit}
                      </span>
                    </p>
                  </div>
                </div>

                <h3 className="mt-7 flex items-center gap-2.5 text-[1.2rem] font-medium tracking-[-0.025em] text-ink">
                  <span
                    className={`grid h-6 min-w-6 place-items-center rounded-[5px] px-1.5 font-mono text-[0.68rem] tracking-normal transition-colors duration-300 ${on ? "bg-ink text-white" : "bg-ink/[0.06] text-ink/70"}`}
                  >
                    0{i + 1}
                  </span>
                  {layer.name}
                </h3>
                <ul className="mt-4 space-y-2 text-[0.95rem] text-ink/65">
                  {layer.items.map((item, k) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 transition-[opacity,translate] duration-700 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none"
                      style={{ transitionDelay: `${landed - 350 + k * 90}ms`, transitionTimingFunction: EASE, opacity: seen ? 1 : 0, translate: seen ? "0 0" : "0 10px" }}
                    >
                      <span aria-hidden="true" className={`size-1 rounded-full transition-colors duration-300 ${on ? "bg-[#1a7f47]" : "bg-ink/30"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * A figure counting up to its value, easing out over about 1.5s from `delay` ms after `run`: "5,000+" climbs in whole
 * numbers; "1M+" climbs through the thousands (250K, 640K…) and lands on "1M+". Anything it can't read is shown as is.
 */
function CountUp({ value, run, delay, still }: { value: string; run: boolean; delay: number; still: boolean }) {
  const m = value.match(/^([\d,]+(?:\.\d+)?)([KM]?)(.*)$/);
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!run || still) return;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (t: number) => {
      const u = Math.min(1, Math.max(0, (t - start) / 1500));
      setK(1 - (1 - u) ** 4);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, still, delay]);
  if (!m) return <>{value}</>;
  const shown = still ? 1 : k;
  const unit = m[2] === "M" ? 1e6 : m[2] === "K" ? 1e3 : 1;
  const v = parseFloat(m[1].replace(/,/g, "")) * unit * shown;
  const text = m[2] === "M" ? (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`) : m[2] === "K" ? `${Math.round(v / 1e3)}K` : Math.round(v).toLocaleString("en-US");
  return (
    <>
      {text}
      {m[3]}
    </>
  );
}
