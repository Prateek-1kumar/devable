import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Outlines, RoundedBox } from "@react-three/drei";
import { Color, CubicBezierCurve3, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { LAYER } from "./layout";
import { MARKS, type Mark } from "./marks";
import { INK_PX, materials, palette } from "./palette";
import { easeOutBack, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the work lands: a row of platform tiles on the floor along the stack's
// right side, each wired to the base by a circuit trace in its channel's color.
// When the signal lights a layer, a pulse runs its traces and the tiles light up.

const FLOOR = 0.012;
const TILE = { size: 0.46, height: 0.06, x: 2.7, front: 1.85, step: 0.6 };
const PORT = { x: LAYER.baseWidth / 2 + 0.02, front: 1.3, back: -1.3 };
const BEND_X = 2.08; // where the traces turn toward their tiles

const TILES = CHANNELS.flatMap((channel, k) => channel.lands.map((mark) => ({ mark, k })));
const tileZ = (i: number) => TILE.front - i * TILE.step;

// One S-curve per tile, fanning out from evenly spaced ports on the base, so no two cross.
const TRACES = TILES.map((_, i) => {
  const zp = PORT.front + ((PORT.back - PORT.front) * i) / (TILES.length - 1);
  const zt = tileZ(i);
  return new CubicBezierCurve3(
    new Vector3(PORT.x, FLOOR, zp),
    new Vector3(BEND_X, FLOOR, zp),
    new Vector3(BEND_X, FLOOR, zt),
    new Vector3(TILE.x - TILE.size / 2, FLOOR, zt),
  );
});

/** A platform tile: white key with the mark on top, graphite at rest, the channel color when a pulse lands. */
function Tile({ mark, k, z }: { mark: Mark; k: number; z: number }) {
  const story = useStory();
  const p = palette();
  const m = materials();
  const group = useRef<Group>(null);
  const ink = useRef<MeshBasicMaterial>(null);
  const [rest, lit] = useMemo(() => [new Color(p.ink), new Color(CHANNELS[k].color)], [p, k]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const s = (w * 0.56) / 24;
      ctx.save(); // repaints reuse the context, so don't let the transform stack up
      ctx.translate(w / 2 - 12 * s, h / 2 - 12 * s);
      ctx.scale(s, s);
      ctx.fillStyle = "#ffffff"; // tinted by the material color
      ctx.fill(new Path2D(MARKS[mark]));
      ctx.restore();
    },
    [mark],
  );
  const face = useCanvasTexture(256, 256, draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const arrive = story.layerIn(k, t);
    const glow = story.landed(k, t);
    const g = group.current;
    if (g) {
      g.visible = arrive > 0;
      g.scale.setScalar(Math.max(1e-4, easeOutBack(arrive)));
      g.position.y = glow * 0.06;
    }
    // Rests in graphite with a hint of its channel; floods with color as the pulse lands.
    ink.current?.color.lerpColors(rest, lit, 0.18 + 0.82 * glow);
  });

  return (
    <group ref={group} position={[TILE.x, 0, z]} visible={false}>
      <RoundedBox args={[TILE.size, TILE.height, TILE.size]} radius={0.025} smoothness={3} position-y={TILE.height / 2} material={m.panel} castShadow receiveShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </RoundedBox>
      <mesh rotation-x={-Math.PI / 2} position-y={TILE.height + 0.002}>
        <planeGeometry args={[TILE.size * 0.9, TILE.size * 0.9]} />
        <meshBasicMaterial ref={ink} map={face.texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A floor trace with its running pulse; fades in with its channel's layer. */
function Trace({ i, k }: { i: number; k: number }) {
  const story = useStory();
  const curve = TRACES[i];
  const points = useMemo(() => curve.getPoints(48), [curve]);
  const line = useRef<Line2>(null);
  const pulse = useRef<Mesh>(null);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    if (line.current) line.current.material.opacity = 0.55 * story.layerIn(k, t);
    const r = story.route(k, t);
    if (pulse.current) {
      pulse.current.visible = r >= 0;
      if (r >= 0) curve.getPointAt(r, pulse.current.position);
    }
  });

  return (
    <>
      <Line ref={line} points={points} color={CHANNELS[k].color} lineWidth={1.6} transparent opacity={0} />
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[0.04, 16, 12]} />
        <meshBasicMaterial color={CHANNELS[k].color} toneMapped={false} />
      </mesh>
    </>
  );
}

/** The channel's label chip lying on the floor beside its tiles, reading along the row. */
function Chip({ k }: { k: number }) {
  const story = useStory();
  const p = palette();
  const channel = CHANNELS[k];
  const group = useRef<Group>(null);
  const tiles = TILES.flatMap((tile, i) => (tile.k === k ? [tileZ(i)] : []));
  const z = tiles.reduce((a, b) => a + b, 0) / tiles.length;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const r = (h - 8) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = channel.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(4, 4, w - 8, h - 8, r);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = channel.color;
      ctx.beginPath();
      ctx.arc(4 + r, h / 2, h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = channel.deep;
      ctx.font = `600 ${h * 0.44}px ${p.bodyFont}`;
      ctx.textBaseline = "middle";
      ctx.fillText(channel.chip, 4 + r * 1.9, h / 2 + 2);
    },
    [channel, p],
  );
  const chip = useCanvasTexture(512, 96, draw);

  useFrame((state) => {
    if (group.current) group.current.visible = story.layerIn(k, story.time(state.clock.elapsedTime)) >= 1;
  });

  return (
    <group ref={group} visible={false}>
      {/* Flat on the floor; text runs along the row (world -z) with its top toward the stack. */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[TILE.x + 0.5, FLOOR, z]}>
        <planeGeometry args={[1.05, 0.2]} />
        <meshBasicMaterial map={chip.texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Destinations() {
  return (
    <group>
      {TILES.map(({ mark, k }, i) => (
        <group key={mark}>
          <Trace i={i} k={k} />
          <Tile mark={mark} k={k} z={tileZ(i)} />
        </group>
      ))}
      {CHANNELS.map((channel, k) => (
        <Chip key={channel.n} k={k} />
      ))}
    </group>
  );
}
