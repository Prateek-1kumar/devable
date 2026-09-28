import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { CHANNELS } from "../growth-engine/channels";
import { store } from "./store";
import { drawTo, twoLap } from "./sweep";
import { beadAt, pacerIn, runOf, setTilt, streakLen, stripRun } from "./timeline";
import { LANE_R, MONOLITH, START, frac, ovalAt, tangentAt, yawAlong, type P3 } from "./track";

// The four channels as runners: glossy capsule pacers in the channel colors,
// each drawing a vivid streak behind it. Before the start, each one leaves the
// monolith as a bead and runs down the home straight to its blocks.
// Lanes 01–03 are the distance runners (their streaks grow into unbroken rings);
// lane 04 is the sprinter.

const TILT = (10 * Math.PI) / 180;

/** Monolith foot → the finish line in lane k → the blocks. */
function beadPath(k: number) {
  const pts: [number, number, number][] = [
    [MONOLITH.x, 0.06, MONOLITH.z],
    [2.8, 0.06, LANE_R[k]],
    [-2.4, 0.06, LANE_R[k]],
  ];
  const legs = [Math.hypot(pts[1][0] - pts[0][0], pts[1][2] - pts[0][2]), Math.hypot(pts[2][0] - pts[1][0], pts[2][2] - pts[1][2])];
  return { pts, legs, total: legs[0] + legs[1] };
}

function Runner({ k }: { k: number }) {
  const { color } = CHANNELS[k];
  const pacer = useRef<Group>(null);
  const streak = useRef<Mesh>(null);
  const bead = useRef<Mesh>(null);
  const strip = useMemo(() => twoLap(LANE_R[k], 0.07, 0.032), [k]);
  const path = useMemo(() => beadPath(k), [k]);
  const scratch = useRef<{ at: P3; t: P3 }>({ at: { x: 0, y: 0, z: 0 }, t: { x: 0, y: 0, z: 0 } });

  useFrame(() => {
    const p = store.p;
    const { at, t } = scratch.current;
    const R = runOf(k, p);
    const station = frac(START + R);

    const g = pacer.current;
    if (g) {
      const s = pacerIn(k, p);
      g.visible = s > 0;
      if (s > 0) {
        const tilt = setTilt(p);
        ovalAt(station, LANE_R[k], at, 0.085 + 0.01 * tilt);
        g.position.set(at.x, at.y, at.z);
        g.rotation.set(0, yawAlong(tangentAt(station, t)), -TILT * tilt);
        g.scale.setScalar(s);
      }
    }

    const m = streak.current;
    if (m) {
      const len = streakLen(k, p);
      m.visible = len > 0;
      if (len > 0) {
        const head = stripRun(R);
        drawTo(m.geometry, Math.max(0, head - len) / 2, head / 2);
      }
    }

    const b = bead.current;
    if (b) {
      const f = beadAt(k, p);
      b.visible = f > 0 && f < 1;
      if (b.visible) {
        let d = f * path.total;
        const i = d < path.legs[0] ? 0 : 1;
        if (i === 1) d -= path.legs[0];
        const [a, c] = [path.pts[i], path.pts[i + 1]];
        const w = d / path.legs[i];
        b.position.set(a[0] + (c[0] - a[0]) * w, a[1], a[2] + (c[2] - a[2]) * w);
      }
    }
  });

  return (
    <group>
      <group ref={pacer} visible={false}>
        <mesh rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[0.05, 0.2, 8, 16]} />
          <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.35} clearcoat={1} clearcoatRoughness={0.1} roughness={0.2} />
        </mesh>
      </group>
      <mesh ref={streak} geometry={strip} visible={false}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={bead} visible={false}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Runners() {
  return (
    <group>
      {CHANNELS.map((c, k) => (
        <Runner key={c.n} k={k} />
      ))}
    </group>
  );
}
