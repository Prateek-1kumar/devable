import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, CurvePath, LineCurve3, QuadraticBezierCurve3, ShaderMaterial, TubeGeometry, Vector3, type Mesh } from "three";
import { mix } from "../growth-engine/palette";
import { colors, useBand } from "./kit";

// Fibre pipes: a glass tube with a green fibre down its middle that lights along its length and carries
// pulses of light. The hub's four long pipes and the short local runs inside stations share these.

/** A route as a smooth path: straight runs joined by rounded corners. */
export function routePath(points: [number, number, number][], round = 0.42) {
  const pts = points.map((p) => new Vector3(...p));
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

/** The glass shell: clear in the middle, softly inked toward its edges, like a tube seen side-on. */
export const shellMaterial = (line: string) =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { line: { value: new Color(line) } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 line;
      varying vec3 vN;
      void main() {
        float rim = 1.0 - abs(vN.z);
        float edge = smoothstep(0.62, 0.97, rim);
        vec3 col = mix(vec3(1.0), line, edge);
        gl_FragColor = vec4(col, mix(0.16, 0.95, edge));
        #include <colorspace_fragment>
      }`,
  });

/**
 * The fibre: pale until lit, then green up to how far the light has reached (`lit`, 0..1 along the pipe),
 * with brighter pulses travelling through it (`phase` moves them; it runs backwards to flow home).
 */
export const fibreMaterial = (on: string, off: string, glow: string, length: number) =>
  new ShaderMaterial({
    uniforms: {
      lit: { value: 0 },
      phase: { value: 0 },
      len: { value: length },
      on: { value: new Color(on) },
      off: { value: new Color(off) },
      glow: { value: new Color(glow) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float lit, phase, len;
      uniform vec3 on, off, glow;
      varying vec2 vUv;
      void main() {
        float x = vUv.x;
        float k = 1.0 - smoothstep(lit - 0.012, lit, x);
        float p = fract(x * len * 0.45 - phase);
        float pulse = smoothstep(0.0, 0.06, p) * (1.0 - smoothstep(0.06, 0.34, p));
        vec3 col = mix(off, on, k);
        col = mix(col, glow, pulse * k);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });

/** Pipe and fibre radii for the short runs inside a station (a touch slimmer than the hub's pipes). */
export const LOCAL = { r: 0.06, fibre: 0.024 };

/**
 * A short fibre run: `route` (station-local points, corners rounded); `lit(x)` says how far along it the light
 * has reached (0..1) at scroll position `x`. Pulses flow continuously once lit.
 */
export function Fibre({ route, lit, r = LOCAL.r, core = LOCAL.fibre }: { route: [number, number, number][]; lit: (x: number) => number; r?: number; core?: number }) {
  const bandRef = useBand();
  const c = colors();
  const pipe = useMemo(() => {
    const path = routePath(route, 0.3);
    const length = path.getLength();
    const segs = Math.ceil(length * 18);
    return {
      shell: new TubeGeometry(path, segs, r, 14, false),
      fibre: new TubeGeometry(path, segs, core, 10, false),
      material: fibreMaterial(mix(c.primary, c.ink, 0.22), "#e2e6df", mix(c.primary, "#ffffff", 0.45), length),
    };
  }, [route, r, core, c.primary, c.ink]);
  const shell = useMemo(() => shellMaterial(c.line), [c.line]);
  const phase = useRef(0);
  const core$ = useRef<Mesh>(null);
  useFrame((_, delta) => {
    const m = core$.current?.material as ShaderMaterial | undefined;
    if (!m) return;
    phase.current += Math.min(delta, 1 / 30) * 0.9;
    m.uniforms.lit.value = lit(bandRef.current);
    m.uniforms.phase.value = phase.current;
  });
  return (
    <group>
      <mesh ref={core$} geometry={pipe.fibre} material={pipe.material} />
      <mesh geometry={pipe.shell} material={shell} renderOrder={2} />
    </group>
  );
}
