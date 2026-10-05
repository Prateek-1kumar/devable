import { useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Vector3, type Group, type OrthographicCamera as OrthoCam } from "three";
import { CHANNELS } from "./channels";
import Destinations from "./Destinations";
import DevtoolTerminal from "./DevtoolTerminal";
import EngineCore from "./EngineCore";
import Floor from "./Floor";
import GrowthScreen from "./GrowthScreen";
import { CAMERA_DISTANCE, CONTENT, STACK_RIGHT, STACK_TOP, VIEW_DIR } from "./layout";
import SignalPath from "./SignalPath";
import StackLayer from "./StackLayer";
import { FocusContext, HoverContext, Story, StoryContext } from "./story";

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

/**
 * The diagram: a fixed orthographic isometric view (no rotation, tilt or
 * float), drawn unlit with thin ink outlines, like a technical illustration.
 */
export default function Scene({ still, active, onHover, onAnchor, focus = null }: Props) {
  return (
    <Canvas flat dpr={[1, 1.5]} frameloop={still ? "demand" : active ? "always" : "never"} gl={{ antialias: true }}>
      <Camera reserve={still ? 0 : 0.2} />
      <FocusContext.Provider value={focus}>
        <Engine still={still} onHover={onHover} onAnchor={onAnchor} />
      </FocusContext.Provider>
    </Canvas>
  );
}

/**
 * Frames the whole diagram in the canvas at any size. `reserve` keeps that
 * share of the canvas's left side clear (behind the headline on desktop).
 */
function Camera({ reserve }: { reserve: number }) {
  const camera = useRef<OrthoCam>(null);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const cam = camera.current;
    if (!cam) return;
    const [u0, u1] = CONTENT.u;
    const [v0, v1] = CONTENT.v;
    const room = size.width * (1 - reserve);
    const zoom = Math.min(room / (u1 - u0), (size.height * 0.92) / (v1 - v0));
    // The point at the canvas centre, so the content's centre lands in the middle of the free area.
    const cu = (u0 + u1) / 2 - (size.width * reserve) / 2 / zoom;
    const cv = (v0 + v1) / 2;
    cam.left = cu - size.width / 2 / zoom;
    cam.right = cu + size.width / 2 / zoom;
    cam.top = cv + size.height / 2 / zoom;
    cam.bottom = cv - size.height / 2 / zoom;
    cam.position.copy(VIEW_DIR).multiplyScalar(CAMERA_DISTANCE);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [size, reserve]);
  return <OrthographicCamera ref={camera} makeDefault manual near={1} far={100} />;
}

function Engine({ still, onHover = () => {}, onAnchor }: Pick<Props, "still" | "onHover" | "onAnchor">) {
  const [story] = useState(() => new Story(still));
  return (
    <StoryContext.Provider value={story}>
      <HoverContext.Provider value={onHover}>
        {onAnchor && <AnchorReporter onAnchor={onAnchor} />}
        <Floor />
        <SignalPath />
        <Destinations />
        {CHANNELS.map((channel, i) => (
          <StackLayer key={channel.n} index={i} />
        ))}
        <EngineCore />
        <DevtoolTerminal />
        <GrowthScreen />
      </HoverContext.Provider>
    </StoryContext.Provider>
  );
}

/** Projects the stack's right edge to page pixels each frame (follows resize and scroll). */
function AnchorReporter({ onAnchor }: { onAnchor: (anchor: StackAnchor) => void }) {
  const probe = useRef<Group>(null);
  const [world] = useState(() => new Vector3());
  useFrame(({ camera, gl }) => {
    if (!probe.current) return;
    const rect = gl.domElement.getBoundingClientRect();
    const toPage = (y: number) => {
      world.set(STACK_RIGHT.x, y, STACK_RIGHT.z).project(camera);
      return { x: rect.left + ((world.x + 1) / 2) * rect.width, y: rect.top + ((1 - world.y) / 2) * rect.height };
    };
    const mid = toPage(STACK_TOP / 2);
    onAnchor({ x: mid.x, top: toPage(STACK_TOP).y, bottom: toPage(0).y });
  });
  return <group ref={probe} />;
}
