import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, CurvePath, LineCurve3, Object3D, QuadraticBezierCurve3, Quaternion, Vector3, type InstancedMesh } from "three";
import { MINT } from "./core-view";
import { FINISH } from "./Device";
import { ROUTES } from "./layout";

// The connectors as clear acrylic pipes lying on the ports' plane, locking into
// green collars at the device and at each card's edge. What travels inside
// tells the story:
//   product → engine    raw: mixed grey particles, uneven and a little restless
//   engine → channels   signal: even mint pulses in rhythm (it made sense of it)
//   engine → outcomes   growth: larger, denser mint (it compounds)
//   outcomes → product  learn: slow, pale returns that close the loop

const PIPE_R = 0.058;
const BEND_R = 0.22;

type V3 = readonly [number, number, number];
type Flow = "raw" | "signal" | "growth" | "learn";

const FLOWS: Record<Flow, { density: number; speed: number; size: [number, number]; colors: string[]; jitter: number; rail: string }> = {
  raw: { density: 6, speed: 0.32, size: [0.014, 0.03], colors: ["#9aa39e", "#6b7570", "#c3bfb5", "#3f4a44", "#b7c4bc"], jitter: 0.014, rail: "#cfd3cf" },
  signal: { density: 3.2, speed: 0.5, size: [0.026, 0.026], colors: [MINT], jitter: 0, rail: "#bfeedd" },
  growth: { density: 4.2, speed: 0.6, size: [0.032, 0.032], colors: [MINT, "#2bb673"], jitter: 0, rail: "#bfeedd" },
  learn: { density: 1.8, speed: 0.26, size: [0.018, 0.018], colors: ["#93d9b8"], jitter: 0, rail: "#d6eee3" },
};

const PIPES: { points: V3[]; flow: Flow }[] = [
  { points: ROUTES.in, flow: "raw" },
  ...ROUTES.channels.map((points) => ({ points, flow: "signal" as const })),
  { points: ROUTES.out, flow: "growth" },
  { points: ROUTES.loop, flow: "learn" },
];

/** A polyline with rounded bends, as a curve that can be sampled by length. */
function route(points: V3[]) {
  const v = points.map((p) => new Vector3(...p));
  const path = new CurvePath<Vector3>();
  let from = v[0];
  for (let i = 1; i < v.length - 1; i++) {
    const [a, b, c] = [v[i - 1], v[i], v[i + 1]];
    const r = Math.min(BEND_R, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const enter = b.clone().addScaledVector(a.clone().sub(b).normalize(), r);
    const leave = b.clone().addScaledVector(c.clone().sub(b).normalize(), r);
    path.add(new LineCurve3(from, enter));
    path.add(new QuadraticBezierCurve3(enter, b, leave));
    from = leave;
  }
  path.add(new LineCurve3(from, v[v.length - 1]));
  return path;
}

/** Seeded random, so the raw flow looks the same on every load. */
function random(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** A collar where a pipe locks in: green anodised sleeve with an aluminium lip. */
function Collar({ at, dir }: { at: Vector3; dir: Vector3 }) {
  const q = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir), [dir]);
  return (
    <group position={at} quaternion={q}>
      <mesh>
        <cylinderGeometry args={[PIPE_R * 1.6, PIPE_R * 1.6, 0.12, 32]} />
        <meshStandardMaterial {...FINISH.green} />
      </mesh>
      <mesh position-y={-0.07}>
        <cylinderGeometry args={[PIPE_R * 1.75, PIPE_R * 1.75, 0.025, 32]} />
        <meshStandardMaterial {...FINISH.aluminium} />
      </mesh>
    </group>
  );
}

/** What flows in one pipe: instanced particles placed along the curve each frame. */
function Packets({ curve, flow, seed, still }: { curve: CurvePath<Vector3>; flow: Flow; seed: number; still: boolean }) {
  const cfg = FLOWS[flow];
  const length = curve.getLength();
  const items = useMemo(() => {
    const rand = random(seed * 977 + 13);
    const count = Math.max(2, Math.round(length * cfg.density));
    return Array.from({ length: count }, (_, i) => ({
      // Raw particles are spaced unevenly; everything after the engine is in step.
      offset: flow === "raw" ? (i + (rand() - 0.5) * 0.8) / count : i / count,
      size: cfg.size[0] + (cfg.size[1] - cfg.size[0]) * rand(),
      color: new Color(cfg.colors[Math.floor(rand() * cfg.colors.length)]),
      phase: rand() * Math.PI * 2,
    }));
  }, [cfg, flow, length, seed]);

  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const point = useMemo(() => new Vector3(), []);

  const place = (t: number) => {
    const m = mesh.current;
    if (!m) return;
    items.forEach((p, i) => {
      const u = (((p.offset + (t * cfg.speed) / length) % 1) + 1) % 1;
      curve.getPointAt(u, point);
      if (cfg.jitter) point.y += Math.sin(t * 3 + p.phase) * cfg.jitter;
      // Fade in and out at the ends, so particles emerge from and vanish into the collars.
      const edge = Math.min(1, u / 0.04, (1 - u) / 0.04);
      dummy.position.copy(point);
      dummy.scale.setScalar(p.size * edge);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    items.forEach((p, i) => m.setColorAt(i, p.color));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    place(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  useFrame(({ clock }) => {
    if (!still) place(clock.elapsedTime);
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default function Pipes({ still }: { still: boolean }) {
  const pipes = useMemo(
    () =>
      PIPES.map(({ points, flow }) => {
        const curve = route(points);
        const start = curve.getPointAt(0);
        const end = curve.getPointAt(1);
        return { curve, flow, start, end, startDir: curve.getTangentAt(0), endDir: curve.getTangentAt(1) };
      }),
    [],
  );

  return (
    <group>
      {pipes.map(({ curve, flow, start, end, startDir, endDir }, i) => (
        <group key={i}>
          <Packets curve={curve} flow={flow} seed={i} still={still} />
          {/* A faint rail down the middle, then the clear tube over everything. */}
          <mesh renderOrder={1}>
            <tubeGeometry args={[curve, Math.ceil(curve.getLength() * 24), 0.006, 6, false]} />
            <meshBasicMaterial color={FLOWS[flow].rail} transparent opacity={0.7} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh renderOrder={2}>
            <tubeGeometry args={[curve, Math.ceil(curve.getLength() * 24), PIPE_R, 20, false]} />
            <meshPhysicalMaterial color="#e4ebe7" roughness={0.1} metalness={0} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <Collar at={start} dir={startDir} />
          <Collar at={end} dir={endDir.clone().negate()} />
        </group>
      ))}
    </group>
  );
}
