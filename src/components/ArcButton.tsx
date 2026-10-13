import Link from "next/link";
import type { ReactNode } from "react";

// Rectangular button with small border radius.
// With an arrow: a green icon box sits in the right end; on hover it grows left until it fills the
// button, the label turns black exactly where the green reaches it, and the arrow loops out and back in.
// Without one: the fill simply eases to green with black text. Shape and size never change.
const EASE =
  "transition-[background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const GROW =
  "ease-[cubic-bezier(0.65,0,0.35,1)] duration-500 motion-reduce:duration-0";

const TONES = {
  primary: `bg-black text-white shadow-sm hover:bg-primary hover:text-black focus-visible:bg-primary focus-visible:text-black ${EASE}`,
  accent: `bg-black text-white shadow-sm hover:bg-primary hover:text-black focus-visible:bg-primary focus-visible:text-black ${EASE}`,
  secondary: `bg-white text-black border border-black/15 shadow-sm hover:border-primary hover:bg-primary focus-visible:border-primary focus-visible:bg-primary ${EASE}`,
  orange: "bg-secondary text-white",
  // For dark sections: a white button, and a quiet outline.
  light: `bg-white text-black hover:bg-primary focus-visible:bg-primary ${EASE}`,
  // Plain white with only a slight dim on hover, for a quieter secondary next to a sliding primary.
  white: `bg-white text-black hover:bg-white/85 focus-visible:bg-white/85 ${EASE}`,
  outline: `border border-white/20 text-white hover:border-primary hover:bg-primary hover:text-black focus-visible:border-primary focus-visible:bg-primary focus-visible:text-black ${EASE}`,
};

// With an arrow the green layer does the filling, so the base keeps its own fill and label color underneath.
const SLIDE_TONES: Partial<Record<keyof typeof TONES, string>> = {
  primary: "bg-black text-white shadow-sm",
  accent: "bg-black text-white shadow-sm",
  light: "bg-white text-black",
  outline:
    "border border-white/20 text-white transition-colors duration-500 hover:border-primary focus-visible:border-primary",
};

const SIZES = {
  md: "gap-2.5 px-6 py-2.5 text-[0.95rem] rounded-[6px]",
  sm: "gap-2 px-4 py-2 text-[0.88rem] rounded-[6px]",
  lg: "gap-3 px-6 py-4 text-[1rem] rounded-[6px]",
};

// Room for the icon box on the right. The box sits 4px in from the edges and is square to the button's
// height, so at rest the green layer is clipped to just that square; `box` is its width for the arrow.
const SLIDE_SIZES = {
  md: {
    pad: "py-2.5 pl-6 pr-14 text-[0.95rem]",
    box: "w-9",
    clip: "[clip-path:inset(4px_4px_4px_calc(100%-40px)_round_4px)]",
  },
  sm: {
    pad: "py-2 pl-4 pr-11 text-[0.88rem]",
    box: "w-7",
    clip: "[clip-path:inset(4px_4px_4px_calc(100%-32px)_round_4px)]",
  },
  lg: {
    pad: "py-4 pl-6 pr-16 text-[1rem]",
    box: "w-12",
    clip: "[clip-path:inset(4px_4px_4px_calc(100%-52px)_round_4px)]",
  },
};

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 15 14"
      className={`h-3.5 w-[15px] ${className}`}
    >
      <path
        fill="currentColor"
        d="M 14.817 7.496 L 9.192 13.796 C 8.948 14.069 8.552 14.069 8.308 13.796 C 8.064 13.522 8.064 13.079 8.308 12.805 L 12.866 7.7 L 0.625 7.7 C 0.28 7.7 0 7.387 0 7 C 0 6.614 0.28 6.3 0.625 6.3 L 12.866 6.3 L 8.308 1.196 C 8.064 0.922 8.064 0.479 8.308 0.205 C 8.552 -0.068 8.948 -0.068 9.192 0.205 L 14.817 6.505 C 14.935 6.636 15 6.815 15 7 C 15 7.186 14.935 7.364 14.817 7.496 Z"
      />
    </svg>
  );
}

function IconSlide({
  size,
  children,
}: {
  size: keyof typeof SLIDE_SIZES;
  children: ReactNode;
}) {
  const { pad, box, clip } = SLIDE_SIZES[size];
  return (
    <>
      {/* The green layer carries a black copy of the label. Clipped to the icon box at rest, it unclips to the
          full button on hover, so the black text is revealed exactly where the green has reached. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 inline-flex items-center justify-center bg-primary text-black transition-[clip-path] ${GROW} ${pad} ${clip} group-hover:[clip-path:inset(0_0_0_0_round_6px)] group-focus-visible:[clip-path:inset(0_0_0_0_round_6px)]`}
      >
        {children}
      </span>
      {/* The arrow stays centered over the box's resting spot and loops: out to the right, a twin in from the left. */}
      <span
        aria-hidden="true"
        className={`absolute top-1 right-1 bottom-1 grid place-items-center overflow-hidden text-black ${box}`}
      >
        <ArrowIcon
          className={`col-start-1 row-start-1 transition-transform ${GROW} group-hover:translate-x-[260%] group-focus-visible:translate-x-[260%]`}
        />
        <ArrowIcon
          className={`col-start-1 row-start-1 -translate-x-[260%] transition-transform ${GROW} group-hover:translate-x-0 group-hover:delay-100 group-focus-visible:translate-x-0`}
        />
      </span>
    </>
  );
}

function Arrow() {
  return (
    <ArrowIcon className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
  );
}

type Props = {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  arrow?: boolean;
  className?: string;
};

export default function ArcButton({
  href,
  children,
  tone = "primary",
  size = "md",
  arrow = false,
  className = "",
}: Props) {
  const slideTone = SLIDE_TONES[tone];
  if (arrow && slideTone) {
    return (
      <Link
        href={href}
        className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[6px] font-medium tracking-wide outline-offset-4 ${slideTone} ${SLIDE_SIZES[size].pad} ${className}`}
      >
        <span>{children}</span>
        <IconSlide size={size}>{children}</IconSlide>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center justify-center font-medium tracking-wide outline-offset-4 ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      <span>{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}
