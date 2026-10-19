"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { At, Billboard, Box, IsoScene, Panel } from "../iso";
import { PLATFORM_COLOR, PlatformIcon, type Platform } from "../kit";
import { CREATORS, HERO_POSTS, LAUNCH, type HeroPost } from "./content";

// The hero visual, "one launch, everywhere", on the page's light isometric floor: the launch sits at the
// center as a glowing pad; one after another a pulse runs out across the floor and a creator's post rises
// above it (X, LinkedIn, YouTube, a newsletter), tethered to the floor by a stem of light, with its views.
// The launch's reach totals up above the pad. The posts are billboards (they face the reader), so they
// stay crisp; one clock drives everything, with no CSS transitions on driven values, so it's smooth.

const CYCLE_MS = 9000;
const PAD = { x: 230, y: 250, size: 110 };
// Floor positions are picked so each post lands at a set spot on screen around the pad (iso: screen x ∝
// x + y, screen y ∝ y − x): left and right of it, and behind it to either side, keeping the front clear
// for the reach card.
const PAD_CENTER = { x: PAD.x + PAD.size / 2, y: PAD.y + PAD.size / 2 };

// Where each channel's post floats: its stem's foot on the floor and how high it hovers.
const SPOTS = [
  { x: 395, y: 75, z: 96 }, // behind, left
  { x: 515, y: 195, z: 96 }, // behind, right
  { x: 165, y: 213, z: 118 }, // left
  { x: 377, y: 425, z: 118 }, // right
];
const START = (i: number) => 0.12 + i * 0.15; // when post i goes out
const RISE = 0.09; // how long a post takes to rise

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - (1 - v) ** 3;

/** The essentials of a post for the stage: its channel, one line, and its views. */
function brief(p: HeroPost): { platform: Platform; line: string; views: string } {
  switch (p.kind) {
    case "x":
      return { platform: "x", line: p.text, views: p.views };
    case "linkedin":
      return { platform: "linkedin", line: p.text, views: `${Math.round(p.reach / 1000)}K` };
    case "youtube":
      return { platform: "youtube", line: p.title, views: p.views.replace(" views", "") };
    case "newsletter":
      return { platform: "newsletter", line: p.subject, views: p.readers.replace(" readers", "") };
  }
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
  const pad = clamp01(t / 0.08) * out;
  const posts = HERO_POSTS.map((p, i) => ({ post: p, b: brief(p), k: ease(clamp01((t - START(i)) / RISE)) * out }));
  const reach = posts.reduce((sum, { post, k }) => sum + post.reach * k, 0);
  const still = { transition: "none" } as const;

  return (
    <div ref={box} aria-hidden="true" className="w-full">
      <IsoScene w={520} h={540} floor={560} shift={[-10, 125]} className="w-full rounded-2xl">
        {/* Light pooling around the pad as the launch goes out. */}
        <At x={PAD_CENTER.x - 230} y={PAD_CENTER.y - 230} style={still}>
          <div
            className="size-[460px] rounded-full bg-[radial-gradient(closest-side,rgb(25_231_110/0.38),transparent)]"
            style={{ opacity: 0.25 + 0.75 * pad }}
          />
        </At>

        {/* The pulse paths across the floor, from the pad to each post's stem. */}
        <At x={0} y={0} style={still}>
          <svg width={560} height={560} className="overflow-visible">
            {posts.map(({ k }, i) => {
              const s = SPOTS[i];
              const travel = clamp01((t - START(i) + 0.06) / 0.07) * out;
              return (
                <g key={i}>
                  <line x1={PAD_CENTER.x} y1={PAD_CENTER.y} x2={s.x} y2={s.y} stroke="rgb(23 44 33 / 0.14)" strokeWidth={2} strokeDasharray="4 6" />
                  <line
                    x1={PAD_CENTER.x}
                    y1={PAD_CENTER.y}
                    x2={PAD_CENTER.x + (s.x - PAD_CENTER.x) * travel}
                    y2={PAD_CENTER.y + (s.y - PAD_CENTER.y) * travel}
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                  />
                  {travel > 0 && travel < 1 && (
                    <circle cx={PAD_CENTER.x + (s.x - PAD_CENTER.x) * travel} cy={PAD_CENTER.y + (s.y - PAD_CENTER.y) * travel} r={6} fill="var(--primary)" />
                  )}
                  {/* The stem's footprint. */}
                  <circle cx={s.x} cy={s.y} r={9} fill="var(--primary)" opacity={0.15 + 0.6 * k} />
                </g>
              );
            })}
          </svg>
        </At>

        {/* The launch pad: a low block with the product on it and a green rim when it's live. */}
        <Box x={PAD.x} y={PAD.y} w={PAD.size} d={PAD.size} h={16} top="#ffffff" front="#d9e7dd" side="#c3d6c8" style={still}>
          <div className="grid size-full place-items-center" style={{ boxShadow: `inset 0 0 0 ${2 + 2 * pad}px rgb(25 231 110 / ${pad})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- sample product logo */}
            <img src={LAUNCH.company.logo} alt="" className="w-[64%]" />
          </div>
        </Box>

        {/* Launch reach, in front of the pad: plain text driven by the clock, so it ticks without glitches. */}
        <Billboard x={130} y={460} z={4} center style={{ ...still, opacity: pad }}>
          <div className="rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-[0_18px_40px_-18px_rgb(23_44_33/0.45)]">
            <p className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.12em] whitespace-nowrap text-ink/50 uppercase">
              <span className="size-1.5 rounded-full bg-primary" />
              Launch reach
            </p>
            <p className="mt-1 text-[26px] leading-none font-medium tracking-[-0.045em] text-ink tabular-nums">{reach < 1e6 ? `${Math.round(reach / 1e3)}K` : `${(reach / 1e6).toFixed(2)}M`}</p>
          </div>
        </Billboard>

        {/* The posts, rising above their stems as each channel goes live. */}
        {posts.map(({ post, b, k }, i) => {
          const s = SPOTS[i];
          const z = s.z - 50 * (1 - k);
          return (
            <Fragment key={i}>
              {/* The stem: a thin standing line of light from the floor up to the post. */}
              <Panel x={s.x - 1} y={s.y} w={2} h={Math.max(1, z)} shadow={false} style={{ ...still, opacity: k }} className="bg-[linear-gradient(0deg,rgb(25_231_110/0.15),var(--primary))]" />
              <Billboard x={s.x} y={s.y} z={z} center style={{ ...still, opacity: k }}>
                <MiniPost post={post} b={b} />
              </Billboard>
            </Fragment>
          );
        })}
      </IsoScene>
    </div>
  );
}

function MiniPost({ post, b }: { post: HeroPost; b: ReturnType<typeof brief> }) {
  const c = CREATORS[post.creator];
  return (
    <article className="w-[180px] rounded-xl border border-black/[0.07] bg-white p-3 shadow-[0_24px_44px_-22px_rgb(23_44_33/0.5)]">
      <header className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
        <img src={c.photo} alt="" className="size-7 rounded-full object-cover" />
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[11.5px] font-semibold text-ink">{c.name}</span>
          <span className="block truncate text-[10px] text-ink/50">{c.handle}</span>
        </p>
        <PlatformIcon platform={b.platform} className="size-3.5" style={{ color: PLATFORM_COLOR[b.platform] }} />
      </header>
      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-ink/80">{b.line}</p>
      <footer className="mt-2.5 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
        <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink/45 uppercase">Views</span>
        <span className="text-[15px] leading-none font-semibold tracking-[-0.03em] text-ink">{b.views}</span>
      </footer>
    </article>
  );
}
