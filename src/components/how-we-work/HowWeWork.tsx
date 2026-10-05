"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EYEBROW, INCLUDES_LABEL, INTRO, NAV_LABEL, STEPS, TITLE } from "./content";
import PanelPlayer, { type PlayMode } from "./PanelPlayer";
import { PANELS } from "./panels";

// How we work: a tall scroll section with a sticky three-column stage on
// desktop (step nav · animated product panel · copy). Scrolling advances the
// steps; panels crossfade. Below 1024px, or with reduced motion, the same DOM
// stacks: each step's copy followed by its panel, which plays once in view
// (or shows its settled final frame). The layout switch is pure CSS, so there
// is no shift on hydration; JS only decides which step is active and plays.

const SCROLL_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const media = (query: string) => ({
  subscribe(onChange: () => void) {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(query).matches,
});
const scrollMedia = media(SCROLL_QUERY);
const reducedMedia = media(REDUCED_QUERY);
const useMedia = (m: ReturnType<typeof media>) => useSyncExternalStore(m.subscribe, m.get, () => false);

export default function HowWeWork() {
  const scroll = useMedia(scrollMedia);
  const reduced = useMedia(reducedMedia);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [runs, setRuns] = useState(() => STEPS.map(() => 0));
  const [stageOnScreen, setStageOnScreen] = useState(false);
  const [inView, setInView] = useState(() => STEPS.map(() => false));
  const panelEls = useRef<(HTMLDivElement | null)[]>([]);

  // Desktop: the step follows scroll progress through the track.
  useEffect(() => {
    if (!scroll) return;
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? -rect.top / span : 0;
      const next = Math.min(STEPS.length - 1, Math.max(0, Math.floor(p * STEPS.length)));
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
        setRuns((r) => r.map((v, i) => (i === next ? v + 1 : v)));
      }
      setStageOnScreen(rect.bottom > 0 && rect.top < window.innerHeight);
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
  }, [scroll]);

  // Stacked: each panel plays while it is in view.
  useEffect(() => {
    if (scroll) return;
    const observer = new IntersectionObserver(
      (entries) =>
        setInView((prev) => {
          const next = [...prev];
          for (const entry of entries) {
            const i = panelEls.current.indexOf(entry.target as HTMLDivElement);
            if (i >= 0) next[i] = entry.isIntersecting;
          }
          return next;
        }),
      { threshold: 0.35 },
    );
    panelEls.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [scroll]);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / STEPS.length) * span, behavior: "smooth" });
  };

  const mode: PlayMode = reduced ? "still" : scroll ? "loop" : "once";

  return (
    <section id="how-we-work" aria-labelledby="how-we-work-title" className="relative px-6 py-24 sm:px-12 lg:py-32 xl:px-[5vw]">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">{EYEBROW}</p>
          <h2 id="how-we-work-title" className="mt-4 max-w-[16ch] text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.04] font-normal tracking-[-0.04em] text-ink">
            {TITLE}
          </h2>
        </div>
        <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">{INTRO}</p>
      </header>

      <div ref={track} className="relative mt-16 lg:motion-safe:mt-4 lg:motion-safe:h-[500svh]">
        <div className="lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:flex lg:motion-safe:h-svh lg:motion-safe:items-center">
          <div className="grid w-full gap-20 lg:motion-safe:grid-cols-[2.75rem_minmax(0,1fr)_17rem] lg:motion-safe:items-center lg:motion-safe:gap-8 xl:motion-safe:grid-cols-[12.5rem_minmax(0,1fr)_19rem] xl:motion-safe:gap-10 2xl:motion-safe:grid-cols-[14rem_minmax(0,1fr)_22rem]">
            <nav aria-label={NAV_LABEL} className="hidden lg:motion-safe:col-start-1 lg:motion-safe:row-start-1 lg:motion-safe:block">
              <ol className="flex flex-col gap-1.5">
                {STEPS.map((step, i) => {
                  const on = i === active;
                  return (
                    <li key={step.n}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-current={on ? "step" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl border p-1.5 xl:px-2.5 xl:py-2 text-left font-mono text-[11px] tracking-[0.06em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                          on ? "border-ink/15 bg-card text-ink shadow-[0_1px_2px_rgb(15_26_20/0.05)]" : "border-transparent text-muted hover:text-ink"
                        }`}
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-md border text-[11px] transition-colors duration-300 ${
                            on ? "border-primary bg-primary text-white" : "border-ink/15 bg-transparent"
                          }`}
                        >
                          {step.n}
                        </span>
                        {/* Below xl the nav is numbers only, so the panel keeps its width. */}
                        <span className="sr-only xl:not-sr-only">{step.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {STEPS.map((step, i) => {
              const on = i === active;
              const fade = `lg:motion-safe:row-start-1 lg:motion-safe:transition-[opacity,translate] lg:motion-safe:duration-500 ${
                on ? "" : "lg:motion-safe:pointer-events-none lg:motion-safe:opacity-0"
              }`;
              return (
                <div key={step.n} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-center lg:gap-14 lg:motion-safe:contents">
                  <div className={`lg:motion-safe:col-start-3 ${fade} ${on ? "" : "lg:motion-safe:translate-y-2"}`}>
                    <p className="font-mono text-xs tracking-[0.12em] text-muted uppercase">
                      <span className="text-ink">{step.n}</span> / 0{STEPS.length} · {step.title}
                    </p>
                    <h3 className="mt-4 text-[clamp(1.6rem,2.3vw,2.25rem)] leading-[1.1] font-normal tracking-[-0.03em] text-ink">{step.headline}</h3>
                    <p className="mt-4 text-[0.98rem] leading-relaxed text-muted">{step.body}</p>
                    <p className="mt-6 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{INCLUDES_LABEL}</p>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {step.includes.map((item) => (
                        <li key={item} className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[10.5px] tracking-[0.06em] text-ink uppercase">
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="sr-only">{step.panel}</p>
                  </div>
                  <div
                    ref={(el) => {
                      panelEls.current[i] = el;
                    }}
                    aria-hidden="true"
                    className={`lg:motion-safe:col-start-2 ${fade} flex justify-center`}
                  >
                    {/* Warm dotted-grid canvas; the panel keeps its aspect and fits the viewport height. */}
                    <div className="w-full max-w-2xl rounded-3xl border border-line bg-[#efece4] bg-[radial-gradient(#d6d1c4_1px,transparent_1px)] [background-size:14px_14px] p-3 sm:p-4 lg:motion-safe:max-w-[calc((100svh-8rem)*1.077+2rem)]">
                      <PanelPlayer
                        panel={PANELS[i]}
                        mode={mode}
                        playing={scroll ? on && stageOnScreen : inView[i]}
                        run={runs[i]}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
