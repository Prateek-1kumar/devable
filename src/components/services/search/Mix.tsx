"use client";

import NumberFlow from "@number-flow/react";
import { FilePlus, Globe, RefreshCw, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MIX } from "./content";
import { delay, rise } from "../parts";

// The idea that the work isn't a fixed checklist, on its own. The sentence is the headline, set two-tone like
// Why Devable's: the claim in ink, the five kinds of work it names quieter. Under it, those five as a share of
// the whole, on a warm tray with one raised panel. The shares move: each in turn becomes where the strongest
// opportunity is, grows to lead the mix and takes the brand green, and the others give way. Same interaction as
// the other sections: hovering or focusing a part pins it as the strongest opportunity and pauses the cycle.
// Reduced motion: the first mix, still (parts can still be hovered).

const ICONS: LucideIcon[] = [Wrench, FilePlus, RefreshCw, Globe, Sparkles];
const HOLD = 3600; // ms each part leads

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export default function Mix() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pin, setPin] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || pin !== null || still) return;
    const id = setTimeout(() => setStep((s) => s + 1), HOLD);
    return () => clearTimeout(id);
  }, [visible, pin, still, step]);

  const on = seen || still;
  const lead = pin ?? step % MIX.mixes.length;
  const mix = MIX.mixes[lead];
  const hold = { onPointerLeave: () => setPin(null), onBlur: () => setPin(null) };

  return (
    <section aria-labelledby="mix-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[68rem]">
        <h2 id="mix-title" className={`${rise(on)} max-w-[52rem] text-[clamp(1.6rem,2.9vw,2.5rem)] leading-[1.15] font-medium tracking-[-0.035em] text-ink`}>
          {MIX.lead} <span className="text-ink/45">{MIX.rest}</span>
        </h2>

        <div ref={ref} style={delay(200)} className={`${rise(on)} mt-12 rounded-3xl bg-[#f7f6f2] p-2 sm:p-3 lg:mt-14`}>
          <div
            role="group"
            aria-label="Share of the work in each area. Choose one to see the mix when it is the strongest opportunity."
            {...hold}
            className="rounded-2xl bg-white px-4 pt-9 pb-5 shadow-[0_1px_2px_rgb(23_44_33/0.04),0_16px_36px_-18px_rgb(23_44_33/0.16)] sm:px-6 sm:pt-11 sm:pb-6"
          >
            {/* Wide: one bar, the five parts side by side, each as wide as its share. Their widths glide as the lead changes. */}
            <div className="hidden gap-1.5 sm:flex">
              {MIX.parts.map((name, i) => {
                const Icon = ICONS[i];
                const top = i === lead;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={top}
                    onPointerEnter={() => setPin(i)}
                    onFocus={() => setPin(i)}
                    onClick={() => setPin(i)}
                    style={{ flex: `${mix[i]} 1 0%`, transition: still ? "none" : "flex-grow 1000ms cubic-bezier(0.22,1,0.36,1)" }}
                    className="relative flex min-w-0 flex-col items-stretch justify-start text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/30"
                  >
                    <span
                      className={`absolute -top-6 left-0 flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.06em] whitespace-nowrap uppercase transition-opacity duration-500 ${top ? "opacity-100" : "opacity-0"}`}
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="text-[#1a7f47]">{MIX.tag}</span>
                    </span>
                    <span
                      style={top ? undefined : { backgroundColor: `rgb(23 44 33 / ${(0.045 + mix[i] * 0.0028).toFixed(3)})` }}
                      className={`flex h-24 items-end rounded-xl p-3.5 transition-[background-color] duration-700 ${top ? "bg-primary" : ""}`}
                    >
                      <span className="text-[clamp(1.4rem,2.4vw,2rem)] leading-none font-medium tracking-[-0.04em] text-ink">
                        <NumberFlow value={mix[i]} suffix="%" />
                      </span>
                    </span>
                    <span className={`mt-3 flex items-start gap-2 pr-2 text-[12.5px] leading-tight transition-colors duration-500 ${top ? "text-ink" : "text-ink/55"}`}>
                      <Icon aria-hidden="true" strokeWidth={1.9} className="mt-px size-3.5 shrink-0" />
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Phones: the same five, as rows. */}
            <ul className="space-y-4 sm:hidden">
              {MIX.parts.map((name, i) => {
                const Icon = ICONS[i];
                const top = i === lead;
                return (
                  <li key={name}>
                    <button type="button" aria-pressed={top} onClick={() => setPin(i)} className="block w-full text-left">
                      <span className={`flex items-center justify-between gap-3 text-[13px] transition-colors duration-500 ${top ? "text-ink" : "text-ink/55"}`}>
                        <span className="flex items-center gap-2">
                          <Icon aria-hidden="true" strokeWidth={1.9} className="size-3.5 shrink-0" />
                          {name}
                        </span>
                        <span className="font-medium tabular-nums text-ink">
                          <NumberFlow value={mix[i]} suffix="%" />
                        </span>
                      </span>
                      <span className="mt-2 block h-3 overflow-hidden rounded-full bg-ink/[0.06]">
                        <span
                          style={{ width: `${(mix[i] / 50) * 100}%` }}
                          className={`block h-full rounded-full transition-[width,background-color] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${top ? "bg-primary" : "bg-ink/25"}`}
                        />
                      </span>
                      {top && (
                        <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.06em] uppercase">
                          <span className="size-1.5 rounded-full bg-primary" />
                          <span className="text-[#1a7f47]">{MIX.tag}</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
