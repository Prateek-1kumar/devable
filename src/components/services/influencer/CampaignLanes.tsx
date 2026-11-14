"use client";

import { PATHS, PLATFORM_COLOR, PlatformIcon, type Platform } from "../kit";
import { clamp01, out3, seg } from "../content/play";
import { RING, useScene } from "./LaunchAmplification";

// Dedicated Creator Campaigns: planned, ongoing distribution, drawn isometric in real text and SVG (no canvas, so it
// is sharp at any size), in the same language as the launch dial beside it.
//   lanes      four channels (X, LinkedIn, YouTube, newsletters), each a lane running Week 1 → 12 from its block.
//   posts      different creators' posts in different formats land on the lanes as the green "now" bar passes their
//              week; each sends a pulse down its lane, through the wiring, into the objective.
//   objective  one card at the far end: its line climbs as the pulses arrive, and it counts who is feeding it.
// Drawn once at a fixed size and scaled to the box; phones get their own, sparser drawing (faces without the format).
// Loops while on screen with a long hold on the finished picture. Reduced motion: the finished picture.

const CYCLE = 16; // seconds
const RUN = [1, 9] as const; // when the bar runs week 1 → 12
const SETTLED = 11; // the finished picture: every post in, every pulse home
const HOLD_END = 14.6;
const LAG = 1.3; // weeks a pulse takes to reach the objective; the chart trails the bar by this much
const GREEN = "#22c26a";
const INK = "rgb(15 26 20 / 0.14)"; // hairlines
const r1 = (n: number) => Math.round(n * 10) / 10;

const LANES: Platform[] = ["x", "linkedin", "youtube", "newsletter"];
const LANE = { w: 0.6, gap: 0.14, h: 0.1, front: 2.1, back: -2.1 };
const BLOCK = { z: LANE.front + 0.48, h: 0.5 }; // the channel's block at the head of its lane
const EDGE = laneX(3) + LANE.w / 2; // the lanes' outer edge
const MERGE_Z = LANE.back - 0.6; // where the lanes' wires join
function laneX(i: number) {
  return (i - (LANES.length - 1) / 2) * (LANE.w + LANE.gap);
}
const weekZ = (w: number) => LANE.front - ((w - 0.5) / 12) * (LANE.front - LANE.back);

// SAMPLE: one program, many creators and formats across the channels. The faces are the hero launch's creators (photos
// in /services/creators/webai, named by X handle); who posts what, where and when is a placeholder. Spaced so no two
// labels touch: neighbouring lanes post three weeks apart.
const PROGRAM: { lane: number; week: number; who: string; format: string }[] = [
  { lane: 1, week: 2, who: "rohanpaul_ai", format: "Article" },
  { lane: 3, week: 2, who: "omarsar0", format: "Issue" },
  { lane: 0, week: 5, who: "svpino", format: "Thread" },
  { lane: 2, week: 5, who: "DataChaz", format: "Video" },
  { lane: 1, week: 8, who: "kimmonismus", format: "Post" },
  { lane: 3, week: 8, who: "ai_for_success", format: "Review" },
  { lane: 0, week: 11, who: "BenGeskin", format: "Demo" },
  { lane: 2, week: 11, who: "hasantoxr", format: "Tutorial" },
];

// The objective's line: each post lifts it once its pulse arrives, eased over a couple of weeks.
const smooth = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const adoption = (w: number) => 0.06 + (0.88 * PROGRAM.reduce((sum, q) => sum + smooth((w - q.week) / 2.4), 0)) / PROGRAM.length;

// The two drawings: desktop/tablet (16:10) and phone (5:4), px in the drawing's own size. `s` is px per world unit,
// (ox, oy) where the world's origin lands, `objZ` how far back the objective's stand sits.
const WIDE = { W: 598, H: 374, s: 80, ox: 263, oy: 238, objZ: -3.43, obj: { x: 360, y: 10, w: 218, h: 122 }, lift: 23 };
const PHONE: typeof WIDE = { W: 340, H: 272, s: 44, ox: 142, oy: 193, objZ: -4.45, obj: { x: 190, y: 12, w: 142, h: 104 }, lift: 19 };
type Layout = typeof WIDE;
type Pt = readonly [number, number];

/** Everything that does not move, for one drawing. The view is isometric: 30° above the floor, from the front right. */
function build(L: Layout) {
  const at = (x: number, y: number, z: number): Pt => [r1(L.ox + L.s * 0.7071 * (x - z)), r1(L.oy + L.s * (0.3536 * (x + z) - 0.866 * y))];
  const poly = (...pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");
  /** A box's three visible faces: centred on (x, z), half-sizes a and b, from y0 up to y1. */
  const box = (x: number, z: number, a: number, b: number, y0: number, y1: number) => ({
    top: poly(at(x - a, y1, z - b), at(x + a, y1, z - b), at(x + a, y1, z + b), at(x - a, y1, z + b)),
    front: poly(at(x - a, y1, z + b), at(x + a, y1, z + b), at(x + a, y0, z + b), at(x - a, y0, z + b)),
    side: poly(at(x + a, y1, z - b), at(x + a, y1, z + b), at(x + a, y0, z + b), at(x + a, y0, z - b)),
  });
  const half = LANE.w / 2;
  const merge = at(0, LANE.h, MERGE_Z);
  const inlet = at(0, LANE.h, L.objZ);
  /** The wire from lane i's end: on along the lane's line, then a smooth turn into the trunk. */
  const wire = (i: number) => {
    const a = at(laneX(i), LANE.h, LANE.back);
    const c = at(laneX(i), LANE.h, MERGE_Z);
    return Array.from({ length: 11 }, (_, k): Pt => {
      const u = k / 10;
      return [r1(a[0] * (1 - u) ** 2 + c[0] * 2 * u * (1 - u) + merge[0] * u * u), r1(a[1] * (1 - u) ** 2 + c[1] * 2 * u * (1 - u) + merge[1] * u * u)];
    });
  };
  const wires = LANES.map((_, i) => wire(i));
  return {
    at,
    merge,
    inlet,
    shadow: poly(at(-EDGE, 0, LANE.back), at(EDGE, 0, LANE.back), at(EDGE, 0, BLOCK.z + half), at(-EDGE, 0, BLOCK.z + half)),
    lanes: LANES.map((platform, i) => {
      const x = laneX(i);
      const [gx, gy] = at(x, BLOCK.h, BLOCK.z);
      return {
        platform,
        lane: box(x, (LANE.front + LANE.back) / 2, half, (LANE.front - LANE.back) / 2, 0, LANE.h),
        rules: Array.from({ length: 11 }, (_, k) => ({ a: at(x - half, LANE.h, weekZ(k + 1.5)), b: at(x + half, LANE.h, weekZ(k + 1.5)), strong: (k + 1) % 4 === 0 })),
        block: box(x, BLOCK.z, half, half, 0, BLOCK.h),
        // The glyph lies on the block's top, turned to face the reader: upright, at half height.
        glyph: `translate(${gx} ${gy}) scale(${r1(L.s * 0.017)} ${r1(L.s * 0.0085)}) translate(-12 -12)`,
        wire: wires[i].map((p) => p.join(",")).join(" "),
      };
    }),
    stand: box(0, L.objZ, 0.5, 0.2, 0, LANE.h),
    posts: PROGRAM.map((q) => {
      const x = laneX(q.lane);
      const z = weekZ(q.week);
      const [cx, cy] = at(x, LANE.h + 0.18, z);
      return {
        ...q,
        platform: LANES[q.lane],
        depth: Math.round((x + z) * 10) + 50, // nearer the reader draws later
        block: box(x, z, half - 0.05, 0.17, LANE.h, LANE.h + 0.18),
        strip: poly(at(x - half + 0.05, LANE.h + 0.18, z + 0.07), at(x + half - 0.05, LANE.h + 0.18, z + 0.07), at(x + half - 0.05, LANE.h + 0.18, z + 0.17), at(x - half + 0.05, LANE.h + 0.18, z + 0.17)),
        chip: [cx, cy - L.lift] as Pt,
        route: [at(x, LANE.h, z), ...wires[q.lane], inlet],
      };
    }),
  };
}
const GEO = { wide: build(WIDE), phone: build(PHONE) };

/** The point `f` (0–1) of the way along a path. */
function along(pts: Pt[], f: number): Pt {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let left = f * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i]) return [r1(pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * left) / lens[i]), r1(pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * left) / lens[i])];
    left -= lens[i];
  }
  return pts[pts.length - 1];
}

export default function CampaignLanes({ seen }: { seen: boolean }) {
  const { box, t, still, size } = useScene(seen, CYCLE, SETTLED);
  const phone = !!size && size.h / size.w > 0.7;
  const L = phone ? PHONE : WIDE;
  const G = phone ? GEO.phone : GEO.wide;
  const flow = 0.5 + (12 * (t - RUN[0])) / (RUN[1] - RUN[0]); // weeks, running on past 12 so the last pulses get home
  const week = Math.min(12.5, Math.max(0.5, flow));
  const upTo = Math.min(12.5, Math.max(0.5, flow - LAG)); // where the objective's line has reached
  const fade = still ? 1 : seg(t, 0, 0.6) * (1 - seg(t, HOLD_END, CYCLE - 0.6));

  const posts = G.posts.map((q) => ({ ...q, shown: out3(clamp01((week - q.week) / 0.5)), pulse: clamp01((flow - q.week - 0.3) / (LAG - 0.3)) })).sort((a, b) => a.depth - b.depth);
  const fed = PROGRAM.filter((q) => q.week <= upTo);
  const creators = new Set(fed.map((q) => q.who)).size;
  const channels = new Set(fed.map((q) => q.lane)).size;

  // The now-bar across the lanes, and its tag.
  const z = weekZ(week);
  const [bx1, by1] = G.at(-EDGE - 0.08, LANE.h, z);
  const [bx2, by2] = G.at(EDGE + 0.08, LANE.h, z);
  const [w1x, w1y] = G.at(EDGE + 0.3, 0, weekZ(1));

  // The objective's chart, in its own px box.
  const cw = L.obj.w - (phone ? 16 : 24);
  const ch = phone ? 40 : 50;
  const cx = (w: number) => r1(3 + ((w - 0.5) / 12) * (cw - 9));
  const cy = (w: number) => r1(ch - 3 - (ch - 9) * adoption(w));
  const line = [...Array.from({ length: Math.ceil((upTo - 0.5) / 0.25) }, (_, i) => 0.5 + i * 0.25), upTo].map((w) => `${cx(w)} ${cy(w)}`).join("L");

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      <div className="relative origin-top-left" style={{ width: L.W, height: L.H, transform: `scale(${size ? size.w / L.W : 1})`, opacity: size ? fade : 0 }}>
        <svg viewBox={`0 0 ${L.W} ${L.H}`} className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <filter id="camp-blur" x="-20%" y="-20%" width="140%" height="150%">
              <feGaussianBlur stdDeviation={phone ? 5 : 8} />
            </filter>
          </defs>
          <polygon points={G.shadow} fill="rgb(15 26 20 / 0.16)" filter="url(#camp-blur)" transform={`translate(0 ${phone ? 6 : 10})`} />

          {/* The wiring: each lane's end curves into one trunk, into the objective's stand. */}
          <g fill="none" stroke="#c4c0b6" strokeWidth="1.5">
            {G.lanes.map((l) => (
              <polyline key={l.platform} points={l.wire} />
            ))}
            <line x1={G.merge[0]} y1={G.merge[1]} x2={G.inlet[0]} y2={G.inlet[1]} />
          </g>
          <circle cx={G.merge[0]} cy={G.merge[1]} r="3.5" fill="#fff" stroke="#c4c0b6" strokeWidth="1.5" />
          <g stroke={INK} strokeLinejoin="round">
            <polygon points={G.stand.front} fill="#e4e1d9" />
            <polygon points={G.stand.side} fill="#d6d3ca" />
            <polygon points={G.stand.top} fill="#f3f1ec" />
          </g>

          {/* The lanes, ruled in weeks, each with its channel's block at the head. */}
          {G.lanes.map((l) => (
            <g key={l.platform} stroke={INK} strokeLinejoin="round">
              <polygon points={l.lane.front} fill="#e9e6de" />
              <polygon points={l.lane.side} fill="#dcd9d0" />
              <polygon points={l.lane.top} fill="#fdfcf9" />
              {l.rules.map((r, k) => (
                <line key={k} x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]} stroke={r.strong ? "rgb(15 26 20 / 0.24)" : "rgb(15 26 20 / 0.08)"} />
              ))}
            </g>
          ))}
          {/* Now: a bar across every lane, moving down the weeks. */}
          <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke={GREEN} strokeWidth={phone ? 2.5 : 3} strokeLinecap="round" />

          {/* Each post: a white block in its week with a green edge, dropping in as the bar passes. */}
          {posts.map((q) => (
            <g key={q.who} stroke={INK} strokeLinejoin="round" style={{ opacity: q.shown }} transform={`translate(0 ${r1((q.shown - 1) * 26)})`}>
              <polygon points={q.block.front} fill="#f1efe9" />
              <polygon points={q.block.side} fill="#e0ddd4" />
              <polygon points={q.block.top} fill="#fff" />
              <polygon points={q.strip} fill={GREEN} stroke="none" />
            </g>
          ))}

          {/* The channel blocks stand nearest the reader, so they draw over the posts behind them. */}
          {G.lanes.map((l) => (
            <g key={l.platform} stroke={INK} strokeLinejoin="round">
              <polygon points={l.block.front} fill="#f3f1ec" />
              <polygon points={l.block.side} fill="#e2dfd7" />
              <polygon points={l.block.top} fill="#fff" />
              <g transform={l.glyph} fill={PLATFORM_COLOR[l.platform]} stroke="none">
                {PATHS[l.platform]}
              </g>
            </g>
          ))}

          {/* The pulses: each post's push, on its way to the objective. */}
          {posts.map((q) => {
            if (q.pulse <= 0 || q.pulse >= 1) return null;
            const [px, py] = along(q.route, q.pulse);
            return <circle key={q.who} cx={px} cy={py} r={phone ? 3.5 : 4.5} fill={GREEN} stroke="#fff" strokeWidth="2" />;
          })}
        </svg>

        <span className={`absolute font-semibold whitespace-nowrap text-ink/55 ${phone ? "text-[13px]" : "text-[14px]"}`} style={{ left: w1x, top: w1y - (phone ? 14 : 16) }}>
          Week 1
        </span>
        <span
          className={`absolute grid -translate-y-1/2 place-items-center rounded-full bg-white px-3 font-semibold whitespace-nowrap text-ink tabular-nums shadow-[0_0_0_1.5px_#22c26a,0_8px_18px_-8px_rgb(15_26_20/0.3)] ${phone ? "h-[26px] text-[13px]" : "h-7 text-[14px]"}`}
          style={{ left: bx2 + 6, top: by2, opacity: seg(week, 2.2, 2.8) }}
        >
          Week {Math.min(12, Math.floor(week + 0.5))}
        </span>

        {/* Who posted, and in what format (faces only on a phone), floating over each post. */}
        {posts.map((q) => (
          <span
            key={q.who}
            className={`absolute flex items-center rounded-full bg-white ${RING} ${phone ? "p-[2px]" : "h-8 gap-2 py-[3px] pr-3 pl-[3px]"}`}
            style={{ left: q.chip[0], top: q.chip[1], opacity: q.shown, transform: `translate(-50%, -50%) translateY(${r1((q.shown - 1) * 26)}px)` }}
          >
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- creator photos */}
              <img src={`/services/creators/webai/${q.who}.jpg`} alt="" className={`${phone ? "size-6" : "size-[26px]"} rounded-full object-cover`} />
              <span className="absolute -right-1 -bottom-1 grid size-[15px] place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.1)]">
                <PlatformIcon platform={q.platform} className="size-[9px]" style={{ color: PLATFORM_COLOR[q.platform] }} />
              </span>
            </span>
            {!phone && <span className="text-[14px] leading-none font-semibold tracking-[-0.01em] text-ink">{q.format}</span>}
          </span>
        ))}

        {/* The one objective everything feeds: its line climbs as the pulses arrive. */}
        <div
          className={`absolute flex flex-col rounded-2xl bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.08),0_2px_4px_rgb(15_26_20/0.06),0_24px_36px_-16px_rgb(15_26_20/0.4)] ${phone ? "p-2" : "p-3"}`}
          style={{ left: L.obj.x, top: L.obj.y, width: L.obj.w, height: L.obj.h }}
        >
          <p className={`flex items-center gap-1.5 leading-none font-semibold text-ink/65 ${phone ? "text-[12.5px]" : "text-[13px]"}`}>
            <span className="size-2 rounded-full" style={{ background: GREEN }} />
            One objective
          </p>
          <p className={`mt-1.5 leading-none font-semibold tracking-[-0.025em] whitespace-nowrap text-ink ${phone ? "text-[16px]" : "text-[20px]"}`}>Product adoption</p>
          <div className="relative mt-auto" style={{ height: ch }}>
            <svg viewBox={`0 0 ${cw} ${ch}`} className="absolute inset-0 size-full overflow-visible">
              <defs>
                <linearGradient id="camp-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={GREEN} stopOpacity="0.3" />
                  <stop offset="1" stopColor={GREEN} stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1={ch - 0.5} x2={cw} y2={ch - 0.5} stroke="rgb(15 26 20 / 0.12)" />
              <path d={`M${line}L${cx(upTo)} ${ch}L${cx(0.5)} ${ch}Z`} fill="url(#camp-area)" />
              <path d={`M${line}`} fill="none" stroke="#16211b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={cx(upTo)} cy={cy(upTo)} r="4.5" fill={GREEN} stroke="#fff" strokeWidth="2" />
            </svg>
            <p className={`absolute top-0 left-0 leading-none whitespace-nowrap text-ink/65 tabular-nums ${phone ? "text-[12.5px]" : "text-[13px]"}`}>
              <b className="font-semibold text-ink">{creators}</b> creators{!phone && <> · <b className="font-semibold text-ink">{channels}</b> channels</>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
