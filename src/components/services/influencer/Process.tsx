"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import ArcButton from "../../ArcButton";
import { At, Billboard, Box, Flag, IsoScene, Panel, Tile } from "../iso";
import { Label, PlatformIcon, type Platform } from "../kit";
import { CREATORS, LAUNCH, PROCESS } from "./content";

const SCENES = [FindScene, NarrativeScene, RunScene, GoalScene];
const STEPS = PROCESS.steps.length;

// "How we run it" as a pinned scroll stage: a warm charcoal (#1a1918) card inset from the page's white
// edges, like the About page's "How we work". Left: the four steps on the About page's numbered rail with
// its gliding green marker, the active step opened to its line; then a CTA. Right: one dark isometric scene
// per step, standing straight on the section's own floor, crossfading as steps change.
export default function Process() {
  const track = useRef<HTMLElement>(null);
  // Only the active step is state, so scrolling re-renders the stage once per step, not every frame.
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      setActive(Math.min(STEPS - 1, Math.floor(p * STEPS)));
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
                {PROCESS.cta}
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

// 01 · Six creators on the floor; the right two lift out and light up, each flagged with the signal behind
// the pick, so it reads as a reasoned choice, not a random highlight. SAMPLE photos until the real ones land.
const POOL = [
  { c: 0, x: 120, y: 170 },
  { c: 1, x: 250, y: 170, pick: "Audience fit · 94%" },
  { c: 3, x: 380, y: 170 },
  { c: 4, x: 120, y: 290 },
  { c: 5, x: 250, y: 290 },
  { c: 6, x: 380, y: 290, pick: "Past performance · 3.2×" },
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
      {POOL.filter((p) => p.pick).map((p, i) => (
        <Flag key={p.c} x={p.x} y={p.y} z={96} style={fade(picked, 300 + i * 150)}>
          {p.pick}
        </Flag>
      ))}
    </IsoScene>
  );
}

// 02 · One product block, lit; three creators' posts stand around it, each a different narrative with its own
// shape: a walkthrough in numbered steps, a technical deep dive with code, a hot take as one bold line.
const ANGLES = [
  { c: 2, x: 70, y: 200, angle: "Product walkthrough", kind: "steps" },
  { c: 1, x: 330, y: 150, angle: "Technical deep dive", kind: "code" },
  { c: 5, x: 300, y: 430, angle: "Hot take", kind: "take" },
] as const;

/** The body of a narrative's post, shaped by what kind of post it is. */
function AngleBody({ kind }: { kind: (typeof ANGLES)[number]["kind"] }) {
  if (kind === "steps")
    return (
      <span className="flex flex-col gap-2">
        {[1, 2, 3].map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="grid size-3.5 place-items-center rounded-full bg-primary/80 font-mono text-[7px] text-ink">{n}</span>
            <span className="h-1.5 flex-1 rounded-full bg-white/20" />
          </span>
        ))}
      </span>
    );
  if (kind === "code")
    return (
      <span className="flex flex-col gap-1.5 rounded-[3px] bg-black/50 p-2">
        <span className="h-1 w-3/5 rounded-full bg-primary/80" />
        <span className="ml-2 h-1 w-4/5 rounded-full bg-white/25" />
        <span className="ml-2 h-1 w-2/3 rounded-full bg-white/25" />
        <span className="h-1 w-1/3 rounded-full bg-primary/60" />
      </span>
    );
  return (
    <span className="flex flex-col gap-1.5">
      <span className="font-serif text-[22px] leading-[0.6] text-primary">&ldquo;</span>
      <span className="h-2.5 w-full rounded-full bg-white/60" />
      <span className="h-2.5 w-3/4 rounded-full bg-white/60" />
    </span>
  );
}

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
              <AngleBody kind={a.kind} />
            </Panel>
            <Flag x={a.x} y={a.y} z={142} style={fade(up, 200)}>
              {a.angle}
            </Flag>
          </Fragment>
        );
      })}
    </IsoScene>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - (1 - v) ** 3;
const still: CSSProperties = { transition: "none" };

// Text in these scenes only ever sits on upright chips (like the flags), never flat on the floor, so it reads.
/** An upright two-line chip in the flags' style: a title and a mono detail line, with an optional face. */
function Chip({ title, detail, photo, live = false }: { title: string; detail: React.ReactNode; photo?: string; live?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-[5px] border px-2 py-1.5 whitespace-nowrap shadow-[0_14px_28px_-14px_rgb(0_0_0/0.9)] ${
        live ? "border-primary bg-[#1f2a22]" : "border-white/14 bg-[#232220]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
      {photo && <img src={photo} alt="" className="size-6 max-w-none rounded-full object-cover" />}
      <span className="leading-tight">
        <span className="block text-[11.5px] font-medium text-white">{title}</span>
        <span className="mt-0.5 flex items-center gap-1 font-mono text-[8.5px] tracking-[0.08em] text-white/55 uppercase">{detail}</span>
      </span>
    </span>
  );
}

/** A flag-style tag centred on its point (Flag itself hangs off its left edge). */
function Tag({ x, y, z = 0, live = false, children }: { x: number; y: number; z?: number; live?: boolean; children: React.ReactNode }) {
  return (
    <Billboard x={x} y={y} z={z} center style={still}>
      <span
        className={`flex items-center gap-2 rounded-[4px] border px-2.5 py-1.5 font-mono text-[10.5px] leading-none tracking-[0.08em] whitespace-nowrap uppercase ${
          live ? "border-primary/50 bg-[#1f2a22] text-primary" : "border-white/12 bg-[#232220] text-white/60"
        }`}
      >
        <span className={`size-1.5 rounded-full ${live ? "bg-primary" : "bg-white/35"}`} />
        {children}
      </span>
    </Billboard>
  );
}

// 03 · The orchestration behind both models: four status lanes on the floor (Draft → Approved → Scheduled →
// Live), one creator's piece per row. Each piece is a puck sliding lane to lane with an upright chip above it:
// who (face), what format, which channel, when it goes out. Rows run so the finished board reads left to right
// as a staircase, Draft to Live; the Live one lifts and lights like the picks in 01. "Launch week" and "Week
// 2–4" show the same board serving a launch moment and a longer program. SAMPLE rows.
const COLS = ["Draft", "Approved", "Scheduled", "Live"] as const;
const LANE = { w: 104, row: 82 };
const ORIGIN = { x: 280 - 2 * LANE.w, y: 280 - 2 * LANE.row }; // the board, centred on the floor
const laneX = (c: number) => ORIGIN.x + c * LANE.w;
const RUN: { c: number; format: string; platform: Platform; slot: string; enter: number; moves: number[] }[] = [
  { c: 1, format: "Deep dive", platform: "x", slot: "Launch week", enter: 0.02, moves: [0.1, 0.26, 0.42] },
  { c: 3, format: "Walkthrough", platform: "youtube", slot: "Week 2", enter: 0.2, moves: [0.36, 0.52] },
  { c: 6, format: "Hot take", platform: "linkedin", slot: "Week 3", enter: 0.38, moves: [0.58] },
  { c: 5, format: "Newsletter", platform: "newsletter", slot: "Week 4", enter: 0.6, moves: [] },
];
const PUCK = 44;

function RunScene({ active }: SceneProps) {
  const t = usePlay(active, 4800);
  const len = RUN.length * LANE.row;
  return (
    <IsoScene {...SCENE} shift={[0, 20]}>
      <Pool x={280} y={280} size={420} />
      {COLS.map((name, c) => {
        const live = c === COLS.length - 1;
        return (
          <Fragment key={name}>
            <Tile x={laneX(c) + 4} y={ORIGIN.y} w={LANE.w - 8} h={len} shadow={false} className={live ? "border border-primary/45 bg-primary/[0.06]" : "border border-white/10 bg-white/[0.025]"} />
            <Tag x={laneX(c) + LANE.w / 2} y={ORIGIN.y + len + 26} live={live}>
              {name}
            </Tag>
          </Fragment>
        );
      })}
      {RUN.map((r, i) => {
        const row = RUN.length - 1 - i; // the Live piece sits nearest the front-right
        const col = r.moves.reduce((sum, m) => sum + ease(clamp01((t - m) / 0.1)), 0);
        const live = col > COLS.length - 1.5;
        const shown = ease(clamp01((t - r.enter) / 0.08));
        const cx = laneX(0) + LANE.w / 2 + col * LANE.w;
        const cy = ORIGIN.y + row * LANE.row + LANE.row / 2;
        const lift = live ? 26 : 0;
        return (
          <Fragment key={r.c}>
            <Box
              x={cx - PUCK / 2}
              y={cy - PUCK / 2}
              z={lift + (1 - shown) * 30}
              w={PUCK}
              d={PUCK}
              h={12}
              top={live ? "var(--primary)" : "#3a3936"}
              front={live ? "#12a454" : "#2a2927"}
              side={live ? "#0b7a3d" : "#201f1d"}
              style={{ ...still, opacity: shown }}
            />
            <Billboard x={cx} y={cy} z={lift + 22 + (1 - shown) * 30} center style={{ ...still, opacity: shown }}>
              <Chip
                title={r.format}
                photo={CREATORS[r.c].photo}
                live={live}
                detail={
                  <>
                    <PlatformIcon platform={r.platform} className="size-2.5 text-white/80" />
                    {r.slot}
                  </>
                }
              />
            </Billboard>
          </Fragment>
        );
      })}
    </IsoScene>
  );
}

// 04 · One goal, and one track to it, a single object: a long dark track running straight into the goal block, with the
// goal visible from the first frame (the dashed target on the block, a card reading 0 / 10,000 signups; it could as well be
// awareness or impressions). A green bar grows along the track toward it, and the goal card's number climbs with the bar's
// leading edge. Three flags are planted on the track at the points where we adjust (a new angle, a shift of budget, a new
// creator), each on a pole standing on the track and lit as the bar passes it; the bar picks up speed after each, so it is
// plain we do not launch and wait. At the end the bar meets the goal block: it lights, the card turns green with "Goal
// reached", and a ring pings out.
const FLAGS = ["Launch", "New angle", "Shift budget", "New creator"] as const;
const SEGMENTS = 20; // the goal card's meter: one segment per 5% of the goal
const GOAL = 10_000;
const PROGRESS = [0.12, 0.35, 0.59, 0.83, 1]; // share of the goal at each flag; the last is the goal itself
const AT = [0.1, 0.3, 0.48, 0.64, 0.8]; // when the bar's edge reaches each (0–1 of the scene): shorter gaps, so it speeds up
const TRACK = { x: 30, y: 252, w: 392, d: 56, h: 12 }; // runs up and to the right, into the goal block
const BAR = { x0: 36, len: 380, inset: 9, h: 9 }; // the green bar, on the track
const FLAG_AT = PROGRESS.slice(0, 4).map((u) => BAR.x0 + u * BAR.len);
const GOAL_AT = { x: 424, y: 238, w: 96, d: 84, h: 34 }; // the block the track runs into
const MID_Y = TRACK.y + TRACK.d / 2;
const POLE = 46;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** The share of the goal reached at time t: nothing until the launch, then linear between flags (a steeper line each time). */
function shareAt(t: number) {
  if (t < 0.04) return 0;
  if (t < AT[0]) return PROGRESS[0] * ease(clamp01((t - 0.04) / (AT[0] - 0.04)));
  for (let k = 0; k < AT.length - 1; k++) {
    if (t < AT[k + 1]) return lerp(PROGRESS[k], PROGRESS[k + 1], (t - AT[k]) / (AT[k + 1] - AT[k]));
  }
  return 1;
}

function GoalScene({ active }: SceneProps) {
  const t = usePlay(active, 7200);
  const p = shareAt(t);
  const reached = t >= AT[4];
  const ping = ease(clamp01((t - AT[4]) / 0.1));
  const edge = BAR.x0 + p * BAR.len;
  return (
    <IsoScene {...SCENE} shift={[0, 56]}>
      <Pool x={290} y={280} size={500} />

      {/* The track and the goal block it runs into: one piece. */}
      <Box x={TRACK.x} y={TRACK.y} w={TRACK.w} d={TRACK.d} h={TRACK.h} top="#2d2c2a" front="#242321" side="#1c1b19" style={still} />
      <Box
        x={GOAL_AT.x}
        y={GOAL_AT.y}
        w={GOAL_AT.w}
        d={GOAL_AT.d}
        h={GOAL_AT.h}
        top={reached ? "#1f6b3f" : "#34322f"}
        front={reached ? "#175330" : "#2a2927"}
        side={reached ? "#10401f" : "#201f1d"}
        style={still}
      />
      <Tile
        x={GOAL_AT.x + 16}
        y={GOAL_AT.y + 10}
        z={GOAL_AT.h + 2}
        w={64}
        h={64}
        shadow={false}
        className={`border-2 transition-[border-color,background-color,box-shadow] duration-700 ${reached ? `border-primary bg-primary/[0.22] ${GLOW}` : "border-dashed border-white/35 bg-white/[0.03]"}`}
        style={still}
      />

      {/* The progress bar, growing along the track, with a bright point at its leading edge. */}
      {p > 0.002 && (
        <>
          <Box x={BAR.x0} y={TRACK.y + BAR.inset} z={TRACK.h} w={Math.max(1, p * BAR.len)} d={TRACK.d - 2 * BAR.inset} h={BAR.h} top="var(--primary)" front="#12a454" side="#0b7a3d" shadow={false} style={still} />
          <Billboard x={edge} y={MID_Y} z={TRACK.h + BAR.h} center style={still}>
            <span className="block size-[9px] rounded-full bg-white shadow-[0_0_0_2.5px_var(--primary)]" />
          </Billboard>
        </>
      )}

      {/* The adjustments: a flag on a pole standing on the track, lit once the bar has passed it. */}
      {FLAGS.map((f, k) => {
        const x = FLAG_AT[k];
        const hit = p >= PROGRESS[k] - 0.002 && t >= AT[k] - 0.02;
        const shown = ease(clamp01((t - (AT[k] - 0.05)) / 0.06));
        return (
          <Fragment key={f}>
            <Billboard x={x} y={MID_Y} z={TRACK.h + BAR.h - 1} center style={{ ...still, opacity: shown }}>
              <span className={`block w-px transition-colors duration-500 ${hit ? "bg-primary" : "bg-white/30"}`} style={{ height: POLE + 1 }} />
            </Billboard>
            <Billboard x={x} y={MID_Y} z={TRACK.h + BAR.h + POLE - 2 - (1 - shown) * 10} center style={{ ...still, opacity: shown }}>
              {/* The process rail's marker (a green square with an ink dot once passed), then a mono label, in the flags' style. */}
              <span className="flex items-center gap-2 rounded-[4px] border border-white/12 bg-[#232220] py-1 pr-2.5 pl-1 whitespace-nowrap shadow-[0_12px_22px_-12px_rgb(0_0_0/0.9)]">
                <span className={`grid size-[18px] place-items-center rounded-[3px] transition-colors duration-500 ${hit ? "bg-primary" : "bg-white/10"}`}>
                  <span className={`size-1.5 rounded-full transition-colors duration-500 ${hit ? "bg-ink" : "bg-white/40"}`} />
                </span>
                <span className={`font-mono text-[10px] leading-none tracking-[0.08em] uppercase transition-colors duration-500 ${hit ? "text-white" : "text-white/60"}`}>{f}</span>
                <span className="font-mono text-[10px] leading-none tracking-[0.04em] text-white/40">{Math.round(PROGRESS[k] * 100)}%</span>
              </span>
            </Billboard>
          </Fragment>
        );
      })}

      {/* The goal card, above its block: the count climbs with the bar, on a segmented meter. */}
      <Billboard x={GOAL_AT.x + GOAL_AT.w / 2} y={GOAL_AT.y + GOAL_AT.d / 2} z={GOAL_AT.h + 70} center style={still}>
        <div className="w-[13.5rem] rounded-[6px] border border-white/14 bg-[#232220] shadow-[0_14px_28px_-14px_rgb(0_0_0/0.9)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] whitespace-nowrap text-white/55 uppercase">
              <span className="size-1.5 rounded-full bg-white/40" />
              Goal · signups
            </span>
            <span
              className={`rounded-[3px] px-1.5 py-[3px] font-mono text-[8px] leading-none tracking-[0.1em] whitespace-nowrap uppercase transition-colors duration-500 ${
                reached ? "bg-primary font-semibold text-ink" : "bg-white/10 text-white/50"
              }`}
            >
              {reached ? "Reached" : "In progress"}
            </span>
          </div>
          <div className="px-3 pt-2.5 pb-3">
            <p className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[26px] leading-none font-medium tracking-[-0.045em] text-white tabular-nums">{Math.round(p * GOAL).toLocaleString("en-US")}</span>
              <span className="font-mono text-[10px] text-white/40">/ {GOAL.toLocaleString("en-US")}</span>
            </p>
            <span className="mt-2.5 flex gap-[2px]">
              {Array.from({ length: SEGMENTS }, (_, n) => (
                <span key={n} className={`h-[7px] flex-1 rounded-[1px] ${n < Math.round(p * SEGMENTS) ? "bg-primary" : "bg-white/12"}`} />
              ))}
            </span>
          </div>
        </div>
      </Billboard>

      {/* The payoff: a ring pinging out from the goal. */}
      <At x={0} y={0} style={still}>
        <svg width={560} height={560} className="overflow-visible">
          {ping > 0 && ping < 1 && (
            <>
              <circle cx={GOAL_AT.x + GOAL_AT.w / 2} cy={GOAL_AT.y + GOAL_AT.d / 2} r={40 + 90 * ping} fill="none" stroke="var(--primary)" strokeWidth={2} opacity={0.7 * (1 - ping)} />
              <circle cx={GOAL_AT.x + GOAL_AT.w / 2} cy={GOAL_AT.y + GOAL_AT.d / 2} r={30 + 58 * ping} fill="none" stroke="var(--primary)" strokeWidth={1.5} opacity={0.5 * (1 - ping)} />
            </>
          )}
        </svg>
      </At>
    </IsoScene>
  );
}
