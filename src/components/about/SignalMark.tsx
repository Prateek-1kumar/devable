import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, Group, ShaderMaterial } from "three";
import { palette } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";

// The Devable mark is a "D" of four stacked bars with a rounded right edge. Here each D is a volume of mono
// glyphs, and one D and its mirror image meet flat-side to flat-side to become a single symmetrical mark.
// Dormant → noise → signal: parked at the edge, each half is a quiet lattice of dim dots, like an LED panel
// switched off; as it glides in, bar by bar, the dots wake into scrambling glyphs that lift out of the
// plane, then settle back and ░ → ▒ → ▓ → █ into solid cells, all of them resolved by the time the halves
// lock. Front slab in paper, the slabs behind grading to deep green,
// so the halves read as 3D extrusions as they turn. Everything per glyph runs on the GPU.

// Shape units: the D is 2 tall (y −1..1), flat edge at x = 0, a rectangle W wide whose two right corners
// are rounded with a big radius RC, so the middle of the right side runs straight.
const BARS = 4;
const GAP = 0.12;
const BAR_H = (2 - GAP * (BARS - 1)) / BARS;
const W = 2;
const RC = 0.85;
const LAYERS = 5; // glyph slabs through the depth

// ── The glyphs (one 8×8 atlas) ───────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]#$%&*+=:;~^";
const GRID = 8;
const ATLAS = 512;
const CELL = ATLAS / GRID;
const INSET = 6; // px of the 64px cell left clear, so solid cells read as a grid of squares
const SHADE = CHARS.length; // ░ ▒ ▓ follow the characters, then █
const SOLID = SHADE + 3;
const DOT = SOLID + 1; // the dormant cell
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Seeded, so the lift is the same on every load.
function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Right edge of the D at height y.
const edgeX = (y: number) => {
  const dy = Math.max(0, Math.abs(y) - (1 - RC));
  return W - RC + Math.sqrt(Math.max(0, RC * RC - dy * dy));
};

function markData(rows: number) {
  const rand = prng(3);
  const pitch = BAR_H / rows;
  const target: number[] = [];
  const lift: number[] = [];
  const seed: number[] = [];
  const layer: number[] = [];
  // Back slab first, so glyph edges blend over what's behind them when seen from the front.
  for (let l = 0; l < LAYERS; l++) {
    const z = (l - (LAYERS - 1) / 2) * pitch;
    for (let b = 0; b < BARS; b++) {
      const top = 1 - b * (BAR_H + GAP);
      for (let r = 0; r < rows; r++) {
        const y = top - (r + 0.5) * pitch;
        for (let x = pitch / 2; x < edgeX(y); x += pitch) {
          target.push(x, y, z);
          // How far the cell lifts out mid-flight: a little outward (away from where the halves meet),
          // up or down, and mostly through depth.
          lift.push(rand() * 0.25, (rand() - 0.5) * 0.16, (rand() - 0.5) * 1.2);
          seed.push(rand());
          layer.push(l / (LAYERS - 1));
        }
      }
    }
  }
  return {
    pitch,
    target: new Float32Array(target),
    lift: new Float32Array(lift),
    seed: new Float32Array(seed),
    layer: new Float32Array(layer),
  };
}

function drawAtlas(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${CELL * 0.6}px ${palette().monoFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const at = (i: number) => [(i % GRID) * CELL, Math.floor(i / GRID) * CELL];
  [...CHARS].forEach((ch, i) => {
    const [x, y] = at(i);
    ctx.fillText(ch, x + CELL / 2, y + CELL * 0.54);
  });
  // ░ ▒ ▓ as ordered 4×4 dithers inside the square the solid cell fills.
  const sub = (CELL - 2 * INSET) / 4;
  for (let k = 1; k <= 3; k++) {
    const [x, y] = at(SHADE + k - 1);
    BAYER.forEach((v, j) => {
      if (v < k * 4) ctx.fillRect(x + INSET + (j % 4) * sub + 1, y + INSET + Math.floor(j / 4) * sub + 1, sub - 2, sub - 2);
    });
  }
  const [x, y] = at(SOLID);
  ctx.beginPath();
  ctx.roundRect(x + INSET, y + INSET, CELL - 2 * INSET, CELL - 2 * INSET, 6);
  ctx.fill();
  const [dx, dy] = at(DOT);
  ctx.beginPath();
  ctx.arc(dx + CELL / 2, dy + CELL / 2, CELL * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

const VERTEX = /* glsl */ `
  uniform float uTime, uApproach, uPx, uPitch, uMotion;
  uniform vec3 uPaper, uGreen, uDeep;
  attribute vec3 aLift;
  attribute float aSeed, aLayer;
  varying vec3 vColor;
  varying float vGlyph, vAlpha;
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    // Each glyph's own arrival: bars cascade top to bottom with some scatter, every one settled by the lock.
    // Reduced motion: already resolved.
    float bar = floor((1.0 - position.y) / ${BAR_H + GAP});
    float q = max(uApproach, 1.0 - uMotion);
    float e = 1.0 - pow(1.0 - clamp((q - 0.08 * bar - 0.3 * aSeed) / 0.45, 0.0, 1.0), 3.0);
    vec4 mv = modelViewMatrix * vec4(position + aLift * sin(3.14159 * e), 1.0);
    gl_Position = projectionMatrix * mv;

    float noise = floor(hash(aSeed * 91.7 + floor(uTime * uMotion * 14.0 + aSeed * 50.0)) * ${CHARS.length}.0);
    vGlyph = e < 0.12 ? ${DOT}.0 : e < 0.82 ? noise : e < 0.9 ? ${SHADE}.0 : e < 0.95 ? ${SHADE + 1}.0 : e < 0.985 ? ${SHADE + 2}.0 : ${SOLID}.0;
    // Dormant dots in the face's own colors, dimmer through the depth; awake glyphs in green.
    vColor = mix(mix(uDeep, uPaper, pow(aLayer, 1.6)), uGreen, step(0.12, e) * (1.0 - smoothstep(0.82, 1.0, e)));
    vAlpha = e < 0.12 ? 0.25 + 0.35 * aLayer : 0.6 + 0.4 * e;
    gl_PointSize = max(1.0, uPitch * length(modelMatrix[0].xyz) * uPx * projectionMatrix[1][1] / -mv.z);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec3 vColor;
  varying float vGlyph, vAlpha;

  void main() {
    float g = floor(vGlyph + 0.5);
    vec2 cell = vec2(mod(g, ${GRID}.0), floor(g / ${GRID}.0));
    float a = texture2D(uAtlas, vec2(cell.x + gl_PointCoord.x, ${GRID}.0 - cell.y - gl_PointCoord.y) / ${GRID}.0).a * vAlpha;
    if (a < 0.04) discard;
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }
`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Two timelines from SignalStory. `approach` runs from page load (0) to the lock (1): the halves, parked
// small at the edges of the band's visible strip, grow and glide to the center. `progress` is the pinned
// stage: after the lock they hold, then split back out 0.56→0.76 to frame the statement.
const STAGGER = 0.06;
const SPLIT = 0.56;
const SPLIT_LEN = 0.2;
const TURN = 0.75; // how far each half is turned inward while apart (radians)

type Progress = RefObject<number>;

type Timelines = { progress: Progress; approach: Progress; reveal: Progress };
type Data = ReturnType<typeof markData>;
type HalfProps = Timelines & { side: 1 | -1; data: Data; uniforms: Record<string, { value: unknown }> };

function Half({ side, progress, approach, reveal, data, uniforms }: HalfProps) {
  const outer = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);

  useFrame(({ clock, size, viewport }) => {
    const p = progress.current;
    const q = approach.current;
    // Both halves share one uniform set; each writes the same values through its own material.
    const u = material.current!.uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uApproach.value = q;
    u.uPx.value = size.height * viewport.dpr * 0.5;
    u.uPitch.value = data.pitch;

    const fit = Math.min(1, viewport.width / 5.6);
    const split = ease(clamp01((p - SPLIT) / SPLIT_LEN));
    // The halves move as the bars arrive, each a touch behind the one above (the glyphs cascade the same way).
    const arrivals = Array.from({ length: BARS }, (_, i) => ease(clamp01((q - i * STAGGER) / (1 - (BARS - 1) * STAGGER))));
    const arrived = arrivals.reduce((a, b) => a + b, 0) / BARS;

    // Apart = before arriving or after splitting: parked at the screen edge, fully in view, turned inward.
    const apart = Math.max(1 - arrived, split);
    // Size: a little smaller while parked (big enough for the dot lattice to read), growing to full as they
    // lock, settling at 0.75 to frame the text.
    const scale = fit * (split > 0 ? 1 - 0.25 * split : 0.6 + 0.4 * arrived);
    const edge = Math.max(viewport.width / 2 - 0.35 - 1.5 * scale, 0.4);

    const o = outer.current!;
    o.position.x = side * (0.03 + apart * edge);
    // Vertically: parked in the middle of the band's visible strip at load, easing to the stage's center
    // by the lock. The band rises the whole time, so on screen the halves only ever travel up and in.
    o.position.y = (1 - arrived) * viewport.height * (0.5 - reveal.current / 2);
    o.rotation.y = side * apart * TURN;
    o.rotation.x = -0.08;
    o.scale.setScalar(scale);
  });

  // Mirroring the group mirrors where the glyphs sit, not the glyphs: points always face the camera.
  return (
    <group ref={outer}>
      <points scale={[side, 1, 1]} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.target, 3]} />
          <bufferAttribute attach="attributes-aLift" args={[data.lift, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
          <bufferAttribute attach="attributes-aLayer" args={[data.layer, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={material} args={[{ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true }]} />
      </points>
    </group>
  );
}

function Scene({ still, ...timelines }: Timelines & { still: boolean }) {
  const { texture } = useCanvasTexture(ATLAS, ATLAS, drawAtlas);
  // Fewer, larger cells on narrow screens so glyphs stay legible.
  const wide = useThree((s) => s.size.width >= 1024);
  const data = useMemo(() => markData(wide ? 6 : 4), [wide]);
  const uniforms = useMemo(() => {
    const p = palette();
    return {
      uAtlas: { value: texture },
      uTime: { value: 0 },
      uApproach: { value: 0 },
      uPx: { value: 1 },
      uPitch: { value: 0.1 },
      uMotion: { value: still ? 0 : 1 },
      uPaper: { value: new Color(p.paper) },
      uGreen: { value: new Color(p.primary) },
      uDeep: { value: new Color(p.primary).lerp(new Color(p.ink), 0.6) },
    };
  }, [texture, still]);
  return (
    <>
      <Half key={`r${data.pitch}`} side={1} data={data} uniforms={uniforms} {...timelines} />
      <Half key={`l${data.pitch}`} side={-1} data={data} uniforms={uniforms} {...timelines} />
    </>
  );
}

export default function SignalMark({ active, ...timelines }: Timelines & { active: boolean }) {
  // Reduced motion keeps the scroll-driven moves (they follow the reader) but drops the scramble.
  const still = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 9], fov: 32 }}
      gl={{ antialias: true }}
      frameloop={active ? "always" : "never"}
    >
      <Scene still={still} {...timelines} />
    </Canvas>
  );
}
