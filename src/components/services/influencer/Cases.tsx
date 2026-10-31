"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Label } from "../kit";
import { CANVAS, SHEET } from "../parts";
import { CASES } from "./content";

const HOLD = 7000; // ms each case study stays up while the section runs by itself
const OUT = 240; // ms the old study takes to lift away before the next floats in
const N = CASES.cases.length;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** A block floating up into place after `ms`: the change of study plays as one staggered, unhurried entrance. */
const enter = (ms: number): CSSProperties => ({ animation: `float-in 760ms cubic-bezier(0.22,1,0.36,1) ${ms}ms both` });

// Four case studies, one at a time. The card keeps what each study always had (the client's logo, the outcome as a
// headline, the story, the client's quote and the link) with the three results beside it as a scorecard on the site's
// dotted canvas. Under it, the clients as tabs in a pill: the active tab fills with brand green like a progress bar and,
// when it is full, the section moves on to the next study; any tab can be clicked to jump there. The loop pauses while
// the pointer or focus is on the card or tabs and while the section is off screen, and never runs with reduced motion
// (the active tab is then simply full).
//
// Changing study is one choreographed move rather than a swap: the old content lifts away and fades (the card itself
// never moves, so nothing jumps), then the new one floats up piece by piece, top to bottom, and the scorecard's numbers
// count up to their values.
export default function Cases() {
  const [active, setActive] = useState(0); // the tab
  const [shown, setShown] = useState(0); // the study on the card, which follows the tab after the old one has left
  const [leaving, setLeaving] = useState(false);
  const [p, setP] = useState(0); // how full the active tab is, 0–1
  const [held, setHeld] = useState(false); // pointer or focus is on the card or the tabs
  const [visible, setVisible] = useState(false);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const box = useRef<HTMLDivElement>(null);
  const fill = useRef(0);
  const now = useRef(0); // the tab, for the loop to read without restarting
  const swap = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => () => clearTimeout(swap.current), []);

  const go = (i: number) => {
    if (i === now.current) return;
    now.current = i;
    fill.current = 0;
    setP(0);
    setActive(i);
    clearTimeout(swap.current);
    if (reduced) {
      setShown(i);
      return;
    }
    setLeaving(true);
    swap.current = setTimeout(() => {
      setShown(i);
      setLeaving(false);
    }, OUT);
  };

  useEffect(() => {
    if (!visible || held || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      fill.current += (t - last) / HOLD;
      last = t;
      if (fill.current >= 1) go((now.current + 1) % N);
      else setP(fill.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go only reads refs and stable setters
  }, [visible, held, reduced]);

  const study = CASES.cases[shown];
  const hold = { onPointerEnter: () => setHeld(true), onPointerLeave: () => setHeld(false), onFocus: () => setHeld(true), onBlur: () => setHeld(false) };
  // The old study lifts and fades; the layer is only ever in this state for the length of OUT.
  const lift: CSSProperties = { opacity: leaving ? 0 : 1, transform: leaving ? "translateY(-10px)" : "none", transition: leaving ? `opacity ${OUT}ms ease-in, transform ${OUT}ms ease-in` : "none" };

  return (
    <section id="case-studies" aria-labelledby="cases-title" className="scroll-mt-24 px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{CASES.label}</Label>
        <h2 id="cases-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {CASES.title}
        </h2>

        <div ref={box} className="mt-14">
          <article
            {...hold}
            id="case-panel"
            role="tabpanel"
            aria-labelledby={`case-tab-${active}`}
            className="grid overflow-hidden rounded-2xl border border-line bg-white lg:min-h-[30rem] lg:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)]"
          >
            {/* The study. */}
            <div className="flex flex-col p-7 sm:p-10" style={lift}>
              <div key={`copy-${shown}`} className="flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-4" style={enter(0)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
                  <img src={study.logo} alt={study.client} className="h-7 w-auto max-w-[10rem] object-contain object-left" />
                  <span className="font-mono text-[0.66rem] tracking-[0.12em] text-muted uppercase">Case study</span>
                </div>
                <h3 className="mt-8 max-w-[24ch] text-[clamp(1.4rem,2.1vw,1.9rem)] leading-[1.15] font-medium tracking-[-0.035em] text-ink" style={enter(90)}>
                  {study.outcome}
                </h3>
                <p className="mt-4 max-w-[34rem] text-[1rem] leading-relaxed text-ink/65" style={enter(170)}>
                  {study.summary}
                </p>
                {study.quote && (
                  <blockquote className="mt-8 max-w-[34rem] border-l-2 border-primary pl-5" style={enter(250)}>
                    <p className="text-[1.05rem] leading-relaxed text-ink/85">“{study.quote.text}”</p>
                    <footer className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] text-muted uppercase">{study.quote.by}</footer>
                  </blockquote>
                )}
                <a href={study.href} className="group mt-auto inline-flex w-fit items-center gap-2 pt-9 text-[0.92rem] font-medium text-ink" style={enter(330)}>
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
                    Read the case study
                  </span>
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              </div>
            </div>

            {/* The three results, as a scorecard on the dotted canvas. */}
            <div className={`${CANVAS} flex items-center border-t border-line p-5 sm:p-8 lg:border-t-0 lg:border-l`}>
              <div className={`${SHEET} w-full`} style={lift}>
                <div key={`stats-${shown}`}>
                  <div className="flex items-center justify-between border-b border-line px-6 py-3.5" style={enter(120)}>
                    <span className="font-mono text-[0.64rem] tracking-[0.1em] text-ink/55 uppercase">Results</span>
                    <span className="font-mono text-[0.64rem] tracking-[0.1em] text-ink/40 uppercase">{study.client}</span>
                  </div>
                  <dl className="divide-y divide-line">
                    {study.stats.map((s, i) => (
                      <div key={s.label} className="flex items-center justify-between gap-5 px-6 py-6" style={enter(200 + i * 110)}>
                        <dd className="text-[clamp(2.2rem,3.4vw,3.1rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
                          <CountUp value={s.value} delay={260 + i * 110} still={reduced} />
                        </dd>
                        <dt className="max-w-[9rem] text-right text-[0.85rem] leading-snug text-ink/55">{s.label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </article>

          {/* The clients: the active one fills like a progress bar, and the section moves on when it is full. */}
          <div className="mt-6 flex justify-center">
            <div
              role="tablist"
              aria-label="Case studies"
              {...hold}
              className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1.5 shadow-[0_1px_2px_rgb(23_44_33/0.05),0_14px_30px_-16px_rgb(23_44_33/0.3)] ring-1 ring-black/[0.05]"
            >
              {CASES.cases.map((c, i) => {
                const on = i === active;
                return (
                  <button
                    key={c.client}
                    id={`case-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="case-panel"
                    onClick={() => go(i)}
                    className={`relative overflow-hidden rounded-full px-5 py-2.5 text-[0.92rem] whitespace-nowrap transition-colors duration-300 sm:px-6 ${on ? "font-medium text-ink" : "text-ink/45 hover:text-ink/80"}`}
                  >
                    {on && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 origin-left bg-[color-mix(in_srgb,var(--primary)_34%,white)]"
                        style={{ transform: `scaleX(${reduced ? 1 : p})` }}
                      />
                    )}
                    <span className="relative">{c.client}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A result that counts up to its value ("3.1M", "+38%", "4.6×"): the number rolls, its prefix and suffix stay put. */
function CountUp({ value, delay, still }: { value: string; delay: number; still: boolean }) {
  const m = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const [k, setK] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (t: number) => {
      const u = still ? 1 : Math.min(1, Math.max(0, (t - start) / 1000));
      setK(1 - (1 - u) ** 3);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [delay, still]);
  if (!m) return <>{value}</>;
  const decimals = (m[2].split(".")[1] ?? "").length;
  return (
    <>
      {m[1]}
      {(parseFloat(m[2]) * k).toFixed(decimals)}
      {m[3]}
    </>
  );
}
