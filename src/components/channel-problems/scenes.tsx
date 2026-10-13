"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  MeshBasicMaterial,
  Mesh,
  Points,
  Vector3,
} from "three";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { Dither, Stage, Tag, WHITE, clamp01, green, lerp, seg, show, strut, useStory, useZoom, type DitherMat } from "./kit";

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
// Cards 02–04 share card 1's iso view: objects stay square to the world, and
// `at` places them by screen position (sx across, y up, d toward the viewer).
// ═════════════════════════════════════════════════════════════
const ACROSS = new Vector3(1, 0, -1).normalize();
const TOWARD = new Vector3(1, 0, 1).normalize();
const at = (sx: number, y = 0, d = 0) => ACROSS.clone().multiplyScalar(sx).addScaledVector(TOWARD, d).setY(y);
const xyz = (v: Vector3) => [v.x, v.y, v.z] as [number, number, number];
const DIM = new Color("#2a2a2a");

/** A thin bar from `a` to `b`; its material is animated from dim to green. */
function Beam({ a, b, mat }: { a: Vector3; b: Vector3; mat: RefObject<MeshBasicMaterial | null> }) {
  const s = useMemo(() => strut(a, b), [a, b]);
  return (
    <mesh position={s.position} quaternion={s.quaternion}>
      <boxGeometry args={[0.025, s.length, 0.025]} />
      <meshBasicMaterial ref={mat} color={DIM} toneMapped={false} />
    </mesh>
  );
}

// ═════════════════════════════════════════════════════════════
// 02 · Search is no longer one surface.
// One buyer question drops three beams onto three surfaces, a results list
// (Google), an answer (ChatGPT) and cited sources (Perplexity). On each,
// the product's spot lifts and turns green: found everywhere.
// ═════════════════════════════════════════════════════════════
const Q = at(0, 1.25, -0.2);
const SURF_Y = -0.75;
const PAD = 1.05;
const LEAVE = 1.6;
const STAGGER = 0.7;
const FLY = 1.6;
const FOUND = 6.4;

type Part = { size: [number, number, number]; pos: [number, number, number] };
const ENGINES: { name: string; sx: number; parts: Part[]; hit: Part }[] = [
  {
    name: "Google",
    sx: -1.7,
    // A results list: the back row sits highest on screen, so it is #1.
    parts: [1, 2, 3].map((i) => ({ size: [0.78, 0.05, 0.13], pos: [0, 0.085, -0.33 + i * 0.22] })),
    hit: { size: [0.78, 0.07, 0.13], pos: [0, 0.095, -0.33] },
  },
  {
    name: "ChatGPT",
    sx: 0,
    // An answer standing up, with lines across its face; the middle line is the product.
    parts: [
      { size: [0.82, 0.62, 0.07], pos: [0, 0.37, -0.28] },
      { size: [0.6, 0.045, 0.03], pos: [-0.06, 0.55, -0.235] },
      { size: [0.48, 0.045, 0.03], pos: [-0.12, 0.31, -0.235] },
    ],
    hit: { size: [0.66, 0.06, 0.05], pos: [-0.03, 0.43, -0.22] },
  },
  {
    name: "Perplexity",
    sx: 1.7,
    // An answer with a row of source cards in front; the first source is the product.
    parts: [
      { size: [0.78, 0.05, 0.13], pos: [0, 0.085, -0.33] },
      { size: [0.62, 0.05, 0.13], pos: [-0.08, 0.085, -0.11] },
      { size: [0.2, 0.12, 0.2], pos: [0.02, 0.12, 0.24] },
      { size: [0.2, 0.12, 0.2], pos: [0.3, 0.12, 0.24] },
    ],
    hit: { size: [0.2, 0.12, 0.2], pos: [-0.26, 0.12, 0.24] },
  },
];

function SearchScene() {
  const t = useStory();
  const query = useRef<HTMLSpanElement>(null);
  const found = useRef<HTMLSpanElement>(null);
  const block = useRef<Mesh>(null);
  useFrame(() => {
    const k = t.current;
    show(query.current, seg(k, 0.3, 1.0));
    show(found.current, seg(k, FOUND, FOUND + 0.6));
    block.current?.scale.setScalar(Math.max(seg(k, 0.2, 1.0), 0.001));
  });
  return (
    <group position-y={-0.1}>
      <mesh ref={block} position={Q}>
        <boxGeometry args={[0.34, 0.34, 0.34]} />
        <Dither level={1.15} />
      </mesh>
      <Tag ref={query} position={xyz(at(0, Q.y + 0.42, -0.2))} tone="white" plain className="tracking-normal">
        › best CI for monorepos?
      </Tag>
      {ENGINES.map((e, i) => (
        <Engine key={e.name} {...e} i={i} />
      ))}
      <Tag ref={found} position={xyz(at(0, SURF_Y - 1.2, 0.6))} tone="green" plain className="tracking-normal">
        ✓ Found everywhere
      </Tag>
    </group>
  );
}

function Engine({ name, sx, parts, hit, i }: (typeof ENGINES)[number] & { i: number }) {
  const t = useStory();
  const g = useGreen();
  const origin = useMemo(() => at(sx, SURF_Y), [sx]);
  const from = useMemo(() => Q.clone().setY(Q.y - 0.2), []);
  const to = useMemo(() => origin.clone().add(new Vector3(...hit.pos)), [origin, hit]);
  const beam = useRef<MeshBasicMaterial>(null);
  const pulse = useRef<Mesh>(null);
  const spot = useRef<Mesh>(null);
  const spotMat = useRef<DitherMat>(null);
  const label = useRef<HTMLSpanElement>(null);
  const leave = LEAVE + i * STAGGER;
  const land = leave + FLY;

  useFrame(() => {
    const k = t.current;
    const p = clamp01((k - leave) / FLY);
    const e = p * p * (3 - 2 * p);
    pulse.current?.position.lerpVectors(from, to, e);
    pulse.current?.scale.setScalar(p > 0 && p < 1 ? 1 : 0.001);
    beam.current?.color.lerpColors(DIM, g, e);
    const on = seg(k, land, land + 0.8);
    spot.current?.position.setY(hit.pos[1] + 0.09 * on);
    spotMat.current?.uColor.lerpColors(white, g, on);
    if (spotMat.current) spotMat.current.uLevel = 1 + 0.45 * on;
    if (label.current) label.current.textContent = on > 0.5 ? `✓ ${name}` : name;
    lightUp(label.current, on > 0.5);
  });

  return (
    <>
      <Beam a={from} b={to} mat={beam} />
      <mesh ref={pulse} position={from}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color={green()} toneMapped={false} />
      </mesh>
      <group position={origin}>
        <mesh>
          <boxGeometry args={[PAD, 0.12, PAD]} />
          <Dither level={0.75} />
        </mesh>
        {parts.map((part, j) => (
          <mesh key={j} position={part.pos}>
            <boxGeometry args={part.size} />
            <Dither />
          </mesh>
        ))}
        <mesh ref={spot} position={hit.pos}>
          <boxGeometry args={hit.size} />
          <Dither ref={spotMat} />
        </mesh>
      </group>
      <Tag ref={label} position={xyz(at(sx, SURF_Y - 0.5, 0.55))} tone="dim" plain className="tracking-normal">
        {name}
      </Tag>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// 03 · Reddit punishes forced promotion.
// Two comments posted together both name the same product, each standing on
// a column of votes. The link-drop loses its votes block by block, sinks and
// folds flat; the real answer is lifted on green upvotes and gets replies.
// ═════════════════════════════════════════════════════════════
const TILE = 0.16;
const BASE_Y = -1.25;
const VOTE = [1.6, 7.6];
const FOLD = [8.0, 9.2];
const COMMENTS = [
  { kind: "promo", sx: -1.15, start: 3, end: 0, user: "u/cachefly_hq", body: "Check out Cachefly CI!!! 🚀", score: -38 },
  { kind: "genuine", sx: 1.15, start: 3, end: 7, user: "u/sre_dana", body: "Scope cache keys per branch. We use Cachefly CI for it.", score: 214 },
] as const;
const REPLIES = [
  { text: "+1, we use this too", at: 9.0 },
  { text: "Same fix here", at: 9.8 },
];

function ThreadScene() {
  return (
    <group position-y={0.1}>
      <Tag position={xyz(at(-2.25, 1.85))} anchor="left" tone="white" plain className="tracking-normal">
        r/devops · flaky CI?
      </Tag>
      {COMMENTS.map((c) => (
        <VoteColumn key={c.kind} {...c} />
      ))}
      {REPLIES.map((r, i) => (
        <ReplyChip key={r.text} {...r} position={xyz(at(1.0, BASE_Y - 0.42 - i * 0.36, 0.5))} />
      ))}
    </group>
  );
}

function ReplyChip({ text, at: when, position }: { text: string; at: number; position: [number, number, number] }) {
  const t = useStory();
  const el = useRef<HTMLSpanElement>(null);
  useFrame(() => show(el.current, seg(t.current, when, when + 0.6)));
  return (
    <Tag ref={el} position={position} bare>
      <span className="border-l border-primary/60 pl-2.5 font-sans text-[13px] tracking-normal text-white/85">↳ {text}</span>
    </Tag>
  );
}

function VoteColumn({ kind, sx, start, end, user, body, score }: (typeof COMMENTS)[number]) {
  const good = kind === "genuine";
  const t = useStory();
  const g = useGreen();
  const zoom = useZoom();
  const tiles = useRef<(Mesh | null)[]>([]);
  const hinge = useRef<Group>(null);
  const post = useRef<DitherMat>(null);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const bodyEl = useRef<HTMLSpanElement>(null);
  const foldedAt = useMemo(() => xyz(at(0.3, 0.45)), []);
  const foldedEl = useRef<HTMLSpanElement>(null);
  const chip = useRef<Group>(null);
  const count = Math.max(start, end);

  useFrame(() => {
    const k = t.current;
    const v = seg(k, VOTE[0], VOTE[1]);
    const n = lerp(start, end, v);
    tiles.current.forEach((m, i) => m?.scale.set(1, Math.max(clamp01(n - i), 0.001), 1));
    tiles.current.forEach((m, i) => m?.position.setY(0.03 + TILE * i + (TILE * clamp01(n - i)) / 2));
    const top = 0.03 + TILE * n;
    hinge.current?.position.setY(top);
    chip.current?.position.setY(top + 0.62);
    const s = Math.round(1 + (score - 1) * v);
    if (scoreEl.current) scoreEl.current.textContent = `${s > 0 ? "▲" : "▼"} ${s}`;
    if (good) {
      post.current?.uColor.lerpColors(white, g, seg(k, VOTE[1] - 1, VOTE[1]));
      return;
    }
    const f = seg(k, FOLD[0], FOLD[1]);
    hinge.current?.rotation.set(-1.45 * f, 0, 0);
    if (post.current) post.current.uLevel = 1 - 0.45 * v;
    show(bodyEl.current, 1 - clamp01(f * 2));
    show(foldedEl.current, clamp01(f * 2 - 1));
    foldedEl.current?.parentElement?.style.setProperty("visibility", f > 0.5 ? "visible" : "hidden");
  });

  return (
    <group position={at(sx, BASE_Y)}>
      <mesh>
        <boxGeometry args={[0.9, 0.06, 0.9]} />
        <Dither level={0.7} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            tiles.current[i] = m;
          }}
        >
          <boxGeometry args={[0.72, TILE - 0.03, 0.72]} />
          <Dither color={good && i >= start ? green() : WHITE} level={good && i >= start ? 1.25 : 0.95} />
        </mesh>
      ))}
      {/* The comment itself: a card standing on its votes, hinged at the bottom so it can fold flat. */}
      <group ref={hinge}>
        <mesh position-y={0.28}>
          <boxGeometry args={[0.72, 0.5, 0.06]} />
          <Dither ref={post} />
        </mesh>
      </group>
      <group ref={chip}>
        <Tag position={[0, 0, 0]} anchor="above" bare width={Math.min(2.1 * zoom, 170)}>
          <span ref={bodyEl} className="block rounded-[3px] border border-white/15 bg-black/85 px-2 py-1.5 tracking-normal">
            <span className="block">
              <span className="flex gap-2 whitespace-nowrap text-[12px] text-white/55">
                <span ref={scoreEl} className={good ? "text-primary" : "text-white/80"} />
                {user}
              </span>
              <span className="mt-1 block font-sans text-[13px] leading-[1.35] whitespace-normal text-white/90">{body}</span>
            </span>
          </span>
        </Tag>
      </group>
      {!good && (
        <Tag ref={foldedEl} position={foldedAt} plain className="tracking-normal opacity-0">
          [+] collapsed
        </Tag>
      )}
    </group>
  );
}

// ═════════════════════════════════════════════════════════════
// 04 · Reach is easy to buy. Trust is not.
// Two posts about the same product. The big account's wave sweeps a huge
// crowd in seconds and leaves it dark. The trusted creator's slower wave
// reaches fewer people, they stay lit, and questions travel back.
// ═════════════════════════════════════════════════════════════
const FIELDS = [
  { label: "Reach", sx: -1.35, n: 8, tower: 0.85, wave: [0.8, 2.6], views: 1_200_000, comments: 12, talk: [0.8, 2.8] },
  { label: "Trust", sx: 1.25, n: 4, tower: 0.42, wave: [3.4, 6.6], views: 18_000, comments: 240, talk: [6.6, 10] },
] as const;
const FIELD_Y = -0.75;
const PITCH = 0.2;
const TALKBACK = [7.0, 7.8, 8.6, 9.4];
const QUESTIONS = [
  { text: "Works with Bun?", at: 7.6 },
  { text: "Trying it today", at: 8.8 },
];

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(Math.round(n)));

function ReachScene() {
  return (
    <group position-y={-0.05}>
      {FIELDS.map((f) => (
        <Crowd key={f.label} {...f} />
      ))}
      {QUESTIONS.map((q, i) => (
        <ReplyChip key={q.text} text={q.text} at={q.at} position={xyz(at(1.1, FIELD_Y - 0.75 - i * 0.36, 0.5))} />
      ))}
    </group>
  );
}

function Crowd({ label, sx, n, tower, wave, views, comments, talk }: (typeof FIELDS)[number]) {
  const trust = label === "Trust";
  const t = useStory();
  const g = useGreen();
  const pts = useRef<Points>(null);
  const ring = useRef<Mesh>(null);
  const ringMat = useRef<MeshBasicMaterial>(null);
  const towerMat = useRef<DitherMat>(null);
  const viewsEl = useRef<HTMLSpanElement>(null);
  const commentsEl = useRef<HTMLSpanElement>(null);
  const labelEl = useRef<HTMLSpanElement>(null);
  const pulses = useRef<(Mesh | null)[]>([]);
  const origin = useMemo(() => at(sx, FIELD_Y), [sx]);
  const reach = ((n - 1) / 2) * PITCH * Math.SQRT2 + 0.1;

  const { geo, dist, talkers } = useMemo(() => {
    const pos: number[] = [];
    const dist: number[] = [];
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        const x = (a - (n - 1) / 2) * PITCH;
        const z = (b - (n - 1) / 2) * PITCH;
        pos.push(x, 0, z);
        dist.push(Math.hypot(x, z));
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new Float32BufferAttribute(new Array(pos.length).fill(0), 3));
    // ponytail: four fixed corners-ish dots talk back; no RNG needed.
    const talkers = [1, n + 2, n * n - 2, n * (n - 1) - 1].map((i) => new Vector3(pos[i * 3], 0, pos[i * 3 + 2]));
    return { geo, dist, talkers };
  }, [n]);

  useFrame(() => {
    const k = t.current;
    const w = seg(k, wave[0], wave[1]);
    const r = w * reach;
    ring.current?.scale.set(Math.max(r, 0.001), Math.max(r, 0.001), 1);
    if (ringMat.current) {
      ringMat.current.opacity = w > 0 && w < 1 ? 0.8 : 0;
      ringMat.current.color.copy(trust ? g : white);
    }
    const color = pts.current?.geometry.getAttribute("color");
    if (color) {
      dist.forEach((d, i) => {
        const passed = w > 0 ? clamp01((r - d) / 0.12) : 0;
        if (trust) tmp.setScalar(0.16).lerp(g, passed);
        else tmp.setScalar(0.16).lerp(white, clamp01(1 - Math.abs(r - d) / 0.18) * (w < 1 ? 1 : 0));
        color.setXYZ(i, tmp.r, tmp.g, tmp.b);
      });
      color.needsUpdate = true;
    }
    const lit = trust ? seg(k, wave[1] - 0.6, wave[1]) : 0;
    towerMat.current?.uColor.lerpColors(white, g, lit);
    if (viewsEl.current) viewsEl.current.textContent = `${fmt(views * w)} views`;
    const c = Math.round(comments * seg(k, talk[0], talk[1]));
    if (commentsEl.current) commentsEl.current.textContent = `${c} comment${c === 1 ? "" : "s"}`;
    lightUp(labelEl.current, lit > 0.5);
    if (trust) {
      talkers.forEach((p, i) => {
        const q = clamp01((k - TALKBACK[i]) / 1.2);
        const m = pulses.current[i];
        if (!m) return;
        m.position.copy(p).lerp(new Vector3(0, tower, 0), q * q * (3 - 2 * q));
        m.scale.setScalar(q > 0 && q < 1 ? 1 : 0.001);
      });
    }
  });

  return (
    <group position={origin}>
      <points ref={pts} geometry={geo}>
        <pointsMaterial vertexColors size={5} sizeAttenuation={false} toneMapped={false} />
      </points>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[0.94, 1, 64]} />
        <meshBasicMaterial ref={ringMat} transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh position-y={tower / 2}>
        <boxGeometry args={[0.26, tower, 0.26]} />
        <Dither ref={towerMat} level={1.1} />
      </mesh>
      {trust &&
        talkers.map((_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              pulses.current[i] = m;
            }}
          >
            <boxGeometry args={[0.07, 0.07, 0.07]} />
            <meshBasicMaterial color={green()} toneMapped={false} />
          </mesh>
        ))}
      <Tag position={[0, tower + 0.35, 0]} anchor="above" bare>
        <span className="block tracking-normal">
          <span ref={labelEl} className="block rounded-[3px] border border-white/30 bg-black/85 px-1.5 py-[5px] text-center text-white uppercase tracking-[0.06em]">
            {label}
          </span>
          <span ref={viewsEl} className="mt-2 block text-center font-sans text-[15px] font-medium text-white" />
          <span ref={commentsEl} className="mt-1 block text-center text-[12px] text-white/65" />
        </span>
      </Tag>
    </group>
  );
}

// ═════════════════════════════════════════════════════════════
const SCENES = [
  { Scene: FacadeScene, loop: 10, poster: 5, view: [5.3, 3.6] },
  { Scene: SearchScene, loop: 12, poster: 9, view: [5.4, 4.0] },
  { Scene: ThreadScene, loop: 13, poster: 11, view: [4.7, 4.3] },
  { Scene: ReachScene, loop: 13, poster: 11, view: [5.0, 4.0] },
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
