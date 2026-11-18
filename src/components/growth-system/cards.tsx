"use client";

import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowUp,
  BadgeCheck,
  Bookmark,
  CalendarClock,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  Code,
  FileText,
  Ellipsis,
  Folder,
  Globe,
  Heart,
  Lock,
  Image as ImageIcon,
  ListOrdered,
  MapPin,
  MessageCircle,
  Repeat2,
  Rocket,
  Search,
  Share,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Mark } from "../services/parts";
import { compact, count, seg, usePlayhead, type CardState } from "./clock";
import { CONTENT, CREATORS, REDDIT, SEARCH } from "./content";

// The four service cards. Each is a physical card (layered white, a top highlight, soft key and ambient shadows,
// a glare the stage moves when the card is tilted) holding a preview built to look like the real surface it
// stands for: the content pipeline and its artifacts, a search page with a streaming AI answer, the actual X post
// from compose to traction, a Reddit thread. Platform previews use the system UI font, as the platforms do, and
// sit on their own raised layer (translateZ) so they part from the card when it tilts.
//
// Each card plays a short demo on its own clock when its state turns to `play` (thresholds on the playhead `t`
// switch classes; CSS transitions do the easing), ends on exactly the `done` picture, and shows nothing started
// while it's a `ghost`.

const PLATFORM = "font-[system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif]";
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const SHOW = `transition-[opacity,translate] duration-500 ${EASE}`;
const IN = (v: boolean) => (v ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0");

/** Durations of each demo (seconds), so the stage knows when a card has finished. */
export const DURATION = { content: 8.6, search: 9.2, creators: 5.4, reddit: 4.6 } as const;

type CardProps = { state?: CardState; className?: string };

/** A raised preview surface: white, a crisp top light, a short contact shadow and a long soft one. */
const SURFACE =
  "rounded-[12px] bg-white shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.08),0_1px_1.5px_rgb(23_44_33/0.06),0_10px_18px_-12px_rgb(23_44_33/0.32)]";
/** The layer the previews ride on, a little in front of the card. */
const RAISED = "[transform:translateZ(22px)] [transform-style:preserve-3d]";
/** The icon tile in each header: a small glossy chip. */
const CHIP =
  "bg-[linear-gradient(180deg,#effcf4,#d5f6e3)] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.95),inset_0_-1px_0_rgb(25_150_80/0.16),0_1px_2px_rgb(23_44_33/0.1)]";

/** The shared card: header (icon tile, name, line) above its preview. */
export function Card({ icon, tint = CHIP, name, line, children, className }: { icon: ReactNode; tint?: string; name: string; line: string; children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        "@container relative flex flex-col rounded-[18px] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfb_100%)] p-4 [transform-style:preserve-3d]",
        "shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.05),0_10px_20px_-14px_rgb(23_44_33/0.18),0_30px_50px_-34px_rgb(23_44_33/0.34)]",
        className,
      )}
    >
      {/* Glare: a soft reflection the stage slides with the tilt (via --gx/--gy/--glare). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[18px] transition-opacity duration-500"
        style={{ opacity: "var(--glare, 0)", background: "radial-gradient(55% 45% at var(--gx, 30%) var(--gy, 0%), rgb(255 255 255 / 0.5), transparent 70%)" }}
      />
      <header className="flex items-center gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", tint)}>{icon}</span>
        <div className="min-w-0">
          <h3 className="text-[15px] leading-tight font-medium tracking-[-0.02em] text-ink">{name}</h3>
          <p className="mt-0.5 text-[12.5px] leading-tight text-ink/55 @min-[24rem]:truncate">{line}</p>
        </div>
      </header>
      <div className="mt-3 min-h-0 flex-1 [transform-style:preserve-3d]">{children}</div>
    </article>
  );
}

/** Words that appear one after another as `p` runs 0 → 1, holding their layout from the start. */
function Stream({ text, p, className }: { text: string; p: number; className?: string }) {
  const words = text.split(" ");
  const shown = Math.round(words.length * p);
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className={cn("transition-opacity duration-300", i < shown ? "opacity-100" : "opacity-0")}>
          {w}{" "}
        </span>
      ))}
    </span>
  );
}

/* ── 01 Technical Content: one document comes to life, then goes live ──────────────────────────────────
   The client's step row on top lights stage by stage. Beneath it, one editor document keeps evolving rather
   than swapping panels: Inputs (the sources dock in: product repo, a developer's question, the search
   opportunity, the docs), Brief (they fold into a source line and the outline types in), Build & Review (the
   outline becomes draft and code, and an engineer's review pins to the code). At Published the document drops
   away and the live blog page drops in, in a browser frame; then it gets discovered: developers read it,
   Google ranks it, ChatGPT cites it. */

const STEP_ICON = { folder: Folder, doc: FileText, code: Code, rocket: Rocket } as const;
// Timeline (seconds): when each stage starts; the last entry is when the page goes live.
const STAGE = [0.3, 2.0, 3.7, 5.7];
const LIVE = STAGE[3] + 0.35;
const SIGNAL = (i: number) => LIVE + 0.9 + i * 0.45;

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

const fade = (on: boolean) => cn("transition-[opacity,translate] duration-500", EASE, on ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0");

export function ContentCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.content);
  const c = CONTENT;
  // The stage now working (-1 before it starts), and whether each is done.
  const stage = t < STAGE[0] ? -1 : STAGE.filter((s) => t >= s).length - 1;
  const done = (i: number) => (i < 3 ? t >= STAGE[i + 1] : t >= LIVE);
  const live = t >= LIVE;
  const fill = seg(t, STAGE[0] + 0.6, STAGE[3]);
  const outlineTyped = seg(t, STAGE[1] + 0.45, STAGE[1] + 1.4);
  return (
    <Card className={className} name={c.name} line={c.line} icon={<FileText className="size-[18px]" strokeWidth={1.8} />}>
      {/* The step row. */}
      <ol className="relative grid grid-cols-4">
        <span aria-hidden="true" className="absolute top-[12px] right-[12.5%] left-[12.5%] h-px bg-ink/10" />
        <span aria-hidden="true" className="absolute top-[12px] left-[12.5%] h-px w-3/4 origin-left bg-[rgb(25_150_80/0.6)]" style={{ transform: `scaleX(${fill})` }} />
        {c.steps.map((s, i) => {
          const Icon = STEP_ICON[s.icon];
          const final = i === 3;
          const isDone = done(i);
          const working = stage === i && !isDone;
          return (
            <li key={s.name} className="relative flex flex-col items-center">
              <span
                className={cn(
                  "relative grid size-[24px] place-items-center rounded-[7px] transition-[background-color,color,box-shadow,scale] duration-500",
                  final && isDone
                    ? "scale-105 bg-[linear-gradient(180deg,#3cf086,#19d466)] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_6px_12px_-6px_rgb(25_150_80/0.9)]"
                    : isDone
                      ? "bg-[#eafbf1] text-ink/75 shadow-[inset_0_0_0_1px_rgb(25_150_80/0.22)]"
                      : working
                        ? "bg-white text-ink shadow-[inset_0_0_0_1.5px_rgb(25_150_80/0.7),0_0_0_4px_rgb(25_231_110/0.14)]"
                        : "bg-white text-ink/35 shadow-[inset_0_0_0_1px_rgb(23_44_33/0.1)]",
                )}
              >
                <Icon className="size-[12px]" strokeWidth={1.9} />
                {working && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-[7px] bg-primary/15 [animation-duration:1.4s]" />}
                {final && (
                  <span className={cn("absolute -top-1.5 -right-1.5 grid size-[13px] place-items-center rounded-full bg-ink text-white ring-2 ring-white transition-[scale,opacity] duration-300", isDone ? "scale-100 opacity-100" : "scale-50 opacity-0")}>
                    <Check className="size-[7px]" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={cn("mt-[3px] text-[9.5px] whitespace-nowrap transition-colors duration-500", final && isDone ? "font-medium text-ink" : isDone || working ? "text-ink/70" : "text-ink/35")}>{s.name}</span>
            </li>
          );
        })}
      </ol>

      <div className={cn("relative mt-2 h-[128px]", RAISED)}>
        {/* The document, evolving. */}
        <div className={cn("absolute inset-0 overflow-hidden transition-[opacity,translate,scale] duration-500", EASE, SURFACE, live ? "pointer-events-none translate-y-3 scale-[0.97] opacity-0" : "opacity-100")}>
          <div className="flex h-[20px] items-center gap-1.5 border-b border-ink/[0.06] px-2.5 text-[9px] text-ink/45">
            <FileText className="size-2.5" strokeWidth={2} />
            <span className="font-mono">{c.file}</span>
            <span className={cn("ml-auto rounded-[4px] px-1.5 py-px font-medium transition-colors duration-500", stage >= 2 ? "bg-[#fff4e0] text-[#a15c00]" : "bg-ink/[0.05] text-ink/55")}>
              {stage < 0 ? "Draft" : c.steps[Math.min(stage, 2)].status}
            </span>
          </div>

          <div className="relative h-[108px] px-2.5 pt-2">
            {/* Inputs: the sources dock in. */}
            <ul className={cn("absolute inset-x-2.5 top-2 grid grid-cols-2 gap-1.5 transition-opacity duration-300", stage <= 0 ? "opacity-100" : "pointer-events-none opacity-0")}>
              {c.sources.map((s, i) => (
                <li key={s.label} className={cn("flex items-center gap-1.5 rounded-[8px] bg-paper px-2 py-[5px] shadow-[inset_0_0_0_1px_rgb(23_44_33/0.06)]", fade(t >= STAGE[0] + 0.15 + i * 0.3))}>
                  <Mark name={s.mark} className="size-3 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[9.5px] leading-tight text-ink/80">{s.label}</span>
                    <span className="block text-[8px] leading-tight text-ink/40">{s.note}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Brief onward: the sources fold into one line, the title and outline type in. */}
            <div className={cn("transition-opacity duration-500", stage >= 1 ? "opacity-100" : "opacity-0")}>
              <p className="flex items-center gap-1 text-[8.5px] text-ink/40">
                <span className="flex -space-x-0.5">
                  {c.sources.map((s) => (
                    <span key={s.label} className="grid size-3.5 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.08)]">
                      <Mark name={s.mark} className="size-2" />
                    </span>
                  ))}
                </span>
                {c.sources.length} sources
              </p>
              <p className="mt-0.5 text-[11.5px] leading-tight font-semibold tracking-[-0.01em] text-ink">
                <Stream text={c.title} p={seg(t, STAGE[1] + 0.1, STAGE[1] + 0.6)} />
              </p>
              <div className="relative mt-1.5">
                {/* Brief: the outline. */}
                <ul className={cn("space-y-0.5 transition-opacity duration-400", stage === 1 ? "opacity-100" : "opacity-0")}>
                  {c.outline.map((h, i) => (
                    <li key={h} className={cn("flex items-center gap-1.5 text-[10px] text-ink/70", fade(outlineTyped > i / c.outline.length))}>
                      <span className="font-mono text-[8px] text-ink/30">H2</span>
                      {h}
                    </li>
                  ))}
                </ul>
                {/* Build & Review: the draft, the code, and the engineer's review. */}
                <div className={cn("absolute inset-x-0 top-0 transition-opacity duration-500", stage >= 2 ? "opacity-100" : "opacity-0")}>
                  <p className="truncate text-[9.5px] leading-snug text-ink/60">
                    <Stream text={c.draft} p={seg(t, STAGE[2] + 0.1, STAGE[2] + 0.9)} />
                  </p>
                  <div className={cn("relative mt-1 rounded-[6px] bg-[#0d1712] px-2 py-1 font-mono text-[8.5px] leading-[1.55]", fade(t >= STAGE[2] + 0.8))}>
                    {c.code.map((line, i) => (
                      <p key={i} className="truncate">
                        <span className="mr-1.5 text-white/25">{i + 1}</span>
                        {line.map(([txt, color], j) => (
                          <span key={j} style={{ color }}>
                            {txt}
                          </span>
                        ))}
                      </p>
                    ))}
                    {/* The review, pinned to the code. */}
                    <span
                      className={cn(
                        "absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1 rounded-full bg-white py-0.5 pr-1.5 pl-0.5 font-sans text-[8.5px] text-ink shadow-[0_4px_12px_-4px_rgb(0_0_0/0.5),0_0_0_1px_rgb(23_44_33/0.06)] transition-[opacity,scale] duration-300",
                        t >= STAGE[2] + 1.3 ? "scale-100 opacity-100" : "scale-90 opacity-0",
                      )}
                    >
                      <span className="grid size-3.5 place-items-center rounded-full bg-ink text-[6px] font-bold text-white">{c.review.who}</span>
                      {c.review.text}
                      <Check className="size-2.5 text-[#16a34a]" strokeWidth={3} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Published: the live page drops in. */}
        <div className={cn("absolute inset-0 flex flex-col overflow-hidden transition-[opacity,translate] duration-700", EASE, SURFACE, live ? "translate-y-0 opacity-100 delay-150" : "pointer-events-none -translate-y-4 opacity-0")}>
          <div className="flex h-[18px] shrink-0 items-center gap-1.5 bg-[#f6f7f6] px-2">
            <span className="flex gap-[3px]">
              {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
                <span key={col} className="size-[5px] rounded-full" style={{ background: col }} />
              ))}
            </span>
            <span className="mx-auto flex items-center gap-1 rounded-[4px] bg-white px-2 py-px font-mono text-[8px] text-ink/55 shadow-[0_0_0_1px_rgb(23_44_33/0.06)]">
              <Lock className="size-2" strokeWidth={2.4} />
              {c.page.url}
            </span>
          </div>
          <div className="flex min-h-0 flex-1 gap-2.5 px-2.5 pt-2">
            <div className="h-[58px] w-[84px] shrink-0 overflow-hidden rounded-[6px] bg-[radial-gradient(120%_90%_at_30%_20%,#1f4a33,#0b1711)] p-1.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
              <StackArt />
            </div>
            <div className="min-w-0">
              <span className="rounded-[3px] bg-light-green-soft px-1 py-px text-[8.5px] font-medium tracking-[0.04em] text-[#1a7f47] uppercase">{c.page.tag}</span>
              <p className="mt-1 text-[11.5px] leading-[1.25] font-semibold tracking-[-0.01em] text-ink">{c.title}</p>
              <p className="mt-1 flex items-center gap-1 text-[8.5px] text-ink/45">
                <span className="grid size-3 place-items-center rounded-full bg-ink text-[5.5px] font-bold text-white">Y</span>
                {c.page.author} &middot; {c.page.date} &middot; {c.page.read}
              </p>
            </div>
          </div>
          {/* Discovered: developers read it, Google ranks it, ChatGPT cites it. */}
          <div className="flex h-[24px] shrink-0 items-center gap-1.5 border-t border-ink/[0.06] px-2.5 text-[9px] text-ink/70">
            <span className={cn("flex items-center gap-1", fade(t >= SIGNAL(0)))}>
              <Users className="size-2.5 text-ink/55" strokeWidth={2} />
              <b className="font-semibold text-ink tabular-nums">{compact(count(t, SIGNAL(0), SIGNAL(0) + 1.6, c.signals.reads))}</b> dev reads
            </span>
            <span className="text-ink/20">&middot;</span>
            <span className={cn("flex items-center gap-1", fade(t >= SIGNAL(1)))}>
              <Mark name="google" className="size-2.5" />
              Ranking <b className="font-semibold text-ink">#{c.signals.rank}</b>
              <ArrowUp className="size-2.5 text-[#16a34a]" strokeWidth={2.6} />
            </span>
            <span className="text-ink/20">&middot;</span>
            <span className={cn("flex items-center gap-1", fade(t >= SIGNAL(2)))}>
              <Mark name="chatgpt" className="size-2.5" />
              Cited in ChatGPT
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── 02 Search + AI Visibility: one buyer question, one real answer, every engine agreeing ─────────────
   ChatGPT, drawn as itself: a new chat ("What can I help with?") where the question types into the composer and
   sends; it searches the web, then the answer streams at an easy pace with Your Product first and its sources
   as pills. Underneath, the other engines join one by one: Your Product is recommended by all six. */

// Timeline (seconds).
const TYPE = [0.5, 1.7]; // the question types into the composer
const SEND = 1.85; // sent: the thread replaces the new-chat screen
const SEARCHING = [2.15, 3.0]; // "Searching the web…", then "Searched 4 sites"
const STREAM = [3.05, 6.3]; // the answer streams
const AGREE = (i: number) => 6.55 + i * 0.36; // each engine's tick

/** A small "Y" favicon for Your Product. */
const Fav = ({ className = "size-3 text-[6px]" }: { className?: string }) => (
  <span className={cn("grid shrink-0 place-items-center rounded-full bg-ink font-bold text-white", className)}>Y</span>
);

export function SearchCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.search);
  const { prompt, lead, picks, engines } = SEARCH;
  const typed = prompt.slice(0, Math.round(prompt.length * seg(t, TYPE[0], TYPE[1])));
  const sent = t >= SEND;
  const p = seg(t, STREAM[0], STREAM[1]);
  const P = (a: number, b: number) => seg(p, a, b);
  const searching = t >= SEARCHING[0] && t < SEARCHING[1];
  const agreed = engines.map((_, i) => t >= AGREE(i));
  const count = agreed.filter(Boolean).length;
  return (
    <Card className={className} name={SEARCH.name} line={SEARCH.line} icon={<Search className="size-[18px]" strokeWidth={2} />}>
      {/* ChatGPT. */}
      <div className={cn("relative h-[142px] overflow-hidden bg-white text-[#0d0d0d]", SURFACE, PLATFORM, RAISED)}>
        <div className="flex h-[20px] items-center justify-between px-3 text-[10px]">
          <span className="flex items-center gap-0.5 font-semibold">
            ChatGPT <ChevronDown className="size-2.5 text-[#8f8f8f]" strokeWidth={2.4} />
          </span>
          <span className="flex items-center gap-2 text-[#5d5d5d]">
            <Share className="size-2.5" strokeWidth={2} />
            <Ellipsis className="size-2.5" strokeWidth={2} />
          </span>
        </div>

        {/* A new chat: the greeting and the composer the question types into. */}
        <div className={cn("absolute inset-x-0 top-[20px] bottom-0 flex flex-col items-center justify-center gap-2.5 px-4 transition-[opacity,translate] duration-500", EASE, sent ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100")}>
          <p className="text-[13px] font-medium tracking-[-0.01em]">What can I help with?</p>
          <div className="flex w-full items-center gap-2 rounded-[16px] bg-white py-1.5 pr-1.5 pl-3 shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_2px_8px_-2px_rgb(0_0_0/0.12)]">
            <span className="min-w-0 flex-1 truncate text-[10.5px]">
              {typed || <span className="text-[#8f8f8f]">Ask anything</span>}
              {t >= TYPE[0] - 0.3 && t < SEND && <span aria-hidden="true" className="ml-px inline-block h-3 w-px translate-y-0.5 animate-pulse bg-[#0d0d0d]" />}
            </span>
            <span className={cn("grid size-[18px] place-items-center rounded-full text-white transition-[background-color,scale] duration-200", typed ? "bg-[#0d0d0d]" : "bg-[#d7d7d7]", t >= SEND - 0.15 && t < SEND + 0.05 && "scale-90")}>
              <ArrowUp className="size-2.5" strokeWidth={2.6} />
            </span>
          </div>
        </div>

        {/* The thread. */}
        <div className={cn("absolute inset-x-0 top-[20px] bottom-0 px-3 pt-1 text-[10.5px] leading-[1.5] transition-opacity duration-500", sent ? "opacity-100" : "opacity-0")}>
          <p className={cn("ml-auto w-fit max-w-[86%] rounded-[14px] bg-[#f4f4f4] px-2.5 py-[2px] transition-[translate] duration-500", EASE, sent ? "translate-y-0" : "translate-y-16")}>{prompt}</p>
          <div className="relative mt-1.5">
            {/* Web search, then its collapsed summary. */}
            <p className={cn("absolute top-0 left-0 flex items-center gap-1 text-[9.5px] text-[#8f8f8f] transition-opacity", searching ? "opacity-100 duration-300" : "opacity-0 duration-150")}>
              <Globe className="size-2.5 animate-spin [animation-duration:2s]" strokeWidth={2} />
              <span className="animate-pulse">Searching the web&hellip;</span>
            </p>
            <p className={cn("flex items-center gap-1 text-[9.5px] text-[#8f8f8f] transition-opacity duration-300", t >= SEARCHING[1] ? "opacity-100 delay-200" : "opacity-0")}>
              Searched {SEARCH.searched} sites <ChevronDown className="size-2.5" strokeWidth={2.2} />
            </p>
            <div className="mt-0.5">
              <Stream text={lead} p={P(0, 0.18)} />
              {picks.map((k, i) => {
                const [a, b] = i === 0 ? [0.2, 0.7] : [0.78, 1];
                return (
                  <p key={k.name} className={cn("mt-0.5 transition-opacity duration-300", P(a, a + 0.02) > 0 ? "opacity-100" : "opacity-0", i > 0 && "text-[#5d5d5d]")}>
                    <b className="text-[#0d0d0d]">
                      {i + 1}. {k.name}
                    </b>{" "}
                    <Stream text={`— ${k.text}`} p={P(a + 0.02, b)} />
                    {"sources" in k &&
                      k.sources.map((s, j) => (
                        <span
                          key={s}
                          className={cn("mr-1 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-[#f4f4f4] py-px pr-1.5 pl-0.5 align-middle text-[8.5px] text-[#5d5d5d] transition-opacity duration-300", p >= 0.7 + j * 0.04 ? "opacity-100" : "opacity-0")}
                        >
                          {j === 0 ? <Fav className="size-2.5 text-[5px]" /> : <Mark name="reddit" className="size-2.5" />}
                          {s}
                        </span>
                      ))}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Every engine agrees. */}
      <div className="mt-2 flex h-[20px] items-center gap-2">
        <span className="text-[10.5px] whitespace-nowrap text-ink/55">Also recommended by</span>
        <ul className="flex items-center gap-1">
          {engines.map((e, i) => (
            <li
              key={e.key}
              title={e.name}
              className={cn(
                "relative grid size-[20px] place-items-center rounded-full bg-white transition-[box-shadow,opacity,scale] duration-400",
                agreed[i] ? "scale-100 opacity-100 shadow-[0_0_0_1px_rgb(25_150_80/0.45),0_2px_4px_-2px_rgb(25_150_80/0.5)]" : "scale-95 opacity-45 shadow-[0_0_0_1px_rgb(23_44_33/0.1)]",
              )}
            >
              <Mark name={e.mark} className={cn("size-3", e.key === "grok" && "[&>path]:fill-ink")} />
              <span className={cn("absolute -top-1 -right-1 grid size-[11px] place-items-center rounded-full bg-primary text-ink ring-[1.5px] ring-white transition-[scale,opacity] duration-300", agreed[i] ? "scale-100 opacity-100" : "scale-0 opacity-0")}>
                <Check className="size-[7px]" strokeWidth={4} />
              </span>
            </li>
          ))}
        </ul>
        <span className={cn("ml-auto text-[10.5px] font-medium whitespace-nowrap text-ink transition-opacity duration-500 tabular-nums", count > 0 ? "opacity-100" : "opacity-0")}>
          {count}/{engines.length} engines
        </span>
      </div>
    </Card>
  );
}

/* ── 03 Influencer Marketing: the creator writes and posts, then replies, reposts, likes and views climb ── */

export function CreatorCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.creators);
  const p = CREATORS.post;
  const POSTED = 1.55;
  const n = {
    views: count(t, POSTED + 0.2, 5.0, p.stats.views),
    likes: count(t, POSTED + 0.45, 4.8, p.stats.likes),
    reposts: count(t, POSTED + 0.7, 4.8, p.stats.reposts),
    replies: count(t, POSTED + 0.9, 4.9, p.stats.replies),
  };
  const liked = t >= POSTED + 0.5;
  const firstLine = p.text.split("\n")[0];
  const draft = firstLine.slice(0, Math.round(firstLine.length * seg(t, 0.2, 1.0)));
  const composing = t >= 0 && t < POSTED;
  const stat = (Icon: typeof Heart, value: number, label: string, cls?: string) => (
    <span className={cn("flex items-center gap-1 transition-colors duration-300", cls)} aria-label={`${value} ${label}`}>
      <Icon className="size-[13px]" strokeWidth={1.8} />
      <span className="tabular-nums">{compact(value)}</span>
    </span>
  );
  return (
    <Card className={className} name={CREATORS.name} line={CREATORS.line} icon={<Users className="size-[18px]" strokeWidth={1.8} />}>
      <div className={cn("relative", RAISED, SHOW, IN(t >= 0))}>
        {/* The live post. */}
        <div className={cn("relative overflow-hidden p-2.5 transition-opacity duration-500", SURFACE, PLATFORM, composing ? "opacity-0" : "opacity-100")}>
          <span
            aria-hidden="true"
            className={cn("absolute inset-x-0 top-0 h-[2px] origin-left bg-[#1d9bf0] transition-opacity duration-300", t >= POSTED + 0.6 ? "opacity-0" : "opacity-100")}
            style={{ transform: `scaleX(${seg(t, POSTED - 0.3, POSTED + 0.5)})` }}
          />
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed avatar from the post */}
            <img src={p.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgb(15_20_25/0.06)]" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="flex items-center gap-1 text-[12px]">
                <span className="truncate font-bold text-[#0f1419]">{p.name}</span>
                <BadgeCheck className="size-3.5 shrink-0 fill-[#1d9bf0] text-white" strokeWidth={2.2} />
                <span className="truncate text-[#536471]">
                  {p.handle} &middot; {t >= 0 && t !== Infinity ? "now" : p.date}
                </span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-[1.35] whitespace-pre-line text-[#0f1419]">{p.text}</p>
            </div>
            <Mark name="x" className="size-3.5" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- the post's attached image */}
          <img src={p.media} alt="" className="mt-2 ml-10 h-[56px] w-[calc(100%-2.5rem)] rounded-[10px] object-cover object-[50%_45%] shadow-[0_0_0_1px_rgb(15_20_25/0.08)]" />
          <div className="mt-2 ml-10 flex items-center justify-between text-[11px] text-[#536471]">
            {stat(MessageCircle, n.replies, "replies", n.replies > 0 ? "text-[#1d9bf0]" : undefined)}
            {stat(Repeat2, n.reposts, "reposts", n.reposts > 0 ? "text-[#00ba7c]" : undefined)}
            <span className={cn("relative flex items-center gap-1 transition-colors duration-300", liked && "text-[#f91880]")} aria-label={`${n.likes} likes`}>
              <Heart className={cn("size-[13px] transition-[scale,fill] duration-300", liked ? "scale-110 fill-[#f91880]" : "fill-transparent")} strokeWidth={1.8} />
              <span className="tabular-nums">{compact(n.likes)}</span>
              {liked && t < 4.8 && <span aria-hidden="true" className="absolute -top-1 left-0 size-3.5 animate-ping rounded-full bg-[#f91880]/30 [animation-duration:1.4s]" />}
            </span>
            {stat(ChartNoAxesColumn, n.views, "views")}
            <span className="flex gap-2">
              <Bookmark className="size-[13px]" strokeWidth={1.8} />
              <Share className="size-[13px]" strokeWidth={1.8} />
            </span>
          </div>
        </div>

        {/* Compose: the creator writes it and hits Post. */}
        <div className={cn("absolute inset-0 flex flex-col p-2.5 transition-opacity duration-400", SURFACE, PLATFORM, composing ? "opacity-100" : "pointer-events-none opacity-0")}>
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed avatar from the post */}
            <img src={p.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
            <p className="min-h-[34px] flex-1 pt-1.5 text-[12.5px] leading-[1.35] text-[#0f1419]">
              {draft || <span className="text-[#536471]">What&rsquo;s happening?</span>}
              {t < 1.05 && <span aria-hidden="true" className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-[#1d9bf0]" />}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- the attachment, added to the draft */}
          <img src={p.media} alt="" className={cn("mt-1.5 ml-10 h-[44px] w-[calc(100%-2.5rem)] rounded-[10px] object-cover object-[50%_45%] transition-opacity duration-300", t >= 0.75 ? "opacity-100" : "opacity-0")} />
          <div className="mt-auto ml-10 flex items-center justify-between border-t border-[#eff3f4] pt-1.5">
            <span className="flex gap-2.5 text-[#1d9bf0]">
              <ImageIcon className="size-[13px]" strokeWidth={1.9} />
              <ListOrdered className="size-[13px]" strokeWidth={1.9} />
              <CalendarClock className="size-[13px]" strokeWidth={1.9} />
              <MapPin className="size-[13px]" strokeWidth={1.9} />
            </span>
            <span
              className={cn(
                "rounded-full bg-[#0f1419] px-3 py-1 text-[11px] font-bold text-white transition-[opacity,scale] duration-150",
                draft.length < firstLine.length ? "opacity-50" : "opacity-100",
                t >= 1.2 && t < 1.38 ? "scale-95" : "scale-100",
              )}
            >
              Post
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── 04 Reddit: the thread, the helpful comment slides in, its product mention lights, upvotes climb ──── */

/** A block that opens from zero height (grid-rows trick), fading and settling as it does. */
function Reveal({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn(`grid transition-[grid-template-rows,opacity] duration-[600ms] ${EASE}`, open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0", className)}>
      <div className={cn(`min-h-0 transition-transform duration-[600ms] ${EASE}`, open ? "translate-y-0" : "-translate-y-2")}>{children}</div>
    </div>
  );
}

export function RedditCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.reddit);
  const { thread, comment } = REDDIT;
  const votes = count(t, 1.9, 4.2, comment.votes, 1);
  const upvoted = t >= 1.85;
  const pill = "flex items-center gap-1 rounded-full bg-[#eef1f3] px-1.5 py-0.5";
  return (
    <Card className={className} name={REDDIT.name} line={REDDIT.line} tint="bg-[linear-gradient(180deg,#ff5c1f,#ff4500)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_6px_-2px_rgb(255_69_0/0.6)]" icon={<Mark name="reddit" className="size-[20px] [&>path]:fill-white" />}>
      <div className={cn("p-2.5", SURFACE, PLATFORM, RAISED, SHOW, IN(t >= 0.15))}>
        <div className="flex items-center gap-1.5 text-[10.5px] text-[#576f76]">
          <span className="grid size-4 place-items-center rounded-full bg-[#ff4500]">
            <Mark name="reddit" className="size-2.5 [&>path]:fill-white" />
          </span>
          <span className="font-semibold text-[#0f1a1c]">{thread.sub}</span>
          <span>&middot; {thread.age}</span>
          <span className="ml-auto rounded-full bg-[#0a449b] px-2 py-px text-[9.5px] font-semibold text-white">Join</span>
        </div>
        <p className="mt-1 text-[12.5px] leading-tight font-semibold text-[#0f1a1c]">
          {thread.title}{" "}
          <span className="relative -top-px rounded-full bg-[#e5ebee] px-1.5 py-px align-middle text-[9px] font-medium text-[#2a3c42]">Discussion</span>
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#576f76]">
          <span className={pill}>
            <ArrowBigUp className="size-3" strokeWidth={1.8} />
            <span className="tabular-nums">{count(t, 0.3, 4.2, thread.votes, thread.votes - 26)}</span>
            <ArrowBigDown className="size-3" strokeWidth={1.8} />
          </span>
          <span className={pill}>
            <MessageCircle className="size-3" strokeWidth={2} />
            <span className="tabular-nums">{thread.comments}</span>
          </span>
          <span className={pill}>
            <Share className="size-3" strokeWidth={2} />
            Share
          </span>
        </div>

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
