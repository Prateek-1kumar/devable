"use client";

import NumberFlow from "@number-flow/react";
import { Check, ChevronRight, FileText, Globe } from "lucide-react";
import { type CSSProperties } from "react";
import { ARTIFACTS } from "./content";
import { DEEP, PANEL, Titlebar, show, useBeats, type SceneProps } from "./scene";

// 04 · Diagnose → Fix → Improve discovery.
// The site as a map of pages. Diagnose flags the five things that stop pages being found, one by one, on the
// pages they hold back. Fix clears them in turn: an unindexed page is indexed, an orphan is linked in, a
// duplicate folds into the page it copied, a blocked section is opened, a slow page is sped up. Packets of
// crawl data run only to pages that can be reached, so as the fixes land more of the map comes alive, and the
// discoverable-pages number climbs once it's all connected.

type Node = { id: string; x: number; y: number; parent?: string; issue?: number };
// Issues: 1 not indexed · 2 weak internal linking · 3 duplicate pages · 4 crawl issue · 5 slow page.
const NODES: Node[] = [
  { id: "home", x: 50, y: 10 },
  { id: "docs", x: 17, y: 32, parent: "home" },
  { id: "product", x: 50, y: 32, parent: "home" },
  { id: "blog", x: 83, y: 32, parent: "home", issue: 4 },
  { id: "api", x: 8, y: 57, parent: "docs", issue: 1 },
  { id: "quick", x: 26, y: 57, parent: "docs" },
  { id: "pricing", x: 40, y: 57, parent: "product" },
  { id: "copy", x: 53, y: 57, parent: "product", issue: 3 },
  { id: "usecases", x: 65, y: 57, parent: "product", issue: 5 },
  { id: "post1", x: 78, y: 57, parent: "blog" },
  { id: "post2", x: 92, y: 57, parent: "blog" },
  { id: "guide", x: 22, y: 83, parent: "quick", issue: 2 },
  { id: "ext", x: 65, y: 83, parent: "usecases" },
];
const BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));
const x = (pct: number) => Math.round(pct * 1.15 * 100) / 100; // a node's x in the drawing's 115-wide box
// Beats: 1-5 each issue found · 6-15 each fix starts then lands (issue k: 4+2k, 5+2k) · 16 discovery improves.
const TIMES = [400, 700, 1000, 1300, 1600, 3000, 3450, 3700, 4150, 4400, 4850, 5100, 5550, 5800, 6250, 7000];

type Status = "idle" | "found" | "fixing" | "fixed";

export default function SiteFix({ on }: SceneProps) {
  const a = ARTIFACTS.technical;
  const b = useBeats(on, TIMES);
  const status = (k: number): Status => (b >= 5 + 2 * k ? "fixed" : b >= 4 + 2 * k ? "fixing" : b >= k ? "found" : "idle");
  const stage = b >= 16 ? 3 : b >= 6 ? 2 : b >= 1 ? 1 : 0;
  const fixed = [1, 2, 3, 4, 5].filter((k) => status(k) === "fixed").length;
  const improved = b >= 16;
  // Whether a page can be reached: held back until its own issue, or the section above it, is fixed.
  const reachable = (n: Node): boolean => (n.issue ? status(n.issue) === "fixed" : true) && (n.parent ? reachable(BY_ID[n.parent]) : true);

  return (
    <div className="mx-auto w-full max-w-[38.5rem]">
      <ol className="flex items-center gap-1.5">
        {a.stages.map((t, i) => {
          const done = stage > i + 1;
          const active = stage === i + 1;
          return (
            <li key={t} className="flex items-center gap-1.5">
              <span
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-[background-color,color,box-shadow] duration-500 motion-reduce:transition-none ${
                  active ? "bg-white text-ink shadow-[0_0_0_1px_rgb(15_26_20/0.08),0_1px_2px_rgb(15_26_20/0.06)]" : done ? "bg-[#e8f6ed] text-[#1a7f47]" : "bg-ink/[0.04] text-ink/40"
                }`}
              >
                {done ? <Check aria-hidden="true" strokeWidth={3} className="size-3" /> : <span className={`size-1.5 rounded-full transition-colors duration-500 ${active ? "bg-primary" : "bg-ink/20"}`} />}
                {t}
              </span>
              {i < 2 && <ChevronRight aria-hidden="true" strokeWidth={2} className="size-3.5 text-ink/25" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* The map. */}
        <div className={`${PANEL} relative aspect-[1.15]`}>
          {/* Drawn in a box of the container's own shape (1.15 : 1), so lines keep true length and width. */}
          <svg viewBox="0 0 115 100" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            {NODES.filter((n) => n.parent).map((n) => {
              const p = BY_ID[n.parent as string];
              const orphan = n.id === "guide";
              const blocked = n.id === "post1" || n.id === "post2";
              const gone = n.id === "copy" && status(3) === "fixed";
              const drawn = orphan ? status(2) === "fixing" || status(2) === "fixed" : true;
              const live = reachable(n) && (!blocked || status(4) === "fixed");
              return (
                <path
                  key={n.id}
                  d={`M${x(p.x)} ${p.y}L${x(n.x)} ${n.y}`}
                  fill="none"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeWidth="0.6"
                  stroke={improved && live ? "#19e76e" : "rgb(23 44 33 / 0.18)"}
                  strokeDasharray={blocked && !live ? "0.001 0.04" : 1}
                  style={{
                    strokeDashoffset: drawn ? 0 : 1,
                    opacity: gone ? 0 : 1,
                    transition: "stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1), stroke 700ms, opacity 600ms",
                  }}
                />
              );
            })}
          </svg>

          {/* Crawl data, running only to pages that can be reached. */}
          {b >= 1 &&
            NODES.filter((n) => n.parent && reachable(n) && !(n.id === "copy" && status(3) === "fixed")).map((n, i) => {
              const p = BY_ID[n.parent as string];
              return (
                <span
                  key={n.id}
                  aria-hidden="true"
                  style={{ "--x0": `${p.x}%`, "--y0": `${p.y}%`, "--x1": `${n.x}%`, "--y1": `${n.y}%`, animationDelay: `${-((i * 0.53) % 2.6)}s` } as CSSProperties}
                  className="pointer-events-none absolute -mt-[2.5px] -ml-[2.5px] size-[5px] rounded-full bg-primary motion-safe:animate-[line-run_2.6s_linear_infinite]"
                />
              );
            })}

          {NODES.map((n) => {
            const k = n.issue;
            const s: Status = k ? status(k) : "idle";
            const blockedChild = (n.id === "post1" || n.id === "post2") && status(4) !== "fixed";
            const sick = !!k && s !== "fixed" && s !== "idle";
            const merged = n.id === "copy" && s === "fixed";
            const held = (!!k && s !== "fixed") || blockedChild;
            return (
              <div
                key={n.id}
                style={{ left: `${merged ? BY_ID.pricing.x : n.x}%`, top: `${n.y}%`, transition: "left 800ms cubic-bezier(0.22,1,0.36,1), opacity 600ms" }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${merged ? "opacity-0" : ""}`}
              >
                <span
                  className={`relative grid size-[26px] place-items-center rounded-full bg-white transition-[box-shadow,opacity] duration-700 motion-reduce:transition-none ${held && !sick ? "opacity-55" : ""} ${
                    sick
                      ? "shadow-[0_0_0_1.5px_var(--accent),0_4px_10px_-4px_rgb(217_101_67/0.45)]"
                      : (k && s === "fixed") || (improved && reachable(n))
                        ? "shadow-[0_0_0_1.5px_var(--primary),0_4px_10px_-6px_rgb(15_26_20/0.3)]"
                        : "shadow-[0_0_0_1px_rgb(15_26_20/0.12),0_3px_8px_-5px_rgb(15_26_20/0.25)]"
                  }`}
                >
                  {n.id === "home" ? <Globe aria-hidden="true" strokeWidth={1.8} className="size-3 text-ink/55" /> : <FileText aria-hidden="true" strokeWidth={1.8} className={`size-3 transition-colors duration-700 ${sick ? "text-accent" : "text-ink/40"}`} />}
                  {k && s !== "idle" && <NumberBadge k={k} status={s} float />}
                </span>
              </div>
            );
          })}
          <p className="absolute bottom-2 left-3 font-mono text-[10px] tracking-[0.06em] text-ink/35 uppercase">Site map</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className={`${PANEL} overflow-hidden ${show(b >= 1)}`}>
            <Titlebar title="What limits discovery">
              <span className="font-mono text-[10.5px] text-ink/45">
                {fixed} of {a.issues.length} fixed
              </span>
            </Titlebar>
            <ul className="divide-y divide-ink/[0.06] px-3">
              {a.issues.map((r, i) => {
                const s = status(i + 1);
                return (
                  <li key={r.issue} className="flex items-center gap-2.5 py-2">
                    <NumberBadge k={i + 1} status={s} />
                    <span className={`min-w-0 flex-1 truncate text-[12px] transition-colors duration-500 ${s === "idle" ? "text-ink/40" : s === "fixed" ? "text-ink/55" : "text-ink"}`}>{r.issue}</span>
                    <span className="font-mono text-[11px] text-ink/40 tabular-nums">{r.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={`${PANEL} px-3 py-2.5 ${show(b >= 1)}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-ink/50">{a.discovery.label}</p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium transition-opacity duration-500 ${improved ? "opacity-100" : "opacity-0"}`} style={{ color: DEEP }}>
                <svg viewBox="0 0 8 8" aria-hidden="true" className="size-[7px] fill-current">
                  <path d="M4 1 7.5 7h-7z" />
                </svg>
                +{a.discovery.to - a.discovery.from} pts
              </span>
            </div>
            <p className="mt-1 text-[1.5rem] leading-none font-medium tracking-[-0.035em] text-ink">
              <NumberFlow value={improved ? a.discovery.to : a.discovery.from} suffix="%" />
            </p>
            <span className={`mt-2 block h-1.5 overflow-hidden rounded-full bg-ink/[0.07]`}>
              <span
                style={{ width: `${improved ? a.discovery.to : a.discovery.from}%` }}
                className={`block h-full rounded-full transition-[width,background-color] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${improved ? "bg-primary" : "bg-ink/25"}`}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** An issue's number: hollow until it's found, coral while it's found or being fixed (with a ring running round it), green with a tick once fixed. */
function NumberBadge({ k, status, float = false }: { k: number; status: Status; float?: boolean }) {
  return (
    <span
      className={`${float ? "absolute -top-1.5 -right-1.5" : "relative"} grid size-[18px] shrink-0 place-items-center rounded-full font-mono text-[10px] leading-none transition-[background-color,color,box-shadow] duration-500 motion-reduce:transition-none ${
        status === "fixed"
          ? "bg-[#e3f3e8] text-[#1a7f47]"
          : status === "idle"
            ? "bg-white text-ink/35 shadow-[0_0_0_1px_rgb(15_26_20/0.14)]"
            : "bg-accent text-white shadow-[0_0_0_1.5px_white]"
      }`}
    >
      {status === "fixed" ? <Check aria-hidden="true" strokeWidth={3.2} className="size-2.5" /> : k}
      {status === "fixing" && <span className="absolute -inset-[3px] rounded-full border-2 border-accent/25 border-t-accent motion-safe:animate-[spin_1.1s_linear_infinite]" />}
    </span>
  );
}
