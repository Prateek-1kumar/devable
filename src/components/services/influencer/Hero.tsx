"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import ArcButton from "../../ArcButton";
import { At, Flag, IsoScene, Panel, Tile } from "../iso";
import { Label, PLATFORM_NAME, PlatformIcon } from "../kit";
import { CREATORS, HERO, LAUNCH } from "./content";

const STEP_MS = 1700;
const HOLD = 3; // extra steps the finished picture holds before the loop restarts

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The first viewport, framed like the homepage hero (warm off-white panel), split in two: the claim, the
// numbers and the channels on the left; on the right, a launch as it happens. One company post, then
// creators' quote posts land beneath it one by one while the impressions counter climbs.
export default function Hero() {
  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="mx-auto grid max-w-[76rem] items-center gap-14 overflow-hidden rounded-2xl bg-[#f9f8f4] px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
        <div>
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] font-medium tracking-[-0.05em] text-ink">
            {HERO.title}
          </h1>
          <p className="mt-6 max-w-[32rem] text-lg leading-relaxed tracking-[-0.01em] text-ink/70 sm:text-xl">{HERO.body}</p>

          <dl className="mt-10 grid max-w-[30rem] grid-cols-3 divide-x divide-ink/10 border-y border-ink/10">
            {HERO.stats.map((s) => (
              <div key={s.label} className="py-4 pr-4 [&:not(:first-child)]:pl-4">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-[1.75rem] leading-none font-medium tracking-[-0.045em] text-ink">{s.value}</dd>
                <dd className="mt-1.5 text-[0.82rem] text-ink/50">{s.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] text-ink/60" aria-label="Channels">
            {HERO.channels.map((c) => (
              <li key={c} className="flex items-center gap-1.5">
                <PlatformIcon platform={c} className="size-3.5 text-ink/70" />
                {PLATFORM_NAME[c]}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <ArcButton href="#contact" arrow tone="primary">
              Speak with the Team
            </ArcButton>
            <ArcButton href="#launches" tone="secondary">
              See our launches
            </ArcButton>
          </div>
        </div>

        <LaunchFeed />
      </div>
    </section>
  );
}

function LaunchFeed() {
  const total = LAUNCH.quotes.length;
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setStep((s) => (s + 1) % (total + HOLD + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [still, total]);

  // Reduced motion: the finished launch, held.
  const landed = still ? total : Math.min(step, total);
  const reach = Math.round((LAUNCH.impressions * (0.08 + (0.92 * landed) / total)) / 1000) * 1000;

  return (
    <IsoScene w={480} h={500} floor={520} shift={[-85, 50]} className="w-full rounded-xl">
      {/* Glow on the floor where the launch stands. */}
      <At x={110} y={150}>
        <div className="size-[340px] rounded-full bg-[radial-gradient(closest-side,rgb(25_231_110/0.35),transparent)]" />
      </At>

      {/* Dashed paths from each quote post back to the launch. */}
      <At x={0} y={0}>
        <svg width={520} height={520} className="overflow-visible">
          {QUOTE_AT.map(([x, y], i) => (
            <path
              key={i}
              d={`M${x + 75} ${y} Q ${x + 75} ${(y + 230) / 2} ${280} ${236}`}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="5 6"
              style={{ opacity: i < landed ? 1 : 0, transition: "opacity 600ms" }}
            />
          ))}
        </svg>
      </At>

      {/* The company's launch post, standing. */}
      <Panel x={150} y={232} w={260} h={250} className="flex flex-col border border-ink/60 bg-white p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
            <img src={LAUNCH.company.logo} alt="" className="h-3.5 w-auto max-w-[70%] object-contain" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold text-ink">{LAUNCH.company.name}</span>
            <span className="block text-[11px] text-muted">{LAUNCH.company.handle}</span>
          </span>
          <PlatformIcon platform="x" className="size-4 text-ink" />
        </div>
        <p className="mt-3 text-[13px] leading-snug text-ink">{LAUNCH.text}</p>
        <div className="mt-auto flex items-end justify-between border-t border-line pt-3">
          <span className="font-mono text-[9px] tracking-[0.1em] text-muted uppercase">Impressions</span>
          <span className="text-[24px] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums">
            <NumberFlow value={reach} format={{ notation: "compact", maximumFractionDigits: 1 }} />
          </span>
        </div>
      </Panel>
      <Flag x={150} y={232} z={262}>
        Launch post
      </Flag>

      {/* Creators' quote posts dropping onto the floor in front of it. */}
      {LAUNCH.quotes.map((q, i) => {
        const c = CREATORS[q.creator];
        const [x, y] = QUOTE_AT[i];
        const on = i < landed;
        return (
          <Tile
            key={i}
            x={x}
            y={y}
            z={on ? 0 : 70}
            w={150}
            h={80}
            style={{ opacity: on ? 1 : 0 }}
            className="border border-ink/60 bg-white p-2.5"
          >
            <span className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
              <img src={c.photo} alt="" className="size-5 rounded-full object-cover" />
              <span className="truncate text-[10px] font-semibold text-ink">{c.name}</span>
            </span>
            <span className="mt-1 line-clamp-2 block text-[9.5px] leading-snug text-ink/75">{q.text}</span>
          </Tile>
        );
      })}
    </IsoScene>
  );
}

// Where the quote posts land on the floor, in front of the launch.
const QUOTE_AT: [number, number][] = [
  [30, 290],
  [215, 310],
  [55, 405],
  [250, 420],
];
