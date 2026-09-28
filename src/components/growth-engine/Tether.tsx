import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { Object3D, type InstancedMesh, type Mesh } from "three";
import { TETHER } from "./layout";
import { materials, palette } from "./palette";
import { clamp01, useStory } from "./story";

const SPACING = 0.13;

/**
 * The curved core → PIPELINE link: soft round ink dots along a gentle arc,
 * with a white pearl spark running up it while leads are landing.
 */
export default function Tether() {
  const story = useStory();
  const p = palette();
  const dots = useRef<InstancedMesh>(null);
  const spark = useRef<Mesh>(null);

  const points = useMemo(() => TETHER.getSpacedPoints(Math.round(TETHER.getLength() / SPACING)), []);
  const placed = useRef(false);

  useFrame((state) => {
    const mesh = dots.current;
    if (!mesh) return;
    if (!placed.current) {
      const dummy = new Object3D();
      points.forEach((point, i) => {
        dummy.position.copy(point);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      placed.current = true;
    }
    const t = story.time(state.clock.elapsedTime);
    // Dots draw upward from the core as the gauge appears.
    mesh.count = Math.round(points.length * clamp01((story.gaugeIn(t) - 0.2) / 0.8));

    const phase = story.spark(t);
    if (spark.current) {
      spark.current.visible = phase >= 0;
      if (phase >= 0) TETHER.getPoint(phase, spark.current.position);
    }
  });

  return (
    <>
      <instancedMesh ref={dots} args={[undefined, undefined, points.length]} frustumCulled={false}>
        <sphereGeometry args={[0.026, 12, 8]} />
        <meshBasicMaterial color={p.ink} transparent opacity={0.4} />
      </instancedMesh>
      <mesh ref={spark} material={materials().pearl} visible={false}>
        <sphereGeometry args={[0.06, 20, 14]} />
        <Outlines thickness={1} color={p.ink} />
      </mesh>
    </>
  );
}
