import Link from "next/link";
import type { ReactNode } from "react";

// CTA with a wave reveal (after Framer's "Wave Reveal Button"): on hover an
// organic two-lobed blob swells in from the top-left corner and floods the
// button, the label flips color, and a fresh arrow slides in as the old one
// leaves. Press shrinks the content slightly.
//
// Color roles follow the palette: primary is the coral accent (ink text) flooded
// by deep green; secondary is a white face flooded by deep green.
const TONES = {
  primary: { face: "bg-accent text-ink", wave: "text-primary", ink: "group-hover:text-white group-focus-visible:text-white" },
  secondary: {
    face: "bg-white text-ink shadow-[0_0_0_1px_rgb(15_26_20/0.1),0_1px_2px_rgb(15_26_20/0.06)]",
    wave: "text-primary",
    ink: "group-hover:text-white group-focus-visible:text-white",
  },
};

const SIZES = {
  md: "gap-3 px-[22px] py-2.5 text-[1.0625rem]",
  sm: "gap-2.5 px-4 py-2 text-[0.95rem]",
};

// Rest: parked above-left, fully outside the button. Hover: grown to cover it.
// Geometry from the reference; top/width/height ease so it sweeps down-right as it swells.
const WAVE =
  "absolute left-[-84px] top-[-100px] h-[123px] w-[132px] transition-[top,width,height] duration-900 ease-[cubic-bezier(0.19,1,0.22,1)] " +
  "group-hover:top-[calc(100%-154px)] group-hover:h-[307px] group-hover:w-[calc(100%+137px)] " +
  "group-focus-visible:top-[calc(100%-154px)] group-focus-visible:h-[307px] group-focus-visible:w-[calc(100%+137px)] motion-reduce:transition-none";

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 15 14" className="h-3.5 w-[15px] shrink-0">
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
  className?: string;
};

export default function WaveButton({ href, children, tone = "primary", size = "md", className = "" }: Props) {
  const { face, wave, ink } = TONES[tone];
  return (
    <Link
      href={href}
      // Squircle corners where supported, a plain radius that matches it elsewhere.
      className={`group relative isolate inline-flex items-center overflow-hidden rounded-[18px] font-medium tracking-[-0.02em] outline-offset-4 supports-[corner-shape:superellipse(1.5)]:rounded-[24px] supports-[corner-shape:superellipse(1.5)]:[corner-shape:superellipse(1.5)] ${face} ${SIZES[size]} ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 15 14" preserveAspectRatio="none" className={`-z-10 ${WAVE} ${wave}`}>
        <path
          fill="currentColor"
          d="M 5 3.523 C 5.078 3.523 5.155 3.525 5.233 3.528 C 5.873 1.483 7.765 0 10 0 C 12.761 0 15 2.264 15 5.057 C 15 7.85 12.761 10.114 10 10.114 C 9.922 10.114 9.845 10.112 9.767 10.108 C 9.127 12.154 7.235 13.636 5 13.636 C 2.239 13.636 0 11.372 0 8.58 C 0 5.787 2.239 3.523 5 3.523 Z"
        />
      </svg>
      <span className={`transition-[color,scale] duration-500 group-active:scale-95 ${ink}`}>{children}</span>
      {/* Two arrows in a one-arrow window: hover slides the fresh one in from the left. */}
      <span className={`w-[15px] overflow-hidden transition-[color,scale] duration-500 group-active:scale-95 ${ink}`}>
        <span className="flex w-max -translate-x-[23px] gap-2 transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-0 group-focus-visible:translate-x-0 motion-reduce:transition-none">
          <Arrow />
          <Arrow />
        </span>
      </span>
    </Link>
  );
}
