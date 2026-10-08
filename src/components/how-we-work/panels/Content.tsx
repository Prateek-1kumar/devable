import { C, Card, Check, DATA, Mono, PanelSvg, clamp01, easeOut, lerp, outro, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 03 Content Engine. A production checklist on the left works through Brief →
// Research → Code built and tested → Technical review → Publish, one step at a
// time, while the article on the right assembles in sync: the title, two lines
// of copy, a code example that types in and is marked "runs", an engineer's
// review badge, and finally the Published state.

const DURATION = 9.5;
const SETTLE = 8.6;

// ── Layout ──────────────────────────────────────────────────────────────────
const H = 252;
const TOP = (400 - H) / 2;
const LIST = { x: 39, y: TOP, w: 164, h: H };
const DOC = { x: 215, y: TOP, w: 226, h: H };
const PAD = 16;
const HEAD_H = 38;

// ── The checklist ───────────────────────────────────────────────────────────
type Step = { label: string; status: readonly (readonly [number, string])[]; at: number; done: number };
const STEPS: readonly Step[] = [
  { label: "Brief", status: [[0.35, "Outlining…"]], at: 0.35, done: 1.2 },
  { label: "Research", status: [[1.3, "Reading docs…"]], at: 1.3, done: 2.2 },
  {
    label: "Code built & tested",
    status: [
      [2.3, "Writing code…"],
      [3.55, "Running tests…"],
    ],
    at: 2.3,
    done: 4.35,
  },
  { label: "Technical review", status: [[4.45, "Engineer reviewing…"]], at: 4.45, done: 6.05 },
  { label: "Publish", status: [[6.4, "Publishing…"]], at: 6.4, done: 7.15 },
];
const ROW = 40;
const rowY = (i: number) => LIST.y + HEAD_H + 24 + i * ROW;
const DOT_X = LIST.x + PAD + 7;

// ── The article, in sync ───────────────────────────────────────────────────
const IN = DOC.x + 14;
const TITLE = ["Connection pooling for", "serverless Postgres"];
const TITLE_LEN = TITLE[0].length + TITLE[1].length;
const TITLE_AT = [0.55, 0.6] as const;
const COPY_AT = 1.5;
const COPY_W = [DOC.w - 28, DOC.w - 28 - 64];

type Tok = readonly [string, string];
const KW = DATA.violet;
const STR = DATA.teal;
const ID = C.ink;
const PUN = C.muted;
const CODE: readonly (readonly Tok[])[] = [
  [["import", KW], [" { Pool } ", ID], ["from", KW], [' "pg"', STR], [";", PUN]],
  [["const", KW], [" pool = ", ID], ["new", KW], [" Pool", ID], ["();", PUN]],
  [["await", KW], [" pool.", ID], ["query", ID], ["(", PUN], ['"SELECT 1"', STR], [");", PUN]],
];
const LINE_LEN = CODE.map((l) => l.reduce((m, [s]) => m + s.length, 0));
const LINE_START = LINE_LEN.map((_, i) => LINE_LEN.slice(0, i).reduce((a, b) => a + b, 0));
const CODE_LEN = LINE_LEN.reduce((a, b) => a + b, 0);
const CODE_BOX = { x: IN, y: DOC.y + 128, w: DOC.w - 28, h: 78 };
const CODE_FS = 10;
const CHAR = CODE_FS * 0.6;
const CODE_PITCH = 15;
const codeLineY = (i: number) => CODE_BOX.y + 40 + i * CODE_PITCH;
const CODE_IN = 2.35;
const TYPE = [2.6, 0.95] as const;
const RUNS = 4.1;
// The reviewer's attention moves down the code, one line at a time.
const REVIEW = [4.7, 1.2] as const;
const BADGE = 6.15;
const BADGE_Y = DOC.y + 229;

/** Fade plus a small rise, for entrances. */
const enter = (t: number, at: number, dur = 0.45) => ramp(t, at, dur, easeOut);
const rise = (k: number) => `translate(0 ${(1 - k) * 5})`;

/** The first `n` characters of a tokenised line. */
function typed(line: readonly Tok[], n: number) {
  const out: Tok[] = [];
  for (const [s, c] of line) {
    if (n <= 0) break;
    out.push([s.slice(0, n), c]);
    n -= s.length;
  }
  return out;
}

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);

  // Article state.
  const titleChars = Math.round(ramp(t, TITLE_AT[0], TITLE_AT[1], (x) => x) * TITLE_LEN);
  const copy = ramp(t, COPY_AT, 0.6, easeOut);
  const codeIn = enter(t, CODE_IN);
  const codeChars = Math.round(ramp(t, TYPE[0], TYPE[1], (x) => x) * CODE_LEN);
  const codeTyping = t > TYPE[0] - 0.1 && t < TYPE[0] + TYPE[1] + 0.25;
  const runs = enter(t, RUNS, 0.4);
  const badge = enter(t, BADGE, 0.5);
  const live = ramp(t, STEPS[4].done, 0.4);

  const codeLines = CODE.map((line, i) => {
    const n = Math.max(0, Math.min(LINE_LEN[i], codeChars - LINE_START[i]));
    return { toks: typed(line, n), n };
  });
  const typingLine = codeLines.findIndex((l, i) => l.n < LINE_LEN[i]);
  const caretLine = typingLine < 0 ? CODE.length - 1 : typingLine;

  // Review highlight: a quiet wash that steps down the three lines.
  const rk = clamp01((t - REVIEW[0]) / REVIEW[1]);
  const reviewOn = Math.min(ramp(t, REVIEW[0] - 0.2, 0.3), 1 - ramp(t, REVIEW[0] + REVIEW[1], 0.3));
  const reviewY = lerp(codeLineY(0), codeLineY(2), easeInOutSteps(rk));

  return (
    <PanelSvg t={t}>
      {/* ── Production checklist ── */}
      <Card x={LIST.x} y={LIST.y} w={LIST.w} h={LIST.h} />
      <Mono x={LIST.x + PAD} y={LIST.y + 24} size={9} fill={C.ink}>
        Production
      </Mono>
      <line x1={LIST.x} x2={LIST.x + LIST.w} y1={LIST.y + HEAD_H} y2={LIST.y + HEAD_H} stroke={C.hair} />

      {/* The rail between step markers: grey, turning green as steps complete. */}
      {STEPS.slice(0, -1).map((s, i) => {
        const y0 = rowY(i) - 4 + 10;
        const y1 = rowY(i + 1) - 4 - 10;
        const k = ramp(t, s.done, 0.35) * o;
        return (
          <g key={s.label}>
            <line x1={DOT_X} x2={DOT_X} y1={y0} y2={y1} stroke={C.line} />
            <line x1={DOT_X} x2={DOT_X} y1={y0} y2={lerp(y0, y1, k)} stroke={C.primary} strokeOpacity={0.55} opacity={k > 0 ? 1 : 0} />
          </g>
        );
      })}

      {STEPS.map((s, i) => {
        const y = rowY(i);
        const cur = Math.min(ramp(t, s.at, 0.3), 1 - ramp(t, s.done, 0.3)) * o;
        const done = ramp(t, s.done, 0.4) * o;
        const status = s.status.reduce((acc, [at, text]) => (t >= at ? text : acc), s.status[0][1]);
        const statusK = Math.min(enter(t, s.at + 0.1, 0.35), 1 - ramp(t, s.done - 0.1, 0.3)) * o;
        const breathe = 0.5 + 0.5 * Math.sin((t - s.at) * Math.PI * 1.6);
        return (
          <g key={s.label}>
            {/* Waiting: hollow. */}
            <circle cx={DOT_X} cy={y - 4} r={7} fill={C.card} stroke={C.line} />
            {/* Current: a coral dot with a soft, breathing halo. */}
            <g opacity={cur}>
              <circle cx={DOT_X} cy={y - 4} r={7} fill={C.accentWash} stroke={C.accentLine} />
              <circle cx={DOT_X} cy={y - 4} r={3 + 2.2 * breathe} fill={C.accent} opacity={0.16} />
              <circle cx={DOT_X} cy={y - 4} r={3} fill={C.accent} />
            </g>
            {done > 0 && <Check x={DOT_X} y={y - 4} r={7} k={done} />}
            <text x={LIST.x + PAD + 22} y={y} fontSize={11.5} fontWeight={550} fill={C.ink} opacity={lerp(0.5, 1, Math.max(cur, done))}>
              {s.label}
            </text>
            {statusK > 0 && (
              <text x={LIST.x + PAD + 22} y={y + 15} fontSize={11.5} fill={C.accent} opacity={statusK} transform={rise(statusK)}>
                {status}
              </text>
            )}
          </g>
        );
      })}

      {/* ── The article ── */}
      <Card x={DOC.x} y={DOC.y} w={DOC.w} h={DOC.h} />
      <Mono x={IN} y={DOC.y + 24} size={9} fill={C.muted}>
        Article
      </Mono>
      {/* Status: draft → published. */}
      <g transform={`translate(${DOC.x + DOC.w - 14} ${DOC.y + 10})`}>
        <rect x={-84} width={84} height={19} rx={9.5} fill={C.paper} stroke={C.line} opacity={1 - live * o} />
        <rect x={-84} width={84} height={19} rx={9.5} fill={C.primarySoft} opacity={live * o} />
        <circle cx={-72} cy={9.5} r={3} fill={C.muted} opacity={(1 - live * o) * 0.6} />
        <circle cx={-72} cy={9.5} r={3} fill={C.primary} opacity={live * o} />
        <Mono x={-62} y={12.8} size={9} fill={C.muted} opacity={1 - live * o}>
          Draft
        </Mono>
        <Mono x={-62} y={12.8} size={9} fill={C.primary} opacity={live * o}>
          Published
        </Mono>
      </g>
      <line x1={DOC.x} x2={DOC.x + DOC.w} y1={DOC.y + HEAD_H} y2={DOC.y + HEAD_H} stroke={C.hair} />

      {/* Title: placeholders until the brief lands, then it types in. */}
      {TITLE.map((line, i) => {
        const start = i === 0 ? 0 : TITLE[0].length;
        const shown = line.slice(0, Math.max(0, titleChars - start));
        const y = DOC.y + 66 + i * 20;
        return (
          <g key={i}>
            <rect x={IN} y={y - 10} width={i === 0 ? 150 : 120} height={10} rx={3} fill={C.paper} opacity={shown.length === 0 ? 1 : 1 - o} />
            <text x={IN} y={y} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={C.ink} opacity={o}>
              {shown}
            </text>
          </g>
        );
      })}

      {/* Two lines of copy from the research. */}
      {COPY_W.map((w, i) => (
        <g key={i}>
          <rect x={IN} y={DOC.y + 101 + i * 11} width={w} height={4.5} rx={2.25} fill={C.paper} />
          <rect x={IN} y={DOC.y + 101 + i * 11} width={w * clamp01(copy * 2 - i)} height={4.5} rx={2.25} fill={C.line} opacity={o} />
        </g>
      ))}

      {/* Code example: types in, then is marked as running. */}
      <rect x={CODE_BOX.x} y={CODE_BOX.y} width={CODE_BOX.w} height={CODE_BOX.h} rx={8} fill={C.paper} stroke={C.line} strokeDasharray={codeIn > 0 ? undefined : "3 3"} opacity={lerp(0.6, 1, codeIn * o)} />
      <g opacity={codeIn * o} transform={rise(codeIn)}>
        <Mono x={CODE_BOX.x + 12} y={CODE_BOX.y + 18} size={9} fill={C.muted} style={{ textTransform: "none" }} letterSpacing="0.02em">
          db.ts
        </Mono>
        <line x1={CODE_BOX.x} x2={CODE_BOX.x + CODE_BOX.w} y1={CODE_BOX.y + 26} y2={CODE_BOX.y + 26} stroke={C.hair} />
        {/* Reviewer's line highlight. */}
        <rect x={CODE_BOX.x + 1} y={reviewY - 11} width={CODE_BOX.w - 2} height={15} fill={C.accentWash} opacity={reviewOn} />
        <rect x={CODE_BOX.x + 1} y={reviewY - 10} width={2} height={13} rx={1} fill={C.accent} opacity={reviewOn} />
        {codeLines.map((l, i) => (
          <text key={i} x={CODE_BOX.x + 12} y={codeLineY(i)} fontFamily="var(--font-mono)" fontSize={CODE_FS} xmlSpace="preserve" style={{ whiteSpace: "pre" }}>
            {l.toks.map(([s, c], j) => (
              <tspan key={j} fill={c}>
                {s}
              </tspan>
            ))}
          </text>
        ))}
        {codeTyping && (
          <rect x={CODE_BOX.x + 12 + codeLines[caretLine].n * CHAR + 0.5} y={codeLineY(caretLine) - 9} width={1.2} height={11} fill={C.accent} />
        )}
        {/* ✓ runs */}
        <g opacity={runs * o} transform={`translate(${CODE_BOX.x + CODE_BOX.w - 10} ${CODE_BOX.y + 5}) ${rise(runs)}`}>
          <rect x={-56} width={56} height={17} rx={8.5} fill={C.primarySoft} />
          <path d="M-46 8.6 l2.6 2.6 l4.8 -5" fill="none" stroke={C.primary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Mono x={-34} y={11.8} size={9} fill={C.primary}>
            runs
          </Mono>
        </g>
      </g>

      {/* Reviewed by an engineer. */}
      <rect x={IN} y={BADGE_Y - 12} width={DOC.w - 28} height={24} rx={12} fill="none" stroke={C.line} strokeDasharray="3 3" opacity={(1 - badge) * o * 0.8} />
      <g opacity={badge * o} transform={rise(badge)}>
        <rect x={IN} y={BADGE_Y - 12} width={DOC.w - 28} height={24} rx={12} fill={C.card} stroke={C.line} />
        <circle cx={IN + 12} cy={BADGE_Y} r={9} fill={C.primarySoft} />
        <text x={IN + 12} y={BADGE_Y + 3.3} fontSize={9} fontWeight={650} fill={C.primary} textAnchor="middle">
          MC
        </text>
        <text x={IN + 27} y={BADGE_Y + 4} fontSize={11.5} fontWeight={550} fill={C.ink}>
          Reviewed by an engineer
        </text>
        <Check x={IN + DOC.w - 28 - 13} y={BADGE_Y} r={6.5} k={ramp(t, BADGE + 0.2, 0.4)} />
      </g>
    </PanelSvg>
  );
}

/** Eases between three resting lines (0, 0.5, 1), so the highlight dwells on each. */
function easeInOutSteps(k: number) {
  const seg = k * 3; // dwell, move, dwell, move, dwell… compressed into 3 parts
  if (seg < 1) return 0;
  if (seg < 1.5) return 0.5 * easeOut((seg - 1) / 0.5);
  if (seg < 2) return 0.5;
  if (seg < 2.5) return 0.5 + 0.5 * easeOut((seg - 2) / 0.5);
  return 1;
}

const content: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default content;
