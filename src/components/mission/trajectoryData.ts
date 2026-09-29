import { Vector3 } from "three";
import { R, R0, turn } from "./timeline";
import { C, craftPosition, ghostPoint, polar } from "./world";

// Sampled paths for the line system (orbit space, built once). Every flown sample keeps its p, so a
// line reveals up to the craft by counting samples with p ≤ now, and its θ and radial direction, so
// the per-frame lap and depth fades are cheap.

/** The traced craft point from the surface on: the orbit-space gravity turn before .40 (also for p < CUT_P), the orbit after. */
export function orbitPoint(p: number, out = new Vector3()) {
  if (p < 0.4) {
    const t = turn(p);
    return polar(t.theta, t.r, out);
  }
  return craftPosition(p, out);
}

export type Path = { pts: Vector3[]; p: Float32Array; theta: Float32Array; radial: Vector3[] };

/** Samples [from, to] with a sample every `step` world units along the path (fine base stepping, arc-length kept). */
export function samplePath(from: number, to: number, step: number, startAtSurface = false): Path {
  const pts: Vector3[] = [];
  const ps: number[] = [];
  const add = (v: Vector3, p: number) => {
    pts.push(v);
    ps.push(p);
  };
  if (startAtSurface) add(polar(0, R + 0.02), from); // the trace leaves the pad itself
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
  return { pts, p: new Float32Array(ps), theta, radial };
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

/** The parking orbit at R0, a full ring. */
export const ringPoints = () => Array.from({ length: 721 }, (_, i) => polar(i / 2, R0));
/** The suborbital launch spike. */
export const ghostPoints = () => Array.from({ length: 120 }, (_, i) => ghostPoint(i / 119));
