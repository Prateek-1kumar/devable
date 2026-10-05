import { STEPS } from "../content";
import { C, Card, Check, DATA, Lines, Mark, Mono, PanelSvg, clamp01, easeInOut, easeOut, lerp, outro, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 03 Content Engine. Beginning: a content brief fills in: target query, search
// volume, intent, audience and a three-part outline. Work: each outline item
// lifts out of the brief and lands as a section of the article; a code example
// types in and a comparison table fills. Result: the article goes live, its SEO
// and AI-readiness scores climb and it is marked optimized.

const DURATION = 9;
const SETTLE = 8.2;

// ── Layout ──────────────────────────────────────────────────────────────────
const BRIEF = { x: 20, y: 100, w: 172, h: 296 };
const SCORE = { x: 20, y: 408, w: 172, h: 96 };
const DOC = { x: 206, y: 100, w: 334, h: 404 };
const PAD = 16;
const IN = DOC.x + 20; // article text column
const COL = DOC.w - 40;

const QUERY = ["postgres connection", "pooling serverless"];
const QUERY_LEN = QUERY.join(" ").length;
const SLUG = "pg-pooling";
const TITLE = "Connection pooling for serverless Postgres";

const OUTLINE = ["Connection limits", "A pooled client", "Poolers compared"];
const itemY = (i: number) => BRIEF.y + 218 + i * 30;
// Article section headings, top to bottom.
const HEAD_Y = [DOC.y + 118, DOC.y + 166, DOC.y + 290];

// ── Timeline ────────────────────────────────────────────────────────────────
// Beat 1 (brief): query types, facts and outline rise in.
const TYPE_Q = [0.5, 0.75] as const;
const META_AT = 1.35;
const itemAt = (i: number) => 1.6 + i * 0.14;
// Beat 2 (draft): title and slug, then the outline items move across one by one.
const TITLE_AT = 2.15;
const FLY = 0.55;
const FLY_AT = [2.85, 3.6, 5.0];
const landAt = (i: number) => FLY_AT[i] + FLY;
const CODE_AT = landAt(1) + 0.15;
const CODE_FOR = 0.75;
const rowAt = (i: number) => landAt(2) + 0.12 + i * 0.22;
// Beat 3 (result): published, scores climb, optimized.
const LIVE = 6.2;
const RISE = [6.3, 0.65] as const;
const OPTIMIZED = 6.95;

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
  [["});", PUN]],
];
const LINE_LEN = CODE.map((l) => l.reduce((m, [s]) => m + s.length, 0));
const LINE_START = LINE_LEN.map((_, i) => LINE_LEN.slice(0, i).reduce((a, b) => a + b, 0));
const CODE_LEN = LINE_LEN.reduce((a, b) => a + b, 0);
const CODE_BOX = { x: IN, y: HEAD_Y[1] + 11, w: COL, h: 86 };
const CODE_FS = 9.4;
const CODE_PITCH = 13.2;
const CHAR = CODE_FS * 0.6;

// ── Comparison table ───────────────────────────────────────────────────────
const TOOLS = ["YourTool", "PgBouncer", "RDS Proxy"];
const ROWS: { label: string; has: [boolean, boolean, boolean] }[] = [
  { label: "Edge runtimes", has: [true, false, false] },
  { label: "Zero config", has: [true, false, true] },
];
const TABLE = { x: IN, y: HEAD_Y[2] + 11, w: COL, head: 26, row: 30 };
const TABLE_H = TABLE.head + ROWS.length * TABLE.row;
const TCOL = 116;
const TW = (TABLE.w - TCOL) / 3;
const tcolX = (j: number) => TABLE.x + TCOL + j * TW + TW / 2;

const SCORES = [
  { label: "SEO", from: 58, to: 94 },
  { label: "AI-ready", from: 41, to: 91 },
];

/** Fade plus a small rise, for staggered entrances. */
const enter = (t: number, at: number, dur = 0.42) => ramp(t, at, dur, easeOut);
const rise = (k: number) => `translate(0 ${(1 - k) * 5})`;

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
  const typingQ = t > TYPE_Q[0] - 0.15 && t < TYPE_Q[0] + TYPE_Q[1] + 0.25;
  const focusQ = Math.min(ramp(t, TYPE_Q[0] - 0.2, 0.25), 1 - ramp(t, TYPE_Q[0] + TYPE_Q[1] + 0.15, 0.3));
  const meta = (i: number) => enter(t, META_AT + i * 0.12);

  // Article.
  const titleChars = Math.round(ramp(t, TITLE_AT, 0.55, (x) => x) * TITLE.length);
  const slugChars = Math.round(ramp(t, TITLE_AT + 0.1, 0.45, (x) => x) * SLUG.length);
  const byline = enter(t, TITLE_AT + 0.45);
  const live = ramp(t, LIVE, 0.4);
  const codeChars = Math.round(ramp(t, CODE_AT, CODE_FOR, (x) => x) * CODE_LEN);
  const codeTyping = t > CODE_AT && t < CODE_AT + CODE_FOR + 0.2;

  // Scores.
  const scoreIn = ramp(t, LIVE, 0.4);
  const grow = ramp(t, RISE[0], RISE[1], easeInOut);
  const risen = grow >= 1;
  const optimized = ramp(t, OPTIMIZED, 0.4);

  // Lay the code out character by character so typing reads left to right.
  const codeLines = CODE.map((line, i) => {
    const n = Math.max(0, Math.min(LINE_LEN[i], codeChars - LINE_START[i]));
    return { toks: typed(line, n), n, len: LINE_LEN[i] };
  });
  const typing = codeLines.findIndex((l) => l.n < l.len);
  const caretLine = typing < 0 ? CODE.length - 1 : typing;

  return (
    <PanelSvg metrics={STEPS[2].metrics} t={t} metricsAt={[LIVE, RISE[0]]} metricsFor={[1, 1.1]}>
      {/* ── The brief ── */}
      <Card x={BRIEF.x} y={BRIEF.y} w={BRIEF.w} h={BRIEF.h} />
      <g transform={`translate(${BRIEF.x + PAD} ${BRIEF.y + 25})`}>
        <BriefIcon />
        <Mono x={14} y={0} size={9.5} fill={C.ink}>
          Content brief
        </Mono>
      </g>
      <line x1={BRIEF.x} x2={BRIEF.x + BRIEF.w} y1={BRIEF.y + 40} y2={BRIEF.y + 40} stroke={C.hair} />

      <Mono x={BRIEF.x + PAD} y={BRIEF.y + 63} size={8.4}>
        Target query
      </Mono>
      <rect
        x={BRIEF.x + PAD}
        y={BRIEF.y + 71}
        width={BRIEF.w - 2 * PAD}
        height={40}
        rx={8}
        fill={C.paper}
        stroke={C.line}
      />
      {/* Focus: a quiet coral wash and outline while the query is typed. */}
      <rect
        x={BRIEF.x + PAD}
        y={BRIEF.y + 71}
        width={BRIEF.w - 2 * PAD}
        height={40}
        rx={8}
        fill={C.accentWash}
        stroke={C.accentLine}
        opacity={focusQ}
      />
      <Mark name="google" x={BRIEF.x + PAD + 12} y={BRIEF.y + 86} size={11} />
      <g opacity={o}>
        {QUERY.map((line, i) => {
          const start = i === 0 ? 0 : QUERY[0].length + 1;
          const shown = line.slice(0, Math.max(0, qChars - start));
          return (
            <text key={i} x={BRIEF.x + PAD + 23} y={BRIEF.y + 90 + i * 14} fontSize={11} fontWeight={550} fill={C.ink}>
              {shown}
            </text>
          );
        })}
      </g>
      {typingQ && qChars < QUERY_LEN && (
        <rect
          x={BRIEF.x + PAD + 23 + (qChars > QUERY[0].length ? qChars - QUERY[0].length - 1 : qChars) * 5.55 + 1.5}
          y={BRIEF.y + 81 + (qChars > QUERY[0].length ? 14 : 0)}
          width={1.2}
          height={12}
          fill={C.accent}
        />
      )}

      {/* Volume and intent, then audience. */}
      <g opacity={meta(0) * o} transform={rise(meta(0))}>
        <Bars x={BRIEF.x + PAD} y={BRIEF.y + 133} />
        <text x={BRIEF.x + PAD + 16} y={BRIEF.y + 137} fontSize={11.5} fontWeight={600} fill={C.ink}>
          2.9k
          <tspan fontWeight={500} fill={C.muted}>
            {" /mo · How-to"}
          </tspan>
        </text>
      </g>
      <g opacity={meta(1) * o} transform={rise(meta(1))}>
        <Person x={BRIEF.x + PAD} y={BRIEF.y + 157} />
        <text x={BRIEF.x + PAD + 16} y={BRIEF.y + 161} fontSize={11.5} fontWeight={500} fill={C.muted}>
          Backend engineers
        </text>
      </g>

      <line x1={BRIEF.x + PAD} x2={BRIEF.x + BRIEF.w - PAD} y1={BRIEF.y + 178} y2={BRIEF.y + 178} stroke={C.hair} />
      <Mono x={BRIEF.x + PAD} y={BRIEF.y + 199} size={8.4} opacity={enter(t, itemAt(0) - 0.1) * o}>
        Outline
      </Mono>
      {OUTLINE.map((label, i) => {
        const y = itemY(i);
        const k = enter(t, itemAt(i));
        // Active while its copy travels to the article.
        const active = Math.min(ramp(t, FLY_AT[i] - 0.15, 0.25), 1 - ramp(t, landAt(i) - 0.05, 0.3));
        const done = ramp(t, landAt(i), 0.35) * o;
        const cx = BRIEF.x + PAD + 7;
        return (
          <g key={label} opacity={k * o} transform={rise(k)}>
            {/* Quiet active row: wash and a 2px coral tick. */}
            <g opacity={active}>
              <rect x={BRIEF.x + 8} y={y - 17} width={BRIEF.w - 16} height={26} rx={6} fill={C.accentWash} />
              <rect x={BRIEF.x + 8} y={y - 11} width={2} height={14} rx={1} fill={C.accent} />
            </g>
            <circle cx={cx} cy={y - 4} r={6.5} fill={C.card} stroke={C.line} opacity={1 - done} />
            <Mono x={cx} y={y - 1} size={8.4} textAnchor="middle" letterSpacing={0} fill={active > 0.5 ? C.accent : C.muted} opacity={1 - done}>
              {i + 1}
            </Mono>
            {done > 0 && <Check x={cx} y={y - 4} r={6.5} k={done} />}
            <text x={BRIEF.x + PAD + 22} y={y} fontSize={11.5} fontWeight={550} fill={active > 0.5 ? C.accent : C.ink} opacity={1 - 0.4 * done}>
              {label}
            </text>
          </g>
        );
      })}

      {/* ── Page score ── */}
      <Card x={SCORE.x} y={SCORE.y} w={SCORE.w} h={SCORE.h} />
      <Mono x={SCORE.x + PAD} y={SCORE.y + 25} size={8.8} fill={C.ink}>
        Page score
      </Mono>
      <g opacity={optimized * o} transform={`translate(${SCORE.x + SCORE.w - PAD} ${SCORE.y + 25})`}>
        <circle cx={-61} cy={-3} r={3} fill={C.primary} />
        <Mono x={0} y={0} size={8.4} fill={C.primary} textAnchor="end">
          Optimized
        </Mono>
      </g>
      {SCORES.map((s, i) => {
        const v = lerp(s.from, s.to, grow);
        const x = SCORE.x + PAD + i * 76;
        const color = risen ? C.primary : grow > 0 ? C.accent : C.ink;
        const shown = scoreIn * o;
        return (
          <g key={s.label}>
            <Mono x={x} y={SCORE.y + 52} size={8.4}>
              {s.label}
            </Mono>
            <text x={x} y={SCORE.y + 76} fontSize={18} fontWeight={600} letterSpacing="-0.02em" fill={C.muted} opacity={1 - shown}>
              –
            </text>
            <text x={x} y={SCORE.y + 76} fontSize={18} fontWeight={600} letterSpacing="-0.02em" fill={color} opacity={shown}>
              {Math.round(v)}
            </text>
            <rect x={x + 28} y={SCORE.y + 68} width={34} height={4} rx={2} fill={C.line} />
            <rect x={x + 28} y={SCORE.y + 68} width={(34 * v * shown) / 100} height={4} rx={2} fill={risen ? C.primary : grow > 0 ? C.accent : C.muted} />
          </g>
        );
      })}

      {/* ── The article ── */}
      <Card x={DOC.x} y={DOC.y} w={DOC.w} h={DOC.h} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={DOC.x + PAD + i * 10} cy={DOC.y + 18} r={3} fill={C.line} />
      ))}
      <rect x={DOC.x + 54} y={DOC.y + 9} width={176} height={18} rx={9} fill={C.paper} stroke={C.line} />
      <Lock x={DOC.x + 65} y={DOC.y + 18} />
      <Mono x={DOC.x + 74} y={DOC.y + 21} size={8.6} letterSpacing={0} fill={C.muted} style={{ textTransform: "none" }}>
        yourtool.dev/blog/
        <tspan fill={C.ink} opacity={o}>
          {SLUG.slice(0, slugChars)}
        </tspan>
      </Mono>
      {/* Status: draft → published. A dot and a soft fill, no heavy outline. */}
      <g transform={`translate(${DOC.x + DOC.w - PAD} ${DOC.y + 9})`}>
        <rect x={-80} width={80} height={18} rx={9} fill={C.paper} stroke={C.line} opacity={1 - live * o} />
        <rect x={-80} width={80} height={18} rx={9} fill={C.primarySoft} opacity={live * o} />
        <circle cx={-68} cy={9} r={3} fill={C.accent} opacity={(1 - live * o) * (t > TITLE_AT ? 1 : 0.35)} />
        <circle cx={-68} cy={9} r={3} fill={C.primary} opacity={live * o} />
        <Mono x={-58} y={12.2} size={8.4} fill={C.muted} opacity={1 - live * o}>
          Draft
        </Mono>
        <Mono x={-58} y={12.2} size={8.4} fill={C.primary} opacity={live * o}>
          Published
        </Mono>
      </g>
      <line x1={DOC.x} x2={DOC.x + DOC.w} y1={DOC.y + 36} y2={DOC.y + 36} stroke={C.hair} />

      {/* Title and byline. */}
      <rect x={IN} y={DOC.y + 55} width={210} height={12} rx={3} fill={C.paper} opacity={titleChars === 0 || o < 1 ? 1 : 0} />
      <text x={IN} y={DOC.y + 66} fontSize={14.5} fontWeight={600} letterSpacing="-0.02em" fill={C.ink} opacity={o}>
        {TITLE.slice(0, titleChars)}
      </text>
      <g opacity={byline * o} transform={rise(byline)}>
        <circle cx={IN + 7} cy={DOC.y + 85} r={7} fill={C.primarySoft} />
        <text x={IN + 7} y={DOC.y + 88.5} fontSize={8.5} fontWeight={600} fill={C.primary} textAnchor="middle">
          MC
        </text>
        <Mono x={IN + 21} y={DOC.y + 88} size={8.4}>
          Maya Chen · 9 min read
        </Mono>
      </g>

      {/* Sections: headings land from the outline, then their bodies fill. */}
      {OUTLINE.map((label, i) => {
        const k = ramp(t, landAt(i) - 0.12, 0.25) * o;
        const body = ramp(t, landAt(i) + 0.05, 0.5, easeOut) * o;
        return (
          <g key={label}>
            <text x={IN} y={HEAD_Y[i]} fontSize={12} fontWeight={600} fill={C.ink} opacity={k}>
              {label}
            </text>
            {i === 0 && <Lines x={IN} y={HEAD_Y[0] + 10} widths={[COL, COL - 86]} gap={11} h={4} k={body} />}
          </g>
        );
      })}

      {/* Code example. */}
      {(() => {
        const k = enter(t, landAt(1) - 0.05);
        return (
          <g opacity={k * o} transform={rise(k)}>
            <rect x={CODE_BOX.x} y={CODE_BOX.y} width={CODE_BOX.w} height={CODE_BOX.h} rx={8} fill={C.paper} stroke={C.line} />
            <Mono x={CODE_BOX.x + CODE_BOX.w - 12} y={CODE_BOX.y + 18} size={8.4} textAnchor="end">
              db.ts
            </Mono>
            {codeLines.map((l, i) => {
              const y = CODE_BOX.y + 20 + i * CODE_PITCH;
              return (
                <g key={i}>
                  <text x={CODE_BOX.x + 18} y={y} fontFamily="var(--font-mono)" fontSize={CODE_FS} fill={C.muted} opacity={0.55} textAnchor="end">
                    {i + 1}
                  </text>
                  <text x={CODE_BOX.x + 28} y={y} fontFamily="var(--font-mono)" fontSize={CODE_FS} xmlSpace="preserve" style={{ whiteSpace: "pre" }}>
                    {l.toks.map(([s, c], j) => (
                      <tspan key={j} fill={c}>
                        {s}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
            {codeTyping && (
              <rect x={CODE_BOX.x + 28 + codeLines[caretLine].n * CHAR + 0.5} y={CODE_BOX.y + 11 + caretLine * CODE_PITCH} width={1.2} height={11} fill={C.accent} />
            )}
          </g>
        );
      })()}

      {/* Comparison table. */}
      {(() => {
        const k = enter(t, landAt(2) - 0.05);
        return (
          <g opacity={k * o} transform={rise(k)}>
            <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE_H} rx={8} fill={C.card} stroke={C.line} />
            {/* Your column, quietly highlighted. */}
            <rect x={tcolX(0) - TW / 2} y={TABLE.y + 0.5} width={TW} height={TABLE_H - 1} fill={C.primarySoft} opacity={0.55} />
            {TOOLS.map((name, j) => (
              <Mono key={name} x={tcolX(j)} y={TABLE.y + 16.5} size={8.4} letterSpacing="0.02em" textAnchor="middle" fill={j === 0 ? C.primary : C.muted}>
                {name}
              </Mono>
            ))}
            <line x1={TABLE.x} x2={TABLE.x + TABLE.w} y1={TABLE.y + TABLE.head} y2={TABLE.y + TABLE.head} stroke={C.hair} />
            {ROWS.map((r, i) => {
              const rk = enter(t, rowAt(i), 0.4);
              const y = TABLE.y + TABLE.head + i * TABLE.row;
              const cy = y + TABLE.row / 2;
              return (
                <g key={r.label}>
                  {i > 0 && <line x1={TABLE.x} x2={TABLE.x + TABLE.w} y1={y} y2={y} stroke={C.hair} />}
                  <rect x={TABLE.x + 14} y={cy - 2} width={86} height={4} rx={2} fill={C.line} opacity={1 - clamp01(rk * 3)} />
                  <g opacity={rk} transform={rise(rk)}>
                    <text x={TABLE.x + 14} y={cy + 4} fontSize={11.5} fontWeight={550} fill={C.ink}>
                      {r.label}
                    </text>
                    {r.has.map((h, j) =>
                      h ? (
                        <Check key={j} x={tcolX(j)} y={cy} r={6} k={rk} />
                      ) : (
                        <line key={j} x1={tcolX(j) - 4} x2={tcolX(j) + 4} y1={cy} y2={cy} stroke={C.muted} strokeLinecap="round" />
                      ),
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* Each outline item travelling from the brief into the article. */}
      {OUTLINE.map((label, i) => {
        const raw = clamp01((t - FLY_AT[i]) / FLY);
        if (raw <= 0 || raw >= 1) return null;
        const k = easeInOut(raw);
        const x = lerp(BRIEF.x + PAD + 22, IN, k);
        const y = lerp(itemY(i), HEAD_Y[i], k);
        const w = label.length * 6.4 + 16;
        const fade = Math.min(1, raw * 5, (1 - raw) * 5);
        return (
          <g key={label} opacity={fade}>
            <rect x={x - 8} y={y - 15} width={w} height={22} rx={6} fill={C.accentWash} stroke={C.accentLine} />
            <text x={x} y={y} fontSize={lerp(11.5, 12, k)} fontWeight={600} fill={C.accent}>
              {label}
            </text>
          </g>
        );
      })}
    </PanelSvg>
  );
}

function BriefIcon() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1} strokeLinejoin="round" transform="translate(-1 -9.5)">
      <rect x={0} y={1} width={9} height={11} rx={1.5} />
      <path d="M3 0.5h3v2H3z M2.5 6h4M2.5 8.5h3" strokeLinecap="round" />
    </g>
  );
}
function Bars({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={C.muted}>
      <rect x={0} y={1} width={2.4} height={4} rx={0.6} />
      <rect x={3.8} y={-2} width={2.4} height={7} rx={0.6} />
      <rect x={7.6} y={-5} width={2.4} height={10} rx={0.6} />
    </g>
  );
}
function Person({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x + 5} ${y})`} fill={C.muted}>
      <circle cx={0} cy={-2.6} r={2.4} />
      <path d="M-4.6 5a4.6 4 0 0 1 9.2 0z" />
    </g>
  );
}
function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={C.muted} strokeWidth={1}>
      <rect x={-3} y={-1} width={6} height={4.5} rx={1} fill={C.muted} />
      <path d="M-1.8 -1v-1.4a1.8 1.8 0 0 1 3.6 0V-1" />
    </g>
  );
}

const content: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default content;
