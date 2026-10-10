import Link from "next/link";
import type { ReactNode } from "react";

// Rectangular button with small border radius:
// Resting state: black with white text.
// On hover: fills with the primary green (#19E76E) with dark text.
const SWEEP: string[] = [];
const HOVER_FILL = "var(--primary, #19E76E)";

// Step delays for smooth transition
const DELAYS = [
  "group-hover:delay-0",
  "group-hover:delay-[40ms]",
  "group-hover:delay-[80ms]",
  "group-hover:delay-[120ms]",
  "group-hover:delay-[160ms]",
  "group-hover:delay-[200ms]",
];

const TONES = {
  primary:
    "bg-black text-white shadow-sm transition-colors duration-300 group-hover:text-black group-focus-visible:text-black",
  accent:
    "bg-black text-white shadow-sm transition-colors duration-300 group-hover:text-black group-focus-visible:text-black",
  secondary:
    "bg-white text-black border border-black/15 shadow-sm transition-colors duration-300 group-hover:text-black group-focus-visible:text-black",
  orange:
    "bg-secondary text-white transition-colors duration-300 group-hover:text-white focus-visible:text-white",
};

const SIZES = {
  md: "gap-2.5 px-6 py-2.5 text-[0.95rem] rounded-[6px]",
  sm: "gap-2 px-4 py-2 text-[0.88rem] rounded-[6px]",
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
      classes: `duration-0 group-hover:duration-300 ${DELAYS[i] ?? ""}`,
    })),
    {
      color: hoverFill,
      classes: `duration-300 group-hover:duration-300 ${DELAYS[sweep.length] ?? ""}`,
    },
  ];

  return (
    <Link
      href={href}
      className={`group relative isolate inline-flex items-center justify-center overflow-hidden font-medium tracking-wide outline-offset-4 ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      {layers.map(({ color, classes }, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ backgroundColor: color }}
          className={`absolute inset-0 -z-10 -translate-x-full rounded-[6px] transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0 group-focus-visible:translate-x-0 motion-reduce:transition-none ${classes}`}
        />
      ))}
      <span className="relative z-10 transition-colors duration-300">{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}
