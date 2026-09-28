import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, Vector3, type InstancedMesh } from "three";
import { CHANNELS } from "./channels";
import { GAUGE_POSITION, LEAD_BOW, TOKEN_DEST } from "./layout";
import { materials } from "./palette";
import { clamp01, useStory } from "./story";

const MAX_PEARLS = 64;

const TINTS = CHANNELS.map(({ color }) => new Color(color));

/**
 * Glassy pearls in their channel's color that travel in tidy single-file lines
 * from each burst token into the pipeline gauge. One draw call for all of them.
 */
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
    story.leads(t, (token, p) => {
      if (i >= MAX_PEARLS) return;
      const from = TOKEN_DEST[token];
      // Every pearl from one token shares the same smooth arc, so they read as a line.
      control.lerpVectors(from, GAUGE_POSITION, 0.5).add(LEAD_BOW[token]);
      a.lerpVectors(from, control, p);
      b.lerpVectors(control, GAUGE_POSITION, p);
      dummy.position.lerpVectors(a, b, p);
      dummy.scale.setScalar(Math.min(1, clamp01(p / 0.08), clamp01((1 - p) / 0.08)));
      dummy.updateMatrix();
      m.setColorAt(i, TINTS[token]);
      m.setMatrixAt(i++, dummy.matrix);
    });
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_PEARLS]} material={materials().lead} frustumCulled={false}>
      <sphereGeometry args={[0.04, 20, 14]} />
    </instancedMesh>
  );
}
