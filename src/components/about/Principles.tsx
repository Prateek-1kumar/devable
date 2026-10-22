"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GoDeep, Measure, OwnIt, Understand } from "./PrincipleVisuals";

const PRINCIPLES = [
  { title: "Understand", line: "We get inside the product before we touch a single channel.", Visual: Understand },
  { title: "Go deep", line: "Depth over surface. If your audience understands the technology, so do we.", Visual: GoDeep },
  { title: "Own it", line: "We work as an extension of your team, not another vendor to manage.", Visual: OwnIt },
  { title: "Measure", line: "Visibility only counts when it drives growth.", Visual: Measure },
];

// "How we work" as a pinned stage on the same charcoal as the glass story, inset like that band's exit.
// Scrolling steps through four principles on a numbered rail: the active one lights up and opens to a
// single line and a looping drawing of the idea; the marker glides down the rail from step to step.
export default function Principles() {
  const track = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      setActive(Math.min(PRINCIPLES.length - 1, Math.floor(p * PRINCIPLES.length)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section
      ref={track}
      aria-labelledby="how-we-work-title"
      className="relative mx-[2.5vw] mb-[2.5vw] h-[400svh] rounded-[1.25rem] bg-[#1a1918] text-white"
    >
      <div className="@container sticky top-0 flex h-svh items-center px-6 pt-20 sm:px-12 xl:px-[6vw]">
        <div className="mx-auto grid w-full max-w-[76rem] gap-10 lg:grid-cols-12">
          {/* Out to the stage's left padding, past the centred grid; the rail and steps stay put. */}
          <header className="lg:col-span-4 lg:ml-[min(0px,calc((76rem-100cqw)/2))]">
            <h2
              id="how-we-work-title"
              className="w-fit rounded-[4px] bg-white/10 px-2.5 py-1 text-[0.8rem] tracking-[0.04em] text-white/80 uppercase"
            >
              How we work
            </h2>
            <p className="mt-5 max-w-[16rem] text-lg leading-snug tracking-[-0.01em] text-white/50">
              Understand the product. Own the execution.
            </p>
          </header>

          <ol
            style={{ "--t": "clamp(2.3rem, 4.4vw, 4.25rem)", "--i": active } as CSSProperties}
            className="relative lg:col-span-8"
          >
            {/* The marker, one for the whole rail. Rows above the active one are collapsed to a title line, so
                the active title sits at i title lines down; the marker glides there in step with the rows. */}
            <span
              aria-hidden="true"
              className="absolute top-[calc(var(--t)*1.08*var(--i)+var(--t)*0.54)] right-[calc(100%+1rem)] hidden -translate-y-1/2 items-center transition-[top] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex"
            >
              <span className="grid size-6 place-items-center rounded-[4px] bg-primary">
                <span className="size-1.5 rounded-full bg-ink" />
              </span>
              <span className="h-px w-[clamp(3rem,7vw,8rem)] bg-primary/60" />
            </span>
            {PRINCIPLES.map(({ title, line, Visual }, i) => {
              const on = i === active;
              return (
                <li key={title} aria-current={on ? "step" : undefined} className="grid grid-cols-[2rem_1px_1fr] gap-x-5 sm:gap-x-10">
                  <div className="flex h-[calc(var(--t)*1.08)] items-center font-mono text-sm">
                    <span className={`transition-colors duration-500 ${on ? "text-white" : "text-white/35"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* The rail: green down to the active dot, grey after it. */}
                  <div aria-hidden="true" className="relative">
                    <span
                      className={`absolute inset-x-0 top-0 h-[calc(var(--t)*0.54)] transition-colors duration-500 ${i <= active ? "bg-primary" : "bg-white/15"}`}
                    />
                    <span
                      className={`absolute inset-x-0 top-[calc(var(--t)*0.54)] bottom-0 transition-colors duration-500 ${i < active ? "bg-primary" : "bg-white/15"}`}
                    />
                    <span
                      className={`absolute top-[calc(var(--t)*0.54)] left-1/2 size-[7px] -translate-1/2 rounded-full transition-colors duration-500 ${
                        i <= active ? "bg-primary" : "bg-white/35"
                      }`}
                    />
                  </div>

                  <div>
                    <h3
                      className={`text-[length:var(--t)] leading-[1.08] font-medium tracking-[-0.045em] transition-colors duration-500 ${
                        on ? "text-white" : "text-white/25"
                      }`}
                    >
                      {title}
                    </h3>
                    {/* Opens to its line and drawing when active (0fr → 1fr rows animate the height). */}
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-3 max-w-[30rem] text-[1.05rem] leading-relaxed text-white/70 sm:text-lg">{line}</p>
                        <div className="mt-6 mb-10 h-[min(12rem,22svh)] max-w-[30rem]">
                          {/* Remounted on activation so the drawing starts its story from the top. */}
                          <Visual key={String(on)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
