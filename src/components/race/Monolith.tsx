import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CatmullRomCurve3, Color, ExtrudeGeometry, Object3D, Shape, Vector3, type Group, type InstancedMesh, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { drawMark } from "../growth-engine/marks";
import { materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { C, look } from "./look";
import { store } from "./store";
import { T, batonAt, display, displayTint, dockGlow, pinFlare, slotFlash, stripes } from "./timeline";
import { HALF, MONOLITH } from "./track";

// The Devable growth system as the race's timing monolith: the brand mark as a
// free-standing black tower (the striped white D on a rounded square) with gold
// pins down its edges, a champagne collar over a bezelled black-glass race clock,
// on a black plinth with a champagne base band and an aluminum maker's plate.
// Its four stripes are the start lights; the clock ends on the result. A timing
// cable runs to the photo-finish posts on the line.
// Your tool is the baton: it lifts off its plinth and docks into the top slot.
// Every black and screen material here ignores fog, so the mark stays crisp.

const SLAB = { side: 1.36, r: 0.3, depth: 0.16, y: 1.82 };
const EDGE = SLAB.side / 2 + 0.02; // outer edge, bevel included
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const PIN = { count: 7, pitch: 0.15 };
const DISPLAY = { y: 0.95, bezel: [1.3, 0.29] as const, glass: [1.26, 0.25] as const, screen: [1.22, 0.22] as const };

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

/** Gold pins on the left, right and top edges (the top-middle one gives way to the slot). */
function pinLayout() {
  const out: { x: number; y: number; vertical: boolean }[] = [];
  for (let j = 0; j < PIN.count; j++) {
    const o = (j - (PIN.count - 1) / 2) * PIN.pitch;
    out.push({ x: -EDGE, y: SLAB.y + o, vertical: false }, { x: EDGE, y: SLAB.y + o, vertical: false });
    if (j !== (PIN.count - 1) / 2) out.push({ x: o, y: SLAB.y + EDGE, vertical: true });
  }
  return out;
}

function Pins() {
  const pins = useMemo(() => pinLayout(), []);
  const mesh = useRef<InstancedMesh>(null);
  const gold = useRef<MeshStandardMaterial>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    pins.forEach(({ x, y, vertical }, i) => {
      o.position.set(x, y, 0);
      o.rotation.set(0, 0, vertical ? Math.PI / 2 : 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [pins]);
  useFrame(() => {
    if (gold.current) gold.current.emissiveIntensity = 0.25 + 0.65 * pinFlare(store.p);
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, pins.length]} castShadow>
      {/* 0.06 out × 0.035 along × 0.02 thick, half of it proud of the edge. */}
      <boxGeometry args={[0.06, 0.035, 0.02]} />
      <meshStandardMaterial ref={gold} color={C.GOLD} metalness={0.75} roughness={0.28} emissive={C.GOLD_GLOW} emissiveIntensity={0.25} fog={false} />
    </instancedMesh>
  );
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

/** The race clock: a seven-segment feel (ghost 8s under every glyph), repainted only when its text or ink changes. */
function Screen() {
  const view = useRef({ text: display(store.p), tint: displayTint(store.p) });
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { text, tint } = view.current;
    ctx.save();
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#12151a");
    bg.addColorStop(1, "#0a0c0f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `500 108px ${MONO}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = tint;
    const advance = ctx.measureText("8").width + 8;
    let x = (w - (text.length * advance - 8)) / 2;
    for (const ch of text) {
      ctx.globalAlpha = 0.07;
      ctx.fillText("8", x, h / 2 + 6);
      ctx.globalAlpha = 1;
      if (ch !== " ") ctx.fillText(ch, x, h / 2 + 6);
      x += advance;
    }
    ctx.restore();
  }, []);
  const tex = useCanvasTexture(1024, 184, draw);
  useFrame(() => {
    const p = store.p;
    const next = { text: display(p), tint: displayTint(p) };
    if (next.text === view.current.text && next.tint === view.current.tint) return;
    view.current = next;
    tex.paint();
  });
  return (
    <mesh position={[0, DISPLAY.y, 0.0975]}>
      <planeGeometry args={DISPLAY.screen} />
      <meshBasicMaterial map={tex.texture} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** Two status LEDs under the clock: mint once the race is live, amber through the sprint's spike. */
function StatusLeds() {
  const mint = useRef<MeshStandardMaterial>(null);
  const amber = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    const p = store.p;
    const set = (mat: MeshStandardMaterial | null, on: boolean) => {
      if (!mat) return;
      mat.color.set(on ? mat.emissive : "#23282e");
      mat.emissiveIntensity = on ? 0.9 : 0;
    };
    set(mint.current, p >= T.go);
    set(amber.current, p >= T.spike[0] && p < T.decay[1]);
  });
  return (
    <group position={[0.52, 0.778, 0.072]}>
      <mesh>
        <sphereGeometry args={[0.018, 16, 12]} />
        <meshStandardMaterial ref={mint} color="#23282e" emissive={C.MINT} emissiveIntensity={0} roughness={0.25} fog={false} />
      </mesh>
      <mesh position-x={0.05}>
        <sphereGeometry args={[0.018, 16, 12]} />
        <meshStandardMaterial ref={amber} color="#23282e" emissive={C.AMBER} emissiveIntensity={0} roughness={0.25} fog={false} />
      </mesh>
    </group>
  );
}

function Slot() {
  const m = materials();
  const disc = useRef<MeshBasicMaterial>(null);
  const colors = useMemo(() => ({ off: new Color("#000000"), on: new Color(C.MINT) }), []);
  useFrame(() => disc.current?.color.lerpColors(colors.off, colors.on, dockGlow(store.p)));
  const top = SLAB.y + EDGE;
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

/** The aluminum maker's plate on the plinth. */
function Plate() {
  const m = materials();
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.font = `600 34px ${MONO}`;
    ctx.letterSpacing = "7px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.INK;
    ctx.fillText("DEVABLE · TIMING", w / 2 + 3, h / 2 + 2);
    ctx.restore();
  }, []);
  const label = useCanvasTexture(512, 100, draw);
  return (
    <group position={[0, 0.55, 0.152]}>
      <mesh material={m.alu}>
        <boxGeometry args={[0.36, 0.07, 0.004]} />
      </mesh>
      <mesh position-z={0.0025}>
        <planeGeometry args={[0.36, 0.07]} />
        <meshBasicMaterial map={label.texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Your tool: a porcelain baton with black end caps, a champagne collar, a mint grip light and a "›_" band. */
function Baton() {
  const m = materials();
  const L = look();
  const group = useRef<Group>(null);
  const grip = useRef<MeshStandardMaterial>(null);
  const led = useRef<MeshStandardMaterial>(null);
  const at = useRef([0, 0, 0]);
  const colors = useMemo(() => ({ on: new Color(C.MINT), off: new Color("#1d2a24") }), []);
  const drawBand = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.fillStyle = C.INK;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `600 22px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.PORCELAIN;
    ctx.fillText("›_", w / 4, h / 2 + 1);
    ctx.fillText("›_", (3 * w) / 4, h / 2 + 1);
    ctx.restore();
  }, []);
  const band = useCanvasTexture(128, 32, drawBand);
  useFrame(() => {
    const p = store.p;
    const g = group.current;
    if (!g) return;
    const c = batonAt(p, at.current);
    g.visible = c !== null;
    if (c) g.position.set(c[0], c[1], c[2]);
    const flying = p > T.batonLift[0];
    if (grip.current) grip.current.emissiveIntensity = flying ? 0.6 + 0.3 * Math.sin(8 * Math.PI * p) : 0.6;
    const on = p <= T.batonLift[0] + 0.01;
    if (led.current) {
      led.current.color.copy(on ? colors.on : colors.off);
      led.current.emissiveIntensity = on ? 0.8 : 0;
    }
  });
  return (
    <group>
      <group ref={group}>
        <mesh material={m.porcelain} castShadow>
          <capsuleGeometry args={[0.045, 0.44, 8, 20]} />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s} scale-y={s}>
            <mesh position-y={0.21} material={L.ink}>
              <cylinderGeometry args={[0.046, 0.046, 0.02, 32]} />
            </mesh>
            <mesh position-y={0.22} material={L.ink}>
              <sphereGeometry args={[0.046, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        ))}
        <mesh position-y={0.16} material={m.champagne} castShadow>
          <cylinderGeometry args={[0.047, 0.047, 0.03, 32]} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.0465, 0.0465, 0.012, 32]} />
          <meshStandardMaterial ref={grip} color={C.MINT} roughness={0.3} emissive={C.MINT} emissiveIntensity={0.6} />
        </mesh>
        <mesh position-y={-0.12}>
          <cylinderGeometry args={[0.0462, 0.0462, 0.05, 32]} />
          <meshPhysicalMaterial map={band.texture} roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} fog={false} />
        </mesh>
      </group>
      {/* The baton's plinth: porcelain, a champagne rim, a glass top and a mint ring that goes dark as the baton leaves. */}
      <group position={[2.75, 0, 0.4]}>
        <mesh position-y={0.17} material={m.porcelain} castShadow receiveShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.34, 48]} />
        </mesh>
        <mesh position-y={0.346} material={m.champagne} castShadow>
          <cylinderGeometry args={[0.135, 0.135, 0.012, 48]} />
        </mesh>
        <mesh position-y={0.354} material={m.glass}>
          <cylinderGeometry args={[0.12, 0.12, 0.004, 48]} />
        </mesh>
        <mesh position-y={0.3565} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.07, 0.085, 48]} />
          <meshStandardMaterial ref={led} color={C.MINT} roughness={0.3} emissive={C.MINT} emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/** Photo-finish posts either side of the line, joined to the monolith by the timing cable. */
const POSTS = [1.86, 3.58];
function Timing() {
  const m = materials();
  const L = look();
  const cable = useMemo(() => {
    const y = 0.024; // resting on the turf (top 0.012)
    return new CatmullRomCurve3([
      new Vector3(3.0, y, 1.56),
      new Vector3(2.95, y, 1.68),
      new Vector3(2.86, y, 1.76),
      new Vector3(HALF, y, POSTS[0] - 0.03),
    ]);
  }, []);
  return (
    <group>
      <mesh material={L.cable} castShadow>
        <tubeGeometry args={[cable, 48, 0.012, 8, false]} />
      </mesh>
      {POSTS.map((z, i) => (
        <group key={z} position={[HALF, 0, z]}>
          <RoundedBox args={[0.05, 0.26, 0.05]} radius={0.012} smoothness={3} position-y={0.13} material={L.ink} castShadow />
          <mesh position={[0, 0.2, i === 0 ? 0.026 : -0.026]} rotation-x={Math.PI / 2} material={L.mint}>
            <cylinderGeometry args={[0.014, 0.014, 0.012, 20]} />
          </mesh>
          <mesh position-y={0.266} material={m.champagne} castShadow>
            <boxGeometry args={[0.06, 0.012, 0.06]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Monolith() {
  const m = materials();
  const slab = useMemo(() => slabGeometry(), []);
  const chip = look().chip;
  // The black body flashes faintly as the baton docks.
  useFrame(() => {
    look().chip.emissiveIntensity = 0.08 * slotFlash(store.p);
  });
  return (
    <group>
      <group position={[MONOLITH.x, 0, MONOLITH.z]} rotation-y={MONOLITH.yaw}>
        {/* Porcelain base disc with a champagne ring. */}
        <mesh position-y={0.015} material={m.porcelain} receiveShadow castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.03, 64]} />
        </mesh>
        <mesh position-y={0.031} rotation-x={-Math.PI / 2} material={m.champagne}>
          <ringGeometry args={[0.5, 0.55, 64]} />
        </mesh>
        {/* Plinth, with its champagne base band and maker's plate. */}
        <RoundedBox args={[0.62, 0.72, 0.3]} radius={0.1} smoothness={4} position-y={0.39} material={chip} castShadow receiveShadow />
        <RoundedBox args={[0.64, 0.04, 0.32]} radius={0.015} smoothness={3} position-y={0.05} material={m.champagne} castShadow />
        <Plate />
        {/* The clock: black glass in a champagne bezel. */}
        <RoundedBox args={[1.36, 0.36, 0.16]} radius={0.06} smoothness={4} position-y={0.93} material={chip} castShadow receiveShadow />
        <RoundedBox args={[DISPLAY.bezel[0], DISPLAY.bezel[1], 0.012]} radius={0.005} smoothness={2} position={[0, DISPLAY.y, 0.086]} material={m.champagne} />
        <RoundedBox args={[DISPLAY.glass[0], DISPLAY.glass[1], 0.012]} radius={0.005} smoothness={2} position={[0, DISPLAY.y, 0.09]} material={m.glass} />
        <Screen />
        <StatusLeds />
        {/* The collar closes the gap between the clock and the slab. */}
        <RoundedBox args={[0.56, 0.03, 0.2]} radius={0.01} smoothness={2} position-y={1.125} material={m.champagne} castShadow />
        <mesh geometry={slab} position-y={SLAB.y} material={chip} castShadow receiveShadow />
        <Pins />
        <DFace />
        <Slot />
      </group>
      <Baton />
      <Timing />
    </group>
  );
}
