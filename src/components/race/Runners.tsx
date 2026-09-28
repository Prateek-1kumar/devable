import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CapsuleGeometry, Mesh, type Group } from "three";
import { CHANNELS } from "../growth-engine/channels";
import { materials, paintFade, palette } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { look } from "./look";
import { store } from "./store";
import { drawTo, twoLap } from "./sweep";
import { beadAt, pacerIn, runOf, setTilt, streakLen, stripRun } from "./timeline";
import { LANE_R, MONOLITH, START, frac, ovalAt, tangentAt, yawAlong, type P3 } from "./track";

// The four channels as runners: glossy gradient bodies (vivid at the tail,
// light at the nose) with a black visor, a porcelain race bib and a tail
// light, each riding its own pool of colored light and drawing a vivid streak
// behind it. Before the start, each one leaves the monolith as a pearl and runs
// down the home straight to its blocks.
// Lanes 01–03 are the distance runners (their streaks grow into unbroken rings);
// lane 04 is the sprinter.

const TILT = (10 * Math.PI) / 180;
const LEN = 0.3; // capsule, tail (−x) to nose (+x)

/** Monolith foot → the finish line in lane k → the blocks. */
function beadPath(k: number) {
  const pts: [number, number, number][] = [
    [MONOLITH.x, 0.07, MONOLITH.z],
    [2.8, 0.07, LANE_R[k]],
    [-2.4, 0.07, LANE_R[k]],
  ];
  const legs = [Math.hypot(pts[1][0] - pts[0][0], pts[1][2] - pts[0][2]), Math.hypot(pts[2][0] - pts[1][0], pts[2][2] - pts[1][2])];
  return { pts, legs, total: legs[0] + legs[1] };
}

function Runner({ k }: { k: number }) {
  const m = materials();
  const L = look();
  const { color, fade, deep, n } = CHANNELS[k];
  const pacer = useRef<Group>(null);
  const body = useRef<Group>(null);
  const pool = useRef<Mesh>(null);
  const streak = useRef<Mesh>(null);
  const bead = useRef<Mesh>(null);
  const strip = useMemo(() => twoLap(LANE_R[k], 0.07, 0.0345), [k]);
  const path = useMemo(() => beadPath(k), [k]);
  const bodyGeometry = useMemo(() => {
    const g = new CapsuleGeometry(0.05, LEN - 0.1, 8, 20);
    paintFade(new Mesh(g), color, fade[1], LEN); // along the capsule's axis: tail → nose
    return g.rotateZ(-Math.PI / 2); // axis +y → +x, the direction of travel
  }, [color, fade]);
  const drawBib = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.save();
      ctx.font = `600 64px ${palette().bodyFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = deep;
      ctx.fillText(n, w / 2, h / 2 + 3);
      ctx.restore();
    },
    [deep, n],
  );
  const bib = useCanvasTexture(128, 96, drawBib);
  const drawPool = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.save();
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, `${color}80`);
      g.addColorStop(0.5, `${color}33`);
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },
    [color],
  );
  const glow = useCanvasTexture(128, 128, drawPool);
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
        g.rotation.set(0, yawAlong(tangentAt(station, t)), 0);
        body.current?.rotation.set(0, 0, -TILT * tilt);
        body.current?.scale.setScalar(s);
        pool.current?.position.set(0, 0.053 - at.y, 0); // just over the contact shadows
      }
    }

    const sm = streak.current;
    if (sm) {
      const len = streakLen(k, p);
      sm.visible = len > 0;
      if (len > 0) {
        const head = stripRun(R);
        drawTo(sm.geometry, Math.max(0, head - len) / 2, head / 2);
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
        <group ref={body}>
          <mesh geometry={bodyGeometry} material={L.runner} castShadow />
          {/* Visor at 70% toward the nose. */}
          <mesh position-x={-LEN / 2 + 0.7 * LEN} rotation-z={Math.PI / 2} material={L.ink}>
            <cylinderGeometry args={[0.0515, 0.0515, 0.04, 24]} />
          </mesh>
          <RoundedBox args={[0.07, 0.012, 0.05]} radius={0.005} smoothness={2} position-y={0.052} material={m.porcelain} />
          <mesh position-y={0.0585} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
            <planeGeometry args={[0.046, 0.034]} />
            <meshBasicMaterial map={bib.texture} transparent depthWrite={false} />
          </mesh>
          <mesh position-x={-LEN / 2 + 0.004}>
            <sphereGeometry args={[0.018, 16, 12]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </group>
        <mesh ref={pool} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.5, 0.22]} />
          <meshBasicMaterial map={glow.texture} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>
      <mesh ref={streak} geometry={strip} visible={false}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={bead} material={L.pearl[k]} visible={false} castShadow>
        <sphereGeometry args={[0.035, 24, 16]} />
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
