"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import ArcButton from "../../ArcButton";
import { At, Box, Flag, IsoScene, Panel, Tile } from "../iso";
import { Label, PlatformIcon, useInView, type Platform } from "../kit";
import { CREATORS, MODES } from "./content";

// The two engagement models side by side, each opening on an isometric scene of its shape: a launch is one
// post with creators landing all around it at once; ongoing distribution is a steady beat of posts along a
// twelve-week track fed by the channels. Both play once the section scrolls into view. A soft CTA follows
// for anyone unsure which fits.
export default function TwoWays() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
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
              <div aria-hidden="true" className="border-b border-line">
                {i === 0 ? <LaunchScene on={seen} /> : <OngoingScene on={seen} />}
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

// Launch: one post at the center; creators' posts land around it one after another, each wired back to
// it, while its view count climbs. The full picture holds for a moment, clears, and the launch plays again.
const AROUND: [number, number][] = [
  [45, 140],
  [360, 245],
  [40, 250],
  [320, 360],
  [70, 365],
  [200, 405],
];
const LAND_MS = 650;
const CYCLE = AROUND.length + 5; // land each post, hold for a few beats, then one beat cleared

function LaunchScene({ on }: { on: boolean }) {
  const [beat, setBeat] = useState(0);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  useEffect(() => {
    if (!on || still) return;
    const id = setInterval(() => setBeat((b) => (b + 1) % CYCLE), LAND_MS);
    return () => clearInterval(id);
  }, [on, still]);

  const cleared = beat === CYCLE - 1;
  const landed = !on ? 0 : still ? AROUND.length : cleared ? 0 : Math.min(beat + 1, AROUND.length);
  const views = 18_000 + landed * 71_000;

  return (
    <IsoScene w={560} h={300} floor={520} shift={[-20, 25]} className="w-full">
      <At x={110} y={112}>
        <div
          className="size-[320px] rounded-full bg-[radial-gradient(closest-side,rgb(25_231_110/0.42),transparent)] transition-opacity duration-700"
          style={{ opacity: on ? 0.35 + (0.65 * landed) / AROUND.length : 0 }}
        />
      </At>
      <At x={0} y={0}>
        <svg width={520} height={520} className="overflow-visible">
          {AROUND.map(([x, y], i) => (
            <path
              key={i}
              d={`M${x + 40} ${y + 18} L 262 264`}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="5 6"
              style={{ opacity: i < landed ? 1 : 0, transition: "opacity 400ms" }}
            />
          ))}
        </svg>
      </At>
      <Panel x={200} y={264} w={124} h={148} className="flex flex-col gap-2 border border-ink/60 bg-white p-3">
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-full bg-ink" />
          <span className="h-1.5 w-12 rounded-full bg-ink/25" />
        </span>
        <span className="h-1.5 w-full rounded-full bg-ink/15" />
        <span className="h-1.5 w-4/5 rounded-full bg-ink/15" />
        <span className="h-9 rounded-[3px] bg-primary/25" />
        <span className="mt-auto flex items-end justify-between border-t border-ink/10 pt-1.5">
          <span className="font-mono text-[7px] tracking-[0.1em] text-ink/50 uppercase">Views</span>
          <span className="text-[15px] leading-none font-medium tracking-[-0.03em] text-ink tabular-nums">
            <NumberFlow value={on ? views : 0} format={{ notation: "compact", maximumFractionDigits: 1 }} />
          </span>
        </span>
      </Panel>
      <Flag x={200} y={264} z={160}>
        Launch day
      </Flag>
      {AROUND.map(([x, y], i) => {
        const down = i < landed;
        return (
          <Tile
            key={i}
            x={x}
            y={y}
            z={down ? 0 : 46}
            w={80}
            h={36}
            style={{ opacity: down ? 1 : 0 }}
            className="flex items-center gap-1.5 border border-ink/60 bg-white px-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
            <img src={CREATORS[i].photo} alt="" className="size-5 rounded-full object-cover" />
            <span className="flex flex-1 flex-col gap-1">
              <span className="h-1 w-full rounded-full bg-ink/25" />
              <span className="h-1 w-2/3 rounded-full bg-ink/15" />
            </span>
          </Tile>
        );
      })}
    </IsoScene>
  );
}

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// Ongoing: four channel blocks along a twelve-week track, a post dropping onto the track every beat.
const CHANNELS: Platform[] = ["x", "linkedin", "youtube", "newsletter"];
const BEAT_MS = 900;

function OngoingScene({ on }: { on: boolean }) {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (!on || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setBeat((b) => b + 1), BEAT_MS);
    return () => clearInterval(id);
  }, [on]);

  // Twelve weekly slots along the track; the newest posts show, the oldest fade as new ones land.
  const head = beat % 12;
  return (
    <IsoScene w={560} h={300} floor={520} shift={[-60, -18]} className="w-full">
      {/* The track runs along the floor's x axis, into the distance; channel blocks sit in front of it. */}
      <Tile x={30} y={216} w={460} h={58} shadow={false} className="border border-ink/50 bg-white/70" />
      {Array.from({ length: 12 }, (_, w) => {
        const shown = on && (head - w + 12) % 12 < 9;
        return (
          <Tile
            key={w}
            x={42 + w * 37}
            y={230}
            z={shown ? 2 : 50}
            w={28}
            h={30}
            style={{ opacity: shown ? 1 : 0 }}
            className={w % 3 === 0 ? "border border-ink/60 bg-primary" : "border border-ink/60 bg-white"}
          />
        );
      })}
      {CHANNELS.map((c, i) => (
        <Box key={c} x={50 + i * 115} y={318} w={62} d={62} h={52} style={{ opacity: on ? 1 : 0 }}>
          <PlatformIcon platform={c} className="size-7 text-ink" />
        </Box>
      ))}
      <Flag x={42} y={216} z={4} tone="border-ink/60 bg-white text-ink">
        Week 1
      </Flag>
      <Flag x={430} y={210} z={4} tone="border-ink/60 bg-white text-ink">
        Week 12
      </Flag>
    </IsoScene>
  );
}
