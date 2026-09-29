import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, Color, LineCurve3, Quaternion, TubeGeometry, Vector3, type Group, type InterleavedBufferAttribute, type Mesh } from "three";
import type { Line2 } from "three-stdlib";
import { glowFromWithin } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { clamp01, craftTheta, R0, seg, windowed } from "./timeline";
import { BELL_Y, craftPosition, ghostImpactFrame, ghostPoint, polar } from "./world";

// The paths: the contrail off the pad, the faint dashed plan, the flown path
// (a graphite hairline that fades out behind the craft like a comet tail), the
// thickening colour tube of the compounding orbit, and the coral suborbital
// "launch spike" ghost that falls back to the ground.

const TRAIL_TOP = 1.4;
const TRAIL_SEGS = 32;
const TRAIL_RADIAL = 24;
// The flown path in two pieces: everything up to the end of the first contact lap, and
// the current lap, so the first can step aside while the correction dips below the plan.
const FLOWN = { from: 0.125, to: 0.745, n: 1030 };
const LAP = { from: 0.745, to: 0.85, n: 260 };
const SPIRAL = { from: 0.85, to: 0.97, n: 400, radial: 12 };
const GRADIENT = ["#4f46e5", "#0ea5e9", "#10b981", "#f5b301"].map((c) => new Color(c));
const INK = new Color("#2b3532");
/** Degrees of orbit behind the craft over which the flown path fades to nothing. */
const TAIL = 200;
/** The hairline's alpha right behind the craft. */
const TAIL_PEAK = 0.8;
const PLAN_OPACITY = 0.5;
const AMBER = new Color("#fcb401");
const CORAL = "#ec544b";
/** Spiral tube radius along its length: thin where the orbit starts, thick where it has compounded. */
const tubeR = (u: number) => 0.1 + 0.4 * u ** 1.6;

function contrail() {
  const g = new TubeGeometry(new LineCurve3(new Vector3(0, BELL_Y, 0), new Vector3(0, TRAIL_TOP, 0)), TRAIL_SEGS, 0.07, TRAIL_RADIAL, false);
  // Taper: wide where it billows off the pad, thin where the vehicle climbs out of it.
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 4);
  const [bottom, top, c] = [new Color("#ffffff"), new Color("#e8ecea"), new Color()];
  for (let i = 0; i < pos.count; i++) {
    const u = Math.floor(i / (TRAIL_RADIAL + 1)) / TRAIL_SEGS;
    const k = 1 + 1.8 * (1 - u) ** 2;
    pos.setX(i, pos.getX(i) * k);
    pos.setZ(i, pos.getZ(i) * k);
    c.lerpColors(bottom, top, u).toArray(colors, i * 4);
    colors[i * 4 + 3] = 0.95 * (1 - u) ** 1.2;
  }
  g.setAttribute("color", new BufferAttribute(colors, 4));
  g.computeVertexNormals();
  return g;
}

/** The orbit angle of every sample (plus the contrail top, at 0°, when `lead`). */
const thetasOf = ({ from, to, n }: { from: number; to: number; n: number }, lead: boolean) =>
  Float32Array.from([...(lead ? [0] : []), ...Array.from({ length: n }, (_, i) => craftTheta(from + ((to - from) * i) / (n - 1)))]);

const samples = (from: number, to: number, n: number) => Array.from({ length: n }, (_, i) => craftPosition(from + ((to - from) * i) / (n - 1)));

/** A tube through the spiral samples (one ring per sample, so its reveal matches the craft), tapered and colour-graded. */
function spiralTube(pts: Vector3[]) {
  const { radial } = SPIRAL;
  const n = pts.length;
  const pos = new Float32Array(n * (radial + 1) * 3);
  const col = new Float32Array(n * (radial + 1) * 3);
  const nor = new Float32Array(n * (radial + 1) * 3);
  const [t, b, off, c] = [new Vector3(), new Vector3(), new Vector3(), new Color()];
  const Z = new Vector3(0, 0, 1); // the mission plane is XY
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    t.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    b.crossVectors(t, Z).normalize();
    const g = u * (GRADIENT.length - 1);
    const j = Math.min(GRADIENT.length - 2, Math.floor(g));
    c.lerpColors(GRADIENT[j], GRADIENT[j + 1], g - j);
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      off.copy(Z).multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a));
      const at = (i * (radial + 1) + k) * 3;
      off.toArray(nor, at);
      off.multiplyScalar(tubeR(u)).add(pts[i]).toArray(pos, at);
      c.toArray(col, at);
    }
  }
  const index: number[] = [];
  for (let i = 0; i < n - 1; i++)
    for (let k = 0; k < radial; k++) {
      const a = i * (radial + 1) + k;
      const d = a + radial + 1;
      index.push(a, a + 1, d, d, a + 1, d + 1); // counter-clockwise seen from outside
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("normal", new BufferAttribute(nor, 3));
  g.setAttribute("color", new BufferAttribute(col, 3));
  g.setIndex(index);
  g.setDrawRange(0, 0);
  return g;
}

function drawScorch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(12,59,41,0.25)");
  g.addColorStop(1, "rgba(12,59,41,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** One white RGBA colour per point; the tail fade rewrites only the alphas. */
const white = (n: number) => Array.from({ length: n }, () => [1, 1, 1, 1] as [number, number, number, number]);

/**
 * Comet tail: each point's alpha falls from TAIL_PEAK at the craft to 0 at TAIL degrees behind it.
 * `thetas` are the points' orbit angles; the colour buffer holds one start and one end RGBA per segment.
 */
function fadeTail(line: Line2 | null, thetas: Float32Array, head: number) {
  if (!line) return;
  const attr = line.geometry.attributes.instanceColorStart as InterleavedBufferAttribute | undefined;
  if (!attr) return;
  const arr = attr.data.array as Float32Array;
  const a = (i: number) => {
    const k = clamp01(1 - (head - thetas[i]) / TAIL);
    return TAIL_PEAK * k * k;
  };
  for (let i = 0; i < thetas.length - 1; i++) {
    arr[i * 8 + 3] = a(i);
    arr[i * 8 + 7] = a(i + 1);
  }
  attr.data.needsUpdate = true;
}

/** Reveals the first `n` segments of a Line2; hides it when there are none. */
function reveal(line: Line2 | null, n: number) {
  if (!line) return;
  const count = Math.max(0, Math.floor(n));
  line.visible = count > 0;
  line.geometry.instanceCount = count;
}

export default function Trajectory() {
  const frame = useMission();
  const trail = useRef<Mesh>(null);
  const plan = useRef<Line2>(null);
  const flown = useRef<Line2>(null);
  const lap = useRef<Line2>(null);
  const spiral = useRef<Mesh>(null);
  const head = useRef<Mesh>(null);
  const ghost = useRef<Line2>(null);
  const cross = useRef<Line2>(null);
  const scorch = useRef<Group>(null);

  const trailGeometry = useMemo(() => contrail(), []);
  const planPts = useMemo(
    () => [new Vector3(0, TRAIL_TOP, 0), ...samples(0.125, 0.4, 100), ...Array.from({ length: 361 }, (_, i) => polar(22 + i, R0))],
    [],
  );
  const flownPts = useMemo(() => [new Vector3(0, TRAIL_TOP, 0), ...samples(FLOWN.from, FLOWN.to, FLOWN.n)], []);
  const lapPts = useMemo(() => samples(LAP.from, LAP.to, LAP.n), []);
  const flownThetas = useMemo(() => thetasOf(FLOWN, true), []);
  const lapThetas = useMemo(() => thetasOf(LAP, false), []);
  const flownColors = useMemo(() => white(flownPts.length), [flownPts]);
  const lapColors = useMemo(() => white(lapPts.length), [lapPts]);
  const tailHead = useRef(Number.NaN);
  const spiralPts = useMemo(() => samples(SPIRAL.from, SPIRAL.to, SPIRAL.n), []);
  const tube = useMemo(() => spiralTube(spiralPts), [spiralPts]);
  const ghostPts = useMemo(() => Array.from({ length: 120 }, (_, i) => ghostPoint(i / 119)), []);
  const impact = useMemo(() => {
    const { at, n, along, across } = ghostImpactFrame();
    const d1 = along.clone().add(across).normalize().multiplyScalar(0.3);
    const d2 = along.clone().sub(across).normalize().multiplyScalar(0.3);
    return {
      cross: [at.clone().sub(d1), at.clone().add(d1), at.clone().sub(d2), at.clone().add(d2)],
      at: at.clone().addScaledVector(n, 0.004),
      quat: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), n),
    };
  }, []);
  const scorchTex = useCanvasTexture(256, 256, drawScorch);

  useLayoutEffect(() => {
    [plan, flown, lap, ghost].forEach((l) => reveal(l.current, 0));
    if (cross.current) cross.current.visible = false;
  }, []);

  useFrame(() => {
    const p = frame.p;
    const dash = (l: Line2 | null) => {
      if (!l) return;
      l.material.dashSize = 0.0031 * frame.dist;
      l.material.gapSize = 0.0023 * frame.dist;
    };

    // Contrail: follows the bell up to its top, then thins away.
    const tr = trail.current;
    if (tr) {
      tr.visible = p >= 0.125 && p < 0.34;
      if (tr.visible) {
        const s = frame.scale;
        const bell = frame.craft.y - 2.01 * s; // bell exit, world y
        const k = Math.round(TRAIL_SEGS * Math.min(1, Math.max(0, (bell - BELL_Y) / (TRAIL_TOP - BELL_Y))));
        tr.geometry.setDrawRange(0, k * TRAIL_RADIAL * 6);
        const widen = (1 + 0.6 * seg(p, 0.24, 0.34)) * (1 - 0.97 * seg(p, 0.27, 0.34));
        tr.scale.set(widen, 1, widen);
      }
    }

    // Plan: the ascent, then the arc to orbit, then (after the pull-back) the whole ring.
    reveal(plan.current, p < 0.26 ? 0 : 101 * seg(p, 0.26, 0.3) + 48 * seg(p, 0.3, 0.4) + 312 * seg(p, 0.6, 0.66));
    dash(plan.current);

    // Flown path: its head is the craft.
    reveal(flown.current, p <= FLOWN.from ? 0 : 1 + (FLOWN.n - 1) * seg(p, FLOWN.from, FLOWN.to));
    reveal(lap.current, (LAP.n - 1) * seg(p, LAP.from, LAP.to));
    if (frame.theta !== tailHead.current) {
      tailHead.current = frame.theta;
      fadeTail(flown.current, flownThetas, frame.theta);
      fadeTail(lap.current, lapThetas, frame.theta);
    }
    if (flown.current) flown.current.material.color.copy(INK);
    // Below plan, the current lap turns amber in proportion to the residual, and returns to graphite with the burn.
    // (Eased, so the lap reads amber early instead of passing through a muddy olive.)
    const off = p >= 0.785 && p < 0.85 ? clamp01((R0 - frame.r) / 0.45) : 0;
    if (lap.current) lap.current.material.color.lerpColors(INK, AMBER, off * off * (3 - 2 * off));
    // During the close-up the trail behind the craft would cut across the copy: it recedes, then returns with the pull-back.
    const recede = 1 - windowed(p, 0.425, 0.45, 0.565, 0.6);
    // Through the correction the earlier laps step aside, so the dashed plan is the reference the current lap dips under.
    const earlier = recede * (1 - windowed(p, 0.75, 0.77, 0.85, 0.88));
    const fadeTo = (l: Line2 | null, o: number) => {
      if (!l) return;
      l.material.opacity = o;
      if (o < 0.001) l.visible = false; // fully faded lines still write depth: take them out of the pass
    };
    // Once the spiral tube takes over, the ink paths (flown, lap and the dashed plan) retire: the payoff is solid, not a line drawing.
    const retire = 1 - seg(p, 0.87, 0.93);
    fadeTo(flown.current, earlier * retire);
    fadeTo(lap.current, retire);
    fadeTo(plan.current, PLAN_OPACITY * recede * retire);

    // Spiral: the tube grows ring by ring behind the craft, a white bead at its head.
    const n = Math.floor((SPIRAL.n - 1) * seg(p, SPIRAL.from, SPIRAL.to));
    const sp = spiral.current;
    if (sp) {
      sp.visible = n > 0;
      sp.geometry.setDrawRange(0, n * SPIRAL.radial * 6);
    }
    const hd = head.current;
    if (hd) {
      hd.visible = n > 0 && p < 0.97;
      if (hd.visible) {
        hd.position.copy(spiralPts[n]);
        hd.scale.setScalar(1.6 * tubeR(n / (SPIRAL.n - 1)));
      }
    }

    // The launch spike: a suborbital arc that falls back, marked where it lands.
    const fade = 1 - seg(p, 0.56, 0.62);
    reveal(ghost.current, p < 0.3 || p >= 0.62 ? 0 : 119 * seg(p, 0.3, 0.37));
    if (ghost.current) ghost.current.material.opacity = 0.7 * fade;
    dash(ghost.current);
    const hit = fade * windowed(p, 0.37, 0.375, 2, 3);
    if (cross.current) {
      cross.current.visible = p >= 0.37 && p < 0.62;
      cross.current.material.opacity = 0.9 * hit;
    }
    if (scorch.current) {
      scorch.current.visible = p >= 0.37 && p < 0.62;
      scorch.current.scale.setScalar(Math.max(0.01, hit));
    }
  });

  return (
    <group>
      <mesh ref={trail} geometry={trailGeometry} visible={false}>
        <meshStandardMaterial vertexColors transparent depthWrite={false} roughness={1} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      <Line ref={plan} points={planPts} color="#b4bcb8" lineWidth={1} renderOrder={1} depthWrite={false} transparent dashed dashSize={0.05} gapSize={0.04} />
      <Line ref={flown} points={flownPts} vertexColors={flownColors} lineWidth={1.25} renderOrder={2} depthWrite={false} transparent />
      <Line ref={lap} points={lapPts} vertexColors={lapColors} lineWidth={1.25} renderOrder={2} depthWrite={false} transparent />
      <mesh ref={spiral} geometry={tube} visible={false} frustumCulled={false}>
        <meshPhysicalMaterial
          ref={(m) => {
            if (m) glowFromWithin(m);
          }}
          vertexColors
          color="#ffffff"
          roughness={0.3}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh ref={head} visible={false}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <Line ref={ghost} points={ghostPts} color={CORAL} lineWidth={1.25} dashed dashSize={0.05} gapSize={0.04} transparent opacity={0.7} />
      <Line ref={cross} points={impact.cross} segments color={CORAL} lineWidth={1.5} transparent opacity={0} />
      <group ref={scorch} position={impact.at} quaternion={impact.quat} visible={false}>
        <mesh>
          <circleGeometry args={[0.35, 48]} />
          <meshBasicMaterial map={scorchTex.texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>
    </group>
  );
}
