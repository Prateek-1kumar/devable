import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import { ExtrudeGeometry, Group, Shape, type Texture } from "three";

// The Devable mark is a "D" of four stacked bars with a rounded right edge. Here each bar is a slab of
// glass; one D and its mirror image meet flat-side to flat-side and become a single symmetrical lens.
// Shape units: the D is 2 tall (y −1..1), flat edge at x = 0, widest point at x = FLAT + BULGE.
const BARS = 4;
const GAP = 0.12;
const BAR_H = (2 - GAP * (BARS - 1)) / BARS;
const FLAT = 0.9;
const BULGE = 1.1;
const DEPTH = 0.34;

const edgeX = (y: number) => FLAT + BULGE * Math.sqrt(Math.max(0, 1 - y * y));

function barGeometry(i: number) {
  const top = 1 - i * (BAR_H + GAP);
  const bottom = top - BAR_H;
  const s = new Shape();
  s.moveTo(0, bottom);
  for (let k = 0; k <= 32; k++) {
    const y = bottom + (BAR_H * k) / 32;
    s.lineTo(edgeX(y), y);
  }
  s.lineTo(0, top);
  s.closePath();
  const g = new ExtrudeGeometry(s, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.035,
    bevelSegments: 6,
    curveSegments: 24,
  });
  g.translate(0, 0, -DEPTH / 2);
  return g;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// The scroll timeline (shared with GlassStory): the halves glide in 0.06→0.44 and lock, hold, then split
// back out 0.56→0.76 to frame the statement.
const ARRIVE = 0.06;
const ARRIVE_LEN = 0.34;
const STAGGER = 0.025;
const SPLIT = 0.56;
const SPLIT_LEN = 0.2;
const TURN = 0.75; // how far each half is turned inward while apart (radians)

type Progress = RefObject<number>;

function Half({ side, progress, geometries, buffer }: { side: 1 | -1; progress: Progress; geometries: ExtrudeGeometry[]; buffer: Texture }) {
  const outer = useRef<Group>(null);
  const bars = useRef<(Group | null)[]>([]);
  const viewport = useThree((s) => s.viewport);

  useFrame(({ clock }) => {
    const p = progress.current;
    const fit = Math.min(1, viewport.width / 5.6);
    const split = ease(clamp01((p - SPLIT) / SPLIT_LEN));

    // Each bar has its own arrival, a touch behind the one above, so the whole D slides in as a clean
    // cascade, every bar staying in the mark's plane; apart, they sit aligned as one D.
    const arrivals = geometries.map((_, i) => ease(clamp01((p - ARRIVE - i * STAGGER) / ARRIVE_LEN)));
    const arrived = arrivals.reduce((a, b) => a + b, 0) / BARS;
    arrivals.forEach((a, i) => bars.current[i]?.position.set((arrived - a) * 1.4, 0, 0));

    // Apart = before arriving or after splitting: parked at the screen edge, fully in view, turned inward.
    const apart = Math.max(1 - arrived, split);
    const scale = fit * (1 - 0.25 * apart);
    const edge = Math.max(viewport.width / 2 - 0.35 - 1.5 * fit * 0.75, 0.4);

    const o = outer.current!;
    const t = clock.elapsedTime;
    o.position.x = side * (0.03 + apart * edge);
    o.rotation.y = side * (apart * TURN + Math.sin(t * 0.3) * 0.04);
    o.rotation.x = -0.08 + Math.sin(t * 0.45) * 0.035;
    o.scale.setScalar(scale);
  });

  return (
    <group ref={outer}>
      <group scale={[side, 1, 1]}>
        {geometries.map((g, i) => (
          <group key={i} ref={(el) => void (bars.current[i] = el)}>
            <mesh geometry={g}>
              <MeshTransmissionMaterial
                buffer={buffer}
                transmission={1}
                thickness={0.45}
                roughness={0}
                ior={1.5}
                chromaticAberration={0.05}
                anisotropicBlur={0.08}
                distortion={0}
                clearcoat={1}
                clearcoatRoughness={0}
                color="#ffffff"
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// What the glass refracts: the studio environment itself (black with bright light strips), rendered once a
// frame into a shared buffer with the glass hidden. Refracting the studio, not the near-black page, is what
// makes the bars read as real, glossy crystal; one shared pass keeps it cheap for all eight bars.
function Scene({ progress }: { progress: Progress }) {
  const geometries = useMemo(() => Array.from({ length: BARS }, (_, i) => barGeometry(i)), []);
  const glass = useRef<Group>(null);
  const fbo = useFBO(1024, 1024);

  useFrame(({ gl, scene, camera }) => {
    if (!glass.current || !scene.environment) return;
    const bg = scene.background;
    glass.current.visible = false;
    scene.background = scene.environment;
    gl.setRenderTarget(fbo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    scene.background = bg;
    glass.current.visible = true;
  });

  return (
    <>
      <color attach="background" args={["#0b0b0b"]} />
      <group ref={glass}>
        <Half side={1} progress={progress} geometries={geometries} buffer={fbo.texture} />
        <Half side={-1} progress={progress} geometries={geometries} buffer={fbo.texture} />
      </group>
      {/* Monochrome studio baked into a local env map (no network fetch): long white strips above and to
          the sides for edge highlights, angled strips behind to streak through the faces, and a dim strip
          in front for the glint that slides across as the bars turn. */}
      <Environment resolution={512}>
        <Lightformer form="rect" intensity={3.5} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[12, 1, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-6, 0, 1]} rotation-y={Math.PI / 2} scale={[10, 0.6, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[6, 0, 1]} rotation-y={-Math.PI / 2} scale={[10, 0.6, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-2.5, 1.2, -6]} rotation-z={0.5} scale={[12, 0.35, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[2.5, -1.2, -6]} rotation-z={0.5} scale={[12, 0.35, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, -0.4, -6]} rotation-z={-0.35} scale={[12, 0.2, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[2, 1, 6]} rotation-z={0.6} scale={[14, 0.6, 1]} />
      </Environment>
    </>
  );
}

export default function GlassMark({ progress }: { progress: Progress }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 9], fov: 32 }} gl={{ antialias: true }}>
      <Scene progress={progress} />
    </Canvas>
  );
}
