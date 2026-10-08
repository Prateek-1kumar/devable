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

/**
 * Calculates the sticky top offset so cards are perfectly centered vertically in the viewport.
 */
const getStickTop = () => {
  if (typeof window === "undefined") return 140;
  const vh = window.innerHeight;
  const cardH = Math.min(576, vh - 160);
  return Math.max(90, Math.round((vh - cardH) / 2));
};

export default function HowWeWork() {
  const desktop = useMedia(desktopMedia);
  const reduced = useMedia(reducedMedia);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [runs, setRuns] = useState(() => STEPS.map(() => 0));
  const [inView, setInView] = useState(() => STEPS.map(() => false));
  const cards = useRef<(HTMLElement | null)[]>([]);
  // Zero-height markers where each card sits in the document flow.
  const marks = useRef<(HTMLDivElement | null)[]>([]);

  // Desktop: the active step is the last card that has reached the centered sticky slot.
  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const stick = getStickTop();
      let next = 0;
      marks.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= stick + 12) next = i;
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
    const stick = getStickTop();
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - stick + 1,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const mode: PlayMode = reduced ? "still" : desktop ? "loop" : "once";

  return (
    <section id="how-we-work" aria-labelledby="how-we-work-title" className="relative px-6 pt-24 pb-32 sm:px-12 lg:pt-32 lg:pb-52 xl:px-[6vw]">
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
        {/* The nav: vertically centered in the viewport, minimal hairline rail with a quiet connector to the cards. */}
        <nav aria-label={NAV_LABEL} className="hidden lg:block">
          <div className="sticky top-[max(112px,calc(50vh-140px))]">
            <ol className="border-l border-ink/10">
              {STEPS.map((step, i) => {
                const on = i === active;
                return (
                  <li key={step.n} className="relative">
                    {/* Active rail indicator: soft rounded hairline bar */}
                    <span
                      aria-hidden="true"
                      className={`absolute -left-px top-2 bottom-2 w-0.5 rounded-full bg-ink transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        on ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={on ? "step" : undefined}
                      className="group flex w-full items-center py-3 pl-5 pr-1 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span
                        className={`font-mono text-[11px] tracking-[0.08em] transition-colors duration-300 ${
                          on ? "text-accent font-semibold" : "text-muted/60 group-hover:text-ink/80"
                        }`}
                      >
                        {step.n}
                      </span>
                      <span
                        className={`ml-3.5 text-[0.95rem] tracking-[-0.015em] transition-colors duration-300 ${
                          on ? "font-semibold text-ink" : "font-normal text-muted group-hover:text-ink"
                        }`}
                      >
                        {step.title}
                      </span>

                      {/* Subtle connector leader to the cards */}
                      <span
                        aria-hidden="true"
                        className={`ml-auto flex items-center pl-3 transition-all duration-300 ease-out ${
                          on
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-2 pointer-events-none"
                        }`}
                      >
                        <span className="h-px w-5 bg-ink/25" />
                        <span className="size-1 rounded-full bg-ink/35" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Quiet minimal counter */}
            <p
              className="mt-7 pl-5 font-mono text-[11px] tracking-[0.12em] text-muted/60 uppercase"
              aria-hidden="true"
            >
              <span className="font-semibold text-ink">{STEPS[active].n}</span>
              <span className="mx-1.5 opacity-40">/</span>
              <span>0{STEPS.length}</span>
            </p>
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
                style={
                  {
                    top: "max(90px, calc((100svh - min(36rem, calc(100svh - 10rem))) / 2))",
                    zIndex: i + 10,
                  } as CSSProperties
                }
                className={`grid overflow-hidden rounded-2xl border border-line bg-card shadow-none lg:sticky lg:h-[min(36rem,calc(100svh-10rem))] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] transition-opacity duration-200 ${
                  i < active ? "lg:opacity-0 lg:pointer-events-none" : "lg:opacity-100"
                } ${i < STEPS.length - 1 ? "mb-8 lg:mb-[36vh]" : "mb-8 lg:mb-[50vh]"}`}
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
