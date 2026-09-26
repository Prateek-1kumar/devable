import { useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import { AdditiveBlending, Color, type Group, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { CHANNELS, drawGlyph } from "./channels";
import { LAYER, layerWidth, layerY } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { HoverContext, clamp01, damp, easeOutBack, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

const PANEL = { w: 2.4, h: 0.36, d: 0.05, radius: 0.08 };
const LABEL = { w: 1.95, h: 0.26, px: [1200, 160] as const }; // text area left of the lights
const LIFT = 0.12; // ≈ 10px
const DROP = 1.4;

type Props = {
  index: number;
  /** Rendered on the layer's top surface (the engine core sits on the top layer). */
  children?: ReactNode;
};

/** One slab of the growth stack: ceramic body, teal trim, dark label panel, three signal lights. */
export default function StackLayer({ index, children }: Props) {
  const story = useStory();
  const channel = CHANNELS[index];
  const p = palette();
  const m = materials();
  const w = layerWidth(index);
  const h = LAYER.height;

  const [hovered, setHovered] = useState(false);
  const reportHover = useContext(HoverContext);
  const group = useRef<Group>(null);
  const sheen = useRef<MeshBasicMaterial>(null);
  const sheenMesh = useRef<Group>(null);
  const leds = useRef<(MeshStandardMaterial | null)[]>([]);
  const lift = useRef(0);
  const glow = useRef(0);

  const off = useMemo(() => new Color(p.stone), [p]);
  const on = useMemo(() => new Color(p.amber), [p]);

  const drawPanel = useCallback(
    (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      drawGlyph(ctx, channel.glyph, H * 0.45, H / 2, H * 0.6, p.teal, p.bodyFont);
      // As large as the panel allows; long names shrink just enough to fit.
      const x = H * 0.95;
      let size = H * 0.6;
      ctx.font = `600 ${size}px ${p.bodyFont}`;
      const room = W - x - H * 0.15;
      const width = ctx.measureText(channel.name).width;
      if (width > room) {
        size *= room / width;
        ctx.font = `600 ${size}px ${p.bodyFont}`;
      }
      ctx.fillStyle = p.cream;
      ctx.textBaseline = "middle";
      ctx.fillText(channel.name, x, H / 2 + 3);
    },
    [channel, p],
  );
  const panel = useCanvasTexture(LABEL.px[0], LABEL.px[1], drawPanel);

  const drawCap = useCallback(
    (ctx: CanvasRenderingContext2D, _w: number, H: number) => {
      ctx.font = `500 ${H * 0.46}px ${p.bodyFont}`;
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.5;
      ctx.letterSpacing = `${H * 0.05}px`;
      ctx.textBaseline = "middle";
      ctx.fillText(`${channel.n} · ${channel.cap}`, H * 0.3, H / 2);
    },
    [channel, p],
  );
  const cap = useCanvasTexture(512, 96, drawCap);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = story.time(state.clock.elapsedTime);
    const dt = Math.min(delta, 1 / 30);
    const settle = (current: number, target: number, speed: number) => (story.still ? target : damp(current, target, speed, dt));

    const arrive = story.layerIn(index, t);
    g.visible = arrive > 0;
    lift.current = settle(lift.current, hovered ? LIFT : 0, 10);
    g.position.y = layerY(index) + (1 - easeOutBack(arrive)) * DROP + lift.current;
    g.scale.setScalar(0.85 + 0.15 * easeOutCubic(arrive));

    glow.current = settle(glow.current, story.lit(index, t) * 0.35 + story.flash(index, t) + (hovered ? 0.5 : 0), 14);
    for (const led of leds.current) {
      if (!led) continue;
      led.color.lerpColors(off, on, clamp01(glow.current * 2));
      led.emissiveIntensity = glow.current * 1.4;
    }

    // The sheen plane's own opacity is 0 outside a sweep, so it needs no visibility toggle.
    const s = story.sheen(index, t);
    if (sheen.current) sheen.current.opacity = s >= 0 ? Math.sin(Math.PI * s) * 0.3 : 0;
    if (sheenMesh.current) sheenMesh.current.position.x = (Math.max(0, s) - 0.5) * PANEL.w;
  });

  const front = w / 2 + PANEL.d / 2 - 0.015;
  return (
    <group
      ref={group}
      visible={false}
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
      <RoundedBox args={[w, h, w]} radius={LAYER.radius} smoothness={4} material={m.ceramic} castShadow receiveShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </RoundedBox>
      <RoundedBox args={[w + 0.04, 0.1, w + 0.04]} radius={0.045} smoothness={3} position={[0, -h / 2 + 0.08, 0]} material={m.metal} castShadow />

      {/* Front: dark label panel with glyph + name, three signal lights and a sheen sweep. */}
      <RoundedBox args={[PANEL.w, PANEL.h, PANEL.d]} radius={PANEL.radius} smoothness={4} position={[0, 0.02, front]} material={m.screen}>
        <Outlines thickness={1} color={p.ink} />
      </RoundedBox>
      <mesh position={[-PANEL.w / 2 + 0.04 + LABEL.w / 2, 0.02, front + PANEL.d / 2 + 0.002]}>
        <planeGeometry args={[LABEL.w, LABEL.h]} />
        <meshBasicMaterial map={panel.texture} transparent toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[PANEL.w / 2 - 0.12 - k * 0.09, 0.02, front + PANEL.d / 2]}>
          <sphereGeometry args={[0.032, 16, 12]} />
          <meshStandardMaterial
            ref={(el) => {
              leds.current[k] = el;
            }}
            color={p.stone}
            emissive={p.amber}
            emissiveIntensity={0}
            roughness={0.3}
          />
        </mesh>
      ))}
      <group ref={sheenMesh} position={[0, 0.02, front + PANEL.d / 2 + 0.004]}>
        <mesh>
          <planeGeometry args={[0.3, PANEL.h * 0.8]} />
          <meshBasicMaterial ref={sheen} color="white" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {/* Right side: engraved "01 · depth" caption. */}
      <mesh rotation-y={Math.PI / 2} position={[w / 2 + 0.003, 0.02, w / 2 - 0.95]}>
        <planeGeometry args={[1.6, 0.3]} />
        <meshBasicMaterial map={cap.texture} transparent toneMapped={false} />
      </mesh>

      <group position={[0, h / 2, 0]}>{children}</group>

    </group>
  );
}
