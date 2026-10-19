"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import ArcButton from "../../ArcButton";
import { At, Box, Flag, IsoScene, Panel, Tile } from "../iso";
import { Label } from "../kit";
import { CREATORS, LAUNCH, PROCESS } from "./content";

const SCENES = [FindScene, NarrativeScene, CoordinateScene, LearnScene];
const STEPS = PROCESS.steps.length;

// "How we run it" as a pinned scroll stage: a warm charcoal (#1a1918) card inset from the page's white
// edges, like the About page's "How we work". Left: the four steps on the About page's numbered rail with
// its gliding green marker, the active step opened to its line; then a CTA. Right: one dark isometric scene
// per step, standing straight on the section's own floor, crossfading as steps change.
export default function Process() {
  const track = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const active = Math.min(STEPS - 1, Math.floor(progress * STEPS));

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      setProgress(Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)));
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
    <section ref={track} aria-labelledby="process-title" className="relative mx-[2.5vw] mb-[2.5vw] h-[400svh] rounded-[1.25rem] bg-[#1a1918] text-white">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden rounded-[1.25rem] px-6 pt-20 pb-8 sm:px-12 xl:px-[5vw]">
        <div className="mx-auto grid w-full max-w-[76rem] items-center gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <Label dark>{PROCESS.label}</Label>
            <h2 id="process-title" className="mt-5 max-w-[22ch] text-[clamp(1.5rem,2.3vw,2.1rem)] leading-[1.1] font-medium tracking-[-0.04em]">
              {PROCESS.title}
            </h2>

            {/* The About page's rail: numbers on a line that fills green to the active step, and one green
                marker gliding beside it. Rows above the active one are a single 2.75rem title line, so the
                active row sits at i × 2.75rem and the marker can glide there in CSS. */}
            <ol style={{ "--i": active } as CSSProperties} className="relative mt-9 ml-[4.25rem]">
              <span
                aria-hidden="true"
                className="absolute top-[calc(2.75rem*var(--i)+1.375rem)] right-[calc(100%+0.75rem)] flex -translate-y-1/2 items-center transition-[top] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <span className="grid size-6 place-items-center rounded-[4px] bg-primary">
                  <span className="size-1.5 rounded-full bg-ink" />
                </span>
                <span className="h-px w-8 bg-primary/60" />
              </span>
              {PROCESS.steps.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.title} aria-current={on ? "step" : undefined} className="grid grid-cols-[1.75rem_1px_1fr] gap-x-5">
                    <span className={`flex h-11 items-center font-mono text-[0.75rem] tracking-[0.08em] transition-colors duration-500 ${on ? "text-white" : "text-white/35"}`}>
                      0{i + 1}
                    </span>
                    <span aria-hidden="true" className="relative">
                      <span className={`absolute inset-x-0 top-0 h-[1.375rem] transition-colors duration-500 ${i <= active ? "bg-primary" : "bg-white/15"}`} />
                      <span className={`absolute inset-x-0 top-[1.375rem] bottom-0 transition-colors duration-500 ${i < active ? "bg-primary" : "bg-white/15"}`} />
                      <span
                        className={`absolute top-[1.375rem] left-1/2 size-[7px] -translate-1/2 rounded-full transition-colors duration-500 ${i <= active ? "bg-primary" : "bg-white/35"}`}
                      />
                    </span>
                    <div>
                      <p className={`flex h-11 items-center text-[1.12rem] font-medium tracking-[-0.02em] transition-colors duration-500 ${on ? "text-white" : "text-white/35"}`}>
                        {s.title}
                      </p>
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                      >
                        <p className="overflow-hidden text-[0.93rem] leading-relaxed text-white/60">
                          <span className="block max-w-[28rem] pb-4">{s.body}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-9">
              <ArcButton href="#contact" arrow tone="light" size="sm">
                Plan your launch with us
              </ArcButton>
            </div>
          </div>

          <div className="relative lg:col-span-7">
            {/* A faint green light pooled under the stage, so the floor reads as lit rather than flat. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(closest-side,rgb(25_231_110/0.10),transparent)] blur-2xl" />
            <div className="relative">
              {SCENES.map((Scene, i) => (
                <div
                  key={i}
                  className={`transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    i === active ? "scale-100 opacity-100" : "pointer-events-none scale-[0.97] opacity-0"
                  } ${i ? "absolute inset-0" : ""}`}
                >
                  <Scene active={i === active} />
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Plays 0 → 1 once over `ms` each time the scene becomes active, then holds; no loops, so each scene tells
 * its idea once and rests. With reduced motion it shows the finished picture straight away.
 */
function usePlay(active: boolean, ms: number) {
  const [t, setT] = useState(1);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const k = Math.min((now - start) / ms, 1);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, ms]);
  return t;
}

type SceneProps = { active: boolean };
const SCENE = { w: 600, h: 470, floor: 560, theme: "dark" } as const;
const fade = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transitionDelay: `${delay}ms` });

// Dark scene surfaces: charcoal slabs with hairline light edges; green is reserved for what matters.
const SLAB = "border border-white/15 bg-[#262523]";
const GLOW = "shadow-[0_0_28px_rgb(25_231_110/0.35)]";

/** A soft pool of green light on the floor. */
function Pool({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <At x={x - size / 2} y={y - size / 2}>
      <div className="rounded-full bg-[radial-gradient(closest-side,rgb(25_231_110/0.16),transparent)]" style={{ width: size, height: size }} />
    </At>
  );
}

// 01 · Six creators on the floor; the right two lift out and light up. One label says why.
const POOL = [
  { c: 0, x: 120, y: 170 },
  { c: 1, x: 250, y: 170, pick: true },
  { c: 3, x: 380, y: 170 },
  { c: 4, x: 120, y: 290 },
  { c: 5, x: 250, y: 290 },
  { c: 6, x: 380, y: 290, pick: true },
];

function FindScene({ active }: SceneProps) {
  const t = usePlay(active, 1600);
  const picked = t > 0.45;
  return (
    <IsoScene {...SCENE} shift={[20, 75]}>
      <Pool x={310} y={260} size={420} />
      {POOL.map((p, i) => (
        <Tile
          key={i}
          x={p.x}
          y={p.y}
          z={p.pick && picked ? 40 : 0}
          w={100}
          h={60}
          style={{ opacity: p.pick || !picked ? 1 : 0.35 }}
          className={`flex items-center gap-2.5 border px-3 transition-[border-color,box-shadow] duration-500 ${
            p.pick && picked ? `border-primary bg-[#262523] ${GLOW}` : "border-white/15 bg-[#262523]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
          <img src={CREATORS[p.c].photo} alt="" className={`size-9 rounded-full object-cover ${p.pick && picked ? "" : "grayscale"}`} />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-1.5 w-full rounded-full bg-white/25" />
            <span className="h-1.5 w-2/3 rounded-full bg-white/12" />
          </span>
        </Tile>
      ))}
      <Flag x={250} y={110} z={60} style={fade(picked, 300)}>
        Fit over follower count
      </Flag>
    </IsoScene>
  );
}

// 02 · One product block, lit; three creators' posts stand around it, each labelled with its angle.
const ANGLES = [
  { c: 2, x: 70, y: 200, angle: "Tutorial" },
  { c: 1, x: 330, y: 150, angle: "Deep dive" },
  { c: 5, x: 300, y: 430, angle: "Hot take" },
];

function NarrativeScene({ active }: SceneProps) {
  const t = usePlay(active, 1800);
  return (
    <IsoScene {...SCENE} shift={[-20, 75]}>
      <Pool x={280} y={300} size={380} />
      <Box x={240} y={262} w={80} d={80} h={64} top="#f2f1ec" front="#b9b8b2" side="#8f8e89">
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
        <img src={LAUNCH.company.logo} alt="" className="w-[70%]" />
      </Box>
      {ANGLES.map((a, i) => {
        const up = t > 0.2 + i * 0.25;
        return (
          <Fragment key={a.angle}>
            <Panel x={a.x} y={a.y} z={up ? 0 : -20} w={110} h={130} style={fade(up)} className={`flex flex-col gap-2 p-3 ${SLAB}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
              <img src={CREATORS[a.c].photo} alt="" className="size-8 rounded-full object-cover" />
              <span className="h-1.5 w-full rounded-full bg-white/25" />
              <span className="h-1.5 w-4/5 rounded-full bg-white/12" />
              <span className="h-1.5 w-3/5 rounded-full bg-white/12" />
            </Panel>
            <Flag x={a.x} y={a.y} z={up ? 142 : 120} style={fade(up, 200)}>
              {a.angle}
            </Flag>
          </Fragment>
        );
      })}
    </IsoScene>
  );
}

// 03 · Launch week as one simple track: a marker moves along it and at each moment one creator's post
// rises and lights up, labelled with its role and day.
const MOMENTS = [
  { c: 1, label: "Day 0 · Launch posts", x: 120 },
  { c: 4, label: "Day 1 · Quote posts", x: 230 },
  { c: 6, label: "Day 3 · Deep dives", x: 340 },
  { c: 5, label: "Day 7 · Follow-ups", x: 450 },
];
const TRACK = { x: 80, y: 300, len: 430 };

function CoordinateScene({ active }: SceneProps) {
  const t = usePlay(active, 3200);
  const at = TRACK.x + t * TRACK.len;
  return (
    <IsoScene {...SCENE} shift={[-10, -45]}>
      <Pool x={300} y={280} size={460} />
      <Tile x={TRACK.x} y={TRACK.y} w={TRACK.len} h={16} shadow={false} className="rounded-full bg-white/[0.08]" />
      <Tile x={TRACK.x} y={TRACK.y} w={Math.max(16, t * TRACK.len)} h={16} shadow={false} className="rounded-full bg-primary/70" style={{ transition: "none" }} />
      {MOMENTS.map((m) => {
        const live = at >= m.x + 10;
        return (
          <Fragment key={m.label}>
            <Panel
              x={m.x - 32}
              y={TRACK.y - 6}
              z={live ? 0 : -16}
              w={64}
              h={82}
              style={{ opacity: live ? 1 : 0.25 }}
              className={`flex flex-col items-start gap-2 border p-2.5 transition-[border-color,box-shadow] duration-500 ${live ? `border-primary bg-[#262523] ${GLOW}` : "border-white/15 bg-[#232220]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
              <img src={CREATORS[m.c].photo} alt="" className={`size-7 rounded-full object-cover ${live ? "" : "grayscale"}`} />
              <span className="h-1.5 w-full rounded-full bg-white/25" />
              <span className="h-1.5 w-2/3 rounded-full bg-white/12" />
            </Panel>
            <Flag x={m.x - 20} y={TRACK.y + 52} style={{ opacity: live ? 1 : 0.35, transitionDelay: "150ms" }}>
              {m.label}
            </Flag>
          </Fragment>
        );
      })}
    </IsoScene>
  );
}

// 04 · What performed, as blocks of different heights; the winners are green and the best is flagged,
// then it carries into the next campaign. Grows once and holds.
const RESULTS = [
  { c: 0, h: 40 },
  { c: 2, h: 118, best: "Tutorials · 3.2× clicks" },
  { c: 4, h: 58 },
  { c: 6, h: 92 },
  { c: 7, h: 30 },
];

function LearnScene({ active }: SceneProps) {
  const t = usePlay(active, 1800);
  const grow = 1 - (1 - Math.min(t / 0.7, 1)) ** 3; // ease out
  return (
    <IsoScene {...SCENE} shift={[-60, 10]}>
      <Pool x={250} y={260} size={400} />
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
              top={win ? "var(--primary)" : undefined}
              front={win ? "#12a454" : undefined}
              side={win ? "#0b7a3d" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
              <img src={CREATORS[r.c].photo} alt="" className={`size-9 rounded-full object-cover ${win ? "" : "brightness-75 grayscale"}`} />
            </Box>
            {r.best && (
              <Flag x={70 + i * 90} y={230} z={r.h + 30} style={fade(t > 0.75, 0)}>
                {r.best}
              </Flag>
            )}
          </Fragment>
        );
      })}
      <At x={0} y={0}>
        <svg width={560} height={560} className="overflow-visible" style={{ ...fade(t > 0.85), transition: "opacity 600ms" }}>
          <path d="M 190 330 C 190 430, 330 440, 380 400" fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 6" />
        </svg>
      </At>
      <Flag x={372} y={418} style={{ ...fade(t > 0.9), transition: "opacity 600ms" }}>
        ↻ Next campaign
      </Flag>
    </IsoScene>
  );
}

