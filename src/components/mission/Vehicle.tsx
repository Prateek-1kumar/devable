import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import { useMission } from "./frame";
import Rocket from "./Rocket";
import Smoke from "./Smoke";

// DVB-01: the craft group (the satellite, at the craft point, scaled by vehicleScale), the launcher
// whose stages carry their own separation poses, and the one smoke system.

/** Where the four wing tips sit on the stowed stub (bus-local), so the labels and links have anchors. */
const TIPS: readonly (readonly [number, number, number])[] = [
  [0.1, 0, 0.1],
  [0.1, 0, -0.1],
  [-0.1, 0, -0.1],
  [-0.1, 0, 0.1],
];

/** Placeholder satellite (WS3 replaces it): the 0.20 × 0.26 × 0.20 bus seated on the adapter. */
function SatelliteSlot({ tipRef }: { tipRef: (i: number, o: Object3D | null) => void }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.26, 0.2]} />
        <meshStandardMaterial color="#0d0e10" roughness={0.55} metalness={0.3} />
      </mesh>
      {TIPS.map((p, i) => (
        <object3D key={i} position={p} ref={(o) => tipRef(i, o)} />
      ))}
    </group>
  );
}

export default function Vehicle() {
  const frame = useMission();
  const craft = useRef<Group>(null);
  const tips = useRef<(Object3D | null)[]>([]);

  useFrame(() => {
    const g = craft.current;
    if (!g) return;
    g.position.copy(frame.craft);
    g.quaternion.copy(frame.quat);
    g.scale.setScalar(frame.scale);
    g.updateMatrixWorld(true);
    tips.current.forEach((tip, i) => {
      if (tip) frame.setTip(i, tip);
    });
  }, -2);

  return (
    <group>
      <group ref={craft}>
        <SatelliteSlot
          tipRef={(i, o) => {
            tips.current[i] = o;
          }}
        />
      </group>
      <Rocket />
      <Smoke />
    </group>
  );
}
