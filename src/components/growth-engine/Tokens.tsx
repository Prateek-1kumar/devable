import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import { Shape, Vector3, type Group, type Mesh } from "three";
import { CHANNELS } from "./channels";
import { FACING_YAW, TOKEN_DEST, layerY } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { BURST, FLIGHT, clamp01, easeOutBack, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// What each channel sends out, as puffy pastel vinyl toys: a doc page, a
// search pill with a magnifier and an AI sparkle, an upvoted comment bubble
// and a short-video card. Each flies from its layer to its spot in the hero,
// then bursts into lead pearls (see LeadStream).

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

/** A canvas-drawn decal floating just in front of a face. */
function Face({ width, height, z, draw }: { width: number; height: number; z: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }) {
  const { texture } = useCanvasTexture(512, Math.round((512 * height) / width), draw);
  return (
    <mesh position-z={z}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

// Puffy extrusion: a thin slab with a deep, soft bevel, like an inflated vinyl shape.
const PUFFY = (depth: number, bevel: number) => ({ depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 24 });

/** A rounded rectangle path, centered on the origin. */
function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** 01 Technical Content: a doc page with a folded corner and syntax-colored code. */
export function DocToken() {
  const p = palette();
  const m = materials();
  const c = CHANNELS[0];
  const W = 0.56;
  const H = 0.72;
  const FOLD = 0.16;
  const DEPTH = 0.05;
  const BEVEL = 0.03;
  const [page, flap] = useMemo(() => {
    const page = new Shape();
    page.moveTo(-W / 2, -H / 2);
    page.lineTo(W / 2, -H / 2);
    page.lineTo(W / 2, H / 2 - FOLD);
    page.lineTo(W / 2 - FOLD, H / 2);
    page.lineTo(-W / 2, H / 2);
    page.closePath();
    const flap = new Shape();
    flap.moveTo(W / 2 - FOLD, H / 2);
    flap.lineTo(W / 2 - FOLD, H / 2 - FOLD);
    flap.lineTo(W / 2, H / 2 - FOLD);
    flap.closePath();
    return [page, flap];
  }, []);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Editor dots, then code lines of varied length in the channel's shades.
      [c.deep, c.color, "#ffffff"].forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(w * (0.14 + i * 0.09), h * 0.12, w * 0.028, 0, Math.PI * 2);
        ctx.fill();
      });
      const LINES: [number, number, string][] = [
        [0.1, 0.46, c.deep],
        [0.18, 0.36, c.color],
        [0.18, 0.5, "#ffffff"],
        [0.1, 0.3, c.deep],
        [0.18, 0.56, "#ffffff"],
        [0.1, 0.24, c.color],
      ];
      LINES.forEach(([x, len, color], i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(w * x, h * (0.26 + i * 0.115), w * len, h * 0.05, h * 0.025);
        ctx.fill();
      });
    },
    [c],
  );
  return (
    <group position-z={-(DEPTH + BEVEL) / 2}>
      <mesh material={m.vinyl[0]} castShadow>
        <extrudeGeometry args={[page, PUFFY(DEPTH, BEVEL)]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <mesh position-z={DEPTH + BEVEL * 0.6} material={m.vinylWhite}>
        <extrudeGeometry args={[flap, PUFFY(0.01, 0.012)]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <Face width={W * 0.92} height={H * 0.92} z={DEPTH + BEVEL + 0.002} draw={draw} />
    </group>
  );
}

/** 02 SEO + AI Search: a search pill, a glass magnifier over its end and an AI sparkle. */
export function SearchToken() {
  const p = palette();
  const m = materials();
  const c = CHANNELS[1];
  const sparkle = useRef<Mesh>(null);
  const [pill, field, star] = useMemo(() => {
    const star = new Shape();
    const R = 0.11;
    const r = 0.03;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
      const d = i % 2 ? r : R;
      if (i === 0) star.moveTo(Math.cos(a) * d, Math.sin(a) * d);
      else star.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    }
    star.closePath();
    return [roundedRect(1.0, 0.3, 0.15), roundedRect(0.84, 0.18, 0.09), star];
  }, []);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Query text in the field: two soft bars.
      ctx.fillStyle = c.deep;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.36, w * 0.36, h * 0.28, h * 0.14);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.roundRect(w * 0.47, h * 0.36, w * 0.18, h * 0.28, h * 0.14);
      ctx.fill();
    },
    [c],
  );
  useFrame((state) => {
    if (sparkle.current) sparkle.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.6) * 0.4;
  });
  return (
    <group>
      <mesh position-z={-0.05} material={m.vinyl[1]} castShadow>
        <extrudeGeometry args={[pill, PUFFY(0.04, 0.035)]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <mesh position={[-0.04, 0, 0.02]} material={m.vinylWhite}>
        <extrudeGeometry args={[field, PUFFY(0.01, 0.012)]} />
      </mesh>
      <Face width={0.84} height={0.18} z={0.045} draw={draw} />
      {/* Magnifier over the right end: white ring, glass lens, angled handle. */}
      <group position={[0.36, 0.04, 0.1]}>
        <mesh material={m.vinylWhite} castShadow>
          <torusGeometry args={[0.13, 0.035, 16, 48]} />
          <Outlines thickness={INK_PX} color={p.ink} />
        </mesh>
        <mesh material={m.lens}>
          <circleGeometry args={[0.12, 40]} />
        </mesh>
        <mesh position={[0.14, -0.14, 0]} rotation-z={Math.PI / 4} material={m.deep[1]} castShadow>
          <capsuleGeometry args={[0.035, 0.12, 8, 16]} />
          <Outlines thickness={INK_PX} color={p.ink} />
        </mesh>
      </group>
      {/* The AI sparkle, gently twisting. */}
      <mesh ref={sparkle} position={[0.5, 0.3, 0.06]} material={m.vinylWhite} castShadow>
        <extrudeGeometry args={[star, PUFFY(0.02, 0.015)]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
    </group>
  );
}

/** 03 Reddit: a comment bubble with an upvote arrow and its score. */
export function UpvoteToken() {
  const p = palette();
  const m = materials();
  const c = CHANNELS[2];
  const [bubble, arrow] = useMemo(() => {
    // Rounded bubble with a tail off its bottom-left edge.
    const b = new Shape();
    b.moveTo(-0.04, -0.24);
    b.lineTo(0.22, -0.24);
    b.quadraticCurveTo(0.36, -0.24, 0.36, -0.1);
    b.lineTo(0.36, 0.1);
    b.quadraticCurveTo(0.36, 0.24, 0.22, 0.24);
    b.lineTo(-0.22, 0.24);
    b.quadraticCurveTo(-0.36, 0.24, -0.36, 0.1);
    b.lineTo(-0.36, -0.1);
    b.quadraticCurveTo(-0.36, -0.24, -0.22, -0.24);
    b.lineTo(-0.18, -0.24);
    b.lineTo(-0.27, -0.37);
    b.closePath();
    const a = new Shape();
    a.moveTo(0, 0.13);
    a.lineTo(0.12, 0.01);
    a.lineTo(0.045, 0.01);
    a.lineTo(0.045, -0.12);
    a.lineTo(-0.045, -0.12);
    a.lineTo(-0.045, 0.01);
    a.lineTo(-0.12, 0.01);
    a.closePath();
    return [b, a];
  }, []);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = c.deep;
      ctx.font = `700 ${h * 0.5}px ${p.bodyFont}`;
      ctx.textBaseline = "middle";
      ctx.fillText("1.2k", w * 0.06, h * 0.54);
    },
    [c, p],
  );
  return (
    <group position-z={-0.05}>
      <mesh material={m.vinyl[2]} castShadow>
        <extrudeGeometry args={[bubble, PUFFY(0.04, 0.035)]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <mesh position={[-0.17, 0.005, 0.075]} material={m.vinylWhite} castShadow>
        <extrudeGeometry args={[arrow, PUFFY(0.02, 0.02)]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <group position-x={0.12}>
        <Face width={0.36} height={0.22} z={0.078} draw={draw} />
      </group>
    </group>
  );
}

/** 04 Creators: a vertical short-video card with a play button and a progress bar. */
export function VideoToken() {
  const p = palette();
  const m = materials();
  const c = CHANNELS[3];
  const triangle = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.035, 0.05);
    s.lineTo(0.055, 0);
    s.lineTo(-0.035, -0.05);
    s.closePath();
    return s;
  }, []);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Screen inset, caption lines and a progress bar.
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.06, w * 0.84, h * 0.88, w * 0.1);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.pastel;
      ctx.beginPath();
      ctx.roundRect(w * 0.16, h * 0.84, w * 0.68, h * 0.03, h * 0.015);
      ctx.fill();
      ctx.fillStyle = c.deep;
      ctx.beginPath();
      ctx.roundRect(w * 0.16, h * 0.84, w * 0.42, h * 0.03, h * 0.015);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.58, h * 0.855, h * 0.024, 0, Math.PI * 2);
      ctx.fill();
      // Caption lines above the bar.
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.roundRect(w * 0.16, h * 0.72, w * 0.5, h * 0.03, h * 0.015);
      ctx.roundRect(w * 0.16, h * 0.77, w * 0.32, h * 0.03, h * 0.015);
      ctx.fill();
    },
    [c],
  );
  return (
    <group>
      <RoundedBox args={[0.46, 0.78, 0.1]} radius={0.045} smoothness={4} material={m.vinyl[3]} castShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </RoundedBox>
      <Face width={0.44} height={0.76} z={0.052} draw={draw} />
      {/* Puffy play button floating on the screen. */}
      <group position={[0, 0.06, 0.08]}>
        <mesh rotation-x={Math.PI / 2} material={m.vinylWhite} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 40]} />
          <Outlines thickness={INK_PX} color={p.ink} />
        </mesh>
        <mesh position-z={0.025} material={m.deep[3]}>
          <extrudeGeometry args={[triangle, PUFFY(0.01, 0.01)]} />
        </mesh>
      </group>
    </group>
  );
}

/** All four tokens, each ready to fly from its own layer. */
export default function ChannelTokens() {
  return (
    <>
      <Flight index={0}>
        <DocToken />
      </Flight>
      <Flight index={1}>
        <SearchToken />
      </Flight>
      <Flight index={2}>
        <UpvoteToken />
      </Flight>
      <Flight index={3}>
        <VideoToken />
      </Flight>
    </>
  );
}
