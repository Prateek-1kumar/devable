import { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import { BufferAttribute, Color, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { CHANNELS, drawGlyph } from "./channels";
import { LAYER, layerWidth, layerY } from "./layout";
import { GLASS_TONES, INK_PX, materials, palette } from "./palette";
import { FocusContext, HoverContext, clamp01, damp, easeOutBack, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// radius stays under half the depth, or RoundedBox swells into a thick rounded slab.
const PANEL = { w: 2.4, h: 0.36, d: 0.05, radius: 0.024 };
const LABEL = { w: 1.95, h: 0.26, px: [1200, 160] as const }; // text area left of the lights
const LIFT = 0.12; // ≈ 10px
const DROP = 1.4;
const CHIP = { w: 0.95, h: 0.22, px: [480, 112] as const };
// The colored core sits inside the glass shell, inset so a clear glass band shows around it.
const INSET = { side: 0.07, y: 0.05 };

/** Paints a vertical fade onto a block's vertices, `low` at the bottom edge into `high` at the top. */
function glassGradient(mesh: Mesh, low: string, high: string, height: number) {
  const pos = mesh.geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const from = new Color(low);
  const to = new Color(high);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const k = clamp01(pos.getY(i) / height + 0.5); // 0 at the bottom, 1 at the top
    c.lerpColors(from, to, k * k * (3 - 2 * k));
    c.toArray(colors, i * 3);
  }
  mesh.geometry.setAttribute("color", new BufferAttribute(colors, 3));
}

type Props = {
  index: number;
  /** Rendered on the layer's top surface (the engine core sits on the top layer). */
  children?: ReactNode;
};

/**
 * One block of the growth stack: a colored core cased in frosted glass, with a
 * tinted label panel, trim and three signal lights, and a live lead chip. Every
 * edge is drawn in the channel's own deep tone, never black.
 */
export default function StackLayer({ index, children }: Props) {
  const story = useStory();
  const channel = CHANNELS[index];
  const p = palette();
  const m = materials();
  const tone = GLASS_TONES[index];
  const w = layerWidth(index);
  const h = LAYER.height;
  const core = { w: w - 2 * INSET.side, h: h - 2 * INSET.y };

  const [hovered, setHovered] = useState(false);
  const reportHover = useContext(HoverContext);
  const focused = useContext(FocusContext) === index;
  const raised = hovered || focused;
  const group = useRef<Group>(null);
  const sheen = useRef<MeshBasicMaterial>(null);
  const sheenMesh = useRef<Group>(null);
  const leds = useRef<(MeshStandardMaterial | null)[]>([]);
  const lift = useRef(0);
  const glow = useRef(0);
  const body = useRef<Mesh>(null);
  const shownLeads = useRef(-1);

  const off = useMemo(() => new Color(p.stone), [p]);
  const on = useMemo(() => new Color(channel.color), [channel]);

  // Runs after RoundedBox has built and centered its geometry (child effects run first).
  useLayoutEffect(() => {
    if (body.current) glassGradient(body.current, tone.low, tone.high, core.h);
  }, [tone, core.h]);

  const drawPanel = useCallback(
    (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      drawGlyph(ctx, channel.glyph, H * 0.45, H / 2, H * 0.6, channel.deep, p.bodyFont);
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
      ctx.fillStyle = p.ink;
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
      ctx.globalAlpha = 0.55;
      ctx.letterSpacing = `${H * 0.05}px`;
      ctx.textBaseline = "middle";
      ctx.fillText(`${channel.n} · ${channel.cap}`, H * 0.3, H / 2);
    },
    [channel, p],
  );
  const cap = useCanvasTexture(512, 96, drawCap);

  // Live metric chip: this channel's leads so far, in its color.
  const drawChip = useCallback(
    (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      ctx.fillStyle = channel.color;
      ctx.beginPath();
      ctx.roundRect(2, 2, W - 4, H - 4, (H - 4) / 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${H * 0.46}px ${p.bodyFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`+${Math.max(0, shownLeads.current).toLocaleString("en-US")} leads`, W / 2, H / 2 + 2);
    },
    [channel, p],
  );
  const chip = useCanvasTexture(CHIP.px[0], CHIP.px[1], drawChip);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = story.time(state.clock.elapsedTime);
    const dt = Math.min(delta, 1 / 30);
    const settle = (current: number, target: number, speed: number) => (story.still ? target : damp(current, target, speed, dt));

    const arrive = story.layerIn(index, t);
    g.visible = arrive > 0;
    lift.current = settle(lift.current, raised ? LIFT : 0, 10);
    g.position.y = layerY(index) + (1 - easeOutBack(arrive)) * DROP + lift.current;
    g.scale.setScalar(0.85 + 0.15 * easeOutCubic(arrive));

    glow.current = settle(glow.current, story.lit(index, t) * 0.35 + story.flash(index, t) + (raised ? 0.5 : 0), 14);
    for (const led of leds.current) {
      if (!led) continue;
      led.color.lerpColors(off, on, clamp01(glow.current * 2));
      led.emissiveIntensity = glow.current * 1.4;
    }

    const leads = Math.round(story.countBy(t)[index]);
    if (leads !== shownLeads.current) {
      shownLeads.current = leads;
      chip.paint();
    }

    // The sheen plane's own opacity is 0 outside a sweep, so it needs no visibility toggle.
    const s = story.sheen(index, t);
    if (sheen.current) sheen.current.opacity = s >= 0 ? Math.sin(Math.PI * s) * 0.22 : 0;
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
      {/* Colored core, edged in its own deep tone, then the frosted glass shell around it. */}
      <RoundedBox ref={body} args={[core.w, core.h, core.w]} radius={0.07} smoothness={4} material={m.frost} castShadow receiveShadow>
        <Outlines thickness={INK_PX} color={tone.edge} />
      </RoundedBox>
      <RoundedBox args={[w, h, w]} radius={LAYER.radius} smoothness={5} material={m.shell[index]} />
      <RoundedBox args={[w + 0.04, 0.1, w + 0.04]} radius={0.045} smoothness={3} position={[0, -h / 2 + 0.08, 0]} material={m.trimTint[index]} castShadow>
        <Outlines thickness={INK_PX} color={tone.edge} />
      </RoundedBox>

      {/* Front: tinted label panel with glyph + name, three signal lights and a sheen sweep. */}
      <RoundedBox args={[PANEL.w, PANEL.h, PANEL.d]} radius={PANEL.radius} smoothness={4} position={[0, 0.02, front]} material={m.panelTint[index]}>
        <Outlines thickness={INK_PX} color={tone.edge} />
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
            emissive={channel.color}
            emissiveIntensity={0}
            roughness={0.3}
          />
        </mesh>
      ))}
      <group ref={sheenMesh} position={[0, 0.02, front + PANEL.d / 2 + 0.004]}>
        <mesh>
          <planeGeometry args={[0.3, PANEL.h * 0.8]} />
          <meshBasicMaterial ref={sheen} color={channel.color} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {/* Right side: engraved "01 · depth" caption. */}
      <mesh rotation-y={Math.PI / 2} position={[w / 2 + 0.003, 0.02, w / 2 - 0.95]}>
        <planeGeometry args={[1.6, 0.3]} />
        <meshBasicMaterial map={cap.texture} transparent toneMapped={false} />
      </mesh>

      {/* Right side, further back: the live lead chip. */}
      <mesh rotation-y={Math.PI / 2} position={[w / 2 + 0.004, 0.02, -w / 2 + 0.75]}>
        <planeGeometry args={[CHIP.w, CHIP.h]} />
        <meshBasicMaterial map={chip.texture} transparent toneMapped={false} />
      </mesh>

      <group position={[0, h / 2, 0]}>{children}</group>

    </group>
  );
}
