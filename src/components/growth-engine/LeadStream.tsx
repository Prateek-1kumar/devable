import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Vector3, type InstancedMesh } from "three";
import { GAUGE_POSITION, TOKEN_DEST } from "./layout";
import { palette } from "./palette";
import { useStory } from "./story";

const MAX_DOTS = 96;

/** Glossy amber beads that curve from each burst token into the pipeline gauge. One draw call for all of them. */
export default function LeadStream() {
  const story = useStory();
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const control = useMemo(() => new Vector3(), []);
  const a = useMemo(() => new Vector3(), []);
  const b = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = story.time(state.clock.elapsedTime);
    let i = 0;
    story.leads(t, (token, bend, p) => {
      if (i >= MAX_DOTS) return;
      const from = TOKEN_DEST[token];
      // Quadratic bezier from the token's burst point to the gauge, bowed by the dot's own bend.
      control.lerpVectors(from, GAUGE_POSITION, 0.5).add(bend);
      a.lerpVectors(from, control, p);
      b.lerpVectors(control, GAUGE_POSITION, p);
      dummy.position.lerpVectors(a, b, p);
      dummy.scale.setScalar(Math.sin(Math.PI * p) ** 0.4);
      dummy.updateMatrix();
      m.setMatrixAt(i++, dummy.matrix);
    });
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_DOTS]} frustumCulled={false}>
      <sphereGeometry args={[0.035, 12, 10]} />
      <meshPhysicalMaterial color={palette().amber} roughness={0.2} clearcoat={1} emissive={palette().amber} emissiveIntensity={0.25} />
    </instancedMesh>
  );
}
