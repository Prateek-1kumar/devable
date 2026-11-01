import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type Group } from "three";
import type { Line2 } from "three-stdlib";
import { span, storyOf } from "../content";
import {
  Print,
  Shadow,
  Solid,
  block,
  colors,
  easeInOut,
  easeOut,
  panel,
  paragraph,
  rrect,
  setFont,
  useBand,
  useLive,
  useStatic,
} from "../kit";
import { AT } from "../layout";

// Beat 2, Search & AI Visibility. ① A developer types a query. ② The results stack re-ranks: your result
// climbs from fourth to first, sliding out past each one it overtakes. ③ An AI Overview folds up beside the
// results, citing you, joined to your result by a green thread.

type Ctx = CanvasRenderingContext2D;

const QUERY = "best document parsing tools";
const RESULTS = [
  { title: "12 best document parsing tools in 2026", url: "listicle.io" },
  { title: "Parsing PDFs: a practical guide", url: "devblog.net" },
  { title: "Document AI: product overview", url: "cloud.example.com" },
];
const YOURS = {
  title: "Your Product: parse any document",
  url: "yourproduct.dev",
};
const SLAB = { w: 3.4, d: 1.1, h: 0.4, step: 0.6, base: 0.22 };
const rankY = (r: number) => SLAB.base + (3 - r) * SLAB.step;
const FACE_H = 0.3;
const BAR_Y = rankY(0) + SLAB.step + 0.08;
const AI = { x: -4.0, z: 1.1, w: 2.6, h: 1.75 };
/** The three overtakes, 0..1 each. */
const swaps = (s: number) =>
  [0, 1, 2].map((j) => easeInOut(span(s, 0.3 + 0.13 * j, 0.42 + 0.13 * j)));
const unfold = (s: number) => easeOut(span(s, 0.74, 0.98));

function drawResult(
  ctx: Ctx,
  w: number,
  h: number,
  r: { title: string; url: string },
  you: boolean,
) {
  const c = colors();
  ctx.textBaseline = "middle";
  const y = h / 2;
  const m = h * 0.42;
  rrect(
    ctx,
    24,
    y - m / 2,
    m,
    m,
    m * 0.24,
    you ? c.ink : "#ffffff",
    you ? undefined : c.line,
    2,
  );
  setFont(ctx, m * 0.5, 600);
  ctx.fillStyle = you ? c.primary : c.muted;
  ctx.textAlign = "center";
  ctx.fillText(r.url[0].toUpperCase(), 24 + m / 2, y + 1);
  ctx.textAlign = "left";
  const x = 24 + m + 22;
  setFont(ctx, h * 0.3, you ? 650 : 500);
  ctx.letterSpacing = "-0.4px";
  ctx.fillStyle = c.ink;
  ctx.fillText(r.title, x, y - h * 0.11);
  ctx.letterSpacing = "0px";
  setFont(ctx, h * 0.2, 450, true);
  ctx.fillStyle = you ? c.deep : c.muted;
  ctx.fillText(r.url, x, y + h * 0.25);
}

function drawQuery(ctx: Ctx, w: number, h: number, typed: number) {
  const c = colors();
  ctx.textBaseline = "middle";
  const y = h / 2;
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = h * 0.045;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(h * 0.42, y - h * 0.03, h * 0.14, 0, Math.PI * 2);
  ctx.moveTo(h * 0.52, y + h * 0.08);
  ctx.lineTo(h * 0.62, y + h * 0.18);
  ctx.stroke();
  setFont(ctx, h * 0.38, 500);
  ctx.letterSpacing = "-0.5px";
  ctx.fillStyle = c.ink;
  const shown = QUERY.slice(0, Math.floor(typed));
  ctx.fillText(shown, h * 0.85, y);
  const end = h * 0.85 + ctx.measureText(shown).width;
  ctx.letterSpacing = "0px";
  if (typed < QUERY.length || typed % 1 === 0) {
    ctx.fillStyle = c.primary;
    ctx.fillRect(end + 5, y - h * 0.24, h * 0.04, h * 0.48);
  }
}

function drawRanks(ctx: Ctx, w: number, h: number) {
  const c = colors();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let r = 0; r < 4; r++) {
    // Rank r's slab centre, from the panel's top (the panel spans the stack's height).
    const y =
      h -
      ((rankY(r) + SLAB.h / 2 - SLAB.base + 0.05) /
        (rankY(0) + SLAB.h - SLAB.base + 0.1)) *
        h;
    const d = w * 0.62;
    ctx.beginPath();
    ctx.arc(w / 2, y, d / 2, 0, Math.PI * 2);
    ctx.fillStyle = r === 0 ? c.ink : "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = r === 0 ? c.ink : c.line;
    ctx.stroke();
    setFont(ctx, d * 0.48, 600, true);
    ctx.fillStyle = r === 0 ? c.primary : c.muted;
    ctx.fillText(`#${r + 1}`, w / 2, y + 2);
  }
}

function drawOverview(ctx: Ctx, w: number, h: number) {
  const c = colors();
  const k = w / 900;
  ctx.save();
  ctx.scale(k, k);
  const W = 900;
  rrect(ctx, 0, 0, W, h / k, 22, "#ffffff");
  // Sparkle and label.
  ctx.fillStyle = c.secondary;
  ctx.beginPath();
  const sx = 58;
  const sy = 62;
  ctx.moveTo(sx, sy - 22);
  ctx.quadraticCurveTo(sx, sy, sx + 22, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + 22);
  ctx.quadraticCurveTo(sx, sy, sx - 22, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - 22);
  ctx.fill();
  setFont(ctx, 34, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("AI Overview", 96, 74);
  const end = paragraph(
    ctx,
    ["For complex PDFs, developers most often recommend ", "Your Product", "."],
    44,
    158,
    W - 88,
    44,
    60,
  );
  // Sources.
  const y = end + 52;
  setFont(ctx, 19, 500, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("SOURCES", 44, y);
  rrect(ctx, 44, y + 20, 270, 54, 27, c.lightGreenSoft);
  ctx.beginPath();
  ctx.arc(72, y + 47, 8, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  setFont(ctx, 24, 550);
  ctx.fillStyle = c.ink;
  ctx.fillText("yourproduct.dev", 90, y + 56);
  rrect(ctx, 330, y + 20, 200, 54, 27, undefined, c.line, 2);
  setFont(ctx, 24, 500);
  ctx.fillStyle = c.muted;
  ctx.fillText("listicle.io", 358, y + 56);
  ctx.restore();
}

function ResultFace({
  r,
  you,
}: {
  r: { title: string; url: string };
  you: boolean;
}) {
  const tex = useStatic(
    SLAB.w - 0.24,
    FACE_H,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawResult(ctx, w, h, r, you),
      [r, you],
    ),
  );
  return (
    <Print
      w={SLAB.w - 0.24}
      h={FACE_H}
      map={tex}
      position={[0, SLAB.h / 2, SLAB.d / 2 + 0.003]}
    />
  );
}

export function SearchStation() {
  const bandRef = useBand();
  const c = colors();
  const render = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) => drawQuery(ctx, w, h, v),
    [],
  );
  const [query, setTyped] = useLive(3.5, 0.4, render);
  const RAIL_H = rankY(0) + SLAB.h - SLAB.base + 0.1;
  const ranks = useStatic(
    0.44,
    RAIL_H,
    useCallback((ctx: Ctx, w: number, h: number) => drawRanks(ctx, w, h), []),
  );
  const overview = useStatic(
    AI.w - 0.14,
    AI.h - 0.14,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawOverview(ctx, w, h),
      [],
    ),
  );
  const slabs = useRef<(Group | null)[]>([]);
  const yours = useRef<Group>(null);
  const fold = useRef<Group>(null);
  const thread = useRef<Line2>(null);
  // From your #1 result's left end to the citation in the overview (station coordinates).
  const threadPts = useMemo(
    () => [
      new Vector3(-SLAB.w / 2, rankY(0) + SLAB.h / 2, SLAB.d / 2),
      new Vector3(-SLAB.w / 2 - 0.9, rankY(0) + SLAB.h / 2, SLAB.d / 2),
      new Vector3(AI.x + 0.4, 1.0, AI.z + 0.05),
    ],
    [],
  );

  useFrame((state) => {
    const s = storyOf(bandRef.current, 2);
    const t = state.clock.elapsedTime;
    const typed = span(s, 0.0, 0.26) * QUERY.length;
    setTyped(
      typed >= QUERY.length
        ? QUERY.length + (Math.floor(t * 2) % 2 ? 0.5 : 0)
        : Math.floor(typed),
    );
    // Your result climbs; each competitor drops a place as it's passed, and yours slides out to pass.
    const sw = swaps(s);
    const climbed = sw[0] + sw[1] + sw[2];
    if (yours.current) {
      yours.current.position.y = rankY(3 - climbed);
      yours.current.position.z =
        (Math.sin(Math.PI * sw[0]) +
          Math.sin(Math.PI * sw[1]) +
          Math.sin(Math.PI * sw[2])) *
        0.8;
    }
    RESULTS.forEach((_, k) => {
      const g = slabs.current[k];
      if (g) g.position.y = rankY(k + sw[2 - k]);
    });
    const u = unfold(s);
    if (fold.current) fold.current.rotation.x = (-Math.PI / 2) * (1 - u);
    if (thread.current) {
      thread.current.visible = u > 0.6;
      thread.current.material.opacity = span(u, 0.6, 1) * 0.9;
    }
  });

  return (
    <group position={AT.search}>
      <Shadow w={5.2} d={2.6} />
      <Solid geometry={block(SLAB.w + 0.4, SLAB.d + 0.3, 0.12, 0.2)} />
      {/* Rank rail. */}
      <Solid
        geometry={panel(0.5, RAIL_H, 0.08, 0.2)}
        position={[-SLAB.w / 2 - 0.42, SLAB.base - 0.05, 0]}
      />
      <Print
        w={0.44}
        h={RAIL_H}
        map={ranks}
        position={[-SLAB.w / 2 - 0.42, SLAB.base - 0.05 + RAIL_H / 2, 0.043]}
      />
      {/* The search bar on top. */}
      <group position-y={BAR_Y}>
        <Solid geometry={block(SLAB.w + 0.3, SLAB.d + 0.15, 0.5, 0.22)} />
        <Print
          w={3.5}
          h={0.4}
          map={query}
          position={[0, 0.25, (SLAB.d + 0.15) / 2 + 0.003]}
        />
      </group>
      {RESULTS.map((r, k) => (
        <group
          key={r.url}
          ref={(g) => void (slabs.current[k] = g)}
          position-y={rankY(k)}
        >
          <Solid geometry={block(SLAB.w, SLAB.d, SLAB.h)} />
          <ResultFace r={r} you={false} />
        </group>
      ))}
      <group ref={yours} position-y={rankY(3)}>
        <Solid geometry={block(SLAB.w, SLAB.d, SLAB.h)} color={c.mint} />
        <ResultFace r={YOURS} you />
      </group>

      {/* The AI overview folds up beside the results, citing you. */}
      <group position={[AI.x, 0, AI.z]}>
        <Shadow w={3.4} d={1.2} />
        <Solid geometry={block(AI.w + 0.2, 0.5, 0.1, 0.14)} />
        <group ref={fold} position={[0, 0.1, 0]} rotation-x={-Math.PI / 2}>
          <Solid geometry={panel(AI.w, AI.h, 0.08, 0.16)} />
          <Print
            w={AI.w - 0.14}
            h={AI.h - 0.14}
            map={overview}
            position={[0, AI.h / 2, 0.043]}
          />
        </group>
      </group>
      <Line
        ref={thread}
        points={threadPts}
        color={c.primary}
        lineWidth={1.6}
        transparent
        visible={false}
      />
    </group>
  );
}
