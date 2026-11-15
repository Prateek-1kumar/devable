"use client";

import type { ReactNode } from "react";
import { Label } from "../kit";
import { PROBLEM } from "./content";
import { Depth, Direction, Distribution, useScene } from "./ProblemScenes";

// The one dark band on the page, after the light hero, in the homepage's own near-black. The three failures sit side
// by side as one board, each a card: its visual on top, drawn with the content team's own words, then what it is
// and why it matters. Each scene plays once as it scrolls into view and holds its finished picture (the packets
// in Distribution keep trying, quietly). Below 1100px the cards stack.
export default function Problem() {
  return (
    <section aria-labelledby="problem-title" className="bg-[#0b0b0b] px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label dark>{PROBLEM.label}</Label>
        <h2 id="problem-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-white">
          {PROBLEM.title}
        </h2>

        <ol className="mx-auto mt-10 grid max-w-[30rem] gap-5 min-[1100px]:mt-14 min-[1100px]:max-w-none min-[1100px]:grid-cols-3">
          <Card n={1} {...PROBLEM.items[0]} scene={(t) => <Depth t={t} />} />
          <Card n={2} {...PROBLEM.items[1]} scene={(t) => <Direction t={t} />} />
          <Card n={3} {...PROBLEM.items[2]} scene={(t, still) => <Distribution t={t} still={still} />} />
        </ol>
      </div>
    </section>
  );
}

function Card({ n, name, body, scene }: { n: number; name: string; body: string; scene: (t: number, still: boolean) => ReactNode }) {
  const [ref, t, still] = useScene();
  return (
    <li ref={ref} className="group flex flex-col overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#141414,#0e0e0e)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),inset_0_1px_0_rgb(255_255_255/0.09),0_30px_60px_-40px_rgb(0_0_0/0.9)] transition-shadow duration-500 hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1),inset_0_1px_0_rgb(255_255_255/0.12),0_36px_70px_-38px_rgb(0_0_0/1)]">
      {/* The visual: a soft light from above on near-black, with the scene on top. */}
      <div aria-hidden="true" className="@container relative h-[22rem] shrink-0 overflow-hidden bg-[linear-gradient(180deg,#151515_0%,#0c0c0c_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_0%,rgb(255_255_255/0.06),transparent_70%)] transition-opacity duration-500 group-hover:opacity-100" />
        {scene(t, still)}
        {/* the hairline under the visual: it fades out toward both edges */}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.13)_20%,rgb(255_255_255/0.13)_80%,transparent)]" />
      </div>
      <div className="flex flex-1 flex-col p-6 pb-7">
        <p className="font-mono text-[0.74rem] tracking-[0.1em] text-white/35">0{n} / 03</p>
        <h3 className="mt-3 text-[1.45rem] leading-[1.1] font-medium tracking-[-0.035em] text-white">{name}</h3>
        <p className="mt-3 text-[0.96rem] leading-relaxed text-white/60">{body}</p>
      </div>
    </li>
  );
}
