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

// ── World numbers the DOM also needs ─────────────────────────────────────
export const R = 14; // planet radius (the sphere's top is the origin)
export const R0 = 19.6; // parking orbit (altitude 5.6 ≙ 412 km)
export const R1 = 24.7; // where the spiral ends
export const KARMAN = 15.4; // ≙ 100 km
export const MODULE_Y0 = 2.1; // module centre on the pad

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
// knots [s, p]: each beat gets 850–1780px of travel at a 900px viewport, the count and the
// ignition dwell, and the caption-less camera moves (the close-up swoop, the pull-back) run fast.
const PACE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.075, 0.1],
  [0.105, 0.12],
  [0.125, 0.13],
  [0.215, 0.26],
  [0.345, 0.4],
  [0.37, 0.43],
  [0.5, 0.54],
  [0.54, 0.625],
  [0.72, 0.745],
  [0.845, 0.85],
  [0.965, 0.97],
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

export const vehicleScale = (p: number) => (p < 0.56 ? 1 - 0.4 * eio(seg(p, 0.24, 0.36)) : 0.6 + 1.8 * eio(seg(p, 0.56, 0.64)));

/** Height added to MODULE_Y0 during the vertical rise: a short climb, so the path reads as a gravity turn, not an "L". */
export const riseY = (p: number) => 1.2 * seg(p, 0.125, 0.26) ** 3;

/**
 * The polar gravity turn from r 17.3 (where the rise ends): it pitches over gradually
 * (≈7° / 15° / 31° / 53° at p 0.265 / 0.27 / 0.28 / 0.30) and joins the orbit tangentially.
 * The exponents keep the speed continuous at p 0.26 (rise 1.2·3/0.135 = turn 2.3·1.6/0.14 ≈ 26.5/unit p).
 */
export const turn = (p: number) => {
  const u = seg(p, 0.26, 0.4);
  return { theta: 22 * u ** 2, r: 17.3 + 2.3 * (1 - (1 - u) ** 1.6) };
};
/** dθ/dp at insertion, so the orbit's θ curve continues the turn without a kink. */
const INSERTION_RATE = (22 * 2) / 0.14;

// θ after insertion (unwrapped degrees, clockwise seen from +Z, 0 at the top).
export const THETA_KEYS: readonly (readonly [number, number])[] = [
  [0.4, 22],
  [0.54, 36],
  [0.64, 70],
  [0.685, 300],
  [0.745, 400],
  [0.79, 640],
  [0.83, 690],
  [0.85, 705],
  [0.97, 1106],
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
  if (p >= 0.85) return R0 * Math.exp((Math.log(R1 / R0) * (th - 705)) / 401);
  if (p >= 0.785) return R0 - 1.2 * smooth(seg(p, 0.785, 0.83)) * (1 - smooth(seg(p, 0.83, 0.85)));
  return R0;
}

/** Distance of the craft (module centre, no bob) from the planet centre. */
export function craftR(p: number) {
  if (p < 0.26) return R + MODULE_Y0 + (p < 0.125 ? 0 : riseY(p));
  if (p < 0.4) return turn(p).r;
  return radius(p, theta(p));
}

/** Craft angle in degrees (0 on the pad). */
export const craftTheta = (p: number) => (p < 0.26 ? 0 : p < 0.4 ? turn(p).theta : theta(p));

// ── Stations and contacts ────────────────────────────────────────────────
export const STATIONS = [
  { mark: "hackernews", name: "Hacker News", channel: 0, theta: -50 },
  { mark: "google", name: "Google", channel: 1, theta: -33 },
  { mark: "chatgpt", name: "ChatGPT", channel: 1, theta: -17 },
  { mark: "reddit", name: "Reddit", channel: 2, theta: 17 },
  { mark: "youtube", name: "YouTube", channel: 3, theta: 34 },
] as const;
export const STATION_LAT = 25; // φ toward the camera, degrees

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

export const altKm = (p: number, r: number) =>
  p < 0.125 ? 0 : p < 0.4 ? Math.round(412 * clamp01((r - 16.1) / 3.5)) : Math.round((412 * (r - 14)) / 5.6);
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
// [p, fixed target | null (follow the craft), follow, distance, azimuth°, elevation°, fov, shift]
export type CameraKey = readonly [number, readonly [number, number, number] | null, number, number, number, number, number, number];
export const CAMERA_KEYS: readonly CameraKey[] = [
  [0.0, [0, 1.6, 0], 0, 14, 30, 7, 22, 0.19],
  [0.08, [0, 1.6, 0], 0, 13.4, 28, 7, 22, 0.19],
  [0.12, [0, 1.25, 0], 0, 11, 24, 4, 22, 0.18],
  [0.17, [0, 1.8, 0], 0.8, 12, 20, -3, 24, 0.17],
  [0.235, [0, 1.8, 0], 0.8, 12, 20, -3, 24, 0.17],
  [0.3, [2.6, 3.4, 0], 0, 26, 16, 10, 26, 0.2],
  [0.38, [5.4, 2.6, 0], 0, 42, 14, 17, 26, 0.2],
  [0.405, [5.4, 2.6, 0], 0, 42, 14, 17, 26, 0.2],
  [0.46, null, 1, 5.4, -70, 28, 28, 0.16],
  [0.53, null, 1, 4.8, -40, 40, 28, 0.16],
  [0.59, [0, -13, 0], 0.92, 22, -12, 46, 27, 0.17],
  [0.64, [0, -13, 0], 0, 130, 14, 52, 26, 0.22],
  [0.745, [0, -13, 0], 0, 130, 14, 52, 26, 0.22],
  [0.8, [-9, -1, 0], 0, 72, 8, 40, 26, 0.2],
  [0.84, [-9, -1, 0], 0, 72, 8, 40, 26, 0.2],
  [0.885, [3, -13, 0], 0, 140, 16, 50, 26, 0.2],
  // Final hold: pulled back far enough that the whole spiral clears the right edge and the telemetry strip.
  [0.945, [1.5, -13, 0], 0, 122, 14, 52, 26, 0.26],
  [1.0, [1.5, -13, 0], 0, 122, 14, 52, 26, 0.26],
];
/** Phone still: a square canvas, planet centred low, craft top-right. */
export const STILL_SQUARE: CameraKey = [1, [0, -9, 0], 0, 78, 14, 50, 28, 0];

// ── Projected labels ─────────────────────────────────────────────────────
export type LabelId = "payload" | "devable" | "channels" | "karman" | "spike" | "meco" | "orbit" | "a0" | "a1" | "a2" | "a3";
/** [in0, in1, out0, out1] */
export const LABEL_WINDOWS: Record<LabelId, readonly [number, number, number, number]> = {
  payload: [-1, -0.5, 0.1, 0.115],
  devable: [-1, -0.5, 0.1, 0.115],
  channels: [-1, -0.5, 0.1, 0.115],
  karman: [0.275, 0.29, 0.42, 0.44],
  spike: [0.33, 0.36, 0.54, 0.58],
  meco: [0.355, 0.365, 0.44, 0.46],
  orbit: [0.38, 0.4, 0.44, 0.46],
  a0: [latchAt(0), latchAt(0) + 0.01, 0.555, 0.57],
  a1: [latchAt(1), latchAt(1) + 0.01, 0.555, 0.57],
  a2: [latchAt(2), latchAt(2) + 0.01, 0.555, 0.57],
  a3: [latchAt(3), latchAt(3) + 0.01, 0.555, 0.57],
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
}
