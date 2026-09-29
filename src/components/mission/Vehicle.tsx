import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useMission } from "./frame";
import Rocket from "./Rocket";
import Satellite from "./Satellite";
import Smoke from "./Smoke";

// DVB-01: the craft group (the satellite, at the craft point, scaled by vehicleScale), the launcher
// whose stages carry their own separation poses, and the one smoke system.

export default function Vehicle() {
  const frame = useMission();
  const craft = useRef<Group>(null);

  useFrame(() => {
    const g = craft.current;
    if (!g) return;
    g.position.copy(frame.craft);
    g.quaternion.copy(frame.quat);
    g.scale.setScalar(frame.scale);
    g.updateMatrixWorld(true);
  }, -2);

  return (
    <group>
      <group ref={craft}>
        <Satellite />
      </group>
      <Rocket />
      <Smoke />
    </group>
  );
}
