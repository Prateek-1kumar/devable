import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import { Color, ExtrudeGeometry, Shape, type Group, type MeshBasicMaterial } from "three";
import { drawMark } from "../growth-engine/marks";
import { materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { store } from "./store";
import { batonAt, display, slotFlash, stripes } from "./timeline";
import { MONOLITH } from "./track";

// The Devable growth system as the race's timing monolith: the brand mark as a
// free-standing black tower (the striped white D on a rounded square), over a
// black-glass race clock, on a black plinth, in the infield at the finish.
// Its four stripes are the start lights; the clock ends on the result.
// Your tool is the baton: it lifts off its plinth and docks into the top slot.
// Every black and screen material here ignores fog, so the mark stays crisp.

const INK = "#0b0c0e";
const MINT = "#34d399";
const SLAB = { side: 1.36, r: 0.3, depth: 0.16, y: 1.82 };
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function slabGeometry() {
  const h = SLAB.side / 2;
  const r = SLAB.r;
  const s = new Shape();
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  const g = new ExtrudeGeometry(s, { depth: SLAB.depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 24 });
  g.center();
  return g;
}

function Chip({ color = INK }: { color?: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} fog={false} />;
}

/** The D face: repaints only when a stripe changes. */
function DFace() {
  const view = useRef(stripes(store.p).join());
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number) => drawMark(ctx, w, view.current.split(",")), []);
  const tex = useCanvasTexture(1024, 1024, draw);
  useFrame(() => {
    const next = stripes(store.p).join();
    if (next === view.current) return;
    view.current = next;
    tex.paint();
  });
  return (
    <mesh position={[0, SLAB.y, SLAB.depth / 2 + 0.02 + 0.004]}>
      <planeGeometry args={[1.16, 1.16]} />
      <meshBasicMaterial map={tex.texture} transparent toneMapped={false} fog={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  );
}

/** The race clock: repaints only when its text changes. */
function Screen() {
  const view = useRef(display(store.p));
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#0d1110";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.font = `500 110px ${MONO}`;
    ctx.letterSpacing = "8px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(view.current, w / 2 + 4, h / 2 + 6); // +4: letter-spacing trails the last glyph
    ctx.restore();
  }, []);
  const tex = useCanvasTexture(1024, 224, draw);
  useFrame(() => {
    const next = display(store.p);
    if (next === view.current) return;
    view.current = next;
    tex.paint();
  });
  return (
    <mesh position={[0, 0.93, 0.083]}>
      <planeGeometry args={[1.26, 0.28]} />
      <meshBasicMaterial map={tex.texture} toneMapped={false} fog={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  );
}

function Slot() {
  const m = materials();
  const disc = useRef<MeshBasicMaterial>(null);
  const colors = useMemo(() => ({ off: new Color("#000000"), on: new Color(MINT) }), []);
  useFrame(() => disc.current?.color.lerpColors(colors.off, colors.on, slotFlash(store.p)));
  const top = SLAB.y + SLAB.side / 2 + 0.02;
  return (
    <group>
      <mesh position-y={top + 0.003} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.05, 32]} />
        <meshBasicMaterial ref={disc} color="#000000" toneMapped={false} fog={false} />
      </mesh>
      <mesh position-y={top + 0.002} rotation-x={-Math.PI / 2} material={m.alu}>
        <ringGeometry args={[0.05, 0.068, 32]} />
      </mesh>
    </group>
  );
}

/** Your tool: a porcelain baton with a champagne collar and a mint band. */
function Baton() {
  const m = materials();
  const group = useRef<Group>(null);
  const at = useRef([0, 0, 0]);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const c = batonAt(store.p, at.current);
    g.visible = c !== null;
    if (c) g.position.set(c[0], c[1], c[2]);
  });
  return (
    <group>
      <group ref={group}>
        <mesh material={m.porcelain} castShadow>
          <capsuleGeometry args={[0.045, 0.44, 8, 20]} />
        </mesh>
        <mesh position-y={0.16} material={m.champagne} castShadow>
          <cylinderGeometry args={[0.047, 0.047, 0.03, 32]} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.0465, 0.0465, 0.012, 32]} />
          <meshBasicMaterial color={MINT} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[2.75, 0.17, 0.4]} material={m.porcelain} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.34, 48]} />
        <Outlines thickness={1} color="#8a94a0" />
      </mesh>
    </group>
  );
}

export default function Monolith() {
  const m = materials();
  const slab = useMemo(() => slabGeometry(), []);
  return (
    <group>
      <group position={[MONOLITH.x, 0, MONOLITH.z]} rotation-y={MONOLITH.yaw}>
        <mesh position-y={0.015} material={m.ceramic} receiveShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.03, 64]} />
        </mesh>
        <RoundedBox args={[0.62, 0.72, 0.3]} radius={0.1} smoothness={4} position-y={0.39} castShadow receiveShadow>
          <Chip />
        </RoundedBox>
        <RoundedBox args={[1.36, 0.36, 0.16]} radius={0.06} smoothness={4} position-y={0.93} castShadow receiveShadow>
          <meshStandardMaterial color="#0d1012" roughness={0.15} metalness={0.2} fog={false} />
        </RoundedBox>
        <Screen />
        <mesh geometry={slab} position-y={SLAB.y} castShadow receiveShadow>
          <Chip />
        </mesh>
        <DFace />
        <Slot />
      </group>
      <Baton />
    </group>
  );
}
