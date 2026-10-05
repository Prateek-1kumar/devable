import type { ReactNode } from "react";
import { STEPS } from "../content";
import { C, Card, Check, DATA, Lines, Mark, Mono, PanelSvg, Pulse, Trace, blip, clamp01, easeOut, lerp, outro, polyline, ramp } from "../kit";
import type { PanelModule } from "../PanelPlayer";

// 04 Distribution Engine. Beginning: the article is published; five channels sit
// dim around it. Work: it fans out along its lines and each channel lights in
// turn: it climbs Google from #6 to #2, ChatGPT and Perplexity cite it, a Reddit
// thread gains upvotes, a creator video gains views, the launch post spreads.
// Result: all five channels live, with their final numbers.

const DURATION = 8;
const SETTLE = 7.2;

// Grid: three columns (164 · 160 · 164, 16px gutters) and two rows of tiles.
const COL = [20, 200, 376] as const;
const ROW = [100, 308] as const;
const TILE = { w: 164, h: 196 };
const ART = { x: 200, y: 100, w: 160, h: 140 };

type Pt = [number, number];
const J: Pt = [280, 274];
const TRUNK: Pt[] = [[280, ART.y + ART.h], J];
const ROUTES: Pt[][] = [
  [...TRUNK, [192, 274], [192, 250], [184, 250]], // Google
  [...TRUNK, [368, 274], [368, 250], [376, 250]], // AI answers
  [...TRUNK, [192, 274], [192, 340], [184, 340]], // Reddit
  [...TRUNK, [368, 274], [368, 340], [376, 340]], // YouTube
  [...TRUNK, [280, ROW[1]]], // X
];
/** When each channel lights; its pulse travels the line in the 0.5 s before. */
const litAt = (i: number) => 1.1 + i * 0.85;
const TRAVEL = 0.5;
const LIVE = litAt(4) + 1.3;

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const artIn = ramp(t, 0.1, 0.4) * o;
  const published = ramp(t, 0.45, 0.35) * o;
  const firing = [0, 1, 2, 3, 4].filter((i) => t > litAt(i) - TRAVEL - 0.05 && t < litAt(i) + 0.1).length > 0;
  const channels = [0, 1, 2, 3, 4].filter((i) => t >= litAt(i)).length;
  const live = ramp(t, LIVE, 0.3) * o;

  return (
    <PanelSvg metrics={STEPS[3].metrics} t={t} metricsAt={[litAt(0), litAt(1)]} metricsFor={[LIVE - litAt(0), litAt(4) + 0.8 - litAt(1)]}>
      {/* Lines first, so cards sit on top of them. */}
      {ROUTES.map((pts, i) => (
        <path key={`b${i}`} d={polyline(pts)} fill="none" stroke={C.ink} strokeOpacity={0.12} strokeLinejoin="round" />
      ))}
      {ROUTES.map((pts, i) => {
        const at = litAt(i) - TRAVEL;
        return (
          <g key={`r${i}`}>
            <Trace d={polyline(pts)} k={ramp(t, at, TRAVEL, easeOut)} stroke={C.primary} opacity={0.55 * o} />
            <Pulse points={pts} k={t < at ? -1 : (t - at) / TRAVEL} />
          </g>
        );
      })}
      {/* The fan-out node. */}
      <circle cx={J[0]} cy={J[1]} r={7} fill={C.accent} opacity={firing ? 0.16 : 0} />
      <circle cx={J[0]} cy={J[1]} r={3.5} fill={channels > 0 && o > 0.5 ? C.primary : C.card} stroke={channels > 0 && o > 0.5 ? C.primary : C.ink} strokeOpacity={channels > 0 && o > 0.5 ? 1 : 0.3} />

      {/* The published article. */}
      <g opacity={0.35 + 0.65 * artIn} transform={`translate(0 ${(1 - artIn) * 6})`}>
        <Card x={ART.x} y={ART.y} w={ART.w} h={ART.h} stroke={blip(t, 0.45, 0.4, 0.15) > 0.01 ? C.accent : C.line} strokeWidth={1 + 0.5 * blip(t, 0.45, 0.4, 0.15)} />
        {published > 0.5 ? (
          <Check x={ART.x + 18} y={ART.y + 19} r={5.5} k={1} />
        ) : (
          <circle cx={ART.x + 18} cy={ART.y + 19} r={5} fill="none" stroke={C.line} strokeWidth={1.6} />
        )}
        <Mono x={ART.x + 30} y={ART.y + 22.5} size={9} fill={C.ink}>
          {published > 0.5 ? "Published" : "Draft"}
        </Mono>
        <Mono x={ART.x + ART.w - 14} y={ART.y + 22.5} size={8.4} textAnchor="end">
          Blog
        </Mono>
        <text x={ART.x + 14} y={ART.y + 50} fontSize={13} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
          Deploy previews
        </text>
        <text x={ART.x + 14} y={ART.y + 66} fontSize={13} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
          on every PR
        </text>
        <Mono x={ART.x + 14} y={ART.y + 83} size={8.4} fill={C.primary} style={{ textTransform: "none" }}>
          yourtool.dev/blog/…
        </Mono>
        <Lines x={ART.x + 14} y={ART.y + 92} widths={[128, 104]} gap={8} />
        <line x1={ART.x + 14} x2={ART.x + ART.w - 14} y1={ART.y + 114} y2={ART.y + 114} stroke={C.line} />
        <circle cx={ART.x + 17} cy={ART.y + 126} r={3} fill={live > 0.5 ? C.primary : channels > 0 && o > 0.9 ? C.accent : "none"} stroke={live > 0.5 ? C.primary : channels > 0 && o > 0.9 ? C.accent : C.ink} strokeOpacity={live > 0.5 || (channels > 0 && o > 0.9) ? 1 : 0.25} />
        <Mono x={ART.x + 27} y={ART.y + 129} size={8.6} fill={live > 0.5 ? C.primary : C.ink}>
          {live > 0.5 ? "Live on 5 channels" : channels > 0 && o > 0.9 ? `Distributing ${channels}/5` : "Ready to distribute"}
        </Mono>
      </g>

      <Google t={t} o={o} />
      <Answers t={t} o={o} />
      <Reddit t={t} o={o} />
      <Video t={t} o={o} />
      <Social t={t} o={o} />
    </PanelSvg>
  );
}

// ── Channel tiles ───────────────────────────────────────────────────────────

/** A channel tile: dim until lit, coral border while lighting, a status dot that turns deep green. */
function Tile({ i, t, o, x, y, w = TILE.w, icon, title, meta, metaLit, children }: { i: number; t: number; o: number; x: number; y: number; w?: number; icon: ReactNode; title: string; meta: string; metaLit?: boolean; children: ReactNode }) {
  const lit = ramp(t, litAt(i), 0.25) * o;
  const active = blip(t, litAt(i), 0.8, 0.15);
  const done = ramp(t, litAt(i) + 1.2, 0.2) * o;
  return (
    <g opacity={0.45 + 0.55 * lit}>
      <Card x={x} y={y} w={w} h={TILE.h} stroke={active > 0.01 ? C.accent : C.line} strokeWidth={1 + active * 0.5} />
      <rect x={x + 10} y={y + 10} width={26} height={26} rx={7} fill={C.paper} stroke={C.line} />
      <g transform={`translate(${x + 23} ${y + 23})`}>{icon}</g>
      <text x={x + 44} y={y + 20} fontSize={11.5} fontWeight={550} fill={C.ink}>
        {title}
      </text>
      <Mono x={x + 44} y={y + 33} size={8.6} fill={metaLit ? C.primary : C.muted}>
        {meta}
      </Mono>
      <circle cx={x + w - 13} cy={y + 15} r={3} fill={done > 0.5 ? C.primary : active > 0.01 ? C.accent : "none"} stroke={done > 0.5 ? C.primary : active > 0.01 ? C.accent : C.ink} strokeOpacity={done > 0.5 || active > 0.01 ? 1 : 0.25} />
      {children}
    </g>
  );
}

const SERP = ["vercel.com", "render.com", "netlify.com", "railway.app", "fly.io"];

/** 1 · Google: the article climbs from #6 to #2 for "deploy previews". */
function Google({ t, o }: { t: number; o: number }) {
  const [x, y] = [COL[0], ROW[0]];
  const at = litAt(0);
  const k = ramp(t, at + 0.15, 1.0) * o;
  const p = lerp(5, 1, k); // our slot, 0-based
  const settled = ramp(t, at + 1.2, 0.2) * o;
  const moving = k > 0.001 && settled < 0.5;
  const rowY = (slot: number) => y + 86 + slot * 18;
  return (
    <Tile i={0} t={t} o={o} x={x} y={y} icon={<Mark name="google" x={0} y={0} size={14} />} title="Google Search" meta={`Rank #${Math.round(p) + 1}`} metaLit={settled > 0.5}>
      <rect x={x + 10} y={y + 44} width={TILE.w - 20} height={22} rx={11} fill={C.paper} stroke={C.line} />
      <g fill="none" stroke={C.muted} strokeWidth={1.3} strokeLinecap="round">
        <circle cx={x + 22} cy={y + 54} r={3.6} />
        <path d={`M${x + 24.8} ${y + 56.8} L${x + 27.5} ${y + 59.5}`} />
      </g>
      <text x={x + 34} y={y + 59} fontSize={11} fill={C.ink}>
        deploy previews
      </text>
      {SERP.map((d, i) => {
        const slot = i === 0 ? 0 : i + clamp01(i + 1 - p);
        const ry = rowY(slot);
        return (
          <g key={d}>
            <Mono x={x + 14} y={ry + 3} size={8.6}>
              {String(Math.round(slot) + 1)}
            </Mono>
            <circle cx={x + 30} cy={ry} r={3} fill={C.line} />
            <Mono x={x + 38} y={ry + 3} size={8.6} fill={C.muted} style={{ textTransform: "none" }}>
              {d}
            </Mono>
            <rect x={x + 120} y={ry - 2} width={32} height={4} rx={2} fill={C.line} />
          </g>
        );
      })}
      {/* Your result. */}
      <g transform={`translate(0 ${rowY(p) - rowY(0)})`}>
        <rect x={x + 8} y={rowY(0) - 9} width={TILE.w - 16} height={18} rx={5} fill={settled > 0.5 ? C.primarySoft : moving ? C.accentSoft : "none"} stroke={settled > 0.5 ? C.primary : moving ? C.accent : "none"} strokeOpacity={0.5} />
        <Mono x={x + 14} y={rowY(0) + 3} size={8.6} fill={settled > 0.5 ? C.primary : moving ? C.accent : C.muted}>
          {String(Math.round(p) + 1)}
        </Mono>
        <circle cx={x + 30} cy={rowY(0)} r={3} fill={settled > 0.5 ? C.primary : C.accent} />
        <Mono x={x + 38} y={rowY(0) + 3} size={8.6} fill={C.ink} style={{ textTransform: "none" }}>
          yourtool.dev
        </Mono>
        {settled > 0.5 ? (
          <Check x={x + 145} y={rowY(0)} r={5.5} k={settled} />
        ) : (
          <path d={`M${x + 145} ${rowY(0) + 4} V${rowY(0) - 4} M${x + 141.5} ${rowY(0) - 1} L${x + 145} ${rowY(0) - 4.5} L${x + 148.5} ${rowY(0) - 1}`} fill="none" stroke={moving ? C.accent : C.line} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </Tile>
  );
}

/** 2 · AI answers: ChatGPT writes an answer citing the article; Perplexity lists it as a source. */
function Answers({ t, o }: { t: number; o: number }) {
  const [x, y] = [COL[2], ROW[0]];
  const at = litAt(1);
  const typed = ramp(t, at + 0.15, 0.6, (v) => v) * o;
  const cite = ramp(t, at + 0.7, 0.25) * o;
  const settled = ramp(t, at + 1.2, 0.2) * o;
  const pplx = ramp(t, at + 0.95, 0.25) * o;
  const cw = 102;
  return (
    <Tile i={1} t={t} o={o} x={x} y={y} icon={<Mark name="chatgpt" x={0} y={0} size={15} />} title="AI answers" meta={settled > 0.5 ? "Cited · 2 engines" : typed > 0 ? "Answering…" : "Not cited yet"} metaLit={settled > 0.5}>
      {/* The question. */}
      <rect x={x + TILE.w - 12 - 132} y={y + 44} width={132} height={22} rx={11} fill={C.paper} stroke={C.line} />
      <text x={x + TILE.w - 12 - 66} y={y + 59} fontSize={11} fill={C.ink} textAnchor="middle">
        Best PR preview tool?
      </text>
      {/* ChatGPT's answer. */}
      <Mark name="chatgpt" x={x + 19} y={y + 82} size={12} />
      <Lines x={x + 32} y={y + 78} widths={[118, 108, 84]} gap={9} k={typed} fill={typed > 0 && typed < 1 ? C.accentSoft : C.line} />
      <g opacity={cite}>
        <Pill x={x + 32} y={y + 104} w={cw} label="[1] yourtool.dev" tone={settled > 0.5 ? "done" : "active"} />
      </g>
      <line x1={x + 12} x2={x + TILE.w - 12} y1={y + 138} y2={y + 138} stroke={C.line} />
      {/* Perplexity's sources. */}
      <Mark name="perplexity" x={x + 19} y={y + 156} size={12} />
      <text x={x + 32} y={y + 160} fontSize={11} fontWeight={550} fill={C.ink}>
        Perplexity
      </text>
      <Mono x={x + TILE.w - 12} y={y + 160} size={8.4} textAnchor="end">
        Sources
      </Mono>
      <g opacity={pplx}>
        <Pill x={x + 32} y={y + 168} w={cw} label="[1] yourtool.dev" tone={settled > 0.5 ? "done" : "active"} />
      </g>
      <rect x={x + 32} y={y + 175} width={cw} height={4} rx={2} fill={C.line} opacity={1 - pplx} />
    </Tile>
  );
}

/** A lowercase pill for URLs and citations: muted, coral while it is the live thing, deep green once confirmed. */
function Pill({ x, y, w, label, tone }: { x: number; y: number; w: number; label: string; tone: "idle" | "active" | "done" }) {
  const [fill, stroke, color] =
    tone === "done" ? [C.primarySoft, C.primary, C.primary] : tone === "active" ? [C.accentSoft, C.accent, C.accent] : [C.card, C.line, C.muted];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={18} rx={9} fill={fill} stroke={stroke} />
      <text x={w / 2} y={12} fontFamily="var(--font-mono)" fontSize={8.4} letterSpacing="0.02em" fill={color} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

/** 3 · Reddit: a r/devops thread where the top comment links the article; upvotes tick up. */
function Reddit({ t, o }: { t: number; o: number }) {
  const [x, y] = [COL[0], ROW[1]];
  const at = litAt(2);
  const k = ramp(t, at + 0.15, 1.1, easeOut) * o;
  const settled = ramp(t, at + 1.2, 0.2) * o;
  const moving = k > 0.001 && settled < 0.5;
  return (
    <Tile i={2} t={t} o={o} x={x} y={y} icon={<Mark name="reddit" x={0} y={0} size={15} />} title="r/devops" meta="Thread · 6h">
      <text x={x + 12} y={y + 58} fontSize={11} fontWeight={550} fill={C.ink}>
        What do you use for
      </text>
      <text x={x + 12} y={y + 73} fontSize={11} fontWeight={550} fill={C.ink}>
        preview environments?
      </text>
      {/* Top comment, linking the article. */}
      <line x1={x + 16} x2={x + 16} y1={y + 86} y2={y + 140} stroke={C.line} strokeWidth={2} strokeLinecap="round" />
      <circle cx={x + 30} cy={y + 92} r={5} fill={DATA.teal} />
      <Mono x={x + 40} y={y + 95} size={8.4} style={{ textTransform: "none" }}>
        u/kube_sam · top
      </Mono>
      <Lines x={x + 26} y={y + 104} widths={[122, 96]} gap={8} />
      <Pill x={x + 26} y={y + 122} w={106} label="yourtool.dev/blog" tone={settled > 0.5 ? "done" : moving ? "active" : "idle"} />
      {/* Votes and comments. */}
      <line x1={x + 12} x2={x + TILE.w - 12} y1={y + 154} y2={y + 154} stroke={C.line} />
      <path d={`M${x + 14} ${y + 178} L${x + 20} ${y + 170} L${x + 26} ${y + 178} H${x + 22.5} V${y + 183} H${x + 17.5} V${y + 178} Z`} fill={k > 0.001 ? "#FF4500" : "none"} stroke={k > 0.001 ? "#FF4500" : C.muted} strokeWidth={1.2} strokeLinejoin="round" />
      <text x={x + 32} y={y + 182} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={moving ? C.accent : C.ink}>
        {Math.round(lerp(12, 284, k))}
      </text>
      <path d={`M${x + 86} ${y + 170} h14 a2 2 0 0 1 2 2 v7 a2 2 0 0 1 -2 2 h-8 l-4 3 v-3 h-2 a2 2 0 0 1 -2 -2 v-7 a2 2 0 0 1 2 -2 z`} fill="none" stroke={C.muted} strokeWidth={1.2} strokeLinejoin="round" />
      <text x={x + 108} y={y + 182} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={moving ? C.accent : C.ink}>
        {Math.round(lerp(3, 47, k))}
      </text>
    </Tile>
  );
}

/** 4 · YouTube: a creator reviews the tool; views climb. */
function Video({ t, o }: { t: number; o: number }) {
  const [x, y] = [COL[2], ROW[1]];
  const at = litAt(3);
  const k = ramp(t, at + 0.15, 1.1, easeOut) * o;
  const settled = ramp(t, at + 1.2, 0.2) * o;
  const moving = k > 0.001 && settled < 0.5;
  const th = { x: x + 12, y: y + 44, w: TILE.w - 24, h: 74 };
  return (
    <Tile i={3} t={t} o={o} x={x} y={y} icon={<Mark name="youtube" x={0} y={0} size={15} />} title="YouTube" meta="Creator review">
      {/* Thumbnail: a terminal-ish frame, play button, duration and watch progress. */}
      <rect x={th.x} y={th.y} width={th.w} height={th.h} rx={6} fill="#17211c" />
      <Lines x={th.x + 10} y={th.y + 12} widths={[44, 62, 36, 54]} gap={8} h={3} fill="#ffffff26" />
      <circle cx={th.x + th.w - 34} cy={th.y + th.h / 2} r={12} fill="#ffffff" opacity={0.95} />
      <path d={`M${th.x + th.w - 38} ${th.y + th.h / 2 - 6} L${th.x + th.w - 28} ${th.y + th.h / 2} L${th.x + th.w - 38} ${th.y + th.h / 2 + 6} Z`} fill="#FF0000" />
      <rect x={th.x + th.w - 40} y={th.y + th.h - 18} width={32} height={13} rx={3} fill="#000000b3" />
      <Mono x={th.x + th.w - 24} y={th.y + th.h - 8.5} size={8.4} fill="#fff" textAnchor="middle" letterSpacing="0.02em">
        12:48
      </Mono>
      <rect x={th.x} y={th.y + th.h - 3} width={th.w * 0.62 * k} height={3} fill="#FF0000" />
      <text x={x + 12} y={y + 136} fontSize={11} fontWeight={550} fill={C.ink}>
        Preview envs, tested
      </text>
      <circle cx={x + 17} cy={y + 152} r={5} fill={DATA.violet} />
      <Mono x={x + 27} y={y + 155} size={8.4} style={{ textTransform: "none" }}>
        DevOps Toolbox
      </Mono>
      <line x1={x + 12} x2={x + TILE.w - 12} y1={y + 165} y2={y + 165} stroke={C.line} />
      <text x={x + 12} y={y + 186} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={moving ? C.accent : C.ink}>
        {`${lerp(0.9, 48.2, k).toFixed(1)}k`}
      </text>
      <Mono x={x + 62} y={y + 185} size={8.6}>
        views
      </Mono>
    </Tile>
  );
}

/** 5 · X: the launch post spreads; likes and reposts rise. */
function Social({ t, o }: { t: number; o: number }) {
  const [x, y, w] = [COL[1], ROW[1], 160];
  const at = litAt(4);
  const k = ramp(t, at + 0.15, 1.1, easeOut) * o;
  const settled = ramp(t, at + 1.2, 0.2) * o;
  const moving = k > 0.001 && settled < 0.5;
  return (
    <Tile i={4} t={t} o={o} x={x} y={y} w={w} icon={<Mark name="x" x={0} y={0} size={13} />} title="Posts on X" meta="Launch thread">
      <circle cx={x + 20} cy={y + 54} r={8} fill={C.primary} />
      <text x={x + 20} y={y + 58} fontSize={11} fontWeight={600} fill="#fff" textAnchor="middle">
        Y
      </text>
      <text x={x + 34} y={y + 52} fontSize={11} fontWeight={550} fill={C.ink}>
        Your Tool
      </text>
      <Mono x={x + 34} y={y + 64} size={8.4} style={{ textTransform: "none" }}>
        @yourtool · 2h
      </Mono>
      <text x={x + 12} y={y + 86} fontSize={11} fill={C.ink}>
        Every PR gets a live
      </text>
      <text x={x + 12} y={y + 100} fontSize={11} fill={C.ink}>
        {"preview env. Here’s how"}
      </text>
      <rect x={x + 12} y={y + 110} width={w - 24} height={34} rx={6} fill={C.paper} stroke={C.line} />
      <Mono x={x + 20} y={y + 124} size={8.4} style={{ textTransform: "none" }}>
        yourtool.dev
      </Mono>
      <rect x={x + 20} y={y + 131} width={96} height={4} rx={2} fill={C.line} />
      <line x1={x + 12} x2={x + w - 12} y1={y + 154} y2={y + 154} stroke={C.line} />
      {/* Likes. */}
      <path
        d={`M${x + 20} ${y + 184} c-5 -3.5 -7 -6 -7 -8.5 a3.4 3.4 0 0 1 7 -1.2 a3.4 3.4 0 0 1 7 1.2 c0 2.5 -2 5 -7 8.5 z`}
        fill={k > 0.001 ? "#f91880" : "none"}
        stroke={k > 0.001 ? "#f91880" : C.muted}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <text x={x + 32} y={y + 183} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={moving ? C.accent : C.ink}>
        {fmtK(lerp(18, 1400, k))}
      </text>
      {/* Reposts. */}
      <g fill="none" stroke={k > 0.001 ? "#00ba7c" : C.muted} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${x + 86} ${y + 181} v-7 h9 M${x + 92.5} ${y + 171.5} l2.5 2.5 l-2.5 2.5`} />
        <path d={`M${x + 100} ${y + 175} v7 h-9 M${x + 93.5} ${y + 184.5} l-2.5 -2.5 l2.5 -2.5`} />
      </g>
      <text x={x + 106} y={y + 183} fontSize={15} fontWeight={600} letterSpacing="-0.02em" fill={moving ? C.accent : C.ink}>
        {Math.round(lerp(2, 212, k))}
      </text>
    </Tile>
  );
}

const distribution: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default distribution;
