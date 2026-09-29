import { at, clamp01, easeInOutSine, legU, lerp, SEGMENTS, smooth, sub, WIN, type LegName, type SegName } from "./journey";

// Where everything in the lighthouse world stands, and where the camera looks from at every p. The product
// light is fixed at the origin and the growth engine is built around it: the housing and survey kit on the
// tip, the chart table inland, the tower that telescopes up, the channel targets NE, the harbour in the lee.
// Axes: x east, y up, z south (north = -z). Bearing: compass degrees clockwise from north, 0 = N, 90 = E.
// Three-free (plain [x, y, z] tuples), so the DOM side and node checks can read it too. Values are verbatim
// from the concept's world model.

export type Vec3 = [number, number, number];
/** A camera pose. bearing = where the camera sits, seen from the target; ax / ay = where the target lands on screen. */
export interface Shot {
  target: Vec3;
  bearing: number;
  pitch: number;
  dist: number;
  fov: number;
  ax: number;
  ay: number;
}
export type ShotName = Exclude<SegName, LegName>;

export const DEG = Math.PI / 180;
export const polar = (b: number, r: number, y = 0): Vec3 => [Math.sin(b * DEG) * r, y, -Math.cos(b * DEG) * r];
export const dir = (b: number): Vec3 => [Math.sin(b * DEG), 0, -Math.cos(b * DEG)];
export const bearingOf = (x: number, z: number) => ((Math.atan2(x, -z) / DEG) + 360) % 360;

// ── Site ──
export const GROUND = 1.02; // plateau top at the tip
export const LAMP_ABOVE_DECK = 0.67;
export const PLINTH = { h: 0.62, rB: 0.76, rT: 0.72 }; // the future watch room
export const CORBEL = { h: 0.3, r0: 0.8, r1: 1.0 };
export const DECKD = { h: 0.09, r0: 0.84, r1: 1.14 };
export const DECK0 = GROUND + PLINTH.h + CORBEL.h + DECKD.h; // 2.03 while the tower is collapsed
export const LAMP0 = DECK0 + LAMP_ABOVE_DECK; // 2.70
export const DRUM = { h: 1.0, radii: [[1.0, 0.94], [0.94, 0.88], [0.88, 0.82], [0.82, 0.76]] }; // A (bottom) … D (top)
export const COLLAR = { r0: 1.02, r1: 1.12, y: 1.032 }; // flat stone ring at the tower foot, present from the intro
export const AO_DECAL = { r0: 0.7, r1: 1.7, y: 1.036, alpha: 0.12 }; // static contact-AO ring (replaces ContactShadows)
export const LAMP1 = LAMP0 + 4 * DRUM.h; // 6.70 once risen

// L3 sub-windows (leg u). Drums emerge D, C, B, A. One table: camera, lamp and drums all read from it.
export const RISE = {
  breath: [0.0, 0.1], // a sheen runs once round the corbel's rim while the camera eases back
  pullBack: [0.0, 0.22], // the camera's pull-back happens before any drum moves
  drums: [[0.54, 0.72], [0.42, 0.6], [0.31, 0.46], [0.22, 0.38]], // per drum A..D; overlapping, so the lamp never stops rising
  seats: [0.72, 0.6, 0.46, 0.38], // each drum's rim glints as it locks (a cue, not a bounce)
  unfold: [0.68, 0.82], // corbel flare, deck, railing
  lantern: [0.76, 0.9], // skirt, glazing bars, sector panes, dome
  oldBeamOut: [0.74, 0.84], // 03's static beam fades to 0 (dark)
  newBeamIn: [0.9, 0.98], // 04's escapement fades in under its latched clock
  targets: [0.72, 1.0], // 04 targets surface
  frustum: 0.5, // shadow frustum switches ±9 → ±20 while the camera is inside the bank (fully veiled)
} as const;
export interface TowerState {
  u: number;
  e: [number, number, number, number];
  lift: number;
  drumBottoms: [number, number, number, number];
  deck: number;
  lamp: number;
  unfold: number;
  lantern: number;
}
export function towerState(p: number): TowerState {
  const u = legU("L3", p);
  const e = RISE.drums.map(([a, b]) => easeInOutSine(sub(u, a, b))) as TowerState["e"]; // no overshoot: the lamp's screen path must stay monotone
  const lift = e.reduce((s, x) => s + x, 0) * DRUM.h;
  const drumBottoms = e.map((_, k) => GROUND - DRUM.h + e[k] * DRUM.h + e.slice(0, k).reduce((s, x) => s + x, 0) * DRUM.h) as TowerState["drumBottoms"];
  const deck = DECK0 + lift;
  const unfold = smooth(sub(u, ...RISE.unfold));
  const lantern = smooth(sub(u, ...RISE.lantern));
  return { u, e, lift, drumBottoms, deck, lamp: deck + LAMP_ABOVE_DECK, unfold, lantern };
}
/** Lamp height as a pure function of progress (used by the camera during L3 and by every tower rider). */
export const lampY = (p: number) => towerState(p).lamp;

// Land: union of discs [x, z, r]; the headland runs SSW from the tip and dissolves into white.
export const LOBES = [
  [0, 0, 3.0],
  [...polar(208, 4.2).filter((_, i) => i !== 1), 3.1],
  [...polar(206, 8.6).filter((_, i) => i !== 1), 3.8],
  [...polar(204, 13.6).filter((_, i) => i !== 1), 4.8],
  [...polar(203, 19.5).filter((_, i) => i !== 1), 6.0],
  [...polar(202, 26.5).filter((_, i) => i !== 1), 7.5],
];
export const BOULDERS = [[2.4, 1.3, 0.7], [1.2, 2.5, 0.55], [-2.6, 1.0, 0.75], [2.8, -0.9, 0.5], [-1.6, -2.3, 0.8], [0.7, -2.8, 0.6], [3.3, 2.2, 0.35]]; // x, z, r
/** Crop anchors: faceted frost sea stacks east of the tip (static scenery; cropped by the right edge at 04 and 05). */
export const EAST_STACKS: { pos: Vec3; r: number; h: number }[] = [
  { pos: [11.4, 0, 3.8], r: 1.3, h: 1.6 },
  { pos: [12.2, 0, 0.6], r: 1.0, h: 1.2 },
  { pos: [12.0, 0, 7.4], r: 1.2, h: 1.8 },
];

// ── 01 survey ──
/** The product's housing: three porcelain layers under the core, on a slim lacquer spindle (the lamp's stem).
 * Layer k (0 = top) spans deck + [top − (k+1)·h − k·seam, top − k·seam]. At the intro only the spindle holds the core. */
export const HOUSING = { layers: 3, r: 0.42, h: 0.13, seam: 0.01, top: 0.55, spindle: 0.03, glyphs: [">_", "</>", "▤"], label: [0.3, 0.1], down: 0.05, out: 0.1, outBearing: 136 };
export const CORE_R = 0.12;
export const TELESCOPE = { pos: polar(135, 2.1, GROUND), rest: 120, restUp: 2, tube: 1.2, legs: 0.95 };
export const BOARD = { pos: polar(256, 1.3, GROUND), faces: 226, w: 0.95, h: 0.72, tilt: 64, stand: 0.72, dot: 0.07, drop: 0.15 }; // plane table, left-front of the plinth
/** Board-local positions (u across 0..1 from the left, v down 0..1 from the top) of the four grey dots and the ⊙ fix. */
export const BOARD_MARKS = { dots: [[0.14, 0.2], [0.26, 0.16], [0.18, 0.34], [0.3, 0.3]], fix: [0.76, 0.72], fixR: 0.13 };
/** Three vessel classes, broadside to the 01 camera (heading 136 = bow to screen-right), spotted by the telescope. */
export const VESSELS = [
  { kind: "dinghy", len: 1.3, pos: polar(50, 22.5), heading: 136 },
  { kind: "sloop", len: 1.9, pos: polar(54.5, 24.4), heading: 136 },
  { kind: "freighter", len: 2.6, pos: polar(58.7, 25.3), heading: 136 },
] as const;
export const NEIGHBOURS = [{ pos: polar(41, 40), h: 2.6 }, { pos: polar(57, 44), h: 2.4 }]; // other lights: only their upper towers clear the sea mist
export const NEIGHBOUR_LAMP = { off: "#c3ccc6", on: "#fff6e0", halo: 48 }; // halo: constant 48 px sprite #fff3da → #e6dcc8 → 0, pulsing with the blink

// ── 02 chart table: just inland of the light, on the headland. The chart is a map of THIS world, "up" = bearing 32
// (the 02 view direction), with the lighthouse mark on the camera–light line, so it sits directly below the real light. ──
export const TABLE_MARK = polar(212, 4.6, GROUND); // world xz of the chart's lighthouse mark (on the camera–light line)
export const CHART = { w: 1024, h: 650, S: 48, up: 32, cx: 400, cy: 640, plane: [1.78, 1.13] }; // S: canvas px per world unit; 575 canvas px per plane unit
export const PX_PER_PLANE = CHART.w / CHART.plane[0];
/** 02 table: the top is slanted 24° toward the camera; its centre is offset so the mark lands at canvas (cx, cy). */
export const TABLE = (() => {
  const top = 0.82, slant = 24, yaw = 32;
  const offR = (CHART.w / 2 - CHART.cx) / PX_PER_PLANE; // + = the table centre sits right of the mark (toward bearing 122)
  const offU = (CHART.cy - CHART.h / 2) / PX_PER_PLANE; // + = the centre sits up-slope (away from the camera)
  const upH = offU * Math.cos(slant * DEG), r = dir(yaw + 90), u = dir(yaw);
  const pos: Vec3 = [TABLE_MARK[0] + r[0] * offR + u[0] * upH, GROUND, TABLE_MARK[2] + r[2] * offR + u[2] * upH];
  return { pos, yaw, top, size: [1.9, 1.25], slant, offR, offU };
})();
/** World (x, z) → chart canvas px. The light is the mark. */
export const chartPx = (x: number, z: number): [number, number] => {
  const r = CHART.up * DEG;
  return [CHART.cx + (x * Math.cos(r) + z * Math.sin(r)) * CHART.S, CHART.cy + (z * Math.cos(r) - x * Math.sin(r)) * CHART.S];
};
/** Canvas arc angle (radians, canvas convention: 0 = +x, clockwise) of a world bearing on the chart. */
export const chartAngle = (bearing: number) => (bearing - CHART.up - 90) * DEG;
/** Chart canvas px → world point on the slanted table top (the transform both S1 and S2 use). */
export function chartToWorld(cx: number, cy: number, lift = 0): Vec3 {
  const T = TABLE, r = dir(T.yaw + 90), u = dir(T.yaw), s = T.slant * DEG;
  const a = (cx - CHART.cx) / PX_PER_PLANE, b = (CHART.cy - cy) / PX_PER_PLANE; // plane units right / up-slope from the mark
  const markY = GROUND + T.top + 0.05 - T.offU * Math.sin(s); // the top rises toward the far edge
  const h = b * Math.cos(s);
  return [TABLE_MARK[0] + r[0] * a + u[0] * h, markY + b * Math.sin(s) + lift, TABLE_MARK[2] + r[2] * a + u[2] * h];
}
/** 02 roadmap course: from the mark along the chart's near edge toward bearing 122 (where the 05 ships will approach);
 * five divider pivots every 2.2 u, ▤ tiles only at pivots 1, 3, 5. */
export const COURSE02 = { bearing: 122, step: 2.2, pivots: 5, tiles: [1, 3, 5] };
export const TILE02 = 0.18; // upright billboard glyph tiles on the chart (world units): ≥ 53 px at 1280

// ── 04 distribution: channel targets NE of the tip; one lit beam, level; the lens turns clockwise (bearing increasing),
// so on screen the beam swings from "into the distance" to "right", never toward the copy. Targets march left → right
// on screen in beat order: buoys, loom, anchorage, islet 1, islet 2. ──
export const BUOYS = [6.0, 8.1, 10.2, 12.3, 14.4].map((r) => polar(40, r)); // search: a buoyed channel radiating from the tip; ships keep 0.9 u to its west
export const BUOY_HALO = 48; // px, constant-size halo on a lit buoy lamp
export const LOOM = { pos: polar(46, 10.8, 5.6), w: 5.0, h: 2.2, peak: 0.7, star: 56, starOff: [0.9, -0.2] }; // AI: the beam's glow on the fog wall; ✦ 56 px, beside the loom's core
export const ANCHORAGE = { center: polar(58, 7.5), boats: [[-0.8, 0.25, 20], [0.8, -0.3, 75]] }; // community: two moored boats + r/ marker
export const ISLETS = [{ pos: polar(72, 9.6), r: 0.9, beacon: 2.4, tile: -0.08 }, { pos: polar(66, 12.8), r: 0.7, beacon: 2.0, tile: 0.08 }]; // creators: islet 2 stands behind and right of islet 1; tile = the 02 ▶ flag's lateral offset (plane u)
export const R_MARK = { r: 0.5, post: 1.4 }; // the r/ disc on its post at the anchorage (04 B3)
export const FLAGSTAFF = { bearing: 118, r: 1.02, h: 1.9 }; // social: on the gallery rail, right side as seen from 04
export const RELAY = { len: 3.4, endR: 0.45, opacity: 0.2, swing: -15, hole: 1.6 }; // creators' relay beams, outward and a little north; each ends in a mist clearing
/** Hold bearings B1..B5 (search, AI, community, creators, social). Strictly increasing: the lens never reverses. */
export const BEAM_HOLD = [40, 46, 58, 72, 90];
export const BEAM_TILT = [0, 0, 0, 0, 0]; // added to the base tilt of -4°
export const LIT_FAN = [26, 96]; // bearings inside which the main beam may shine; outside it the occulting screen hides it
/** Escapement step: each beat the lens steps for 0.5 s (sine in-out), then holds 0.7 s. */
export const STEP = 0.5;
/** Sector glazing: the 02 chart arcs → the crown → the lantern's sector panes. Bearings clockwise (degrees). The beam
 * takes the tint of the pane it shines through (cross-fade ±2° at each boundary); outside 26–96 the glazing is clear. */
export const SECTORS = [
  { channel: "azure", from: 26, to: 52, pane: "#6fd0ff", solid: "#0ea5e9", chartR: 0.45 }, // search (B1 40°) + AI (B2 46°)
  { channel: "emerald", from: 52, to: 65, pane: "#6ee8b5", solid: "#10b981", chartR: 0.38 }, // community (B3 58°)
  { channel: "sun", from: 65, to: 81, pane: "#ffe48a", solid: "#f5b301", chartR: 0.32 }, // creators (B4 72°)
  { channel: "indigo", from: 81, to: 96, pane: "#9d9aff", solid: "#4f46e5", chartR: 0.26 }, // social (B5 90°)
] as const;
/** 03: the lens drum indexes like an escapement; the playing pane always faces this bearing (the 03 camera). */
export const DRUM_FRONT = 208;

// ── 05 harbour in the lee, SSE of the tip. One straight stone quay runs east from the tip's shore, across the 05 view.
// The first ship lies alongside its south face (broadside to the camera) between an emerald lantern (quay root) and a
// coral lantern; the chart case stands on the quay head, facing the camera. Loop ships come in from the east edge along
// the approach lane just south of the quay, pass in front of the case (their pearl hops onto the trace) and fade as they
// come alongside. ──
export const QUAY = { root: [0.9, 0.55, 4.6], bearing: 100, len: 7.0, w: 0.8, h: 0.6 };
const qdir = [Math.sin(QUAY.bearing * DEG), -Math.cos(QUAY.bearing * DEG)], qn = [Math.sin((QUAY.bearing + 90) * DEG), -Math.cos((QUAY.bearing + 90) * DEG)]; // along, south-face normal
/** A point s along the quay, `off` out from its centreline toward the south face (negative = north). */
export const quayAt = (s: number, off = 0, y = 0): Vec3 => [QUAY.root[0] + qdir[0] * s + qn[0] * off, y, QUAY.root[2] + qdir[1] * s + qn[1] * off];
export const HARBOUR = {
  quay: { from: quayAt(0, 0, 0.55), to: quayAt(QUAY.len, 0, 0.55), w: QUAY.w, h: QUAY.h },
  lanterns: [{ pos: quayAt(0.3, 0.2, 0.55), color: "#179a55" }, { pos: quayAt(3.7, 0.2, 0.55), color: "#ec544b" }], // lacquer lantern cages, coloured glass, 24 px halo
  berth: [...quayAt(1.95, 0.9), 280], // [x, y, z, heading]: the first ship lies alongside here, bow west
  approach: [[8.6, 0, 8.7], [6.1, 0, 8.5]] as Vec3[], // two porcelain lane markers between the straight lane and its detour
};
/** The chart case on the quay head: a porcelain case framed in lacquer (like the lantern) on a low plinth, facing the
 * 05 camera. Face 3.6 × 2.4: left page = the 02 chart (05 B4); right page = the recorder trace (upper, B1) over the
 * content strip (lower, B2). */
export const CASE = {
  pos: quayAt(5.85, 0.05, 0.55),
  plinth: 0.35,
  face: [3.6, 2.4],
  frame: 0.07,
  depth: 0.2,
  faces: 182,
  tilt: 84,
  trace: { x: [0.1, 1.7], y: [-0.36, 1.1] },
  strip: { x: [0.1, 1.7], y: [-1.1, -0.5] },
  chart: { x: [-1.7, -0.1], y: [-1.1, 1.1] },
};
/** Face-local (fx across −1.8..1.8 left → right as the 05 viewer sees it, fy up −1.2..1.2) → world point on the face. */
export function caseToWorld(fx: number, fy: number, lift = 0): Vec3 {
  const C = CASE, f = dir(C.faces), r = dir(C.faces - 90), t = C.tilt * DEG;
  const cy = C.pos[1] + C.plinth + (C.face[1] / 2) * Math.sin(t);
  return [C.pos[0] + r[0] * fx - f[0] * fy * Math.cos(t) + f[0] * lift, cy + fy * Math.sin(t), C.pos[2] + r[2] * fx - f[2] * fy * Math.cos(t) + f[2] * lift];
}
const CH_OFF = [-0.69, -0.58]; // 0.9 u toward bearing 310: the ships' side of the buoy line
export const SHIP1_START: Vec3 = [polar(40, 16.2)[0] + CH_OFF[0], 0, polar(40, 16.2)[2] + CH_OFF[1]];
/** The first ship's course (the first buyer): outer end of the channel at 04; in along the buoys, round the tip's east
 * side and alongside the quay into its berth during L4. The last leg runs along the quay face at the berth heading. */
export const SHIP1_PATH: Vec3[] = [
  SHIP1_START,
  [polar(40, 5.0)[0] + CH_OFF[0], 0, polar(40, 5.0)[2] + CH_OFF[1]],
  polar(52, 4.2),
  polar(80, 4.6),
  [8.6, 0, 2.6],
  [9.3, 0, 6.6],
  [7.4, 0, 7.9],
  quayAt(5.4, 0.9),
  [HARBOUR.berth[0], 0, HARBOUR.berth[2]],
];
function pathPos(pts: readonly Vec3[], k: number): Vec3 {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][2] - pts[i][2]);
    segs.push(d);
    total += d;
  }
  let s = clamp01(k) * total, i = 0;
  for (; i < segs.length - 1 && s > segs[i]; i++) s -= segs[i]; // walk to the segment that holds s (the last takes the rest)
  const f = segs[i] ? Math.min(1, s / segs[i]) : 0, a = pts[i], b = pts[i + 1];
  return [lerp(a[0], b[0], f), 0, lerp(a[2], b[2], f)];
}
/** Position at fraction k of a polyline, and a heading along the chord k ± 0.03 (clamped): it turns smoothly through
 * every vertex (a hull never snaps its heading), and equals the segment's bearing away from vertices and at both ends. */
export function pathAt(pts: readonly Vec3[], k: number, chord = 0.03) {
  const a = pathPos(pts, k - chord), b = pathPos(pts, k + chord);
  return { pos: pathPos(pts, k), heading: bearingOf(b[0] - a[0], b[2] - a[2]) };
}

// ── 05 loop ships, trace and chart page ──
/** The loop ships' approach lane, from the east edge to alongside the quay. */
export const ROUTE05: Vec3[] = [[13.2, 0, 10.6], [10.2, 0, 10.2], [7.4, 0, 9.9], [5.4, 0, 9.4], [4.2, 0, 8.6]];
export const SHIP_CLASSES = [
  { kind: "freighter", len: 2.6 },
  { kind: "sloop", len: 1.9 },
  { kind: "dinghy", len: 1.3 },
  { kind: "sloop", len: 1.9 },
] as const;
export const CHANNEL_ORDER = ["azure", "emerald", "sun", "indigo"] as const; // the pennant (and pearl) colour: the channel that brought the ship
export const ROUTE05_AT_B1 = 0.61; // route progress at loopT 0 (the ship is in front of the case's right page at the pearl lift)
/** The recorder trace: one page width per 16 s; the page rescales ×2 every 2 loops. */
export const TRACE = { window: 16, steps: 2 };
/** 05 B3: the detour vertex, 2.8 u north of the lane's third point. */
export const LANE_KINK: Vec3 = [ROUTE05[2][0], 0, ROUTE05[2][2] - 2.8];
/** 05 B4 chart page (face units; angles CCW from +x, the page's "up" = bearing 32, as on the 02 chart). */
export const CHART05 = { mark: [-1.42, -0.8], leg: { len: 1.25, angle: 5, swing: 20 }, arc: { r: 0.86, from: 40, to: 60, widen: 25 } };
/** 05 B5: the new cove surfaces from the last haze (a mist hole), with its islet and two vessels. */
export const NEW_COVE = {
  pos: polar(8, 72),
  islet: [5.2, 0.9, 2.0],
  vessels: [
    { kind: "freighter", len: 2.6, off: [-1.2, 1.6], heading: 250 },
    { kind: "sloop", len: 1.9, off: [2.4, 0.6], heading: 240 },
  ],
} as const;
/** The pulse ring is an ARC over the seaward side only (bearings 355° → 130°, clockwise), so it never sweeps behind the copy. */
export const PULSE_ARC = [355, 130];
/** Harbour lights: 14 lamps set in the quay's south face, every 0.5 u (lamp 3 is the berth lamp). Each has a constant
 * warm halo (instanced sprite, 16 px, ≤ 0.8× its on-screen spacing at the close). */
export const HARBOUR_LIGHTS = Array.from({ length: 14 }, (_, k) => quayAt(0.25 + 0.5 * k, QUAY.w / 2 + 0.02, QUAY.root[1] - 0.12));
export const BERTH_LAMP = 3;
export const HARBOUR_LIGHT_HALO = 16; // px (≤ 0.8 × the 20.2 px minimum spacing at the close)

// ── Camera: {target, bearing, pitch, dist, fov, ax, ay}; bearing = where the camera sits, seen from the target. ──
export const SHOTS: Readonly<Record<ShotName, Shot>> = {
  intro: { target: [0, 2.4, 0], bearing: 232, pitch: 3.5, dist: 26, fov: 18, ax: 0.64, ay: 0.56 },
  s1: { target: [0, 2.3, 0], bearing: 226, pitch: 7.5, dist: 15, fov: 18, ax: 0.62, ay: 0.5 },
  s2: { target: [TABLE_MARK[0], 1.95, TABLE_MARK[2]], bearing: 212, pitch: 11, dist: 8.6, fov: 18, ax: 0.68, ay: 0.64 },
  s3: { target: [0, LAMP0, 0], bearing: 208, pitch: 3, dist: 8.8, fov: 18, ax: 0.62, ay: 0.56 },
  s4: { target: [0, LAMP1, 0], bearing: 200, pitch: 18, dist: 40, fov: 18, ax: 0.52, ay: 0.34 },
  s5: { target: [0, LAMP1, 0], bearing: 172, pitch: -2, dist: 42, fov: 18, ax: 0.53, ay: 0.19 },
  close: { target: [2.0, 1.2, 8.0], bearing: 170, pitch: 18, dist: 56, fov: 18, ax: 0.6, ay: 0.64 },
};
export const LEGS: Readonly<Record<LegName, { from: ShotName; to: ShotName; rise?: boolean }>> = {
  L0: { from: "intro", to: "s1" },
  L1: { from: "s1", to: "s2" },
  L2: { from: "s2", to: "s3" },
  L3: { from: "s3", to: "s4", rise: true },
  L4: { from: "s4", to: "s5" },
  L5: { from: "s5", to: "close" },
};

const KEYS = ["tx", "ty", "tz", "bearing", "pitch", "logDist", "fov", "ax", "ay"]; // a shot flattened for interpolation
const flat = (s: Shot) => [s.target[0], s.target[1], s.target[2], s.bearing, s.pitch, Math.log(s.dist), s.fov, s.ax, s.ay];
const unflat = (v: number[]): Shot => ({ target: [v[0], v[1], v[2]], bearing: v[3], pitch: v[4], dist: Math.exp(v[5]), fov: v[6], ax: v[7], ay: v[8] });
/** Monotone cubic (PCHIP) through the knots (xs, ys): no overshoot, flat at both ends. */
function pchip(xs: readonly number[], ys: readonly number[], x: number) {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  const d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m.push(0);
  for (let i = 1; i < n - 1; i++) {
    const h0 = xs[i] - xs[i - 1], h1 = xs[i + 1] - xs[i];
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m.push(d[i - 1] * d[i] <= 0 ? 0 : (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]));
  }
  m.push(0);
  let i = 0;
  while (x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1, h10 = t ** 3 - 2 * t ** 2 + t, h01 = -2 * t ** 3 + 3 * t ** 2, h11 = t ** 3 - t ** 2;
  return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
}
function keyed(knots: [number, Shot][], k: number) {
  const xs = knots.map((q) => q[0]);
  const vals = knots.map((q) => flat(q[1]));
  return unflat(KEYS.map((_, j) => pchip(xs, vals.map((v) => v[j]), k)));
}
/** The rise (L3): per-parameter knots, each monotone in u (no mid-leg reversals). The pull-back happens in the breath
 * (u 0–0.22, before any drum moves); while D and C emerge (u 0.22–0.46) the distance barely changes (16 → 20), so the
 * head keeps its size and visibly climbs the screen; the camera stays low (≤ 3.6) until u 0.34, crosses the bank at
 * u ≈ 0.5 (where the copy switches) and cranes up and back to the 04 pose. */
export const RISE_KEYS = {
  dist: [[0, 0.22, 0.46, 0.72, 1], [8.8, 16, 20, 35, 40]], // pchip in log space
  camY: [[0, 0.22, 0.34, 0.5, 0.72, 1], [3.16, 3.3, 3.6, 5.3, 12.4, 19.06]],
  pitch: [[0, 0.46, 0.72, 1], [3, 3, 10, 18]],
  bearing: [[0, 0.46, 0.72, 1], [208, 205.5, 202.5, 200]],
  ax: [[0, 0.22, 0.46, 0.72, 1], [0.62, 0.6, 0.57, 0.535, 0.52]],
  lampScreenY: [[0, 0.22, 0.46, 0.72, 1], [0.56, 0.48, 0.36, 0.345, 0.34]], // strictly decreasing over u 0.10–0.72
};
const TAN_HALF_FOV = Math.tan(9 * DEG);
export function riseShot(u: number): Shot {
  const K = RISE_KEYS, f = (k: keyof typeof RISE_KEYS) => pchip(K[k][0], K[k][1], u);
  const dist = Math.exp(pchip(K.dist[0], K.dist[1].map(Math.log), u)), pitch = f("pitch"), yl = f("lampScreenY"), camY = f("camY");
  const p = at("L3", u);
  const ph = pitch * DEG, dh = dist * Math.cos(ph);
  const epsL = Math.atan((lampY(p) - camY) / dh); // the lamp's elevation seen from the camera
  const ay = yl + Math.tan(epsL + ph) / (2 * TAN_HALF_FOV); // lens shift that puts the lamp at yl
  return { target: [0, camY - dist * Math.sin(ph), 0], bearing: f("bearing"), pitch, dist, fov: 18, ax: f("ax"), ay };
}
/** The camera at progress p: a dwell holds its shot; a leg eases between its two shots (the rise has its own keys). */
export function shotAt(p: number): Shot & { leg: LegName | null; u: number; name: SegName } {
  const [name, kind] = SEGMENTS.find(([n]) => p < WIN[n].to) ?? SEGMENTS[SEGMENTS.length - 1]; // past the end: the close
  if (kind === "dwell") return { ...SHOTS[name as ShotName], leg: null, name, u: 0 };
  const w = WIN[name], leg = LEGS[name as LegName];
  const u = clamp01((p - w.from) / (w.to - w.from));
  if (leg.rise) return { ...riseShot(u), leg: name as LegName, u, name };
  return { ...keyed([[0, SHOTS[leg.from]], [1, SHOTS[leg.to]]], smooth(u)), leg: name as LegName, u, name };
}
export function camPos(s: Shot): Vec3 {
  const b = s.bearing * DEG, ph = s.pitch * DEG;
  return [s.target[0] + Math.sin(b) * Math.cos(ph) * s.dist, s.target[1] + Math.sin(ph) * s.dist, s.target[2] - Math.cos(b) * Math.cos(ph) * s.dist];
}

// ── Atmosphere keyframes on progress (dwell values; legs blend with smoothstep, colours in linear RGB). Sun azimuth is FIXED. ──
export const SUN_AZIMUTH = 258;
export const HAZE = "#f9f9f6"; // mist and horizon colour (neutral; lifted from #f6f5ef so the first half is not greige)
export const ATMOS = {
  //           reach R (fog wall), bank density (slab y 4.8–6.0), haze near/far (+camera dist), sun elev, colour, key I, hemi I, sea clarity
  intro: { R: 1.1, bank: 0.55, hazeN: 10, hazeF: 70, elev: 6, sun: "#ffcf9c", sunI: 1.15, hemi: 0.62, sea: 0.55 }, // dawn: veiled, never white
  s1: { R: 1.8, bank: 0.6, hazeN: 12, hazeF: 75, elev: 9, sun: "#ffd5a6", sunI: 1.2, hemi: 0.64, sea: 0.62 },
  s2: { R: 5.5, bank: 0.7, hazeN: 14, hazeF: 80, elev: 14, sun: "#ffdcb4", sunI: 1.22, hemi: 0.66, sea: 0.7 },
  s3: { R: 8.5, bank: 0.7, hazeN: 16, hazeF: 85, elev: 20, sun: "#ffe9d0", sunI: 1.25, hemi: 0.68, sea: 0.78 },
  s4: { R: 10.2, bank: 0.6, hazeN: 25, hazeF: 110, elev: 30, sun: "#fff0de", sunI: 1.28, hemi: 0.7, sea: 0.88 }, // bank ≥ 0.6 keeps response04's loom
  s5: { R: 16.0, bank: 0.15, hazeN: 30, hazeF: 140, elev: 40, sun: "#fff5e8", sunI: 1.3, hemi: 0.72, sea: 0.95 },
  close: { R: 40, bank: 0.0, hazeN: 16, hazeF: 44, elev: 46, sun: "#fff7ec", sunI: 1.28, hemi: 0.72, sea: 1.0 }, // tight haze: the far sea above y ≈ 0.3 melts into the page white
};
