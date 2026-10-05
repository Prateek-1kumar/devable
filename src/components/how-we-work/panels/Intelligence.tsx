import type { ReactNode } from "react";
import { STEPS } from "../content";
import { C, Card, Check, Mark, Mono, PanelSvg, Pulse, Trace, blip, clamp01, easeOut, lerp, outro, polyline, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 01 Product Intelligence. Beginning: six real sources sit dim. Work: each one
// syncs and streams along its line into the product model, whose checklist
// fills. Result: the positioning map plots eight competitors in one cluster
// and your dot lands alone in the open quadrant.

const DURATION = 8;
const SETTLE = 7.3;

const SOURCES: { label: string; meta: string; icon: ReactNode }[] = [
  { label: "Product docs", meta: "docs · 214 pages", icon: <Doc /> },
  { label: "GitHub repo", meta: "acme/cli · 1.8k ★", icon: <Mark name="github" x={0} y={0} size={15} /> },
  { label: "Sales calls", meta: "36 calls · 41 h", icon: <Wave /> },
  { label: "Reddit threads", meta: "r/devops · 112", icon: <Mark name="reddit" x={0} y={0} size={15} /> },
  { label: "Competitor sites", meta: "8 domains", icon: <Globe /> },
  { label: "Existing content", meta: "blog · 64 posts", icon: <Mark name="googlesearchconsole" x={0} y={0} size={15} /> },
];
const SRC = { x: 20, y: 100, w: 172, h: 46, gap: 8.5 };
const srcY = (i: number) => SRC.y + i * (SRC.h + SRC.gap);
const syncAt = (i: number) => 0.5 + i * 0.32;

const MODEL = { x: 236, y: 100, w: 304, h: 198 };
const ENTRY: [number, number] = [MODEL.x, MODEL.y + 52];
const CHECKS = [
  { label: "ICP & personas", detail: "Platform eng · 50–500 devs" },
  { label: "Positioning", detail: "Fastest path to preview envs" },
  { label: "Competitor gaps", detail: "5 of 8 lack self-hosting" },
  { label: "Visibility baseline", detail: "AI 12% · SERP 31 kw" },
];
const checkAt = (i: number) => 2.75 + i * 0.42;
const READY = 4.55;

const MAP = { x: 236, y: 312, w: 304, h: 192 };
const PLOT = { x: MAP.x + 34, y: MAP.y + 34, w: MAP.w - 50, h: MAP.h - 62 };
// Competitors crowd the general-purpose, sales-led corner (plot units 0..1, y up).
const RIVALS: [number, number][] = [
  [0.18, 0.3], [0.27, 0.2], [0.22, 0.42], [0.34, 0.33], [0.13, 0.18], [0.3, 0.47], [0.4, 0.22], [0.2, 0.08],
];
const rivalAt = (i: number) => 4.75 + i * 0.07;
const YOU_FROM: [number, number] = [0.5, 0.5];
const YOU_TO: [number, number] = [0.8, 0.78];
const YOU_AT = 5.55;
const px = ([u, v]: [number, number]): [number, number] => [PLOT.x + u * PLOT.w, PLOT.y + (1 - v) * PLOT.h];

/** Each source's line: out of its card, along a channel, into the model's entry. */
const route = (i: number): [number, number][] => {
  const y = srcY(i) + SRC.h / 2;
  const mid = SRC.x + SRC.w + 22;
  return [
    [SRC.x + SRC.w, y],
    [mid, y],
    [mid, ENTRY[1]],
    ENTRY,
  ];
};

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const progress = ramp(t, 2.4, READY - 2.4, (x) => x);
  const ready = ramp(t, READY, 0.3);
  const mapIn = ramp(t, 4.6, 0.4);
  const you = ramp(t, YOU_AT, 0.9, easeOut);
  const landed = ramp(t, YOU_AT + 0.8, 0.4);
  const youAt = px([lerp(YOU_FROM[0], YOU_TO[0], you), lerp(YOU_FROM[1], YOU_TO[1], you)]);

  return (
    <PanelSvg metrics={STEPS[0].metrics} t={t} metricsAt={[0.5, 4.75]} metricsFor={[2.1, 0.6]}>
      {/* Lines first, so cards sit on top of them. */}
      {SOURCES.map((_, i) => {
        const pts = route(i);
        const lit = ramp(t, syncAt(i), 0.25) * o;
        return (
          <g key={i}>
            <path d={polyline(pts)} fill="none" stroke={C.ink} strokeOpacity={0.12} strokeLinejoin="round" />
            <Trace d={polyline(pts)} k={ramp(t, syncAt(i) + 0.1, 0.55, easeOut)} stroke={C.primary} opacity={0.55 * o} />
            <Pulse points={pts} k={t < syncAt(i) + 0.1 ? -1 : (t - syncAt(i) - 0.1) / 0.55} />
            <circle cx={pts[0][0]} cy={pts[0][1]} r={2.5} fill={lit > 0.5 ? C.primary : C.card} stroke={lit > 0.5 ? C.primary : C.ink} strokeOpacity={lit > 0.5 ? 1 : 0.25} />
          </g>
        );
      })}

      {/* Sources. */}
      {SOURCES.map((s, i) => {
        const lit = ramp(t, syncAt(i), 0.25) * o;
        const active = blip(t, syncAt(i), 0.35, 0.12);
        const y = srcY(i);
        return (
          <g key={s.label} opacity={0.5 + 0.5 * lit}>
            <Card x={SRC.x} y={y} w={SRC.w} h={SRC.h} stroke={active > 0.01 ? C.accent : C.line} strokeWidth={1 + active * 0.5} />
            <rect x={SRC.x + 10} y={y + 10} width={26} height={26} rx={7} fill={C.paper} stroke={C.line} />
            <g transform={`translate(${SRC.x + 23} ${y + 23})`}>{s.icon}</g>
            <text x={SRC.x + 46} y={y + 20} fontSize={11.5} fontWeight={550} fill={C.ink}>
              {s.label}
            </text>
            <Mono x={SRC.x + 46} y={y + 34} size={8.8}>
              {s.meta}
            </Mono>
            {/* Sync state: a ring that becomes a deep green dot. */}
            <circle cx={SRC.x + SRC.w - 13} cy={y + 15} r={3} fill={lit > 0.5 ? C.primary : "none"} stroke={lit > 0.5 ? C.primary : C.ink} strokeOpacity={lit > 0.5 ? 1 : 0.25} />
          </g>
        );
      })}

      {/* The product model. */}
      <Card x={MODEL.x} y={MODEL.y} w={MODEL.w} h={MODEL.h} />
      <g transform={`translate(${MODEL.x + 16} ${MODEL.y + 24})`}>
        {ready * o > 0.5 ? (
          <Check x={4} y={-3.5} r={5.5} k={1} />
        ) : (
          <g transform="translate(4 -3.5)">
            <circle r={5} fill="none" stroke={C.line} strokeWidth={1.6} />
            <circle r={5} fill="none" stroke={C.accent} strokeWidth={1.6} pathLength={1} strokeDasharray="0.3 0.7" transform={`rotate(${t * 360})`} opacity={t > 0.4 ? 1 : 0} />
          </g>
        )}
        <Mono x={16} y={0} size={9.5} fill={C.ink}>
          {ready * o > 0.5 ? "Product model ready" : "Building product model"}
        </Mono>
        <Mono x={MODEL.w - 32} y={0} size={9.5} fill={C.muted} textAnchor="end">
          {`${Math.round(progress * o * 100)}%`}
        </Mono>
      </g>
      <rect x={MODEL.x + 16} y={MODEL.y + 36} width={MODEL.w - 32} height={3} rx={1.5} fill={C.line} />
      <rect x={MODEL.x + 16} y={MODEL.y + 36} width={(MODEL.w - 32) * progress * o} height={3} rx={1.5} fill={ready * o > 0.5 ? C.primary : C.accent} />
      {CHECKS.map((c, i) => {
        const k = ramp(t, checkAt(i), 0.35) * o;
        const y = MODEL.y + 58 + i * 34;
        const working = t > checkAt(i) - 0.4 && k < 1 && o > 0.9;
        return (
          <g key={c.label}>
            {i > 0 && <line x1={MODEL.x + 16} x2={MODEL.x + MODEL.w - 16} y1={y - 8} y2={y - 8} stroke={C.line} />}
            <Check x={MODEL.x + 25} y={y + 9} r={7} k={k} />
            <text x={MODEL.x + 42} y={y + 13} fontSize={11.5} fontWeight={550} fill={C.ink} opacity={0.45 + 0.55 * Math.max(k, working ? 0.6 : 0)}>
              {c.label}
            </text>
            <g opacity={k}>
              <Mono x={MODEL.x + MODEL.w - 16} y={y + 12.5} size={8.8} fill={C.primary} textAnchor="end">
                {c.detail}
              </Mono>
            </g>
            {/* Skeleton while the row is still being worked out. */}
            <rect x={MODEL.x + MODEL.w - 16 - 120} y={y + 6} width={120} height={6} rx={3} fill={C.line} opacity={1 - k} />
          </g>
        );
      })}

      {/* The positioning map. */}
      <Card x={MAP.x} y={MAP.y} w={MAP.w} h={MAP.h} />
      <Mono x={MAP.x + 16} y={MAP.y + 22} size={9.5} fill={C.ink}>
        Positioning map
      </Mono>
      <Mono x={MAP.x + MAP.w - 16} y={MAP.y + 22} size={8.8} textAnchor="end" opacity={mapIn * o}>
        {`${Math.round(clamp01((t - 4.75) / 0.6) * 8 * o)} competitors`}
      </Mono>
      {/* Open-space quadrant, revealed once you land. */}
      <rect x={PLOT.x + PLOT.w / 2} y={PLOT.y} width={PLOT.w / 2} height={PLOT.h / 2} fill={C.accentSoft} opacity={landed * o * 0.8} rx={4} />
      <g stroke={C.ink} strokeOpacity={0.14}>
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={PLOT.y + PLOT.h / 2} y2={PLOT.y + PLOT.h / 2} strokeDasharray="2 3" />
        <line x1={PLOT.x + PLOT.w / 2} x2={PLOT.x + PLOT.w / 2} y1={PLOT.y} y2={PLOT.y + PLOT.h} strokeDasharray="2 3" />
        <line x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.h} strokeOpacity={0.3} />
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={PLOT.y + PLOT.h} y2={PLOT.y + PLOT.h} strokeOpacity={0.3} />
      </g>
      <Mono x={PLOT.x + PLOT.w} y={PLOT.y + PLOT.h + 14} size={8.4} textAnchor="end">
        Developer-first →
      </Mono>
      <Mono x={0} y={0} size={8.4} textAnchor="end" transform={`translate(${PLOT.x - 8} ${PLOT.y}) rotate(-90)`}>
        Self-serve →
      </Mono>
      {/* Competitor cluster. */}
      {RIVALS.map((r, i) => {
        const k = ramp(t, rivalAt(i), 0.25, easeOut) * o;
        const [x, y] = px(r);
        return <circle key={i} cx={x} cy={y} r={4.2 * k} fill={C.sage} stroke={C.card} strokeWidth={1} opacity={0.9} />;
      })}
      <g opacity={ramp(t, 5.2, 0.3) * o}>
        <Mono x={px([0.27, 0.62])[0]} y={px([0.27, 0.62])[1]} size={8.4} textAnchor="middle">
          Incumbents
        </Mono>
      </g>
      {/* You: rises out of the middle and lands alone in the open quadrant. */}
      <g opacity={ramp(t, YOU_AT - 0.15, 0.2) * o}>
        <circle cx={youAt[0]} cy={youAt[1]} r={7 + 9 * landed} fill={C.accent} opacity={0.18 * (1 - landed * 0.4)} />
        <circle cx={youAt[0]} cy={youAt[1]} r={5.5} fill={C.accent} stroke={C.card} strokeWidth={1.5} />
        <g opacity={landed}>
          <rect x={youAt[0] - 82} y={youAt[1] - 9} width={66} height={18} rx={9} fill={C.ink} />
          <Mono x={youAt[0] - 49} y={youAt[1] + 3} size={8} fill="#fff" textAnchor="middle">
            You · open
          </Mono>
        </g>
      </g>
    </PanelSvg>
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
function Wave() {
  const bars = [3, 7, 11, 6, 9, 4, 8];
  return (
    <g stroke={C.ink} strokeWidth={1.5} strokeLinecap="round">
      {bars.map((h, i) => (
        <line key={i} x1={-7.5 + i * 2.5} x2={-7.5 + i * 2.5} y1={-h / 2} y2={h / 2} />
      ))}
    </g>
  );
}
function Globe() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.2}>
      <circle r={6.5} />
      <ellipse rx={2.8} ry={6.5} />
      <path d="M-6.5 0h13M-5.6 -3.3h11.2M-5.6 3.3h11.2" />
    </g>
  );
}

const intelligence: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default intelligence;
