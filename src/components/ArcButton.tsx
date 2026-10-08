import Link from "next/link";
import type { ReactNode } from "react";

// Pill CTA: on hover/focus pill-shaped layers slide in from the left
// (coral, then amber, then dark ink), so their rounded leading edges read as arcs,
// and the dark ink settles as the fill. On leave only the dark layer slides back out;
// the colors reset hidden beneath it.
const SWEEP = ["#ec544b", "#fcb401"]; // coral, amber
const INK = "#0f1a14"; // deep ink (final fill)

// Literal classes so Tailwind compiles them: sweep layers step 50ms apart, ink follows one step later.
const DELAYS = [
  "group-hover:delay-0",
  "group-hover:delay-[50ms]",
  "group-hover:delay-[100ms]",
  "group-hover:delay-[150ms]",
  "group-hover:delay-[200ms]",
  "group-hover:delay-[250ms]",
];

const TONES = {
  accent: "bg-accent text-white transition-colors duration-300 hover:delay-200 hover:text-white focus-visible:text-white",
  primary: "bg-primary text-white transition-colors duration-300 hover:delay-200 hover:text-white focus-visible:text-white",
  secondary:
    "bg-card text-foreground border border-line shadow-[0_1px_2px_rgb(15_26_20/0.06)] transition-colors duration-300 hover:delay-200 hover:text-white hover:border-transparent focus-visible:text-white",
  coral: "bg-coral text-white transition-colors duration-300 hover:delay-200 hover:text-white focus-visible:text-white",
  amber: "bg-amber text-foreground transition-colors duration-300 hover:delay-200 hover:text-white focus-visible:text-white",
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
};

export default function ArcButton({
  href,
  children,
  tone = "accent",
  size = "md",
  arrow = false,
  className = "",
  sweep = SWEEP,
}: Props) {
  const layers = [
    ...sweep.map((color, i) => ({
      color,
      classes: `duration-0 group-hover:duration-600 ${DELAYS[i] ?? ""}`,
    })),
    {
      color: INK,
      classes: `duration-500 group-hover:duration-600 ${DELAYS[sweep.length] ?? ""}`,
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
