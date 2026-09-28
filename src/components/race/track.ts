// The race world, as pure math (no three.js), so the DOM layer can share it.
// Units: 1u ≈ 3.4 m, y up. The race runs counter-clockwise seen from above,
// infield on the runner's left. A "station" u ∈ [0, 1) names a point around the
// lap: 0 is the finish line (x = HALF on the home straight), increasing into
// bend 1. The same u in every lane is radially aligned (no stagger).

export type P3 = { x: number; y: number; z: number };

export const HALF = 2.8; // straights x ∈ [−2.8, 2.8]; bend centres (±2.8, 0, 0)
export const R0 = 2.72; // reference radius (track centreline)
export const LAP = 4 * HALF + 2 * Math.PI * R0; // 28.29
export const BEND = (Math.PI * R0) / LAP; // station span of one bend
export const STRAIGHT = (2 * HALF) / LAP; // station span of one straight
export const START = 1 - STRAIGHT * (5.2 / 5.6); // the 100 m start line, x = −2.4
/** Run R at which a runner leaving the start line first crosses the finish. */
export const CROSS = 1 - START;
export const STANDS_END = BEND + STRAIGHT; // the stands cover stations [0, 0.5]
export const LANE_R = [2.18, 2.54, 2.9, 3.26]; // lane centres, inside → outside = channels 01 → 04
export const LINE_R = [2.0, 2.36, 2.72, 3.08, 3.44];
export const LANE_W = 0.36;
export const TRACK_IN = 2.0;
export const TRACK_OUT = 3.44;

export const frac = (x: number) => x - Math.floor(x);

/** Point at station u, radius r (from the nearer bend centre / straight axis). */
export function ovalAt(u: number, r: number, out: P3, y = 0) {
  u = frac(u);
  if (u < BEND) {
    const a = (Math.PI * u) / BEND;
    out.x = HALF + r * Math.sin(a);
    out.z = r * Math.cos(a);
  } else if (u < BEND + STRAIGHT) {
    out.x = HALF - 2 * HALF * ((u - BEND) / STRAIGHT);
    out.z = -r;
  } else if (u < 2 * BEND + STRAIGHT) {
    const a = Math.PI + (Math.PI * (u - BEND - STRAIGHT)) / BEND;
    out.x = -HALF + r * Math.sin(a);
    out.z = r * Math.cos(a);
  } else {
    out.x = -HALF + 2 * HALF * ((u - 2 * BEND - STRAIGHT) / STRAIGHT);
    out.z = r;
  }
  out.y = y;
  return out;
}

/** Unit direction of travel at station u (the same in every lane). */
export function tangentAt(u: number, out: P3) {
  u = frac(u);
  out.y = 0;
  if (u < BEND || (u >= BEND + STRAIGHT && u < 2 * BEND + STRAIGHT)) {
    const a = u < BEND ? (Math.PI * u) / BEND : Math.PI + (Math.PI * (u - BEND - STRAIGHT)) / BEND;
    out.x = Math.cos(a);
    out.z = -Math.sin(a);
  } else {
    out.x = u < BEND + STRAIGHT ? -1 : 1;
    out.z = 0;
  }
  return out;
}

/** Unit outward normal (away from the infield) at station u. */
export function normalAt(u: number, out: P3) {
  tangentAt(u, out);
  const x = out.x;
  out.x = -out.z;
  out.z = x;
  // tangent (cos a, −sin a) → normal (sin a, cos a): rotate the tangent +90° about y.
  return out;
}

/** Yaw that turns local +x onto tangent t. */
export const yawAlong = (t: P3) => Math.atan2(-t.z, t.x);

/** Station for a length along the stands' "J" (bend 1 then the back straight) at radius R. */
export function stationOfLength(len: number, R: number) {
  const bend = Math.PI * R;
  return len < bend ? (BEND * len) / bend : BEND + (STRAIGHT * (len - bend)) / (2 * HALF);
}
/** Inverse of stationOfLength. */
export function lengthOfStation(u: number, R: number) {
  const bend = Math.PI * R;
  return u < BEND ? (u / BEND) * bend : bend + ((u - BEND) / STRAIGHT) * 2 * HALF;
}

// ── The stands: five sections, running order from the finish ────────────────
export type Section = { mark: "youtube" | "hackernews" | "google" | "chatgpt" | "reddit"; from: number; to: number; mast: number; channel: number; deep: string; key: string };
export const SECTIONS: Section[] = [
  { mark: "youtube", from: 0, to: 0.0837, mast: 0.0419, channel: 3, deep: "#b45309", key: "yt" },
  { mark: "hackernews", from: 0.0837, to: 0.1674, mast: 0.1256, channel: 0, deep: "#4338ca", key: "hn" },
  { mark: "google", from: 0.1674, to: 0.2512, mast: 0.2093, channel: 1, deep: "#0369a1", key: "g" },
  { mark: "chatgpt", from: 0.2512, to: 0.3579, mast: 0.3046, channel: 1, deep: "#0369a1", key: "gpt" },
  { mark: "reddit", from: 0.3579, to: 0.5, mast: 0.429, channel: 2, deep: "#047857", key: "rd" },
];
export const sectionOf = (u: number) => {
  for (let i = SECTIONS.length - 1; i > 0; i--) if (u >= SECTIONS[i].from) return i;
  return 0;
};
export const MAST_R = 5.85;

// ── Stand tiers ─────────────────────────────────────────────────────────────
export const TIERS = 7;
export const TIER_TOP = [0.08, 0.18, 0.31, 0.48, 0.7, 0.98, 1.34]; // steps ×1.28
export const TIER_DEPTH = 0.278;
export const tierInner = (i: number) => 3.64 + 0.28 * i;
export const seatRow = (i: number) => 3.78 + 0.28 * i;

// ── The timing monolith ─────────────────────────────────────────────────────
export const MONOLITH = { x: 3.3, z: 1.1, yaw: -0.803 };
/** A monolith-local point in world space. */
export function monolithToWorld(lx: number, ly: number, lz: number, out: P3) {
  const c = Math.cos(MONOLITH.yaw);
  const s = Math.sin(MONOLITH.yaw);
  out.x = MONOLITH.x + lx * c + lz * s;
  out.y = ly;
  out.z = MONOLITH.z - lx * s + lz * c;
  return out;
}
