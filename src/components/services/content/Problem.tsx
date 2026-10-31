"use client";

import type { ReactNode } from "react";
import { Label, useInView } from "../kit";
import { Mark } from "../parts";
import { PROBLEM } from "./content";
import { linear, seg, usePlay } from "./play";

const { depth, direction, distribution } = PROBLEM.examples;
const CORAL = "var(--accent)";

// The one dark band on the page, after the light hero, in the homepage's own near-black. Three failures as
// editorial rows rather than three cards: the name and the explanation on one side, and on the other the
// failure itself, drawn the way a developer would meet it. Each artifact plays once when scrolled into view and
// then holds: a code sample that throws when it is run, a busy calendar of topics nobody searches for, a good
// article that spikes and goes flat. The artifact switches sides row to row so the section has a rhythm.
export default function Problem() {
  const visuals = [Depth, Direction, Distribution];
  return (
    <section aria-labelledby="problem-title" className="bg-[#0b0b0b] px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label dark>{PROBLEM.label}</Label>
        <h2 id="problem-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.05] font-medium tracking-[-0.045em] text-white">
          {PROBLEM.title}
        </h2>

        <ol className="mt-14 border-t border-white/10 lg:mt-20">
          {PROBLEM.items.map((item, i) => (
            <Row key={item.name} n={i + 1} name={item.name} body={item.body} flip={i % 2 === 1}>
              {visuals[i]}
            </Row>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Row({ n, name, body, flip, children: Visual }: { n: number; name: string; body: string; flip: boolean; children: (p: { p: number }) => ReactNode }) {
  const [ref, seen] = useInView<HTMLLIElement>(0.4);
  const p = usePlay(seen, 4200);
  return (
    <li ref={ref} className={`grid items-center gap-8 border-b border-white/10 py-12 lg:gap-20 lg:py-16 ${flip ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" : "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"}`}>
      <div className={flip ? "lg:order-2" : ""}>
        <p className="font-mono text-[0.78rem] tracking-[0.1em] text-white/35">0{n} / 03</p>
        <h3 className="mt-5 text-[clamp(1.6rem,2.5vw,2.2rem)] leading-[1.1] font-medium tracking-[-0.035em] text-white">{name}</h3>
        <p className="mt-4 max-w-[26rem] text-[1.02rem] leading-relaxed text-white/60">{body}</p>
      </div>
      <div aria-hidden="true" className={flip ? "lg:order-1" : ""}>
        <Visual p={p} />
      </div>
    </li>
  );
}

/** A dark window: the artifact is the only box in the row. */
function Window({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#131313] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-2">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="size-3 rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.25)]" style={{ background: c }} />
          ))}
        </span>
        <span className="ml-3 font-mono text-[0.75rem] text-white/45">{title}</span>
        {right && <span className="ml-auto text-[0.75rem] text-white/35">{right}</span>}
      </div>
      {children}
    </div>
  );
}

const at = (v: number, rise = 6) => ({ opacity: v, transform: `translateY(${(1 - v) * rise}px)` });

/** Technical depth: the snippet in the post, and what happens when a developer runs it. */
function Depth({ p }: { p: number }) {
  const typed = Math.floor(seg(p, 0.3, 0.52, linear) * depth.cmd.length);
  const [before, after] = depth.code.split(depth.broken);
  const squiggle = seg(p, 0.62, 0.78);
  return (
    <Window title={depth.file}>
      <div className="px-5 py-3.5 font-mono text-[0.82rem] leading-7 text-white/75 sm:text-[0.88rem]">
        <p className="flex gap-4" style={at(seg(p, 0.02, 0.14))}>
          <span className="w-3 text-white/25">1</span>
          <span>{depth.pre}</span>
        </p>
        <p className="flex gap-4" style={at(seg(p, 0.1, 0.22))}>
          <span className="w-3 text-white/25">2</span>
          <span className="[overflow-wrap:anywhere]">
            {before}
            <span className="relative">
              <span style={{ color: `color-mix(in srgb, ${CORAL} ${Math.round(squiggle * 100)}%, rgb(255 255 255 / 0.75))` }}>{depth.broken}</span>
              <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-[3px] rounded-full bg-[radial-gradient(circle_at_2px_1.5px,var(--accent)_1.2px,transparent_1.6px)] bg-[length:6px_3px]" style={{ width: `${squiggle * 100}%` }} />
            </span>
            {after}
          </span>
        </p>
      </div>
      <div className="border-t border-white/10 bg-black/40 px-5 py-3.5 font-mono text-[0.78rem] leading-[1.7] sm:text-[0.84rem]">
        <p className="text-white/70">
          <span className="text-white/35">$ </span>
          {depth.cmd.slice(0, typed)}
          {typed < depth.cmd.length && p > 0.3 && <span className="ml-px inline-block h-[1em] w-[0.5ch] translate-y-[2px] bg-white/70" />}
        </p>
        <p className="flex gap-2.5" style={{ ...at(seg(p, 0.56, 0.7)), color: CORAL }}>
          <span aria-hidden="true">✕</span>
          <span className="[overflow-wrap:anywhere]">{depth.error}</span>
        </p>
      </div>
    </Window>
  );
}

/** Strategic direction: a full calendar, and how little anyone searches for any of it. */
function Direction({ p }: { p: number }) {
  return (
    <Window title="Content calendar · October" right="Monthly searches">
      <ul className="divide-y divide-white/10">
        {direction.map((r, i) => {
          const row = seg(p, 0.05 + i * 0.16, 0.25 + i * 0.16);
          const bar = seg(p, 0.3 + i * 0.16, 0.62 + i * 0.16);
          return (
            <li key={r.topic} className="grid grid-cols-[2.6rem_minmax(0,1fr)_5.5rem_3.2rem] items-center gap-3 px-5 py-3.5 sm:grid-cols-[3rem_minmax(0,1fr)_8rem_3.5rem] sm:gap-4 sm:py-4" style={at(row)}>
              <span className="font-mono text-[0.75rem] text-white/35">{r.day}</span>
              <span className="truncate text-[0.95rem] text-white/85 sm:text-[1.02rem]">{r.topic}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <span className="block h-full rounded-full" style={{ width: `${Math.max(r.demand, 3) * bar}%`, background: CORAL }} />
              </span>
              <span className="text-right font-mono text-[0.78rem]" style={{ color: CORAL, opacity: bar }}>
                ~{Math.round(r.searches * bar)}
              </span>
            </li>
          );
        })}
      </ul>
    </Window>
  );
}

// The article's first 90 days: a launch-day spike, then nothing.
const CHART = "M0 94 L16 92 L30 26 L44 58 L62 86 L84 93 C 120 95, 200 96, 400 96";

/** Distribution: a strong article nobody found. */
function Distribution({ p }: { p: number }) {
  const draw = seg(p, 0.1, 0.62, linear);
  const views = Math.round(distribution.views * seg(p, 0.1, 0.6));
  return (
    <Window title={`Analytics · ${distribution.title}`} right={`Last ${distribution.days} days`}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[2.4rem] leading-none font-medium tracking-[-0.04em] text-white tabular-nums">
            {views}
            <span className="ml-2 text-[0.9rem] font-normal tracking-normal text-white/45">views</span>
          </p>
          <p className="pb-1 font-mono text-[0.75rem]" style={{ color: CORAL, opacity: seg(p, 0.62, 0.8) }}>
            flat since day 4
          </p>
        </div>
        <svg viewBox="0 0 400 110" className="mt-3 w-full overflow-visible">
          <line x1="0" x2="400" y1="96" y2="96" stroke="white" strokeOpacity={0.1} />
          <path d={CHART} pathLength={1} fill="none" stroke={CORAL} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </svg>
        <p className="mt-1 flex justify-between font-mono text-[0.7rem] text-white/30">
          <span>Day 1</span>
          <span>Day {distribution.days}</span>
        </p>
      </div>
      <ul className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 text-[0.8rem]" style={{ opacity: seg(p, 0.7, 0.9) }}>
        {distribution.channels.map((c) => (
          <li key={c} className="flex items-center gap-2 px-5 py-2.5 text-white/40">
            <span className="opacity-60 grayscale">
              <Mark name={c} className="size-3.5" />
            </span>
            0 visits
          </li>
        ))}
      </ul>
    </Window>
  );
}
