import { clamp01, easeOutBack, easeOutCubic } from "../growth-engine/ease";

// Mission DVB-01: every scripted state of the hero is a pure function of one
// scroll progress p (0..1). No three.js here: the DOM loop imports this file,
// and three must stay in the lazy scene chunk.

// ── Helpers ──────────────────────────────────────────────────────────────
export { clamp01 };
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const eis = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Window opacity: in over [in0, in1], out over [out0, out1]. */
export const windowed = (p: number, in0: number, in1: number, out0: number, out1: number) =>
  seg(p, in0, in1) * (1 - seg(p, out0, out1));

/** Phones and reduced motion get one still frame: exactly the complement of Tailwind's `motion-safe:lg:` (lg is 64rem). */
export const STILL_QUERY = "(width < 64rem), (prefers-reduced-motion: reduce)";

// ── World numbers the DOM also needs ─────────────────────────────────────
export const R = 14; // planet radius (the sphere's top is the origin)
export const R0 = 16.8; // parking orbit, 1.20R (≙ 412 km)
export const R1 = 18.9; // where the spiral ends, 1.35R (≙ 721 km)
/** The invisible cut between the two scale spaces: the pad set before it, the orbit set from it on. */
export const CUT_P = 0.27;
export const VEHICLE_BASE = 0.2; // engine exit plane on the pad (pad units)
export const MODULE_Y0 = VEHICLE_BASE + 3.59; // satellite centre inside the fairing

// ── Beats and captions ───────────────────────────────────────────────────
// `land` is where the flight-plan buttons jump: inside the beat's caption window and
// past the ±0.004 hysteresis, so the rail and the copy both switch to that beat.
export const BEATS = [
  { label: "INTEGRATION", name: "Integration", start: 0, land: 0 },
  { label: "LAUNCH", name: "Launch", start: 0.12, land: 0.135 },
  { label: "TRAJECTORY", name: "Trajectory", start: 0.26, land: 0.28 },
  { label: "DEPLOY", name: "Deploy", start: 0.4, land: 0.455 },
  { label: "DOWNLINK", name: "Downlink", start: 0.54, land: 0.63 },
  { label: "CORRECTION", name: "Correction", start: 0.745, land: 0.77 },
  { label: "ORBIT", name: "Sustained orbit", start: 0.85, land: 0.875 },
] as const;

/** Caption windows; index 0 is the intro block (the H1). */
export const CAPTION_WINDOWS: { id: number; from: number; to: number }[] = [
  { id: 0, from: -1, to: 0.085 },
  { id: 1, from: 0.09, to: 0.125 }, // the terminal count, so the copy column is never empty
  { id: 2, from: 0.13, to: 0.255 },
  { id: 3, from: 0.275, to: 0.395 },
  { id: 4, from: 0.43, to: 0.545 },
  { id: 5, from: 0.625, to: 0.745 },
  { id: 6, from: 0.765, to: 0.85 },
  { id: 7, from: 0.87, to: 2 },
];

const HYST = 0.004;

/** The beat (0..6) at p, holding the previous one within ±0.004 of a boundary. */
export function beatAt(p: number, prev = -1) {
  const end = (i: number) => (i + 1 < BEATS.length ? BEATS[i + 1].start : 2);
  if (prev >= 0 && p >= BEATS[prev].start - HYST && p < end(prev) + HYST) return prev;
  for (let i = BEATS.length - 1; i >= 0; i--) if (p >= BEATS[i].start) return i;
  return 0;
}

/** The caption id at p (0 intro, 2..7 beats, -1 none), with the same hysteresis. */
export function captionAt(p: number, prev = -2) {
  const held = CAPTION_WINDOWS.find((w) => w.id === prev);
  if (held && p >= held.from - HYST && p < held.to + HYST) return prev;
  for (const w of CAPTION_WINDOWS) if (p >= w.from && p < w.to) return w.id;
  return -1;
}

// ── Scroll pacing ────────────────────────────────────────────────────────
// The story keeps its p numbers; only the scroll → story mapping is shaped. Piecewise-linear
// knots [s, p]: at a 900px viewport the 8100px of travel give integration 567px, the launch
// 688px, the cut gap 122px, the reveal 688px, staging 486px, deploy 972px, downlink 1418px,
// the correction and the orbit 1012px each.
const PACE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.07, 0.1],
  [0.095, 0.12],
  [0.115, 0.13],
  [0.2, 0.255],
  [0.215, 0.275],
  [0.3, 0.345],
  [0.36, 0.4],
  [0.38, 0.43],
  [0.5, 0.54],
  [0.535, 0.625],
  [0.71, 0.745],
  [0.835, 0.85],
  [0.96, 0.97],
  [1, 1],
];
function piecewise(x: number, from: 0 | 1) {
  const to = from === 0 ? 1 : 0;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let i = 0;
  while (i < PACE.length - 2 && x > PACE[i + 1][from]) i++;
  const [a, b] = [PACE[i], PACE[i + 1]];
  return a[to] + ((b[to] - a[to]) * (x - a[from])) / (b[from] - a[from]);
}
/** Story progress p for a section scroll fraction s. */
export const storyP = (s: number) => piecewise(s, 0);
/** The section scroll fraction s where the story reaches p. */
export const scrollS = (p: number) => piecewise(p, 1);

// ── Sky ──────────────────────────────────────────────────────────────────
// The panel's CSS sky behind the transparent canvas: a morning sky at the pad that deepens
// through the climb to space in the caption gap, where the ink flips from dark to light text.
const SKY_KEYS: readonly (readonly [number, string, string])[] = [
  [0, "#8fb3d9", "#e6eef6"],
  [0.13, "#8fb3d9", "#e6eef6"],
  [0.2, "#7aa4d2", "#d5e3f1"],
  [0.25, "#5f8fc6", "#c3d6ea"],
  [0.26, "#2b5796", "#8fb4de"],
  [0.268, "#10275a", "#3d6fb8"],
  [0.28, "#03060d", "#060c1c"],
];
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const linHex = (hex: string) => [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255));
const SKY_LIN = SKY_KEYS.map(([p, z, h]) => [p, linHex(z), linHex(h)] as const);
/** Linear-RGB mix of the sky keys at p, as three linear channels. */
function skyLin(p: number, which: 1 | 2) {
  let i = 0;
  while (i < SKY_LIN.length - 2 && p > SKY_LIN[i + 1][0]) i++;
  const [a, b] = [SKY_LIN[i], SKY_LIN[i + 1]];
  const t = seg(p, a[0], b[0]);
  return a[which].map((v, k) => lerp(v, b[which][k], t));
}
const cssRgb = (lin: number[]) => `rgb(${lin.map((v) => Math.round(255 * clamp01(toSrgb(v)))).join(" ")})`;
export const INK_FLIP = 0.258;
/** The sky at p: zenith and horizon as CSS colours, and the ink (text tone): dark from .258, held down to .254. */
export function skyAt(p: number, prevInk?: "light" | "dark") {
  const flip = prevInk === "dark" ? INK_FLIP - HYST : INK_FLIP;
  return { z: cssRgb(skyLin(p, 1)), h: cssRgb(skyLin(p, 2)), ink: (p >= flip ? "dark" : "light") as "light" | "dark" };
}
/** The horizon colour in linear RGB (the pad set's fog and ground haze match the CSS sky). */
export const skyHorizonLinear = (p: number) => skyLin(p, 2);

// ── Craft kinematics ─────────────────────────────────────────────────────
/** Exploded lift of module + arrays on the pad (1 → 0). */
export const explodeModule = (p: number) => 1 - easeOutCubic(seg(p, 0.02, 0.05));
/** Capsule lift above its seat (1 → 0, with a small seat overshoot). */
export const explodeCapsule = (p: number) => 1 - easeOutBack(seg(p, 0.075, 0.1));
/** Array i's radial pull-out (1 → 0). */
export const explodeArray = (p: number, i: number) => 1 - easeOutBack(seg(p, 0.04 + 0.012 * i, 0.065 + 0.012 * i));
/** When array i latches open (staggered so all four share the screen with the deploy caption). */
export const latchAt = (i: number) => 0.505 + 0.008 * i;
/** Array i's hinge angle in radians (0 stowed → π/2 deployed). */
export const hingeAngle = (p: number, i: number) => (Math.PI / 2) * easeOutBack(seg(p, latchAt(i) - 0.03, latchAt(i)));
export const latched = (p: number, i: number) => p >= latchAt(i);

/** Pad units → world units: 1 on the pad, 0.18 in orbit space, 1.1 for the deployed close-ups and wides. */
export const vehicleScale = (p: number) => (p < CUT_P ? 1 : p < 0.56 ? 0.18 : lerp(0.18, 1.1, eio(seg(p, 0.56, 0.64))));

/** The climb off the pad in pad units (p < CUT_P): height of the vehicle and its downrange drift. */
export const padRise = (p: number) => {
  const s = seg(p, 0.125, 0.27);
  return { y: 70 * s ** 2.2, x: 9 * s ** 3 };
};

/** The craft point is the satellite centre; in orbit space it rides this far above the engine plane. */
const TURN_H0 = MODULE_Y0 * 0.18;
/**
 * Orbit-space ascent from the surface: the gravity turn that joins the parking orbit tangentially at p .40.
 * It starts with the engine plane on the surface (not the craft point, which would bury the vehicle at the
 * cut); f is the fraction of the climb, so the altitude reads 412·f (≈46 km at CUT_P, 100 km at p ≈ .282).
 */
export const turn = (p: number) => {
  const u = seg(p, 0.26, 0.4);
  const f = 1 - (1 - u) ** 1.6;
  return { theta: 22 * u ** 2, r: R + TURN_H0 + (R0 - R - TURN_H0) * f, f };
};
/** dθ/dp at insertion, so the orbit's θ curve continues the turn without a kink. */
const INSERTION_RATE = (22 * 2) / 0.14;

// θ after insertion (unwrapped degrees, clockwise seen from +Z, 0 at the top). The correction and the
// final hold run on the arc that faces the camera; .745–.77 is a loss of signal behind the Earth.
export const THETA_KEYS: readonly (readonly [number, number])[] = [
  [0.4, 22],
  [0.54, 36],
  [0.6, 170],
  [0.64, 322],
  [0.687, 345],
  [0.745, 455],
  [0.77, 680],
  [0.785, 695],
  [0.83, 750],
  [0.85, 770],
  [0.885, 860],
  [0.945, 1045],
  [1.0, 1130],
];

/** Monotone cubic interpolation (PCHIP, Fritsch–Carlson) with given end slopes; clamps outside. */
export function pchip(keys: readonly (readonly [number, number])[], s0: number, sN: number, x: number) {
  const n = keys.length;
  if (x <= keys[0][0]) return keys[0][1];
  if (x >= keys[n - 1][0]) return keys[n - 1][1];
  const h = (i: number) => keys[i + 1][0] - keys[i][0];
  const d = (i: number) => (keys[i + 1][1] - keys[i][1]) / h(i);
  const m = (i: number) => {
    if (i === 0) return s0;
    if (i === n - 1) return sN;
    const [a, b] = [d(i - 1), d(i)];
    if (a * b <= 0) return 0;
    const w1 = 2 * h(i) + h(i - 1);
    const w2 = h(i) + 2 * h(i - 1);
    return (w1 + w2) / (w1 / a + w2 / b);
  };
  let i = 0;
  while (x > keys[i + 1][0]) i++;
  const hi = h(i);
  const t = (x - keys[i][0]) / hi;
  const [t2, t3] = [t * t, t * t * t];
  return (
    (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * hi * m(i) + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * hi * m(i + 1)
  );
}

export const theta = (p: number) => pchip(THETA_KEYS, INSERTION_RATE, 0, p);

/** Orbit radius: parking orbit, the drift below plan, then the compounding spiral. */
export function radius(p: number, th: number) {
  if (p >= 0.85) return R0 * Math.exp((Math.log(R1 / R0) * (th - 770)) / 360);
  if (p >= 0.785) return R0 - 0.5 * smooth(seg(p, 0.785, 0.83)) * (1 - smooth(seg(p, 0.83, 0.85)));
  return R0;
}

/** Distance of the craft (module centre, no bob) from the planet centre (pad units above the pad before the cut). */
export function craftR(p: number) {
  if (p < CUT_P) return R + MODULE_Y0 + padRise(p).y;
  if (p < 0.4) return turn(p).r;
  return radius(p, theta(p));
}

/** Craft angle in degrees (0 on the pad). */
export const craftTheta = (p: number) => (p < CUT_P ? 0 : p < 0.4 ? turn(p).theta : theta(p));

/** Where the follow camera aims below the craft point (pad units along the vehicle axis): the vehicle's visual centre. */
export const aim = (p: number) =>
  p < 0.345 ? 1.9 : p < 0.4 ? lerp(1.9, 0.9, eio(seg(p, 0.345, 0.352))) : lerp(0.9, 0, eio(seg(p, 0.4, 0.43)));

// ── Geography ────────────────────────────────────────────────────────────
// Plain math (no three) so the DOM loop can use the station angles. Object space is three's
// SphereGeometry: u 0.5 is lon 0 at +X, north is +Y, east is −Z. The Earth is turned so the
// Cape (28.5°N, 80.6°W) is at world +Y, local north at world −Z and local east at world +X.
export type V3 = readonly [number, number, number];
const DEG = Math.PI / 180;
export const geo = (lat: number, lon: number): V3 => [
  Math.cos(lat * DEG) * Math.cos(lon * DEG),
  Math.sin(lat * DEG),
  -Math.cos(lat * DEG) * Math.sin(lon * DEG),
];
export const CAPE = { lat: 28.5, lon: -80.6 } as const;
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const CAPE_U = geo(CAPE.lat, CAPE.lon);
const CAPE_N: V3 = [
  -Math.sin(CAPE.lat * DEG) * Math.cos(CAPE.lon * DEG),
  Math.cos(CAPE.lat * DEG),
  Math.sin(CAPE.lat * DEG) * Math.sin(CAPE.lon * DEG),
];
const CAPE_E: V3 = [
  CAPE_N[1] * CAPE_U[2] - CAPE_N[2] * CAPE_U[1],
  CAPE_N[2] * CAPE_U[0] - CAPE_N[0] * CAPE_U[2],
  CAPE_N[0] * CAPE_U[1] - CAPE_N[1] * CAPE_U[0],
];
/** The Earth's rotation as matrix rows (world x, y, z) = (E_o, U_o, −N_o); world.ts builds EARTH_ROT from them. */
export const EARTH_ROWS: readonly V3[] = [CAPE_E, CAPE_U, [-CAPE_N[0], -CAPE_N[1], -CAPE_N[2]]];
export const earthRotate = (v: V3): V3 => [dot3(EARTH_ROWS[0], v), dot3(EARTH_ROWS[1], v), dot3(EARTH_ROWS[2], v)];

// ── Sun ──────────────────────────────────────────────────────────────────
// One fixed hard sun per set (world directions, normalised in world.ts, slerped over .25–.29).
/** Morning sun on the pad: from camera-left, 30° up. */
export const SUN_PAD: V3 = [-0.58, 0.5, 0.64];
/** In orbit: 56° up at the Cape, from screen-left at the final hold (≈65° phase). */
export const SUN_ORBIT: V3 = [-0.46, 0.83, -0.3];

// ── Stations and contacts ────────────────────────────────────────────────
// Real places, so every pin is on land by construction; θ (clockwise from +Y toward +X) follows from them.
const STATION_SITES = [
  { mark: "hackernews", name: "Hacker News", place: "Hermosillo", lat: 29.1, lon: -111.0, channel: 0 },
  { mark: "google", name: "Google", place: "Houston", lat: 29.8, lon: -95.4, channel: 1 },
  { mark: "chatgpt", name: "ChatGPT", place: "Thiès", lat: 14.8, lon: -16.9, channel: 1 },
  { mark: "reddit", name: "Reddit", place: "Yamoussoukro", lat: 6.8, lon: -5.3, channel: 2 },
  { mark: "youtube", name: "YouTube", place: "Lambaréné", lat: -0.7, lon: 10.2, channel: 3 },
] as const;
export const STATIONS = STATION_SITES.map((s) => {
  const normal = earthRotate(geo(s.lat, s.lon));
  return { ...s, normal, theta: Math.atan2(normal[0], normal[1]) / DEG };
});

export const CONTACT_HALF = 16;
/** Line-of-sight window over station k: pass index and c ∈ [0,1] across ±16°, or null. First pass is at θ_k + 360. */
export function contact(k: number, th: number) {
  const rel = th - (STATIONS[k].theta + 360);
  const pass = Math.floor((rel + CONTACT_HALF) / 360);
  if (pass < 0) return null;
  const c = (rel - pass * 360 + CONTACT_HALF) / (2 * CONTACT_HALF);
  return c <= 1 ? { pass, c } : null;
}
export const firstLit = (k: number, th: number) => th >= STATIONS[k].theta + 360 - CONTACT_HALF + 0.35 * 2 * CONTACT_HALF;
export const litCount = (th: number) => STATIONS.reduce((n, _, k) => n + (firstLit(k, th) ? 1 : 0), 0);
/** Lead pearls per pass: each pass brings more back. */
export const PEARLS = [3, 4, 6];

// ── Pipeline and telemetry ───────────────────────────────────────────────
export const OUTCOME = 312;
export const pipeline = (p: number) => {
  const q = seg(p, 0.7, 0.97);
  return (OUTCOME * (Math.exp(3.1 * q) - 1)) / (Math.exp(3.1) - 1);
};

const DAY_KEYS: [number, number][] = [
  [0.42, 1],
  [0.69, 14],
  [0.85, 90],
  [0.97, 180],
];
function lerpKeys(keys: [number, number][], x: number) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [[x0, y0], [x1, y1]] = [keys[i], keys[i + 1]];
    if (x <= x1) return lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return keys[keys.length - 1][1];
}

const hms = (s: number) =>
  [s / 3600, (s / 60) % 60, s % 60].map((v) => String(Math.floor(v)).padStart(2, "0")).join(":");

/** Mission elapsed time: a log-compressed countdown, seconds in ascent, days in orbit. */
export function met(p: number) {
  if (p < 0.1) return `T–${hms(Math.round(172800 ** (1 - p / 0.1) * 10 ** (p / 0.1)))}`;
  if (p < 0.125) return `T–${hms(Math.ceil(10 * (1 - seg(p, 0.1, 0.125))))}`;
  if (p < 0.42) return `T+${hms(522 * seg(p, 0.125, 0.4))}`;
  return `T+DAY ${String(Math.round(lerpKeys(DAY_KEYS, p))).padStart(3, "0")}`;
}

const ALT_PAD: [number, number][] = [
  [0.125, 0],
  [0.17, 2],
  [0.21, 6],
  [0.245, 14],
  [0.26, 24],
  [0.27, 45],
];
export const altKm = (p: number, r: number) =>
  p < 0.125
    ? 0
    : p < CUT_P
      ? Math.round(lerpKeys(ALT_PAD, p))
      : p < 0.4
        ? Math.round(412 * turn(p).f)
        : Math.round((412 * (r - R)) / (R0 - R));
export const velKms = (p: number, r: number) => (p < 0.125 ? 0 : p < 0.4 ? 7.66 * seg(p, 0.125, 0.4) ** 1.6 : 7.66 * Math.sqrt(R0 / r));

/** Mission status line and whether it is a Devable action (emerald). */
export function status(p: number): { text: string; act: boolean } {
  const s = (text: string, act = false) => ({ text, act });
  if (p < 0.1) return s("INTEGRATION");
  if (p < 0.1175) return s("TERMINAL COUNT");
  if (p < 0.125) return s("IGNITION");
  if (p < 0.18) return s("LIFTOFF");
  if (p < 0.355) return s("ASCENT");
  if (p < 0.37) return s("STAGE SEP");
  if (p < 0.4) return s("ORBIT INSERTION");
  if (p < 0.465) return s("ORBIT");
  if (p < 0.475) return s("DEVABLE ONLINE", true);
  if (p < 0.545) return s(`DEPLOY ${[0, 1, 2, 3].filter((i) => latched(p, i)).length}/4`);
  if (p < 0.64) return s("SYSTEMS NOMINAL");
  if (p < 0.687) return s("ACQUIRING SIGNAL");
  if (p < 0.745) return s(`IN CONTACT ${litCount(theta(p))}/5`);
  if (p < 0.785) return s("TELEMETRY REVIEW");
  if (p < 0.825) {
    const r = radius(p, theta(p));
    return s(`OFF PLAN · RESIDUAL −${((100 * (R0 - r)) / R0).toFixed(1)}%`);
  }
  if (p < 0.84) return s("BURN · Δv +0.42 M/S", true);
  if (p < 0.85) return s("ON PLAN");
  if (p < 0.97) return s("COMPOUNDING");
  return s("SUSTAINED ORBIT");
}

/** GO poll on the pad: array i reports GO once it has retracted and latched. */
export const arrayGo = (p: number, i: number) => p >= 0.065 + 0.012 * i;
export const payloadGo = (p: number) => p >= 0.1;

// ── Camera keys ──────────────────────────────────────────────────────────
// [p, fixed target | null (follow the craft), follow, distance, azimuth°, elevation°, fov, shift, up]
// Follow keys (follow > 0) place the camera in the craft's local frame and measure distance in pad
// units (× vehicleScale), so the cut at CUT_P keeps the same relative pose. `up` blends the camera's
// up from the craft's radial (0) to the orbit frame's −Z (1), so orbital wide shots show north up.
export type CameraKey = readonly [
  p: number,
  target: readonly [number, number, number] | null,
  follow: number,
  dist: number,
  az: number,
  el: number,
  fov: number,
  shift: number,
  up: number,
];
export const CAMERA_KEYS: readonly CameraKey[] = [
  [0.0, [0, 2.3, 0], 0, 28, 28, -4, 13, 0.19, 0], // H1: low long lens
  [0.08, [0, 2.3, 0], 0, 26.5, 26, -4, 13, 0.19, 0],
  [0.12, [0, 2.1, 0], 0, 24, 24, -3, 13, 0.18, 0], // terminal count
  [0.13, [0, 2.1, 0], 0, 24, 24, -3, 13, 0.18, 0], // the ground tracker starts here
  [0.25, null, 1, 30, 24, 0, 20, 0.17, 0], // chase, level
  [0.275, null, 1, 30, 24, 0, 20, 0.17, 0], // the cut at .27 lies inside
  [0.3, null, 1, 44, 34, 14, 26, 0.18, 0], // reveal: the limb rises below
  [0.33, [3.2, 0.6, 0], 0, 40, 20, 18, 26, 0.2, 0.3], // flight-dynamics wide
  [0.345, [3.2, 0.6, 0], 0, 40, 20, 18, 26, 0.2, 0.3],
  [0.352, null, 1, 14, 150, 22, 28, 0.12, 0], // chase from ahead: MECO / SEP
  [0.39, null, 1, 14, 170, 22, 28, 0.12, 0], // fairing sep
  [0.41, null, 1, 11, -120, 24, 28, 0.14, 0], // payload sep
  [0.46, null, 1, 2.4, -70, 28, 28, 0.16, 0], // stowed close-up
  [0.53, null, 1, 3.1, -45, 28, 28, 0.16, 0], // deployed
  [0.56, null, 1, 3.1, -45, 28, 28, 0.16, 0],
  [0.6, null, 0.9, 14, 20, 34, 27, 0.18, 0.6], // pull-back
  [0.64, [0, -14, 0], 0, 88, 112, 40, 26, 0.22, 1], // downlink wide (grazing 16.7°)
  [0.745, [0, -14, 0], 0, 88, 112, 40, 26, 0.22, 1],
  [0.79, [1, -3, 0], 0, 58, 108, 36, 26, 0.2, 1], // correction
  [0.84, [1, -3, 0], 0, 58, 108, 36, 26, 0.2, 1],
  [0.885, [1, -13.5, 0], 0, 104, 112, 38, 26, 0.22, 1], // raising
  [0.945, [1, -13.5, 0], 0, 100, 110, 38, 26, 0.23, 1], // final hold
  [1.0, [1, -13.5, 0], 0, 100, 110, 38, 26, 0.23, 1],
];
/** Phone still: a square canvas, the Earth low, the craft above it. */
export const STILL_SQUARE: CameraKey = [1, [0, -11, 0], 0, 92, 110, 36, 30, 0, 1];

// ── Projected labels ─────────────────────────────────────────────────────
export type LabelId =
  | "payload"
  | "devable"
  | "channels"
  | "karman"
  | "spike"
  | "meco"
  | "fairing"
  | "orbit"
  | "a0"
  | "a1"
  | "a2"
  | "a3"
  | "pad"
  | "residual"
  | "dv"
  | "parking"
  | "now";
/** [in0, in1, out0, out1] */
export const LABEL_WINDOWS: Record<LabelId, readonly [number, number, number, number]> = {
  payload: [-1, -0.5, 0.1, 0.115],
  devable: [-1, -0.5, 0.1, 0.115],
  channels: [-1, -0.5, 0.1, 0.115],
  karman: [0.275, 0.29, 0.42, 0.44], // becomes a HUD toast (WS4)
  spike: [0.305, 0.315, 0.34, 0.35],
  meco: [0.355, 0.36, 0.395, 0.41],
  fairing: [0.385, 0.39, 0.405, 0.415],
  orbit: [0.4, 0.41, 0.44, 0.46],
  a0: [latchAt(0), latchAt(0) + 0.01, 0.555, 0.57],
  a1: [latchAt(1), latchAt(1) + 0.01, 0.555, 0.57],
  a2: [latchAt(2), latchAt(2) + 0.01, 0.555, 0.57],
  a3: [latchAt(3), latchAt(3) + 0.01, 0.555, 0.57],
  pad: [0.3, 0.31, 0.335, 0.345],
  residual: [0.79, 0.8, 0.825, 0.83],
  dv: [0.83, 0.833, 0.848, 0.855],
  parking: [0.885, 0.9, 2, 2],
  now: [0.885, 0.9, 2, 2],
};
export const LABEL_IDS = Object.keys(LABEL_WINDOWS) as LabelId[];
export const labelOpacity = (id: LabelId, p: number) => {
  const [a, b, c, d] = LABEL_WINDOWS[id];
  return windowed(p, a, b, c, d);
};

// ── Dev self-check ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  let last = -Infinity;
  let monotone = true;
  for (let p = 0.4; p <= 1.0000001; p += 0.001) {
    const th = theta(p);
    if (th < last - 1e-9) monotone = false;
    last = th;
  }
  console.assert(monotone, "mission: θ must be non-decreasing");
  console.assert(met(0) === "T–48:00:00", "mission: met(0)", met(0));
  console.assert(met(0.125) === "T+00:00:00", "mission: met(0.125)", met(0.125));
  console.assert(met(0.69) === "T+DAY 014", "mission: met(0.69)", met(0.69));
  console.assert(Math.round(pipeline(1)) === OUTCOME, "mission: pipeline(1)");
  console.assert(altKm(1, radius(1, theta(1))) === 721, "mission: altKm at R1", altKm(1, radius(1, theta(1))));
  const firstAt = STATIONS.map((_, k) => {
    for (let p = 0.4; p <= 1; p += 0.0005) if (firstLit(k, theta(p))) return p;
    return 2;
  });
  console.assert(firstAt.every((v, k) => k === 0 || v > firstAt[k - 1]), "mission: contact order", firstAt);
  console.assert(
    PACE.every((k, i) => i === 0 || (k[0] > PACE[i - 1][0] && k[1] > PACE[i - 1][1])),
    "mission: scroll pacing must be monotone",
  );
  let roundTrip = 0;
  for (let s = 0; s <= 1.0000001; s += 0.001) roundTrip = Math.max(roundTrip, Math.abs(scrollS(storyP(s)) - s));
  console.assert(roundTrip < 1e-6, "mission: storyP/scrollS round trip", roundTrip);
  console.assert(
    BEATS.every((b) => Math.abs(storyP(scrollS(b.land)) - b.land) < 1e-9),
    "mission: beat jumps must land on their p",
  );
  const cape = earthRotate(CAPE_U);
  console.assert(Math.abs(cape[0]) + Math.abs(cape[1] - 1) + Math.abs(cape[2]) < 1e-9, "mission: the Cape must map to +Y", cape);
}
