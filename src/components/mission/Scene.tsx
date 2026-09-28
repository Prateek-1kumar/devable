import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Vector3, type PerspectiveCamera } from "three";
import { channelFocus } from "../growth-engine/channelFocus";
import { FrameContext, MissionFrame, useMission } from "./frame";
import LaunchSite from "./LaunchSite";
import Planet from "./Planet";
import Stations from "./Stations";
import { CAMERA_KEYS, explodeCapsule, KARMAN, LABEL_IDS, labelOpacity, R0, STILL_SQUARE, type LabelId } from "./timeline";
import Trajectory from "./Trajectory";
import Vehicle from "./Vehicle";
import { cameraAt, cameraPose, cameraPoseInit, craftPosition, ghostPoint, polar } from "./world";

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
  onReady?: () => void;
};

/** Mission DVB-01: the pinned hero's 3D world. */
export default function Scene({ still, active, progress, labels, onReady }: Props) {
  return (
    <Canvas
      flat
      shadows="percentage"
      dpr={[1, 2]}
      frameloop={still ? "demand" : active ? "always" : "never"}
      camera={{ fov: 22, near: 0.05, far: 2000, position: [6.95, 3.31, 12.03] }}
      onCreated={() => onReady?.()}
    >
      <Mission still={still} progress={progress} labels={labels} />
    </Canvas>
  );
}

function Mission({ still, progress, labels }: Omit<Props, "active" | "onReady">) {
  const [frame] = useState(() => new MissionFrame());
  return (
    <FrameContext.Provider value={frame}>
      <FramePass still={still} progress={progress} />
      <CameraRig />
      {still && <FocusInvalidate />}

      {/* Soft window light from the upper left, a neutral fill, and the studio environment for the gloss. */}
      <hemisphereLight args={["#ffffff", "#e9ece9", 0.8]} />
      <directionalLight
        castShadow
        position={[-6, 10, 8]}
        intensity={1.3}
        shadow-mapSize={[1024, 1024]}
        shadow-radius={4}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 1, 30]} />
      </directionalLight>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.2} position={[-4, 5, 4]} scale={[8, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} position={[5, 3, -3]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.8} position={[0, 8, 0]} scale={4} target={[0, 0, 0]} />
      </Environment>

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
  useFrame((state) => {
    const p = still ? 1 : (progress.current?.shown ?? 0);
    frame.update(p, still ? 0 : state.clock.elapsedTime, still);
    // Shadows only matter on the pad; stop re-rendering the shadow map once it has faded.
    state.gl.shadowMap.autoUpdate = p < 0.27;
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
const ARRAY_LABELS: Partial<Record<LabelId, number>> = { a0: 0, a1: 1, a2: 2, a3: 3 };

/** Projects each label's anchor to the overlay and writes its transform and opacity (only when they change). */
function LabelWriter({ labels }: { labels: RefObject<Map<string, HTMLElement>> }) {
  const frame = useMission();
  const fixed = useMemo(
    () => ({
      karman: polar(32, KARMAN),
      spike: ghostPoint(0.5).add(new Vector3(0, 0.3, 0)),
      meco: craftPosition(0.355),
      orbit: polar(48, R0),
    }),
    [],
  );
  const scratch = useMemo(() => ({ v: new Vector3(), craftNdc: new Vector3(), cache: new Map<LabelId, string>() }), []);

  useFrame((state) => {
    const nodes = labels.current;
    if (!nodes) return;
    const { v, cache, craftNdc } = scratch;
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
        if (id === "payload") local(0.19, 0.26 + 0.34 * explodeCapsule(p), 0);
        else if (id === "devable") local(0.25, 0, 0);
        else if (id === "channels") v.copy(frame.tips[1]);
        else if (id in ARRAY_LABELS) v.copy(frame.tips[ARRAY_LABELS[id] ?? 0]);
        else v.copy(fixed[id as keyof typeof fixed]);
        v.project(state.camera);
        visible = v.z < 1 && v.z > -1;
        x = ((v.x + 1) / 2) * width;
        y = ((1 - v.y) / 2) * height;
        if (id in ARRAY_LABELS) {
          // Labels sit outboard of their tip, so they never run back across the craft.
          const cx = ((craftNdc.copy(frame.craft).project(state.camera).x + 1) / 2) * width;
          left = x < cx;
          x += left ? -10 : 10;
          y -= 10;
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
