import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines } from "@react-three/drei";
import { Color, CurvePath, LineCurve3, QuadraticBezierCurve3, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { LAYER } from "./layout";
import { paintBadge, type Mark } from "./marks";
import { INK_PX, TONES, materials } from "./palette";
import { easeOutBack, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the work lands. Each channel's route leaves the stack's right face from
// its own port and runs the floor grid (straight legs, rounded turns) to the
// platforms it reaches: white pucks with the real logos. Search forks at a
// junction into Google and ChatGPT. Routes are nested so none cross.
// When the signal lights a layer, a pulse runs out to its platforms, the
// junctions blink as it passes and each puck lifts with a ring of its color.

type XZ = [number, number];
type Route = { k: number; mark: Mark; path: XZ[] };

const FLOOR = 0.01;
const PORT_X = LAYER.baseWidth / 2 + 0.02;
const TURN = 0.22; // corner radius
const PUCK = { r: 0.24, h: 0.09 };
// Each path ends at its puck.
const ROUTES: Route[] = [
  { k: 0, mark: "hackernews", path: [[PORT_X, -0.2], [3.6, -0.2], [3.6, -1.2]] },
  { k: 1, mark: "chatgpt", path: [[PORT_X, -0.6], [2.7, -0.6], [2.7, -1.6]] },
  { k: 1, mark: "google", path: [[PORT_X, -0.6], [3.15, -0.6], [3.15, -2.3]] },
  { k: 2, mark: "reddit", path: [[PORT_X, -1.0], [2.3, -1.0], [2.3, -2.6]] },
  { k: 3, mark: "youtube", path: [[PORT_X, -1.4], [1.95, -1.4], [1.95, -2.1]] },
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

  // Pure white badge (the face is unlit), then the logo at its brand size.
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => paintBadge(ctx, w, h, route.mark), [route.mark]);
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

/** A junction node: a small white disc edged in `edge`, flashing `lit` when something passes. */
function Node({ at: xz, edge, nodeRef }: { at: XZ; edge: string; nodeRef: (el: MeshBasicMaterial | null) => void }) {
  return (
    <mesh position={at(xz, 0.02)}>
      <cylinderGeometry args={[0.07, 0.07, 0.03, 32]} />
      <meshBasicMaterial ref={nodeRef} color="#ffffff" toneMapped={false} />
      <Outlines thickness={INK_PX} color={edge} />
    </mesh>
  );
}

/** A route in its channel's color, from the port to its puck, with its outbound pulse. */
function RouteLine({ route }: { route: Route }) {
  const story = useStory();
  const channel = CHANNELS[route.k];
  const tone = TONES[route.k];
  const { curve, corners } = useMemo(() => build(route.path), [route]);
  const points = useMemo(() => curve.getSpacedPoints(96), [curve]);
  const line = useRef<Line2>(null);
  const pulse = useRef<Mesh>(null);
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
    // Corner nodes blink as the pulse passes them.
    corners.forEach((u, i) => {
      nodes.current[i]?.color.lerpColors(rest, lit, r >= 0 ? Math.max(0, 1 - Math.abs(r - u) / 0.12) : 0);
    });
  });

  return (
    <group ref={group} visible={false}>
      <Line ref={line} points={points} color={channel.color} lineWidth={1.8} transparent opacity={0} />
      {route.path.slice(1, -1).map((corner, i) => (
        <Node
          key={i}
          at={corner}
          edge={tone.edge}
          nodeRef={(el) => {
            nodes.current[i] = el;
          }}
        />
      ))}
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshBasicMaterial color={channel.color} toneMapped={false} />
      </mesh>
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
