import type { ReactNode } from "react";

// Plays once when the falling pill lands (FallingPill sets data-landed on its root).
// Pills start as empty stone skeletons; colored pill layers slide in from the left
// and the pill's own color arrives last, carrying its word in. Plain words ink in
// from grey as the wave passes. Timings are seconds after landing.

const LAYER = "absolute inset-0 -translate-x-full rounded-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] in-data-landed:translate-x-0 motion-reduce:transition-none";
const STEP = 0.12;

type PillProps = {
  /** Colors that lead the wave, then `fill` settles. */
  lead: string[];
  fill: string;
  text: string;
  at: number;
  children: ReactNode;
};

function SweepPill({ lead, fill, text, at, children }: PillProps) {
  const settle = at + lead.length * STEP;
  return (
    <span className="relative inline-block rounded-full bg-[var(--pixel-stone)] px-[0.35em]">
      {/* Clip layers in their own wrapper so the pill keeps the text baseline. */}
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full">
        {[...lead, fill].map((color, i) => (
          <span key={color} className={`${LAYER} ${color}`} style={{ transitionDelay: `${at + i * STEP}s` }} />
        ))}
      </span>
      <span
        className={`relative inline-block transition-[clip-path] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] [clip-path:inset(0_100%_0_0)] in-data-landed:[clip-path:inset(0_0_0_0)] motion-reduce:transition-none ${text}`}
        style={{ transitionDelay: `${settle}s` }}
      >
        {children}
      </span>
    </span>
  );
}

function Ink({ at, children }: { at: number; children: ReactNode }) {
  return (
    <span
      className="text-foreground/40 transition-colors duration-700 in-data-landed:text-foreground motion-reduce:transition-none"
      style={{ transitionDelay: `${at}s` }}
    >
      {children}
    </span>
  );
}

/** "Trusted by AI-native dev tools and platforms." with a color-wave reveal. */
export default function TrustedBy() {
  return (
    // Hidden until the pill lands, so the grey "skeleton" state only exists inside the reveal itself.
    <h2 className="flex flex-col gap-[0.2em] text-4xl leading-[1.25] font-semibold opacity-0 transition-opacity duration-300 in-data-landed:opacity-100 sm:text-5xl xl:text-6xl">
      <span>
        <Ink at={0.1}>Trusted by</Ink>{" "}
        <SweepPill lead={["bg-foreground", "bg-amber"]} fill="bg-accent" text="text-white" at={0.25}>
          AI-native
        </SweepPill>
      </span>
      <span>
        <SweepPill lead={["bg-amber", "bg-accent"]} fill="bg-coral" text="text-foreground" at={0.6}>
          dev tools
        </SweepPill>{" "}
        <Ink at={0.95}>and platforms.</Ink>
      </span>
    </h2>
  );
}
