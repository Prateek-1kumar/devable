import {
  at,
  beatAt,
  beatP,
  clamp01,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  easeOutCubic,
  legU,
  lerp,
  LOOP,
  loopGain,
  loopX,
  ramp,
  smooth,
  sub,
  SWITCH,
  WIN,
  type LegName,
} from "./journey";
import {
  ATMOS,
  BEAM_HOLD,
  BEAM_TILT,
  bearingOf,
  BERTH_LAMP,
  CASE,
  caseToWorld,
  CHANNEL_ORDER,
  COURSE02,
  DEG,
  DRUM_FRONT,
  HARBOUR,
  HOUSING,
  LANE_KINK,
  LEGS,
  LIT_FAN,
  LOOM,
  NEIGHBOURS,
  pathAt,
  RISE,
  ROUTE05,
  ROUTE05_AT_B1,
  SECTORS,
  SHIP1_PATH,
  SHIP1_START,
  SHIP_CLASSES,
  shotAt,
  STEP,
  SUN_AZIMUTH,
  TELESCOPE,
  TRACE,
  VESSELS,
  type ShotName,
  type Vec3,
} from "./layout";

// The story's cue sheet: every value more than one part animates, as a pure function of progress p and a
// station's loop clock t (journey.loopT[i]). Loop cues already carry their station's gain, so a past station
// rests in its t = 0 pose and no part gates on the phase itself. Hand-offs between parts (the sloop that becomes
// the first ship, the beam that changes drive in the dark, the pearl that lands on the pen) line up because both
// sides read the same cue. Three-free; ported line for line from the concept's world model.

export type Channel = (typeof CHANNEL_ORDER)[number];
export type HullKind = (typeof SHIP_CLASSES)[number]["kind"];

const wrap = (a: number) => ((a % 360) + 360) % 360;
/** Colours lerp in linear RGB (the build does the same with THREE.Color.lerp on linear values). */
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
function mixHex(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => toLin(parseInt(a.slice(i, i + 2), 16) / 255));
  const pb = [1, 3, 5].map((i) => toLin(parseInt(b.slice(i, i + 2), 16) / 255));
  return "#" + pa.map((v, i) => Math.round(clamp01(toSrgb(lerp(v, pb[i], k))) * 255).toString(16).padStart(2, "0")).join("");
}

// ── 01 survey ──
/** 01 B1: housing explode, scan ring height and each layer's glyph flash (all × loopGain(0, p)). */
export function housing01(p: number, t01: number) {
  const g = loopGain(0, p), x = loopX(t01);
  const open = x < 0.35 ? easeInOutCubic(x / 0.35) : x < 0.8 ? 1 : x < 1.1 ? 1 - easeOutBack((x - 0.8) / 0.3, 1.2) : 0;
  const scan = x >= 0.35 && x < 0.8 ? lerp(0.62, 0.1, (x - 0.35) / 0.45) : null; // above the deck
  const layerMid = [0, 1, 2].map((k) => HOUSING.top - (k + 0.5) * HOUSING.h - k * HOUSING.seam - k * HOUSING.down * open);
  const flash = layerMid.map((m) => (scan === null ? 0 : Math.max(0, 1 - Math.abs(scan - m) / 0.06)) * g);
  return { explode: open * g, scan: g > 0.01 ? scan : null, flash: flash as [number, number, number] };
}
/** 01 build-in (L0 u 0.2–0.8): the tripods unfold and the housing's layers slide up the spindle, bottom layer first. */
export const housingBuild = (p: number, k: 0 | 1 | 2) => smooth(sub(legU("L0", p), 0.2 + (2 - k) * 0.15, 0.5 + (2 - k) * 0.15));
/** Telescope aim (bearing, deg) and spotted state per vessel: rest 120° (tube side-on to the 01 camera); B2 slews to
 * the dinghy / sloop / freighter at 1.20 / 1.60 / 2.00 s; B3 to neighbour A; back to rest over 7.2–7.9 s. */
export function telescope01(p: number, t01: number) {
  const g = loopGain(0, p), x = loopX(t01), T = TELESCOPE;
  const aim = (v: Vec3) => bearingOf(v[0] - T.pos[0], v[2] - T.pos[2]);
  const targets = [...VESSELS.map((v) => aim(v.pos)), aim(NEIGHBOURS[0].pos)];
  const starts = [1.2, 1.6, 2.0, 2.4];
  let a = T.rest;
  for (let i = 0; i < 4; i++) if (x >= starts[i]) a = lerp(i === 0 ? T.rest : targets[i - 1], targets[i], easeOutBack(sub(x, starts[i], starts[i] + 0.25), 0.8));
  if (x >= 7.2) a = lerp(targets[3], T.rest, easeInOutCubic(sub(x, 7.2, 7.9)));
  const spotted = VESSELS.map((_, i) => (x >= starts[i] + 0.2 && x < 6.4 ? easeOutBack(sub(x, starts[i] + 0.2, starts[i] + 0.4), 1.2) * (1 - smooth(sub(x, 6.0, 6.4))) : 0));
  return { aim: lerp(T.rest, a, g), spotted: spotted.map((s) => s * g) as [number, number, number] };
}
/** 01 B3: both neighbour lamps blink together, twice (2 per second); their halos pulse with them. */
export function neighbourBlink(p: number, t01: number) {
  const x = loopX(t01), on = (a: number) => smooth(sub(x, a, a + 0.05)) * (1 - smooth(sub(x, a + 0.2, a + 0.25)));
  return Math.max(on(2.65), on(3.15)) * loopGain(0, p);
}
/** 01 B3/B4 board marks: dots drop 0.15 u onto the face at each blink; hairlines draw 3.6–4.2; ⊙ lands 4.2–4.55. */
export function board01(p: number, t01: number) {
  const g = loopGain(0, p), x = loopX(t01);
  const fadeOut = 1 - smooth(sub(x, 7.2, 7.9));
  const dots = [2.65, 2.65, 3.15, 3.15].map((a) => (x >= a ? easeOutBack(sub(x, a, a + 0.25)) : 0) * fadeOut * g);
  const dotDim = 1 - 0.4 * smooth(sub(x, 4.2, 4.55));
  const lines = [0, 1, 2].map((i) => easeOutCubic(sub(x, 3.6 + 0.08 * i, 3.9 + 0.08 * i)) * fadeOut * g);
  const fix = easeOutBack(sub(x, 4.2, 4.55)) * fadeOut * g;
  const pulse = x >= 4.4 && x < 4.75 ? sub(x, 4.4, 4.75) * g : 0;
  return { dots: dots as [number, number, number, number], dotDim, lines: lines as [number, number, number], fix, pulse };
}
/** 01 B5: the pulse ring grows r 0.8 → 1.8 (4.8–5.4), holds, fades 7.2–7.9. It is the only ring during 01. */
export function pulse01(p: number, t01: number) {
  const g = loopGain(0, p), x = loopX(t01);
  if (x < 4.8) return { r: 0.8, alpha: 0, dash: 0 };
  return { r: lerp(0.8, 1.8, easeOutCubic(sub(x, 4.8, 5.4))), alpha: g * (1 - smooth(sub(x, 7.2, 7.9))), dash: -0.3 * (x - 4.8), tick: g * smooth(sub(x, 5.3, 5.4)) };
}
/** Mist holes 0..2 [x, z, r, amount] for the three vessels (01 B2); hole 1 follows the drifting sloop during L1–L3
 * (the first-ship thread) at a faint 0.4. */
export function holes01(p: number, t01: number) {
  const x = loopX(t01), g = loopGain(0, p);
  const h = VESSELS.map((v, i): [number, number, number, number] => [v.pos[0], v.pos[2], 2.2, (x >= 1.2 + 0.4 * i && x < 6.4 ? smooth(sub(x, 1.2 + 0.4 * i, 1.45 + 0.4 * i)) * (1 - smooth(sub(x, 6.0, 6.4))) : 0) * g]);
  const d = sloopDrift(p);
  if (d.pos) h[1] = [d.pos[0], d.pos[2], 2.2, Math.max(h[1][3], 0.4 * d.alpha)]; // pos is set exactly while the sloop is visible
  return h;
}
/** The first-ship thread: the spotted sloop is scrubbed faintly through the sea mist from its 01 position to the
 * channel's outer end during L1 → L3 u 0.72, where S4's first ship takes over (crossfade L3 u 0.72–0.80). Its mist
 * hole (0.4) ramps in over L1 u 0–0.15, so nothing pops at the end of the 01 dwell. */
export function sloopDrift(p: number): { visible: boolean; pos?: Vec3; heading?: number; alpha: number } {
  const a = WIN.L1.from, b = at("L3", 0.72);
  if (p < a || p > at("L3", 0.8)) return { visible: false, alpha: 0 };
  const k = smooth(sub(p, a, b)), v = VESSELS[1], e = SHIP1_START;
  const pos: Vec3 = [lerp(v.pos[0], e[0], k), 0, lerp(v.pos[2], e[2], k)];
  const heading = k < 0.02 ? v.heading : bearingOf(e[0] - v.pos[0], e[2] - v.pos[2]);
  return { visible: true, pos, heading: lerp(v.heading, heading, smooth(sub(k, 0, 0.1))), alpha: smooth(sub(legU("L1", p), 0, 0.15)) * (1 - smooth(sub(p, b, at("L3", 0.8)))) };
}

// ── 02 chart table ──
/** The chart table folds flat once its arcs have flown (L2 u 0.45–0.85) and unfolds again for the close (L5 u 0.2–0.6). */
export function tableFold(p: number) {
  if (p < WIN.L2.from) return 0;
  if (p < WIN.L5.from) return smooth(sub(legU("L2", p), 0.45, 0.85));
  return 1 - smooth(sub(legU("L5", p), 0.2, 0.6));
}
/** 02 loop: one include's marks at a time. B1 wedges open, then drop to 25%; each beat's marks fade (0.3 s) as the
 * next beat starts; the rest shows the chart base, the mark and the faint fan. All × loopGain(1, p). */
export function chart02(p: number, t02: number) {
  const g = loopGain(1, p), x = loopX(t02);
  const handoff = smooth(sub(legU("L2", p), 0, 0.1)) * (1 - smooth(sub(legU("L2", p), 0.1, 0.25))); // full fan, then crossfade to L's strips
  // beat k's marks (k = 2..5) are on screen from 1.2(k−1) + 0.2 to 1.2k (+ a 0.2 s fade); B5's fade ends the loop's marks at 6.2
  const beatVis = (k: number) => {
    const a = 1.2 * (k - 1) + 0.2;
    return x < a ? 0 : smooth(sub(x, a, a + 0.15)) * (1 - smooth(sub(x, a + 1.0, a + 1.2)));
  };
  const wedges = [0, 0.22, 0.44, 0.66].map((a) => easeOutCubic(sub(x, a, a + 0.2)));
  const fan = x < 7.4 ? lerp(1, 0.25, smooth(sub(x, 1.2, 1.4))) : lerp(0.25, 0, smooth(sub(x, 7.4, 7.9)));
  const pivot = Math.min(5, Math.max(0, Math.floor((x - 1.4) / 0.16))); // dividers: 5 pivots of 0.16 s from 1.4
  const stamped = COURSE02.tiles.map((k) => (x >= 1.4 + 0.16 * k - 0.1 ? easeOutBack(sub(x, 1.4 + 0.16 * k - 0.1, 1.4 + 0.16 * k)) : 0));
  const glide = easeInOutCubic(sub(x, 2.6, 3.3)); // the reading disc along the charted buoy channel
  const star = easeOutBack(sub(x, 3.25, 3.45));
  const cove = smooth(sub(x, 3.8, 4.1)), rTile = easeOutBack(sub(x, 4.1, 4.35));
  const islets = smooth(sub(x, 5.0, 5.3)), play = easeOutBack(sub(x, 5.25, 5.5)), relay = smooth(sub(x, 5.4, 5.8));
  return {
    gain: g,
    // fan: alpha multiplier (25% after B1); the wedges fade out as L's strips appear (L2 u 0.10–0.25)
    wedges: wedges.map((w) => lerp(w * g, 1, handoff) * (1 - smooth(sub(legU("L2", p), 0.1, 0.25)))) as [number, number, number, number],
    fan: lerp(fan * g, 1, handoff),
    b2: beatVis(2) * g, dividers: pivot, stamped: stamped.map((q) => q * g) as [number, number, number],
    b3: beatVis(3) * g, glide: glide * g, star: star * g,
    b4: beatVis(4) * g, cove: cove * g, rTile: rTile * g,
    b5: beatVis(5) * g, islets: islets * g, play: play * g, relay: relay * g,
  };
}

// ── 03 lens drum: it indexes like an escapement; the playing pane is always the front one (facing the 03 camera). ──
/** Drum rotation (degrees) at loop time t: B2..B5 each index 45° in 0.3 s (cubic in-out) to pane k; the rest
 * completes the turn (+180° over 1.2 s, sine). The front pane slides out 0.12 during 0.3–1.15 of each beat. */
export function lensDrum(t: number) {
  const x = loopX(t);
  if (x >= 6.0) return { angle: 180 + 180 * easeInOutSine(clamp01((x - 6.0) / 1.2)), pane: -1, out: 0 }; // 4×45 = 180 done; +180 completes 360
  const i = Math.floor(x / 1.2), f = x - i * 1.2;
  const angle = (i === 0 ? 0 : (i - 1) * 45) + (i === 0 ? 0 : 45 * easeInOutCubic(clamp01(f / 0.3)));
  const out = f < 0.3 ? 0 : f < 0.55 ? easeOutCubic((f - 0.3) / 0.25) : f < 0.9 ? 1 : f < 1.15 ? 1 - easeOutBack((f - 0.9) / 0.25, 1.0) : 0;
  return { angle, pane: i, out: Math.max(0, out) };
}
/** Drum angle over the whole story (pane i faces bearing angle − 45·i): the 03 loop (× loopGain(2, p)); from L3 u
 * 0.74–0.88 it eases (scrubbed) to the lantern's lens drive with P1 facing the lens angle (angle ≡ lens + 45), taking
 * the nearest equivalent turn (≤ 180°, also on a revisit with a long-running 04 clock); after that it follows the
 * lens. The value is a pose angle: a step of exactly 360° (the wrap below) is the same pose and never shows. */
export function drumAngle(p: number, t03: number, t04: number) {
  const g = loopGain(2, p), ld = lensDrum(t03);
  const own = DRUM_FRONT + ld.angle * g;
  const lens = beamAt(p, t04).drum + 45;
  const target = own + ((((lens - own) % 360) + 540) % 360) - 180;
  return lerp(own, target, smooth(sub(legU("L3", p), 0.74, 0.88)));
}
/** While the drum encloses the core during 03 (L2 u 0.55 → L3 u 0.74), the halo is capped at 25% so it never washes
 * the playing pane's pictogram; the pane's own emissive (0.2, +0.15 on the B2 pulse) carries "light behind glass". */
export const haloCap = (p: number) => 1 - 0.75 * smooth(sub(legU("L2", p), 0.55, 0.65)) * (1 - smooth(sub(legU("L3", p), 0.7, 0.78)));
/** The halo is two sprites on one texture: the free one (depthTest off, constant size) and, while the 03 drum
 * encloses the core, an occluded twin (depthTest on, drawn after the panes, so the playing pane hides it). They
 * cross-fade by haloFree (1 = free), so switching never pops. Both opacities are × haloCap. */
export const haloFree = (p: number) => 1 - smooth(sub(legU("L2", p), 0.45, 0.55)) * (1 - smooth(sub(legU("L3", p), 0.7, 0.78)));
export const corePulse03 = (p: number, t03: number) => {
  const x = loopX(t03);
  return (x >= 1.75 && x <= 2.15 ? Math.sin(Math.PI * sub(x, 1.75, 2.15)) : 0) * loopGain(2, p);
};

// ── 04 distribution ──
/** 04 target responses: on at 04, off under 05, back at the close (a 0..1 gain on every response amplitude). */
export const responses04 = (p: number) => loopGain(3, p) + ramp(p, SWITCH[5]);
/** Tint weight of each sector for a beam at bearing b (sums to ≤ 1). */
export const sectorTint = (b: number) =>
  SECTORS.map((q) => smooth(sub(b, q.from - 2, q.from + 2)) * (1 - smooth(sub(b, q.to - 2, q.to + 2)))) as [number, number, number, number];
/** 04 targets' scrubbed presence: surface at L3 u 0.72–1.0, stand down while the camera cranes to 05 (L4 u 0.2–0.5:
 * buoys sink, beacons retract, moorings fade into the haze), stand up again for the close (L5 u 0.5–0.8). */
export function targets04(p: number) {
  const up = sub(legU("L3", p), ...RISE.targets);
  const down = smooth(sub(legU("L4", p), 0.2, 0.5));
  const back = smooth(sub(legU("L5", p), 0.5, 0.8));
  return p < WIN.L4.from ? up : p < WIN.L5.from ? 1 - down : back;
}
/** 04 responses (loop time t04, × responses04(p)): buoy lamps, loom, r/ disc, boat swing, beacon flare, relay, hoist. */
export function response04(p: number, t04: number, bank: number) {
  const g = responses04(p), x = loopX(t04), b = beatAt(t04), bp = beatP(t04);
  const lamps = [0, 1, 2, 3, 4].map((i) => (b === 0 ? smooth(sub(x, 0.3 + 0.12 * i, 0.4 + 0.12 * i)) : x >= 1.2 && x < 1.5 ? 1 - smooth(sub(x, 1.2, 1.5)) : 0) * g);
  const loom = (x >= 1.56 && x < 2.7 ? LOOM.peak * easeOutCubic(sub(x, 1.56, 1.92)) * (1 - smooth(sub(x, 2.4, 2.7))) : 0) * g * smooth(clamp01(bank / 0.6));
  const star = (x >= 1.95 && x < 2.7 ? easeOutBack(sub(x, 1.95, 2.15)) * (1 - smooth(sub(x, 2.4, 2.7))) : 0) * g * smooth(clamp01(bank / 0.6));
  const rLit = (x >= 2.76 && x < 3.6 ? smooth(sub(x, 2.76, 2.9)) * (1 - smooth(sub(x, 3.45, 3.6))) : 0) * g;
  const swing = (x < 2.58 ? 0 : x < 6.2 ? easeInOutCubic(sub(x, 2.58, 3.0)) : 1 - easeInOutCubic(sub(x, 6.2, 7.0))) * g;
  const pennants04 = (x < 2.82 ? 0 : x < 6.2 ? smooth(sub(x, 2.82, 3.1)) : 1 - smooth(sub(x, 6.2, 7.0))) * g;
  const ring = x >= 2.8 && x < 3.3 ? { r: lerp(0.8, 1.6, easeOutCubic(sub(x, 2.8, 3.3))), alpha: g * (1 - smooth(sub(x, 3.0, 3.3))) } : { r: 0.8, alpha: 0 };
  const flare = (x >= 4.08 && x < 5.0 ? smooth(sub(x, 4.08, 4.2)) * (1 - smooth(sub(x, 4.8, 5.0))) : 0) * g;
  const relay = (x >= 4.08 && x < 5.0 ? smooth(sub(x, 4.08, 4.32)) * (1 - smooth(sub(x, 4.8, 5.0))) : 0) * g;
  const hoist = [0, 1, 2, 3, 4].map((i) => (x < 5.22 ? 0 : x < 6.4 ? easeInOutCubic(sub(x, 5.22 + 0.06 * i, 5.62 + 0.06 * i)) : 1 - easeInOutCubic(sub(x, 6.4, 7.2))) * g);
  return {
    gain: g, beat: b, beatP: bp, lamps: lamps as [number, number, number, number, number], loom, star, rLit, swing, pennants04, ring, flare, relay,
    hoist: hoist as [number, number, number, number, number],
  };
}
/** The first ship (the first buyer): outer end of the channel at 04; scrubbed in along the buoys, round the tip's east
 * side and alongside the quay into its berth during L4; berthed from 05 on. One function drives it at every (p, t). */
export function shipOne(p: number, t04: number) {
  const alpha = smooth(sub(legU("L3", p), 0.72, 0.8)); // crossfades in as the drifting 01 sloop fades out (not drawn before)
  // 04: it rides at the channel's outer end (heading 214); in B1 it swings 30° onto the lit line and back
  const x = loopX(t04), turn = x < 1.2 ? Math.sin(Math.PI * clamp01((x - 0.2) / 1.0)) * 30 * responses04(p) : 0;
  const u = legU("L4", p), q = pathAt(SHIP1_PATH, smooth(u)), under = smooth(sub(u, 0, 0.1)); // L4: under way; the 04 pose blends into the path over u 0–0.1
  return { pos: q.pos, heading: lerp(214 - turn, u >= 1 ? HARBOUR.berth[3] : q.heading, under), visible: alpha > 0, alpha };
}

// ── 04 beam: escapement over a 4-panel lens. Each beat: step 0.5 s (sine in-out), hold 0.7 s. The 2.0 s rest turns
// the lens 40° (sine): the lit panel leaves the fan (fades out past 92°) while the next panel (90° behind) enters
// (fades in past 26°) and arrives on B1. Bearing only ever increases; peak angular speed 56.5°/s (the 18° step). ──
export function lensAngle(t: number) {
  const x = loopX(t), H = BEAM_HOLD;
  if (x >= 6) return lerp(H[4], H[0] + 90, easeInOutSine((x - 6) / 2));
  const i = Math.floor(x / 1.2);
  return i === 0 ? H[0] : lerp(H[i - 1], H[i], easeInOutSine((x - i * 1.2) / STEP));
}
/** Unwrapped escapement lens angle: continuous across loop boundaries (+90° per loop), closes over 32 s. */
export const lensAngleU = (t: number) => lensAngle(t) + 90 * Math.floor(t / LOOP.period);
/** Continuous pass (05 and the close): the lens turns 90° per loop at a constant 11.25°/s, one panel crossing the lit
 * fan per loop; no holds. Unwrapped; it reaches B1..B5's bearings at 0.9 / 1.4 / 2.5 / 3.7 / 5.3 s, just before each
 * 04 response plays at the close. */
export const lensAngleC = (t: number) => 30 + 90 * (t / LOOP.period);
const fanLight = (b: number) => smooth(sub(b, LIT_FAN[0], LIT_FAN[0] + 6)) * (1 - smooth(sub(b, LIT_FAN[1] - 4, LIT_FAN[1])));
/** The lit panel: of the four panels 90° apart, the one inside the fan (brightest). */
function litOf(lensU: number) {
  const th = wrap(lensU);
  const c = [th, th - 90, th - 180, th - 270].map((b) => ({ bearing: wrap(b), light: fanLight(wrap(b)) }));
  return c.reduce((a, b) => (b.light > a.light ? b : a));
}
export function beamState(t: number) {
  const x = loopX(t), lit = litOf(lensAngle(t));
  const i = x < 6 ? Math.floor(x / 1.2) : -1;
  const tilt = i < 0 ? 0 : i === 0 ? BEAM_TILT[0] : lerp(BEAM_TILT[i - 1], BEAM_TILT[i], easeInOutSine((x - i * 1.2) / STEP));
  return { bearing: lit.bearing, light: lit.light, tilt, beat: i, lens: wrap(lensAngle(t)) };
}
export interface BeamCue {
  light: number;
  bearing: number;
  tilt: number;
  state: "none" | "static" | "dark" | "escapement" | "continuous";
  beat?: number;
  lens?: number;
  drum: number; // the lens drive
}
/** The Lighthouse's beam as a pure function of (p, t04): which state, its light, bearing, tilt, and the drum angle.
 * States change only by fading through darkness: none → static 03 beam (bearing 96, tilt −2) → dark → 04 escapement
 * (latched clock) → dark (SWITCH[4] ± 0.002) → continuous pass at 40% under 05, rising to 100% at the close. */
export function beamAt(p: number, t04: number): BeamCue {
  const u2 = legU("L2", p), u3 = legU("L3", p);
  const drumMix = smooth(sub(p, SWITCH[4] - 0.002, SWITCH[4] + 0.002)); // the lens changes drive only while dark
  const drum = lerp(lensAngleU(t04), lensAngleC(t04), drumMix); // the lens drive, defined at every p (drumAngle weights it)
  if (p < WIN.L2.from) return { light: 0, bearing: 96, tilt: -2, state: "none", drum };
  if (p < at("L3", RISE.oldBeamOut[1])) return { light: smooth(sub(u2, 0.6, 1.0)) * (1 - smooth(sub(u3, ...RISE.oldBeamOut))), bearing: 96, tilt: -2, state: "static", drum };
  if (p < at("L3", RISE.newBeamIn[0])) return { light: 0, bearing: 96, tilt: -2, state: "dark", drum };
  if (p < SWITCH[4]) {
    const b = beamState(t04);
    const k = smooth(sub(u3, ...RISE.newBeamIn)) * (1 - smooth(sub(p, SWITCH[4] - 0.012, SWITCH[4] - 0.002)));
    return { light: b.light * k, bearing: b.bearing, tilt: -4 + b.tilt, state: "escapement", beat: b.beat, lens: b.lens, drum };
  }
  const lit = litOf(lensAngleC(t04));
  const k = smooth(sub(p, SWITCH[4] + 0.002, SWITCH[4] + 0.012)) * lerp(0.4, 1.0, ramp(p, SWITCH[5]));
  return { light: lit.light * k, bearing: lit.bearing, tilt: -4, state: "continuous", drum };
}
/** Mist wedge strength (uBeam.z): the beam's clearing, 40% for 03's low static beam, ramping to 100% over L3 u 0–0.2. */
export const mistBeamStrength = (p: number, light: number) => light * lerp(0.4, 1, smooth(sub(legU("L3", p), 0, 0.2)));

// ── 05: one loop ship per loop. It enters from the east edge in the rest before its loop, sails in along the approach
// lane south of the quay, gives its pearl at B1 (0.35 s) while it is in front of the chart case's right page, passes in
// front of the case, comes alongside and fades there (2.9–3.3 s). Class and pennant cycle with the loop index n (pure;
// both tables have 4 entries, so 05 closes over 32 s). At loopT 8 the next ship is exactly where this one was at 0. ──
/** Route progress during a loop's own phase: quick past the case in B1 (it clears the content strip by 1.2 s), then
 * slowing as it comes alongside (easeOutCubic). */
const route05S = (x: number) => ROUTE05_AT_B1 + (1 - ROUTE05_AT_B1) * easeOutCubic(x / 3.3);
export function loopShip05(t: number) {
  const n = Math.floor(t / LOOP.period), x = loopX(t);
  let s: number, fade = 1, who = n;
  if (x >= 6.0) {
    s = ROUTE05_AT_B1 * easeInOutSine((x - 6.0) / 2.0);
    fade = smooth((x - 6.0) / 0.8);
    who = n + 1;
  } else if (x < 3.3) {
    s = route05S(x);
    fade = 1 - smooth(sub(x, 2.9, 3.3));
  } else return { visible: false, who: n };
  const q = pathAt(ROUTE05, s);
  const cls = SHIP_CLASSES[((who % 4) + 4) % 4], pen = CHANNEL_ORDER[((who % 4) + 4) % 4];
  return { visible: fade > 0.001, pos: q.pos, heading: q.heading, fade, cls, pennant: pen, who, s };
}
/** The recorder trace (05 right page). A pen draws the level on a strip that advances left (one page width per 16 s).
 * Each B1 the ship's pearl lands on the pen tip (0.70 s) as an ink dot in its pennant colour and the pen steps up
 * (0.70–0.95 s): levels 0.5 → 0.75 → 1.0 per 16-s epoch; in the rest of every 2nd loop the page rescales ×2
 * (7.2–7.6 s: the trace eases to half height while the gridlines halve their spacing and 4 new ones fade in; the odd
 * lines fade 7.6–8.0). No numerals, ever. Displayed level (0..1 of the trace area), before the close's extra ×2. */
export function traceLevel(t: number) {
  const n = Math.floor(t / LOOP.period), m = ((n % 2) + 2) % 2, x = loopX(t);
  let level = 0.5 + 0.25 * m + 0.25 * easeOutCubic(sub(x, 0.7, 0.95)), rescale = 0, oddFade = 0;
  if (m === 1 && x >= 7.2) {
    rescale = easeInOutCubic(sub(x, 7.2, 7.6));
    oddFade = smooth(sub(x, 7.6, 8.0));
    level = lerp(1.0, 0.5, rescale);
  }
  return { level, rescale, oddFade };
}
/** Raw (unscaled) level history: doubles every epoch, so the displayed trace is raw(t − τ) / 2^epoch(t). */
const rawLevel = (t: number) => {
  const n = Math.floor(t / LOOP.period), e = Math.floor(n / 2), m = ((n % 2) + 2) % 2, x = loopX(t);
  return 2 ** e * (0.5 + 0.25 * m + 0.25 * easeOutCubic(sub(x, 0.7, 0.95)));
};
/** The close's extra scrubbed ×2 of the trace (L5 u 0.55–0.85), held through the close. */
export const closeRescale = (p: number) => smooth(sub(legU("L5", p), 0.55, 0.85));
/** The whole trace as N points (x 0..1 across the trace area, y 0..1 of its height) + ink dots, pure in (p, t). */
export function trace05(p: number, t: number, N = 48) {
  const n = Math.floor(t / LOOP.period), e = Math.floor(n / 2), tl = traceLevel(t);
  const scale = 2 ** e * lerp(1, 2, tl.rescale) * lerp(1, 2, closeRescale(p));
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const xk = i / N;
    pts.push([xk, rawLevel(t - (1 - xk) * TRACE.window) / scale]);
  }
  const dots: { x: number; y: number; pennant: Channel }[] = [];
  for (let k = n; k >= n - 2; k--) {
    const land = k * LOOP.period + 0.7;
    if (land > t || land <= t - TRACE.window + 1e-6) continue;
    dots.push({ x: 1 - (t - land) / TRACE.window, y: rawLevel(land) / scale, pennant: CHANNEL_ORDER[((k % 4) + 4) % 4] });
  }
  return { pts, dots, gridHalf: tl.rescale, oddFade: tl.oddFade, closeGrid: closeRescale(p) };
}
/** The pearl: lifts from the passing ship's pennant at 0.35 s, arcs over the chart case's top edge and lands on the
 * pen tip at 0.70 s (the hero's LAND, 0.35 s). Quadratic Bézier: pennant → control → pen tip. */
export function pearl05(p: number, t: number): { visible: boolean; landed?: boolean; pos?: Vec3 } {
  const x = loopX(t);
  if (x < 0.35 || x > 1.2) return { visible: false };
  const k = clamp01((x - 0.35) / 0.35), e = easeInOutCubic(k);
  const sh = pathAt(ROUTE05, route05S(0.35)).pos;
  const tip = penTip(p, t);
  const a = [sh[0], 1.4, sh[2]], c = tip, b = [lerp(a[0], c[0], 0.5), Math.max(a[1], c[1]) + 1.6, lerp(a[2], c[2], 0.5)];
  const q = (i: number) => (1 - e) * (1 - e) * a[i] + 2 * (1 - e) * e * b[i] + e * e * c[i];
  return { visible: true, landed: k >= 1, pos: [q(0), q(1), q(2)] };
}
/** World position of the trace's pen tip (right end of the trace area at the current level). */
export function penTip(p: number, t: number) {
  const T = CASE.trace, lv = trace05(p, t, 1).pts[1][1]; // N = 1: the last point is the pen
  return caseToWorld(T.x[1], lerp(T.y[0], T.y[1], lv), 0.02);
}
/** 05 B3: the next ship's dashed course draws on the water (2.4–2.8 s) through a detour vertex 2.8 u north of the
 * lane, then the vertex eases onto the straight line (2.9–3.3 s): the course shortens and passes north of its markers.
 * The ship that follows consumes it (the drawn part starts at the ship). Pure in loop time. */
export function approach05(t: number) {
  const x = loopX(t);
  const straight = x >= 3.3 || x < 2.4 ? 1 : easeInOutCubic(sub(x, 2.9, 3.3));
  const v: Vec3 = [lerp(LANE_KINK[0], ROUTE05[2][0], straight), 0, lerp(LANE_KINK[2], ROUTE05[2][2], straight)];
  const drawIn = x >= 2.4 && x < 3.6 ? smooth(sub(x, 2.4, 2.8)) : 1; // drawn on at B3; otherwise fully drawn ahead of its ship
  const ship = loopShip05(t), from = x >= 2.4 && x < 6.0 ? 0 : ship.s ?? 0; // route progress already consumed by the next ship
  const flash = x >= 2.9 && x < 3.7 ? 1 - smooth(sub(x, 3.3, 3.7)) : 0; // the changed stroke flashes lime
  return { lane: [ROUTE05[0], ROUTE05[1], v, ROUTE05[3], ROUTE05[4]], drawIn, from, flash, straight };
}
/** 05 B4 on the chart page: the course leg goes dashed → solid (3.6–4.0), swings 20° (4.0–4.3), then one sector arc
 * widens 25° (4.3–4.6); each changed stroke flashes lime for 0.4 s. Back to dashed and the old angle over 7.4–7.9. */
export function chart05(p: number, t: number) {
  const g = loopGain(4, p), x = loopX(t), back = smooth(sub(x, 7.4, 7.9));
  const solid = smooth(sub(x, 3.6, 4.0)) * (1 - back);
  const swing = easeInOutCubic(sub(x, 4.0, 4.3)) * (1 - back);
  const widen = easeInOutCubic(sub(x, 4.3, 4.6)) * (1 - back);
  const flashLeg = x >= 4.0 && x < 4.7 ? 1 - smooth(sub(x, 4.3, 4.7)) : 0;
  const flashArc = x >= 4.3 && x < 5.0 ? 1 - smooth(sub(x, 4.6, 5.0)) : 0;
  return { solid: solid * g, swing: swing * g, widen: widen * g, flashLeg: flashLeg * g, flashArc: flashArc * g };
}
/** 05 B2 on the content strip: sheen (1.2–1.5), the dull tile slides left 0.3 and fades (1.5–1.8), the clear tile
 * slides in (1.8–2.1, easeOutBack) with a ↻ glint; it frosts back to dull over 7.4–7.9 (content ages). */
export function strip05(p: number, t: number) {
  const g = loopGain(4, p), x = loopX(t);
  return { sheen: x >= 1.2 && x < 1.5 ? sub(x, 1.2, 1.5) : -1, out: easeInOutCubic(sub(x, 1.5, 1.8)) * g, in: easeOutBack(sub(x, 1.8, 2.1), 1.0) * g, glint: (x >= 2.0 && x < 2.3 ? 1 : 0) * g, age: smooth(sub(x, 7.4, 7.9)) };
}
/** 05 B5: the pulse arc sweeps out from the reach and a new cove surfaces from the last haze (a mist hole). */
export function newGrowth05(p: number, t: number) {
  const g = loopGain(4, p) * (1 - ramp(p, SWITCH[5])), x = loopX(t);
  const ring = x < 4.8 || x > 6.0 ? null : 16 + 60 * easeOutCubic((x - 4.8) / 0.9); // pulse arc radius: from the reach out to the new cove (r 72) (fades 5.5–6.0)
  const ringAlpha = x < 4.8 || x > 6.0 ? 0 : (1 - smooth(sub(x, 5.5, 6.0))) * g;
  const hole = (x < 5.0 ? 0 : x < 7.4 ? smooth(sub(x, 5.0, 5.6)) : 1 - smooth(sub(x, 7.4, 8.0))) * g;
  return { ring, ringAlpha, hole };
}
/** New-cove vessels exist only from 05 on (their masts would otherwise poke through the sea mist at 04's top edge). */
export const cove05 = (p: number) => smooth(sub(p, WIN.L4.to - 0.02, WIN.L4.to));
/** Harbour lights: the berth lamp lights as the first ship docks at the end of L4; the other 13 ignite in sequence
 * during L5 u 0.2 + 0.04·k, so the harbour goes from 1 lit lamp at 05 to 14 at the close. */
export function harbourLight(p: number, i: number) {
  if (i === BERTH_LAMP) return smooth(sub(legU("L4", p), 0.97, 1.0));
  const k = i < BERTH_LAMP ? i : i - 1;
  return smooth(sub(legU("L5", p), 0.2 + 0.04 * k, 0.25 + 0.04 * k));
}

// ── Atmosphere: dwell keyframes (layout.ts ATMOS); legs blend with smoothstep, colours in linear RGB. ──
export interface Atmos {
  R: number;
  bank: number;
  hazeN: number;
  hazeF: number;
  elev: number;
  sun: string;
  sunI: number;
  hemi: number;
  sea: number;
}
export function atmosAt(p: number): Atmos {
  const s = shotAt(p);
  if (!s.leg) return { ...ATMOS[s.name as ShotName] };
  const leg = LEGS[s.leg];
  const k = smooth(s.u);
  const a = ATMOS[leg.from], b = ATMOS[leg.to];
  const out = { ...a, sun: mixHex(a.sun, b.sun, k) }; // the one colour key
  for (const key of Object.keys(a) as (keyof Atmos)[]) if (key !== "sun") out[key] = lerp(a[key], b[key], k);
  return out;
}
/** Low sea-mist strength (uSeaMist): 1 while the reach is small, easing to 0 as R grows 22 → 34 during L5 (never a switch). */
export const seaMist = (R: number) => 1 - smooth(sub(R, 22, 34));
/** The new cove (05 B5) rises out of the parting haze: its islet and vessels scale y with the hole (0 when closed, so
 * nothing half-misted pokes above the sea mist at other beats, and it is gone at the close). */
export const coveRise = (p: number, t: number) => newGrowth05(p, t).hole * cove05(p);
/** The persistent reach ring (Coast) exists from L1 u 0 (during 01 the ring is only S1's B5 pulse). */
export const reachRing = (p: number) => smooth(sub(legU("L1", p), 0, 0.15));

// ── Cues shared by several parts ──
export const sunDir = (elevDeg: number): Vec3 => {
  const el = elevDeg * DEG, az = SUN_AZIMUTH * DEG;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
};
export const breathe = (time: number) => 1 + 0.05 * Math.sin((2 * Math.PI * time) / 2.4);
/** One-time ignition: 0 → 0.6 → 0.2 → 1 over 0.45 s (≤ 2 dips); lit when igniteAt is null (frozen / still). */
export function ignition(time: number, igniteAt: number | null) {
  if (igniteAt === null) return 1;
  const k = time - igniteAt;
  if (k <= 0) return 0;
  if (k < 0.12) return 0.6 * (k / 0.12);
  if (k < 0.2) return lerp(0.6, 0.2, (k - 0.12) / 0.08);
  if (k < 0.45) return lerp(0.2, 1, easeOutCubic((k - 0.2) / 0.25));
  return 1;
}
export interface Builds {
  unfold01: number; // L0 u .2–.8
  housing01: [number, number, number]; // L0, bottom layer first
  board01Fold: number; // L1 u .2–.6
  fixPearl: number; // L1 flight progress (-1 outside L1)
  fixPearlScale: number; // grows u 0–.1, sinks u .78–.88
  mark02: number; // L1 u .72–.8
  table02: number; // L1 u .1–.5
  chart02: number; // L1 u .4–.7
  strips: number; // L2 u .2–.6 flight (-1 outside L2)
  lens03: number; // L2 u .55–.95
  targets04: number; // surface / stand down / stand up
  lanterns05: number; // L4 u .45–.55
  case05: number; // L4 u .3–.7
  closeUnfold: number; // L5 u .2–.6
  closeRescale: number; // L5 u .55–.85
}
/** Scrubbed build-ins and hand-offs (legU clamps, so every factor is 0 before its leg and 1 after). */
export function builds(p: number): Builds {
  const u = (l: LegName) => legU(l, p);
  return {
    unfold01: smooth(sub(u("L0"), 0.2, 0.8)),
    housing01: ([0, 1, 2] as const).map((k) => housingBuild(p, k)) as Builds["housing01"],
    board01Fold: smooth(sub(u("L1"), 0.2, 0.6)),
    fixPearl: p <= WIN.L1.from || p >= WIN.L1.to ? -1 : sub(u("L1"), 0.15, 0.75), // flight progress; -1 = not drawn
    fixPearlScale: smooth(sub(u("L1"), 0, 0.1)) * (1 - smooth(sub(u("L1"), 0.78, 0.88))), // grows on the ⊙ fix, sinks into the chart mark: 0 at both ends of L1 (never pops)
    mark02: smooth(sub(u("L1"), 0.72, 0.8)), // the chart's amber mark appears as the ⊙ pearl lands (S2's own mesh)
    table02: smooth(sub(u("L1"), 0.1, 0.5)),
    chart02: smooth(sub(u("L1"), 0.4, 0.7)),
    strips: p <= WIN.L2.from || p >= WIN.L2.to ? -1 : sub(u("L2"), 0.2, 0.6), // flight progress (0 flat on the chart, 1 at the crown)
    lens03: smooth(sub(u("L2"), 0.55, 0.95)),
    targets04: targets04(p),
    lanterns05: smooth(sub(u("L4"), 0.45, 0.55)),
    case05: smooth(sub(u("L4"), 0.3, 0.7)),
    closeUnfold: smooth(sub(u("L5"), 0.2, 0.6)),
    closeRescale: closeRescale(p),
  };
}
