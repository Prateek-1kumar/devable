import { Vector3 } from "three";
import { MODULE_Y0, R, R0, seg, smooth, turn, VEHICLE_BASE } from "./timeline";
import { C, craftPosition, ghostPoint, polar } from "./world";

// Sampled paths for the line system (orbit space, built once). Every flown sample keeps its p, so a
// line reveals up to the craft by counting samples with p ≤ now, and its θ and radial direction, so
// the per-frame lap and depth fades are cheap.

/** Craft point → engine exit in orbit space (the vehicle at 0.18). */
export const ENGINE = (MODULE_Y0 - VEHICLE_BASE) * 0.18;
/** How much of that offset applies: the whole launcher until insertion, none once the satellite flies alone. */
export const engineShare = (p: number) => 1 - smooth(seg(p, 0.4, 0.45));

/** The traced craft point from the surface on: the orbit-space gravity turn before .40 (also for p < CUT_P), the orbit after. */
export function orbitPoint(p: number, out = new Vector3()) {
  if (p < 0.4) {
    const t = turn(p);
    return polar(t.theta, t.r, out);
  }
  return craftPosition(p, out);
}

/** Samples with their p, θ (unwrapped), radial direction and cumulative arc length. */
export type Path = { pts: Vector3[]; p: Float32Array; theta: Float32Array; radial: Vector3[]; s: Float32Array };

/** Samples [from, to] with a sample every `step` world units along the path (fine base stepping, arc-length kept). */
export function samplePath(from: number, to: number, step: number, fromSurface = false): Path {
  const pts: Vector3[] = [];
  const ps: number[] = [];
  const add = (v: Vector3, p: number) => {
    pts.push(v);
    ps.push(p);
  };
  if (fromSurface) add(polar(0, R + 0.01), from); // the trace leaves the pad itself, straight up
  const base = 0.00002;
  let last = orbitPoint(from);
  add(last.clone(), from);
  const v = new Vector3();
  for (let p = from + base; p <= to; p += base) {
    orbitPoint(p, v);
    if (v.distanceTo(last) >= step) {
      last = v.clone();
      add(last, p);
    }
  }
  if (ps[ps.length - 1] < to) add(orbitPoint(to), to);
  const theta = new Float32Array(pts.length);
  const radial = pts.map((q, i) => {
    const r = q.clone().sub(C);
    theta[i] = (Math.atan2(r.x, r.y) * 180) / Math.PI;
    return r.normalize();
  });
  // Unwrap θ (it runs past 1000° by the end).
  for (let i = 1; i < theta.length; i++) while (theta[i] < theta[i - 1] - 180) theta[i] += 360;
  const s = new Float32Array(pts.length);
  for (let i = 1; i < pts.length; i++) s[i] = s[i - 1] + pts[i].distanceTo(pts[i - 1]);
  return { pts, p: new Float32Array(ps), theta, radial, s };
}

/** How many samples have p ≤ now (binary search). */
export function countUpTo(ps: Float32Array, now: number) {
  let [lo, hi] = [0, ps.length];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ps[mid] <= now) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Arc length along a path at p (linear between samples). */
export function lengthAt(path: Path, p: number) {
  const i = countUpTo(path.p, p);
  if (i <= 0) return 0;
  if (i >= path.p.length) return path.s[path.s.length - 1];
  const t = (p - path.p[i - 1]) / Math.max(1e-9, path.p[i] - path.p[i - 1]);
  return path.s[i - 1] + (path.s[i] - path.s[i - 1]) * t;
}

/** The point at arc length s along a path (linear between samples). */
export function pointAtLength(path: Path, s: number, out: Vector3) {
  const i = Math.min(path.s.length - 1, Math.max(1, countUpTo(path.s, s)));
  const t = Math.min(1, Math.max(0, (s - path.s[i - 1]) / Math.max(1e-9, path.s[i] - path.s[i - 1])));
  return out.lerpVectors(path.pts[i - 1], path.pts[i], t);
}

/** The parking orbit at R0, a full ring. */
export const ringPoints = () => Array.from({ length: 721 }, (_, i) => polar(i / 2, R0));
/** The suborbital launch spike. */
export const ghostPoints = () => Array.from({ length: 120 }, (_, i) => ghostPoint(i / 119));
