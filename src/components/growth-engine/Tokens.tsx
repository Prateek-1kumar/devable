import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import { Shape, Vector3, type Group } from "three";
import { drawGlyph } from "./channels";
import { FACING_YAW, TOKEN_DEST, layerY } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { BURST, FLIGHT, clamp01, easeOutBack, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// The small puffy objects each channel sends out: a code tile, a search
// card, an upvote and a play button. Each flies from its layer to its spot
// in the hero, then bursts into lead dots (see LeadStream).

/** Flies its children out of layer `index` whenever the story releases that channel's token. */
function Flight({ index, children }: { index: number; children: ReactNode }) {
  const story = useStory();
  const ref = useRef<Group>(null);
  const from = useMemo(() => new Vector3(0, layerY(index), 0), [index]);
  const to = TOKEN_DEST[index];

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = story.time(state.clock.elapsedTime);
    const age = story.tokenAge(index, t);
    g.visible = age !== null;
    if (age === null) return;
    const p = clamp01(age / FLIGHT);
    g.position.lerpVectors(from, to, easeOutCubic(p));
    g.position.y += Math.sin(Math.PI * p) * 0.5;
    const grow = easeOutBack(clamp01(p / 0.25));
    const shrink = 1 - clamp01((age - FLIGHT) / BURST);
    g.scale.setScalar(Math.max(1e-4, grow * shrink));
    g.rotation.set(Math.sin(t * 1.7 + index) * 0.12, FACING_YAW + Math.sin(t * 1.1 + index) * 0.35, Math.sin(t * 1.3) * 0.08);
  });

  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  );
}

function Face({ width, height, draw }: { width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }) {
  const { texture } = useCanvasTexture(512, Math.round((512 * height) / width), draw);
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

export function CodeToken() {
  const p = palette();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.font = `700 ${h * 0.5}px ${p.bodyFont}`;
      ctx.fillStyle = p.coral;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("{ }", w / 2, h / 2 + 4);
    },
    [p],
  );
  return (
    <group>
      <RoundedBox args={[0.62, 0.62, 0.18]} radius={0.08} smoothness={4} material={materials().ceramic} castShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </RoundedBox>
      <group position-z={0.091}>
        <Face width={0.56} height={0.56} draw={draw} />
      </group>
    </group>
  );
}

export function SearchToken() {
  const p = palette();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Search bar line + a teal ↗, like a tiny result card.
      ctx.fillStyle = p.stone;
      ctx.beginPath();
      ctx.roundRect(w * 0.1, h * 0.22, w * 0.8, h * 0.2, h * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(w * 0.1, h * 0.58, w * 0.46, h * 0.1, h * 0.05);
      ctx.fill();
      drawGlyph(ctx, "search", w * 0.78, h * 0.66, h * 0.36, p.teal, p.bodyFont);
    },
    [p],
  );
  return (
    <group>
      <RoundedBox args={[0.9, 0.56, 0.12]} radius={0.06} smoothness={4} material={materials().ceramic} castShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </RoundedBox>
      <group position-z={0.061}>
        <Face width={0.84} height={0.5} draw={draw} />
      </group>
    </group>
  );
}

const EXTRUDE = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4 };

export function UpvoteToken() {
  const arrow = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0.32);
    s.lineTo(0.28, 0.02);
    s.lineTo(0.11, 0.02);
    s.lineTo(0.11, -0.28);
    s.lineTo(-0.11, -0.28);
    s.lineTo(-0.11, 0.02);
    s.lineTo(-0.28, 0.02);
    s.closePath();
    return s;
  }, []);
  return (
    <mesh position-z={-0.05} material={materials().coralEnamel} castShadow>
      <extrudeGeometry args={[arrow, EXTRUDE]} />
      <Outlines thickness={INK_PX} color={palette().ink} />
    </mesh>
  );
}

export function PlayToken() {
  const p = palette();
  const triangle = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.09, 0.13);
    s.lineTo(0.14, 0);
    s.lineTo(-0.09, -0.13);
    s.closePath();
    return s;
  }, []);
  return (
    <group>
      <mesh rotation-x={Math.PI / 2} material={materials().tealEnamel} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.14, 48]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <mesh position-z={0.06} material={materials().ceramic}>
        <extrudeGeometry args={[triangle, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 }]} />
      </mesh>
    </group>
  );
}

/** All four tokens, each ready to fly from its own layer. */
export default function ChannelTokens() {
  return (
    <>
      <Flight index={0}>
        <CodeToken />
      </Flight>
      <Flight index={1}>
        <SearchToken />
      </Flight>
      <Flight index={2}>
        <UpvoteToken />
      </Flight>
      <Flight index={3}>
        <PlayToken />
      </Flight>
    </>
  );
}
