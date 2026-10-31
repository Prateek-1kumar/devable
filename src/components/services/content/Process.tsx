"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Label } from "../kit";
import { StepChip } from "../parts";
import { PROCESS } from "./content";
import { clamp01, usePlay } from "./play";
import { SCENES } from "./ProcessScenes";

const N = PROCESS.steps.length;
const LG = "(min-width: 1024px)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(LG);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The workflow as one stage you scroll through. A full-width rail of the six steps sits on top, each step's
// hairline filling continuously with scroll and the active one in ink (the signature step carries a coral dot);
// below it the active step on the left and, on the right, the artifact that step produces, played once when it
// becomes active. The stage pins while you scroll the steps (clicking the rail jumps to one). Phones don't pin:
// the rail scrolls sideways and a tap changes the step.
export default function Process() {
  const track = useRef<HTMLDivElement>(null);
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(LG).matches, () => false);
  const [p, setP] = useState(0); // scroll progress through the stage (wide screens)
  const [tapped, setTapped] = useState(0); // the step on narrow screens

  useEffect(() => {
    const el = track.current;
    if (!el || !wide) return;
    const update = () => setP(clamp01(-el.getBoundingClientRect().top / (el.offsetHeight - window.innerHeight)));
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [wide]);

  const active = wide ? Math.min(N - 1, Math.floor(p * N)) : tapped;
  // The pill follows the active step, not the raw scroll: its leading edge moves first and the trailing edge a beat
  // later (whichever way you are going), so it stretches and settles instead of tracking every scroll tick.
  const [prev, setPrev] = useState({ at: active, dir: 1 });
  if (prev.at !== active) setPrev({ at: active, dir: active > prev.at ? 1 : -1 });
  const lead = "560ms cubic-bezier(0.22,1,0.36,1)";
  const trail = "560ms cubic-bezier(0.22,1,0.36,1) 120ms";

  const go = (i: number) => {
    const el = track.current;
    if (!wide || !el) return setTapped(i);
    const top = window.scrollY + el.getBoundingClientRect().top;
    window.scrollTo({ top: top + ((i + 0.5) / N) * (el.offsetHeight - window.innerHeight), behavior: "smooth" });
  };

  const step = PROCESS.steps[active];
  return (
    <section aria-labelledby="process-title" className="bg-[#f6f5f1]">
      <div ref={track} className="px-6 py-20 sm:px-12 lg:h-[560svh] lg:py-0 xl:px-[6vw]">
        <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:pt-20 lg:pb-6">
          <div className="mx-auto w-full max-w-[76rem]">
            <Label>{PROCESS.label}</Label>
            <h2 id="process-title" className="mt-5 text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
              {PROCESS.title}
            </h2>

            {/* The track: one capsule, with an ink indicator that slides to the active step. */}
            <div className="-mx-6 mt-8 overflow-x-auto px-6 pb-2 sm:-mx-12 sm:px-12 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
              <div className="relative min-w-[44rem] rounded-full border border-black/[0.06] bg-white/80 p-1.5 shadow-[0_1px_2px_rgb(23_44_33/0.04),0_12px_28px_-16px_rgb(23_44_33/0.18)] lg:min-w-0">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 bottom-1.5 rounded-full bg-primary shadow-[0_6px_14px_-8px_rgb(23_44_33/0.45)]"
                  style={{
                    left: `calc(0.375rem + (100% - 0.75rem) / ${N} * ${active})`,
                    right: `calc(0.375rem + (100% - 0.75rem) / ${N} * ${N - 1 - active})`,
                    transition: `left ${prev.dir === 1 ? trail : lead}, right ${prev.dir === 1 ? lead : trail}`,
                  }}
                />
                <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
                  {PROCESS.steps.map((s, i) => {
                    const on = i === active;
                    return (
                      <li key={s.name}>
                        <button
                          type="button"
                          onClick={() => go(i)}
                          aria-current={on ? "step" : undefined}
                          className={`flex w-full items-center justify-center gap-2 rounded-full px-2 py-3 text-[0.88rem] whitespace-nowrap transition-colors duration-500 ${
                            on ? "text-ink" : "text-ink/45 hover:text-ink"
                          }`}
                        >
                          <span className="font-mono text-[0.68rem] opacity-60">0{i + 1}</span>
                          {s.name}
                          {i === PROCESS.signature && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            <div className="mt-8 grid items-center gap-8 lg:mt-9 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] lg:gap-14">
              <div key={active} style={{ animation: "arrive 600ms cubic-bezier(0.22,1,0.36,1) both" }}>
                <StepChip n={active + 1} />
                <h3 className="mt-5 text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.08] font-medium tracking-[-0.035em] text-ink">{step.name}</h3>
                <p className="mt-4 max-w-[26rem] text-[1.02rem] leading-relaxed text-ink/65">{step.body}</p>
              </div>
              <div aria-hidden="true">
                <Stage key={active} i={active} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The active step's artifact, remounted per step so it plays from the start. */
function Stage({ i }: { i: number }) {
  const { Scene, ms } = SCENES[i];
  const p = usePlay(true, ms);
  return <Scene p={p} />;
}
