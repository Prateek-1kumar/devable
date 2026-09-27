import Link from "next/link";
import type { ReactNode } from "react";

// Pill CTA: accent at rest. On hover/focus pill-shaped layers slide in
// from the left (coral, then amber by default, then near-black), so their rounded
// leading edges read as arcs, and the black one settles as the fill.
// On leave only the black layer slides back out; the colors reset hidden
// beneath it. Timings and colors match the reference recording.
// Colors are intentionally local to this component.
const SWEEP = ["#ec544b", "#fcb401"]; // coral, amber
const INK = "#031819"; // final fill
// Literal classes so Tailwind sees them: sweep layers step 50ms apart, ink follows one step later.
const DELAYS = ["group-hover:delay-0", "group-hover:delay-50", "group-hover:delay-100", "group-hover:delay-150", "group-hover:delay-200", "group-hover:delay-250"];

// Resting look per tone; both end on the ink fill, so text turns white on hover.
const TONES = {
  accent: "bg-accent text-white [--edge:color-mix(in_oklab,var(--accent),black_28%)]",
  coral: "bg-coral text-foreground transition-colors duration-300 hover:delay-200 hover:text-white focus-visible:text-white",
  amber: "bg-amber text-foreground [--edge:color-mix(in_oklab,var(--amber),black_22%)] transition-colors duration-300 hover:delay-200 hover:text-white focus-visible:text-white",
};

type Props = {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  /** A pressable edge underneath: sinks on hover, presses flat on click. */
  depth?: boolean;
  className?: string;
  /** Colors that sweep in before the ink fill (max 4). */
  sweep?: string[];
};

const DEPTH =
  "shadow-[0_5px_0_0_var(--edge)] transition-[translate,box-shadow,color] hover:translate-y-0.5 hover:shadow-[0_3px_0_0_var(--edge)] active:translate-y-[5px] active:shadow-none";

export default function ArcButton({ href, children, tone = "accent", depth = false, className = "", sweep = SWEEP }: Props) {
  const layers = [
    ...sweep.map((color, i) => ({ color, classes: `duration-0 group-hover:duration-600 ${DELAYS[i]}` })),
    { color: INK, classes: `duration-500 group-hover:duration-600 ${DELAYS[sweep.length + 1]}` },
  ];
  return (
    <Link
      href={href}
      className={`group relative isolate inline-flex items-center overflow-hidden rounded-full px-5 py-2.5 font-medium tracking-wide outline-offset-4 ${TONES[tone]} ${depth ? DEPTH : ""} ${className}`}
    >
      {layers.map(({ color, classes }, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ backgroundColor: color }}
          className={`absolute inset-0 -z-10 -translate-x-full rounded-full transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0 group-focus-visible:translate-x-0 motion-reduce:transition-none ${classes}`}
        />
      ))}
      {children}
    </Link>
  );
}
