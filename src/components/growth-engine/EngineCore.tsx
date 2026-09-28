import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import { Color, Object3D, Vector3, type InstancedMesh, type MeshPhysicalMaterial, type MeshStandardMaterial } from "three";
import type { LineSegments2 } from "three-stdlib";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// The stack top: the Devable mark as the chip that powers growth. A black glossy
// package with the striped white "D", gold pins on all four edges and fine
// PCB traces etched across the top block from every pin, each ending in a via.
// Its arm leaves from the back edge to hold the growth screen (see GrowthScreen).
// When the signal reaches it, the chip powers up: the pins flash, emerald energy
// streams out along every trace and the D glints.

export const CHIP = { w: 1.7, h: 0.16, radius: 0.07 };
const PIN = { count: 9, pitch: 0.155, width: 0.07, length: 0.12, height: 0.025 };
/** Back-edge pins under the arm (toward the screen): no traces of their own, by index along the edge. */
const ARM_PINS = [5, 6, 7];
const SURFACE = 0.004; // traces ride just above the block's top face
const HALF = 1.42; // keep traces inside the top face (half-width 1.5)
const INK = "#2a2f36"; // etched copper, darkened
const ENERGY = "#34d399";

/** Where pin i sits along its edge. */
const pinX = (i: number) => (i - (PIN.count - 1) / 2) * PIN.pitch;

// Sides as outward normal and tangent on the top face (x, z).
const SIDES: { n: [number, number]; t: [number, number] }[] = [
  { n: [1, 0], t: [0, 1] },
  { n: [0, -1], t: [1, 0] },
  { n: [-1, 0], t: [0, -1] },
  { n: [0, 1], t: [-1, 0] },
];

/** Deterministic PCB routing: from each pin tip outward, some with a 45° bend, ending in a via. */
function layout() {
  const pins: { x: number; z: number; along: [number, number] }[] = [];
  const segments: Vector3[] = [];
  const vias: Vector3[] = [];
  SIDES.forEach(({ n, t }, s) => {
    for (let i = 0; i < PIN.count; i++) {
      const o = pinX(i);
      const base = CHIP.w / 2 + PIN.length / 2;
      pins.push({ x: n[0] * base + t[0] * o, z: n[1] * base + t[1] * o, along: n });
      if (s === 1 && ARM_PINS.includes(i)) continue; // these feed the arm
      const tip = CHIP.w / 2 + PIN.length + 0.01;
      const run = 0.12 + ((i * 37 + s * 11) % 5) * 0.06;
      const start = new Vector3(n[0] * tip + t[0] * o, SURFACE, n[1] * tip + t[1] * o);
      let end = start.clone().add(new Vector3(n[0] * run, 0, n[1] * run));
      segments.push(start, end);
      // Alternate pins bend 45° away from the middle of their edge.
      if ((i + s) % 2 === 0 && i !== (PIN.count - 1) / 2) {
        const away = Math.sign(o);
        const bent = end.clone().add(new Vector3((n[0] + t[0] * away) * 0.1, 0, (n[1] + t[1] * away) * 0.1));
        segments.push(end, bent);
        end = bent;
      }
      end.set(Math.max(-HALF, Math.min(HALF, end.x)), SURFACE, Math.max(-HALF, Math.min(HALF, end.z)));
      vias.push(end.clone());
    }
  });
  return { pins, segments, vias };
}

/** The mark's striped "D" (proportions from public/brand/devable-mark.png), white on transparent. */
export function drawMark(ctx: CanvasRenderingContext2D, w: number) {
  const s = w / 512;
  const [left, top, bottom, bend] = [110 * s, 103 * s, 408 * s, 265 * s];
  const rx = 150 * s;
  const ry = (bottom - top) / 2;
  ctx.save(); // repaints reuse the context, so don't let the clip stack up
  // The D: a flat left half and a rounded right half.
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
  const mark = useCanvasTexture(1024, 1024, drawMark);
  const body = useRef<MeshPhysicalMaterial>(null);
  const pinInk = useRef<MeshStandardMaterial>(null);
  const pins = useRef<InstancedMesh>(null);
  const vias = useRef<InstancedMesh>(null);
  const etch = useRef<LineSegments2>(null);
  const flow = useRef<LineSegments2>(null);
  const routed = useMemo(() => layout(), []);
  const placed = useRef(false);
  const scratch = useMemo(() => ({ dummy: new Object3D(), off: new Color("#c9ced6"), on: new Color(ENERGY), mixed: new Color() }), []);
  const lastLit = useRef(-1);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    // Place the pins and vias once.
    if (!placed.current && pins.current && vias.current) {
      const { dummy } = scratch;
      routed.pins.forEach(({ x, z, along }, i) => {
        dummy.position.set(x, PIN.height / 2 + 0.004, z);
        dummy.rotation.set(0, along[0] !== 0 ? 0 : Math.PI / 2, 0);
        dummy.updateMatrix();
        pins.current?.setMatrixAt(i, dummy.matrix);
      });
      pins.current.instanceMatrix.needsUpdate = true;
      routed.vias.forEach((v, i) => {
        dummy.position.copy(v);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        vias.current?.setMatrixAt(i, dummy.matrix);
        vias.current?.setColorAt(i, scratch.off);
      });
      vias.current.instanceMatrix.needsUpdate = true;
      placed.current = true;
    }

    const power = story.powerIn(t); // 0 → 1 as the chip powers up, then stays on
    const surge = story.core(t); // bright flash when a signal arrives
    if (body.current) body.current.emissiveIntensity = surge * 0.14;
    if (pinInk.current) pinInk.current.emissiveIntensity = 0.05 + surge * 0.8;
    if (etch.current) etch.current.material.opacity = 0.35 + power * 0.2;
    if (flow.current) {
      flow.current.material.opacity = power * (0.55 + surge * 0.45);
      flow.current.material.dashOffset = -t * (0.35 + surge * 1.2); // energy streams outward from the pins
    }
    // Vias light up with the chip; only rewrite their colors when the level changes.
    const lit = Math.round(Math.min(1, power * 0.6 + surge) * 40) / 40;
    const v = vias.current;
    if (v?.instanceColor && lit !== lastLit.current) {
      lastLit.current = lit;
      scratch.mixed.lerpColors(scratch.off, scratch.on, lit);
      for (let i = 0; i < routed.vias.length; i++) v.setColorAt(i, scratch.mixed);
      v.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* The package. */}
      <RoundedBox args={[CHIP.w, CHIP.h, CHIP.w]} radius={CHIP.radius} smoothness={5} position-y={CHIP.h / 2 + 0.005} castShadow receiveShadow>
        <meshPhysicalMaterial ref={body} color="#0b0c0e" roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} emissive="#ffffff" emissiveIntensity={0} />
      </RoundedBox>
      {/* The D on top, reading along the stack like the label text. */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position-y={CHIP.h + 0.007}>
        <planeGeometry args={[CHIP.w - 0.08, CHIP.w - 0.08]} />
        <meshBasicMaterial map={mark.texture} transparent toneMapped={false} />
      </mesh>
      {/* Gold pins on all four edges. */}
      <instancedMesh ref={pins} args={[undefined, undefined, routed.pins.length]} castShadow>
        <boxGeometry args={[PIN.length, PIN.height, PIN.width]} />
        <meshStandardMaterial ref={pinInk} color="#d9b872" metalness={0.75} roughness={0.28} emissive="#ffd98a" emissiveIntensity={0.05} />
      </instancedMesh>
      {/* Etched traces, and the energy that streams along them once powered. */}
      <Line ref={etch} points={routed.segments} segments color={INK} lineWidth={1.4} transparent opacity={0.35} />
      <Line
        ref={flow}
        points={routed.segments}
        segments
        color={ENERGY}
        lineWidth={1.8}
        dashed
        dashSize={0.06}
        gapSize={0.1}
        transparent
        opacity={0}
      />
      <instancedMesh ref={vias} args={[undefined, undefined, routed.vias.length]}>
        <cylinderGeometry args={[0.024, 0.024, 0.008, 20]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
