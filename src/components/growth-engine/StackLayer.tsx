import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Color } from "three";
import { CHANNELS, drawGlyph } from "./channels";
import { HALF, LAYER, layerY } from "./layout";
import { MARK_STYLE, paintMark, type Mark } from "./marks";
import { INK_PX, boxFaces, palette, tintFaces } from "./palette";
import { FocusContext, HoverContext, clamp01, damp, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// One channel layer of the stack: a solid label band (deep green or ink) with a
// frosted glass slab above it, every edge in a thin ink line. The band carries
// the channel's number, name and brand tiles on its front face, and turns
// coral while the signal passes it or the channel is pointed at.

const PX = 512; // label texture pixels per world unit
const MARKS_FOR: (Mark | "code")[][] = [["code"], ["google", "chatgpt"], ["reddit"], ["youtube"]];

type Props = { index: number };

export default function StackLayer({ index }: Props) {
  const story = useStory();
  const p = palette();
  const channel = CHANNELS[index];
  const rest = channel.band === "ink" ? p.ink : p.primary;

  const [hovered, setHovered] = useState(false);
  const reportHover = useContext(HoverContext);
  const focused = useContext(FocusContext) === index;
  const raised = hovered || focused;

  const band = useMemo(() => boxFaces(rest), [rest]);
  const glass = useMemo(() => boxFaces("#f4f6f3", { opacity: 0.84 }), []);
  const colors = useMemo(() => ({ rest: new Color(rest), on: new Color(p.accent), now: new Color() }), [rest, p]);
  const pointer = useRef(0);

  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const u = PX; // one world unit in texture pixels
      const mid = h / 2;
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.font = `500 ${0.115 * u}px ${p.monoFont}`;
      ctx.letterSpacing = `${0.008 * u}px`;
      ctx.fillText(channel.n, 0.38 * u, mid + 2);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${0.15 * u}px ${p.bodyFont}`;
      ctx.fillText(channel.name, 0.64 * u, mid + 3);
      // Brand tiles, right-aligned: white squares with the real marks.
      const size = 0.2 * u;
      const marks = MARKS_FOR[index];
      marks.forEach((mark, k) => {
        const x = w - 0.2 * u - (marks.length - k) * (size + 0.04 * u) + 0.04 * u;
        const y = mid - size / 2;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, size * 0.18);
        ctx.fill();
        if (mark === "code") {
          drawGlyph(ctx, "code", x + size / 2, y + size / 2 + 1, size * 0.5, p.ink, p.monoFont);
          return;
        }
        const s = (size * MARK_STYLE[mark].fit * 0.82) / 24;
        ctx.save();
        ctx.translate(x + size / 2 - 12 * s, y + size / 2 - 12 * s);
        ctx.scale(s, s);
        paintMark(ctx, mark);
        ctx.restore();
      });
    },
    [channel, index, p],
  );
  const label = useCanvasTexture(LAYER.width * PX, Math.round(LAYER.band * PX), drawLabel);

  useFrame((state, delta) => {
    const t = story.time(state.clock.elapsedTime);
    // The signal's highlight follows the story exactly; the pointer's eases in and out.
    pointer.current = story.still ? Number(raised) : damp(pointer.current, Number(raised), 14, Math.min(delta, 1 / 30));
    tintFaces(band, colors.now.lerpColors(colors.rest, colors.on, clamp01(Math.max(story.band(index, t), pointer.current))));
  });

  const y = layerY(index);
  return (
    <group
      position-y={y}
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
      <mesh position-y={LAYER.band / 2} material={band}>
        <boxGeometry args={[LAYER.width, LAYER.band, LAYER.width]} />
        <Edges color={p.ink} lineWidth={INK_PX} />
      </mesh>
      <mesh position={[0, LAYER.band / 2, HALF + 0.001]}>
        <planeGeometry args={[LAYER.width, LAYER.band]} />
        <meshBasicMaterial map={label.texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position-y={LAYER.band + LAYER.glass / 2} material={glass}>
        <boxGeometry args={[LAYER.width, LAYER.glass, LAYER.width]} />
        <Edges color={p.ink} lineWidth={INK_PX} />
      </mesh>
    </group>
  );
}
