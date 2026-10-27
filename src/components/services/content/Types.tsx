"use client";

import { Box } from "lucide-react";
import { Label, useInView } from "../kit";
import { CANVAS, FRAME, Mark, SHEET, Tick, delay, rise } from "../parts";
import { TYPES } from "./content";

// Six formats, each recognisable before you read its name: every card opens on a small How We Work canvas
// with a tiny sheet drawn in that format (an article with a diagram, numbered steps, a product embed, a
// compare table, two marks joined, a pull quote), then the name and what it's for. Cards rise in once,
// staggered; nothing idles.
export default function Types() {
  const [ref, seen] = useInView<HTMLUListElement>(0.15);
  return (
    <section aria-labelledby="types-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{TYPES.label}</Label>
        <h2 id="types-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {TYPES.title}
        </h2>
        <ul ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.types.map((t, i) => {
            const Glyph = GLYPHS[i];
            return (
              <li key={t.name} style={delay(i * 110)} className={`${FRAME} ${rise(seen)} flex flex-col`}>
                <div aria-hidden="true" className={`${CANVAS} flex h-36 items-center justify-center border-b border-line`}>
                  <Glyph />
                </div>
                <div className="p-6">
                  <h3 className="text-[1.05rem] font-medium tracking-[-0.015em] text-ink">{t.name}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">{t.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const bars = (widths: number[], tone = "bg-ink/12", h = "h-[3px]") =>
  widths.map((w, i) => <span key={i} style={{ width: `${w}%` }} className={`block rounded-full ${h} ${tone}`} />);
const GLYPH = `${SHEET} w-[11rem] p-3`;

/** Technical article: heading, prose, a diagram block. */
function Article() {
  return (
    <div className={`${GLYPH} flex flex-col gap-1.5`}>
      {bars([70], "bg-ink/70", "h-[5px]")}
      <span className="mt-1 flex flex-col gap-1.5">{bars([100, 85])}</span>
      <span className="mt-1 flex h-7 items-center justify-center gap-1.5 rounded-md bg-paper">
        <span className="size-3 rounded-[3px] border border-ink/25" />
        <span className="h-px w-4 bg-ink/25" />
        <span className="size-3 rounded-full border border-ink/25" />
        <span className="h-px w-4 bg-ink/25" />
        <span className="size-3 rounded-[3px] bg-ink/60" />
      </span>
    </div>
  );
}

/** Tutorial: numbered steps, the last one a line of code. */
function Tutorial() {
  return (
    <div className={`${GLYPH} space-y-2`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className="flex items-center gap-2">
          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-ink text-[8.5px] text-white">{n}</span>
          {n < 3 ? (
            <span className="flex-1">{bars([n === 1 ? 80 : 65])}</span>
          ) : (
            <span className="flex-1 truncate rounded bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink/70">pip install sdk</span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Product-led: prose with the product's UI embedded mid-article. */
function ProductLed() {
  return (
    <div className={`${GLYPH} flex flex-col gap-1.5`}>
      {bars([90, 70])}
      <span className="my-1 rounded-md border border-line p-1.5">
        <span className="flex items-center gap-1 border-b border-line pb-1">
          <span className="size-1 rounded-full bg-ink/25" />
          <span className="size-1 rounded-full bg-ink/25" />
          <span className="ml-1 text-[8.5px] text-ink/55">Your product</span>
        </span>
        <span className="mt-1.5 flex items-center gap-1.5">
          <span className="h-3 w-8 rounded-[3px] bg-light-green/60" />
          <span className="flex-1">{bars([70])}</span>
        </span>
      </span>
      {bars([80])}
    </div>
  );
}

/** Comparison: two products side by side, checks against crosses. */
function Comparison() {
  // Whether the alternative also has each row's capability (yours always does).
  const alt = [false, true, false];
  return (
    <div className={`${SHEET} w-[11rem] py-1`}>
      <span className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b border-line px-3 py-1.5 text-[8.5px] text-ink/55">
        <span />
        <span>You</span>
        <span>Alt</span>
      </span>
      {alt.map((b, i) => (
        <span key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-3 py-1">
          {bars([80])}
          <Tick className="size-3" />
          {b ? <Tick className="size-3" /> : <span className="grid size-3 place-items-center text-[10px] leading-none text-ink/35">×</span>}
        </span>
      ))}
    </div>
  );
}

/** Integration: your product joined to a framework it connects with. */
function Integration() {
  return (
    <div className="flex items-center">
      <span className={`${SHEET} grid size-12 place-items-center`}>
        <Box className="size-5 text-ink/70" strokeWidth={1.6} />
      </span>
      <span className="h-px w-8 bg-ink/25" />
      <span className="grid size-5 place-items-center rounded-full border border-line bg-white text-[11px] leading-none text-ink/55">+</span>
      <span className="h-px w-8 bg-ink/25" />
      <span className={`${SHEET} grid size-12 place-items-center`}>
        <Mark name="langchain" className="size-5" />
      </span>
    </div>
  );
}

/** Thought leadership: a pull quote with its byline. */
function Thought() {
  return (
    <div className={`${GLYPH} border-l-[3px] border-l-ink/70`}>
      <span className="block text-[18px] leading-none text-ink/30">“</span>
      <span className="flex flex-col gap-1.5">{bars([95, 80, 60], "bg-ink/25", "h-[4px]")}</span>
      <span className="mt-2.5 flex items-center gap-1.5">
        <span className="size-3.5 rounded-full bg-ink/15" />
        {bars([35], "bg-ink/12")}
      </span>
    </div>
  );
}

const GLYPHS = [Article, Tutorial, ProductLed, Comparison, Integration, Thought];
