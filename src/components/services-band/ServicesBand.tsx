"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BEATS, beatAt, storyOf } from "./content";
import Labels from "./Labels";

// The 3D world loads after the page has painted; the headline and caption are plain HTML.
const World = dynamic(() => import("./World"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * The services band: a pinned stage on white where one continuous illustrated world tells the growth system
 * in six beats. Your product settles onto Devable's hub, the camera visits each service's station in turn
 * (each plays its own short story as you scroll), then pulls back over the whole floor as the outcome
 * columns rise. A caption card follows along with a segmented progress bar.
 */
export default function ServicesBand() {
  const section = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const trackRef = useRef(beatAt(0));
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const still = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const x = beatAt(
        Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)),
      );
      trackRef.current = x;
      const i = Math.min(BEATS.length - 1, Math.max(0, Math.round(x)));
      const story = storyOf(x, i);
      setActive(i);
      setStep(BEATS[i].steps.filter((st) => story >= st.from).length - 1);
      card.current?.style.setProperty("--k", String(story));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "25% 0px" },
    );
    observer.observe(el);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  const beat = BEATS[active];

  return (
    <section
      ref={section}
      aria-labelledby="services-band-title"
      className="relative h-[1300svh] bg-[#f4f3ee]"
    >
      {/* The whole story for assistive tech; the stage below is visual. */}
      <ol className="sr-only">
        {BEATS.map((b) => (
          <li key={b.n}>
            {b.eyebrow}: {b.title}. {b.body}{" "}
            {b.href && <Link href={b.href}>Explore {b.eyebrow}</Link>}
          </li>
        ))}
      </ol>

      <div className="sticky top-0 h-svh overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          <World trackRef={trackRef} still={still} active={onScreen} />
        </div>
        {/* The world dissolves into the page at the stage's edges, so neighbouring stations and pipes fade
            out rather than being cut off. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 95% at 56% 54%, rgb(244 243 238 / 0) 52%, rgb(244 243 238 / 0.85) 78%, #f4f3ee 96%)",
          }}
        />
        <Labels />

        <div className="pointer-events-none absolute top-24 left-6 z-20 sm:left-12 lg:top-28 xl:left-[6vw]">
          <h2
            id="services-band-title"
            className="text-[clamp(1.75rem,2.9vw,2.75rem)] leading-[1.02] font-medium tracking-[-0.05em]"
          >
            <span className="block text-ink/30">One growth system.</span>
            <span className="block text-ink">Four channels.</span>
          </h2>
        </div>

        <div
          ref={card}
          aria-hidden="true"
          className="absolute right-4 bottom-4 left-4 z-20 rounded-2xl border border-line bg-white/95 p-5 shadow-[0_18px_40px_-24px_rgb(23_44_33/0.35)] backdrop-blur sm:left-auto sm:w-[23rem] lg:right-12 lg:bottom-10 xl:right-[6vw]"
        >
          <div key={active} className="animate-fade-up">
            <p className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[#14833f]">{beat.n}</span>
              {beat.eyebrow}
            </p>
            <h3 className="mt-2 text-[1.3rem] leading-tight font-medium tracking-[-0.035em] text-ink">
              {beat.title}
            </h3>
            <p className="mt-1.5 text-[0.93rem] leading-snug text-ink/60 max-sm:hidden">
              {beat.body}
            </p>
            {/* The beat's steps, each lighting as its part of the story plays. */}
            <ol className="mt-3.5 space-y-1.5 border-t border-line pt-3.5">
              {beat.steps.map((st, k) => (
                <li
                  key={st.text}
                  className={`flex items-center gap-2 text-[0.86rem] leading-tight transition-colors duration-300 ${k <= step ? "text-ink" : "text-ink/35"}`}
                >
                  <span
                    className={`grid size-[1.2rem] shrink-0 place-items-center rounded-full font-mono text-[0.6rem] transition-colors duration-300 ${k < step ? "bg-ink text-primary" : k === step ? "bg-primary text-ink" : "bg-ink/10 text-ink/50"}`}
                  >
                    {k + 1}
                  </span>
                  {st.text}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            {/* Done beats are dots, the current one a bar that fills as its story plays, the rest faint dots. */}
            <ol className="flex items-center gap-1.5">
              {BEATS.map((b, i) =>
                i === active ? (
                  <li
                    key={b.n}
                    className="relative h-1.5 w-12 overflow-hidden rounded-full bg-ink/10"
                  >
                    <span className="absolute inset-0 origin-left scale-x-[var(--k,0)] rounded-full bg-primary" />
                  </li>
                ) : (
                  <li
                    key={b.n}
                    className={`size-1.5 rounded-full ${i < active ? "bg-ink" : "bg-ink/15"}`}
                  />
                ),
              )}
            </ol>
            {beat.href && (
              <Link
                href={beat.href}
                tabIndex={-1}
                className="group inline-flex items-center gap-1 text-[0.85rem] font-medium text-ink"
              >
                Explore
                <span
                  aria-hidden="true"
                  className="grid size-5 place-items-center rounded-full bg-primary text-[0.75rem] text-ink transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
