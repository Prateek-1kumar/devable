"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Label } from "../kit";
import { FRAME, Mark, PILL, StepChip } from "../parts";
import { STEPS } from "./content";
import Conversation from "./Conversation";
import Discovery from "./Discovery";
import Research from "./Research";

const WIDE = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The page's signature: the three steps of the work, as three different jobs, each on its own screen, so nobody
// mistakes them for one dashboard in three colours. The screens share one dark surface (the same dotted grid)
// beside each step's words, so the section reads as one family:
//   01 Find the conversations that matter     research: a console scans threads, ranks them, and opens the best
//                                             to show why it's worth entering
//   02 Contribute with technical context      a real Reddit conversation, in Reddit's dark theme: a useful answer,
//                                             the product inside it
//   03 Strengthen search and AI visibility    the wider footprint: Google results and an AI answer, with Reddit as
//                                             one source among several
// A slim rail runs down the left with the Reddit disc riding it (sticky). It is also the progress: each step has
// a small node on it that lights when the disc reaches that step, and a hairline of green runs out from the node
// and fades away before the next. Nothing is ever faded: each screen starts from its first beat once at least
// half of it is on screen, stays on, in full colour, while it is, and plays again from the start when you scroll
// back to it; the step the disc is on only gets a deeper shadow. Below lg there is no rail. Reduced motion:
// every screen finished.
export default function Journey() {
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
  const [active, setActive] = useState(0); // the step the disc is on
  const [reached, setReached] = useState(0); // the furthest step it has reached
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.i);
          setActive(i);
          setReached((r) => Math.max(r, i));
        }
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );
    rows.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="journey-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{STEPS.label}</Label>
        <h2 id="journey-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {STEPS.title}
        </h2>

        <div className="mt-14 lg:grid lg:grid-cols-[3.5rem_minmax(0,1fr)]">
          {/* The rail, and the disc riding down it. */}
          <div aria-hidden="true" className="relative hidden lg:block">
            <span className="absolute top-8 bottom-8 left-1/2 w-px -translate-x-1/2 bg-ink/[0.09] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]" />
            <span className="sticky top-[calc(50vh-1.25rem)] z-20 mx-auto mt-8 mb-8 grid size-10 place-items-center rounded-full border border-line bg-white shadow-[0_1px_1.6px_rgb(15_26_20/0.05),0_8px_20px_rgb(15_26_20/0.1)]">
              <Mark name="reddit" className="size-5" />
            </span>
          </div>
          <ol className="space-y-5 lg:space-y-6">
            {STEPS.steps.map((s, i) => (
              <li
                key={s.name}
                data-i={i}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                className="relative"
              >
                {wide && <Rail i={i} last={STEPS.steps.length - 1} active={active} reached={reached} />}
                <Row i={i} step={s} current={wide && active === i} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

type Step = (typeof STEPS.steps)[number];

/** This step's node on the rail. Once the disc reaches it, a hairline of green runs out from the node, brightest at the node and fading before the next, so the rail reads as stations, not a progress bar. */
function Rail({ i, last, active, reached }: { i: number; last: number; active: number; reached: number }) {
  const seg = "absolute -left-7 w-px -translate-x-1/2 origin-top transition-transform duration-[1400ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none";
  const lit = reached >= i;
  return (
    <div aria-hidden="true">
      {i > 0 && (
        <span
          style={{ backgroundImage: "linear-gradient(to bottom, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--primary) 70%, transparent))" }}
          className={`${seg} top-[-0.75rem] h-[calc(50%+0.75rem)] ${lit ? "scale-y-100" : "scale-y-0"}`}
        />
      )}
      {i < last && (
        <span
          style={{ backgroundImage: "linear-gradient(to bottom, color-mix(in srgb, var(--primary) 70%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))", transitionDelay: "250ms" }}
          className={`${seg} top-1/2 h-[calc(50%+0.75rem)] ${lit ? "scale-y-100" : "scale-y-0"}`}
        />
      )}
      <span
        className={`absolute top-1/2 -left-7 z-10 grid size-3 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-white transition-[border-color,box-shadow] duration-700 motion-reduce:transition-none ${
          lit ? "border-primary/80 shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]" : "border-ink/20"
        }`}
      >
        <span className={`size-1 rounded-full bg-primary transition-opacity duration-700 ${lit ? "opacity-100" : "opacity-0"}`} />
        {active === i && <span className="absolute -inset-1.5 rounded-full border border-primary/40 motion-safe:animate-[ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite]" />}
      </span>
    </div>
  );
}

// The one screen all three visuals sit on: near-black with a faint dotted grid.
const SCREEN = "bg-[#0a0c0b] bg-[radial-gradient(rgb(255_255_255/0.055)_1px,transparent_1px)] [background-size:18px_18px]";

/**
 * True once at least `at` of the element is on screen, so what's inside starts from its first beat only when
 * you can actually see it; false again once it has fully left, so it plays from the beginning next time.
 */
function useShown<T extends Element>(at = 0.5) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= at) setOn(true);
        else if (!e.isIntersecting) setOn(false);
      },
      { threshold: [0, at] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [at]);
  return [ref, on] as const;
}

/** One step: its words beside its visual. The visual starts from its first beat when it's properly on screen and stays on while it is; the step the disc is on gets a deeper shadow. */
function Row({ i, step: s, current }: { i: number; step: Step; current: boolean }) {
  const [ref, on] = useShown<HTMLDivElement>(0.5);
  const scene: ReactNode = [<Research key="r" on={on} />, <Conversation key="c" on={on} />, <Discovery key="d" on={on} />][i];

  return (
    <div
      className={`${FRAME} grid grid-cols-1 transition-shadow duration-700 motion-reduce:transition-none lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] ${
        current ? "shadow-[0_30px_70px_-40px_rgb(15_26_20/0.3)]" : ""
      }`}
    >
      <div className="flex min-w-0 flex-col justify-center p-7 sm:p-10 xl:p-12">
        <StepChip n={i + 1} />
        <h3 className="mt-5 text-[clamp(1.5rem,2.1vw,2.05rem)] leading-[1.12] font-normal tracking-[-0.03em] text-ink">{s.name}</h3>
        <p className="mt-4 text-[0.97rem] leading-relaxed text-ink/70">{s.body}</p>
        {"body2" in s && <p className="mt-3 text-[0.97rem] leading-relaxed text-ink/70">{s.body2}</p>}
        <p className="mt-6 text-[0.82rem] text-ink/50">{s.listLabel}</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {s.items.map((item) => (
            <li key={item} className={PILL}>
              {item}
            </li>
          ))}
        </ul>
        {"note" in s && <p className="mt-6 border-t border-line pt-5 text-[0.92rem] leading-relaxed text-ink/60">{s.note}</p>}
      </div>
      <div
        ref={ref}
        aria-hidden="true"
        className={`${SCREEN} flex min-w-0 items-center justify-center px-4 py-8 sm:px-8 lg:min-h-[30rem] ${i % 2 ? "lg:order-first" : ""}`}
      >
        {scene}
      </div>
    </div>
  );
}
