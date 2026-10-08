"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { EYEBROW, INCLUDES_LABEL, INTRO, NAV_LABEL, STEPS, TITLE } from "./content";
import PanelPlayer, { type PlayMode } from "./PanelPlayer";
import { PANELS } from "./panels";

// How we work: a slim step nav on the left (~20%) and, on the right, one card
// per step that stacks over the previous one as you scroll. Each card pairs the
// step's live visual (a calm product moment on a dotted canvas) with its copy on
// a white panel. Below 1024px the nav hides and the cards simply follow each
// other; panels play once when in view. Reduced motion shows each settled frame.

const DESKTOP_QUERY = "(min-width: 1024px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const media = (query: string) => ({
  subscribe(onChange: () => void) {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(query).matches,
});
const desktopMedia = media(DESKTOP_QUERY);
const reducedMedia = media(REDUCED_QUERY);
const useMedia = (m: ReturnType<typeof media>) => useSyncExternalStore(m.subscribe, m.get, () => false);

/** Where card i sticks, in px from the viewport top: each peeks a little below the last. */
const STICK = 104;
const PEEK = 12;
const stickAt = (i: number) => STICK + i * PEEK;

export default function HowWeWork() {
  const desktop = useMedia(desktopMedia);
  const reduced = useMedia(reducedMedia);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [runs, setRuns] = useState(() => STEPS.map(() => 0));
  const [inView, setInView] = useState(() => STEPS.map(() => false));
  const cards = useRef<(HTMLElement | null)[]>([]);
  // Zero-height markers where each card sits in the document flow (a stuck card's own rect doesn't move).
  const marks = useRef<(HTMLDivElement | null)[]>([]);

  // Desktop: the active step is the last card that has reached its sticky slot.
  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      let next = 0;
      marks.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= stickAt(i) + 4) next = i;
      });
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
        setRuns((r) => r.map((v, i) => (i === next ? v + 1 : v)));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [desktop]);

  // Which cards are on screen: desktop plays the active one only while visible; small screens play each in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        setInView((prev) => {
          const next = [...prev];
          for (const entry of entries) {
            const i = cards.current.indexOf(entry.target as HTMLElement);
            if (i >= 0) next[i] = entry.isIntersecting;
          }
          return next;
        }),
      { threshold: 0.3 },
    );
    cards.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const go = (i: number) => {
    const el = marks.current[i];
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - stickAt(i) + 1, behavior: reduced ? "auto" : "smooth" });
  };

  const mode: PlayMode = reduced ? "still" : desktop ? "loop" : "once";

  return (
    <section id="how-we-work" aria-labelledby="how-we-work-title" className="relative px-6 py-24 sm:px-12 lg:py-32 xl:px-[6vw]">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">{EYEBROW}</p>
          <h2 id="how-we-work-title" className="mt-4 max-w-[16ch] text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.04] font-normal tracking-[-0.04em] text-ink">
            {TITLE}
          </h2>
        </div>
        <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">{INTRO}</p>
      </header>

      <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(10rem,18%)_minmax(0,1fr)] lg:gap-[3vw]">
        {/* The nav: vertically centered in the viewport with smooth tactile beads that adapt the site UI. */}
        <nav aria-label={NAV_LABEL} className="hidden lg:block">
          <div className="sticky top-[max(112px,calc(50vh-170px))]">
            <ol className="relative pl-6 space-y-1.5">
              {/* The vertical string / cord connecting the beads */}
              <div
                aria-hidden="true"
                className="absolute left-[7px] top-4 bottom-4 w-[1.5px] -translate-x-1/2 bg-gradient-to-b from-transparent via-line to-transparent"
              />

              {STEPS.map((step, i) => {
                const on = i === active;
                return (
                  <li key={step.n} className="group relative">
                    {/* The bead on the vertical thread */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-[7px] top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        on
                          ? "h-5 w-2.5 rounded-full bg-primary ring-4 ring-primary-soft shadow-[0_2px_8px_rgba(31,77,58,0.25)]"
                          : i < active
                          ? "h-2.5 w-2.5 rounded-full bg-light-green ring-2 ring-light-green-soft shadow-xs"
                          : "h-2 w-2 rounded-full bg-card border border-ink/20 shadow-xs group-hover:scale-125 group-hover:border-secondary/60 group-hover:bg-secondary-soft/50"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={on ? "step" : undefined}
                      className={`flex w-full items-center gap-3 rounded-full py-2 px-3.5 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        on
                          ? "bg-card/90 shadow-[0_2px_12px_-4px_rgba(15,26,20,0.08)] border border-line/80 text-ink"
                          : "text-muted hover:text-ink hover:bg-card/40 border border-transparent"
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] font-medium tracking-[0.08em] transition-colors duration-300 ${
                          on ? "text-secondary font-semibold" : "text-muted/80 group-hover:text-ink"
                        }`}
                      >
                        {step.n}
                      </span>
                      <span
                        className={`text-[0.93rem] tracking-[-0.01em] transition-colors duration-300 ${
                          on ? "font-semibold text-ink" : "font-normal text-muted group-hover:text-ink"
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Step counter pill with micro progress beads */}
            <div className="mt-5 pl-6">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-card/70 px-3.5 py-1.5 shadow-xs backdrop-blur-xs">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {STEPS.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-400 ${
                        idx === active
                          ? "w-3 bg-secondary"
                          : idx < active
                          ? "w-1.5 bg-light-green"
                          : "w-1.5 bg-line"
                      }`}
                    />
                  ))}
                </div>
                <span className="h-3 w-px bg-line" aria-hidden="true" />
                <p className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                  <span className="font-semibold text-ink">{STEPS[active].n}</span>
                  <span className="mx-1 text-muted/60">/</span>
                  <span>0{STEPS.length}</span>
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* The cards. On desktop each sticks a little lower than the last, so they stack. */}
        <div>
          {STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <div
                aria-hidden="true"
                ref={(el) => {
                  marks.current[i] = el;
                }}
              />
              <article
                ref={(el) => {
                  cards.current[i] = el;
                }}
                aria-labelledby={`hww-step-${step.n}`}
                style={{ "--stick": `${stickAt(i)}px` } as CSSProperties}
                className={`grid overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(15_26_20/0.04),0_16px_40px_-24px_rgb(15_26_20/0.18)] lg:sticky lg:top-(--stick) lg:h-[min(36rem,calc(100svh-10rem))] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] ${i < STEPS.length - 1 ? "mb-8 lg:mb-[24vh]" : ""}`}
              >
                {/* The live visual on a warm dotted canvas. */}
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center border-b border-line bg-[#f3f1eb] bg-[radial-gradient(#dcd8cd_1px,transparent_1px)] [background-size:16px_16px] p-5 sm:p-8 lg:border-r lg:border-b-0"
                >
                  <PanelPlayer panel={PANELS[i]} mode={mode} playing={desktop ? i === active && inView[i] : inView[i]} run={runs[i]} />
                </div>
                {/* The copy. */}
                <div className="flex flex-col justify-center overflow-y-auto p-7 sm:p-10 xl:p-12">
                  <p className="inline-flex w-fit rounded-md border border-line px-2 py-1 font-mono text-[11px] tracking-[0.1em] text-ink/70">{step.n}</p>
                  <h3 id={`hww-step-${step.n}`} className="mt-5 text-[clamp(1.5rem,2.1vw,2.05rem)] leading-[1.12] font-normal tracking-[-0.03em] text-ink">
                    {step.headline}
                  </h3>
                  <p className="mt-4 text-[0.97rem] leading-relaxed text-ink/70">{step.body}</p>
                  <p className="sr-only">{INCLUDES_LABEL}</p>
                  <ul className="mt-6 flex flex-wrap gap-1.5">
                    {step.includes.map((item) => (
                      <li key={item} className="rounded-md border border-line bg-paper/60 px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] text-ink/80">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="sr-only">{step.panel}</p>
                </div>
              </article>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
