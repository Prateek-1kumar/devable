import { useCallback, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from "three";
import { CHANNELS, drawGlyph } from "./channels";
import { FACING_YAW } from "./layout";
import { INK_PX, materials, paintFade, palette } from "./palette";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// The stack top: the core in the middle, ringed by four channel blocks. Each is
// a solid, glossy, rounded block like an app icon: a light two-hue fade of its
// own, the channel glyph on top. They bob gently in a slow 01 → 04 wave and
// glow brighter when the signal reaches their channel.
const CORNER = 0.92;
const BLOCK = { w: 0.62, h: 0.3, radius: 0.11 };
const SPOTS: [number, number][] = [
  [CORNER, CORNER],
  [CORNER, -CORNER],
  [-CORNER, -CORNER],
  [-CORNER, CORNER],
];
// Bottom → top per channel: a light tone of its color into a paler, slightly shifted hue.
const FADES: [string, string][] = [
  ["#a9a4ff", "#f1e3ff"], // periwinkle → lilac
  ["#7fcbff", "#dcf6ff"], // sky → ice
  ["#86e3bb", "#eafbd6"], // mint → lime cream
  ["#ffc576", "#fff4cf"], // apricot → cream
];
const WAVE = { every: 7, span: 0.9, stagger: 0.35 }; // seconds

/** One channel block on the stack top. */
function ChannelBlock({ k, x, z }: { k: number; x: number; z: number }) {
  const story = useStory();
  const p = palette();
  const channel = CHANNELS[k];
  const group = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const material = useRef<MeshPhysicalMaterial>(null);

  // Runs after RoundedBox has built and centered its geometry (child effects run first).
  useLayoutEffect(() => {
    if (body.current) paintFade(body.current, FADES[k][0], FADES[k][1], BLOCK.h);
  }, [k]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => drawGlyph(ctx, channel.glyph, w / 2, h / 2, h * 0.42, channel.deep, p.bodyFont),
    [channel, p],
  );
  const glyph = useCanvasTexture(256, 256, draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const since = (((t - k * WAVE.stagger) % WAVE.every) + WAVE.every) % WAVE.every;
    const wave = since < WAVE.span ? Math.sin((Math.PI * since) / WAVE.span) : 0;
    const flash = story.flash(k, t);
    if (group.current) group.current.position.y = BLOCK.h / 2 + wave * 0.03 + flash * 0.06;
    if (material.current) material.current.emissiveIntensity = 0.15 + wave * 0.12 + flash * 0.35;
  });

  return (
    <group ref={group} position={[x, BLOCK.h / 2, z]}>
      <RoundedBox ref={body} args={[BLOCK.w, BLOCK.h, BLOCK.w]} radius={BLOCK.radius} smoothness={6} castShadow receiveShadow>
        {/* Its own material, so each block can glow on its own. */}
        <meshPhysicalMaterial
          ref={material}
          vertexColors
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </RoundedBox>
      {/* Glyph on the top face, turned to face the camera. */}
      <mesh rotation={[-Math.PI / 2, 0, FACING_YAW]} position-y={BLOCK.h / 2 + 0.002}>
        <planeGeometry args={[BLOCK.w * 0.62, BLOCK.w * 0.62]} />
        <meshBasicMaterial map={glyph.texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The glowing core set into the top layer, ringed by the channel blocks, with a ripple when the signal arrives. */
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
      {/* Socket the tether rises from. */}
      <mesh position={[0, 0.22, 0]} material={m.screen}>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 24]} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.58, 64]} />
        <meshBasicMaterial ref={ripple} color={p.ink} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>

      {SPOTS.map(([x, z], k) => (
        <ChannelBlock key={k} k={k} x={x} z={z} />
      ))}
    </group>
  );
}
