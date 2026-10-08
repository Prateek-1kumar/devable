import { C, Card, Check, Mark, Mono, PanelSvg, easeInOut, easeOut, lerp, outro, polyline, ramp, usePanelId } from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 05 Optimization Loop. One chart card: twelve weeks of organic sessions draw
// calmly left → right, with a spike at launch week (W3) and steady compounding
// growth thereafter. As the line reaches key weeks, 3 real learning signals pop up
// with their leader lines and turn into next actions.
// Crucially, all signals and actions remain permanently visible through the settle
// period so the compounding story is clear, soothing, and complete.

const DURATION = 15.0;
const SETTLE = 12.0;

type Pt = readonly [number, number];

// ── Layout ────────────────────────────────────────────────────────────────────
const CARD = { x: 52, y: 44, w: 376, h: 304 };
const PLOT = { x: 74, y: 150, w: 332, h: 125 };
const BASE = PLOT.y + PLOT.h; // y = 275

// 12 weeks of traffic data showing launch spike at W3 then compounding growth
const VALS = [12, 16, 54, 32, 40, 48, 56, 66, 77, 88, 100, 114];
const MAX_VAL = 120;
const wx = (i: number) => PLOT.x + (i * PLOT.w) / (VALS.length - 1);
const vy = (v: number) => BASE - (v / MAX_VAL) * PLOT.h;
const PTS: Pt[] = VALS.map((v, i) => [wx(i), vy(v)]);
const LAUNCH = 2; // W3 (0-indexed: index 2)

// Paced progress through the 12 weeks
const LEGS = [
  { at: 0.4, dur: 3.2, from: 0, to: 4 }, // W1 to W5 (signals 1 appears)
  { at: 4.2, dur: 2.8, from: 4, to: 7 }, // W5 to W8 (signal 2 appears)
  { at: 7.4, dur: 2.6, from: 7, to: 10 }, // W8 to W11 (signal 3 appears)
  { at: 10.2, dur: 1.0, from: 10, to: 11 }, // W11 to W12 (compounding peak)
];

function progress(t: number) {
  if (t < 0.4) return 0;
  let p = 0;
  for (const l of LEGS) {
    if (t >= l.at) {
      p = lerp(l.from, l.to, ramp(t, l.at, l.dur, easeInOut));
    }
  }
  return Math.min(VALS.length - 1, p);
}

type Signal = {
  week: number;
  at: number;
  mark: MarkName;
  text: string;
  action: string;
  cardX: number;
  cardW: number;
};

// 3 non-colliding signal cards aligned across a neat horizontal shelf above the curve
const SIGNALS: Signal[] = [
  {
    week: 4, // W5
    at: 3.6,
    mark: "googlesearchconsole",
    text: "Page #9 → #3",
    action: "Double down",
    cardX: 62,
    cardW: 108,
  },
  {
    week: 7, // W8
    at: 6.8,
    mark: "chatgpt",
    text: "AI prompt gap",
    action: "Write answer",
    cardX: 182,
    cardW: 112,
  },
  {
    week: 10, // W11
    at: 9.8,
    mark: "youtube",
    text: "Creator 3× reach",
    action: "Rebook creator",
    cardX: 306,
    cardW: 112,
  },
];

const STATUS = [
  { text: "Tracking rankings…", from: 0.4, to: 4.6 },
  { text: "Auditing AI prompts…", from: 4.6, to: 7.8 },
  { text: "Comparing creators…", from: 7.8, to: 11.0 },
];
const DONE_AT = 11.2;

/** The smooth polyline up to fractional week `p`. */
function upTo(p: number): Pt[] {
  const n = Math.floor(p);
  const pts = PTS.slice(0, n + 1);
  if (p > n && n + 1 < PTS.length) {
    pts.push([
      lerp(PTS[n][0], PTS[n + 1][0], p - n),
      lerp(PTS[n][1], PTS[n + 1][1], p - n),
    ]);
  }
  return pts;
}

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const grad = usePanelId("opt-area");
  const p = progress(t);
  const pts = upTo(p);
  const tip = pts[pts.length - 1] ?? PTS[0];
  const drawing = LEGS.some((l) => t >= l.at && t < l.at + l.dur);
  const launch = ramp(t, 1.8, 0.45, easeOut);
  const done = ramp(t, DONE_AT, 0.4, easeOut);

  return (
    <PanelSvg t={t}>
      <defs>
        <linearGradient id={grad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity={0.18} />
          <stop offset="1" stopColor="var(--accent)" stopOpacity={0.0} />
        </linearGradient>
      </defs>

      <g opacity={o}>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} />

        {/* ── Header ── */}
        <Mark name="googleanalytics" x={CARD.x + 25} y={CARD.y + 26} size={14} />
        <text
          x={CARD.x + 40}
          y={CARD.y + 30.5}
          fontSize={12.5}
          fontWeight={550}
          fill={C.ink}
        >
          Organic sessions
        </text>

        {/* Status messages while running */}
        {STATUS.map((s) => {
          const k = Math.min(ramp(t, s.from, 0.3), 1 - ramp(t, s.to - 0.25, 0.25));
          if (k <= 0) return null;
          return (
            <g key={s.text} opacity={k}>
              <circle cx={CARD.x + CARD.w - 138} cy={CARD.y + 26.5} r={3} fill={C.accent} />
              <Mono x={CARD.x + CARD.w - 18} y={CARD.y + 30} size={9.5} textAnchor="end">
                {s.text}
              </Mono>
            </g>
          );
        })}

        {/* Settled state in header */}
        <g opacity={done} transform={`translate(0 ${(1 - done) * 4})`}>
          <Check x={CARD.x + CARD.w - 156} y={CARD.y + 26.5} r={5.5} k={done} color={C.lightGreen} />
          <Mono
            x={CARD.x + CARD.w - 18}
            y={CARD.y + 30}
            size={9.5}
            fill={C.lightGreen}
            fontWeight={600}
            textAnchor="end"
          >
            3 actions compounding
          </Mono>
        </g>

        {/* Subtle grid lines & axes */}
        {[30, 70, 105].map((v) => (
          <line
            key={v}
            x1={PLOT.x}
            x2={PLOT.x + PLOT.w}
            y1={vy(v)}
            y2={vy(v)}
            stroke={C.hair}
            strokeDasharray="2 4"
          />
        ))}
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={BASE} y2={BASE} stroke={C.line} />
        <Mono x={PLOT.x} y={BASE + 18} size={9} textAnchor="middle">
          W1
        </Mono>
        <Mono x={PLOT.x + PLOT.w} y={BASE + 18} size={9} textAnchor="middle">
          W12
        </Mono>

        {/* Launch week marker at W3 */}
        <g opacity={launch}>
          <line
            x1={PTS[LAUNCH][0]}
            x2={PTS[LAUNCH][0]}
            y1={PTS[LAUNCH][1] + 6}
            y2={BASE}
            stroke={C.line}
            strokeDasharray="2 3"
          />
          <Mono
            x={PTS[LAUNCH][0]}
            y={PTS[LAUNCH][1] - 12}
            size={8.5}
            fill={C.muted}
            textAnchor="middle"
          >
            Launch week
          </Mono>
          <Mono x={PTS[LAUNCH][0]} y={BASE + 18} size={9} textAnchor="middle">
            W3
          </Mono>
        </g>

        {/* The organic traffic curve & soft area fill */}
        {pts.length > 1 && (
          <g>
            <path
              d={`${polyline(pts)} L${tip[0]} ${BASE} L${PLOT.x} ${BASE} Z`}
              fill={`url(#${grad})`}
            />
            <path
              d={polyline(pts)}
              fill="none"
              stroke={C.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Pen tip tracking curve head */}
        {p > 0 && (
          <g transform={`translate(${tip[0]} ${tip[1]})`}>
            <circle r={7} fill={C.accent} opacity={drawing ? 0.18 : 0.08} />
            <circle r={3.5} fill={C.accent} stroke={C.card} strokeWidth={1.2} />
          </g>
        )}

        {/* 3 Persistent Signal popovers and leaders */}
        {SIGNALS.map((s) => (
          <SignalCard key={s.text} s={s} t={t} />
        ))}
      </g>
    </PanelSvg>
  );
}

/** A signal popover card and its connection to the traffic line. */
function SignalCard({ s, t }: { s: Signal; t: number }) {
  const [px, py] = PTS[s.week];
  const reached = ramp(t, s.at - 0.1, 0.4, easeOut);
  if (reached <= 0) return null;

  const cardIn = ramp(t, s.at, 0.45, easeOut);
  const green = ramp(t, s.at + 0.8, 0.4, easeOut);
  const cardY = 68;
  const cardH = 46;
  const leaderX = s.cardX + s.cardW / 2;

  return (
    <g>
      {/* Dashed vertical leader line from card down to data point */}
      <line
        x1={leaderX}
        x2={px}
        y1={cardY + cardH}
        y2={py - 6}
        stroke={green > 0.5 ? C.lightGreen : C.accentLine}
        strokeWidth={1}
        strokeDasharray="2 3"
        opacity={cardIn * 0.85}
      />

      {/* Point on the traffic curve: pulses coral, then settles to light green check dot */}
      <circle
        cx={px}
        cy={py}
        r={4.2}
        fill={green > 0.5 ? C.lightGreen : C.accent}
        stroke={C.card}
        strokeWidth={1.4}
      />

      {/* Popover card */}
      <g opacity={cardIn} transform={`translate(0 ${(1 - cardIn) * 4})`}>
        <Card x={s.cardX} y={cardY} w={s.cardW} h={cardH} r={8} />
        <rect
          x={s.cardX + 0.5}
          y={cardY + 0.5}
          width={s.cardW - 1}
          height={cardH - 1}
          rx={7.5}
          fill="none"
          stroke={green > 0.5 ? C.line : C.accentLine}
        />

        {/* Header: source mark + signal description */}
        <Mark name={s.mark} x={s.cardX + 13} y={cardY + 14} size={11} />
        <text
          x={s.cardX + 24}
          y={cardY + 17}
          fontSize={10}
          fontWeight={550}
          fill={C.ink}
        >
          {s.text}
        </text>

        {/* Next action pill */}
        <g transform={`translate(${s.cardX + 7} ${cardY + 25})`}>
          <rect
            width={s.cardW - 14}
            height={16}
            rx={8}
            fill={green > 0.5 ? C.lightGreenSoft : C.accentWash}
            stroke={green > 0.5 ? "transparent" : C.accentLine}
          />
          {green < 0.5 ? (
            <text
              x={(s.cardW - 14) / 2}
              y={11.2}
              fontSize={9}
              fontWeight={600}
              fill={C.accent}
              textAnchor="middle"
            >
              {`→ ${s.action}`}
            </text>
          ) : (
            <g>
              <Check x={11} y={8} r={4.5} k={green} color={C.lightGreen} />
              <text
                x={19}
                y={11.2}
                fontSize={9}
                fontWeight={600}
                fill={C.lightGreen}
              >
                {s.action}
              </text>
            </g>
          )}
        </g>
      </g>
    </g>
  );
}

const optimization: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default optimization;
