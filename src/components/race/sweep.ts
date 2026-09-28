import { BufferAttribute, BufferGeometry } from "three";
import { START, normalAt, ovalAt, type P3 } from "./track";

// Strips, boxes and walls swept around the oval. Indices are step-major (every
// face of step i before step i + 1), so a draw range reveals exactly along the path.

type RGB = [number, number, number];
/** Which face a vertex belongs to: the top, or the inner / outer wall. */
export type Face = "top" | "in" | "out";
/**
 * Vertex color at station u; v is 0 on the inner edge and 1 on the outer, y the
 * vertex height, and face tells a tread's edge from the wall's top edge.
 */
export type Paint = (u: number, v: number, y: number, face: Face) => RGB;

type Sweep = {
  from: number;
  to: number;
  steps: number;
  inner: number;
  outer: number;
  y0?: number;
  y1: number;
  /** Top face plus inner and outer walls (hard edges, no end caps). */
  box?: boolean;
  color?: Paint;
};

/** Collects vertices and step-major quads, each wound so its face normal agrees with its vertex normal. */
function builder(n: number, rows: number, per: number, withColor: boolean) {
  const pos = new Float32Array(n * rows * 3);
  const nor = new Float32Array(n * rows * 3);
  const uv = new Float32Array(n * rows * 2);
  const col = withColor ? new Float32Array(n * rows * 3) : null;
  const index = new Uint32Array((n - 1) * per);
  let v = 0;
  let k = 0;
  return {
    put(p: P3, y: number, nx: number, ny: number, nz: number, s: number, t: number, c: RGB | null) {
      pos.set([p.x, y, p.z], v * 3);
      nor.set([nx, ny, nz], v * 3);
      uv.set([s, t], v * 2);
      if (col && c) col.set(c, v * 3);
      v++;
    },
    /** q0,q1 at sample i; q2,q3 the same rows at sample i + 1. */
    quad(q0: number, q1: number, q2: number, q3: number) {
      const e1 = [pos[q1 * 3] - pos[q0 * 3], pos[q1 * 3 + 1] - pos[q0 * 3 + 1], pos[q1 * 3 + 2] - pos[q0 * 3 + 2]];
      const e2 = [pos[q2 * 3] - pos[q0 * 3], pos[q2 * 3 + 1] - pos[q0 * 3 + 1], pos[q2 * 3 + 2] - pos[q0 * 3 + 2]];
      const cx = e1[1] * e2[2] - e1[2] * e2[1];
      const cy = e1[2] * e2[0] - e1[0] * e2[2];
      const cz = e1[0] * e2[1] - e1[1] * e2[0];
      const flip = cx * nor[q0 * 3] + cy * nor[q0 * 3 + 1] + cz * nor[q0 * 3 + 2] < 0;
      index.set(flip ? [q0, q2, q1, q1, q2, q3] : [q0, q1, q2, q2, q1, q3], k);
      k += 6;
    },
    geometry(steps: number) {
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(pos, 3));
      g.setAttribute("normal", new BufferAttribute(nor, 3));
      g.setAttribute("uv", new BufferAttribute(uv, 2));
      if (col) g.setAttribute("color", new BufferAttribute(col, 3));
      g.setIndex(new BufferAttribute(index, 1));
      g.userData = { steps, per };
      g.computeBoundingSphere();
      return g;
    },
  };
}

export function sweep({ from, to, steps, inner, outer, y0 = 0, y1, box = false, color }: Sweep) {
  const rows = box ? 6 : 2; // vertices per sample
  const b = builder(steps + 1, rows, box ? 18 : 6, !!color);
  const pa: P3 = { x: 0, y: 0, z: 0 };
  const pb: P3 = { x: 0, y: 0, z: 0 };
  const nr: P3 = { x: 0, y: 0, z: 0 };
  const c = (u: number, v: number, y: number, face: Face) => (color ? color(u, v, y, face) : null);
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const u = from + (to - from) * s;
    ovalAt(u, inner, pa);
    ovalAt(u, outer, pb);
    normalAt(u, nr);
    b.put(pa, y1, 0, 1, 0, s, 0, c(u, 0, y1, "top"));
    b.put(pb, y1, 0, 1, 0, s, 1, c(u, 1, y1, "top"));
    if (box) {
      b.put(pa, y1, -nr.x, 0, -nr.z, s, 0, c(u, 0, y1, "in"));
      b.put(pa, y0, -nr.x, 0, -nr.z, s, 1, c(u, 0, y0, "in"));
      b.put(pb, y1, nr.x, 0, nr.z, s, 0, c(u, 1, y1, "out"));
      b.put(pb, y0, nr.x, 0, nr.z, s, 1, c(u, 1, y0, "out"));
    }
  }
  for (let i = 0; i < steps; i++) {
    const r = i * rows;
    const q = r + rows;
    b.quad(r, r + 1, q, q + 1);
    if (box) {
      b.quad(r + 2, r + 3, q + 2, q + 3);
      b.quad(r + 4, r + 5, q + 4, q + 5);
    }
  }
  return b.geometry(steps);
}

type Wall = { from: number; to: number; steps: number; r: number; y0: number; y1: number; facing: "in" | "out"; color?: Paint };

/** A vertical strip at radius r, uv (s along, 0..1 up), facing the infield ("in") or away from it. */
export function wall({ from, to, steps, r, y0, y1, facing, color }: Wall) {
  const b = builder(steps + 1, 2, 6, !!color);
  const at: P3 = { x: 0, y: 0, z: 0 };
  const nr: P3 = { x: 0, y: 0, z: 0 };
  const sign = facing === "in" ? -1 : 1;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const u = from + (to - from) * s;
    ovalAt(u, r, at);
    normalAt(u, nr);
    const v = facing === "in" ? 0 : 1;
    b.put(at, y0, sign * nr.x, 0, sign * nr.z, s, 0, color ? color(u, v, y0, facing) : null);
    b.put(at, y1, sign * nr.x, 0, sign * nr.z, s, 1, color ? color(u, v, y1, facing) : null);
  }
  for (let i = 0; i < steps; i++) b.quad(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  return b.geometry(steps);
}

/** Two laps of strip (or box) from the start line (strip coordinate = run R ∈ [0, 2]), so a trailing window [R − len, R] never wraps. */
export const twoLap = (r: number, width: number, y1: number, opts: { y0?: number; box?: boolean; color?: Paint } = {}) =>
  sweep({ from: START, to: START + 2, steps: 1024, inner: r - width / 2, outer: r + width / 2, y1, ...opts });

/**
 * Draws only the window [a, b] of a swept strip, as fractions (0..1) of its own
 * length. Returns where the drawn part actually ends (quantized to whole steps),
 * so caps can sit exactly on the edge.
 */
export function drawTo(g: BufferGeometry, a: number, b: number) {
  const { steps, per } = g.userData as { steps: number; per: number };
  const first = Math.max(0, Math.min(steps, Math.floor(a * steps)));
  const last = Math.max(first, Math.min(steps, Math.round(b * steps)));
  g.setDrawRange(first * per, (last - first) * per);
  return last / steps;
}
