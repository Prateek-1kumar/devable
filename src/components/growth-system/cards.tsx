"use client";

import {
  ArrowBigDown,
  ArrowBigUp,
  BadgeCheck,
  Bookmark,
  ChartNoAxesColumn,
  Check,
  Code,
  FileText,
  Folder,
  Heart,
  MessageCircle,
  Repeat2,
  Rocket,
  Search,
  Share,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Mark } from "../services/parts";
import { compact, count, seg, usePlayhead, type CardState } from "./clock";
import { CONTENT, CREATORS, REDDIT, SEARCH } from "./content";

// The four service cards. Each is our card frame (icon, name, the client's line) around a preview built to look
// like the real surface it stands for: a publish flow, a search page with an AI answer, the actual X post, a
// Reddit thread. Platform previews use the system UI font, as the platforms do.
//
// Each card plays a short demo on its own clock when its state turns to `play` (thresholds on the playhead `t`
// switch classes; CSS transitions do the easing), ends on exactly the `done` picture, and shows nothing started
// while it's a `ghost`.

const PLATFORM = "font-[system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif]";
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const SHOW = `transition-[opacity,translate] duration-500 ${EASE}`;

/** Durations of each demo (seconds), so the stage knows when a card has finished. */
export const DURATION = { content: 3.6, search: 4.4, creators: 4.6, reddit: 4.4 } as const;

type CardProps = { state?: CardState; className?: string };

/** The shared card: header (icon tile, name, line) above its preview. */
export function Card({ icon, tint, name, line, children, className }: { icon: ReactNode; tint: string; name: string; line: string; children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        "@container flex flex-col rounded-[18px] bg-white p-4 shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.05),0_24px_44px_-30px_rgb(23_44_33/0.32)]",
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", tint)}>{icon}</span>
        <div className="min-w-0">
          <h3 className="text-[15px] leading-tight font-medium tracking-[-0.02em] text-ink">{name}</h3>
          <p className="mt-0.5 text-[12.5px] leading-tight text-ink/55 @min-[24rem]:truncate">{line}</p>
        </div>
      </header>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </article>
  );
}

/** A block that opens from zero height (grid-rows trick), fading and settling as it does. */
function Reveal({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn(`grid transition-[grid-template-rows,opacity] duration-[600ms] ${EASE}`, open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0", className)}>
      <div className={cn(`min-h-0 transition-transform duration-[600ms] ${EASE}`, open ? "translate-y-0" : "-translate-y-2")}>{children}</div>
    </div>
  );
}

const SURFACE = "rounded-[12px] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.08),0_6px_14px_-10px_rgb(23_44_33/0.25)]";

/* ── 01 Technical Content: Inputs → Brief → Build & Review → Published, then the post drops in ──────── */

const STEP_ICON = { folder: Folder, doc: FileText, code: Code, rocket: Rocket } as const;
const STEP_AT = (i: number) => 0.35 + i * 0.55; // when each stage starts
const STEP_LEN = 0.45; // how long each is "working"

/** Isometric stack of layers: the post's cover art (raw web pages becoming clean, layered data). */
function StackArt() {
  const layer = (y: number, o: number) => (
    <g key={y} transform={`translate(0 ${y})`} opacity={o}>
      <path d="M40 6 70 21 40 36 10 21Z" fill="url(#gs-layer)" />
      <path d="M40 6 70 21 40 36 10 21Z" fill="none" stroke="#7df5b0" strokeOpacity="0.7" strokeWidth="0.8" />
    </g>
  );
  return (
    <svg viewBox="0 0 80 64" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id="gs-layer" x1="10" y1="6" x2="70" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#36e888" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0f6b3b" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {layer(20, 0.45)}
      {layer(11, 0.7)}
      {layer(2, 1)}
    </svg>
  );
}

export function ContentCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.content);
  const { steps, post } = CONTENT;
  const last = steps.length - 1;
  const published = t >= STEP_AT(last) + STEP_LEN;
  // The connector fills from Inputs to Published as the stages complete.
  const fill = seg(t, STEP_AT(0) + STEP_LEN * 0.5, STEP_AT(last));
  return (
    <Card className={className} name={CONTENT.name} line={CONTENT.line} tint="bg-light-green-soft text-ink" icon={<FileText className="size-[18px]" strokeWidth={1.8} />}>
      <ol className="relative grid grid-cols-4">
        <span aria-hidden="true" className="absolute top-[15px] right-[12.5%] left-[12.5%] h-px bg-ink/10" />
        <span aria-hidden="true" className="absolute top-[15px] left-[12.5%] h-px w-3/4 origin-left bg-[rgb(25_150_80/0.6)]" style={{ transform: `scaleX(${fill})` }} />
        {steps.map((s, i) => {
          const Icon = STEP_ICON[s.icon];
          const start = STEP_AT(i);
          const working = t >= start && t < start + STEP_LEN;
          const done = t >= start + STEP_LEN;
          const final = i === last;
          return (
            <li key={s.name} className="relative flex flex-col items-center">
              <span
                className={cn(
                  "relative grid size-[30px] place-items-center rounded-[9px] transition-[background-color,color,box-shadow,scale] duration-300",
                  final && done
                    ? "scale-105 bg-primary text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_6px_12px_-8px_rgb(25_150_80/0.9)]"
                    : done
                      ? "bg-[#eafbf1] text-ink/75 shadow-[inset_0_0_0_1px_rgb(25_150_80/0.22)]"
                      : working
                        ? "bg-white text-ink shadow-[inset_0_0_0_1.5px_rgb(25_150_80/0.7),0_0_0_4px_rgb(25_231_110/0.14)]"
                        : "bg-white text-ink/35 shadow-[inset_0_0_0_1px_rgb(23_44_33/0.1)]",
                )}
              >
                <Icon className="size-[15px]" strokeWidth={1.8} />
                {working && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-[9px] bg-primary/15 [animation-duration:1.1s]" />}
                {final && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 grid size-[15px] place-items-center rounded-full bg-ink text-white ring-2 ring-white transition-[scale,opacity] duration-300",
                      published ? "scale-100 opacity-100" : "scale-50 opacity-0",
                    )}
                  >
                    <Check className="size-[9px]" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={cn("mt-1.5 text-[10.5px] whitespace-nowrap transition-colors duration-300", final && done ? "font-medium text-ink" : done || working ? "text-ink/70" : "text-ink/35")}>
                {s.name}
              </span>
            </li>
          );
        })}
      </ol>

      {/* The published post drops in beneath the workflow. */}
      <Reveal open={t >= STEP_AT(last) + STEP_LEN + 0.25} className="mt-3">
        <div className={cn("flex gap-3 p-2", SURFACE)}>
          <div className="relative h-[78px] w-[104px] shrink-0 overflow-hidden rounded-[8px] bg-[radial-gradient(120%_90%_at_30%_20%,#1f4a33,#0b1711)] p-2">
            <StackArt />
          </div>
          <div className="flex min-w-0 flex-col py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="rounded-[4px] bg-ink/[0.06] px-1.5 py-px text-[9.5px] font-medium tracking-[0.04em] text-ink/70 uppercase">{post.tag}</span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-[#1a7f47]">
                <span className="size-1.5 rounded-full bg-primary" />
                Published
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.25] font-medium tracking-[-0.01em] text-ink">{post.title}</p>
            <p className="mt-auto text-[10.5px] text-ink/45">
              {post.site} &middot; {post.read}
            </p>
          </div>
        </div>
      </Reveal>
    </Card>
  );
}

/* ── 02 Search + AI Visibility: the engines line up, the query types, the result and the AI answer land ── */

export function SearchCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.search);
  const { engines, result, overview, query } = SEARCH;
  const typed = query.slice(0, Math.round(query.length * seg(t, 0.85, 1.9)));
  const typing = t >= 0.7 && t < 2.2;
  return (
    <Card className={className} name={SEARCH.name} line={SEARCH.line} tint="bg-light-green-soft text-ink" icon={<Search className="size-[18px]" strokeWidth={2} />}>
      <ul className="flex flex-wrap gap-1 @min-[24rem]:flex-nowrap">
        {engines.map((e, i) => {
          const shown = t >= 0.15 + i * 0.1;
          const cited = t >= 3.35 + i * 0.13;
          return (
            <li
              key={e.mark}
              className={cn(
                `relative flex min-w-0 items-center justify-center gap-1 rounded-full bg-white px-2 py-[5px] transition-[opacity,translate,box-shadow] duration-500 ${EASE} @min-[24rem]:flex-1 @min-[24rem]:px-0`,
                shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                cited ? "shadow-[0_0_0_1px_rgb(25_150_80/0.45)]" : "shadow-[0_0_0_1px_rgb(23_44_33/0.09)]",
              )}
            >
              <Mark name={e.mark} className="size-3" />
              <span className="truncate text-[10px] font-medium text-ink/80">{e.name}</span>
              <span
                aria-hidden="true"
                className={cn("absolute -top-1 -right-0.5 grid size-3 place-items-center rounded-full bg-primary text-ink transition-[scale,opacity] duration-300", cited ? "scale-100 opacity-100" : "scale-0 opacity-0")}
              >
                <Check className="size-2" strokeWidth={3.5} />
              </span>
            </li>
          );
        })}
      </ul>

      <div className={cn("mt-2 flex h-[30px] items-center gap-2 rounded-full bg-white pr-1.5 pl-3 shadow-[0_0_0_1px_rgb(23_44_33/0.1),0_2px_6px_-3px_rgb(23_44_33/0.18)]", PLATFORM)}>
        <Mark name="google" className="size-3.5" />
        <span className="min-w-0 flex-1 truncate text-[12px] text-[#202124]">
          {t < 0.85 ? <span className="text-[#9aa0a6]">Search</span> : typed}
          {typing && <span aria-hidden="true" className="ml-px inline-block h-3 w-px translate-y-0.5 animate-pulse bg-[#1a73e8]" />}
        </span>
        <span className={cn("grid size-[22px] place-items-center rounded-full text-[#1a73e8] transition-colors duration-200", t >= 2.0 && t < 2.35 ? "bg-[#d2e3fc]" : "bg-[#f1f3f4]")}>
          <Search className="size-3" strokeWidth={2.4} />
        </span>
      </div>

      <div className={cn("mt-2 grid grid-cols-[1fr_1.08fr] overflow-hidden rounded-[12px] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.08)]", PLATFORM)}>
        {/* The organic result. */}
        <div className={cn("p-2.5", SHOW, t >= 2.3 ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0")}>
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-ink text-[8px] font-bold text-white">Y</span>
            <span className="truncate text-[10px] text-[#4d5156]">{result.site}</span>
          </div>
          <p className="mt-1 text-[12px] leading-tight text-[#1a0dab]">{result.title}</p>
          <p className="mt-1 text-[10.5px] leading-snug text-[#4d5156]">{result.snippet}</p>
        </div>
        {/* The AI answer, citing it. */}
        <div className={cn("border-l border-[#e8eaed] bg-[linear-gradient(180deg,#f6f9fe,#fff)] p-2.5", SHOW, t >= 2.65 ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0")}>
          <p className="flex items-center gap-1 text-[10.5px] font-semibold text-[#202124]">
            <Sparkles className={cn("size-3 text-[#1a73e8]", t >= 2.65 && t < 3.1 && "animate-pulse")} strokeWidth={2} />
            AI Overview
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-[#3c4043]">
            {overview[0]}
            <mark className={cn("rounded-[3px] px-0.5 font-medium text-[#1a0dab] transition-colors duration-500", t >= 3.05 ? "bg-[#e8f0fe]" : "bg-transparent")}>{overview[1]}</mark>
            {overview[2]}
          </p>
          <span className={cn("mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#f1f3f4] py-0.5 pr-1.5 pl-1 text-[9px] text-[#3c4043]", SHOW, t >= 3.15 ? "opacity-100" : "opacity-0")}>
            <span className="grid size-3 place-items-center rounded-full bg-ink text-[6px] font-bold text-white">Y</span>
            {result.site}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ── 03 Influencer Marketing: the creator posts, then replies, reposts, likes and views climb ─────────── */

export function CreatorCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.creators);
  const p = CREATORS.post;
  const n = {
    views: count(t, 1.0, 4.3, p.stats.views),
    likes: count(t, 1.25, 4.1, p.stats.likes),
    reposts: count(t, 1.5, 4.1, p.stats.reposts),
    replies: count(t, 1.7, 4.2, p.stats.replies),
  };
  const liked = t >= 1.3;
  const stat = (Icon: typeof Heart, value: number, label: string, cls?: string) => (
    <span className={cn("flex items-center gap-1 transition-colors duration-300", cls)} aria-label={`${value} ${label}`}>
      <Icon className="size-[13px]" strokeWidth={1.8} />
      <span className="tabular-nums">{compact(value)}</span>
    </span>
  );
  return (
    <Card className={className} name={CREATORS.name} line={CREATORS.line} tint="bg-light-green-soft text-ink" icon={<Users className="size-[18px]" strokeWidth={1.8} />}>
      <div className={cn("relative overflow-hidden p-2.5", SURFACE, PLATFORM, SHOW, t >= 0.15 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
        {/* Posting: X's thin progress bar across the top, gone once it's live. */}
        <span
          aria-hidden="true"
          className={cn("absolute inset-x-0 top-0 h-[2px] origin-left bg-[#1d9bf0] transition-opacity duration-300", t >= 0.95 ? "opacity-0" : "opacity-100")}
          style={{ transform: `scaleX(${seg(t, 0.15, 0.9)})` }}
        />
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed avatar from the post */}
          <img src={p.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-1 text-[12px]">
              <span className="truncate font-bold text-[#0f1419]">{p.name}</span>
              <BadgeCheck className="size-3.5 shrink-0 fill-[#1d9bf0] text-white" strokeWidth={2.2} />
              <span className="truncate text-[#536471]">
                {p.handle} &middot; {p.date}
              </span>
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-[1.35] whitespace-pre-line text-[#0f1419]">{p.text}</p>
          </div>
          <Mark name="x" className="size-3.5" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- the post's attached image */}
        <img src={p.media} alt="" className="mt-2 ml-10 h-[56px] w-[calc(100%-2.5rem)] rounded-[10px] object-cover object-[50%_45%] shadow-[0_0_0_1px_rgb(15_20_25/0.08)]" />
        <div className="mt-2 ml-10 flex items-center justify-between text-[11px] text-[#536471]">
          {stat(MessageCircle, n.replies, "replies")}
          {stat(Repeat2, n.reposts, "reposts", n.reposts > 0 ? "text-[#00ba7c]" : undefined)}
          <span className={cn("flex items-center gap-1 transition-colors duration-300", liked && "text-[#f91880]")} aria-label={`${n.likes} likes`}>
            <Heart className={cn("size-[13px] transition-[scale,fill] duration-300", liked ? "scale-110 fill-[#f91880]" : "fill-transparent")} strokeWidth={1.8} />
            <span className="tabular-nums">{compact(n.likes)}</span>
          </span>
          {stat(ChartNoAxesColumn, n.views, "views")}
          <span className="flex gap-2">
            <Bookmark className="size-[13px]" strokeWidth={1.8} />
            <Share className="size-[13px]" strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ── 04 Reddit: the thread, the helpful comment slides in, its product mention lights, upvotes climb ──── */

export function RedditCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.reddit);
  const { thread, comment } = REDDIT;
  const votes = count(t, 1.9, 4.0, comment.votes, 1);
  const upvoted = t >= 1.85;
  return (
    <Card className={className} name={REDDIT.name} line={REDDIT.line} tint="bg-[#ff4500] text-white" icon={<Mark name="reddit" className="size-[20px] [&>path]:fill-white" />}>
      <div className={cn("p-2.5", SURFACE, PLATFORM, SHOW, t >= 0.15 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
        <p className="flex items-center gap-1.5 text-[10.5px] text-[#576f76]">
          <span className="grid size-4 place-items-center rounded-full bg-[#ff4500]">
            <Mark name="reddit" className="size-2.5 [&>path]:fill-white" />
          </span>
          <span className="font-semibold text-[#0f1a1c]">{thread.sub}</span>
          &middot; {thread.age}
        </p>
        <p className="mt-1 text-[12.5px] leading-tight font-semibold text-[#0f1a1c]">{thread.title}</p>
        <p className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-[#576f76]">
          <span className="flex items-center gap-1 rounded-full bg-[#eef1f3] px-1.5 py-0.5">
            <ArrowBigUp className="size-3" strokeWidth={1.8} />
            <span className="tabular-nums">{count(t, 0.3, 4.0, thread.votes, thread.votes - 26)}</span>
            <ArrowBigDown className="size-3" strokeWidth={1.8} />
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#eef1f3] px-1.5 py-0.5">
            <MessageCircle className="size-3" strokeWidth={2} />
            <span className="tabular-nums">{thread.comments}</span>
          </span>
        </p>

        {/* The comment, threaded under the post, with the product mention marked. */}
        <Reveal open={t >= 0.9} className="mt-2">
          <div className="flex gap-2 border-l-2 border-[#e5ebee] pl-2.5">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10px] text-[#576f76]">
                <span className="size-3.5 rounded-full bg-[conic-gradient(#ffb000,#ff4500,#ffb000)]" />
                <span className="font-semibold text-[#0f1a1c]">{comment.user}</span>
                &middot; {comment.age}
              </p>
              <p className="mt-1 text-[11.5px] leading-[1.35] text-[#0f1a1c]">
                {comment.text[0]}
                {/* The mention lights as a sweep of Reddit-orange tint with an underline, across line breaks. */}
                <mark
                  className={`rounded-[2px] bg-no-repeat font-medium text-[#0f1a1c] transition-[background-size] duration-700 ${EASE}`}
                  style={{
                    backgroundImage: "linear-gradient(#ff4500,#ff4500), linear-gradient(#fff1e6,#fff1e6)",
                    backgroundPosition: "0 100%, 0 0",
                    backgroundSize: t >= 1.5 ? "100% 1.5px, 100% 100%" : "0% 1.5px, 0% 100%",
                  }}
                >
                  {comment.text[1]}
                </mark>
                {comment.text[2]}
              </p>
              <div className="mt-1.5 flex items-center gap-3 text-[10.5px] font-semibold text-[#576f76]">
                <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors duration-300", upvoted ? "bg-[#fff1e6] text-[#d93a00]" : "bg-[#eef1f3]")}>
                  <ArrowBigUp className={cn("size-3.5 transition-[scale,fill,color] duration-300", upvoted ? "scale-110 fill-[#ff4500] text-[#ff4500]" : "fill-transparent")} strokeWidth={1.5} />
                  <span className="tabular-nums">{votes}</span>
                  <ArrowBigDown className="size-3.5 text-[#576f76]" strokeWidth={1.5} />
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3" strokeWidth={2} />
                  Reply
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Card>
  );
}
