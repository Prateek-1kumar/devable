import { forwardRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { AdditiveBlending, Color, NormalBlending, type Points, type ShaderMaterial } from "three";

// A screen-space marker: a crisp disc or 1 px ring of a fixed pixel size, depth-tested so the Earth
// hides it, never writing depth. Drive `uSize` (css px), `uOpacity` and `uColor` through the material.

const vertex = /* glsl */ `
uniform float uSize, uDpr;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (uSize + 2.0) * uDpr; // 1 px margin each side for the antialiased edge
}`;

const fragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity, uSize, uRing, uSoft;
void main() {
  float s = uSize + 2.0;
  float d = length(gl_PointCoord - 0.5) * s;       // css px from the centre
  float rOut = uSize * 0.5;
  float disc = 1.0 - smoothstep(rOut - 0.5, rOut + 0.5, d);
  float ring = 1.0 - smoothstep(0.0, 0.9, abs(d - (rOut - 0.5)));
  // Soft: a gaussian core with faint four-point diffraction spikes (a sun glint).
  vec2 q = abs(gl_PointCoord - 0.5) * s;
  float glint = exp(-pow(d / (uSize * 0.14), 2.0)) + 0.5 * (exp(-q.x / 0.7) + exp(-q.y / 0.7)) * exp(-length(q) / (uSize * 0.18));
  float a = mix(mix(disc, ring, uRing), glint, uSoft) * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}`;

type Props = { size: number; color?: string; ring?: boolean; soft?: boolean; additive?: boolean; opacity?: number; position?: [number, number, number] };

const Marker = forwardRef<Points, Props>(function Marker({ size, color = "#eef4ff", ring = false, soft = false, additive = false, opacity = 1, position }, ref) {
  const dpr = useThree((s) => s.viewport.dpr);
  const uniforms = useMemo(
    () => ({ uSize: { value: size }, uDpr: { value: dpr }, uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uRing: { value: ring ? 1 : 0 }, uSoft: { value: soft ? 1 : 0 } }),
    [size, dpr, color, opacity, ring, soft],
  );
  const positions = useMemo(() => new Float32Array(3), []);
  return (
    <points ref={ref} position={position} renderOrder={3} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthTest
        depthWrite={false}
        blending={additive ? AdditiveBlending : NormalBlending}
      />
    </points>
  );
});

export default Marker;
/** The marker's material, for per-frame uniform writes through a ref. */
export const markerMaterial = (pts: Points | null) => (pts ? (pts.material as ShaderMaterial) : null);
