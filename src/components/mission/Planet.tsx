import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { BufferGeometry, Color, Float32BufferAttribute, Quaternion, Vector3, type Group, type LineBasicMaterial, type LineSegments, type Mesh, type MeshStandardMaterial, type ShadowMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { useMission } from "./frame";
import { eio, KARMAN, R, seg, windowed } from "./timeline";
import { AXIS, C, polar } from "./world";

// The ground and the planet. Until the ascent pulls back, the ground is page
// white, so only its drawing (a local grid) and the vehicle's shadow exist;
// then it shades into a porcelain planet with a graticule and an ink limb.

const INK = "#16191d";
const WHITE = new Color("#ffffff");
const PORCELAIN = new Color("#edf0ed");
const D2R = Math.PI / 180;

/** Lat/long lines about AXIS: parallels every `step`° and meridians every `step`°, sampled every `sample`°. */
function graticule(step: number, sample: number, r: number, maxLat: number, alpha?: (p: Vector3) => number) {
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), AXIS);
  const at = (lat: number, lon: number, out: Vector3) =>
    out
      .set(Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R))
      .applyQuaternion(q)
      .multiplyScalar(r)
      .add(C);
  const pos: number[] = [];
  const col: number[] = [];
  const [a, b] = [new Vector3(), new Vector3()];
  const push = () => {
    if (alpha) {
      const [ka, kb] = [alpha(a), alpha(b)];
      if (ka < 0.004 && kb < 0.004) return;
      col.push(0.086, 0.098, 0.114, ka, 0.086, 0.098, 0.114, kb);
    }
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };
  for (let lat = -maxLat; lat <= maxLat + 1e-6; lat += step)
    for (let lon = 0; lon < 360; lon += sample) {
      at(lat, lon, a);
      at(lat, lon + sample, b);
      push();
    }
  for (let lon = 0; lon < 360; lon += step)
    for (let lat = -90; lat < 90; lat += sample) {
      at(lat, lon, a);
      at(lat + sample, lon, b);
      push();
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  if (alpha) g.setAttribute("color", new Float32BufferAttribute(col, 4));
  return g;
}

export default function Planet() {
  const frame = useMission();
  const planet = useRef<MeshStandardMaterial>(null);
  const local = useRef<LineSegments>(null);
  const localMat = useRef<LineBasicMaterial>(null);
  const global = useRef<LineSegments>(null);
  const globalMat = useRef<LineBasicMaterial>(null);
  const limb = useRef<Group>(null);
  const limbLine = useRef<Line2>(null);
  const shadow = useRef<Mesh>(null);
  const shadowMat = useRef<ShadowMaterial>(null);
  const karman = useRef<Line2>(null);
  const scratch = useMemo(() => ({ dir: new Vector3() }), []);

  const localGrid = useMemo(() => graticule(2.5, 0.5, R + 0.01, 87.5, (v) => 0.2 * Math.exp(-((v.length() / 2.4) ** 2))), []);
  const globalGrid = useMemo(() => graticule(15, 1, R + 0.02, 75), []);
  const circle = useMemo(() => Array.from({ length: 129 }, (_, i) => [Math.cos((i / 128) * Math.PI * 2), Math.sin((i / 128) * Math.PI * 2), 0] as [number, number, number]), []);
  const karmanPts = useMemo(() => Array.from({ length: 128 }, (_, i) => polar(-20 + (90 * i) / 127, KARMAN)), []);

  useFrame((state) => {
    const p = frame.p;
    const k = eio(seg(p, 0.28, 0.4));
    const m = planet.current;
    if (m) {
      m.color.lerpColors(WHITE, PORCELAIN, k);
      m.emissive.lerpColors(WHITE, PORCELAIN, k);
      m.emissiveIntensity = 1.4 + (0.34 - 1.4) * k;
    }
    if (local.current && localMat.current) {
      local.current.visible = p < 0.4;
      localMat.current.opacity = 1 - seg(p, 0.3, 0.4);
    }
    if (global.current && globalMat.current) {
      global.current.visible = p >= 0.3;
      globalMat.current.opacity = 0.085 * seg(p, 0.3, 0.42);
    }
    // The limb: the silhouette circle where the view cone touches the sphere.
    const g = limb.current;
    if (g) {
      g.visible = p >= 0.28;
      if (g.visible) {
        const cam = state.camera.position;
        const { dir } = scratch;
        dir.subVectors(cam, C);
        const D = dir.length();
        dir.divideScalar(D);
        g.position.copy(C).addScaledVector(dir, (R * R) / D);
        g.scale.setScalar(R * Math.sqrt(Math.max(0, 1 - (R / D) ** 2)) * 1.0015);
        g.lookAt(cam);
        if (limbLine.current) limbLine.current.material.opacity = 0.55 * k;
      }
    }
    if (shadow.current && shadowMat.current) {
      shadow.current.visible = p < 0.26;
      shadowMat.current.opacity = 0.16 * (1 - seg(p, 0.2, 0.26));
    }
    const ka = karman.current;
    if (ka) {
      const o = 0.3 * windowed(p, 0.22, 0.27, 0.5, 0.56);
      ka.visible = o > 0.001;
      ka.material.opacity = o;
      ka.material.dashSize = 0.0031 * frame.dist;
      ka.material.gapSize = 0.0023 * frame.dist;
    }
  });

  return (
    <group>
      <mesh position={C}>
        <sphereGeometry args={[R, 128, 96]} />
        <meshStandardMaterial ref={planet} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} roughness={0.7} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments ref={local} geometry={localGrid}>
        <lineBasicMaterial ref={localMat} vertexColors transparent depthWrite={false} />
      </lineSegments>
      <lineSegments ref={global} geometry={globalGrid} visible={false}>
        <lineBasicMaterial ref={globalMat} color={INK} transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <group ref={limb} visible={false}>
        <Line ref={limbLine} points={circle} color={INK} lineWidth={1} transparent opacity={0} />
      </group>
      {/* Shadow catcher: only the pad area, so the vehicle's shadow falls on page white. */}
      <mesh ref={shadow} position={C} receiveShadow>
        <sphereGeometry args={[R + 0.004, 96, 16, 0, Math.PI * 2, 0, 0.24]} />
        <shadowMaterial ref={shadowMat} transparent opacity={0.16} color="#16191d" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} depthWrite={false} />
      </mesh>
      <Line ref={karman} points={karmanPts} color={INK} lineWidth={1} dashed dashSize={0.05} gapSize={0.035} transparent opacity={0} />
    </group>
  );
}
