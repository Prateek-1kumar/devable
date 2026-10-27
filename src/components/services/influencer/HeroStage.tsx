"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { At, Billboard, IsoScene, Panel } from "../iso";
import { PLATFORM_COLOR, PlatformIcon } from "../kit";
import { CREATORS, HERO_LAUNCH, type LaunchPost } from "./content";

// The hero visual: a real client launch over its first 24 hours, in three beats on the iso floor.
// 1. webAI posts; on its own the post reaches webAI's followers (the ink ring under it).
// 2. Creators pick it up at their real hour marks; each post rises with its own audience (a green ring).
// 3. The early engagement makes X and LinkedIn push it further, rippling out past both audiences.
// The card under the floor totals each beat as it lands and ends on the comparison with webAI alone, so the
// final frame tells the whole story by itself (it's also the still frame, shown before and without motion).
// One clock drives everything, with no CSS transitions on driven values, so it's smooth.

const CYCLE_MS = 12000;
const CENTER = { x: 260, y: 340 };

// Where each creator's post floats: its stem's foot on the floor and how high it hovers. Worked back from
// where each card should sit on screen (iso screen x ∝ x + y, y ∝ y − x − z): two above the launch post, two
// below it to either side, none covering it, and the bottom of the floor left clear for the tally.
const SPOTS = [
  { x: 277, y: 113, z: 100 }, // above, left
  { x: 487, y: 323, z: 100 }, // above, right
  { x: 33, y: 327, z: 30 }, // below, left
  { x: 273, y: 567, z: 30 }, // below, right
];

const OWN = 0.02; // webAI posts
const START = (i: number) => 0.14 + i * 0.1; // creator post i goes out
const RISE = 0.08;
const PUSH = [0.56, 0.72] as const; // the platforms push it further
const RIPPLES = [150, 220, 290];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - (1 - v) ** 3;
const fmt = (n: number) => (n < 1e6 ? `${Math.round(n / 1e3)}K` : `${(n / 1e6).toFixed(2)}M`);
const ring = (views: number) => Math.sqrt(views) * 0.075; // area tracks views

const POSTS = HERO_LAUNCH.posts;
const CREATOR_VIEWS = POSTS.reduce((sum, p) => sum + p.views, 0);
const PUSHED = HERO_LAUNCH.total - HERO_LAUNCH.views - CREATOR_VIEWS;

// The launch's clock, in hours: 0 when webAI posts, each creator's hour as their post lands, 24 at the end.
const HOURS: [number, number][] = [[OWN + RISE, 0], ...POSTS.map((p, i): [number, number] => [START(i) + RISE, p.hour]), [PUSH[1], 24]];
function hourAt(t: number) {
  if (t <= HOURS[0][0]) return 0;
  for (let i = 1; i < HOURS.length; i++) {
    const [t1, h1] = HOURS[i];
    const [t0, h0] = HOURS[i - 1];
    if (t <= t1) return h0 + (h1 - h0) * ((t - t0) / (t1 - t0));
  }
  return 24;
}

function useCycle(ms: number) {
  const box = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0.88); // the full picture, shown until (or instead of) the loop runs
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      setT(((now - start) % ms) / ms);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      start = 0;
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ms]);
  return [box, t] as const;
}

export default function HeroStage() {
  const [box, t] = useCycle(CYCLE_MS);
  const out = 1 - clamp01((t - 0.92) / 0.07); // the whole launch eases away before it replays
  const own = ease(clamp01((t - OWN) / RISE)) * out;
  const posts = POSTS.map((p, i) => ({ p, k: ease(clamp01((t - START(i)) / RISE)) * out }));
  const push = ease(clamp01((t - PUSH[0]) / (PUSH[1] - PUSH[0]))) * out;
  const creators = posts.reduce((sum, { p, k }) => sum + p.views * k, 0);
  const reach = HERO_LAUNCH.views * own + creators + PUSHED * push;
  const still = { transition: "none" } as const;

  const beats = [
    { label: "webAI's own post", value: HERO_LAUNCH.views * own, on: own, swatch: "bg-ink" },
    { label: `${POSTS.length} creators pick it up`, value: creators, on: posts[0].k, swatch: "bg-primary" },
    { label: "X & LinkedIn push it further", value: PUSHED * push, on: push, swatch: "bg-ink/20" },
  ];

  return (
    <div ref={box} aria-hidden="true" className="w-full">
      <IsoScene w={520} h={640} floor={600} theme="paper" className="w-full rounded-2xl">
        <At x={0} y={0} style={still}>
          <svg width={600} height={600} className="overflow-visible">
            {/* Beat 3: the platforms' push, rippling out past every audience. */}
            {RIPPLES.map((r, i) => {
              const k = clamp01(push * 1.4 - i * 0.2);
              return (
                <circle key={r} cx={CENTER.x} cy={CENTER.y} r={r * k} fill="none" stroke="rgb(28 27 24 / 0.45)" strokeWidth={1.75} strokeDasharray="5 7" opacity={k * (1 - i * 0.25)} />
              );
            })}
            {/* Beat 1: webAI's own audience. */}
            <circle cx={CENTER.x} cy={CENTER.y} r={ring(HERO_LAUNCH.views) * own} fill="rgb(28 27 24 / 0.06)" stroke="var(--ink)" strokeWidth={1.5} />
            {/* Beat 2: the path out to each creator, and their audience around the post. */}
            {posts.map(({ p, k }, i) => {
              const s = SPOTS[i];
              const travel = clamp01((t - START(i) + 0.06) / 0.07) * out;
              const x = CENTER.x + (s.x - CENTER.x) * travel;
              const y = CENTER.y + (s.y - CENTER.y) * travel;
              return (
                <g key={i}>
                  <line x1={CENTER.x} y1={CENTER.y} x2={s.x} y2={s.y} stroke="rgb(28 27 24 / 0.12)" strokeWidth={1.5} strokeDasharray="4 6" />
                  <line x1={CENTER.x} y1={CENTER.y} x2={x} y2={y} stroke="rgb(28 27 24 / 0.35)" strokeWidth={1.5} />
                  {travel > 0 && travel < 1 && <circle cx={x} cy={y} r={5} fill="var(--primary)" />}
                  <circle cx={s.x} cy={s.y} r={ring(p.views) * k} fill="rgb(25 231 110 / 0.08)" stroke="var(--primary)" strokeWidth={1.5} />
                  <circle cx={s.x} cy={s.y} r={4} fill="var(--primary)" opacity={k} />
                </g>
              );
            })}
          </svg>
        </At>

        {/* The launch post itself, standing at the center of its own audience. */}
        <Billboard x={CENTER.x} y={CENTER.y} z={6 + 14 * own} center style={{ ...still, opacity: own }}>
          <LaunchCard />
        </Billboard>

        {/* The creators' posts, rising above their stems as each one goes live. */}
        {posts.map(({ p, k }, i) => {
          const s = SPOTS[i];
          const z = s.z - 50 * (1 - k);
          return (
            <Fragment key={i}>
              <Panel x={s.x - 1} y={s.y} w={2} h={Math.max(1, z)} shadow={false} style={{ ...still, opacity: k }} className="bg-[linear-gradient(0deg,rgb(25_231_110/0.1),var(--primary))]" />
              <Billboard x={s.x} y={s.y} z={z} center style={{ ...still, opacity: k }}>
                <CreatorPost post={p} />
              </Billboard>
            </Fragment>
          );
        })}
      </IsoScene>

      {/* The tally, flat over the clear front of the floor (pulled up by a share of the width, so it tracks the
          scene's scale) at full size so it reads on phones: each beat's reach as it lands, the 24h total, and
          how far that is past webAI alone. */}
      <div className="relative mx-auto -mt-[37%] w-[calc(100%-2rem)] max-w-[19rem] rounded-xl border border-black/[0.07] bg-white/95 p-4 shadow-[0_18px_40px_-18px_rgb(28_27_24/0.45)] backdrop-blur-sm">
        <p className="flex items-center justify-between font-mono text-[9.5px] tracking-[0.12em] whitespace-nowrap text-ink/50 uppercase">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            webAI launch reach
          </span>
          <span className="tabular-nums">Hour {Math.round(hourAt(t))} / 24</span>
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[28px] leading-none font-medium tracking-[-0.045em] text-ink tabular-nums">{fmt(reach)}</p>
          <p className="rounded-full bg-primary px-2 py-1 text-[11px] leading-none font-semibold text-ink tabular-nums" style={{ opacity: own }}>
            {Math.max(1, Math.round(reach / HERO_LAUNCH.views))}× webAI alone
          </p>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-ink/[0.06]">
          {beats.map((b) => (
            <span key={b.label} className={b.swatch} style={{ width: `${(b.value / HERO_LAUNCH.total) * 100}%` }} />
          ))}
        </div>
        <ol className="mt-3 space-y-1.5 text-[11.5px] text-ink/75">
          {beats.map((b) => (
            <li key={b.label} className="flex items-center gap-2" style={{ opacity: 0.35 + 0.65 * b.on }}>
              <span className={`size-2 shrink-0 rounded-[2px] ${b.swatch}`} />
              <span className="flex-1">{b.label}</span>
              <span className="font-medium text-ink tabular-nums">{fmt(b.value)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function LaunchCard() {
  const c = HERO_LAUNCH.company;
  return (
    <article className="w-[176px] rounded-xl border border-black/[0.09] bg-white p-3 shadow-[0_24px_44px_-22px_rgb(28_27_24/0.5)]">
      <header className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- static client logo */}
        <img src={c.logo} alt="" className="mr-auto h-3.5" />
        <PlatformIcon platform="x" className="size-3.5" />
      </header>
      <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-ink/80">{HERO_LAUNCH.text}</p>
      <footer className="mt-2.5 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
        <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink/45 uppercase">Launch · hour 0</span>
        <span className="text-[15px] leading-none font-semibold tracking-[-0.03em] text-ink">{fmt(HERO_LAUNCH.views)}</span>
      </footer>
    </article>
  );
}

function CreatorPost({ post }: { post: LaunchPost }) {
  const c = CREATORS[post.creator];
  return (
    <article className="w-[164px] rounded-xl border border-black/[0.07] bg-white p-3 shadow-[0_24px_44px_-22px_rgb(28_27_24/0.5)]">
      <header className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
        <img src={c.photo} alt="" className="size-7 rounded-full object-cover" />
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[11.5px] font-semibold text-ink">{c.name}</span>
          <span className="block truncate text-[10px] text-ink/50">{c.handle}</span>
        </p>
        <PlatformIcon platform={post.platform} className="size-3.5" style={{ color: PLATFORM_COLOR[post.platform] }} />
      </header>
      <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-ink/80">{post.text}</p>
      <footer className="mt-2.5 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
        <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink/45 uppercase">+{post.hour}h</span>
        <span className="text-[15px] leading-none font-semibold tracking-[-0.03em] text-ink">{fmt(post.views)}</span>
      </footer>
    </article>
  );
}
