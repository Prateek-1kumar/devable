"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { MODES } from "./content";

// The 3D scenes load once the section is near, after the page (see TwoWaysScenes).
const LaunchDialScene = dynamic(() => import("./TwoWaysScenes").then((m) => m.LaunchDialScene), { ssr: false });
const CampaignLanesScene = dynamic(() => import("./TwoWaysScenes").then((m) => m.CampaignLanesScene), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The two engagement models side by side, each opening on a small 3D scene of its shape: a launch is one
// fixed post with creators' different angles converging on it inside a 48-hour window; a campaign is many
// creators and formats across four channels, week after week, feeding one objective. Both start once the
// section scrolls into view. A soft CTA follows for anyone unsure which fits.
export default function TwoWays() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  return (
    <section aria-labelledby="modes-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{MODES.label}</Label>
        <h2 id="modes-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {MODES.title}
        </h2>

        <div ref={ref} className="mt-14 grid gap-5 lg:grid-cols-2">
          {MODES.modes.map((m, i) => (
            <article key={m.name} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <div aria-hidden="true" className="relative aspect-[5/4] border-b border-line bg-[#f1f0eb] sm:aspect-[16/10]">
                {seen && (i === 0 ? <LaunchDialScene still={still} /> : <CampaignLanesScene still={still} />)}
              </div>
              <div className="flex flex-1 flex-col p-7 sm:p-9">
                <span className="font-mono text-[0.7rem] tracking-[0.1em] text-muted">0{i + 1}</span>
                <h3 className="mt-3 text-[clamp(1.4rem,2vw,1.75rem)] leading-tight font-medium tracking-[-0.035em] text-ink">{m.name}</h3>
                <p className="mt-3 max-w-[32rem] text-[1rem] leading-relaxed text-ink/65">{m.body}</p>
                <p className="mt-7 font-mono text-[0.66rem] tracking-[0.1em] text-muted uppercase">Best suited for</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {m.fits.map((f) => (
                    <li key={f} className="rounded-full border border-ink/12 bg-paper px-3 py-1.5 text-[0.82rem] text-ink/85">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f9f8f4] px-7 py-5">
          <p className="text-[1.02rem] text-ink/75">Not sure which fits your next moment? We&apos;ll help you plan it.</p>
          <ArcButton href="#contact" arrow tone="primary" size="sm">
            Speak with the Team
          </ArcButton>
        </div>
      </div>
    </section>
  );
}
