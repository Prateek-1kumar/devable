import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, Object3D, QuadraticBezierCurve3, Vector3, type InstancedMesh } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { NOW_TOP, spectrum } from "./GrowthChart";
import { STACK_TOP } from "./layout";
import { clamp01, useStory } from "./story";

// The system's output: a slim bridge of light from the Devable mark on the stack
// top, arcing down onto this week's bar. It is a crisp line in the dawn spectrum
// over a soft glow, and every lead the channels bring in crosses it as a packet
// in its channel's color with a short comet trail, as the bar rises to meet it.

// Leaves from the mark's back edge (toward the chart), so it never covers the D.
const FROM = new Vector3(0.13, STACK_TOP + 0.1, -0.86);
const TO = NOW_TOP.clone().setY(NOW_TOP.y + 0.02);
const BRIDGE = new QuadraticBezierCurve3(FROM, FROM.clone().lerp(TO, 0.5).add(new Vector3(0, 1.4, 0)), TO);
const MAX_PACKETS = 40;
const TRAIL = [1, 0.72, 0.5, 0.32]; // head, then fading beads (scale)
const TRAIL_GAP = 0.016; // along the bridge (0..1)
const TINTS = CHANNELS.map(({ color }) => new Color(color));

export default function LightBridge() {
  const story = useStory();
  const points = useMemo(() => BRIDGE.getSpacedPoints(100), []);
  const colors = useMemo(() => points.map((_, i) => spectrum(i / (points.length - 1), new Color())), [points]);
  const core = useRef<Line2>(null);
  const glow = useRef<Line2>(null);
  const packets = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    // Fades in once the chart's history has built.
    const shown = story.weekIn(3, t);
    if (core.current) core.current.material.opacity = 0.95 * shown;
    if (glow.current) glow.current.material.opacity = 0.14 * shown;

    const m = packets.current;
    if (!m) return;
    let i = 0;
    story.leads(t, (token, p) => {
      if (i + TRAIL.length > MAX_PACKETS * TRAIL.length) return;
      TRAIL.forEach((size, j) => {
        const u = p - j * TRAIL_GAP;
        BRIDGE.getPointAt(clamp01(u), dummy.position);
        dummy.scale.setScalar(u < 0 ? 1e-4 : 0.05 * size);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i++, TINTS[token]);
      });
    });
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <Line ref={glow} points={points} vertexColors={colors} lineWidth={9} transparent opacity={0} depthWrite={false} />
      <Line ref={core} points={points} vertexColors={colors} lineWidth={2.2} transparent opacity={0} />
      <instancedMesh ref={packets} args={[undefined, undefined, MAX_PACKETS * TRAIL.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
