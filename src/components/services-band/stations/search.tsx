import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshBasicMaterial } from "three";
import { span, storyOf } from "../content";
import { Fibre, LOCAL } from "../fibre";
import {
  Print,
  Shadow,
  Solid,
  block,
  colors,
  easeBack,
  panel,
  paragraph,
  rrect,
  setFont,
  shadowTexture,
  useBand,
  useLive,
  useStatic,
} from "../kit";
import { AT } from "../layout";

// Beat 2, Search & AI Visibility, told as a short sequence. ① A developer types a query; the results are dealt
// into the stack one by one, yours last at #4. ② A beat later yours lifts out, glides up past the others (which
// part and ease down a place as it passes) and settles at #1 with a soft glow pulse, its live badge counting
// down. ③ A fibre carries the citation to an AI Overview, which springs up on its stand citing you.

type Ctx = CanvasRenderingContext2D;

const QUERY = "best document parsing tools";
const RESULTS = [
  { title: "12 best PDF parsing tools", url: "listicle.io" },
  { title: "Parsing PDFs: a guide", url: "devblog.net" },
  { title: "Document AI overview", url: "cloud.example.com" },
];
const YOURS = {
  title: "Your Product: parse any doc",
  url: "yourproduct.dev",
};
const CARD = { w: 3.8, d: 0.92, h: 0.46, step: 0.62, base: 0.2, r: 0.22 };
const rankY = (r: number) => CARD.base + (3 - r) * CARD.step;
const FACE = { w: CARD.w - 0.14, h: CARD.h - 0.06, x: 0 };
const SHARP = 2.2;
const BASE = { h: 0.14 };
/** The rack: two uprights either side of the drawers, carrying the search bar as their lid. */
const POST = { w: 0.26, d: CARD.d + 0.16, x: CARD.w / 2 + 0.05 + 0.13 };
const BAR = {
  y: rankY(0) + CARD.step + 0.06,
  h: 0.46,
  d: CARD.d + 0.2,
  w: CARD.w + 0.62,
};
const POST_H = BAR.y - BASE.h;
const slotY = (r: number) => rankY(r) + CARD.h / 2;
const AI = { x: -3.5, z: 2.0, w: 2.7, h: 1.72, lift: 0.34 };

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** Your result's rank as a continuous number: 3 (fourth) to 0 (first). */
const climb = (s: number) => smoother(span(s, 0.42, 0.78));
/** The results are dealt into the stack one by one, top first; yours arrives last, at #4. */
const dealt = (s: number, i: number) =>
  smoother(span(s, 0.12 + 0.07 * i, 0.26 + 0.07 * i));
const rankOf = (s: number) => 3 - 3 * climb(s);
const unfold = (s: number) => span(s, 0.84, 1);

/**
 * A drawer's front, as one clean results row on an inset panel: favicon (or your live rank badge), a light
 * breadcrumb, the title, and on the right a recessed finger pull (or, on yours, a status chip).
 */
function drawResult(
  ctx: Ctx,
  w: number,
  h: number,
  r: { title: string; url: string },
  rank: number,
) {
  const c = colors();
  const you = rank > 0;
  const pad = h * 0.08;
  rrect(
    ctx,
    pad,
    pad,
    w - pad * 2,
    h - pad * 2,
    h * 0.24,
    you ? "#f2fcf6" : "#ffffff",
    you ? "rgba(25,231,110,0.35)" : "rgba(23,44,33,0.1)",
    Math.max(2, h * 0.012),
  );
  ctx.textBaseline = "middle";
  const y = h / 2;
  const m = h * 0.46;
  const x0 = pad + h * 0.2;
  let x = x0;
  if (you) {
    const bw = m * 1.35;
    rrect(ctx, x, y - m / 2, bw, m, m / 2, c.ink);
    setFont(ctx, m * 0.42, 600, true);
    ctx.fillStyle = c.primary;
    ctx.textAlign = "center";
    ctx.fillText(`#${rank}`, x + bw / 2, y + 1);
    x += bw;
  } else {
    rrect(
      ctx,
      x,
      y - m / 2,
      m,
      m,
      m * 0.28,
      "#f6f5f1",
      "rgba(23,44,33,0.12)",
      Math.max(2, h * 0.01),
    );
    setFont(ctx, m * 0.42, 600);
    ctx.fillStyle = c.muted;
    ctx.textAlign = "center";
    ctx.fillText(r.url[0].toUpperCase(), x + m / 2, y + 1);
    x += m;
  }
  ctx.textAlign = "left";
  x += h * 0.2;
  setFont(ctx, h * 0.15, 450);
  ctx.fillStyle = you ? c.deep : "#7a817c";
  ctx.fillText(`${r.url}  ›  blog`, x, y - h * 0.17);
  setFont(ctx, h * 0.27, you ? 600 : 500);
  ctx.letterSpacing = `${-h * 0.004}px`;
  ctx.fillStyle = you ? c.ink : "#2a3c9e";
  ctx.fillText(r.title, x, y + h * 0.1);
  ctx.letterSpacing = "0px";
  const right = w - pad - h * 0.22;
  if (you) {
    // A status chip: climbing, then top result.
    const label = rank === 1 ? "Top result" : "Climbing";
    setFont(ctx, h * 0.15, 600);
    const cw = ctx.measureText(label).width + h * 0.62;
    const ch = h * 0.32;
    rrect(
      ctx,
      right - cw,
      y - ch / 2,
      cw,
      ch,
      ch / 2,
      rank === 1 ? c.primary : c.lightGreenSoft,
    );
    ctx.beginPath();
    ctx.arc(right - cw + h * 0.2, y, h * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = c.ink;
    ctx.fill();
    ctx.fillText(label, right - cw + h * 0.32, y + 1);
  } else {
    // A recessed finger pull.
    const pw = h * 1.5;
    const ph = h * 0.2;
    const g = ctx.createLinearGradient(0, y - ph / 2, 0, y + ph / 2);
    g.addColorStop(0, "#dedcd5");
    g.addColorStop(1, "#f4f3ee");
    rrect(ctx, right - pw, y - ph / 2, pw, ph, ph / 2, undefined);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(23,44,33,0.12)";
    ctx.lineWidth = Math.max(1.5, h * 0.008);
    ctx.stroke();
  }
}

/** The left upright's face: engraved rank numbers beside each slot, with the slot grooves between. */
function drawRanks(ctx: Ctx, w: number, h: number) {
  const c = colors();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const toY = (worldY: number) => h - ((worldY - BASE.h) / POST_H) * h;
  for (let r = 0; r < 4; r++) {
    const y = toY(slotY(r));
    setFont(ctx, w * 0.4, 600, true);
    ctx.fillStyle = r === 0 ? c.deep : c.muted;
    ctx.fillText(String(r + 1).padStart(2, "0"), w / 2, y + 1);
    // Groove above each slot.
    ctx.fillStyle = c.line;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(w * 0.2, toY(rankY(r) + CARD.h + 0.09), w * 0.6, 2);
    ctx.globalAlpha = 1;
  }
}

/** The base's front: an engraved plate and vent slots. */
function drawBaseFront(ctx: Ctx, w: number, h: number) {
  const c = colors();
  setFont(ctx, h * 0.42, 500, true);
  ctx.letterSpacing = `${h * 0.14}px`;
  ctx.fillStyle = c.muted;
  ctx.textBaseline = "middle";
  ctx.fillText("SERP · LIVE RANKING", h * 0.4, h / 2 + 1);
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 10; i++)
    rrect(
      ctx,
      w * 0.62 + i * h * 0.42,
      h * 0.26,
      h * 0.14,
      h * 0.48,
      h * 0.07,
      c.line,
    );
  ctx.globalAlpha = 1;
}

function drawQuery(ctx: Ctx, w: number, h: number, typed: number) {
  const c = colors();
  ctx.textBaseline = "middle";
  const y = h / 2;
  // Magnifier, query with caret, and a dark search button at the end.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = h * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(h * 0.42, y - h * 0.03, h * 0.13, 0, Math.PI * 2);
  ctx.moveTo(h * 0.51, y + h * 0.07);
  ctx.lineTo(h * 0.6, y + h * 0.16);
  ctx.stroke();
  setFont(ctx, h * 0.44, 520);
  ctx.letterSpacing = "-0.6px";
  ctx.fillStyle = c.ink;
  const shown = QUERY.slice(0, Math.floor(typed));
  ctx.fillText(shown, h * 0.82, y + 1);
  const end = h * 0.82 + ctx.measureText(shown).width;
  ctx.letterSpacing = "0px";
  if (typed < QUERY.length || typed % 1 === 0) {
    ctx.fillStyle = c.primary;
    ctx.fillRect(end + 5, y - h * 0.22, h * 0.035, h * 0.44);
  }
  const b = h * 0.7;
  rrect(ctx, w - b - h * 0.15, y - b / 2, b, b, b * 0.3, c.ink);
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = h * 0.05;
  ctx.beginPath();
  const bx = w - b / 2 - h * 0.15;
  ctx.moveTo(bx - b * 0.2, y);
  ctx.lineTo(bx + b * 0.18, y);
  ctx.moveTo(bx + b * 0.04, y - b * 0.15);
  ctx.lineTo(bx + b * 0.2, y);
  ctx.lineTo(bx + b * 0.04, y + b * 0.15);
  ctx.stroke();
}

function drawOverview(ctx: Ctx, w: number, h: number) {
  const c = colors();
  const k = w / 900;
  ctx.save();
  ctx.scale(k, k);
  const W = 900;
  const H = h / k;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 30);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  // A soft mint wash across the top, like an AI surface.
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(25,231,110,0.16)");
  g.addColorStop(0.6, "rgba(25,231,110,0.05)");
  g.addColorStop(1, "rgba(217,101,67,0.08)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 112);
  // Sparkle and label.
  ctx.fillStyle = c.secondary;
  const sx = 60;
  const sy = 58;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 22);
  ctx.quadraticCurveTo(sx, sy, sx + 22, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + 22);
  ctx.quadraticCurveTo(sx, sy, sx - 22, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - 22);
  ctx.fill();
  setFont(ctx, 34, 620);
  ctx.fillStyle = c.ink;
  ctx.fillText("AI Overview", 98, 70);
  const end = paragraph(
    ctx,
    [
      "For complex PDFs, developers most often recommend ",
      "Your Product",
      ".¹",
    ],
    48,
    182,
    W - 96,
    46,
    62,
  );
  // Sources.
  const y = end + 56;
  setFont(ctx, 18, 500, true);
  ctx.letterSpacing = "2px";
  ctx.fillStyle = c.muted;
  ctx.fillText("SOURCES", 48, y);
  ctx.letterSpacing = "0px";
  rrect(ctx, 48, y + 22, 300, 58, 29, c.lightGreenSoft);
  rrect(ctx, 62, y + 35, 32, 32, 16, c.primary);
  setFont(ctx, 18, 700, true);
  ctx.fillStyle = c.ink;
  ctx.textAlign = "center";
  ctx.fillText("1", 78, y + 58);
  ctx.textAlign = "left";
  setFont(ctx, 25, 560);
  ctx.fillText("yourproduct.dev", 106, y + 60);
  rrect(ctx, 364, y + 22, 210, 58, 29, undefined, c.line, 2);
  setFont(ctx, 25, 500);
  ctx.fillStyle = c.muted;
  ctx.fillText("listicle.io", 392, y + 60);
  ctx.restore();
}

function ResultFace({ r }: { r: { title: string; url: string } }) {
  const tex = useStatic(
    FACE.w,
    FACE.h,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawResult(ctx, w, h, r, 0),
      [r],
    ),
  );
  return (
    <Print
      w={FACE.w}
      h={FACE.h}
      map={tex}
      position={[FACE.x, CARD.h / 2, CARD.d / 2 + 0.003]}
    />
  );
}

const R = LOCAL.r;
/** From the plinth's left side, across the floor, into the back of the AI Overview's stand. */
const CITE: [number, number, number][] = [
  [-CARD.w / 2 - 0.1, R, -0.15],
  [AI.x, R, -0.15],
  [AI.x, R, AI.z - 0.3],
];

export function SearchStation() {
  const bandRef = useBand();
  const c = colors();
  const renderQuery = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) => drawQuery(ctx, w, h, v),
    [],
  );
  const [query, setTyped] = useLive(CARD.w + 0.1, 0.38, renderQuery, 1.6);
  const renderYours = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) =>
      drawResult(ctx, w, h, YOURS, v || 4),
    [],
  );
  const [yoursFace, setRank] = useLive(FACE.w, FACE.h, renderYours, SHARP);
  const ranks = useStatic(
    POST.w - 0.04,
    POST_H,
    useCallback((ctx: Ctx, w: number, h: number) => drawRanks(ctx, w, h), []),
  );
  const baseFront = useStatic(
    CARD.w + 0.4,
    BASE.h * 0.7,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawBaseFront(ctx, w, h),
      [],
    ),
  );
  const led = useRef<Group>(null);
  const overview = useStatic(
    AI.w - 0.14,
    AI.h - 0.14,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawOverview(ctx, w, h),
      [],
    ),
  );
  const cards = useRef<(Group | null)[]>([]);
  const yours = useRef<Group>(null);
  const glow = useRef<MeshBasicMaterial>(null);
  const fold = useRef<Group>(null);

  useFrame((state) => {
    const s = storyOf(bandRef.current, 2);
    const t = state.clock.elapsedTime;
    const typed = span(s, 0.0, 0.26) * QUERY.length;
    setTyped(
      typed >= QUERY.length
        ? QUERY.length + (Math.floor(t * 2) % 2 ? 0.5 : 0)
        : Math.floor(typed),
    );
    // One continuous climb: yours arcs out of the stack and rises; each card eases down a place as it passes.
    const k = climb(s);
    const p = rankOf(s);
    setRank(Math.min(4, Math.max(1, Math.round(p + 1))));
    const mine = dealt(s, 3);
    // The rack's status light tracks your slot, and stays lit at #1.
    if (led.current) {
      led.current.visible = mine > 0;
      led.current.position.y = slotY(p);
    }
    if (yours.current) {
      const arc = Math.sin(Math.PI * k);
      yours.current.visible = mine > 0;
      yours.current.position.set(
        0.1 * arc,
        rankY(p) + 0.05 * arc,
        0.85 * arc + (1 - mine) * 1.8,
      );
      yours.current.rotation.x = -0.05 * arc;
    }
    // The glow breathes while it climbs and pulses once as it lands.
    const landed = Math.sin(Math.PI * span(s, 0.74, 0.9));
    if (glow.current)
      glow.current.opacity =
        mine *
        (0.16 +
          0.22 * Math.sin(Math.PI * k) +
          0.32 * landed +
          0.05 * Math.sin(t * 2));
    RESULTS.forEach((_, i) => {
      const g = cards.current[i];
      if (!g) return;
      const d = dealt(s, i);
      g.visible = d > 0;
      g.position.set(
        0,
        rankY(i + smoother(Math.min(1, Math.max(0, i + 1 - p)))),
        (1 - d) * 1.8,
      );
    });
    // The overview springs upright on its stand once the citation arrives.
    const u = unfold(s);
    if (fold.current)
      fold.current.rotation.x =
        (-Math.PI / 2) * (1 - (u <= 0 ? 0 : easeBack(u)));
  });

  return (
    <group position={AT.search}>
      <Shadow w={5.4} d={2.8} />
      {/* The rack: an engraved base, two uprights (ranks on the left, status lights on the right), the search
          bar as its lid. */}
      <Solid
        geometry={block(CARD.w + 0.9, CARD.d + 0.5, BASE.h, 0.3)}
        color="#f6f5f1"
      />
      <Print
        w={CARD.w + 0.4}
        h={BASE.h * 0.7}
        map={baseFront}
        position={[0, BASE.h / 2, (CARD.d + 0.5) / 2 + 0.003]}
      />
      {[-1, 1].map((side) => (
        <Solid
          key={side}
          geometry={block(POST.w, POST.d, POST_H, 0.07)}
          position={[side * POST.x, BASE.h, 0]}
        />
      ))}
      <Print
        w={POST.w - 0.04}
        h={POST_H}
        map={ranks}
        position={[-POST.x, BASE.h + POST_H / 2, POST.d / 2 + 0.003]}
      />
      {[0, 1, 2, 3].map((r) => (
        <mesh key={r} position={[POST.x, slotY(r), POST.d / 2 + 0.004]}>
          <circleGeometry args={[0.06, 24]} />
          <meshBasicMaterial color="#dcdad2" toneMapped={false} />
        </mesh>
      ))}
      <group
        ref={led}
        position={[POST.x, slotY(3), POST.d / 2 + 0.006]}
        visible={false}
      >
        <mesh>
          <circleGeometry args={[0.065, 24]} />
          <meshBasicMaterial color={c.primary} toneMapped={false} />
        </mesh>
      </group>
      <group position-y={BAR.y}>
        <Solid geometry={block(BAR.w, BAR.d, BAR.h, 0.45)} />
        <Print
          w={CARD.w + 0.1}
          h={0.38}
          map={query}
          position={[0, BAR.h / 2, BAR.d / 2 + 0.003]}
        />
      </group>
      {RESULTS.map((r, i) => (
        <group
          key={r.url}
          ref={(g) => void (cards.current[i] = g)}
          position-y={rankY(i)}
        >
          <Solid geometry={block(CARD.w, CARD.d, CARD.h, CARD.r)} />
          <ResultFace r={r} />
        </group>
      ))}
      <group ref={yours} position-y={rankY(3)}>
        <mesh
          rotation-x={-Math.PI / 2}
          position-y={-0.01}
          scale={[CARD.w + 1.0, CARD.d + 0.9, 1]}
          renderOrder={-1}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={glow}
            color={c.primary}
            alphaMap={shadowTexture()}
            transparent
            opacity={0.25}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <Solid
          geometry={block(CARD.w, CARD.d, CARD.h, CARD.r)}
          color={c.mint}
        />
        <mesh
          position={[0, CARD.h + 0.002, CARD.d / 2 - 0.08]}
          rotation-x={-Math.PI / 2}
        >
          <planeGeometry args={[CARD.w - 0.5, 0.03]} />
          <meshBasicMaterial color={c.primary} toneMapped={false} />
        </mesh>
        <Print
          w={FACE.w}
          h={FACE.h}
          map={yoursFace}
          position={[FACE.x, CARD.h / 2, CARD.d / 2 + 0.003]}
        />
      </group>

      {/* The citation travels by fibre to the AI Overview, which springs up on its stand. */}
      <Fibre route={CITE} />
      <group position={[AI.x, 0, AI.z]}>
        <Shadow w={3.4} d={1.3} />
        <Solid geometry={block(1.3, 0.55, 0.06, 0.24)} />
        <Solid
          geometry={panel(0.16, AI.lift + 0.2, 0.08, 0.05)}
          position-z={-0.08}
        />
        <group ref={fold} position={[0, AI.lift, 0]} rotation-x={-Math.PI / 2}>
          <Solid geometry={panel(AI.w, AI.h, 0.09, 0.2)} />
          <Print
            w={AI.w - 0.14}
            h={AI.h - 0.14}
            map={overview}
            position={[0, AI.h / 2, 0.048]}
          />
        </group>
      </group>
    </group>
  );
}
