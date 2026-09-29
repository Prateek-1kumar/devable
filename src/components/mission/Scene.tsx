import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Color, FogExp2, NeutralToneMapping, Vector3, type DirectionalLight, type Group, type HemisphereLight, type PerspectiveCamera } from "three";
import { channelFocus } from "../growth-engine/channelFocus";
import DeltaV from "./DeltaV";
import { FrameContext, MissionFrame, useMission } from "./frame";
import LaunchSite from "./LaunchSite";
import Planet from "./Planet";
import Stations from "./Stations";
import {
  aim,
  CAMERA_KEYS,
  CUT_P,
  eio,
  LABEL_IDS,
  labelOpacity,
  lerp,
  R,
  R0,
  seg,
  skyHorizonLinear,
  STILL_SQUARE,
  type LabelId,
} from "./timeline";
import Trajectory from "./Trajectory";
import Vehicle from "./Vehicle";
import { C, cameraAt, cameraPose, cameraPoseInit, craftPosition, ghostPoint, polar, sunDir } from "./world";

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
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1 }}
      frameloop={still ? "demand" : active ? "always" : "never"}
      camera={{ fov: 22, near: 0.05, far: 2000, position: [6.95, 3.31, 12.03] }}
      onCreated={(state) => {
        // Dev-only perf hook for the screenshot runs: draw calls and triangles of the last frame.
        if (process.env.NODE_ENV !== "production") (window as unknown as { __missionGl?: unknown }).__missionGl = state.gl;
        onReady?.();
      }}
    >
      <Mission still={still} progress={progress} labels={labels} padShadows={padShadows} />
    </Canvas>
  );
}

function Mission({ still, progress, labels, padShadows }: Omit<Props, "active" | "onReady">) {
  const [frame] = useState(() => new MissionFrame());
  const padSet = useRef<Group>(null);
  const orbitSet = useRef<Group>(null);
  useFrame(() => {
    // The two scale spaces are never on screen together: the cut at CUT_P swaps them.
    const pad = frame.p < CUT_P;
    if (padSet.current) padSet.current.visible = pad;
    if (orbitSet.current) orbitSet.current.visible = !pad;
  }, -2);
  return (
    <FrameContext.Provider value={frame}>
      <FramePass still={still} progress={progress} />
      <CameraRig />
      {still && <FocusInvalidate />}
      <Lighting />

      <group ref={padSet} name="padSet">
        {/* Mounted once and gated by props: drei never disposes its render targets, so remounting leaked them.
            frames 0 stops its per-frame shadow pass once the pad is off screen. */}
        {!still && (
          <group visible={padShadows}>
            <ContactShadows position={[0, 0.003, 0]} scale={6} blur={2.5} far={3.5} opacity={0.35} resolution={1024} color="#1a1c1f" frames={padShadows ? Infinity : 0} />
          </group>
        )}
        <LaunchSite />
      </group>
      <group ref={orbitSet} name="orbitSet" visible={false}>
        <Planet still={still} />
        <Trajectory />
        <Stations />
        <DeltaV />
      </group>
      <Vehicle />
      {labels && <LabelWriter labels={labels} />}
      {labels && <StationChipWriter labels={labels} />}
    </FrameContext.Provider>
  );
}

const SUN_PAD_COLOR = new Color("#fff4e6");
const SUN_ORBIT_COLOR = new Color("#fffaf2");

/**
 * One hard sun (its shadow frustum follows the subject), a sky/ground fill on the pad, earthshine on the
 * craft in orbit, and a two-panel environment for the gloss. Lights stay mounted; they switch off by
 * intensity (never `visible`, which recompiles every material).
 */
function Lighting() {
  const frame = useMission();
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const earthshine = useRef<DirectionalLight>(null);
  const scratch = useRef({ dir: new Vector3(), aim: new Vector3(), axis: new Vector3(), fog: new FogExp2("#e6eef6", 0.009) });

  useFrame((state) => {
    const { p, scale } = frame;
    const { dir, aim: at, axis, fog } = scratch.current;
    const scene = state.scene;
    if (scene.fog !== fog) scene.fog = fog;
    const orbit = eio(seg(p, 0.25, 0.29));
    // The subject: the vehicle's visual centre.
    axis.set(0, 1, 0).applyQuaternion(frame.quat);
    at.copy(frame.craft).addScaledVector(axis, -aim(p) * scale);

    const s = sun.current;
    if (s) {
      sunDir(p, dir);
      s.target.position.copy(at);
      s.target.updateMatrixWorld();
      s.position.copy(at).addScaledVector(dir, 20);
      s.intensity = lerp(2.6, 3.2, orbit);
      s.color.lerpColors(SUN_PAD_COLOR, SUN_ORBIT_COLOR, orbit);
      const half = p < CUT_P ? 6 : 0.8 * scale * 2;
      const cam = s.shadow.camera;
      if (cam.right !== half) {
        cam.left = cam.bottom = -half;
        cam.right = cam.top = half;
        cam.updateProjectionMatrix();
      }
      s.shadow.normalBias = 0.02 * Math.min(1, scale);
    }
    if (hemi.current) hemi.current.intensity = 0.6 * (1 - orbit);
    const e = earthshine.current;
    if (e) {
      e.target.position.copy(frame.craft);
      e.target.updateMatrixWorld();
      e.position.subVectors(C, frame.craft).normalize().multiplyScalar(20).add(frame.craft);
      e.intensity = p < CUT_P ? 0 : 0.35 * orbit;
    }
    // A scene property, so changing it does not recompile.
    scene.environmentIntensity = lerp(0.6, 0.12, orbit);
    // Haze on the pad in the CSS horizon colour; none in space (density 0 rather than null: no recompile at the cut).
    const [r, g, b] = skyHorizonLinear(p);
    fog.color.setRGB(r, g, b);
    fog.density = p < CUT_P ? 0.009 : 0;
  });

  return (
    <>
      <directionalLight ref={sun} castShadow intensity={2.6} shadow-mapSize={[2048, 2048]} shadow-radius={4} shadow-bias={-0.0005} shadow-normalBias={0.02}>
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.5, 40]} />
      </directionalLight>
      <hemisphereLight ref={hemi} args={["#dfe9f5", "#b9b4aa", 0.6]} />
      <directionalLight ref={earthshine} color="#8fb0d8" intensity={0} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="ring" color="#e8f0f8" intensity={1.2} position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={10} />
        <Lightformer form="rect" color="#cfc8bc" intensity={0.5} position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>
    </>
  );
}

/** Advances the shared frame before any part reads it. */
function FramePass({ still, progress }: { still: boolean; progress: RefObject<Progress> }) {
  const frame = useMission();
  useFrame((state) => {
    const p = still ? 1 : (progress.current?.shown ?? 0);
    frame.update(p, still ? 0 : state.clock.elapsedTime, still);
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
    cam.up.copy(pose.up);
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
      karman: polar(18, R + ((R0 - R) * 100) / 412),
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
        if (id === "payload") local(0.1, 0.06, 0.08); // the satellite in the open fairing
        else if (id === "devable") local(0.15, -1.9, 0.03); // the launcher's first stage
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

/** Keeps chips 24 px inside the panel; the leader stays on its pin. */
const CHIP_INSET = 24;
/** Chips closer than this (css px) stack: the later one rises a row higher on a longer leader. */
const CHIP_GAP = 8;
const CHIP_ROW = 26;

/**
 * Station chips: one per station that faces the camera and is lit or in contact. Chips fly right of their
 * leaders, so they are placed right to left: a chip that would collide rises a row, and its leader runs up
 * left of every chip already placed.
 */
function StationChipWriter({ labels }: { labels: RefObject<Map<string, HTMLElement>> }) {
  const frame = useMission();
  const scratch = useMemo(() => ({ v: new Vector3(), cache: new Map<number, string>(), widths: new Map<number, number>() }), []);

  useFrame((state) => {
    const nodes = labels.current;
    if (!nodes) return;
    const { v, cache, widths } = scratch;
    const { width, height } = state.size;
    const shown: { k: number; x: number; x0: number; y: number; w: number; o: number; row: number }[] = [];
    frame.stations.forEach((st, k) => {
      const el = nodes.get(`st${k}`);
      if (!el || !st.front || !(st.lit || st.live > 0.05)) return;
      v.copy(st.pos).project(state.camera);
      if (v.z >= 1) return;
      let w = widths.get(k);
      if (!w) {
        w = (el.lastElementChild as HTMLElement | null)?.offsetWidth ?? 0; // fixed text: measured once
        if (w) widths.set(k, w);
      }
      const x = ((v.x + 1) / 2) * width;
      w = w || 120;
      shown.push({ k, x, x0: Math.min(x, width - CHIP_INSET - w), y: ((1 - v.y) / 2) * height, w, o: st.lit ? 1 : 0.45, row: 0 });
    });
    shown.sort((a, b) => b.x - a.x);
    shown.forEach((c, i) => {
      const clash = (row: number) =>
        shown.slice(0, i).some((d) => c.x0 < d.x0 + d.w + CHIP_GAP && d.x0 < c.x0 + c.w + CHIP_GAP && Math.abs(c.y - row * CHIP_ROW - (d.y - d.row * CHIP_ROW)) < CHIP_ROW);
      while (clash(c.row)) c.row++;
    });
    for (let k = 0; k < frame.stations.length; k++) {
      const el = nodes.get(`st${k}`);
      if (!el) continue;
      const c = shown.find((s) => s.k === k);
      const dx = c ? c.x0 - c.x : 0;
      const key = c ? `${c.x.toFixed(1)}|${c.y.toFixed(1)}|${c.o}|${c.row}|${dx.toFixed(1)}` : "hidden";
      if (cache.get(k) === key) continue;
      cache.set(k, key);
      if (!c) {
        el.style.setProperty("visibility", "hidden");
        el.style.setProperty("opacity", "0");
        continue;
      }
      el.style.setProperty("visibility", "visible");
      el.style.setProperty("opacity", String(c.o));
      el.style.setProperty("transform", `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`);
      el.style.setProperty("--rise", `${28 + c.row * CHIP_ROW}px`);
      el.style.setProperty("--dx", `${dx.toFixed(1)}px`);
    }
  }, -1);
  return null;
}
