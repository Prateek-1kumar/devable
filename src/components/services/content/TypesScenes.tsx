"use client";

import { Box as BoxIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Beacon, Mark, Tick } from "../parts";
import { At, Billboard, Box, Flag, IsoScene, Panel } from "../iso";

// Six isometric scenes on one shared stage, one per content type. All six stay mounted; the active one's pieces rise
// into place (staggered) while every other scene's pieces sink and fade, so switching reads as one scene being
// replaced by the next rather than a cut. Each scene is a single idea you can read without the words beside it:
// a document that has been tested, a staircase of steps, a product standing up out of an article, two bars of
// different height, two blocks joined by a bridge, a quote on a podium.

const W = 520;
const H = 440;
const FLOOR = 440;
const TOP = 10; // the stage's top, where every scene stands
const SINK = 34; // how far a scene's pieces drop when it is not the active one

/** A piece's fade, staggered by its place in the scene so a scene builds up piece by piece. */
const fade = (on: boolean, i: number): CSSProperties => ({ opacity: on ? 1 : 0, transitionDelay: `${on ? 220 + i * 90 : 0}ms` });
const z = (on: boolean, base: number) => base - (on ? 0 : SINK);

type P = { on: boolean };

const Pill = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-ink shadow-[0_1px_2px_rgb(23_44_33/0.06),0_10px_20px_-8px_rgb(23_44_33/0.3)] ${className}`}>{children}</span>
);
const lines = (widths: number[], tone = "bg-ink/[0.14]") => (
  <span className="flex flex-col gap-[7px]">
    {widths.map((w, i) => (
      <span key={i} style={{ width: `${w}%` }} className={`block h-[5px] rounded-full ${tone}`} />
    ))}
  </span>
);
const token = (w: number, c: string) => <span style={{ width: w, background: c }} className="block h-[5px] rounded-full" />;
const KW = "#7a5af5";
const STR = "#2e9f6a";
const INK = "rgb(23 44 33 / 0.5)";

/** 01 · Technical article: a document, a tested code sample standing out of it, an engineer's sign-off. */
function Article({ on }: P) {
  return (
    <>
      <Box x={165} y={140} z={z(on, TOP)} w={190} d={270} h={8} style={fade(on, 0)}>
        <div className="flex h-full w-full flex-col gap-3 p-4">
          <span className="mt-[5.6rem] block">{lines([100, 92, 60])}</span>
          <span className="mt-3 block">{lines([100, 86, 94, 52])}</span>
        </div>
      </Box>
      <Panel x={180} y={192} z={z(on, TOP + 8)} w={160} h={78} className="rounded-md border border-line bg-paper p-3" style={fade(on, 1)}>
        <span className="flex h-full flex-col justify-center gap-2">
          <span className="flex gap-1.5">
            {token(22, KW)}
            {token(40, INK)}
            {token(26, KW)}
          </span>
          <span className="flex gap-1.5">
            {token(30, INK)}
            {token(56, STR)}
          </span>
          <span className="flex gap-1.5">
            {token(18, KW)}
            {token(34, INK)}
            {token(24, STR)}
          </span>
        </span>
      </Panel>
      <Billboard x={330} y={360} z={z(on, TOP + 26)} center style={fade(on, 2)}>
        <Pill>
          <span className="grid size-5 place-items-center rounded-full bg-[#e3f3e8] font-mono text-[8px] font-semibold text-[#1a7f47]">MC</span>
          Reviewed by an engineer
          <Tick className="size-4" />
        </Pill>
      </Billboard>
      <Flag x={150} y={430} z={z(on, TOP)} style={fade(on, 3)}>
        Technical article
      </Flag>
    </>
  );
}

/** 02 · Tutorial: four steps climbing, the second one in progress. */
function Tutorial({ on }: P) {
  const steps = [
    { h: 16, top: "#e9f6ee" },
    { h: 34, top: "#ffffff" },
    { h: 52, top: "#f4f6f4" },
    { h: 70, top: "#f4f6f4" },
  ];
  return (
    <>
      {steps.map((s, i) => (
        <Box key={i} x={120 + i * 88} y={200} z={z(on, TOP)} w={84} d={190} h={s.h} top={s.top} style={fade(on, i)} />
      ))}
      {steps.map((s, i) => (
        <Billboard key={i} x={162 + i * 88} y={295} z={z(on, TOP + s.h + 4)} center style={fade(on, i + 1)}>
          {i === 1 ? (
            <span className="grid size-8 place-items-center rounded-full border border-black/[0.07] bg-white shadow-[0_8px_16px_-6px_rgb(23_44_33/0.4)]">
              <Beacon />
            </span>
          ) : (
            <span
              className={`grid size-7 place-items-center rounded-full font-mono text-[11px] ${i === 0 ? "bg-[#1a7f47] text-white" : "border border-ink/15 bg-white text-ink/45"}`}
            >
              {i === 0 ? "✓" : i + 1}
            </span>
          )}
        </Billboard>
      ))}
      <Flag x={160} y={430} z={z(on, TOP)} style={fade(on, 5)}>
        Step 2 of 4
      </Flag>
    </>
  );
}

/** 03 · Product-led: the article, with the product's own window standing up out of the page. */
function ProductLed({ on }: P) {
  return (
    <>
      <Box x={165} y={140} z={z(on, TOP)} w={190} d={270} h={8} style={fade(on, 0)}>
        <div className="flex h-full w-full flex-col gap-3 p-4">
          <span className="block">{lines([100, 88])}</span>
          <span className="mt-[8.4rem] block">{lines([96, 70])}</span>
        </div>
      </Box>
      <Panel x={178} y={252} z={z(on, TOP + 8)} w={164} h={118} className="overflow-hidden rounded-md border border-line bg-white" style={fade(on, 1)}>
        <span className="flex items-center gap-1.5 border-b border-line bg-paper px-2.5 py-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-ink/20" />
          ))}
          <span className="ml-1 text-[8px] text-ink/50">ADE Playground</span>
        </span>
        <span className="flex flex-col gap-2 p-2.5">
          <span className="flex items-center gap-1.5 rounded border border-dashed border-ink/20 px-2 py-2 font-mono text-[8px] text-ink/60">
            <span className="rounded bg-[#e3f3e8] px-1 text-[#1a7f47]">PDF</span>
            invoice.pdf
          </span>
          <span className="w-fit rounded bg-ink px-2.5 py-1 text-[8px] text-white">Parse</span>
        </span>
      </Panel>
      <Billboard x={338} y={300} z={z(on, TOP + 70)} style={fade(on, 2)}>
        <Pill className="font-mono text-[10px] tracking-[0.08em] uppercase">
          <span className="size-1.5 rounded-full bg-primary" />
          Your product
        </Pill>
      </Billboard>
      <Flag x={150} y={430} z={z(on, TOP)} style={fade(on, 3)}>
        Product-led article
      </Flag>
    </>
  );
}

/** 04 · Comparison: two bars of different height, one clearly ahead. */
function Comparison({ on }: P) {
  return (
    <>
      <Box x={150} y={190} z={z(on, TOP)} w={90} d={90} h={130} top="#d8f8e5" front="#bfeacf" side="#a4d6b8" style={fade(on, 0)} />
      <Box x={290} y={290} z={z(on, TOP)} w={90} d={90} h={48} style={fade(on, 1)} />
      <Billboard x={195} y={235} z={z(on, TOP + 140)} center style={fade(on, 2)}>
        <Pill>
          <Tick className="size-4" />
          ADE
          <span className="font-mono text-[10px] text-ink/50">4 / 4</span>
        </Pill>
      </Billboard>
      <Billboard x={335} y={335} z={z(on, TOP + 58)} center style={fade(on, 3)}>
        <Pill className="text-ink/60">
          OCR
          <span className="font-mono text-[10px] text-ink/45">2 / 4</span>
        </Pill>
      </Billboard>
      <Flag x={160} y={430} z={z(on, TOP)} style={fade(on, 4)}>
        ADE vs. traditional OCR
      </Flag>
    </>
  );
}

/** 05 · Integration: your product and a tool it works with, joined by a bridge. */
function Integration({ on }: P) {
  return (
    <>
      <Box x={110} y={225} z={z(on, TOP)} w={110} d={110} h={56} style={fade(on, 0)} />
      <Box x={340} y={225} z={z(on, TOP)} w={110} d={110} h={56} style={fade(on, 1)} />
      <Box x={222} y={263} z={z(on, TOP)} w={116} d={34} h={5} top="#d8f8e5" front="#bfeacf" side="#a4d6b8" shadow={false} style={fade(on, 2)} />
      <Billboard x={165} y={280} z={z(on, TOP + 62)} center style={fade(on, 2)}>
        <span className="grid size-11 place-items-center rounded-xl border border-black/[0.07] bg-white shadow-[0_10px_20px_-8px_rgb(23_44_33/0.35)]">
          <BoxIcon className="size-5 text-ink/70" strokeWidth={1.6} />
        </span>
      </Billboard>
      <Billboard x={395} y={280} z={z(on, TOP + 62)} center style={fade(on, 3)}>
        <span className="grid size-11 place-items-center rounded-xl border border-black/[0.07] bg-white shadow-[0_10px_20px_-8px_rgb(23_44_33/0.35)]">
          <Mark name="langchain" className="size-5" />
        </span>
      </Billboard>
      <Billboard x={280} y={282} z={z(on, TOP + 14)} center style={fade(on, 4)}>
        <span className="block size-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgb(232_131_58/0.15)]" />
      </Billboard>
      <Flag x={160} y={430} z={z(on, TOP)} style={fade(on, 5)}>
        Integration guide
      </Flag>
    </>
  );
}

/** 06 · Thought leadership: a quote, raised on a podium. */
function Thought({ on }: P) {
  return (
    <>
      <Box x={150} y={210} z={z(on, TOP)} w={250} d={170} h={26} style={fade(on, 0)} />
      <Box x={200} y={236} z={z(on, TOP + 26)} w={150} d={118} h={26} style={fade(on, 1)} />
      <Billboard x={275} y={300} z={z(on, TOP + 56)} center style={fade(on, 2)}>
        <div className="w-[15.5rem] rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_1px_2px_rgb(23_44_33/0.05),0_24px_40px_-16px_rgb(23_44_33/0.4)]">
          <span className="block text-[2rem] leading-[0.6] text-accent">“</span>
          <p className="mt-1 text-[0.86rem] leading-snug font-medium text-ink">Document AI moved from reading text to understanding layout, and now to acting on it.</p>
          <span className="mt-3 flex items-center gap-2">
            <span className="size-5 rounded-full bg-ink/15" />
            <span className="h-[5px] w-16 rounded-full bg-ink/15" />
          </span>
        </div>
      </Billboard>
      <Flag x={150} y={430} z={z(on, TOP)} style={fade(on, 3)}>
        Perspective
      </Flag>
    </>
  );
}

const SCENES = [Article, Tutorial, ProductLed, Comparison, Integration, Thought];

/** The shared stage and the six scenes on it; `active` is the one shown. */
export default function TypesScene({ active }: { active: number }) {
  return (
    <IsoScene w={W} h={H} floor={FLOOR} grid={0} theme="paper" shift={[0, 24]} className="w-full !bg-transparent">
      <Box x={30} y={30} z={0} w={380} d={380} h={TOP} top="#ffffff" front="#efede8" side="#e1ded7" shadow={false} />
      {/* The scenes are authored on a larger floor; this group recentres them on the stage. */}
      <At x={-60} y={-60}>
        {SCENES.map((Scene, i) => (
          <Scene key={i} on={i === active} />
        ))}
      </At>
    </IsoScene>
  );
}
