import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, Shape, Vector2, Vector3, type Group, type MeshBasicMaterial, type Texture } from "three";
import type { Line2 } from "three-stdlib";
import { FACE_CAMERA, SCREEN_RIGHT, toScreen } from "./layout";
import { INK_PX, mix, palette } from "./palette";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

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
export const routeColor = () => mix(palette().ink, palette().paper, 0.55);

/**
 * A static routed line, drawn in the soft route ink. With `arrows`, a small
 * chevron sits at the middle of each long leg pointing the way the flow runs.
 */
export function RouteLine({ points, color, arrows = false, arrowAt = 0.5 }: { points: Vector3[]; color?: string; arrows?: boolean; arrowAt?: number }) {
  const legs = useMemo(
    () =>
      arrows
        ? points.slice(1).flatMap((to, i) => {
            const from = points[i];
            const a = toScreen(from);
            const b = toScreen(to);
            if (Math.hypot(b.u - a.u, b.v - a.v) < 0.7) return [];
            return [{ at: from.clone().lerp(to, arrowAt), angle: Math.atan2(b.v - a.v, b.u - a.u) }];
          })
        : [],
    [points, arrows, arrowAt],
  );
  return (
    <group>
      <Line points={points} color={color ?? routeColor()} lineWidth={INK_PX} />
      {legs.map((leg, i) => (
        <Chevron key={i} at={leg.at} angle={leg.angle} color={color ?? routeColor()} />
      ))}
    </group>
  );
}

const CHEVRON = new Shape([new Vector2(0.07, 0), new Vector2(-0.045, 0.055), new Vector2(-0.02, 0), new Vector2(-0.045, -0.055)]);

/** A small flow chevron, square to the screen, pointing along `angle` (screen radians). */
export function Chevron({ at, angle, color }: { at: Vector3; angle: number; color: string }) {
  return (
    <group position={at} quaternion={FACE_CAMERA}>
      <mesh rotation-z={angle} renderOrder={9}>
        <shapeGeometry args={[CHEVRON]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent depthTest={false} />
      </mesh>
    </group>
  );
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
export function Node({ at, active, r = 0.062 }: { at: Vector3; active?: (t: number) => number; r?: number }) {
  const story = useStory();
  const p = palette();
  const fill = useRef<MeshBasicMaterial>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const colors = useMemo(() => ({ rest: new Color(p.card), ink: new Color(routeColor()), on: new Color(p.accent) }), [p]);
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
        <meshBasicMaterial ref={ring} color={routeColor()} toneMapped={false} transparent depthTest={false} />
      </mesh>
      <mesh renderOrder={10}>
        <circleGeometry args={[r - 0.014, 32]} />
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

/**
 * A step caption: a small deep-green number badge and a mono label, square to
 * the screen, anchored by its left edge at `at`. It names each stage of the flow.
 */
export function Caption({ n, text, at }: { n: string; text: string; at: Vector3 }) {
  const p = palette();
  const W = 3.2;
  const H = 0.3;
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const u = CARD_PX / DESIGN_ZOOM;
      const badge = 18 * u;
      const y = h / 2;
      ctx.fillStyle = p.lightGreen || p.primary;
      ctx.beginPath();
      ctx.roundRect(u, y - badge / 2, badge, badge, 4 * u);
      ctx.fill();
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = `500 ${9 * u}px ${p.monoFont}`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(n, u + badge / 2, y + 0.5 * u);
      ctx.textAlign = "left";
      ctx.letterSpacing = `${0.9 * u}px`;
      ctx.font = `500 ${10 * u}px ${p.monoFont}`;
      ctx.fillStyle = p.ink;
      ctx.fillText(text.toUpperCase(), u + badge + 8 * u, y + 0.5 * u);
      ctx.letterSpacing = "0px";
    },
    [n, text, p],
  );
  const tex = useCanvasTexture(Math.round(W * CARD_PX), Math.round(H * CARD_PX), draw);
  const center = useMemo(() => at.clone().addScaledVector(SCREEN_RIGHT, W / 2), [at]);
  return <CardPlane center={center} w={W} h={H} texture={tex.texture} />;
}
