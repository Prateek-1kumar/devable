import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines } from "@react-three/drei";
import { Color, LineCurve3, TubeGeometry, Vector3, type Mesh } from "three";
import type { Line2 } from "three-stdlib";
import { palette } from "../growth-engine/palette";
import { useMission } from "./frame";
import { R0, seg, windowed } from "./timeline";
import { BELL_Y, craftPosition, ghostImpactFrame, ghostPoint, polar } from "./world";

// The paths: the contrail off the pad, the dashed plan, the solid flown path,
// the colour spiral of the compounding orbit, and the suborbital "launch
// spike" ghost that falls back to the ground.

const INK = "#16191d";
const TRAIL_TOP = 1.4;
const TRAIL_SEGS = 32;
const TRAIL_RADIAL = 24;
const FLOWN = { from: 0.125, to: 0.85, n: 1200 };
const SPIRAL = { from: 0.85, to: 0.97, n: 400 };
const GRADIENT = ["#4f46e5", "#0ea5e9", "#10b981", "#f5b301"].map((c) => new Color(c));

function contrail() {
  const g = new TubeGeometry(new LineCurve3(new Vector3(0, BELL_Y, 0), new Vector3(0, TRAIL_TOP, 0)), TRAIL_SEGS, 0.07, TRAIL_RADIAL, false);
  // Taper: wide where it billows off the pad, thin where the vehicle climbs out of it.
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const j = Math.floor(i / (TRAIL_RADIAL + 1));
    const k = 1 + 1.8 * (1 - j / TRAIL_SEGS) ** 2;
    pos.setX(i, pos.getX(i) * k);
    pos.setZ(i, pos.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

const samples = (from: number, to: number, n: number) => Array.from({ length: n }, (_, i) => craftPosition(from + ((to - from) * i) / (n - 1)));

/** Reveals the first `n` segments of a Line2; hides it when there are none. */
function reveal(line: Line2 | null, n: number) {
  if (!line) return;
  const count = Math.max(0, Math.floor(n));
  line.visible = count > 0;
  line.geometry.instanceCount = count;
}

export default function Trajectory() {
  const frame = useMission();
  const slate = palette().slate;
  const trail = useRef<Mesh>(null);
  const plan = useRef<Line2>(null);
  const flown = useRef<Line2>(null);
  const spiral = useRef<Line2>(null);
  const ghost = useRef<Line2>(null);
  const cross = useRef<Line2>(null);

  const trailGeometry = useMemo(() => contrail(), []);
  const planPts = useMemo(
    () => [new Vector3(0, TRAIL_TOP, 0), ...samples(0.125, 0.4, 100), ...Array.from({ length: 361 }, (_, i) => polar(22 + i, R0))],
    [],
  );
  const flownPts = useMemo(() => [new Vector3(0, TRAIL_TOP, 0), ...samples(FLOWN.from, FLOWN.to, FLOWN.n)], []);
  const spiralPts = useMemo(() => samples(SPIRAL.from, SPIRAL.to, SPIRAL.n), []);
  const spiralColors = useMemo(
    () =>
      spiralPts.map((_, i) => {
        const u = (i / (SPIRAL.n - 1)) * (GRADIENT.length - 1);
        const j = Math.min(GRADIENT.length - 2, Math.floor(u));
        return new Color().lerpColors(GRADIENT[j], GRADIENT[j + 1], u - j);
      }),
    [spiralPts],
  );
  const ghostPts = useMemo(() => Array.from({ length: 120 }, (_, i) => ghostPoint(i / 119)), []);
  const crossPts = useMemo(() => {
    const { at, along, across } = ghostImpactFrame();
    const d1 = along.clone().add(across).normalize().multiplyScalar(0.3);
    const d2 = along.clone().sub(across).normalize().multiplyScalar(0.3);
    return [at.clone().sub(d1), at.clone().add(d1), at.clone().sub(d2), at.clone().add(d2)];
  }, []);

  useLayoutEffect(() => {
    [plan, flown, spiral, ghost].forEach((l) => reveal(l.current, 0));
    if (cross.current) cross.current.visible = false;
  }, []);

  useFrame(() => {
    const p = frame.p;
    const dash = (l: Line2 | null) => {
      if (!l) return;
      l.material.dashSize = 0.0031 * frame.dist;
      l.material.gapSize = 0.0023 * frame.dist;
    };

    // Contrail: follows the bell up to its top, then dissipates from the ground up.
    const tr = trail.current;
    if (tr) {
      tr.visible = p >= 0.125 && p < 0.34;
      if (tr.visible) {
        const s = frame.scale;
        const bell = frame.craft.y - 2.01 * s; // bell exit, world y
        const k = Math.round(TRAIL_SEGS * Math.min(1, Math.max(0, (bell - BELL_Y) / (TRAIL_TOP - BELL_Y))));
        const j = Math.round(TRAIL_SEGS * seg(p, 0.27, 0.34));
        const per = TRAIL_RADIAL * 6;
        tr.geometry.setDrawRange(j * per, Math.max(0, k - j) * per);
        const widen = 1 + 0.6 * seg(p, 0.24, 0.34);
        tr.scale.set(widen, 1, widen);
      }
    }

    // Plan: the ascent, then the arc to orbit, then (after the pull-back) the whole ring.
    reveal(plan.current, p < 0.26 ? 0 : 101 * seg(p, 0.26, 0.3) + 48 * seg(p, 0.3, 0.4) + 312 * seg(p, 0.6, 0.66));
    dash(plan.current);

    // Flown path: its head is the craft.
    reveal(flown.current, p <= FLOWN.from ? 0 : 1 + (FLOWN.n - 1) * seg(p, FLOWN.from, FLOWN.to));
    // During the close-up the trail behind the craft would cut across the copy: it recedes, then returns with the pull-back.
    const recede = 1 - windowed(p, 0.425, 0.45, 0.565, 0.6);
    if (flown.current) flown.current.material.opacity = recede;
    if (plan.current) plan.current.material.opacity = recede;
    reveal(spiral.current, (SPIRAL.n - 1) * seg(p, SPIRAL.from, SPIRAL.to));

    // The launch spike: a suborbital arc that falls back, marked where it lands.
    const fade = 1 - seg(p, 0.56, 0.62);
    reveal(ghost.current, p < 0.3 || p >= 0.62 ? 0 : 119 * seg(p, 0.3, 0.37));
    if (ghost.current) ghost.current.material.opacity = 0.35 * fade;
    dash(ghost.current);
    if (cross.current) {
      cross.current.visible = p >= 0.37 && p < 0.62;
      cross.current.material.opacity = 0.6 * fade * windowed(p, 0.37, 0.375, 2, 3);
    }
  });

  return (
    <group>
      <mesh ref={trail} geometry={trailGeometry} visible={false}>
        <meshStandardMaterial color="#f7f8f6" roughness={1} emissive="#ffffff" emissiveIntensity={0.5} />
        <Outlines thickness={1} color={slate} angle={0} />
      </mesh>
      <Line ref={plan} points={planPts} color="#b9bdba" lineWidth={1} renderOrder={1} depthWrite={false} transparent dashed dashSize={0.05} gapSize={0.04} />
      <Line ref={flown} points={flownPts} color="#4a4f4c" lineWidth={1.25} renderOrder={2} transparent />
      <Line ref={spiral} points={spiralPts} vertexColors={spiralColors} lineWidth={2.4} renderOrder={3} />
      <Line ref={ghost} points={ghostPts} color={INK} lineWidth={1} dashed dashSize={0.05} gapSize={0.04} transparent opacity={0.35} />
      <Line ref={cross} points={crossPts} segments color={INK} lineWidth={1.25} transparent opacity={0} />
    </group>
  );
}
