"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  Mesh,
  Points,
  TorusGeometry,
  Vector3,
} from "three";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { Dither, Stage, Tag, WHITE, clamp01, green, lerp, seg, show, strut, useStory, type DitherMat } from "./kit";

const white = new Color(WHITE);
const tmp = new Color();
const useGreen = () => useMemo(() => new Color(green()), []);
const GREEN_BORDER = "color-mix(in srgb, var(--primary) 45%, transparent)";

/** Turns a tag green (or back to its own tone). */
function lightUp(el: HTMLElement | null, on: boolean) {
  if (!el) return;
  el.style.color = on ? green() : "";
  el.style.borderColor = on ? GREEN_BORDER : "";
}

// Faint UI marks drawn onto 3D faces (pattern only; all words are HTML tags).
type Ctx = CanvasRenderingContext2D;
function frame(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(242,242,238,0.45)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);
}
function bars(ctx: Ctx, x: number, y: number, w: number, widths: number[], h = 12, step = 26, alpha = 0.35) {
  ctx.fillStyle = `rgba(242,242,238,${alpha})`;
  widths.forEach((f, i) => ctx.fillRect(x, y + i * step, w * f, h));
}

// ═════════════════════════════════════════════════════════════
// 01 · Technical depth is hard to fake.
// A content block turns around: it is a propped-up facade. Beside it, a
// real block opens into the layers it is built on and a signal runs down.
// ═════════════════════════════════════════════════════════════
const FW = 1.4;
const FH = 1.4;
const FD = 1.1;
const TH = 0.05;
const STRUTS = [-0.38, 0.38].map((x) => strut(new Vector3(x, FH * 0.8, FD / 2 - TH), new Vector3(x, 0, -FD / 2 - 0.05)));
const LAYERS = 5;
const LH = FH / LAYERS;
const TURN = [1.6, 3.4];
const BACK = [7.4, 9.2];

function drawPage(ctx: Ctx, w: number, h: number) {
  frame(ctx, w, h);
  bars(ctx, 44, 52, w - 88, [0.8, 0.55], 30, 50, 0.9);
  bars(ctx, 44, 190, w - 88, [0.92, 0.7, 0.84, 0.5, 0.74], 14, 34);
  ctx.strokeStyle = "rgba(242,242,238,0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(44, 380, w - 88, 84);
}

function FacadeScene() {
  const t = useStory();
  const spin = useRef<Group>(null);
  const { texture } = useCanvasTexture(512, 512, drawPage);
  const solid = useRef<HTMLSpanElement>(null);
  const hollow = useRef<HTMLSpanElement>(null);
  const depth = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    const k = t.current;
    if (spin.current) spin.current.rotation.y = Math.PI * (seg(k, TURN[0], TURN[1]) + seg(k, BACK[0], BACK[1]));
    const revealed = seg(k, 2.9, 3.5) - seg(k, BACK[0], BACK[0] + 0.5);
    show(solid.current, 1 - revealed);
    show(hollow.current, revealed);
    show(depth.current, seg(k, 3.0, 3.6) - seg(k, BACK[0], BACK[0] + 0.5));
  });

  return (
    <>
      <group position={[-0.95, -0.85, 0.95]}>
        <group ref={spin}>
          {/* Only the three faces you see from the front exist. */}
          <mesh position={[0, FH / 2, FD / 2 - TH / 2]}>
            <boxGeometry args={[FW, FH, TH]} />
            <Dither />
          </mesh>
          <mesh position={[FW / 2 - TH / 2, FH / 2, 0]}>
            <boxGeometry args={[TH, FH, FD]} />
            <Dither />
          </mesh>
          <mesh position={[0, FH - TH / 2, 0]}>
            <boxGeometry args={[FW, TH, FD]} />
            <Dither />
          </mesh>
          {STRUTS.map((s, i) => (
            <mesh key={i} position={s.position} quaternion={s.quaternion}>
              <boxGeometry args={[0.06, s.length, 0.06]} />
              <Dither level={1.2} />
            </mesh>
          ))}
          <mesh position={[0, FH / 2, FD / 2 + 0.002]}>
            <planeGeometry args={[FW * 0.86, FH * 0.86]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
          </mesh>
        </group>
        <Tag ref={solid} position={[0.2, -0.3, 0.2]}>
          Looks solid
        </Tag>
        <Tag ref={hollow} position={[0.2, -0.3, 0.2]} tone="white">
          Hollow
        </Tag>
      </group>
      <group position={[0.95, -0.85, -0.95]}>
        {Array.from({ length: LAYERS }, (_, i) => (
          <Layer key={i} i={i} />
        ))}
        <Tag ref={depth} position={[0.2, -0.3, 0.2]} tone="green">
          Real depth
        </Tag>
      </group>
    </>
  );
}

function Layer({ i }: { i: number }) {
  const t = useStory();
  const mat = useRef<DitherMat>(null);
  const g = useGreen();
  const mesh = useRef<Mesh>(null);

  useFrame(() => {
    const k = t.current;
    const open = seg(k, TURN[0], TURN[1]) - seg(k, BACK[0], BACK[1]);
    mesh.current?.position.setY((LAYERS - 1 - i) * (LH + 0.2 * open) + LH / 2);
    // A signal runs down through every layer once the stack is open.
    const glow = clamp01(1 - Math.abs((k - 3.9) / 0.4 - i));
    mat.current?.uColor.lerpColors(white, g, glow);
    if (mat.current) mat.current.uLevel = 1 + glow * 0.4;
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[FW, LH - 0.04, FD]} />
      <Dither ref={mat} />
    </mesh>
  );
}

// ═════════════════════════════════════════════════════════════
// 02 · Search is no longer one surface.
// One query beam passes through three discovery surfaces: you rank on
// search but are missing from the AI ones, until a second pass lands you.
// ═════════════════════════════════════════════════════════════
const BEAM_TOP = 1.85;
const BEAM_END = -1.5;
const SLOT: [number, number] = [0.6, -0.35];
const FIRST = [0.4, 1.8] as const; // beam: start, duration
const SECOND = [3.6, 1.8] as const; // pulse: start, duration
const passAt = (y: number, [start, dur]: readonly [number, number]) => start + (dur * (BEAM_TOP - y)) / (BEAM_TOP - BEAM_END);

function drawSerp(ctx: Ctx, w: number, h: number) {
  frame(ctx, w, h);
  ctx.strokeStyle = "rgba(242,242,238,0.45)";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 26, w - 60, 38);
  for (let i = 0; i < 4; i++) bars(ctx, 30, 92 + i * 56, w - 60, [[0.5, 0.42, 0.56, 0.38][i], 0.82], 12, 22, i === 0 ? 0.9 : 0.35);
}
function drawAnswer(ctx: Ctx, w: number, h: number) {
  frame(ctx, w, h);
  bars(ctx, 30, 34, w - 60, [0.9, 0.78, 0.86, 0.62, 0.8, 0.44], 12, 40);
}
function drawChat(ctx: Ctx, w: number, h: number) {
  frame(ctx, w, h);
  bars(ctx, w * 0.45, 32, w * 0.48, [1], 40, 0, 0.25);
  ctx.strokeStyle = "rgba(242,242,238,0.45)";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 104, w * 0.72, 190);
  bars(ctx, 54, 130, w * 0.64, [0.95, 0.8, 0.9, 0.55], 12, 40);
}

const SURFACES = [
  { name: "Search", hit: "#1 ranked", draw: drawSerp, y: 1.0 },
  { name: "AI answer", hit: "cited", draw: drawAnswer, y: 0 },
  { name: "AI chat", hit: "cited", draw: drawChat, y: -1.0 },
];

const slotBox = new BoxGeometry(0.26, 0.26, 0.26);
const slotEdges = new EdgesGeometry(slotBox);

function SurfacesScene() {
  const t = useStory();
  const beam = useRef<Mesh>(null);
  const pulse = useRef<Mesh>(null);

  useFrame(() => {
    const k = t.current;
    const head = lerp(BEAM_TOP, BEAM_END, clamp01((k - FIRST[0]) / FIRST[1]));
    const len = Math.max(BEAM_TOP - head, 0.001);
    beam.current?.scale.setY(len);
    beam.current?.position.setY(BEAM_TOP - len / 2);
    const p = clamp01((k - SECOND[0]) / SECOND[1]);
    pulse.current?.position.setY(lerp(BEAM_TOP, BEAM_END, p));
    pulse.current?.scale.setScalar(p > 0 && p < 1 ? 1 : 0.001);
  });

  return (
    <group position={[-0.8, 0, 0.8]}>
      <mesh ref={beam} position={[SLOT[0], 0, SLOT[1]]}>
        <boxGeometry args={[0.035, 1, 0.035]} />
        <meshBasicMaterial color={green()} toneMapped={false} />
      </mesh>
      <mesh ref={pulse} position={[SLOT[0], BEAM_TOP, SLOT[1]]}>
        <boxGeometry args={[0.1, 0.34, 0.1]} />
        <meshBasicMaterial color={green()} toneMapped={false} />
      </mesh>
      <Tag position={[SLOT[0], BEAM_TOP + 0.1, SLOT[1]]} tone="green" anchor="left" bare className="pl-2">
        › buyer query
      </Tag>
      {SURFACES.map((s) => (
        <Surface key={s.name} {...s} />
      ))}
    </group>
  );
}

function Surface({ name, hit, draw, y }: (typeof SURFACES)[number]) {
  const t = useStory();
  const { texture } = useCanvasTexture(512, 328, draw);
  const cube = useRef<Mesh>(null);
  const edges = useRef<LineBasicMaterial>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const reached = passAt(y, FIRST);
  const fixed = name === "Search" ? reached : passAt(y, SECOND);

  useFrame(() => {
    const k = t.current;
    const seen = seg(k, reached, reached + 0.3);
    const f = seg(k, fixed, fixed + 0.3);
    cube.current?.scale.setScalar(Math.max(f, 0.001));
    if (edges.current) edges.current.opacity = 0.8 * seen;
    show(tag.current, Math.max(seen, 0.35));
    if (status.current) status.current.textContent = f > 0.5 ? `✓ ${hit}` : seen > 0.5 ? "✕ missing" : " ";
    lightUp(tag.current, f > 0.5);
  });

  return (
    <group position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[2.4, 0.06, 1.6]} />
        <Dither level={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.031}>
        <planeGeometry args={[2.3, 1.5]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <group position={[SLOT[0], 0.16, SLOT[1]]}>
        <mesh ref={cube} geometry={slotBox}>
          <Dither color={green()} level={1.3} />
        </mesh>
        <lineSegments geometry={slotEdges}>
          <lineBasicMaterial ref={edges} color={WHITE} transparent opacity={0} />
        </lineSegments>
      </group>
      <Tag ref={tag} position={[1.25, 0.05, -0.85]} anchor="left">
        <span className="block text-[9.5px] opacity-70">{name}</span>
        <span ref={status} className="mt-1 block" />
      </Tag>
    </group>
  );
}

// ═════════════════════════════════════════════════════════════
// 03 · Reddit punishes forced promotion.
// Two replies in a thread: the promo is voted down, sinks and collapses;
// the genuinely useful answer is voted up and climbs to the top.
// ═════════════════════════════════════════════════════════════
const VOTES = [0.8, 4.2];
const SORT = [4.2, 5.2];
const COLLAPSE = [5.4, 6.1];
const CARD_W = 2.8;
const CARD_H = 0.95;
const cardBox = new BoxGeometry(CARD_W, CARD_H, 0.08);
const cardEdges = new EdgesGeometry(cardBox);

const REPLIES = {
  promo: { user: "u/growth_team", body: "Try our tool!!! Best CI ever", score: -47, from: 0.55, to: -0.65 },
  genuine: { user: "u/ci_maintainer", body: "Root cause: shared cache keys.", score: 312, from: -0.65, to: 0.55 },
};

function ThreadScene() {
  return (
    // Turned to face the camera, so the comments read straight on.
    <group rotation-y={Math.PI / 4} position={[0.1, -0.15, 0]}>
      <Tag position={[-CARD_W / 2 + 0.05, 1.3, 0]} anchor="left">
        r/devops · flaky CI help?
      </Tag>
      <Reply kind="promo" />
      <Reply kind="genuine" />
    </group>
  );
}

function Reply({ kind }: { kind: keyof typeof REPLIES }) {
  const r = REPLIES[kind];
  const good = kind === "genuine";
  const t = useStory();
  const g = useGreen();
  const up = useRef<DitherMat>(null);
  const down = useRef<DitherMat>(null);
  const edges = useRef<LineBasicMaterial>(null);
  const root = useRef<Group>(null);
  const card = useRef<Mesh>(null);
  const score = useRef<HTMLSpanElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const folded = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    const k = t.current;
    const v = seg(k, VOTES[0], VOTES[1]);
    const s = Math.round(1 + (r.score - 1) * v);
    if (score.current) score.current.textContent = `${good ? "▲" : "▼"} ${s}`;
    root.current?.position.setY(lerp(r.from, r.to, seg(k, SORT[0], SORT[1])));
    if (good) {
      up.current?.uColor.lerpColors(white, g, v);
      if (up.current) up.current.uLevel = 1 + 0.5 * v;
      return;
    }
    if (down.current) down.current.uLevel = 1 + 0.5 * v;
    if (up.current) up.current.uLevel = 1 - 0.6 * v;
    if (edges.current) edges.current.opacity = 0.55 - 0.35 * v;
    const c = seg(k, COLLAPSE[0], COLLAPSE[1]);
    card.current?.scale.setY(1 - 0.62 * c);
    show(body.current, 1 - c);
    show(folded.current, c);
  });

  return (
    <group ref={root}>
      <mesh ref={card} geometry={cardBox}>
        <meshBasicMaterial color="#050505" />
        <lineSegments geometry={cardEdges}>
          <lineBasicMaterial ref={edges} color={good ? green() : WHITE} transparent opacity={0.55} />
        </lineSegments>
      </mesh>
      <mesh position={[-CARD_W / 2 - 0.22, 0.17, 0]}>
        <coneGeometry args={[0.11, 0.2, 4]} />
        <Dither ref={up} />
      </mesh>
      <mesh position={[-CARD_W / 2 - 0.22, -0.17, 0]} rotation-z={Math.PI}>
        <coneGeometry args={[0.11, 0.2, 4]} />
        <Dither ref={down} />
      </mesh>
      <Tag position={[-CARD_W / 2 + 0.12, 0, 0.05]} anchor="left" bare className="normal-case tracking-normal">
        <div ref={body}>
          <div className="flex gap-2 text-[10px] text-white/50">
            <span ref={score} className={good ? "text-primary" : "text-white/70"} />
            <span>{r.user}</span>
          </div>
          <div className="mt-1.5 font-sans text-[12px] text-white/90">{r.body}</div>
        </div>
      </Tag>
      {!good && (
        <Tag ref={folded} position={[0, 0, 0.05]} bare className="text-[10px] normal-case tracking-normal">
          comment score below threshold
        </Tag>
      )}
    </group>
  );
}

// ═════════════════════════════════════════════════════════════
// 04 · Reach is easy to buy. Trust is not.
// Paid reach flashes the audience and fades. Creator, narrative and
// timing click into line one by one, a beam locks through, and the
// audience lights up and stays lit.
// ═════════════════════════════════════════════════════════════
const C = new Vector3(-1.0, -0.1, 1.0);
const DIR = new Vector3(1, 0, -1).normalize();
const PERP = new Vector3(1, 0, 1).normalize();
const AIM = Math.PI / 4; // ring angle that faces DIR
const TAU = Math.PI * 2;
const GAP = 0.6; // notch width, world units
const LOCK_FROM = 2.8;
const BEAM = [5.6, 6.1];
const BEAM_FROM = 0.3;
const FIELD_AT = 2.0;
// Outer → inner; each one clicks into line a beat after the last.
const RINGS = [
  { name: "Creator", r: 1.4, w: 0.45, base: 4.6, lock: 4.2 },
  { name: "Narrative", r: 1.0, w: -0.65, base: 3.1, lock: 4.75 },
  { name: "Timing", r: 0.6, w: 0.9, base: 1.2, lock: 5.3 },
];

function ringAngle({ w, base, lock }: (typeof RINGS)[number], k: number) {
  const free = base + w * k;
  const mid = base + (w * (LOCK_FROM + lock)) / 2;
  const target = AIM + TAU * Math.round((mid - AIM) / TAU);
  return lerp(free, target, seg(k, LOCK_FROM, lock));
}

function RingsScene() {
  const t = useStory();
  const core = useRef<DitherMat>(null);
  const g = useGreen();
  const beam = useRef<Mesh>(null);
  const reach = useRef<HTMLSpanElement>(null);
  const checks = useRef<(HTMLSpanElement | null)[]>([]);

  useFrame(() => {
    const k = t.current;
    core.current?.uColor.lerpColors(white, g, seg(k, BEAM[0] - 0.2, BEAM[0]));
    const len = Math.max((FIELD_AT - BEAM_FROM) * seg(k, BEAM[0], BEAM[1]), 0.001);
    beam.current?.scale.setX(len);
    beam.current?.position.copy(C).addScaledVector(DIR, BEAM_FROM + len / 2);
    RINGS.forEach((ring, i) => {
      const el = checks.current[i];
      if (!el) return;
      const locked = k > ring.lock;
      el.textContent = `${locked ? "✓" : "○"} ${ring.name}`;
      lightUp(el, locked);
    });
    const paid = seg(k, 1.0, 1.3) - seg(k, 2.6, 3.0);
    const lasting = seg(k, 6.5, 7);
    if (reach.current) reach.current.textContent = lasting > 0 ? "Lasting reach" : k > 2 ? "Paid reach fades" : "Paid reach";
    show(reach.current, Math.max(paid, lasting));
    lightUp(reach.current, lasting > 0);
  });

  const below = C.clone().addScaledVector(DIR, FIELD_AT + 0.7).addScaledVector(PERP, 1.25);
  const legend = C.clone().addScaledVector(DIR, FIELD_AT + 0.1).addScaledVector(PERP, -1.1).setY(0.85);

  return (
    <>
      <mesh position={C}>
        <icosahedronGeometry args={[0.2, 1]} />
        <Dither ref={core} level={1.1} />
      </mesh>
      {RINGS.map((ring) => (
        <Ring key={ring.name} ring={ring} />
      ))}
      <mesh ref={beam} rotation-y={AIM}>
        <boxGeometry args={[1, 0.045, 0.045]} />
        <meshBasicMaterial color={green()} toneMapped={false} />
      </mesh>
      <Audience />
      <Tag position={[legend.x, legend.y, legend.z]} anchor="left" bare>
        <span className="flex flex-col gap-1.5">
          {RINGS.map((ring, i) => (
            <span
              key={ring.name}
              ref={(el) => {
                checks.current[i] = el;
              }}
              className="text-white/60"
            />
          ))}
        </span>
      </Tag>
      <Tag ref={reach} position={[below.x, below.y, below.z]} tone="white">
        Paid reach
      </Tag>
    </>
  );
}

function Ring({ ring }: { ring: (typeof RINGS)[number] }) {
  const t = useStory();
  const mat = useRef<DitherMat>(null);
  const g = useGreen();
  const spin = useRef<Group>(null);
  const geo = useMemo(() => {
    const gap = GAP / ring.r;
    const geo = new TorusGeometry(ring.r, 0.07, 6, 96, TAU - gap);
    geo.rotateZ(gap / 2); // centre the notch on angle 0…
    geo.rotateX(-Math.PI / 2); // …and lay the ring flat
    return geo;
  }, [ring.r]);

  useFrame(() => {
    const k = t.current;
    spin.current?.rotation.set(0, ringAngle(ring, k), 0);
    mat.current?.uColor.lerpColors(white, g, seg(k, ring.lock - 0.1, ring.lock + 0.2));
  });

  return (
    <group ref={spin} position={C}>
      <mesh geometry={geo}>
        <Dither ref={mat} />
      </mesh>
    </group>
  );
}

const ROWS = 5;
const COLS = 7;

function Audience() {
  const t = useStory();
  const g = useGreen();
  const pts = useRef<Points>(null);
  const { geo, dist, bought } = useMemo(() => {
    const pos: number[] = [];
    const dist: number[] = [];
    const bought: boolean[] = [];
    const p = new Vector3();
    for (let a = 0; a < ROWS; a++) {
      for (let b = 0; b < COLS; b++) {
        const across = b - (COLS - 1) / 2;
        p.copy(C).addScaledVector(DIR, FIELD_AT + 0.15 + a * 0.3).addScaledVector(PERP, across * 0.3);
        pos.push(p.x, p.y, p.z);
        dist.push(a + Math.abs(across) * 0.45);
        bought.push((a * 7 + b * 13) % 5 > 1); // ponytail: fixed pseudo-random pattern, no RNG needed
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new Float32BufferAttribute(new Array(pos.length).fill(0), 3));
    return { geo, dist, bought };
  }, []);

  useFrame(() => {
    const k = t.current;
    const flash = seg(k, 1.1, 1.4) - seg(k, 1.9, 3.0);
    const color = pts.current?.geometry.getAttribute("color");
    if (!color) return;
    dist.forEach((d, i) => {
      const lit = seg(k, BEAM[1] + d * 0.2, BEAM[1] + 0.3 + d * 0.2);
      tmp.setScalar(0.05).lerp(white, bought[i] ? flash * 0.9 : 0).lerp(g, lit);
      color.setXYZ(i, tmp.r, tmp.g, tmp.b);
    });
    color.needsUpdate = true;
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial vertexColors size={6} sizeAttenuation={false} toneMapped={false} />
    </points>
  );
}

// ═════════════════════════════════════════════════════════════
const SCENES = [
  { Scene: FacadeScene, loop: 10, poster: 5, view: [5.3, 3.6] },
  { Scene: SurfacesScene, loop: 8.5, poster: 6.5, view: [5.6, 4.1] },
  { Scene: ThreadScene, loop: 8.5, poster: 7, view: [4.3, 3.2] },
  { Scene: RingsScene, loop: 9.5, poster: 7.5, view: [6.0, 3.6] },
] as const;

type Props = { index: number; still: boolean; active: boolean; hover: RefObject<boolean> };

export default function CardScene({ index, still, active, hover }: Props) {
  const { Scene, ...stage } = SCENES[index];
  return (
    <Canvas orthographic flat dpr={[1, 2]} frameloop={still ? "demand" : active ? "always" : "never"} gl={{ antialias: false }}>
      <Stage {...stage} still={still} hover={hover}>
        <Scene />
      </Stage>
    </Canvas>
  );
}
