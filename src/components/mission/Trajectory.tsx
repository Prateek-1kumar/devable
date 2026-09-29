import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { AdditiveBlending, Color, Quaternion, Vector3, type Points } from "three";
import type { Line2 } from "three-stdlib";
import { useMission } from "./frame";
import Marker, { markerMaterial } from "./Marker";
import { satelliteAttitude } from "./satelliteMotion";
import { R, seg, smooth, SUN_ORBIT, windowed } from "./timeline";
import { countUpTo, ghostPoints, ringPoints, samplePath } from "./trajectoryData";
import { C, ghostImpactFrame, polar } from "./world";

// The flight-dynamics line system: thin white lines, depth-tested against the opaque Earth so their
// back halves go behind it (no ghost pass), one amber for off-nominal. Flown path solid with a faint
// additive glow, fading by lap and toward the limb; plan dashed; the suborbital spike a dimmer dashed
// ghost with an amber impact ring; a pin at the Cape and a position dot at the craft. Lines show over
// .30–.345 (the flight-dynamics wide) and from .58 on; the close shots have none.

const WHITE = "#eef4ff";
const AMBER = "#ffb547";
const LINE = { depthTest: true, depthWrite: false, transparent: true, toneMapped: false, renderOrder: 3 } as const;
const DASH = { dashed: true, dashSize: 0.5, gapSize: 0.35 } as const;
const CAUTION = { from: 0.785, to: 0.83 } as const;

/** RGBA per point: the colour, alpha 1 (the per-frame fades write the alphas in place). */
const rgba = (n: number, hex: string) => {
  const c = new Color(hex).toArray();
  return Array.from({ length: n }, (): [number, number, number, number] => [c[0], c[1], c[2], 1]);
};

/** Writes per-point alphas into a Line2's segment colour buffer (segment k holds points k and k+1). */
function writeAlphas(line: Line2 | null, n: number, alpha: (i: number) => number) {
  const attr = line?.geometry.attributes.instanceColorStart as { data?: { array: Float32Array; needsUpdate: boolean } } | undefined;
  const data = attr?.data;
  if (!data) return;
  let prev = alpha(0);
  for (let k = 0; k < n - 1; k++) {
    const next = alpha(k + 1);
    data.array[k * 8 + 3] = prev;
    data.array[k * 8 + 7] = next;
    prev = next;
  }
  data.needsUpdate = true;
}

function show(line: Line2 | Points | null, opacity: number, count?: number) {
  if (!line) return;
  line.visible = opacity > 0.002 && (count === undefined || count > 0);
  if (!line.visible) return;
  if ("isLine2" in line) {
    line.material.opacity = opacity;
    if (count !== undefined) line.geometry.instanceCount = count;
  } else {
    const m = markerMaterial(line);
    if (m) m.uniforms.uOpacity.value = opacity;
  }
}

const camDir = new Vector3();
const SUN = new Vector3(...SUN_ORBIT).normalize();
const view = new Vector3();
const half = new Vector3();
const normal = new Vector3();
const att = new Quaternion();

export default function Trajectory() {
  const frame = useMission();
  const flown = useRef<Line2>(null);
  const glow = useRef<Line2>(null);
  const plan = useRef<Line2>(null);
  const ring = useRef<Line2>(null);
  const caution = useRef<Line2>(null);
  const cautionGhost = useRef<Line2>(null);
  const ghost = useRef<Line2>(null);
  const impact = useRef<Points>(null);
  const pin = useRef<Points>(null);
  const dot = useRef<Points>(null);
  const pulse = useRef<Points>(null);
  const glint = useRef<Points>(null);

  const data = useMemo(() => {
    const flownPath = samplePath(0.26, 1, 0.12, true);
    const planPath = samplePath(0.26, 0.4, 0.15);
    const cautionPath = samplePath(CAUTION.from, CAUTION.to, 0.1);
    const { at } = ghostImpactFrame();
    return {
      flown: flownPath,
      flownColors: rgba(flownPath.pts.length, WHITE),
      plan: planPath,
      planColors: rgba(planPath.pts.length, WHITE),
      caution: cautionPath,
      ring: ringPoints(),
      ringColors: rgba(721, WHITE),
      ghost: ghostPoints(),
      impactAt: at.clone().sub(C).setLength(R * 1.003).add(C).toArray(),
      pinAt: polar(0, R * 1.0015).toArray(),
    };
  }, []);

  useFrame((state) => {
    const p = frame.p;
    // The two windows the lines live in, eased so nothing pops.
    const wide1 = windowed(p, 0.295, 0.305, 0.338, 0.346);
    const wide2 = smooth(seg(p, 0.575, 0.6));
    const on = Math.max(wide1, wide2);

    // Flown: revealed up to the craft; laps fade, the far side fades toward the limb; the caution
    // stretch is left to the amber line until the burn is done.
    const f = data.flown;
    const count = Math.max(0, countUpTo(f.p, p) - 1);
    show(flown.current, 0.85 * on, count);
    show(glow.current, 0.07 * on, count);
    if (on > 0 && count > 0) {
      const th = frame.theta;
      camDir.subVectors(state.camera.position, C).normalize();
      const gap = p < 0.85 ? 0 : seg(p, 0.85, 0.862);
      const alpha = (i: number) => {
        const t = f.theta[i];
        const lap = (0.15 + 0.85 * smooth(seg(t, th - 720, th - 360))) * (0.3 + 0.7 * smooth(seg(t, th - 360, th)));
        const depth = 0.4 + 0.6 * smooth(seg(f.radial[i].dot(camDir), -0.3, 0.3));
        const pi = f.p[i];
        return lap * depth * (pi > CAUTION.from && pi < CAUTION.to ? gap : 1);
      };
      writeAlphas(flown.current, Math.min(f.pts.length, count + 2), alpha);
      const src = flown.current?.geometry.attributes.instanceColorStart as unknown as { data: { array: Float32Array } } | undefined;
      const dst = glow.current?.geometry.attributes.instanceColorStart as unknown as { data: { array: Float32Array; needsUpdate: boolean } } | undefined;
      if (src && dst) {
        dst.data.array.set(src.data.array);
        dst.data.needsUpdate = true;
      }
    }

    // Plan: the insertion arc ahead of the craft (flight-dynamics wide), and the parking ring.
    show(plan.current, 0.35 * wide1);
    if (wide1 > 0) writeAlphas(plan.current, data.plan.pts.length, (i) => smooth(seg(data.plan.p[i], p, p + 0.004)));
    show(ring.current, (p < 0.85 ? 0.35 : 0.35 - 0.1 * seg(p, 0.85, 0.87)) * on);
    if (on > 0) {
      // Plan ahead, flown behind: where the latest pass over an angle is on the ring and still bright,
      // the dashes step aside so they never flicker over the solid line. The sag keeps its plan.
      const th = frame.theta;
      writeAlphas(ring.current, 721, (i) => {
        const last = th - ((((th - i / 2) % 360) + 360) % 360); // the latest θ that passed this angle
        if (last < 22 || last >= 770 || (last > 695 && last < 750 && p < 0.85)) return 1;
        return 1 - 0.9 * smooth(seg(last, th - 360, th));
      });
    }

    // Caution: the sag below plan in amber, then a dashed ghost of it until .855.
    const cCount = Math.max(0, countUpTo(data.caution.p, p) - 1);
    show(caution.current, 0.9 * (1 - seg(p, 0.83, 0.836)) * wide2, cCount);
    show(cautionGhost.current, 0.35 * seg(p, 0.83, 0.836) * (1 - seg(p, 0.848, 0.855)) * wide2, cCount);

    // The launch spike and where it lands, the pin at the Cape.
    show(ghost.current, 0.35 * windowed(p, 0.295, 0.305, 0.34, 0.35));
    show(impact.current, windowed(p, 0.3, 0.31, 0.34, 0.35));
    show(pin.current, wide1);

    // Position dot with its pulse (every 1.6 s).
    const d = dot.current;
    const u = pulse.current;
    show(d, on);
    show(u, 0.4 * on * (1 - ((frame.t / 1.6) % 1)));
    d?.position.copy(frame.craft);
    if (u) {
      u.position.copy(frame.craft);
      const m = markerMaterial(u);
      if (m) m.uniforms.uSize.value = 2 + 10 * ((frame.t / 1.6) % 1);
    }

    // Sun glint off the arrays in the final hold: strongest near the specular geometry, never gone.
    const gl = glint.current;
    const hold = smooth(seg(p, 0.93, 0.96));
    if (gl && hold > 0) {
      satelliteAttitude(p, frame.craft, frame.quat, att);
      normal.set(0, 1, 0).applyQuaternion(att.premultiply(frame.quat));
      view.subVectors(state.camera.position, frame.craft).normalize();
      half.addVectors(SUN, view).normalize();
      gl.position.copy(frame.craft).addScaledVector(view, 0.25 * frame.scale); // in front of the bus, so its depth never hides it
      show(gl, hold * (0.45 + 0.55 * Math.max(0, normal.dot(half)) ** 6));
    } else show(gl, 0);
  });

  return (
    <group>
      <Line ref={ring} points={data.ring} vertexColors={data.ringColors} lineWidth={1} {...DASH} {...LINE} />
      <Line ref={plan} points={data.plan.pts} vertexColors={data.planColors} lineWidth={1} {...DASH} {...LINE} />
      <Line ref={ghost} points={data.ghost} color={WHITE} lineWidth={1} {...DASH} {...LINE} />
      <Line ref={glow} points={data.flown.pts} vertexColors={data.flownColors} lineWidth={4} blending={AdditiveBlending} {...LINE} />
      <Line ref={flown} points={data.flown.pts} vertexColors={data.flownColors} lineWidth={1.25} {...LINE} />
      <Line ref={caution} points={data.caution.pts} color={AMBER} lineWidth={1.25} {...LINE} />
      <Line ref={cautionGhost} points={data.caution.pts} color={AMBER} lineWidth={1.25} {...DASH} {...LINE} />
      <Marker ref={impact} size={8} ring color={AMBER} position={data.impactAt as [number, number, number]} />
      <Marker ref={pin} size={3} position={data.pinAt as [number, number, number]} />
      <Marker ref={dot} size={5} />
      <Marker ref={pulse} size={2} ring />
      <Marker ref={glint} size={16} soft additive color="#fff4e2" />
    </group>
  );
}
