// The how-we-work story's shared state and pacing: how far the pinned scroll has come, what time it is,
// and the one grammar every station's loop plays in. The section's DOM driver writes `journey` each frame
// (progress, time, phase, latches, loop clocks); the scene only reads it. Only the phase notifies React,
// about 7 times per full scroll. Three-free on purpose: the DOM side imports this, and three must stay
// out of the page's first-load bundle. Numbers are ported verbatim from the concept's world model.

export type SegName = "intro" | "L0" | "s1" | "L1" | "s2" | "L2" | "s3" | "L3" | "s4" | "L4" | "s5" | "L5" | "close";
export type LegName = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 intro · 1–5 steps 01–05 · 6 close (goal line)
export type Beat = -2 | -1 | 0 | 1 | 2 | 3 | 4; // -2 = before this step's latch · -1 = the rest, and phases 0/6

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const sub = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));
export const smooth = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
export const easeOutCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
export const easeInOutCubic = (x: number) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
};
export const easeInOutSine = (x: number) => (1 - Math.cos(Math.PI * clamp01(x))) / 2;
export const easeOutBack = (x: number, s = 1.70158) => {
  const k = clamp01(x) - 1;
  return 1 + (s + 1) * k * k * k + s * k * k;
};
/** A smooth 0→1 ramp centred on progress x (±w). Every p-gate in the story uses it: nothing snaps. */
export const ramp = (p: number, x: number, w = 0.008) => smooth(sub(p, x - w, x + w));
/** Frame-rate independent smoothing toward a target (same as the hero's story.ts). */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
export const SMOOTHING = 7; // λ, τ ≈ 140 ms: a weighty glide over wheel notches (18 tracked every notch: steppy)

// ── Scroll budget (viewport heights of pinned scroll). The single pacing knob: the track height is derived from it. ──
export const SEGMENTS: readonly (readonly [SegName, "dwell" | "leg", number])[] = [
  ["intro", "dwell", 0.25],
  ["L0", "leg", 0.4],
  ["s1", "dwell", 0.4],
  ["L1", "leg", 0.65],
  ["s2", "dwell", 0.4],
  ["L2", "leg", 0.5],
  ["s3", "dwell", 0.4],
  ["L3", "leg", 0.9],
  ["s4", "dwell", 0.4],
  ["L4", "leg", 0.85],
  ["s5", "dwell", 0.4],
  ["L5", "leg", 0.55],
  ["close", "dwell", 0.4],
];
export const PINNED_VH = SEGMENTS.reduce((s, x) => s + x[2], 0); // 6.5; the track is `${(PINNED_VH + 1) * 100}svh`
type Span = { kind: "dwell" | "leg"; from: number; to: number; vh: number };
export const WIN: Readonly<Record<SegName, Span>> = (() => {
  let a = 0;
  const out = {} as Record<SegName, Span>;
  for (const [name, kind, vh] of SEGMENTS) {
    out[name] = { kind, from: a / PINNED_VH, to: (a + vh) / PINNED_VH, vh };
    a += vh;
  }
  return out;
})();
export const mid = (name: SegName) => (WIN[name].from + WIN[name].to) / 2;
export const legU = (leg: LegName, p: number) => clamp01((p - WIN[leg].from) / (WIN[leg].to - WIN[leg].from));
/** Progress at leg u (legU's inverse, unclamped). */
export const at = (leg: LegName, u: number) => WIN[leg].from + u * (WIN[leg].to - WIN[leg].from);
/** Copy phase switches at 50% of each leg: intro→01, 01→02, 02→03, 03→04, 04→05, 05→close line. */
export const SWITCH = [mid("L0"), mid("L1"), mid("L2"), mid("L3"), mid("L4"), mid("L5")] as const;
/** Phase index: 0 intro, 1..5 steps, 6 close. */
export const phaseAt = (p: number) => SWITCH.filter((x) => p >= x).length as Phase;
/** Rail fill: one continuous hairline, 5 equal columns; column k fills linearly inside its step window. */
export const stepFill = (k: 1 | 2 | 3 | 4 | 5, p: number) => clamp01((p - SWITCH[k - 1]) / (SWITCH[k] - SWITCH[k - 1]));
export const railFill = (p: number) => ([1, 2, 3, 4, 5] as const).reduce((s, k) => s + stepFill(k, p), 0) / 5;

// ── Loops: one grammar. 8.0 s = five 1.2 s beats (burst ≤ 0.8 s, hold ≥ 0.4 s) + a 2.0 s rest. ──
export const LOOP = { period: 8.0, beat: 1.2, beats: 5 } as const;
export const loopX = (t: number) => ((t % LOOP.period) + LOOP.period) % LOOP.period;
export const beatAt = (t: number) => {
  const x = loopX(t);
  return x < LOOP.beat * LOOP.beats ? (Math.floor(x / LOOP.beat) as 0 | 1 | 2 | 3 | 4) : -1;
};
export const beatP = (t: number) => {
  const x = loopX(t);
  return x < 6 ? (x % LOOP.beat) / LOOP.beat : (x - 6) / 2;
};
/** Station i (0 = 01 … 4 = 05) plays its loop only while its step is showing: 0→1 at SWITCH[i], 1→0 at SWITCH[i+1]
 * (±0.008 p, mid-leg, where the camera moves fastest). 05 keeps looping through the close. Every loop-driven
 * displacement, rotation, opacity or colour change is multiplied by this gain; at gain 0 a part shows its t = 0 pose. */
export const loopGain = (i: 0 | 1 | 2 | 3 | 4, p: number) => (i === 4 ? ramp(p, SWITCH[4]) : ramp(p, SWITCH[i]) * (1 - ramp(p, SWITCH[i + 1])));
/** Loop clocks latch on first arrival, when the incoming leg reaches u 0.9 (for 04 that is RISE.newBeamIn[0]). */
export const LATCH = [at("L0", 0.9), at("L1", 0.9), at("L2", 0.9), at("L3", 0.9), at("L4", 0.9)] as const;
/** Ignite when the track's top is ≤ 0.25 of the viewport height (the lamp is then at viewport y ≤ 0.77, above the mask). */
export const IGNITE_TRACK_TOP = 0.25;
/** The pinned 3D layout; anything else (phones, portrait, short screens, reduced motion) gets the still layout. */
export const PINNED_QUERY =
  "(min-width: 64rem) and (orientation: landscape) and (prefers-reduced-motion: no-preference) and (min-height: 40rem)";

export interface Journey {
  progress: number; // smoothed p (DOM driver)
  target: number; // raw p
  time: number; // seconds: performance.now() / 1000, or frozen (DOM driver)
  loopT: [number, number, number, number, number]; // per-station loop clocks (DOM driver)
  latchedAt: [number | null, number | null, number | null, number | null, number | null];
  phase: Phase; // from progress (DOM driver)
  onScreen: boolean; // track intersecting (IntersectionObserver)
  igniteAt: number | null; // Infinity until the lamp is on screen; null = lit (hww params, stills)
  frames: number; // frames the driver has run; the harness waits for > 3
  snapOnce: boolean; // set by a rail far-jump; the driver snaps once and clears it
  forced: number | null; // dev ?hwwProgress
  frozen: number | null; // dev ?hwwTime (the ambient clock)
  frozenLoop: number | null; // dev ?hwwLoop (every loop clock; defaults to ?hwwTime)
  loopOffset: number; // dev ?hwwLoopOffset: station i's clock + i·offset
  dpr: number | null; // dev ?hwwDpr (defaults to 1 when any hww* param is present)
}

export const journey: Journey = {
  progress: 0,
  target: 0,
  time: 0,
  loopT: [0, 0, 0, 0, 0],
  latchedAt: [null, null, null, null, null],
  phase: 0,
  onScreen: false,
  igniteAt: Infinity,
  frames: 0,
  snapOnce: false,
  forced: null,
  frozen: null,
  frozenLoop: null,
  loopOffset: 0,
  dpr: null,
};

let phase: Phase = 0;
const listeners = new Set<() => void>();
/** The copy phase, for useSyncExternalStore (notifies only when it changes). */
export const activePhase = {
  get: () => phase,
  set(p: Phase) {
    if (p === phase) return;
    phase = p;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Dev-only screenshot hooks (?hww*), read from `location.search` by the driver's effect, never at module scope. */
export function readDevParams(search: string) {
  if (process.env.NODE_ENV === "production") return;
  const q = new URLSearchParams(search);
  const num = (key: string) => {
    const v = q.get(key);
    return v === null ? null : Number(v);
  };
  const forced = num("hwwProgress");
  journey.forced = forced === null ? null : clamp01(forced);
  journey.frozen = num("hwwTime");
  journey.frozenLoop = num("hwwLoop") ?? journey.frozen;
  journey.loopOffset = num("hwwLoopOffset") ?? 0;
  if (search.includes("hww")) {
    journey.dpr = num("hwwDpr") ?? 1;
    journey.igniteAt = null; // shots start with the lamp lit
  }
  Object.assign(window, { __hww: journey });
}
