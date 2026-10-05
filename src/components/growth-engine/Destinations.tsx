import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import { Color, Vector3 } from "three";
import type { Line2 } from "three-stdlib";
import { DASH_NODE, DESTINATIONS, TILE, collectRoute, outRoute } from "./layout";
import { MARK_STYLE, paintMark } from "./marks";
import { INK_PX, boxFaces, edgeColor, palette, tintFaces } from "./palette";
import { Node, Pulse, Route, RouteLine } from "./parts";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the work lands: a row of logo tiles on the floor grid. Each channel's
// port on the stack's right face routes down the face and out along the floor
// to its tiles (search forks to Google and ChatGPT). When a pulse lands, the
// tile warms and a coral frame marks it; then every tile feeds the collector
// that rises into the pipeline dashboard.

type Destination = (typeof DESTINATIONS)[number];

function Tile({ d, index }: { d: Destination; index: number }) {
  const story = useStory();
  const p = palette();
  const faces = useMemo(() => boxFaces(p.card), [p]);
  const colors = useMemo(() => ({ rest: new Color(p.card), on: new Color("#fbe4dc"), now: new Color() }), [p]);
  const frame = useRef<Line2>(null);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const s = (w * MARK_STYLE[d.mark].fit * 0.78) / 24;
      ctx.save(); // repaints reuse the context, so don't let the transform stack up
      ctx.translate(w / 2 - 12 * s, h / 2 - 12 * s);
      ctx.scale(s, s);
      paintMark(ctx, d.mark);
      ctx.restore();
    },
    [d.mark],
  );
  const face = useCanvasTexture(256, 256, draw);
  const r = TILE.size / 2 + 0.07;
  const square = useMemo(
    () => [new Vector3(-r, 0.004, -r), new Vector3(r, 0.004, -r), new Vector3(r, 0.004, r), new Vector3(-r, 0.004, r), new Vector3(-r, 0.004, -r)],
    [r],
  );

  useFrame((state) => {
    const k = story.tile(index, story.time(state.clock.elapsedTime));
    tintFaces(faces, colors.now.lerpColors(colors.rest, colors.on, k));
    if (frame.current) {
      frame.current.visible = k > 0.01;
      frame.current.material.opacity = k;
    }
  });

  return (
    <group position={[TILE.x, 0, d.z]}>
      <mesh position-y={TILE.h / 2} material={faces}>
        <boxGeometry args={[TILE.size, TILE.h, TILE.size]} />
        <Edges color={edgeColor()} lineWidth={INK_PX} />
      </mesh>
      {/* The mark lies on the tile's top, reading along the row like the band labels. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position-y={TILE.h + 0.002}>
        <planeGeometry args={[TILE.size * 0.86, TILE.size * 0.86]} />
        <meshBasicMaterial map={face.texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <Line ref={frame} points={square} color={p.accent} lineWidth={1.5} transparent opacity={0} visible={false} />
    </group>
  );
}

export default function Destinations() {
  const story = useStory();
  const routes = useMemo(() => DESTINATIONS.map((d) => ({ out: new Route(outRoute(d)), collect: new Route(collectRoute(d)) })), []);

  return (
    <group>
      {DESTINATIONS.map((d, i) => (
        <group key={d.mark}>
          <RouteLine points={outRoute(d)} arrows />
          <RouteLine points={collectRoute(d)} />
          <Pulse route={routes[i].out} progress={(t) => story.out(i, t)} />
          <Pulse route={routes[i].collect} progress={(t) => story.collect(i, t)} />
          <Node at={outRoute(d)[0]} active={(t) => (story.out(i, t) >= 0 ? 1 : 0)} />
          <Tile d={d} index={i} />
        </group>
      ))}
      <Node at={DASH_NODE} active={(t) => (DESTINATIONS.some((_, i) => story.collect(i, t) >= 0) ? 1 : 0)} />
    </group>
  );
}
