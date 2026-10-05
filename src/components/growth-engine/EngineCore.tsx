import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Color, type MeshBasicMaterial } from "three";
import { CORE, STACK_TOP } from "./layout";
import { INK_PX, boxFaces, palette } from "./palette";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// The stack's top: the Devable engine, a flat ink plate with the striped "D"
// mark. When the signal arrives across the top, the mark lights coral.

/** The mark's striped "D" (proportions from public/brand/devable-mark.png), white on transparent. */
function drawMark(ctx: CanvasRenderingContext2D, w: number) {
  const s = w / 512;
  const [left, top, bottom, bend] = [130 * s, 123 * s, 388 * s, 265 * s];
  const rx = 130 * s;
  const ry = (bottom - top) / 2;
  ctx.save(); // repaints reuse the context, so don't let the clip stack up
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
  const p = palette();
  const mark = useCanvasTexture(512, 512, drawMark);
  const faces = useMemo(() => boxFaces(p.ink), [p]);
  const colors = useMemo(() => ({ rest: new Color("#ffffff"), on: new Color(p.accent) }), [p]);
  const glyph = useRef<MeshBasicMaterial>(null);

  useFrame((state) => {
    const k = story.core(story.time(state.clock.elapsedTime));
    glyph.current?.color.lerpColors(colors.rest, colors.on, Math.min(1, k * 1.6));
  });

  return (
    <group position-y={STACK_TOP}>
      <mesh position-y={CORE.h / 2} material={faces}>
        <boxGeometry args={[CORE.size, CORE.h, CORE.size]} />
        <Edges color={p.ink} lineWidth={INK_PX} />
      </mesh>
      {/* The D reads along the stack's front, like the band labels. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position-y={CORE.h + 0.002}>
        <planeGeometry args={[CORE.size * 0.8, CORE.size * 0.8]} />
        <meshBasicMaterial ref={glyph} map={mark.texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
