import Link from "next/link";
import type { ReactNode } from "react";

// Pill CTA: accent at rest. On hover/focus three pill-shaped layers slide in
// from the left (coral, then amber, then near-black), so their rounded
// leading edges read as arcs, and the black one settles as the fill.
// On leave only the black layer slides back out; the colors reset hidden
// beneath it. Timings and colors match the reference recording.
// Colors are intentionally local to this component.
const LAYERS = [
  { color: "#ec544b", classes: "duration-0 group-hover:duration-600 group-hover:delay-0" }, // coral
  { color: "#fcb401", classes: "duration-0 group-hover:duration-600 group-hover:delay-50" }, // amber
  { color: "#031819", classes: "duration-500 group-hover:duration-600 group-hover:delay-150" }, // ink (final fill)
];

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function ArcButton({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`group relative isolate inline-flex items-center overflow-hidden rounded-full bg-accent px-5 py-2.5 font-bold tracking-wide text-white outline-offset-4 ${className}`}
    >
      {LAYERS.map(({ color, classes }) => (
        <span
          key={color}
          aria-hidden="true"
          style={{ backgroundColor: color }}
          className={`absolute inset-0 -z-10 -translate-x-full rounded-full transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0 group-focus-visible:translate-x-0 motion-reduce:transition-none ${classes}`}
        />
      ))}
      {children}
    </Link>
  );
}
