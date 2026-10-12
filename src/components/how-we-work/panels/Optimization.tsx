import type { ReactNode } from "react";
import { C, Mark, Mono, PanelSvg, clamp01, easeInOut, easeOut, lerp, ramp, usePanelId } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 05 Optimization Loop. A radar that never stops turning. Its four quadrants are
// the loop's stages (measure, diagnose, improve, scale) and one sweep is one
// lap. As the arm passes a signal it lights and says what it found, and the
// findings chain: a top performer and a gap are diagnosed, the gap gets an
// answer page, the winner gets doubled down on. The centre reads out the metric
// each stage moves; a completed lap pulses it, because the gains compound.
// Circular, so the loop has no seam.

const DURATION = 16;
const CX = 240;
const CY = 200;
const R = 150;

/** A point at `deg` clockwise from 12 o'clock, `r` from the centre. */
// Rounded so server and client trig agree to the digit (no hydration mismatch).
const at = (deg: number, r: number) =>
  [Math.round((CX + r * Math.sin((deg * Math.PI) / 180)) * 100) / 100, Math.round((CY - r * Math.cos((deg * Math.PI) / 180)) * 100) / 100] as const;

const QUARTER = DURATION / 4;
const STAGES = [
  { name: "Measure", sub: ["Visibility, engagement,", "pipeline"] },
  { name: "Diagnose", sub: ["Gaps and top", "performers"] },
  { name: "Improve", sub: ["Refresh, redistribute,", "rebalance"] },
  { name: "Scale", sub: ["Increase what", "works"] },
];
/** What the centre reads out while each stage is swept (from the steps' metrics). */
const METRICS = [
  { label: "Search visibility", value: 38, format: (v: number) => `+${Math.round(v)}%` },
  { label: "Share of voice", value: 34, format: (v: number) => `${Math.round(v)}%` },
  { label: "Content refreshed", value: 9, format: (v: number) => `${Math.round(v)} pages` },
  { label: "Pipeline influenced", value: 61, format: (v: number) => `+${Math.round(v)}%` },
];

type Tone = "good" | "gap";
type Signal = { deg: number; r: number; tone: Tone; text?: string; icon?: ReactNode; side?: "left" | "right" };
const SIGNALS: Signal[] = [
  // Measure: this week's numbers come in.
  { deg: 38, r: 74, tone: "good", text: "Weekly data synced", icon: <Bars />, side: "right" },
  { deg: 58, r: 128, tone: "good" },
  { deg: 76, r: 104, tone: "good" },
  // Diagnose: a top performer and a gap.
  { deg: 106, r: 112, tone: "good", text: "Setup guide: #9 → #3", icon: <Mark name="google" x={0} y={0} size={9} />, side: "right" },
  { deg: 152, r: 84, tone: "gap", text: "Gap: not cited in ChatGPT", icon: <Mark name="chatgpt" x={0} y={0} size={9} />, side: "right" },
  // Improve: close the gap.
  { deg: 222, r: 104, tone: "good", text: "Answer page for the gap", icon: <Refresh />, side: "left" },
  { deg: 252, r: 60, tone: "good" },
  // Scale: back the winner.
  { deg: 300, r: 118, tone: "good", text: "Doubling down on guides", icon: <Trend />, side: "left" },
  { deg: 334, r: 76, tone: "good" },
];

const GOOD = C.green;
const GAP = C.accent;
const RING = "color-mix(in srgb, var(--ink) 9%, transparent)";
const AXIS = "color-mix(in srgb, var(--ink) 7%, transparent)";
const TRAIL = 70;
const SLICES = 28;

function Panel({ t }: { t: number }) {
  const tt = t % DURATION;
  const sweep = (tt / DURATION) * 360;
  const stage = Math.floor(sweep / 90);
  const glowId = usePanelId("hub");
  const readout = usePanelId("readout");
  // Each lap closes as the arm crosses 12 o'clock: the result pulses.
  const lapPulse = Math.max(1 - ramp(tt, 0, 1.4), ramp(tt, DURATION - 0.25, 0.25));
  /** Seconds since the arm last passed `deg`. */
  const age = (deg: number) => (((tt - (deg / 360) * DURATION) % DURATION) + DURATION) % DURATION;

  return (
    <PanelSvg t={t}>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0.55" stopColor="var(--light-green-soft)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--light-green-soft)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The instrument: a quiet face, rings, axes that split the four stages, and tick marks. */}
      <circle cx={CX} cy={CY} r={R} fill={C.card} stroke={C.line} />
      {[0.25, 0.5, 0.75].map((k) => (
        <circle key={k} cx={CX} cy={CY} r={R * k} fill="none" stroke={RING} />
      ))}
      {[0, 90, 45, 135].map((d) => {
        const [x1, y1] = at(d, R);
        const [x2, y2] = at(d + 180, R);
        return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AXIS} strokeDasharray={d % 90 ? "2 4" : undefined} />;
      })}
      {Array.from({ length: 36 }, (_, i) => {
        const [x1, y1] = at(i * 10, R);
        const [x2, y2] = at(i * 10, R - (i % 9 === 0 ? 8 : 4));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={RING} strokeWidth={i % 9 === 0 ? 1.4 : 1} />;
      })}

      {/* The sweep: a fading wedge trailing the arm. */}
      {Array.from({ length: SLICES }, (_, j) => {
        const a1 = sweep - (j + 1) * (TRAIL / SLICES);
        const a2 = sweep - j * (TRAIL / SLICES);
        const [x1, y1] = at(a1, R);
        const [x2, y2] = at(a2, R);
        return <path key={j} d={`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`} fill={C.accent} opacity={0.13 * (1 - j / SLICES) ** 1.6} />;
      })}
      {(() => {
        const [x, y] = at(sweep, R);
        return (
          <g>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke={C.accent} strokeOpacity={0.7} strokeWidth={1.2} />
            <circle cx={x} cy={y} r={2.6} fill={C.accent} />
          </g>
        );
      })()}

      {/* Stage labels and their copy in the corners; the stage being swept is lit. */}
      {STAGES.map((st, i) => {
        const right = i < 2;
        const top = i === 0 || i === 3;
        const x = right ? CX + 122 : CX - 122;
        const y = top ? 64 : 318;
        const anchor = right ? "start" : "end";
        const on = i === stage ? Math.min(ramp(tt - i * QUARTER, 0, 0.4), 1 - ramp(tt - i * QUARTER, QUARTER - 0.3, 0.3)) : 0;
        return (
          <g key={st.name}>
            <circle cx={right ? x - 7 : x + 7} cy={y - 3} r={2.4} fill={C.accent} opacity={on} />
            <Mono x={x} y={y} size={8} letterSpacing="0.16em" fill={C.ink} opacity={0.55 + 0.45 * on} textAnchor={anchor}>
              {`0${i + 1} ${st.name}`}
            </Mono>
            <text x={x} y={y + 16} fontSize={9.5} fill={C.muted} opacity={0.75 + 0.25 * on} textAnchor={anchor}>
              {st.sub.map((line, j) => (
                <tspan key={line} x={x} dy={j ? 13 : 0}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {/* Signals: they flare as the arm passes, then fade like afterglow. */}
      {SIGNALS.map((s, i) => {
        const a = age(s.deg);
        const flare = 1 - ramp(a, 0, 0.6);
        const glow = 0.22 + 0.78 * Math.exp(-a / 3.5);
        const color = s.tone === "gap" ? GAP : GOOD;
        const [x, y] = at(s.deg, s.r);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4 + flare * 8} fill={color} opacity={0.12 * glow + flare * 0.15} />
            <circle cx={x} cy={y} r={s.text ? 3.6 : 2.6} fill={color} opacity={glow} />
          </g>
        );
      })}

      <Hub tt={tt} pulse={lapPulse} glowId={glowId} clip={readout} />

      {/* Callouts: what each signal means, shown for a few seconds after it is found. */}
      {SIGNALS.map((s, i) => {
        if (!s.text) return null;
        const a = age(s.deg);
        const k = Math.min(ramp(a, 0.05, 0.35), 1 - ramp(a, 3.4, 0.6));
        if (k <= 0) return null;
        const [x, y] = at(s.deg, s.r);
        return <Callout key={i} x={x} y={y} side={s.side!} text={s.text} icon={s.icon} tone={s.tone} k={k} />;
      })}
    </PanelSvg>
  );
}

/**
 * The live readout: the metric the current stage moves. On each new stage the
 * old value rolls up out of a small window while the new one rolls in and counts
 * up; the label crossfades and the pager dash glides to the stage. A completed
 * lap pulses the whole hub green.
 */
function Hub({ tt, pulse, glowId, clip }: { tt: number; pulse: number; glowId: string; clip: string }) {
  const q = Math.floor(tt / QUARTER);
  const lt = tt - q * QUARTER;
  const prev = (q + METRICS.length - 1) % METRICS.length;
  const roll = easeInOut(clamp01(lt / 0.55));
  const count = easeOut(clamp01(lt / 1.1));
  const cur = METRICS[q];
  const old = METRICS[prev];
  const RH = 16;
  const dash = lerp(prev, prev + 1, roll);
  // Pager marks: the one under the dash widens; the row stays centred.
  const widths = METRICS.map((_, i) => {
    const d = Math.abs(dash - i) % METRICS.length;
    return 3 + 8 * clamp01(1 - Math.min(d, METRICS.length - d));
  });
  const total = widths.reduce((a, w) => a + w, 0) + 4 * (METRICS.length - 1);
  return (
    <g>
      <circle cx={CX} cy={CY} r={60 + pulse * 6} fill={`url(#${glowId})`} opacity={pulse} />
      <circle cx={CX} cy={CY} r={46} fill={C.card} stroke={C.line} />
      <circle cx={CX} cy={CY} r={46} fill="none" stroke="color-mix(in srgb, var(--primary) 45%, var(--line))" opacity={pulse} />
      <Mono x={CX} y={CY - 20} size={6.5} letterSpacing="0.18em" fill={C.muted} textAnchor="middle">
        This month
      </Mono>

      {/* The value, rolling through a window like an odometer. */}
      <clipPath id={clip}>
        <rect x={CX - 44} y={CY - 13} width={88} height={RH + 6} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <text x={CX} y={CY + 4 - roll * RH} fontSize={19} fontWeight={600} letterSpacing="-0.03em" fill={C.ink} textAnchor="middle" opacity={1 - roll}>
          {old.format(old.value)}
        </text>
        <text x={CX} y={CY + 4 + (1 - roll) * RH} fontSize={19} fontWeight={600} letterSpacing="-0.03em" fill={C.ink} textAnchor="middle" opacity={roll}>
          {cur.format(cur.value * (0.55 + 0.45 * count))}
        </text>
      </g>
      <text x={CX} y={CY + 19} fontSize={7.5} fill={C.muted} textAnchor="middle" opacity={1 - roll}>
        {old.label}
      </text>
      <text x={CX} y={CY + 19} fontSize={7.5} fill={C.muted} textAnchor="middle" opacity={roll}>
        {cur.label}
      </text>

      {/* Pager: one mark per stage; the dash glides to the current one. */}
      {widths.map((w, i) => {
        const x = CX - total / 2 + widths.slice(0, i).reduce((a, v) => a + v + 4, 0);
        return <rect key={i} x={x} y={CY + 26} width={w} height={3} rx={1.5} fill={w > 7 ? C.ink : C.line} />;
      })}
    </g>
  );
}

/** A small floating label beside a signal: icon tile + text, settling in as k → 1. */
function Callout({ x, y, side, text, icon, tone, k }: { x: number; y: number; side: "left" | "right"; text: string; icon?: ReactNode; tone: Tone; k: number }) {
  const w = Math.round(text.length * 9 * 0.53 + 34);
  const h = 22;
  const lx = side === "right" ? Math.min(x + 12, 472 - w) : Math.max(x - 12 - w, 8);
  const ly = y - h / 2;
  const shift = (1 - k) * (side === "right" ? -4 : 4);
  return (
    <g opacity={k} transform={`translate(${shift} 0)`}>
      <line x1={x} y1={y} x2={side === "right" ? lx : lx + w} y2={y} stroke={tone === "gap" ? C.accentLine : "color-mix(in srgb, var(--primary) 40%, var(--line))"} />
      <rect x={lx} y={ly} width={w} height={h} rx={6} fill={C.card} stroke={C.line} filter="drop-shadow(0 2px 6px rgb(15 26 20 / 0.08))" />
      <circle cx={lx + 12} cy={y} r={7} fill={C.paper} stroke={C.hair} />
      <g transform={`translate(${lx + 12} ${y})`}>{icon}</g>
      <text x={lx + 24} y={y + 3.2} fontSize={9} fill={C.ink}>
        {text}
      </text>
    </g>
  );
}

// ── Glyphs (centred on 0,0, about 9 units) ──────────────────────────────────
const line = { fill: "none", stroke: C.ink, strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round" } as const;
function Bars() {
  return <path d="M-3.5 3.5V0.5M0 3.5V-1.5M3.5 3.5V-3.5" {...line} />;
}
function Refresh() {
  return (
    <g {...line}>
      <path d="M3.6 -1A3.7 3.7 0 1 0 2.9 2.3" />
      <path d="M3.9 -3.7V-0.8H1" />
    </g>
  );
}
function Trend() {
  return (
    <g {...line}>
      <path d="M-4 3L-1 0L1 2L4 -2" />
      <path d="M1.5 -2H4V0.5" />
    </g>
  );
}

// The still frame (reduced motion): mid-diagnose, both findings showing.
const optimization: PanelModule = { duration: DURATION, settle: (160 / 360) * DURATION, Panel };
export default optimization;
