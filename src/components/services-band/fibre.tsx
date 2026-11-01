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
import { BEATS } from "./content";
import { colors, useBand } from "./kit";

// Floor traces: every connection is a shallow groove engraved in the floor, ruled with hairlines like a circuit
// trace, with short green packets running along it. Traces start under the hub's ports and vanish under each
// station, so none ever crosses a piece.

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
      phase: { value: 0 },
      len: { value: length },
      groove: { value: new Color("#efede7") },
      edge: { value: new Color(c.ink) },
      packet: { value: new Color(c.primary) },
      head: { value: new Color(c.ink) },
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
      uniform float phase, len;
      uniform vec3 groove, edge, packet, head;
      varying vec2 vUv;
      // Spacing between packets and each packet's length, in world units.
      const float GAP = 3.4;
      const float LEN = 0.42;
      void main() {
        float v = vUv.y;
        float along = vUv.x * len;
        float aw = fwidth(v);
        float m = min(v, 1.0 - v);
        // The groove: a shade under the floor, cut by a crisp one-pixel rule on each side.
        vec3 col = groove;
        float rim = 1.0 - smoothstep(aw * 0.6, aw * 1.6, m);
        col = mix(col, edge, rim * 0.32);
        // A packet: a short solid dash down the middle with a darker leading tick. No glow.
        float fa = fwidth(along);
        float d = fract(along / GAP - phase) * GAP;
        float body = smoothstep(0.0, fa, d) * (1.0 - smoothstep(LEN - fa, LEN, d));
        float tip = smoothstep(LEN - 0.07 - fa, LEN - 0.07, d) * body;
        float lane = 1.0 - smoothstep(0.2 - aw, 0.2 + aw, abs(v - 0.5));
        col = mix(col, packet, body * lane);
        col = mix(col, head, tip * lane * 0.55);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * A trace engraved in the floor along `route` (only x and z are used): a shallow groove with hairline rules, and
 * short green packets running from the route's start while the band is in view (rendering pauses off screen).
 * At the closing beat the packets run home, back toward the hub.
 */
export function Channel({
  route,
  width = 0.18,
  speed = 0.34,
}: {
  route: [number, number, number][];
  width?: number;
  speed?: number;
}) {
  const bandRef = useBand();
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
    const home = bandRef.current > BEATS.length - 1.5 ? -1 : 1;
    m.uniforms.phase.value += Math.min(delta, 1 / 30) * speed * home;
  });
  return (
    <mesh ref={mesh} geometry={geometry} material={material} renderOrder={-1} />
  );
}

/** A short run inside a station: a slimmer channel. */
export function Fibre({ route }: { route: [number, number, number][] }) {
  return <Channel route={route} width={0.12} speed={0.4} />;
}

/** Height station-local routes are given (ignored by the channel, which always sits in the floor). */
export const LOCAL = { r: 0.012 };
