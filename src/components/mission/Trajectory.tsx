import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, Color, Quaternion, Vector3, type Group, type Mesh } from "three";
import type { Line2 } from "three-stdlib";
import { glowFromWithin } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { clamp01, R0, seg, windowed } from "./timeline";
import { craftPosition, ghostImpactFrame, ghostPoint, polar } from "./world";

// The paths (the exhaust trail off the pad lives in the pad set): the dashed plan, the forest flown path,
// the thickening colour tube of the compounding orbit, and the coral
// suborbital "launch spike" ghost that falls back to the ground.

const TRAIL_TOP = 1.4;
// The flown path in two pieces: everything up to the end of the first contact lap, and
// the current lap, so the first can step aside while the correction dips below the plan.
const FLOWN = { from: 0.125, to: 0.745, n: 1030 };
const LAP = { from: 0.745, to: 0.85, n: 260 };
const SPIRAL = { from: 0.85, to: 0.97, n: 400, radial: 12 };
const GRADIENT = ["#4f46e5", "#0ea5e9", "#10b981", "#f5b301"].map((c) => new Color(c));
const FOREST = new Color("#0c3b29");
const AMBER = new Color("#fcb401");
const CORAL = "#ec544b";
/** Spiral tube radius along its length: thin where the orbit starts, thick where it has compounded. */
const tubeR = (u: number) => 0.1 + 0.4 * u ** 1.6;

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

/** Reveals the first `n` segments of a Line2; hides it when there are none. */
function reveal(line: Line2 | null, n: number) {
  if (!line) return;
  const count = Math.max(0, Math.floor(n));
  line.visible = count > 0;
  line.geometry.instanceCount = count;
}

export default function Trajectory() {
  const frame = useMission();
  const plan = useRef<Line2>(null);
  const flown = useRef<Line2>(null);
  const lap = useRef<Line2>(null);
  const spiral = useRef<Mesh>(null);
  const head = useRef<Mesh>(null);
  const ghost = useRef<Line2>(null);
  const cross = useRef<Line2>(null);
  const scorch = useRef<Group>(null);

  const planPts = useMemo(
    () => [new Vector3(0, TRAIL_TOP, 0), ...samples(0.125, 0.4, 100), ...Array.from({ length: 361 }, (_, i) => polar(22 + i, R0))],
    [],
  );
  const flownPts = useMemo(() => [new Vector3(0, TRAIL_TOP, 0), ...samples(FLOWN.from, FLOWN.to, FLOWN.n)], []);
  const lapPts = useMemo(() => samples(LAP.from, LAP.to, LAP.n), []);
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

    // Plan: the ascent, then the arc to orbit, then (after the pull-back) the whole ring.
    reveal(plan.current, p < 0.26 ? 0 : 101 * seg(p, 0.26, 0.3) + 48 * seg(p, 0.3, 0.4) + 312 * seg(p, 0.6, 0.66));
    dash(plan.current);

    // Flown path: its head is the craft.
    reveal(flown.current, p <= FLOWN.from ? 0 : 1 + (FLOWN.n - 1) * seg(p, FLOWN.from, FLOWN.to));
    reveal(lap.current, (LAP.n - 1) * seg(p, LAP.from, LAP.to));
    // Below plan, the current lap turns amber in proportion to the residual, and returns to forest with the burn.
    // (Eased, so the lap reads amber early instead of passing through a muddy olive.)
    const off = p >= 0.785 && p < 0.85 ? clamp01((R0 - frame.r) / 0.45) : 0;
    if (lap.current) lap.current.material.color.lerpColors(FOREST, AMBER, off * off * (3 - 2 * off));
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
    fadeTo(plan.current, recede * retire);

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
      <Line ref={plan} points={planPts} color="#a9b3ad" lineWidth={1} renderOrder={1} depthWrite={false} transparent dashed dashSize={0.05} gapSize={0.04} />
      <Line ref={flown} points={flownPts} color="#0c3b29" lineWidth={1.5} renderOrder={2} transparent />
      <Line ref={lap} points={lapPts} color="#0c3b29" lineWidth={1.5} renderOrder={2} transparent />
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
