"use client";

import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowUp,
  Bookmark,
  CalendarClock,
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
  Smile,
  Star,
  Users,
} from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Mark } from "../services/parts";
import { Snoovatar } from "../services/reddit/Snoovatar";
import { compact, count, out, seg, usePlayhead, type CardState } from "./clock";
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
export const DURATION = { content: 8.6, search: 5.8, creators: 10, reddit: 9 } as const;

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
   The client's workflow is a segmented track on top: a raised pill slides to the stage at work (a hairline
   under it fills as the stage runs) and finished stages turn into green ticks. Beneath it, one editor document
   evolves rather than swapping panels, each stage given one clear picture and room to breathe: Inputs (four
   sources dock in as tiles), Brief (they fold into a source line; the title and an outline on a rail type in),
   Build & Review (the code, with an engineer's review pinned beside the line it checked; the status turns to
   Approved). At Published the document drops away and the live blog page drops in, in a browser frame; then it
   gets discovered: developers read it, Google ranks it, ChatGPT cites it. */

const STEP_ICON = { folder: Folder, doc: FileText, code: Code, rocket: Rocket } as const;
// Timeline (seconds): when each stage starts; the last entry is when the page goes live.
const STAGE = [0.3, 2.0, 3.7, 5.7];
const LIVE = STAGE[3] + 0.35;
const REVIEWED = STAGE[2] + 1.25; // the review lands, the status turns to Approved
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

/** A small green tick: a finished stage, a verified review. */
const Tick = ({ className }: { className?: string }) => (
  <span className={cn("grid shrink-0 place-items-center rounded-full bg-[linear-gradient(180deg,#3cf086,#16c75f)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_1px_2px_rgb(25_150_80/0.45)]", className)}>
    <Check className="size-[65%]" strokeWidth={3.4} />
  </span>
);

export function ContentCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.content);
  const c = CONTENT;
  // The stage now working (-1 before it starts), and whether each is done.
  const stage = t < STAGE[0] ? -1 : STAGE.filter((s) => t >= s).length - 1;
  const done = (i: number) => (i < 3 ? t >= STAGE[i + 1] : t >= LIVE);
  const live = t >= LIVE;
  const reviewed = t >= REVIEWED;
  const at = Math.max(stage, 0);
  const outlineTyped = seg(t, STAGE[1] + 0.55, STAGE[1] + 1.45);
  const status = stage < 0 ? "Draft" : reviewed ? "Approved" : c.steps[Math.min(stage, 2)].status;
  return (
    <Card className={className} name={c.name} line={c.line} icon={<FileText className="size-[18px]" strokeWidth={1.8} />}>
      {/* The workflow: a segmented track; the raised pill slides to the stage at work. */}
      <ol className="relative mt-1 grid h-[26px] grid-cols-4 rounded-full bg-[#f2f5f3] p-[3px] shadow-[inset_0_0_0_1px_rgb(23_44_33/0.05),inset_0_1px_2px_rgb(23_44_33/0.06)]">
        <span
          aria-hidden="true"
          className={cn("absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/4)] rounded-full bg-white shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.06),0_1px_2px_rgb(23_44_33/0.08),0_4px_10px_-5px_rgb(23_44_33/0.22)] transition-[translate,opacity] duration-700", EASE, stage < 0 ? "opacity-0" : "opacity-100")}
          style={{ translate: `${at * 100}% 0` }}
        />
        {c.steps.map((s, i) => {
          const Icon = STEP_ICON[s.icon];
          const isDone = done(i);
          const current = stage === i;
          return (
            <li key={s.name} className={cn("relative flex items-center justify-center gap-1 text-[9.5px] whitespace-nowrap transition-colors duration-500", current ? "font-medium text-ink" : isDone ? "text-ink/55" : "text-ink/35")}>
              <span className="relative grid size-[12px] place-items-center">
                <Icon className={cn("absolute size-[11px] transition-[opacity,scale] duration-300", isDone ? "scale-50 opacity-0" : "scale-100 opacity-100")} strokeWidth={2} />
                <Tick className={cn("absolute size-[12px] transition-[opacity,scale] duration-300", isDone ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
              </span>
              {s.name}
            </li>
          );
        })}
      </ol>

      <div className={cn("relative mt-3 h-[128px]", RAISED)}>
        {/* The document, evolving. */}
        <div className={cn("absolute inset-0 overflow-hidden transition-[opacity,translate,scale] duration-500", EASE, SURFACE, live ? "pointer-events-none translate-y-3 scale-[0.97] opacity-0" : "opacity-100")}>
          <div className="flex h-[22px] items-center gap-1.5 border-b border-ink/[0.05] bg-[linear-gradient(180deg,#fcfdfc,#f8faf9)] px-3 text-[9px] text-ink/45">
            <FileText className="size-2.5" strokeWidth={2} />
            <span className="font-mono tracking-[-0.01em]">{c.file}</span>
            <span
              className={cn(
                "ml-auto flex items-center gap-1 rounded-full px-1.5 py-px text-[8.5px] font-medium transition-colors duration-500",
                reviewed ? "bg-[#e7f9ee] text-[#13804a]" : stage >= 2 ? "bg-[#fff3e0] text-[#a15c00]" : "bg-ink/[0.05] text-ink/55",
              )}
            >
              <span className={cn("size-[5px] rounded-full transition-colors duration-500", reviewed ? "bg-[#19c463]" : stage >= 2 ? "bg-[#f0a020]" : "bg-ink/30")} />
              {status}
            </span>
          </div>

          <div className="relative h-[106px] px-3 pt-2">
            {/* Inputs: the sources dock in as tiles. */}
            <ul className={cn("absolute inset-x-3 top-3 grid grid-cols-2 gap-1.5 transition-opacity duration-300", stage <= 0 ? "opacity-100" : "pointer-events-none opacity-0")}>
              {c.sources.map((s, i) => (
                <li
                  key={s.label}
                  className={cn(
                    "flex h-[40px] items-center gap-2 rounded-[9px] bg-[linear-gradient(180deg,#ffffff,#fafbfa)] px-2 shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.06),0_1px_2px_rgb(23_44_33/0.04),0_4px_10px_-8px_rgb(23_44_33/0.25)]",
                    "transition-[opacity,translate,scale] duration-500",
                    EASE,
                    t >= STAGE[0] + 0.15 + i * 0.3 ? "translate-y-0 scale-100 opacity-100" : "translate-y-1.5 scale-[0.97] opacity-0",
                  )}
                >
                  <span className="grid size-[22px] shrink-0 place-items-center rounded-[7px] bg-[#f4f6f5] shadow-[inset_0_0_0_1px_rgb(23_44_33/0.05)]">
                    <Mark name={s.mark} className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] leading-[1.25] text-ink/85">{s.label}</span>
                    <span className="block text-[8.5px] leading-[1.25] text-ink/40">{s.note}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Brief onward: the sources fold into one line; the title types in. */}
            <div className={cn("transition-opacity duration-500", stage >= 1 ? "opacity-100" : "opacity-0")}>
              <p className="flex h-3 items-center gap-1.5 text-[8.5px] text-ink/40">
                <span className="flex -space-x-1">
                  {c.sources.map((s) => (
                    <span key={s.label} className="grid size-3.5 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.08)]">
                      <Mark name={s.mark} className="size-2" />
                    </span>
                  ))}
                </span>
                Built from {c.sources.length} sources
              </p>
              <p className="mt-1.5 text-[12px] leading-tight font-semibold tracking-[-0.015em] text-ink">
                <Stream text={c.title} p={seg(t, STAGE[1] + 0.1, STAGE[1] + 0.6)} />
              </p>

              <div className="relative mt-2">
                {/* Brief: the outline, on a rail; each node lights as its heading lands. */}
                <ul className={cn("relative space-y-[3px] pl-3.5 transition-opacity duration-400", stage === 1 ? "opacity-100" : "opacity-0")}>
                  <span aria-hidden="true" className={cn("absolute top-[7px] bottom-[7px] left-[3px] w-px origin-top bg-ink/10 transition-[scale] duration-700", EASE, outlineTyped > 0 ? "scale-y-100" : "scale-y-0")} />
                  {c.outline.map((h, i) => {
                    const on = outlineTyped > i / c.outline.length;
                    return (
                      <li key={h} className={cn("relative flex h-[14px] items-center text-[10px] text-ink/70", fade(on))}>
                        <span aria-hidden="true" className="absolute top-1/2 -left-3.5 size-[7px] -translate-y-1/2 rounded-full bg-white shadow-[inset_0_0_0_1.5px_rgb(25_170_90/0.75)]" />
                        {h}
                      </li>
                    );
                  })}
                </ul>

                {/* Build & Review: the code, and the engineer's review pinned beside the line it checked. */}
                <div className={cn("absolute inset-x-0 top-0 flex items-stretch gap-2 transition-opacity duration-500", stage >= 2 ? "opacity-100" : "opacity-0")}>
                  <div className={cn("relative w-[192px] shrink-0 overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,#fafbfa,#f3f6f4)] py-1.5 font-mono text-[8.5px] leading-[1.5] shadow-[inset_0_0_0_1px_rgb(23_44_33/0.06)]", fade(t >= STAGE[2] + 0.2))}>
                    {c.code.map((line, i) => {
                      const checked = i === 1; // the review is on the conversion line
                      return (
                        <p key={i} className={cn("relative truncate px-2 transition-colors duration-500", checked && reviewed ? "bg-[rgb(25_231_110/0.1)]" : "")}>
                          {checked && <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-[2px] bg-[#19c463] transition-opacity duration-500", reviewed ? "opacity-100" : "opacity-0")} />}
                          <span className="mr-2 text-ink/25">{i + 1}</span>
                          {line.map(([txt, color], j) => (
                            <span key={j} style={{ color }}>
                              {txt}
                            </span>
                          ))}
                        </p>
                      );
                    })}
                  </div>
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col justify-center gap-[3px] rounded-[8px] bg-white px-2 shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.04),0_6px_14px_-8px_rgb(23_44_33/0.25)]",
                      "transition-[opacity,translate] duration-500",
                      EASE,
                      reviewed ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
                    )}
                  >
                    <p className="flex items-center gap-1 text-[8.5px] leading-none">
                      <span className="grid size-3.5 place-items-center rounded-full bg-ink text-[6px] font-bold text-white">{c.review.who}</span>
                      <b className="font-semibold text-ink">{c.review.who}</b>
                      <span className="text-ink/40">{c.review.role}</span>
                    </p>
                    <p className="flex items-center gap-1 text-[8.5px] leading-none text-ink/70">
                      <span className="truncate">{c.review.text}</span>
                      <Tick className="size-[10px]" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Published: the live page drops in. */}
        <div className={cn("absolute inset-0 flex flex-col overflow-hidden transition-[opacity,translate] duration-700", EASE, SURFACE, live ? "translate-y-0 opacity-100 delay-150" : "pointer-events-none -translate-y-4 opacity-0")}>
          <div className="relative flex h-[20px] shrink-0 items-center border-b border-ink/[0.05] bg-[linear-gradient(180deg,#fafbfa,#f3f5f4)] px-2.5">
            <span className="flex gap-[3px]">
              {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
                <span key={col} className="size-[5px] rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)]" style={{ background: col }} />
              ))}
            </span>
            <span className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-[5px] bg-white px-2 py-[2px] font-mono text-[8px] whitespace-nowrap text-ink/55 shadow-[0_0_0_1px_rgb(23_44_33/0.06),0_1px_1px_rgb(23_44_33/0.04)]">
              <Lock className="size-2" strokeWidth={2.4} />
              {c.page.url}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[8px] font-medium text-[#13804a]">
              <span className="relative flex size-[5px]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#19c463]/60 [animation-duration:1.8s]" />
                <span className="relative size-[5px] rounded-full bg-[#19c463]" />
              </span>
              Live
            </span>
          </div>
          <div className="flex min-h-0 flex-1 items-center gap-3 px-3">
            <div className="relative h-[58px] w-[86px] shrink-0 overflow-hidden rounded-[8px] bg-[radial-gradient(120%_100%_at_30%_15%,#24573b,#0b1711_70%)] p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),inset_0_0_0_1px_rgb(255_255_255/0.05),0_6px_14px_-8px_rgb(11_23_17/0.6)]">
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_80%_at_50%_100%,rgb(54_232_136/0.25),transparent)]" />
              <StackArt />
            </div>
            <div className="min-w-0 text-[10px] leading-none">
              <span className="inline-block rounded-full bg-[#e7f9ee] px-1.5 py-[2.5px] text-[7.5px] font-semibold tracking-[0.08em] text-[#13804a] uppercase">{c.page.tag}</span>
              <p className="mt-1.5 text-[12px] leading-[1.25] font-semibold tracking-[-0.015em] text-ink">{c.title}</p>
              <p className="mt-1.5 flex items-center gap-1 text-[8.5px] text-ink/45">
                <ProductMark chip className="size-3" />
                {c.page.author} &middot; {c.page.date} &middot; {c.page.read}
              </p>
            </div>
          </div>
          {/* Discovered: developers read it, Google ranks it, ChatGPT cites it. */}
          <div className="grid h-[28px] shrink-0 grid-cols-3 divide-x divide-ink/[0.06] border-t border-ink/[0.05] bg-[linear-gradient(180deg,#fbfcfb,#f7f9f8)] text-[9px] text-ink/50">
            <span className={cn("flex items-center justify-center gap-1", fade(t >= SIGNAL(0)))}>
              <Users className="size-2.5 text-ink/45" strokeWidth={2} />
              <b className="font-semibold text-ink tabular-nums">{compact(count(t, SIGNAL(0), SIGNAL(0) + 1.6, c.signals.reads))}</b> dev reads
            </span>
            <span className={cn("flex items-center justify-center gap-1", fade(t >= SIGNAL(1)))}>
              <Mark name="google" className="size-2.5" />
              <b className="font-semibold text-ink">#{c.signals.rank}</b> on Google
              <ArrowUp className="size-2.5 text-[#16a34a]" strokeWidth={2.6} />
            </span>
            <span className={cn("flex items-center justify-center gap-1", fade(t >= SIGNAL(2)))}>
              <Mark name="chatgpt" className="size-2.5" />
              Cited by <b className="font-semibold text-ink">ChatGPT</b>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── 02 Search + AI Visibility: a buyer asks, the AI names your product, every engine agrees ──────────────
   Kept visual rather than readable. ChatGPT, drawn as itself: a new chat where the buyer's question types into
   the composer and sends; the answer is Your Product as the top pick (a short tag and its sources) with the
   other options faded to placeholders beneath it. Then the other engines' marks rise in one by one: the same
   recommendation everywhere. */

// Timeline (seconds).
const TYPE = [0.45, 1.55]; // the question types into the composer
const SEND = 1.7; // sent: the thread replaces the new-chat screen
const PICK = 2.15; // the top-pick card lands
const BADGE = PICK + 0.45; // "Top pick" stamps on, a sheen crosses the card
const SOURCE = (i: number) => BADGE + 0.3 + i * 0.15; // its source chips
const OTHERS = (i: number) => PICK + 0.25 + i * 0.12; // the faded runners-up
const ENGINE = (i: number) => 3.55 + i * 0.3; // each engine's mark rises in
const SETTLED = ENGINE(5) + 0.45; // all six in: the row settles

/** Your Product's mark, an app icon in the brand green: a page with one of its lines lifted off as a clean,
 *  structured row (the product parses documents into data for RAG). `chip` is the tiny favicon cut: just the row. */
function ProductMark({ className, chip = false }: { className?: string; chip?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#4cf096" />
          <stop offset="1" stopColor="#0fae56" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx={chip ? 16 : 8.5} fill={`url(#${id}b)`} />
      <rect width="32" height="16" rx={chip ? 8 : 8.5} fill={`url(#${id}h)`} />
      {chip ? (
        <g>
          <rect x="5" y="11.5" width="22" height="9" rx="4.5" fill="#172c21" />
          <circle cx="10" cy="16" r="2.2" fill="#3ff08c" />
          <rect x="14" y="14.8" width="9" height="2.4" rx="1.2" fill="#fff" fillOpacity="0.9" />
        </g>
      ) : (
        <g>
          <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="none" stroke="#0b6b37" strokeOpacity="0.18" />
          {/* The page, tilted back a touch, its lines still plain text. */}
          <g transform="rotate(-8 15 16)">
            <rect x="7.6" y="8.2" width="13" height="17.5" rx="2.2" fill="#064d26" fillOpacity="0.2" />
            <rect x="7.6" y="7" width="13" height="17.5" rx="2.2" fill="#fff" />
            <rect x="10" y="10" width="6.5" height="1.5" rx="0.75" fill="#172c21" fillOpacity="0.2" />
            <rect x="10" y="18.2" width="8" height="1.5" rx="0.75" fill="#172c21" fillOpacity="0.2" />
            <rect x="10" y="21" width="5.5" height="1.5" rx="0.75" fill="#172c21" fillOpacity="0.2" />
          </g>
          {/* One line lifted off the page as a clean, structured row. */}
          <rect x="11.2" y="14.7" width="14.6" height="5" rx="2.5" fill="#064d26" fillOpacity="0.25" />
          <rect x="11.2" y="13.6" width="14.6" height="5" rx="2.5" fill="#172c21" />
          <circle cx="14" cy="16.1" r="1.2" fill="#3ff08c" />
          <rect x="16.2" y="15.4" width="7.2" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.85" />
        </g>
      )}
    </svg>
  );
}

export function SearchCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.search);
  const { prompt, pick, engines } = SEARCH;
  const typed = prompt.slice(0, Math.round(prompt.length * seg(t, TYPE[0], TYPE[1])));
  const sent = t >= SEND;
  const landed = t >= PICK;
  const settled = t >= SETTLED;
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

        {/* The thread: the question, then the answer as one clear recommendation. */}
        <div className={cn("absolute inset-x-0 top-[20px] bottom-0 px-3 pt-1 text-[10.5px] leading-[1.5] transition-opacity duration-500", sent ? "opacity-100" : "opacity-0")}>
          <p className={cn("ml-auto w-fit max-w-[86%] rounded-[14px] bg-[#f4f4f4] px-2.5 py-[2px] transition-[translate] duration-500", EASE, sent ? "translate-y-0" : "translate-y-16")}>{prompt}</p>

          {/* The top pick. */}
          <div
            className={cn(
              "relative mt-2 flex items-center gap-2.5 overflow-hidden rounded-[11px] py-2 pr-2.5 pl-2 transition-[opacity,translate,scale,box-shadow] duration-600",
              EASE,
              "bg-[linear-gradient(180deg,#f7fdf9_0%,#ffffff_70%)]",
              landed ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0",
              t >= BADGE
                ? "shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(25_150_80/0.14),0_1px_2px_rgb(23_44_33/0.04),0_8px_20px_-10px_rgb(25_150_80/0.28)]"
                : "shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.04),0_6px_14px_-10px_rgb(23_44_33/0.2)]",
            )}
          >
            {/* A sheen that crosses once as the badge lands. */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.7),transparent)] transition-[translate] duration-[1100ms]",
                EASE,
                t >= BADGE ? "translate-x-[320%]" : "-translate-x-full",
              )}
            />
            <ProductMark className="size-[28px] drop-shadow-[0_3px_5px_rgb(15_174_86/0.28)]" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 leading-none">
                <b className="text-[11.5px] font-semibold tracking-[-0.015em] text-[#111]">{pick.name}</b>
                <span
                  className={cn(
                    "inline-flex items-center gap-[3px] rounded-full bg-[linear-gradient(180deg,#eafbf1,#dcf6e7)] px-1.5 py-[2px] text-[8px] font-medium tracking-[0.01em] text-[#13804a] shadow-[inset_0_1px_0_rgb(255_255_255/0.9),inset_0_0_0_1px_rgb(25_150_80/0.12)] transition-[opacity,scale] duration-300",
                    t >= BADGE ? "scale-100 opacity-100" : "scale-75 opacity-0",
                  )}
                >
                  <Star className="size-[7px] fill-[#19c463]" strokeWidth={0} />
                  Top pick
                </span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 leading-none">
                <span className="text-[9.5px] text-[#6b6b6b]">{pick.tag}</span>
                <span className="ml-auto flex items-center gap-1">
                  {pick.sources.map((s, j) => (
                    <span key={s} className={cn("inline-flex items-center gap-1 rounded-full bg-[#f5f5f4] py-px pr-1.5 pl-0.5 text-[8px] text-[#6b6b6b]", SHOW, IN(t >= SOURCE(j)))}>
                      {j === 0 ? <ProductMark chip className="size-2.5" /> : <Mark name="reddit" className="size-2.5" />}
                      {s}
                    </span>
                  ))}
                </span>
              </p>
            </div>
          </div>

          {/* The rest, faded to placeholders. */}
          <ul className="mt-2 space-y-1.5 px-2" aria-hidden="true">
            {[0.46, 0.32].map((w, i) => (
              <li key={w} className={cn("flex items-center gap-2", SHOW, t >= OTHERS(i) ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0")}>
                <span className="w-2 text-[8.5px] font-medium text-[#cfcfcf] tabular-nums">{i + 2}</span>
                <span className="size-2.5 rounded-full bg-[#f1f1f0]" />
                <span className="h-[5px] rounded-full bg-[linear-gradient(90deg,#efefee,#f6f6f5)]" style={{ width: `${w * 100}%` }} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The same answer on every engine: the marks rise in one by one. */}
      <div className="mt-2 flex h-[22px] items-center gap-2.5">
        <span className={cn("text-[10.5px] whitespace-nowrap text-ink/50", SHOW, IN(t >= ENGINE(0) - 0.2))}>Recommended on</span>
        <ul className="flex items-center gap-1.5">
          {engines.map((e, i) => (
            <li
              key={e.key}
              title={e.name}
              className={cn(
                "grid size-[22px] place-items-center rounded-full bg-[linear-gradient(180deg,#ffffff,#fafbfa)] transition-[opacity,translate,scale,box-shadow] duration-500",
                EASE,
                t >= ENGINE(i) ? "translate-y-0 scale-100 opacity-100" : "translate-y-1.5 scale-90 opacity-0",
                settled
                  ? "shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(25_150_80/0.12),0_1px_2px_rgb(23_44_33/0.05),0_6px_12px_-6px_rgb(25_150_80/0.3)]"
                  : "shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.06),0_1px_2px_rgb(23_44_33/0.05),0_4px_10px_-6px_rgb(23_44_33/0.2)]",
              )}
            >
              <Mark name={e.mark} className={cn("size-3", e.key === "grok" && "[&>path]:fill-ink")} />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/** A reader's cursor that glides in, taps at `tap` (seconds), and drifts away. Positioned by `className` with its
 *  tip over the target; `from` and `away` are where it comes from and goes to (px). */
function Pointer({ t, tap, from = [42, 3], away = [16, 5], className }: { t: number; tap: number; from?: [number, number]; away?: [number, number]; className?: string }) {
  const phase = t < tap - 1.0 ? 0 : t < tap + 1.1 ? 1 : 2;
  const [x, y] = phase === 0 ? from : phase === 1 ? [0, 0] : away;
  const glide = phase === 0 ? 0 : phase === 1 ? 900 : 700;
  const pressed = t >= tap - 0.08 && t < tap + 0.16;
  return (
    <svg
      viewBox="0 0 12 16"
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-10 h-[15px] w-[11px] drop-shadow-[0_1.5px_2px_rgb(15_20_25/0.3)] ease-[cubic-bezier(0.45,0,0.2,1)]", className)}
      style={{
        translate: `${x}px ${y}px`,
        scale: pressed ? "0.82" : "1",
        opacity: phase === 1 ? 1 : 0,
        transformOrigin: "1px 1px",
        transitionProperty: "translate, opacity, scale",
        transitionDuration: `${glide}ms, ${glide}ms, 150ms`,
      }}
    >
      <path d="M1 1v12.2l3.1-3 2.1 4.8 2.2-.95-2.1-4.75H10.6Z" fill="#0f1419" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

/* ── 03 Influencer Marketing: the creator writes and posts, then the post takes off ────────────────────
   X, drawn as its post view, at an unhurried pace: the creator types the opening line in the composer and
   hits Post (X's thin blue bar runs across the top); the post settles in, folded at "Show more" the way X
   folds a long post. Then it takes off: views drift up in the timestamp line, replies, reposts and bookmarks
   climb (each appearing as its first count lands, as X hides zeros), and a reader's cursor glides to the heart
   and taps it: X's own pop (the heart springs, a ring flares, a few sparks drift out) and the count turns pink. */

// Timeline (seconds).
const X_TYPE = [0.4, 2.3]; // the opening line types into the composer
const X_PRESS = [2.6, 2.85]; // Post is pressed
const X_POSTED = 3.0; // the post replaces the composer
const X_LIKE = 5.3; // the reader's tap lands on the heart

/** X's count format: 167, 3.4K, 44K, 902K (it truncates rather than rounds, and hides zero). */
const xCount = (n: number) => (n === 0 ? "" : n < 1000 ? String(n) : n < 10000 ? `${(Math.floor(n / 100) / 10).toString()}K` : `${Math.floor(n / 1000)}K`);
/** The views figure in a post's timestamp line: 902.7K. */
const xViews = (n: number) => (n < 1000 ? String(n) : `${(Math.floor(n / 100) / 10).toString()}K`);

const X_INK = "#0f1419";
const X_GREY = "#536471";
const X_BLUE = "#1d9bf0";
const X_PINK = "#f91880";

/** X's verified badge. */
const Verified = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 22 22" className={cn("shrink-0", className)} aria-label="Verified account" role="img">
    <path
      fill={X_BLUE}
      d="M20.4 11c0-1.3-.8-2.5-2-3.1.4-1.3.2-2.7-.7-3.6s-2.3-1.2-3.6-.7C13.5 2.4 12.3 1.6 11 1.6s-2.5.8-3.1 2c-1.3-.4-2.7-.2-3.6.7s-1.2 2.3-.7 3.6c-1.2.6-2 1.8-2 3.1s.8 2.5 2 3.1c-.4 1.3-.2 2.7.7 3.6s2.3 1.2 3.6.7c.6 1.2 1.8 2 3.1 2s2.5-.8 3.1-2c1.3.4 2.7.2 3.6-.7s1.2-2.3.7-3.6c1.2-.6 2-1.8 2-3.1Z"
    />
    <path d="m7.2 11.2 2.5 2.5 5-5.4" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const X_KEYFRAMES = `
@keyframes x-heart { 0% { transform: scale(0.2) } 40% { transform: scale(1.32) } 62% { transform: scale(0.9) } 80% { transform: scale(1.06) } 100% { transform: scale(1) } }
@keyframes x-ring { 0% { transform: scale(0.3); opacity: 0.75; border-width: 5px } 100% { transform: scale(1.6); opacity: 0; border-width: 0.5px } }
@keyframes x-spark { 0% { transform: rotate(var(--a)) translateY(-3px) scale(1); opacity: 0 } 20% { opacity: 1 } 100% { transform: rotate(var(--a)) translateY(-13px) scale(0.2); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .x-burst { display: none } .x-pop { animation: none !important } }
`;
const SPARKS = [
  { a: 0, c: "#f91880" },
  { a: 60, c: "#ff7ab8" },
  { a: 120, c: "#9b6bff" },
  { a: 180, c: "#f91880" },
  { a: 240, c: "#1d9bf0" },
  { a: 300, c: "#ffb000" },
];

export function CreatorCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.creators);
  const p = CREATORS.post;
  const s = p.stats;
  const n = {
    views: count(t, X_POSTED + 0.5, DURATION.creators - 0.3, s.views),
    replies: count(t, X_POSTED + 1.1, DURATION.creators - 0.5, s.replies),
    reposts: count(t, X_POSTED + 1.5, DURATION.creators - 0.5, s.reposts),
    likes: count(t, X_POSTED + 0.8, DURATION.creators - 0.4, s.likes),
    bookmarks: count(t, X_POSTED + 1.9, DURATION.creators - 0.4, s.bookmarks),
  };
  const opening = p.paragraphs[0];
  const draft = opening.slice(0, Math.round(opening.length * seg(t, X_TYPE[0], X_TYPE[1])));
  const composing = t >= 0 && t < X_POSTED;
  const liked = t >= X_LIKE;
  const bursting = liked && t < X_LIKE + 1.4; // the pop plays once, live; the finished picture is just the pink heart
  const action = (Icon: typeof Heart, value: number, label: string) => (
    <span className="flex items-center gap-[5px]" aria-label={`${value} ${label}`}>
      <Icon className="size-[13px]" strokeWidth={1.75} />
      <span className="tabular-nums">{xCount(value)}</span>
    </span>
  );
  return (
    <Card className={className} name={CREATORS.name} line={CREATORS.line} icon={<Users className="size-[18px]" strokeWidth={1.8} />}>
      <style>{X_KEYFRAMES}</style>
      <div className={cn("relative h-[168px]", RAISED, SHOW, IN(t >= 0))}>
        {/* The post. */}
        <div className={cn("absolute inset-0 flex flex-col overflow-hidden px-3 pt-2.5 transition-[opacity,translate] duration-700", EASE, SURFACE, PLATFORM, composing ? "translate-y-1.5 opacity-0" : "translate-y-0 opacity-100 delay-100")}>
          {/* X's posting bar. */}
          <span
            aria-hidden="true"
            className={cn("absolute inset-x-0 top-0 h-[2px] origin-left transition-opacity duration-700", t >= X_POSTED + 0.9 ? "opacity-0" : "opacity-100")}
            style={{ background: X_BLUE, transform: `scaleX(${out(seg(t, X_PRESS[0], X_POSTED + 0.6))})` }}
          />
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed avatar from the post */}
            <img src={p.avatar} alt="" className="size-[30px] shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgb(15_20_25/0.06)]" />
            <div className="min-w-0 flex-1 leading-[1.2]">
              <p className="flex items-center gap-[3px] text-[11.5px] font-bold" style={{ color: X_INK }}>
                <span className="truncate">{p.name}</span>
                <Verified className="size-[13px]" />
              </p>
              <p className="truncate text-[10.5px]" style={{ color: X_GREY }}>
                {p.handle}
              </p>
            </div>
            <Mark name="x" className="size-3" />
          </div>

          <div className="mt-2 text-[11.5px] leading-[1.38]" style={{ color: X_INK }}>
            {p.paragraphs.map((para, i) => (
              <p key={i} className={i > 0 ? "mt-[5px]" : undefined}>
                {para}
              </p>
            ))}
            <p className="mt-[3px]" style={{ color: X_BLUE }}>
              Show more
            </p>
          </div>

          <p className="mt-2 text-[10px]" style={{ color: X_GREY }}>
            {p.time} &middot;{" "}
            <b className="font-bold tabular-nums" style={{ color: X_INK }}>
              {xViews(n.views)}
            </b>{" "}
            Views
          </p>

          <div className="mt-auto flex h-[30px] items-center justify-between border-t border-[#eff3f4] text-[10.5px]" style={{ color: X_GREY }}>
            {action(MessageCircle, n.replies, "replies")}
            {action(Repeat2, n.reposts, "reposts")}
            <span className="flex items-center gap-[5px] transition-colors duration-200" style={{ color: liked ? X_PINK : undefined }} aria-label={`${n.likes} likes`}>
              <span className="relative grid size-[13px] place-items-center">
                <Heart
                  className={cn("x-pop size-[13px] transition-[fill] duration-200", bursting && "animate-[x-heart_0.9s_cubic-bezier(0.25,0.8,0.35,1)_both]")}
                  style={{ fill: liked ? X_PINK : "transparent" }}
                  strokeWidth={1.75}
                />
                {bursting && (
                  <span aria-hidden="true" className="x-burst pointer-events-none absolute inset-0">
                    <span className="absolute -inset-[5px] animate-[x-ring_0.7s_cubic-bezier(0.2,0.7,0.3,1)_both] rounded-full" style={{ borderStyle: "solid", borderColor: X_PINK }} />
                    {SPARKS.map((k) => (
                      <span
                        key={k.a}
                        className="absolute top-1/2 left-1/2 -mt-[1.25px] -ml-[1.25px] size-[2.5px] animate-[x-spark_1s_0.15s_cubic-bezier(0.2,0.7,0.3,1)_both] rounded-full"
                        style={{ background: k.c, ["--a" as string]: `${k.a}deg` }}
                      />
                    ))}
                  </span>
                )}
                {/* A reader's cursor glides in, taps the heart, and drifts away. */}
                <Pointer t={t} tap={X_LIKE} className="top-[7px] left-[8px]" />
              </span>
              <span className="tabular-nums">{xCount(n.likes)}</span>
            </span>
            {action(Bookmark, n.bookmarks, "bookmarks")}
            <Share className="size-[13px]" strokeWidth={1.75} />
          </div>
        </div>

        {/* Compose: the creator writes the opening line and hits Post. */}
        <div className={cn("absolute inset-0 flex flex-col px-3 pt-3 pb-2.5 transition-[opacity,translate] duration-500", EASE, SURFACE, PLATFORM, composing ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0")}>
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed avatar from the post */}
            <img src={p.avatar} alt="" className="size-[30px] shrink-0 rounded-full object-cover" />
            <p className="flex-1 pt-[6px] text-[12.5px] leading-[1.38]" style={{ color: X_INK }}>
              {draft || <span style={{ color: X_GREY }}>What&rsquo;s happening?</span>}
              {t < X_TYPE[1] + 0.1 && <span aria-hidden="true" className="ml-px inline-block h-[13px] w-px translate-y-[2px] animate-pulse" style={{ background: X_BLUE }} />}
            </p>
          </div>
          <div className="mt-auto ml-[38px]">
            <p className="flex items-center gap-1 border-b border-[#eff3f4] pb-1.5 text-[10px] font-bold" style={{ color: X_BLUE }}>
              <Globe className="size-[11px]" strokeWidth={2.2} />
              Everyone can reply
            </p>
            <div className="flex items-center justify-between pt-1.5">
              <span className="flex gap-2.5" style={{ color: X_BLUE }}>
                <ImageIcon className="size-[13px]" strokeWidth={1.9} />
                <ListOrdered className="size-[13px]" strokeWidth={1.9} />
                <Smile className="size-[13px]" strokeWidth={1.9} />
                <CalendarClock className="size-[13px]" strokeWidth={1.9} />
                <MapPin className="size-[13px]" strokeWidth={1.9} />
              </span>
              <span className="flex items-center gap-2">
                {/* The character ring fills as the line is typed. */}
                <svg viewBox="0 0 20 20" className="size-[14px] -rotate-90" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="#eff3f4" strokeWidth="2" />
                  <circle cx="10" cy="10" r="8" fill="none" stroke={X_BLUE} strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - (draft.length / 280) * 1} />
                </svg>
                <span
                  className={cn("rounded-full px-3 py-[5px] text-[11px] leading-none font-bold text-white transition-[opacity,scale] duration-150", draft.length < opening.length ? "opacity-50" : "opacity-100", t >= X_PRESS[0] && t < X_PRESS[1] ? "scale-[0.92]" : "scale-100")}
                  style={{ background: X_INK }}
                >
                  Post
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── 04 Reddit: the thread, a helpful comment, its product mention lights, the community upvotes it ─────
   Reddit, drawn as itself, at an unhurried pace: the thread (its votes slowly ticking up) with a comment that
   settles in beneath it. The product mention lights with a sweep of Reddit-orange tint and an underline; then a
   reader's cursor glides to the comment's vote button and taps it. The button turns Reddit's filled orange,
   the arrow hops, and the comment's score climbs. */

// Timeline (seconds).
const R_COMMENT = 1.4; // the comment settles in
const R_MENTION = 2.9; // the product mention lights
const R_UPVOTE = 5.0; // the reader's tap on the comment's upvote

const R_KEYFRAMES = `
@keyframes r-hop { 0% { transform: translateY(0) scale(1) } 35% { transform: translateY(-3px) scale(1.18) } 65% { transform: translateY(0.5px) scale(0.94) } 100% { transform: translateY(0) scale(1) } }
@media (prefers-reduced-motion: reduce) { .r-hop { animation: none !important } }
`;

export function RedditCard({ state = "done", className }: CardProps) {
  const t = usePlayhead(state, DURATION.reddit);
  const { thread, comment } = REDDIT;
  const upvoted = t >= R_UPVOTE;
  const hopping = upvoted && t < R_UPVOTE + 1;
  const votes = upvoted ? count(t, R_UPVOTE, DURATION.reddit - 0.4, comment.votes, 2) : 1;
  const INK = "#0f1a1c";
  const MUTED = "#576f76";
  const pill = "flex h-[20px] items-center gap-1 rounded-full bg-[#e5ebee]/70 px-1.5";
  return (
    <Card className={className} name={REDDIT.name} line={REDDIT.line} tint="bg-[linear-gradient(180deg,#ff5c1f,#ff4500)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_6px_-2px_rgb(255_69_0/0.6)]" icon={<Mark name="reddit" className="size-[20px] [&>path]:fill-white" />}>
      <style>{R_KEYFRAMES}</style>
      <div className={cn("flex h-[168px] flex-col px-3 pt-2.5 pb-2.5", SURFACE, PLATFORM, RAISED, SHOW, IN(t >= 0.15))}>
        {/* The thread. */}
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: MUTED }}>
          <span className="grid size-4 place-items-center rounded-full bg-[#ff4500]">
            <Mark name="reddit" className="size-2.5 [&>path]:fill-white" />
          </span>
          <span className="font-semibold" style={{ color: INK }}>
            {thread.sub}
          </span>
          <span>&middot; {thread.age}</span>
          <span className="rounded-full bg-[#e5ebee] px-1.5 py-px text-[8.5px] font-medium text-[#2a3c42]">Discussion</span>
          <span className="ml-auto rounded-full bg-[#0a449b] px-2.5 py-[2px] text-[9px] font-semibold text-white">Join</span>
        </div>
        <p className="mt-1.5 truncate text-[12.5px] leading-tight font-semibold" style={{ color: INK }}>
          {thread.title}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: MUTED }}>
          <span className={pill}>
            <ArrowBigUp className="size-3" strokeWidth={1.8} />
            <span className="tabular-nums">{count(t, 0.3, DURATION.reddit - 0.4, thread.votes, thread.votes - 26)}</span>
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

        {/* The comment, threaded under the post. */}
        <div className={cn("relative mt-auto flex gap-2 transition-[opacity,translate] duration-700", EASE, t >= R_COMMENT ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
          <div className="flex w-[18px] shrink-0 flex-col items-center">
            <Snoovatar seed={comment.user} className="size-[18px]" />
            <span aria-hidden="true" className="mt-1 w-px flex-1 rounded-full bg-[#e5ebee]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex h-[18px] items-center gap-1 text-[10px]" style={{ color: MUTED }}>
              <span className="font-semibold" style={{ color: INK }}>
                {comment.user}
              </span>
              &middot; {comment.age} ago
            </p>
            <p className="mt-0.5 text-[11px] leading-[1.4]" style={{ color: INK }}>
              {comment.text[0]}
              {/* The mention lights as a sweep of Reddit-orange tint with an underline; it never breaks across lines. */}
              <mark
                className={cn("rounded-[2px] bg-no-repeat px-px font-medium whitespace-nowrap transition-[background-size] duration-[1100ms]", EASE)}
                style={{
                  color: INK,
                  backgroundImage: "linear-gradient(#ff4500,#ff4500), linear-gradient(#ffe9db,#ffe9db)",
                  backgroundPosition: "0 100%, 0 0",
                  backgroundSize: t >= R_MENTION ? "100% 1.5px, 100% 100%" : "0% 1.5px, 0% 100%",
                }}
              >
                {comment.text[1]}
              </mark>
              {comment.text[2]}
            </p>
            <div className="mt-1.5 flex items-center gap-2.5 text-[10px] font-semibold" style={{ color: MUTED }}>
              {/* Reddit's vote button: filled orange once upvoted. */}
              <span className={cn("relative flex h-[20px] items-center gap-1 rounded-full px-1.5 transition-[background-color,color] duration-300", upvoted ? "bg-[#d93a00] text-white" : "bg-[#e5ebee]/70")}>
                <span className="relative grid size-3.5 place-items-center">
                  <ArrowBigUp className={cn("r-hop size-3.5 transition-[fill] duration-200", upvoted ? "fill-white" : "fill-transparent", hopping && "animate-[r-hop_0.7s_cubic-bezier(0.3,0.7,0.35,1)_both]")} strokeWidth={1.6} />
                  <Pointer t={t} tap={R_UPVOTE} from={[40, 6]} away={[14, 8]} className="top-[7px] left-[7px]" />
                </span>
                <span className="min-w-[1.5ch] tabular-nums">{votes}</span>
                <ArrowBigDown className="size-3.5" strokeWidth={1.6} />
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3" strokeWidth={2} />
                Reply
              </span>
              <Ellipsis className="size-3" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
