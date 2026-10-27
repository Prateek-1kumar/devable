import { FileText, Newspaper } from "lucide-react";
import { useId, type ReactNode } from "react";
import { MARKS, MARK_COLOR, type MarkName } from "../how-we-work/marks";

// The page's visual parts, lifted from the site's own components so every scene reads like the homepage:
// the How We Work dotted canvas and its white sheets (same two-step shadow as its SVG `Card`), its mono
// pills and number chip, the Why Devable check, and the brand marks. Scenes build once when seen (`rise`),
// then hold still apart from one slow `Beacon` on the focal item.

/** The How We Work card shell and its dotted canvas. */
export const FRAME = "overflow-hidden rounded-2xl border border-line bg-card";
export const CANVAS = "bg-[#f4f6f4] bg-[radial-gradient(#d5dcd7_1px,transparent_1px)] [background-size:16px_16px]";
/** A white sheet on the canvas: 1px line border and the panel kit's soft shadow. */
export const SHEET = "rounded-[14px] border border-line bg-white shadow-[0_1px_1.6px_rgb(15_26_20/0.04),0_8px_24px_rgb(15_26_20/0.06)]";
/** How We Work's "Includes" pill. */
export const PILL = "rounded-full border border-ink/12 bg-paper px-3 py-1.5 font-mono text-[11.5px] tracking-[0.02em] text-ink";
/** Small in-sheet chip (sentence case), outlined or tinted by the caller. */
export const TAG = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap";
/** The "Sources verified" stamp from the Content Engine panel. */
export const STAMP = `${TAG} border border-[color-mix(in_srgb,var(--primary)_40%,var(--line))] bg-[color-mix(in_srgb,var(--light-green-soft)_75%,white)] text-[#1a7f47]`;
/** Problems use the accent wash, like the Optimization panel's "Gap" callout. */
export const GAP = `${TAG} bg-[color-mix(in_srgb,var(--accent)_9%,white)] text-[color-mix(in_srgb,var(--accent)_85%,var(--ink))]`;

/** Classes for a scene element that rises in once when `on`; pair with `delay()`. */
export const rise = (on: boolean) =>
  `transition-[opacity,translate] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
    on ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
  }`;
export const delay = (ms: number) => ({ transitionDelay: `${ms}ms` });

/** How We Work's step number: a green dot and the mono number on paper. */
export function StepChip({ n }: { n: number }) {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-paper px-3 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-ink/80">
      <span className="size-1.5 rounded-full bg-light-green" />
      0{n}
    </span>
  );
}

/** Why Devable's check: a deep green tick in a soft green circle. */
export function Tick({ className = "size-[18px]" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-[#e3f3e8] ${className}`}>
      <svg viewBox="0 0 16 16" className="size-[65%] text-[#1a7f47]">
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** The panel kit's live status: a coral dot sending out a slow, soft ring. The page's only idle motion. */
export function Beacon() {
  return (
    <span aria-hidden="true" className="relative grid size-2 shrink-0 place-items-center">
      <span className="absolute inset-0 rounded-full bg-accent opacity-50 motion-safe:animate-[ping_3.2s_cubic-bezier(0,0,0.2,1)_infinite]" />
      <span className="size-2 rounded-full bg-accent" />
    </span>
  );
}

export type Icon = MarkName | "docs" | "news";

/** A brand mark in its own colour (Google in its four), or a plain glyph for docs and publications. */
export function Mark({ name, className = "size-4" }: { name: Icon; className?: string }) {
  const id = useId();
  if (name === "docs") return <FileText aria-hidden="true" strokeWidth={1.8} className={`text-ink/60 ${className}`} />;
  if (name === "news") return <Newspaper aria-hidden="true" strokeWidth={1.8} className={`text-ink/60 ${className}`} />;
  if (name === "google")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
        <clipPath id={id}>
          <path d={MARKS.google} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <rect width="12" height="9" fill="#EA4335" />
          <rect y="9" width="7" height="15" fill="#FBBC05" />
          <rect x="7" y="14" width="17" height="10" fill="#34A853" />
          <rect x="12" width="12" height="14.2" fill="#4285F4" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`} fill={MARK_COLOR[name]}>
      <path d={MARKS[name]} />
    </svg>
  );
}

/** Marks overlapped on white discs, like stacked favicons in an AI answer. */
export function MarkStack({ names, size = "size-[22px]" }: { names: Icon[]; size?: string }) {
  return (
    <span className="flex -space-x-1.5">
      {names.map((n) => (
        <span key={n} className={`grid place-items-center rounded-full border border-line bg-white ${size}`}>
          <Mark name={n} className="size-[60%]" />
        </span>
      ))}
    </span>
  );
}

/** A sheet's header row: sentence-case title, optional right-hand slot. */
export function SheetHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <p className="text-[12.5px] font-medium tracking-[-0.005em] text-ink">{title}</p>
      {children}
    </div>
  );
}
