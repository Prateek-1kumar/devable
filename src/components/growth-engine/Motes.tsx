import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, type InstancedMesh } from "three";
import { CHANNELS } from "./channels";
import { useStory } from "./story";

// Ambient life: a few faint pastel "pixels" (the page's pixel field, in 3D)
// drifting up around the engine, fading in and out at the ends of their rise.
const COUNT = 42;
const RISE = 5.6; // height they travel before wrapping to the floor
const RING: [number, number] = [2.4, 3.8]; // distance from the stack's center

export default function Motes() {
  const story = useStory();
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  // Deterministic scatter, so every mount looks the same.
  const motes = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const r = (n: number) => (Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1;
        const f = (n: number) => Math.abs(r(n));
        const angle = f(1) * Math.PI * 2;
        const radius = RING[0] + f(2) * (RING[1] - RING[0]);
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y0: f(3) * RISE,
          speed: 0.1 + f(4) * 0.18,
          size: 0.035 + f(5) * 0.04,
          spin: (f(6) - 0.5) * 1.2,
          color: new Color(CHANNELS[i % CHANNELS.length].pastel).lerp(new Color(CHANNELS[i % CHANNELS.length].color), 0.35),
        };
      }),
    [],
  );
  const colored = useRef(false);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = story.still ? 0 : state.clock.elapsedTime;
    motes.forEach((mote, i) => {
      const y = (mote.y0 + t * mote.speed) % RISE;
      dummy.position.set(mote.x, y, mote.z);
      dummy.rotation.set(t * mote.spin, t * mote.spin * 0.7, 0);
      dummy.scale.setScalar(mote.size * Math.sin((Math.PI * y) / RISE));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (!colored.current) m.setColorAt(i, mote.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (!colored.current && m.instanceColor) {
      m.instanceColor.needsUpdate = true;
      colored.current = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
}
