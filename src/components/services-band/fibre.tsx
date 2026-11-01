import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CurvePath,
  LineCurve3,
  QuadraticBezierCurve3,
  ShaderMaterial,
  Vector3,
  type Mesh,
} from "three";
import { colors } from "./kit";

// Floor channels: the connections run in a shallow channel cut into the floor, covered by a frosted glass
// strip flush with the surface and edged with brushed metal lips. Under the glass a soft green light glides
// from the source outward, and fine sparks race along it. Channels start under the hub's port modules and
// vanish under each station, so no cable ever crosses a piece.

/** A route as a smooth path on the floor: straight runs joined by rounded corners. */
export function routePath(points: [number, number, number][], round = 0.42) {
  const pts = points.map((p) => new Vector3(p[0], 0, p[2]));
  const path = new CurvePath<Vector3>();
  let from = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const corner = pts[i];
    const r = Math.min(
      round,
      corner.distanceTo(pts[i - 1]) / 2,
      corner.distanceTo(pts[i + 1]) / 2,
    );
    const a = corner
      .clone()
      .addScaledVector(pts[i - 1].clone().sub(corner).normalize(), r);
    const b = corner
      .clone()
      .addScaledVector(pts[i + 1].clone().sub(corner).normalize(), r);
    path.add(new LineCurve3(from, a));
    path.add(new QuadraticBezierCurve3(a, corner, b));
    from = b;
  }
  path.add(new LineCurve3(from, pts[pts.length - 1]));
  return path;
}

/** A flat strip `width` wide along the path, on the floor; uv.x runs along it (0..1), uv.y across. */
function stripGeometry(points: [number, number, number][], width: number) {
  const path = routePath(points, Math.max(0.3, width * 1.6));
  const length = path.getLength();
  const n = Math.max(2, Math.ceil(length * 30));
  const pos = new Float32Array((n + 1) * 6);
  const uv = new Float32Array((n + 1) * 4);
  const index: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = path.getPointAt(u);
    const t = path.getTangentAt(u);
    const side = new Vector3(-t.z, 0, t.x)
      .normalize()
      .multiplyScalar(width / 2);
    pos.set(
      [p.x - side.x, 0.004, p.z - side.z, p.x + side.x, 0.004, p.z + side.z],
      i * 6,
    );
    uv.set([u, 0, u, 1], i * 4);
    if (i < n) {
      const a = i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(index);
  return { geometry: g, length };
}

function channelMaterial(length: number) {
  const c = colors();
  return new ShaderMaterial({
    uniforms: {
      lit: { value: 1.02 },
      phase: { value: 0 },
      len: { value: length },
      metal: { value: new Color("#dcd9d0") },
      edge: { value: new Color(c.ink) },
      glass: { value: new Color("#e6ece5") },
      glow: { value: new Color("#5fd892") },
      core: { value: new Color(c.primary) },
    },
    side: 2,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float lit, phase, len;
      uniform vec3 metal, edge, glass, glow, core;
      varying vec2 vUv;
      void main() {
        float u = vUv.x;
        float v = vUv.y;
        float along = u * len;
        float m = min(v, 1.0 - v);
        float aw = fwidth(v) * 1.2;
        // Brushed metal lips either side, with fine hairlines at their outer and inner edges.
        float lip = 0.15;
        float inLip = 1.0 - smoothstep(lip - aw, lip, m);
        float outer = 1.0 - smoothstep(0.0, aw * 1.6, m);
        float inner = 1.0 - smoothstep(0.0, aw * 1.4, abs(m - lip));
        float brush = 0.97 + 0.03 * sin(along * 260.0);
        // Frosted glass in panels with fine joints; the light beneath it, up to how far it has reached.
        float fa = fwidth(along) * 1.5;
        float joint = 1.0 - smoothstep(0.0, fa, abs(fract(along / 1.2 + 0.5) - 0.5) * 1.2);
        float k = 1.0 - smoothstep(lit - 0.01, lit, u);
        float y = (v - 0.5) / (0.5 - lip);
        float bed = exp(-y * y * 2.2);
        vec3 col = mix(glass, glow, bed * k);
        // A bright fibre line down the middle once lit.
        col = mix(col, core, exp(-y * y * 60.0) * k * 0.9);
        // Sparks: soft bright heads with quick tails, two trains at different speeds.
        float a = fract(along * 0.35 - phase);
        float b = fract(along * 0.9 - phase * 1.7 + 0.37);
        float s = smoothstep(0.0, 0.02, a) * (1.0 - smoothstep(0.02, 0.22, a));
        float s2 = smoothstep(0.0, 0.03, b) * (1.0 - smoothstep(0.03, 0.12, b));
        float spark = max(s, s2 * 0.6) * k * exp(-y * y * 9.0);
        col = mix(col, vec3(0.86, 1.0, 0.92), spark * 0.9);
        col = mix(col, vec3(1.0), spark * exp(-y * y * 40.0) * 0.6);
        col *= 1.0 - joint * 0.07 * (1.0 - inLip);
        col = mix(col, metal * brush, inLip);
        col = mix(col, edge, max(outer, inner) * 0.55);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * A floor channel along `route` (only x and z are used). It runs on its own, not with scroll: always lit,
 * sparks flowing from the route's start while the band is in view (rendering pauses off screen).
 */
export function Channel({
  route,
  width = 0.32,
  speed = 2.4,
}: {
  route: [number, number, number][];
  width?: number;
  speed?: number;
}) {
  const { geometry, material } = useMemo(() => {
    const strip = stripGeometry(route, width);
    return {
      geometry: strip.geometry,
      material: channelMaterial(strip.length),
    };
  }, [route, width]);
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    const m = mesh.current?.material as ShaderMaterial | undefined;
    if (!m) return;
    m.uniforms.phase.value += Math.min(delta, 1 / 30) * speed;
  });
  return (
    <mesh ref={mesh} geometry={geometry} material={material} renderOrder={-1} />
  );
}

/** A short run inside a station: a slimmer channel. */
export function Fibre({ route }: { route: [number, number, number][] }) {
  return <Channel route={route} width={0.2} speed={2.8} />;
}

/** Height station-local routes are given (ignored by the channel, which always sits in the floor). */
export const LOCAL = { r: 0.012 };
