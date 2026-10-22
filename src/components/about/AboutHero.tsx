"use client";

import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import ArcButton from "../ArcButton";

// Editorial opener: a wide two-tone headline (the quiet setup in grey, the claim in ink), then one row under
// it: who's on the team at the left, the who-we-help and the CTA stepped in under the headline's right side.
// Lines rise in once on load.
const RISE = "animate-fade-up motion-reduce:animate-none";
const TEAM = ["Engineers", "Technical writers", "Creators", "Growth operators"];
const OPERATORS = 15;
const ROLL = { duration: 1400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

export default function AboutHero() {
  // The count rolls up like an odometer as its block rises. The server renders the real number; on mount it
  // drops to 0 unseen (the block is still behind its rise delay), then spins up. Reduced motion: it stays put.
  const [count, setCount] = useState(OPERATORS);
  const [rolling, setRolling] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reset = requestAnimationFrame(() => setCount(0));
    const roll = window.setTimeout(() => {
      setRolling(true);
      setCount(OPERATORS);
    }, 500);
    return () => {
      cancelAnimationFrame(reset);
      window.clearTimeout(roll);
    };
  }, []);

  return (
    <section className="px-6 pt-32 pb-14 sm:px-12 sm:pt-32 sm:pb-14 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">

        <h1 className="mt-8 text-[clamp(2.5rem,5.2vw,5.25rem)] leading-[0.98] font-medium tracking-[-0.055em] text-ink">
          <span style={{ animationDelay: "80ms" }} className={`block text-ink/30 ${RISE}`}>
            The growth partner
          </span>
          <span style={{ animationDelay: "180ms" }} className={`block ${RISE}`}>
            technical companies were missing.
          </span>
        </h1>

        <div className="mt-10 grid gap-14 lg:mt-12 lg:grid-cols-12 lg:items-end lg:gap-0">
          <div style={{ animationDelay: "320ms" }} className={`lg:col-span-5 lg:col-start-8 lg:row-start-1 ${RISE}`}>
            <p className="max-w-[28rem] text-lg leading-relaxed tracking-[-0.01em] text-ink/70 sm:text-xl">
              Engineers, technical writers, creators, and growth operators under one roof, helping AI&#8209;native and
              technical companies reach the people who matter.
            </p>
            <ArcButton href="/#contact" arrow className="mt-8">
              Speak with the Team
            </ArcButton>
          </div>

          {/* The team at a glance, on the CTA's line: a spec-sheet count and the disciplines. */}
          <div
            style={{ animationDelay: "420ms" }}
            className={`border-t border-line pt-6 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:max-w-[28rem] ${RISE}`}
          >
            <p className="text-[clamp(3rem,5vw,4.5rem)] leading-none font-medium tracking-[-0.05em] text-ink">
              <NumberFlow value={count} suffix="+" animated={rolling} spinTiming={ROLL} transformTiming={ROLL} />
            </p>
            <p className="mt-2 text-lg tracking-[-0.01em] text-ink/70">technical operators</p>
            {/* Quiet tinted tags that pop in one after another once the block has risen. */}
            <ul className="mt-6 flex flex-wrap gap-2">
              {TEAM.map((role, i) => (
                <li
                  key={role}
                  style={{ animationDelay: `${700 + i * 90}ms` }}
                  className="animate-pop-in rounded-md bg-ink/[0.05] px-2.5 py-1 text-[0.85rem] tracking-[-0.005em] text-ink/70 motion-reduce:animate-none"
                >
                  {role}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
