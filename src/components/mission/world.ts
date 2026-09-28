import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import {
  aim,
  CAMERA_KEYS,
  craftTheta,
  CUT_P,
  EARTH_ROWS,
  eio,
  explodeModule,
  geo,
  lerp,
  MODULE_Y0,
  padRise,
  R,
  radius,
  seg,
  STATIONS,
  SUN_ORBIT,
  SUN_PAD,
  theta,
  turn,
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
export const PAD_TOP = 0.03;
export const BELL_Y = 0.09;
export const PSI = 22.5; // vehicle yaw on the pad: the D faces 7.5° left of the camera
export const TOWER = new Vector3(-1.4, 0, -0.25);


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
  if (p < 0.125) return out.set(0, MODULE_Y0 + 0.16 * explodeModule(p), 0);
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

/** The camera as a pure function of p: eased between keys, targets can follow the craft. */
export function cameraPose(p: number, out: CameraPose) {
  const keys = CAMERA_KEYS;
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
  return place(out, p, d, lerp(k0[4], k1[4], t), lerp(k0[5], k1[5], t), lerp(k0[2], k1[2], t), lerp(k0[8], k1[8], t));
}

/** A single fixed key (the still poses). */
export function cameraAt(key: CameraKey, out: CameraPose) {
  const p = key[0];
  craftFrame(p);
  keyTarget(key, out.target);
  out.fov = key[6];
  out.shift = key[7];
  return place(out, p, keyDist(key, vehicleScale(p)), key[4], key[5], key[2], key[8]);
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

// ── Dev self-check ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const cape = geoNormal(28.5, -80.6);
  console.assert(cape.distanceTo(Y) < 1e-6, "mission: EARTH_ROT must put the Cape at +Y", cape);
  const pole = Y.clone().applyQuaternion(EARTH_ROT);
  console.assert(pole.distanceTo(POLE) < 1e-6, "mission: EARTH_ROT must map north to POLE", pole);
}
