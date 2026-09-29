import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, Color, Matrix4, type Group, type InstancedMesh, type Material, type Object3D } from "three";
import { CHANNELS } from "../growth-engine/channels";
import { useMission } from "./frame";
import { latchAt, seg, wingDeploy } from "./timeline";

// The four channel wings (bus-local pad units). Each wing: a carbon yoke on a standoff at a gold side
// face, then three 0.24 × 0.18 panels. Stowed, the yoke hangs down and the panels lie accordion-folded
// flat against the face, white backs out; deployed, the wing lies in the bus's equatorial plane, cells
// up, fanned 45° out of the face so the four make an X. The outermost rail is anodised in the channel
// colour and a yoke LED pulses at the latch. The wings are transform rigs; all their parts draw as
// four instanced meshes (panels, yokes, rails, LEDs), so the whole array set is a handful of draws.

export const PANEL = { along: 0.24, across: 0.18, t: 0.008 } as const;
const YOKE = 0.06;
const PITCH = 0.009; // panel spacing in the folded stack
const HINGE_Y = -0.02;
/** Each wing's hinge (bus-local x on its face, z), the face (+1/−1 in x) and its fan direction. */
export const MOUNTS = [
  { face: 1, x: 0.104, z: 0.012, fan: -1 }, // 0: +X +Z, inner stack
  { face: 1, x: 0.142, z: -0.012, fan: 1 }, // 1: +X −Z, outer stack
  { face: -1, x: 0.104, z: -0.012, fan: -1 }, // 2: −X −Z, inner stack
  { face: -1, x: 0.142, z: 0.012, fan: 1 }, // 3: −X +Z, outer stack
] as const;
const LED_OFF = new Color("#15161a");
const CHANNEL = CHANNELS.map((c) => new Color(c.color));
const led = new Color();
const inv = new Matrix4();
const mm = new Matrix4();

/** A panel box with two draw groups: cells (and the frame-coloured edges) and the white back. */
function panelGeometry() {
  const g = new BoxGeometry(PANEL.along, PANEL.t, PANEL.across);
  const index = g.index!.array;
  const face = (f: number) => Array.from(index.slice(f * 6, f * 6 + 6));
  g.setIndex([0, 1, 2, 4, 5, 3].flatMap(face)); // px nx py pz nz | ny
  g.clearGroups();
  g.addGroup(0, 30, 0);
  g.addGroup(30, 6, 1);
  const uv = g.attributes.uv;
  for (const f of [0, 1, 4, 5]) for (let v = f * 4; v < f * 4 + 4; v++) uv.setXY(v, 0.004, 0.5); // edges sample the frame
  return g;
}

type Rig = { root: Group | null; yoke: Group | null; joints: (Group | null)[]; panels: (Object3D | null)[]; rail: Object3D | null; led: Object3D | null; bar: Object3D | null };

export default function SatArrays({ mats, tipRef }: { mats: { cells: Material; back: Material; carbon: Material }; tipRef: (i: number, o: Object3D | null) => void }) {
  const frame = useMission();
  const group = useRef<Group>(null);
  const panels = useRef<InstancedMesh>(null);
  const yokes = useRef<InstancedMesh>(null);
  const rails = useRef<InstancedMesh>(null);
  const leds = useRef<InstancedMesh>(null);
  const rigs = useRef<Rig[]>(MOUNTS.map(() => ({ root: null, yoke: null, joints: [], panels: [], rail: null, led: null, bar: null })));
  const panelGeo = useMemo(() => panelGeometry(), []);
  const panelMats = useMemo(() => [mats.cells, mats.back], [mats]);

  useLayoutEffect(() => {
    // Instance colours must exist before the materials first compile.
    CHANNEL.forEach((c, i) => {
      rails.current?.setColorAt(i, c);
      leds.current?.setColorAt(i, LED_OFF);
    });
  }, []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = frame.p;
    rigs.current.forEach((r, i) => {
      const m = MOUNTS[i];
      const { yoke, fold } = wingDeploy(p, i);
      if (r.root) r.root.rotation.y = (m.face > 0 ? 0 : Math.PI) + m.fan * (Math.PI / 4) * yoke;
      if (r.yoke) r.yoke.rotation.z = -(Math.PI / 2) * (1 - yoke);
      // Alternating folds; each joint steps the next panel one pitch outward while folded.
      r.joints.forEach((j, k) => {
        if (!j) return;
        const s = k % 2 === 0 ? 1 : -1;
        j.rotation.z = s * Math.PI * fold;
        j.position.y = s * (k === 0 ? 0.012 : PITCH) * Math.max(0, fold);
      });
      const L = latchAt(i);
      const k = p < L ? 0 : 0.4 + 1.6 * (1 - seg(p, L, L + 0.006));
      leds.current?.setColorAt(i, k > 0 ? led.copy(CHANNEL[i]).multiplyScalar(k) : LED_OFF);
    });
    g.updateMatrixWorld(true);
    inv.copy(g.matrixWorld).invert();
    const put = (mesh: InstancedMesh | null, i: number, o: Object3D | null) => {
      if (mesh && o) mesh.setMatrixAt(i, mm.multiplyMatrices(inv, o.matrixWorld));
    };
    rigs.current.forEach((r, i) => {
      r.panels.forEach((o, k) => put(panels.current, i * 3 + k, o));
      put(yokes.current, i, r.bar);
      put(rails.current, i, r.rail);
      put(leds.current, i, r.led);
    });
    for (const mesh of [panels.current, yokes.current, rails.current, leds.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true;
    if (leds.current?.instanceColor) leds.current.instanceColor.needsUpdate = true;
  }, -1.6);

  const rig = (i: number) => rigs.current[i];
  return (
    <group ref={group}>
      {MOUNTS.map((m, i) => (
        <group key={i} position={[m.face * m.x, HINGE_Y, m.z]} ref={(o) => void (rig(i).root = o)}>
          <group ref={(o) => void (rig(i).yoke = o)}>
            <object3D position={[YOKE / 2, 0, 0]} ref={(o) => void (rig(i).bar = o)} />
            <object3D position={[0.016, 0.0045, 0]} ref={(o) => void (rig(i).led = o)} />
            <group position={[YOKE, 0, 0]} ref={(o) => void (rig(i).joints[0] = o)}>
              <object3D position={[PANEL.along / 2, 0, 0]} ref={(o) => void (rig(i).panels[0] = o)} />
              <group position={[PANEL.along, 0, 0]} ref={(o) => void (rig(i).joints[1] = o)}>
                <object3D position={[PANEL.along / 2, 0, 0]} ref={(o) => void (rig(i).panels[1] = o)} />
                <group position={[PANEL.along, 0, 0]} ref={(o) => void (rig(i).joints[2] = o)}>
                  <object3D position={[PANEL.along / 2, 0, 0]} ref={(o) => void (rig(i).panels[2] = o)} />
                  <object3D position={[PANEL.along + 0.003, 0, 0]} ref={(o) => void (rig(i).rail = o)} />
                  <object3D position={[PANEL.along, 0, 0]} ref={(o) => tipRef(i, o)} />
                </group>
              </group>
            </group>
          </group>
        </group>
      ))}
      <instancedMesh ref={panels} args={[panelGeo, panelMats, 12]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={yokes} args={[undefined, mats.carbon, 4]} castShadow frustumCulled={false}>
        <boxGeometry args={[YOKE, 0.006, 0.05]} />
      </instancedMesh>
      <instancedMesh ref={rails} args={[undefined, undefined, 4]} frustumCulled={false}>
        <boxGeometry args={[0.006, 0.011, PANEL.across + 0.004]} />
        <meshStandardMaterial metalness={0.6} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={leds} args={[undefined, undefined, 4]} frustumCulled={false}>
        <boxGeometry args={[0.008, 0.003, 0.008]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
