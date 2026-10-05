import type { ReactNode } from "react";
import { STEPS } from "../content";
import { C, Card, Check, Mark, Mono, PanelSvg, Pulse, Trace, blip, easeOut, lerp, outro, polyline, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 01 Product Intelligence. Beginning: six real sources sit dim. Work: each one
// syncs in turn and streams along its line into the product model, whose
// checklist fills row by row. Result: the positioning map plots eight
// competitors in one cluster and your dot glides alone into the open quadrant.

const DURATION = 9;
const SETTLE = 8.3;

const SOURCES: { label: string; meta: string; icon: ReactNode }[] = [
  { label: "Product docs", meta: "214 pages", icon: <Doc /> },
  { label: "GitHub repo", meta: "acme/cli · 1.8k ★", icon: <Mark name="github" x={0} y={0} size={15} /> },
  { label: "Sales calls", meta: "36 calls · 41 h", icon: <Wave /> },
  { label: "Reddit threads", meta: "r/devops · 112", icon: <Mark name="reddit" x={0} y={0} size={15} /> },
  { label: "Competitor sites", meta: "8 domains", icon: <Globe /> },
  { label: "Existing content", meta: "64 posts", icon: <Mark name="googlesearchconsole" x={0} y={0} size={15} /> },
];
// Six cards spread over the full stage height: 56px tall, 13.6px apart.
const SRC = { x: 20, y: 100, w: 172, h: 56, gap: 13.6 };
const srcY = (i: number) => SRC.y + i * (SRC.h + SRC.gap);
const syncAt = (i: number) => 0.6 + i * 0.4;
const FLOW = 0.6;

const MODEL = { x: 236, y: 100, w: 304, h: 202 };
const ENTRY: [number, number] = [MODEL.x, MODEL.y + 58];
const ROW = { y: MODEL.y + 66, pitch: 34 };
const CHECKS = [
  { label: "ICP & personas", detail: "Platform eng · 50–500" },
  { label: "Positioning", detail: "Fastest preview envs" },
  { label: "Competitor gaps", detail: "5/8 no self-hosting" },
  { label: "Visibility baseline", detail: "AI 12% · 31 kw" },
];
const checkAt = (i: number) => 2.9 + i * 0.42;
const READY = 4.65;

const MAP = { x: 236, y: 316, w: 304, h: 188 };
const PLOT = { x: MAP.x + 40, y: MAP.y + 44, w: MAP.w - 60, h: MAP.h - 76 };
const MAP_AT = 4.9;
// Competitors crowd the general-purpose, sales-led corner (plot units 0..1, y up).
const RIVALS: [number, number][] = [
  [0.14, 0.34], [0.26, 0.22], [0.2, 0.5], [0.36, 0.38], [0.1, 0.14], [0.32, 0.62], [0.42, 0.18], [0.22, 0.06],
];
const rivalAt = (i: number) => 5.1 + i * 0.08;
const YOU_FROM: [number, number] = [0.5, 0.5];
const YOU_TO: [number, number] = [0.84, 0.74];
const YOU_AT = 6.1;
const YOU_FOR = 0.9;
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

/** Fade in with a small rise. */
const rise = (k: number, dy = 5) => ({ opacity: k, transform: `translate(0 ${(1 - k) * dy})` });

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const progress = ramp(t, syncAt(0) + 0.2, READY - syncAt(0) - 0.2, (x) => x);
  const ready = ramp(t, READY, 0.4);
  const mapIn = ramp(t, MAP_AT, 0.45, easeOut);
  const you = ramp(t, YOU_AT, YOU_FOR);
  const landed = ramp(t, YOU_AT + YOU_FOR - 0.1, 0.45, easeOut);
  const youAt = px([lerp(YOU_FROM[0], YOU_TO[0], you), lerp(YOU_FROM[1], YOU_TO[1], you)]);

  return (
    <PanelSvg metrics={STEPS[0].metrics} t={t} metricsAt={[syncAt(0), rivalAt(0)]} metricsFor={[syncAt(5) + FLOW - syncAt(0), 0.9]}>
      {/* Lines first, so cards sit on top of them. */}
      {SOURCES.map((_, i) => {
        const pts = route(i);
        const flow = ramp(t, syncAt(i) + 0.1, FLOW);
        const lit = ramp(t, syncAt(i), 0.3) * o;
        return (
          <g key={i}>
            <path d={polyline(pts)} fill="none" stroke={C.ink} strokeOpacity={0.1} strokeLinejoin="round" />
            <Trace d={polyline(pts)} k={flow} stroke={C.secondary} opacity={0.6 * o} />
            <Pulse points={pts} k={t < syncAt(i) + 0.1 ? -1 : (t - syncAt(i) - 0.1) / FLOW} r={2.6} />
            <circle cx={pts[0][0]} cy={pts[0][1]} r={2.5} fill={C.card} stroke={C.ink} strokeOpacity={0.25} />
            <circle cx={pts[0][0]} cy={pts[0][1]} r={2.5} fill={C.secondary} opacity={lit} />
          </g>
        );
      })}

      {/* Sources: quiet wash and a coral tick while syncing, full strength once synced. */}
      {SOURCES.map((s, i) => {
        const lit = ramp(t, syncAt(i), 0.4) * o;
        const active = blip(t, syncAt(i), 0.12, 0.18);
        const y = srcY(i);
        return (
          <g key={s.label} opacity={0.5 + 0.5 * lit}>
            <Card x={SRC.x} y={y} w={SRC.w} h={SRC.h} />
            <g opacity={active}>
              <rect x={SRC.x + 0.5} y={y + 0.5} width={SRC.w - 1} height={SRC.h - 1} rx={11.5} fill={C.accentWash} stroke={C.accentLine} />
              <rect x={SRC.x + 5} y={y + 18} width={2} height={SRC.h - 36} rx={1} fill={C.accent} />
            </g>
            <rect x={SRC.x + 14} y={y + 14} width={28} height={28} rx={8} fill={C.paper} stroke={C.line} />
            <g transform={`translate(${SRC.x + 28} ${y + 28})`}>{s.icon}</g>
            <text x={SRC.x + 54} y={y + 25} fontSize={12} fontWeight={550} fill={C.ink}>
              {s.label}
            </text>
            <Mono x={SRC.x + 54} y={y + 40} size={8.6}>
              {s.meta}
            </Mono>
          </g>
        );
      })}

      {/* The product model. */}
      <Card x={MODEL.x} y={MODEL.y} w={MODEL.w} h={MODEL.h} />
      <g transform={`translate(${MODEL.x + 18} ${MODEL.y + 26})`}>
        <g transform="translate(5 -3.5)" opacity={(1 - ready * o) * ramp(t, 0.3, 0.4)}>
          <circle r={5} fill="none" stroke={C.line} />
          <circle r={5} fill="none" stroke={C.accent} pathLength={1} strokeDasharray="0.3 0.7" transform={`rotate(${t * 300})`} />
        </g>
        <g opacity={ready * o}>
          <Check x={5} y={-3.5} r={5.5} k={1} />
        </g>
        <Mono x={18} y={0} size={9.5} fill={C.ink} opacity={1 - ready * o}>
          Building product model
        </Mono>
        <Mono x={18} y={0} size={9.5} fill={C.ink} opacity={ready * o}>
          Product model ready
        </Mono>
        <Mono x={MODEL.w - 36} y={0} size={9.5} fill={C.muted} textAnchor="end">
          {`${Math.round(progress * o * 100)}%`}
        </Mono>
      </g>
      <rect x={MODEL.x + 18} y={MODEL.y + 40} width={MODEL.w - 36} height={3} rx={1.5} fill={C.hair} />
      <rect x={MODEL.x + 18} y={MODEL.y + 40} width={(MODEL.w - 36) * progress * o} height={3} rx={1.5} fill={C.accent} />
      <rect x={MODEL.x + 18} y={MODEL.y + 40} width={(MODEL.w - 36) * progress * o} height={3} rx={1.5} fill={C.primary} opacity={ready} />
      {CHECKS.map((c, i) => {
        const k = ramp(t, checkAt(i), 0.45) * o;
        const y = ROW.y + i * ROW.pitch;
        // The row being worked on: a coral dot in its empty check and a firmer label.
        const working = blip(t, checkAt(i) - 0.45, 0.3, 0.25) * o;
        return (
          <g key={c.label}>
            {i > 0 && <line x1={MODEL.x + 18} x2={MODEL.x + MODEL.w - 18} y1={y - 8} y2={y - 8} stroke={C.hair} />}
            <Check x={MODEL.x + 27} y={y + 9} r={7} k={k} />
            <circle cx={MODEL.x + 27} cy={y + 9} r={3} fill={C.accent} opacity={working * (1 - k)} />
            <text x={MODEL.x + 44} y={y + 13} fontSize={12} fontWeight={550} fill={C.ink} opacity={0.45 + 0.55 * Math.max(k, working * 0.7)}>
              {c.label}
            </text>
            <g {...rise(k, 4)}>
              <Mono x={MODEL.x + MODEL.w - 18} y={y + 12.5} size={8.6} fill={C.primary} textAnchor="end">
                {c.detail}
              </Mono>
            </g>
            {/* Skeleton while the row is still being worked out. */}
            <rect x={MODEL.x + MODEL.w - 18 - 96} y={y + 6} width={96} height={6} rx={3} fill={C.hair} opacity={1 - k} />
          </g>
        );
      })}

      {/* The positioning map. */}
      <Card x={MAP.x} y={MAP.y} w={MAP.w} h={MAP.h} />
      <Mono x={MAP.x + 18} y={MAP.y + 26} size={9.5} fill={C.ink}>
        Positioning map
      </Mono>
      {/* Open-space quadrant, revealed once you land. */}
      <rect x={PLOT.x + PLOT.w / 2} y={PLOT.y} width={PLOT.w / 2} height={PLOT.h / 2} fill={C.accentWash} opacity={landed * o} rx={6} />
      {/* The empty grid waits quietly, then firms up as the map is plotted. */}
      <g stroke={C.ink} strokeOpacity={0.12} opacity={0.4 + 0.6 * mapIn * o}>
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={PLOT.y + PLOT.h / 2} y2={PLOT.y + PLOT.h / 2} strokeDasharray="2 4" />
        <line x1={PLOT.x + PLOT.w / 2} x2={PLOT.x + PLOT.w / 2} y1={PLOT.y} y2={PLOT.y + PLOT.h} strokeDasharray="2 4" />
        <line x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.h} strokeOpacity={0.25} />
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={PLOT.y + PLOT.h} y2={PLOT.y + PLOT.h} strokeOpacity={0.25} />
      </g>
      <g {...rise(mapIn * o)}>
        <Mono x={PLOT.x + PLOT.w} y={PLOT.y + PLOT.h + 18} size={8.4} textAnchor="end">
          Developer-first →
        </Mono>
        <Mono x={0} y={0} size={8.4} textAnchor="end" transform={`translate(${PLOT.x - 12} ${PLOT.y}) rotate(-90)`}>
          Self-serve →
        </Mono>
      </g>
      {/* Competitor cluster. */}
      {RIVALS.map((r, i) => {
        const k = ramp(t, rivalAt(i), 0.4, easeOut) * o;
        const [x, y] = px(r);
        return <circle key={i} cx={x} cy={y} r={2.5 + 1.5 * k} fill={C.sage} opacity={0.9 * k} />;
      })}
      <g {...rise(ramp(t, rivalAt(7) + 0.3, 0.4, easeOut) * o, 4)}>
        <Mono x={px([0.26, 0.86])[0]} y={px([0.26, 0.86])[1]} size={8.4} textAnchor="middle">
          Incumbents
        </Mono>
      </g>
      {/* You: rises out of the middle and glides alone into the open quadrant. */}
      <g opacity={ramp(t, YOU_AT - 0.35, 0.35) * o}>
        <circle cx={youAt[0]} cy={youAt[1]} r={7 + 7 * landed} fill={C.accent} opacity={0.14} />
        <circle cx={youAt[0]} cy={youAt[1]} r={5} fill={C.accent} stroke={C.card} />
        <g {...rise(landed, 4)}>
          <rect x={youAt[0] - 82} y={youAt[1] - 10} width={66} height={20} rx={10} fill={C.ink} />
          <Mono x={youAt[0] - 49} y={youAt[1] + 3} size={8.4} fill="#fff" textAnchor="middle">
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
