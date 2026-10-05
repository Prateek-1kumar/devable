import { STEPS } from "../content";
import { C, Card, Check, DATA, Mark, Mono, PanelSvg, blip, clamp01, easeOut, lerp, outro, ramp } from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 02 Growth Strategy. Beginning: five channels sit unscored in a priority
// matrix. Work: each is scored on impact and effort, given a tier, and the rows
// re-sort by priority, AI answers rising to the top. Result: a six-week content
// roadmap fills week by week with articles aimed at the winning channels.

const DURATION = 8;
const SETTLE = 7.3;

type Tier = "P1" | "P2" | "P3";
const CHANNELS: { label: string; meta: string; mark: MarkName; impact: number; effort: number; score: number; tier: Tier; rank: number }[] = [
  { label: "Google Search", meta: "1.2k keywords", mark: "google", impact: 8.2, effort: 5.8, score: 7.4, tier: "P1", rank: 1 },
  { label: "AI answers", meta: "ChatGPT · Perplexity", mark: "chatgpt", impact: 9.0, effort: 3.4, score: 9.1, tier: "P1", rank: 0 },
  { label: "Reddit", meta: "r/devops · r/selfhosted", mark: "reddit", impact: 5.8, effort: 4.2, score: 6.2, tier: "P2", rank: 3 },
  { label: "Dev communities", meta: "HN · dev.to · Discord", mark: "hackernews", impact: 6.6, effort: 3.8, score: 6.8, tier: "P2", rank: 2 },
  { label: "Creators", meta: "12 dev YouTubers", mark: "youtube", impact: 5.2, effort: 7.2, score: 4.1, tier: "P3", rank: 4 },
];
const scoreAt = (i: number) => 0.55 + i * 0.32;
const SORT_AT = 2.55;
const SORT_FOR = 0.85;
const SORTED = SORT_AT + SORT_FOR;

const MX = { x: 20, y: 100, w: 520, h: 206 };
const ROW = { y: MX.y + 56, h: 29 };
const COL = { name: 66, impact: 214, effort: 324, bar: 68, score: 466, tier: 482 };

const ROADMAP: { title: string; mark: MarkName }[] = [
  { title: "pgvector vs Pinecone: benchmarks", mark: "chatgpt" },
  { title: "Preview environments for Next.js", mark: "google" },
  { title: "Show HN: self-hosted deploy previews", mark: "hackernews" },
  { title: "Deploy previews on every PR", mark: "google" },
  { title: "Render vs Fly.io vs Railway costs", mark: "reddit" },
  { title: "Ephemeral envs in 5 minutes", mark: "youtube" },
];
const RM = { x: 20, y: 318, w: 520, h: 186 };
const RROW = { y: RM.y + 52, h: 21 };
const WEEKS = { x: 300, w: 224 };
const weekW = WEEKS.w / 6;
const weekAt = (i: number) => 3.75 + i * 0.42;

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const sort = ramp(t, SORT_AT, SORT_FOR);
  const sorted = ramp(t, SORTED - 0.1, 0.3) * o;
  const scored = CHANNELS.filter((_, i) => t > scoreAt(i) + 0.45).length;
  const cursor = clamp01((t - weekAt(0)) / (weekAt(5) + 0.42 - weekAt(0)));
  const planned = ROADMAP.filter((_, i) => t > weekAt(i) + 0.3).length;

  return (
    <PanelSvg metrics={STEPS[1].metrics} t={t} metricsAt={[0.55, scoreAt(1)]} metricsFor={[2.2, 0.9]}>
      {/* ── Channel prioritization matrix ── */}
      <Card x={MX.x} y={MX.y} w={MX.w} h={MX.h} />
      <g transform={`translate(${MX.x + 16} ${MX.y + 24})`}>
        {sorted > 0.5 ? (
          <Check x={4} y={-3.5} r={5.5} k={1} />
        ) : (
          <g transform="translate(4 -3.5)">
            <circle r={5} fill="none" stroke={C.line} strokeWidth={1.6} />
            <circle r={5} fill="none" stroke={C.accent} strokeWidth={1.6} pathLength={1} strokeDasharray="0.3 0.7" transform={`rotate(${t * 360})`} opacity={t > 0.4 ? 1 : 0} />
          </g>
        )}
        <Mono x={16} y={0} size={9.5} fill={C.ink}>
          Channel prioritization
        </Mono>
        <Mono x={MX.w - 32} y={0} size={8.8} fill={sorted > 0.5 ? C.primary : C.muted} textAnchor="end">
          {sorted > 0.5 ? "Sorted by priority" : t > SORT_AT ? "Sorting…" : `Scoring ${Math.round(scored * o)} / 5`}
        </Mono>
      </g>
      <g>
        <Mono x={COL.name - 30} y={MX.y + 47} size={8.4}>
          Channel
        </Mono>
        <Mono x={COL.impact} y={MX.y + 47} size={8.4}>
          Impact
        </Mono>
        <Mono x={COL.effort} y={MX.y + 47} size={8.4}>
          Effort
        </Mono>
        <Mono x={COL.score} y={MX.y + 47} size={8.4} textAnchor="end" fill={sorted > 0.5 ? C.ink : C.muted}>
          {sorted > 0.5 ? "Score ↓" : "Score"}
        </Mono>
        <Mono x={COL.tier + 18} y={MX.y + 47} size={8.4} textAnchor="middle">
          Tier
        </Mono>
      </g>
      {[0, 1, 2, 3, 4].map((s) => (
        <line key={s} x1={MX.x + 16} x2={MX.x + MX.w - 16} y1={ROW.y + s * ROW.h} y2={ROW.y + s * ROW.h} stroke={C.line} />
      ))}
      {/* Top-priority slot: coral once the sort lands. */}
      <g opacity={sorted}>
        <rect x={MX.x + 8} y={ROW.y + 1} width={MX.w - 16} height={ROW.h - 1.5} rx={6} fill={C.accentSoft} />
        <rect x={MX.x + 8} y={ROW.y + 5} width={2.5} height={ROW.h - 10} rx={1.25} fill={C.accent} />
      </g>
      {/* Rows: rising rows drawn last so they pass over the ones they overtake. */}
      {CHANNELS.map((c, i) => ({ c, i }))
        .sort((a, b) => a.i - a.c.rank - (b.i - b.c.rank))
        .map(({ c, i }) => {
          const at = scoreAt(i);
          const lit = ramp(t, at, 0.25) * o;
          const imp = ramp(t, at + 0.05, 0.5, easeOut) * o;
          const eff = ramp(t, at + 0.18, 0.5, easeOut) * o;
          const tierK = ramp(t, at + 0.5, 0.25) * o;
          const active = blip(t, at, 0.4, 0.12);
          const moving = blip(t, SORT_AT, SORT_FOR - 0.3, 0.15) * (c.rank !== i ? 1 : 0);
          const top = c.rank === 0 ? sorted : 0;
          const y = lerp(ROW.y + i * ROW.h, ROW.y + c.rank * ROW.h, sort);
          const cy = y + ROW.h / 2;
          const confirmed = sorted > 0.5;
          return (
            <g key={c.label} opacity={0.5 + 0.5 * lit}>
              {/* Lift card while scoring or moving. */}
              <rect
                x={MX.x + 8}
                y={y + 1}
                width={MX.w - 16}
                height={ROW.h - 1.5}
                rx={6}
                fill={top > 0.5 ? C.accentSoft : C.card}
                fillOpacity={Math.max(moving, active)}
                stroke={C.accent}
                strokeOpacity={Math.max(active, moving * 0.6)}
              />
              <rect x={MX.x + 16} y={cy - 11} width={22} height={22} rx={6} fill={C.paper} stroke={C.line} />
              <Mark name={c.mark} x={MX.x + 27} y={cy} size={12.5} />
              <text x={COL.name} y={cy - 1.5} fontSize={11.5} fontWeight={550} fill={C.ink}>
                {c.label}
              </text>
              <Mono x={COL.name} y={cy + 10} size={8.4}>
                {c.meta}
              </Mono>
              {/* Impact and effort bars. */}
              {[
                { x: COL.impact, v: c.impact, k: imp, color: DATA.teal },
                { x: COL.effort, v: c.effort, k: eff, color: DATA.slate },
              ].map((b) => (
                <g key={b.x}>
                  <rect x={b.x} y={cy - 3} width={COL.bar} height={6} rx={3} fill={C.line} opacity={0.7} />
                  <rect x={b.x} y={cy - 3} width={(COL.bar * b.v * b.k) / 10} height={6} rx={3} fill={b.color} />
                  <Mono x={b.x + COL.bar + 7} y={cy + 3} size={8.8} fill={C.ink} opacity={b.k > 0.02 ? 1 : 0}>
                    {(b.v * b.k).toFixed(1)}
                  </Mono>
                </g>
              ))}
              {/* Score. */}
              {imp > 0.02 ? (
                <text x={COL.score} y={cy + 5} fontSize={15} fontWeight={600} letterSpacing="-0.02em" textAnchor="end" fill={top > 0.5 ? C.accent : C.ink}>
                  {(c.score * imp).toFixed(1)}
                </text>
              ) : (
                <rect x={COL.score - 22} y={cy - 3} width={22} height={6} rx={3} fill={C.line} />
              )}
              {/* Tier: proposed (outlined) while scoring, confirmed (deep green) once sorted. */}
              <g opacity={tierK}>
                <rect
                  x={COL.tier}
                  y={cy - 9}
                  width={36}
                  height={18}
                  rx={9}
                  fill={confirmed ? (c.tier === "P1" ? C.primary : c.tier === "P2" ? C.primarySoft : C.paper) : C.card}
                  stroke={confirmed ? (c.tier === "P1" ? C.primary : c.tier === "P2" ? C.primarySoft : C.line) : C.line}
                />
                <Mono x={COL.tier + 18} y={cy + 3.2} size={8.8} textAnchor="middle" fill={confirmed ? (c.tier === "P1" ? "#fff" : c.tier === "P2" ? C.primary : C.muted) : C.ink}>
                  {c.tier}
                </Mono>
              </g>
            </g>
          );
        })}

      {/* ── Content roadmap ── */}
      <Card x={RM.x} y={RM.y} w={RM.w} h={RM.h} />
      <Mono x={RM.x + 16} y={RM.y + 22} size={9.5} fill={C.ink}>
        Content roadmap
      </Mono>
      <Mono x={RM.x + RM.w - 16} y={RM.y + 22} size={8.8} textAnchor="end" fill={planned * o >= 6 ? C.primary : C.muted}>
        {`${Math.round(planned * o)} of 6 planned`}
      </Mono>
      <Mono x={RM.x + 16} y={RM.y + 43} size={8.4}>
        Article · channel
      </Mono>
      {ROADMAP.map((_, w) => {
        const x = WEEKS.x + w * weekW;
        const now = blip(t, weekAt(w), 0.22, 0.1) * o;
        return (
          <g key={w}>
            <line x1={x} x2={x} y1={RM.y + 32} y2={RROW.y + 6 * RROW.h} stroke={C.line} />
            <Mono x={x + weekW / 2} y={RM.y + 43} size={8.4} textAnchor="middle" fill={now > 0.5 ? C.accent : C.muted}>
              {`W${w + 1}`}
            </Mono>
          </g>
        );
      })}
      {ROADMAP.map((r, i) => {
        const y = RROW.y + i * RROW.h;
        const cy = y + RROW.h / 2;
        const k = ramp(t, weekAt(i), 0.35, easeOut) * o;
        const done = ramp(t, weekAt(i) + 0.38, 0.2) * o;
        return (
          <g key={r.title}>
            <line x1={RM.x + 16} x2={RM.x + RM.w - 16} y1={y} y2={y} stroke={C.line} />
            <g opacity={0.35 + 0.65 * k}>
              <Mark name={r.mark} x={RM.x + 23} y={cy} size={11} />
            </g>
            <text x={RM.x + 36} y={cy + 4} fontSize={11} fontWeight={550} fill={C.ink} opacity={clamp01((k - 0.35) / 0.65)}>
              {r.title}
            </text>
            {/* Skeleton until the week is planned. */}
            <rect x={RM.x + 36} y={cy - 3} width={150} height={6} rx={3} fill={C.line} opacity={1 - clamp01(k * 2.5)} />
            <rect
              x={WEEKS.x + i * weekW + 3}
              y={cy - 5.5}
              width={(weekW - 6) * k}
              height={11}
              rx={4}
              fill={done > 0.5 ? C.primary : C.accent}
              opacity={k > 0 ? 1 : 0}
            />
          </g>
        );
      })}
      <line x1={RM.x + 16} x2={RM.x + RM.w - 16} y1={RROW.y + 6 * RROW.h} y2={RROW.y + 6 * RROW.h} stroke={C.line} />
      {/* The week cursor sweeping across the plan. */}
      <g opacity={ramp(t, weekAt(0) - 0.2, 0.2) * (1 - ramp(t, weekAt(5) + 0.5, 0.3))}>
        <line x1={WEEKS.x + cursor * WEEKS.w} x2={WEEKS.x + cursor * WEEKS.w} y1={RM.y + 32} y2={RROW.y + 6 * RROW.h} stroke={C.accent} strokeWidth={1.5} />
        <circle cx={WEEKS.x + cursor * WEEKS.w} cy={RM.y + 32} r={2.5} fill={C.accent} />
      </g>
    </PanelSvg>
  );
}

const strategy: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default strategy;
