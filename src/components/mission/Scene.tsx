import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Vector3, type PerspectiveCamera } from "three";
import { channelFocus } from "../growth-engine/channelFocus";
import { FrameContext, MissionFrame, useMission } from "./frame";
import LaunchSite from "./LaunchSite";
import Planet from "./Planet";
import Stations from "./Stations";
import { CAMERA_KEYS, KARMAN, LABEL_IDS, labelOpacity, R0, SAT_STOWED, STILL_SQUARE, type LabelId } from "./timeline";
import Trajectory from "./Trajectory";
import Vehicle from "./Vehicle";
import { cameraAt, cameraPose, cameraPoseInit, craftPosition, ghostPoint, PAD_TOP, polar, ROCKET_BASE, ROCKET_K } from "./world";

export type Progress = { shown: number };

type Props = {
  /** One settled frame at p = 1 (phones, reduced motion). */
  still: boolean;
  /** Pause the render loop while the hero is off screen. */
  active: boolean;
  /** The smoothed scroll progress, written by the DOM loop. */
  progress: RefObject<Progress>;
  /** Projected label nodes in the overlay (pinned mode only). */
  labels?: RefObject<Map<string, HTMLElement>>;
  /** Mount the soft contact shadow under the pad (only while the pad is on screen). */
  padShadows?: boolean;
  onReady?: () => void;
};

/** Mission DVB-01: the pinned hero's 3D world. */
export default function Scene({ still, active, progress, labels, padShadows = false, onReady }: Props) {
  return (
    <Canvas
      flat
      shadows="percentage"
      dpr={[1, 2]}
      frameloop={still ? "demand" : active ? "always" : "never"}
      camera={{ fov: 22, near: 0.05, far: 2000, position: [6.95, 3.31, 12.03] }}
      onCreated={() => onReady?.()}
    >
      <Mission still={still} progress={progress} labels={labels} padShadows={padShadows} />
    </Canvas>
  );
}

function Mission({ still, progress, labels, padShadows }: Omit<Props, "active" | "onReady">) {
  const [frame] = useState(() => new MissionFrame());
  return (
    <FrameContext.Provider value={frame}>
      <FramePass still={still} progress={progress} />
      <CameraRig />
      {still && <FocusInvalidate />}

      {/* Studio light: a soft sky, a shadow-casting key from the upper left, a cool rim from behind,
          and an environment of softboxes for the gloss, the clearcoat streaks and the warm metal. */}
      <hemisphereLight args={["#ffffff", "#e3ece6", 0.75]} />
      <directionalLight
        castShadow
        position={[-6, 10, 8]}
        intensity={1.35}
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-3, 3, 3, -3, 1, 30]} />
      </directionalLight>
      <directionalLight position={[8, 4, -10]} intensity={0.6} color="#eaf6ff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.2} position={[-4, 5, 4]} scale={[8, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} position={[5, 3, -3]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.8} position={[0, 8, 0]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} position={[0, 3, -9]} scale={[12, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.3} color="#ffe7c7" position={[6, -2, 4]} scale={[4, 2, 1]} target={[0, 0, 0]} />
      </Environment>
      {/* Mounted once and gated by props: drei never disposes its render targets, so remounting leaked them.
          frames 0 stops its per-frame shadow pass once the pad is off screen. */}
      {!still && (
        <group visible={padShadows}>
          <ContactShadows position={[0, PAD_TOP + 0.002, 0]} scale={6} blur={2.4} far={3.5} opacity={0.3} resolution={1024} color="#0c3b29" frames={padShadows ? Infinity : 0} />
        </group>
      )}

      <Planet />
      <LaunchSite />
      <Vehicle />
      <Trajectory />
      <Stations />
      {labels && <LabelWriter labels={labels} />}
    </FrameContext.Provider>
  );
}

/** Advances the shared frame before any part reads it. */
function FramePass({ still, progress }: { still: boolean; progress: RefObject<Progress> }) {
  const frame = useMission();
  const primed = useRef(false);
  useFrame((state) => {
    const p = still ? 1 : (progress.current?.shown ?? 0);
    frame.update(p, still ? 0 : state.clock.elapsedTime, still);
    // Shadows only matter on the pad; stop re-rendering the shadow map once it has faded.
    // Render it once regardless (stills, mid-page reloads), or the pad samples an empty map and reads as shadowed.
    state.gl.shadowMap.autoUpdate = p < 0.27;
    if (!primed.current) {
      primed.current = true;
      state.gl.shadowMap.needsUpdate = true;
    }
  }, -3);
  return null;
}

/** In a still render, a channel hovered in the copy still lifts its array. */
function FocusInvalidate() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const off = channelFocus.subscribe(() => invalidate());
    return () => {
      off();
    };
  }, [invalidate]);
  return null;
}

/** The camera is a pure function of p (no second damping); the composition shift keeps the copy column clear. */
function CameraRig() {
  const frame = useMission();
  const pose = useMemo(() => cameraPoseInit(), []);
  const last = useRef("");
  useFrame((state) => {
    const cam = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    if (frame.still) cameraAt(width / height > 1.2 ? CAMERA_KEYS[CAMERA_KEYS.length - 1] : STILL_SQUARE, pose);
    else cameraPose(frame.p, pose);
    cam.position.copy(pose.position);
    cam.up.set(0, 1, 0);
    cam.lookAt(pose.target);
    const near = Math.max(0.05, 0.01 * pose.d);
    const far = 4 * pose.d + 80;
    const key = `${pose.fov.toFixed(3)}|${near.toFixed(3)}|${far.toFixed(1)}|${pose.shift.toFixed(4)}|${width}|${height}`;
    if (key !== last.current) {
      last.current = key;
      cam.fov = pose.fov;
      cam.near = near;
      cam.far = far;
      cam.setViewOffset(width, height, -width * pose.shift, 0, width, height); // also updates the projection
    }
    cam.updateMatrixWorld();
    frame.setDist(pose.d);
  }, -2);
  return null;
}

const LEADERS = new Set<LabelId>(["payload", "devable", "channels"]);
/** The caption column: it starts at 8vw and its titles are capped at 30rem (MissionCopy). */
const COPY_LEFT = 0.08;
const COPY_MAX = 480;
const ARRAY_LABELS: Partial<Record<LabelId, number>> = { a0: 0, a1: 1, a2: 2, a3: 3 };

/** Projects each label's anchor to the overlay and writes its transform and opacity (only when they change). */
function LabelWriter({ labels }: { labels: RefObject<Map<string, HTMLElement>> }) {
  const frame = useMission();
  const fixed = useMemo(
    () => ({
      karman: polar(18, KARMAN),
      spike: ghostPoint(0.5).add(new Vector3(0, 0.3, 0)),
      meco: craftPosition(0.355).add(new Vector3(0, 0.8, 0)), // above the path, clear of the craft flying on past it
      orbit: polar(48, R0),
    }),
    [],
  );
  const scratch = useMemo(
    () => ({ v: new Vector3(), craftNdc: new Vector3(), cache: new Map<LabelId, string>(), widths: new Map<LabelId, number>() }),
    [],
  );

  useFrame((state) => {
    const nodes = labels.current;
    if (!nodes) return;
    const { v, cache, craftNdc, widths } = scratch;
    const { width, height } = state.size;
    const p = frame.p;
    const local = (x: number, y: number, z: number) => v.set(x, y, z).multiplyScalar(frame.scale).applyQuaternion(frame.quat).add(frame.craft);
    for (const id of LABEL_IDS) {
      const el = nodes.get(id);
      if (!el) continue;
      const o = labelOpacity(id, p);
      let visible = o > 0.001;
      let x = 0;
      let y = 0;
      let left = false;
      if (visible) {
        if (id === "payload") local(0.12 * SAT_STOWED, 0.34 * SAT_STOWED, 0.1 * SAT_STOWED); // the capsule, in the open fairing
        else if (id === "devable") local(0.15 * ROCKET_K, ROCKET_BASE + 1.6 * ROCKET_K, 0.03 * ROCKET_K); // the launcher's first stage
        else if (id === "channels") v.copy(frame.tips[1]);
        else if (id in ARRAY_LABELS) v.copy(frame.tips[ARRAY_LABELS[id] ?? 0]);
        else v.copy(fixed[id as keyof typeof fixed]);
        v.project(state.camera);
        visible = v.z < 1 && v.z > -1;
        x = ((v.x + 1) / 2) * width;
        y = ((1 - v.y) / 2) * height;
        if (id in ARRAY_LABELS) {
          // Labels sit outboard of their tip, so they never run back across the craft. A left-hand
          // label that would reach into the copy column runs right instead, moved off its tip
          // vertically away from the craft (above an upper tip, below a lower one).
          craftNdc.copy(frame.craft).project(state.camera);
          const cx = ((craftNdc.x + 1) / 2) * width;
          const cy = ((1 - craftNdc.y) / 2) * height;
          let w = widths.get(id);
          if (!w) {
            w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0; // fixed text: measured once
            if (w) widths.set(id, w);
          }
          const west = x < cx;
          left = west && x - 10 - w > COPY_LEFT * width + COPY_MAX; // clears the caption column's widest line
          x += left ? -10 : 10;
          y += west && !left ? (y < cy ? -26 : 12) : -10;
        }
      }
      if (id in ARRAY_LABELS) {
        const side = left ? "left" : "right";
        if (el.dataset.side !== side) el.setAttribute("data-side", side);
      }
      const key = visible ? `${x.toFixed(1)}|${y.toFixed(1)}|${o.toFixed(3)}|${width}` : "hidden";
      if (cache.get(id) === key) continue;
      cache.set(id, key);
      if (!visible) {
        el.style.setProperty("visibility", "hidden");
        continue;
      }
      el.style.setProperty("visibility", "visible");
      el.style.setProperty("opacity", o.toFixed(3));
      el.style.setProperty("transform", `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`);
      if (LEADERS.has(id)) el.style.setProperty("--lead", `${Math.max(24, 0.79 * width - x).toFixed(1)}px`);
    }
  }, -1);
  return null;
}
