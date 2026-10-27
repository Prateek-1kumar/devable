"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Label, useInView } from "../kit";
import { Beacon, CANVAS, FRAME, Mark, PILL, SHEET, SheetHead, StepChip, TAG, Tick, delay, rise } from "../parts";
import { STEPS } from "./content";

const TURN = 4200; // ms between replays of a row's one action while it's on screen

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const j = STEPS.journey;

// The page's signature: one thread followed through the three steps. Each step is a full-width row with its
// text beside its own visual (sides alternate), so the long copy reads at a comfortable width next to what the
// work looks like. 01 Find: the conversation map where the thread turned up, r/LocalLLaMA picked. 02
// Contribute: our reply in that thread, technical and inside the sub's rules. 03 Surface: the same thread
// ranking in Google and cited by ChatGPT. A slim spine on the left joins the rows, and the thread itself (a
// Reddit disc) rides it down as you scroll (sticky, no script). While a row is on screen its one focal item
// acts on a slow loop (the picked row pulses, the command types, the citation lands). Reduced motion: still.
export default function Journey() {
  return (
    <section aria-labelledby="journey-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{STEPS.label}</Label>
        <h2 id="journey-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {STEPS.title}
        </h2>

        <div className="mt-14 lg:grid lg:grid-cols-[3.5rem_minmax(0,1fr)]">
          {/* The spine, and the thread riding down it. */}
          <div aria-hidden="true" className="relative hidden lg:block">
            <span className="absolute top-12 bottom-12 left-1/2 w-px -translate-x-1/2 bg-line" />
            <span className="sticky top-[calc(50vh-1.25rem)] mx-auto mt-8 mb-8 grid size-10 place-items-center rounded-full border border-line bg-white shadow-[0_1px_1.6px_rgb(15_26_20/0.05),0_8px_20px_rgb(15_26_20/0.1)]">
              <Mark name="reddit" className="size-5" />
            </span>
          </div>
          <ol className="space-y-5 lg:space-y-6">
            {STEPS.steps.map((s, i) => (
              <Row key={s.name} i={i} step={s} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

type Step = (typeof STEPS.steps)[number];

/** One step: text beside its visual. The visual builds once when seen, then its focal item acts on a loop. */
function Row({ i, step: s }: { i: number; step: Step }) {
  const [ref, seen] = useInView<HTMLLIElement>(0.3);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    if (!seen || still) return;
    const id = setTimeout(() => setTurn((v) => v + 1), turn === 0 ? 1600 : TURN);
    return () => clearTimeout(id);
  }, [seen, still, turn]);

  const play = seen && !still && turn > 0;
  const visual = [<Find key="f" on={seen} play={play} />, <Contribute key="c" on={seen} play={play} turn={turn} />, <Surface key="s" on={seen} play={play} turn={turn} />][i];

  return (
    <li ref={ref} className={`${FRAME} relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]`}>
      <div className="flex flex-col justify-center p-7 sm:p-10 xl:p-12">
        <StepChip n={i + 1} />
        <h3 className="mt-5 text-[clamp(1.5rem,2.1vw,2.05rem)] leading-[1.12] font-normal tracking-[-0.03em] text-ink">{s.name}</h3>
        <p className="mt-4 text-[0.97rem] leading-relaxed text-ink/70">{s.body}</p>
        {"body2" in s && <p className="mt-3 text-[0.97rem] leading-relaxed text-ink/70">{s.body2}</p>}
        <p className="mt-6 text-[0.82rem] text-ink/50">{s.listLabel}</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {s.items.map((item) => (
            <li key={item} className={PILL}>
              {item}
            </li>
          ))}
        </ul>
        {"note" in s && <p className="mt-6 border-t border-line pt-5 text-[0.92rem] leading-relaxed text-ink/60">{s.note}</p>}
      </div>
      <div
        aria-hidden="true"
        className={`${CANVAS} flex items-center justify-center border-t border-line px-4 py-8 sm:px-8 lg:min-h-[28rem] lg:border-t-0 ${
          i % 2 ? "lg:order-first lg:border-r" : "lg:border-l"
        }`}
      >
        {visual}
      </div>
    </li>
  );
}

type VisualProps = { on: boolean; play: boolean };

/** The soft green outline on the active stage's focal item. */
const lit = (play: boolean) =>
  `transition-[background-color,box-shadow] duration-700 ${
    play ? "bg-[color-mix(in_srgb,var(--light-green-soft)_40%,white)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,var(--line))]" : "shadow-[0_0_0_1px_transparent]"
  }`;

/** One step per character, replayed whenever `play` turns on (the caller re-keys the element). */
const typed = (play: boolean, text: string): CSSProperties | undefined =>
  play ? { animation: `type-in 1100ms steps(${text.length}, end) 200ms both` } : undefined;
const arrive = (play: boolean, ms: number): CSSProperties | undefined =>
  play ? { animation: `arrive 600ms cubic-bezier(0.22,1,0.36,1) ${ms}ms both` } : undefined;

/** 01 · Where the category is being discussed, and where you and competitors show up. */
function Find({ on, play }: VisualProps) {
  return (
    <div className="w-full max-w-[26rem]">
      <div style={delay(100)} className={`${SHEET} ${rise(on)} overflow-hidden`}>
        <SheetHead title="Conversation map">
          <span className="flex items-center gap-3 text-[10.5px] text-ink/45">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#1a7f47]" />
              You
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-ink/30" />
              Competitors
            </span>
          </span>
        </SheetHead>
        <ul className="divide-y divide-line">
          {j.map.map((m, i) => (
            <li key={m.sub} style={delay(250 + i * 120)} className={`${rise(on)} ${m.picked ? lit(play) : ""} flex items-center gap-2.5 px-3.5 py-2.5`}>
              <span className="grid size-6 shrink-0 place-items-center rounded-md border border-line bg-white">
                <Mark name="reddit" className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                  {m.sub}
                  {m.picked && (play ? <Beacon /> : <span className="size-2 rounded-full bg-accent" />)}
                </span>
                <span className="block truncate text-[10.5px] text-ink/50">
                  {m.members} members · {m.intent} intent
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] tabular-nums">
                <span className="flex items-center gap-1 text-ink">
                  <span className="size-1.5 rounded-full bg-[#1a7f47]" />
                  {m.you}
                </span>
                <span className="flex items-center gap-1 text-ink/50">
                  <span className="size-1.5 rounded-full bg-ink/30" />
                  {m.rival}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {/* The thread the picked community leads to. */}
      <p style={delay(800)} className={`${rise(on)} mt-3 flex items-center gap-2 px-1 text-[11px] text-ink/50`}>
        <ArrowRight className="size-3 shrink-0 rotate-90" strokeWidth={2} />
        <span className={`${TAG} min-w-0 border border-line bg-white text-ink/80`}>
          <Mark name="reddit" className="size-3" />
          <span className="truncate">{j.thread.title}</span>
        </span>
      </p>
    </div>
  );
}

/** 02 · Our reply in that thread: technical (a real command) and inside the sub's rules. */
function Contribute({ on, play, turn }: VisualProps & { turn: number }) {
  return (
    <div className="w-full max-w-[26rem] space-y-3">
      <ThreadHead on={on} />
      <div style={delay(350)} className={`${SHEET} ${rise(on)} overflow-hidden`}>
        <SheetHead title="Your reply">
          <span className="text-[10.5px] text-ink/45">Drafted with technical context</span>
        </SheetHead>
        <div className="space-y-2.5 p-3.5">
          <p className="text-[12px] leading-snug text-ink/80">{j.draft}</p>
          <p key={play ? turn : "rest"} className={`${lit(play)} flex gap-1.5 rounded-lg bg-paper px-2.5 py-2 font-mono text-[10.5px] text-ink`}>
            <span className="text-ink/40">$</span>
            <span className="min-w-0 [overflow-wrap:anywhere]" style={typed(play, j.code)}>
              {j.code}
            </span>
          </p>
          <ul className="flex flex-wrap gap-1.5 border-t border-line pt-2.5">
            {j.rules.map((r) => (
              <li key={r} className={`${TAG} border border-line bg-white text-ink/70`}>
                <Tick className="size-3" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** 03 · The same thread, ranking in Google and cited in a ChatGPT answer. */
function Surface({ on, play, turn }: VisualProps & { turn: number }) {
  return (
    <div className="w-full max-w-[26rem] space-y-3">
      <Card on={on} at={100} icon={<Mark name="google" className="size-3.5" />} name="Google">
        <p className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-ink/70">{j.search.query}</p>
        <p className="mt-2.5 truncate text-[10.5px] text-ink/50">{j.search.url}</p>
        <p className="text-[12.5px] leading-snug text-[#1a0dab]">{j.thread.title}</p>
      </Card>
      <Card on={on} at={400} icon={<Mark name="chatgpt" className="size-3.5" />} name="ChatGPT">
        <p className="text-[12px] leading-snug text-ink/75">{j.ai}</p>
        <span key={play ? turn : "rest"} style={arrive(play, 250)} className={`${TAG} ${lit(play)} mt-2.5 border border-line bg-white text-ink/70`}>
          <Mark name="reddit" className="size-3" />
          reddit.com · {j.thread.sub}
        </span>
      </Card>
    </div>
  );
}

/** The thread itself: community, votes, title. */
function ThreadHead({ on }: { on: boolean }) {
  return (
    <div style={delay(100)} className={`${SHEET} ${rise(on)} p-3.5`}>
      <p className="flex items-center gap-2 text-[11px] text-ink/50">
        <Mark name="reddit" className="size-3.5" />
        {j.thread.sub}
        <span className="ml-auto tabular-nums">▲ {j.thread.votes}</span>
      </p>
      <p className="mt-1.5 text-[13px] leading-snug font-medium text-ink">{j.thread.title}</p>
    </div>
  );
}

function Card({ on, at, icon, name, children }: { on: boolean; at: number; icon: ReactNode; name: string; children: ReactNode }) {
  return (
    <div style={delay(at)} className={`${SHEET} ${rise(on)} p-3.5`}>
      <p className="mb-2.5 flex items-center gap-2 text-[11.5px] font-medium text-ink">
        {icon}
        {name}
      </p>
      {children}
    </div>
  );
}
