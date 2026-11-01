"use client";

import NumberFlow from "@number-flow/react";
import { GitCompare, Handshake } from "lucide-react";
import { type CSSProperties } from "react";
import { Beacon, GAP, Mark } from "../parts";
import { ARTIFACTS } from "./content";
import { DEEP, PANEL, show, useBeats, type SceneProps } from "./scene";

// 03 · Where the product shows up among the external sources that shape search and AI.
// A hub (the product, ringed by its coverage) and six kinds of source around it, joined by spokes whose line
// says the state at a glance: a solid green spoke with data running down it where the product is present,
// a thin grey one where it's weak, a dotted one where it's missing. The two places worth pursuing are flagged.
// Sources appear present first, then weak, then missing, then the flags, then the coverage fills in. On a
// phone the map flattens into the hub over a two-column list, with no spokes.

// Where each source sits: left column then right column, top to bottom, around the hub in the middle cell.
// Each card hugs the outside of its cell (left column to the left, right column to the right), so there's a visible run of spoke between it and the hub.
const LEFT = "sm:col-start-1 sm:w-[86%] sm:justify-self-start";
const RIGHT = "sm:col-start-3 sm:w-[86%] sm:justify-self-end";
const POS = [`${LEFT} sm:row-start-1`, `${LEFT} sm:row-start-2`, `${LEFT} sm:row-start-3`, `${RIGHT} sm:row-start-1`, `${RIGHT} sm:row-start-2`, `${RIGHT} sm:row-start-3`];
const SPOKE = [
  [16.7, 16.7],
  [16.7, 50],
  [16.7, 83.3],
  [83.3, 16.7],
  [83.3, 50],
  [83.3, 83.3],
];
const RANK = { present: 0, weak: 1, missing: 2 } as const;
const LABEL = { present: "Present", weak: "Weak", missing: "Missing" } as const;
// 1 hub · 2-7 the six sources · 8 the opportunity flags · 9 the coverage.
const TIMES = [200, 650, 950, 1250, 1550, 1850, 2150, 3000, 3800];
const RING = 182.21; // 2π × 29

export default function Presence({ on }: SceneProps) {
  const a = ARTIFACTS.thirdParty;
  const b = useBeats(on, TIMES);
  // The order they appear in: present, then weak, then missing.
  const order = a.sources.map((_, i) => i).sort((x, y) => RANK[a.sources[x].state] - RANK[a.sources[y].state] || x - y);

  return (
    <div className="mx-auto w-full max-w-[38.5rem]">
      <div className="relative grid gap-2 max-sm:grid-cols-2 sm:aspect-[1.75] sm:grid-cols-3 sm:grid-rows-3 sm:gap-0">
        {/* The spokes, and a packet running each solid one. Drawn in a box of the map's own shape (1.75 : 1), so lines keep true length and width. */}
        <svg aria-hidden="true" viewBox="0 0 175 100" className="pointer-events-none absolute inset-0 size-full max-sm:hidden">
          {a.sources.map((s, i) => {
            const drawn = b >= 2 + order.indexOf(i);
            const [x, y] = SPOKE[i];
            return (
              <path
                key={s.name}
                d={`M87.5 50L${Math.round(x * 1.75 * 100) / 100} ${y}`}
                fill="none"
                strokeLinecap="round"
                pathLength={s.state === "missing" ? undefined : 1}
                stroke={s.state === "present" ? "#19e76e" : s.state === "weak" ? "rgb(23 44 33 / 0.3)" : "rgb(23 44 33 / 0.26)"}
                strokeWidth={s.state === "present" ? 0.7 : 0.55}
                strokeDasharray={s.state === "missing" ? "0.001 1.9" : 1}
                style={{
                  strokeDashoffset: s.state === "missing" || drawn ? 0 : 1,
                  opacity: s.state === "missing" ? (drawn ? 1 : 0) : 1,
                  transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1), opacity 700ms",
                }}
              />
            );
          })}
        </svg>
        {a.sources.map((s, i) =>
          s.state === "present" && b >= 2 + order.indexOf(i) ? (
            <span
              key={s.name}
              aria-hidden="true"
              style={{ "--x0": "50%", "--y0": "50%", "--x1": `${SPOKE[i][0]}%`, "--y1": `${SPOKE[i][1]}%` } as CSSProperties}
              className="pointer-events-none absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-primary max-sm:hidden motion-safe:animate-[line-run_2.4s_ease-in-out_infinite]"
            />
          ) : null,
        )}

        <p className="font-mono text-[10px] tracking-[0.06em] text-ink/40 uppercase max-sm:hidden sm:col-start-2 sm:row-start-1 sm:self-start sm:text-center">Third-party presence</p>

        <div className={`${PANEL} relative z-10 flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-center max-sm:order-first max-sm:col-span-2 sm:col-start-2 sm:row-start-2 sm:w-[78%] sm:self-center sm:justify-self-center ${show(b >= 1)}`}>
          <span className="relative grid size-16 place-items-center">
            <svg viewBox="0 0 64 64" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
              <circle cx="32" cy="32" r="29" fill="none" className="stroke-ink/[0.07]" strokeWidth="3.5" />
              <circle
                cx="32"
                cy="32"
                r="29"
                fill="none"
                className="stroke-primary"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={RING}
                style={{ strokeDashoffset: Math.round(RING * (1 - (b >= 9 ? a.hub.value : 0) / 100) * 100) / 100, transition: "stroke-dashoffset 1400ms cubic-bezier(0.22,1,0.36,1)" }}
              />
            </svg>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-9">
              <rect width="16" height="16" rx="4" fill="#172c21" />
              <path d="M4.2 10.6 8 5.4l3.8 5.2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-[12.5px] leading-tight font-medium text-ink">{a.hub.name}</p>
          <p className="text-[10.5px] leading-none text-ink/50">
            {a.hub.label}{" "}
            <span className="font-mono text-[12px] text-ink">
              <NumberFlow value={b >= 9 ? a.hub.value : 0} suffix="%" />
            </span>
          </p>
        </div>

        {a.sources.map((s, i) => {
          const shown = b >= 2 + order.indexOf(i);
          return (
            <div key={s.name} className={`relative z-10 sm:self-center ${POS[i]} ${show(shown)}`}>
              <div
                className={`${PANEL} flex items-center gap-2.5 px-2.5 py-2 transition-[box-shadow,opacity] duration-700 motion-reduce:transition-none ${
                  s.state === "present" ? "shadow-[0_0_0_1.5px_var(--primary),0_12px_28px_-18px_rgb(15_26_20/0.2)]" : s.state === "missing" ? "opacity-80" : ""
                }`}
              >
                <SourceIcon kind={s.kind} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] leading-tight font-medium text-ink">{s.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[10.5px] leading-none" style={{ color: s.state === "present" ? DEEP : s.state === "weak" ? "rgb(23 44 33 / 0.6)" : "rgb(23 44 33 / 0.45)" }}>
                    <span
                      className={`size-2 rounded-full ${s.state === "present" ? "bg-[#1a7f47]" : s.state === "weak" ? "bg-[conic-gradient(#1a7f47_0_50%,rgb(23_44_33/0.18)_50%)]" : "border-[1.5px] border-ink/25"}`}
                    />
                    {LABEL[s.state]}
                  </p>
                </div>
              </div>
              {s.opportunity && (
                <span className={`${GAP} absolute -top-2.5 right-2 font-medium shadow-[0_0_0_1.5px_white] transition-[opacity,scale] duration-500 motion-reduce:transition-none ${b >= 8 ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
                  <Beacon />
                  Opportunity
                </span>
              )}
            </div>
          );
        })}

        <ul className="flex items-center justify-center gap-3 text-[10.5px] text-ink/50 max-sm:col-span-2 max-sm:pt-1 sm:col-start-2 sm:row-start-3 sm:self-end">
          {(["present", "weak", "missing"] as const).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${k === "present" ? "bg-[#1a7f47]" : k === "weak" ? "bg-[conic-gradient(#1a7f47_0_50%,rgb(23_44_33/0.18)_50%)]" : "border-[1.5px] border-ink/25"}`} />
              {LABEL[k]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** A source's icon: its own brand where it has one, a plain glyph where it's a type of page. */
function SourceIcon({ kind }: { kind: string }) {
  const tile = "grid size-7 shrink-0 place-items-center rounded-lg bg-white shadow-[0_0_0_1px_rgb(15_26_20/0.08)]";
  if (kind === "partner")
    return (
      <span className={tile}>
        <Handshake aria-hidden="true" strokeWidth={1.8} className="size-4 text-ink/60" />
      </span>
    );
  if (kind === "compare")
    return (
      <span className={tile}>
        <GitCompare aria-hidden="true" strokeWidth={1.8} className="size-4 text-ink/60" />
      </span>
    );
  return (
    <span className={tile}>
      <Mark name={kind as "reddit" | "g2" | "news" | "youtube"} className="size-4" />
    </span>
  );
}
