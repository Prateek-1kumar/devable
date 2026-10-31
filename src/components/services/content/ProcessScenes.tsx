"use client";

import type { ReactNode } from "react";
import { SHEET, SheetHead, Tick } from "../parts";
import { HERO, PROCESS } from "./content";
import { io3, linear, seg } from "./play";

const S = PROCESS.samples;
const CORAL = "var(--accent)";
const WASH_OPEN = "bg-[color-mix(in_srgb,var(--accent)_9%,white)]";
const WASH_DONE = "bg-[color-mix(in_srgb,var(--light-green-soft)_65%,white)]";

// One artifact per step of the process, each a function of `p` (0–1 over its duration, played once when the step
// becomes active). They share one frame: a white sheet on the section's warm band, split into two panes so a step
// shows what goes in on one side and what comes out on the other.
export const SCENES: { Scene: (props: { p: number }) => ReactNode; ms: number }[] = [
  { Scene: Understand, ms: 5200 },
  { Scene: Prioritize, ms: 5400 },
  { Scene: Build, ms: 6600 },
  { Scene: Review, ms: 6600 },
  { Scene: Publish, ms: 5600 },
  { Scene: Improve, ms: 6200 },
];

const at = (v: number, rise = 6) => ({ opacity: v, transform: `translateY(${(1 - v) * rise}px)` });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function Sheet({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  return (
    <div className={`${SHEET} flex h-[24rem] flex-col overflow-hidden`}>
      <SheetHead title={title}>{right && <span className="text-[11px] text-ink/45">{right}</span>}</SheetHead>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** 1 · Understand: hands-on with the product on one side, the notes it becomes on the other. */
function Understand({ p }: { p: number }) {
  const d = S.understand;
  const typed = Math.floor(seg(p, 0.05, 0.3, linear) * d.cmd.length);
  return (
    <Sheet title={d.title} right="Week 1">
      <div className="grid h-full sm:grid-cols-2 sm:divide-x sm:divide-line">
        <div className="bg-paper/60 p-5 font-mono text-[0.76rem] leading-relaxed max-sm:hidden">
          <p className="font-sans text-[0.72rem] text-ink/40">Hands-on with the API</p>
          <p className="mt-3 text-ink/80 [overflow-wrap:anywhere]">
            <span className="text-ink/35">$ </span>
            {d.cmd.slice(0, typed)}
          </p>
          <div className="mt-3 space-y-0.5">
            {d.out.map((l, i) => (
              <p key={i} className="text-ink/70 [overflow-wrap:anywhere]" style={at(seg(p, 0.32 + i * 0.07, 0.42 + i * 0.07), 4)}>
                {l}
              </p>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-line">
          {d.notes.map((n, i) => {
            const a = seg(p, 0.25 + i * 0.13, 0.4 + i * 0.13);
            return (
              <li key={n.k} className="flex items-center gap-4 px-5 py-4" style={at(a, 4)}>
                <span className="w-[5.5rem] shrink-0 font-mono text-[0.7rem] text-ink/45">{n.k}</span>
                <span className="min-w-0 flex-1 truncate text-[0.88rem] text-ink">{n.v}</span>
                <Tick className="size-4" />
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}

/** 2 · Prioritize: a backlog that sorts itself, and the cut line for what gets made. */
function Prioritize({ p }: { p: number }) {
  const d = S.prioritize;
  const H = 52;
  const rank = d.rows.map((r) => d.rows.filter((o) => o.score > r.score).length);
  const e = seg(p, 0.3, 0.72, io3);
  const sorted = seg(p, 0.72, 0.92);
  return (
    <Sheet title={d.title} right="Impact × fit">
      <div className="relative px-5 pt-2">
        <span className="absolute inset-x-0 rounded-none bg-[color-mix(in_srgb,var(--accent)_6%,white)]" style={{ top: 8, height: 3 * H + 1, opacity: sorted }} />
        {d.rows.map((r, i) => {
          const y = lerp(i, rank[i], e) * H + 8;
          const top = rank[i] < 3;
          return (
            <div key={r.topic} className="absolute inset-x-5 flex items-center gap-3 border-b border-line" style={{ top: y, height: H, ...at(seg(p, i * 0.03, i * 0.03 + 0.15), 0) }}>
              <span className="w-5 font-mono text-[0.72rem] tabular-nums" style={{ color: top && sorted > 0.5 ? CORAL : "rgb(23 44 33 / 0.35)" }}>
                {e > 0.5 ? rank[i] + 1 : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.9rem] text-ink">{r.topic}</span>
              <span className="hidden rounded-full border border-ink/12 bg-paper px-2 py-0.5 font-mono text-[0.66rem] text-ink/60 sm:inline">{r.format}</span>
              <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-ink/[0.07] sm:block">
                <span className="block h-full rounded-full" style={{ width: `${r.score}%`, background: top && sorted > 0.5 ? CORAL : "rgb(23 44 33 / 0.5)" }} />
              </span>
              <span className="w-6 text-right font-mono text-[0.74rem] text-ink/60 tabular-nums">{r.score}</span>
            </div>
          );
        })}
        <p className="absolute right-5 flex items-center gap-2 font-mono text-[0.68rem]" style={{ top: 8 + 3 * H - 9, color: CORAL, opacity: sorted }}>
          <span className="rounded-full bg-white px-2 py-0.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,white)]">{d.cut}</span>
        </p>
      </div>
    </Sheet>
  );
}

/** 3 · Build: the draft being written on one side, its code being run on the other. */
function Build({ p }: { p: number }) {
  const d = S.build;
  const typed = Math.floor(seg(p, 0.5, 0.64, linear) * d.cmd.length);
  const chars = d.lines.map((l, i) => Math.floor(seg(p, 0.05 + i * 0.22, 0.3 + i * 0.22, linear) * l.length));
  return (
    <Sheet title={d.title} right="Writer + engineer">
      <div className="grid h-full sm:grid-cols-[1.15fr_1fr] sm:divide-x sm:divide-line">
        <div className="space-y-3 p-5">
          <p className="text-[1rem] leading-snug font-semibold tracking-[-0.015em] text-ink" style={at(seg(p, 0, 0.08))}>
            {HERO.article.title}
          </p>
          {d.lines.map((l, i) => (
            <p key={i} className="min-h-[3.4rem] text-[0.84rem] leading-[1.6] text-ink/70">
              {l.slice(0, chars[i])}
            </p>
          ))}
          <p className="flex flex-wrap items-center gap-1.5 pt-1 text-[0.7rem] text-ink/45" style={at(seg(p, 0.45, 0.6), 4)}>
            Sources
            {d.sources.map((s) => (
              <span key={s} className="rounded-full border border-ink/12 bg-paper px-2 py-0.5 font-mono text-ink/65">
                {s}
              </span>
            ))}
          </p>
        </div>
        <div className="bg-[#131313] p-5 font-mono text-[0.76rem] leading-relaxed max-sm:hidden">
          <p className="font-sans text-[0.72rem] text-white/40">Tested hands-on</p>
          <p className="mt-3 text-white/80">
            <span className="text-white/35">$ </span>
            {d.cmd.slice(0, typed)}
          </p>
          <div className="mt-2 space-y-0.5">
            {d.out.map((l, i) => (
              <p key={i} className="text-[#7fdca8]" style={at(seg(p, 0.68 + i * 0.1, 0.78 + i * 0.1), 4)}>
                {l}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

const ink = (o: number) => `color-mix(in srgb, var(--ink) ${o}%, transparent)`;
const Lines = ({ widths }: { widths: number[] }) => (
  <span className="block space-y-[7px]">
    {widths.map((w, i) => (
      <span key={i} className="block h-[4.5px] rounded-full" style={{ width: `${w}%`, background: ink(13) }} />
    ))}
  </span>
);
function Badge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] transition-colors duration-700 ${
        done ? "bg-[#e3f3e8] text-[#1a7f47]" : "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[color-mix(in_srgb,var(--accent)_85%,var(--ink))]"
      }`}
    >
      {n}
    </span>
  );
}
function Mark({ n, done, children }: { n: number; done: boolean; children: ReactNode }) {
  return (
    <span className={`relative -mx-2 block rounded-lg px-2 py-2 pr-9 transition-colors duration-700 ${done ? WASH_DONE : WASH_OPEN}`}>
      {children}
      <span className="absolute top-2 right-2">
        <Badge n={n} done={done} />
      </span>
    </span>
  );
}

/** 4 · Review: the draft with the lines under review marked, and the reviewers' comments resolving one by one. */
function Review({ p }: { p: number }) {
  const r = PROCESS.review;
  const done = (i: number) => p > 0.3 + i * 0.26;
  const count = r.comments.filter((_, i) => done(i)).length;
  return (
    <Sheet title={r.file} right={`${count} of ${r.comments.length} resolved`}>
      <div className="grid h-full sm:grid-cols-[1.1fr_1fr] sm:divide-x sm:divide-line">
        <div className="space-y-3.5 p-5">
          <p className="text-[0.95rem] leading-snug font-semibold tracking-[-0.015em] text-ink">{HERO.article.title}</p>
          <Mark n={1} done={done(0)}>
            <Lines widths={[96, 88, 54]} />
          </Mark>
          <Mark n={2} done={done(1)}>
            <span className="block rounded-md bg-paper px-3 py-2 font-mono text-[0.7rem] leading-relaxed [overflow-wrap:anywhere]">
              {done(1) ? <span className="text-ink">{HERO.article.code}</span> : <span className="text-ink/45 line-through decoration-accent/60">{'client.split_pdf("bundle.pdf", mode="auto")'}</span>}
            </span>
          </Mark>
          <Mark n={3} done={done(2)}>
            <span className="block text-[0.78rem] text-ink/70">
              A 400-page bundle splits in{" "}
              <span className={`font-medium tabular-nums transition-colors duration-700 ${done(2) ? "text-[#1a7f47]" : "text-ink/45 line-through"}`}>{done(2) ? "38s" : "52s"}</span>.
            </span>
          </Mark>
        </div>
        <ul className="space-y-2.5 p-4 max-sm:hidden">
          {r.comments.map((c, i) => (
            <li key={i} className="rounded-xl border border-line p-3" style={at(seg(p, 0.05 + i * 0.07, 0.2 + i * 0.07), 4)}>
              <p className="flex items-center gap-2 text-[0.76rem]">
                <Badge n={i + 1} done={done(i)} />
                <span className="font-medium text-ink">{c.who}</span>
                <span className="text-ink/45">{c.kind === "technical" ? "Technical review" : "Editorial review"}</span>
                <span className={`ml-auto flex items-center gap-1 text-[0.7rem] ${done(i) ? "text-[#1a7f47]" : "text-ink/45"}`}>
                  {done(i) ? <Tick className="size-3.5" /> : <span className="size-1.5 rounded-full bg-accent" />}
                  {done(i) ? "Resolved" : "Open"}
                </span>
              </p>
              <p className="mt-1.5 text-[0.76rem] leading-snug text-ink/70">{c.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

/** 5 · Optimize & Publish: the checklist ticking, the readiness score climbing, then the piece going live. */
function Publish({ p }: { p: number }) {
  const d = S.publish;
  const score = Math.round(lerp(d.score[0], d.score[1], seg(p, 0.15, 0.7)));
  const live = seg(p, 0.76, 0.9);
  return (
    <Sheet title={d.title} right="Before it goes live">
      <div className="grid h-full sm:grid-cols-2 sm:divide-x sm:divide-line">
        <ul className="divide-y divide-line">
          {d.checks.map((c, i) => {
            const t = seg(p, 0.12 + i * 0.11, 0.22 + i * 0.11);
            return (
              <li key={c} className="flex items-center gap-3 px-5 py-4 text-[0.88rem]">
                <span className="relative grid size-4 place-items-center">
                  <span className="absolute inset-0 rounded-full border border-ink/20" style={{ opacity: 1 - t }} />
                  <span className="absolute inset-0" style={{ opacity: t }}>
                    <Tick className="size-4" />
                  </span>
                </span>
                <span style={{ color: `color-mix(in srgb, var(--ink) ${Math.round(45 + 40 * t)}%, transparent)` }}>{c}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col justify-between p-5">
          <div>
            <p className="text-[0.72rem] text-ink/45">{d.scoreLabel}</p>
            <p className="mt-1 text-[3rem] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
              {score}
              <span className="ml-1 text-[1rem] font-normal tracking-normal text-ink/35">/100</span>
            </p>
            <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${score}%` }} />
            </span>
          </div>
          <div style={at(live, 8)}>
            <p className="flex items-center gap-2 text-[0.78rem] text-[#1a7f47]">
              <span className="size-1.5 rounded-full bg-[#1a7f47]" />
              Live
            </p>
            <p className="mt-1 truncate font-mono text-[0.7rem] text-ink/55">{d.url}</p>
            <p className="mt-2.5 flex flex-wrap gap-1.5">
              {d.channels.map((c) => (
                <span key={c} className="rounded-full border border-ink/12 bg-paper px-2 py-0.5 font-mono text-[0.68rem] text-ink/65">
                  → {c}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** 6 · Improve: the piece's weekly views, the refresh that lifts them, and what goes into the next cycle. */
function Improve({ p }: { p: number }) {
  const d = S.improve;
  const W = 320;
  const H = 150;
  const max = Math.max(...d.weeks);
  const pt = (v: number, i: number) => [(i * W) / (d.weeks.length - 1), H - 8 - (v / max) * (H - 28)] as const;
  const path = (from: number, to: number) => d.weeks.slice(from, to + 1).map((v, i) => `${i ? "L" : "M"}${pt(v, from + i).join(" ")}`).join(" ");
  const pre = seg(p, 0.08, 0.4, linear);
  const post = seg(p, 0.46, 0.8, linear);
  const [rx] = pt(0, d.refreshAt);
  return (
    <Sheet title={d.title} right="Views per week">
      <div className="grid h-full sm:grid-cols-[1.2fr_1fr] sm:divide-x sm:divide-line">
        <div className="flex flex-col justify-center p-5">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
            <line x1="0" x2={W} y1={H - 8} y2={H - 8} stroke="var(--ink)" strokeOpacity={0.12} />
            <path d={path(0, d.refreshAt)} pathLength={1} fill="none" stroke="var(--ink)" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - pre} />
            <g style={{ opacity: seg(p, 0.4, 0.5) }}>
              <line x1={rx} x2={rx} y1="6" y2={H - 8} stroke={CORAL} strokeOpacity={0.5} strokeDasharray="3 3" />
            </g>
            <path d={path(d.refreshAt, d.weeks.length - 1)} pathLength={1} fill="none" stroke={CORAL} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - post} />
          </svg>
          <p className="mt-3 flex items-center justify-between font-mono text-[0.68rem] text-ink/40">
            <span>Week 1</span>
            <span style={{ color: CORAL, opacity: seg(p, 0.42, 0.55) }}>↑ {d.refreshLabel}</span>
            <span>Week 12</span>
          </p>
        </div>
        <div className="flex flex-col p-5">
          <p className="text-[0.72rem] text-ink/45">Refresh queue</p>
          <ul className="mt-3 flex-1 divide-y divide-line">
            {d.queue.map((q, i) => (
              <li key={q.title} className="py-3" style={at(seg(p, 0.55 + i * 0.1, 0.7 + i * 0.1), 4)}>
                <p className="text-[0.86rem] text-ink">{q.title}</p>
                <p className="mt-0.5 text-[0.74rem] text-ink/50">{q.note}</p>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 pt-2 text-[0.76rem]" style={{ color: CORAL, opacity: seg(p, 0.85, 0.97) }}>
            <span aria-hidden="true">↺</span>
            {d.next}
          </p>
        </div>
      </div>
    </Sheet>
  );
}
