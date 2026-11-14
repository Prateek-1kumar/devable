"use client";

import { useEffect, useRef, useState } from "react";
import { PlatformIcon, type Platform } from "../kit";
import { clamp01, out3, seg, useStill } from "../content/play";
import { AMPLIFY as A } from "./content";

// Launch Amplification: the 24 hours after a launch as one picture, a tilted 24-hour dial with the launch post standing
// on it, in real text (no canvas, so every word is sharp).
//   the wheel   a hand sweeps the 24 hours and the rim fills green behind it. It crawls through the first hour, the
//               raised green segment at the top, because that is where most of the push happens, then runs the rest.
//   first hour  six creators' posts pop up in an arc above that segment, one by one while the hand is inside it, each
//               tied into the "First hour · 6 posts" label that points at the segment.
//   later       two more posts are pinned to the rim at 6h and 18h and appear as the hand reaches them.
//   the launch  its views add up as every post lands; the label at the bottom reads the hour, then "24h window".
// Drawn once at a fixed size and scaled to the box, so the composition never reflows; phones get their own, sparser
// drawing. Loops while on screen with a long hold on the finished picture. Reduced motion: the finished picture.

const CYCLE = 16; // seconds
const SWEEP = [1, 9] as const; // when the hand runs 0 → 24h
const HOLD_END = 14.6; // the finished picture stays until here, then fades
const FIRST_SHARE = 0.4; // of the sweep, spent inside the first hour
const START = -7.5; // degrees: the dial is turned so the first hour sits centred at the top
const GREEN = "#22c26a";
const k = (n: number) => `${Math.round(n / 1000)}K`;
const r1 = (n: number) => Math.round(n * 10) / 10; // rounded, so the server and the browser draw identical numbers

/** The hour the hand is at when it is `u` (0–1) through the sweep: steady through the first hour, then quick, settling at 24. */
const hourAt = (u: number) => (u <= FIRST_SHARE ? u / FIRST_SHARE : 1 + 23 * (1 - (1 - (u - FIRST_SHARE) / (1 - FIRST_SHARE)) ** 2));

// The two drawings: desktop/tablet (16:10) and phone (5:4). All numbers are px in the drawing's own size.
const WIDE = {
  W: 598, H: 374, cx: 299, cy: 225, rx: 243, ry: 113, depth: 12, lift: 4,
  chip: { w: 84, h: 36, y: 12, arc: [18, 6, 0], pad: 16 },
  pill: { w: 194, h: 30, y: 64 },
  card: { w: 224, y: 150 },
  later: { w: 84, h: 36, y: 328, inset: 16 },
  win: { w: 132, h: 28, y: 332 },
};
const PHONE: typeof WIDE = {
  W: 340, H: 272, cx: 170, cy: 175, rx: 152, ry: 69, depth: 8, lift: 3,
  chip: { w: 44, h: 52, y: 8, arc: [8, 3, 0], pad: 8 },
  pill: { w: 172, h: 26, y: 68 },
  card: { w: 192, y: 136 },
  later: { w: 68, h: 28, y: 240, inset: 6 },
  win: { w: 110, h: 26, y: 242 },
};
type Layout = typeof WIDE;
const BAND = 0.72; // inner edge of the rim band, as a share of the radius

/** A point on the dial: `deg` clockwise from the top, `scale` out from the centre. */
const pt = (L: Layout, deg: number, scale: number) =>
  [r1(L.cx + scale * L.rx * Math.sin((deg * Math.PI) / 180)), r1(L.cy - scale * L.ry * Math.cos((deg * Math.PI) / 180))] as const;
/** The rim band between two angles. */
function band(L: Layout, from: number, to: number) {
  if (to - from <= 0.2) return "";
  const steps = Math.max(2, Math.ceil((to - from) / 4));
  const angles = Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps);
  const ring = [...angles.map((a) => pt(L, a, 0.985)), ...angles.reverse().map((a) => pt(L, a, BAND + 0.015))];
  return `M${ring.map((p) => `${p[0]} ${p[1]}`).join("L")}Z`;
}

/**
 * Seconds into a `cycle`-second loop while the scene is on screen (`settled`, the finished picture, with reduced
 * motion), and the box's measured size (null until measured). Shared with the campaign scene beside this one.
 */
export function useScene(seen: boolean, cycle: number, settled: number) {
  const [t, setT] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const still = useStill();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el || !seen || still) return;
    let raf = 0;
    let visible = true;
    let origin = 0;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const tick = (now: number) => {
      origin ||= now;
      if (visible) setT(((now - origin) / 1000) % cycle);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [seen, still, cycle]);
  return { box, t: still ? settled : t, still, size };
}

export const RING = "shadow-[0_0_0_1px_rgb(15_26_20/0.08),0_8px_16px_-8px_rgb(15_26_20/0.3)]";

/** One creator's post: photo with its platform, and the views it brought. `stack` puts the number under the photo. */
function Post({ who, platform, views, shown, size }: { who: string; platform: Platform; views: number; shown: number; size: "lg" | "sm" | "stack" }) {
  const face = size === "sm" ? "size-[22px]" : "size-7";
  return (
    <span
      className={`flex size-full items-center justify-center rounded-full bg-white ${RING} ${size === "stack" ? "flex-col gap-0.5 rounded-xl" : size === "sm" ? "gap-1.5 pr-1.5" : "gap-2 pr-2"}`}
    >
      <span className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- creator photos */}
        <img src={`/services/creators/webai/${who}.jpg`} alt="" className={`${face} rounded-full object-cover`} />
        <span className="absolute -right-1 -bottom-1 grid size-[15px] place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.1)]">
          <PlatformIcon platform={platform} className={`size-[9px] ${platform === "linkedin" ? "text-[#0a66c2]" : "text-ink"}`} />
        </span>
      </span>
      <span className={`font-semibold tracking-[-0.02em] text-ink tabular-nums ${size === "lg" ? "text-[16px]" : "text-[13.5px]"} leading-none`}>{k(views * out3(shown))}</span>
    </span>
  );
}

export default function LaunchAmplification({ seen }: { seen: boolean }) {
  const { box, t, still, size } = useScene(seen, CYCLE, SWEEP[1] + 1);
  const phone = !!size && size.h / size.w > 0.7;
  const L = phone ? PHONE : WIDE;
  const u = clamp01((t - SWEEP[0]) / (SWEEP[1] - SWEEP[0]));
  const hour = hourAt(u);
  const deg = START + hour * 15;
  const fade = still ? 1 : seg(t, 0, 0.6) * (1 - seg(t, HOLD_END, CYCLE - 0.6));
  const done = u >= 1;

  // Each post lands as the hand passes its moment.
  const first = A.first.map((p, i) => {
    const edge = Math.min(i, A.first.length - 1 - i); // 0 at the ends of the arc, 2 in the middle
    const x = L.chip.pad + (i * (L.W - 2 * L.chip.pad - L.chip.w)) / (A.first.length - 1);
    return { ...p, x, y: L.chip.y + L.chip.arc[edge], edge, left: i < A.first.length / 2, turn: (i - 2.5) * 1.6, shown: seg(hour, (i + 0.35) / 6.6, (i + 0.35) / 6.6 + 0.13) };
  });
  const later = A.later.map((p) => {
    const at = pt(L, START + p.hour * 15, 1);
    // Under its pin, kept inside the drawing.
    const x = Math.min(L.W - L.later.inset - L.later.w, Math.max(L.later.inset, at[0] - L.later.w / 2));
    return { ...p, at, x, shown: seg(hour, p.hour, p.hour + 1.6) };
  });
  const total = [...first, ...later].reduce((sum, p) => sum + p.views * out3(p.shown), 0);

  const pillX = L.cx - L.pill.w / 2;
  const pillMid = L.pill.y + L.pill.h / 2;
  const top = L.cy - L.ry; // the rim's far edge, where the first hour is
  const [hx1, hy1] = pt(L, deg, 0.2);
  const [hx2, hy2] = pt(L, deg, 1);
  const wedge = band(L, START, START + 15);
  const mid = (y: number) => r1((y + L.later.y) / 2);
  const hours = phone ? [6, 18] : [6, 12, 18];

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      <div className="relative origin-top-left" style={{ width: L.W, height: L.H, transform: `scale(${size ? size.w / L.W : 1})`, opacity: size ? fade : 0 }}>
        <svg viewBox={`0 0 ${L.W} ${L.H}`} className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <linearGradient id="amp-face" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f3f2ec" />
            </linearGradient>
            <linearGradient id="amp-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#cfcdc3" />
              <stop offset="0.5" stopColor="#e2e0d8" />
              <stop offset="1" stopColor="#cfcdc3" />
            </linearGradient>
            <filter id="amp-blur" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation={phone ? 6 : 10} />
            </filter>
          </defs>

          {/* The plate: ground shadow, its thick edge, the face, and the sunken centre. */}
          <ellipse cx={L.cx} cy={L.cy + L.depth + 12} rx={L.rx - 14} ry={L.ry - 6} fill="rgb(15 26 20 / 0.2)" filter="url(#amp-blur)" />
          <rect x={L.cx - L.rx} y={L.cy} width={L.rx * 2} height={L.depth} fill="url(#amp-edge)" />
          <ellipse cx={L.cx} cy={L.cy + L.depth} rx={L.rx} ry={L.ry} fill="url(#amp-edge)" />
          <ellipse cx={L.cx} cy={L.cy} rx={L.rx} ry={L.ry} fill="url(#amp-face)" stroke="rgb(15 26 20 / 0.12)" />
          <ellipse cx={L.cx} cy={L.cy} rx={r1(L.rx * BAND)} ry={r1(L.ry * BAND)} fill="#f4f3ed" stroke="rgb(15 26 20 / 0.09)" />
          <ellipse cx={L.cx} cy={L.cy + L.ry * 0.42} rx={L.card.w * 0.5} ry={L.ry * 0.2} fill="rgb(15 26 20 / 0.16)" filter="url(#amp-blur)" />

          {/* The hours gone by fill in behind the hand. */}
          <path d={band(L, START, deg)} fill={GREEN} opacity="0.2" />
          {/* An hour mark every hour (not where a label or the first hour sits). */}
          {Array.from({ length: 24 }, (_, h) => {
            if (h < 2 || hours.includes(h)) return null;
            const [x1, y1] = pt(L, START + h * 15, 0.82);
            const [x2, y2] = pt(L, START + h * 15, 0.93);
            return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(15 26 20 / 0.3)" strokeWidth="1.5" strokeLinecap="round" />;
          })}

          {/* The first hour: a raised green segment, and the label's stem down to it. */}
          <path d={wedge} fill="#129a4f" />
          <path d={wedge} fill={GREEN} transform={`translate(0 ${-L.lift})`} />
          <line x1={L.cx} y1={L.pill.y + L.pill.h} x2={L.cx} y2={top} stroke={GREEN} strokeWidth="2" />

          {/* The hand. */}
          <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} stroke="#16211b" strokeWidth={phone ? 2.5 : 3} strokeLinecap="round" />
          <circle cx={hx2} cy={hy2} r={phone ? 5 : 6} fill="#fff" stroke="#16211b" strokeWidth="2.5" />

          {/* Each first-hour post is tied into the label. */}
          {first.map((p, i) => {
            const x = r1(p.x + L.chip.w / 2);
            const y = p.y + L.chip.h - 1;
            const d =
              p.edge === 2
                ? `M${x} ${y}L${x} ${L.pill.y}`
                : `M${x} ${y}C${x} ${pillMid} ${x} ${pillMid} ${p.left ? pillX : pillX + L.pill.w} ${pillMid}`;
            return <path key={i} d={d} fill="none" stroke={GREEN} strokeWidth="1.5" style={{ opacity: p.shown * 0.75 }} />;
          })}

          {/* The later posts' pins on the rim. */}
          {later.map((p) => (
            <g key={p.hour} style={{ opacity: p.shown }}>
              <path d={`M${p.at[0]} ${p.at[1]}C${p.at[0]} ${mid(p.at[1])} ${r1(p.x + L.later.w / 2)} ${mid(p.at[1])} ${r1(p.x + L.later.w / 2)} ${L.later.y}`} fill="none" stroke={GREEN} strokeWidth="1.5" />
              <circle cx={p.at[0]} cy={p.at[1]} r="4.5" fill={GREEN} stroke="#fff" strokeWidth="2" />
            </g>
          ))}
        </svg>

        {/* Hours on the rim; each darkens once the hand has passed it. */}
        {hours.map((h) => {
          const [x, y] = pt(L, START + h * 15, (1 + BAND) / 2);
          return (
            <span key={h} className={`absolute -translate-1/2 font-semibold text-ink ${phone ? "text-[13px]" : "text-[14px]"}`} style={{ left: x, top: y, opacity: 0.45 + 0.55 * seg(hour, h - 0.5, h + 0.5) }}>
              {h}h
            </span>
          );
        })}

        {/* The first hour: its label, and the six posts. */}
        <p
          className={`absolute flex items-center justify-center gap-2 rounded-full bg-white font-semibold whitespace-nowrap text-ink shadow-[0_0_0_1.5px_#22c26a,0_8px_18px_-8px_rgb(15_26_20/0.3)] ${phone ? "text-[13.5px]" : "text-[15px]"}`}
          style={{ left: pillX, top: L.pill.y, width: L.pill.w, height: L.pill.h }}
        >
          <span className="size-2 rounded-full" style={{ background: GREEN }} />
          {A.pill}
        </p>
        {first.map((p) => (
          <span
            key={p.who}
            className="absolute"
            style={{ left: p.x, top: p.y, width: L.chip.w, height: L.chip.h, opacity: p.shown, transform: `translateY(${r1((1 - p.shown) * 10)}px) rotate(${p.turn}deg) scale(${r1(0.9 + 0.1 * p.shown)})` }}
          >
            <Post {...p} size={phone ? "stack" : "lg"} />
          </span>
        ))}

        {/* The two later posts, under their pins. */}
        {later.map((p) => (
          <span
            key={p.who}
            className="absolute"
            style={{ left: p.x, top: L.later.y, width: L.later.w, height: L.later.h, opacity: p.shown, transform: `translateY(${r1((1 - p.shown) * 8)}px)` }}
          >
            <Post {...p} size={phone ? "sm" : "lg"} />
          </span>
        ))}

        {/* The launch itself, standing on the dial. */}
        <div
          className={`absolute rounded-2xl bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.08),0_2px_4px_rgb(15_26_20/0.06),0_24px_36px_-16px_rgb(15_26_20/0.4)] ${phone ? "p-2" : "p-3"}`}
          style={{ left: L.cx - L.card.w / 2, top: L.card.y, width: L.card.w }}
        >
          <div className="flex items-center gap-2">
            <span className={`grid shrink-0 place-items-center rounded-md bg-ink ${phone ? "size-5" : "size-6"}`}>
              <span className="size-2 rounded-[2px] bg-primary" />
            </span>
            <p className={`min-w-0 flex-1 truncate font-semibold tracking-[-0.01em] text-ink ${phone ? "text-[14px]" : "text-[16px]"}`}>{A.product.name}</p>
            <PlatformIcon platform="x" className={`text-ink ${phone ? "size-3" : "size-3.5"}`} />
            <PlatformIcon platform="linkedin" className={`text-[#0a66c2] ${phone ? "size-3" : "size-3.5"}`} />
          </div>
          {!phone && <p className="mt-2 text-[14px] leading-[1.3] text-ink/75">{A.product.text}</p>}
          <p className={`flex items-center justify-between rounded-lg bg-[#f3f2ec] ${phone ? "mt-1.5 px-2 py-1" : "mt-2.5 px-2.5 py-1.5"}`}>
            <span className={`text-ink/70 ${phone ? "text-[13px]" : "text-[14px]"}`}>{A.product.label}</span>
            <span className={`leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums ${phone ? "text-[23px]" : "text-[28px]"}`}>{k(total)}</span>
          </p>
        </div>

        {/* The clock: the hour the hand is in, then the window once it has gone round. */}
        <p
          className={`absolute grid place-items-center rounded-full bg-white font-semibold whitespace-nowrap text-ink tabular-nums ${RING} ${phone ? "text-[13px]" : "text-[14px]"}`}
          style={{ left: L.cx - L.win.w / 2, top: L.win.y, width: L.win.w, height: L.win.h }}
        >
          {done ? A.window : `Hour ${Math.max(1, Math.ceil(hour))} of 24`}
        </p>
      </div>
    </div>
  );
}
