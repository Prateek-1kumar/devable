import { useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { span, storyOf } from "../content";
import { Fibre, LOCAL } from "../fibre";
import {
  Print,
  Shadow,
  Sheet,
  Solid,
  block,
  colors,
  drawMark,
  easeOut,
  eyebrow,
  paragraph,
  rrect,
  rule,
  setFont,
  useBand,
  useLive,
  useStatic,
  wrap,
} from "../kit";
import { AT } from "../layout";
import { face, usePhotos } from "../photos";

// Beat 3, Reddit, told as the service's own three steps on one stepped dais, each step a level higher, its name
// engraved on the riser and a trace running up from one sheet to the next.
// ① Find the conversations that matter: a research board scans the category's threads and scores them; the one
//    worth entering is picked out. ② Contribute with technical context: in that thread, a useful answer (the
//    product second, never first) earns its votes and becomes the top comment. ③ Strengthen search and AI
//    visibility: the same thread now ranks in Google and is cited as a source in an AI answer.

type Ctx = CanvasRenderingContext2D;

/**
 * The dais: three steps climbing toward the back-right, overlapping where they meet so they read as one piece.
 * Each carries one sheet; `label` is engraved on the step's riser, centred at `labelX` (clear of the step below).
 */
const STEPS = [
  { x: -2.2, z: 1.25, w: 2.9, d: 1.4, h: 0.24, n: "01", label: "Find", labelX: -2.35 },
  { x: 0.15, z: 0, w: 3.2, d: 1.5, h: 0.46, n: "02", label: "Contribute", labelX: 0.3 },
  { x: 2.3, z: -1.3, w: 2.8, d: 1.4, h: 0.68, n: "03", label: "Surface", labelX: 1.95 },
];
/** The three sheets, one per step. */
const BOARD = { x: -2.25, z: 1.3, w: 2.3, h: 1.62, step: 0 };
const THREAD = { x: 0.1, z: 0.0, w: 2.8, h: 2.02, step: 1 };
const FOUND = { x: 2.3, z: -1.35, w: 2.3, h: 1.68, step: 2 };
const R = LOCAL.r;
/**
 * Board → thread → where it surfaces: each link runs across a step's top from one sheet's foot into the riser of
 * the step above, then out across that step's top into the next sheet's foot. `step` is the step it lies on.
 */
const LINKS: { step: number; route: [number, number, number][] }[] = [
  { step: 0, route: [[-1.3, R, 1.3], [-0.95, R, 1.3], [-0.95, R, 0.74]] },
  { step: 1, route: [[-0.95, R, 0.76], [-0.95, R, 0.05]] },
  { step: 1, route: [[1.3, R, 0], [1.6, R, 0], [1.6, R, -0.61]] },
  { step: 2, route: [[1.6, R, -0.59], [1.6, R, -1.3]] },
];

// SAMPLE: the threads the research turns up, best first. The product is the band's document parser.
const SCANNED = 1284;
const WORTH = 37;
const THREADS = [
  { sub: "r/MachineLearning", title: "Handling multi-document PDFs in production?", intent: "High", score: 92 },
  { sub: "r/LocalLLaMA", title: "Best open-source PDF parser for RAG?", intent: "High", score: 78 },
  { sub: "r/dataengineering", title: "Scanned invoices with tables, any luck?", intent: "Medium", score: 54 },
  { sub: "r/devops", title: "Where do you store parsed documents?", intent: "Low", score: 18 },
];
const QUESTION = "How are people handling multi-document PDFs in production?";
const ANSWER = [
  "We split the bundle first, classify each doc, then extract. ",
  "Your Product",
  " handled tables and checkboxes better than our old OCR pipeline.",
];
const ANSWER_LEN = ANSWER.join("").length;
const AUTHOR = { user: "u/doc_nerd", photo: "/services/creators/c7.jpg" };
const PHOTOS = [AUTHOR.photo];
const AI = ["Teams split bundled PDFs first, then extract. ", "Your Product", " comes up most for tables."];
const AI_LEN = AI.join("").length;

// The story, 0..1 while the camera holds.
const scan = (s: number) => easeOut(span(s, 0.02, 0.2));
const rowIn = (s: number, i: number) => span(s, 0.05 + 0.04 * i, 0.1 + 0.04 * i);
const picked = (s: number) => s >= 0.24;
const opened = (s: number) => span(s, 0.3, 0.36);
const answered = (s: number) => span(s, 0.36, 0.5);
const votes = (s: number) => Math.round(12 + 202 * easeOut(span(s, 0.46, 0.6)));
const topComment = (s: number) => s >= 0.6;
const ranked = (s: number) => span(s, 0.64, 0.72);
const cited = (s: number) => span(s, 0.74, 0.86);
const sourced = (s: number) => s >= 0.88;

/** Cuts a highlighted sentence (alternating plain / product parts) to its first `n` characters. */
const cut = (parts: string[], n: number) =>
  parts.map((p) => {
    const part = p.slice(0, Math.max(0, n));
    n -= p.length;
    return part;
  });

/** `text` cut to `maxW` (in the current font), with an ellipsis if it had to be cut. */
function fit(ctx: Ctx, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** A placeholder line, for a sheet whose turn hasn't come. */
const bar = (ctx: Ctx, x: number, y: number, w: number, h = 18) => rrect(ctx, x, y, w, h, h / 2, "#efede7");

// ── Prints (each on an 800-wide grid) ──

function drawBoard(ctx: Ctx, W: number, H: number, s: number) {
  const c = colors();
  const pad = 40;
  drawMark(ctx, "reddit", pad + 18, 52, 36);
  setFont(ctx, 30, 600);
  ctx.letterSpacing = "-0.5px";
  ctx.fillStyle = c.ink;
  ctx.fillText("Conversation research", pad + 50, 63);
  ctx.letterSpacing = "0px";
  // The scan counter.
  setFont(ctx, 22, 500, true);
  ctx.fillStyle = c.muted;
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(SCANNED * scan(s)).toLocaleString("en-US")} scanned`, W - pad, 60);
  ctx.textAlign = "left";
  rule(ctx, pad, 92, W - pad * 2);
  eyebrow(ctx, "Thread", pad, 128, 18);
  eyebrow(ctx, "Intent", 498, 128, 18);
  eyebrow(ctx, "Score", 612, 128, 18);
  THREADS.forEach((t, i) => {
    const y = 154 + i * 86;
    const k = rowIn(s, i);
    if (k <= 0) {
      bar(ctx, pad, y + 14, 200, 14);
      bar(ctx, pad, y + 42, 360, 18);
      return;
    }
    const pick = i === 0 && picked(s);
    ctx.globalAlpha = k;
    if (pick) {
      rrect(ctx, pad - 16, y, W - pad * 2 + 32, 78, 12, "#eef8f2");
      rrect(ctx, pad - 16, y + 12, 5, 54, 2.5, c.primary);
    }
    setFont(ctx, 18, 500, true);
    ctx.fillStyle = c.muted;
    ctx.fillText(t.sub, pad, y + 28);
    setFont(ctx, 24, pick ? 600 : 480);
    ctx.fillStyle = c.ink;
    ctx.fillText(fit(ctx, t.title, 430), pad, y + 60);
    // Intent: a dot and the word.
    const hot = t.intent === "High";
    ctx.beginPath();
    ctx.arc(504, y + 52, 6, 0, Math.PI * 2);
    ctx.fillStyle = hot ? c.primary : t.intent === "Medium" ? "#c9c6bd" : "#e4e2db";
    ctx.fill();
    setFont(ctx, 21, 500);
    ctx.fillStyle = hot ? c.ink : c.muted;
    ctx.fillText(t.intent, 518, y + 59);
    // Score: a bar and its number.
    rrect(ctx, 612, y + 46, 96, 10, 5, "#efede7");
    rrect(ctx, 612, y + 46, 96 * (t.score / 100) * easeOut(k), 10, 5, pick ? c.primary : c.ink);
    setFont(ctx, 21, 600, true);
    ctx.fillStyle = c.ink;
    ctx.textAlign = "right";
    ctx.fillText(String(t.score), W - pad, y + 58);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  });
  // The verdict.
  const y = H - 36;
  if (picked(s)) {
    ctx.beginPath();
    ctx.arc(pad + 7, y - 8, 7, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();
    setFont(ctx, 23, 560);
    ctx.fillStyle = c.ink;
    ctx.fillText(`${WORTH} worth entering`, pad + 24, y);
    setFont(ctx, 21, 600, true);
    ctx.fillStyle = c.deep;
    ctx.textAlign = "right";
    ctx.fillText("Entering #1 →", W - pad, y);
    ctx.textAlign = "left";
  } else bar(ctx, pad, y - 18, 220);
}

function drawThread(ctx: Ctx, W: number, H: number, s: number) {
  const c = colors();
  const pad = 40;
  const o = opened(s);
  // Until the board picks it, the thread is a skeleton.
  if (o <= 0) {
    bar(ctx, pad, 40, 260);
    bar(ctx, pad, 100, W - pad * 2, 30);
    bar(ctx, pad, 146, 420, 30);
    bar(ctx, pad, 232, W - pad * 2);
    bar(ctx, pad, 268, W - pad * 2 - 120);
    bar(ctx, pad, 304, 380);
    return;
  }
  ctx.globalAlpha = o;
  drawMark(ctx, "reddit", pad + 16, 50, 32);
  setFont(ctx, 25, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("r/MachineLearning", pad + 44, 59);
  const sw = ctx.measureText("r/MachineLearning").width;
  setFont(ctx, 21, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText("· u/pdf_pipeline · 6h", pad + 52 + sw, 59);
  setFont(ctx, 35, 620);
  ctx.letterSpacing = "-0.7px";
  ctx.fillStyle = c.ink;
  wrap(ctx, QUESTION, W - pad * 2).forEach((line, i) => ctx.fillText(line, pad, 118 + i * 44));
  ctx.letterSpacing = "0px";
  setFont(ctx, 20, 500);
  ctx.fillStyle = c.muted;
  ctx.fillText("▲ 1.2k     96 comments", pad, 202);
  rule(ctx, pad, 224, W - pad * 2);

  // The answer.
  const a = answered(s);
  if (a > 0) {
    const top = 252;
    face(ctx, AUTHOR.photo, pad + 20, top + 20, 20);
    setFont(ctx, 23, 600);
    ctx.fillStyle = c.ink;
    ctx.fillText(AUTHOR.user, pad + 52, top + 28);
    const uw = ctx.measureText(AUTHOR.user).width;
    setFont(ctx, 20, 450);
    ctx.fillStyle = c.muted;
    ctx.fillText("· 1d", pad + 60 + uw, top + 28);
    if (topComment(s)) {
      // The badge sits with the author, so it never crowds the answer.
      const bx = pad + 60 + uw + ctx.measureText("· 1d").width + 16;
      setFont(ctx, 19, 600);
      const label = "Top comment";
      const tw = ctx.measureText(label).width + 40;
      rrect(ctx, bx, top + 2, tw, 36, 18, c.primary);
      ctx.beginPath();
      ctx.arc(bx + 17, top + 20, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = c.ink;
      ctx.fill();
      ctx.fillText(label, bx + 28, top + 27);
    }
    const end = paragraph(ctx, cut(ANSWER, Math.round(a * ANSWER_LEN)), pad, top + 96, W - pad * 2, 27, 39);
    // Votes: the count climbs as the community agrees.
    const n = votes(s);
    const hot = n > 12;
    setFont(ctx, 20, 650);
    const label = `▲ ${n}`;
    const vw = ctx.measureText(label).width + 30;
    const vy = Math.max(end, top + 174) + 58;
    rrect(ctx, pad, vy - 26, vw, 36, 18, hot ? "#fdeee8" : "#f4f2eb");
    ctx.fillStyle = hot ? "#e0481d" : c.muted;
    ctx.fillText(label, pad + 15, vy - 1);
    setFont(ctx, 19, 500);
    ctx.fillStyle = c.muted;
    ctx.fillText("Reply     Share", pad + vw + 22, vy - 1);
    // A quieter reply beneath, so the climb has company.
    const ry = vy + 60;
    if (ry < H - 10) {
      rrect(ctx, pad + 8, ry - 22, 3, 30, 1.5, "#e4e2db");
      setFont(ctx, 19, 500);
      ctx.fillStyle = c.muted;
      ctx.fillText("u/ocr_veteran  ▲ 9   Tables were always the pain for us.", pad + 26, ry);
    }
  }
  ctx.globalAlpha = 1;
}

function drawFound(ctx: Ctx, W: number, H: number, s: number) {
  const c = colors();
  const pad = 40;
  // Google: the thread ranks for the category's query.
  drawMark(ctx, "google", pad + 16, 52, 32);
  rrect(ctx, pad + 48, 26, W - pad * 2 - 48, 52, 26, "#ffffff", "#dadce0", 2);
  setFont(ctx, 22, 450);
  ctx.fillStyle = c.ink;
  ctx.fillText("multi-document pdf parsing", pad + 72, 60);
  const g = ranked(s);
  const gy = 108;
  if (g <= 0) {
    bar(ctx, pad, gy + 18, 260, 14);
    bar(ctx, pad, gy + 50, W - pad * 2 - 80, 22);
    bar(ctx, pad, gy + 88, 300, 14);
  } else {
    ctx.globalAlpha = g;
    rrect(ctx, pad - 14, gy, W - pad * 2 + 28, 132, 14, "#f6fbf8");
    drawMark(ctx, "reddit", pad + 12, gy + 32, 24);
    setFont(ctx, 19, 450);
    ctx.fillStyle = "#4d5156";
    ctx.fillText("reddit.com › r/MachineLearning", pad + 34, gy + 39);
    setFont(ctx, 26, 500);
    ctx.fillStyle = "#1a0dab";
    ctx.fillText("How are people handling multi-document…", pad, gy + 80);
    setFont(ctx, 19, 450);
    ctx.fillStyle = c.muted;
    ctx.fillText("96 comments · Top answer ▲ 214", pad, gy + 114);
    // Its place on the page.
    rrect(ctx, W - pad - 64, gy + 14, 64, 36, 18, c.ink);
    setFont(ctx, 19, 650, true);
    ctx.fillStyle = c.primary;
    ctx.textAlign = "center";
    ctx.fillText("#2", W - pad - 32, gy + 39);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }
  rule(ctx, pad, 270, W - pad * 2);
  // An AI answer: the thread is one of its sources.
  const ay = 300;
  drawMark(ctx, "chatgpt", pad + 14, ay + 18, 28);
  setFont(ctx, 23, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("ChatGPT", pad + 40, ay + 27);
  const k = cited(s);
  if (k <= 0) {
    bar(ctx, pad, ay + 62, W - pad * 2, 20);
    bar(ctx, pad, ay + 98, W - pad * 2 - 140, 20);
    bar(ctx, pad, H - 76, 260, 40);
    return;
  }
  paragraph(ctx, cut(AI, Math.round(k * AI_LEN)), pad, ay + 80, W - pad * 2, 26, 37);
  // Sources: the thread first, picked out once cited.
  const sy = H - 78;
  const on = sourced(s);
  setFont(ctx, 20, 560);
  const t1 = "r/MachineLearning";
  const w1 = ctx.measureText(t1).width + 80;
  rrect(ctx, pad, sy, w1, 44, 22, on ? c.lightGreenSoft : "#f4f2eb");
  rrect(ctx, pad + 10, sy + 9, 26, 26, 13, on ? c.primary : "#e4e2db");
  setFont(ctx, 15, 700, true);
  ctx.fillStyle = c.ink;
  ctx.textAlign = "center";
  ctx.fillText("1", pad + 23, sy + 28);
  ctx.textAlign = "left";
  setFont(ctx, 20, 560);
  ctx.fillText(t1, pad + 46, sy + 29);
  const t2 = "yourproduct.dev";
  rrect(ctx, pad + w1 + 12, sy, ctx.measureText(t2).width + 36, 44, 22, undefined, "rgba(23,44,33,0.14)", 2);
  ctx.fillStyle = c.muted;
  ctx.fillText(t2, pad + w1 + 30, sy + 29);
}

// ── Pieces ──

type Draw = (ctx: Ctx, W: number, H: number, s: number) => void;

/** A step's riser: its number and name, engraved. */
function drawRiser(ctx: Ctx, w: number, h: number, i: number) {
  const c = colors();
  const st = STEPS[i];
  ctx.textBaseline = "middle";
  setFont(ctx, h * 0.5, 500, true);
  ctx.letterSpacing = `${h * 0.06}px`;
  const nw = ctx.measureText(st.n).width;
  ctx.letterSpacing = "0px";
  setFont(ctx, h * 0.56, 600);
  const tw = ctx.measureText(st.label).width;
  const x = (st.labelX - (st.x - st.w / 2)) * (w / st.w) - (nw + h * 0.4 + tw) / 2;
  setFont(ctx, h * 0.5, 500, true);
  ctx.letterSpacing = `${h * 0.06}px`;
  ctx.fillStyle = c.muted;
  ctx.fillText(st.n, x, h / 2 + 1);
  ctx.letterSpacing = "0px";
  setFont(ctx, h * 0.56, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText(st.label, x + nw + h * 0.4, h / 2 + 1);
}

/** One step of the dais, with its riser engraved. */
function Step({ i }: { i: number }) {
  const st = STEPS[i];
  const face = Math.min(0.16, st.h * 0.66);
  const map = useStatic(
    st.w,
    face,
    useCallback((ctx: Ctx, w: number, h: number) => drawRiser(ctx, w, h, i), [i]),
    1.8,
  );
  return (
    <group position={[st.x, 0, st.z]}>
      <Solid geometry={block(st.w, st.d, st.h, 0.06)} color={i === 1 ? "#f6f5f1" : "#f1efe9"} />
      <Print
        w={st.w}
        h={face}
        map={map}
        position={[0, st.h - face / 2 - Math.min(0.03, (st.h - face) / 2), st.d / 2 + 0.003]}
      />
    </group>
  );
}

/** A sheet whose print follows the beat's story (redrawn in steps), on an 800-wide grid, standing on its step. */
function StorySheet({
  at,
  draw,
  photos,
}: {
  at: { x: number; z: number; w: number; h: number; step: number };
  draw: Draw;
  photos?: string[];
}) {
  const bandRef = useBand();
  const render = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) => {
      const k = w / 800;
      ctx.save();
      ctx.scale(k, k);
      rrect(ctx, 0, 0, 800, h / k, 18, "#ffffff");
      draw(ctx, 800, h / k, Math.max(0, v));
      ctx.restore();
    },
    [draw],
  );
  const [map, set, paint] = useLive(at.w - 0.05, at.h - 0.05, render, 1.4);
  usePhotos(photos ?? NONE, paint);
  useFrame(() => set(Math.round(storyOf(bandRef.current, 3) * 120) / 120));
  return <Sheet w={at.w} h={at.h} map={map} position={[at.x, STEPS[at.step].h, at.z]} />;
}
const NONE: string[] = [];

export function RedditStation() {
  return (
    <group position={AT.reddit}>
      <Shadow w={9.4} d={5.2} opacity={0.07} position={[0.05, 0.001, -0.05]} />
      {STEPS.map((_, i) => (
        <Step key={i} i={i} />
      ))}
      {LINKS.map((link, i) => (
        <group key={i} position-y={STEPS[link.step].h}>
          <Fibre route={link.route} />
        </group>
      ))}
      <StorySheet at={BOARD} draw={drawBoard} />
      <StorySheet at={THREAD} draw={drawThread} photos={PHOTOS} />
      <StorySheet at={FOUND} draw={drawFound} />
    </group>
  );
}
