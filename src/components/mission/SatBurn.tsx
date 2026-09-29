import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Points, ShaderMaterial } from "three";
import { useMission } from "./frame";
import Marker, { markerMaterial } from "./Marker";
import { PlumeLayer, type LayerSpec } from "./Rocket";
import { BUS } from "./satelliteGeometry";
import { seg } from "./timeline";

// The correction burn (.83–.845): the four thrusters fire, the launcher's plume shader at a tenth of its
// scale in a hot blue-white (a hypergolic thruster, no soot), with a soft flash under the bus that carries
// it at the wide shot's distance. Bus-local, inside the satellite group.

const BURN: LayerSpec[] = [
  {
    rTop: 0.14,
    rBot: 0.34,
    len: 1.7,
    ramp: ["#ffffff", "#eef3ff", "#dfe8ff", "#8ea8ff"],
    I: 1.3,
    alphaK: 0.7,
    pow: 1.2,
    tail: 0.3,
    head: 0.02,
    wobble: 0.15,
  },
  {
    rTop: 0.1,
    rBot: 0.11,
    len: 0.45,
    ramp: ["#ffffff", "#ffffff", "#f1f5ff", "#dfe8ff"],
    I: 1.8,
    alphaK: 0.6,
    pow: 0.5,
    tail: 0.45,
    additive: true,
    wobble: 0.05,
  },
];
/** The thruster bells: lower corners, canted outward (satelliteGeometry's thrusterGeometry). */
const BELLS = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
] as const;
const BELL_Y = -BUS.h / 2 - 0.009;

/** Burn envelope: a hard light, a steady burn, a quick tail-off. */
export const burn = (p: number) =>
  seg(p, 0.83, 0.8315) * (1 - seg(p, 0.841, 0.845));

export default function SatBurn() {
  const frame = useMission();
  const mats = useRef<(ShaderMaterial | null)[]>([]);
  const flash = useRef<Points>(null);
  const plumes = useRef<Group>(null);

  useFrame(() => {
    const { p, t } = frame;
    const b = burn(p);
    if (plumes.current) plumes.current.visible = b > 0.002; // near-zero plumes still draw
    const flicker = 0.9 + 0.1 * Math.sin(t * 47) * Math.sin(t * 13.3);
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.uniforms.uI.value = BURN[i % BURN.length].I * b * flicker;
      m.uniforms.uTime.value = t;
    });
    const f = flash.current;
    if (f) {
      f.visible = b > 0.002;
      const m = markerMaterial(f);
      if (m) m.uniforms.uOpacity.value = b * flicker;
    }
  });

  return (
    <group>
      <group ref={plumes} visible={false}>
        {BELLS.map(([x, z], j) => (
          <group
            key={j}
            position={[x * 0.082, BELL_Y, z * 0.082]}
            rotation={[z * 0.25, 0, -x * 0.25]}
          >
            <group position-y={-0.01} scale={0.1}>
              {BURN.map((spec, i) => (
                <PlumeLayer
                  key={i}
                  spec={spec}
                  order={5 + i}
                  matRef={(m) => {
                    mats.current[j * BURN.length + i] = m;
                  }}
                />
              ))}
            </group>
          </group>
        ))}
      </group>
      <Marker
        ref={flash}
        size={44}
        soft
        additive
        color="#dfe8ff"
        position={[0, BELL_Y - 0.04, 0]}
      />
    </group>
  );
}
