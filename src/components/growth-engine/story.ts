import { createContext, useContext } from "react";
import { clamp01, easeOutCubic } from "./ease";
import { layerY, STACK_TOP } from "./layout";

// The growth engine's timeline: a one-time intro, then signal pulses at
// random gaps (never a fixed loop). Components read it every frame through
// useStory(); nothing here re-renders React.

export { clamp01, damp, easeOutBack, easeOutCubic } from "./ease";

// Intro, in seconds from mount. Plays once.
export const INTRO = { terminalAt: 0.2, terminalFor: 0.8, layersAt: 1.2, layerFor: 0.6, layerStagger: 0.35, signalAt: 2.8 };
// When the intro's signal reaches the chip on top, it powers up; its energy runs
// the bus to the growth screen, whose chart then draws on.
const POWER = { for: 0.6 };
// Once the top block (with the chip) has landed, the chip's arm grows out, then the screen rises onto it.
const ARM = { at: INTRO.layersAt + 3 * INTRO.layerStagger + INTRO.layerFor + 0.05, for: 0.7 };
const SCREEN = { at: ARM.at + ARM.for, for: 0.5 };

// Phases of every signal run, in seconds from the run's start.
export const CABLE_FOR = 0.7; // bead travels the cable
export const CLIMB_FOR = 0.7; // bead climbs the rail
const CORE_AT = CABLE_FOR + CLIMB_FOR;
const FLASH_FOR = 0.9;
const SHEEN_FOR = 0.6;
const ROUTE_FOR = 0.9; // a pulse runs a channel's floor traces out to its destinations
const LAND_GLOW_FOR = 1.4; // a destination tile's glow as the pulse arrives
const CORE_FOR = 1.2;
const RIPPLE_FOR = 1.1;
// Growth: after a platform lights, its channel's leads run the chip's bus into
// the growth screen as a train of pearls.
const HOLD = 0.25; // beat on the platform before the leads go
const LEAD_SPACING = 0.075; // seconds between pearls in a single-file line
const TAIL_FOR = 1.6; // chip → the growth screen
const LAND = 0.35; // a lead flying from where the arm enters the screen onto the chart's tip

// Idle pulses after the intro.
const PULSE_GAP: [number, number] = [8, 20];
const DOTS = { intro: 7, pulse: 5 }; // pearls per token

/** When the climbing signal reaches layer i, from the run's start. */
const litAt = (i: number) => CABLE_FOR + CLIMB_FOR * (layerY(i) / STACK_TOP);
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);
const decay = (dt: number, span: number) => (dt >= 0 && dt < span ? (1 - dt / span) ** 2 : 0);
const progress = (dt: number, span: number) => (dt >= 0 && dt < span ? dt / span : -1);

type Dot = { token: number; slot: number; delay: number };
type Run = { at: number; tokens: number[]; dots: Dot[]; end: number };

export class Story {
  private runs: Run[] = [];
  private readonly intro: Run;
  private nextPulse: number;

  constructor(readonly still: boolean) {
    const intro = makeRun(INTRO.signalAt, [0, 1, 2, 3], DOTS.intro);
    this.intro = intro;
    this.runs.push(intro);
    this.nextPulse = intro.end + between(PULSE_GAP);
  }

  private lastClock = 0;
  private offset = 0;

  /** Scene time; a still render is pinned to the settled end state. */
  time(clock: number) {
    if (this.still) return 1e4;
    // r3f zeroes the clock whenever frameloop resumes (scrolled back on screen);
    // carry the time forward so the intro doesn't replay.
    if (clock < this.lastClock) this.offset += this.lastClock;
    this.lastClock = clock;
    return this.offset + clock;
  }

  update(t: number) {
    if (this.still) return;
    if (t >= this.nextPulse) {
      const run = makeRun(t, [Math.floor(Math.random() * 4)], DOTS.pulse);
      this.runs.push(run);
      this.nextPulse = run.end + between(PULSE_GAP);
    }
    this.runs = this.runs.filter((run) => t <= run.end);
  }

  terminalIn(t: number) {
    return clamp01((t - INTRO.terminalAt) / INTRO.terminalFor);
  }
  layerIn(i: number, t: number) {
    return clamp01((t - INTRO.layersAt - i * INTRO.layerStagger) / INTRO.layerFor);
  }
  /** 1 once the intro signal has reached layer i; lights stay softly on after. */
  lit(i: number, t: number) {
    return t >= INTRO.signalAt + litAt(i) ? 1 : 0;
  }
  flash(i: number, t: number) {
    return this.peak((r) => decay(t - r.at - litAt(i), FLASH_FOR));
  }
  sheen(i: number, t: number) {
    return this.first((r) => progress(t - r.at - litAt(i), SHEEN_FOR));
  }
  /** Pulse progress (0..1) along layer i's floor traces, or -1. */
  route(i: number, t: number) {
    return this.first((r) => progress(t - r.at - litAt(i), ROUTE_FOR));
  }
  /** Glow (1 → 0) on layer i's destination tiles once its pulse lands. */
  landed(i: number, t: number) {
    return this.peak((r) => decay(t - r.at - litAt(i) - ROUTE_FOR, LAND_GLOW_FOR));
  }
  /** Bead progress along cable + rail (0..1), or -1. */
  signal(t: number) {
    return this.first((r) => progress(t - r.at, CABLE_FOR + CLIMB_FOR));
  }
  core(t: number) {
    return this.peak((r) => decay(t - r.at - CORE_AT, CORE_FOR));
  }
  ripple(t: number) {
    return this.first((r) => progress(t - r.at - CORE_AT, RIPPLE_FOR));
  }
  /** The chip's arm growing out after the top block lands (0..1). */
  armIn(t: number) {
    return clamp01((t - ARM.at) / ARM.for);
  }
  /** The growth screen rising onto the arm's neck (0..1). */
  screenIn(t: number) {
    return clamp01((t - SCREEN.at) / SCREEN.for);
  }
  /** The chip on top powering up once the intro's signal reaches it (0..1, stays on). */
  powerIn(t: number) {
    return clamp01((t - INTRO.signalAt - CORE_AT) / POWER.for);
  }
  /** Calls back for every lead landing on the growth screen, with its channel and 0..1 progress onto the chart. */
  landing(t: number, each: (token: number, k: number) => void) {
    for (const run of this.runs)
      for (const dot of run.dots) {
        const k = landProgress(run, dot, t);
        if (k >= 0 && k < 1) each(dot.token, k);
      }
  }
  /** How much of the growth chart the intro's leads have built so far (0..1): each landed lead adds its step. */
  built(t: number) {
    const run = this.intro;
    if (this.still || t > run.end) return 1;
    let sum = 0;
    for (const dot of run.dots) sum += easeOutCubic(clamp01(landProgress(run, dot, t)));
    return sum / run.dots.length;
  }
  /** Calls back for every lead pearl on the chip's bus, with its channel and 0..1 progress. */
  leads(t: number, each: (token: number, p: number) => void) {
    for (const run of this.runs)
      for (const dot of run.dots) {
        const p = leadProgress(run, dot, t);
        if (p > 0 && p < 1) each(dot.token, p);
      }
  }

  private peak(f: (run: Run) => number) {
    let v = 0;
    for (const run of this.runs) v = Math.max(v, f(run));
    return v;
  }
  private first(f: (run: Run) => number) {
    for (const run of this.runs) {
      const v = f(run);
      if (v >= 0) return v;
    }
    return -1;
  }
}

/** When a slot's leads leave their platform: after its route out and a beat there. */
const tailAt = (run: Pick<Run, "at" | "tokens">, slot: number) => run.at + litAt(run.tokens[slot]) + ROUTE_FOR + HOLD;
const leadProgress = (run: Run, dot: Dot, t: number) => (t - tailAt(run, dot.slot) - dot.delay) / TAIL_FOR;
/** A lead's flight on the screen after it reaches it: < 0 before, 0..1 while landing, ≥ 1 after. */
const landProgress = (run: Run, dot: Dot, t: number) => (t - tailAt(run, dot.slot) - dot.delay - TAIL_FOR) / LAND;

function makeRun(at: number, tokens: number[], dotsPerToken: number): Run {
  const dots = tokens.flatMap((token, slot) =>
    Array.from({ length: dotsPerToken }, (_, i) => ({ token, slot, delay: i * LEAD_SPACING })),
  );
  const last = Math.max(...tokens.map((_, slot) => tailAt({ at, tokens }, slot)));
  const end = last + (dotsPerToken - 1) * LEAD_SPACING + TAIL_FOR + LAND;
  return { at, tokens, dots, end };
}

export const StoryContext = createContext<Story | null>(null);

/** Reports which layer the cursor is over (null when none), for the DOM hover card. */
export const HoverContext = createContext<(index: number | null) => void>(() => {});

/** A layer highlighted from outside the scene (the hero's channel keys). */
export const FocusContext = createContext<number | null>(null);

export function useStory() {
  const story = useContext(StoryContext);
  if (!story) throw new Error("useStory must be used inside the growth engine scene");
  return story;
}
