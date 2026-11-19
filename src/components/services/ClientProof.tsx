"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Label } from "./kit";

// "Client proof", shared by the Reddit and Search & AI pages, in the Influencer page's case-study layout: one featured case
// study at a time in a soft brand-green frame holding two inset panels. On the left, the words: services, the key result, a
// short description and the link. On the right, the client's logo in ink on the brand green, with a soft light, a fine grid
// and an arc. Under the card, the clients as tabs: the active tab fills like a
// progress bar and, when it is full, the section moves on to the next client; any tab can be clicked. The loop pauses while the
// pointer or focus is on the link or the tabs and while the section is off screen, and never runs with reduced motion.
// Changing client is one choreographed move: the old content lifts away, the new one floats up, and the card never changes
// height (every client's words share one grid cell, so it is as tall as the tallest).
// Only the clients and services are real so far; the result, description and quote are visible placeholder slots, flagged
// Sample, so none of them can be mistaken for a real claim.

export type ProofCase = { client: string; logo?: string; services: string[]; href: string };
type Slots = { result: string; summary: string; quote?: string };

const KEYFRAMES = `
@keyframes proof-in { from { opacity: 0; transform: translateY(16px); } }
`;
const HOLD = 7000; // ms each client stays up
const OUT = 240; // ms the old client takes to lift away

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const enterAt = (ms: number): CSSProperties => ({ animation: `proof-in 760ms cubic-bezier(0.22,1,0.36,1) ${ms}ms both` });

const DOT: Record<string, string> = { Reddit: "bg-[#ff4500]", "Search & AI Visibility": "bg-[#14b85a]", "Creator Distribution": "bg-[#7a5af5]" };

export default function ClientProof({ label, title, slots, cases }: { label: string; title: string; slots: Slots; cases: ProofCase[] }) {
  const N = cases.length;
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [p, setP] = useState(0);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const box = useRef<HTMLDivElement>(null);
  const fill = useRef(0);
  const now = useRef(0);
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

  const c = cases[shown];
  const hold = { onPointerEnter: () => setHeld(true), onPointerLeave: () => setHeld(false), onFocus: () => setHeld(true), onBlur: () => setHeld(false) };
  const lift: CSSProperties = { opacity: leaving ? 0 : 1, transform: leaving ? "translateY(-10px)" : "none", transition: leaving ? `opacity ${OUT}ms ease-in, transform ${OUT}ms ease-in` : "none" };

  return (
    <section id="case-studies" aria-labelledby="cases-title" className="scroll-mt-24 px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <style href="client-proof" precedence="default">
        {KEYFRAMES}
      </style>
      <div className="mx-auto max-w-[76rem]">
        <Label>{label}</Label>
        <h2 id="cases-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {title}
        </h2>

        <div ref={box} className="mt-14">
          <article id="case-panel" role="tabpanel" aria-labelledby={`case-tab-${active}`} className="rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_16%,white)] p-2 ring-1 ring-primary/25 sm:p-2.5">
            <div className="grid gap-2 sm:gap-2.5 lg:min-h-[24rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              {/* The words. Every client's sit in one grid cell and only the live one is seen. */}
              <div className="grid rounded-[9px] bg-white p-6 shadow-[0_1px_2px_rgb(23_44_33/0.05)] sm:p-8" style={lift}>
                {cases.map((k) => (
                  <div key={k.client} aria-hidden="true" className="invisible flex flex-col [grid-area:1/1]">
                    <Words c={k} slots={slots} live={false} />
                  </div>
                ))}
                <div key={`copy-${shown}`} className="flex flex-col [grid-area:1/1]">
                  <Words c={c} slots={slots} live hold={hold} />
                </div>
              </div>

              {/* The client: its logo on the brand green, with a soft light, a fine grid and an arc. */}
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
                <div className="absolute inset-x-0 top-0 h-[65%] bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgb(255_255_255/0.45),transparent_70%)]" />
                <div style={{ bottom: "-150%", width: "105%" }} className="absolute left-1/2 aspect-square -translate-x-1/2 rounded-full border border-white/70 shadow-[inset_0_26px_70px_-24px_rgb(255_255_255/0.7),0_-8px_50px_-10px_rgb(255_255_255/0.5)]" />
                <div className="relative flex w-full flex-col items-center px-8" style={lift}>
                  <div key={`logo-${shown}`} className="flex w-full justify-center" style={enterAt(60)}>
                    {c.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- static logo, shown as an ink silhouette
                      <img src={c.logo} alt="" className="h-[clamp(2.4rem,4.4vw,3.6rem)] w-auto max-w-[80%] object-contain opacity-90 brightness-0 [image-rendering:auto]" />
                    ) : (
                      <span className="text-[clamp(2.4rem,4.4vw,3.6rem)] leading-none font-semibold tracking-[-0.05em] text-ink/90">{c.client.toLowerCase()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* The clients, in a bar of the card's own shape: the active one fills like a progress bar, and the section moves on when it is full. */}
          <div className="mt-5 flex justify-center">
            <div
              role="tablist"
              aria-label="Client proof"
              {...hold}
              className="flex max-w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1.5 shadow-[0_1px_2px_rgb(23_44_33/0.05),0_14px_30px_-16px_rgb(23_44_33/0.3)] ring-1 ring-black/[0.05]"
            >
              {cases.map((k, i) => {
                const on = i === active;
                return (
                  <button
                    key={k.client}
                    id={`case-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="case-panel"
                    onClick={() => go(i)}
                    className={`relative overflow-hidden rounded-[6px] px-5 py-2.5 text-[0.92rem] whitespace-nowrap transition-colors duration-300 sm:px-7 ${on ? "font-medium text-ink" : "text-ink/45 hover:text-ink/80"}`}
                  >
                    {on && <span aria-hidden="true" className="absolute inset-0 origin-left bg-[color-mix(in_srgb,var(--primary)_34%,white)]" style={{ transform: `scaleX(${reduced ? 1 : p})` }} />}
                    <span className="relative">{k.client}</span>
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

/** One client's words: kicker, services, the result, the work, the quote slot and the link. `live` is the one on show (it animates in); the others only size the card. */
function Words({ c, slots, live, hold }: { c: ProofCase; slots: Slots; live: boolean; hold?: Record<string, () => void> }) {
  const enter = (ms: number) => (live ? enterAt(ms) : undefined);
  return (
    <>
      <p className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.12em] text-ink/55 uppercase" style={enter(0)}>
        <span className="size-1.5 rounded-full bg-[#1a7f47]" />
        Case study
      </p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${c.client}: services`} style={enter(60)}>
        {c.services.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2eb] px-2.5 py-1 text-[0.75rem] font-medium tracking-[-0.005em] text-ink">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${DOT[s] ?? "bg-ink/40"}`} />
            {s}
          </li>
        ))}
      </ul>
      <div style={enter(130)}>
        <Slot className="mt-7 text-[clamp(1.45rem,2.2vw,1.9rem)] leading-[1.15] font-normal tracking-[-0.035em]">{slots.result}</Slot>
        <Slot className="mt-5 text-[0.95rem] leading-[1.6]">{slots.summary}</Slot>
        {slots.quote && <Slot className="mt-4 text-[0.95rem] leading-[1.6] italic">{slots.quote}</Slot>}
      </div>
      <a
        href={c.href}
        {...(live ? hold : {})}
        tabIndex={live ? undefined : -1}
        className="group mt-auto inline-flex w-fit items-center gap-2 pt-8 text-[0.92rem] font-medium text-ink"
        style={enter(260)}
      >
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]">View case study</span>
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
          →
        </span>
      </a>
    </>
  );
}

/** A placeholder slot, greyed and flagged so it can't be mistaken for a real result. */
function Slot({ children, className }: { children: ReactNode; className: string }) {
  return (
    <p className={`text-ink/35 ${className}`}>
      <span className="mr-2 inline-block rounded-full bg-[color-mix(in_srgb,var(--accent)_9%,white)] px-2 py-0.5 align-middle text-[0.68rem] font-medium tracking-normal text-[color-mix(in_srgb,var(--accent)_85%,var(--ink))] not-italic">Sample</span>
      {children}
    </p>
  );
}
