import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Vector3, type Fog, type PerspectiveCamera } from "three";
import Masts from "./Masts";
import Monolith from "./Monolith";
import Runners from "./Runners";
import Stands from "./Stands";
import { anchors, onChange, store } from "./store";
import { batonAt, cameraAt, newPose, posterPose } from "./timeline";
import TrackModel from "./TrackModel";
import { monolithToWorld } from "./track";

type Props = {
  /** One composed still frame at p = 1 (phones, reduced motion). */
  still: boolean;
  /** False while the hero is off screen: no frames at all. */
  active: boolean;
  /** Called after the first frame has rendered, to fade the canvas in. */
  onReady: () => void;
};

/**
 * "The Long Race": an architectural model of a stadium on the white page.
 * Renders only when the scroll store changes (frameloop "demand").
 */
export default function RaceScene({ still, active, onReady }: Props) {
  return (
    <Canvas
      flat
      shadows="percentage"
      dpr={still ? [1, 1.5] : [1, 2]}
      frameloop={still || active ? "demand" : "never"}
      camera={{ fov: 22, near: 0.1, far: 100, position: [-7, 4.2, 14.7] }}
      style={{ pointerEvents: "none" }}
    >
      <Wiring onReady={onReady} />
      <Rig still={still} />

      {/* Soft studio fill, plus one low raking key from the left for stepped shadows. */}
      <hemisphereLight args={["#ffffff", "#eceef2", 0.75]} />
      <directionalLight
        castShadow
        position={[-10, 8, -1]}
        intensity={1.3}
        shadow-mapSize={[2048, 2048]}
        shadow-radius={5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 1, 45]} />
      </directionalLight>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.2} position={[-4, 5, 4]} scale={[8, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} position={[5, 3, -3]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.8} position={[0, 8, 0]} scale={4} target={[0, 0, 0]} />
      </Environment>

      <TrackModel />
      <Stands />
      <Masts />
      <Runners />
      <Monolith />
      {!still && <Callouts />}
    </Canvas>
  );
}

/** Re-renders on every store change, and reports the first frame. */
function Wiring({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const ready = useRef(false);
  useEffect(() => onChange(() => invalidate()), [invalidate]);
  useFrame(() => {
    if (ready.current) return;
    ready.current = true;
    requestAnimationFrame(onReady); // after this frame reaches the screen
  });
  return null;
}

/** The camera operator: orbit keys at the damped camera progress, plus fog per key. */
function Rig({ still }: { still: boolean }) {
  const fog = useRef<Fog>(null);
  const pose = useRef(newPose());
  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width: w, height: h } = state.size;
    const aspect = w / Math.max(1, h);
    // Still frame: the phone canvas is 4:5 (portrait), the reduced-motion desktop one about square.
    const q = still ? posterPose(aspect < 0.9, aspect, pose.current) : cameraAt(store.cam, aspect, pose.current);
    camera.position.set(q.px, q.py, q.pz);
    camera.lookAt(q.tx, q.ty, q.tz);
    camera.fov = q.fov;
    camera.near = q.near;
    camera.far = q.far;
    camera.setViewOffset(w, h, -w * q.shift, 0, w, h);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(); // the callouts project with it before the render does
    if (fog.current) {
      fog.current.near = q.fogNear;
      fog.current.far = q.fogFar;
    }
  }, -2);
  return <fog ref={fog} attach="fog" args={["#ffffff", 20, 40]} />;
}

/** Pins the DOM callouts (YOUR TOOL, DEVABLE) to their 3D points, in canvas pixels. */
function Callouts() {
  const scratch = useRef({ v: new Vector3(), at: [0, 0, 0], p: { x: 0, y: 0, z: 0 } });
  useFrame(({ camera, size }) => {
    const { v, at, p } = scratch.current;
    const put = (name: string) => {
      const el = anchors.get(name);
      if (!el) return;
      v.project(camera);
      const align = el.dataset.align === "left" ? "translate(-100%, -50%)" : "translate(-50%, -100%)";
      el.style.transform = `translate3d(${(((v.x + 1) / 2) * size.width).toFixed(1)}px, ${(((1 - v.y) / 2) * size.height).toFixed(1)}px, 0) ${align}`;
    };
    if (batonAt(store.p, at)) {
      v.set(at[0], at[1], at[2]); // the label reaches in from the left, clear of the navbar
      put("tool");
    }
    monolithToWorld(0.62, 2.52, 0, p); // the slab's top-right corner, clear of the baton
    v.set(p.x, p.y, p.z);
    put("devable");
  });
  return null;
}
