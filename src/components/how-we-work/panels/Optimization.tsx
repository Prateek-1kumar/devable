import type { ReactNode } from "react";
import { STEPS } from "../content";
import { C, Card, Check, DATA, Mark, Mono, PanelSvg, Pulse, Trace, clamp01, easeOut, lerp, outro, polyline, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 05 Optimization Loop. Beginning: the performance chart draws eleven weeks of
// organic, AI-referred and pipeline growth, and the last weeks sag. Work: an
// insight flags /compare-x slipping from #3 to #7, Refresh is pressed, the page
// ships as v2. Result: the loop closes back into the chart, W12 ticks up,
// pipeline lands at +61% and the insight resolves.

const DURATION = 9;
const SETTLE = 7.4;

type Pt = [number, number];

// ── Timeline ──────────────────────────────────────────────────────────────────
const DRAW_AT = 0.6; // W1 → W11 draws on
const DRAW_FOR = 2.0;
const INSIGHT_AT = 3.2; // insight replaces the idle watch list
const PRESS_AT = 4.6; // cursor clicks Refresh
const UPDATE_AT = 5.0; // the page is rewritten
const V2_AT = 5.75; // …and republished
const LIVE_AT = 6.3; // W12 draws in after the loop closes
const RESOLVED_AT = 6.85; // the insight resolves
const rise = (k: number) => `translate(0 ${(1 - k) * 5})`;

// ── Chart ─────────────────────────────────────────────────────────────────────
const CHART = { x: 20, y: 92, w: 520, h: 200 };
const PLOT = { x: 60, y: 138, w: 416, h: 112 };
const DOMAIN = [90, 250] as const;
const TICKS = [100, 150, 200, 250];
const WEEKS = 12;
// Indexed to W1 = 100. W10–W11 sag as /compare-x slips; W12 is the week after the refresh.
const SERIES = [
  { label: "Organic", color: DATA.blue, width: 1.5, vals: [100, 106, 111, 118, 124, 131, 137, 146, 152, 147, 143, 174] },
  { label: "AI-referred", color: DATA.teal, width: 1.5, vals: [100, 104, 112, 121, 133, 142, 155, 168, 181, 186, 184, 226] },
  { label: "Pipeline", color: C.accent, width: 2, vals: [100, 103, 107, 112, 118, 124, 129, 136, 145, 142, 140, 161] },
];
const PIPE = SERIES[2];
const wx = (i: number) => PLOT.x + (i * PLOT.w) / (WEEKS - 1);
const vy = (v: number) => PLOT.y + PLOT.h - ((v - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * PLOT.h;
const SHIP_X = (wx(10) + wx(11)) / 2;

/** The series up to week `p` (0..WEEKS-1, fractional), as points. */
function upTo(vals: readonly number[], p: number): Pt[] {
  const n = Math.floor(p);
  const pts: Pt[] = vals.slice(0, n + 1).map((v, i) => [wx(i), vy(v)]);
  if (p > n && n + 1 < vals.length) pts.push([lerp(wx(n), wx(n + 1), p - n), vy(lerp(vals[n], vals[n + 1], p - n))]);
  return pts;
}
const valAt = (vals: readonly number[], p: number) => lerp(vals[Math.floor(p)], vals[Math.min(Math.floor(p) + 1, vals.length - 1)], p % 1);

// ── Bottom row ────────────────────────────────────────────────────────────────
const DOC = { x: 20, y: 320, w: 224, h: 184 };
const INS = { x: 276, y: 320, w: 264, h: 184 };
// Rank by week (W4–W11), then the recovery after v2.
const RANK = [3, 3, 2, 3, 4, 5, 6, 7];
const SPARK = { x: INS.x + 16, y: INS.y + 86, w: 132, h: 28 };
const sx = (i: number) => SPARK.x + (i * SPARK.w) / RANK.length;
const sy = (r: number) => SPARK.y + ((r - 1) / 6) * SPARK.h;
const CHANGES = ["2026 pricing table", "3 new benchmarks"];
const changeAt = (i: number) => UPDATE_AT + 0.15 + i * 0.3;
const BTN = { x: INS.x + INS.w - 112, y: INS.y + 146, w: 96, h: 24 };

// The loop: chart → insight (down), insight → content (back), content → chart (up).
const TO_INSIGHT: Pt[] = [[wx(10), CHART.y + CHART.h], [wx(10), INS.y]];
const TO_DOC: Pt[] = [[INS.x, INS.y + 100], [DOC.x + DOC.w, INS.y + 100]];
const TO_CHART: Pt[] = [[DOC.x + 112, DOC.y], [DOC.x + 112, CHART.y + CHART.h]];
const LINKS = [
  { pts: TO_INSIGHT, at: 2.75, color: C.accent },
  { pts: TO_DOC, at: PRESS_AT + 0.15, color: C.accent },
  { pts: TO_CHART, at: V2_AT + 0.1, color: C.primary },
];
const LINK_FOR = 0.45;

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  // Outro in two halves: the built state fades out, then the idle state fades back in.
  const o1 = clamp01((o - 0.5) * 2);
  const r1 = clamp01(1 - o * 2);
  const drawn = ramp(t, DRAW_AT, DRAW_FOR, easeOut) * (WEEKS - 2);
  const live = ramp(t, LIVE_AT, 0.6);
  const p = drawn < WEEKS - 2 ? drawn : WEEKS - 2 + live;
  const insight = ramp(t, INSIGHT_AT, 0.45, easeOut);
  const pressed = ramp(t, PRESS_AT, 0.25);
  const updating = ramp(t, UPDATE_AT, V2_AT - UPDATE_AT);
  const v2 = ramp(t, V2_AT, 0.35);
  const resolved = ramp(t, RESOLVED_AT, 0.4);
  const docActive = Math.min(ramp(t, UPDATE_AT - 0.1, 0.3), 1 - ramp(t, V2_AT, 0.4));
  const insActive = insight * (1 - resolved);
  const pipeTip = upTo(PIPE.vals, p).at(-1)!;
  const pipePct = Math.round(valAt(PIPE.vals, p) - 100);

  return (
    <PanelSvg metrics={STEPS[4].metrics} t={t} metricsAt={[LIVE_AT, V2_AT]} metricsFor={[0.7, 0.6]}>
      {/* Loop links first, so cards sit on top of them. */}
      {LINKS.map((l, i) => {
        const k = ramp(t, l.at, LINK_FOR);
        const [a, b] = l.pts.slice(-2);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * (180 / Math.PI);
        return (
          <g key={i}>
            <path d={polyline(l.pts)} fill="none" stroke={C.ink} strokeOpacity={0.12} strokeDasharray="2 3" />
            <Trace d={polyline(l.pts)} k={k} stroke={l.color} width={1} opacity={o} />
            <Pulse points={l.pts} k={t < l.at ? -1 : (t - l.at) / LINK_FOR} color={l.color} r={2.4} />
            <path d="M-4.5 -3 L0 0 L-4.5 3" fill="none" stroke={l.color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${b[0]} ${b[1]}) rotate(${ang})`} opacity={ramp(t, l.at + LINK_FOR - 0.1, 0.2) * o} />
          </g>
        );
      })}

      {/* Performance chart. */}
      <Card x={CHART.x} y={CHART.y} w={CHART.w} h={CHART.h} />
      <Mono x={CHART.x + 18} y={CHART.y + 26} size={9.5} fill={C.ink}>
        Performance
      </Mono>
      {SERIES.map((s, i) => {
        const x = CHART.x + CHART.w - 18 - [228, 152, 64][i];
        return (
          <g key={s.label}>
            <line x1={x} x2={x + 12} y1={CHART.y + 23} y2={CHART.y + 23} stroke={s.color} strokeWidth={2} strokeLinecap="round" />
            <Mono x={x + 18} y={CHART.y + 26} size={8.6} fill={i === 2 ? C.ink : C.muted}>
              {s.label}
            </Mono>
          </g>
        );
      })}
      {TICKS.map((v) => (
        <g key={v}>
          <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={vy(v)} y2={vy(v)} stroke={C.ink} strokeOpacity={v === 100 ? 0.18 : 0.06} />
          <Mono x={PLOT.x - 10} y={vy(v) + 3} size={8.4} textAnchor="end">
            {v}
          </Mono>
        </g>
      ))}
      {Array.from({ length: WEEKS }, (_, i) => {
        const last = i === WEEKS - 1;
        return (
          <Mono key={i} x={wx(i)} y={PLOT.y + PLOT.h + 20} size={8.4} textAnchor="middle" fill={last && live * o > 0.5 ? C.ink : C.muted} opacity={last ? 0.5 + 0.5 * live * o : 1}>
            {`W${i + 1}`}
          </Mono>
        );
      })}
      {/* The refresh ships between W11 and W12. */}
      <g opacity={ramp(t, LIVE_AT - 0.2, 0.35) * o}>
        <line x1={SHIP_X} x2={SHIP_X} y1={PLOT.y + 18} y2={PLOT.y + PLOT.h} stroke={C.primary} strokeOpacity={0.6} strokeDasharray="2 3" />
        <rect x={SHIP_X - 26} y={PLOT.y - 6} width={52} height={18} rx={9} fill={C.primarySoft} />
        <Mono x={SHIP_X} y={PLOT.y + 6} size={8.4} fill={C.primary} textAnchor="middle">
          v2 live
        </Mono>
      </g>
      {/* Pipeline area, then the three lines drawing on week by week. */}
      {p > 0 && (
        <path
          d={`${polyline(upTo(PIPE.vals, p))} L${pipeTip[0]} ${PLOT.y + PLOT.h} L${PLOT.x} ${PLOT.y + PLOT.h} Z`}
          fill={C.accentSoft}
          opacity={0.5 * o}
        />
      )}
      {SERIES.map((s) => {
        const pts = upTo(s.vals, p);
        const tip = pts[pts.length - 1];
        return (
          <g key={s.label} opacity={o}>
            {p > 0 && <path d={polyline(pts)} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" />}
            {p > 0 && <circle cx={tip[0]} cy={tip[1]} r={3} fill={s.color} stroke={C.card} strokeWidth={1} />}
          </g>
        );
      })}
      {/* Pipeline readout at the tip: quiet while drawing, solid once W12 lands. */}
      <g opacity={ramp(t, DRAW_AT + 0.3, 0.35) * o} transform={`translate(${pipeTip[0] + 10} ${pipeTip[1] - 9})`}>
        <rect width={42} height={18} rx={9} fill={C.accentWash} stroke={C.accentLine} />
        <rect width={42} height={18} rx={9} fill={C.accent} opacity={live} />
        <Mono x={21} y={12.2} size={8.8} fill={C.accent} textAnchor="middle" opacity={1 - live}>
          {`+${pipePct}%`}
        </Mono>
        <Mono x={21} y={12.2} size={8.8} fill="#fff" textAnchor="middle" opacity={live}>
          {`+${pipePct}%`}
        </Mono>
      </g>

      {/* Content: the page that gets refreshed. */}
      <g>
        <Card x={DOC.x} y={DOC.y} w={DOC.w} h={DOC.h} />
        <rect x={DOC.x + 0.5} y={DOC.y + 0.5} width={DOC.w - 1} height={DOC.h - 1} rx={11.5} fill={C.accentWash} stroke={C.accentLine} opacity={docActive * o} />
        <rect x={DOC.x + 16} y={DOC.y + 16} width={30} height={30} rx={8} fill={C.paper} stroke={C.line} />
        <g transform={`translate(${DOC.x + 31} ${DOC.y + 31})`}>
          <Doc />
        </g>
        <text x={DOC.x + 58} y={DOC.y + 29} fontSize={12} fontWeight={550} fill={C.ink}>
          Acme vs X (2026)
        </text>
        <Mono x={DOC.x + 58} y={DOC.y + 44} size={8.6}>
          /compare-x
        </Mono>
        {/* Version badge: v1 (grey) → v2 (deep green). */}
        <g transform={`translate(${DOC.x + DOC.w - 44} ${DOC.y + 16})`}>
          <rect width={28} height={18} rx={9} fill={C.paper} stroke={C.line} opacity={1 - v2 * o1} />
          <rect width={28} height={18} rx={9} fill={C.primary} opacity={v2 * o1} />
          <Mono x={14} y={12.2} size={8.8} fill={C.muted} textAnchor="middle" opacity={1 - v2 * o1}>
            v1
          </Mono>
          <Mono x={14} y={12.2} size={8.8} fill="#fff" textAnchor="middle" opacity={v2 * o1}>
            v2
          </Mono>
        </g>
        <line x1={DOC.x + 16} x2={DOC.x + DOC.w - 16} y1={DOC.y + 62} y2={DOC.y + 62} stroke={C.hair} />
        {CHANGES.map((c, i) => {
          const kIn = ramp(t, changeAt(i), 0.4, easeOut);
          const k = kIn * o1;
          const y = DOC.y + 90 + i * 30;
          return (
            <g key={c}>
              <rect x={DOC.x + 16} y={y - 7} width={[132, 108][i]} height={6} rx={3} fill={C.hair} opacity={Math.max(1 - kIn, r1)} />
              <g opacity={k} transform={rise(k)}>
                <path d={`M${DOC.x + 16} ${y - 4}h8M${DOC.x + 20} ${y - 8}v8`} stroke={C.primary} strokeWidth={1.3} strokeLinecap="round" />
                <text x={DOC.x + 32} y={y} fontSize={12} fill={C.ink}>
                  {c}
                </text>
              </g>
            </g>
          );
        })}
        {/* Status: stale → updating → republished. */}
        <StatusLine x={DOC.x + 16} y={DOC.y + 154} text="Last updated 214 d ago" color={C.muted} k={Math.max(1 - ramp(t, UPDATE_AT - 0.1, 0.25), r1)} />
        <StatusLine x={DOC.x + 16} y={DOC.y + 154} text="Updating…" color={C.accent} k={Math.min(ramp(t, UPDATE_AT, 0.25), 1 - ramp(t, V2_AT - 0.05, 0.25))} />
        <StatusLine x={DOC.x + 16} y={DOC.y + 154} text="Republished · just now" color={C.primary} k={ramp(t, V2_AT + 0.1, 0.3) * o1} />
        <rect x={DOC.x + 16} y={DOC.y + 165} width={DOC.w - 32} height={3} rx={1.5} fill={C.hair} />
        <rect x={DOC.x + 16} y={DOC.y + 165} width={(DOC.w - 32) * updating} height={3} rx={1.5} fill={C.accent} opacity={o1} />
        <rect x={DOC.x + 16} y={DOC.y + 165} width={(DOC.w - 32) * updating} height={3} rx={1.5} fill={C.primary} opacity={v2 * o1} />
      </g>

      {/* Insight: the page losing rank, and its fix. */}
      <Card x={INS.x} y={INS.y} w={INS.w} h={INS.h} />
      <rect x={INS.x + 0.5} y={INS.y + 0.5} width={INS.w - 1} height={INS.h - 1} rx={11.5} fill="none" stroke={C.accentLine} opacity={insActive * o} />
      <Mono x={INS.x + 16} y={INS.y + 26} size={9.5} fill={C.ink}>
        Insights
      </Mono>
      <Mark name="googlesearchconsole" x={INS.x + INS.w - 110} y={INS.y + 23} size={11} />
      <Mono x={INS.x + INS.w - 16} y={INS.y + 26} size={8.4} textAnchor="end">
        Search Console
      </Mono>
      {/* Idle: watching pages. */}
      <g opacity={Math.max(1 - ramp(t, INSIGHT_AT - 0.2, 0.3), r1)}>
        <Mono x={INS.x + 16} y={INS.y + 58} size={8.8}>
          Watching 64 pages
        </Mono>
        <rect x={INS.x + 16} y={INS.y + 80} width={180} height={6} rx={3} fill={C.hair} />
        <rect x={INS.x + 16} y={INS.y + 108} width={140} height={6} rx={3} fill={C.hair} />
      </g>
      <g opacity={insight * o1} transform={rise(insight)}>
        {/* Status dot: coral while open, green check once resolved. */}
        <g opacity={1 - resolved}>
          <circle cx={INS.x + 22} cy={INS.y + 48} r={6} fill={C.accent} opacity={0.16} />
          <circle cx={INS.x + 22} cy={INS.y + 48} r={3} fill={C.accent} />
        </g>
        <g opacity={resolved}>
          <Check x={INS.x + 22} y={INS.y + 48} r={6} k={resolved} />
        </g>
        <Swap k={resolved}>
          {[
            <text key="a" x={INS.x + 36} y={INS.y + 52} fontSize={12} fontWeight={550} fill={C.ink}>
              /compare-x losing rank
            </text>,
            <text key="b" x={INS.x + 36} y={INS.y + 52} fontSize={12} fontWeight={550} fill={C.ink}>
              /compare-x back to #3
            </text>,
          ]}
        </Swap>
        <Swap k={resolved}>
          {[
            <Mono key="a" x={INS.x + 36} y={INS.y + 68} size={8.6}>
              query “acme vs x” · −42% clicks
            </Mono>,
            <Mono key="b" x={INS.x + 36} y={INS.y + 68} size={8.6}>
              query “acme vs x” · +58% clicks
            </Mono>,
          ]}
        </Swap>
        {/* Rank sparkline (#1 at top), with the #3 target dashed. */}
        <line x1={SPARK.x} x2={SPARK.x + SPARK.w} y1={sy(3)} y2={sy(3)} stroke={C.ink} strokeOpacity={0.12} strokeDasharray="2 3" />
        <Trace d={polyline(RANK.map((r, i) => [sx(i), sy(r)]))} k={ramp(t, INSIGHT_AT + 0.2, 0.7, easeOut)} stroke={C.accent} width={1.5} />
        <Trace d={polyline([[sx(7), sy(7)], [sx(8), sy(3)]])} k={ramp(t, RESOLVED_AT, 0.45)} stroke={C.primary} width={1.5} />
        {(() => {
          const m = ramp(t, RESOLVED_AT, 0.45);
          return (
            <circle cx={lerp(sx(7), sx(8), m)} cy={lerp(sy(7), sy(3), m)} r={2.8} fill={m > 0.5 ? C.primary : C.accent} stroke={C.card} strokeWidth={1} opacity={ramp(t, INSIGHT_AT + 0.8, 0.25)} />
          );
        })()}
        <g opacity={ramp(t, INSIGHT_AT + 0.6, 0.35)}>
          <Swap k={resolved}>
            {[
              <text key="a" x={INS.x + INS.w - 16} y={SPARK.y + 18} fontSize={20} fontWeight={600} letterSpacing="-0.02em" fill={C.accent} textAnchor="end">
                #7
              </text>,
              <text key="b" x={INS.x + INS.w - 16} y={SPARK.y + 18} fontSize={20} fontWeight={600} letterSpacing="-0.02em" fill={C.primary} textAnchor="end">
                #3
              </text>,
            ]}
          </Swap>
          <Swap k={resolved}>
            {[
              <Mono key="a" x={INS.x + INS.w - 16} y={SPARK.y + 34} size={8.6} textAnchor="end">
                was #3
              </Mono>,
              <Mono key="b" x={INS.x + INS.w - 16} y={SPARK.y + 34} size={8.6} textAnchor="end">
                was #7
              </Mono>,
            ]}
          </Swap>
        </g>
        <line x1={INS.x + 16} x2={INS.x + INS.w - 16} y1={INS.y + 134} y2={INS.y + 134} stroke={C.hair} />
        <Swap k={resolved}>
          {[
            <Mono key="a" x={INS.x + 16} y={BTN.y + 15.5} size={8.8}>
              Suggested fix
            </Mono>,
            <Mono key="b" x={INS.x + 16} y={BTN.y + 15.5} size={8.8} fill={C.primary}>
              Rank recovered
            </Mono>,
          ]}
        </Swap>
        {/* Refresh button: quiet outline → coral while refreshing → deep green when done. */}
        <rect x={BTN.x} y={BTN.y} width={BTN.w} height={BTN.h} rx={12} fill={C.accentWash} stroke={C.accentLine} />
        <rect x={BTN.x} y={BTN.y} width={BTN.w} height={BTN.h} rx={12} fill={C.accent} opacity={pressed * (1 - resolved)} />
        <rect x={BTN.x} y={BTN.y} width={BTN.w} height={BTN.h} rx={12} fill={C.primary} opacity={resolved} />
        <text x={BTN.x + BTN.w / 2} y={BTN.y + 16} fontSize={11.5} fontWeight={550} fill={C.accent} textAnchor="middle" opacity={1 - pressed}>
          Refresh
        </text>
        <text x={BTN.x + BTN.w / 2} y={BTN.y + 16} fontSize={11.5} fontWeight={550} fill="#fff" textAnchor="middle" opacity={pressed * (1 - resolved)}>
          Refreshing
        </text>
        <g opacity={resolved}>
          <text x={BTN.x + BTN.w / 2 - 7} y={BTN.y + 16} fontSize={11.5} fontWeight={550} fill="#fff" textAnchor="middle">
            Refreshed
          </text>
          <path d={`M${BTN.x + BTN.w - 22} ${BTN.y + 12} l3 3 l5 -6`} fill="none" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* Cursor glides to Refresh and clicks. */}
      <Cursor t={t} />
    </PanelSvg>
  );
}

/** Crossfades two states in place: the first fades out as `k` → 1, the second fades in. */
function Swap({ k, children }: { k: number; children: [ReactNode, ReactNode] }) {
  return (
    <>
      {k < 1 && <g opacity={1 - k}>{children[0]}</g>}
      {k > 0 && <g opacity={k}>{children[1]}</g>}
    </>
  );
}

function StatusLine({ x, y, text, color, k }: { x: number; y: number; text: string; color: string; k: number }) {
  if (k <= 0) return null;
  return (
    <g opacity={k}>
      <circle cx={x + 3} cy={y - 3} r={3} fill={color} />
      <Mono x={x + 12} y={y} size={8.6} fill={color}>
        {text}
      </Mono>
    </g>
  );
}

function Cursor({ t }: { t: number }) {
  const k = ramp(t, PRESS_AT - 0.75, 0.7);
  const show = Math.min(ramp(t, PRESS_AT - 0.85, 0.3, easeOut), 1 - ramp(t, PRESS_AT + 0.45, 0.35));
  if (show <= 0) return null;
  const x = lerp(INS.x + 150, BTN.x + BTN.w - 20, k);
  const y = lerp(INS.y + 104, BTN.y + 14, k);
  const ring = ramp(t, PRESS_AT, 0.45, easeOut);
  return (
    <g opacity={show}>
      {t >= PRESS_AT && <circle cx={x} cy={y} r={5 + 9 * ring} fill="none" stroke={C.accentLine} opacity={1 - ring} />}
      <path d="M0 0 L0 13 L3.5 9.8 L6 15 L8 14 L5.6 9 L10 9 Z" transform={`translate(${x} ${y})`} fill={C.ink} stroke="#fff" strokeWidth={1} strokeLinejoin="round" />
    </g>
  );
}

function Doc() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" transform="translate(-6.5 -7.5)">
      <path d="M1 1h7.5L12 4.5V14H1z" />
      <path d="M8.5 1v3.5H12M3.5 8h6M3.5 10.8h6" strokeLinecap="round" />
    </g>
  );
}

const optimization: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default optimization;
