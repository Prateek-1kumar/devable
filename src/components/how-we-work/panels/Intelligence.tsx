import type { ReactNode } from "react";
import { Beacon, C, Card, Mark, Mono, PanelSvg, Spinner, Tick, clamp01, easeInOut, ramp, usePanelId } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 01 Product Intelligence. Four groups of sources feed one "Your product" card.
// The research never finishes: one group at a time goes live. Its chips are read
// in turn (a pale green wash fills each), signal drifts down its wire into the
// card, and the finding it informs re-opens and checks off again. Four equal
// beats, so the loop wraps with no seam.

const BEAT = 4;

// ── Sources ─────────────────────────────────────────────────────────────────
// `row` is the finding each group informs.
type Src = { label: string; icon: ReactNode };
const GROUPS: { label: string; items: Src[]; row: number }[] = [
  {
    label: "Product",
    row: 0,
    items: [
      { label: "Docs", icon: <Doc /> },
      { label: "Website", icon: <Globe /> },
      { label: "GitHub", icon: <Mark name="github" x={0} y={0} size={11} /> },
    ],
  },
  {
    label: "Market",
    row: 2,
    items: [
      { label: "Competitors", icon: <Compare /> },
      { label: "Reviews", icon: <Mark name="g2" x={0} y={0} size={11} /> },
    ],
  },
  {
    label: "Community",
    row: 1,
    items: [
      { label: "Reddit", icon: <Mark name="reddit" x={0} y={0} size={11} /> },
      { label: "Hacker News", icon: <Mark name="hackernews" x={0} y={0} size={11} /> },
    ],
  },
  {
    label: "Search & AI",
    row: 3,
    items: [
      { label: "Google", icon: <Mark name="google" x={0} y={0} size={11} /> },
      { label: "ChatGPT", icon: <Mark name="chatgpt" x={0} y={0} size={11} /> },
    ],
  },
];
const DURATION = GROUPS.length * BEAT;

const COL = { x: 12, y: 78, pitch: 74 };
const CHIP = { h: 26, gap: 5, size: 10.5, icon: 22 };
// ponytail: width from character count; swap for measured text if the font changes.
const chipW = (s: string) => Math.round(s.length * CHIP.size * 0.56 + CHIP.icon + 9);
const chipX = (items: Src[], i: number) => COL.x + items.slice(0, i).reduce((x, s) => x + chipW(s.label) + CHIP.gap, 0);
const chipY = (g: number) => COL.y + g * COL.pitch;
/** Where group g's wire leaves its row. */
const outlet = (g: number): [number, number] => [chipX(GROUPS[g].items, GROUPS[g].items.length) + 4, chipY(g) + CHIP.h / 2];

// ── Your product card ───────────────────────────────────────────────────────
const CARD = { x: 264, y: 96, w: 202, h: 212 };
const PAD = 16;
const STATUS_Y = CARD.y + 60;
const ROWS_Y = CARD.y + 80;
const PITCH = 32;
const FINDINGS = ["Priority use cases", "Buyer and user groups", "Competitive position", "Visibility gaps"];

const WIRE = "color-mix(in srgb, var(--sage) 60%, transparent)";
/** A chip's "read" wash and its edge. */
const READ = "color-mix(in srgb, var(--light-green-soft) 75%, var(--card))";
const READ_EDGE = "color-mix(in srgb, var(--primary) 40%, var(--line))";

/** Every wire converges on one inlet at the card's left edge. */
const INLET: [number, number] = [CARD.x, CARD.y + CARD.h / 2 + 6];
const curve = (g: number) => {
  const [sx, sy] = outlet(g);
  const [ex, ey] = INLET;
  const m = (ex - sx) * 0.62;
  return `M${sx} ${sy} C${sx + m} ${sy} ${ex - m} ${ey} ${ex} ${ey}`;
};
/** The point u (0..1) along group g's wire. */
const at = (g: number, u: number) => {
  const [sx, sy] = outlet(g);
  const [ex, ey] = INLET;
  const m = (ex - sx) * 0.62;
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  return [a * sx + b * (sx + m) + c * (ex - m) + d * ex, a * sy + b * sy + c * ey + d * ey];
};

/** Seconds into group g's beat (negative before it, past BEAT after). */
const localT = (t: number, g: number) => (t % DURATION) - g * BEAT;
/** How live group g is: eases in at its beat's start, out at its end. */
const live = (t: number, g: number) => {
  const local = localT(t, g);
  return Math.min(ramp(local, 0, 0.5), 1 - ramp(local, BEAT - 0.7, 0.5));
};

// While a group is live, a pulse leaves its outlet every PULSE seconds, drifts
// to the card over the first TRAVEL of that, then the inlet ripples.
const PULSE = 2;
const TRAVEL = 0.65;
const TRAIL = 7;

function Panel({ t }: { t: number }) {
  const breathe = 0.5 + 0.5 * Math.sin(t * 2);
  const clip = usePanelId("chip");
  const g0 = Math.floor((t % DURATION) / BEAT);
  const p = (((localT(t, g0) - 0.3) % PULSE) + PULSE) % PULSE / PULSE;
  const head = easeInOut(clamp01(p / TRAVEL));
  const ripple = clamp01((p - TRAVEL) / (1 - TRAVEL));

  return (
    <PanelSvg t={t}>
      {/* Wires: dashed sage at rest; the live one drifts coral and carries a soft pulse. */}
      {GROUPS.map((_, g) => {
        const a = live(t, g);
        const d = curve(g);
        const [ox, oy] = outlet(g);
        return (
          <g key={g}>
            <path d={d} fill="none" stroke={WIRE} strokeWidth={1.1} strokeDasharray="2 3" opacity={1 - a * 0.7} />
            {a > 0 && (
              <g opacity={a}>
                <path d={d} fill="none" stroke={C.accentLine} strokeWidth={1.2} strokeDasharray="2 3" strokeDashoffset={-t * 5} />
                {g === g0 && p < TRAVEL &&
                  Array.from({ length: TRAIL }, (_, i) => {
                    const [x, y] = at(g, clamp01(head - i * 0.022));
                    const k = 1 - i / TRAIL;
                    return <circle key={i} cx={x} cy={y} r={i ? 2 * k : 2.4} fill={C.accent} opacity={i ? 0.45 * k * k : 1} />;
                  })}
              </g>
            )}
            <circle cx={ox} cy={oy} r={2.6} fill={a > 0.5 ? C.accent : C.card} stroke={a > 0.5 ? C.accent : WIRE} strokeWidth={1.1} />
          </g>
        );
      })}

      {/* Source groups: the live group's chips are read one after another, each
          filling with a pale green wash that holds until the beat ends. */}
      {GROUPS.map((grp, g) => {
        const local = localT(t, g);
        const a = live(t, g);
        const hold = 1 - ramp(local, BEAT - 0.7, 0.5);
        const y = chipY(g);
        const span = (BEAT - 1.2) / grp.items.length;
        return (
          <g key={grp.label}>
            <circle cx={COL.x - 4 + a * 9} cy={y - 12} r={2.4} fill={C.accent} opacity={a * (0.55 + 0.45 * breathe)} />
            <Mono x={COL.x + 1 + a * 9} y={y - 9} size={8.5} letterSpacing="0.16em" fill={C.ink} opacity={0.55 + 0.45 * a}>
              {grp.label}
            </Mono>
            {grp.items.map((it, i) => {
              const read = local >= 0 && local < BEAT ? easeInOut(clamp01((local - 0.3 - i * span) / span)) : 0;
              const x = chipX(grp.items, i);
              const w = chipW(it.label);
              const id = `${clip}-${g}-${i}`;
              return (
                <g key={it.label} transform={`translate(${x} ${y})`}>
                  <clipPath id={id}>
                    <rect width={w} height={CHIP.h} rx={7} />
                  </clipPath>
                  <rect width={w} height={CHIP.h} rx={7} fill={C.card} />
                  {read > 0 && (
                    <g clipPath={`url(#${id})`} opacity={hold}>
                      <rect width={w * read} height={CHIP.h} fill={READ} />
                      {read < 1 && <rect x={w * read - 1} width={1} height={CHIP.h} fill={READ_EDGE} />}
                    </g>
                  )}
                  <rect width={w} height={CHIP.h} rx={7} fill="none" stroke={C.line} />
                  {read > 0 && <rect width={w} height={CHIP.h} rx={7} fill="none" stroke={READ_EDGE} opacity={hold * clamp01(read * 3)} />}
                  <g transform={`translate(${CHIP.icon / 2 + 2} ${CHIP.h / 2})`}>{it.icon}</g>
                  <text x={CHIP.icon + 1} y={CHIP.h / 2 + 3.7} fontSize={CHIP.size} fill={C.ink}>
                    {it.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Your product: a live status, then findings that re-open as new signal arrives. */}
      <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={14} />
      <Mono x={CARD.x + PAD} y={CARD.y + 30} size={8.5} letterSpacing="0.2em" fill={C.muted}>
        Your product
      </Mono>
      <Beacon x={CARD.x + PAD + 6} y={STATUS_Y - 4} t={t} />
      <text x={CARD.x + PAD + 19} y={STATUS_Y} fontSize={11.5} fontWeight={600} fill={C.ink}>
        Reviewing product + market
      </text>
      <line x1={CARD.x + PAD} x2={CARD.x + CARD.w - PAD} y1={ROWS_Y} y2={ROWS_Y} stroke={C.hair} />

      {/* Inlet, over the card edge: ripples each time a pulse lands. */}
      {ripple > 0 && <circle cx={INLET[0]} cy={INLET[1]} r={3 + ripple * 9} fill="none" stroke={C.accent} strokeWidth={1} opacity={(1 - ripple) * 0.5} />}
      <circle cx={INLET[0]} cy={INLET[1]} r={3} fill={C.card} stroke={C.accent} strokeOpacity={0.6} strokeWidth={1.2} />

      {FINDINGS.map((label, r) => {
        const a = live(t, GROUPS.findIndex((grp) => grp.row === r));
        const y = ROWS_Y + PITCH / 2 + r * PITCH;
        return (
          <g key={label}>
            <Tick x={CARD.x + PAD + 6} y={y} k={1 - a} />
            <Spinner x={CARD.x + PAD + 6} y={y} t={t} opacity={a} />
            <text x={CARD.x + PAD + 19} y={y + 4} fontSize={11.5} fontWeight={500} fill={`color-mix(in srgb, var(--muted) ${Math.round(a * 100)}%, var(--ink))`}>
              {label}
            </text>
            {r < FINDINGS.length - 1 && (
              <line x1={CARD.x + PAD} x2={CARD.x + CARD.w - PAD} y1={y + PITCH / 2} y2={y + PITCH / 2} stroke={C.hair} />
            )}
          </g>
        );
      })}
    </PanelSvg>
  );
}

// ── Glyphs (centred on 0,0, about 11 units) ─────────────────────────────────
function Doc() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" transform="scale(0.85) translate(-6 -7)">
      <path d="M1 1h6.5L11 4.5V13H1z" />
      <path d="M7.5 1v3.5H11M3.5 7.5h5M3.5 10h5" strokeLinecap="round" />
    </g>
  );
}
function Globe() {
  return (
    <g fill="none" stroke={C.ink} strokeWidth={1.1} transform="scale(0.82)">
      <circle r={6.5} />
      <ellipse rx={2.8} ry={6.5} />
      <path d="M-6.5 0h13" />
    </g>
  );
}
/** Two overlapping tiles: one product sized up against another. */
function Compare() {
  return (
    <g fill="none" strokeWidth={1.2} strokeLinejoin="round">
      <rect x={-5.5} y={-5.5} width={7} height={7} rx={1.6} stroke={C.ink} />
      <rect x={-1.5} y={-1.5} width={7} height={7} rx={1.6} stroke={C.accent} fill={C.card} />
    </g>
  );
}

// The still frame (reduced motion): Search & AI live, visibility gaps in progress.
const intelligence: PanelModule = { duration: DURATION, settle: 3 * BEAT + BEAT / 2, Panel };
export default intelligence;
