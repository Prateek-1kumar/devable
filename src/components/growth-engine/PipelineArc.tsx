import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, Object3D, Quaternion, TubeGeometry, Vector3, type InstancedMesh, type Mesh, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { TETHER, TETHER_FROM, TETHER_TO } from "./layout";
import { clamp01, useStory } from "./story";

// The last leg of the story: the core fires each channel's returning leads up
// a glass data conduit into the pipeline monitor. The conduit carries a flowing
// energy line in the full dawn spectrum (every channel merging), scan rings glide
// along it, lead packets fly with comet trails in their channel color, and the
// emitter at the core and the receiver at the monitor pulse as packets launch
// and land.

const MAX_PACKETS = 48;
const TRAIL = [1, 0.7, 0.48, 0.3]; // head, then fading trail beads (scale)
const TRAIL_GAP = 0.018; // along the arc (0..1) between beads
const RINGS = 3;
const SPECTRUM = CHANNELS.map(({ color }) => new Color(color));
const TINTS = CHANNELS.map(({ color }) => new Color(color));
const Z = new Vector3(0, 0, 1);

/** The dawn spectrum at u (0 = core, 1 = monitor): indigo → azure → emerald → sun. */
function spectrum(u: number, out: Color) {
  const x = clamp01(u) * (SPECTRUM.length - 1);
  const i = Math.min(SPECTRUM.length - 2, Math.floor(x));
  return out.lerpColors(SPECTRUM[i], SPECTRUM[i + 1], x - i);
}

/** A thin ring set perpendicular to the arc at u. */
function placeRing(mesh: Mesh, u: number, tangent: Vector3, turn: Quaternion) {
  TETHER.getPointAt(u, mesh.position);
  TETHER.getTangentAt(u, tangent);
  mesh.quaternion.copy(turn.setFromUnitVectors(Z, tangent));
}

export default function PipelineArc() {
  const story = useStory();
  const tube = useMemo(() => new TubeGeometry(TETHER, 96, 0.05, 16, false), []);
  useEffect(() => () => tube.dispose(), [tube]);
  const points = useMemo(() => TETHER.getSpacedPoints(120), []);
  const colors = useMemo(() => points.map((_, i) => spectrum(i / (points.length - 1), new Color())), [points]);

  const line = useRef<Line2>(null);
  const packets = useRef<InstancedMesh>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  const ringInks = useRef<(MeshBasicMaterial | null)[]>([]);
  const emitter = useRef<Mesh>(null);
  const emitterInk = useRef<MeshBasicMaterial>(null);
  const receiver = useRef<Mesh>(null);
  const receiverInk = useRef<MeshBasicMaterial>(null);

  const scratch = useMemo(
    () => ({ dummy: new Object3D(), tangent: new Vector3(), turn: new Quaternion(), color: new Color(), launch: new Color(), land: new Color() }),
    [],
  );

  // The receiver faces along the arc's end.
  useEffect(() => {
    if (receiver.current) placeRing(receiver.current, 1, scratch.tangent, scratch.turn);
  }, [scratch]);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const shown = story.gaugeIn(t);

    // Conduit and energy line draw up from the core as the monitor appears.
    const total = tube.index?.count ?? 0;
    tube.setDrawRange(0, Math.floor((total * shown) / 6) * 6);
    const l = line.current;
    if (l) {
      l.material.opacity = shown;
      l.material.dashOffset = -t * 0.35; // dashes stream toward the monitor
    }

    // Scan rings glide along the conduit, tinted by where they are in the spectrum.
    rings.current.forEach((ring, i) => {
      const ink = ringInks.current[i];
      if (!ring || !ink) return;
      const u = (t * 0.12 + i / RINGS) % 1;
      placeRing(ring, u, scratch.tangent, scratch.turn);
      ink.color.copy(spectrum(u, scratch.color));
      ink.opacity = Math.sin(Math.PI * u) * 0.8 * shown;
    });

    // Lead packets with comet trails; note who is launching and landing for the endpoints.
    let launch = 0;
    let land = 0;
    let i = 0;
    const m = packets.current;
    const { dummy } = scratch;
    story.leads(t, (token, p) => {
      if (!m || i + TRAIL.length > MAX_PACKETS * TRAIL.length) return;
      TRAIL.forEach((size, j) => {
        const u = p - j * TRAIL_GAP;
        TETHER.getPointAt(clamp01(u), dummy.position);
        dummy.scale.setScalar(u < 0 ? 1e-4 : 0.055 * size);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i++, TINTS[token]);
      });
      const out = clamp01(1 - p / 0.12);
      if (out > launch) {
        launch = out;
        scratch.launch.copy(TINTS[token]);
      }
      const inn = clamp01((p - 0.88) / 0.12);
      if (inn > land) {
        land = inn;
        scratch.land.copy(TINTS[token]);
      }
    });
    if (m) {
      m.count = i;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }

    // Emitter at the core and receiver at the monitor: a soft idle glow, a bright pulse in the packet's color.
    if (emitter.current && emitterInk.current) {
      emitter.current.scale.setScalar(1 + launch * 0.6);
      emitterInk.current.opacity = (0.35 + launch * 0.65) * shown;
      emitterInk.current.color.copy(launch > 0 ? scratch.launch : SPECTRUM[0]);
    }
    if (receiver.current && receiverInk.current) {
      receiver.current.scale.setScalar(1 + land * 0.7);
      receiverInk.current.opacity = (0.35 + land * 0.65) * shown;
      receiverInk.current.color.copy(land > 0 ? scratch.land : SPECTRUM[SPECTRUM.length - 1]);
    }
  });

  return (
    <group>
      {/* Glass conduit. */}
      <mesh geometry={tube}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.28} roughness={0.1} clearcoat={1} clearcoatRoughness={0.05} depthWrite={false} />
      </mesh>
      {/* Energy line inside it, dashed and flowing, in the dawn spectrum. */}
      <Line ref={line} points={points} vertexColors={colors} lineWidth={2.2} dashed dashSize={0.1} gapSize={0.07} transparent opacity={0} />
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
        >
          <torusGeometry args={[0.078, 0.006, 8, 40]} />
          <meshBasicMaterial
            ref={(el) => {
              ringInks.current[i] = el;
            }}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <instancedMesh ref={packets} args={[undefined, undefined, MAX_PACKETS * TRAIL.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {/* Emitter ring around the core's socket, lying flat. */}
      <mesh ref={emitter} position={TETHER_FROM} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.13, 0.01, 10, 48]} />
        <meshBasicMaterial ref={emitterInk} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Receiver ring under the monitor, facing along the arc. */}
      <mesh ref={receiver} position={TETHER_TO}>
        <torusGeometry args={[0.11, 0.01, 10, 48]} />
        <meshBasicMaterial ref={receiverInk} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
