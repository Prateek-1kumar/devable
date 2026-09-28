// The whole hero as pure functions of scroll progress p ∈ [0, 1] (no three.js:
// the DOM layer imports this too). Nothing accumulates, so scrubbing backward
// retraces exactly. All tuning knobs live here.

import { CROSS, SECTIONS, frac } from "./track";

export const SECTION_SVH = 520; // pinned section height (floor 460: shorten beats 1 and 5, never beat 4)
export const DAMP = { p: 5, cam: 3.2 }; // scroll weight, camera operator lag

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
export const easeInCubic = (x: number) => x * x * x;
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
export const smoothstep = (x: number) => x * x * (3 - 2 * x);
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
const span = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));
const pad2 = (n: number) => String(n).padStart(2, "0");

// ── Beats ───────────────────────────────────────────────────────────────────
export const BEATS = [
  { label: "Ready", start: 0, jump: 0 },
  { label: "Baton", start: 0.07, jump: 0.125 },
  { label: "Start", start: 0.19, jump: 0.29 },
  { label: "Sprint", start: 0.335, jump: 0.41 },
  { label: "Distance", start: 0.48, jump: 0.62 },
  { label: "Both", start: 0.72, jump: 0.8 },
  { label: "Finish", start: 0.86, jump: 0.97 },
] as const;
const HYSTERESIS = 0.004;

/** Current beat, holding the previous one within ±0.004 of a boundary so captions never flicker. */
export function beatAt(p: number, prev: number) {
  let b = 0;
  for (let i = BEATS.length - 1; i > 0; i--)
    if (p >= BEATS[i].start) {
      b = i;
      break;
    }
  if (b === prev || prev < 0) return b;
  const edge = b > prev ? BEATS[b].start : BEATS[b + 1].start;
  return Math.abs(p - edge) < HYSTERESIS ? prev : b;
}

// ── Timing constants ────────────────────────────────────────────────────────
export const T = {
  copyOut: [0.05, 0.09] as const,
  batonLift: [0.09, 0.15] as const,
  batonSink: [0.155, 0.175] as const,
  slotFlash: [0.175, 0.19] as const,
  stripeOn: (k: number) => 0.205 + 0.01 * k,
  beadDepart: (k: number) => 0.242 + 0.005 * k,
  beadFor: 0.038,
  beadArrive: (k: number) => 0.28 + 0.005 * k,
  popFor: 0.006,
  set: 0.3,
  go: 0.315,
  run: 0.318,
  hourClock: [0.318, 0.48] as const,
  ytRise: [0.398, 0.418] as const,
  spike: [0.398, 0.412] as const,
  decay: [0.418, 0.465] as const,
  flying: [0.78, 0.905] as const,
  displayRoll: [0.91, 0.95] as const,
  annotation: [0.92, 0.97] as const,
  signoff: (k: number) => 0.95 + 0.005 * k,
  signoffEnd: 0.97,
  cta: 0.95,
};

// ── Schedules ───────────────────────────────────────────────────────────────
/** Monotone cubic (Fritsch–Carlson). Start slope = first secant (explosive), end slope = 0 (glide to a stop). */
export function pchip(k: readonly (readonly [number, number])[]) {
  const x = k.map((q) => q[0]);
  const y = k.map((q) => q[1]);
  const n = x.length;
  const h = x.slice(1).map((v, i) => v - x[i]);
  const d = h.map((hi, i) => (y[i + 1] - y[i]) / hi);
  const m = x.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (t: number) => {
    if (t <= x[0]) return y[0];
    if (t >= x[n - 1]) return y[n - 1];
    let i = 0;
    while (t > x[i + 1]) i++;
    const s = (t - x[i]) / h[i];
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h[i] * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h[i] * m[i + 1];
  };
}

const GLIDE = 0.0177; // 0.5u past the line, in laps
// Run R (laps from the start line). Both reach the finish (station 0) at p = 0.905, abreast.
export const FORMATION = pchip([
  [0.318, 0],
  [0.4, 0.046],
  [0.48, CROSS],
  [0.525, 1 + CROSS],
  [0.565, 2 + CROSS],
  [0.6, 3 + CROSS],
  [0.632, 4 + CROSS],
  [0.661, 5 + CROSS],
  [0.687, 6 + CROSS],
  [0.705, 6.42],
  [0.72, 6.52],
  [0.905, 7 + CROSS],
  [0.94, 7 + CROSS + GLIDE],
]);
export const AMBER = pchip([
  [0.318, 0],
  [0.333, 0.05],
  [0.36, 0.125],
  [0.398, CROSS],
  [0.425, CROSS + GLIDE],
  [0.78, CROSS + GLIDE],
  [0.8, 0.27],
  [0.87, 0.93],
  [0.905, 1 + CROSS],
  [0.94, 1 + CROSS + GLIDE],
]);
/** Laps since the formation's first finish crossing. */
export const lapOf = (p: number) => FORMATION(p) - CROSS;
const speed = (f: (p: number) => number, p: number) => (f(p + 0.001) - f(p - 0.001)) / 0.002;
/** Run of lane k's runner. */
export const runOf = (k: number, p: number) => (k === 3 ? AMBER(p) : FORMATION(p));

// ── Runners ─────────────────────────────────────────────────────────────────
/** Pacer pop-in (0 hidden, overshoots to 1). */
export const pacerIn = (k: number, p: number) => (p < T.beadArrive(k) ? 0 : easeOutBack(clamp01((p - T.beadArrive(k)) / T.popFor)));
/** "Set": tail up, 0..1. */
export const setTilt = (p: number) => (p >= T.set && p < T.run ? easeOutCubic(clamp01((p - T.set) / T.popFor)) : 0);
/** Bead flight 0..1 from the monolith to the blocks (visible only strictly inside). */
export const beadAt = (k: number, p: number) => easeInOutCubic(clamp01((p - T.beadDepart(k)) / T.beadFor));

/** Two-lap strip coordinate of a run: the window [R_h − len, R_h] never wraps. */
export const stripRun = (R: number) => (R < 1 ? R : 1 + frac(R));

/** Streak length in laps. */
export function streakLen(k: number, p: number) {
  if (k === 3) return Math.min(p < 0.78 ? 0.06 : 0.12, 0.018 * speed(AMBER, p));
  const F = FORMATION(p);
  return F > 0 ? Math.min(1, 0.02 + 0.12 * (1.55 ** Math.max(0, lapOf(p)) - 1)) : 0;
}

/** Lane fill window [a, b] in strip runs (a ≥ b means empty). */
export function laneWindow(k: number, p: number): [number, number] {
  if (k < 3) return [0, clamp(FORMATION(p), 0, 1)];
  const R = AMBER(p);
  if (p <= 0.4) return [0, R];
  if (p < 0.46) return [lerp(0, R, easeInOutCubic((p - 0.4) / 0.06)), R];
  if (p < 0.78) return [0, 0];
  return [Math.max(CROSS + GLIDE, R - 0.35), R];
}

// ── Stands ──────────────────────────────────────────────────────────────────
/** How far (station) tier n has poured: tier n pours right behind the formation during lap n. */
export const pour = (n: number, p: number) => (n === 0 ? 0.5 : clamp(lapOf(p) - (n - 1), 0, 0.5));
/** Mast i rising, 0..1. */
export const mastRise = (i: number, p: number) =>
  i === 0 ? clamp01((p - T.ytRise[0]) / 0.02) : clamp01((lapOf(p) - SECTIONS[i].mast) / 0.12);

export const SEAT = { empty: 0, own: 1, amber: 2 } as const;
/** A seat's fill: 0 empty, 1 its section's channel color, 2 amber. */
export function seatFill(section: number, u: number, rank: number, tier: number, p: number, lap: number, Ra: number) {
  if (section > 0) {
    if (lap < u) return SEAT.empty;
    const n = Math.floor(lap - u) + 1;
    return rank < 1 - 0.7 ** n ? SEAT.own : SEAT.empty;
  }
  // YouTube: the sprint spikes the base row, drains to 25%, then the flying lap fills every tier.
  if (p > T.flying[0] && rank < 0.95 && Ra >= u + CROSS) return SEAT.amber;
  if (tier === 0 && rank < 0.9 && p >= 0.398 + 0.014 * (u / SECTIONS[0].to)) {
    const drained = rank >= 0.25 && p >= 0.418 + (0.047 * (rank - 0.25)) / 0.65;
    return drained ? SEAT.empty : SEAT.amber;
  }
  return SEAT.empty;
}
/** The seat wave travelling with amber's flying lap (0..1 at station u). */
export function waveAt(u: number, p: number, sigma: number) {
  if (p <= T.flying[0] || p >= T.flying[1]) return 0;
  let d = Math.abs(u - sigma);
  d = Math.min(d, 1 - d);
  return d < 0.025 ? Math.cos(((Math.PI / 2) * d) / 0.025) ** 2 : 0;
}

// ── The monolith ────────────────────────────────────────────────────────────
const WHITE = "#ffffff";
export const LIT = ["#8d87ee", "#62c5f1", "#64d2ad", "#f9ce5a"];
/** The D's four stripes, top → bottom (stripe i shows channel 3 − i): F1 start lights, then the sign-off. */
export function stripes(p: number) {
  return [3, 2, 1, 0].map((k) => ((p >= T.stripeOn(k) && p < T.go) || (p >= T.signoff(k) && p < T.signoffEnd) ? LIT[k] : WHITE));
}
/** The slot's mint flash as the baton docks (0..1). */
export const slotFlash = (p: number) => (p < T.slotFlash[0] || p > T.slotFlash[1] ? 0 : p < 0.18 ? (p - 0.175) / 0.005 : 1 - (p - 0.18) / 0.01);

const BATON_REST = [2.75, 0.605, 0.4];
// The hover sits just above the slot and below the navbar at K1 (the baton is 0.53 tall).
const BATON_CTRL = [2.85, 3.25, 0.55];
const BATON_HOVER = [3.3, 2.95, 1.1];
/** Baton centre (world), or null once docked. */
export function batonAt(p: number, out: number[]) {
  if (p >= T.batonSink[1]) return null;
  if (p >= T.batonSink[0]) {
    out[0] = BATON_HOVER[0];
    out[1] = lerp(BATON_HOVER[1], 2.205, easeInCubic(span(p, T.batonSink)));
    out[2] = BATON_HOVER[2];
    return out;
  }
  const s = easeInOutCubic(span(p, T.batonLift));
  for (let i = 0; i < 3; i++) out[i] = (1 - s) ** 2 * BATON_REST[i] + 2 * (1 - s) * s * BATON_CTRL[i] + s * s * BATON_HOVER[i];
  return out;
}

const hour = (p: number) => pad2(Math.round(48 * clamp01((p - 0.318) / 0.162)));
const month = (p: number) => pad2(clamp(Math.floor(2 * lapOf(p)), 0, 12));
/** The race clock on the monolith's display. */
export function display(p: number) {
  if (p < 0.175) return "READY";
  if (p < T.go) return "BATON IN";
  if (p < 0.48) return `HOUR ${hour(p)}`;
  if (p < 0.687) return `MONTH ${month(p)}`;
  if (p < T.displayRoll[0]) return "MONTH 12";
  return `+${growth(p)}%`;
}
/** Pipeline growth rolling up to 312 (in steps of 4) over the display roll. */
export const growth = (p: number) => 4 * Math.round(78 * easeOutCubic(span(p, T.displayRoll)));
/** The HUD readout. */
export function readout(p: number) {
  if (p < 0.175) return "STATUS · READY";
  if (p < T.go) return "STATUS · BATON IN";
  if (p < 0.48) return `SPRINT · HOUR ${hour(p)}`;
  if (p < 0.687) return `LAP ${pad2(clamp(Math.floor(lapOf(p)) + 1, 1, 6))}/06 · MONTH ${month(p)}`;
  if (p < 0.78) return "LAP 06/06 · MONTH 12";
  if (p < 0.905) return "MONTH 12 · LAUNCH";
  return "FINISH · MONTH 12";
}
/** Draw-on progress of the HUD sparkline's three paths: sprint, compounding, launch. */
export const sparkline = (p: number) => [clamp01((p - 0.398) / 0.072), clamp01((p - 0.48) / 0.207), clamp01((p - 0.78) / 0.125)];
/** The cut section's growth curve, quantized to 30 steps. */
export const annotation = (p: number) => Math.round(span(p, T.annotation) * 30) / 30;
/** Beat-2 caption line: 0 "On your marks.", 1 "Set.", 2 "Go.". */
export const subAt = (beat: number, p: number) => (beat !== 2 ? 0 : p < T.set ? 0 : p < T.go ? 1 : 2);

// ── Camera ──────────────────────────────────────────────────────────────────
// Each key is an orbit around a target; channels are Hermite-interpolated, so
// moves never cut through the stadium. Azimuth is unwrapped on purpose.
type Key = { p: number; leave?: number; t: [number, number, number]; az: number; el: number; dist: number; fov: number; shift: number; fog: [number, number] };
export const KEYS: Key[] = [
  { p: 0, leave: 0.05, t: [2.8, 0.9, 2.6], az: -39, el: 12, dist: 15.9, fov: 22, shift: 0.18, fog: [0.95, 1.5] },
  { p: 0.13, leave: 0.155, t: [3.12, 1.6, 0.87], az: -52, el: 10, dist: 10, fov: 24, shift: 0.21, fog: [1.1, 2.2] },
  { p: 0.2, leave: 0.245, t: [3.3, 1.82, 1.1], az: -46, el: 2, dist: 5.4, fov: 24, shift: 0.12, fog: [1.3, 3.0] },
  { p: 0.285, leave: 0.3, t: [0.45, 0.62, 1.91], az: -100, el: 3, dist: 9.2, fov: 30, shift: 0.09, fog: [1.0, 1.8] },
  { p: 0.325, leave: 0.33, t: [0.45, 0.62, 1.91], az: -100, el: 3, dist: 15.3, fov: 16, shift: 0.09, fog: [0.9, 1.5] },
  { p: 0.375, t: [2.7, 1.45, 3.26], az: -14, el: 12, dist: 24, fov: 26, shift: 0.22, fog: [0.95, 1.6] },
  { p: 0.43, leave: 0.47, t: [4.38, 1.12, 3.9], az: -20, el: 16, dist: 10.7, fov: 28, shift: 0.16, fog: [1.0, 1.9] },
  { p: 0.56, t: [1.59, 0.35, -0.84], az: 60, el: 22, dist: 30, fov: 24, shift: 0.165, fog: [0.9, 1.7] },
  { p: 0.63, t: [1.59, 0.35, -0.84], az: 150, el: 32, dist: 34.8, fov: 24, shift: 0.19, fog: [0.9, 1.7] },
  { p: 0.69, t: [1.59, 0.3, -0.84], az: 250, el: 46, dist: 35.2, fov: 24, shift: 0.16, fog: [0.9, 1.7] },
  { p: 0.745, leave: 0.78, t: [1.59, 0.2, -0.84], az: 352, el: 56, dist: 38.3, fov: 24, shift: 0.18, fog: [0.9, 1.8] },
  { p: 0.84, t: [1.59, 0.4, -0.84], az: 338, el: 50, dist: 36.9, fov: 24, shift: 0.18, fog: [0.9, 1.8] },
  { p: 0.9, leave: 1, t: [3.4, 1.0, 2.4], az: 321, el: 14, dist: 19, fov: 22, shift: 0.12, fog: [0.95, 1.5] },
];
/** Posters for the still frame (p = 1). */
export const POSTER: Record<"phone" | "desktop", Key> = {
  phone: { p: 1, t: [1.59, 0.4, -0.84], az: -36, el: 34, dist: 27, fov: 30, shift: 0, fog: [0.9, 1.8] },
  desktop: { p: 1, t: [1.59, 0.45, -0.84], az: -36, el: 30, dist: 29, fov: 26, shift: 0, fog: [0.9, 1.8] },
};
// The dolly zoom between K3 (leaves 0.30) and K3z (arrives 0.325): the blocks keep their size.
const DOLLY = { from: 0.3, to: 0.325, at: [-2.4, 0.07, 2.72], half: 1.803 };

const CHANNELS = 10; // tx ty tz az el dist fov shift fogN fogF
const valuesOf = (k: Key) => [k.t[0], k.t[1], k.t[2], k.az, k.el, k.dist, k.fov, k.shift, k.fog[0], k.fog[1]];
const VALUES = KEYS.map(valuesOf);
const leaveOf = (k: Key) => k.leave ?? k.p;
// Tangents: 0 at held keys, the neighbours' secant at pass keys.
const SLOPES = KEYS.map((k, i) => {
  const out = new Array<number>(CHANNELS).fill(0);
  if (k.leave !== undefined || i === 0 || i === KEYS.length - 1) return out;
  const prev = KEYS[i - 1];
  const next = KEYS[i + 1];
  const dt = next.p - leaveOf(prev);
  for (let c = 0; c < CHANNELS; c++) out[c] = (VALUES[i + 1][c] - VALUES[i - 1][c]) / dt;
  return out;
});
const hermite = (va: number, vb: number, ma: number, mb: number, s: number, h: number) => {
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * va + (s3 - 2 * s2 + s) * h * ma + (-2 * s3 + 3 * s2) * vb + (s3 - s2) * h * mb;
};

export type Pose = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; fov: number; shift: number; near: number; far: number; fogNear: number; fogFar: number };
export const newPose = (): Pose => ({ px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: 22, shift: 0, near: 0.1, far: 100, fogNear: 20, fogFar: 40 });

const scratch = new Array<number>(CHANNELS).fill(0);
const RAD = Math.PI / 180;

function sample(p: number, v: number[]) {
  const n = KEYS.length;
  if (p <= KEYS[0].p) return VALUES[0].forEach((x, c) => (v[c] = x));
  if (p >= leaveOf(KEYS[n - 1])) return VALUES[n - 1].forEach((x, c) => (v[c] = x));
  for (let i = 0; i < n; i++) {
    const k = KEYS[i];
    if (p >= k.p && p <= leaveOf(k)) return VALUES[i].forEach((x, c) => (v[c] = x));
    const next = KEYS[i + 1];
    if (next && p > leaveOf(k) && p < next.p) {
      const ta = leaveOf(k);
      const h = next.p - ta;
      const s = (p - ta) / h;
      for (let c = 0; c < CHANNELS; c++) v[c] = hermite(VALUES[i][c], VALUES[i + 1][c], SLOPES[i][c], SLOPES[i + 1][c], s, h);
      return;
    }
  }
}

/** Orbit values → camera pose, with the aspect correction, clip planes and fog. */
function toPose(v: number[], aspect: number, out: Pose, dolly: boolean) {
  const [tx, ty, tz, az, el, dist] = v;
  out.tx = tx;
  out.ty = ty;
  out.tz = tz;
  out.px = tx + dist * Math.cos(el * RAD) * Math.sin(az * RAD);
  out.py = ty + dist * Math.sin(el * RAD);
  out.pz = tz + dist * Math.cos(el * RAD) * Math.cos(az * RAD);
  let fov = v[6];
  if (dolly) {
    const d = Math.hypot(out.px - DOLLY.at[0], out.py - DOLLY.at[1], out.pz - DOLLY.at[2]);
    fov = (2 * Math.atan(DOLLY.half / d)) / RAD;
  }
  // Keep horizontal framing stable on narrower screens.
  if (aspect < 1.6) fov = (2 * Math.atan((Math.tan((fov * RAD) / 2) * 1.6) / aspect)) / RAD;
  out.fov = fov;
  out.shift = v[7];
  out.near = Math.max(0.1, 0.02 * dist);
  out.far = 3 * dist + 30;
  out.fogNear = v[8] * dist;
  out.fogFar = v[9] * dist;
  return out;
}

/** The camera at (camera-damped) progress camP. */
export function cameraAt(camP: number, aspect: number, out: Pose) {
  sample(camP, scratch);
  return toPose(scratch, aspect, out, camP > DOLLY.from && camP < DOLLY.to);
}
/** The still frame's camera. */
export function posterPose(phone: boolean, aspect: number, out: Pose) {
  return toPose(valuesOf(POSTER[phone ? "phone" : "desktop"]), aspect, out, false);
}
