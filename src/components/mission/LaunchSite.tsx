import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines } from "@react-three/drei";
import { Object3D, Vector3, type Group, type InstancedMesh, type MeshStandardMaterial } from "three";
import { materials, palette } from "../growth-engine/palette";
import { useMission } from "./frame";
import { eio, R, seg, smooth } from "./timeline";
import { mulberry32, TOWER } from "./world";

// Pad 01: the pad and its hold-down clamps, the service tower with its
// umbilical arm, and the ground cloud at ignition. Plus a small pool of
// puffs shared by stage separation and the RCS burn. (Pad vent puffs were cut:
// at hero size they read as a stray ball beside the booster.)

const D2R = Math.PI / 180;
const CLOUD = 56;
const POOL = 10;
const POST = { h: 3.0, half: 0.14, base: -0.08 };
const BAYS = 10;
const ARM = { y: 1.72, len: 1.08 };
// The arm hinges on the tower's inner corner and points at the booster's axis.
const ARM_PIVOT = new Vector3(POST.half, ARM.y, POST.half);
const ARM_YAW = -Math.atan2(-(TOWER.z + POST.half), -(TOWER.x + POST.half));

/** Parks an unused puff inside the opaque planet. */
const park = (o: Object3D) => {
  o.position.set(0, -R, 0);
  o.scale.setScalar(0.01);
};

type Puff = { dir: Vector3; delay: number; reach: number; size: number };

function cloudPuffs(): Puff[] {
  const rand = mulberry32(7);
  return Array.from({ length: CLOUD }, (_, i) => {
    const lobe = i % 2 === 0 ? 90 : 180; // the flame trench exits: +X and −Z
    const a = (lobe + (rand() * 2 - 1) * 25) * D2R;
    return { dir: new Vector3(Math.sin(a), 0, Math.cos(a)), delay: rand() * 0.05, reach: 0.5 + rand() * 1.7, size: 0.14 + rand() * 0.28 };
  });
}

// Tower bracing: an X in every bay on all four faces.
function bracing() {
  const pts: [number, number, number][] = [];
  const h = POST.half;
  const corners: [number, number][] = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  const bay = (POST.h - 0.1) / BAYS;
  for (let f = 0; f < 4; f++) {
    const [a, b] = [corners[f], corners[(f + 1) % 4]];
    for (let i = 0; i < BAYS; i++) {
      const [y0, y1] = [i * bay, (i + 1) * bay];
      pts.push([a[0], y0, a[1]], [b[0], y1, b[1]], [b[0], y0, b[1]], [a[0], y1, a[1]]);
    }
  }
  return pts;
}

export default function LaunchSite() {
  const frame = useMission();
  const m = materials();
  const slate = palette().slate;
  const tower = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const led = useRef<MeshStandardMaterial>(null);
  const clamps = useRef<(Group | null)[]>([]);
  const cloud = useRef<InstancedMesh>(null);
  const pool = useRef<InstancedMesh>(null);
  const puffs = useMemo(() => cloudPuffs(), []);
  const braces = useMemo(() => bracing(), []);
  const scratch = useMemo(() => ({ o: new Object3D(), v: new Vector3(), w: new Vector3() }), []);
  const cloudLive = useRef(true);
  const poolUsed = useRef(0);

  useFrame(() => {
    const { p, t } = frame;
    // Tower: arm swings clear before ignition, then the tower retracts into the pad during the turn.
    if (tower.current) {
      tower.current.visible = p < 0.32;
      tower.current.scale.y = Math.max(1e-3, 1 - eio(seg(p, 0.26, 0.32)));
    }
    if (arm.current) arm.current.rotation.y = ARM_YAW + 105 * D2R * eio(seg(p, 0.1, 0.115));
    if (led.current) led.current.emissiveIntensity = p < 0.12 && !frame.still && t % 1 < 0.5 ? 1.2 : 0.05;
    const release = 25 * D2R * eio(seg(p, 0.125, 0.135));
    clamps.current.forEach((c) => {
      if (c) c.rotation.x = release;
    });

    // Ground cloud: puffs roll out along the trench lobes and sit on the curved ground.
    // Puffs not out yet are parked inside the opaque planet, never at zero scale,
    // so their outlines can't leave a dot behind.
    const c = cloud.current;
    if (c) {
      const live = p >= 0.12 && p < 0.31;
      c.visible = live;
      if (live || cloudLive.current) {
        const { o } = scratch;
        // The cloud settles: puffs spread a little and sink into the (white) ground rather than shrinking to beads.
        const sink = smooth(seg(p, 0.235, 0.305));
        puffs.forEach((pf, i) => {
          const u = seg(p, 0.12 + pf.delay, 0.22 + pf.delay);
          const size = pf.size * (0.35 + 0.65 * Math.sqrt(u)) * (1 - 0.3 * sink) * (1 + 0.04 * Math.sin(0.8 * t + i));
          if (u <= 0 || sink >= 1) park(o);
          else {
            const d = 0.9 + (pf.reach * (1 - Math.exp(-3 * u))) / (1 - Math.exp(-3)) + 0.25 * sink;
            const [x, z] = [pf.dir.x * d, pf.dir.z * d];
            o.position.set(x, Math.sqrt(R * R - x * x - z * z) - R + (0.55 - 1.5 * sink) * size, z);
            o.scale.set(size, size * 0.8, size);
          }
          o.updateMatrix();
          c.setMatrixAt(i, o.matrix);
        });
        c.instanceMatrix.needsUpdate = true;
        cloudLive.current = live;
      }
    }

    // Puff pool: separation at the interstage, RCS at the burn.
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
          o.scale.setScalar(size * s);
        }
        o.updateMatrix();
        pl.setMatrixAt(n++, o.matrix);
      };
      if (p >= 0.355 && p < 0.37) {
        const a = seg(p, 0.355, 0.37);
        for (let j = 0; j < 4; j++) {
          const az = (45 + 90 * j) * D2R;
          const r = 0.26 + 0.25 * a;
          put(w.set(Math.sin(az) * r, -0.21 - 0.1 * a, Math.cos(az) * r), 0.13 * Math.sin(Math.PI * a));
        }
      }
      if (p >= 0.825 && p < 0.84) {
        const a = seg(p, 0.825, 0.84);
        const size = 0.08 * Math.sin(Math.PI * a);
        put(w.set(0.3 + 0.2 * a, 0.06, 0), size);
        put(w.set(-0.3 - 0.2 * a, 0.06, 0), size);
        put(w.set(0, 0.06, -0.3 - 0.2 * a), size);
      }
      const used = n;
      while (n < POOL) put(w, 0);
      pl.visible = used > 0;
      if (used > 0 || poolUsed.current > 0) pl.instanceMatrix.needsUpdate = true;
      poolUsed.current = used;
    }
  });

  // Instanced outline copies keep a stale bounding sphere; never cull the puffs.
  useEffect(() => {
    [cloud.current, pool.current].forEach((mesh) =>
      mesh?.traverse((o) => {
        o.frustumCulled = false;
      }),
    );
  }, []);

  return (
    <group>
      {/* The pad: a ceramic disc with a champagne inlay. */}
      <mesh position-y={0.03 - 0.1} material={m.ceramic} receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.2, 64]} />
        <Outlines thickness={1} color={slate} />
      </mesh>
      <mesh position-y={0.034} rotation-x={Math.PI / 2} material={m.champagne}>
        <torusGeometry args={[0.78, 0.008, 8, 96]} />
      </mesh>
      {/* Hold-down clamps: they tip outward as the booster lifts. */}
      {[0, 1, 2, 3].map((k) => (
        <group key={k} rotation-y={(45 + 90 * k) * D2R}>
          <group
            ref={(g) => {
              clamps.current[k] = g;
            }}
            position={[0, 0.03, 0.23]}
          >
            <mesh position-y={0.1} material={m.champagne} castShadow>
              <boxGeometry args={[0.07, 0.2, 0.05]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Service tower. */}
      <group ref={tower} position={TOWER}>
        {[
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * POST.half, POST.base + POST.h / 2, z * POST.half]} material={m.alu} castShadow>
            <cylinderGeometry args={[0.014, 0.014, POST.h, 8]} />
          </mesh>
        ))}
        <Line points={braces} segments color={slate} lineWidth={1} />
        <mesh position-y={POST.base + POST.h + 0.03}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshStandardMaterial ref={led} color="#ffffff" emissive="#34d399" emissiveIntensity={0.05} toneMapped={false} />
        </mesh>
        <group ref={arm} position={ARM_PIVOT} rotation-y={ARM_YAW}>
          <mesh position-x={ARM.len / 2} material={m.alu} castShadow>
            <boxGeometry args={[ARM.len, 0.03, 0.03]} />
          </mesh>
        </group>
      </group>

      <instancedMesh ref={cloud} args={[undefined, undefined, CLOUD]} visible={false} frustumCulled={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#f4f5f3" roughness={1} emissive="#ffffff" emissiveIntensity={0.3} />
        <Outlines thickness={1} color={slate} />
      </instancedMesh>
      <instancedMesh ref={pool} args={[undefined, undefined, POOL]} visible={false} frustumCulled={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#f4f5f3" roughness={1} emissive="#ffffff" emissiveIntensity={0.3} />
        <Outlines thickness={1} color={slate} />
      </instancedMesh>
    </group>
  );
}
