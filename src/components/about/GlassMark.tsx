import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { BackSide, ExtrudeGeometry, Group, Shape } from "three";

// The Devable mark is a "D" of four stacked bars with a rounded right edge. Here each bar is a slab of
// glass; one D and its mirror image meet flat-side to flat-side and become a single symmetrical lens.
// Shape units: the D is 2 tall (y −1..1), flat edge at x = 0, widest point at x = FLAT + BULGE.
const BARS = 4;
const GAP = 0.12;
const BAR_H = (2 - GAP * (BARS - 1)) / BARS;
const FLAT = 0.9;
const BULGE = 1.1;
const DEPTH = 0.14; // the flat core; the pillowy bevels add ~0.36 more

const edgeX = (y: number) => FLAT + BULGE * Math.sqrt(Math.max(0, 1 - y * y));

function barGeometry(i: number) {
  const top = 1 - i * (BAR_H + GAP);
  const bottom = top - BAR_H;
  // Where a bar's straight edge meets the curve the corner is acute, and a bevel there spikes; round
  // those two corners off with a short curve (R long) so the bevel flows round them.
  const R = 0.3;
  const arc = Array.from({ length: 49 }, (_, k) => bottom + (BAR_H * k) / 48).map((y) => [edgeX(y), y] as const);
  const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const first = arc.findIndex((pt) => dist(pt, arc[0]) >= R);
  const last = arc.findLastIndex((pt) => dist(pt, arc[arc.length - 1]) >= R);
  const [x0, y0] = arc[0];
  const [x1, y1] = arc[arc.length - 1];
  const s = new Shape();
  s.moveTo(0, bottom);
  s.lineTo(x0 - R, y0);
  s.quadraticCurveTo(x0, y0, arc[first][0], arc[first][1]);
  for (let k = first + 1; k <= last; k++) s.lineTo(arc[k][0], arc[k][1]);
  s.quadraticCurveTo(x1, y1, x1 - R, y1);
  s.lineTo(0, top);
  s.closePath();
  // Soft, pillowy bevels: deep and wide, inset by their own size (bevelOffset) so the bar keeps the mark's
  // outline and gaps. All that curvature is what catches light the whole way round, like poured glass.
  const g = new ExtrudeGeometry(s, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.1,
    bevelOffset: -0.1,
    bevelSegments: 14,
    curveSegments: 32,
  });
  g.translate(0, 0, -DEPTH / 2);
  return g;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Two timelines from GlassStory. `approach` runs from page load (0) to the lock (1): the halves, parked
// small at the edges of the band's visible strip, grow and glide to the center. `progress` is the pinned
// stage: after the lock they hold, then split back out 0.56→0.76 to frame the statement.
const STAGGER = 0.06;
const SPLIT = 0.56;
const SPLIT_LEN = 0.2;
const TURN = 0.75; // how far each half is turned inward while apart (radians)

type Progress = RefObject<number>;

const BG = "#1a1918"; // matches the section behind the canvas

type Timelines = { progress: Progress; approach: Progress; reveal: Progress };
type HalfProps = Timelines & { side: 1 | -1; geometries: ExtrudeGeometry[] };

function Half({ side, progress, approach, reveal, geometries }: HalfProps) {
  const outer = useRef<Group>(null);
  const bars = useRef<(Group | null)[]>([]);
  const viewport = useThree((s) => s.viewport);

  useFrame(() => {
    const p = progress.current;
    const fit = Math.min(1, viewport.width / 5.6);
    const split = ease(clamp01((p - SPLIT) / SPLIT_LEN));

    // Each bar has its own arrival, a touch behind the one above, so the whole D slides in as a clean
    // cascade, every bar staying in the mark's plane; apart, they sit aligned as one D.
    const q = approach.current;
    const arrivals = geometries.map((_, i) => ease(clamp01((q - i * STAGGER) / (1 - (BARS - 1) * STAGGER))));
    const arrived = arrivals.reduce((a, b) => a + b, 0) / BARS;
    arrivals.forEach((a, i) => bars.current[i]?.position.set((arrived - a) * 1.4, 0, 0));

    // Apart = before arriving or after splitting: parked at the screen edge, fully in view, turned inward.
    const apart = Math.max(1 - arrived, split);
    // Size: small while parked at the start, growing to full as they lock, settling at 0.75 to frame the text.
    const scale = fit * (split > 0 ? 1 - 0.25 * split : 0.45 + 0.55 * arrived);
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

  return (
    <group ref={outer}>
      <group scale={[side, 1, 1]}>
        {geometries.map((g, i) => (
          <group key={i} ref={(el) => void (bars.current[i] = el)}>
            <mesh geometry={g}>
              {/* Satin frosted glass, in keeping with the site's matte, neutral palette: mostly transmissive but
                  milky (rough), a little body colour so it reads on charcoal, and only soft sheen on the
                  curves. No colour fringing, no hard glints. */}
              <meshPhysicalMaterial
                color="#f2f2f0"
                transmission={0.55}
                roughness={0.38}
                thickness={1.2}
                ior={1.42}
                attenuationColor="#d8d7d3"
                attenuationDistance={4}
                specularIntensity={0.45}
                envMapIntensity={1.5}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Scene(timelines: Timelines) {
  const geometries = useMemo(() => Array.from({ length: BARS }, (_, i) => barGeometry(i)), []);
  return (
    <>
      <color attach="background" args={[BG]} />
      <Half side={1} {...timelines} geometries={geometries} />
      <Half side={-1} {...timelines} geometries={geometries} />
      <Studio />
    </>
  );
}

// A soft, neutral studio baked into a live env map (no network fetch): a charcoal void a shade above
// the page and only broad softboxes, so the curves pick up gentle gradients rather than sharp lines. Two
// wide panels drift slowly across, a quiet sheen moving over the glass while the page is at rest.
function Studio() {
  const sweep = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (sweep.current) sweep.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.6;
  });
  return (
    <Environment resolution={256} frames={Infinity}>
      <mesh scale={40}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#2e2d2c" side={BackSide} toneMapped={false} />
      </mesh>
      <Lightformer form="rect" color="#ffffff" intensity={1.4} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 7, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={0.7} position={[-7, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 6, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={0.7} position={[7, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 6, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={0.45} position={[0, 2, 8]} scale={[12, 4, 1]} />
      <group ref={sweep}>
        <Lightformer form="rect" color="#ffffff" intensity={0.9} position={[0, 0.5, -8]} scale={[5, 9, 1]} />
      </group>
    </Environment>
  );
}

export default function GlassMark(timelines: Timelines) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 9], fov: 32 }} gl={{ antialias: true }}>
      <Scene {...timelines} />
    </Canvas>
  );
}
