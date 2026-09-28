import { MathUtils, Quaternion, Vector3 } from "three";
import {
  CAMERA_KEYS,
  explodeModule,
  lerp,
  MODULE_Y0,
  R,
  radius,
  riseY,
  seg,
  eio,
  STATION_LAT,
  STATIONS,
  theta,
  turn,
  type CameraKey,
} from "./timeline";

// World space for Mission DVB-01, drawn NOT TO SCALE. The planet's top point is
// the origin (the pad); the mission plane is XY and θ runs clockwise seen from +Z.

export const C = new Vector3(0, -R, 0);
export const PAD_TOP = 0.03;
export const BELL_Y = 0.09;
export const PSI = 22.5; // vehicle yaw on the pad: the D faces 7.5° left of the camera
/** Graticule axis: the pole sits 50° from the pad, away from the camera. */
export const AXIS = new Vector3(0, 0.64, -0.77).normalize();
export const TOWER = new Vector3(-1.4, 0, -0.25);

const Y = new Vector3(0, 1, 0);
const D2R = Math.PI / 180;

export function polar(deg: number, r: number, out = new Vector3()) {
  const a = deg * D2R;
  return out.set(Math.sin(a) * r, -R + Math.cos(a) * r, 0);
}

/** The module centre at p (no idle bob). */
export function craftPosition(p: number, out = new Vector3()) {
  if (p < 0.125) return out.set(0, MODULE_Y0 + 0.16 * explodeModule(p), 0);
  if (p < 0.26) return out.set(0, MODULE_Y0 + riseY(p), 0);
  if (p < 0.4) {
    const t = turn(p);
    return polar(t.theta, t.r, out);
  }
  const th = theta(p);
  return polar(th, radius(p, th), out);
}

const ta = new Vector3();
const tb = new Vector3();
/** Direction of travel of the scripted path at p. */
export function craftTangent(p: number, out = new Vector3()) {
  craftPosition(p - 0.001, ta);
  craftPosition(p + 0.001, tb);
  out.subVectors(tb, ta);
  return out.lengthSq() < 1e-12 ? out.copy(Y) : out.normalize();
}

export const yaw = (deg: number, out = new Quaternion()) => out.setFromAxisAngle(Y, deg * D2R);

const qa = new Quaternion();
const qb = new Quaternion();
const tan = new Vector3();
/** Craft attitude: nose along the flight path through ascent, then upright with the X turned to the camera. */
export function craftQuaternion(p: number, out = new Quaternion()): Quaternion {
  if (p < 0.13) return yaw(PSI, out);
  if (p < 0.415) return out.setFromUnitVectors(Y, craftTangent(p, tan)).multiply(yaw(PSI, qa));
  if (p < 0.47) {
    craftQuaternion(0.41499, qb);
    return out.slerpQuaternions(qb, yaw(-55, qa), eio(seg(p, 0.415, 0.47)));
  }
  if (p < 0.56) return yaw(-55, out);
  return yaw(lerp(-55, 14, eio(seg(p, 0.56, 0.66))), out);
}

export const SEP = 0.355;
const sepPos = new Vector3();
const sepTan = new Vector3();
const sepQuat = new Quaternion();
const down = new Vector3();
const tumble = new Quaternion();
const X = new Vector3(1, 0, 0);
/** The launch stage: rides with the craft until MECO, then falls back and tumbles. Returns false once gone. */
export function boosterPose(p: number, pos: Vector3, quat: Quaternion) {
  if (p < SEP) {
    craftPosition(p, pos);
    craftQuaternion(p, quat);
    return true;
  }
  const d = (p - SEP) / 0.1;
  craftPosition(SEP, sepPos);
  craftTangent(SEP, sepTan);
  down.subVectors(C, sepPos).normalize();
  pos.copy(sepPos).addScaledVector(sepTan, -2.5 * d).addScaledVector(down, 8 * d * d);
  craftQuaternion(SEP, sepQuat);
  quat.copy(sepQuat).multiply(tumble.setFromAxisAngle(X, 55 * D2R * d));
  return p < 0.44;
}

// ── Stations ─────────────────────────────────────────────────────────────
export const stationNormal = (k: number, out = new Vector3()) => {
  const th = STATIONS[k].theta * D2R;
  const ph = STATION_LAT * D2R;
  return out.set(Math.sin(th) * Math.cos(ph), Math.cos(th) * Math.cos(ph), Math.sin(ph));
};

// ── The suborbital ghost ─────────────────────────────────────────────────
const GHOST_H = new Vector3(Math.cos(14 * D2R), 0, Math.sin(14 * D2R));
export function ghostPoint(u: number, out = new Vector3()) {
  const ph = 16 * D2R * u;
  const alt = 2.6 * 4 * u * (1 - u);
  return out
    .set(0, 0, 0)
    .addScaledVector(GHOST_H, Math.sin(ph))
    .addScaledVector(Y, Math.cos(ph))
    .multiplyScalar(R + 0.03 + alt)
    .add(C);
}
/** Unit tangent plane at the ghost's impact: along the arc and across it. */
export function ghostImpactFrame() {
  const ph = 16 * D2R;
  const n = new Vector3().addScaledVector(GHOST_H, Math.sin(ph)).addScaledVector(Y, Math.cos(ph));
  const along = new Vector3().addScaledVector(GHOST_H, Math.cos(ph)).addScaledVector(Y, -Math.sin(ph));
  const across = new Vector3().crossVectors(n, along);
  return { at: ghostPoint(1), n, along, across };
}

// ── Camera ───────────────────────────────────────────────────────────────
export type CameraPose = { position: Vector3; target: Vector3; d: number; fov: number; shift: number };
export const cameraPoseInit = (): CameraPose => ({ position: new Vector3(), target: new Vector3(), d: 1, fov: 22, shift: 0 });

const ca = new Vector3();
const cb = new Vector3();
const craftNow = new Vector3();
function keyTarget(key: CameraKey, craft: Vector3, out: Vector3) {
  const f = key[1];
  out.set(f ? f[0] : 0, f ? f[1] : 0, f ? f[2] : 0);
  return key[2] > 0 ? out.lerp(craft, key[2]) : out;
}
function place(out: CameraPose, d: number, az: number, el: number) {
  const [a, e] = [az * D2R, el * D2R];
  out.d = d;
  out.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(d).add(out.target);
  return out;
}

/** The camera as a pure function of p: eased between keys, targets can follow the craft. */
export function cameraPose(p: number, out: CameraPose) {
  const keys = CAMERA_KEYS;
  let i = 0;
  while (i < keys.length - 2 && p >= keys[i + 1][0]) i++;
  const [k0, k1] = [keys[i], keys[i + 1]];
  const t = eio(seg(p, k0[0], k1[0]));
  craftPosition(p, craftNow);
  keyTarget(k0, craftNow, ca);
  keyTarget(k1, craftNow, cb);
  out.target.lerpVectors(ca, cb, t);
  out.fov = lerp(k0[6], k1[6], t);
  out.shift = lerp(k0[7], k1[7], t);
  return place(out, Math.exp(lerp(Math.log(k0[3]), Math.log(k1[3]), t)), lerp(k0[4], k1[4], t), lerp(k0[5], k1[5], t));
}

/** A single fixed key (the still poses). */
export function cameraAt(key: CameraKey, out: CameraPose) {
  craftPosition(key[0], craftNow);
  keyTarget(key, craftNow, out.target);
  out.fov = key[6];
  out.shift = key[7];
  return place(out, key[3], key[4], key[5]);
}

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
