import { forwardRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, NormalBlending, type Points } from "three";

// A batch of screen-space markers in one draw: per point a size (css px), an rgb colour, an alpha and a
// ring flag (1 px ring instead of a disc). Depth-tested so the Earth hides them, never writing depth.
// Write the attributes through `pointSet(ref)` each frame and set `geometry.setDrawRange(0, n)`.

const vertex = /* glsl */ `
attribute float aSize, aAlpha, aRing;
attribute vec3 aColor;
uniform float uDpr;
varying float vSize, vAlpha, vRing;
varying vec3 vColor;
void main() {
  vSize = aSize; vAlpha = aAlpha; vRing = aRing; vColor = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aAlpha < 0.004 ? 0.0 : (aSize + 2.0) * uDpr;
}`;

const fragment = /* glsl */ `
varying float vSize, vAlpha, vRing;
varying vec3 vColor;
void main() {
  float s = vSize + 2.0;
  float d = length(gl_PointCoord - 0.5) * s;
  float rOut = vSize * 0.5;
  float disc = 1.0 - smoothstep(rOut - 0.6, rOut + 0.6, d);
  float ring = 1.0 - smoothstep(0.0, 0.9, abs(d - (rOut - 0.5)));
  // Soft discs (vRing < 0): a gaussian falloff, for halos and the lead pulses.
  float soft = exp(-pow(d / max(rOut * 0.55, 0.5), 2.0));
  float a = (vRing < 0.0 ? soft : mix(disc, ring, vRing)) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}`;

const PointSet = forwardRef<Points, { max: number; additive?: boolean; renderOrder?: number }>(function PointSet({ max, additive = false, renderOrder = 4 }, ref) {
  const dpr = useThree((s) => s.viewport.dpr);
  const uniforms = useMemo(() => ({ uDpr: { value: dpr } }), [dpr]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(3 * max), 3));
    g.setAttribute("aColor", new BufferAttribute(new Float32Array(3 * max), 3));
    g.setAttribute("aSize", new BufferAttribute(new Float32Array(max), 1));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(max), 1));
    g.setAttribute("aRing", new BufferAttribute(new Float32Array(max), 1));
    g.setDrawRange(0, 0);
    return g;
  }, [max]);
  return (
    <points ref={ref} geometry={geometry} renderOrder={renderOrder} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthTest
        depthWrite={false}
        toneMapped={false}
        blending={additive ? AdditiveBlending : NormalBlending}
      />
    </points>
  );
});

export default PointSet;

/** A writer over a PointSet: `put` appends a point, `done` uploads and sets the draw range. */
export function pointWriter(pts: Points | null) {
  if (!pts) return null;
  const g = pts.geometry;
  const a = (k: string) => g.attributes[k] as BufferAttribute;
  const [pos, color, size, alpha, ring] = [a("position"), a("aColor"), a("aSize"), a("aAlpha"), a("aRing")];
  let n = 0;
  return {
    put(x: number, y: number, z: number, px: number, rgb: { r: number; g: number; b: number }, al: number, rg = 0) {
      if (n >= size.count || al < 0.004) return;
      pos.setXYZ(n, x, y, z);
      color.setXYZ(n, rgb.r, rgb.g, rgb.b);
      size.setX(n, px);
      alpha.setX(n, al);
      ring.setX(n, rg);
      n++;
    },
    done() {
      for (const at of [pos, color, size, alpha, ring]) at.needsUpdate = true;
      g.setDrawRange(0, n);
      pts.visible = n > 0;
    },
  };
}

/** `ring` value for a soft gaussian disc (halos, pulses). */
export const SOFT = -1;
