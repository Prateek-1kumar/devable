import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, Vector3, type Group, type MeshBasicMaterial, type Texture } from "three";
import type { Line2 } from "three-stdlib";
import { FACE_CAMERA } from "./layout";
import { INK_PX, mix, palette } from "./palette";
import { useStory } from "./story";

// Small shared pieces of the diagram: routed lines, the pulses that travel
// them and the round node badges at their joints.

/** A polyline with lookup by distance, for pulses travelling along routes. */
export class Route {
  readonly lengths: number[];
  readonly total: number;
  constructor(readonly points: Vector3[]) {
    let sum = 0;
    this.lengths = points.map((p, i) => (sum += i ? p.distanceTo(points[i - 1]) : 0));
    this.total = sum;
  }
  /** The point `k` (0..1) of the way along, by length. */
  at(k: number, out = new Vector3()) {
    const d = Math.min(1, Math.max(0, k)) * this.total;
    for (let i = 1; i < this.points.length; i++) {
      if (d <= this.lengths[i] || i === this.points.length - 1) {
        const span = this.lengths[i] - this.lengths[i - 1];
        return out.lerpVectors(this.points[i - 1], this.points[i], span ? Math.min(1, (d - this.lengths[i - 1]) / span) : 0);
      }
    }
    return out.copy(this.points[this.points.length - 1]);
  }
}

/** Route lines are opaque (no sorting against the glass): ink softened toward the page. */
export const routeColor = () => mix(palette().ink, palette().paper, 0.45);

/** A static routed line, drawn in the soft route ink. */
export function RouteLine({ points, color }: { points: Vector3[]; color?: string }) {
  return <Line points={points} color={color ?? routeColor()} lineWidth={INK_PX} />;
}

const TRAIL = 14; // samples along a pulse's tail
const TAIL = 0.55; // tail length, world units

/**
 * A precise pulse travelling a route: a short coral stroke with a dot at its
 * head. `progress(t)` returns 0..1 while it runs, or -1 when hidden.
 */
export function Pulse({ route, progress }: { route: Route; progress: (t: number) => number }) {
  const story = useStory();
  const p = palette();
  const line = useRef<Line2>(null);
  const head = useRef<Group>(null);
  const scratch = useMemo(() => ({ v: new Vector3(), arr: new Float32Array(TRAIL * 3) }), []);
  const initial = useMemo(() => Array.from({ length: TRAIL }, () => new Vector3()), []);

  useFrame((state) => {
    const k = progress(story.time(state.clock.elapsedTime));
    const on = k >= 0;
    if (line.current) line.current.visible = on;
    if (head.current) head.current.visible = on;
    if (!on) return;
    const tail = TAIL / route.total;
    for (let i = 0; i < TRAIL; i++) {
      route.at(k - tail * (1 - i / (TRAIL - 1)), scratch.v).toArray(scratch.arr, i * 3);
    }
    line.current?.geometry.setPositions(scratch.arr);
    route.at(k, head.current!.position);
  });

  return (
    <group>
      <Line ref={line} points={initial} color={p.accent} lineWidth={2} visible={false} />
      <group ref={head} visible={false} quaternion={FACE_CAMERA}>
        <mesh renderOrder={11}>
          <circleGeometry args={[0.055, 24]} />
          <meshBasicMaterial color={p.accent} toneMapped={false} transparent depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * A round node badge at a joint: white with an ink ring, filling coral while
 * `active(t)` is above zero.
 */
export function Node({ at, active, r = 0.075 }: { at: Vector3; active?: (t: number) => number; r?: number }) {
  const story = useStory();
  const p = palette();
  const fill = useRef<MeshBasicMaterial>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const colors = useMemo(() => ({ rest: new Color(p.card), ink: new Color(p.ink), on: new Color(p.accent) }), [p]);
  useFrame((state) => {
    if (!active || !fill.current || !ring.current) return;
    const k = active(story.time(state.clock.elapsedTime));
    fill.current.color.lerpColors(colors.rest, colors.on, k);
    ring.current.color.lerpColors(colors.ink, colors.on, k);
  });
  return (
    // Badges draw last and over everything (they sit on faces, half-buried in them otherwise).
    <group position={at} quaternion={FACE_CAMERA}>
      <mesh renderOrder={9}>
        <circleGeometry args={[r, 32]} />
        <meshBasicMaterial ref={ring} color={p.ink} toneMapped={false} transparent depthTest={false} />
      </mesh>
      <mesh renderOrder={10}>
        <circleGeometry args={[r - 0.018, 32]} />
        <meshBasicMaterial ref={fill} color={p.card} toneMapped={false} transparent depthTest={false} />
      </mesh>
    </group>
  );
}

/** Texture pixels per world unit for the screen-facing cards (crisp at DPR 1.5 and up). */
export const CARD_PX = 400;
/** Screen pixels per world unit the cards are designed at (the 1440×900 hero). */
export const DESIGN_ZOOM = 84;

/**
 * A flat card square to the screen (the terminal, the dashboard): a canvas
 * texture on a plane that always faces the camera, so its UI reads like a
 * product screenshot pinned into the diagram.
 */
export function CardPlane({ center, w, h, texture }: { center: Vector3; w: number; h: number; texture: Texture }) {
  return (
    <mesh position={center} quaternion={FACE_CAMERA} renderOrder={8}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} depthTest={false} />
    </mesh>
  );
}
