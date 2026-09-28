import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import type { Group, MeshStandardMaterial } from "three";
import { TERMINAL } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { INTRO, easeOutBack, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

const PROMPT = "$ your-devtool";
const TYPE_EVERY = 0.06; // seconds per character
const SCREEN_TILT = 0.5; // radians the display leans toward the viewer
const [W, H, D] = TERMINAL.size;

/** The `$ your-devtool` block: where the signal starts. Hover it to retype the prompt. */
export default function DevtoolTerminal() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const group = useRef<Group>(null);
  const clock = useRef(0);
  const typedFrom = useRef(INTRO.terminalAt + INTRO.terminalFor);
  const flickerUntil = useRef(0);
  const view = useRef({ chars: -1, cursor: false });

  const led = useRef<MeshStandardMaterial>(null);

  const drawScreen = useCallback(
    (ctx: CanvasRenderingContext2D, _w: number, h: number) => {
      const { chars, cursor } = view.current;
      const text = PROMPT.slice(0, Math.max(0, chars));
      const x = h * 0.28;
      ctx.font = `500 ${h * 0.26}px ${p.bodyFont}`;
      ctx.fillStyle = p.cream;
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, h / 2);
      if (cursor) {
        ctx.fillStyle = p.amber;
        ctx.fillRect(x + ctx.measureText(text).width + h * 0.04, h * 0.36, h * 0.1, h * 0.28);
      }
    },
    [p],
  );
  const screen = useCanvasTexture(1024, 448, drawScreen);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = story.time(state.clock.elapsedTime);
    clock.current = t;

    const arrive = story.terminalIn(t);
    g.visible = arrive > 0;
    g.position.y = (1 - easeOutBack(arrive)) * 1.8;
    g.scale.setScalar(0.9 + 0.1 * easeOutCubic(arrive));

    const chars = Math.min(PROMPT.length, Math.floor((t - typedFrom.current) / TYPE_EVERY));
    const cursor = story.still || Math.floor(t * 2) % 2 === 0;
    if (chars !== view.current.chars || cursor !== view.current.cursor) {
      view.current = { chars, cursor };
      screen.paint();
    }

    // Power light: steady, brighter as a signal leaves, flickers on hover.
    const sending = story.signal(t);
    const flicker = t < flickerUntil.current ? (Math.sin(t * 60) > 0 ? 1.4 : 0.2) : 0;
    if (led.current) led.current.emissiveIntensity = 0.4 + (sending >= 0 && sending < 0.2 ? 1 : 0) + flicker;
  });

  return (
    <group position={TERMINAL.position} rotation-y={TERMINAL.yaw}>
      <group
        ref={group}
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          typedFrom.current = clock.current;
          flickerUntil.current = clock.current + 0.5;
        }}
      >
        <RoundedBox args={[W, H, D]} radius={0.09} smoothness={4} position={[0, H / 2, 0]} material={m.porcelain} castShadow receiveShadow>
          <Outlines thickness={INK_PX} color={p.ink} />
        </RoundedBox>
        <RoundedBox args={[W + 0.03, 0.08, D + 0.03]} radius={0.035} smoothness={3} position={[0, 0.06, 0]} material={m.champagne} castShadow />

        {/* Display housing leans toward the viewer so the prompt reads clearly. */}
        <group position={[0, H + 0.04, -0.02]} rotation-x={SCREEN_TILT}>
          <RoundedBox args={[W - 0.16, 0.1, D - 0.3]} radius={0.04} smoothness={3} material={m.porcelain} castShadow>
            <Outlines thickness={INK_PX} color={p.ink} />
          </RoundedBox>
          {/* Champagne frame, then the glass inset in it. RoundedBox radius must stay under half the thinnest side, or the box swells over the screen. */}
          <RoundedBox args={[W - 0.26, 0.016, D - 0.4]} radius={0.007} smoothness={2} position={[0, 0.052, 0]} material={m.champagne} />
          <RoundedBox args={[W - 0.3, 0.02, D - 0.44]} radius={0.01} smoothness={2} position={[0, 0.055, 0]} material={m.glass} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.067, 0]}>
            <planeGeometry args={[W - 0.34, (W - 0.34) * (448 / 1024)]} />
            <meshBasicMaterial map={screen.texture} transparent toneMapped={false} />
          </mesh>
        </group>

        <mesh position={[W / 2 - 0.16, H + 0.01, D / 2 - 0.14]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshStandardMaterial ref={led} color={p.amber} emissive={p.amber} emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
