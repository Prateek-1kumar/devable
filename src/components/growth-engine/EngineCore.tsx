import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import { Color, type Mesh, type MeshBasicMaterial, type MeshPhysicalMaterial } from "three";
import { CHANNELS } from "./channels";
import { GLASS_TONES, INK_PX, materials, palette } from "./palette";
import { useStory } from "./story";

// Four frosted compartments on the stack top, one per channel, each holding a
// soft pastel glow. Glows breathe in a slow 01 → 04 wave and flash when the
// signal lights their channel.
const CORNER = 0.92;
const GLASS = { w: 0.62, h: 0.42 };
const SPOTS: [number, number][] = [
  [CORNER, CORNER],
  [CORNER, -CORNER],
  [-CORNER, -CORNER],
  [-CORNER, CORNER],
];
const WAVE = { every: 7, span: 0.9, stagger: 0.35 }; // seconds
const PASTELS = CHANNELS.map(({ pastel }) => new Color(pastel));
const VIVIDS = CHANNELS.map(({ color }) => new Color(color));

/** The glowing core set into the top layer, ringed by the channel compartments, with a ripple when the signal arrives. */
export default function EngineCore() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const ring = useRef<Mesh>(null);
  const pill = useRef<MeshPhysicalMaterial>(null);
  const ripple = useRef<MeshBasicMaterial>(null);
  const glows = useRef<(MeshBasicMaterial | null)[]>([]);

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
    glows.current.forEach((glow, k) => {
      if (!glow) return;
      const since = (((t - k * WAVE.stagger) % WAVE.every) + WAVE.every) % WAVE.every;
      const wave = since < WAVE.span ? Math.sin((Math.PI * since) / WAVE.span) * 0.35 : 0;
      glow.color.lerpColors(PASTELS[k], VIVIDS[k], Math.min(1, wave + story.flash(k, t)));
    });
  });

  return (
    <group>
      <RoundedBox args={[1.1, 0.05, 1.1]} radius={0.02} smoothness={3} position={[0, 0.02, 0]} material={m.panel} receiveShadow>
        <Outlines thickness={INK_PX} color={GLASS_TONES[3].edge} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.16, 0.72]} radius={0.07} smoothness={4} position={[0, 0.1, 0]} castShadow>
        <meshPhysicalMaterial ref={pill} color={p.cream} emissive={p.signal} emissiveIntensity={0} roughness={0.25} clearcoat={1} />
        <Outlines thickness={INK_PX} color={p.slate} />
      </RoundedBox>
      {/* Socket the tether rises from. */}
      <mesh position={[0, 0.22, 0]} material={m.screen}>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 24]} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.58, 64]} />
        <meshBasicMaterial ref={ripple} color={p.ink} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>

      {SPOTS.map(([x, z], k) => (
        <group key={k} position={[x, GLASS.h / 2, z]}>
          <RoundedBox args={[GLASS.w * 0.7, GLASS.h * 0.6, GLASS.w * 0.7]} radius={0.05} smoothness={3}>
            <meshBasicMaterial
              ref={(el) => {
                glows.current[k] = el;
              }}
              color={CHANNELS[k].pastel}
              toneMapped={false}
            />
            <Outlines thickness={INK_PX} color={GLASS_TONES[k].edge} />
          </RoundedBox>
          {/* Clear glass, no outline: its hull would show through as a grey fill. */}
          <RoundedBox args={[GLASS.w, GLASS.h, GLASS.w]} radius={0.06} smoothness={5} material={m.frosted} />
        </group>
      ))}
    </group>
  );
}
