import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Color } from "three";
import { CHANNELS, drawGlyph } from "./channels";
import { HALF, LAYER, layerY } from "./layout";
import { MARK_STYLE, paintMark, type Mark } from "./marks";
import { INK_PX, boxFaces, edgeColor, palette, tintFaces } from "./palette";
import { FocusContext, HoverContext, clamp01, damp, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// One channel layer of the exploded stack: a light frosted slab with a thin
// deep-green strip along its base, soft outlines, and the channel's number,
// name and brand tiles printed on its front face. While the signal passes (or
// the channel is pointed at) the strip turns coral and the slab warms slightly.
// A faint shadow on the slab below separates the floating layers.

const PX = 512; // label texture pixels per world unit
const SLAB = "#efede7";
const TOP = "#fdfcf9";
const WARM = "#fbe7df";
const MARKS_FOR: (Mark | "code")[][] = [["code"], ["google", "chatgpt"], ["reddit"], ["youtube"]];
const LABEL_H = LAYER.slab - LAYER.strip;

type Props = { index: number };

export default function StackLayer({ index }: Props) {
  const story = useStory();
  const p = palette();
  const channel = CHANNELS[index];

  const [hovered, setHovered] = useState(false);
  const reportHover = useContext(HoverContext);
  const focused = useContext(FocusContext) === index;
  const raised = hovered || focused;

  const slab = useMemo(() => boxFaces(SLAB, { top: TOP }), []);
  const strip = useMemo(() => boxFaces(p.primary), [p]);
  const colors = useMemo(
    () => ({ slab: new Color(SLAB), top: new Color(TOP), warm: new Color(WARM), strip: new Color(p.primary), on: new Color(p.accent), a: new Color(), b: new Color(), c: new Color() }),
    [p],
  );
  const pointer = useRef(0);

  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const u = PX;
      const mid = h / 2;
      ctx.textBaseline = "middle";
      ctx.fillStyle = p.muted;
      ctx.font = `500 ${0.11 * u}px ${p.monoFont}`;
      ctx.letterSpacing = `${0.01 * u}px`;
      ctx.fillText(channel.n, 0.36 * u, mid + 2);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = p.ink;
      ctx.font = `560 ${0.168 * u}px ${p.bodyFont}`;
      ctx.fillText(channel.name, 0.6 * u, mid + 4);
      // Brand tiles, right-aligned: white squares with a hairline and the real marks.
      const size = 0.21 * u;
      const marks = MARKS_FOR[index];
      marks.forEach((mark, k) => {
        const x = w - 0.18 * u - (marks.length - k) * (size + 0.05 * u) + 0.05 * u;
        const y = mid - size / 2;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(15,26,20,0.14)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, size * 0.2);
        ctx.fill();
        ctx.stroke();
        if (mark === "code") {
          drawGlyph(ctx, "code", x + size / 2, y + size / 2 + 1, size * 0.46, p.ink, p.monoFont);
          return;
        }
        const s = (size * MARK_STYLE[mark].fit * 0.72) / 24;
        ctx.save();
        ctx.translate(x + size / 2 - 12 * s, y + size / 2 - 12 * s);
        ctx.scale(s, s);
        paintMark(ctx, mark);
        ctx.restore();
      });
    },
    [channel, index, p],
  );
  const label = useCanvasTexture(LAYER.width * PX, Math.round(LABEL_H * PX), drawLabel);

  useFrame((state, delta) => {
    const t = story.time(state.clock.elapsedTime);
    // The signal's highlight follows the story exactly; the pointer's eases in and out.
    pointer.current = story.still ? Number(raised) : damp(pointer.current, Number(raised), 14, Math.min(delta, 1 / 30));
    const k = clamp01(Math.max(story.band(index, t), pointer.current));
    tintFaces(strip, colors.a.lerpColors(colors.strip, colors.on, k));
    tintFaces(slab, colors.b.lerpColors(colors.slab, colors.warm, k * 0.8), colors.c.lerpColors(colors.top, colors.warm, k * 0.5));
  });

  const edge = edgeColor();
  return (
    <group
      position-y={layerY(index)}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        reportHover(index);
      }}
      onPointerOut={() => {
        setHovered(false);
        reportHover(null);
      }}
    >
      <mesh position-y={LAYER.slab / 2} material={slab}>
        <boxGeometry args={[LAYER.width, LAYER.slab, LAYER.width]} />
        <Edges color={edge} lineWidth={INK_PX} />
      </mesh>
      {/* The base strip, a hair proud of the slab so it reads as a band. */}
      <mesh position-y={LAYER.strip / 2} material={strip}>
        <boxGeometry args={[LAYER.width + 0.006, LAYER.strip, LAYER.width + 0.006]} />
      </mesh>
      <mesh position={[0, LAYER.strip + LABEL_H / 2, HALF + 0.002]}>
        <planeGeometry args={[LAYER.width, LABEL_H]} />
        <meshBasicMaterial map={label.texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* Soft shadow cast on the slab below (none under the bottom slab: the floor has its own). */}
      {index > 0 && (
        <mesh rotation-x={-Math.PI / 2} position={[0.08, -LAYER.gap + 0.003, 0.08]}>
          <planeGeometry args={[LAYER.width * 0.96, LAYER.width * 0.96]} />
          <meshBasicMaterial color={p.ink} transparent opacity={0.07} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
