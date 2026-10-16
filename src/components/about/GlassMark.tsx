import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { BackSide, ExtrudeGeometry, Group, Shape } from "three";

// The Devable mark is a "D" of four stacked bars with a rounded right edge. Here each bar is a slab of
// glass; one D and its mirror image meet flat-side to flat-side and become a single symmetrical lens.
// Shape units: the D is 2 tall (y −1..1), flat edge at x = 0. As in the brand mark it's a rectangle W wide
// whose two right corners are rounded with a big radius RC, so the middle of the right side runs straight.
const BARS = 4;
const GAP = 0.12;
const BAR_H = (2 - GAP * (BARS - 1)) / BARS;
const W = 2;
const RC = 0.85;
const FILLET = 0.06; // small, so each bar end follows the D outline (crisp like the mark); must stay > BEVEL or the bevel pinches
const BEVEL = 0.05; // how far the pillowy bevel rolls in from the outline
const DEPTH = 0.14; // the flat core; the pillowy bevels add ~0.36 more

// Right edge of the D shrunk inward by `r`: still a rounded rectangle, just smaller.
const edgeX = (y: number, r: number) => {
  const rc = RC - r;
  const dy = Math.max(0, Math.abs(y) - (1 - r - rc));
  return W - r - rc + Math.sqrt(Math.max(0, rc * rc - dy * dy));
};

function barGeometry(i: number) {
  const top = 1 - i * (BAR_H + GAP);
  const bottom = top - BAR_H;
  // Each bar is (strip ∩ D) with every corner rounded by FILLET: shrink that convex region by FILLET, then
  // grow it back by sweeping a FILLET-radius arc round each vertex. Exact, evenly round corners everywhere.
  const r = FILLET;
  const b = bottom + r;
  const t = top - r;
  const inner: [number, number][] = [[r, b]];
  for (let k = 0; k <= 48; k++) {
    const y = b + ((t - b) * k) / 48;
    inner.push([edgeX(y, r), y]);
  }
  inner.push([r, t]);

  const pts: [number, number][] = [];
  const n = inner.length;
  for (let k = 0; k < n; k++) {
    const [px, py] = inner[(k + n - 1) % n];
    const [x, y] = inner[k];
    const [nx, ny] = inner[(k + 1) % n];
    // Outward normals of the edges either side (polygon is counter-clockwise).
    const a0 = Math.atan2(-(x - px), y - py);
    let a1 = Math.atan2(-(nx - x), ny - y);
    if (a1 < a0) a1 += Math.PI * 2;
    const steps = Math.max(1, Math.ceil((a1 - a0) / (Math.PI / 32)));
    for (let s = 0; s <= steps; s++) {
      const a = a0 + ((a1 - a0) * s) / steps;
      const p: [number, number] = [x + r * Math.cos(a), y + r * Math.sin(a)];
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-4) pts.push(p);
    }
  }
  const s = new Shape();
  s.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => s.lineTo(...p));
  s.closePath();
  // Soft, pillowy bevels: deep and wide, inset by their own size (bevelOffset) so the bar keeps the mark's
  // outline and gaps. All that curvature is what catches light the whole way round, like poured glass.
  const g = new ExtrudeGeometry(s, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
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
              {/* Solid, opaque satin with a clear lacquer on top: the softboxes glide over the pillowy
                  bevels like on poured resin, but nothing behind shows through. */}
              <meshPhysicalMaterial
                color="#e8e7e3"
                roughness={0.32}
                clearcoat={1}
                clearcoatRoughness={0.12}
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
