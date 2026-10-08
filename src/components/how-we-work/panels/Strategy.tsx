import {
  C,
  Card,
  Check,
  DATA,
  Mark,
  Mono,
  PanelSvg,
  easeInOut,
  easeOut,
  lerp,
  outro,
  ramp,
} from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 02 Growth Strategy. A growth plan built from specific opportunities.
// Work: four concrete client opportunities enter calmly with their channels and impact scores.
// The engine mix is derived directly from those opportunities.
// Result: as a v2 launch approaches, the creator opportunity rises in priority and glides
// smoothly to #1, re-balancing the engine mix towards creators with a quiet, decisive transition.
// Holds steady for a generous reading period before looping.

const DURATION = 27.0;
const SETTLE = 12.0;

// Beats.
const FOUND_AT = (i: number) => 0.6 + i * 0.7; // rows enter one by one calmly (0.6s to 2.7s)
const MIX_AT = 4.2; // engine mix derives from opportunities
const EVENT_AT = 6.8; // "v2 launch" priority chip appears
const BOOST_AT = 7.6; // creator impact rises
const BOOST_FOR = 0.9;
const RERANK_AT = 8.6; // creator opportunity glides to #1
const RERANK_DUR = 1.1;
const REBAL_AT = 9.7; // engine mix rebalances smoothly
const REBAL_FOR = 1.1;
const DONE_AT = 11.2; // final settled alignment

// Engine parts, matching brand aesthetic.
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
  initialSlot: number;
  finalSlot: number;
};

// 4 specific opportunities from client's strategy:
const OPPS: Opp[] = [
  {
    title: "Win “best vector DB for RAG”",
    marks: ["google", "chatgpt"],
    engine: 1,
    impact: 9.2,
    initialSlot: 0,
    finalSlot: 1,
  },
  {
    title: "Own r/LocalLLaMA self-hosting",
    marks: ["reddit"],
    engine: 2,
    impact: 7.8,
    initialSlot: 1,
    finalSlot: 2,
  },
  {
    title: "LangChain + LlamaIndex guides",
    marks: ["langchain", "docs"],
    engine: 0,
    impact: 7.1,
    initialSlot: 2,
    finalSlot: 3,
  },
  {
    title: "Launch v2 with tech creators",
    marks: ["youtube", "x"],
    engine: 3,
    impact: 6.4,
    boosted: 9.6,
    initialSlot: 3,
    finalSlot: 0,
  },
];

// Layout.
const CARD = { x: 52, y: 40, w: 376, h: 316 };
const L = CARD.x + 16;
const R = CARD.x + CARD.w - 16;
const HEAD_Y = CARD.y + 28;
const ROWS_Y = CARD.y + 52;
const ROW_H = 40;
const MIX_Y = ROWS_Y + 4 * ROW_H + 10;
const BAR = { x: L, y: MIX_Y + 27, w: R - L, h: 10 };
const LEG_Y = BAR.y + 30;
const COL_W = (R - L) / 4;
const IMP = { x: 336, w: 46 };
const STATUS_X = R - 130;

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

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const rebal = ramp(t, REBAL_AT, REBAL_FOR, easeInOut);
  const boost = ramp(t, BOOST_AT, BOOST_FOR, easeOut);
  const event = ramp(t, EVENT_AT, 0.5, easeOut);
  const done = ramp(t, DONE_AT, 0.4);
  const rerankK = ramp(t, RERANK_AT, RERANK_DUR, easeInOut);

  const working = 1 - ramp(t, EVENT_AT - 0.3, 0.3);
  const pulse = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 0.8);

  const shares = MIX_BEFORE.map((v, i) => lerp(v, MIX_AFTER[i], rebal));
  const chipW = 152;

  return (
    <PanelSvg t={t}>
      <g opacity={o}>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} />

        {/* ── Header ── */}
        <circle
          cx={L + 5}
          cy={HEAD_Y - 3.5}
          r={5.5}
          fill="none"
          stroke={C.hair}
          opacity={1 - done}
        />
        <g opacity={done}>
          <Check x={L + 5} y={HEAD_Y - 3.5} r={5.5} k={done} color={C.lightGreen} />
        </g>
        <Mono x={L + 18} y={HEAD_Y} size={9.5} fill={C.ink}>
          Growth plan
        </Mono>

        {/* Status: gentle glowing brand dot and text */}
        {working > 0 && (
          <g opacity={working}>
            <circle
              cx={STATUS_X - 9}
              cy={HEAD_Y - 4}
              r={5}
              fill={C.accent}
              opacity={0.18 * pulse}
            />
            <circle
              cx={STATUS_X - 9}
              cy={HEAD_Y - 4}
              r={2.5}
              fill={C.accent}
            />
            <text
              x={STATUS_X}
              y={HEAD_Y}
              fontSize={11.5}
              fill={C.muted}
            >
              Evaluating opportunities…
            </text>
          </g>
        )}

        {/* The priority event: clean borderless chip with glowing coral dot */}
        <g
          opacity={event}
          transform={`translate(${R - chipW} ${HEAD_Y - 15 + (1 - event) * 4})`}
        >
          <rect
            width={chipW}
            height={22}
            rx={11}
            fill={C.accentWash}
          />
          <circle cx={12} cy={11} r={5} fill={C.accent} opacity={0.25} />
          <circle cx={12} cy={11} r={2.5} fill={C.accent} />
          <text x={22} y={15} fontSize={11} fill={C.ink}>
            <tspan fontWeight={600}>v2 launch</tspan>
            <tspan fill={C.muted}> · in 3 weeks</tspan>
          </text>
        </g>

        <line x1={L} x2={R} y1={ROWS_Y - 6} y2={ROWS_Y - 6} stroke={C.hair} />

        {/* ── Opportunities: ALWAYS visible from start ── */}
        {OPPS.map((op) => {
          // Slot interpolates smoothly between initialSlot and finalSlot during the single rerank beat
          const currentSlot = lerp(op.initialSlot, op.finalSlot, rerankK);
          const y = ROWS_Y + currentSlot * ROW_H;
          const cy = y + ROW_H / 2;
          const value = op.boosted ? lerp(op.impact, op.boosted, boost) : op.impact;
          const isBoostedRow = Boolean(op.boosted);
          const highlightActive = isBoostedRow ? ramp(t, BOOST_AT - 0.2, 0.4) : 0;

          return (
            <g key={op.title}>
              {/* Background card for row: clean borderless surface */}
              <rect
                x={L - 8}
                y={y + 3}
                width={R - L + 16}
                height={ROW_H - 6}
                rx={8}
                fill={highlightActive > 0 ? C.accentWash : C.card}
              />
              {/* Active left indicator bar */}
              {highlightActive > 0 && (
                <rect
                  x={L - 8}
                  y={cy - 8}
                  width={2.5}
                  height={16}
                  rx={1}
                  fill={C.accent}
                  opacity={highlightActive}
                />
              )}

              {/* Channel tiles */}
              {op.marks.map((m, j) => (
                <Tile
                  key={m}
                  glyph={m}
                  x={L + 56 - (op.marks.length - 1 - j) * 25}
                  y={cy}
                />
              ))}

              {/* Title */}
              <text
                x={L + 76}
                y={cy + 4.2}
                fontSize={12.5}
                fontWeight={550}
                fill={C.ink}
              >
                {op.title}
              </text>

              {/* Impact bar */}
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
                width={Math.max(4, (IMP.w * value) / 10)}
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
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

          {/* ── Fixed rank numbers (01..04) ── */}
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

          {/* Bar track */}
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
              return (
                <g key={ENGINE[i].label}>
                  <rect
                    x={x0}
                    y={BAR.y}
                    width={Math.max(0, w)}
                    height={BAR.h}
                    rx={BAR.h / 2}
                    fill={ENGINE[i].color}
                  />
                </g>
              );
            });
          })()}

          {/* 4 Engine Part Metrics: ALWAYS visible */}
          {ENGINE.map((e, i) => {
            const x = L + i * COL_W;
            const delta = MIX_AFTER[i] - MIX_BEFORE[i];
            return (
              <g key={e.label}>
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
                  {`${Math.round(shares[i])}%`}
                </text>
                {i === CREATORS && (
                  <text
                    x={x + 38}
                    y={LEG_Y + 20}
                    fontSize={11.5}
                    fontWeight={600}
                    fill={C.accent}
                    opacity={ramp(t, REBAL_AT + REBAL_FOR - 0.2, 0.4)}
                  >
                    {`+${delta}%`}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </PanelSvg>
    );
  }

const strategy: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default strategy;
