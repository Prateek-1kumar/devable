import type { ReactNode } from "react";
import { C, Card, Check, Mark, Mono, PanelSvg, Pulse, Trace, clamp01, easeInOut, easeOut, lerp, outro, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 04 Distribution Engine. One article in the middle; four places around it
// pick it up one at a time. A pulse leaves the article along a thin line, the
// channel lights (coral while it happens: the rank climbs, the citation lands,
// upvotes and likes tick), then settles deep green. The counter under the
// article ticks "Live in 1/4 … 4/4 channels".

const DURATION = 9.5;
const SETTLE = 7.8;

type Pt = readonly [number, number];

const ART = { x: 160, y: 150, w: 160, h: 100 };
const CARD = { w: 160, h: 56 };
/** Inner padding of every card. */
const P = 11;

/** When channel i starts: its pulse leaves the article, arrives TRAVEL s later. */
const sendAt = (i: number) => 1.3 + i * 1.3;
const TRAVEL = 0.5;
const litAt = (i: number) => sendAt(i) + TRAVEL;
/** How long a channel works (coral) before it settles to green. */
const WORK = 0.85;
const doneAt = (i: number) => litAt(i) + WORK;
const ALL_LIVE = doneAt(3) + 0.2;

/** Blend two colours: k = 0 gives `a`, k = 1 gives `b`. */
const mix = (a: string, b: string, k: number) => `color-mix(in srgb, ${b} ${Math.round(clamp01(k) * 100)}%, ${a})`;

/** One channel's timeline. */
function phase(t: number, i: number) {
  const done = ramp(t, doneAt(i), 0.35);
  return {
    lit: ramp(t, litAt(i) - 0.1, 0.4, easeOut),
    /** The waiting label leaves before the fact arrives, so they never overlap. */
    waiting: 1 - ramp(t, litAt(i) - 0.2, 0.2),
    fact: ramp(t, litAt(i) + 0.02, 0.35, easeOut),
    work: ramp(t, litAt(i), WORK, easeInOut),
    active: ramp(t, litAt(i) - 0.15, 0.3) * (1 - done),
    done,
  };
}

type Channel = { x: number; y: number; route: Pt[] };
const LEFT = 40;
const RIGHT = 480 - 40 - CARD.w;
const TOP = 62;
const BOTTOM = 400 - 62 - CARD.h;
const MID = ART.y + ART.h / 2;
/** Each side forks out of the article's edge: a short run outwards, then up or down into the card. */
const SPINE_L = LEFT + 76;
const SPINE_R = RIGHT + CARD.w - 76;
const CHANNELS: Channel[] = [
  { x: LEFT, y: TOP, route: [[ART.x, MID], [SPINE_L, MID], [SPINE_L, TOP + CARD.h]] },
  { x: RIGHT, y: TOP, route: [[ART.x + ART.w, MID], [SPINE_R, MID], [SPINE_R, TOP + CARD.h]] },
  { x: LEFT, y: BOTTOM, route: [[ART.x, MID], [SPINE_L, MID], [SPINE_L, BOTTOM]] },
  { x: RIGHT, y: BOTTOM, route: [[ART.x + ART.w, MID], [SPINE_R, MID], [SPINE_R, BOTTOM]] },
];

/** A polyline path with softly rounded corners. */
function rounded(pts: readonly Pt[], r = 8) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const a = Math.hypot(x - px, y - py);
    const b = Math.hypot(nx - x, ny - y);
    const ra = Math.min(r, a / 2, b / 2);
    d += ` L${x - ((x - px) / a) * ra} ${y - ((y - py) / a) * ra} Q${x} ${y} ${x + ((nx - x) / b) * ra} ${y + ((ny - y) / b) * ra}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return `${d} L${lx} ${ly}`;
}

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const artIn = ramp(t, 0.1, 0.5, easeOut);
  const live = [0, 1, 2, 3].filter((i) => t >= doneAt(i) + 0.15).length;
  const distributing = ramp(t, sendAt(0), 0.3) * (1 - ramp(t, ALL_LIVE, 0.3));
  const allLive = ramp(t, ALL_LIVE, 0.4);

  return (
    <PanelSvg t={t}>
      <g opacity={o}>
        {/* Connectors: a quiet grey line, coral while its pulse travels and the channel works, soft green once live. */}
        {CHANNELS.map(({ route }, i) => {
          const d = rounded(route);
          const { done } = phase(t, i);
          const send = ramp(t, sendAt(i), TRAVEL, easeInOut);
          return (
            <g key={`c${i}`}>
              <path d={d} fill="none" stroke={C.ink} strokeOpacity={0.12 * artIn} />
              <Trace d={d} k={send} stroke={mix(C.accent, C.lightGreen, done)} opacity={lerp(0.85, 0.45, done)} />
              <Pulse points={route} k={t < sendAt(i) ? -1 : t > litAt(i) ? 2 : send} r={2.6} />
            </g>
          );
        })}

        {/* The article. */}
        <g opacity={artIn} transform={`translate(0 ${(1 - artIn) * 5})`}>
          <Card x={ART.x} y={ART.y} w={ART.w} h={ART.h} />
          <DocGlyph x={ART.x + 14} y={ART.y + 13} />
          <Mono x={ART.x + 30} y={ART.y + 22.5} size={9}>
            Article
          </Mono>
          <Mono x={ART.x + ART.w - 14} y={ART.y + 22.5} size={9} fill={C.lightGreen} textAnchor="end">
            Published
          </Mono>
          <text x={ART.x + 14} y={ART.y + 46} fontSize={13.5} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
            Deploy previews
          </text>
          <text x={ART.x + 14} y={ART.y + 63} fontSize={13.5} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
            on every PR
          </text>
          <line x1={ART.x + 14} x2={ART.x + ART.w - 14} y1={ART.y + 75} y2={ART.y + 75} stroke={C.hair} />
          {/* The counter. */}
          <circle cx={ART.x + 17} cy={ART.y + 87.5} r={3} fill={mix(mix(C.line, C.accent, distributing), C.lightGreen, allLive)} />
          <Mono x={ART.x + 27} y={ART.y + 91} size={9} letterSpacing="0.05em" fill={mix(C.ink, C.lightGreen, allLive)}>
            {`Live in ${live}/4 channels`}
          </Mono>
        </g>

        <Google t={t} />
        <ChatGPT t={t} />
        <Reddit t={t} />
        <XPost t={t} />
      </g>
    </PanelSvg>
  );
}

/** A small document glyph for the article's label row. */
function DocGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={C.muted} strokeWidth={1} strokeLinejoin="round">
      <path d="M1 0.5 H7 L10 3.5 V11.5 H1 Z" />
      <path d="M3 6 H8 M3 8.5 H7" strokeLinecap="round" />
    </g>
  );
}

// ── Channel cards ───────────────────────────────────────────────────────────

/**
 * A channel card: logo tile, one line, one small detail. Enters dim with its
 * name; when the pulse arrives it lights, washes coral while the work happens,
 * then shows a deep green check.
 */
function Surface({
  i,
  t,
  mark,
  name,
  line,
  detail,
  right,
}: {
  i: number;
  t: number;
  mark: ReactNode;
  name: string;
  line: ReactNode;
  detail: ReactNode;
  right?: ReactNode;
}) {
  const { x, y } = CHANNELS[i];
  const enter = ramp(t, 0.45 + i * 0.08, 0.45, easeOut);
  const { lit, waiting, fact, active, done } = phase(t, i);
  const tx = x + P + 26 + 9;
  return (
    <g opacity={enter * (0.5 + 0.5 * lit)} transform={`translate(0 ${(1 - enter) * 5})`}>
      <Card x={x} y={y} w={CARD.w} h={CARD.h} r={11} />
      <rect x={x} y={y} width={CARD.w} height={CARD.h} rx={11} fill={C.accentWash} stroke={C.accentLine} opacity={active} />
      <rect x={x + P} y={y + 15} width={26} height={26} rx={7} fill={C.paper} stroke={C.line} />
      <g transform={`translate(${x + P + 13} ${y + 28})`}>{mark}</g>
      {/* Before: the channel's name, waiting. After: its one fact. */}
      <g opacity={waiting}>
        <text x={tx} y={y + 25} fontSize={12} fontWeight={550} fill={C.muted}>
          {name}
        </text>
        <Mono x={tx} y={y + 41} size={9} fill={C.muted}>
          Waiting
        </Mono>
      </g>
      <g opacity={fact} transform={`translate(0 ${(1 - fact) * 4})`}>
        <g transform={`translate(${tx} ${y + 25})`}>{line}</g>
        <g transform={`translate(${tx} ${y + 41})`}>{detail}</g>
        {right ? <g transform={`translate(${x + CARD.w - P} ${y + 41})`}>{right}</g> : null}
      </g>
      {/* Status: hollow, coral while working, a green check once live. */}
      <circle cx={x + CARD.w - P - 3} cy={y + 20} r={3} fill="none" stroke={C.ink} strokeOpacity={0.22 * (1 - Math.max(active, done))} />
      <circle cx={x + CARD.w - P - 3} cy={y + 20} r={3} fill={C.accent} opacity={active} />
      <g opacity={done}>
        <Check x={x + CARD.w - P - 3} y={y + 20} r={5.5} k={done} />
      </g>
    </g>
  );
}

/** The card's one line. */
function Line({ children, fill = C.ink }: { children: ReactNode; fill?: string }) {
  return (
    <text fontSize={12} fontWeight={600} letterSpacing="-0.005em" fill={fill}>
      {children}
    </text>
  );
}

/** The card's small detail, lowercase mono. */
function Detail({ children, anchor, fill = C.muted }: { children: ReactNode; anchor?: "end"; fill?: string }) {
  return (
    <text fontFamily="var(--font-mono)" fontSize={9.5} letterSpacing="0" fill={fill} textAnchor={anchor}>
      {children}
    </text>
  );
}

/** 1 · Google: the article climbs to #2 for a real query. */
function Google({ t }: { t: number }) {
  const { work, active } = phase(t, 0);
  const rank = Math.round(lerp(7, 2, work));
  return (
    <Surface
      i={0}
      t={t}
      mark={<Mark name="google" x={0} y={0} size={14} />}
      name="Google"
      line={
        <Line>
          Ranks <tspan fill={mix(C.ink, C.accent, active)}>{`#${rank}`}</tspan>
        </Line>
      }
      detail={<Detail>“deploy previews”</Detail>}
    />
  );
}

/** 2 · ChatGPT: the answer cites the article as source [1]. */
function ChatGPT({ t }: { t: number }) {
  const { done } = phase(t, 1);
  const cite = ramp(t, litAt(1) + 0.3, 0.35, easeOut);
  return (
    <Surface
      i={1}
      t={t}
      mark={<Mark name="chatgpt" x={0} y={0} size={15} />}
      name="ChatGPT"
      line={
        <g>
          <Line>Cited</Line>
          <g opacity={cite} transform={`translate(38 ${-10 + (1 - cite) * 3})`}>
            <rect width={20} height={14} rx={4} fill={mix(C.accentWash, C.lightGreenSoft, done)} stroke={mix(C.accentLine, "transparent", done)} />
            <text x={10} y={10.5} fontFamily="var(--font-mono)" fontSize={9} textAnchor="middle" fill={mix(C.accent, C.lightGreen, done)}>
              1
            </text>
          </g>
        </g>
      }
      detail={<Detail>best preview tool?</Detail>}
    />
  );
}

/** 3 · Reddit: a r/devops thread recommends it; upvotes tick up. */
function Reddit({ t }: { t: number }) {
  const { work, active } = phase(t, 2);
  const votes = Math.round(lerp(14, 184, work));
  return (
    <Surface
      i={2}
      t={t}
      mark={<Mark name="reddit" x={0} y={0} size={15} />}
      name="Reddit"
      line={<Line>Recommended</Line>}
      detail={<Detail>r/devops</Detail>}
      right={<Count value={String(votes)} active={active} icon={<path d="M-3.5 -1.5 L0 -6 L3.5 -1.5 H1.5 V2 H-1.5 V-1.5 Z" fill="#FF4500" />} />}
    />
  );
}

/** 4 · X: a creator posts about it; likes climb. */
function XPost({ t }: { t: number }) {
  const { work, active } = phase(t, 3);
  const likes = lerp(80, 1400, work);
  const label = likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : String(Math.round(likes / 10) * 10);
  return (
    <Surface
      i={3}
      t={t}
      mark={<Mark name="x" x={0} y={0} size={13} color={C.ink} />}
      name="X"
      line={<Line>Creator post</Line>}
      detail={<Detail>@devopsdan</Detail>}
      right={
        <Count
          value={label}
          active={active}
          icon={<path d="M0 2.5 c-3.4 -2.4 -4.6 -4 -4.6 -5.6 a2.3 2.3 0 0 1 4.6 -0.8 a2.3 2.3 0 0 1 4.6 0.8 c0 1.6 -1.2 3.2 -4.6 5.6 z" fill="#f91880" />}
        />
      }
    />
  );
}

/** A right-aligned ticking count with a small icon before it: coral while it climbs, ink once settled. */
function Count({ value, active, icon }: { value: string; active: number; icon: ReactNode }) {
  const w = value.length * 6.1;
  return (
    <g>
      <g transform={`translate(${-w - 9} -3.2)`}>{icon}</g>
      <Detail anchor="end" fill={mix(C.ink, C.accent, active)}>
        {value}
      </Detail>
    </g>
  );
}

const distribution: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default distribution;
