import { useMemo } from "react";
import { Color, ShaderMaterial } from "three";
import { palette } from "./palette";

// A faint grid on the floor, fading out toward its edges, so the diagram
// reads as laid out on a drafting surface. Drawn in a tiny shader: crisp
// one-pixel lines at any zoom, no textures.

const SIZE = 18;
const CELL = 0.5;
const CENTER: [number, number] = [0.9, -0.2];

export default function Floor() {
  const p = palette();
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { color: { value: new Color(p.ink) }, cell: { value: CELL }, center: { value: CENTER }, radius: { value: 6.2 } },
        vertexShader: /* glsl */ `
          varying vec2 vPos;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vPos = world.xz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 color;
          uniform float cell;
          uniform vec2 center;
          uniform float radius;
          varying vec2 vPos;
          void main() {
            vec2 g = abs(fract(vPos / cell - 0.5) - 0.5) / fwidth(vPos / cell);
            float line = 1.0 - min(min(g.x, g.y), 1.0);
            float fade = 1.0 - smoothstep(radius * 0.45, radius, length(vPos - center));
            gl_FragColor = vec4(color, line * fade * 0.11);
            #include <colorspace_fragment>
          }`,
      }),
    [p],
  );
  return (
    <mesh rotation-x={-Math.PI / 2} position={[CENTER[0], -0.001, CENTER[1]]} material={material} renderOrder={-1}>
      <planeGeometry args={[SIZE, SIZE]} />
    </mesh>
  );
}
