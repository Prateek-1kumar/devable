"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Label } from "../kit";
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

// Four case studies, one at a time, framed like a premium product card: a soft brand-green frame holding two inset panels with
// small radii. On the left, only what persuades: the headline, the client's quote set large with who said it, and the link.
// On the right, a visual for the client: its logo in ink on the brand green, with a soft light and a fine grid, with the three
// results in one frosted glass pill floating at its foot, small enough to leave the visual alone. Under the card, the clients as
// tabs in a rectangular bar of the same shape: the active tab fills with brand green like a progress bar and, when it is full,
// the section moves on to the next study; any tab can be clicked to jump there. The loop pauses while the pointer or focus is
// on the card or tabs and while the section is off screen, and never runs with reduced motion (the active tab is then simply
// full).
//
// Changing study is one choreographed move rather than a swap: the old content lifts away and fades (the frame never moves,
// so nothing jumps), then the new one floats up piece by piece, and the featured number counts up.
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
          <article {...hold} id="case-panel" role="tabpanel" aria-labelledby={`case-tab-${active}`} className="rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_16%,white)] p-2 ring-1 ring-primary/25 sm:p-2.5">
            <div className="grid gap-2 sm:gap-2.5 lg:min-h-[30rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              {/* The words: the headline, the quote, the link. */}
              <div className="flex flex-col rounded-[9px] bg-white p-6 shadow-[0_1px_2px_rgb(23_44_33/0.05)] sm:p-9" style={lift}>
                <div key={`copy-${shown}`} className="flex flex-1 flex-col">
                  <p className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.12em] text-ink/55 uppercase" style={enter(0)}>
                    <span className="size-1.5 rounded-full bg-[#1a7f47]" />
                    Case study
                  </p>
                  <h3 className="mt-5 max-w-[20ch] text-[clamp(1.55rem,2.5vw,2.2rem)] leading-[1.1] font-medium tracking-[-0.04em] text-ink" style={enter(90)}>
                    {study.outcome}
                  </h3>
                  {study.quote && (
                    <blockquote className="mt-10 lg:mt-auto" style={enter(200)}>
                      <p className="text-[clamp(1.05rem,1.45vw,1.3rem)] leading-[1.5] tracking-[-0.01em] text-ink/80">“{study.quote.text}”</p>
                      <footer className="mt-4 font-mono text-[0.68rem] tracking-[0.1em] text-ink/45 uppercase">{study.quote.by}</footer>
                    </blockquote>
                  )}
                  <a href={study.href} className="group mt-8 inline-flex w-fit items-center gap-2 text-[0.92rem] font-medium text-ink" style={enter(300)}>
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]">
                      Read the case study
                    </span>
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                  </a>
                </div>
              </div>

              {/* The visual: the client's logo on the brand green, with a soft light, a fine grid and an arc, and the results in a glass pill. */}
              <div
                className="relative flex min-h-[15rem] items-center justify-center overflow-hidden rounded-[9px] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--primary)_78%,white)_0%,var(--primary)_46%,color-mix(in_srgb,var(--primary)_82%,var(--ink))_100%)] lg:min-h-0"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "linear-gradient(rgb(255 255 255 / 0.22) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.22) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                    maskImage: "radial-gradient(ellipse 80% 75% at 50% 45%, #000 15%, transparent 100%)",
                  }}
                />
                {/* A soft light from above, and the arc rising from the bottom edge. */}
                <div className="absolute inset-x-0 top-0 h-[65%] bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgb(255_255_255/0.45),transparent_70%)]" />
                <div className="absolute bottom-[-78%] left-1/2 aspect-square w-[125%] -translate-x-1/2 rounded-full border border-white/70 shadow-[inset_0_26px_70px_-24px_rgb(255_255_255/0.7),0_-8px_50px_-10px_rgb(255_255_255/0.5)]" />

                <div className="relative flex w-full flex-col items-center px-8 pb-20 sm:pb-24" style={lift}>
                  <div key={`logo-${shown}`} className="flex w-full justify-center" style={enter(60)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static logo, shown as an ink silhouette */}
                    <img src={study.logo} alt={study.client} className="h-[clamp(2.4rem,4.4vw,3.6rem)] w-auto max-w-[80%] object-contain opacity-90 brightness-0" />
                  </div>
                </div>

                {/* The results, in one frosted glass pill floating at the foot of the panel: the green and the grid show through it,
                    and the figures build left to right to the business outcome. */}
                <div className="absolute bottom-4 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 sm:bottom-6" style={lift}>
                  <dl
                    key={`stats-${shown}`}
                    className="flex items-center gap-5 rounded-full bg-white/25 px-6 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.65),inset_0_0_0_1px_rgb(255_255_255/0.35),0_16px_32px_-16px_rgb(23_44_33/0.4)] backdrop-blur-xl backdrop-saturate-150 sm:gap-9 sm:px-9 sm:py-3.5"
                    style={enter(260)}
                  >
                    {study.stats.map((r, n) => (
                      <div key={r.label}>
                        <dd className="text-[clamp(1.05rem,1.7vw,1.4rem)] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums">
                          <CountUp value={r.value} delay={420 + n * 120} still={reduced} />
                        </dd>
                        <dt className="mt-1.5 font-mono text-[0.5rem] leading-snug tracking-[0.08em] whitespace-nowrap text-ink/65 uppercase sm:text-[0.56rem]">{r.label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </article>

          {/* The clients, in a bar of the card's own shape: the active one fills like a progress bar, and the section moves on when it is full. */}
          <div className="mt-5 flex justify-center">
            <div
              role="tablist"
              aria-label="Case studies"
              {...hold}
              className="flex max-w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1.5 shadow-[0_1px_2px_rgb(23_44_33/0.05),0_14px_30px_-16px_rgb(23_44_33/0.3)] ring-1 ring-black/[0.05]"
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
                    className={`relative overflow-hidden rounded-[6px] px-5 py-2.5 text-[0.92rem] whitespace-nowrap transition-colors duration-300 sm:px-7 ${on ? "font-medium text-ink" : "text-ink/45 hover:text-ink/80"}`}
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
      {(parseFloat(m[2]) * (still ? 1 : k)).toFixed(decimals)}
      {m[3]}
    </>
  );
}
