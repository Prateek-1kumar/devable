import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { Quaternion, TubeGeometry, Vector3, type Group, type Mesh } from "three";
import { CABLE, CABLE_RADIUS, PORTS, RAIL, STACK_TOP } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { CABLE_FOR, CLIMB_FOR, INTRO, clamp01, easeOutCubic, useStory } from "./story";

const TUBE = { segments: 80, radial: 14 };
const CABLE_REVEAL = { at: INTRO.terminalAt + INTRO.terminalFor, for: 0.6 };
const RAIL_BUILD = { at: INTRO.layersAt, for: INTRO.layerStagger * 3 + INTRO.layerFor };
// The signal is a short single-file train of pearls: lead pearl first, smaller ones behind.
const TRAIN = [
  { lag: 0, size: 1 },
  { lag: 0.035, size: 0.8 },
  { lag: 0.07, size: 0.62 },
];
const UP = new Vector3(0, 1, 0);

/** Metal collar where the cable plugs in, aligned with the cable. */
function Collar({ at, dir, show }: { at: Vector3; dir: Vector3; show: (t: number) => boolean }) {
  const story = useStory();
  const ref = useRef<Mesh>(null);
  const turn = useMemo(() => new Quaternion().setFromUnitVectors(UP, dir), [dir]);
  useFrame((state) => {
    if (ref.current) ref.current.visible = show(story.time(state.clock.elapsedTime));
  });
  return (
    <mesh ref={ref} position={at} quaternion={turn} material={materials().metal} castShadow visible={false}>
      <cylinderGeometry args={[CABLE_RADIUS * 1.5, CABLE_RADIUS * 1.5, 0.14, 24]} />
      <Outlines thickness={1} color={palette().ink} />
    </mesh>
  );
}

/** The cable from the terminal, the rail up the stack's corner, and the pearl signal that runs along both. */
export default function SignalPath() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const rail = useRef<Group>(null);
  const pearls = useRef<(Mesh | null)[]>([]);

  const tube = useMemo(() => new TubeGeometry(CABLE, TUBE.segments, CABLE_RADIUS, TUBE.radial, false), []);
  useEffect(() => () => tube.dispose(), [tube]);
  const at = useMemo(() => new Vector3(), []);
  const split = CABLE_FOR / (CABLE_FOR + CLIMB_FOR);
  const revealAt = (t: number) => easeOutCubic(clamp01((t - CABLE_REVEAL.at) / CABLE_REVEAL.for));

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);

    // The cable draws itself out of the terminal once it lands (tube indices run along the path).
    const total = tube.index?.count ?? 0;
    tube.setDrawRange(0, Math.floor((total * revealAt(t)) / 6) * 6);

    if (rail.current) rail.current.scale.y = Math.max(1e-4, easeOutCubic(clamp01((t - RAIL_BUILD.at) / RAIL_BUILD.for)));

    const s = story.signal(t);
    TRAIN.forEach(({ lag, size }, i) => {
      const pearl = pearls.current[i];
      if (!pearl) return;
      const k = s - lag;
      pearl.visible = s >= 0 && k >= 0;
      if (!pearl.visible) return;
      if (k < split) CABLE.getPointAt(k / split, at);
      else at.set(RAIL.x, PORTS.stack.at.y + (STACK_TOP - PORTS.stack.at.y) * ((k - split) / (1 - split)), RAIL.z);
      pearl.position.copy(at);
      pearl.scale.setScalar(size);
    });
  });

  return (
    <group>
      <mesh geometry={tube} material={m.stone} castShadow receiveShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <Collar at={PORTS.terminal.at} dir={PORTS.terminal.dir} show={(t) => revealAt(t) > 0} />
      <Collar at={PORTS.stack.at} dir={PORTS.stack.dir} show={(t) => revealAt(t) >= 0.98} />
      <group ref={rail} position={[RAIL.x, 0, RAIL.z]}>
        <mesh position={[0, STACK_TOP / 2, 0]} material={m.metal} castShadow>
          <cylinderGeometry args={[0.075, 0.075, STACK_TOP, 20]} />
          <Outlines thickness={1} color={p.ink} />
        </mesh>
      </group>
      {TRAIN.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            pearls.current[i] = el;
          }}
          material={m.pearl}
          visible={false}
        >
          <sphereGeometry args={[0.085, 24, 18]} />
        </mesh>
      ))}
    </group>
  );
}
