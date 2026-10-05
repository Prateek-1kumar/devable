import { STEPS } from "../content";
import { C, Card, Check, DATA, Mark, Mono, PanelSvg, blip, clamp01, easeOut, lerp, outro, ramp } from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 02 Growth Strategy. Beginning: five channels sit unscored in a priority
// matrix. Work: each is scored on impact and effort, given a tier, and the rows
// re-sort by priority, AI answers rising to the top. Result: a four-week content
// roadmap fills week by week with articles aimed at the winning channels.

const DURATION = 9;
const SETTLE = 7.5;

type Tier = "P1" | "P2" | "P3";
const CHANNELS: { label: string; mark: MarkName; impact: number; effort: number; score: number; tier: Tier; rank: number }[] = [
  { label: "Google Search", mark: "google", impact: 8.2, effort: 5.8, score: 7.4, tier: "P1", rank: 1 },
  { label: "AI answers", mark: "chatgpt", impact: 9.0, effort: 3.4, score: 9.1, tier: "P1", rank: 0 },
  { label: "Reddit", mark: "reddit", impact: 5.8, effort: 4.2, score: 6.2, tier: "P2", rank: 3 },
  { label: "Dev communities", mark: "hackernews", impact: 6.6, effort: 3.8, score: 6.8, tier: "P2", rank: 2 },
  { label: "Creators", mark: "youtube", impact: 5.2, effort: 7.2, score: 4.1, tier: "P3", rank: 4 },
];
// Beats: hold the empty matrix, score one row at a time, hold, sort, hold, plan.
const scoreAt = (i: number) => 0.6 + i * 0.48;
const SORT_AT = 3.4;
const SORT_FOR = 1.0;
const SORTED = SORT_AT + SORT_FOR;

const MX = { x: 20, y: 92, w: 520, h: 228 };
const ROW = { y: MX.y + 54, h: 32 };
const COL = { name: 68, impact: 206, effort: 312, bar: 64, score: 458, tier: 480 };

const ROADMAP: { title: string; mark: MarkName }[] = [
  { title: "pgvector vs Pinecone: benchmarks", mark: "chatgpt" },
  { title: "Preview environments for Next.js", mark: "google" },
  { title: "Show HN: self-hosted deploy previews", mark: "hackernews" },
  { title: "Render vs Fly.io vs Railway costs", mark: "reddit" },
];
const RM = { x: 20, y: 332, w: 520, h: 172 };
const RROW = { y: RM.y + 38, h: 30 };
const WEEKS = { x: 332, w: 192 };
const weekW = WEEKS.w / ROADMAP.length;
const weekAt = (i: number) => 4.95 + i * 0.5;
const WEEK_FOR = 0.42;

/** A colour `k` (0..1) of the way from `from` to `to`, so state changes blend instead of snapping. */
const mix = (to: string, from: string, k: number) => `color-mix(in srgb, ${to} ${Math.round(clamp01(k) * 100)}%, ${from})`;

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const sort = ramp(t, SORT_AT, SORT_FOR);
  const conf = ramp(t, SORTED - 0.05, 0.4) * o;
  const scored = CHANNELS.filter((_, i) => t > scoreAt(i) + 0.4).length;
  const planned = ROADMAP.filter((_, i) => t > weekAt(i) + WEEK_FOR).length;
  const fills = ROADMAP.map((_, i) => ramp(t, weekAt(i), WEEK_FOR) * o);
  const cursorX = WEEKS.x + fills.reduce((a, k) => a + k, 0) * weekW;

  return (
    <PanelSvg metrics={STEPS[1].metrics} t={t} metricsAt={[0.6, scoreAt(1)]} metricsFor={[2.4, 1.0]}>
      {/* ── Channel prioritization matrix ── */}
      <Card x={MX.x} y={MX.y} w={MX.w} h={MX.h} />
      <g transform={`translate(${MX.x + 16} ${MX.y + 24})`}>
        <circle cx={4} cy={-3.5} r={3} fill={C.accent} opacity={1 - clamp01(conf * 2.5)} />
        <g opacity={conf}>
          <Check x={4} y={-3.5} r={5.5} k={conf} />
        </g>
        <Mono x={16} y={0} size={9.5} fill={C.ink}>
          Channel prioritization
        </Mono>
        <Mono x={MX.w - 32} y={0} size={8.8} fill={conf > 0.5 ? C.primary : C.muted} textAnchor="end">
          {conf > 0.5 ? "Sorted by priority" : t > SORT_AT - 0.1 ? "Sorting…" : `Scoring ${Math.round(scored * o)} / 5`}
        </Mono>
      </g>
      <g>
        <Mono x={MX.x + 16} y={MX.y + 46} size={8.4}>
          Channel
        </Mono>
        <Mono x={COL.impact} y={MX.y + 46} size={8.4}>
          Impact
        </Mono>
        <Mono x={COL.effort} y={MX.y + 46} size={8.4}>
          Effort
        </Mono>
        <Mono x={COL.score} y={MX.y + 46} size={8.4} textAnchor="end" fill={conf > 0.5 ? C.ink : C.muted}>
          {conf > 0.5 ? "Score ↓" : "Score"}
        </Mono>
        <Mono x={COL.tier + 18} y={MX.y + 46} size={8.4} textAnchor="middle">
          Tier
        </Mono>
      </g>
      {[0, 1, 2, 3, 4].map((s) => (
        <line key={s} x1={MX.x + 16} x2={MX.x + MX.w - 16} y1={ROW.y + s * ROW.h} y2={ROW.y + s * ROW.h} stroke={C.hair} />
      ))}
      {/* Top-priority slot: a quiet wash and a coral tick once the sort lands. */}
      <g opacity={conf}>
        <rect x={MX.x + 8} y={ROW.y + 2} width={MX.w - 16} height={ROW.h - 4} rx={7} fill={C.accentWash} />
        <rect x={MX.x + 8} y={ROW.y + 9} width={2} height={ROW.h - 18} rx={1} fill={C.accent} />
      </g>
      {/* Rows: rising rows drawn last so they pass over the ones they overtake. */}
      {CHANNELS.map((c, i) => ({ c, i }))
        .sort((a, b) => a.i - a.c.rank - (b.i - b.c.rank))
        .map(({ c, i }) => {
          const at = scoreAt(i);
          const lit = ramp(t, at, 0.3) * o;
          const imp = ramp(t, at + 0.05, 0.5, easeOut) * o;
          const eff = ramp(t, at + 0.15, 0.5, easeOut) * o;
          const tierK = ramp(t, at + 0.45, 0.4, easeOut) * o;
          const active = blip(t, at, 0.12, 0.2);
          const moving = blip(t, SORT_AT, SORT_FOR - 0.4, 0.2) * (c.rank !== i ? 1 : 0);
          const rising = c.rank < i;
          const y = lerp(ROW.y + i * ROW.h, ROW.y + c.rank * ROW.h, sort);
          const cy = y + ROW.h / 2;
          const tierFill = c.tier === "P1" ? C.primary : c.tier === "P2" ? C.primarySoft : C.paper;
          const tierText = c.tier === "P1" ? "#fff" : c.tier === "P2" ? C.primary : C.muted;
          return (
            <g key={c.label}>
              {/* Lift while scoring or moving: an opaque wash, no outline. */}
              <rect
                x={MX.x + 8}
                y={y + 2}
                width={MX.w - 16}
                height={ROW.h - 4}
                rx={7}
                fill={rising || active > 0 ? C.accentWash : C.card}
                opacity={Math.max(moving, active)}
              />
              <rect x={MX.x + 8} y={cy - 7} width={2} height={14} rx={1} fill={C.accent} opacity={active} />
              <g opacity={0.45 + 0.55 * lit}>
                <rect x={MX.x + 16} y={cy - 11} width={22} height={22} rx={6} fill={C.paper} />
                <Mark name={c.mark} x={MX.x + 27} y={cy} size={12.5} />
                <text x={COL.name} y={cy + 4} fontSize={12} fontWeight={550} fill={C.ink}>
                  {c.label}
                </text>
                {/* Impact and effort bars. */}
                {[
                  { x: COL.impact, v: c.impact, k: imp, color: DATA.teal },
                  { x: COL.effort, v: c.effort, k: eff, color: DATA.slate },
                ].map((b) => (
                  <g key={b.x}>
                    <rect x={b.x} y={cy - 3} width={COL.bar} height={6} rx={3} fill={C.line} opacity={0.6} />
                    <rect x={b.x} y={cy - 3} width={(COL.bar * b.v * b.k) / 10} height={6} rx={3} fill={b.color} />
                    <Mono x={b.x + COL.bar + 8} y={cy + 3} size={8.8} fill={C.ink} opacity={clamp01(b.k * 3)}>
                      {(b.v * b.k).toFixed(1)}
                    </Mono>
                  </g>
                ))}
                {/* Score. */}
                <rect x={COL.score - 22} y={cy - 3} width={22} height={6} rx={3} fill={C.line} opacity={0.6 * (1 - clamp01(imp * 4))} />
                <text
                  x={COL.score}
                  y={cy + 5}
                  fontSize={15}
                  fontWeight={600}
                  letterSpacing="-0.02em"
                  textAnchor="end"
                  fill={c.rank === 0 && conf > 0.5 ? C.accent : C.ink}
                  opacity={clamp01(imp * 4)}
                >
                  {(c.score * imp).toFixed(1)}
                </text>
              </g>
              {/* Tier: proposed (quiet paper chip) while scoring, crossfading to confirmed (deep green) once sorted. No outlines. */}
              <g opacity={tierK} transform={`translate(0 ${(1 - tierK) * 4})`}>
                <rect x={COL.tier} y={cy - 9} width={36} height={18} rx={9} fill={mix(tierFill, C.paper, conf)} />
                <Mono x={COL.tier + 18} y={cy + 3.2} size={8.8} textAnchor="middle" fill={mix(tierText, C.ink, conf)}>
                  {c.tier}
                </Mono>
              </g>
            </g>
          );
        })}

      {/* ── Content roadmap ── */}
      <Card x={RM.x} y={RM.y} w={RM.w} h={RM.h} />
      <g transform={`translate(${RM.x + 16} ${RM.y + 24})`}>
        <circle cx={4} cy={-3.5} r={3} fill={mix(C.accent, C.line, ramp(t, weekAt(0) - 0.3, 0.3) * o)} opacity={1 - clamp01(ramp(t, weekAt(3) + WEEK_FOR, 0.4) * o * 2.5)} />
        <g opacity={ramp(t, weekAt(3) + WEEK_FOR, 0.4) * o}>
          <Check x={4} y={-3.5} r={5.5} k={ramp(t, weekAt(3) + WEEK_FOR, 0.4) * o} />
        </g>
        <Mono x={16} y={0} size={9.5} fill={C.ink}>
          Content roadmap
        </Mono>
        <Mono x={124} y={0} size={8.8} fill={planned * o >= 4 ? C.primary : C.muted}>
          {`${Math.round(planned * o)} of 4`}
        </Mono>
      </g>
      {ROADMAP.map((_, w) => {
        const x = WEEKS.x + w * weekW;
        const now = blip(t, weekAt(w), WEEK_FOR - 0.1, 0.15) * o;
        return (
          <g key={w}>
            {w > 0 && <line x1={x} x2={x} y1={RROW.y} y2={RROW.y + ROADMAP.length * RROW.h} stroke={C.hair} />}
            <Mono x={x + weekW / 2} y={RM.y + 24} size={8.4} textAnchor="middle" fill={C.muted} opacity={1 - now}>
              {`W${w + 1}`}
            </Mono>
            <Mono x={x + weekW / 2} y={RM.y + 24} size={8.4} textAnchor="middle" fill={C.accent} opacity={now}>
              {`W${w + 1}`}
            </Mono>
          </g>
        );
      })}
      {ROADMAP.map((r, i) => {
        const y = RROW.y + i * RROW.h;
        const cy = y + RROW.h / 2;
        const k = fills[i];
        const title = ramp(t, weekAt(i) + 0.1, 0.45, easeOut) * o;
        const done = ramp(t, weekAt(i) + WEEK_FOR - 0.05, 0.3) * o;
        return (
          <g key={r.title}>
            <line x1={RM.x + 16} x2={RM.x + RM.w - 16} y1={y} y2={y} stroke={C.hair} />
            <g opacity={0.4 + 0.6 * title}>
              <Mark name={r.mark} x={RM.x + 23} y={cy} size={11} />
            </g>
            <text x={RM.x + 38} y={cy + 4 + (1 - title) * 5} fontSize={12} fontWeight={550} fill={C.ink} opacity={title}>
              {r.title}
            </text>
            {/* Skeleton until the week is planned. */}
            <rect x={RM.x + 38} y={cy - 3} width={150} height={6} rx={3} fill={C.line} opacity={0.7 * (1 - clamp01(title * 3))} />
            <g opacity={k > 0 ? 1 : 0}>
              <rect x={WEEKS.x + i * weekW + 4} y={cy - 5} width={(weekW - 8) * k} height={10} rx={5} fill={mix(C.primary, C.accent, done)} />
            </g>
          </g>
        );
      })}
      {/* The week cursor rides the leading edge of the plan, holding between weeks. */}
      <g opacity={ramp(t, weekAt(0) - 0.3, 0.3) * (1 - ramp(t, weekAt(3) + WEEK_FOR + 0.1, 0.4))}>
        <line x1={cursorX} x2={cursorX} y1={RROW.y} y2={RROW.y + ROADMAP.length * RROW.h} stroke={C.accent} />
        <circle cx={cursorX} cy={RROW.y} r={2.5} fill={C.accent} />
      </g>
    </PanelSvg>
  );
}

const strategy: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default strategy;
