import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { mix } from "../../growth-engine/palette";
import { span, storyOf } from "../content";
import { Fibre, LOCAL } from "../fibre";
import {
  PX,
  Print,
  useCanvas,
  Shadow,
  Solid,
  block,
  colors,
  cylinder,
  drawMark,
  panel,
  paragraph,
  pop,
  rrect,
  setFont,
  useBand,
  useLive,
  useStatic,
  wrap,
} from "../kit";
import { AT } from "../layout";

// Beat 1, Technical Content. ① Engineers write a tutorial: it builds on the monitor and its code types out.
// ② Light runs down three fibres into a dock of live screens, and each comes alive with the tutorial landing in
// its world: an IDE where the code runs (developers), a results page where it ranks #1 (Google), and a chat
// answer that cites it (ChatGPT and other LLMs).

type Ctx = CanvasRenderingContext2D;

const CODE = [
  "from yourproduct import Parser",
  'docs = Parser().load("./pdfs")',
  'answer = rag(docs).ask("refunds?")',
];
const CODE_CHARS = CODE.join("").length;
const MONITOR = { x: -0.2, z: -1.7, w: 2.7, h: 1.72, lift: 0.6 };
const SCREEN = { w: MONITOR.w - 0.18, h: MONITOR.h - 0.18 };

function drawArticle(ctx: Ctx, w: number, h: number, typed: number) {
  const c = colors();
  const k = w / 852;
  ctx.save();
  ctx.scale(k, k);
  const W = 852;
  const H = h / k;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  // Browser bar.
  ctx.fillStyle = c.shade;
  ctx.fillRect(0, 0, W, 54);
  [28, 50, 72].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 27, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#dcd8cd";
    ctx.fill();
  });
  rrect(ctx, 104, 13, 400, 28, 14, "#ffffff");
  setFont(ctx, 15, 450, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("yourproduct.dev/blog/rag-pipeline", 120, 32);
  // Chip, meta and title.
  setFont(ctx, 20, 500);
  const chip = ctx.measureText("Tutorial").width + 46;
  rrect(ctx, 40, 78, chip, 36, 18, c.shade);
  ctx.beginPath();
  ctx.arc(60, 96, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  ctx.fillStyle = c.ink;
  ctx.fillText("Tutorial", 72, 103);
  setFont(ctx, 17, 450, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("12 MIN READ  ·  BY AN ENGINEER", 40 + chip + 16, 102);
  setFont(ctx, 50, 600);
  ctx.letterSpacing = "-1.4px";
  ctx.fillStyle = c.ink;
  wrap(ctx, "Build a RAG pipeline with your own data", W - 90).forEach(
    (line, i) => ctx.fillText(line, 40, 176 + i * 56),
  );
  ctx.letterSpacing = "0px";
  // Code block, typing in.
  const top = 274;
  rrect(ctx, 40, top, W - 80, H - top - 30, 14, "#1a1918");
  setFont(ctx, 24, 450, true);
  let left = typed;
  let y = top + 52;
  let caret = { x: 70, y };
  for (const line of CODE) {
    if (left <= 0) break;
    const shown = line.slice(0, left);
    left -= line.length;
    const [first, ...rest] = shown.split(" ");
    ctx.fillStyle = c.primary;
    ctx.fillText(first, 70, y);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    if (rest.length)
      ctx.fillText(" " + rest.join(" "), 70 + ctx.measureText(first).width, y);
    caret = { x: 70 + ctx.measureText(shown).width + 4, y };
    if (left > 0) y += 44;
  }
  if (typed < CODE_CHARS || Math.floor(performance.now() / 500) % 2 === 0) {
    ctx.fillStyle = c.primary;
    ctx.fillRect(caret.x, caret.y - 21, 12, 27);
  }
  ctx.restore();
}

// ── The dock of live screens ──

const DOCK = { w: 6.9, d: 1.15, h: 0.46, z: 0.75 };
const SCR = { w: 2.0, h: 1.36, t: 0.1, lift: 0.3 };
const SLOTS = [-2.25, 0, 2.25];
const R = LOCAL.r;
/** Fibres from the monitor's foot into the dock's back, one per screen (station coordinates). */
const FIBRES: [number, number, number][][] = [
  [
    [-0.45, R, -1.35],
    [-0.45, R, -0.6],
    [SLOTS[0], R, -0.6],
    [SLOTS[0], R, DOCK.z - DOCK.d / 2 + 0.04],
  ],
  [
    [0, R, -1.35],
    [0, R, DOCK.z - DOCK.d / 2 + 0.04],
  ],
  [
    [0.25, R, -1.35],
    [0.25, R, -0.6],
    [SLOTS[2], R, -0.6],
    [SLOTS[2], R, DOCK.z - DOCK.d / 2 + 0.04],
  ],
];
/** Light reaches screen j, then the screen plays its little story (0..1). */
const fibreLit = (s: number, j: number) =>
  span(s, 0.4 + 0.12 * j, 0.48 + 0.12 * j);
const screenOn = (s: number, j: number) =>
  span(s, 0.46 + 0.12 * j, 0.72 + 0.12 * j);

// Each screen is drawn on a 640-wide grid and scaled to its texture.
const GRID = 640;
const TEX_SCALE = 1.6;

function frame(ctx: Ctx, w: number, h: number, bg: string) {
  const k = w / GRID;
  ctx.save();
  ctx.scale(k, k);
  const H = h / k;
  ctx.beginPath();
  ctx.roundRect(0, 0, GRID, H, 22);
  ctx.clip();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GRID, H);
  return H;
}

/** A screen that hasn't received anything yet: dim, with its mark faintly in the middle. */
function idle(
  ctx: Ctx,
  H: number,
  mark: "code" | "google" | "chatgpt",
  dark: boolean,
) {
  ctx.globalAlpha = dark ? 0.35 : 0.18;
  drawMark(ctx, mark, GRID / 2, H / 2, 90);
  ctx.globalAlpha = 1;
}

const TYPED = (text: string, k: number) =>
  text.slice(0, Math.round(text.length * k));

function drawIDE(ctx: Ctx, w: number, h: number, v: number) {
  const c = colors();
  const H = frame(ctx, w, h, "#1a1918");
  if (v <= 0) {
    idle(ctx, H, "code", true);
    ctx.restore();
    return;
  }
  // Tab bar.
  ctx.fillStyle = "#232220";
  ctx.fillRect(0, 0, GRID, 56);
  [26, 46, 66].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 28, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#3a3936";
    ctx.fill();
  });
  rrect(ctx, 96, 10, 150, 46, 10, "#1a1918");
  ctx.beginPath();
  ctx.arc(116, 33, 5, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  setFont(ctx, 20, 500, true);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("rag.py", 130, 40);
  // Code, typing in, with line numbers.
  setFont(ctx, 25, 450, true);
  let left = Math.round(span(v, 0, 0.55) * CODE_CHARS);
  CODE.forEach((line, i) => {
    const y = 108 + i * 44;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText(String(i + 1), 26, y);
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length;
    const [first, ...more] = shown.split(" ");
    ctx.fillStyle = c.primary;
    ctx.fillText(first, 64, y);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    if (more.length)
      ctx.fillText(" " + more.join(" "), 64 + ctx.measureText(first).width, y);
  });
  // Terminal.
  const ty = H - 150;
  ctx.fillStyle = "#121110";
  ctx.fillRect(0, ty, GRID, 150);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, ty, GRID, 2);
  setFont(ctx, 23, 450, true);
  if (v > 0.6) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("$ python rag.py", 26, ty + 44);
  }
  if (v > 0.75) {
    ctx.fillStyle = c.primary;
    ctx.fillText("✓ 1,284 pages indexed", 26, ty + 84);
  }
  if (v > 0.9) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("→ answer ready in 0.4s", 26, ty + 122);
  }
  ctx.restore();
}

function drawSERP(ctx: Ctx, w: number, h: number, v: number) {
  const c = colors();
  const H = frame(ctx, w, h, "#ffffff");
  if (v <= 0) {
    idle(ctx, H, "google", false);
    ctx.restore();
    return;
  }
  // Search bar.
  drawMark(ctx, "google", 46, 46, 40);
  rrect(ctx, 84, 20, GRID - 108, 52, 26, "#ffffff", "#dadce0", 2);
  setFont(ctx, 22, 450);
  ctx.fillStyle = c.ink;
  ctx.fillText(
    TYPED("how to build rag with your pdfs", span(v, 0, 0.3)),
    108,
    54,
  );
  ctx.fillStyle = "#e8eaed";
  ctx.fillRect(0, 92, GRID, 2);
  if (v > 0.35) {
    const a = span(v, 0.35, 0.5);
    ctx.globalAlpha = a;
    // Your result, first, picked out once it lands.
    const hi = span(v, 0.62, 0.75);
    if (hi > 0) {
      ctx.globalAlpha = a * hi;
      rrect(ctx, 14, 108, GRID - 28, 178, 16, "#f0fbf4", "#bfeed1", 2);
      ctx.globalAlpha = a;
    }
    rrect(ctx, 32, 128, 30, 30, 8, c.ink);
    setFont(ctx, 17, 600);
    ctx.fillStyle = c.primary;
    ctx.textAlign = "center";
    ctx.fillText("Y", 47, 150);
    ctx.textAlign = "left";
    setFont(ctx, 19, 450);
    ctx.fillStyle = "#4d5156";
    ctx.fillText("yourproduct.dev › blog", 74, 150);
    setFont(ctx, 30, 500);
    ctx.fillStyle = "#1a0dab";
    wrap(ctx, "Build a RAG pipeline with your own data", GRID - 150).forEach(
      (line, i) => ctx.fillText(line, 32, 200 + i * 38),
    );
    ctx.fillStyle = "#e8eaed";
    rrect(ctx, 32, 256, 420, 12, 6, "#e8eaed");
    // A second result, quieter.
    rrect(ctx, 32, 318, 220, 12, 6, "#e8eaed");
    rrect(ctx, 32, 344, 380, 18, 9, "#d2e3fc");
    rrect(ctx, 32, 376, 300, 12, 6, "#eef0f2");
    if (hi > 0) {
      ctx.globalAlpha = a * hi;
      rrect(ctx, GRID - 112, 124, 82, 40, 20, c.primary);
      setFont(ctx, 22, 650);
      ctx.fillStyle = c.ink;
      ctx.textAlign = "center";
      ctx.fillText("#1", GRID - 71, 152);
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const ANSWER = [
  "Follow ",
  "Your Product",
  "'s tutorial: it walks through parsing, indexing and retrieval.",
];
const ANSWER_LEN = ANSWER.join("").length;

function drawChat(ctx: Ctx, w: number, h: number, v: number) {
  const c = colors();
  const H = frame(ctx, w, h, "#fbfaf7");
  if (v <= 0) {
    idle(ctx, H, "chatgpt", false);
    ctx.restore();
    return;
  }
  // Header.
  drawMark(ctx, "chatgpt", 40, 36, 30);
  setFont(ctx, 21, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("ChatGPT", 66, 44);
  ctx.fillStyle = "#e9e7e1";
  ctx.fillRect(0, 70, GRID, 2);
  // The question.
  if (v > 0.05) {
    setFont(ctx, 22, 500);
    const q = "How do I add RAG to my PDFs?";
    const qw = ctx.measureText(q).width + 40;
    rrect(ctx, GRID - qw - 22, 88, qw, 48, 24, c.ink);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(q, GRID - qw - 2, 119);
  }
  // Thinking, then the answer reveals.
  if (v > 0.2) {
    drawMark(ctx, "chatgpt", 40, 176, 28);
    if (v < 0.42) {
      [0, 1, 2].forEach((i) => {
        ctx.beginPath();
        ctx.arc(76 + i * 20, 178, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(23,44,33,${0.25 + 0.25 * ((Math.round(v * 30) + i) % 3)})`;
        ctx.fill();
      });
    } else {
      // Cut the answer to the revealed length, keeping the highlighted phrase.
      let n = Math.round(span(v, 0.42, 0.82) * ANSWER_LEN);
      const parts = ANSWER.map((p) => {
        const part = p.slice(0, Math.max(0, n));
        n -= p.length;
        return part;
      });
      paragraph(ctx, parts, 66, 186, GRID - 100, 25, 36);
    }
  }
  // The citation.
  if (v > 0.86) {
    ctx.globalAlpha = span(v, 0.86, 0.95);
    rrect(ctx, 66, H - 84, 300, 50, 25, c.lightGreenSoft);
    rrect(ctx, 80, H - 72, 26, 26, 13, c.primary);
    setFont(ctx, 15, 650, true);
    ctx.fillStyle = c.ink;
    ctx.textAlign = "center";
    ctx.fillText("1", 93, H - 53);
    ctx.textAlign = "left";
    setFont(ctx, 20, 550);
    ctx.fillText("yourproduct.dev/blog ↗", 116, H - 52);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const SCREENS = [
  { draw: drawIDE, name: "Developers", glyph: "</>" },
  { draw: drawSERP, name: "Google Search", glyph: "G" },
  { draw: drawChat, name: "ChatGPT & LLMs", glyph: "✦" },
] as const;

// The dock's build: a recessed skirt at the floor, a seamed body, a gasket line and a top cap.
const SKIRT_H = 0.05;
const CAP_H = 0.035;
const GASKET_H = 0.014;
const BODY_H = DOCK.h - SKIRT_H - CAP_H - GASKET_H;
const FOREST = "#1d5c3a";

/** The body's front: one light engraved plate per bay, seams between the bays, vents at the ends. */
function drawDockFront(ctx: Ctx, w: number, h: number) {
  const c = colors();
  const unit = w / DOCK.w;
  SCREENS.forEach((sc, j) => {
    const cx = (SLOTS[j] + DOCK.w / 2) * unit;
    // The plate hugs its icon and name.
    setFont(ctx, h * 0.3, 620);
    const pw = h * 0.13 + h * 0.5 + h * 0.18 + ctx.measureText(sc.name).width + h * 0.32;
    const x = cx - pw / 2;
    rrect(
      ctx,
      x,
      h * 0.12,
      pw,
      h * 0.76,
      h * 0.22,
      "#f4f3ee",
      "rgba(23,44,33,0.13)",
      Math.max(1.5, h * 0.02),
    );
    const box = h * 0.5;
    rrect(
      ctx,
      x + h * 0.13,
      (h - box) / 2,
      box,
      box,
      box * 0.28,
      c.lightGreenSoft,
    );
    setFont(ctx, box * 0.46, 650, true);
    ctx.fillStyle = c.deep;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sc.glyph, x + h * 0.13 + box / 2, h / 2 + 1);
    ctx.textAlign = "left";
    const tx = x + h * 0.13 + box + h * 0.18;
    setFont(ctx, h * 0.17, 500, true);
    ctx.letterSpacing = `${h * 0.03}px`;
    ctx.fillStyle = c.muted;
    ctx.fillText(`BAY 0${j + 1}`, tx, h * 0.34);
    ctx.letterSpacing = "0px";
    setFont(ctx, h * 0.3, 620);
    ctx.fillStyle = c.ink;
    ctx.fillText(sc.name, tx, h * 0.62);
    // Seam after each bay.
    if (j < SCREENS.length - 1) {
      const sx = ((SLOTS[j] + SLOTS[j + 1]) / 2 + DOCK.w / 2) * unit;
      ctx.fillStyle = "rgba(23,44,33,0.16)";
      ctx.fillRect(sx, 0, Math.max(1.5, h * 0.02), h);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(sx + Math.max(1.5, h * 0.02), 0, Math.max(1.5, h * 0.02), h);
    }
  });
  ctx.globalAlpha = 0.5;
  for (const side of [0, 1])
    for (let i = 0; i < 4; i++) {
      const x = side
        ? w - h * 0.45 - (i + 1) * h * 0.26
        : h * 0.45 + i * h * 0.26;
      rrect(ctx, x, h * 0.28, h * 0.1, h * 0.44, h * 0.05, c.line);
    }
  ctx.globalAlpha = 1;
}

/** The top cap: a recessed pad under each screen with corner ticks, and an engraved border. */
function drawDockTop(ctx: Ctx, w: number, h: number) {
  const unit = w / DOCK.w;
  ctx.strokeStyle = "rgba(23,44,33,0.1)";
  ctx.lineWidth = Math.max(1.5, h * 0.006);
  ctx.beginPath();
  ctx.roundRect(h * 0.05, h * 0.07, w - h * 0.1, h * 0.86, h * 0.3);
  ctx.stroke();
  SLOTS.forEach((sx) => {
    const cx = (sx + DOCK.w / 2) * unit;
    const pw = 1.25 * unit;
    const ph = h * 0.5;
    const x = cx - pw / 2;
    const y = h * 0.16;
    rrect(
      ctx,
      x,
      y,
      pw,
      ph,
      ph * 0.3,
      "rgba(23,44,33,0.035)",
      "rgba(23,44,33,0.1)",
      Math.max(1.5, h * 0.006),
    );
    ctx.strokeStyle = "rgba(23,44,33,0.3)";
    const t = ph * 0.16;
    for (const [px, py, dx, dy] of [
      [x + ph * 0.12, y + ph * 0.12, 1, 1],
      [x + pw - ph * 0.12, y + ph * 0.12, -1, 1],
      [x + ph * 0.12, y + ph - ph * 0.12, 1, -1],
      [x + pw - ph * 0.12, y + ph - ph * 0.12, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(px + dx * t, py);
      ctx.lineTo(px, py);
      ctx.lineTo(px, py + dy * t);
      ctx.stroke();
    }
  });
}

/** One live screen: draws its state as the story plays (redrawn in steps, not every frame). */
function LiveScreen({ index }: { index: number }) {
  const bandRef = useBand();
  const value = useRef(-1);
  const sc = SCREENS[index];
  const draw = useCallback(
    (ctx: Ctx, w: number, h: number) =>
      sc.draw(ctx, w, h, Math.max(0, value.current)),
    [sc],
  );
  const tex = useCanvas(
    Math.round((SCR.w - 0.1) * PX * TEX_SCALE),
    Math.round((SCR.h - 0.1) * PX * TEX_SCALE),
    draw,
  );
  const led = useRef<Group>(null);
  useFrame(() => {
    const v =
      Math.round(screenOn(storyOf(bandRef.current, 1), index) * 60) / 60;
    if (led.current) {
      led.current.visible = v > 0;
      led.current.scale.setScalar(pop(span(v, 0, 0.2)));
    }
    if (v === value.current) return;
    value.current = v;
    tex.paint();
  });
  const x = SLOTS[index];
  return (
    <group position={[x, DOCK.h, DOCK.z]}>
      <Shadow w={1.6} d={0.7} opacity={0.08} position-y={0.002} />
      <Solid geometry={block(0.74, 0.38, 0.035, 0.15)} />
      <Solid
        geometry={panel(0.12, SCR.lift + 0.18, 0.06, 0.04)}
        position-z={-0.06}
      />
      <Solid geometry={panel(SCR.w, SCR.h, SCR.t, 0.1)} position-y={SCR.lift} />
      <Print
        w={SCR.w - 0.1}
        h={SCR.h - 0.1}
        map={tex.texture}
        position={[0, SCR.lift + SCR.h / 2, SCR.t / 2 + 0.003]}
      />
      {/* Status light on the dock, in front of the screen. */}
      <group position={[0.5, 0, DOCK.d / 2 - 0.2]}>
        <Solid geometry={cylinder(0.06, 0.02)} color="#eeeeea" />
        <group ref={led} visible={false} position-y={0.02}>
          <Solid geometry={cylinder(0.045, 0.03)} color={colors().primary} />
        </group>
      </group>
    </group>
  );
}

export function ContentStation() {
  const bandRef = useBand();
  const render = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) =>
      drawArticle(ctx, w, h, Math.floor(v)),
    [],
  );
  const [screen, setTyped] = useLive(SCREEN.w, SCREEN.h, render);
  const front = useStatic(
    DOCK.w,
    BODY_H * 0.86,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawDockFront(ctx, w, h),
      [],
    ),
    1.5,
  );
  const top = useStatic(
    DOCK.w - 0.06,
    DOCK.d - 0.06,
    useCallback((ctx: Ctx, w: number, h: number) => drawDockTop(ctx, w, h), []),
    0.8,
  );
  const glow = useRef<Mesh>(null);

  useFrame((state) => {
    const s = storyOf(bandRef.current, 1);
    const t = state.clock.elapsedTime;
    // The typed count, plus a half-second phase so the caret blinks once typing is done.
    const typed = Math.round(span(s, 0.0, 0.38) * CODE_CHARS);
    setTyped(typed + (typed >= CODE_CHARS ? (Math.floor(t * 2) % 2) * 0.5 : 0));
    if (glow.current) glow.current.visible = s > 0.4;
  });

  return (
    <group position={AT.content}>
      {/* Monitor on its stand. */}
      <Shadow w={2.6} d={1.5} position={[MONITOR.x, 0.001, MONITOR.z]} />
      <Solid
        geometry={block(1.2, 0.62, 0.08, 0.24)}
        position={[MONITOR.x, 0, MONITOR.z]}
      />
      <Solid
        geometry={panel(0.3, MONITOR.lift + 0.2, 0.1, 0.05)}
        position={[MONITOR.x, 0, MONITOR.z - 0.1]}
      />
      <Solid
        geometry={panel(MONITOR.w, MONITOR.h, 0.14, 0.14)}
        position={[MONITOR.x, MONITOR.lift, MONITOR.z]}
      />
      <Print
        w={SCREEN.w}
        h={SCREEN.h}
        map={screen}
        position={[MONITOR.x, MONITOR.lift + MONITOR.h / 2, MONITOR.z + 0.073]}
      />

      {/* Fibres out to the dock. */}
      {FIBRES.map((route, j) => (
        <Fibre key={j} route={route} lit={(x) => fibreLit(storyOf(x, 1), j)} />
      ))}

      {/* The dock: a recessed skirt, a seamed body with an engraved plate per bay, a gasket line, and a top
          cap with a pad under each screen. A soft light line runs along its front edge; the fibres plug into
          deep-green couplings at its back. */}
      <Shadow
        w={DOCK.w + 1.2}
        d={DOCK.d + 1}
        opacity={0.09}
        position={[0, 0.001, DOCK.z]}
      />
      <group position-z={DOCK.z}>
        <Solid
          geometry={block(DOCK.w - 0.12, DOCK.d - 0.12, SKIRT_H, 0.42)}
          color="#d9d6cd"
        />
        <Solid
          geometry={block(DOCK.w, DOCK.d, BODY_H, 0.45)}
          color="#f1efe9"
          position-y={SKIRT_H}
        />
        <Print
          w={DOCK.w}
          h={BODY_H * 0.86}
          map={front}
          position={[0, SKIRT_H + BODY_H / 2, DOCK.d / 2 + 0.003]}
        />
        <Solid
          geometry={block(DOCK.w - 0.03, DOCK.d - 0.03, GASKET_H, 0.44)}
          color="#d9d6cd"
          position-y={SKIRT_H + BODY_H}
        />
        <Solid
          geometry={block(DOCK.w - 0.02, DOCK.d - 0.02, CAP_H, 0.44)}
          color="#fbfaf7"
          position-y={DOCK.h - CAP_H}
        />
        <Print
          w={DOCK.w - 0.06}
          h={DOCK.d - 0.06}
          map={top}
          position={[0, DOCK.h + 0.002, 0]}
          rotation-x={-Math.PI / 2}
        />
        <mesh
          ref={glow}
          position={[0, DOCK.h + 0.003, DOCK.d / 2 - 0.06]}
          rotation-x={-Math.PI / 2}
          visible={false}
        >
          <planeGeometry args={[DOCK.w - 0.9, 0.014]} />
          <meshBasicMaterial
            color={mix(colors().primary, "#ffffff", 0.3)}
            toneMapped={false}
          />
        </mesh>
        {SLOTS.map((x) => (
          <group
            key={x}
            position={[x, R + 0.01, -DOCK.d / 2]}
            rotation-x={Math.PI / 2}
          >
            <Solid
              geometry={cylinder(R + 0.045, 0.1)}
              color={FOREST}
              position-y={-0.08}
            />
          </group>
        ))}
      </group>
      {SCREENS.map((_, j) => (
        <LiveScreen key={j} index={j} />
      ))}
    </group>
  );
}
