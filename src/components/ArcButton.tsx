import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Rectangular button with small border radius. On hover the fill breaks into the hero's glyph grid
// (dot, lines, X, square, slash, tinted cell) as a left-to-right wave and holds there; leaving fades it back to solid.
const TONES = {
  primary: "bg-black text-white shadow-sm",
  accent: "bg-black text-white shadow-sm",
  secondary: "bg-white text-black border border-black/15 shadow-sm",
  orange: "bg-secondary text-white",
};

// A tight halo in the button's own fill around each letter: invisible at rest, it cuts the label
// out of the glyph grid on hover so the grid can run at full strength right up to the text.
const HALO = {
  primary: "[text-shadow:0_0_1px_#000,0_0_2px_#000,0_0_3px_#000,0_0_5px_#000]",
  accent: "[text-shadow:0_0_1px_#000,0_0_2px_#000,0_0_3px_#000,0_0_5px_#000]",
  secondary: "[text-shadow:0_0_1px_#fff,0_0_2px_#fff,0_0_3px_#fff,0_0_5px_#fff]",
  orange: "[text-shadow:0_0_1px_var(--secondary),0_0_2px_var(--secondary),0_0_3px_var(--secondary),0_0_5px_var(--secondary)]",
};

// Grid big enough to cover the widest button; overflow-hidden on the link crops the rest.
const CELL = 8;
const COLS = 40;
const ROWS = 8;

// Deterministic per-cell pick (same on server and client), so the grid doesn't cause a hydration mismatch.
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const h = Math.imul(i + 1, 2654435761) >>> 0;
  const col = i % COLS;
  return {
    x: col * CELL,
    y: Math.floor(i / COLS) * CELL,
    glyph: h % 10, // 0–5 draw a glyph, 6–9 stay empty so the grid reads sparse like the hero
    orange: (h >>> 8) % 4 === 0,
    delay: col * 4 + ((h >>> 12) % 60),
  };
}).filter((c) => c.glyph < 6);

function Glyph({ glyph }: { glyph: number }) {
  switch (glyph) {
    case 0:
      return <circle cx="4" cy="4" r="1.2" fill="currentColor" stroke="none" />;
    case 1:
      return <path d="M2 2.2h4M2 4h4M2 5.8h4" />;
    case 2:
      return <path d="M2 2l4 4M2 6l4-4" />;
    case 3:
      return <rect x="2" y="2" width="4" height="4" />;
    case 4:
      return <path d="M2 6l4-4" />;
    default:
      return (
        <rect
          x="1"
          y="1"
          width="6"
          height="6"
          fill="currentColor"
          fillOpacity={0.3}
          stroke="none"
        />
      );
  }
}

function GridBreak() {
  return (
    // Dimmed (not cleared) behind the label, the way the hero eases its glyphs behind the headline.
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_62%_70%_at_50%_50%,rgb(0_0_0_/_0.45)_30%,black_85%)] motion-reduce:hidden"
    >
      <svg
        width={COLS * CELL}
        height={ROWS * CELL}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
      >
        {CELLS.map((c, i) => (
          <g
            key={i}
            transform={`translate(${c.x} ${c.y})`}
            style={
              {
                "--d": `${c.delay}ms`,
                animationDelay: `${c.delay}ms`,
              } as CSSProperties
            }
            className={`opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:[transition-delay:var(--d)] group-hover:animate-grid-flick group-focus-visible:opacity-100 group-focus-visible:animate-grid-flick ${c.orange ? "text-secondary" : "[color:color-mix(in_srgb,currentColor_80%,transparent)]"}`}
          >
            <Glyph glyph={c.glyph} />
          </g>
        ))}
      </svg>
    </span>
  );
}

const SIZES = {
  md: "gap-2.5 px-6 py-2.5 text-[0.95rem] rounded-[6px]",
  sm: "gap-2 px-4 py-2 text-[0.88rem] rounded-[6px]",
};

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 15 14"
      className="h-3.5 w-[15px] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
    >
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
};

export default function ArcButton({
  href,
  children,
  tone = "primary",
  size = "md",
  arrow = false,
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      className={`group relative isolate inline-flex items-center justify-center overflow-hidden font-medium tracking-wide outline-offset-4 ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      <GridBreak />
      <span className={HALO[tone]}>{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}
