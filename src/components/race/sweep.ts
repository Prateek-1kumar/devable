import { BufferAttribute, BufferGeometry } from "three";
import { START, normalAt, ovalAt, type P3 } from "./track";

// Strips and boxes swept around the oval. Indices are step-major (every face of
// step i before step i + 1), so a draw range reveals exactly along the path.

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
  /** Vertex color by station, for `vertexColors` materials. */
  color?: (u: number) => [number, number, number];
};

export function sweep({ from, to, steps, inner, outer, y0 = 0, y1, box = false, color }: Sweep) {
  const rows = box ? 6 : 2; // vertices per sample
  const per = box ? 18 : 6; // indices per step
  const n = steps + 1;
  const pos = new Float32Array(n * rows * 3);
  const nor = new Float32Array(n * rows * 3);
  const uv = new Float32Array(n * rows * 2);
  const col = color ? new Float32Array(n * rows * 3) : null;
  const a: P3 = { x: 0, y: 0, z: 0 };
  const b: P3 = { x: 0, y: 0, z: 0 };
  const nr: P3 = { x: 0, y: 0, z: 0 };
  let v = 0;
  const put = (p: P3, y: number, nx: number, ny: number, nz: number, s: number, t: number, c: [number, number, number] | null) => {
    pos.set([p.x, y, p.z], v * 3);
    nor.set([nx, ny, nz], v * 3);
    uv.set([s, t], v * 2);
    if (col && c) col.set(c, v * 3);
    v++;
  };
  for (let i = 0; i < n; i++) {
    const s = i / steps;
    const u = from + (to - from) * s;
    ovalAt(u, inner, a);
    ovalAt(u, outer, b);
    normalAt(u, nr);
    const c = color ? color(u) : null;
    put(a, y1, 0, 1, 0, s, 0, c);
    put(b, y1, 0, 1, 0, s, 1, c);
    if (box) {
      put(a, y1, -nr.x, 0, -nr.z, s, 0, c);
      put(a, y0, -nr.x, 0, -nr.z, s, 1, c);
      put(b, y1, nr.x, 0, nr.z, s, 0, c);
      put(b, y0, nr.x, 0, nr.z, s, 1, c);
    }
  }
  // Each quad is wound so its face normal agrees with its vertex normal.
  const index = new Uint32Array(steps * per);
  let k = 0;
  const quad = (q0: number, q1: number, q2: number, q3: number) => {
    // q0,q1 at sample i; q2,q3 the same rows at sample i + 1.
    const e1 = [pos[q1 * 3] - pos[q0 * 3], pos[q1 * 3 + 1] - pos[q0 * 3 + 1], pos[q1 * 3 + 2] - pos[q0 * 3 + 2]];
    const e2 = [pos[q2 * 3] - pos[q0 * 3], pos[q2 * 3 + 1] - pos[q0 * 3 + 1], pos[q2 * 3 + 2] - pos[q0 * 3 + 2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1];
    const cy = e1[2] * e2[0] - e1[0] * e2[2];
    const cz = e1[0] * e2[1] - e1[1] * e2[0];
    const flip = cx * nor[q0 * 3] + cy * nor[q0 * 3 + 1] + cz * nor[q0 * 3 + 2] < 0;
    const tri = flip ? [q0, q2, q1, q1, q2, q3] : [q0, q1, q2, q2, q1, q3];
    index.set(tri, k);
    k += 6;
  };
  for (let i = 0; i < steps; i++) {
    const r = i * rows;
    const s = r + rows;
    quad(r, r + 1, s, s + 1);
    if (box) {
      quad(r + 2, r + 3, s + 2, s + 3);
      quad(r + 4, r + 5, s + 4, s + 5);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("normal", new BufferAttribute(nor, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  if (col) g.setAttribute("color", new BufferAttribute(col, 3));
  g.setIndex(new BufferAttribute(index, 1));
  g.userData = { steps, per };
  g.computeBoundingSphere();
  return g;
}

/** Two laps of strip from the start line (strip coordinate = run R ∈ [0, 2]), so a trailing window [R − len, R] never wraps. */
export const twoLap = (r: number, width: number, y: number, color?: (u: number) => [number, number, number]) =>
  sweep({ from: START, to: START + 2, steps: 1024, inner: r - width / 2, outer: r + width / 2, y1: y, color });

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
