import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import type { Group } from "three";
import { CHANNELS } from "./channels";
import DevtoolTerminal from "./DevtoolTerminal";
import EngineCore from "./EngineCore";
import LeadStream from "./LeadStream";
import { CAMERA_FOV, CAMERA_POSITION, TARGET } from "./layout";
import { palette } from "./palette";
import PipelineGauge from "./PipelineGauge";
import SignalPath from "./SignalPath";
import StackLayer from "./StackLayer";
import { Story, StoryContext } from "./story";
import ChannelTokens from "./Tokens";
import { useCursorTilt } from "./useCursorTilt";

type Props = {
  /** Render one settled frame, no motion or interaction (phones, reduced motion). */
  still: boolean;
  /** Pause the render loop while the hero is off screen. */
  active: boolean;
};

/** The 3D canvas: camera, studio light, shadows, and the engine itself. */
export default function Scene({ still, active }: Props) {
  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={[1, 2]}
      frameloop={still ? "demand" : active ? "always" : "never"}
      camera={{ position: CAMERA_POSITION.toArray(), fov: CAMERA_FOV, near: 5, far: 80 }}
    >
      <CameraRig shift={still ? 0 : 0.02} />

      {/* Physical light units (×π): a bright, even studio fill so cream stays cream,
          plus one soft window light from the upper left for form and shadow. */}
      <ambientLight intensity={0.62 * Math.PI} />
      <directionalLight
        castShadow
        position={[-5, 11, 6]}
        intensity={0.34 * Math.PI}
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 1, 30]} />
      </directionalLight>
      <Environment resolution={128} frames={1}>
        {/* Reflections only: gives the teal metal and glazes something to catch. */}
        <Lightformer form="rect" intensity={0.8} position={[-4, 5, 4]} scale={[8, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.3} position={[5, 3, -3]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.5} position={[0, 8, 0]} scale={4} target={[0, 0, 0]} />
      </Environment>

      <Engine still={still} />
      <ContactShadows position={[0, 0.001, 0]} scale={14} blur={2.4} far={2.5} opacity={0.35} resolution={512} color={palette().ink} />
    </Canvas>
  );
}

/**
 * Aims the camera and shifts the frame so the engine sits right of center,
 * leaving the left side of the canvas for tokens drifting behind the headline.
 */
function CameraRig({ shift }: { shift: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    camera.lookAt(TARGET);
    camera.setViewOffset(size.width, size.height, -size.width * shift, 0, size.width, size.height);
    camera.updateProjectionMatrix();
    return () => camera.clearViewOffset();
  }, [camera, size, shift]);
  return null;
}

// The stack tilts around its middle.
const PIVOT: [number, number, number] = [0, 1.2, 0];

function Engine({ still }: { still: boolean }) {
  const [story] = useState(() => new Story(still));
  const tilt = useCursorTilt({ enabled: !still });

  // Advance the story before any part reads it this frame (negative priority runs first).
  useFrame((state) => story.update(story.time(state.clock.elapsedTime)), -1);

  return (
    <StoryContext.Provider value={story}>
      <group ref={tilt} position={PIVOT}>
        <Breathing still={still}>
          <DevtoolTerminal />
          <SignalPath />
          {CHANNELS.map((channel, i) => (
            <StackLayer key={channel.n} index={i}>
              {i === CHANNELS.length - 1 && <EngineCore />}
            </StackLayer>
          ))}
          <ChannelTokens />
          <LeadStream />
          <PipelineGauge />
        </Breathing>
      </group>
    </StoryContext.Provider>
  );
}

/** A very slow 1–2px float so the object never looks frozen. */
function Breathing({ still, children }: { still: boolean; children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current && !still) group.current.position.y = -PIVOT[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
  });
  return (
    <group ref={group} position={[0, -PIVOT[1], 0]}>
      {children}
    </group>
  );
}
