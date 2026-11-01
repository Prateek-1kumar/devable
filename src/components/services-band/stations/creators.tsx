import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type MeshBasicMaterial } from "three";
import { span, storyOf } from "../content";
import { Fibre, LOCAL } from "../fibre";
import {
  PREMULTIPLIED,
  PX,
  Print,
  Shadow,
  Solid,
  block,
  colors,
  cylinder,
  drawMark,
  easeOut,
  panel,
  rrect,
  setFont,
  shadowTexture,
  useBand,
  useCanvas,
} from "../kit";
import { AT } from "../layout";
import { drawPhoto, face, usePhotos } from "../photos";

// Beat 4, Creator Distribution, as a small creator studio. ① A creator developers trust goes live: the key
// light warms, the ON AIR sign lights and the stream starts on the desk monitor. ② Their audience tunes in: a
// tiered stand fills row by row with real faces, one tier per platform (X, LinkedIn, YouTube), each tier's count
// rising. ③ The scoreboard above the stand settles on 248K developers reached.

type Ctx = CanvasRenderingContext2D;

const CREATOR = {
  name: "Maya Chen",
  handle: "@mayabuilds",
  photo: "/services/creators/c2.jpg",
};
const FACES = [1, 3, 4, 5, 6, 7, 8]
  .map((n) => `/services/creators/c${n}.jpg`)
  .concat([
    "/about/founder.jpg",
    ...["glean", "landingai", "langwatch", "orqai", "webai"].map(
      (p) => `/clients/people/${p}.jpg`,
    ),
  ]);
const TIERS = [
  { mark: "x", name: "X", color: "#0f1419", count: 96_000 },
  { mark: "linkedin", name: "LinkedIn", color: "#0A66C2", count: 64_000 },
  { mark: "youtube", name: "YouTube", color: "#ff0033", count: 88_000 },
] as const;

const DESK = { x: -1.8, z: 0.8, w: 2.3, d: 0.95, h: 0.62 };
const MON = { w: 1.5, h: 0.92, lift: 0.2 };
const STAND = { x: 1.55, z: -0.75, w: 3.6, d: 0.6, rise: 0.46 };
const ROW_H = 0.42;
const BOARD = { w: 2.4, h: 0.7, y: 2.0, z: -1.22 };
const R = LOCAL.r;
/** Desk → audience stand: the stream's signal. */
const FEED: [number, number, number][] = [
  [DESK.x + DESK.w / 2 - 0.05, R, DESK.z + 0.1],
  [-0.38, R, DESK.z + 0.1],
  [-0.38, R, STAND.z],
  [STAND.x - STAND.w / 2 - 0.02, R, STAND.z],
];

const live = (s: number) => span(s, 0.04, 0.18);
const feedLit = (s: number) => span(s, 0.2, 0.32);
const rowFill = (s: number, j: number) =>
  span(s, 0.3 + 0.16 * j, 0.52 + 0.16 * j);
const fmt = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1000)}K` : String(Math.round(n));

/** A texture redrawn from the story's progress `s` (quantised), and when its photos load. */
function useStoryTexture(
  w: number,
  h: number,
  scale: number,
  srcs: string[],
  render: (ctx: Ctx, w: number, h: number, s: number) => void,
) {
  const bandRef = useBand();
  const value = useRef(-1);
  const draw = useCallback(
    (ctx: Ctx, cw: number, ch: number) =>
      render(ctx, cw, ch, Math.max(0, value.current)),
    [render],
  );
  const { texture, paint } = useCanvas(
    Math.round(w * PX * scale),
    Math.round(h * PX * scale),
    draw,
  );
  usePhotos(srcs, paint);
  useFrame(() => {
    const s = Math.round(storyOf(bandRef.current, 4) * 120) / 120;
    if (s === value.current) return;
    value.current = s;
    paint();
  });
  return texture;
}

// ── Prints ──

function drawStream(ctx: Ctx, w: number, h: number, s: number) {
  const c = colors();
  const on = live(s);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, h * 0.04);
  ctx.clip();
  drawPhoto(ctx, CREATOR.photo, 0, 0, w, h);
  // Before going live the stream is dimmed; it brightens as the creator goes on air.
  ctx.fillStyle = `rgba(10,16,13,${0.72 - on * 0.6})`;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, h * 0.5, 0, h);
  g.addColorStop(0, "rgba(10,16,13,0)");
  g.addColorStop(1, "rgba(10,16,13,0.75)");
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);
  const u = h / 100;
  // Live chip and viewers.
  setFont(ctx, 5.2 * u, 650);
  ctx.textBaseline = "middle";
  if (on > 0.5) {
    rrect(ctx, 5 * u, 5 * u, 19 * u, 9 * u, 2 * u, "#e5383b");
    ctx.fillStyle = "#fff";
    ctx.fillText("● LIVE", 7.2 * u, 9.7 * u);
    rrect(ctx, 26 * u, 5 * u, 30 * u, 9 * u, 2 * u, "rgba(0,0,0,0.55)");
    ctx.fillStyle = "#fff";
    const watching =
      TIERS.reduce((a, t, j) => a + t.count * easeOut(rowFill(s, j)), 0) * 0.06;
    ctx.fillText(`${fmt(Math.max(120, watching))} watching`, 28.5 * u, 9.7 * u);
  } else {
    rrect(ctx, 5 * u, 5 * u, 34 * u, 9 * u, 2 * u, "rgba(255,255,255,0.18)");
    ctx.fillStyle = "#fff";
    ctx.fillText("STARTING SOON", 7.2 * u, 9.7 * u);
  }
  // Lower third.
  rrect(
    ctx,
    5 * u,
    h - 27 * u,
    w - 10 * u,
    21 * u,
    3 * u,
    "rgba(255,255,255,0.96)",
  );
  setFont(ctx, 6.6 * u, 650);
  ctx.fillStyle = c.ink;
  ctx.fillText("Testing Your Product on 1,000 PDFs", 9 * u, h - 20.5 * u);
  setFont(ctx, 5 * u, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText(`${CREATOR.name}  ${CREATOR.handle}`, 9 * u, h - 12 * u);
  ctx.restore();
}

function drawOnAir(ctx: Ctx, w: number, h: number, s: number) {
  const on = live(s) > 0.6;
  rrect(ctx, 0, 0, w, h, h * 0.22, on ? "#e5383b" : "#ecebe5");
  setFont(ctx, h * 0.5, 700);
  ctx.letterSpacing = `${h * 0.12}px`;
  ctx.fillStyle = on ? "#fff" : "#b8b6ae";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ON AIR", w / 2 + h * 0.06, h / 2 + 1);
}

/**
 * One tier's audience: the platform and its count on the left, then seats filling with real faces, ringed in
 * the platform's colour.
 */
function drawRow(ctx: Ctx, w: number, h: number, s: number, j: number) {
  const c = colors();
  const t = TIERS[j];
  const f = rowFill(s, j);
  // Label.
  const m = h * 0.5;
  const lw = w * 0.27;
  rrect(
    ctx,
    h * 0.04,
    h * 0.1,
    lw - h * 0.1,
    h * 0.8,
    h * 0.2,
    "#ffffff",
    "rgba(23,44,33,0.1)",
    2,
  );
  drawMark(ctx, t.mark, h * 0.18 + m / 2, h / 2, m);
  ctx.textBaseline = "middle";
  setFont(ctx, h * 0.24, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText(t.name, h * 0.32 + m, h * 0.36);
  setFont(ctx, h * 0.26, 650);
  ctx.fillStyle = f > 0 ? c.ink : c.muted;
  ctx.fillText(fmt(t.count * easeOut(f)), h * 0.32 + m, h * 0.66);
  // Seats.
  const n = 7;
  const x0 = lw + h * 0.1;
  const step = (w - x0) / n;
  const r = Math.min(step * 0.42, h * 0.4);
  const cy = h * 0.5;
  for (let k = 0; k < n; k++) {
    const cx = x0 + step * (k + 0.5);
    ctx.fillStyle = "#e8e6df";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d6d3ca";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.18, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.62, r * 0.6, r * 0.42, 0, Math.PI, 0);
    ctx.fill();
    const a = span(f * (n + 2), k, k + 2);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = t.color;
    ctx.fill();
    face(ctx, FACES[(k * 3 + j * 5) % FACES.length], cx, cy, r * 0.86);
    ctx.globalAlpha = 1;
  }
}

/** A tier's front lip: a thin bar in the platform's colour, filling as its audience arrives. */
function drawRiser(ctx: Ctx, w: number, h: number, s: number, j: number) {
  const f = easeOut(rowFill(s, j));
  rrect(ctx, 0, h * 0.35, w, h * 0.3, h * 0.15, "rgba(23,44,33,0.07)");
  if (f > 0.01)
    rrect(ctx, 0, h * 0.35, w * f, h * 0.3, h * 0.15, TIERS[j].color);
}

function drawBoard(ctx: Ctx, w: number, h: number, s: number) {
  const c = colors();
  const fills = TIERS.map((_, j) => easeOut(rowFill(s, j)));
  const total = TIERS.reduce((a, t, j) => a + t.count * fills[j], 0);
  const u = h / 100;
  rrect(ctx, 0, 0, w, h, 12 * u, "#16211b");
  ctx.textBaseline = "middle";
  ctx.beginPath();
  ctx.arc(10 * u, 20 * u, 3.4 * u, 0, Math.PI * 2);
  ctx.fillStyle = live(s) > 0.6 ? c.primary : "rgba(255,255,255,0.25)";
  ctx.fill();
  setFont(ctx, 10 * u, 500, true);
  ctx.letterSpacing = `${1.6 * u}px`;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("DEVELOPERS REACHED", 17 * u, 20.5 * u);
  ctx.letterSpacing = "0px";
  setFont(ctx, 46 * u, 650);
  ctx.letterSpacing = `${-1.2 * u}px`;
  ctx.fillStyle = "#fff";
  ctx.fillText(fmt(total), 8 * u, 64 * u);
  ctx.letterSpacing = "0px";
  // Per-platform bars on the right.
  const bx = w * 0.5;
  const bw = w * 0.44;
  TIERS.forEach((t, j) => {
    const y = 26 * u + j * 22 * u;
    setFont(ctx, 9.5 * u, 500, true);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(t.name.toUpperCase(), bx, y);
    rrect(ctx, bx, y + 7 * u, bw, 4.5 * u, 2.25 * u, "rgba(255,255,255,0.12)");
    if (fills[j] > 0.01)
      rrect(
        ctx,
        bx,
        y + 7 * u,
        bw * (t.count / 100_000) * fills[j],
        4.5 * u,
        2.25 * u,
        j === 0 ? "#ffffff" : t.color,
      );
  });
}

// ── Pieces ──

const NO_PHOTOS: string[] = [];
const ROW_PHOTOS = FACES;
const STREAM_PHOTOS = [CREATOR.photo];

function Tier({ j }: { j: number }) {
  const row = useStoryTexture(
    STAND.w - 0.3,
    ROW_H,
    1.5,
    ROW_PHOTOS,
    useCallback(
      (ctx: Ctx, w: number, h: number, s: number) => drawRow(ctx, w, h, s, j),
      [j],
    ),
  );
  const riser = useStoryTexture(
    STAND.w - 0.5,
    0.06,
    1.6,
    NO_PHOTOS,
    useCallback(
      (ctx: Ctx, w: number, h: number, s: number) => drawRiser(ctx, w, h, s, j),
      [j],
    ),
  );
  const top = (j + 1) * STAND.rise;
  const z = (1 - j) * STAND.d;
  return (
    <group position-z={z}>
      <Solid geometry={block(STAND.w, STAND.d, top, 0.06)} color="#f8f7f3" />
      <Print
        w={STAND.w - 0.5}
        h={0.06}
        map={riser}
        position={[0, top - 0.07, STAND.d / 2 + 0.003]}
      />
      <Print
        w={STAND.w - 0.3}
        h={ROW_H}
        map={row}
        position={[0, top + ROW_H / 2 + 0.01, -0.06]}
      />
    </group>
  );
}

export function CreatorStation() {
  const bandRef = useBand();
  const c = colors();
  const stream = useStoryTexture(
    MON.w - 0.08,
    MON.h - 0.08,
    1.8,
    STREAM_PHOTOS,
    drawStream,
  );
  const onAir = useStoryTexture(0.58, 0.15, 2, NO_PHOTOS, drawOnAir);
  const board = useStoryTexture(
    BOARD.w - 0.08,
    BOARD.h - 0.08,
    1.6,
    NO_PHOTOS,
    drawBoard,
  );
  const softbox = useRef<MeshBasicMaterial>(null);
  const pool = useRef<MeshBasicMaterial>(null);
  const tint = useRef({ off: new Color("#e9e7e0"), on: new Color("#fffaf0") });

  useFrame(() => {
    const k = live(storyOf(bandRef.current, 4));
    softbox.current?.color.lerpColors(tint.current.off, tint.current.on, k);
    if (pool.current) pool.current.opacity = 0.32 * k;
  });

  const top = DESK.h;
  return (
    <group position={AT.creators}>
      {/* A low studio floor under everything. */}
      <Shadow w={8.6} d={4.6} opacity={0.06} position={[0, 0.001, -0.1]} />
      <Solid
        geometry={block(7.6, 3.6, 0.04, 0.4)}
        color="#f0eee8"
        position-z={-0.05}
      />

      {/* Key light on its stand, angled at the desk, with the warm pool it casts. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[DESK.x - 0.2, 0.05, DESK.z - 0.1]}
        scale={[3.2, 2.2, 1]}
        renderOrder={-1}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={pool}
          color="#ffd9a8"
          alphaMap={shadowTexture()}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group position={[DESK.x - 1.45, 0.04, DESK.z - 0.45]}>
        <Solid geometry={block(0.42, 0.42, 0.03, 0.2)} />
        <Solid geometry={cylinder(0.022, 1.5)} color="#e6e4dd" />
        <group position-y={1.5} rotation-y={0.75} rotation-x={0.18}>
          <Solid geometry={panel(0.82, 0.6, 0.16, 0.06)} position-y={-0.3} />
          <mesh position={[0, 0, 0.083]}>
            <planeGeometry args={[0.72, 0.5]} />
            <meshBasicMaterial
              ref={softbox}
              color="#e9e7e0"
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {/* The creator's desk: monitor with the live stream, ON AIR lightbox, boom mic, keyboard and mug. */}
      <group position={[DESK.x, 0.04, DESK.z]}>
        <Shadow w={2.9} d={1.5} opacity={0.08} position-y={0.002} />
        {[-1, 1].map((side) => (
          <Solid
            key={side}
            geometry={block(0.08, DESK.d - 0.12, top - 0.06, 0.03)}
            position-x={side * (DESK.w / 2 - 0.12)}
          />
        ))}
        <Solid
          geometry={panel(DESK.w - 0.36, top * 0.5, 0.04, 0.02)}
          position={[0, top * 0.38, -DESK.d / 2 + 0.1]}
        />
        <Solid
          geometry={block(DESK.w, DESK.d, 0.06, 0.1)}
          position-y={top - 0.06}
        />
        <group position={[0.05, top, -0.16]}>
          <Solid geometry={block(0.5, 0.26, 0.025, 0.1)} />
          <Solid
            geometry={panel(0.08, MON.lift + 0.1, 0.05, 0.03)}
            position-z={-0.05}
          />
          <Solid
            geometry={panel(MON.w, MON.h, 0.07, 0.07)}
            position-y={MON.lift}
          />
          <Print
            w={MON.w - 0.08}
            h={MON.h - 0.08}
            map={stream}
            position={[0, MON.lift + MON.h / 2, 0.038]}
          />
          <group position-y={MON.lift + MON.h}>
            <Solid geometry={block(0.64, 0.16, 0.19, 0.05)} />
            <mesh position={[0, 0.095, 0.082]}>
              <planeGeometry args={[0.58, 0.15]} />
              <meshBasicMaterial
                map={onAir}
                transparent
                toneMapped={false}
                {...PREMULTIPLIED}
              />
            </mesh>
          </group>
        </group>
        <Solid
          geometry={block(0.86, 0.26, 0.025, 0.05)}
          position={[0.05, top, 0.25]}
          color="#f2f1ec"
        />
        <Solid
          geometry={cylinder(0.065, 0.13)}
          color={c.ink}
          position={[0.85, top, 0.22]}
        />
        {/* Boom mic. */}
        <group position={[-0.86, top, 0.12]}>
          <Solid geometry={cylinder(0.08, 0.02)} color={c.ink} />
          <Solid geometry={cylinder(0.016, 0.46)} color="#d9d7cf" />
          <group position-y={0.46} rotation-z={-0.95}>
            <Solid geometry={cylinder(0.014, 0.34)} color="#d9d7cf" />
          </group>
          <group position={[0.28, 0.46 + 0.2 - 0.12, 0]}>
            <Solid geometry={cylinder(0.058, 0.22)} color={c.ink} />
            <Solid
              geometry={cylinder(0.062, 0.025)}
              color={c.primary}
              position-y={0.06}
            />
          </group>
        </group>
      </group>

      {/* The signal from the desk to the audience. */}
      <Fibre route={FEED} lit={(x) => feedLit(storyOf(x, 4))} />

      {/* The audience stand: three tiers, one per platform, and the reach scoreboard above. */}
      <group position={[STAND.x, 0.04, STAND.z]}>
        <Shadow
          w={STAND.w + 0.8}
          d={STAND.d * 3 + 0.8}
          opacity={0.08}
          position={[0, 0.002, 0]}
        />
        {TIERS.map((t, j) => (
          <Tier key={t.mark} j={j} />
        ))}
        {[-1, 1].map((side) => (
          <Solid
            key={side}
            geometry={cylinder(0.035, BOARD.y + 0.04)}
            color="#e6e4dd"
            position={[side * (BOARD.w / 2 - 0.3), 0, BOARD.z]}
          />
        ))}
        <Solid
          geometry={panel(BOARD.w, BOARD.h, 0.08, 0.1)}
          color="#16211b"
          position={[0, BOARD.y, BOARD.z]}
        />
        <Print
          w={BOARD.w - 0.08}
          h={BOARD.h - 0.08}
          map={board}
          position={[0, BOARD.y + BOARD.h / 2, BOARD.z + 0.043]}
        />
      </group>
    </group>
  );
}
