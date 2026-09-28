import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import type { Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from "three";
import { INK_PX, materials, palette } from "./palette";
import { useStory } from "./story";

/** The glowing core set into the top layer, with a ripple when the signal arrives. */
export default function EngineCore() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const ring = useRef<Mesh>(null);
  const pill = useRef<MeshPhysicalMaterial>(null);
  const ripple = useRef<MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    // ponytail: a faint glow at rest; it only blooms on a signal.
    if (pill.current) pill.current.emissiveIntensity = 0.1 + story.core(t) * 1.2;
    const r = story.ripple(t);
    if (ring.current && ripple.current) {
      ring.current.visible = r >= 0;
      ring.current.scale.setScalar(1 + Math.max(0, r) * 1.5);
      ripple.current.opacity = (1 - r) * 0.5;
    }
  });

  return (
    <group>
      <RoundedBox args={[1.1, 0.05, 1.1]} radius={0.02} smoothness={3} position={[0, 0.02, 0]} material={m.panel} receiveShadow />
      <RoundedBox args={[0.72, 0.16, 0.72]} radius={0.07} smoothness={4} position={[0, 0.1, 0]} castShadow>
        <meshPhysicalMaterial ref={pill} color={p.cream} emissive={p.signal} emissiveIntensity={0} roughness={0.25} clearcoat={1} />
        <Outlines thickness={INK_PX} color={p.slate} />
      </RoundedBox>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.58, 64]} />
        <meshBasicMaterial ref={ripple} color={p.ink} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
