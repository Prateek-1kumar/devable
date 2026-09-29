"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import type { PerspectiveCamera } from "three";
import { ignition, journey } from "./model";
import Callouts from "./Callouts";
import { createWorld, type World } from "./world";

const poseFrom = (world: World, s: RootState) =>
  world.pose({
    p: journey.forced ?? journey.progress,
    time: journey.time,
    loopT: journey.loopT,
    lit: ignition(journey.time, journey.igniteAt),
    camera: s.camera as PerspectiveCamera,
    width: s.size.width,
    height: s.size.height,
    dpr: s.viewport.dpr,
  });

// The DOM driver (HowWeWork) is the journey's only clock writer: time, latches, loop clocks and
// ignition all share its one time base. The scene just reads them each frame.
function Rig({ world, ready, onReady }: { world: World; ready: boolean; onReady: () => void }) {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => world.attach(scene, gl), [world, scene, gl]);
  // Link every program off the main thread (KHR_parallel_shader_compile) before the first draw: a sync
  // first render stalled ~0.7–2.5 s mid-scroll. The canvas stays on frameloop "never" until this resolves.
  useEffect(() => {
    if (ready) return;
    let live = true;
    const s = get();
    poseFrom(world, s); // the pose decides which parts and lights are visible, so compile what frame one draws
    gl.compileAsync(scene, s.camera)
      .catch(() => {})
      .then(() => live && onReady());
    return () => {
      live = false;
    };
  }, [world, scene, gl, get, ready, onReady]);
  // One warm-up frame while still off screen: uploads buffers and builds the shadow pass before the user arrives.
  useEffect(() => {
    if (ready) invalidate();
  }, [ready, invalidate]);
  useFrame((state) => poseFrom(world, state));
  return <primitive object={world.root} />;
}

const DPR_STEPS = [1.5, 1.25, 1] as const;

/** The lighthouse world: one canvas, one frame loop, the camera driven by the journey's progress. */
export default function Scene({ active }: { active: boolean }) {
  const [world] = useState(createWorld);
  const [ready, setReady] = useState(() => journey.dpr !== null); // dev shots (?hww*) keep the sync first render
  const [dprStep, setDprStep] = useState(0);
  const markReady = useCallback(() => setReady(true), []);
  useEffect(() => () => world.dispose(), [world]);
  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={journey.dpr ?? [1, DPR_STEPS[dprStep]]}
      gl={{ antialias: true }}
      frameloop={!ready ? "never" : active ? "always" : "demand"}
      camera={{ fov: 18, near: 0.5, far: 4000 }}
    >
      {/* Measures only while running ("demand" frames would read as a slow GPU). Steps down, never back up. */}
      {active && ready && journey.dpr === null && (
        <PerformanceMonitor onDecline={() => setDprStep((k) => Math.min(k + 1, DPR_STEPS.length - 1))} />
      )}
      <Rig world={world} ready={ready} onReady={markReady} />
      <Callouts />
    </Canvas>
  );
}
