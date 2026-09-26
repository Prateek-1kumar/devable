import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines, RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { FACING_YAW, GAUGE_POSITION, STACK_TOP } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { INTRO_LEADS, clamp01, easeOutBack, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

const CARD = { w: 2.5, h: 1.3, d: 0.2 };
// Normalized sparkline: a steady climb with a couple of plateaus.
const SPARK = [
  [0, 0.12],
  [0.18, 0.24],
  [0.34, 0.2],
  [0.5, 0.44],
  [0.66, 0.5],
  [0.82, 0.72],
  [1, 0.95],
];

/** Floating PIPELINE readout: counts leads up as dots arrive, with a rising line. */
export default function PipelineGauge() {
  const story = useStory();
  const p = palette();
  const group = useRef<Group>(null);
  const link = useRef<Group>(null);
  const view = useRef({ leads: 0, drawn: 0 });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const { leads, drawn } = view.current;
      const pad = w * 0.07;
      ctx.fillStyle = p.ink;
      ctx.textBaseline = "alphabetic";

      ctx.globalAlpha = 0.5;
      ctx.font = `500 ${h * 0.08}px ${p.bodyFont}`;
      ctx.letterSpacing = `${h * 0.02}px`;
      ctx.fillText("PIPELINE", pad, h * 0.22);

      ctx.globalAlpha = 1;
      ctx.letterSpacing = "0px";
      ctx.font = `600 ${h * 0.3}px ${p.headingFont}`;
      const value = `+${Math.round(leads).toLocaleString("en-US")}`;
      ctx.fillText(value, pad, h * 0.58);
      const valueWidth = ctx.measureText(value).width;
      ctx.font = `500 ${h * 0.12}px ${p.bodyFont}`;
      ctx.fillText("leads", pad + valueWidth + h * 0.04, h * 0.58);

      // Sparkline along the bottom, drawn up to `drawn`.
      const box = { x: pad, y: h * 0.68, w: w - pad * 2, h: h * 0.22 };
      const pt = ([x, y]: number[]) => [box.x + x * box.w, box.y + box.h - y * box.h] as const;
      ctx.strokeStyle = p.amber;
      ctx.lineWidth = h * 0.022;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      let end = pt(SPARK[0]);
      ctx.moveTo(...end);
      for (let i = 1; i < SPARK.length; i++) {
        const [x0, y0] = SPARK[i - 1];
        const [x1, y1] = SPARK[i];
        if (x0 >= drawn) break;
        const f = Math.min(1, (drawn - x0) / (x1 - x0));
        end = pt([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
        ctx.lineTo(...end);
      }
      ctx.stroke();
      ctx.fillStyle = p.amber;
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = h * 0.012;
      ctx.beginPath();
      ctx.arc(end[0], end[1], h * 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    },
    [p],
  );
  const face = useCanvasTexture(1024, Math.round((1024 * (CARD.h - 0.1)) / (CARD.w - 0.1)), draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const appear = story.gaugeIn(t);
    if (group.current) {
      group.current.visible = appear > 0;
      group.current.scale.setScalar(Math.max(1e-4, easeOutBack(appear)));
      group.current.position.y = GAUGE_POSITION.y + Math.sin(t * 0.9) * 0.04;
    }
    if (link.current) link.current.visible = appear > 0.5;

    const leads = Math.round(story.count(t));
    const drawn = Math.round(clamp01(leads / INTRO_LEADS) * 60) / 60;
    if (leads !== view.current.leads || drawn !== view.current.drawn) {
      view.current = { leads, drawn };
      face.paint();
    }
  });

  return (
    <>
      <group ref={link} visible={false}>
        <Line
          points={[
            [0, STACK_TOP + 0.2, 0],
            [GAUGE_POSITION.x, GAUGE_POSITION.y - CARD.h / 2, GAUGE_POSITION.z],
          ]}
          color={p.ink}
          lineWidth={1.2}
          dashed
          dashSize={0.1}
          gapSize={0.08}
          transparent
          opacity={0.5}
        />
      </group>
      <group ref={group} position={GAUGE_POSITION} rotation-y={FACING_YAW} visible={false}>
        <RoundedBox args={[CARD.w, CARD.h, CARD.d]} radius={0.1} smoothness={4} material={materials().ceramic} castShadow>
          <Outlines thickness={INK_PX} color={p.ink} />
        </RoundedBox>
        <mesh position-z={CARD.d / 2 + 0.002}>
          <planeGeometry args={[CARD.w - 0.1, CARD.h - 0.1]} />
          <meshBasicMaterial map={face.texture} transparent toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
