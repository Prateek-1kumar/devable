// The testimonial's edge: a few thin horizontal bars along the top and the bottom of the band, in pale green and warm
// grey with one short coral, each a different length and starting at a different place, like the rows of a ledger.
// They slide in once, from the side they sit on, when the band is scrolled to, and then they are still. They sit a little in from the
// edges, thinning out as they near the quote, never on it. Reduced motion: drawn, still.

type Bar = { at: "top" | "bottom"; row: number; left: number; width: number; tone: keyof typeof TONE; delay: number };

const TONE = {
  green: "color-mix(in srgb, var(--primary) 42%, white)",
  grey: "#d6ddd3",
  coral: "color-mix(in srgb, var(--accent) 58%, white)",
};

// Percentages of the band's width. A bar that begins left of the middle grows out from its left end, otherwise from its right.
const BARS: Bar[] = [
  // top (row 0 is the farthest from the quote, row 4 the nearest, so the rows thin out as they near it)
  { at: "top", row: 0, left: 0, width: 5, tone: "green", delay: 0 },
  { at: "top", row: 0, left: 31, width: 14, tone: "grey", delay: 0.12 },
  { at: "top", row: 0, left: 62, width: 30, tone: "grey", delay: 0.2 },
  { at: "top", row: 0, left: 92, width: 8, tone: "green", delay: 0.28 },
  { at: "top", row: 1, left: 0, width: 1.5, tone: "green", delay: 0.2 },
  { at: "top", row: 1, left: 16, width: 9, tone: "grey", delay: 0.26 },
  { at: "top", row: 1, left: 48, width: 10, tone: "green", delay: 0.32 },
  { at: "top", row: 1, left: 78, width: 22, tone: "green", delay: 0.34 },
  { at: "top", row: 2, left: 6, width: 12, tone: "grey", delay: 0.36 },
  { at: "top", row: 2, left: 36, width: 4, tone: "green", delay: 0.4 },
  { at: "top", row: 2, left: 70, width: 9, tone: "grey", delay: 0.42 },
  { at: "top", row: 2, left: 88, width: 12, tone: "green", delay: 0.46 },
  { at: "top", row: 3, left: 0, width: 9, tone: "green", delay: 0.5 },
  { at: "top", row: 3, left: 24, width: 5, tone: "grey", delay: 0.52 },
  { at: "top", row: 3, left: 83, width: 17, tone: "grey", delay: 0.54 },
  { at: "top", row: 4, left: 10, width: 3, tone: "green", delay: 0.6 },
  { at: "top", row: 4, left: 90, width: 6, tone: "green", delay: 0.62 },
  // bottom (row 0 is the farthest from the quote)
  { at: "bottom", row: 0, left: 0, width: 12, tone: "green", delay: 0.04 },
  { at: "bottom", row: 0, left: 41, width: 30, tone: "green", delay: 0.1 },
  { at: "bottom", row: 0, left: 71, width: 16, tone: "grey", delay: 0.2 },
  { at: "bottom", row: 1, left: 6, width: 21, tone: "coral", delay: 0.18 },
  { at: "bottom", row: 1, left: 27, width: 3, tone: "green", delay: 0.26 },
  { at: "bottom", row: 1, left: 56, width: 44, tone: "green", delay: 0.3 },
  { at: "bottom", row: 2, left: 0, width: 4, tone: "green", delay: 0.4 },
  { at: "bottom", row: 2, left: 34, width: 19, tone: "grey", delay: 0.36 },
  { at: "bottom", row: 2, left: 80, width: 20, tone: "grey", delay: 0.44 },
  { at: "bottom", row: 3, left: 12, width: 8, tone: "green", delay: 0.5 },
  { at: "bottom", row: 3, left: 62, width: 12, tone: "green", delay: 0.54 },
  { at: "bottom", row: 3, left: 88, width: 12, tone: "grey", delay: 0.56 },
  { at: "bottom", row: 4, left: 4, width: 3, tone: "green", delay: 0.62 },
  { at: "bottom", row: 4, left: 46, width: 5, tone: "grey", delay: 0.64 },
  { at: "bottom", row: 4, left: 94, width: 6, tone: "green", delay: 0.66 },
];
const H = 7; // px, a bar's height
const GAP = 8; // px between rows

export default function TestimonialBars({ seen }: { seen: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-12 bottom-12 -z-10 sm:top-16 sm:bottom-16">
      {BARS.map((b, i) => (
        <span
          key={i}
          className={`absolute rounded-[2px] ${b.row >= 3 ? "max-sm:hidden" : ""} transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:scale-x-100 motion-reduce:transition-none ${b.left < 50 ? "origin-left" : "origin-right"} ${seen ? "scale-x-100" : "scale-x-0"}`}
          style={{ [b.at]: b.row * (H + GAP), left: `${b.left}%`, width: `${b.width}%`, height: H, backgroundColor: TONE[b.tone], transitionDelay: seen ? `${b.delay}s` : "0s" }}
        />
      ))}
    </div>
  );
}
