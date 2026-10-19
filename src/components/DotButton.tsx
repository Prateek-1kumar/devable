import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// White button with a green dot-matrix chevron box on the left. On hover the green fills the button
// (leaving a thin white frame); the label stays, in ink, with a short row of chevrons pulsing after it.
const GROW = "ease-[cubic-bezier(0.65,0,0.35,1)] duration-500 motion-reduce:duration-0";
const GREEN =
  "bg-[linear-gradient(180deg,#6df3a4_0%,var(--color-primary)_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.45)]";

// 4×5 grid of dots tracing a ">".
const DOTS = [
  [0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [1, 3], [2, 3], [0, 4], [1, 4],
];

function Chevron({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 4 5" className={`h-3.5 w-[11px] ${className}`} style={style}>
      {DOTS.map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x + 0.5} cy={y + 0.5} r={0.36} fill="currentColor" />
      ))}
    </svg>
  );
}

export default function DotButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-12 items-center justify-center overflow-hidden rounded-[8px] bg-white pl-14 pr-6 text-[1rem] font-medium tracking-wide text-black shadow-[0_12px_28px_-12px_rgb(0_0_0/0.6)] outline-offset-4 ${className}`}
    >
      <span className="transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
        {children}
      </span>

      {/* Green layer: clipped to the 40px box on the left at rest, opens to a 3px-inset fill on hover. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 ${GREEN} transition-[clip-path] ${GROW} [clip-path:inset(4px_calc(100%-44px)_4px_4px_round_5px)] group-hover:[clip-path:inset(3px_3px_3px_3px_round_6px)] group-focus-visible:[clip-path:inset(3px_3px_3px_3px_round_6px)]`}
      >
        {/* The label stays readable in ink on the green, with chevrons pulsing on after it. */}
        <span className="absolute inset-0 flex items-center justify-center gap-4 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-200 group-focus-visible:opacity-100">
          <span>{children}</span>
          <span className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Chevron
                key={i}
                className="animate-dot-wave motion-reduce:animate-none"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
        </span>
      </span>

      {/* Resting chevron in the box; fades as the row takes over. */}
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 grid w-10 place-items-center text-ink/75 transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0"
      >
        <Chevron />
      </span>
    </Link>
  );
}
