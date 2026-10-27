"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Billboard, At, IsoScene } from "../iso";
import { PLATFORM_COLOR, PlatformIcon } from "../kit";
import { HERO_LAUNCH, type LaunchPost } from "./content";

// The hero visual: webAI's TwIL-LM3-Pro launch over its first 48 hours, in three beats on the iso floor.
// 1. webAI posts. On its own the post reaches webAI's followers: the small dark disc under it.
// 2. Creators pick it up at their real hour marks. An arc draws out to each one and their post lands over
//    their own audience, a green disc sized by views. Three posts show in full; the biggest of the rest show
//    as faces, so the scale reads without the clutter.
// 3. The early engagement makes X push it further: one soft disc spreads out under everything. Those views
//    are already inside the creators' numbers, so the tally doesn't count them twice.
// The tally under the floor counts each beat as it lands and ends on the comparison with webAI alone, so the
// final frame tells the whole story by itself (it's also the still frame, shown before and without motion).
// One clock drives everything, with no CSS transitions on driven values, so it's smooth.

const CYCLE_MS = 13000;
const W = 520;
const H = 600;
const FLOOR = 640;

/** The floor point that lands at (sx, sy) in the drawing, so the layout below is authored on screen. */
function floorAt(sx: number, sy: number) {
  const a = (sx - W / 2) / Math.SQRT1_2; // iso: screen x = (x + y)·√½, screen y = (y − x)·√½·½
  const b = (sy - H / 2) / (Math.SQRT1_2 / 2);
  return { x: FLOOR / 2 + (a - b) / 2, y: FLOOR / 2 + (a + b) / 2 };
}

// Where each audience disc sits on screen; posts float LIFT above theirs. The bottom of the drawing stays
// clear for the tally, which overlaps it.
const LAUNCH_AT = floorAt(250, 350);
const FEATURED_AT = [floorAt(118, 215), floorAt(395, 175), floorAt(430, 375)];
const FACES_AT = [floorAt(66, 300), floorAt(245, 128), floorAt(470, 478), floorAt(158, 380), floorAt(262, 45), floorAt(52, 470)];
const LIFT = 36;

const POSTS = HERO_LAUNCH.posts; // in hour order
const FEATURED = POSTS.filter((p) => p.featured).slice(0, FEATURED_AT.length);
const FACES = POSTS.filter((p) => !FEATURED.includes(p)).sort((a, b) => b.views - a.views); // biggest get spots
// Creators past the face spots still count toward the reach; they just aren't drawn.
const CAST = POSTS.map((p, i) => {
  const f = FEATURED.indexOf(p);
  return { p, i, featured: f >= 0, at: f >= 0 ? FEATURED_AT[f] : FACES_AT[FACES.indexOf(p)] };
}).filter((c) => c.at);

const CREATOR_VIEWS = POSTS.reduce((sum, p) => sum + p.views, 0);
const TOTAL = HERO_LAUNCH.views + CREATOR_VIEWS;
const END_HOUR = 48;
const photo = (handle: string) => `/services/creators/webai/${handle}.jpg`;

// The beats on the clock (0–1 of a cycle).
const OWN = 0.02; // webAI posts
const RISE = 0.06; // how long a post takes to land
const TRAVEL = 0.05; // the arc out to a creator, just before their post lands
const START = (i: number) => 0.13 + (i * 0.36) / Math.max(1, POSTS.length - 1); // creator i's post lands
const PUSH = [0.56, 0.74] as const; // the platforms push it further
const PUSH_R = 250; // the platforms' reach, in floor pixels
const COMET = 0.16; // the comet's tail, as a share of its arc

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - (1 - v) ** 3;
const fmt = (n: number) => (n < 1e6 ? `${Math.round(n / 1e3)}K` : `${(n / 1e6).toFixed(2)}M`);
const disc = (views: number) => Math.sqrt(views) * 0.065; // area tracks views

/** A gentle arc across the floor from the edge of webAI's own audience to a creator, bowing to one side. */
function arc(to: { x: number; y: number }) {
  const r0 = disc(HERO_LAUNCH.views);
  const d = Math.hypot(to.x - LAUNCH_AT.x, to.y - LAUNCH_AT.y) || 1;
  const x = LAUNCH_AT.x + ((to.x - LAUNCH_AT.x) / d) * r0;
  const y = LAUNCH_AT.y + ((to.y - LAUNCH_AT.y) / d) * r0;
  const dx = to.x - x;
  const dy = to.y - y;
  const cx = x + dx / 2 - dy * 0.2;
  const cy = y + dy / 2 + dx * 0.2;
  return `M${x} ${y} Q${cx} ${cy} ${to.x} ${to.y}`;
}

// The launch's clock, in hours: 0 when webAI posts, each creator's hour as their post lands, 48 at the end.
const HOURS: [number, number][] = [[OWN + RISE, 0], ...POSTS.map((p, i): [number, number] => [START(i) + RISE, p.hour]), [PUSH[1], END_HOUR]];
function hourAt(t: number) {
  if (t <= HOURS[0][0]) return 0;
  for (let i = 1; i < HOURS.length; i++) {
    const [t1, h1] = HOURS[i];
    const [t0, h0] = HOURS[i - 1];
    if (t <= t1) return h0 + (h1 - h0) * ((t - t0) / (t1 - t0 || 1));
  }
  return END_HOUR;
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
  const out = 1 - clamp01((t - 0.93) / 0.06); // the whole launch eases away before it replays
  const own = ease(clamp01((t - OWN) / RISE)) * out;
  const landed = POSTS.map((_, i) => ease(clamp01((t - START(i)) / RISE)) * out);
  const push = ease(clamp01((t - PUSH[0]) / (PUSH[1] - PUSH[0]))) * out;
  const creators = POSTS.reduce((sum, p, i) => sum + p.views * landed[i], 0);
  const reach = HERO_LAUNCH.views * own + creators;
  const still = { transition: "none" } as const;

  const beats = [
    { label: "webAI's own post", value: HERO_LAUNCH.views * own, on: own, swatch: "bg-ink" },
    { label: `${POSTS.length} creators pick it up`, value: creators, on: landed[0], swatch: "bg-primary" },
    { label: "X pushes it further", value: null, on: push, swatch: "bg-ink/15" },
  ];

  return (
    <div ref={box} aria-hidden="true" className="w-full">
      <IsoScene w={W} h={H} floor={FLOOR} grid={0} theme="paper" className="w-full rounded-2xl">
        <At x={0} y={0} style={still}>
          <svg width={FLOOR} height={FLOOR} className="overflow-visible">
            <defs>
              <radialGradient id="hero-push">
                <stop offset="0" stopColor="rgb(28 27 24)" stopOpacity={0.1} />
                <stop offset="0.8" stopColor="rgb(28 27 24)" stopOpacity={0.05} />
                <stop offset="1" stopColor="rgb(28 27 24)" stopOpacity={0} />
              </radialGradient>
              {/* A soft pool of ink, deepest under the post and fading out at the edge: no outline. */}
              <radialGradient id="hero-own">
                <stop offset="0" stopColor="rgb(23 44 33)" stopOpacity={0.16} />
                <stop offset="0.8" stopColor="rgb(23 44 33)" stopOpacity={0.1} />
                <stop offset="0.93" stopColor="rgb(23 44 33)" stopOpacity={0.07} />
                <stop offset="1" stopColor="rgb(23 44 33)" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="hero-audience">
                <stop offset="0" stopColor="rgb(25 231 110)" stopOpacity={0.32} />
                <stop offset="1" stopColor="rgb(25 231 110)" stopOpacity={0.1} />
              </radialGradient>
            </defs>

            {/* Beat 3: the platforms' push, under everything. */}
            <circle cx={LAUNCH_AT.x} cy={LAUNCH_AT.y} r={PUSH_R * push} fill="url(#hero-push)" />

            {/* Beat 2: an arc draws out to each creator with a comet at its head, then their audience lands and
                the arc settles back to a faint trace, so the final frame isn't a web of lines. */}
            {CAST.map(({ p, i, at }) => {
              const draw = clamp01((t - START(i) + TRAVEL) / TRAVEL) * out;
              const k = landed[i];
              const ping = clamp01((t - START(i)) / 0.08);
              const r = disc(p.views);
              const d = arc(at);
              return (
                <g key={i}>
                  <path d={d} pathLength={1} fill="none" stroke="var(--ink)" strokeOpacity={0.22 - 0.14 * k} strokeWidth={1.25} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
                  {draw > 0 && draw < 1 && (
                    <path d={d} pathLength={1} fill="none" stroke="var(--primary)" strokeWidth={3} strokeLinecap="round" strokeDasharray={`${COMET} 2`} strokeDashoffset={COMET - draw} />
                  )}
                  {ping > 0 && ping < 1 && (
                    <circle cx={at.x} cy={at.y} r={r * (1 + 0.8 * ease(ping))} fill="none" stroke="var(--primary)" strokeWidth={1.5} opacity={0.7 * (1 - ping)} />
                  )}
                  <circle cx={at.x} cy={at.y} r={r * k} fill="url(#hero-audience)" stroke="var(--primary)" strokeOpacity={0.85} strokeWidth={1.25} />
                </g>
              );
            })}

            {/* Beat 1: webAI's own audience. The pool fades past the disc's true radius, so its visible body
                still reads at the right size against the creators' discs. */}
            <circle cx={LAUNCH_AT.x} cy={LAUNCH_AT.y} r={disc(HERO_LAUNCH.views) * 1.05 * own} fill="url(#hero-own)" />
          </svg>
        </At>

        <Billboard x={LAUNCH_AT.x} y={LAUNCH_AT.y} z={LIFT - 14 * (1 - own)} center style={{ ...still, opacity: own, pointerEvents: own > 0.5 ? "auto" : "none" }}>
          <PostLink href={HERO_LAUNCH.url}>
            <LaunchCard />
          </PostLink>
        </Billboard>

        {/* The Devable mark, standing on webAI's audience pool as a token. */}
        <Billboard x={LAUNCH_AT.x} y={LAUNCH_AT.y} z={2} center style={{ ...still, opacity: own }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
          <img src="/brand/devable-mark.png" alt="" className="size-7 max-w-none rounded-[8px] shadow-[0_0_0_2px_#fff,0_10px_20px_-8px_rgb(28_27_24/0.55)]" />
        </Billboard>

        {CAST.map(({ p, i, at, featured }) => (
          <Billboard
            key={i}
            x={at.x}
            y={at.y}
            z={(featured ? LIFT : 12) - 14 * (1 - landed[i])}
            center
            style={{ ...still, opacity: landed[i], pointerEvents: landed[i] > 0.5 ? "auto" : "none" }}
          >
            <PostLink href={p.url} round={!featured}>
              {featured ? (
                <CreatorCard post={p} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- creator photos
                <img src={photo(p.handle)} alt="" className="size-7 max-w-none rounded-full object-cover shadow-[0_0_0_2px_#fff,0_8px_16px_-6px_rgb(28_27_24/0.5)]" />
              )}
            </PostLink>
          </Billboard>
        ))}
      </IsoScene>

      {/* The tally, flat over the clear front of the floor (pulled up by a share of the width, so it tracks the
          scene's scale) at full size so it reads on phones: each beat's reach as it lands, the 24h total, and
          how far that is past webAI alone. */}
      <div className="relative mx-auto -mt-[37%] w-[calc(100%-2rem)] max-w-[19rem] rounded-2xl border border-black/[0.07] bg-white/95 p-4 shadow-[0_1px_2px_rgb(28_27_24/0.05),0_24px_48px_-24px_rgb(28_27_24/0.45)] backdrop-blur-sm">
        <p className="flex items-center justify-between font-mono text-[9.5px] tracking-[0.12em] whitespace-nowrap text-ink/50 uppercase">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            webAI launch reach
          </span>
          <span className="tabular-nums">Hour {Math.round(hourAt(t))} / {END_HOUR}</span>
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[28px] leading-none font-medium tracking-[-0.045em] text-ink tabular-nums">{fmt(reach)}</p>
          <p className="rounded-full bg-primary px-2 py-1 text-[11px] leading-none font-semibold text-ink tabular-nums" style={{ opacity: own }}>
            {Math.max(1, reach / HERO_LAUNCH.views).toFixed(1)}× webAI alone
          </p>
        </div>
        <div className="mt-3 flex h-1.5 gap-px overflow-hidden rounded-full bg-ink/[0.06]">
          {beats.map((b) => (
            <span key={b.label} className={b.swatch} style={{ width: `${((b.value ?? 0) / TOTAL) * 100}%` }} />
          ))}
        </div>
        <ol className="mt-3 space-y-1.5 text-[11.5px] text-ink/75">
          {beats.map((b) => (
            <li key={b.label} className="flex items-center gap-2" style={{ opacity: 0.35 + 0.65 * b.on }}>
              <span className={`size-2 shrink-0 rounded-full ${b.swatch}`} />
              <span className="flex-1">{b.label}</span>
              {b.value === null ? (
                <span className="text-ink/45">included</span>
              ) : (
                <span className="font-medium text-ink tabular-nums">{fmt(b.value)}</span>
              )}
            </li>
          ))}
        </ol>
        {/* Every creator, in the order they posted, each opening their post. Faces fill in as they land. */}
        <ul className="mt-3 flex -space-x-1.5 border-t border-ink/[0.06] pt-3">
          {POSTS.map((p, i) => (
            <li key={p.handle} style={{ opacity: 0.25 + 0.75 * landed[i] }}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} title={`${p.name} on X`} className="block rounded-full transition-transform duration-300 hover:-translate-y-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- creator photos */}
                <img src={photo(p.handle)} alt="" className="size-[18px] max-w-none rounded-full object-cover ring-2 ring-white" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Opens the post on X. The scene is aria-hidden (decorative), so the links stay out of the tab order too. */
function PostLink({ href, round = false, children }: { href: string; round?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={-1}
      className={`block transition-transform duration-300 hover:-translate-y-0.5 ${round ? "rounded-full" : "rounded-[14px]"}`}
    >
      {children}
    </a>
  );
}

const CARD = "rounded-[14px] border border-black/[0.07] bg-white p-3 shadow-[0_1px_2px_rgb(28_27_24/0.06),0_22px_40px_-20px_rgb(28_27_24/0.5)]";

function LaunchCard() {
  return (
    <article className={`w-[180px] ${CARD}`}>
      <header className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- static client logo */}
        <img src={HERO_LAUNCH.company.logo} alt="" className="h-3.5" />
        <span className="rounded-full bg-ink px-1.5 py-[3px] font-mono text-[7.5px] leading-none tracking-[0.12em] text-white uppercase">Launch</span>
      </header>
      <p className="mt-2 line-clamp-3 text-[11px] leading-snug whitespace-pre-line text-ink/80">{HERO_LAUNCH.text}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[10px] text-ink/50">
        {/* eslint-disable-next-line @next/next/no-img-element -- creator photo */}
        <img src={HERO_LAUNCH.author.photo} alt="" className="size-4 rounded-full object-cover" />
        {HERO_LAUNCH.author.name}
      </p>
      <Footer when="Hour 0" views={HERO_LAUNCH.views} />
    </article>
  );
}

function CreatorCard({ post }: { post: LaunchPost }) {
  return (
    <article className={`w-[152px] ${CARD}`}>
      <header className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- creator photos */}
        <img src={photo(post.handle)} alt="" className="size-[22px] rounded-full object-cover" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">{post.name}</span>
        <PlatformIcon platform={post.platform} className="size-3" style={{ color: PLATFORM_COLOR[post.platform] }} />
      </header>
      <p className="mt-2 line-clamp-3 text-[10.5px] leading-snug whitespace-pre-line text-ink/75">{post.text}</p>
      <Footer when={post.hour < 1 ? `+${Math.round(post.hour * 60)}m` : `+${Math.round(post.hour)}h`} views={post.views} />
    </article>
  );
}

function Footer({ when, views }: { when: string; views: number }) {
  return (
    <footer className="mt-2.5 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
      <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink/45 uppercase">{when}</span>
      <span className="text-[13px] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">
        {fmt(views)} <span className="text-[9px] font-normal tracking-normal text-ink/45">views</span>
      </span>
    </footer>
  );
}
