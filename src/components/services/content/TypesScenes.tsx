"use client";

import { Box as BoxIcon } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { At, Billboard, Box, Flag, IsoScene, Panel } from "../iso";
import { Beacon, Mark, Tick } from "../parts";
import { linear, seg } from "./play";

// Six isometric scenes on one shared stage, one per content type. All six stay mounted; the active one's pieces rise
// into place (staggered) while every other scene's pieces sink and fade, so switching reads as one scene being
// replaced by the next rather than a cut. Each scene is a single idea you can read without the words beside it, and
// each one plays a short story once it arrives, driven by `t` (seconds since it became the active scene; the scene
// that is leaving keeps its last `t`, so it fades out as it was):
//   01 Article      the text writes in, the code appears, the engineer's review goes from "reviewing" to approved
//   02 Tutorial     a marker hops up the steps, ticking each off, to the finish
//   03 Product-led  a file drops into the product window, Parse is pressed, the result appears
//   04 Comparison   the bars grow while the scores count up, a tick for each thing ADE does
//   05 Integration  documents travel across the bridge into the other tool
//   06 Perspective  the quote writes itself, then its byline arrives

const W = 520;
const H = 440;
const FLOOR = 440;
const TOP = 10; // the stage's top, where every scene stands
const SINK = 34; // how far a scene's pieces drop when it is not the active one
const N = 6;

/** A piece's fade, staggered by its place in the scene so a scene builds up piece by piece. */
const fade = (on: boolean, i: number): CSSProperties => ({ opacity: on ? 1 : 0, transitionDelay: `${on ? 220 + i * 90 : 0}ms` });
const z = (on: boolean, base: number) => base - (on ? 0 : SINK);
/** 0 → 1 between `a` and `b` seconds (eased out), and the same, linear. */
const A = (t: number, a: number, b: number) => seg(t, a, b);
const L = (t: number, a: number, b: number) => seg(t, a, b, linear);

type P = { on: boolean; t: number };

const PILL = "inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-ink shadow-[0_1px_2px_rgb(23_44_33/0.06),0_10px_20px_-8px_rgb(23_44_33/0.3)]";
const KW = "#7a5af5";
const STR = "#2e9f6a";
const INK = "rgb(23 44 33 / 0.5)";

/** Skeleton text lines that write themselves in, one after another from `from` seconds. */
function Lines({ widths, t, from }: { widths: number[]; t: number; from: number }) {
  return (
    <span className="flex flex-col gap-[7px]">
      {widths.map((w, i) => (
        <span key={i} style={{ width: `${w * L(t, from + i * 0.28, from + i * 0.28 + 0.5)}%` }} className="block h-[5px] rounded-full bg-ink/[0.14]" />
      ))}
    </span>
  );
}
const Dot = ({ w, c, o }: { w: number; c: string; o: number }) => <span style={{ width: w, background: c, opacity: o }} className="block h-[5px] rounded-full" />;

/** 01 · Technical article: a document writes itself, a code sample stands out of it, an engineer signs it off. */
function Article({ on, t }: P) {
  const code: [number, string][][] = [
    [[22, KW], [40, INK], [26, KW]],
    [[30, INK], [56, STR]],
    [[18, KW], [34, INK], [24, STR]],
  ];
  let n = 0;
  const reviewed = A(t, 3.1, 3.5);
  return (
    <>
      <Box x={165} y={140} z={z(on, TOP)} w={190} d={270} h={8} style={fade(on, 0)}>
        <div className="flex h-full w-full flex-col gap-3 p-4">
          <span className="mt-[5.6rem] block">
            <Lines widths={[100, 92, 60]} t={t} from={0.5} />
          </span>
          <span className="mt-3 block">
            <Lines widths={[100, 86, 94, 52]} t={t} from={1.6} />
          </span>
        </div>
      </Box>
      <Panel x={180} y={192} z={z(on, TOP + 8)} w={160} h={78} className="rounded-md border border-line bg-paper p-3" style={fade(on, 1)}>
        <span className="flex h-full flex-col justify-center gap-2">
          {code.map((line, r) => (
            <span key={r} className="flex gap-1.5">
              {line.map(([w, c], k) => (
                <Dot key={k} w={w} c={c} o={A(t, 1.3 + n++ * 0.11, 1.5 + n * 0.11)} />
              ))}
            </span>
          ))}
        </span>
      </Panel>
      <Billboard x={330} y={360} z={z(on, TOP + 26)} center style={fade(on, 2)}>
        <span className={`${PILL} relative h-8 w-[15.5rem] justify-start`}>
          <span className="absolute inset-0 flex items-center gap-2.5 px-3" style={{ opacity: 1 - reviewed }}>
            <Beacon />
            Engineer reviewing…
          </span>
          <span className="flex items-center gap-2" style={{ opacity: reviewed }}>
            <span className="grid size-5 place-items-center rounded-full bg-[#e3f3e8] font-mono text-[8px] font-semibold text-[#1a7f47]">MC</span>
            Reviewed by an engineer
            <Tick className="size-4" />
          </span>
        </span>
      </Billboard>
      <Billboard x={345} y={158} z={z(on, TOP + 18)} center style={fade(on, 3)}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f3e8] px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] text-[#1a7f47] uppercase" style={{ opacity: A(t, 4.0, 4.4), translate: `0 ${(1 - A(t, 4.0, 4.4)) * 6}px` }}>
          <span className="size-1.5 rounded-full bg-[#1a7f47]" />
          Published
        </span>
      </Billboard>
      <Flag x={150} y={430} z={z(on, TOP)} style={fade(on, 4)}>
        Technical article
      </Flag>
    </>
  );
}

/** 02 · Tutorial: a marker hops up four steps, ticking each one off, to the finish. */
function Tutorial({ on, t }: P) {
  const cur = t < 1.0 ? 0 : t < 2.0 ? 1 : t < 3.0 ? 2 : 3;
  const done = t > 4.2;
  const heights = [16, 34, 52, 70];
  return (
    <>
      {heights.map((h, i) => (
        <Box key={i} x={120 + i * 88} y={200} z={z(on, TOP)} w={84} d={190} h={h} top={i < cur || (done && i === 3) ? "#e3f3e8" : i === cur ? "#ffffff" : "#f4f6f4"} style={fade(on, i)} />
      ))}
      {heights.map((h, i) => {
        const passed = i < cur || (done && i === 3);
        return (
          <Billboard key={i} x={162 + i * 88} y={295} z={z(on, TOP + h + 4)} center style={fade(on, i + 1)}>
            {passed ? (
              <span className="grid size-7 place-items-center rounded-full bg-[#1a7f47] text-[12px] text-white">✓</span>
            ) : i === cur ? (
              <span className="grid size-9 place-items-center rounded-full border border-black/[0.07] bg-white shadow-[0_8px_16px_-6px_rgb(23_44_33/0.4)]">
                <Beacon />
              </span>
            ) : (
              <span className="grid size-7 place-items-center rounded-full border border-ink/15 bg-white font-mono text-[11px] text-ink/45">{i + 1}</span>
            )}
          </Billboard>
        );
      })}
      <Flag x={160} y={430} z={z(on, TOP)} style={fade(on, 5)}>
        {done ? "Tutorial complete" : `Step ${cur + 1} of 4`}
      </Flag>
    </>
  );
}

/** 03 · Product-led: the product's window stands up out of the article; a file drops in, Parse runs, a result lands. */
function ProductLed({ on, t }: P) {
  const file = A(t, 0.9, 1.4);
  const pressed = t > 1.95 && t < 2.2;
  const parsed = t > 2.25;
  return (
    <>
      <Box x={165} y={140} z={z(on, TOP)} w={190} d={270} h={8} style={fade(on, 0)}>
        <div className="flex h-full w-full flex-col gap-3 p-4">
          <span className="block">
            <Lines widths={[100, 88]} t={t} from={0.4} />
          </span>
          <span className="mt-[9.2rem] block">
            <Lines widths={[96, 70]} t={t} from={0.9} />
          </span>
        </div>
      </Box>
      <Panel x={178} y={262} z={z(on, TOP + 8)} w={164} h={146} className="overflow-hidden rounded-md border border-line bg-white" style={fade(on, 1)}>
        <span className="flex items-center gap-1.5 border-b border-line bg-paper px-2.5 py-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-ink/20" />
          ))}
          <span className="ml-1 text-[8px] text-ink/50">ADE Playground</span>
        </span>
        <span className="flex flex-col gap-2 p-2.5">
          <span className="flex h-7 items-center gap-1.5 rounded border border-dashed border-ink/20 px-2 font-mono text-[8px] text-ink/60">
            <span className="flex items-center gap-1.5" style={{ opacity: file, transform: `translateY(${(1 - file) * -14}px)` }}>
              <span className="rounded bg-[#e3f3e8] px-1 text-[#1a7f47]">PDF</span>
              invoice.pdf
            </span>
          </span>
          <span
            className="w-fit rounded px-2.5 py-1 text-[8px] text-white"
            style={{ background: pressed ? "#e8833a" : "#172c21", transform: pressed ? "scale(0.9)" : "scale(1)" }}
          >
            {parsed ? "Parsed ✓" : "Parse"}
          </span>
          <span className="flex gap-1">
            {["invoice", "id", "contract"].map((d, i) => (
              <span key={d} className="flex items-center gap-1 rounded-full bg-[#e3f3e8] px-1.5 py-0.5 font-mono text-[7px] text-[#1a7f47]" style={{ opacity: A(t, 2.35 + i * 0.18, 2.6 + i * 0.18), transform: `translateY(${(1 - A(t, 2.35 + i * 0.18, 2.6 + i * 0.18)) * 5}px)` }}>
                ✓ {d}
              </span>
            ))}
          </span>
        </span>
      </Panel>
      <Billboard x={338} y={300} z={z(on, TOP + 78)} style={fade(on, 2)}>
        <span className={`${PILL} font-mono text-[10px] tracking-[0.08em] uppercase`}>
          <span className="size-1.5 rounded-full bg-primary" />
          Your product
        </span>
      </Billboard>
      <Flag x={150} y={430} z={z(on, TOP)} style={fade(on, 3)}>
        Product-led article
      </Flag>
    </>
  );
}

/** 04 · Comparison: two bars grow to their scores, ticking off what each one does. */
function Comparison({ on, t }: P) {
  const gA = A(t, 0.5, 1.9);
  const gB = A(t, 0.8, 1.9);
  const ticks = (full: number, got: number) => (
    <span className="flex h-full w-full flex-col items-center justify-end gap-2 overflow-hidden pb-3">
      {[0, 1, 2, 3].map((k) => (
        <span key={k} className="grid size-4 place-items-center rounded-full text-[9px] leading-none" style={{ background: k < got ? "#1a7f47" : "rgb(23 44 33 / 0.1)", color: k < got ? "#fff" : "rgb(23 44 33 / 0.35)", opacity: full > (k + 1) / 5 ? 1 : 0 }}>
          {k < got ? "✓" : "–"}
        </span>
      ))}
    </span>
  );
  return (
    <>
      <Box x={150} y={190} z={z(on, TOP)} w={90} d={90} h={8 + 122 * gA} top="#d8f8e5" front="#bfeacf" side="#a4d6b8" style={fade(on, 0)} frontChildren={ticks(gA, 4)} />
      <Box x={290} y={290} z={z(on, TOP)} w={90} d={90} h={8 + 40 * gB} style={fade(on, 1)} frontChildren={ticks(gB, 2)} />
      <Billboard x={195} y={235} z={z(on, TOP + 140)} center style={fade(on, 2)}>
        <span className={PILL} style={{ opacity: A(t, 1.2, 1.8) }}>
          <Tick className="size-4" />
          ADE
          <span className="font-mono text-[10px] text-ink/50">{Math.round(4 * A(t, 1.0, 2.0))} / 4</span>
        </span>
      </Billboard>
      <Billboard x={335} y={335} z={z(on, TOP + 58)} center style={fade(on, 3)}>
        <span className={`${PILL} text-ink/60`} style={{ opacity: A(t, 1.4, 1.9) }}>
          OCR
          <span className="font-mono text-[10px] text-ink/45">{Math.round(2 * A(t, 1.2, 2.0))} / 4</span>
        </span>
      </Billboard>
      <Flag x={160} y={430} z={z(on, TOP)} style={fade(on, 4)}>
        ADE vs. traditional OCR
      </Flag>
    </>
  );
}

/** 05 · Integration: documents travel across the bridge from your product into the other tool. */
function Integration({ on, t }: P) {
  const period = 1.8;
  const phase = (off: number) => (t > 0.9 + off ? (((t - 0.9 - off) % period) + period) % period / period : -1);
  const packets = [phase(0), phase(period / 2)];
  const arrive = Math.max(0, ...packets.map((u) => (u > 0.78 ? (u - 0.78) / 0.22 : 0)));
  const glow = Math.round(arrive * 100);
  return (
    <>
      <Box x={110} y={225} z={z(on, TOP)} w={110} d={110} h={56} style={fade(on, 0)} />
      <Box x={340} y={225} z={z(on, TOP)} w={110} d={110} h={56} top={`color-mix(in srgb, #a7eec4 ${glow}%, #ffffff)`} style={fade(on, 1)} />
      <Box x={222} y={263} z={z(on, TOP)} w={116} d={34} h={5} top="#d8f8e5" front="#bfeacf" side="#a4d6b8" shadow={false} style={fade(on, 2)} />
      <Billboard x={165} y={280} z={z(on, TOP + 62)} center style={fade(on, 2)}>
        <span className="grid size-11 place-items-center rounded-xl border border-black/[0.07] bg-white shadow-[0_10px_20px_-8px_rgb(23_44_33/0.35)]">
          <BoxIcon className="size-5 text-ink/70" strokeWidth={1.6} />
        </span>
      </Billboard>
      <Billboard x={395} y={280} z={z(on, TOP + 62)} center style={fade(on, 3)}>
        <span className="grid size-11 place-items-center rounded-xl border border-black/[0.07] bg-white shadow-[0_10px_20px_-8px_rgb(23_44_33/0.35)]" style={{ transform: `scale(${1 + 0.08 * arrive})` }}>
          <Mark name="langchain" className="size-5" />
        </span>
      </Billboard>
      {/* The documents: each leaves your product, crosses the bridge and is taken in. */}
      {packets.map((u, i) => (
        <Billboard key={i} x={232 + 100 * Math.max(0, u)} y={283} z={z(on, TOP + 18)} center style={fade(on, 4)}>
          <span
            className="block h-[1.35rem] w-4 rounded-[4px] border border-black/[0.1] bg-white shadow-[0_6px_10px_-4px_rgb(23_44_33/0.4)]"
            style={{ opacity: u < 0 ? 0 : u < 0.12 ? u / 0.12 : u > 0.88 ? (1 - u) / 0.12 : 1 }}
          >
            <span className="mx-[3px] mt-[4px] block h-[2px] rounded-full bg-accent/80" />
            <span className="mx-[3px] mt-[3px] block h-[2px] rounded-full bg-ink/25" />
          </span>
        </Billboard>
      ))}
      <Billboard x={281} y={232} z={z(on, TOP + 48)} center style={fade(on, 5)}>
        <span className="inline-flex rounded-full border border-black/[0.07] bg-white px-2.5 py-1 font-mono text-[10px] whitespace-nowrap text-ink/70 shadow-[0_8px_16px_-8px_rgb(23_44_33/0.35)]" style={{ opacity: A(t, 0.5, 1.0) }}>
          docs = loader.load()
        </span>
      </Billboard>
      <Flag x={160} y={430} z={z(on, TOP)} style={fade(on, 6)}>
        Integration guide
      </Flag>
    </>
  );
}

const QUOTE = "Document AI moved from reading text to understanding layout, and now to acting on it.".split(" ");

/** 06 · Thought leadership: a quote on a podium writes itself, then its byline arrives. */
function Thought({ on, t }: P) {
  const by = A(t, 3.3, 3.8);
  return (
    <>
      <Box x={150} y={210} z={z(on, TOP)} w={250} d={170} h={26} style={fade(on, 0)} />
      <Box x={200} y={236} z={z(on, TOP + 26)} w={150} d={118} h={26} style={fade(on, 1)} />
      <Billboard x={275} y={300} z={z(on, TOP + 56)} center style={fade(on, 2)}>
        <div className="w-[15.5rem] rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_1px_2px_rgb(23_44_33/0.05),0_24px_40px_-16px_rgb(23_44_33/0.4)]">
          <span className="block text-[2rem] leading-[0.6] text-accent" style={{ opacity: A(t, 0.5, 0.9), transform: `scale(${0.6 + 0.4 * A(t, 0.5, 0.9)})`, transformOrigin: "left bottom" }}>
            “
          </span>
          <p className="mt-1 text-[0.86rem] leading-snug font-medium text-ink">
            {QUOTE.map((w, k) => (
              <span key={k} style={{ opacity: A(t, 0.9 + k * 0.15, 1.2 + k * 0.15) }}>
                {w}{" "}
              </span>
            ))}
          </p>
          <span className="mt-3 flex items-center gap-2" style={{ opacity: by, transform: `translateY(${(1 - by) * 6}px)` }}>
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

/**
 * The shared stage and the six scenes on it. `active` is the one shown; `run` says the section is on screen. The active
 * scene's clock starts at zero when it becomes active; a scene that has just left keeps its last time, so it fades out as
 * it was instead of resetting. Reduced motion jumps the active scene to its finished state.
 */
export default function TypesScene({ active, run }: { active: number; run: boolean }) {
  const [clock, setClock] = useState({ active, ts: Array<number>(N).fill(0) });
  if (clock.active !== active) setClock({ active, ts: clock.ts.map((v, i) => (i === active ? 0 : v)) });

  useEffect(() => {
    if (!run) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = reduced ? 99 : (now - start) / 1000;
      setClock((c) => ({ ...c, ts: c.ts.map((v, i) => (i === active ? t : v)) }));
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, run]);

  return (
    <IsoScene w={W} h={H} floor={FLOOR} grid={0} theme="paper" shift={[0, 24]} className="w-full !bg-transparent">
      <Box x={30} y={30} z={0} w={380} d={380} h={TOP} top="#ffffff" front="#efede8" side="#e1ded7" shadow={false} />
      {/* The scenes are authored on a larger floor; this group recentres them on the stage. */}
      <At x={-60} y={-60}>
        {SCENES.map((Scene, i) => (
          <Scene key={i} on={i === active} t={clock.ts[i]} />
        ))}
      </At>
    </IsoScene>
  );
}
