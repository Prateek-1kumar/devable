import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Outlines } from "@react-three/drei";
import { CylinderGeometry, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { CHANNELS } from "../growth-engine/channels";
import { drawBadge } from "../growth-engine/marks";
import { TONES, materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { store } from "./store";
import { clamp01, easeOutBack, easeOutCubic, mastRise } from "./timeline";
import { MAST_R, SECTIONS, ovalAt, type Section } from "./track";

// The platforms: a slim porcelain mast behind each stand section, headed by the
// platform's round badge. Each rises as its channel's runner first reaches it,
// and its ring lights in the channel's color.

function Mast({ i, section }: { i: number; section: Section }) {
  const m = materials();
  const ch = section.channel;
  const pole = useRef<Mesh>(null);
  const head = useRef<Group>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const at = useMemo(() => ovalAt(section.mast, MAST_R, { x: 0, y: 0, z: 0 }), [section]);
  const poleGeometry = useMemo(() => new CylinderGeometry(0.028, 0.034, 2.3, 12).translate(0, 1.15, 0), []);
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => drawBadge(ctx, w, h, section.mark), [section]);
  const face = useCanvasTexture(512, 512, draw);

  useFrame(() => {
    const rise = mastRise(i, store.p);
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
    if (ring.current) ring.current.opacity = clamp01((rise - 0.8) / 0.2);
  });

  return (
    <group position={[at.x, 0, at.z]}>
      <mesh ref={pole} geometry={poleGeometry} material={m.porcelain} castShadow visible={false} />
      <Billboard position-y={2.55}>
        <group ref={head} visible={false}>
          <mesh rotation-x={Math.PI / 2} material={m.panel} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.05, 48]} />
            <Outlines thickness={1} color={TONES[ch].edge} />
          </mesh>
          <mesh position-z={0.026}>
            <circleGeometry args={[0.208, 64]} />
            <meshBasicMaterial map={face.texture} toneMapped={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.228, 0.258, 64]} />
            <meshBasicMaterial ref={ring} color={CHANNELS[ch].color} transparent opacity={0} depthWrite={false} toneMapped={false} />
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
