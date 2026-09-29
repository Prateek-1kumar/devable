import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  LatheGeometry,
  NormalBlending,
  Object3D,
  Quaternion,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  type Sprite,
  type SpriteMaterial,
} from "three";
import { CHANNELS } from "../growth-engine/channels";
import { easeOutBack, easeOutCubic } from "../growth-engine/ease";
import { paintBadge } from "../growth-engine/marks";
import { materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { contact, eio, firstLit, PEARLS, R, seg, STATIONS } from "./timeline";
import { C, stationNormal } from "./world";

// Ground stations: the platforms developers use, as porcelain pucks with the
// real logos, a champagne rim and a seam in their channel's colour, each with
// a small dish that tracks the craft. When the craft passes over one, its
// channel's array switches on a beam of light down to it (distribution): a
// soft volumetric cone from a glowing emitter, pooling on the ground, while
// the station's ring charges up. Leads drift back up the beam as motes of
// light, more on every pass (compounding).

const PUCK = { r: 1.25, h: 0.34 };
const MAX_PEARLS = 48;
const Y = new Vector3(0, 1, 0);
const FOOT_R = 1.9;
const POOL_R = 2.9;
const RING_SEGS = 64;
const BEAM = { top: 0.1, foot: 1.45 };

/**
 * The beam: an open cone lit like a volume. Faces seen head-on (the middle of the cone, where
 * the light is thickest) are densest, the silhouette carries a fine glowing edge, the light is
 * brightest at the emitter and thins toward the ground, and faint bands flow down it.
 */
function beamMaterial(color: string) {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = abs(dot(normalize(vN), normalize(vV)));
        float body = pow(f, 1.6);
        float rim = pow(1.0 - f, 5.0);
        float along = vUv.y; // 1 at the emitter, 0 at the ground
        float falloff = mix(0.3, 1.0, pow(along, 1.3));
        float foot = smoothstep(0.0, 0.12, along);
        float bands = 0.86 + 0.14 * sin(along * 22.0 + uTime * 2.6);
        float a = (0.6 * body + 0.8 * rim) * falloff * foot * bands * uOpacity;
        vec3 col = mix(uColor, vec3(1.0), 0.45 * body * along);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    toneMapped: false,
  });
}

/** Motes: small soft lights, a white-hot core fading to their channel colour at the edge. */
function moteMaterial() {
  return new ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vC;
      void main() {
        mat4 m = modelMatrix * instanceMatrix;
        vec4 wp = m * vec4(position, 1.0);
        vN = normalize(mat3(m) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        #ifdef USE_INSTANCING_COLOR
          vC = instanceColor;
        #else
          vC = vec3(1.0);
        #endif
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vC;
      void main() {
        float f = abs(dot(normalize(vN), normalize(vV)));
        gl_FragColor = vec4(mix(vC, vec3(1.0), 0.6 * f * f), pow(f, 1.1));
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/** The emitter: a white-hot point in its channel's colour, soft to the edge. */
function drawEmitter(color: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,0.9)");
    g.addColorStop(0.4, `${color}99`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
}

/** The pool of light the beam leaves on the ground (a spherical cap: canvas top is its centre). */
function drawPool(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

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

type StationRefs = {
  puck: Group | null;
  ring: Mesh | null;
  head: Group | null;
  foot: Group | null;
  pool: MeshBasicMaterial | null;
  cone: Mesh | null;
  emitter: Sprite | null;
};
type Register = <K extends keyof StationRefs>(k: number, key: K, value: StationRefs[K]) => void;

function Puck({ k, register }: { k: number; register: Register }) {
  const m = materials();
  const station = STATIONS[k];
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => paintBadge(ctx, w, h, station.mark), [station.mark]);
  const face = useCanvasTexture(512, 512, draw);
  const foot = useCanvasTexture(8, 128, drawFootprint);
  const dish = useMemo(() => dishGeometry(0.32, 0.09), []);
  const color = CHANNELS[station.channel].color;
  const pool = useCanvasTexture(8, 128, drawPool);
  const drawGlow = useMemo(() => drawEmitter(color), [color]);
  const emitter = useCanvasTexture(128, 128, drawGlow);
  const beam = useMemo(() => beamMaterial(color), [color]);
  useEffect(() => () => beam.dispose(), [beam]);
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
        <mesh>
          <sphereGeometry args={[R + 0.004, 64, 8, 0, Math.PI * 2, 0, POOL_R / R]} />
          <meshBasicMaterial
            ref={(mat: MeshBasicMaterial | null) => {
              register(k, "pool", mat);
            }}
            map={pool.texture}
            color={color}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
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
        {/* The charge ring: sweeps round as the first contact charges the station, then stays lit. */}
        <mesh
          ref={(el) => {
            register(k, "ring", el);
          }}
          rotation-x={-Math.PI / 2}
          position-y={PUCK.h / 2 + 0.005}
        >
          <ringGeometry args={[1.08, 1.22, RING_SEGS]} />
          <meshBasicMaterial
            color={color}
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
        material={beam}
        visible={false}
        frustumCulled={false}
        renderOrder={2}
      >
        <cylinderGeometry args={[BEAM.top, BEAM.foot, 1, 64, 1, true]} />
      </mesh>
      <sprite
        ref={(el: Sprite | null) => {
          register(k, "emitter", el);
        }}
        visible={false}
        renderOrder={5}
      >
        <spriteMaterial map={emitter.texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </sprite>
    </>
  );
}

export default function Stations() {
  const frame = useMission();
  const refs = useRef<StationRefs[]>(
    STATIONS.map(() => ({ puck: null, ring: null, head: null, foot: null, pool: null, cone: null, emitter: null })),
  );
  const register = useCallback<Register>((k, key, value) => {
    refs.current[k][key] = value;
  }, []);
  const pearls = useRef<InstancedMesh>(null);
  const mote = useMemo(() => moteMaterial(), []);
  useEffect(() => () => mote.dispose(), [mote]);
  const normals = useMemo(() => STATIONS.map((_, k) => stationNormal(k)), []);
  const colors = useMemo(() => STATIONS.map((s) => new Color(CHANNELS[s.channel].color)), []);
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

      // Ring: charges round through the first contact, then lit, a full pulse on every later
      // contact, breathing in the final hold.
      const ring = r.ring;
      if (ring) {
        const lit = firstLit(k, th);
        const charge = live && hit.pass === 0 && !lit ? seg(c, 0.06, 0.35) : lit ? 1 : 0;
        ring.geometry.setDrawRange(0, 6 * Math.round(RING_SEGS * charge));
        const pulse = hit ? seg(c, 0.18, 0.3) * (1 - seg(c, 0.5, 0.72)) : 0;
        const breathe = lit && p >= 0.97 && !still ? 0.1 * Math.sin(1.6 * t + k * 1.3) : 0;
        (ring.material as MeshBasicMaterial).opacity = Math.max(lit ? 0.5 + breathe : 0, pulse, charge > 0 && !lit ? 0.9 : 0);
      }

      // The beam: the emitter lights at the array tip, the cone reaches down to the station
      // (keeping its angle as it grows) and pools on the ground once it lands.
      const fade = hit ? Math.min(seg(c, 0, 0.12), 1 - seg(c, 0.88, 1)) : 0;
      const on = live && fade > 0;
      const reach = hit ? easeOutCubic(seg(c, 0, 0.3)) : 0;
      const cone = r.cone;
      if (cone) {
        cone.visible = on && reach > 0;
        if (cone.visible) {
          end.lerpVectors(tip, top, reach);
          dir.subVectors(tip, end);
          const len = dir.length();
          cone.position.copy(end).addScaledVector(dir, 0.5);
          cone.quaternion.setFromUnitVectors(Y, dir.divideScalar(len));
          cone.scale.set(reach, len, reach);
          const u = (cone.material as ShaderMaterial).uniforms;
          u.uOpacity.value = 1.2 * fade;
          u.uTime.value = still ? 0 : t;
        }
      }
      const em = r.emitter;
      if (em) {
        em.visible = on;
        if (on) {
          em.position.copy(tip);
          em.scale.setScalar(1.4 + (still ? 0 : 0.08 * Math.sin(9 * t)));
          (em.material as SpriteMaterial).opacity = fade;
        }
      }
      if (r.pool) r.pool.opacity = 0.7 * fade * seg(c, 0.2, 0.34);

      if (live && hit) {
        end.lerpVectors(tip, top, reach);

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
      <instancedMesh ref={pearls} args={[undefined, undefined, MAX_PEARLS]} material={mote} visible={false} frustumCulled={false} renderOrder={6}>
        <sphereGeometry args={[0.13, 16, 12]} />
      </instancedMesh>
    </group>
  );
}
