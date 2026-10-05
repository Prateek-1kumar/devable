import { createContext, useContext } from "react";
import { DESTINATIONS, STACK_TOP, bandY } from "./layout";

// The growth engine's timeline. One deterministic cycle repeats: the terminal
// sends a signal, it climbs the stack and lights each channel band as it
// passes, each band routes a pulse out to its destination tiles, the tiles
// feed the collector, and the dashboard's pipeline ticks up one week.
// Components read it every frame through useStory(); nothing here re-renders React.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const easeOut = (x: number) => 1 - (1 - x) ** 3;
/** Frame-rate independent smoothing toward a target. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** First signal leaves this long after mount; then one every CYCLE seconds. */
const FIRST = 1.1;
export const CYCLE = 7;

// Beats within a cycle, in seconds.
const IN_FOR = 0.75; // terminal → stack, along the floor
const CLIMB_FOR = 1.2; // up the riser
const TOP_FOR = 0.35; // across the top into the core
const OUT_FOR = 0.8; // a band's port → its tile
const COLLECT_FOR = 0.85; // tile → dashboard
const TICK_FOR = 0.9; // the chart's new week rising
const HIGHLIGHT = { rise: 0.1, hold: 0.2, fall: 0.4 };
const TILE_GLOW = 1.4;
const CORE_GLOW = 0.9;

const litAt = (channel: number) => IN_FOR + CLIMB_FOR * (bandY(channel) / STACK_TOP);
const lastLand = Math.max(...DESTINATIONS.map((d) => litAt(d.channel) + OUT_FOR));
const COLLECT_AT = lastLand + 0.1;
const TICK_AT = COLLECT_AT + COLLECT_FOR;

const progress = (dt: number, span: number) => (dt >= 0 && dt < span ? dt / span : -1);
const decay = (dt: number, span: number) => (dt >= 0 && dt < span ? (1 - dt / span) ** 2 : 0);
const highlight = (dt: number) =>
  dt < 0 ? 0 : dt < HIGHLIGHT.rise ? dt / HIGHLIGHT.rise : dt < HIGHLIGHT.rise + HIGHLIGHT.hold ? 1 : decay(dt - HIGHLIGHT.rise - HIGHLIGHT.hold, HIGHLIGHT.fall);

export class Story {
  constructor(readonly still: boolean) {}

  private lastClock = 0;
  private offset = 0;

  /** Scene time; a still render is pinned to a settled moment between cycles. */
  time(clock: number) {
    if (this.still) return -1;
    // r3f zeroes the clock whenever frameloop resumes (scrolled back on screen);
    // carry the time forward so the cycle continues instead of restarting.
    if (clock < this.lastClock) this.offset += this.lastClock;
    this.lastClock = clock;
    return this.offset + clock;
  }

  /** Seconds into the current cycle, or -1 before the first (and always for a still). */
  private local(t: number) {
    return t < FIRST ? -1 : (t - FIRST) % CYCLE;
  }
  /** How many cycles have completed their chart tick (the dashboard's week counter). */
  week(t: number) {
    if (t < FIRST) return 0;
    const n = Math.floor((t - FIRST) / CYCLE);
    const tick = easeInOut(clamp01(((t - FIRST) % CYCLE - TICK_AT) / TICK_FOR));
    return n + tick;
  }

  /** The terminal is sending (status line). */
  sending(t: number) {
    const c = this.local(t);
    return c >= 0 && c < IN_FOR + CLIMB_FOR;
  }
  /** Pulse along the terminal → stack floor route (0..1), or -1. */
  inbound(t: number) {
    return progress(this.local(t), IN_FOR);
  }
  /** Pulse up the riser (0..1), or -1. */
  climb(t: number) {
    return progress(this.local(t) - IN_FOR, CLIMB_FOR);
  }
  /** Pulse across the top into the core (0..1), or -1. */
  top(t: number) {
    return progress(this.local(t) - IN_FOR - CLIMB_FOR, TOP_FOR);
  }
  /** The core's glow as the signal arrives (1 → 0). */
  core(t: number) {
    return decay(this.local(t) - IN_FOR - CLIMB_FOR - TOP_FOR, CORE_GLOW);
  }
  /** Channel band i's highlight as the signal passes it (0..1). */
  band(i: number, t: number) {
    const c = this.local(t);
    return c < 0 ? 0 : highlight(c - litAt(i));
  }
  /** Pulse from a band's port out to destination d's tile (0..1), or -1. */
  out(d: number, t: number) {
    return progress(this.local(t) - litAt(DESTINATIONS[d].channel), OUT_FOR);
  }
  /** Destination d's tile glow once its pulse lands (1 → 0). */
  tile(d: number, t: number) {
    return decay(this.local(t) - litAt(DESTINATIONS[d].channel) - OUT_FOR, TILE_GLOW);
  }
  /** Pulse from tile d along the collector into the dashboard (0..1), or -1. */
  collect(d: number, t: number) {
    return progress(this.local(t) - COLLECT_AT - (DESTINATIONS.length - 1 - d) * 0.04, COLLECT_FOR);
  }
  /** The dashboard's live marker while the new week rises (0..1). */
  ticking(t: number) {
    const c = this.local(t);
    return c >= TICK_AT && c < TICK_AT + TICK_FOR + 0.6;
  }
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
