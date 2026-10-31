"use client";

import { useState } from "react";
import { Label, useInView } from "../kit";
import { CANVAS, delay, rise } from "../parts";
import { TYPES } from "./content";
import TypesScene from "./TypesScenes";

// Six formats, one stage. In the How We Work card: the dotted canvas on the left holds a single isometric scene, and
// the six names sit beside it as the How We Work nav does, the active one tinted with a deep-green bar and opened to
// its description. Pointing at (or tapping) a name replaces the scene on the left: the old pieces sink and fade as
// the new ones rise into place. Each scene is one idea you can read without the words (see TypesScenes). Only the
// active description is open, so the whole card stays short enough for one viewport. Rises in once.
export default function Types() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const [active, setActive] = useState(0);

  return (
    <section aria-labelledby="types-title" className="px-6 py-20 sm:px-12 lg:py-24 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{TYPES.label}</Label>
        <h2 id="types-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {TYPES.title}
        </h2>

        <div ref={ref} style={delay(0)} className={`${rise(seen)} mt-10 grid overflow-hidden rounded-2xl border border-line bg-card lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]`}>
          <div aria-hidden="true" className={`${CANVAS} flex items-center justify-center border-b border-line p-2 sm:p-4 lg:border-r lg:border-b-0`}>
            <div className="w-full max-w-[40rem]">
              <TypesScene active={active} run={seen} />
            </div>
          </div>

          <ol className="flex flex-col justify-center gap-1 p-3 sm:p-5 lg:p-7">
            {TYPES.types.map((t, i) => {
              const on = i === active;
              return (
                <li key={t.name}>
                  <button
                    type="button"
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className={`relative block w-full rounded-lg py-3 pr-4 pl-7 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${on ? "bg-[#eef5f0]" : "hover:bg-ink/[0.03]"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-[1.1rem] left-3.5 h-4 w-[3px] rounded-full bg-[#1a7f47] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "scale-y-100" : "scale-y-0"}`}
                    />
                    <span className="flex items-baseline gap-3">
                      <span className={`font-mono text-[0.7rem] transition-colors duration-200 ${on ? "text-accent" : "text-ink/35"}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={`text-[1.08rem] font-medium tracking-[-0.015em] transition-colors duration-200 ${on ? "text-ink" : "text-ink/55"}`}>{t.name}</span>
                    </span>
                    <span className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}>
                      <span className="overflow-hidden">
                        <span className="mt-1.5 ml-[2.1rem] block max-w-[26rem] text-[0.92rem] leading-relaxed text-ink/65">{t.body}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
