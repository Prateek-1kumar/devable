"use client";

import { Search, Terminal } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import ArcButton from "../../ArcButton";
import { Label, useInView } from "../kit";
import { CANVAS, FRAME, Mark, SHEET, STAMP, Tick } from "../parts";
import { HERO } from "./content";

const TURN = 3800; // ms each reader holds the spotlight
const READERS = 3;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// The headline names three readers, so the visual shows one finished article (a real LandingAI guide) and
// those three readers using it: a developer running its code, Google ranking it, ChatGPT citing it. The
// article's header carries the workflow it went through, every stage ticked; the readers sit under the last
// stage, "Search, AI & distribution". Nothing waits on a build: every card already shows its result. Every few
// seconds the next reader steps forward and acts (the developer's command types and runs, the query types into
// Google and the guide lands at #1, ChatGPT streams its answer and cites it) while the part of the article it
// relies on lights up. Reduced motion: all three results, still.
export default function Hero() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  // Turns taken so far; the reader in the spotlight is turn % 3, and each turn replays that reader's action.
  const [turn, setTurn] = useState(0);
  const k = turn % READERS;

  useEffect(() => {
    if (!seen || still) return;
    const id = setTimeout(() => setTurn((v) => v + 1), TURN);
    return () => clearTimeout(id);
  }, [seen, still, turn]);

  const a = HERO.article;
  const r = a.readers;
  const on = (i: number) => still || k === i;
  // Whether reader i is acting right now (its CSS animations play; otherwise its result just sits there).
  const play = (i: number) => seen && !still && k === i;
  // The article part a reader uses: outlined in green while that reader has the spotlight.
  const lit = (i: number) =>
    `rounded-lg transition-[background-color,box-shadow] duration-700 ${
      !still && k === i ? "bg-[color-mix(in_srgb,var(--light-green-soft)_45%,white)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,var(--line))]" : "shadow-[0_0_0_1px_transparent]"
    }`;

  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="mx-auto grid max-w-[76rem] items-center gap-12 rounded-2xl bg-[#f9f8f4] px-5 py-12 sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-12 lg:py-20">
        <div className="px-1 sm:px-0">
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.3rem,4.2vw,3.9rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink">{HERO.title}</h1>
          <p className="mt-6 max-w-[32rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ArcButton href="#contact" arrow tone="primary">
              {HERO.primary}
            </ArcButton>
            <ArcButton href="#work" tone="secondary">
              {HERO.secondary}
            </ArcButton>
          </div>
        </div>

        <figure
          ref={ref}
          aria-label={`Example: a ${a.client} guide, taken through ${HERO.stages.slice(0, -1).join(", ")}, then run by developers, ranked by Google and cited by ChatGPT.`}
          className={`${FRAME} shadow-[0_1px_2px_rgb(23_44_33/0.04),0_30px_60px_-34px_rgb(23_44_33/0.3)]`}
        >
          <div aria-hidden="true" className={`${CANVAS} grid gap-3 p-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] sm:items-center sm:p-6`}>
            {/* The article, and the workflow it went through. */}
            <div className={`${SHEET} p-4`}>
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-ink/50">{a.client} blog</span>
                <span className="flex items-center gap-1.5 text-[#1a7f47]">
                  <span className="size-1.5 rounded-full bg-[#1a7f47]" />
                  Published
                </span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1.5 border-b border-line pb-3">
                {HERO.stages.slice(0, -1).map((s) => (
                  <li key={s} className="flex items-center gap-1 text-[10.5px] text-ink/60">
                    <Tick className="size-3" />
                    {s}
                  </li>
                ))}
              </ul>
              <p className={`${lit(1)} -mx-1.5 mt-3 px-1.5 py-1 text-[14.5px] leading-snug font-semibold tracking-[-0.015em] text-ink`}>{a.title}</p>
              <span className={`${lit(2)} -mx-1.5 mt-2 block space-y-[7px] px-1.5 py-2`}>
                {[100, 94, 72].map((w) => (
                  <span key={w} style={{ width: `${w}%` }} className="block h-[4.5px] rounded-full bg-ink/[0.13]" />
                ))}
              </span>
              <div className={`${lit(0)} mt-2.5`}>
                <p className="rounded-lg bg-paper px-3 py-2.5 font-mono text-[10.5px] leading-relaxed [overflow-wrap:anywhere]">
                  <Code text={a.code} />
                </p>
              </div>
              <span className={`${STAMP} mt-2.5`}>
                <Tick className="size-3" />
                Tested against API v2
              </span>
            </div>

            {/* Its three readers, under the workflow's last stage. */}
            <div className="space-y-2.5">
              <p className="px-1 text-[11px] text-ink/50">{HERO.stages[HERO.stages.length - 1]}</p>
              <Reader on={on(0)} icon={<Terminal className="size-3.5 text-ink/70" strokeWidth={2} />} name="Developer">
                <p key={play(0) ? turn : "rest"} className="rounded-md bg-[#151614] px-2.5 py-2 font-mono text-[10.5px] leading-relaxed text-white/80">
                  <span className="text-white/40">$ </span>
                  <span className="inline-block align-bottom whitespace-nowrap" style={typed(play(0), r.developer.cmd, 1000, 150)}>
                    {r.developer.cmd}
                  </span>
                  <br />
                  <span className="inline-block text-[#5ee39a]" style={arrive(play(0), 1400)}>
                    ✓ {r.developer.out}
                  </span>
                </p>
              </Reader>
              <Reader on={on(1)} icon={<Mark name="google" className="size-3.5" />} name="Google">
                <div key={play(1) ? turn : "rest"}>
                  <p className="flex items-center gap-2 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-ink/75">
                    <Search className="size-3 shrink-0 text-ink/40" strokeWidth={2.2} />
                    <span className="inline-block truncate whitespace-nowrap" style={typed(play(1), r.search.query, 900, 150)}>
                      {r.search.query}
                    </span>
                  </p>
                  <p className="mt-2.5 flex items-start gap-2" style={arrive(play(1), 1300)}>
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white">1</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[10.5px] text-ink/50">{r.search.url}</span>
                      <span className="block text-[12px] leading-snug text-[#1a0dab]">{a.title}</span>
                    </span>
                  </p>
                </div>
              </Reader>
              <Reader on={on(2)} icon={<Mark name="chatgpt" className="size-3.5" />} name="ChatGPT">
                <p key={play(2) ? turn : "rest"} className="text-[12px] leading-snug text-ink/75">
                  {WORDS.map((w, i) => (
                    <span key={i} className="inline-block" style={arrive(play(2), 200 + i * 70)}>
                      {w}&nbsp;
                    </span>
                  ))}
                  <span
                    className="inline-flex translate-y-[-1px] items-center rounded-full border border-line bg-paper px-1.5 text-[10px] text-ink/60"
                    style={arrive(play(2), 300 + WORDS.length * 70)}
                  >
                    {r.llm.cite}
                  </span>
                </p>
              </Reader>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

const WORDS = HERO.article.readers.llm.answer.split(" ");

/** Types `text` in over `ms` (one step per character) when `play`; otherwise it's simply there. */
const typed = (play: boolean, text: string, ms: number, delay: number): CSSProperties | undefined =>
  play ? { animation: `type-in ${ms}ms steps(${text.length}, end) ${delay}ms both` } : undefined;
/** A short rise-and-fade arrival after `delay` ms when `play`. */
const arrive = (play: boolean, delay: number): CSSProperties | undefined =>
  play ? { animation: `arrive 500ms cubic-bezier(0.22,1,0.36,1) ${delay}ms both` } : undefined;

/** One reader of the article: steps forward (full strength, deeper shadow) while it has the spotlight. */
function Reader({ on, icon, name, children }: { on: boolean; icon: ReactNode; name: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-[14px] border border-line bg-white p-3 transition-[opacity,translate,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        on ? "opacity-100 sm:-translate-x-1.5 shadow-[0_1px_1.6px_rgb(15_26_20/0.05),0_14px_32px_rgb(15_26_20/0.1)]" : "opacity-70 shadow-[0_1px_1.6px_rgb(15_26_20/0.04),0_8px_24px_rgb(15_26_20/0.06)]"
      }`}
    >
      <p className="mb-2 flex items-center gap-2 text-[11.5px] font-medium text-ink">
        {icon}
        {name}
      </p>
      {children}
    </div>
  );
}

/** The one-line snippet, with its strings and keywords tinted like the homepage Content Engine's code. */
function Code({ text }: { text: string }) {
  return (
    <span className="text-ink/75">
      {text.split(/("[^"]*"|\bTrue\b|\bFalse\b|\.\w+(?=\())/).map((part, i) =>
        part.startsWith('"') ? (
          <span key={i} className="text-[color-mix(in_srgb,var(--primary)_55%,var(--ink))]">
            {part}
          </span>
        ) : part === "True" || part === "False" || part.startsWith(".") ? (
          <span key={i} className="text-accent">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
