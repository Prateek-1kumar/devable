import { C, Card, Mono, PanelSvg, Spinner, Tick, clamp01, easeInOut, easeOut, lerp, ramp, usePanelId } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 03 Content Engine. A production checklist beside the article it is producing.
// The brief lays out a ghost of the article; research pins its sources; the
// draft writes in (title, byline, prose, a real code example); a technical
// review sweeps down the page verifying sources and testing the code; then it
// publishes, glides away, and the next article starts. The engine never stops.

const STAGES = [
  { label: "Brief", at: 0.6 },
  { label: "Product research", at: 2.2 },
  { label: "Draft", at: 3.8 },
  { label: "Technical review", at: 7.0 },
  { label: "Optimize and publish", at: 10.4 },
];
const REVIEW = 3;
const PUBLISHED = 11.8;
const EXIT = 13.2;
const DURATION = 14;
const stageEnd = (i: number) => STAGES[i + 1]?.at ?? PUBLISHED;

// ── Production card ─────────────────────────────────────────────────────────
const LIST = { x: 16, y: 82, w: 186, h: 232, first: 62, pitch: 36 };
const CAPTION_H = 26;

// ── Draft card ──────────────────────────────────────────────────────────────
const DOC = { x: 218, y: 54, w: 246, h: 292 };
const X0 = DOC.x + 20;
const IW = DOC.w - 40;
type Bar = { x: number; y: number; w: number; h: number; fill: string };
const ink = (o: number) => `color-mix(in srgb, var(--ink) ${o}%, transparent)`;
const TITLE1: Bar = { x: X0, y: DOC.y + 46, w: 176, h: 9, fill: C.ink };
const PARA1 = [206, 192, 138].map((w, i): Bar => ({ x: X0, y: DOC.y + 98 + i * 11, w, h: 4.5, fill: ink(18) }));
const PARA2 = [200, 150].map((w, i): Bar => ({ x: X0, y: DOC.y + 256 + i * 11, w, h: 4.5, fill: ink(18) }));
const CODE = { y: DOC.y + 160, h: 58 };
// A small code example as syntax-coloured tokens: [indent, width, colour] runs.
const KW = "color-mix(in srgb, var(--accent) 75%, transparent)";
const STR = "color-mix(in srgb, color-mix(in srgb, var(--primary) 55%, var(--ink)) 70%, transparent)";
const TOKENS: [number, string][][] = [
  [[20, KW], [38, ink(55)], [16, "var(--sage)"]],
  [[30, ink(55)], [52, STR]],
  [[24, KW], [34, ink(55)], [22, "var(--sage)"]],
  [[44, ink(55)]],
];
const CODE_BARS = TOKENS.map((line, i): Bar[] => {
  let x = X0 + 24 + (i === 1 || i === 2 ? 10 : 0);
  return line.map(([w, fill]) => {
    const bar = { x, y: CODE.y + 12 + i * 11, w, h: 4.5, fill };
    x += w + 4;
    return bar;
  });
});
// Everything the draft writes, in writing order.
const WRITTEN: Bar[] = [
  { x: X0, y: DOC.y + 60, w: 112, h: 9, fill: C.ink },
  { x: X0 + 16, y: DOC.y + 78, w: 44, h: 4, fill: ink(35) },
  ...PARA1,
  ...CODE_BARS.flat(),
  ...PARA2,
];
const WRITE = { at: STAGES[2].at + 0.1, each: 2.9 / WRITTEN.length };
/** Sources pinned in research, at the ends of the paragraphs they back. */
const SOURCES = [PARA1[2], PARA2[1]].map((b) => [b.x + b.w + 7, b.y + 2.2] as const);
const PILLS = [
  { label: "Sources verified", y: DOC.y + 132, after: DOC.y + 126 },
  { label: "Product tested hands-on", y: DOC.y + 226, after: CODE.y + CODE.h + 2 },
];

const WASH = "color-mix(in srgb, var(--light-green-soft) 75%, var(--card))";
const EDGE = "color-mix(in srgb, var(--primary) 40%, var(--line))";

function Panel({ t }: { t: number }) {
  const scanGrad = usePanelId("scan");
  const exit = ramp(t, EXIT, 0.7);
  const docO = ramp(t, 0, 0.6) * (1 - exit);
  const dy = (1 - ramp(t, 0, 0.6, easeOut)) * 8 - exit * 8;
  const ghost = ramp(t, 0.1, 0.5);
  const research = ramp(t, STAGES[1].at + 0.3, 0.5);
  const review = STAGES[REVIEW];
  const caption = Math.min(ramp(t, review.at, 0.5), 1 - ramp(t, stageEnd(REVIEW), 0.5));
  const scanY = lerp(DOC.y + 90, DOC.y + 282, easeInOut(clamp01((t - review.at - 0.2) / 2.8)));
  const scanO = Math.min(ramp(t, review.at, 0.3), 1 - ramp(t, stageEnd(REVIEW) - 0.4, 0.3));
  const passed = (y: number) => (t > review.at ? clamp01((scanY - y) / 14) : 0);
  const pub = ramp(t, stageEnd(REVIEW) + 0.4, 0.5);

  return (
    <PanelSvg t={t}>
      <defs>
        <linearGradient id={scanGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.09" />
        </linearGradient>
      </defs>

      {/* Production: a rail fills green as each step completes. */}
      <Card x={LIST.x} y={LIST.y} w={LIST.w} h={LIST.h + caption * CAPTION_H} r={14} />
      <Mono x={LIST.x + 18} y={LIST.y + 30} size={8.5} letterSpacing="0.2em" fill={C.muted}>
        Production
      </Mono>
      {STAGES.map((s, i) => {
        const y = LIST.y + LIST.first + i * LIST.pitch + (i > REVIEW ? caption * CAPTION_H : 0);
        const cx = LIST.x + 24;
        const done = ramp(t, stageEnd(i), 0.4) * (1 - exit);
        const active = Math.min(ramp(t, s.at, 0.3), 1 - ramp(t, stageEnd(i), 0.3));
        const next = LIST.y + LIST.first + (i + 1) * LIST.pitch + (i + 1 > REVIEW ? caption * CAPTION_H : 0);
        return (
          <g key={s.label}>
            {i < STAGES.length - 1 && (
              <>
                <line x1={cx} x2={cx} y1={y + 10} y2={next - 10} stroke={C.line} strokeWidth={1.2} strokeLinecap="round" />
                <line x1={cx} x2={cx} y1={y + 10} y2={lerp(y + 10, next - 10, done)} stroke={EDGE} strokeWidth={1.2} strokeLinecap="round" opacity={done > 0 ? 1 : 0} />
              </>
            )}
            <circle cx={cx} cy={y} r={6} fill={C.card} stroke={C.line} strokeWidth={1.2} opacity={1 - Math.max(done, active)} />
            <Spinner x={cx} y={y} t={t} opacity={active} />
            <Tick x={cx} y={y} k={done} />
            <text
              x={LIST.x + 40}
              y={y + 4}
              fontSize={11.5}
              fontWeight={active > 0.5 ? 600 : 500}
              fill={C.ink}
              opacity={0.42 + 0.58 * Math.max(done, active)}
            >
              {s.label}
            </text>
            {i === REVIEW && caption > 0 && (
              <text x={LIST.x + 40} y={y + 19} fontSize={9.5} fill={C.accent} opacity={caption}>
                <tspan x={LIST.x + 40}>Reviewing technical</tspan>
                <tspan x={LIST.x + 40} dy={12}>
                  accuracy
                </tspan>
              </text>
            )}
          </g>
        );
      })}

      {/* Draft: the article in production. */}
      <Card x={DOC.x} y={DOC.y} w={DOC.w} h={DOC.h} r={14} />
      <rect x={DOC.x} y={DOC.y} width={DOC.w} height={DOC.h} rx={14} fill="none" stroke={EDGE} opacity={pub * (1 - exit)} />
      <g opacity={docO} transform={`translate(0 ${dy})`}>
        <Mono x={X0} y={DOC.y + 28} size={8.5} letterSpacing="0.2em" fill={C.muted} opacity={1 - pub}>
          Draft
        </Mono>
        <g opacity={pub}>
          <circle cx={X0 + 3} cy={DOC.y + 25} r={3} fill={C.green} />
          <Mono x={X0 + 12} y={DOC.y + 28} size={8.5} letterSpacing="0.2em" fill={C.green}>
            Published
          </Mono>
        </g>

        {/* The brief: a ghost of the whole article, its headline already set. */}
        <g opacity={ghost * 0.5}>
          {[TITLE1, ...WRITTEN].map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.h / 2} fill={C.line} />
          ))}
          <circle cx={X0 + 5} cy={DOC.y + 80} r={5} fill={C.line} />
        </g>
        <BarK bar={TITLE1} k={ramp(t, STAGES[0].at + 0.3, 0.9)} />
        <circle cx={X0 + 5} cy={DOC.y + 80} r={5} fill="var(--sage)" opacity={0.6 * ramp(t, WRITE.at + WRITE.each, 0.3)} />

        {/* The code example's frame; it turns green once tested. */}
        <rect x={X0} y={CODE.y} width={IW} height={CODE.h} rx={8} fill={C.paper} opacity={ghost} />
        <rect x={X0} y={CODE.y} width={IW} height={CODE.h} rx={8} fill="none" stroke={EDGE} opacity={passed(PILLS[1].after)} />
        {TOKENS.map((_, i) => (
          <Mono key={i} x={X0 + 10} y={CODE.y + 16.5 + i * 11} size={7} letterSpacing="0" fill={C.muted} opacity={ghost * 0.7}>
            {i + 1}
          </Mono>
        ))}

        {/* The draft writes in, bar by bar, behind a coral caret. */}
        {WRITTEN.map((b, i) => (
          <BarK key={i} bar={b} k={ramp(t, WRITE.at + i * WRITE.each, WRITE.each, (x) => x)} />
        ))}
        {(() => {
          const i = Math.floor((t - WRITE.at) / WRITE.each);
          if (i < 0 || i >= WRITTEN.length) return null;
          const b = WRITTEN[i];
          const k = (t - WRITE.at - i * WRITE.each) / WRITE.each;
          return <rect x={b.x + b.w * k + 1.5} y={b.y - 2} width={1.5} height={b.h + 4} rx={0.75} fill={C.accent} />;
        })()}

        {/* Research pins sources; review turns them green. */}
        {SOURCES.map(([x, y], i) => {
          const v = passed(y);
          return (
            <g key={i} opacity={research} transform={`translate(${x} ${y})`}>
              <circle r={4.5} fill={v > 0.5 ? WASH : C.accentWash} />
              <circle r={2} fill={v > 0.5 ? C.green : C.accent} />
            </g>
          );
        })}

        {/* Verification stamps land as the review passes what they vouch for. */}
        {PILLS.map((p) => (
          <Pill key={p.label} x={X0} y={p.y} label={p.label} k={passed(p.after)} />
        ))}

        {/* The technical review: a soft coral sweep down the page. */}
        {scanO > 0 && (
          <g opacity={scanO}>
            <rect x={DOC.x + 1} y={scanY - 22} width={DOC.w - 2} height={22} fill={`url(#${scanGrad})`} />
            <line x1={DOC.x + 1} x2={DOC.x + DOC.w - 1} y1={scanY} y2={scanY} stroke={C.accent} strokeOpacity={0.45} />
          </g>
        )}
      </g>
    </PanelSvg>
  );
}

/** A text bar drawn in from the left as k goes 0 → 1. */
function BarK({ bar, k }: { bar: Bar; k: number }) {
  if (k <= 0) return null;
  return <rect x={bar.x} y={bar.y} width={Math.max(bar.h, bar.w * k)} height={bar.h} rx={bar.h / 2} fill={bar.fill} />;
}

/** A pale green verification stamp that settles in as k goes 0 → 1. */
function Pill({ x, y, label, k }: { x: number; y: number; label: string; k: number }) {
  if (k <= 0) return null;
  const w = Math.round(label.length * 9.5 * 0.55 + 30);
  const s = 0.94 + 0.06 * easeOut(k);
  return (
    <g transform={`translate(${x} ${y + 9}) scale(${s}) translate(0 -9)`} opacity={k}>
      <rect width={w} height={18} rx={9} fill={WASH} stroke={EDGE} />
      <path d="M9 9.2 L11.2 11.4 L15.2 7" fill="none" stroke={C.green} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <text x={21} y={12.4} fontSize={9.5} fontWeight={500} fill={C.ink}>
        {label}
      </text>
    </g>
  );
}

// The still frame (reduced motion): mid-review, sources verified, code being checked.
const content: PanelModule = { duration: DURATION, settle: 9.2, Panel };
export default content;
