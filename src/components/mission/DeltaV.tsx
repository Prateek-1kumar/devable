import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type PerspectiveCamera } from "three";
import type { Line2 } from "three-stdlib";
import { useMission } from "./frame";
import { windowed } from "./timeline";
import { craftTangent } from "./world";

// The Δv chevron of the correction burn (.83–.848): a thin white arrowhead a little ahead of the craft,
// pointing along its velocity as projected on screen, a constant 18 px across at any distance.

const PX = { ahead: 20, width: 18, depth: 8 } as const;
const PTS = [new Vector3(), new Vector3(0, 1, 0), new Vector3(0, 2, 0)];
const v = { view: new Vector3(), tan: new Vector3(), perp: new Vector3(), tip: new Vector3(), a: new Vector3(), b: new Vector3() };

export default function DeltaV() {
  const frame = useMission();
  const line = useRef<Line2>(null);

  useFrame((state) => {
    const l = line.current;
    if (!l) return;
    const o = windowed(frame.p, 0.83, 0.833, 0.845, 0.848);
    l.visible = o > 0.002;
    if (!l.visible) return;
    const cam = state.camera as PerspectiveCamera;
    const { view, tan, perp, tip, a, b } = v;
    view.subVectors(frame.craft, cam.position);
    const d = view.length();
    view.divideScalar(d);
    // World units per css pixel at the craft's distance.
    const wpp = (2 * d * Math.tan((cam.fov * Math.PI) / 360)) / state.size.height;
    craftTangent(frame.p, tan);
    tan.addScaledVector(view, -tan.dot(view)).normalize(); // the velocity in the screen plane
    perp.crossVectors(view, tan).normalize();
    tip.copy(frame.craft).addScaledVector(tan, (PX.ahead + PX.depth) * wpp);
    a.copy(tip).addScaledVector(tan, -PX.depth * wpp).addScaledVector(perp, (PX.width / 2) * wpp);
    b.copy(tip).addScaledVector(tan, -PX.depth * wpp).addScaledVector(perp, (-PX.width / 2) * wpp);
    const buf = (l.geometry.attributes.instanceStart as unknown as { data: { array: Float32Array; needsUpdate: boolean } }).data;
    a.toArray(buf.array, 0);
    tip.toArray(buf.array, 3);
    tip.toArray(buf.array, 6);
    b.toArray(buf.array, 9);
    buf.needsUpdate = true;
    l.material.opacity = 0.9 * o;
  });

  return (
    <Line
      ref={(l: Line2 | null) => {
        line.current = l;
        if (l) l.visible = false;
      }}
      points={PTS}
      color="#eef4ff"
      lineWidth={1.25}
      transparent
      opacity={0}
      depthWrite={false}
      toneMapped={false}
      frustumCulled={false}
      renderOrder={4}
    />
  );
}
