"use client";

import { Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { delay, rise } from "../parts";
import { WAYS } from "./content";

const AUTO = 5600; // ms each option shows while the section runs by itself
const N = WAYS.options.length;
const OWNERS = [WAYS.ownership.full, WAYS.ownership.extend];
const ease = "cubic-bezier(0.22,1,0.36,1)";

// Who owns what, on one pipeline. The six stages of the engine run across the page as six tiles; a switch above
// them picks the option, and the tiles re-colour in a quick wave: brand green where Devable runs the stage, coral
// where your team keeps it, so the difference is the colour, not a legend you have to study. Under the pipeline a
// key counts the stages each side runs, then the option's description and what it covers. Left alone the section
// flips between the two options so both are seen; touching the switch takes over. A pilot strip closes it.
export default function Ways() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const [active, setActive] = useState(0);
  const [taken, setTaken] = useState(false); // the visitor has used the switch
  const [prev, setPrev] = useState({ at: 0, dir: 1 });
  if (prev.at !== active) setPrev({ at: active, dir: active > prev.at ? 1 : -1 });

  const tick = useRef(0);
  useEffect(() => {
    if (!seen || taken || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % N), tick.current++ === 0 ? AUTO + 1400 : AUTO);
    return () => clearTimeout(id);
  }, [seen, taken, active]);

  const choose = (i: number) => {
    setTaken(true);
    setActive(i);
  };
  const owner = OWNERS[active];
  const us = owner.filter((o) => o === "us").length;
  const o = WAYS.options[active];

  const lead = `560ms ${ease}`;
  const trail = `560ms ${ease} 120ms`;

  return (
    <section aria-labelledby="ways-title" className="bg-[#0b0b0b] px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label dark>{WAYS.label}</Label>
        <h2 id="ways-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-white">
          {WAYS.title}
        </h2>

        <div ref={ref} style={delay(0)} className={`${rise(seen)} mt-12 lg:mt-14`}>
          {/* The switch. */}
          <div role="tablist" aria-label="Ways to work with us" className="relative mx-auto max-w-[40rem] rounded-full bg-white/[0.07] p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-white shadow-[0_8px_18px_-8px_rgb(0_0_0/0.6)]"
              style={{
                left: `calc(0.375rem + (100% - 0.75rem) / ${N} * ${active})`,
                right: `calc(0.375rem + (100% - 0.75rem) / ${N} * ${N - 1 - active})`,
                transition: `left ${prev.dir === 1 ? trail : lead}, right ${prev.dir === 1 ? lead : trail}`,
              }}
            />
            <div className="relative grid grid-cols-2">
              {WAYS.options.map((opt, i) => (
                <button
                  key={opt.name}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => choose(i)}
                  className={`rounded-full px-3 py-3 text-center text-[0.86rem] leading-tight font-medium transition-colors duration-500 sm:px-6 sm:text-[0.95rem] ${i === active ? "text-ink" : "text-white/60 hover:text-white"}`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* The pipeline: six stages, each owned by one side. */}
          <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-12 lg:grid-cols-6">
            {WAYS.ownership.stages.map((stage, i) => {
              const mine = owner[i] === "us";
              return (
                <li
                  key={stage}
                  className="relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-2xl bg-[#111] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.07)]"
                >
                  {/* The two owners' surfaces, stacked: one fades out as the other fades in. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{ transitionDelay: `${i * 70}ms`, opacity: mine ? 1 : 0, background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 24%, #0b0b0b) 0%, color-mix(in srgb, var(--primary) 7%, #0b0b0b) 100%)" }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{ transitionDelay: `${i * 70}ms`, opacity: mine ? 0 : 1, background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 26%, #0b0b0b) 0%, color-mix(in srgb, var(--accent) 7%, #0b0b0b) 100%)" }}
                  />
                  <span className="relative font-mono text-[0.7rem] tracking-[0.08em] text-white/45">0{i + 1}</span>
                  <span className="relative text-[1.08rem] leading-tight font-medium tracking-[-0.02em] text-white">{stage}</span>
                  {/* Who runs it: two chips, one shown. */}
                  <span className="relative z-10 h-7">
                    <span
                      className="absolute top-0 left-0 inline-flex items-center gap-1.5 rounded-full bg-primary py-1 pr-3 pl-1.5 text-[0.76rem] font-medium text-ink transition-[opacity,translate] duration-500"
                      style={{ transitionDelay: `${i * 70}ms`, opacity: mine ? 1 : 0, translate: mine ? "0 0" : "0 6px" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
                      <img src="/brand/devable-mark.png" alt="" className="size-4 rounded-[4px]" />
                      Devable
                    </span>
                    <span
                      className="absolute top-0 left-0 inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pr-3 pl-2 text-[0.76rem] font-medium text-white transition-[opacity,translate] duration-500"
                      style={{ transitionDelay: `${i * 70}ms`, opacity: mine ? 0 : 1, translate: mine ? "0 -6px" : "0 0" }}
                    >
                      <Users className="size-3.5" strokeWidth={2} />
                      Your team
                    </span>
                    <span className="sr-only">{mine ? "Devable" : "Your team"}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          {/* The key, with the count. */}
          <p className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-[0.76rem] tracking-[0.04em] text-white/55">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              Devable runs {us} of {owner.length}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent" />
              {owner.length - us === 0 ? "Nothing for your team to run" : `Your team keeps ${owner.length - us}`}
            </span>
          </p>

          {/* The option. */}
          <div key={active} style={{ animation: "arrive 600ms cubic-bezier(0.22,1,0.36,1) both" }} className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <h3 className="text-[clamp(1.5rem,2.2vw,2rem)] leading-tight font-medium tracking-[-0.035em] text-white">{o.name}</h3>
              <p className="mt-3 max-w-[30rem] text-[1.02rem] leading-relaxed text-white/60">{o.body}</p>
            </div>
            <div>
              <p className="text-[0.85rem] text-white/45">{o.listLabel}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {o.items.map((item) => (
                  <li key={item} className="rounded-full bg-white/[0.08] px-3 py-1.5 font-mono text-[11.5px] tracking-[0.02em] text-white/85">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/[0.05] px-6 py-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
          <p className="text-[1.02rem] text-white/70">
            <span className="font-medium text-white">{WAYS.pilot.title}</span> {WAYS.pilot.body}
          </p>
          <ArcButton href="#contact" arrow tone="light" size="sm">
            Speak with the Team
          </ArcButton>
        </div>
      </div>
    </section>
  );
}
