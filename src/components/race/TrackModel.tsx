import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { Color, Shape, type Mesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHANNELS } from "../growth-engine/channels";
import { channelFocus } from "../growth-engine/channelFocus";
import { materials, palette } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { store } from "./store";
import { drawTo, sweep, twoLap } from "./sweep";
import { damp, laneWindow, smoothstep } from "./timeline";
import { LANE_R, LINE_R, START, TRACK_IN, TRACK_OUT, frac, ovalAt, type P3 } from "./track";

// The track as an architectural model: a pale infield, a porcelain curb, a
// grey ring with white lane lines, and four lanes whose pastel fills are poured
// in behind the runners. Ink finish line, white start line, lane numerals in
// the channels' deep colors (the only color in the opening frame), and blocks.

const DEEP = CHANNELS.map((c) => c.deep);
const EDGE = "#8a94a0";
const decal = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, depthWrite: false } as const;

function Infield() {
  const shape = useMemo(() => {
    const s = new Shape();
    const p: P3 = { x: 0, y: 0, z: 0 };
    for (let i = 0; i <= 256; i++) {
      ovalAt(i / 256, TRACK_IN - 0.06, p);
      if (i === 0) s.moveTo(p.x, -p.z);
      else s.lineTo(p.x, -p.z);
    }
    return s;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#f3f6f2" roughness={0.9} emissive="#f3f6f2" emissiveIntensity={0.4} />
    </mesh>
  );
}

function Ring() {
  const m = materials();
  const curb = useMemo(() => sweep({ from: 0, to: 1, steps: 512, inner: TRACK_IN - 0.06, outer: TRACK_IN, y1: 0.05, box: true }), []);
  const ring = useMemo(() => sweep({ from: 0, to: 1, steps: 512, inner: TRACK_IN, outer: TRACK_OUT, y1: 0.02, box: true }), []);
  const lines = useMemo(
    () => mergeGeometries(LINE_R.map((r) => sweep({ from: 0, to: 1, steps: 512, inner: r - 0.006, outer: r + 0.006, y1: 0.027 }))),
    [],
  );
  return (
    <group>
      <mesh geometry={curb} material={m.ceramic} castShadow receiveShadow>
        <Outlines thickness={1} color={EDGE} />
      </mesh>
      <mesh geometry={ring} receiveShadow>
        <meshStandardMaterial color="#e3e7e3" roughness={0.9} emissive="#e3e7e3" emissiveIntensity={0.34} />
      </mesh>
      <mesh geometry={lines}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** Lane fills in each channel's light fade. Hovering a channel in the hero copy lights its lane. */
function LaneFills() {
  const m = materials();
  const invalidate = useThree((s) => s.invalidate);
  const focus = useSyncExternalStore(channelFocus.subscribe, channelFocus.get, () => null);
  const geoms = useMemo(
    () =>
      CHANNELS.map(({ fade }, k) => {
        const [a, b] = [new Color(fade[0]), new Color(fade[1])];
        const c = new Color();
        return twoLap(LANE_R[k], 0.33, 0.024, (u) => c.lerpColors(a, b, smoothstep(frac(u - START))).toArray() as [number, number, number]);
      }),
    [],
  );
  const meshes = useRef<(Mesh | null)[]>([]);
  const reveal = useRef([0, 0, 0, 0]);
  const focusRef = useRef<number | null>(null);

  useEffect(() => {
    focusRef.current = focus;
    invalidate();
  }, [focus, invalidate]);

  useFrame((_, delta) => {
    const p = store.p;
    const dt = Math.min(delta, 1 / 30);
    let settling = false;
    for (let k = 0; k < 4; k++) {
      const target = p < 0.05 && focusRef.current === k ? 1 : 0;
      const r = reveal.current;
      r[k] = Math.abs(r[k] - target) < 1e-3 ? target : damp(r[k], target, 8, dt);
      if (r[k] !== target) settling = true;
      const mesh = meshes.current[k];
      if (!mesh) continue;
      const [a, b] = laneWindow(k, p);
      const empty = b <= a;
      const lo = empty ? 0 : a;
      const hi = Math.max(empty ? 0 : b, r[k]);
      mesh.visible = hi > lo;
      drawTo(mesh.geometry, lo / 2, hi / 2);
    }
    if (settling) invalidate();
  });

  return (
    <group>
      {geoms.map((g, k) => (
        <mesh
          key={k}
          ref={(el) => {
            meshes.current[k] = el;
          }}
          geometry={g}
          material={m.frost}
          visible={false}
          receiveShadow
        />
      ))}
    </group>
  );
}

function Numerals() {
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.font = `500 300px ${palette().bodyFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate((i + 0.5) * (w / 4), h / 2);
      ctx.scale(1, 1.35); // stretched along the lane, against the low camera's foreshortening
      ctx.fillStyle = DEEP[i];
      ctx.fillText(String(i + 1), 0, 8);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }, []);
  const tex = useCanvasTexture(1024, 712, draw);
  // Texture up = +x (toward the finish), texture right = +z (lane 1 → lane 4).
  return (
    <group position={[2.15, 0.029, (TRACK_IN + TRACK_OUT) / 2]} rotation-y={-Math.PI / 2}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[TRACK_OUT - TRACK_IN, 1]} />
        <meshBasicMaterial map={tex.texture} transparent {...decal} />
      </mesh>
    </group>
  );
}

function Blocks() {
  const m = materials();
  const PEDAL = (50 * Math.PI) / 180;
  return (
    <group>
      {LANE_R.map((r) => (
        <group key={r} position={[-2.72, 0, r]}>
          <mesh position-y={0.03} material={m.alu} castShadow>
            <boxGeometry args={[0.28, 0.02, 0.05]} />
          </mesh>
          <mesh position={[-0.08, 0.05, 0.04]} rotation-z={PEDAL} material={m.alu} castShadow>
            <boxGeometry args={[0.05, 0.07, 0.1]} />
          </mesh>
          <mesh position={[0.06, 0.05, -0.04]} rotation-z={PEDAL} material={m.alu} castShadow>
            <boxGeometry args={[0.05, 0.07, 0.1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function TrackModel() {
  const mid = (TRACK_IN + TRACK_OUT) / 2;
  return (
    <group>
      <Infield />
      <Ring />
      <LaneFills />
      <Numerals />
      {/* The finish line: ink. The start line: white. */}
      <mesh position={[2.8, 0.03, mid]}>
        <boxGeometry args={[0.03, 0.002, TRACK_OUT - TRACK_IN]} />
        <meshBasicMaterial color="#16191d" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[-2.4, 0.03, mid]}>
        <boxGeometry args={[0.03, 0.002, TRACK_OUT - TRACK_IN]} />
        <meshBasicMaterial color="#ffffff" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <Blocks />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.002} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.08} />
      </mesh>
    </group>
  );
}
