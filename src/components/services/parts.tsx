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

export type Icon = MarkName | "docs" | "news" | "copilot";

// Microsoft Copilot's full-colour mark (LobeHub icons, MIT), as SVG markup: its gradients need ids, so `COPILOT` is
// replaced with a per-instance id when it is drawn.
const COPILOT_SVG = `<path d="M17.533 1.829A2.528 2.528 0 0015.11 0h-.737a2.531 2.531 0 00-2.484 2.087l-1.263 6.937.314-1.08a2.528 2.528 0 012.424-1.833h4.284l1.797.706 1.731-.706h-.505a2.528 2.528 0 01-2.423-1.829l-.715-2.453z" fill="url(#COPILOT-fill-0)" transform="translate(0 1)"></path><path d="M6.726 20.16A2.528 2.528 0 009.152 22h1.566c1.37 0 2.49-1.1 2.525-2.48l.17-6.69-.357 1.228a2.528 2.528 0 01-2.423 1.83h-4.32l-1.54-.842-1.667.843h.497c1.124 0 2.113.75 2.426 1.84l.697 2.432z" fill="url(#COPILOT-fill-1)" transform="translate(0 1)"></path><path d="M15 0H6.252c-2.5 0-4 3.331-5 6.662-1.184 3.947-2.734 9.225 1.75 9.225H6.78c1.13 0 2.12-.753 2.43-1.847.657-2.317 1.809-6.359 2.713-9.436.46-1.563.842-2.906 1.43-3.742A1.97 1.97 0 0115 0" fill="url(#COPILOT-fill-2)" transform="translate(0 1)"></path><path d="M15 0H6.252c-2.5 0-4 3.331-5 6.662-1.184 3.947-2.734 9.225 1.75 9.225H6.78c1.13 0 2.12-.753 2.43-1.847.657-2.317 1.809-6.359 2.713-9.436.46-1.563.842-2.906 1.43-3.742A1.97 1.97 0 0115 0" fill="url(#COPILOT-fill-3)" transform="translate(0 1)"></path><path d="M9 22h8.749c2.5 0 4-3.332 5-6.663 1.184-3.948 2.734-9.227-1.75-9.227H17.22c-1.129 0-2.12.754-2.43 1.848a1149.2 1149.2 0 01-2.713 9.437c-.46 1.564-.842 2.907-1.43 3.743A1.97 1.97 0 019 22" fill="url(#COPILOT-fill-4)" transform="translate(0 1)"></path><path d="M9 22h8.749c2.5 0 4-3.332 5-6.663 1.184-3.948 2.734-9.227-1.75-9.227H17.22c-1.129 0-2.12.754-2.43 1.848a1149.2 1149.2 0 01-2.713 9.437c-.46 1.564-.842 2.907-1.43 3.743A1.97 1.97 0 019 22" fill="url(#COPILOT-fill-5)" transform="translate(0 1)"></path><defs><radialGradient cx="85.44%" cy="100.653%" fx="85.44%" fy="100.653%" gradientTransform="scale(-.8553 -1) rotate(50.927 2.041 -1.946)" id="COPILOT-fill-0" r="105.116%"><stop offset="9.6%" stop-color="#00AEFF"></stop><stop offset="77.3%" stop-color="#2253CE"></stop><stop offset="100%" stop-color="#0736C4"></stop></radialGradient><radialGradient cx="18.143%" cy="32.928%" fx="18.143%" fy="32.928%" gradientTransform="scale(.8897 1) rotate(52.069 .193 .352)" id="COPILOT-fill-1" r="95.612%"><stop offset="0%" stop-color="#FFB657"></stop><stop offset="63.4%" stop-color="#FF5F3D"></stop><stop offset="92.3%" stop-color="#C02B3C"></stop></radialGradient><radialGradient cx="82.987%" cy="-9.792%" fx="82.987%" fy="-9.792%" gradientTransform="scale(-1 -.9441) rotate(-70.872 .142 1.17)" id="COPILOT-fill-4" r="140.622%"><stop offset="6.6%" stop-color="#8C48FF"></stop><stop offset="50%" stop-color="#F2598A"></stop><stop offset="89.6%" stop-color="#FFB152"></stop></radialGradient><linearGradient id="COPILOT-fill-2" x1="39.465%" x2="46.884%" y1="12.117%" y2="103.774%"><stop offset="15.6%" stop-color="#0D91E1"></stop><stop offset="48.7%" stop-color="#52B471"></stop><stop offset="65.2%" stop-color="#98BD42"></stop><stop offset="93.7%" stop-color="#FFC800"></stop></linearGradient><linearGradient id="COPILOT-fill-3" x1="45.949%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#3DCBFF"></stop><stop offset="24.7%" stop-color="#0588F7" stop-opacity="0"></stop></linearGradient><linearGradient id="COPILOT-fill-5" x1="83.507%" x2="83.453%" y1="-6.106%" y2="21.131%"><stop offset="5.8%" stop-color="#F8ADFA"></stop><stop offset="70.8%" stop-color="#A86EDD" stop-opacity="0"></stop></linearGradient></defs>`;

/** A brand mark in its own colour (Google in its four), or a plain glyph for docs and publications. */
export function Mark({ name, className = "size-4" }: { name: Icon; className?: string }) {
  const id = useId();
  if (name === "docs") return <FileText aria-hidden="true" strokeWidth={1.8} className={`text-ink/60 ${className}`} />;
  if (name === "news") return <Newspaper aria-hidden="true" strokeWidth={1.8} className={`text-ink/60 ${className}`} />;
  if (name === "copilot")
    return <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`} dangerouslySetInnerHTML={{ __html: COPILOT_SVG.replaceAll("COPILOT", `copilot${id.replace(/[^a-zA-Z0-9]/g, "")}`) }} />;
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
  if (name === "gemini")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="3" y1="21" x2="21" y2="3">
          <stop offset="0" stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#9B72CB" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
        <path d={MARKS.gemini} fill={`url(#${id})`} />
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
