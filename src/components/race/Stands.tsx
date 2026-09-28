import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { Color, Object3D, type InstancedMesh, type Material, type Mesh } from "three";
import { CHANNELS } from "../growth-engine/channels";
import { materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { store } from "./store";
import { drawTo, sweep } from "./sweep";
import { AMBER, SEAT, annotation, lapOf, pour, seatFill, waveAt } from "./timeline";
import {
  SECTIONS,
  START,
  STANDS_END,
  TIERS,
  TIER_DEPTH,
  TIER_TOP,
  frac,
  lengthOfStation,
  ovalAt,
  seatRow,
  sectionOf,
  stationOfLength,
  tangentAt,
  tierInner,
  yawAlong,
  type P3,
} from "./track";

// The stands, poured by the laps: a "J" around bend 1 and down the back straight.
// Tier n pours in right behind the formation during lap n, each taller than the
// last (×1.28), so the stadium itself compounds. Its cut end at the finish line
// is black poche, and that stepped outline is the growth curve (M0 → M12).
// Seats fill in each section's channel color with every pass; YouTube's section
// only spikes with the sprints.

const POCHE = "#16191d";
const EDGE = "#8a94a0";
const EMPTY = "#e6ebe6";
const AMBER_C = "#f5b301";
const STEPS = 240;
const SEAT_GAP = 0.12;
const AISLE = 0.07;
const LIFT = 0.035;

type Seats = { count: number; u: Float32Array; section: Uint8Array; rank: Float32Array; x: Float32Array; z: Float32Array; yaw: Float32Array; y: number };

/** Seats along tier i's row, by arc length, skipping the aisles at section boundaries (sorted by station). */
function layoutSeats(i: number): Seats {
  const R = seatRow(i);
  const total = Math.PI * R + 5.6;
  const n = Math.floor(total / SEAT_GAP);
  const gap = total / n;
  const aisles = SECTIONS.slice(1).map((s) => lengthOfStation(s.from, R));
  const keep: { u: number; s: number; x: number; z: number; yaw: number }[] = [];
  const p: P3 = { x: 0, y: 0, z: 0 };
  const t: P3 = { x: 0, y: 0, z: 0 };
  for (let j = 0; j < n; j++) {
    const len = (j + 0.5) * gap;
    if (aisles.some((a) => Math.abs(len - a) < AISLE)) continue;
    const u = stationOfLength(len, R);
    ovalAt(u, R, p);
    keep.push({ u, s: sectionOf(u), x: p.x, z: p.z, yaw: yawAlong(tangentAt(u, t)) });
  }
  const count = keep.length;
  const out: Seats = {
    count,
    u: new Float32Array(count),
    section: new Uint8Array(count),
    rank: new Float32Array(count),
    x: new Float32Array(count),
    z: new Float32Array(count),
    yaw: new Float32Array(count),
    y: TIER_TOP[i] + 0.015,
  };
  keep.forEach((k, j) => {
    out.u[j] = k.u;
    out.section[j] = k.s;
    out.rank[j] = frac(Math.sin(i * 91.7 + j * 12.9898) * 43758.5453);
    out.x[j] = k.x;
    out.z[j] = k.z;
    out.yaw[j] = k.yaw;
  });
  return out;
}

const SEAT_COLORS = SECTIONS.map((s) => new Color(CHANNELS[s.channel].color));

function Tier({ i, material }: { i: number; material: Material }) {
  const inner = tierInner(i);
  const top = TIER_TOP[i];
  const geometry = useMemo(() => sweep({ from: 0, to: STANDS_END, steps: STEPS, inner, outer: inner + TIER_DEPTH, y1: top, box: true }), [inner, top]);
  const seats = useMemo(() => layoutSeats(i), [i]);
  const body = useRef<Mesh>(null);
  const die = useRef<Mesh>(null);
  const cap = useRef<Mesh>(null);
  const seatMesh = useRef<InstancedMesh>(null);
  // Per-seat caches: the last color code written, and whether it was lifted by the wave.
  const cache = useRef<{ codes: Uint8Array; lifted: Uint8Array } | null>(null);
  const scratch = useRef({ o: new Object3D(), c: new Color(), empty: new Color(EMPTY), amber: new Color(AMBER_C), p: { x: 0, y: 0, z: 0 } as P3, t: { x: 0, y: 0, z: 0 } as P3 });

  const place = useCallback(
    (mesh: InstancedMesh, j: number, lift: number) => {
      const { o } = scratch.current;
      o.position.set(seats.x[j], seats.y + lift, seats.z[j]);
      o.rotation.set(0, seats.yaw[j], 0);
      o.updateMatrix();
      mesh.setMatrixAt(j, o.matrix);
    },
    [seats],
  );

  useLayoutEffect(() => {
    const mesh = seatMesh.current;
    if (!mesh) return;
    for (let j = 0; j < seats.count; j++) {
      place(mesh, j, 0);
      mesh.setColorAt(j, scratch.current.empty);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    cache.current = { codes: new Uint8Array(seats.count), lifted: new Uint8Array(seats.count) };
  }, [seats, place]);

  useFrame(() => {
    const p = store.p;
    const poured = pour(i, p);
    const shown = poured > 0;
    const g = body.current;
    if (g) {
      g.visible = shown;
      if (shown) {
        const end = drawTo(g.geometry, 0, poured / STANDS_END) * STANDS_END;
        const d = die.current;
        if (d) {
          // The die rides the pour front, capping the open end.
          const { p: at, t } = scratch.current;
          ovalAt(end, inner + TIER_DEPTH / 2, at, top / 2);
          tangentAt(end, t);
          d.position.set(at.x + t.x * 0.002, at.y, at.z + t.z * 0.002);
          d.rotation.set(0, Math.atan2(t.x, t.z), 0);
        }
      }
    }
    if (die.current) die.current.visible = shown;
    if (cap.current) cap.current.visible = shown;

    const mesh = seatMesh.current;
    const c = cache.current;
    if (!mesh || !c) return;
    let n = 0;
    while (n < seats.count && seats.u[n] <= poured) n++;
    mesh.count = n;
    if (n === 0) return;

    const lap = lapOf(p);
    const Ra = AMBER(p);
    const sigma = frac(START + Ra);
    const { c: color, empty, amber } = scratch.current;
    let recolor = false;
    let moved = false;
    for (let j = 0; j < n; j++) {
      const s = seats.section[j];
      const u = seats.u[j];
      const fill = seatFill(s, u, seats.rank[j], i, p, lap, Ra);
      const bump = waveAt(u, p, sigma);
      const level = Math.round(bump * 8);
      const code = fill * 9 + level;
      if (code !== c.codes[j]) {
        c.codes[j] = code;
        color.copy(fill === SEAT.empty ? empty : fill === SEAT.own ? SEAT_COLORS[s] : amber);
        if (level > 0) color.lerp(amber, (0.8 * level) / 8);
        mesh.setColorAt(j, color);
        recolor = true;
      }
      if (bump > 0 || c.lifted[j]) {
        place(mesh, j, LIFT * bump);
        c.lifted[j] = bump > 0 ? 1 : 0;
        moved = true;
      }
    }
    if (recolor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (moved) mesh.instanceMatrix.needsUpdate = true;
  });

  const poche = <meshBasicMaterial color={POCHE} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />;
  return (
    <group>
      <mesh ref={body} geometry={geometry} material={material} castShadow receiveShadow visible={i === 0}>
        <Outlines angle={0} thickness={1} color={EDGE} />
      </mesh>
      {/* The cut end at the finish line: together the caps draw the stepped growth curve. */}
      <mesh ref={cap} position={[2.798, top / 2, inner + TIER_DEPTH / 2]} rotation-y={-Math.PI / 2} visible={i === 0}>
        <planeGeometry args={[TIER_DEPTH, top]} />
        {poche}
      </mesh>
      <mesh ref={die} visible={i === 0}>
        <planeGeometry args={[TIER_DEPTH, top]} />
        {poche}
      </mesh>
      <instancedMesh ref={seatMesh} args={[undefined, undefined, seats.count]} frustumCulled={false} castShadow>
        <boxGeometry args={[0.05, 0.03, 0.045]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

// The section annotation on the cut face: a mint line over the step tops, M0 → M12.
const ANN = { w: 1024, h: 752, pxPerU: 700 / 1.34, height: 752 / (700 / 1.34) };
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const LABELS = ["M0", "M2", "M4", "M6", "M8", "M10", "M12"];

function curvePoints() {
  const pts = TIER_TOP.map((top, i) => [73 + 146.3 * i, ANN.h - top * ANN.pxPerU - 6] as const);
  // Catmull-Rom through the step tops, sampled, with cumulative length.
  const out: { x: number; y: number; d: number; knot: number }[] = [];
  let d = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(pts.length - 1, i + 2)]];
    for (let s = 0; s < 16; s++) {
      const t = s / 16;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, e: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t2 + (-a + 3 * b - 3 * c + e) * t3);
      const x = f(p0[0], p1[0], p2[0], p3[0]);
      const y = f(p0[1], p1[1], p2[1], p3[1]);
      const prev = out[out.length - 1];
      if (prev) d += Math.hypot(x - prev.x, y - prev.y);
      out.push({ x, y, d, knot: s === 0 ? i : -1 });
    }
  }
  const last = pts[pts.length - 1];
  const prev = out[out.length - 1];
  d += Math.hypot(last[0] - prev.x, last[1] - prev.y);
  out.push({ x: last[0], y: last[1], d, knot: pts.length - 1 });
  return out;
}

function Annotation() {
  const mesh = useRef<Mesh>(null);
  const view = useRef(annotation(store.p));
  const curve = useMemo(() => curvePoints(), []);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const k = view.current;
      if (k <= 0) return;
      const total = curve[curve.length - 1].d;
      const until = k * total;
      ctx.save();
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(curve[0].x, curve[0].y);
      for (let i = 1; i < curve.length; i++) {
        const a = curve[i - 1];
        const b = curve[i];
        if (b.d <= until) ctx.lineTo(b.x, b.y);
        else {
          const w = (until - a.d) / Math.max(1e-6, b.d - a.d);
          ctx.lineTo(a.x + (b.x - a.x) * w, a.y + (b.y - a.y) * w);
          break;
        }
      }
      ctx.stroke();
      // Month labels inside each black step, as the line reaches them.
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const q of curve) {
        if (q.knot < 0 || q.d > until + 1) continue;
        // Sized to the black step under it (the base step is shallow).
        const step = TIER_TOP[q.knot] * ANN.pxPerU;
        const size = Math.min(40, step * 0.62);
        ctx.font = `600 ${size.toFixed(0)}px ${MONO}`;
        ctx.fillText(LABELS[q.knot], q.x, q.y + 6 + Math.min(step / 2, 44));
      }
      if (k >= 1) {
        const top = curve[curve.length - 1];
        ctx.globalAlpha = 0.6;
        ctx.font = `500 20px ${MONO}`; // ~112px wide: fits the 146px top step
        ctx.letterSpacing = "2px";
        ctx.fillText("PIPELINE", top.x, top.y + 110);
      }
      ctx.restore();
    },
    [curve],
  );
  const tex = useCanvasTexture(ANN.w, ANN.h, draw);
  useFrame(() => {
    const k = annotation(store.p);
    if (mesh.current) mesh.current.visible = k > 0;
    if (k === view.current) return;
    view.current = k;
    tex.paint();
  });
  const inner = tierInner(0);
  const width = tierInner(TIERS - 1) + TIER_DEPTH - inner;
  return (
    <mesh ref={mesh} position={[2.796, ANN.height / 2, inner + width / 2]} rotation-y={-Math.PI / 2} visible={false}>
      <planeGeometry args={[width, ANN.height]} />
      <meshBasicMaterial map={tex.texture} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

export default function Stands() {
  // The stands' own glaze: the shared ceramic, lifted a little so shaded risers read as white card, not grey.
  const material = useMemo(() => {
    const c = materials().ceramic.clone();
    c.emissive.set("#ffffff");
    c.emissiveIntensity = 0.2;
    return c;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group>
      {TIER_TOP.map((_, i) => (
        <Tier key={i} i={i} material={material} />
      ))}
      <Annotation />
    </group>
  );
}
