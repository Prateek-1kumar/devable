import type { ReactNode } from "react";

// Inline pill that makes a key phrase pop. On load, amber and lime sweep in
// from the left and the tone's own color settles on top (the same motion as
// ArcButton). Pass `delay` to stagger several pills. The text starts in the
// default ink and settles on the tone's text color.
// Sweep colors are intentionally local, matching ArcButton.
const SWEEP = ["var(--amber)", "var(--lime)"];
const STEP = 0.1; // seconds between layers

const TONES = {
  accent: { bg: "bg-accent", text: "text-white" },
  white: { bg: "bg-white", text: "text-foreground" },
  coral: { bg: "bg-coral", text: "text-foreground" },
};

type Props = {
  tone: keyof typeof TONES;
  /** Entrance delay in seconds. */
  delay?: number;
  children: ReactNode;
};

export default function Highlight({ tone, delay = 0, children }: Props) {
  const { bg, text } = TONES[tone];
  const layer = "absolute inset-0 rounded-full animate-pill-sweep";
  const settle = { animationDelay: `${delay + SWEEP.length * STEP}s` };

  return (
    // No overflow-hidden here: it would move the inline-block's baseline off the text line.
    <span className="relative isolate inline-block rounded-full px-[0.3em]">
      <span aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-full">
        {SWEEP.map((color, i) => (
          <span
            key={color}
            className={`${layer} motion-reduce:hidden`}
            style={{ backgroundColor: color, animationDelay: `${delay + i * STEP}s` }}
          />
        ))}
        <span className={`${layer} ${bg} motion-reduce:animate-none`} style={settle} />
      </span>
      <span style={settle} className={`${text} animate-pill-ink motion-reduce:animate-none`}>
        {children}
      </span>
    </span>
  );
}
