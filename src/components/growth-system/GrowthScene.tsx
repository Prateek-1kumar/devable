import { useLayoutEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrthographicCamera } from "@react-three/drei";
import { NeutralToneMapping, type OrthographicCamera as OrthoCam } from "three";
import { DEVICE, ELEVATION, ZOOM } from "./core-view";
import Device, { Studio } from "./Device";
import { CORE_Y, CX, H, W } from "./layout";
import Pipes from "./Pipes";

// The 3D layer of the desktop stage: one transparent canvas behind the DOM
// cards, holding the Devable engine and the pipes that feed it. The camera is
// fixed and orthographic, framed so world units map to stage pixels exactly
// (the device's centre lands on CX, CORE_Y), so pipes meet the cards' edges.
// Loaded client-side only (see SceneCanvas).

/** Fixed orthographic view, framed to the stage. */
function Camera() {
  const camera = useRef<OrthoCam>(null);
  useLayoutEffect(() => {
    const cam = camera.current;
    if (!cam) return;
    const d = 40;
    cam.position.set(Math.SQRT1_2 * Math.cos(ELEVATION) * d, Math.sin(ELEVATION) * d, Math.SQRT1_2 * Math.cos(ELEVATION) * d);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, []);
  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      manual
      left={-CX / ZOOM}
      right={(W - CX) / ZOOM}
      top={CORE_Y / ZOOM}
      bottom={-(H - CORE_Y) / ZOOM}
      near={0.1}
      far={120}
    />
  );
}

export default function GrowthScene({ still, active }: { still: boolean; active: boolean }) {
  const { base } = DEVICE;
  return (
    <Canvas dpr={[1, 1.75]} frameloop={still ? "demand" : active ? "always" : "never"} gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping }}>
      <Camera />
      <ambientLight intensity={0.8} />
      <directionalLight position={[-3, 7, 4]} intensity={1.4} />
      <directionalLight position={[5, 3, -2]} intensity={0.4} />
      {/* Fill from the camera's side, so the faces turned to us read as metal, not shadow. */}
      <directionalLight position={[6, 3, 6]} intensity={0.7} />
      <Studio />
      <Pipes still={still} />
      <Device still={still} />
      <ContactShadows position-y={base.top - base.h - 0.08} scale={5.5} blur={2.4} far={1.4} opacity={0.32} resolution={512} color="#172c21" frames={1} />
    </Canvas>
  );
}
