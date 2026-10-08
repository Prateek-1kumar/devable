import { C, Card, Check, DATA, Mono, PanelSvg, clamp01, easeOut, lerp, outro, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 03 Content Engine. A production checklist on the left works through Brief →
// Research → Code built and tested → Technical review → Publish, with deliberate,
// soothing pacing. The article on the right assembles in sync: title typing in,
// copy lines, a runnable code example verified with "✓ runs", an engineer's review badge,
// and finally the Published state, settling into a calm reading period.

const DURATION = 27.0;
const SETTLE = 12.0;

// ── Layout ──────────────────────────────────────────────────────────────────
const H = 252;
const TOP = (400 - H) / 2;
const LIST = { x: 39, y: TOP, w: 164, h: H };
const DOC = { x: 215, y: TOP, w: 226, h: H };
const PAD = 16;
const HEAD_H = 38;

// ── The checklist ───────────────────────────────────────────────────────────
type Step = {
  label: string;
  status: readonly (readonly [number, string])[];
  at: number;
  done: number;
};

const STEPS: readonly Step[] = [
  { label: "Brief", status: [[0.5, "Outlining…"]], at: 0.5, done: 2.1 },
  { label: "Research", status: [[2.2, "Reading docs…"]], at: 2.2, done: 4.0 },
  {
    label: "Code built & tested",
    status: [
      [4.2, "Writing db.ts…"],
      [6.6, "Running tests…"],
    ],
    at: 4.2,
    done: 7.6,
  },
  { label: "Technical review", status: [[7.8, "Engineer reviewing…"]], at: 7.8, done: 10.2 },
  { label: "Publish", status: [[10.4, "Publishing…"]], at: 10.4, done: 11.6 },
];
const ROW = 40;
const rowY = (i: number) => LIST.y + HEAD_H + 24 + i * ROW;
const DOT_X = LIST.x + PAD + 7;

// ── The article, in sync ───────────────────────────────────────────────────
const IN = DOC.x + 14;
const TITLE = ["Connection pooling for", "serverless Postgres"];
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
const CODE_BOX = { x: IN, y: DOC.y + 128, w: DOC.w - 28, h: 78 };
const CODE_FS = 10;
const CODE_PITCH = 15;
const codeLineY = (i: number) => CODE_BOX.y + 40 + i * CODE_PITCH;
const RUNS = 7.1;
const REVIEW = [8.0, 1.8] as const; // reviewer inspection
const BADGE = 9.2;
const BADGE_Y = DOC.y + 229;

const enter = (t: number, at: number, dur = 0.45) => ramp(t, at, dur, easeOut);
const rise = (k: number) => `translate(0 ${(1 - k) * 5})`;

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);

  const live = ramp(t, STEPS[4].done, 0.4);
  const reviewed = ramp(t, BADGE, 0.4);
  const runs = ramp(t, RUNS, 0.4);

  // Review highlight: a quiet wash that steps down the three lines.
  const rk = clamp01((t - REVIEW[0]) / REVIEW[1]);
  const reviewActive = t >= REVIEW[0] && t <= REVIEW[0] + REVIEW[1];
  const reviewY = lerp(codeLineY(0), codeLineY(2), easeInOutSteps(rk));

  return (
    <PanelSvg t={t}>
      {/* ── Production checklist ── */}
      <Card x={LIST.x} y={LIST.y} w={LIST.w} h={LIST.h} />
      <Mono x={LIST.x + PAD} y={LIST.y + 24} size={9} fill={C.ink}>
        Production
      </Mono>
      <line x1={LIST.x} x2={LIST.x + LIST.w} y1={LIST.y + HEAD_H} y2={LIST.y + HEAD_H} stroke={C.hair} />

      {/* The rail between step markers: turning green as steps complete. */}
      {STEPS.slice(0, -1).map((s, i) => {
        const y0 = rowY(i) - 4 + 10;
        const y1 = rowY(i + 1) - 4 - 10;
        const k = ramp(t, s.done, 0.35) * o;
        return (
          <g key={s.label}>
            <line x1={DOT_X} x2={DOT_X} y1={y0} y2={y1} stroke={C.hair} />
            <line
              x1={DOT_X}
              x2={DOT_X}
              y1={y0}
              y2={lerp(y0, y1, k)}
              stroke={C.lightGreen}
              strokeOpacity={0.8}
              opacity={k > 0 ? 1 : 0}
            />
          </g>
        );
      })}

      {STEPS.map((s, i) => {
        const y = rowY(i);
        const cur = Math.min(ramp(t, s.at, 0.3), 1 - ramp(t, s.done, 0.3)) * o;
        const done = ramp(t, s.done, 0.4) * o;
        const status = s.status.reduce((acc, [at, text]) => (t >= at ? text : acc), s.status[0][1]);
        const statusK = Math.min(enter(t, s.at + 0.1, 0.35), 1 - ramp(t, s.done - 0.1, 0.3)) * o;
        const breathe = 0.5 + 0.5 * Math.sin((t - s.at) * Math.PI * 1.4);
        return (
          <g key={s.label}>
            <circle cx={DOT_X} cy={y - 4} r={7} fill={C.card} stroke={C.hair} />
            <g opacity={cur}>
              <circle cx={DOT_X} cy={y - 4} r={7} fill={C.accentWash} />
              <circle cx={DOT_X} cy={y - 4} r={3 + 2.2 * breathe} fill={C.accent} opacity={0.16} />
              <circle cx={DOT_X} cy={y - 4} r={3} fill={C.accent} />
            </g>
            {done > 0 && <Check x={DOT_X} y={y - 4} r={7} k={done} color={C.lightGreen} />}
            <text
              x={LIST.x + PAD + 22}
              y={y}
              fontSize={11.5}
              fontWeight={550}
              fill={C.ink}
              opacity={lerp(0.5, 1, Math.max(cur, done))}
            >
              {s.label}
            </text>
            {statusK > 0 && (
              <text
                x={LIST.x + PAD + 22}
                y={y + 15}
                fontSize={11.5}
                fill={C.accent}
                opacity={statusK}
                transform={rise(statusK)}
              >
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

      {/* Status: glowing brand presence, ZERO boxed wireframe borders */}
      <g transform={`translate(${DOC.x + DOC.w - 18} ${DOC.y + 22})`}>
        {/* Draft state: quiet dot, clean typography, NO border box */}
        <g opacity={1 - live}>
          <circle cx={-38} cy={-2.5} r={2.5} fill={C.muted} opacity={0.6} />
          <Mono x={-31} y={0.5} size={9} fill={C.muted} letterSpacing="0.1em">
            Draft
          </Mono>
        </g>
        {/* Published state: soft glowing emerald brand aura, NO border box */}
        <g opacity={live}>
          <circle cx={-56} cy={-2.5} r={7} fill={C.lightGreen} opacity={0.25} />
          <circle cx={-56} cy={-2.5} r={3} fill={C.lightGreen} />
          <Mono x={-46} y={0.5} size={9} fill={C.lightGreen} fontWeight={600} letterSpacing="0.1em">
            Published
          </Mono>
        </g>
      </g>
      <line x1={DOC.x} x2={DOC.x + DOC.w} y1={DOC.y + HEAD_H} y2={DOC.y + HEAD_H} stroke={C.hair} strokeOpacity={0.6} />

      {/* Title: ALWAYS visible so card is never blank */}
      {TITLE.map((line, i) => {
        const y = DOC.y + 66 + i * 20;
        return (
          <text
            key={i}
            x={IN}
            y={y}
            fontSize={15}
            fontWeight={600}
            letterSpacing="-0.02em"
            fill={C.ink}
            opacity={o}
          >
            {line}
          </text>
        );
      })}

      {/* Two lines of copy: ALWAYS visible */}
      {COPY_W.map((w, i) => (
        <rect
          key={i}
          x={IN}
          y={DOC.y + 101 + i * 11}
          width={w}
          height={4.5}
          rx={2.25}
          fill={C.line}
          opacity={o * 0.7}
        />
      ))}

      {/* Code example: clean seamless paper surface, ZERO border strokes */}
      <rect
        x={CODE_BOX.x}
        y={CODE_BOX.y}
        width={CODE_BOX.w}
        height={CODE_BOX.h}
        rx={8}
        fill={C.paper}
      />
      <g opacity={o}>
        <Mono
          x={CODE_BOX.x + 12}
          y={CODE_BOX.y + 18}
          size={9}
          fill={C.muted}
          style={{ textTransform: "none" }}
          letterSpacing="0.02em"
        >
          db.ts
        </Mono>
        {/* Reviewer line scan highlight */}
        {reviewActive && (
          <>
            <rect
              x={CODE_BOX.x + 1}
              y={reviewY - 11}
              width={CODE_BOX.w - 2}
              height={15}
              fill={C.accentWash}
              opacity={0.8}
            />
            <rect
              x={CODE_BOX.x + 1}
              y={reviewY - 10}
              width={2.5}
              height={13}
              rx={1}
              fill={C.accent}
              opacity={0.9}
            />
          </>
        )}
        {CODE.map((line, i) => (
          <text
            key={i}
            x={CODE_BOX.x + 12}
            y={codeLineY(i)}
            fontFamily="var(--font-mono)"
            fontSize={CODE_FS}
            xmlSpace="preserve"
            style={{ whiteSpace: "pre" }}
          >
            {line.map(([s, c], j) => (
              <tspan key={j} fill={c}>
                {s}
              </tspan>
            ))}
          </text>
        ))}

        {/* ✓ runs badge: borderless soft green pill */}
        <g
          opacity={runs * o}
          transform={`translate(${CODE_BOX.x + CODE_BOX.w - 10} ${CODE_BOX.y + 5})`}
        >
          <rect x={-56} width={56} height={18} rx={9} fill={C.lightGreenSoft} />
          <path
            d="M-46 9.2 l2.6 2.6 l4.8 -5"
            fill="none"
            stroke={C.lightGreen}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Mono x={-34} y={12.4} size={9} fill={C.lightGreen} fontWeight={600}>
            runs
          </Mono>
        </g>
      </g>

      {/* Reviewed by an engineer: clean, borderless verified badge */}
      <g opacity={o}>
        <rect x={IN} y={BADGE_Y - 12} width={DOC.w - 28} height={24} rx={12} fill={C.paper} />
        <circle cx={IN + 12} cy={BADGE_Y} r={8.5} fill={reviewed > 0.5 ? C.lightGreenSoft : C.card} />
        <text
          x={IN + 12}
          y={BADGE_Y + 3.2}
          fontSize={8.5}
          fontWeight={650}
          fill={reviewed > 0.5 ? C.lightGreen : C.muted}
          textAnchor="middle"
        >
          MC
        </text>
        <text x={IN + 26} y={BADGE_Y + 3.8} fontSize={11} fontWeight={550} fill={C.ink}>
          Reviewed by an engineer
        </text>
        {reviewed > 0.5 ? (
          <Check x={IN + DOC.w - 28 - 12} y={BADGE_Y} r={6} k={reviewed} color={C.lightGreen} />
        ) : (
          <circle cx={IN + DOC.w - 28 - 12} cy={BADGE_Y} r={3} fill={C.line} />
        )}
      </g>
    </PanelSvg>
  );
}

function easeInOutSteps(k: number) {
  const seg = k * 3;
  if (seg < 1) return 0;
  if (seg < 1.5) return 0.5 * easeOut((seg - 1) / 0.5);
  if (seg < 2) return 0.5;
  if (seg < 2.5) return 0.5 + 0.5 * easeOut((seg - 2) / 0.5);
  return 1;
}

const content: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default content;
