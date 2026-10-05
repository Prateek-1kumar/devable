import { STEPS } from "../content";
import { C, Card, Check, DATA, Lines, Mark, Mono, PanelSvg, blip, clamp01, easeOut, lerp, outro, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 03 Content Engine. Beginning: a content brief fills in: target query, search
// volume, intent, audience and a four-part outline. Work: each outline item lifts
// out of the brief and lands as a section of the article; a code example types
// in and a comparison table fills. Result: the article goes live, its SEO and
// AI-readiness scores climb and it is marked optimized.

const DURATION = 8;
const SETTLE = 7.3;

// ── Layout ──────────────────────────────────────────────────────────────────
const BRIEF = { x: 20, y: 100, w: 172, h: 280 };
const SCORE = { x: 20, y: 392, w: 172, h: 112 };
const DOC = { x: 206, y: 100, w: 334, h: 404 };
const IN = DOC.x + 18; // article text column
const COL = DOC.w - 36;

const QUERY = ["postgres connection", "pooling serverless"];
const QUERY_LEN = QUERY.join(" ").length;
const SLUG = "pg-pooling";
const TITLE = "Connection pooling for serverless Postgres";

const OUTLINE = ["The connection limit", "Pooling modes", "A pooled client", "Poolers compared"];
const itemY = (i: number) => BRIEF.y + 212 + i * 18.5;
// Article section headings, top to bottom.
const HEAD_Y = [DOC.y + 104, DOC.y + 146, DOC.y + 188, DOC.y + 300];
const flyAt = (i: number) => 2.15 + i * 0.36;
const FLY = 0.38;
const landAt = (i: number) => flyAt(i) + FLY;

// ── Timeline ────────────────────────────────────────────────────────────────
const TYPE_Q = [0.25, 0.8] as const;
const TITLE_AT = 1.55;
const CODE_AT = 3.35;
const CODE_FOR = 1.25;
const rowAt = (i: number) => 4.55 + i * 0.18;
const LIVE = 5.15;
const RISE = [5.35, 1.0] as const;
const OPTIMIZED = 6.45;

// ── Code example (TypeScript), tokenised for a restrained highlight. ───────
type Tok = readonly [string, string];
const KW = DATA.violet;
const STR = DATA.teal;
const NUM = DATA.blue;
const PUN = C.muted;
const ID = C.ink;
const CODE: readonly (readonly Tok[])[] = [
  [["import", KW], [" { Pool } ", ID], ["from", KW], [' "@yourtool/pg"', STR], [";", PUN]],
  [["const", KW], [" pool = ", ID], ["new", KW], [" Pool", ID], ["({", PUN]],
  [["  url: process.env.", ID], ["DATABASE_URL", NUM], [",", PUN]],
  [["  mode: ", ID], ['"transaction"', STR], [",", PUN]],
  [["  max: ", ID], ["10", NUM], [",", PUN]],
  [["});", PUN]],
];
const LINE_LEN = CODE.map((l) => l.reduce((m, [s]) => m + s.length, 0));
const LINE_START = LINE_LEN.map((_, i) => LINE_LEN.slice(0, i).reduce((a, b) => a + b, 0));
const CODE_LEN = LINE_LEN.reduce((a, b) => a + b, 0);
const CODE_BOX = { x: IN, y: HEAD_Y[2] + 9, w: COL, h: 88 };
const CODE_FS = 9.4;
const CHAR = CODE_FS * 0.6;

// ── Comparison table ───────────────────────────────────────────────────────
const TOOLS = ["YourTool", "PgBouncer", "RDS Proxy"];
const ROWS: { label: string; has: [boolean, boolean, boolean] }[] = [
  { label: "Transaction pooling", has: [true, true, true] },
  { label: "Edge runtimes", has: [true, false, false] },
  { label: "Zero config", has: [true, false, true] },
];
const TABLE = { x: IN, y: HEAD_Y[3] + 9, w: COL, head: 19, row: 20 };
const TCOL = 126;
const tcolX = (j: number) => TABLE.x + TCOL + j * ((TABLE.w - TCOL) / 3) + (TABLE.w - TCOL) / 6;

const SCORES = [
  { label: "SEO", from: 58, to: 94 },
  { label: "AI-readiness", from: 41, to: 91 },
];

/** The first `n` characters of a tokenised line, as coloured tspans. */
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

  // Brief.
  const qChars = Math.round(ramp(t, TYPE_Q[0], TYPE_Q[1], (x) => x) * QUERY_LEN);
  const typingQ = t > TYPE_Q[0] && qChars < QUERY_LEN;
  const stat = (i: number) => ramp(t, 0.95 + i * 0.1, 0.3) * o;
  const itemIn = (i: number) => ramp(t, 1.2 + i * 0.08, 0.3) * o;

  // Article.
  const titleChars = Math.round(ramp(t, TITLE_AT, 0.5, (x) => x) * TITLE.length * o);
  const slugChars = Math.round(ramp(t, TITLE_AT + 0.1, 0.4, (x) => x) * SLUG.length * o);
  const byline = ramp(t, TITLE_AT + 0.5, 0.3) * o;
  const live = ramp(t, LIVE, 0.3) * o;
  const codeChars = Math.round(ramp(t, CODE_AT, CODE_FOR, (x) => x) * CODE_LEN);
  const codeTyping = t > CODE_AT && t < CODE_AT + CODE_FOR + 0.15;

  // Scores.
  const scoreIn = ramp(t, landAt(0), 0.3) * o;
  const rise = ramp(t, RISE[0], RISE[1], easeOut);
  const risen = rise >= 1;
  const optimized = ramp(t, OPTIMIZED, 0.35) * o;

  // Lay the code out character by character so typing reads left to right.
  const codeLines = CODE.map((line, i) => {
    const n = Math.max(0, Math.min(LINE_LEN[i], codeChars - LINE_START[i]));
    return { toks: typed(line, n), n, len: LINE_LEN[i] };
  });
  const typing = codeLines.findIndex((l) => l.n < l.len);
  const caretLine = typing < 0 ? CODE.length - 1 : typing;

  return (
    <PanelSvg metrics={STEPS[2].metrics} t={t} metricsAt={[LIVE - 0.1, RISE[0]]} metricsFor={[1, 1.2]}>
      {/* ── The brief ── */}
      <Card x={BRIEF.x} y={BRIEF.y} w={BRIEF.w} h={BRIEF.h} />
      <g transform={`translate(${BRIEF.x + 16} ${BRIEF.y + 22})`}>
        <BriefIcon />
        <Mono x={14} y={0} size={9.5} fill={C.ink}>
          Content brief
        </Mono>
      </g>
      <line x1={BRIEF.x} x2={BRIEF.x + BRIEF.w} y1={BRIEF.y + 34} y2={BRIEF.y + 34} stroke={C.line} />

      <Mono x={BRIEF.x + 12} y={BRIEF.y + 52} size={8.4}>
        Target query
      </Mono>
      <rect
        x={BRIEF.x + 12}
        y={BRIEF.y + 58}
        width={BRIEF.w - 24}
        height={38}
        rx={7}
        fill={C.paper}
        stroke={typingQ ? C.accent : C.line}
      />
      <Mark name="google" x={BRIEF.x + 25} y={BRIEF.y + 71} size={11} />
      {QUERY.map((line, i) => {
        const start = i === 0 ? 0 : QUERY[0].length + 1;
        const shown = line.slice(0, Math.max(0, Math.round(qChars * o) - start));
        return (
          <text key={i} x={BRIEF.x + 36} y={BRIEF.y + 75 + i * 14} fontSize={11} fontWeight={550} fill={C.ink}>
            {shown}
          </text>
        );
      })}

      {/* Volume / intent / audience. */}
      <g opacity={stat(0)}>
        <Mono x={BRIEF.x + 12} y={BRIEF.y + 116} size={8.4}>
          Volume
        </Mono>
        <text x={BRIEF.x + 12} y={BRIEF.y + 133} fontSize={14} fontWeight={600} letterSpacing="-0.02em" fill={C.ink}>
          2.9k
          <tspan fontSize={11} fontWeight={500} fill={C.muted} dx={2}>
            /mo
          </tspan>
        </text>
      </g>
      <g opacity={stat(1)}>
        <Mono x={BRIEF.x + 92} y={BRIEF.y + 116} size={8.4}>
          Intent
        </Mono>
        <text x={BRIEF.x + 92} y={BRIEF.y + 133} fontSize={14} fontWeight={600} letterSpacing="-0.02em" fill={C.ink}>
          How-to
        </text>
      </g>
      <g opacity={stat(2)}>
        <Mono x={BRIEF.x + 12} y={BRIEF.y + 157} size={8.4}>
          Audience
        </Mono>
        <text x={BRIEF.x + 12} y={BRIEF.y + 173} fontSize={11.5} fontWeight={550} fill={C.ink}>
          Backend engineers
        </text>
      </g>

      <line x1={BRIEF.x + 12} x2={BRIEF.x + BRIEF.w - 12} y1={BRIEF.y + 182} y2={BRIEF.y + 182} stroke={C.line} />
      <Mono x={BRIEF.x + 12} y={BRIEF.y + 197} size={8.4} opacity={itemIn(0)}>
        Outline
      </Mono>
      {OUTLINE.map((label, i) => {
        const y = itemY(i);
        const lifting = blip(t, flyAt(i), FLY - 0.16, 0.08);
        const done = ramp(t, landAt(i), 0.3) * o;
        return (
          <g key={label} opacity={itemIn(i)}>
            {done > 0 ? (
              <Check x={BRIEF.x + 19} y={y - 4} r={6} k={done} />
            ) : (
              <g>
                <circle cx={BRIEF.x + 19} cy={y - 4} r={6} fill={lifting > 0.05 ? C.accentSoft : C.card} stroke={lifting > 0.05 ? C.accent : C.line} />
                <Mono x={BRIEF.x + 19} y={y - 1} size={8.4} textAnchor="middle" letterSpacing={0} fill={lifting > 0.05 ? C.accent : C.muted}>
                  {i + 1}
                </Mono>
              </g>
            )}
            <text x={BRIEF.x + 32} y={y} fontSize={11} fontWeight={550} fill={lifting > 0.05 ? C.accent : C.ink} opacity={1 - 0.35 * done}>
              {label}
            </text>
          </g>
        );
      })}

      {/* ── Page score ── */}
      <g opacity={0.45 + 0.55 * scoreIn}>
        <Card x={SCORE.x} y={SCORE.y} w={SCORE.w} h={SCORE.h} />
        <Mono x={SCORE.x + 12} y={SCORE.y + 21} size={9.5} fill={C.ink}>
          Page score
        </Mono>
        {SCORES.map((s, i) => {
          const v = lerp(s.from, s.to, rise);
          const y = SCORE.y + 42 + i * 28;
          const color = risen ? C.primary : rise > 0 ? C.accent : C.ink;
          const barW = SCORE.w - 24;
          return (
            <g key={s.label}>
              <Mono x={SCORE.x + 12} y={y} size={8.4}>
                {s.label}
              </Mono>
              <text x={SCORE.x + SCORE.w - 12} y={y + 1} fontSize={14} fontWeight={600} letterSpacing="-0.02em" textAnchor="end" fill={color}>
                {scoreIn > 0 ? Math.round(v) : "–"}
              </text>
              <rect x={SCORE.x + 12} y={y + 7} width={barW} height={4} rx={2} fill={C.line} />
              <rect x={SCORE.x + 12} y={y + 7} width={(barW * v) / 100} height={4} rx={2} fill={risen ? C.primary : rise > 0 ? C.accent : C.muted} />
            </g>
          );
        })}
      </g>

      {/* ── The article ── */}
      <Card x={DOC.x} y={DOC.y} w={DOC.w} h={DOC.h} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={DOC.x + 16 + i * 10} cy={DOC.y + 16} r={3} fill={C.line} />
      ))}
      <rect x={DOC.x + 52} y={DOC.y + 7} width={186} height={18} rx={9} fill={C.paper} stroke={C.line} />
      <Lock x={DOC.x + 63} y={DOC.y + 16} />
      <Mono x={DOC.x + 72} y={DOC.y + 19} size={8.6} letterSpacing={0} fill={C.muted} style={{ textTransform: "none" }}>
        yourtool.dev/blog/
        <tspan fill={C.ink}>{SLUG.slice(0, slugChars)}</tspan>
      </Mono>
      {/* Status: draft → live. */}
      <g transform={`translate(${DOC.x + DOC.w - 12} ${DOC.y + 7})`}>
        <rect x={-74} width={74} height={18} rx={9} fill={live > 0.5 ? C.primary : C.card} stroke={live > 0.5 ? C.primary : C.line} />
        <circle cx={-62} cy={9} r={3} fill={live > 0.5 ? "#fff" : C.accent} opacity={live > 0.5 ? 1 : t > TITLE_AT ? 1 : 0.35} />
        <Mono x={-52} y={12.2} size={8.4} fill={live > 0.5 ? "#fff" : C.muted}>
          {live > 0.5 ? "Published" : "Draft"}
        </Mono>
      </g>
      <line x1={DOC.x} x2={DOC.x + DOC.w} y1={DOC.y + 32} y2={DOC.y + 32} stroke={C.line} />

      {/* Title and byline. */}
      <text x={IN} y={DOC.y + 60} fontSize={14.5} fontWeight={600} letterSpacing="-0.02em" fill={C.ink}>
        {TITLE.slice(0, titleChars)}
      </text>
      {titleChars === 0 && <rect x={IN} y={DOC.y + 49} width={210} height={12} rx={3} fill={C.paper} />}
      <g opacity={byline}>
        <circle cx={IN + 7} cy={DOC.y + 77} r={7} fill={C.primarySoft} />
        <text x={IN + 7} y={DOC.y + 80.5} fontSize={8.5} fontWeight={600} fill={C.primary} textAnchor="middle">
          MC
        </text>
        <Mono x={IN + 20} y={DOC.y + 80} size={8.4}>
          Maya Chen · 9 min read · Oct 2026
        </Mono>
      </g>

      {/* Sections: headings land from the outline, then their bodies fill. */}
      {OUTLINE.map((label, i) => {
        const k = ramp(t, landAt(i) - 0.05, 0.2) * o;
        const body = ramp(t, landAt(i), 0.45, easeOut) * o;
        return (
          <g key={label}>
            <text x={IN} y={HEAD_Y[i]} fontSize={11.5} fontWeight={600} fill={C.ink} opacity={k}>
              {label}
            </text>
            {i < 2 && <Lines x={IN} y={HEAD_Y[i] + 9} widths={i === 0 ? [COL, COL - 34, COL - 120] : [COL - 12, COL - 70]} gap={8} h={4} k={body} />}
          </g>
        );
      })}

      {/* Code example. */}
      <g opacity={ramp(t, landAt(2), 0.3) * o}>
        <rect x={CODE_BOX.x} y={CODE_BOX.y} width={CODE_BOX.w} height={CODE_BOX.h} rx={7} fill={C.paper} stroke={C.line} />
        <Mono x={CODE_BOX.x + CODE_BOX.w - 10} y={CODE_BOX.y + 14} size={8.4} textAnchor="end">
          db.ts
        </Mono>
        {codeLines.map((l, i) => {
          const y = CODE_BOX.y + 17 + i * 12.4;
          return (
            <g key={i}>
              <text x={CODE_BOX.x + 16} y={y} fontFamily="var(--font-mono)" fontSize={CODE_FS} fill={C.muted} opacity={0.6} textAnchor="end">
                {i + 1}
              </text>
              <text x={CODE_BOX.x + 24} y={y} fontFamily="var(--font-mono)" fontSize={CODE_FS} xmlSpace="preserve" style={{ whiteSpace: "pre" }}>
                {l.toks.map(([s, c], j) => (
                  <tspan key={j} fill={c}>
                    {s}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
        {codeTyping && o > 0.9 && (
          <rect x={CODE_BOX.x + 24 + codeLines[caretLine].n * CHAR + 0.5} y={CODE_BOX.y + 8 + caretLine * 12.4} width={1.4} height={11} fill={C.accent} />
        )}
      </g>

      {/* Comparison table. */}
      <g opacity={ramp(t, landAt(3), 0.3) * o}>
        <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.head + ROWS.length * TABLE.row} rx={7} fill={C.card} stroke={C.line} />
        {/* Your column, quietly highlighted. */}
        <rect x={tcolX(0) - 29} y={TABLE.y + 0.5} width={58} height={TABLE.head + ROWS.length * TABLE.row - 1} fill={C.primarySoft} opacity={0.6} />
        {TOOLS.map((name, j) => (
          <Mono key={name} x={tcolX(j)} y={TABLE.y + 13.5} size={8.4} letterSpacing="0.02em" textAnchor="middle" fill={j === 0 ? C.primary : C.muted}>
            {name}
          </Mono>
        ))}
        <line x1={TABLE.x} x2={TABLE.x + TABLE.w} y1={TABLE.y + TABLE.head} y2={TABLE.y + TABLE.head} stroke={C.line} />
        {ROWS.map((r, i) => {
          const k = ramp(t, rowAt(i), 0.3) * o;
          const y = TABLE.y + TABLE.head + i * TABLE.row;
          return (
            <g key={r.label}>
              {i > 0 && <line x1={TABLE.x} x2={TABLE.x + TABLE.w} y1={y} y2={y} stroke={C.line} />}
              {k === 0 && <rect x={TABLE.x + 10} y={y + 9} width={92} height={4} rx={2} fill={C.line} />}
              <g opacity={k}>
                <text x={TABLE.x + 10} y={y + 14.5} fontSize={11} fontWeight={550} fill={C.ink}>
                  {r.label}
                </text>
                {r.has.map((h, j) =>
                  h ? (
                    <Check key={j} x={tcolX(j)} y={y + 10.5} r={5.5} k={k} />
                  ) : (
                    <line key={j} x1={tcolX(j) - 4} x2={tcolX(j) + 4} y1={y + 10.5} y2={y + 10.5} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round" />
                  ),
                )}
              </g>
            </g>
          );
        })}
      </g>

      {/* Ghost of each outline item, travelling from the brief into the article. */}
      {OUTLINE.map((label, i) => {
        const k = ramp(t, flyAt(i), FLY);
        if (k <= 0 || k >= 1) return null;
        const x = lerp(BRIEF.x + 32, IN, k);
        const y = lerp(itemY(i), HEAD_Y[i], k);
        const w = label.length * 6.1 + 12;
        return (
          <g key={label} opacity={Math.min(1, k * 6)}>
            <rect x={x - 6} y={y - 13} width={w} height={18} rx={5} fill={C.accentSoft} stroke={C.accent} />
            <text x={x} y={y} fontSize={11.5} fontWeight={600} fill={C.accent}>
              {label}
            </text>
          </g>
        );
      })}

      {/* Result: optimized. */}
      <g opacity={optimized} transform={`translate(${SCORE.x + 12} ${SCORE.y + SCORE.h - 28})`}>
        <rect width={SCORE.w - 24} height={20} rx={10} fill={C.primary} />
        <circle cx={(SCORE.w - 24) / 2 - 30} cy={10} r={5.5} fill="#fff" />
        <path
          d={`M${(SCORE.w - 24) / 2 - 32.3} 10 L${(SCORE.w - 24) / 2 - 30.6} 11.8 L${(SCORE.w - 24) / 2 - 27.5} 8.3`}
          fill="none"
          stroke={C.primary}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - clamp01(optimized)}
        />
        <Mono x={(SCORE.w - 24) / 2 - 20} y={13.2} size={8.8} fill="#fff">
          Optimized
        </Mono>
      </g>
    </PanelSvg>
  );
}

function BriefIcon() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" transform="translate(-1 -9.5)">
      <rect x={0} y={1} width={9} height={11} rx={1.5} />
      <path d="M3 0.5h3v2H3z M2.5 6h4M2.5 8.5h3" strokeLinecap="round" />
    </g>
  );
}
function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={C.muted} strokeWidth={1.1}>
      <rect x={-3} y={-1} width={6} height={4.5} rx={1} fill={C.muted} />
      <path d="M-1.8 -1v-1.4a1.8 1.8 0 0 1 3.6 0V-1" />
    </g>
  );
}

const content: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default content;
