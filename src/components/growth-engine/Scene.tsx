import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { CHANNELS } from "./channels";
import Destinations from "./Destinations";
import DevtoolTerminal from "./DevtoolTerminal";
import EngineCore from "./EngineCore";
import GrowthChart from "./GrowthChart";
import LightBridge from "./LightBridge";
import { CAMERA_FOV, CAMERA_POSITION, STACK_RIGHT, STACK_TOP, TARGET } from "./layout";
import { palette } from "./palette";
import SignalPath from "./SignalPath";
import StackLayer from "./StackLayer";
import { FocusContext, HoverContext, Story, StoryContext } from "./story";
import { useCursorTilt } from "./useCursorTilt";

type Props = {
  /** Render one settled frame, no motion or interaction (phones, reduced motion). */
  still: boolean;
  /** Pause the render loop while the hero is off screen. */
  active: boolean;
  /** Which channel layer the cursor is over, for the DOM hover card. */
  onHover?: (index: number | null) => void;
  /** The stack's right edge in page pixels, reported every frame, for pinning the hover card. */
  onAnchor?: (anchor: StackAnchor) => void;
  /** Layer highlighted from outside the scene, or null. */
  focus?: number | null;
};

export type StackAnchor = { x: number; top: number; bottom: number };

/** The 3D canvas: camera, studio light, shadows, and the engine itself. */
export default function Scene({ still, active, onHover, onAnchor, focus = null }: Props) {
  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={[1, 2]}
      frameloop={still ? "demand" : active ? "always" : "never"}
      camera={{ position: CAMERA_POSITION.toArray(), fov: CAMERA_FOV, near: 5, far: 80 }}
    >
      <CameraRig shift={still ? 0 : 0.08} />

      {/* Soft window light from the upper left; the fill is white from above and mint from
          below, so shaded faces keep their color instead of going grey. */}
      <hemisphereLight args={["#ffffff", "#b7dcc2", 0.7]} />
      <directionalLight
        castShadow
        position={[-5, 11, 6]}
        intensity={1.25}
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 1, 30]} />
      </directionalLight>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.2} position={[-4, 5, 4]} scale={[8, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} position={[5, 3, -3]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.8} position={[0, 8, 0]} scale={4} target={[0, 0, 0]} />
      </Environment>

      <FocusContext.Provider value={focus}>
        <Engine still={still} onHover={onHover} onAnchor={onAnchor} />
      </FocusContext.Provider>
      <ContactShadows position={[0, 0.001, 0]} scale={14} blur={3} far={2.5} opacity={0.22} resolution={512} color={palette().ink} />
    </Canvas>
  );
}

/**
 * Aims the camera and shifts the frame so the engine sits right of center,
 * leaving the left side of the canvas clear behind the headline.
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

function Engine({ still, onHover = () => {}, onAnchor }: Pick<Props, "still" | "onHover" | "onAnchor">) {
  const [story] = useState(() => new Story(still));
  const tilt = useCursorTilt({ enabled: !still });

  // Advance the story before any part reads it this frame (negative priority runs first).
  useFrame((state) => story.update(story.time(state.clock.elapsedTime)), -1);

  return (
    <StoryContext.Provider value={story}>
      <HoverContext.Provider value={onHover}>
        <group ref={tilt} position={PIVOT}>
          {onAnchor && <AnchorReporter onAnchor={onAnchor} />}
          <Breathing still={still}>
            <DevtoolTerminal />
            <SignalPath />
            <Destinations />
            <GrowthChart />
            <LightBridge />
            {CHANNELS.map((channel, i) => (
              <StackLayer key={channel.n} index={i}>
                {i === CHANNELS.length - 1 && <EngineCore />}
              </StackLayer>
            ))}
          </Breathing>
        </group>
      </HoverContext.Provider>
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

/** Projects the stack's right edge to page pixels each frame (follows tilt and resize). */
function AnchorReporter({ onAnchor }: { onAnchor: (anchor: StackAnchor) => void }) {
  const probe = useRef<Group>(null);
  const [world] = useState(() => new Vector3());
  useFrame(({ camera, gl }) => {
    if (!probe.current) return;
    const rect = gl.domElement.getBoundingClientRect();
    const toPage = (y: number) => {
      probe.current!.localToWorld(world.set(STACK_RIGHT.x, y, STACK_RIGHT.z)).project(camera);
      return { x: rect.left + ((world.x + 1) / 2) * rect.width, y: rect.top + ((1 - world.y) / 2) * rect.height };
    };
    const mid = toPage(STACK_TOP / 2);
    onAnchor({ x: mid.x, top: toPage(STACK_TOP).y, bottom: toPage(0).y });
  });
  return <group ref={probe} position={[0, -PIVOT[1], 0]} />;
}
