import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Outlines, RoundedBox } from "@react-three/drei";
import { CircleGeometry, CylinderGeometry, type Group, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHANNELS } from "../growth-engine/channels";
import { drawBadge } from "../growth-engine/marks";
import { TONES, materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { C, look } from "./look";
import { store } from "./store";
import { clamp01, easeOutBack, easeOutCubic, mastRise } from "./timeline";
import { MAST_R, SECTIONS, ovalAt, type Section } from "./track";

// The platforms: a floodlight mast behind each stand section, on a porcelain
// footing with a champagne collar, a tapered aluminum pole banded in the
// channel's color, and a head with a floodlight bank over the platform's badge.
// Each rises as its channel's runner first reaches it; then the band and the
// floodlights come on.

const POLE_H = 2.3;
// Round lamps on a black bank, lit warm (a peak that stays amber-white, never clips to pure white).
const LAMP = { color: C.LIGHT_ON, peak: 0.9, r: 0.042, pitch: [0.105, 0.095] as const };

/** The bank's 2×4 round floodlights as one geometry, on its front face. */
function cellsGeometry() {
  const cells = [];
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++)
      cells.push(new CircleGeometry(LAMP.r, 24).translate((col - 1.5) * LAMP.pitch[0], (row - 0.5) * LAMP.pitch[1], 0.031));
  return mergeGeometries(cells);
}

function Mast({ i, section }: { i: number; section: Section }) {
  const m = materials();
  const L = look();
  const ch = section.channel;
  const color = CHANNELS[ch].color;
  const base = useRef<Group>(null);
  const pole = useRef<Group>(null);
  const head = useRef<Group>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const band = useRef<MeshStandardMaterial>(null);
  const cells = useRef<MeshStandardMaterial>(null);
  const at = useMemo(() => ovalAt(section.mast, MAST_R, { x: 0, y: 0, z: 0 }), [section]);
  const poleGeometry = useMemo(() => new CylinderGeometry(0.03, 0.045, POLE_H, 16).translate(0, POLE_H / 2, 0), []);
  const cellGeometry = useMemo(() => cellsGeometry(), []);
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => drawBadge(ctx, w, h, section.mark), [section]);
  const face = useCanvasTexture(512, 512, draw);

  useFrame(() => {
    const rise = mastRise(i, store.p);
    if (base.current) base.current.visible = rise > 0;
    const p = pole.current;
    if (p) {
      p.visible = rise > 0;
      p.scale.set(1, Math.max(1e-3, easeOutCubic(clamp01(rise / 0.7))), 1);
    }
    const h = head.current;
    if (h) {
      h.visible = rise > 0.6;
      h.scale.setScalar(Math.max(1e-3, easeOutBack(clamp01((rise - 0.6) / 0.4))));
    }
    const lit = clamp01((rise - 0.8) / 0.2);
    if (ring.current) ring.current.opacity = lit;
    if (band.current) band.current.emissiveIntensity = 0.5 * lit;
    if (cells.current) cells.current.emissiveIntensity = LAMP.peak * lit;
  });

  return (
    <group position={[at.x, 0, at.z]}>
      <group ref={base} visible={false}>
        <mesh position-y={0.03} material={m.porcelain} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 32]} />
        </mesh>
        <mesh position-y={0.075} material={m.champagne} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.03, 24]} />
        </mesh>
      </group>
      <group ref={pole} visible={false}>
        {/* Poles and heads cast no shadow: under the low key they would streak far off the plinth onto the page. */}
        <mesh geometry={poleGeometry} material={m.alu} />
        <mesh position-y={1.4}>
          <cylinderGeometry args={[0.047, 0.047, 0.03, 24]} />
          <meshStandardMaterial ref={band} color={color} roughness={0.3} metalness={0.2} emissive={color} emissiveIntensity={0} />
        </mesh>
      </group>
      <Billboard position-y={2.55}>
        <group ref={head} visible={false}>
          {/* The floodlight bank, above the badge: a champagne-framed fixture, tilted down toward the track. */}
          <group position-y={0.33} rotation-x={0.35}>
            <RoundedBox args={[0.49, 0.23, 0.04]} radius={0.015} smoothness={3} position-z={-0.015} material={m.champagne} />
            <RoundedBox args={[0.46, 0.2, 0.06]} radius={0.02} smoothness={3} material={L.ink} />
            <mesh geometry={cellGeometry}>
              <meshStandardMaterial ref={cells} color={C.LIGHT_OFF} roughness={0.35} emissive={LAMP.color} emissiveIntensity={0} fog={false} />
            </mesh>
          </group>
          <mesh rotation-x={Math.PI / 2} material={L.puck}>
            <cylinderGeometry args={[0.22, 0.22, 0.05, 48]} />
            <Outlines thickness={1} color={TONES[ch].edge} />
          </mesh>
          <mesh position-z={0.026}>
            <circleGeometry args={[0.208, 64]} />
            <meshBasicMaterial map={face.texture} toneMapped={false} fog={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.228, 0.258, 64]} />
            <meshBasicMaterial ref={ring} color={color} transparent opacity={0} depthWrite={false} toneMapped={false} fog={false} />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}

export default function Masts() {
  return (
    <group>
      {SECTIONS.map((s, i) => (
        <Mast key={s.mark} i={i} section={s} />
      ))}
    </group>
  );
}
