import Link from "next/link";
import type { ReactNode } from "react";

// Pill CTA (ArcButton):
// Resting state: dark green (main brand color).
// On hover: multi-chromatic color wave slides in sequentially from the left
// (fresh light green, electric cyan, vibrant indigo, bright rose, warm golden amber,
// settling on dull secondary orange as the final fill).
// On leave: the orange layer slides back out to the left over 500ms,
// cleanly revealing the resting dark green button face underneath.
const SWEEP = [
  "#2bb673", // Layer 1: fresh light green
  "#06b6d4", // Layer 2: electric cyan
  "#6366f1", // Layer 3: vibrant indigo
  "#ec4899", // Layer 4: bright rose
  "#fbbf24", // Layer 5: warm golden amber
];
const HOVER_FILL = "var(--secondary, #d96543)"; // Final Layer: dull secondary orange

// Step delays ~40ms apart so the color wave ripples across the button smoothly
const DELAYS = [
  "group-hover:delay-0",
  "group-hover:delay-[40ms]",
  "group-hover:delay-[80ms]",
  "group-hover:delay-[120ms]",
  "group-hover:delay-[160ms]",
  "group-hover:delay-[200ms]",
];

const TONES = {
  primary: "bg-primary text-white transition-colors duration-300 hover:text-white focus-visible:text-white",
  accent: "bg-primary text-white transition-colors duration-300 hover:text-white focus-visible:text-white",
  secondary:
    "bg-card text-foreground border border-line shadow-[0_1px_2px_rgb(15_26_20/0.06)] transition-colors duration-300 hover:text-white hover:border-transparent focus-visible:text-white",
  orange: "bg-secondary text-white transition-colors duration-300 hover:text-white focus-visible:text-white",
};

const SIZES = {
  md: "gap-2.5 px-6 py-2.5 text-[1rem]",
  sm: "gap-2 px-4 py-2 text-[0.92rem]",
};

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 15 14" className="h-3.5 w-[15px] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">
      <path
        fill="currentColor"
        d="M 14.817 7.496 L 9.192 13.796 C 8.948 14.069 8.552 14.069 8.308 13.796 C 8.064 13.522 8.064 13.079 8.308 12.805 L 12.866 7.7 L 0.625 7.7 C 0.28 7.7 0 7.387 0 7 C 0 6.614 0.28 6.3 0.625 6.3 L 12.866 6.3 L 8.308 1.196 C 8.064 0.922 8.064 0.479 8.308 0.205 C 8.552 -0.068 8.948 -0.068 9.192 0.205 L 14.817 6.505 C 14.935 6.636 15 6.815 15 7 C 15 7.186 14.935 7.364 14.817 7.496 Z"
      />
    </svg>
  );
}

type Props = {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  arrow?: boolean;
  className?: string;
  sweep?: string[];
  hoverFill?: string;
};

export default function ArcButton({
  href,
  children,
  tone = "primary",
  size = "md",
  arrow = false,
  className = "",
  sweep = SWEEP,
  hoverFill = HOVER_FILL,
}: Props) {
  const layers = [
    ...sweep.map((color, i) => ({
      color,
      classes: `duration-0 group-hover:duration-500 ${DELAYS[i] ?? ""}`,
    })),
    {
      color: hoverFill,
      classes: `duration-500 group-hover:duration-500 ${DELAYS[sweep.length] ?? ""}`,
    },
  ];

  return (
    <Link
      href={href}
      className={`group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-medium tracking-wide outline-offset-4 ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      {layers.map(({ color, classes }, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ backgroundColor: color }}
          className={`absolute inset-0 -z-10 -translate-x-full rounded-full transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0 group-focus-visible:translate-x-0 motion-reduce:transition-none ${classes}`}
        />
      ))}
      <span className="relative z-10 transition-colors duration-300">{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}
