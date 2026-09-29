import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BufferAttribute,
  Color,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Object3D,
  QuadraticBezierCurve3,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";
import { materials } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { flameRamp, missionMaterials } from "./materials";
import { eio, R, seg, smooth } from "./timeline";
import { C, mulberry32, PAD_TOP, ROCKET_K, TOWER } from "./world";

// Pad 01: a concrete apron with flame trenches and hazard chevrons, the pad
// with its hazard band, flame hole and mint rim lights, the hold-down clamps,
// the forest-green service tower with its umbilical arm and hose, and the
// ground cloud at ignition. Plus a small pool of puffs shared by stage
// separation and the RCS burn.

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const D2R = Math.PI / 180;
const CLOUD = 56;
const POOL = 10;
const POST = { h: 3.0, half: 0.14, base: -0.08 };
const BAYS = 10;
const BAY = (POST.h - 0.1) / BAYS;
const ARM = { y: 1.72, len: 1.17 };
/** The launcher's body radius on the pad. */
const BODY_R = 0.145 * ROCKET_K;
// The arm hinges on the tower's inner corner and points at the booster's axis.
const ARM_PIVOT = new Vector3(POST.half, ARM.y, POST.half);
const ARM_YAW = -Math.atan2(-(TOWER.z + POST.half), -(TOWER.x + POST.half));
const ARM_REACH = Math.hypot(TOWER.x + POST.half, TOWER.z + POST.half); // pivot → booster axis
const RIM_LIGHTS = 8;
const FOREST = "#0c3b29";
const AMBER = "#fcb401";
const SMOKE = new Color("#f1f2f0");
const SMOKE_LIT = new Color("#ffe1c4");

// ── Apron: a 5.2 × 5.2 canvas mapped flat onto the ground around the pad ─────
const APRON = { size: 5.2, px: 2048 };
const K = APRON.px / APRON.size; // canvas px per world unit
/** Camera azimuth on the pad, so the stencil reads toward the viewer. */
const FRONT = 30 * D2R;

function drawApron(ctx: CanvasRenderingContext2D, w: number) {
  const c = w / 2;
  ctx.save();
  ctx.translate(c, c); // canvas x = world x, canvas y = world z
  // 1. Concrete, fading into the page from 75% of the radius.
  const r = (APRON.size / 2) * K;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, "rgba(241,243,240,1)");
  g.addColorStop(0.75, "rgba(241,243,240,1)");
  g.addColorStop(1, "rgba(241,243,240,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // 3. Expansion joints (under the rings).
  ctx.strokeStyle = "#e2e7e3";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 1.0 * K, Math.sin(a) * 1.0 * K);
    ctx.lineTo(Math.cos(a) * 2.1 * K, Math.sin(a) * 2.1 * K);
    ctx.stroke();
  }
  // 2. Two rings around the pad.
  ctx.strokeStyle = "#cfd6d1";
  ctx.lineWidth = 3;
  for (const rr of [0.95, 1.0]) {
    ctx.beginPath();
    ctx.arc(0, 0, rr * K, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 4–5. Flame trenches along +X and −Z, with hazard chevrons down both sides.
  for (const rot of [0, -Math.PI / 2]) {
    ctx.save();
    ctx.rotate(rot);
    const [x0, x1, hw] = [0.85 * K, 1.6 * K, 0.14 * K];
    const soot = ctx.createLinearGradient(x0, 0, x1, 0);
    soot.addColorStop(0, "rgba(16,35,26,1)");
    soot.addColorStop(0.55, "rgba(16,35,26,0.85)");
    soot.addColorStop(1, "rgba(16,35,26,0)");
    ctx.fillStyle = soot;
    ctx.fillRect(x0, -hw, x1 - x0, 2 * hw);
    // A soft soot bloom around the trench mouth.
    const bloom = ctx.createRadialGradient(x1 * 0.8, 0, 0, x1 * 0.8, 0, 0.6 * K);
    bloom.addColorStop(0, "rgba(16,35,26,0.14)");
    bloom.addColorStop(1, "rgba(16,35,26,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(x0, -0.6 * K, x1, 1.2 * K);
    const cw = 0.06 * K;
    for (const side of [-1, 1]) {
      const y0 = side < 0 ? -hw - cw : hw;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0.95 * K, y0, x1 - 0.95 * K, cw);
      ctx.clip();
      ctx.fillStyle = FOREST;
      ctx.fillRect(0.95 * K, y0, x1 - 0.95 * K, cw);
      ctx.fillStyle = AMBER;
      const step = cw * 1.2;
      for (let x = 0.95 * K - cw; x < x1; x += step * 2) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x + step, y0);
        ctx.lineTo(x + step + cw, y0 + cw);
        ctx.lineTo(x + cw, y0 + cw);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // 6. Stencil at the front rim, reading toward the camera.
  ctx.save();
  ctx.rotate(-FRONT);
  ctx.fillStyle = FOREST;
  ctx.font = `700 ${0.18 * K}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAD 01", 0, 1.3 * K);
  ctx.restore();
  ctx.restore();
}

/** A spherical cap just above the ground with flat (planar) UVs, so the canvas reads undistorted. */
function apronGeometry() {
  const g = new SphereGeometry(R + 0.003, 128, 16, 0, Math.PI * 2, 0, 2.6 / R);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / APRON.size + 0.5;
    uv[i * 2 + 1] = -pos.getZ(i) / APRON.size + 0.5;
  }
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return g;
}

/** 45° hazard stripes, forest and amber, around the pad's top edge. */
function drawHazard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = FOREST;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = AMBER;
  const pairs = 64;
  const sw = w / pairs;
  const lean = 6; // px across the band's height: 45° at this texel aspect
  for (let i = 0; i < pairs + 1; i++) {
    const x = i * sw;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + sw / 2, 0);
    ctx.lineTo(x + sw / 2 + lean, h);
    ctx.lineTo(x + lean, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A cauliflower puff: an icosphere pushed out by a few seeded lobes, smooth-shaded. */
function puffGeometry() {
  // Dense enough that a 300px puff has a round silhouette; uv and normal go first so mergeVertices welds the seams.
  const base = new IcosahedronGeometry(1, 12);
  base.deleteAttribute("uv");
  base.deleteAttribute("normal");
  const g = mergeVertices(base);
  const rand = mulberry32(19);
  const lobes = Array.from({ length: 9 }, () => new Vector3(rand() * 2 - 1, rand() * 1.6 - 0.4, rand() * 2 - 1).normalize());
  // A second, finer layer of billows, so a puff reads as cauliflower rather than an egg.
  const billows = Array.from({ length: 28 }, () => new Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize());
  const pos = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const bump = lobes.reduce((s, b) => s + Math.exp(-((1 - v.dot(b)) / 0.32)), 0);
    const fine = billows.reduce((s, b) => s + Math.exp(-((1 - v.dot(b)) / 0.06)), 0);
    v.multiplyScalar(0.84 + 0.2 * Math.min(1.8, bump) + 0.13 * Math.min(1.3, fine));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Ignition fire on the pad: a dome over the flame hole (white at the axis, orange at the rim) or a jet down a trench. */
function fireGeometry(jet: boolean) {
  const g = new SphereGeometry(1, 40, 20);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 4);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const [x, z] = [pos.getX(i), pos.getZ(i)];
    const t = jet ? 0.3 + 0.7 * ((x + 1) / 2) : Math.hypot(x, z);
    const a = flameRamp(t, c);
    c.toArray(colors, i * 4);
    colors[i * 4 + 3] = a * (jet ? 0.95 : 1);
  }
  g.setAttribute("color", new BufferAttribute(colors, 4));
  return g;
}

/** Parks an unused puff inside the opaque planet (never at zero scale). */
const park = (o: Object3D) => {
  o.position.set(0, -R, 0);
  o.rotation.set(0, 0, 0);
  o.scale.setScalar(0.01);
};

type Puff = { dir: Vector3; delay: number; reach: number; size: number; stretch: Vector3; spin: Euler };

function cloudPuffs(): Puff[] {
  const rand = mulberry32(7);
  return Array.from({ length: CLOUD }, (_, i) => {
    const lobe = i % 2 === 0 ? 90 : 180; // the flame trench exits: +X and −Z
    const a = (lobe + (rand() * 2 - 1) * 25) * D2R;
    return {
      dir: new Vector3(Math.sin(a), 0, Math.cos(a)),
      delay: rand() * 0.05,
      reach: 0.5 + rand() * 1.7,
      size: 0.14 + rand() * 0.28,
      stretch: new Vector3(0.8 + 0.4 * rand(), 0.8 + 0.4 * rand(), 0.8 + 0.4 * rand()),
      spin: new Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
    };
  });
}

/** Tower bracing: an X in every bay on all four faces, as box instances. */
function bracingMatrices(mesh: InstancedMesh) {
  const h = POST.half;
  const corners: [number, number][] = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  const o = new Object3D();
  const [a, b, d] = [new Vector3(), new Vector3(), new Vector3()];
  const up = new Vector3(0, 1, 0);
  let n = 0;
  for (let f = 0; f < 4; f++) {
    const [c0, c1] = [corners[f], corners[(f + 1) % 4]];
    for (let i = 0; i < BAYS; i++) {
      const [y0, y1] = [i * BAY, (i + 1) * BAY];
      for (const [p0, p1] of [
        [a.set(c0[0], y0, c0[1]).clone(), b.set(c1[0], y1, c1[1]).clone()],
        [a.set(c1[0], y0, c1[1]).clone(), b.set(c0[0], y1, c0[1]).clone()],
      ]) {
        d.subVectors(p1, p0);
        o.position.addVectors(p0, p1).multiplyScalar(0.5);
        o.quaternion.setFromUnitVectors(up, d.clone().normalize());
        o.scale.set(1, d.length(), 1);
        o.updateMatrix();
        mesh.setMatrixAt(n++, o.matrix);
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/** The umbilical hose, in arm space: from under the arm near its tip, sagging, to the stage wall. */
function hoseGeometry() {
  const wall = ARM_REACH - BODY_R;
  const start = new Vector3(ARM.len - 0.16, -0.016, 0);
  const end = new Vector3(wall, -0.07, 0); // plugs in just under the arm, so once swung clear it hangs as a loop
  const mid = start.clone().add(end).multiplyScalar(0.5).add(new Vector3(-0.02, -0.12, 0));
  return new TubeGeometry(new QuadraticBezierCurve3(start, mid, end), 24, 0.01, 8, false);
}

export default function LaunchSite() {
  const frame = useMission();
  const m = materials();
  const mm = missionMaterials();
  const tower = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const led = useRef<MeshStandardMaterial>(null);
  const apron = useRef<MeshStandardMaterial>(null);
  const apronMesh = useRef<Group>(null);
  const rims = useRef<(MeshStandardMaterial | null)[]>([]);
  const clamps = useRef<(Group | null)[]>([]);
  const braces = useRef<InstancedMesh>(null);
  const cloud = useRef<InstancedMesh>(null);
  const pool = useRef<InstancedMesh>(null);
  const puffs = useMemo(() => cloudPuffs(), []);
  const apronGeo = useMemo(() => apronGeometry(), []);
  const hose = useMemo(() => hoseGeometry(), []);
  const puff = useMemo(() => puffGeometry(), []);
  const dome = useMemo(() => fireGeometry(false), []);
  const jet = useMemo(() => fireGeometry(true), []);
  const fire = useRef<Group>(null);
  const fireMats = useRef<(MeshBasicMaterial | null)[]>([]);
  const scratch = useMemo(() => ({ o: new Object3D(), v: new Vector3(), w: new Vector3(), col: new Color(), q: new Quaternion() }), []);
  const cloudLive = useRef(true);
  const poolUsed = useRef(0);
  const apronTex = useCanvasTexture(APRON.px, APRON.px, drawApron);
  const hazardTex = useCanvasTexture(2048, 32, drawHazard);

  useLayoutEffect(() => {
    if (braces.current) bracingMatrices(braces.current);
    // Instance colours must exist before the first compile.
    const c = cloud.current;
    if (c) for (let i = 0; i < CLOUD; i++) c.setColorAt(i, SMOKE);
  }, []);

  useFrame(() => {
    const { p, t, still } = frame;
    // Tower: arm swings clear before ignition, then the tower retracts into the pad during the turn.
    if (tower.current) {
      tower.current.visible = p < 0.32;
      tower.current.scale.y = Math.max(1e-3, 1 - eio(seg(p, 0.26, 0.32)));
    }
    if (arm.current) arm.current.rotation.y = ARM_YAW + 105 * D2R * eio(seg(p, 0.1, 0.115));
    if (led.current) led.current.emissiveIntensity = still || t % 1 < 0.5 ? 1.4 : 0.08;
    const release = 25 * D2R * eio(seg(p, 0.125, 0.135));
    clamps.current.forEach((c) => {
      if (c) c.rotation.x = release;
    });

    // Ignition fire: pooled on the pad and pouring down both trenches while the bell is close, spreading as it lifts.
    const f = fire.current;
    if (f) {
      const gap = frame.craft.y - 2.01 * frame.scale - PAD_TOP;
      const on = p >= 0.1175 && p < 0.26 ? seg(p, 0.1175, 0.125) * (1 - seg(gap, 0.35, 1.1)) : 0;
      f.visible = on > 0.001;
      if (f.visible) {
        const flick = 1 + 0.06 * Math.sin(29 * t) + 0.04 * Math.sin(13.7 * t);
        f.scale.set(1 + 0.5 * seg(gap, 0, 0.8), flick * (0.6 + 0.4 * on), 1 + 0.5 * seg(gap, 0, 0.8));
        fireMats.current.forEach((mat) => {
          if (mat) mat.opacity = on;
        });
      }
    }

    // Apron: fades out as the ground becomes a planet.
    const fade = 1 - seg(p, 0.28, 0.36);
    if (apronMesh.current) apronMesh.current.visible = fade > 0;
    if (apron.current) apron.current.opacity = fade;

    // Rim lights: a chase through the count, all bright at ignition, then a steady glow.
    const chase = Math.floor(t * 8) % RIM_LIGHTS;
    rims.current.forEach((mat, i) => {
      if (!mat) return;
      if (p < 0.1175) mat.emissiveIntensity = still ? 0.4 : i === chase ? 1.4 : 0.25;
      else if (p < 0.135) mat.emissiveIntensity = 2.0;
      else mat.emissiveIntensity = 0.4;
    });

    // Ground cloud: lumpy puffs roll out along the trench lobes and sit on the curved ground,
    // warm underneath while the engine burns. Puffs not out yet are parked inside the planet.
    const c = cloud.current;
    if (c) {
      const live = p >= 0.12 && p < 0.31;
      c.visible = live;
      if (live || cloudLive.current) {
        const { o, col } = scratch;
        const sink = smooth(seg(p, 0.235, 0.305));
        const cool = seg(p, 0.2, 0.26);
        puffs.forEach((pf, i) => {
          const u = seg(p, 0.12 + pf.delay, 0.22 + pf.delay);
          const size = pf.size * (0.35 + 0.65 * Math.sqrt(u)) * (1 - 0.3 * sink) * (1 + 0.04 * Math.sin(0.8 * t + i));
          const d = 0.9 + (pf.reach * (1 - Math.exp(-3 * u))) / (1 - Math.exp(-3)) + 0.25 * sink;
          if (u <= 0 || sink >= 1) park(o);
          else {
            const [x, z] = [pf.dir.x * d, pf.dir.z * d];
            o.position.set(x, Math.sqrt(R * R - x * x - z * z) - R + (0.55 - 1.5 * sink) * size, z);
            o.rotation.copy(pf.spin);
            o.scale.set(size * pf.stretch.x, size * 0.8 * pf.stretch.y, size * pf.stretch.z);
          }
          o.updateMatrix();
          c.setMatrixAt(i, o.matrix);
          // Warm only near the pad (the flame light does the rest), never a peach ball.
          col.lerpColors(SMOKE_LIT, SMOKE, 0.4 + 0.6 * seg(d, 0.9, 1.8)).lerp(SMOKE, cool);
          c.setColorAt(i, col);
        });
        c.instanceMatrix.needsUpdate = true;
        if (c.instanceColor) c.instanceColor.needsUpdate = true;
        cloudLive.current = live;
      }
    }

    // Puff pool: separation at the interstage, RCS at the burn (from the four corner quads).
    const pl = pool.current;
    if (pl) {
      const { o, v, w } = scratch;
      const s = frame.scale;
      let n = 0;
      const put = (local: Vector3, size: number) => {
        if (n >= POOL) return;
        if (size * s < 0.004) park(o);
        else {
          v.copy(local).multiplyScalar(s).applyQuaternion(frame.quat).add(frame.craft);
          o.position.copy(v);
          o.rotation.set(n, 2 * n, 0);
          o.scale.set(size * s, size * s * 0.85, size * s);
        }
        o.updateMatrix();
        pl.setMatrixAt(n++, o.matrix);
      };
      if (p >= 0.355 && p < 0.37) {
        // Out of the interstage gap between the launcher's stages.
        const a = seg(p, 0.355, 0.37);
        for (let j = 0; j < 4; j++) {
          const az = (45 + 90 * j) * D2R;
          const r = BODY_R + 0.02 + 0.14 * a;
          put(w.set(Math.sin(az) * r, -0.6 - 0.06 * a, Math.cos(az) * r), 0.08 * Math.sin(Math.PI * a));
        }
      }
      if (p >= 0.825 && p < 0.84) {
        const a = seg(p, 0.825, 0.84);
        const size = 0.12 * Math.sin(Math.PI * a);
        const out = 0.24 + 0.22 * a;
        put(w.set(out, 0.13, 0.21), size);
        put(w.set(-out, 0.13, -0.21), size);
        put(w.set(0.21, 0.13, -out), size);
        put(w.set(-0.21, 0.13, out), size);
      }
      const used = n;
      while (n < POOL) put(w, 0);
      pl.visible = used > 0;
      if (used > 0 || poolUsed.current > 0) pl.instanceMatrix.needsUpdate = true;
      poolUsed.current = used;
    }
  });

  // Instanced meshes keep a stale bounding sphere; never cull the puffs.
  useEffect(() => {
    [cloud.current, pool.current].forEach((mesh) => {
      if (mesh) mesh.frustumCulled = false;
    });
  }, []);

  return (
    <group>
      {/* Apron: concrete, trenches, chevrons and the pad stencil, fading into the page. */}
      <group ref={apronMesh}>
        {/* No receiveShadow: the key light's long stage shadow smeared across it; ContactShadows grounds the pad instead. */}
        <mesh position={C} geometry={apronGeo}>
          <meshStandardMaterial
            ref={apron}
            map={apronTex.texture}
            emissiveMap={apronTex.texture}
            emissive="#ffffff"
            emissiveIntensity={0.35}
            transparent
            roughness={0.85}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </group>

      {/* The pad: a ceramic plinth, hazard band, flame hole and grate, champagne inlay and rim lights. */}
      <mesh position-y={PAD_TOP - 0.1} material={m.ceramic} receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.2, 96]} />
      </mesh>
      <mesh position-y={PAD_TOP - 0.0175}>
        <cylinderGeometry args={[0.9015, 0.9015, 0.035, 128, 1, true]} />
        <meshBasicMaterial map={hazardTex.texture} toneMapped={false} />
      </mesh>
      <mesh position-y={PAD_TOP + 0.0015} rotation-x={-Math.PI / 2} material={mm.glassBlack}>
        <circleGeometry args={[0.2, 48]} />
      </mesh>
      <mesh position-y={PAD_TOP + 0.003} rotation-x={Math.PI / 2} material={m.alu}>
        <torusGeometry args={[0.2, 0.006, 8, 64]} />
      </mesh>
      {[-1, 0, 1].map((k) => (
        <mesh key={k} position={[0, PAD_TOP + 0.003, k * 0.1]} material={m.alu}>
          <boxGeometry args={[Math.sqrt(0.04 - (k * 0.1) ** 2) * 2, 0.005, 0.008]} />
        </mesh>
      ))}
      <mesh position-y={PAD_TOP + 0.004} rotation-x={Math.PI / 2} material={m.champagne}>
        <torusGeometry args={[0.78, 0.008, 8, 96]} />
      </mesh>
      {Array.from({ length: RIM_LIGHTS }, (_, i) => {
        const a = (i / RIM_LIGHTS) * Math.PI * 2 + Math.PI / 8;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.84, PAD_TOP + 0.006, Math.cos(a) * 0.84]}>
            <sphereGeometry args={[0.014, 16, 10]} />
            <meshStandardMaterial
              ref={(mat: MeshStandardMaterial | null) => {
                rims.current[i] = mat;
              }}
              color="#23272c"
              roughness={0.3}
              emissive="#34d399"
              emissiveIntensity={0.25}
              toneMapped={false}
            />
          </mesh>
        );
      })}
      {/* Hold-down clamps on the launcher's skirt: they tip outward as it lifts. */}
      {[0, 1, 2, 3].map((k) => (
        <group key={k} rotation-y={(45 + 90 * k) * D2R}>
          <group
            ref={(g) => {
              clamps.current[k] = g;
            }}
            position={[0, PAD_TOP, BODY_R + 0.04]}
          >
            <mesh position-y={0.07} material={m.champagne} castShadow>
              <boxGeometry args={[0.05, 0.14, 0.04]} />
            </mesh>
            <mesh position-y={0.025} rotation-z={Math.PI / 2} material={mm.graphite}>
              <cylinderGeometry args={[0.012, 0.012, 0.09, 16]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Service tower: forest steel, porcelain platforms, a crane jib, the beacon and the umbilical arm. */}
      <group ref={tower} position={TOWER}>
        {[
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * POST.half, POST.base + POST.h / 2, z * POST.half]} material={mm.towerSteel} castShadow>
            <cylinderGeometry args={[0.028, 0.028, POST.h, 12]} />
          </mesh>
        ))}
        <instancedMesh ref={braces} args={[undefined, undefined, 4 * BAYS * 2]} material={mm.towerSteel} castShadow>
          <boxGeometry args={[0.014, 1, 0.014]} />
        </instancedMesh>
        {[3, 6, 9].map((b) => (
          <RoundedBox key={b} args={[0.34, 0.016, 0.34]} radius={0.006} smoothness={2} position-y={b * BAY + 0.03} material={m.porcelain} castShadow receiveShadow />
        ))}
        <mesh position={[0.2, POST.base + POST.h - 0.02, 0]} material={mm.towerSteel} castShadow>
          <boxGeometry args={[0.4, 0.02, 0.02]} />
        </mesh>
        <mesh position={[0.38, POST.base + POST.h - 0.07, 0]} material={mm.graphite}>
          <boxGeometry args={[0.006, 0.1, 0.006]} />
        </mesh>
        <mesh position-y={POST.base + POST.h + 0.03}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshStandardMaterial ref={led} color="#ffffff" emissive="#34d399" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <group ref={arm} position={ARM_PIVOT} rotation-y={ARM_YAW}>
          <mesh position-x={ARM.len / 2} material={m.champagne} castShadow>
            <boxGeometry args={[ARM.len, 0.03, 0.03]} />
          </mesh>
          <mesh geometry={hose} material={mm.graphite} castShadow />
        </group>
      </group>

      {/* Ignition fire: a dome over the flame hole and a jet down each trench. */}
      <group ref={fire} position-y={PAD_TOP} visible={false}>
        {[
          { g: dome, pos: [0, 0, 0], rot: 0, scale: [0.42, 0.2, 0.42] },
          { g: jet, pos: [1.15, 0, 0], rot: 0, scale: [0.5, 0.1, 0.13] },
          { g: jet, pos: [0, 0, -1.15], rot: Math.PI / 2, scale: [0.5, 0.1, 0.13] },
        ].map(({ g, pos, rot, scale }, i) => (
          <mesh key={i} geometry={g} position={pos as [number, number, number]} rotation-y={rot} scale={scale as [number, number, number]} renderOrder={4}>
            <meshBasicMaterial
              ref={(mat: MeshBasicMaterial | null) => {
                fireMats.current[i] = mat;
              }}
              vertexColors
              transparent
              depthWrite={false}
              toneMapped={false}
              side={DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <instancedMesh ref={cloud} args={[puff, undefined, CLOUD]} visible={false} frustumCulled={false}>
        {/* A little self-light only, so the billows keep a shaded underside and read as volume. */}
        <meshStandardMaterial color="#ffffff" roughness={1} emissive="#ffffff" emissiveIntensity={0.16} />
      </instancedMesh>
      <instancedMesh ref={pool} args={[puff, undefined, POOL]} visible={false} frustumCulled={false}>
        <meshStandardMaterial color="#f1f2f0" roughness={1} emissive="#ffffff" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}
