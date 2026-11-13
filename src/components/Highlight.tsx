import type { ReactNode } from "react";

// The sweep and the ink-in, defined here so the pill's whole motion lives in this file.
const KEYFRAMES = `
@keyframes pill-sweep { from { transform: translateX(-101%); } to { transform: translateX(0); } }
@keyframes pill-ink { from { color: var(--foreground); } }
`;

// Inline pill that makes a key phrase pop. On load, amber and lime sweep in
// from the left and the tone's own color settles on top. Pass `delay` to
// stagger several pills. The text starts in the
// default ink and settles on the tone's text color.
// Sweep colors are intentionally local.
const SWEEP = ["var(--amber)", "var(--lime)"];
const STEP = 0.1; // seconds between layers

const TONES = {
  accent: { bg: "bg-accent", text: "text-white" },
  white: { bg: "bg-white", text: "text-foreground" },
  coral: { bg: "bg-coral", text: "text-foreground" },
  brand: { bg: "bg-primary", text: "text-foreground" }, // the brand green, with ink text, for a passage that needs one or two lit phrases
};

type Props = {
  tone: keyof typeof TONES;
  /** Entrance delay in seconds. */
  delay?: number;
  children: ReactNode;
};

export default function Highlight({ tone, delay = 0, children }: Props) {
  const { bg, text } = TONES[tone];
  const layer = "absolute inset-0 rounded-full animate-[pill-sweep_0.9s_cubic-bezier(0.65,0,0.35,1)_both]";
  const settle = { animationDelay: `${delay + SWEEP.length * STEP}s` };

  return (
    // No overflow-hidden here: it would move the inline-block's baseline off the text line.
    <span className="relative isolate inline-block rounded-full px-[0.3em]">
<style href="highlight" precedence="default">{KEYFRAMES}</style>
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
      <span style={settle} className={`${text} animate-[pill-ink_0.9s_cubic-bezier(0.65,0,0.35,1)_both] motion-reduce:animate-none`}>
        {children}
      </span>
    </span>
  );
}
