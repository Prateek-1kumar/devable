import {
  C,
  Card,
  Check,
  DATA,
  Mark,
  Mono,
  PanelSvg,
  blip,
  clamp01,
  easeOut,
  lerp,
  outro,
  ramp,
} from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 02 Growth Strategy. A growth plan built from specific opportunities.
// Work: four opportunities are found one at a time, each tagged with its
// channel, then re-ranked by impact; the engine mix is derived from the list.
// Result: a v2 launch lands, the creator opportunity rises to #1 and the mix
// re-balances towards creators, with a quiet coral note on what changed.

const DURATION = 9.8;
const SETTLE = 8.1;

// Beats.
const FOUND_AT = (i: number) => 0.55 + i * 0.5; // rows appear
const RANK_AT = 2.75; // re-rank by impact: the top one climbs, then the weakest sinks
const MIX_AT = 4.2; // engine mix builds
const MIX_FOR = 0.7;
const EVENT_AT = 5.2; // "v2 launch" chip
const BOOST_AT = 5.6; // creator impact rises
const BOOST_FOR = 0.5;
const RERANK_AT = 6.2; // creators climb to #1
const REBAL_AT = 6.8; // mix re-balances
const REBAL_FOR = 0.8;
const DONE_AT = 7.65;
// Row moves, one mover at a time; OPPS[].slots holds the slot before and after each.
const MOVES = [
  { at: RANK_AT, dur: 0.75 },
  { at: RANK_AT + 0.8, dur: 0.6 },
  { at: RERANK_AT, dur: 0.9 },
] as const;

// Engine parts, in the client's order.
const ENGINE = [
  { label: "Content", color: DATA.blue },
  { label: "SEO + AI", color: DATA.teal },
  { label: "Community", color: DATA.amber },
  { label: "Creators", color: DATA.violet },
] as const;
const MIX_BEFORE = [22, 36, 25, 17];
const MIX_AFTER = [17, 29, 20, 34];
const CREATORS = 3;

type Glyph = MarkName | "docs";
type Opp = {
  title: string;
  marks: Glyph[];
  engine: number;
  impact: number;
  boosted?: number;
  slots: [number, number, number, number];
};
// slots: found order, top pick climbs, weakest sinks (ranked by impact), after the launch.
const OPPS: Opp[] = [
  {
    title: "Launch v2 with tech creators",
    marks: ["youtube", "x"],
    engine: 3,
    impact: 6.4,
    boosted: 9.6,
    slots: [0, 1, 3, 0],
  },
  {
    title: "Own r/LocalLLaMA self-hosting",
    marks: ["reddit"],
    engine: 2,
    impact: 7.8,
    slots: [1, 2, 1, 2],
  },
  {
    title: "LangChain + LlamaIndex guides",
    marks: ["langchain", "docs"],
    engine: 0,
    impact: 7.1,
    slots: [2, 3, 2, 3],
  },
  {
    title: "Win “best vector DB for RAG”",
    marks: ["google", "chatgpt"],
    engine: 1,
    impact: 9.2,
    slots: [3, 0, 0, 1],
  },
];

// Layout.
const CARD = { x: 52, y: 40, w: 376, h: 316 };
const L = CARD.x + 16;
const R = CARD.x + CARD.w - 16;
const HEAD_Y = CARD.y + 28;
const ROWS_Y = CARD.y + 52;
const ROW_H = 40;
const MIX_Y = ROWS_Y + 4 * ROW_H + 10; // hairline above the mix
const BAR = { x: L, y: MIX_Y + 27, w: R - L, h: 10 };
const LEG_Y = BAR.y + 30;
const COL_W = (R - L) / 4;
const IMP = { x: 336, w: 46 };
const STATUS_X = R - 128;

/** A plain docs page glyph (LlamaIndex has no mark in the set; this stands for "docs"). */
function DocsGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g
      transform={`translate(${x - 5.5} ${y - 6.5})`}
      fill="none"
      stroke={C.ink}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M0 1.5 Q0 0 1.5 0 H7.5 L11 3.5 V11.5 Q11 13 9.5 13 H1.5 Q0 13 0 11.5 Z" />
      <path d="M7.5 0 V3.5 H11" />
      <path d="M2.8 6.6 H8.2 M2.8 9.4 H6.6" />
    </g>
  );
}

function Tile({ glyph, x, y }: { glyph: Glyph; x: number; y: number }) {
  return (
    <g>
      <rect
        x={x - 11}
        y={y - 11}
        width={22}
        height={22}
        rx={6}
        fill={C.paper}
      />
      {glyph === "docs" ? (
        <DocsGlyph x={x} y={y} />
      ) : (
        <Mark name={glyph} x={x} y={y} size={12} />
      )}
    </g>
  );
}

/** Paint order: rows shifting by one slot, then the row jumping several (lifted on a card above them). */
function drawKey(op: Opp, t: number) {
  const m = MOVES.findLastIndex((mv) => t >= mv.at - 0.05);
  if (m < 0) return 1;
  const d = op.slots[m + 1] - op.slots[m];
  return Math.abs(d) >= 2 ? 2 : 1;
}
/** The row's slot (fractional while moving). */
const slotAt = (op: Opp, t: number) =>
  MOVES.reduce(
    (s, mv, m) => s + (op.slots[m + 1] - op.slots[m]) * ramp(t, mv.at, mv.dur),
    op.slots[0],
  );
/** 0..1 while this row is in motion. */
const movingAt = (op: Opp, t: number) =>
  Math.min(
    1,
    MOVES.reduce(
      (s, mv, m) =>
        s +
        (op.slots[m + 1] !== op.slots[m]
          ? blip(t, mv.at, mv.dur - 0.2, 0.1)
          : 0),
      0,
    ),
  );

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const build = ramp(t, MIX_AT, MIX_FOR, easeOut);
  const rebal = ramp(t, REBAL_AT, REBAL_FOR);
  const boost = ramp(t, BOOST_AT, BOOST_FOR, easeOut);
  const event = ramp(t, EVENT_AT, 0.45, easeOut);
  const done = ramp(t, DONE_AT, 0.4);
  const changed = ramp(t, BOOST_AT - 0.15, 0.35);

  // Status line: one message at a time, crossfading, until the launch chip takes its place.
  const statuses = [
    {
      text: "Finding opportunities…",
      on: ramp(t, 0.25, 0.3) - ramp(t, RANK_AT - 0.25, 0.25),
    },
    {
      text: "Ranking by impact…",
      on: ramp(t, RANK_AT, 0.25) - ramp(t, MIX_AT - 0.2, 0.2),
    },
    {
      text: "Building the mix…",
      on: ramp(t, MIX_AT, 0.2) - ramp(t, EVENT_AT - 0.3, 0.25),
    },
  ];
  const working = 1 - ramp(t, EVENT_AT - 0.3, 0.25);
  const pulse = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 0.9);

  const shares = MIX_BEFORE.map((v, i) => lerp(v, MIX_AFTER[i], rebal));
  const chipW = 150;

  return (
    <PanelSvg t={t}>
      <g opacity={o}>
        <g opacity={ramp(t, 0, 0.35)}>
          <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} />

          {/* ── Header ── */}
          <circle
            cx={L + 5}
            cy={HEAD_Y - 3.5}
            r={5.5}
            fill="none"
            stroke={C.line}
            opacity={1 - done}
          />
          <g opacity={done}>
            <Check x={L + 5} y={HEAD_Y - 3.5} r={5.5} k={done} />
          </g>
          <Mono x={L + 18} y={HEAD_Y} size={9.5} fill={C.ink}>
            Growth plan
          </Mono>
          {statuses.map((s) => (
            <text
              key={s.text}
              x={STATUS_X}
              y={HEAD_Y}
              fontSize={11.5}
              fill={C.muted}
              opacity={clamp01(s.on)}
            >
              {s.text}
            </text>
          ))}
          <circle
            cx={STATUS_X - 9}
            cy={HEAD_Y - 4}
            r={3}
            fill={C.accent}
            opacity={working * pulse * ramp(t, 0.25, 0.3)}
          />

          {/* The launch: a quiet event chip in place of the status. */}
          <g
            opacity={event}
            transform={`translate(${R - chipW} ${HEAD_Y - 15 + (1 - event) * 5})`}
          >
            <rect
              width={chipW}
              height={22}
              rx={11}
              fill={C.accentWash}
              stroke={C.accentLine}
            />
            <circle cx={12} cy={11} r={3} fill={C.accent} />
            <text x={22} y={15} fontSize={11.5} fill={C.ink}>
              <tspan fontWeight={600}>v2 launch</tspan>
              <tspan fill={C.muted}> · in 3 weeks</tspan>
            </text>
          </g>
          <line x1={L} x2={R} y1={ROWS_Y - 6} y2={ROWS_Y - 6} stroke={C.hair} />

          {/* ── Opportunities ── */}
          {OPPS.map((op, i) => ({ op, i }))

            .sort((a, b) => drawKey(a.op, t) - drawKey(b.op, t))
            .map(({ op, i }) => {
              const k = ramp(t, FOUND_AT(i), 0.45, easeOut);
              if (k <= 0) return null;
              const slot = slotAt(op, t);
              const y = ROWS_Y + slot * ROW_H + (1 - k) * 5;
              const cy = y + ROW_H / 2;
              const fill = ramp(t, FOUND_AT(i) + 0.2, 0.55, easeOut);
              const value = op.boosted
                ? lerp(op.impact, op.boosted, boost)
                : op.impact;
              const hl = op.boosted ? changed : 0;
              const moving = movingAt(op, t);
              return (
                <g key={op.title} opacity={k}>
                  {/* Every row is opaque; the row jumping slots lifts onto a card above the rest. */}
                  <rect
                    x={L - 8}
                    y={y + 3}
                    width={R - L + 16}
                    height={ROW_H - 6}
                    rx={8}
                    fill={C.card}
                  />
                  {drawKey(op, t) >= 2 && (
                    <Card
                      x={L - 8}
                      y={y + 3}
                      w={R - L + 16}
                      h={ROW_H - 6}
                      r={8}
                      opacity={moving}
                    />
                  )}
                  {/* What changed: a quiet wash and a slim coral tick. */}
                  <rect
                    x={L - 8}
                    y={y + 3}
                    width={R - L + 16}
                    height={ROW_H - 6}
                    rx={8}
                    fill={C.accentWash}
                    opacity={hl}
                  />
                  <rect
                    x={L - 8}
                    y={cy - 8}
                    width={2}
                    height={16}
                    rx={1}
                    fill={C.accent}
                    opacity={hl}
                  />
                  {op.marks.map((m, j) => (
                    <Tile
                      key={m}
                      glyph={m}
                      x={L + 56 - (op.marks.length - 1 - j) * 25}
                      y={cy}
                    />
                  ))}
                  <text
                    x={L + 76}
                    y={cy + 4.2}
                    fontSize={12.5}
                    fontWeight={550}
                    fill={C.ink}
                  >
                    {op.title}
                  </text>
                  {/* Impact: a short bar in its engine colour, and the score. */}
                  <rect
                    x={IMP.x}
                    y={cy - 2.5}
                    width={IMP.w}
                    height={5}
                    rx={2.5}
                    fill={C.hair}
                  />
                  <rect
                    x={IMP.x}
                    y={cy - 2.5}
                    width={(IMP.w * value * fill) / 10}
                    height={5}
                    rx={2.5}
                    fill={ENGINE[op.engine].color}
                  />
                  <text
                    x={R}
                    y={cy + 4.2}
                    fontSize={12}
                    fontWeight={600}
                    textAnchor="end"
                    fill={C.ink}
                    opacity={clamp01(fill * 2)}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {(value * fill).toFixed(1)}
                  </text>
                </g>
              );
            })}

          {/* ── Rank column (fixed slots; the rows move past it) ── */}
          {[0, 1, 2, 3].map((s) => (
            <Mono
              key={s}
              x={L}
              y={ROWS_Y + s * ROW_H + ROW_H / 2 + 3.5}
              size={9.5}
              fill={C.muted}
              opacity={ramp(t, FOUND_AT(s), 0.4)}
            >
              {`0${s + 1}`}
            </Mono>
          ))}

          {/* ── Engine mix ── */}
          <line x1={L} x2={R} y1={MIX_Y} y2={MIX_Y} stroke={C.hair} />
          <Mono
            x={L}
            y={MIX_Y + 20}
            size={9}
            fill={C.muted}
            opacity={ramp(t, MIX_AT - 0.3, 0.3)}
          >
            Engine mix
          </Mono>
          <rect
            x={BAR.x}
            y={BAR.y}
            width={BAR.w}
            height={BAR.h}
            rx={BAR.h / 2}
            fill={C.hair}
          />
          {(() => {
            const gap = 3;
            const usable = BAR.w - gap * 3;
            return shares.map((s, i) => {
              const w = (usable * s) / 100;
              const x0 =
                BAR.x +
                (usable * shares.slice(0, i).reduce((a, b) => a + b, 0)) / 100 +
                gap * i;
              // Builds left to right: each segment fills in turn.
              const segK = clamp01(build * 4 - i);
              const hi = i === CREATORS ? rebal : 0;
              return (
                <g key={ENGINE[i].label}>
                  <rect
                    x={x0}
                    y={BAR.y}
                    width={Math.max(0, w * segK)}
                    height={BAR.h}
                    rx={BAR.h / 2}
                    fill={ENGINE[i].color}
                  />
                  <rect
                    x={x0 - 3}
                    y={BAR.y - 3}
                    width={w + 6}
                    height={BAR.h + 6}
                    rx={(BAR.h + 6) / 2}
                    fill="none"
                    stroke={C.accentLine}
                    opacity={hi}
                  />
                </g>
              );
            });
          })()}
          {ENGINE.map((e, i) => {
            const x = L + i * COL_W;
            const k = ramp(t, MIX_AT + i * 0.12, 0.45, easeOut);
            const delta = MIX_AFTER[i] - MIX_BEFORE[i];
            return (
              <g
                key={e.label}
                opacity={k}
                transform={`translate(0 ${(1 - k) * 4})`}
              >
                <circle cx={x + 3.5} cy={LEG_Y - 3.5} r={3.5} fill={e.color} />
                <Mono x={x + 12} y={LEG_Y} size={9} fill={C.muted}>
                  {e.label}
                </Mono>
                <text
                  x={x}
                  y={LEG_Y + 21}
                  fontSize={15}
                  fontWeight={600}
                  letterSpacing="-0.02em"
                  fill={C.ink}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {`${Math.round(shares[i] * build)}%`}
                </text>
                {i === CREATORS && (
                  <text
                    x={x + 38}
                    y={LEG_Y + 20}
                    fontSize={11.5}
                    fontWeight={600}
                    fill={C.accent}
                    opacity={ramp(t, REBAL_AT + REBAL_FOR - 0.25, 0.4)}
                  >
                    {`+${delta}`}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </g>
    </PanelSvg>
  );
}

const strategy: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default strategy;
