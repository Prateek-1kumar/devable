import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines } from "@react-three/drei";
import { Color, CurvePath, LineCurve3, QuadraticBezierCurve3, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { LAYER } from "./layout";
import { MARK_STYLE, paintMark, type Mark } from "./marks";
import { INK_PX, TONES, materials } from "./palette";
import { easeOutBack, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the work lands. Each channel's route leaves the stack's right face from
// its own port and runs along the floor grid (straight legs, rounded turns) to
// the platforms it reaches; Search forks at a junction into Google and ChatGPT.
// Routes are nested so none cross: the front one runs furthest before turning.
// Each ends on a white puck carrying the platform's real logo. When the signal
// lights a layer, a pulse runs its routes, the junctions blink as it passes and
// the puck lifts with a ring of the channel's color on arrival. Then the leads
// come home: a short train of pearls runs the route back into the stack, on
// its way to the core and up the arc (see PipelineArc).

type XZ = [number, number];
type Route = { k: number; mark: Mark; path: XZ[] };

const FLOOR = 0.01;
const PORT_X = LAYER.baseWidth / 2 + 0.02;
const TURN = 0.22; // corner radius
const PUCK = { r: 0.26, h: 0.09 };
const TRAIN = [1, 0.8, 0.62]; // returning lead pearls, head first (scale)
const TRAIN_GAP = 0.05; // along the route (0..1) between pearls
const ROUTES: Route[] = [
  { k: 0, mark: "hackernews", path: [[PORT_X, -0.2], [3.68, -0.2]] },
  { k: 1, mark: "chatgpt", path: [[PORT_X, -0.6], [2.96, -0.6], [2.96, -1.95]] },
  { k: 1, mark: "google", path: [[PORT_X, -0.6], [4.25, -0.6], [4.25, -1.95]] },
  { k: 2, mark: "reddit", path: [[PORT_X, -1.0], [2.5, -1.0], [2.5, -3.06], [3.2, -3.06]] },
  { k: 3, mark: "youtube", path: [[PORT_X, -1.4], [2.05, -1.4], [2.05, -2.75]] },
];

const at = ([x, z]: XZ, y = FLOOR) => new Vector3(x, y, z);

/** Straight legs joined by rounded corners. Returns the curve and each corner's 0..1 position along it. */
function build(path: XZ[]) {
  const curve = new CurvePath<Vector3>();
  const pts = path.map((p) => at(p));
  let from = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const corner = pts[i];
    const into = corner.clone().addScaledVector(corner.clone().sub(pts[i - 1]).normalize(), -TURN);
    const out = corner.clone().addScaledVector(pts[i + 1].clone().sub(corner).normalize(), TURN);
    curve.add(new LineCurve3(from, into));
    curve.add(new QuadraticBezierCurve3(into, corner, out));
    from = out;
  }
  curve.add(new LineCurve3(from, pts[pts.length - 1]));
  const lengths = curve.getCurveLengths();
  const total = curve.getLength();
  // Corner i is curve 2i + 1; its midpoint along the route.
  const corners = path.slice(1, -1).map((_, i) => (lengths[2 * i] + (lengths[2 * i + 1] - lengths[2 * i]) / 2) / total);
  return { curve, corners };
}

/** A platform puck at the end of a route: white badge with the real logo filling it; lifts with a colored ring on arrival. */
function Puck({ route }: { route: Route }) {
  const story = useStory();
  const m = materials();
  const group = useRef<Group>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const tone = TONES[route.k];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Pure white badge (the face is unlit), then the logo at its brand size.
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      const s = (w * MARK_STYLE[route.mark].fit) / 24;
      ctx.save(); // repaints reuse the context, so don't let the transform stack up
      ctx.translate(w / 2 - 12 * s, h / 2 - 12 * s);
      ctx.scale(s, s);
      paintMark(ctx, route.mark);
      ctx.restore();
    },
    [route.mark],
  );
  const face = useCanvasTexture(512, 512, draw);
  const end = route.path[route.path.length - 1];

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const arrive = story.layerIn(route.k, t);
    const glow = story.landed(route.k, t);
    const g = group.current;
    if (g) {
      g.visible = arrive > 0;
      g.scale.setScalar(Math.max(1e-4, easeOutBack(arrive)));
      g.position.y = glow * 0.06;
    }
    if (ring.current) ring.current.opacity = glow;
  });

  return (
    <group position={at(end, 0)}>
      <group ref={group} visible={false}>
        <mesh position-y={PUCK.h / 2} material={m.panel} castShadow receiveShadow>
          <cylinderGeometry args={[PUCK.r, PUCK.r, PUCK.h, 48]} />
          <Outlines thickness={INK_PX} color={tone.edge} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={PUCK.h + 0.002}>
          <circleGeometry args={[PUCK.r - 0.012, 64]} />
          <meshBasicMaterial map={face.texture} transparent toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={PUCK.h + 0.004}>
          <ringGeometry args={[PUCK.r - 0.035, PUCK.r + 0.01, 64]} />
          <meshBasicMaterial ref={ring} color={CHANNELS[route.k].color} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** A route line with its junction nodes and running pulse; fades in with its channel's layer. */
function RouteLine({ route }: { route: Route }) {
  const story = useStory();
  const channel = CHANNELS[route.k];
  const tone = TONES[route.k];
  const { curve, corners } = useMemo(() => build(route.path), [route]);
  const points = useMemo(() => curve.getSpacedPoints(96), [curve]);
  const line = useRef<Line2>(null);
  const pulse = useRef<Mesh>(null);
  const train = useRef<(Mesh | null)[]>([]);
  const nodes = useRef<(MeshBasicMaterial | null)[]>([]);
  const group = useRef<Group>(null);
  const [rest, lit] = useMemo(() => [new Color("#ffffff"), new Color(channel.color)], [channel]);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const shown = story.layerIn(route.k, t);
    if (group.current) group.current.visible = shown > 0;
    if (line.current) line.current.material.opacity = 0.9 * shown;
    const r = story.route(route.k, t);
    if (pulse.current) {
      pulse.current.visible = r >= 0;
      if (r >= 0) curve.getPointAt(r, pulse.current.position);
    }
    // The way home: pearls run from the puck back to the port.
    const back = story.returning(route.k, t);
    TRAIN.forEach((_, j) => {
      const pearl = train.current[j];
      if (!pearl) return;
      const u = 1 - (back - j * TRAIN_GAP);
      pearl.visible = back >= 0 && u >= 0 && u <= 1;
      if (pearl.visible) curve.getPointAt(u, pearl.position);
    });
    // Junction nodes blink as a pulse or the returning leads pass them.
    corners.forEach((u, i) => {
      const node = nodes.current[i];
      const near = (x: number) => (x >= 0 ? Math.max(0, 1 - Math.abs(x - u) / 0.12) : 0);
      if (node) node.color.lerpColors(rest, lit, Math.max(near(r), near(back >= 0 ? 1 - back : -1)));
    });
  });

  return (
    <group ref={group} visible={false}>
      <Line ref={line} points={points} color={channel.color} lineWidth={1.8} transparent opacity={0} />
      {route.path.slice(1, -1).map((corner, i) => (
        <mesh key={i} position={at(corner, 0.02)}>
          <cylinderGeometry args={[0.075, 0.075, 0.03, 32]} />
          <meshBasicMaterial
            ref={(el) => {
              nodes.current[i] = el;
            }}
            color="#ffffff"
            toneMapped={false}
          />
          <Outlines thickness={INK_PX} color={tone.edge} />
        </mesh>
      ))}
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshBasicMaterial color={channel.color} toneMapped={false} />
      </mesh>
      {TRAIN.map((size, j) => (
        <mesh
          key={j}
          ref={(el) => {
            train.current[j] = el;
          }}
          visible={false}
          scale={size}
        >
          <sphereGeometry args={[0.038, 16, 12]} />
          <meshBasicMaterial color={channel.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Destinations() {
  return (
    <group>
      {ROUTES.map((route) => (
        <group key={route.mark}>
          <RouteLine route={route} />
          <Puck route={route} />
        </group>
      ))}
    </group>
  );
}
