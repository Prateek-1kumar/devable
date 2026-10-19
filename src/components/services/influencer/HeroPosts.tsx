"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { PlatformIcon } from "../kit";
import { CREATORS, HERO_POSTS, LAUNCH, type HeroPost } from "./content";

// The hero visual: one launch as it showed up across channels, as a fanned stack of real-looking posts
// (X, LinkedIn, YouTube, a newsletter) in soft 3D. Every few seconds the front post slides off to the right
// and tucks in at the back while the rest step forward; a reach chip climbs as each post reaches the
// front. Hover pauses it; reduced motion holds the first post.

const HOLD_MS = 3400; // how long each post stays at the front
const EXIT_MS = 560; // how long the front post takes to slide out before rejoining at the back

// Where each depth sits in the stack, front (0) to back (3): up and to the right, further away, a touch
// turned, dimmer and softer, so the top and right edge of every post behind stays in view.
const SLOTS: CSSProperties[] = [0, 1, 2, 3].map((d) => ({
  transform: `translate3d(${d * 34}px, ${-d * 38}px, ${-d * 120}px) rotateZ(${d * 2.2}deg)`,
  opacity: [1, 0.92, 0.7, 0.42][d],
  filter: d ? `blur(${d * 0.35}px) saturate(${1 - d * 0.2})` : "none",
  zIndex: 10 - d,
}));
// Leaving the front: down and out to the left, turning away, fading, before rejoining at the back.
const EXIT: CSSProperties = {
  transform: "translate3d(-42%, 40px, 80px) rotateY(16deg) rotateZ(-5deg)",
  opacity: 0,
  filter: "none",
  zIndex: 11,
};

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export default function HeroPosts() {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const n = HERO_POSTS.length;
  const [step, setStep] = useState(0); // posts that have cycled to the back so far
  const [leaving, setLeaving] = useState(false); // the front post is sliding out
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (still || paused) return;
    let back: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setLeaving(true);
      back = setTimeout(() => {
        setStep((s) => s + 1);
        setLeaving(false);
      }, EXIT_MS);
    }, HOLD_MS);
    return () => {
      clearInterval(id);
      clearTimeout(back);
    };
  }, [still, paused]);

  // The stack, front first; while the front post leaves, everything behind it already steps forward.
  const order = Array.from({ length: n }, (_, k) => (step + k) % n);
  const depthOf = (i: number) => {
    const d = order.indexOf(i);
    return leaving ? (d === 0 ? -1 : d - 1) : d;
  };

  // Reach so far: every post that has come to the front in this round of the stack.
  const seen = (step % n) + 1;
  const reach = HERO_POSTS.slice(0, seen).reduce((sum, p) => sum + p.reach, 0) + 18_000;

  return (
    <div
      aria-hidden="true"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="relative mx-auto h-[33rem] w-full max-w-[36rem] [perspective:1800px] sm:h-[36rem]"
    >
      {/* The whole stack turned slightly, so the depth reads as a gentle fan rather than a flat pile. */}
      <div className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "rotateY(-14deg) rotateX(6deg)" }}>
        {HERO_POSTS.map((post, i) => {
          const depth = depthOf(i);
          const style = depth === -1 ? EXIT : SLOTS[depth];
          return (
            <div
              key={i}
              style={{ ...style, transition: "transform 900ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease, filter 700ms ease" }}
              className="absolute top-[19%] left-[6%] h-[25rem] w-[min(23rem,74%)]"
            >
              <Card post={post} />
              {/* A white veil deepening with depth, so posts behind read as shapes and brand marks, not text. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl bg-[#f9f8f4]"
                style={{ opacity: depth > 0 ? 0.38 + depth * 0.14 : 0, transition: "opacity 700ms ease" }}
              />
            </div>
          );
        })}
      </div>

      {/* Launch reach, outside the 3D so it stays crisp. */}
      <div className="absolute top-[3%] left-0 rounded-xl border border-black/[0.06] bg-white/90 px-4 py-3 shadow-[0_18px_40px_-20px_rgb(23_44_33/0.45)] backdrop-blur-sm">
        <p className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.12em] text-ink/50 uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/70 motion-reduce:hidden" />
            <span className="relative size-1.5 rounded-full bg-primary" />
          </span>
          Launch reach
        </p>
        <p className="mt-1 text-[1.6rem] leading-none font-medium tracking-[-0.045em] text-ink tabular-nums">
          <NumberFlow value={reach} format={{ notation: "compact", maximumFractionDigits: 1 }} />
        </p>
      </div>
    </div>
  );
}

// ── The cards ──────────────────────────────────────────────────────────────────────────────────────────

const SHELL = "flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_30px_70px_-30px_rgb(23_44_33/0.45),0_2px_6px_rgb(23_44_33/0.06)]";

function Card({ post }: { post: HeroPost }) {
  switch (post.kind) {
    case "x":
      return <XPost post={post} />;
    case "linkedin":
      return <LinkedInPost post={post} />;
    case "youtube":
      return <YouTubeVideo post={post} />;
    case "newsletter":
      return <NewsletterIssue post={post} />;
  }
}

function Avatar({ c, size = "size-10" }: { c: number; size?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- sample creator photos
  return <img src={CREATORS[c].photo} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
}

const Verified = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px] fill-[#1d9bf0]">
    <path d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.15-.44.23-.91.23-1.4 0-2.21-1.71-4-3.82-4-.47 0-.92.08-1.33.25C14.78 2.42 13.47 1.5 12 1.5s-2.78.92-3.4 2.2c-.42-.17-.87-.25-1.34-.25-2.11 0-3.82 1.79-3.82 4 0 .49.08.96.24 1.4-1.3.7-2.18 2.07-2.18 3.65 0 1.5.8 2.8 1.97 3.53-.03.2-.04.4-.04.6 0 2.21 1.71 4 3.82 4 .47 0 .92-.09 1.33-.25.62 1.3 1.93 2.2 3.42 2.2 1.5 0 2.8-.9 3.42-2.2.41.16.86.25 1.33.25 2.11 0 3.82-1.79 3.82-4 0-.2-.01-.4-.04-.6 1.17-.73 1.97-2.03 1.97-3.53Zm-6.24-3.53-5.13 7.7a.75.75 0 0 1-1.13.12L7.1 13.98a.75.75 0 1 1 1.06-1.06l2.27 2.26 4.6-6.9a.75.75 0 1 1 1.25.84Z" />
  </svg>
);

function Stat({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px] fill-none stroke-current stroke-[1.7]">
        {icon}
      </svg>
      {value}
    </span>
  );
}

function XPost({ post }: { post: Extract<HeroPost, { kind: "x" }> }) {
  const c = CREATORS[post.creator];
  return (
    <article className={`${SHELL} p-5`}>
      <header className="flex items-start gap-3">
        <Avatar c={post.creator} />
        <p className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-1 text-[15px] font-bold text-[#0f1419]">
            {c.name} <Verified />
          </span>
          <span className="text-[14px] text-[#536471]">
            {c.handle} · {post.time}
          </span>
        </p>
        <PlatformIcon platform="x" className="size-[18px] text-[#0f1419]" />
      </header>
      <p className="mt-3 text-[15px] leading-[1.4] text-[#0f1419]">{post.text}</p>
      {/* Attached media: a crop of the product, so the post reads as a launch, not a status update. */}
      <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-[#0f1411]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
          {[0, 1, 2].map((d) => (
            <span key={d} className="size-1.5 rounded-full bg-white/25" />
          ))}
          {/* eslint-disable-next-line @next/next/no-img-element -- sample product logo */}
          <img src={LAUNCH.company.logo} alt="" className="ml-2 h-2.5 w-auto opacity-80 invert" />
        </div>
        <div className="grid flex-1 grid-cols-[1fr_1.4fr] items-center gap-3 p-3">
          <div className="space-y-1.5">
            {[0.9, 0.7, 0.8, 0.55].map((w, k) => (
              <span key={k} className={`block h-2 rounded-full ${k === 1 ? "bg-primary/70" : "bg-white/15"}`} style={{ width: `${w * 100}%` }} />
            ))}
          </div>
          <svg viewBox="0 0 120 50" className="h-20 w-full overflow-visible">
            <path d="M0 44 C 20 42, 30 36, 45 34 S 70 22, 85 14 S 110 6, 120 4" fill="none" stroke="var(--primary)" strokeWidth={2} />
            <path d="M0 44 C 20 42, 30 36, 45 34 S 70 22, 85 14 S 110 6, 120 4 L120 50 L0 50Z" fill="rgb(25 231 110 / 0.12)" />
          </svg>
        </div>
      </div>
      <footer className="mt-3 flex justify-between text-[13px] text-[#536471]">
        <Stat value={post.replies} icon={<path d="M4 12a8 8 0 0 1 8-8h1a7 7 0 0 1 0 14H9l-4 3v-4.5A8 8 0 0 1 4 12Z" />} />
        <Stat value={post.reposts} icon={<path d="M4 9V7a2 2 0 0 1 2-2h11l-3-3m6 13v2a2 2 0 0 1-2 2H7l3 3" />} />
        <Stat value={post.likes} icon={<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />} />
        <span className="flex items-center gap-1.5 font-semibold text-[#0f1419]">
          <Stat value={post.views} icon={<path d="M5 20v-6m5 6V8m5 12v-9m5 9V4" />} />
        </span>
      </footer>
    </article>
  );
}

function LinkedInPost({ post }: { post: Extract<HeroPost, { kind: "linkedin" }> }) {
  const c = CREATORS[post.creator];
  return (
    <article className={SHELL}>
      <div className="p-4">
        <header className="flex items-start gap-3">
          <Avatar c={post.creator} size="size-11" />
          <p className="min-w-0 flex-1 leading-tight">
            <span className="block text-[14px] font-semibold text-black/90">{c.name}</span>
            <span className="block truncate text-[12px] text-black/60">{post.headline}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] text-black/60">
              {post.time} ·
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3 fill-black/60">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm4.9 6h-2.2a11 11 0 0 0-.9-3.9A5.5 5.5 0 0 1 12.9 7ZM8 2.6c.6.8 1.1 2.4 1.2 4.4H6.8C6.9 5 7.4 3.4 8 2.6ZM6.2 3.1A11 11 0 0 0 5.3 7H3.1a5.5 5.5 0 0 1 3.1-3.9ZM3.1 9h2.2c.1 1.5.4 2.8.9 3.9A5.5 5.5 0 0 1 3.1 9ZM8 13.4c-.6-.8-1.1-2.4-1.2-4.4h2.4c-.1 2-.6 3.6-1.2 4.4Zm1.8-.5c.5-1.1.8-2.4.9-3.9h2.2a5.5 5.5 0 0 1-3.1 3.9Z" />
              </svg>
            </span>
          </p>
          <PlatformIcon platform="linkedin" className="size-[18px] text-[#0a66c2]" />
        </header>
        <p className="mt-3 text-[14px] leading-[1.45] text-black/90">
          {post.text} <span className="text-black/50">…more</span>
        </p>
      </div>
      {/* Link preview. */}
      <div className="flex flex-1 flex-col border-y border-black/[0.08]">
        <div className="grid min-h-0 flex-1 place-items-center bg-[linear-gradient(135deg,#eef6f0,#dff3e6_60%,#c9eed7)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- sample product logo */}
          <img src={LAUNCH.company.logo} alt="" className="h-6 w-auto" />
        </div>
        <div className="bg-[#f3f6f8] px-4 py-2.5">
          <p className="text-[13px] leading-snug font-semibold text-black/90">{post.link.title}</p>
          <p className="text-[12px] text-black/55">{post.link.domain}</p>
        </div>
      </div>
      <footer className="flex items-center justify-between px-4 py-2.5 text-[12px] text-black/60">
        <span className="flex items-center gap-1.5">
          <span className="flex -space-x-1">
            {["#378fe9", "#df704d", "#6dae4f"].map((bg) => (
              <span key={bg} className="size-4 rounded-full ring-2 ring-white" style={{ background: bg }} />
            ))}
          </span>
          {post.reactions}
        </span>
        <span>{post.comments}</span>
      </footer>
    </article>
  );
}

function YouTubeVideo({ post }: { post: Extract<HeroPost, { kind: "youtube" }> }) {
  const c = CREATORS[post.creator];
  return (
    <article className={SHELL}>
      {/* The thumbnail: bold title, the creator's face, the duration chip, a half-watched progress bar. */}
      <div className="relative aspect-video overflow-hidden bg-[radial-gradient(120%_120%_at_0%_100%,#19e76e_0%,#0d6b35_35%,#0b1410_75%)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
        <img src={c.photo} alt="" className="absolute inset-y-0 right-0 h-full w-[48%] object-cover [mask-image:linear-gradient(90deg,transparent,#000_35%)]" />
        <p className="absolute top-1/2 left-4 max-w-[58%] -translate-y-1/2 text-[22px] leading-[1.02] font-extrabold tracking-[-0.02em] text-white uppercase [text-shadow:0_2px_12px_rgb(0_0_0/0.4)]">
          {post.thumb}
        </p>
        <span className="absolute right-2 bottom-2.5 rounded-[4px] bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">{post.duration}</span>
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
          <span className="block h-full w-[38%] bg-[#ff0000]" />
        </span>
      </div>
      <div className="flex gap-3 p-4">
        <Avatar c={post.creator} size="size-9" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14.5px] leading-snug font-semibold text-[#0f0f0f]">{post.title}</p>
          <p className="mt-1 text-[12.5px] text-[#606060]">
            {c.name} · {post.views} · {post.time}
          </p>
        </div>
        <PlatformIcon platform="youtube" className="size-5 text-[#ff0000]" />
      </div>
      <div className="mt-auto space-y-3 px-4 pb-4">
        <div className="flex gap-1.5">
          {["0:00 Setup", "3:12 1,000 users", "9:40 Results"].map((chapter) => (
            <span key={chapter} className="rounded-md bg-[#f2f2f2] px-2 py-1 text-[11px] font-medium whitespace-nowrap text-[#0f0f0f]">
              {chapter}
            </span>
          ))}
        </div>
        <p className="flex items-start gap-2.5 border-t border-black/[0.06] pt-3 text-[12.5px] leading-snug text-[#0f0f0f]">
          <Avatar c={(post.creator + 3) % CREATORS.length} size="size-6" />
          <span>
            <span className="font-semibold">{CREATORS[(post.creator + 3) % CREATORS.length].handle}</span> We switched our eval suite to this
            the same day. Huge.
          </span>
        </p>
      </div>
    </article>
  );
}

function NewsletterIssue({ post }: { post: Extract<HeroPost, { kind: "newsletter" }> }) {
  return (
    <article className={`${SHELL} p-5`}>
      <header className="flex items-center gap-3 border-b border-black/[0.07] pb-3.5">
        <span className="grid size-10 place-items-center rounded-[10px] bg-ink text-[13px] font-semibold text-primary">AI</span>
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block text-[14px] font-semibold text-ink">{post.name}</span>
          <span className="block text-[12px] text-ink/50">{post.issue}</span>
        </p>
        <PlatformIcon platform="newsletter" className="size-5 text-[#ff6719]" />
      </header>
      <p className="mt-4 text-[18px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink">{post.subject}</p>
      <p className="mt-2 text-[13.5px] leading-[1.5] text-ink/60">{post.preview}</p>
      <div className="mt-4 flex-1 rounded-xl bg-[#f6f7f5] p-3">
        <div className="flex items-center gap-2.5">
          <Avatar c={post.creator} size="size-7" />
          <span className="h-1.5 w-2/5 rounded-full bg-ink/15" />
        </div>
        <span className="mt-2.5 block h-1.5 w-full rounded-full bg-ink/10" />
        <span className="mt-1.5 block h-1.5 w-4/5 rounded-full bg-ink/10" />
      </div>
      <footer className="mt-4 flex gap-2 text-[12px]">
        <span className="rounded-full bg-[#ecf9f1] px-2.5 py-1 font-medium text-[#0d6b35]">{post.readers}</span>
        <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-ink/65">{post.opened}</span>
      </footer>
    </article>
  );
}
