import { STEPS } from "../content";
import { C, Card, Check, DATA, Mark, Mono, PanelSvg, Pulse, Trace, blip, clamp01, easeOut, lerp, outro, polyline, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 05 Optimization Loop. Beginning: the performance chart draws twelve weeks of
// organic, AI-referred and pipeline growth, and the last weeks sag. Work: an
// insight flags /compare-x slipping from #3 to #7, Refresh is pressed, the page
// ships as v2. Result: the loop closes back into the chart, W12 ticks up,
// pipeline lands at +61% and the insight resolves.

const DURATION = 8;
const SETTLE = 7.3;

type Pt = [number, number];

// ── Chart ─────────────────────────────────────────────────────────────────────
const CHART = { x: 20, y: 100, w: 520, h: 214 };
const PLOT = { x: 60, y: 146, w: 416, h: 132 };
const DOMAIN = [90, 250] as const;
const TICKS = [100, 150, 200, 250];
const WEEKS = 12;
// Indexed to W1 = 100. W10–W11 sag as /compare-x slips; W12 is the week after the refresh.
const SERIES = [
  { label: "Organic", color: DATA.blue, width: 1.6, vals: [100, 106, 111, 118, 124, 131, 137, 146, 152, 147, 143, 174] },
  { label: "AI-referred", color: DATA.teal, width: 1.6, vals: [100, 104, 112, 121, 133, 142, 155, 168, 181, 186, 184, 226] },
  { label: "Pipeline", color: C.accent, width: 2.2, vals: [100, 103, 107, 112, 118, 124, 129, 136, 145, 142, 140, 161] },
];
const PIPE = SERIES[2];
const wx = (i: number) => PLOT.x + (i * PLOT.w) / (WEEKS - 1);
const vy = (v: number) => PLOT.y + PLOT.h - ((v - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * PLOT.h;
const DRAW_AT = 0.5;
const DRAW_FOR = 2.2;
const LIVE_AT = 5.6; // W12 draws in after the loop closes.

/** The series up to week `p` (0..WEEKS-1, fractional), as points. */
function upTo(vals: readonly number[], p: number): Pt[] {
  const n = Math.floor(p);
  const pts: Pt[] = vals.slice(0, n + 1).map((v, i) => [wx(i), vy(v)]);
  if (p > n && n + 1 < vals.length) pts.push([lerp(wx(n), wx(n + 1), p - n), vy(lerp(vals[n], vals[n + 1], p - n))]);
  return pts;
}

// ── Bottom row ────────────────────────────────────────────────────────────────
const DOC = { x: 20, y: 340, w: 216, h: 164 };
const INS = { x: 272, y: 340, w: 268, h: 164 };
const INSIGHT_AT = 3.1;
const PRESS_AT = 3.95;
const UPDATE_AT = 4.45;
const V2_AT = 5.15;
const RESOLVED_AT = 6.25;
// Rank by week (W4–W11), then the recovery after v2.
const RANK = [3, 3, 2, 3, 4, 5, 6, 7];
const SPARK = { x: INS.x + 16, y: INS.y + 74, w: 120, h: 34 };
const sx = (i: number) => SPARK.x + (i * SPARK.w) / RANK.length;
const sy = (r: number) => SPARK.y + ((r - 1) / 7) * SPARK.h;
const CHANGES = ["Pricing table · 2026", "3 new benchmarks", "FAQ schema added"];
const changeAt = (i: number) => UPDATE_AT + 0.12 + i * 0.22;

// The loop: chart → insight (down), insight → content (back), content → chart (up).
const TO_INSIGHT: Pt[] = [[wx(10), CHART.y + CHART.h], [wx(10), INS.y]];
const TO_DOC: Pt[] = [[INS.x, INS.y + 82], [DOC.x + DOC.w, INS.y + 82]];
const TO_CHART: Pt[] = [[DOC.x + 108, DOC.y], [DOC.x + 108, CHART.y + CHART.h]];
const LINKS = [
  { pts: TO_INSIGHT, at: 2.85, color: C.accent },
  { pts: TO_DOC, at: 4.05, color: C.accent },
  { pts: TO_CHART, at: 5.25, color: C.primary },
];

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const drawn = ramp(t, DRAW_AT, DRAW_FOR, (x) => x) * (WEEKS - 2);
  const live = ramp(t, LIVE_AT, 0.7, easeOut);
  const p = drawn < WEEKS - 2 ? drawn : WEEKS - 2 + live;
  const insight = ramp(t, INSIGHT_AT, 0.35) * o;
  const press = blip(t, PRESS_AT, 0.25, 0.1);
  const pressed = t >= PRESS_AT;
  const updating = ramp(t, UPDATE_AT, V2_AT - UPDATE_AT, (x) => x);
  const v2 = ramp(t, V2_AT, 0.3) * o;
  const resolved = ramp(t, RESOLVED_AT, 0.35) * o;
  const docActive = blip(t, UPDATE_AT - 0.1, V2_AT - UPDATE_AT + 0.1, 0.15);
  const pipeTip = upTo(PIPE.vals, p).at(-1)!;
  const pipePct = Math.round(((p < WEEKS - 2 ? lerp(PIPE.vals[Math.floor(p)], PIPE.vals[Math.min(Math.floor(p) + 1, WEEKS - 1)], p % 1) : lerp(PIPE.vals[10], PIPE.vals[11], live)) - 100));

  return (
    <PanelSvg metrics={STEPS[4].metrics} t={t} metricsAt={[0.9, UPDATE_AT + 0.1]} metricsFor={[6.9, 0.8]}>
      {/* Loop links first, so cards sit on top of them. */}
      {LINKS.map((l, i) => {
        const k = ramp(t, l.at, 0.4, easeOut);
        const [a, b] = l.pts.slice(-2);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * (180 / Math.PI);
        return (
          <g key={i}>
            <path d={polyline(l.pts)} fill="none" stroke={C.ink} strokeOpacity={0.14} strokeDasharray="2 3" />
            <Trace d={polyline(l.pts)} k={k} stroke={l.color} width={1.4} opacity={o} />
            <Pulse points={l.pts} k={t < l.at ? -1 : (t - l.at) / 0.4} color={l.color} r={2.6} />
            <path d="M-5 -3.5 L0 0 L-5 3.5" fill="none" stroke={l.color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${b[0]} ${b[1]}) rotate(${ang})`} opacity={ramp(t, l.at + 0.3, 0.15) * o} />
          </g>
        );
      })}

      {/* Performance chart. */}
      <Card x={CHART.x} y={CHART.y} w={CHART.w} h={CHART.h} />
      <Mono x={CHART.x + 16} y={CHART.y + 22} size={9.5} fill={C.ink}>
        Performance
      </Mono>
      <Mono x={CHART.x + 98} y={CHART.y + 22} size={8.8}>
        · Index, W1 = 100
      </Mono>
      {SERIES.map((s, i) => {
        const x = CHART.x + CHART.w - 16 - [228, 152, 64][i];
        return (
          <g key={s.label}>
            <line x1={x} x2={x + 12} y1={CHART.y + 19} y2={CHART.y + 19} stroke={s.color} strokeWidth={s.width + 0.4} strokeLinecap="round" />
            <Mono x={x + 17} y={CHART.y + 22} size={8.6} fill={i === 2 ? C.ink : C.muted}>
              {s.label}
            </Mono>
          </g>
        );
      })}
      {TICKS.map((v) => (
        <g key={v}>
          <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={vy(v)} y2={vy(v)} stroke={C.ink} strokeOpacity={v === 100 ? 0.22 : 0.08} />
          <Mono x={PLOT.x - 8} y={vy(v) + 3} size={8.4} textAnchor="end">
            {v}
          </Mono>
        </g>
      ))}
      {Array.from({ length: WEEKS }, (_, i) => (
        <Mono key={i} x={wx(i)} y={PLOT.y + PLOT.h + 18} size={8.4} textAnchor="middle" fill={i === WEEKS - 1 && live * o > 0.5 ? C.ink : C.muted} opacity={i === WEEKS - 1 ? 0.55 + 0.45 * live * o : 1}>
          {`W${i + 1}`}
        </Mono>
      ))}
      {/* The refresh ships between W11 and W12. */}
      <g opacity={ramp(t, LIVE_AT - 0.15, 0.3) * o}>
        <line x1={(wx(10) + wx(11)) / 2} x2={(wx(10) + wx(11)) / 2} y1={PLOT.y - 2} y2={PLOT.y + PLOT.h} stroke={C.primary} strokeDasharray="2 3" />
        <rect x={(wx(10) + wx(11)) / 2 - 52} y={PLOT.y - 1} width={46} height={16} rx={8} fill={C.primarySoft} />
        <Mono x={(wx(10) + wx(11)) / 2 - 29} y={PLOT.y + 10} size={8.4} fill={C.primary} textAnchor="middle">
          v2 live
        </Mono>
      </g>
      {/* Pipeline area, then the three lines drawing on week by week. */}
      {p > 0 && (
        <path
          d={`${polyline(upTo(PIPE.vals, p))} L${pipeTip[0]} ${PLOT.y + PLOT.h} L${PLOT.x} ${PLOT.y + PLOT.h} Z`}
          fill={C.accentSoft}
          opacity={0.55 * o}
        />
      )}
      {SERIES.map((s) => {
        const pts = upTo(s.vals, p);
        const tip = pts[pts.length - 1];
        return (
          <g key={s.label} opacity={o}>
            {p > 0 && <path d={polyline(pts)} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" />}
            {p > 0 && <circle cx={tip[0]} cy={tip[1]} r={3.2} fill={s.color} stroke={C.card} strokeWidth={1.5} />}
          </g>
        );
      })}
      {/* Pipeline readout at the tip. */}
      <g opacity={ramp(t, DRAW_AT + 0.3, 0.3) * o} transform={`translate(${pipeTip[0] + 10} ${pipeTip[1] - 8})`}>
        <rect width={40} height={16} rx={8} fill={t > LIVE_AT ? C.accent : C.card} stroke={C.accent} />
        <Mono x={20} y={11.2} size={8.8} fill={t > LIVE_AT ? "#fff" : C.accent} textAnchor="middle">
          {`+${pipePct}%`}
        </Mono>
      </g>

      {/* Content: the page that gets refreshed. */}
      <g>
        <Card x={DOC.x} y={DOC.y} w={DOC.w} h={DOC.h} stroke={docActive > 0.01 ? C.accent : C.line} strokeWidth={1 + docActive * 0.5} />
        <rect x={DOC.x + 14} y={DOC.y + 14} width={28} height={28} rx={7} fill={C.paper} stroke={C.line} />
        <g transform={`translate(${DOC.x + 28} ${DOC.y + 28})`}>
          <Doc />
        </g>
        <text x={DOC.x + 52} y={DOC.y + 26} fontSize={11.5} fontWeight={550} fill={C.ink}>
          Acme vs X (2026)
        </text>
        <Mono x={DOC.x + 52} y={DOC.y + 40} size={8.8}>
          /compare-x
        </Mono>
        {/* Version badge: v1 (grey) → v2 (deep green). */}
        <rect x={DOC.x + DOC.w - 40} y={DOC.y + 14} width={26} height={16} rx={8} fill={v2 > 0.5 ? C.primary : C.paper} stroke={v2 > 0.5 ? C.primary : C.line} />
        <Mono x={DOC.x + DOC.w - 27} y={DOC.y + 25} size={8.8} fill={v2 > 0.5 ? "#fff" : C.muted} textAnchor="middle">
          {v2 > 0.5 ? "v2" : "v1"}
        </Mono>
        <line x1={DOC.x + 14} x2={DOC.x + DOC.w - 14} y1={DOC.y + 54} y2={DOC.y + 54} stroke={C.line} />
        <Mono x={DOC.x + 14} y={DOC.y + 70} size={8.6}>
          Changes
        </Mono>
        {CHANGES.map((c, i) => {
          const k = ramp(t, changeAt(i), 0.3) * o;
          const y = DOC.y + 88 + i * 16;
          return (
            <g key={c}>
              <rect x={DOC.x + 14} y={y - 6} width={[118, 96, 104][i]} height={6} rx={3} fill={C.line} opacity={1 - k} />
              <g opacity={k}>
                <path d={`M${DOC.x + 15} ${y - 3}h7M${DOC.x + 18.5} ${y - 6.5}v7`} stroke={C.primary} strokeWidth={1.4} strokeLinecap="round" />
                <Mono x={DOC.x + 28} y={y} size={8.8} fill={C.ink}>
                  {c}
                </Mono>
              </g>
            </g>
          );
        })}
        {/* Status: stale → updating → republished. */}
        <rect x={DOC.x + 14} y={DOC.y + 148} width={DOC.w - 28} height={3} rx={1.5} fill={C.line} />
        <rect x={DOC.x + 14} y={DOC.y + 148} width={(DOC.w - 28) * updating * o} height={3} rx={1.5} fill={v2 > 0.5 ? C.primary : C.accent} />
        <Mono x={DOC.x + 14} y={DOC.y + 140} size={8.4} fill={v2 > 0.5 ? C.primary : t > UPDATE_AT ? C.accent : C.muted}>
          {v2 > 0.5 ? "Republished · just now" : t > UPDATE_AT ? "Updating…" : "Last updated 214 d ago"}
        </Mono>
      </g>

      {/* Insight: the page losing rank, and its fix. */}
      <Card x={INS.x} y={INS.y} w={INS.w} h={INS.h} stroke={insight > 0.5 && resolved < 0.5 ? C.accent : C.line} strokeOpacity={insight > 0.5 && resolved < 0.5 ? 0.6 : 1} />
      <Mono x={INS.x + 16} y={INS.y + 22} size={9.5} fill={C.ink}>
        Insights
      </Mono>
      <Mark name="googlesearchconsole" x={INS.x + INS.w - 104} y={INS.y + 19} size={11} />
      <Mono x={INS.x + INS.w - 16} y={INS.y + 22} size={8.4} textAnchor="end">
        Search Console
      </Mono>
      {/* Idle: watching pages. */}
      <g opacity={1 - ramp(t, INSIGHT_AT - 0.1, 0.2)}>
        <Mono x={INS.x + 16} y={INS.y + 50} size={8.8}>
          Watching 64 pages
        </Mono>
        <rect x={INS.x + 16} y={INS.y + 66} width={180} height={6} rx={3} fill={C.line} />
        <rect x={INS.x + 16} y={INS.y + 82} width={132} height={6} rx={3} fill={C.line} />
        <rect x={INS.x + 16} y={INS.y + 98} width={156} height={6} rx={3} fill={C.line} />
      </g>
      <g opacity={insight}>
        {resolved > 0.5 ? <Check x={INS.x + 21} y={INS.y + 44} r={5.5} k={1} /> : (
          <g>
            <circle cx={INS.x + 21} cy={INS.y + 44} r={7 + 3 * blip(t, INSIGHT_AT + 0.3, 0.3, 0.3)} fill={C.accent} opacity={0.18} />
            <circle cx={INS.x + 21} cy={INS.y + 44} r={3.5} fill={C.accent} />
          </g>
        )}
        <text x={INS.x + 34} y={INS.y + 48} fontSize={11.5} fontWeight={550} fill={C.ink}>
          {resolved > 0.5 ? "/compare-x back to #3" : "/compare-x losing rank"}
        </text>
        <Mono x={INS.x + 34} y={INS.y + 62} size={8.8}>
          {resolved > 0.5 ? "query “acme vs x” · +58% clicks" : "query “acme vs x” · −42% clicks"}
        </Mono>
        {/* Rank sparkline (#1 at top). */}
        <line x1={SPARK.x} x2={SPARK.x + SPARK.w} y1={sy(3)} y2={sy(3)} stroke={C.ink} strokeOpacity={0.12} strokeDasharray="2 3" />
        <Trace d={polyline(RANK.map((r, i) => [sx(i), sy(r)]))} k={ramp(t, INSIGHT_AT + 0.1, 0.6, easeOut)} stroke={C.accent} width={1.5} />
        <Trace d={polyline([[sx(7), sy(7)], [sx(8), sy(3)]])} k={ramp(t, RESOLVED_AT - 0.2, 0.4, easeOut)} stroke={C.primary} width={1.5} />
        <circle cx={resolved > 0.5 ? sx(8) : sx(7)} cy={resolved > 0.5 ? sy(3) : sy(7)} r={2.8} fill={resolved > 0.5 ? C.primary : C.accent} stroke={C.card} strokeWidth={1.2} opacity={ramp(t, INSIGHT_AT + 0.6, 0.2)} />
        <text x={INS.x + INS.w - 16} y={SPARK.y + 22} fontSize={20} fontWeight={600} letterSpacing="-0.02em" fill={resolved > 0.5 ? C.primary : C.accent} textAnchor="end">
          {resolved > 0.5 ? "#3" : "#7"}
        </text>
        <Mono x={INS.x + INS.w - 16} y={SPARK.y + 38} size={8.6} textAnchor="end">
          {resolved > 0.5 ? "was #7" : "was #3"}
        </Mono>
        <line x1={INS.x + 16} x2={INS.x + INS.w - 16} y1={INS.y + 120} y2={INS.y + 120} stroke={C.line} />
        <Mono x={INS.x + 16} y={INS.y + 145} size={8.8} fill={resolved > 0.5 ? C.primary : C.muted}>
          {resolved > 0.5 ? "Rank recovered" : "Suggested fix"}
        </Mono>
        {/* Refresh button → pressed → resolved. */}
        {resolved > 0.5 ? (
          <g>
            <rect x={INS.x + INS.w - 112} y={INS.y + 130} width={96} height={22} rx={11} fill={C.primary} />
            <text x={INS.x + INS.w - 72} y={INS.y + 145} fontSize={11} fontWeight={550} fill="#fff" textAnchor="middle">
              Refreshed
            </text>
            <path d={`M${INS.x + INS.w - 36} ${INS.y + 141} l3 3 l5 -6`} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : (
          <g>
            <rect
              x={INS.x + INS.w - 92}
              y={INS.y + 130}
              width={76}
              height={22}
              rx={11}
              fill={pressed ? C.accent : C.card}
              stroke={C.accent}
              opacity={1 - 0.2 * press}
            />
            <text x={INS.x + INS.w - 54} y={INS.y + 145} fontSize={11} fontWeight={550} fill={pressed ? "#fff" : C.accent} textAnchor="middle">
              {pressed ? "Refreshing" : "Refresh"}
            </text>
          </g>
        )}
      </g>
      {/* Cursor glides to Refresh and clicks. */}
      <Cursor t={t} />
    </PanelSvg>
  );
}

function Cursor({ t }: { t: number }) {
  const k = ramp(t, PRESS_AT - 0.6, 0.55);
  const show = Math.min(ramp(t, PRESS_AT - 0.7, 0.15), 1 - ramp(t, PRESS_AT + 0.35, 0.2));
  if (show <= 0) return null;
  const x = lerp(INS.x + 168, INS.x + INS.w - 50, k);
  const y = lerp(INS.y + 156, INS.y + 143, k);
  const ring = blip(t, PRESS_AT, 0.1, 0.15);
  return (
    <g opacity={show}>
      <circle cx={x} cy={y} r={6 + 8 * clamp01((t - PRESS_AT) / 0.4)} fill="none" stroke={C.accent} opacity={ring * 0.6} />
      <path d="M0 0 L0 13 L3.5 9.8 L6 15 L8 14 L5.6 9 L10 9 Z" transform={`translate(${x} ${y})`} fill={C.ink} stroke="#fff" strokeWidth={1} strokeLinejoin="round" />
    </g>
  );
}

function Doc() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.3} strokeLinejoin="round" transform="translate(-6 -7.5)">
      <path d="M1 1h7.5L12 4.5V14H1z" />
      <path d="M8.5 1v3.5H12M3.5 8h6M3.5 10.8h6" strokeLinecap="round" />
    </g>
  );
}

const optimization: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default optimization;
