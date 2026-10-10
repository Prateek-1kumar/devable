import { Beacon, C, Card, Mono, PanelSvg, clamp01, easeInOut, lerp, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 02 Growth Strategy. A ranked list of growth priorities above the channel mix
// they add up to. Prioritising never stops: a soft highlight glides to each
// priority in turn, its impact meter re-measures bar by bar, and the channel it
// runs on lights up in the mix. Three equal beats, so the loop wraps with no seam.

const BEAT = 4;

const PRIORITIES = [
  { title: "High-intent category visibility", channel: "Search & AI visibility", impact: 4, mix: 1 },
  { title: "Comparison and alternative demand", channel: "Technical content", impact: 4, mix: 0 },
  { title: "Technical creator distribution", channel: "Creator distribution", impact: 3, mix: 3 },
];
const DURATION = PRIORITIES.length * BEAT;

const MIX = [
  { label: "Content", share: 35, color: "color-mix(in srgb, var(--primary) 32%, var(--ink))" },
  { label: "Search & AI", share: 30, color: "color-mix(in srgb, var(--primary) 58%, var(--ink))" },
  { label: "Reddit", share: 15, color: "var(--sage)" },
  { label: "Creators", share: 20, color: "color-mix(in srgb, var(--primary) 62%, var(--card))" },
];

// ── Layout ──────────────────────────────────────────────────────────────────
const CARD = { x: 22, y: 27, w: 436, h: 346 };
const PAD = 22;
const ROW = { y: CARD.y + 58, h: 56, gap: 4 };
const rowY = (i: number) => ROW.y + i * (ROW.h + ROW.gap);
const METER = { x: CARD.x + CARD.w - PAD - 86, steps: 5, w: 5, h: 13, gap: 3 };
const BAR = { x: CARD.x + PAD, y: CARD.y + 282, w: CARD.w - PAD * 2, h: 8, gap: 3 };
const segX = (i: number) => BAR.x + MIX.slice(0, i).reduce((x, m) => x + (m.share / 100) * BAR.w, 0);

const WASH = "color-mix(in srgb, var(--light-green-soft) 45%, var(--card))";
const WASH_EDGE = "color-mix(in srgb, var(--primary) 22%, var(--line))";

function Panel({ t }: { t: number }) {
  const tt = t % DURATION;
  const active = Math.floor(tt / BEAT);
  const local = tt - active * BEAT;
  // The highlight glides from the previous row (wrapping 3 → 1) over the beat's first half second.
  const prev = (active + PRIORITIES.length - 1) % PRIORITIES.length;
  const glide = easeInOut(clamp01(local / 0.6));
  const hy = lerp(rowY(prev), rowY(active), glide);
  // Each beat: the active meter dims, then re-measures bar by bar.
  const reset = ramp(local, 0.1, 0.35);
  const measure = clamp01((local - 0.6) / 1.8);
  const settled = ramp(local, 2.4, 0.4);
  // The linked mix segment lights for the beat, crossfading at its edges.
  const lit = (m: number) =>
    PRIORITIES[active].mix === m ? ramp(local, 0, 0.5) : PRIORITIES[prev].mix === m ? 1 - ramp(local, 0, 0.5) : 0;

  return (
    <PanelSvg t={t}>
      <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={16} />

      {/* Header */}
      <text x={CARD.x + PAD} y={CARD.y + 42} fontSize={15} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
        Growth priorities
      </text>
      <Beacon x={CARD.x + CARD.w - PAD - 122} y={CARD.y + 38} t={t} />
      <text x={CARD.x + CARD.w - PAD} y={CARD.y + 42} fontSize={11} fontWeight={500} fill={C.ink} textAnchor="end">
        Prioritizing by impact
      </text>

      {/* The highlight on the priority being measured. */}
      <rect x={CARD.x + 10} y={hy} width={CARD.w - 20} height={ROW.h} rx={11} fill={WASH} stroke={WASH_EDGE} />

      {PRIORITIES.map((p, i) => {
        const y = rowY(i);
        const on = i === active;
        // Bars filled: the full score at rest; re-measured while active.
        const level = on ? (1 - reset) * p.impact + reset * measure * p.impact : p.impact;
        const high = p.impact >= 4;
        return (
          <g key={p.title}>
            <Mono x={CARD.x + PAD + 2} y={y + ROW.h / 2 + 3.5} size={10} letterSpacing="0.04em" fill={C.muted}>
              {`0${i + 1}`}
            </Mono>
            <text x={CARD.x + PAD + 30} y={y + 24} fontSize={12.5} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
              {p.title}
            </text>
            <text x={CARD.x + PAD + 30} y={y + 40} fontSize={10.5} fill={C.muted}>
              {p.channel}
            </text>

            {/* Impact meter: steps fill one by one; the label settles once measured. */}
            {Array.from({ length: METER.steps }, (_, s) => {
              const fill = clamp01(level - s);
              const x = METER.x + s * (METER.w + METER.gap);
              const by = y + (ROW.h - METER.h) / 2;
              return (
                <g key={s}>
                  <rect x={x} y={by} width={METER.w} height={METER.h} rx={1.5} fill={C.line} />
                  <rect x={x} y={by} width={METER.w} height={METER.h} rx={1.5} fill={C.green} opacity={fill} />
                </g>
              );
            })}
            <text
              x={METER.x + METER.steps * (METER.w + METER.gap) + 6}
              y={y + ROW.h / 2 + 3.8}
              fontSize={10.5}
              fontWeight={600}
              fill={high ? C.green : C.muted}
              opacity={on ? lerp(1, 0.35, reset) + settled * 0.65 * reset : 1}
            >
              {high ? "High" : "Medium"}
            </text>
          </g>
        );
      })}

      {/* Recommended channel mix: one bar in shares; the active priority's channel lights. */}
      <line x1={CARD.x + PAD} x2={CARD.x + CARD.w - PAD} y1={CARD.y + 248} y2={CARD.y + 248} stroke={C.hair} />
      <Mono x={BAR.x} y={BAR.y - 14} size={8.5} letterSpacing="0.18em" fill={C.muted}>
        Recommended channel mix
      </Mono>
      {MIX.map((m, i) => {
        const x = segX(i) + (i ? BAR.gap / 2 : 0);
        const w = (m.share / 100) * BAR.w - (i && i < MIX.length - 1 ? BAR.gap : BAR.gap / 2);
        const k = lit(i);
        return (
          <g key={m.label}>
            <rect x={x} y={BAR.y - k * 1.5} width={w} height={BAR.h + k * 3} rx={(BAR.h + k * 3) / 2} fill={m.color} opacity={0.55 + 0.45 * k} />
            <text x={x} y={BAR.y + 30} fontSize={10.5} fontWeight={k > 0.5 ? 600 : 500} fill={C.ink} opacity={0.6 + 0.4 * k}>
              {m.label}
            </text>
            <Mono x={x} y={BAR.y + 45} size={9} letterSpacing="0.04em" fill={C.muted}>
              {`${m.share}%`}
            </Mono>
          </g>
        );
      })}
    </PanelSvg>
  );
}

// The still frame (reduced motion): priority 01 measured and its channel lit.
const strategy: PanelModule = { duration: DURATION, settle: 3, Panel };
export default strategy;
