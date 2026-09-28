import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines } from "@react-three/drei";
import { Color, Object3D, Quaternion, Vector3, type Group, type InstancedMesh, type InterleavedBufferAttribute, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "../growth-engine/channels";
import { easeOutBack, easeOutCubic } from "../growth-engine/ease";
import { paintBadge } from "../growth-engine/marks";
import { materials, TONES } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { contact, eio, firstLit, PEARLS, R, seg, STATIONS } from "./timeline";
import { C, stationNormal } from "./world";

// Ground stations: the platforms developers use, as white pucks with the real
// logos on the camera-facing top of the planet. When the craft passes over one,
// its channel's array links down (distribution), and leads climb back up the
// link as pearls, more on every pass (compounding).

const PUCK = { r: 1.25, h: 0.34 };
const MAX_PEARLS = 48;
const Y = new Vector3(0, 1, 0);

type Link = { line: Line2 | null };

function Puck({ k, groupRef, ringRef }: { k: number; groupRef: (g: Group | null) => void; ringRef: (m: MeshBasicMaterial | null) => void }) {
  const m = materials();
  const station = STATIONS[k];
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => paintBadge(ctx, w, h, station.mark), [station.mark]);
  const face = useCanvasTexture(512, 512, draw);
  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(Y, stationNormal(k)), [k]);
  return (
    <group ref={groupRef} quaternion={quaternion} visible={false}>
      <mesh material={m.panel}>
        <cylinderGeometry args={[PUCK.r, PUCK.r, PUCK.h, 48]} />
        <Outlines thickness={1} color={TONES[station.channel].edge} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={PUCK.h / 2 + 0.002}>
        <circleGeometry args={[PUCK.r - 0.03, 64]} />
        <meshBasicMaterial map={face.texture} transparent toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={PUCK.h / 2 + 0.005}>
        <ringGeometry args={[1.08, 1.3, 64]} />
        <meshBasicMaterial ref={ringRef} color={CHANNELS[station.channel].color} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Stations() {
  const frame = useMission();
  const pucks = useRef<(Group | null)[]>([]);
  const rings = useRef<(MeshBasicMaterial | null)[]>([]);
  const links = useRef<Link[]>(STATIONS.map(() => ({ line: null })));
  const pearls = useRef<InstancedMesh>(null);
  const normals = useMemo(() => STATIONS.map((_, k) => stationNormal(k)), []);
  const colors = useMemo(() => STATIONS.map((s) => new Color(CHANNELS[s.channel].color)), []);
  const linkPts = useMemo(() => [new Vector3(), new Vector3(0, 1, 0)], []);
  const scratch = useMemo(() => ({ top: new Vector3(), end: new Vector3(), o: new Object3D() }), []);

  useFrame(() => {
    const { p, t, still } = frame;
    const th = frame.theta;
    const { top, end, o } = scratch;
    let n = 0;
    const pearl = (at: Vector3, color: Color) => {
      const pl = pearls.current;
      if (!pl || n >= MAX_PEARLS) return;
      o.position.copy(at);
      o.updateMatrix();
      pl.setMatrixAt(n, o.matrix);
      pl.setColorAt(n, color);
      n++;
    };

    STATIONS.forEach((station, k) => {
      const nk = normals[k];
      const g = pucks.current[k];
      const start = 0.615 + 0.012 * k;
      const hit = contact(k, th);
      const c = hit ? hit.c : -1;
      const lift = hit ? 0.3 * Math.sin(Math.PI * seg(c, 0.3, 0.9)) : 0;
      const rise = -0.6 * (1 - easeOutBack(seg(p, start, start + 0.04)));
      if (g) {
        g.visible = p >= start;
        g.position.copy(C).addScaledVector(nk, R - 0.08 + rise + lift);
      }
      top.copy(C).addScaledVector(nk, R - 0.08 + rise + lift + PUCK.h / 2 + 0.05);

      // Ring: lit after the first contact, a full pulse while in contact, breathing in the final hold.
      const ring = rings.current[k];
      if (ring) {
        const lit = firstLit(k, th);
        const pulse = hit ? seg(c, 0.18, 0.3) * (1 - seg(c, 0.5, 0.72)) : 0;
        const breathe = lit && p >= 0.97 && !still ? 0.1 * Math.sin(1.6 * t + k * 1.3) : 0;
        ring.opacity = Math.max(lit ? 0.45 + breathe : 0, pulse);
      }

      // Link from the channel's array tip down to the station.
      const line = links.current[k].line;
      if (line) {
        line.visible = !!hit && p >= start;
        if (line.visible && hit) {
          const tip = frame.tips[station.channel];
          end.lerpVectors(tip, top, easeOutCubic(seg(c, 0, 0.3)));
          const attr = line.geometry.attributes.instanceStart as InterleavedBufferAttribute;
          const arr = attr.data.array as Float32Array;
          arr[0] = tip.x;
          arr[1] = tip.y;
          arr[2] = tip.z;
          arr[3] = end.x;
          arr[4] = end.y;
          arr[5] = end.z;
          attr.data.needsUpdate = true;
          line.material.opacity = 0.9 * Math.min(seg(c, 0, 0.12), 1 - seg(c, 0.88, 1));

          // The down-bead (your content going out), then the leads coming back.
          const down = seg(c, 0.05, 0.32);
          if (down > 0 && down < 1) pearl(end.lerpVectors(tip, top, eio(down)), colors[k]);
          const count = PEARLS[Math.min(hit.pass, 2)];
          for (let j = 0; j < count; j++) {
            const q = p >= 0.97 ? (0.35 * t + j / count) % 1 : seg(c, 0.34 + 0.07 * j, 0.7 + 0.07 * j);
            if (q > 0 && q < 1) pearl(end.lerpVectors(top, tip, eio(q)), colors[k]);
          }
        }
      }
    });

    const pl = pearls.current;
    if (pl) {
      pl.count = n;
      pl.visible = n > 0;
      if (n > 0) {
        pl.instanceMatrix.needsUpdate = true;
        if (pl.instanceColor) pl.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {STATIONS.map((station, k) => (
        <Puck
          key={station.mark}
          k={k}
          groupRef={(g) => {
            pucks.current[k] = g;
          }}
          ringRef={(m) => {
            rings.current[k] = m;
          }}
        />
      ))}
      {STATIONS.map((station, k) => (
        <Line
          key={station.mark}
          ref={(l: Line2 | null) => {
            links.current[k].line = l;
            if (l) l.visible = false;
          }}
          points={linkPts}
          color={CHANNELS[station.channel].color}
          lineWidth={1.5}
          transparent
          opacity={0}
          depthWrite={false}
          frustumCulled={false}
        />
      ))}
      <instancedMesh ref={pearls} args={[undefined, undefined, MAX_PEARLS]} visible={false} frustumCulled={false}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
