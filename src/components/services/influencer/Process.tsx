"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import ArcButton from "../../ArcButton";
import { At, Box, Flag, IsoScene, Panel, Tile } from "../iso";
import { Label } from "../kit";
import { CREATORS, LAUNCH, PROCESS } from "./content";

const SCENES = [FindScene, NarrativeScene, CoordinateScene, LearnScene];

// "How we run it" as a pinned scroll stage on the near-black band: the four steps on a numbered rail at
// left (the active one opens to its line), and at right one isometric scene per step that plays while its
// step is active. Scrolling moves through the steps; a CTA sits under the rail.
export default function Process() {
  const track = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      setActive(Math.min(PROCESS.steps.length - 1, Math.floor(p * PROCESS.steps.length)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section ref={track} aria-labelledby="process-title" className="relative h-[400svh] bg-[#0b0b0b] text-white">
      <div className="sticky top-0 flex h-svh items-center px-6 pt-20 pb-8 sm:px-12 xl:px-[6vw]">
        <div className="mx-auto grid w-full max-w-[76rem] items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Label dark>{PROCESS.label}</Label>
            <h2 id="process-title" className="mt-5 max-w-[22ch] text-[clamp(1.5rem,2.3vw,2.1rem)] leading-[1.1] font-medium tracking-[-0.04em]">
              {PROCESS.title}
            </h2>

            <ol className="mt-8 border-l border-white/15">
              {PROCESS.steps.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.title} aria-current={on ? "step" : undefined} className="relative py-2.5 pl-6">
                    <span
                      className={`absolute top-0 -left-px h-full w-px transition-colors duration-500 ${i <= active ? "bg-primary" : "bg-transparent"}`}
                    />
                    <p className="flex items-baseline gap-3">
                      <span className={`font-mono text-[0.72rem] tracking-[0.1em] transition-colors duration-500 ${on ? "text-primary" : "text-white/35"}`}>
                        0{i + 1}
                      </span>
                      <span className={`text-[1.15rem] font-medium tracking-[-0.02em] transition-colors duration-500 ${on ? "text-white" : "text-white/35"}`}>
                        {s.title}
                      </span>
                    </p>
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                    >
                      <p className="overflow-hidden pl-[2.1rem] text-[0.92rem] leading-relaxed text-white/60">
                        <span className="block pt-2">{s.body}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8">
              <ArcButton href="#contact" arrow tone="light" size="sm">
                Plan your launch with us
              </ArcButton>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl lg:col-span-7">
            {SCENES.map((Scene, i) => (
              <div
                key={i}
                className={`transition-opacity duration-700 ${i === active ? "opacity-100" : "pointer-events-none opacity-0"} ${i ? "absolute inset-0" : ""}`}
              >
                <Scene active={i === active} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A loop clock (0..1 over `ms`) that only runs while `active`; holds at `rest` otherwise or with reduced motion. */
function useLoop(active: boolean, ms: number, rest = 1) {
  const [t, setT] = useState(rest);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      setT(((now - start) % ms) / ms);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, ms]);
  return t;
}

type SceneProps = { active: boolean };
const SCENE = { w: 600, h: 470, floor: 560 } as const;
const fade = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transitionDelay: `${delay}ms` });

function CreatorTile({ c, x, y, z = 0, lit = false, style }: { c: number; x: number; y: number; z?: number; lit?: boolean; style?: CSSProperties }) {
  return (
    <Tile
      x={x}
      y={y}
      z={z}
      w={92}
      h={44}
      style={style}
      className={`flex items-center gap-2 border bg-white px-2 transition-colors duration-500 ${lit ? "border-primary ring-2 ring-primary/60" : "border-ink/60"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
      <img src={CREATORS[c].photo} alt="" className={`size-7 rounded-full object-cover transition-[filter] duration-500 ${lit ? "" : "grayscale"}`} />
      <span className="flex flex-1 flex-col gap-1">
        <span className="h-1.5 w-full rounded-full bg-ink/25" />
        <span className="h-1.5 w-2/3 rounded-full bg-ink/15" />
      </span>
    </Tile>
  );
}

// 01 · A scan beam sweeps a grid of creators; the right ones lift out of the grid, tagged with why.
const POOL: { c: number; x: number; y: number; pick?: string }[] = [
  { c: 0, x: 70, y: 150 },
  { c: 1, x: 190, y: 150, pick: "Technical credibility" },
  { c: 2, x: 310, y: 150 },
  { c: 3, x: 70, y: 250 },
  { c: 4, x: 190, y: 250 },
  { c: 5, x: 310, y: 250, pick: "Audience fit" },
  { c: 6, x: 70, y: 350, pick: "Past performance" },
  { c: 7, x: 190, y: 350 },
  { c: 2, x: 310, y: 350 },
];

function FindScene({ active }: SceneProps) {
  const t = useLoop(active, 4200);
  const beam = Math.min(t / 0.55, 1) * 420 + 40; // the beam's x across the grid
  return (
    <IsoScene {...SCENE} shift={[20, 60]}>
      {/* The beam: a thin green wall of light sweeping along x. */}
      <At x={beam} y={120} style={{ transition: "none" }}>
        <div
          className="absolute top-0 -left-[90px] h-[300px] w-[90px] origin-right bg-[linear-gradient(90deg,transparent,rgb(25_231_110/0.5))] border-r-2 border-primary"
          style={{ transform: "rotateY(90deg)" }}
        />
      </At>
      {POOL.map((p, i) => {
        const passed = beam > p.x + 46;
        const lift = !!p.pick && passed;
        return (
          <Fragment key={i}>
            <CreatorTile c={p.c} x={p.x} y={p.y} z={lift ? 34 : 0} lit={lift} style={{ opacity: p.pick || !passed ? 1 : 0.45 }} />
            {p.pick && (
              <Flag x={p.x} y={p.y + 70} style={fade(lift, 150)}>
                {p.pick}
              </Flag>
            )}
          </Fragment>
        );
      })}
    </IsoScene>
  );
}

// 02 · One product at the center, three creators' posts standing around it, each with its own angle.
const ANGLES = [
  { c: 2, x: 60, y: 200, angle: "Tutorial", lines: [1, 0.8, 0.9, 0.5] },
  { c: 1, x: 330, y: 150, angle: "Deep dive", lines: [1, 1, 0.95, 1, 0.7] },
  { c: 5, x: 300, y: 430, angle: "Hot take", lines: [0.9, 0.4] },
];

function NarrativeScene({ active }: SceneProps) {
  const t = useLoop(active, 3600);
  return (
    <IsoScene {...SCENE} shift={[-20, 75]}>
      <At x={0} y={0}>
        <svg width={560} height={560} className="overflow-visible">
          {ANGLES.map((a, i) => (
            <path
              key={i}
              d={`M 280 300 L ${a.x + 60} ${a.y}`}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="5 6"
              style={{ opacity: t > 0.15 + i * 0.15 ? 1 : 0, transition: "opacity 400ms" }}
            />
          ))}
        </svg>
      </At>
      <Box x={240} y={262} w={80} d={80} h={64} top="#ffffff">
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
        <img src={LAUNCH.company.logo} alt="" className="w-[70%]" />
      </Box>
      <Flag x={240} y={342} z={70}>
        Product
      </Flag>
      {ANGLES.map((a, i) => {
        const up = t > 0.15 + i * 0.15;
        return (
          <Fragment key={a.angle}>
            <Panel x={a.x} y={a.y} z={up ? 0 : -30} w={120} h={140} style={fade(up)} className="flex flex-col gap-1.5 border border-ink/60 bg-white p-3">
              <span className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
                <img src={CREATORS[a.c].photo} alt="" className="size-6 rounded-full object-cover" />
                <span className="h-1.5 w-10 rounded-full bg-ink/30" />
              </span>
              {a.lines.map((l, j) => (
                <span key={j} className="h-1.5 rounded-full bg-ink/15" style={{ width: `${l * 100}%` }} />
              ))}
            </Panel>
            <Flag x={a.x} y={a.y} z={up ? 152 : 120} style={fade(up, 200)}>
              {a.angle}
            </Flag>
          </Fragment>
        );
      })}
    </IsoScene>
  );
}

// 03 · Launch week as four lanes on the floor; a light beam sweeps the week and each creator lights up as
// their post goes out: launch posts first, then quote posts, deep dives, follow-ups.
const LANES = [
  { role: "Launch posts", slots: [{ c: 1, at: 0.04 }, { c: 3, at: 0.12 }, { c: 0, at: 0.2 }] },
  { role: "Quote posts", slots: [{ c: 4, at: 0.2 }, { c: 7, at: 0.3 }, { c: 5, at: 0.42 }] },
  { role: "Deep dives", slots: [{ c: 6, at: 0.36 }, { c: 2, at: 0.56 }] },
  { role: "Follow-ups", slots: [{ c: 1, at: 0.74 }, { c: 3, at: 0.9 }] },
];
const LANE_X = 70;
const LANE_LEN = 440;

function CoordinateScene({ active }: SceneProps) {
  const t = useLoop(active, 6000);
  const head = Math.min(t / 0.85, 1);
  return (
    <IsoScene {...SCENE} shift={[40, -35]}>
      {LANES.map((lane, r) => {
        const y = 150 + r * 80;
        return (
          <Fragment key={lane.role}>
            <Tile x={LANE_X} y={y} w={LANE_LEN} h={50} shadow={false} className="border border-ink/40 bg-white/60" />
            <Flag x={LANE_X} y={y} z={4} tone="bg-white">
              {lane.role}
            </Flag>
            {lane.slots.map(({ c, at }) => {
              const on = head >= at;
              return (
                <Tile
                  key={`${c}-${at}`}
                  x={LANE_X + 110 + at * (LANE_LEN - 150)}
                  y={y + 8}
                  z={on ? 14 : 0}
                  w={34}
                  h={34}
                  className={`overflow-hidden border-2 transition-colors duration-500 ${on ? "border-primary" : "border-ink/40"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
                  <img src={CREATORS[c].photo} alt="" className={`size-full object-cover transition-[filter] duration-500 ${on ? "" : "grayscale"}`} />
                </Tile>
              );
            })}
          </Fragment>
        );
      })}
      {/* The playhead: a wall of green light standing across all four lanes. */}
      <At x={LANE_X + head * LANE_LEN} y={140} style={{ transition: "none" }}>
        <div
          className="absolute top-0 -left-[80px] h-[330px] w-[80px] origin-right border-r-2 border-primary bg-[linear-gradient(90deg,transparent,rgb(25_231_110/0.45))]"
          style={{ transform: "rotateY(90deg)" }}
        />
      </At>
    </IsoScene>
  );
}

// 04 · What performed, as blocks of different heights per creator/angle; the winners glow green and the
// best one is flagged, then a dashed loop carries it into the next campaign.
const RESULTS = [
  { c: 0, h: 40 },
  { c: 2, h: 118, best: "Tutorials · 3.2× clicks" },
  { c: 4, h: 58 },
  { c: 6, h: 92 },
  { c: 7, h: 30 },
];

function LearnScene({ active }: SceneProps) {
  const t = useLoop(active, 4000);
  const grow = Math.min(t / 0.4, 1);
  return (
    <IsoScene {...SCENE} shift={[-60, 10]}>
      {RESULTS.map((r, i) => {
        const h = Math.max(4, r.h * grow);
        const win = r.h > 80;
        return (
          <Fragment key={i}>
            <Box
              x={70 + i * 90}
              y={230}
              w={60}
              d={60}
              h={h}
              top={win ? "var(--primary)" : "#ffffff"}
              front={win ? "#b9f5cf" : "#e4e9e5"}
              side={win ? "#8fe3ae" : "#c9d3cc"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
              <img src={CREATORS[r.c].photo} alt="" className="size-9 rounded-full object-cover" />
            </Box>
            {r.best && (
              <Flag x={70 + i * 90} y={230} z={h + 30} style={fade(grow >= 1, 100)}>
                {r.best}
              </Flag>
            )}
          </Fragment>
        );
      })}
      {/* Next campaign: the learnings loop back in. */}
      <At x={0} y={0}>
        <svg width={560} height={560} className="overflow-visible" style={fade(t > 0.55)}>
          <path d="M 190 330 C 190 430, 330 440, 380 400" fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 6" />
        </svg>
      </At>
      <Tile x={360} y={380} w={130} h={46} style={fade(t > 0.6)} className="flex items-center justify-center border border-ink/60 bg-white font-mono text-[11px] text-ink">
        Next campaign
      </Tile>
    </IsoScene>
  );
}
