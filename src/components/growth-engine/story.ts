import { createContext, useContext } from "react";
import { layerY, STACK_TOP } from "./layout";

// The growth engine's timeline: a one-time intro, then signal pulses at
// random gaps (never a fixed loop). Components read it every frame through
// useStory(); nothing here re-renders React.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
export const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
export const easeInOut = (x: number) => x * x * (3 - 2 * x);
/** Frame-rate independent smoothing toward a target. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

// The chart's past weeks build in once the layers have landed.
export const WEEKS = { at: 2.2, stagger: 0.18, for: 0.5 };

// Intro, in seconds from mount. Plays once.
export const INTRO = { terminalAt: 0.2, terminalFor: 0.8, layersAt: 1.2, layerFor: 0.6, layerStagger: 0.35, signalAt: 2.8 };

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
// Onward to the pipeline: after a platform lights, its channel's leads leave it
// as a train of pearls, run the rest of the route onto the pipeline bus and
// along the rail into this week's bar of the growth chart.
const HOLD = 0.25; // beat on the platform before the leads move on
const LEAD_SPACING = 0.075; // seconds between pearls in a single-file line
const TAIL_FOR = 1.6; // platform → this week's bar

// Idle pulses after the intro.
const PULSE_GAP: [number, number] = [8, 20];
export const INTRO_LEADS = 1240;
// How the intro's leads split across channels 01 → 04 (sums to 1).
const INTRO_SPLIT = [0.31, 0.27, 0.23, 0.19];
const PULSE_LEADS: [number, number] = [6, 38];
const DOTS = { intro: 7, pulse: 5 }; // pearls per token

/** When the climbing signal reaches layer i, from the run's start. */
const litAt = (i: number) => CABLE_FOR + CLIMB_FOR * (layerY(i) / STACK_TOP);
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);
const decay = (dt: number, span: number) => (dt >= 0 && dt < span ? (1 - dt / span) ** 2 : 0);
const progress = (dt: number, span: number) => (dt >= 0 && dt < span ? dt / span : -1);

type Dot = { token: number; slot: number; delay: number };
/** `leads[slot]` is what the token in that slot brings in. */
type Run = { at: number; tokens: number[]; leads: number[]; dots: Dot[]; end: number };

export class Story {
  private runs: Run[] = [];
  private settled = [0, 0, 0, 0]; // leads from finished runs, per channel
  private nextPulse: number;

  constructor(readonly still: boolean) {
    const intro = makeRun(INTRO.signalAt, [0, 1, 2, 3], INTRO_SPLIT.map((share) => Math.round(share * INTRO_LEADS)), DOTS.intro);
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
      const run = makeRun(t, [Math.floor(Math.random() * 4)], [Math.round(between(PULSE_LEADS))], DOTS.pulse);
      this.runs.push(run);
      this.nextPulse = run.end + between(PULSE_GAP);
    }
    for (const run of this.runs) if (t > run.end) run.tokens.forEach((token, slot) => (this.settled[token] += run.leads[slot]));
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
  /** Past week w's bar building in (0..1). */
  weekIn(w: number, t: number) {
    return clamp01((t - WEEKS.at - w * WEEKS.stagger) / WEEKS.for);
  }
  /** Calls back for every lead pearl on its way from a platform to the chart, with its channel and 0..1 progress. */
  leads(t: number, each: (token: number, p: number) => void) {
    for (const run of this.runs)
      for (const dot of run.dots) {
        const p = leadProgress(run, dot, t);
        if (p > 0 && p < 1) each(dot.token, p);
      }
  }
  private counted = { t: NaN, by: [0, 0, 0, 0] };
  /** Leads landed so far, per channel: each rises as that channel's dots arrive. Computed once per frame. */
  countBy(t: number) {
    const cache = this.counted;
    if (cache.t === t) return cache.by;
    cache.t = t;
    cache.by = [...this.settled];
    for (const run of this.runs)
      run.tokens.forEach((token, slot) => {
        let arrived = 0;
        let n = 0;
        for (const dot of run.dots) {
          if (dot.slot !== slot) continue;
          arrived += easeInOut(clamp01(leadProgress(run, dot, t)));
          n++;
        }
        cache.by[token] += (run.leads[slot] * arrived) / n;
      });
    return cache.by;
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

function makeRun(at: number, tokens: number[], leads: number[], dotsPerToken: number): Run {
  const dots = tokens.flatMap((token, slot) =>
    Array.from({ length: dotsPerToken }, (_, i) => ({ token, slot, delay: i * LEAD_SPACING })),
  );
  const last = Math.max(...tokens.map((_, slot) => tailAt({ at, tokens }, slot)));
  const end = last + (dotsPerToken - 1) * LEAD_SPACING + TAIL_FOR;
  return { at, tokens, leads, dots, end };
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
