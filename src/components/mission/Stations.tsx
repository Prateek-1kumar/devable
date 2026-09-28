import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import {
  Color,
  DoubleSide,
  LatheGeometry,
  Object3D,
  Quaternion,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
  type InterleavedBufferAttribute,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "../growth-engine/channels";
import { easeOutBack, easeOutCubic } from "../growth-engine/ease";
import { paintBadge } from "../growth-engine/marks";
import { materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { missionMaterials } from "./materials";
import { contact, eio, firstLit, PEARLS, R, seg, STATIONS } from "./timeline";
import { C, stationNormal } from "./world";

// Ground stations: the platforms developers use, as porcelain pucks with the
// real logos, a champagne rim and a seam in their channel's colour, each with
// a small dish that tracks the craft. When the craft passes over one, its
// channel's array links down through a translucent uplink cone
// (distribution), and leads climb back up the link as glowing pearls, more on
// every pass (compounding).

const PUCK = { r: 1.25, h: 0.34 };
const MAX_PEARLS = 48;
const Y = new Vector3(0, 1, 0);
const FOOT_R = 1.9;

function drawFootprint(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Mapped on a spherical cap: canvas top is the cap's centre, the bottom its rim.
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(8,40,28,0.35)");
  g.addColorStop(0.35, "rgba(8,40,28,0.2)");
  g.addColorStop(1, "rgba(8,40,28,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A parabolic dish with a little thickness, opening toward +Y. */
function dishGeometry(r: number, depth: number) {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 12; i++) pts.push(new Vector2((r * i) / 12, depth * (i / 12) ** 2));
  for (let i = 12; i >= 0; i--) pts.push(new Vector2((r * i) / 12, depth * (i / 12) ** 2 - 0.03));
  return new LatheGeometry(pts, 40);
}

type StationRefs = { puck: Group | null; ring: MeshBasicMaterial | null; head: Group | null; foot: Group | null; cone: Mesh | null; coneMat: MeshBasicMaterial | null };
type Register = <K extends keyof StationRefs>(k: number, key: K, value: StationRefs[K]) => void;

function Puck({ k, register }: { k: number; register: Register }) {
  const m = materials();
  const station = STATIONS[k];
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => paintBadge(ctx, w, h, station.mark), [station.mark]);
  const face = useCanvasTexture(512, 512, draw);
  const foot = useCanvasTexture(8, 128, drawFootprint);
  const dish = useMemo(() => dishGeometry(0.32, 0.09), []);
  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(Y, stationNormal(k)), [k]);
  return (
    <>
      <group
        ref={(g) => {
          register(k, "foot", g);
        }}
        position={C}
        quaternion={quaternion}
        visible={false}
      >
        <mesh>
          <sphereGeometry args={[R + 0.002, 64, 8, 0, Math.PI * 2, 0, FOOT_R / R]} />
          <meshBasicMaterial map={foot.texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      </group>
      <group
        ref={(g) => {
          register(k, "puck", g);
        }}
        quaternion={quaternion}
        visible={false}
      >
        <mesh material={m.porcelain}>
          <cylinderGeometry args={[PUCK.r, PUCK.r, PUCK.h, 64]} />
        </mesh>
        <mesh position-y={PUCK.h / 2} rotation-x={Math.PI / 2} material={m.champagne}>
          <torusGeometry args={[PUCK.r, 0.025, 10, 96]} />
        </mesh>
        <mesh position-y={-PUCK.h / 2 + 0.045} material={m.seam[station.channel]}>
          <cylinderGeometry args={[PUCK.r + 0.012, PUCK.r + 0.012, 0.09, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={PUCK.h / 2 + 0.002}>
          <circleGeometry args={[PUCK.r - 0.03, 64]} />
          <meshBasicMaterial map={face.texture} transparent toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={PUCK.h / 2 + 0.005}>
          <ringGeometry args={[1.08, 1.22, 64]} />
          <meshBasicMaterial
            ref={(mat: MeshBasicMaterial | null) => {
              register(k, "ring", mat);
            }}
            color={CHANNELS[station.channel].color}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Ground-station dish, beside the puck on its east side (1.8x, so it reads as a dish at orbit distance, not a fleck). */}
        <group position={[2.05, -0.1, 0]} scale={1.8}>
          <mesh position-y={0.275} material={m.alu}>
            <cylinderGeometry args={[0.05, 0.05, 0.55, 12]} />
          </mesh>
          <group
            ref={(g) => {
              register(k, "head", g);
            }}
            position-y={0.58}
          >
            <group rotation-x={Math.PI / 2}>
              <mesh geometry={dish} material={m.porcelain} />
              <mesh position-y={0.16} material={m.champagne}>
                <cylinderGeometry args={[0.012, 0.012, 0.32, 8]} />
              </mesh>
              <mesh position-y={0.33} material={m.champagne}>
                <cylinderGeometry args={[0.02, 0.04, 0.05, 12]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
      <mesh
        ref={(el) => {
          register(k, "cone", el);
        }}
        visible={false}
        frustumCulled={false}
        renderOrder={2}
      >
        <cylinderGeometry args={[0.04, 0.9, 1, 48, 1, true]} />
        <meshBasicMaterial
          ref={(mat: MeshBasicMaterial | null) => {
            register(k, "coneMat", mat);
          }}
          color={CHANNELS[station.channel].color}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

export default function Stations() {
  const frame = useMission();
  const mm = missionMaterials();
  const refs = useRef<StationRefs[]>(STATIONS.map(() => ({ puck: null, ring: null, head: null, foot: null, cone: null, coneMat: null })));
  const register = useCallback<Register>((k, key, value) => {
    refs.current[k][key] = value;
  }, []);
  const links = useRef<(Line2 | null)[]>([]);
  const casings = useRef<(Line2 | null)[]>([]);
  const pearls = useRef<InstancedMesh>(null);
  const normals = useMemo(() => STATIONS.map((_, k) => stationNormal(k)), []);
  const colors = useMemo(() => STATIONS.map((s) => new Color(CHANNELS[s.channel].color)), []);
  const linkPts = useMemo(() => [new Vector3(), new Vector3(0, 1, 0)], []);
  const scratch = useMemo(
    () => ({ top: new Vector3(), end: new Vector3(), dir: new Vector3(), up: new Vector3(), w: new Vector3(), o: new Object3D(), qa: new Quaternion(), qb: new Quaternion() }),
    [],
  );

  useLayoutEffect(() => {
    // Instance colours must exist before the pearl material first compiles.
    const pl = pearls.current;
    if (pl) for (let i = 0; i < MAX_PEARLS; i++) pl.setColorAt(i, colors[0]);
  }, [colors]);

  useFrame(() => {
    const { p, t, still } = frame;
    const th = frame.theta;
    const { top, end, dir, up, w, o, qa, qb } = scratch;
    let n = 0;
    const pearl = (at: Vector3, color: Color, size: number) => {
      const pl = pearls.current;
      if (!pl || n >= MAX_PEARLS) return;
      o.position.copy(at);
      o.scale.setScalar(size);
      o.updateMatrix();
      pl.setMatrixAt(n, o.matrix);
      pl.setColorAt(n, color);
      n++;
    };
    const writeLine = (line: Line2 | null, a: Vector3, b: Vector3, opacity: number) => {
      if (!line) return;
      const attr = line.geometry.attributes.instanceStart as InterleavedBufferAttribute;
      const arr = attr.data.array as Float32Array;
      a.toArray(arr, 0);
      b.toArray(arr, 3);
      attr.data.needsUpdate = true;
      line.material.opacity = opacity;
    };

    STATIONS.forEach((station, k) => {
      const nk = normals[k];
      const r = refs.current[k];
      const start = 0.615 + 0.012 * k;
      const hit = contact(k, th);
      const c = hit ? hit.c : -1;
      const lift = hit ? 0.3 * Math.sin(Math.PI * seg(c, 0.3, 0.9)) : 0;
      const rise = -0.6 * (1 - easeOutBack(seg(p, start, start + 0.04)));
      const g = r.puck;
      if (g) {
        g.visible = p >= start;
        g.position.copy(C).addScaledVector(nk, R - 0.08 + rise + lift);
      }
      if (r.foot) r.foot.visible = p >= start + 0.02; // once the puck is up, so no footprint sits on bare ground
      top.copy(C).addScaledVector(nk, R - 0.08 + rise + lift + PUCK.h / 2 + 0.05);
      const tip = frame.tips[station.channel];
      const live = !!hit && p >= start;

      // The dish points at the zenith, and tracks the craft through each contact.
      const head = r.head;
      if (g && head && g.visible) {
        g.updateMatrixWorld(true);
        head.getWorldPosition(w);
        head.lookAt(up.copy(w).add(nk));
        qa.copy(head.quaternion);
        head.lookAt(frame.craft);
        qb.copy(head.quaternion);
        const track = live ? eio(seg(c, 0, 0.12)) * (1 - eio(seg(c, 0.88, 1))) : 0;
        head.quaternion.slerpQuaternions(qa, qb, track);
      }

      // Ring: lit after the first contact, a full pulse while in contact, breathing in the final hold.
      const ring = r.ring;
      if (ring) {
        const lit = firstLit(k, th);
        const pulse = hit ? seg(c, 0.18, 0.3) * (1 - seg(c, 0.5, 0.72)) : 0;
        const breathe = lit && p >= 0.97 && !still ? 0.1 * Math.sin(1.6 * t + k * 1.3) : 0;
        ring.opacity = Math.max(lit ? 0.5 + breathe : 0, pulse);
      }

      // Uplink cone from the station up to the array tip.
      const fade = hit ? Math.min(seg(c, 0, 0.12), 1 - seg(c, 0.88, 1)) : 0;
      const cone = r.cone;
      if (cone) {
        cone.visible = live && fade > 0;
        if (cone.visible) {
          dir.subVectors(tip, top);
          const len = dir.length();
          cone.position.copy(top).addScaledVector(dir, 0.5);
          cone.quaternion.setFromUnitVectors(Y, dir.divideScalar(len));
          cone.scale.set(1, len, 1);
        }
      }
      if (r.coneMat) r.coneMat.opacity = 0.16 * fade;

      // Link from the channel's array tip down to the station, cased in white so it reads over the ocean.
      const line = links.current[k];
      const casing = casings.current[k];
      if (line) line.visible = live;
      if (casing) casing.visible = live;
      if (live && hit) {
        end.lerpVectors(tip, top, easeOutCubic(seg(c, 0, 0.3)));
        writeLine(line, tip, end, 0.95 * fade);
        writeLine(casing, tip, end, 0.9 * fade);

        // The down-bead (your content going out), then the leads coming back.
        const down = seg(c, 0.05, 0.32);
        if (down > 0 && down < 1) pearl(end.lerpVectors(tip, top, eio(down)), colors[k], 1);
        const count = PEARLS[Math.min(hit.pass, 2)];
        for (let j = 0; j < count; j++) {
          const q = p >= 0.97 ? (0.35 * t + j / count) % 1 : seg(c, 0.34 + 0.07 * j, 0.7 + 0.07 * j);
          if (q > 0 && q < 1) pearl(end.lerpVectors(top, tip, eio(q)), colors[k], 1 + 0.375 * q);
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
        <Puck key={station.mark} k={k} register={register} />
      ))}
      {STATIONS.map((station, k) => (
        <group key={station.mark}>
          <Line
            ref={(l: Line2 | null) => {
              casings.current[k] = l;
              if (l) l.visible = false;
            }}
            points={linkPts}
            color="#ffffff"
            lineWidth={4.5}
            transparent
            opacity={0}
            depthWrite={false}
            frustumCulled={false}
            renderOrder={3}
          />
          <Line
            ref={(l: Line2 | null) => {
              links.current[k] = l;
              if (l) l.visible = false;
            }}
            points={linkPts}
            color={CHANNELS[station.channel].color}
            lineWidth={2}
            transparent
            opacity={0}
            depthWrite={false}
            frustumCulled={false}
            renderOrder={4}
          />
        </group>
      ))}
      <instancedMesh ref={pearls} args={[undefined, undefined, MAX_PEARLS]} material={mm.pearl} visible={false} frustumCulled={false}>
        <sphereGeometry args={[0.16, 16, 12]} />
      </instancedMesh>
    </group>
  );
}
