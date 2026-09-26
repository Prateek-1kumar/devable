import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { MeshBasicMaterial, TubeGeometry, Vector3, type Group, type Mesh } from "three";
import { CABLE, RAIL, STACK_TOP } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { CABLE_FOR, CLIMB_FOR, INTRO, clamp01, easeOutCubic, useStory } from "./story";

const CABLE_RADIUS = 0.07;
const TUBE = { segments: 64, radial: 12 };
const CABLE_REVEAL = { at: INTRO.terminalAt + INTRO.terminalFor, for: 0.6 };
const RAIL_BUILD = { at: INTRO.layersAt, for: INTRO.layerStagger * 3 + INTRO.layerFor };

/** The cable from the terminal, the rail up the stack's corner, and the signal bead that runs along both. */
export default function SignalPath() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const rail = useRef<Group>(null);
  const bead = useRef<Mesh>(null);

  const tube = useMemo(() => new TubeGeometry(CABLE, TUBE.segments, CABLE_RADIUS, TUBE.radial, false), []);
  const beadMaterial = useMemo(() => new MeshBasicMaterial({ color: p.amber, toneMapped: false }), [p]);
  useEffect(() => () => {
    tube.dispose();
    beadMaterial.dispose();
  }, [tube, beadMaterial]);
  const at = useMemo(() => new Vector3(), []);
  const split = CABLE_FOR / (CABLE_FOR + CLIMB_FOR);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);

    // The cable draws itself out of the terminal once it lands (tube indices run along the path).
    const reveal = easeOutCubic(clamp01((t - CABLE_REVEAL.at) / CABLE_REVEAL.for));
    const total = tube.index?.count ?? 0;
    tube.setDrawRange(0, Math.floor((total * reveal) / 6) * 6);

    if (rail.current) rail.current.scale.y = Math.max(1e-4, easeOutCubic(clamp01((t - RAIL_BUILD.at) / RAIL_BUILD.for)));

    const s = story.signal(t);
    if (!bead.current) return;
    bead.current.visible = s >= 0;
    if (s < 0) return;
    if (s < split) CABLE.getPointAt(s / split, at);
    else at.set(RAIL.x, CABLE_RADIUS + (STACK_TOP - CABLE_RADIUS) * ((s - split) / (1 - split)), RAIL.z);
    bead.current.position.copy(at);
  });

  return (
    <group>
      <mesh geometry={tube} material={m.stone} castShadow receiveShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <group ref={rail} position={[RAIL.x, 0, RAIL.z]}>
        <mesh position={[0, STACK_TOP / 2, 0]} material={m.metal} castShadow>
          <cylinderGeometry args={[0.075, 0.075, STACK_TOP, 20]} />
          <Outlines thickness={1} color={p.ink} />
        </mesh>
      </group>
      <mesh ref={bead} material={beadMaterial} visible={false}>
        <sphereGeometry args={[0.08, 20, 16]} />
      </mesh>
    </group>
  );
}
