import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { MeshPhysicalMaterial } from "three";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// The stack top: the Devable mark, built as the object itself. A big black
// glossy rounded square with the striped white "D" set into its top, glinting
// when the signal arrives.
const CHIP = { w: 1.7, h: 0.16, radius: 0.07 };

/** The mark's striped "D" (proportions from public/brand/devable-mark.png), white on transparent. */
function drawMark(ctx: CanvasRenderingContext2D, w: number) {
  const s = w / 512;
  const [left, top, bottom, bend] = [110 * s, 103 * s, 408 * s, 265 * s];
  const rx = 150 * s;
  const ry = (bottom - top) / 2;
  ctx.save(); // repaints reuse the context, so don't let the clip stack up
  // The D: a flat left half and a rounded right half.
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(bend, top);
  ctx.ellipse(bend, top + ry, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.clip();
  // Four equal stripes with three gaps a third of their height.
  const stripe = (bottom - top) / (4 + 3 / 3);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 4; i++) ctx.fillRect(left, top + i * stripe * (4 / 3), w, stripe);
  ctx.restore();
}

export default function EngineCore() {
  const story = useStory();
  const body = useRef<MeshPhysicalMaterial>(null);
  const mark = useCanvasTexture(1024, 1024, drawMark);

  useFrame((state) => {
    const bloom = story.core(story.time(state.clock.elapsedTime));
    if (body.current) body.current.emissiveIntensity = bloom * 0.12;
  });

  return (
    <group>
      <RoundedBox args={[CHIP.w, CHIP.h, CHIP.w]} radius={CHIP.radius} smoothness={5} position-y={CHIP.h / 2 + 0.005} castShadow receiveShadow>
        <meshPhysicalMaterial ref={body} color="#0b0c0e" roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} emissive="#ffffff" emissiveIntensity={0} />
      </RoundedBox>
      {/* The D on the top face, reading along the stack like the label text. */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position-y={CHIP.h + 0.007}>
        <planeGeometry args={[CHIP.w - 0.08, CHIP.w - 0.08]} />
        <meshBasicMaterial map={mark.texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
