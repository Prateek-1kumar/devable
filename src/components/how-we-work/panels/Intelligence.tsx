import type { ReactNode } from "react";
import { C, Card, Check, Mark, Mono, PanelSvg, Pulse, Trace, clamp01, easeOut, outro, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 01 Product Intelligence. Five groups of real sources sit on the left, joined
// by thin curves to one "Product model" card. A status cycles through the work
// while the matching source group lights its connector in coral; "Running the
// quickstart" turns the card into a tiny terminal for a beat. Findings check off
// one by one until the model reads complete.

const DURATION = 10;
const SETTLE = 9.3;

// ── Sources ─────────────────────────────────────────────────────────────────
const TILE = 24;
const TGAP = 6;
type Src = { key: string; icon: ReactNode };
const GROUPS: { label: string; items: Src[] }[] = [
  {
    label: "Docs & code",
    items: [
      { key: "docs", icon: <Doc /> },
      { key: "github", icon: <Mark name="github" x={0} y={0} size={14} /> },
      { key: "changelog", icon: <Changelog /> },
    ],
  },
  {
    label: "Community",
    items: [
      { key: "reddit", icon: <Mark name="reddit" x={0} y={0} size={14} /> },
      { key: "hn", icon: <Mark name="hackernews" x={0} y={0} size={14} /> },
      { key: "discord", icon: <Mark name="discord" x={0} y={0} size={14} /> },
      { key: "x", icon: <Mark name="x" x={0} y={0} size={12} /> },
    ],
  },
  {
    label: "Calls",
    items: [
      { key: "gong", icon: <Monogram text="Go" /> },
      { key: "granola", icon: <Monogram text="Gr" /> },
      { key: "intercom", icon: <Mark name="intercom" x={0} y={0} size={14} /> },
    ],
  },
  {
    label: "Market",
    items: [
      { key: "sites", icon: <Globe /> },
      { key: "g2", icon: <Mark name="g2" x={0} y={0} size={14} /> },
    ],
  },
  {
    label: "Visibility",
    items: [
      { key: "google", icon: <Mark name="google" x={0} y={0} size={14} /> },
      { key: "chatgpt", icon: <Mark name="chatgpt" x={0} y={0} size={14} /> },
      { key: "perplexity", icon: <Mark name="perplexity" x={0} y={0} size={14} /> },
    ],
  },
];
const COL = { x: 40, y: 80, pitch: 54 };
const groupY = (g: number) => COL.y + g * COL.pitch;
const rowW = (n: number) => n * TILE + (n - 1) * TGAP;

// ── Product model card ──────────────────────────────────────────────────────
const CARD = { x: 212, y: 74, w: 228, h: 252 };
const PAD = 16;
const STATUS_Y = CARD.y + 62;
const DOTS_Y = CARD.y + 84;
const BODY_Y = CARD.y + 104;
const ROW = { y: BODY_Y + 22, pitch: 22 };

/** Where group g's connector meets the card: a gentle fan on its left edge. */
const entry = (g: number): [number, number] => [CARD.x, CARD.y + 92 + (g - 2) * 16];
const start = (g: number): [number, number] => [COL.x + rowW(GROUPS[g].items.length) + 10, groupY(g) + 22];
const curve = (g: number) => {
  const [sx, sy] = start(g);
  const [ex, ey] = entry(g);
  const m = (ex - sx) * 0.55;
  return `M${sx} ${sy} C${sx + m} ${sy} ${ex - m} ${ey} ${ex} ${ey}`;
};
/** Sampled points along the curve, so a Pulse can travel it. */
const curvePts = (g: number): [number, number][] => {
  const [sx, sy] = start(g);
  const [ex, ey] = entry(g);
  const m = (ex - sx) * 0.55;
  const p = [sx, sy, sx + m, sy, ex - m, ey, ex, ey];
  return Array.from({ length: 17 }, (_, i) => {
    const u = i / 16;
    const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
    return [a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7]];
  });
};

// ── Story ───────────────────────────────────────────────────────────────────
// Each status: when it starts, how long it runs, which group feeds it (-1: all).
const STATUSES: { text: string; at: number; dur: number; group: number }[] = [
  { text: "Reading docs", at: 0.7, dur: 0.7, group: 0 },
  { text: "Running the quickstart", at: 1.4, dur: 1.9, group: 0 },
  { text: "Mapping use cases", at: 3.3, dur: 0.65, group: 1 },
  { text: "Listening to sales calls", at: 3.95, dur: 0.65, group: 2 },
  { text: "Profiling buyers & personas", at: 4.6, dur: 0.65, group: 2 },
  { text: "Analyzing competitors", at: 5.25, dur: 0.65, group: 3 },
  { text: "Auditing search & AI visibility", at: 5.9, dur: 0.65, group: 4 },
  { text: "Reviewing existing content", at: 6.55, dur: 0.65, group: 4 },
  { text: "Finding positioning gaps", at: 7.2, dur: 0.7, group: -1 },
];
const DONE = 7.9;
const QUICK = STATUSES[1];
/** When each group has finished feeding the model. */
const groupDone = (g: number) => Math.max(...STATUSES.filter((s) => s.group === g).map((s) => s.at + s.dur));

const FINDINGS: { label: string; at: number; value?: string }[] = [
  { label: "Core use cases", at: 3.8 },
  { label: "Who it's for", at: 5.1 },
  { label: "Competitor landscape", at: 5.75 },
  { label: "Visibility baseline", at: 6.4 },
  { label: "Content gaps", at: 7.05 },
  { label: "Where it wins", at: 7.75, value: "Self-hosting" },
];

function Panel({ t }: { t: number }) {
  const fade = outro(t, DURATION);
  const cardIn = ramp(t, 0.15, 0.5, easeOut);
  // The terminal takes over the card's body for the quickstart beat.
  const term = Math.min(ramp(t, QUICK.at + 0.05, 0.3), 1 - ramp(t, QUICK.at + QUICK.dur - 0.3, 0.3));
  const done = ramp(t, DONE, 0.35);

  return (
    <PanelSvg t={t}>
      <g opacity={fade}>
        {/* Connectors: quiet grey curves, the active one traced in coral. */}
        {GROUPS.map((_, g) => {
          const on = ramp(t, 0.35 + g * 0.06, 0.6);
          const pts = curvePts(g);
          const [sx, sy] = start(g);
          const [ex, ey] = entry(g);
          return (
            <g key={g}>
              <Trace d={curve(g)} k={on} stroke={C.line} width={1.2} />
              {STATUSES.map((s, i) =>
                s.group === g || s.group === -1 ? (
                  <g key={i} opacity={1 - ramp(t, s.at + s.dur - 0.2, 0.25)}>
                    <Trace d={curve(g)} k={ramp(t, s.at, 0.4, easeOut)} stroke={s.group === -1 ? C.accentLine : C.accent} width={1.2} />
                    <Pulse points={pts} k={(t - s.at - 0.1) / Math.min(0.6, s.dur - 0.15)} r={2.4} />
                  </g>
                ) : null,
              )}
              <circle cx={sx} cy={sy} r={2} fill={C.card} stroke={C.line} opacity={on} />
              <circle cx={ex} cy={ey} r={2} fill={C.card} stroke={C.line} opacity={on} />
            </g>
          );
        })}

        {/* Source groups */}
        {GROUPS.map((grp, g) => {
          const k = ramp(t, 0.05 + g * 0.07, 0.5, easeOut);
          const active = Math.max(
            0,
            ...STATUSES.map((s) => (s.group === g ? Math.min(ramp(t, s.at, 0.25), 1 - ramp(t, s.at + s.dur - 0.15, 0.25)) : 0)),
          );
          // Back-to-back statuses on one group: keep it lit through the handover.
          const lit = STATUSES.some((s, i) => s.group === g && STATUSES[i + 1]?.group === g && t >= s.at && t < s.at + s.dur + 0.3) ? 1 : active;
          const fin = ramp(t, groupDone(g), 0.3);
          const y = groupY(g);
          return (
            <g key={grp.label} opacity={k} transform={`translate(0 ${(1 - k) * 5})`}>
              <Mono x={COL.x + 1} y={y + 1} size={9} fill={lit > 0.5 ? C.ink : C.muted}>
                {grp.label}
              </Mono>
              <circle cx={COL.x + grp.label.length * 6.3 + 10} cy={y - 2} r={2.5} fill={C.primary} opacity={fin} />
              {grp.items.map((it, i) => {
                const x = COL.x + i * (TILE + TGAP);
                return (
                  <g key={it.key} transform={`translate(${x} ${y + 10})`}>
                    <Card x={0} y={0} w={TILE} h={TILE} r={6} shadow={false} stroke={C.line} />
                    <rect width={TILE} height={TILE} rx={6} fill={C.accentWash} stroke={C.accentLine} opacity={lit} />
                    <g transform={`translate(${TILE / 2} ${TILE / 2})`}>{it.icon}</g>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Product model card */}
        <g opacity={cardIn} transform={`translate(0 ${(1 - cardIn) * 6})`}>
          <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={12} />
          <Mono x={CARD.x + PAD} y={CARD.y + 24} size={9} fill={C.muted}>
            Product model
          </Mono>
          <Mono x={CARD.x + CARD.w - PAD} y={CARD.y + 24} size={9} fill={C.muted} textAnchor="end">
            acme.dev
          </Mono>
          <line x1={CARD.x} x2={CARD.x + CARD.w} y1={CARD.y + 38} y2={CARD.y + 38} stroke={C.hair} />

          <StatusLine t={t} done={done} />
          <ProgressDots t={t} />

          <line x1={CARD.x + PAD} x2={CARD.x + CARD.w - PAD} y1={BODY_Y} y2={BODY_Y} stroke={C.hair} />

          {/* Findings fill in as the work lands. */}
          <g opacity={1 - term}>
            {FINDINGS.map((f, i) => {
              const k = ramp(t, f.at, 0.45, easeOut);
              const y = ROW.y + i * ROW.pitch;
              return (
                <g key={f.label}>
                  <Check x={CARD.x + PAD + 7} y={y - 4} r={7} k={k} />
                  <text x={CARD.x + PAD + 22} y={y} fontSize={12} fill={C.ink} opacity={0.38 + 0.62 * k}>
                    {f.label}
                  </text>
                  {f.value && (
                    <text x={CARD.x + CARD.w - PAD} y={y} fontSize={12} fontWeight={600} fill={C.primary} textAnchor="end" opacity={ramp(t, f.at + 0.25, 0.4)}>
                      {f.value}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          <Terminal t={t} k={term} />
        </g>
      </g>
    </PanelSvg>
  );
}

/** The cycling status: a coral dot and one short line, crossfading with a small rise. */
function StatusLine({ t, done }: { t: number; done: number }) {
  const x = CARD.x + PAD;
  const breathe = 0.5 + 0.5 * Math.sin(t * 4.2);
  return (
    <g>
      <circle cx={x + 4} cy={STATUS_Y - 4} r={4 + 2.5 * breathe} fill={C.accent} opacity={(0.14 + 0.06 * breathe) * (1 - done) * ramp(t, 0.6, 0.3)} />
      <circle cx={x + 4} cy={STATUS_Y - 4} r={3.5} fill={done > 0.5 ? C.primary : C.accent} opacity={ramp(t, 0.6, 0.3)} />
      {STATUSES.map((s, i) => {
        const inK = ramp(t, s.at, 0.25, easeOut);
        const outK = i === STATUSES.length - 1 ? ramp(t, DONE - 0.1, 0.2) : ramp(t, s.at + s.dur - 0.12, 0.18);
        const o = Math.min(inK, 1 - outK);
        if (o <= 0) return null;
        return (
          <text key={s.text} x={x + 16} y={STATUS_Y + (1 - inK) * 5} fontSize={12.5} fontWeight={500} fill={C.ink} opacity={o}>
            {s.text}
          </text>
        );
      })}
      {done > 0 && (
        <text x={x + 16} y={STATUS_Y + (1 - done) * 5} fontSize={12.5} fontWeight={600} fill={C.primary} opacity={done}>
          Product model complete
        </text>
      )}
    </g>
  );
}

/** One dot per status: green when done, coral while active, grey ahead. */
function ProgressDots({ t }: { t: number }) {
  const x0 = CARD.x + PAD + 16;
  return (
    <g opacity={ramp(t, 0.6, 0.3)}>
      {STATUSES.map((s, i) => {
        const on = ramp(t, s.at, 0.2);
        const off = ramp(t, s.at + s.dur - 0.1, 0.2);
        const fill = off > 0.5 ? C.primary : on > 0.5 ? C.accent : C.line;
        return <circle key={i} cx={x0 + i * 11} cy={DOTS_Y} r={on > 0.5 && off < 0.5 ? 3 : 2.5} fill={fill} />;
      })}
    </g>
  );
}

/** The quickstart beat: the card's body becomes a tiny terminal. */
function Terminal({ t, k }: { t: number; k: number }) {
  if (k <= 0) return null;
  const x = CARD.x + PAD;
  const y = BODY_Y + 14;
  const w = CARD.w - PAD * 2;
  const h = 96;
  const cmd = "npx acme init";
  const typed = cmd.slice(0, Math.round(clamp01((t - (QUICK.at + 0.3)) / 0.55) * cmd.length));
  const typing = typed.length < cmd.length;
  const l2 = ramp(t, QUICK.at + 0.85, 0.2);
  const l3 = ramp(t, QUICK.at + 1.0, 0.3, easeOut);
  const mono = { fontFamily: "var(--font-mono)", fontSize: 11 } as const;
  const cw = 6.6; // approx. mono advance at 11px
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 5})`}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={C.accentWash} stroke={C.accentLine} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 12 + i * 9} cy={y + 12} r={2.6} fill={C.line} />
      ))}
      <text x={x + 12} y={y + 40} {...mono} fill={C.muted}>
        $ <tspan fill={C.ink}>{typed}</tspan>
      </text>
      {typing || l2 === 0 ? <rect x={x + 12 + (typed.length + 2) * cw} y={y + 31} width={6} height={11} rx={1} fill={C.accent} opacity={0.8} /> : null}
      <text x={x + 12} y={y + 61} {...mono} fill={C.muted} opacity={l2}>
        ✓ installed in 4.1s
      </text>
      <g opacity={l3} transform={`translate(0 ${(1 - l3) * 4})`}>
        <rect x={x + 6} y={y + 69} width={w - 12} height={19} rx={5} fill={C.primarySoft} />
        <text x={x + 12} y={y + 82} {...mono} fill={C.primary} fontWeight={600}>
          ✓ app running
        </text>
        <text x={x + w - 12} y={y + 82} {...mono} fill={C.muted} textAnchor="end">
          :3000
        </text>
      </g>
    </g>
  );
}

// ── Glyph tiles (sources without a mark of their own) ───────────────────────
function Doc() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" transform="translate(-5.5 -7)">
      <path d="M1 1h6.5L11 4.5V13H1z" />
      <path d="M7.5 1v3.5H11M3.5 7.5h5M3.5 10h5" strokeLinecap="round" />
    </g>
  );
}
/** A changelog: a little timeline of releases. */
function Changelog() {
  return (
    <g stroke={C.ink} strokeWidth={1.2} strokeLinecap="round" fill="none">
      <path d="M-4.5 -6v12" strokeOpacity={0.45} />
      {[-4.5, 0, 4.5].map((y) => (
        <g key={y}>
          <circle cx={-4.5} cy={y} r={1.6} fill={C.card} />
          <path d={`M-1 ${y}h${y === 0 ? 5 : 6.5}`} />
        </g>
      ))}
    </g>
  );
}
function Globe() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.1}>
      <circle r={6.5} />
      <ellipse rx={2.8} ry={6.5} />
      <path d="M-6.5 0h13" />
    </g>
  );
}
/** A plain two-letter monogram for tools without a mark in the set. */
function Monogram({ text }: { text: string }) {
  return (
    <text y={3.6} textAnchor="middle" fontSize={10} fontWeight={600} letterSpacing="-0.02em" fill={C.ink}>
      {text}
    </text>
  );
}

const intelligence: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default intelligence;
