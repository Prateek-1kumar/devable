import type { ReactNode } from "react";
import { STEPS } from "../content";
import { C, Card, Check, DATA, Lines, Mark, Mono, PanelSvg, Pulse, Trace, clamp01, easeInOut, easeOut, lerp, outro, polyline, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 04 Distribution Engine. Beginning: the article is published; five channels sit
// dim around it. Work: it fans out along its lines and each channel lights in
// turn: it climbs Google from #4 to #2, ChatGPT and Perplexity cite it, a Reddit
// thread gains upvotes, a creator video gains views, the launch post spreads.
// Result: all five channels live, with their final numbers.

const DURATION = 9;
const SETTLE = 8.3;

// Grid: three columns (164 · 160 · 164, 16px gutters) and two rows of tiles, 12px apart.
const COL = [20, 200, 376] as const;
const ROW = [100, 308] as const;
const TILE = { w: 164, h: 196 };
const ART = { x: 200, y: 100, w: 160, h: 144 };
/** Inner padding of every card. */
const P = 16;

type Pt = [number, number];
const J: Pt = [280, 276];
const TRUNK: Pt[] = [[280, ART.y + ART.h], J];
const ROUTES: Pt[][] = [
  [...TRUNK, [192, 276], [192, 250], [184, 250]], // Google
  [...TRUNK, [368, 276], [368, 250], [376, 250]], // AI answers
  [...TRUNK, [192, 276], [192, 340], [184, 340]], // Reddit
  [...TRUNK, [368, 276], [368, 340], [376, 340]], // YouTube
  [...TRUNK, [280, ROW[1]]], // X
];
/** When each channel lights; its pulse travels the line in the TRAVEL s before. */
const litAt = (i: number) => 1.7 + i * 1.0;
const TRAVEL = 0.5;
/** Each channel's work runs from lit + WORK_AT for WORK_FOR s, then settles to deep green. */
const WORK_AT = 0.15;
const WORK_FOR = 0.8;
const DONE_AT = 0.95;
const LIVE = litAt(4) + 1.1;

/** Blend two colours: k = 0 gives `a`, k = 1 gives `b`. Keeps colour changes smooth instead of snapping. */
const mix = (a: string, b: string, k: number) => `color-mix(in srgb, ${b} ${Math.round(clamp01(k) * 100)}%, ${a})`;

/** One channel's timeline: lit (dim → full), work progress, active (coral), done (deep green). */
function phase(t: number, i: number) {
  const at = litAt(i);
  const done = ramp(t, at + DONE_AT, 0.3);
  return {
    lit: ramp(t, at, 0.4, easeOut),
    work: ramp(t, at + WORK_AT, WORK_FOR, easeInOut),
    count: ramp(t, at + WORK_AT, WORK_FOR + 0.1, easeOut),
    active: ramp(t, at - 0.05, 0.3) * (1 - done),
    done,
  };
}

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const artIn = ramp(t, 0.1, 0.45, easeOut);
  const drafted = 1 - ramp(t, 0.5, 0.2);
  const published = ramp(t, 0.68, 0.3);
  const publishing = ramp(t, 0.55, 0.25) * (1 - ramp(t, 1.0, 0.4));
  const started = ramp(t, litAt(0) - TRAVEL, 0.25);
  // Status line: each label fades out before the next fades in, so they never overlap.
  const ready = 1 - ramp(t, litAt(0) - TRAVEL, 0.15);
  const distributing = ramp(t, litAt(0) - TRAVEL + 0.15, 0.2) * (1 - ramp(t, LIVE, 0.15));
  const channels = [0, 1, 2, 3, 4].filter((i) => t >= litAt(i)).length;
  const live = ramp(t, LIVE + 0.15, 0.3);

  return (
    <PanelSvg metrics={STEPS[3].metrics} t={t} metricsAt={[litAt(0), litAt(1)]} metricsFor={[LIVE - litAt(0), LIVE - litAt(1)]}>
      <g opacity={o}>
        {/* Lines first, so cards sit on top of them. */}
        {ROUTES.map((pts, i) => (
          <path key={`b${i}`} d={polyline(pts)} fill="none" stroke={C.ink} strokeOpacity={0.1 * artIn} strokeLinejoin="round" />
        ))}
        {ROUTES.map((pts, i) => {
          const at = litAt(i) - TRAVEL;
          return (
            <g key={`r${i}`}>
              <Trace d={polyline(pts)} k={ramp(t, at, TRAVEL, easeInOut)} stroke={C.primary} opacity={0.5} />
              <Pulse points={pts} k={t < at ? -1 : easeInOut(clamp01((t - at) / TRAVEL)) + (t > litAt(i) ? 2 : 0)} r={2.6} />
            </g>
          );
        })}
        {/* The fan-out node. */}
        <circle cx={J[0]} cy={J[1]} r={3.5} fill={mix(C.card, C.primary, started)} stroke={mix(C.line, C.primary, started)} opacity={artIn} />

        {/* The published article. */}
        <g opacity={artIn} transform={`translate(0 ${(1 - artIn) * 5})`}>
          <Card x={ART.x} y={ART.y} w={ART.w} h={ART.h} />
          <rect x={ART.x} y={ART.y} width={ART.w} height={ART.h} rx={12} fill={C.accentWash} stroke={C.accentLine} opacity={publishing} />
          <circle cx={ART.x + P + 5} cy={ART.y + 23} r={5} fill="none" stroke={C.line} strokeWidth={1} opacity={drafted} />
          <g opacity={published}>
            <Check x={ART.x + P + 5} y={ART.y + 23} r={5.5} k={published} />
          </g>
          <Mono x={ART.x + P + 17} y={ART.y + 26.5} size={9} fill={C.ink} opacity={drafted}>
            Draft
          </Mono>
          <Mono x={ART.x + P + 17} y={ART.y + 26.5} size={9} fill={C.ink} opacity={published}>
            Published
          </Mono>
          <Mono x={ART.x + ART.w - P} y={ART.y + 26.5} size={8.4} textAnchor="end">
            Blog
          </Mono>
          <text x={ART.x + P} y={ART.y + 58} fontSize={13} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
            Deploy previews
          </text>
          <text x={ART.x + P} y={ART.y + 75} fontSize={13} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
            on every PR
          </text>
          <Mono x={ART.x + P} y={ART.y + 94} size={8.4} fill={C.primary} style={{ textTransform: "none" }}>
            yourtool.dev/blog/…
          </Mono>
          <line x1={ART.x + P} x2={ART.x + ART.w - P} y1={ART.y + 110} y2={ART.y + 110} stroke={C.hair} />
          <circle cx={ART.x + P + 3} cy={ART.y + 127} r={3} fill={mix(mix(C.line, C.accent, started), C.primary, ramp(t, LIVE, 0.4))} />
          <Mono x={ART.x + P + 13} y={ART.y + 130} size={8.6} fill={C.muted} opacity={ready}>
            Ready to distribute
          </Mono>
          <Mono x={ART.x + P + 13} y={ART.y + 130} size={8.6} fill={C.ink} opacity={distributing}>
            {`Distributing ${Math.max(1, channels)}/5`}
          </Mono>
          <Mono x={ART.x + P + 13} y={ART.y + 130} size={8.6} fill={C.primary} opacity={live}>
            Live on 5 channels
          </Mono>
        </g>

        <Google t={t} />
        <Answers t={t} />
        <Reddit t={t} />
        <Video t={t} />
        <Social t={t} />
      </g>
    </PanelSvg>
  );
}

// ── Channel tiles ───────────────────────────────────────────────────────────

/** A channel tile: enters dim, lights when its pulse arrives, a quiet coral wash while working, a status dot that turns deep green. */
function Tile({ i, t, x, y, w = TILE.w, icon, title, meta, children }: { i: number; t: number; x: number; y: number; w?: number; icon: ReactNode; title: string; meta: ReactNode; children: ReactNode }) {
  const enter = ramp(t, 0.3 + i * 0.08, 0.45, easeOut);
  const { lit, active, done } = phase(t, i);
  return (
    <g opacity={enter * (0.42 + 0.58 * lit)} transform={`translate(0 ${(1 - enter) * 5})`}>
      <Card x={x} y={y} w={w} h={TILE.h} />
      <rect x={x} y={y} width={w} height={TILE.h} rx={12} fill={C.accentWash} stroke={C.accentLine} opacity={active} />
      <rect x={x + P} y={y + P} width={26} height={26} rx={7} fill={C.paper} stroke={C.line} />
      <g transform={`translate(${x + P + 13} ${y + P + 13})`}>{icon}</g>
      <text x={x + P + 36} y={y + P + 10} fontSize={11.5} fontWeight={550} fill={C.ink}>
        {title}
      </text>
      <g transform={`translate(${x + P + 36} ${y + P + 23})`}>{meta}</g>
      <circle cx={x + w - P - 3} cy={y + P + 6} r={3} fill="none" stroke={C.ink} strokeOpacity={0.25 * (1 - Math.max(active, done))} />
      <circle cx={x + w - P - 3} cy={y + P + 6} r={3} fill={mix(C.accent, C.primary, done)} opacity={Math.max(active, done)} />
      {children}
    </g>
  );
}

/** A tile's mono meta line, optionally cross-fading to a deep green "done" version. */
function Meta({ text, doneText, done = 0 }: { text: string; doneText?: string; done?: number }) {
  return (
    <>
      <Mono size={8.6} fill={C.muted} opacity={doneText ? 1 - done : 1}>
        {text}
      </Mono>
      {doneText ? (
        <Mono size={8.6} fill={C.primary} opacity={done}>
          {doneText}
        </Mono>
      ) : null}
    </>
  );
}

const SERP = ["vercel.com", "render.com", "netlify.com"];

/** 1 · Google: the article climbs from #4 to #2 for "deploy previews". */
function Google({ t }: { t: number }) {
  const [x, y, w] = [COL[0], ROW[0], TILE.w];
  const { work, active, done } = phase(t, 0);
  const p = lerp(3, 1, work); // our slot, 0-based
  const rowY = (slot: number) => y + 74 + slot * 31;
  return (
    <Tile i={0} t={t} x={x} y={y} icon={<Mark name="google" x={0} y={0} size={14} />} title="Google Search" meta={<Meta text="deploy previews" />}>
      {SERP.map((d, i) => {
        const slot = i + clamp01(i + 1 - p);
        const ry = rowY(slot);
        return (
          <g key={d}>
            <Mono x={x + P} y={ry + 3.5} size={8.6}>
              {String(Math.round(slot) + 1)}
            </Mono>
            <circle cx={x + P + 16} cy={ry} r={3} fill={C.line} />
            <text x={x + P + 25} y={ry + 4} fontSize={11} fill={C.muted}>
              {d}
            </text>
          </g>
        );
      })}
      {/* Your result: a coral wash while it climbs, a soft green row once it lands. */}
      <g transform={`translate(0 ${rowY(p) - rowY(0)})`}>
        <rect x={x + 10} y={rowY(0) - 12} width={w - 20} height={24} rx={6} fill={C.accentWash} stroke={C.accentLine} opacity={active} />
        <rect x={x + 10} y={rowY(0) - 12} width={w - 20} height={24} rx={6} fill={C.primarySoft} opacity={done} />
        <Mono x={x + P} y={rowY(0) + 3.5} size={8.6} fill={mix(mix(C.muted, C.accent, active), C.primary, done)}>
          {String(Math.round(p) + 1)}
        </Mono>
        <circle cx={x + P + 16} cy={rowY(0)} r={3} fill={mix(C.accent, C.primary, done)} />
        <text x={x + P + 25} y={rowY(0) + 4} fontSize={11} fontWeight={550} fill={C.ink}>
          yourtool.dev
        </text>
        <path
          d={`M${x + w - 24} ${rowY(0) + 4} V${rowY(0) - 4} M${x + w - 27.5} ${rowY(0) - 1} L${x + w - 24} ${rowY(0) - 4.5} L${x + w - 20.5} ${rowY(0) - 1}`}
          fill="none"
          stroke={C.accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={active}
        />
        <g opacity={done}>
          <Check x={x + w - 24} y={rowY(0)} r={5.5} k={done} />
        </g>
      </g>
    </Tile>
  );
}

/** 2 · AI answers: ChatGPT writes an answer citing the article; Perplexity lists it as a source. */
function Answers({ t }: { t: number }) {
  const [x, y, w] = [COL[2], ROW[0], TILE.w];
  const at = litAt(1);
  const { done } = phase(t, 1);
  const typed = ramp(t, at + WORK_AT, 0.45, (v) => v);
  const cite = ramp(t, at + 0.55, 0.35, easeOut);
  const pplx = ramp(t, at + 0.8, 0.35, easeOut);
  return (
    <Tile i={1} t={t} x={x} y={y} icon={<Mark name="chatgpt" x={0} y={0} size={15} />} title="AI answers" meta={<Meta text="Not cited yet" doneText="Cited · 2 engines" done={done} />}>
      <text x={x + P} y={y + 70} fontSize={11.5} fontWeight={550} fill={C.ink}>
        Best preview tool?
      </text>
      {/* ChatGPT's answer. */}
      <Mark name="chatgpt" x={x + P + 6} y={y + 92} size={12} />
      <Lines x={x + P + 20} y={y + 88} widths={[112, 92]} gap={10} k={typed} fill={C.line} />
      <g opacity={cite} transform={`translate(0 ${(1 - cite) * 4})`}>
        <Pill x={x + P + 20} y={y + 112} w={102} label="[1] yourtool.dev" done={done} />
      </g>
      <line x1={x + P} x2={x + w - P} y1={y + 148} y2={y + 148} stroke={C.hair} />
      {/* Perplexity's sources. */}
      <Mark name="perplexity" x={x + P + 6} y={y + 170} size={12} />
      <text x={x + P + 20} y={y + 174} fontSize={11} fontWeight={550} fill={C.ink}>
        Perplexity
      </text>
      <Mono x={x + w - P} y={y + 173.5} size={8.4} textAnchor="end" fill={C.muted} opacity={1 - pplx}>
        —
      </Mono>
      <Mono x={x + w - P} y={y + 173.5} size={8.4} textAnchor="end" fill={mix(C.accent, C.primary, done)} opacity={pplx}>
        Source 1
      </Mono>
    </Tile>
  );
}

/** A lowercase pill for URLs and citations: a coral wash while it is the live thing, soft green once confirmed. */
function Pill({ x, y, w, label, on = 1, done }: { x: number; y: number; w: number; label: string; on?: number; done: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={18} rx={9} fill={C.card} stroke={C.line} />
      <rect width={w} height={18} rx={9} fill={C.accentWash} stroke={C.accentLine} opacity={on * (1 - done)} />
      <rect width={w} height={18} rx={9} fill={C.primarySoft} opacity={done} />
      <text x={w / 2} y={12} fontFamily="var(--font-mono)" fontSize={8.4} letterSpacing="0.02em" fill={mix(mix(C.muted, C.accent, on), C.primary, done)} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

/** The big counter at the foot of a tile: coral while it climbs, ink once settled. */
function Count({ x, y, value, active }: { x: number; y: number; value: string; active: number }) {
  return (
    <text x={x} y={y} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={mix(C.ink, C.accent, active)}>
      {value}
    </text>
  );
}

/** 3 · Reddit: a r/devops thread where the top comment links the article; upvotes tick up. */
function Reddit({ t }: { t: number }) {
  const [x, y, w] = [COL[0], ROW[1], TILE.w];
  const { count, active, done, lit } = phase(t, 2);
  return (
    <Tile i={2} t={t} x={x} y={y} icon={<Mark name="reddit" x={0} y={0} size={15} />} title="r/devops" meta={<Meta text="Thread · 6h" />}>
      <text x={x + P} y={y + 70} fontSize={11} fontWeight={550} fill={C.ink}>
        What do you use for
      </text>
      <text x={x + P} y={y + 85} fontSize={11} fontWeight={550} fill={C.ink}>
        preview environments?
      </text>
      {/* Top comment, linking the article. */}
      <circle cx={x + P + 5} cy={y + 113} r={5} fill={DATA.teal} />
      <Pill x={x + P + 18} y={y + 104} w={108} label="yourtool.dev/blog" on={active} done={done} />
      <line x1={x + P} x2={x + w - P} y1={y + 140} y2={y + 140} stroke={C.hair} />
      {/* Votes and comments. */}
      <path
        d={`M${x + P} ${y + 170} L${x + P + 6} ${y + 162} L${x + P + 12} ${y + 170} H${x + P + 8.5} V${y + 175} H${x + P + 3.5} V${y + 170} Z`}
        fill="#FF4500"
        fillOpacity={lit}
        stroke={mix(C.muted, "#FF4500", lit)}
        strokeLinejoin="round"
      />
      <Count x={x + P + 18} y={y + 174} value={String(Math.round(lerp(12, 284, count)))} active={active} />
      <path
        d={`M${x + 86} ${y + 162} h14 a2 2 0 0 1 2 2 v7 a2 2 0 0 1 -2 2 h-8 l-4 3 v-3 h-2 a2 2 0 0 1 -2 -2 v-7 a2 2 0 0 1 2 -2 z`}
        fill="none"
        stroke={C.muted}
        strokeLinejoin="round"
      />
      <Count x={x + 108} y={y + 174} value={String(Math.round(lerp(3, 47, count)))} active={active} />
    </Tile>
  );
}

/** 4 · YouTube: a creator reviews the tool; views climb. */
function Video({ t }: { t: number }) {
  const [x, y, w] = [COL[2], ROW[1], TILE.w];
  const { count, active } = phase(t, 3);
  const th = { x: x + P, y: y + 56, w: w - 2 * P, h: 66 };
  return (
    <Tile i={3} t={t} x={x} y={y} icon={<Mark name="youtube" x={0} y={0} size={15} />} title="YouTube" meta={<Meta text="DevOps Toolbox" />}>
      {/* Thumbnail: a terminal-ish frame, play button, duration and watch progress. */}
      <rect x={th.x} y={th.y} width={th.w} height={th.h} rx={6} fill="#17211c" />
      <Lines x={th.x + 12} y={th.y + 14} widths={[40, 56, 32]} gap={9} h={3} fill="#ffffff26" />
      <circle cx={th.x + th.w - 32} cy={th.y + th.h / 2 - 4} r={11} fill="#ffffff" opacity={0.95} />
      <path d={`M${th.x + th.w - 36} ${th.y + th.h / 2 - 9.5} L${th.x + th.w - 27} ${th.y + th.h / 2 - 4} L${th.x + th.w - 36} ${th.y + th.h / 2 + 1.5} Z`} fill="#FF0000" />
      <rect x={th.x + 8} y={th.y + th.h - 22} width={32} height={13} rx={3} fill="#000000b3" />
      <Mono x={th.x + 24} y={th.y + th.h - 12.5} size={8.4} fill="#fff" textAnchor="middle" letterSpacing="0.02em">
        12:48
      </Mono>
      <rect x={th.x} y={th.y + th.h - 3} width={th.w * 0.62 * count} height={3} fill="#FF0000" />
      <text x={x + P} y={y + 142} fontSize={11.5} fontWeight={550} fill={C.ink}>
        Preview envs, tested
      </text>
      <line x1={x + P} x2={x + w - P} y1={y + 154} y2={y + 154} stroke={C.hair} />
      <Count x={x + P} y={y + 178} value={`${lerp(0.9, 48.2, count).toFixed(1)}k`} active={active} />
      <Mono x={x + P + 48} y={y + 177} size={8.6}>
        views
      </Mono>
    </Tile>
  );
}

/** 5 · X: the launch post spreads; likes and reposts rise. */
function Social({ t }: { t: number }) {
  const [x, y, w] = [COL[1], ROW[1], 160];
  const { count, active, lit } = phase(t, 4);
  return (
    <Tile i={4} t={t} x={x} y={y} w={w} icon={<Mark name="x" x={0} y={0} size={13} />} title="Posts on X" meta={<Meta text="Launch thread" />}>
      <circle cx={x + P + 8} cy={y + 68} r={8} fill={C.primary} />
      <text x={x + P + 8} y={y + 72} fontSize={11} fontWeight={600} fill="#fff" textAnchor="middle">
        Y
      </text>
      <text x={x + P + 22} y={y + 66} fontSize={11} fontWeight={550} fill={C.ink}>
        Your Tool
      </text>
      <Mono x={x + P + 22} y={y + 78} size={8.4} style={{ textTransform: "none" }}>
        @yourtool · 2h
      </Mono>
      <text x={x + P} y={y + 104} fontSize={11} fill={C.ink}>
        Every PR gets a live
      </text>
      <text x={x + P} y={y + 119} fontSize={11} fill={C.ink}>
        {"preview env. Here’s how"}
      </text>
      <line x1={x + P} x2={x + w - P} y1={y + 140} y2={y + 140} stroke={C.hair} />
      {/* Likes. */}
      <path
        d={`M${x + P + 6} ${y + 175} c-5 -3.5 -7 -6 -7 -8.5 a3.4 3.4 0 0 1 7 -1.2 a3.4 3.4 0 0 1 7 1.2 c0 2.5 -2 5 -7 8.5 z`}
        fill="#f91880"
        fillOpacity={lit}
        stroke={mix(C.muted, "#f91880", lit)}
        strokeLinejoin="round"
      />
      <Count x={x + P + 18} y={y + 174} value={fmtK(lerp(18, 1400, count))} active={active} />
      {/* Reposts. */}
      <g fill="none" stroke={mix(C.muted, "#00ba7c", lit)} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${x + 84} ${y + 172} v-7 h9 M${x + 90.5} ${y + 162.5} l2.5 2.5 l-2.5 2.5`} />
        <path d={`M${x + 98} ${y + 166} v7 h-9 M${x + 91.5} ${y + 175.5} l-2.5 -2.5 l2.5 -2.5`} />
      </g>
      <Count x={x + 104} y={y + 174} value={String(Math.round(lerp(2, 212, count)))} active={active} />
    </Tile>
  );
}

const distribution: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default distribution;
