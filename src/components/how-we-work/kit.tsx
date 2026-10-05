import { createContext, useContext, useId, type ReactNode, type SVGProps } from "react";
import type { Metric } from "./content";
import { MARKS, MARK_COLOR, type MarkName } from "./marks";

// The panels' shared kit: timeline maths and the SVG parts every panel is built
// from. A panel is a pure function of `t` (seconds into its loop), drawn in a
// fixed 560×520 viewBox so it scales crisply and never shifts layout.

export const VIEW = { w: 560, h: 520 } as const;
/** The stage below the metric strip. */
export const STAGE = { x: 20, y: 92, w: 520, h: 412 } as const;

// ── Colour ──────────────────────────────────────────────────────────────────
// Brand roles come from the page tokens, so panels follow globals.css.
export const C = {
  ink: "var(--ink)",
  paper: "var(--paper)",
  primary: "var(--primary)",
  accent: "var(--accent)",
  line: "var(--line)",
  muted: "var(--muted)",
  card: "var(--card)",
  primarySoft: "var(--primary-soft)",
  accentSoft: "var(--accent-soft)",
  sage: "var(--sage)",
} as const;
/** A small independent palette for chart series, so the data stands apart from the UI chrome. */
export const DATA = { blue: "#3e6fd8", teal: "#1f9e8f", violet: "#7a5af5", amber: "#e3a008", slate: "#94a3b8" } as const;

// ── Timeline ────────────────────────────────────────────────────────────────
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (x: number) => 1 - (1 - x) ** 3;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
/** 0 → 1 between `at` and `at + dur`, eased. */
export const ramp = (t: number, at: number, dur: number, ease: (x: number) => number = easeInOut) =>
  ease(clamp01((t - at) / Math.max(dur, 1e-6)));
/** 0 → 1 → 0: rises over `rise`, holds, falls over `rise`. */
export const blip = (t: number, at: number, hold: number, rise = 0.2) =>
  Math.min(ramp(t, at, rise), 1 - ramp(t, at + rise + hold, rise));
/** Everything a loop built fades out over its last `span` seconds, so it restarts cleanly. */
export const outro = (t: number, duration: number, span = 0.5) => 1 - ramp(t, duration - span, span);

type Pt = readonly [number, number];
/** The point `k` (0..1) of the way along a polyline, by length. */
export function along(points: readonly Pt[], k: number): Pt {
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let d = clamp01(k) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] ? Math.min(1, d / segs[i]) : 0;
      return [lerp(points[i][0], points[i + 1][0], u), lerp(points[i][1], points[i + 1][1], u)];
    }
    d -= segs[i];
  }
  return points[points.length - 1];
}
export const polyline = (points: readonly Pt[]) => points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

// ── Panel frame ─────────────────────────────────────────────────────────────
const Ids = createContext("hww");
/** `url(#…)` of the panel's soft card shadow. */
export const useShadow = () => `url(#${useContext(Ids)}-shadow)`;
/** A per-panel unique id, for clip paths and gradients. */
export const usePanelId = (name: string) => `${useContext(Ids)}-${name}`;

/**
 * The panel's SVG root: fixed viewBox, shared filters, metric strip on top.
 * Metric i counts up from `metricsAt[i]` over `metricsFor[i]` seconds.
 */
export function PanelSvg({
  metrics,
  t,
  metricsAt = [0.3, 0.3],
  metricsFor = [1.6, 1.6],
  children,
}: {
  metrics: readonly Metric[];
  t: number;
  metricsAt?: readonly number[];
  metricsFor?: readonly number[];
  children: ReactNode;
}) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  return (
    <Ids.Provider value={id}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="block h-auto w-full select-none" fontFamily="var(--font-sans)">
        <defs>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f1a14" floodOpacity="0.06" />
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f1a14" floodOpacity="0.07" />
          </filter>
        </defs>
        <MetricStrip metrics={metrics} t={t} at={metricsAt} span={metricsFor} />
        {children}
      </svg>
    </Ids.Provider>
  );
}

/** The two outcome numbers this step moves, counting up as the story plays. */
function MetricStrip({ metrics, t, at, span }: { metrics: readonly Metric[]; t: number; at: readonly number[]; span: readonly number[] }) {
  const shadow = useShadow();
  const w = (VIEW.w - 40 - 12) / 2;
  return (
    <g>
      {metrics.map((m, i) => {
        const k = ramp(t, at[i] ?? 0.3, span[i] ?? 1.6, easeOut);
        const x = 20 + i * (w + 12);
        return (
          <g key={m.label} transform={`translate(${x} 16)`}>
            <rect width={w} height={60} rx={10} fill={C.card} stroke={C.line} filter={shadow} />
            <Mono x={14} y={22} size={9.5} fill={C.muted}>
              {m.label}
            </Mono>
            <text x={14} y={47} fontSize={20} fontWeight={600} letterSpacing="-0.02em" fill={C.ink}>
              {m.format(m.value * k)}
            </text>
            {/* A tiny trend tick: grows with the count. */}
            <path
              d={`M${w - 62} 44 L${w - 50} 40 L${w - 40} 42 L${w - 28} 32 L${w - 16} 26`}
              fill="none"
              stroke={C.primary}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - k}
            />
          </g>
        );
      })}
    </g>
  );
}

// ── Parts ───────────────────────────────────────────────────────────────────
/** Monospace uppercase micro-label. */
export function Mono({ size = 9, fill = C.muted, children, ...rest }: SVGProps<SVGTextElement> & { size?: number }) {
  return (
    <text fontFamily="var(--font-mono)" fontSize={size} letterSpacing="0.08em" fill={fill} {...rest} style={{ textTransform: "uppercase", ...rest.style }}>
      {children}
    </text>
  );
}

type CardProps = { x: number; y: number; w: number; h: number; r?: number; stroke?: string; fill?: string; shadow?: boolean; strokeWidth?: number } & Omit<
  SVGProps<SVGRectElement>,
  "x" | "y" | "width" | "height"
>;
/** A white card with a 1px border and a soft shadow. */
export function Card({ x, y, w, h, r = 10, stroke = C.line, fill = C.card, shadow = true, strokeWidth = 1, ...rest }: CardProps) {
  const filter = useShadow();
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={shadow ? filter : undefined} {...rest} />;
}

/** A brand mark centred at (x, y), `size` px wide, in its own colour unless `color` is given. */
export function Mark({ name, x, y, size = 16, color, opacity }: { name: MarkName; x: number; y: number; size?: number; color?: string; opacity?: number }) {
  const s = size / 24;
  const transform = `translate(${x - size / 2} ${y - size / 2}) scale(${s})`;
  const id = usePanelId(`g-${Math.round(x)}-${Math.round(y)}`);
  if (name === "google" && !color) {
    // Google's G in its four colours: quadrants clipped to the mark.
    return (
      <g transform={transform} opacity={opacity}>
        <clipPath id={id}>
          <path d={MARKS.google} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <rect x="0" y="0" width="12" height="9" fill="#EA4335" />
          <rect x="0" y="9" width="7" height="15" fill="#FBBC05" />
          <rect x="7" y="14" width="17" height="10" fill="#34A853" />
          <rect x="12" y="0" width="12" height="14.2" fill="#4285F4" />
          <rect x="0" y="0" width="7" height="9" fill="#EA4335" />
        </g>
      </g>
    );
  }
  return <path d={MARKS[name]} transform={transform} fill={color ?? MARK_COLOR[name]} opacity={opacity} />;
}

/** A round check badge: deep green when `k` reaches 1, its tick drawing on as k goes 0 → 1. */
export function Check({ x, y, r = 7, k, color = C.primary }: { x: number; y: number; r?: number; k: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={k > 0 ? color : C.card} stroke={k > 0 ? color : C.line} opacity={k > 0 ? 0.25 + 0.75 * clamp01(k * 2) : 1} />
      <path
        d={`M${-r * 0.42} 0 L${-r * 0.1} ${r * 0.32} L${r * 0.45} ${-r * 0.3}`}
        fill="none"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - clamp01(k)}
      />
    </g>
  );
}

/** A path that draws itself on as `k` goes 0 → 1. */
export function Trace({ d, k, stroke = C.ink, width = 1, dash, opacity = 1 }: { d: string; k: number; stroke?: string; width?: number; dash?: string; opacity?: number }) {
  if (k <= 0) return null;
  if (dash) {
    // Dashed lines can't use the dash trick to draw on, so they reveal through a fade instead.
    return <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} opacity={opacity * k} />;
  }
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - clamp01(k)}
      opacity={opacity}
    />
  );
}

/** A small pulse travelling a polyline: a coral dot with a soft halo. `k` < 0 or > 1 hides it. */
export function Pulse({ points, k, color = C.accent, r = 3 }: { points: readonly Pt[]; k: number; color?: string; r?: number }) {
  if (k < 0 || k > 1) return null;
  const [x, y] = along(points, k);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r * 2.4} fill={color} opacity={0.16} />
      <circle r={r} fill={color} />
    </g>
  );
}

/** A small rounded pill: mono label, outlined or filled. */
export function Chip({
  x,
  y,
  label,
  w,
  h = 18,
  fill = C.card,
  stroke = C.line,
  color = C.ink,
  size = 8.5,
  opacity,
}: {
  x: number;
  y: number;
  label: string;
  w?: number;
  h?: number;
  fill?: string;
  stroke?: string;
  color?: string;
  size?: number;
  opacity?: number;
}) {
  const width = w ?? label.length * size * 0.66 + 16;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <rect width={width} height={h} rx={h / 2} fill={fill} stroke={stroke} />
      <Mono x={width / 2} y={h / 2 + size * 0.36} size={size} fill={color} textAnchor="middle">
        {label}
      </Mono>
    </g>
  );
}

/** Text placeholder lines (a skeleton paragraph). */
export function Lines({ x, y, widths, gap = 8, h = 4, fill = C.line, k = 1 }: { x: number; y: number; widths: readonly number[]; gap?: number; h?: number; fill?: string; k?: number }) {
  return (
    <g>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w * clamp01(k * widths.length - i)} height={h} rx={h / 2} fill={fill} />
      ))}
    </g>
  );
}
