import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import {
  aim,
  CAMERA_KEYS,
  craftTheta,
  CUT_P,
  EARTH_ROWS,
  eio,
  fairingOpen,
  geo,
  lerp,
  MODULE_Y0,
  padRise,
  R,
  radius,
  seg,
  smooth,
  STATIONS,
  SUN_ORBIT,
  SUN_PAD,
  theta,
  turn,
  VEHICLE_BASE,
  vehicleScale,
  type CameraKey,
} from "./timeline";

// World space for Mission DVB-01, drawn NOT TO SCALE, in two scale spaces that are never on
// screen together. Before CUT_P the pad set (pad units, the pad at the origin, ground at y 0);
// from CUT_P on the orbit set, where the Earth's top point (the Cape) is the origin and the
// mission plane is XY with θ running clockwise seen from +Z.

const Y = new Vector3(0, 1, 0);
const D2R = Math.PI / 180;

export const C = new Vector3(0, -R, 0);
/** The launch mount's plinth top (pad units); the engine exit plane (VEHICLE_BASE) sits just above it. */
export const PLINTH_H = 0.18;
export const PSI = 22.5; // vehicle yaw on the pad: the livery column turns toward the camera


// ── Geography ────────────────────────────────────────────────────────────
/** Earth's rotation pole in world space: north leans away from the +Z side. */
export const POLE = new Vector3(0, Math.sin(28.5 * D2R), -Math.cos(28.5 * D2R)); // ≈ (0, 0.477, −0.879)
/** Object → world rotation of the Earth sphere: the Cape to +Y, local north to −Z, local east to +X. */
export const EARTH_ROT = new Quaternion().setFromRotationMatrix(
  new Matrix4().set(...EARTH_ROWS[0], 0, ...EARTH_ROWS[1], 0, ...EARTH_ROWS[2], 0, 0, 0, 0, 1),
);
/** World-space surface normal of a place. */
export const geoNormal = (lat: number, lon: number, out = new Vector3()) => out.set(...geo(lat, lon)).applyQuaternion(EARTH_ROT);
/** Each station's world-space surface normal. */
export const STATION_N = STATIONS.map((s) => new Vector3(...s.normal));

// ── Sun ──────────────────────────────────────────────────────────────────
const SUN_A = new Vector3(...SUN_PAD).normalize();
const SUN_B = new Vector3(...SUN_ORBIT).normalize();
const sunQ = new Quaternion().setFromUnitVectors(SUN_A, SUN_B);
const sunQt = new Quaternion();
/** The sun direction at p: the morning pad sun, slerped to the orbit sun over .25–.29 (only the rocket and sky are on screen). */
export function sunDir(p: number, out = new Vector3()) {
  const t = eio(seg(p, 0.25, 0.29));
  return out.copy(SUN_A).applyQuaternion(sunQt.identity().slerp(sunQ, t));
}

export function polar(deg: number, r: number, out = new Vector3()) {
  const a = deg * D2R;
  return out.set(Math.sin(a) * r, -R + Math.cos(a) * r, 0);
}

/** The module (satellite) centre at p, no idle bob: pad units before CUT_P, orbit space from it on. */
export function craftPosition(p: number, out = new Vector3()) {
  if (p < 0.125) return out.set(0, MODULE_Y0, 0);
  if (p < CUT_P) {
    const r = padRise(p);
    return out.set(r.x, MODULE_Y0 + r.y, 0);
  }
  if (p < 0.4) {
    const t = turn(p);
    return polar(t.theta, t.r, out);
  }
  const th = theta(p);
  return polar(th, radius(p, th), out);
}

const ta = new Vector3();
const tb = new Vector3();
/** Direction of travel of the scripted path at p (sampled inside one scale space, never across the cut). */
export function craftTangent(p: number, out = new Vector3()) {
  const pad = p < CUT_P;
  craftPosition(pad ? p - 0.001 : Math.max(CUT_P, p - 0.001), ta);
  craftPosition(pad ? Math.min(CUT_P - 1e-6, p + 0.001) : p + 0.001, tb);
  out.subVectors(tb, ta);
  return out.lengthSq() < 1e-12 ? out.copy(Y) : out.normalize();
}

export const yaw = (deg: number, out = new Quaternion()) => out.setFromAxisAngle(Y, deg * D2R);

const Zaxis = new Vector3(0, 0, 1);
/**
 * The pad-space pitch at the cut, so the craft's attitude relative to its local vertical is the same on both
 * sides of CUT_P: the orbit-space ascent flies nose-along-tangent, which leans this far from the radial there.
 */
const PAD_PITCH_CUT = (() => {
  const t = craftTangent(CUT_P + 1e-4, new Vector3());
  const r = craftPosition(CUT_P + 1e-4, new Vector3()).sub(C);
  return Math.atan2(t.x, t.y) - Math.atan2(r.x, r.y);
})();

const qa = new Quaternion();
const qb = new Quaternion();
const tan = new Vector3();
/** Craft attitude: upright on the pad, pitching downrange over .20–.27, nose along the flight path to .415, then upright with the X turned to the camera. */
export function craftQuaternion(p: number, out = new Quaternion()): Quaternion {
  if (p < 0.13) return yaw(PSI, out);
  if (p < CUT_P) return out.setFromAxisAngle(Zaxis, -PAD_PITCH_CUT * eio(seg(p, 0.2, CUT_P))).multiply(yaw(PSI, qa));
  if (p < 0.415) return out.setFromUnitVectors(Y, craftTangent(p, tan)).multiply(yaw(PSI, qa));
  if (p < 0.47) {
    craftQuaternion(0.41499, qb);
    return out.slerpQuaternions(qb, yaw(-55, qa), eio(seg(p, 0.415, 0.47)));
  }
  if (p < 0.56) return yaw(-55, out);
  return yaw(lerp(-55, 14, eio(seg(p, 0.56, 0.66))), out);
}

// ── Staging (orbit space, vehicle at 0.18) ────────────────────────────────
// Every pose is the stack's craft-point pose, so the parts keep their stacked local coordinates.
export const SEP = 0.355;
const BOOSTER_C = new Vector3(0, 1.43 - (MODULE_Y0 - VEHICLE_BASE), 0); // the booster's middle (1.43 above the engine exit), craft-local pad units
const X = new Vector3(1, 0, 0);
const sepQ = new Quaternion();
const pitchQ = new Quaternion();
const ax = new Vector3();
const down = new Vector3();
const cA = new Vector3();
const cB = new Vector3();
/**
 * The first stage (engines, tank, interstage): stacked until MECO; the interstage gap opens over .355–.358,
 * then it falls behind and toward the Earth, pitching 0 → 35° about its own middle. Returns false once gone (.44).
 */
export function boosterPose(p: number, pos: Vector3, quat: Quaternion) {
  craftPosition(p, pos);
  if (p < SEP) {
    craftQuaternion(p, quat);
    return true;
  }
  const s = vehicleScale(p);
  craftQuaternion(SEP, sepQ);
  ax.copy(Y).applyQuaternion(sepQ);
  down.subVectors(C, pos).normalize();
  const q = seg(p, 0.358, 0.44);
  const back = 0.25 * seg(p, SEP, 0.358) + 7 * q * q;
  quat.copy(sepQ).multiply(pitchQ.setFromAxisAngle(X, 35 * D2R * smooth(q)));
  // Rotate about the booster's middle, not the craft point above it.
  cA.copy(BOOSTER_C).multiplyScalar(s).applyQuaternion(sepQ);
  cB.copy(BOOSTER_C).multiplyScalar(s).applyQuaternion(quat);
  pos.add(cA).sub(cB).addScaledVector(ax, -back * s).addScaledVector(down, 2.5 * q * q * s);
  return p < 0.44;
}

/** The second stage and payload adapter: stacked until payload separation at .41, then drifting back along its axis. Gone at .46. */
export function stage2Pose(p: number, pos: Vector3, quat: Quaternion) {
  craftPosition(p, pos);
  craftQuaternion(Math.min(p, 0.41), quat);
  if (p < 0.41) return true;
  ax.copy(Y).applyQuaternion(quat);
  const back = 0.15 * seg(p, 0.41, 0.415) + 1.6 * seg(p, 0.415, 0.46) ** 2;
  pos.addScaledVector(ax, -back * vehicleScale(p));
  return p < 0.46;
}

/**
 * One fairing half relative to its hinge on the base ring: the clamshell at integration, the opening at .385,
 * then the detached half drifting out and back while it tumbles. Degrees and pad units; gone at .43.
 */
export function fairingPose(p: number) {
  if (p < 0.2) return { open: fairingOpen(p), out: 0, back: 0, visible: true };
  const q = seg(p, 0.392, 0.43);
  return { open: 25 * seg(p, 0.385, 0.392) ** 2 + 40 * q, out: 1.4 * q * q + 0.1 * q, back: 1.0 * q * q, visible: p < 0.43 };
}

// ── The suborbital ghost ─────────────────────────────────────────────────
// The launch spike: a ballistic arc (apex 1.22 u ≈ 180 km) yawed 14° out of the mission plane so it never
// lies on the ascent trace, falling back 14° downrange.
const GHOST_H = new Vector3(Math.cos(14 * D2R), 0, Math.sin(14 * D2R));
const GHOST_ARC = 14;
export function ghostPoint(u: number, out = new Vector3()) {
  const ph = GHOST_ARC * D2R * u;
  const alt = 1.22 * 4 * u * (1 - u);
  return out
    .set(0, 0, 0)
    .addScaledVector(GHOST_H, Math.sin(ph))
    .addScaledVector(Y, Math.cos(ph))
    .multiplyScalar(R + 0.03 + alt)
    .add(C);
}
/** Unit tangent plane at the ghost's impact: along the arc and across it. */
export function ghostImpactFrame() {
  const ph = GHOST_ARC * D2R;
  const n = new Vector3().addScaledVector(GHOST_H, Math.sin(ph)).addScaledVector(Y, Math.cos(ph));
  const along = new Vector3().addScaledVector(GHOST_H, Math.cos(ph)).addScaledVector(Y, -Math.sin(ph));
  const across = new Vector3().crossVectors(n, along);
  return { at: ghostPoint(1), n, along, across };
}

// ── Camera ───────────────────────────────────────────────────────────────
export type CameraPose = { position: Vector3; target: Vector3; up: Vector3; d: number; fov: number; shift: number };
export const cameraPoseInit = (): CameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), d: 1, fov: 22, shift: 0 });

const ca = new Vector3();
const cb = new Vector3();
const craftNow = new Vector3();
const craftAim = new Vector3();
const axis = new Vector3();
const dir = new Vector3();
const local = new Vector3();
const orbitUp = new Vector3();
const Z = new Vector3(0, 0, 1);
const craftQ = new Quaternion();
function keyTarget(key: CameraKey, out: Vector3) {
  const f = key[1];
  out.set(f ? f[0] : 0, f ? f[1] : 0, f ? f[2] : 0);
  return key[2] > 0 ? out.lerp(craftAim, key[2]) : out;
}
/** Follow keys measure distance in pad units. */
const keyDist = (key: CameraKey, scale: number) => key[3] * (key[2] > 0 ? scale : 1);

/** Places the camera at distance d along (az, el), turned into the craft's local frame by `follow`, with the blended up. */
function place(out: CameraPose, p: number, d: number, az: number, el: number, follow: number, up: number) {
  const [a, e] = [az * D2R, el * D2R];
  dir.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).applyAxisAngle(Z, -craftTheta(p) * follow * D2R);
  out.d = d;
  out.position.copy(dir).multiplyScalar(d).add(out.target);
  // up: the craft's radial (+Y on the pad) blended to the orbit frame's −Z, projected off the view axis.
  if (p < CUT_P) local.copy(Y);
  else local.subVectors(craftNow, C).normalize();
  orbitUp.set(0, 0, -1).addScaledVector(dir, dir.z).normalize(); // Zs − (Zs·D)D with Zs = −Z
  out.up.copy(local).lerp(orbitUp, up);
  if (out.up.lengthSq() < 1e-8) out.up.copy(orbitUp);
  out.up.normalize();
  return out;
}

/** Updates the craft point and the aim point (the vehicle's visual centre) at p. */
function craftFrame(p: number) {
  craftPosition(p, craftNow);
  axis.copy(Y).applyQuaternion(craftQuaternion(p, craftQ));
  craftAim.copy(craftNow).addScaledVector(axis, -aim(p) * vehicleScale(p));
}

/** One key's pose at p (its follow target and local frame use the craft at p). */
function keyPose(key: CameraKey, p: number, out: CameraPose) {
  craftFrame(p);
  keyTarget(key, out.target);
  out.fov = key[6];
  out.shift = key[7];
  return place(out, p, keyDist(key, vehicleScale(p)), key[4], key[5], key[2], key[8]);
}

const oA = new Vector3();
const oB = new Vector3();
const turnQ = new Quaternion();
const blendQ = new Quaternion();
const IDQ = new Quaternion();
const upB = new Vector3();
/**
 * Moves pose a toward pose b without cutting through anything: the target lerps (tt), and the camera's
 * offset from it turns by slerp and grows by log-lerp (t), so a close follow shot pulls back on a curve.
 */
function blendPoses(a: CameraPose, b: CameraPose, t: number, tt: number, out: CameraPose) {
  oA.subVectors(a.position, a.target);
  oB.subVectors(b.position, b.target);
  const [la, lb] = [oA.length(), oB.length()];
  turnQ.setFromUnitVectors(oA.normalize(), oB.normalize());
  blendQ.slerpQuaternions(IDQ, turnQ, t);
  out.target.lerpVectors(a.target, b.target, tt);
  out.d = Math.exp(lerp(Math.log(la), Math.log(lb), t));
  out.position.copy(oA).applyQuaternion(blendQ).multiplyScalar(out.d).add(out.target);
  upB.copy(b.up);
  out.up.copy(a.up).lerp(upB, t).normalize();
  out.fov = lerp(a.fov, b.fov, t);
  out.shift = lerp(a.shift, b.shift, t);
  return out;
}

// ── The ground tracker (.13–.20) and its hand-off to the chase (.20–.25) ──
// A long-lens tracking camera on the ground: it stays where the pad shot stood and pans after the rocket,
// zooming so the rocket keeps a steady screen height, with a deterministic shake at ignition.
const TRACK0 = 0.13;
const HANDOFF = [0.2, 0.25] as const;
const ROCKET_H = 4.2; // pad units
/** The rocket's screen height (fraction of the frame) the operator holds: the pad framing, eased out to the chase's. */
const trackHeight = (p: number) => (p < 0.17 ? lerp(0.68, 0.46, eio(seg(p, TRACK0, 0.17))) : lerp(0.46, 0.41, seg(p, 0.17, HANDOFF[1])));
let TRACK_POS: Vector3 | null = null;
const trackA = cameraPoseInit();
const trackB = cameraPoseInit();
function trackPose(p: number, out: CameraPose) {
  TRACK_POS ??= keyPose(CAMERA_KEYS.find((k) => k[0] === TRACK0) ?? CAMERA_KEYS[3], TRACK0, cameraPoseInit()).position.clone();
  craftFrame(p);
  out.position.copy(TRACK_POS);
  out.target.copy(craftAim);
  out.d = out.position.distanceTo(out.target);
  // Looking up at the climbing rocket foreshortens it: hold its projected height, not its length.
  const along = dir.subVectors(out.target, out.position).normalize().dot(axis);
  const h = ROCKET_H * Math.sqrt(Math.max(0.2, 1 - along * along));
  out.fov = (2 * Math.atan(h / (2 * trackHeight(p) * out.d))) / D2R;
  out.shift = lerp(0.18, 0.17, seg(p, TRACK0, HANDOFF[1]));
  out.up.copy(Y);
  return out;
}
/** Ignition and liftoff shake, a pure function of p (±0.0025 rad over .12–.16, decaying). */
function shake(p: number, out: CameraPose) {
  const env = seg(p, 0.12, 0.123) * (1 - seg(p, 0.125, 0.16)) ** 2;
  if (env <= 0) return out;
  const a = 0.0025 * env * out.d;
  out.target.x += a * (0.6 * Math.sin(p * 4100) + 0.4 * Math.sin(p * 9300 + 1.3));
  out.target.y += a * (0.6 * Math.sin(p * 5300 + 0.7) + 0.4 * Math.sin(p * 11900 + 2.1));
  return out;
}

// ── The pull-back (.56–.64): from the deployed close-up to the downlink wide ──
const PULL = [0.56, 0.64] as const;

/** The camera as a pure function of p: eased between keys, targets can follow the craft. */
export function cameraPose(p: number, out: CameraPose) {
  const keys = CAMERA_KEYS;
  if (p >= TRACK0 && p < HANDOFF[1]) {
    if (p < HANDOFF[0]) return shake(p, trackPose(p, out));
    const t = eio(seg(p, HANDOFF[0], HANDOFF[1]));
    const follow = keys.find((k) => k[0] === HANDOFF[1]) ?? keys[4];
    return blendPoses(trackPose(p, trackA), keyPose(follow, p, trackB), t, 1, out);
  }
  if (p >= PULL[0] && p < PULL[1]) {
    const t = eio(seg(p, PULL[0], PULL[1]));
    const [k0, k1] = [keys.find((k) => k[0] === PULL[0]) ?? keys[0], keys.find((k) => k[0] === PULL[1]) ?? keys[0]];
    // The target leaves the craft late, so the craft stays framed while the Earth grows in behind it.
    return blendPoses(keyPose(k0, p, trackA), keyPose(k1, p, trackB), t, t * t * t, out);
  }
  let i = 0;
  while (i < keys.length - 2 && p >= keys[i + 1][0]) i++;
  const [k0, k1] = [keys[i], keys[i + 1]];
  const t = eio(seg(p, k0[0], k1[0]));
  const s = vehicleScale(p);
  craftFrame(p);
  keyTarget(k0, ca);
  keyTarget(k1, cb);
  out.target.lerpVectors(ca, cb, t);
  out.fov = lerp(k0[6], k1[6], t);
  out.shift = lerp(k0[7], k1[7], t);
  const d = Math.exp(lerp(Math.log(keyDist(k0, s)), Math.log(keyDist(k1, s)), t));
  place(out, p, d, lerp(k0[4], k1[4], t), lerp(k0[5], k1[5], t), lerp(k0[2], k1[2], t), lerp(k0[8], k1[8], t));
  return shake(p, out);
}

/** A single fixed key (the still poses). */
export const cameraAt = (key: CameraKey, out: CameraPose) => keyPose(key, key[0], out);

/** Seeded randomness so the smoke is the same on every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const deg = MathUtils.degToRad;

// ── Dev self-check ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const cape = geoNormal(28.5, -80.6);
  console.assert(cape.distanceTo(Y) < 1e-6, "mission: EARTH_ROT must put the Cape at +Y", cape);
  const pole = Y.clone().applyQuaternion(EARTH_ROT);
  console.assert(pole.distanceTo(POLE) < 1e-6, "mission: EARTH_ROT must map north to POLE", pole);
}
