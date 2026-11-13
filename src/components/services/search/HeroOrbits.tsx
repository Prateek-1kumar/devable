import { Mark, type Icon } from "../parts";

// The hero's backdrop for Search & AI Visibility: visibility spreading outward. In each side margin, centred just off
// the edge of the page, a field of concentric rings (hairline, dashed green, dotted) sways very slowly back and forth,
// each by its own amount, and on them sit the small marks of the places buyers look and the signals that matter:
// Google, Perplexity, Gemini, YouTube, Search Console and X on the left; ChatGPT, Claude, Reddit, G2, Hacker News and
// Stack Overflow on the right. The logos stay in view: the rings only sway along the visible arc. Where a logo meets
// its ring, the line lights up green and the logo glows. There is no text. The rings fade out toward the middle of the
// page, so nothing passes under the headline or the platform tiles. Switched off below 1280px, where the headline
// reaches the margins; at rest for reduced motion.
//
// A logo rides its ring and stays upright: its wrapper sways the opposite way by the same amount.

type Style = "faint" | "solid" | "dashed" | "dotted";
type Orbit = { r: number; style: Style; amp: number; secs: number; delay: number; mark?: { icon: Icon; at: number }; dot?: number };

// `at` is the angle on the ring in degrees, clockwise from the top. The left cluster shows its right half (0–180°),
// the right cluster its left half (180–360°); a ring sways by `amp` either side, so each logo stays in view.
const LEFT: Orbit[] = [
  { r: 78, style: "faint", amp: 16, secs: 52, delay: -8, dot: 40 },
  { r: 118, style: "solid", amp: 14, secs: 64, delay: -30, mark: { icon: "gemini", at: 90 } },
  { r: 158, style: "dashed", amp: 12, secs: 58, delay: -14, mark: { icon: "google", at: 64 }, dot: 130 },
  { r: 200, style: "faint", amp: 13, secs: 72, delay: -40, mark: { icon: "youtube", at: 112 } },
  { r: 244, style: "solid", amp: 11, secs: 66, delay: -22, mark: { icon: "perplexity", at: 80 }, dot: 150 },
  { r: 290, style: "dashed", amp: 10, secs: 78, delay: -50, mark: { icon: "googlesearchconsole", at: 58 }, dot: 20 },
  { r: 336, style: "dotted", amp: 9, secs: 70, delay: -6, mark: { icon: "x", at: 66 } },
  { r: 382, style: "faint", amp: 8, secs: 84, delay: -36, dot: 70 },
];
const RIGHT: Orbit[] = [
  { r: 78, style: "faint", amp: 16, secs: 56, delay: -20, dot: 320 },
  { r: 118, style: "solid", amp: 14, secs: 62, delay: -10, mark: { icon: "claude", at: 272 } },
  { r: 158, style: "dashed", amp: 12, secs: 60, delay: -34, mark: { icon: "chatgpt", at: 298 }, dot: 230 },
  { r: 200, style: "faint", amp: 13, secs: 70, delay: -18, mark: { icon: "g2", at: 236 } },
  { r: 244, style: "solid", amp: 11, secs: 68, delay: -44, mark: { icon: "reddit", at: 280 }, dot: 210 },
  { r: 290, style: "dashed", amp: 10, secs: 76, delay: -26, mark: { icon: "hackernews", at: 306 }, dot: 340 },
  { r: 336, style: "dotted", amp: 9, secs: 74, delay: -56, mark: { icon: "stackoverflow", at: 294 } },
  { r: 382, style: "faint", amp: 8, secs: 86, delay: -12, dot: 290 },
];

const RING: Record<Style, string> = {
  faint: "border border-ink/[0.06]",
  solid: "border border-ink/[0.11]",
  dashed: "border border-dashed border-primary/40",
  dotted: "border border-dotted border-ink/[0.22]",
};
// The lit stretch of a ring: green, fading out either side of the logo.
const LIT = "[mask-image:conic-gradient(from_-34deg,transparent_0deg,#000_34deg,transparent_68deg,transparent_360deg)]";

const sway = (o: Orbit, reverse = false) => ({
  animationDuration: `${o.secs}s`,
  animationDelay: `${o.delay}s`,
  ["--rock" as string]: `${o.amp}deg`,
  animationDirection: reverse ? "alternate-reverse" : "alternate",
});

function Cluster({ side }: { side: "left" | "right" }) {
  const orbits = side === "left" ? LEFT : RIGHT;
  return (
    <div
      className={`absolute inset-y-0 w-[26rem] ${side === "left" ? "left-0 [mask-image:linear-gradient(to_right,#000_52%,transparent_98%)]" : "right-0 [mask-image:linear-gradient(to_left,#000_52%,transparent_98%)]"}`}
    >
      {/* The centre, just off the page edge. */}
      <div className="absolute top-[31%] size-0" style={{ [side]: "-28px" }}>
        {orbits.map((o) => (
          <div key={o.r} className={`absolute rounded-full ${RING[o.style]} motion-safe:animate-rock`} style={{ width: o.r * 2, height: o.r * 2, left: -o.r, top: -o.r, ...sway(o) }}>
            {o.mark && (
              <>
                {/* the ring's lit stretch, centred on the logo */}
                <div className="absolute -inset-px" style={{ rotate: `${o.mark.at}deg` }}>
                  <div className={`absolute inset-0 rounded-full border-[1.5px] border-primary ${LIT}`} />
                </div>
                <div className="absolute inset-0" style={{ rotate: `${o.mark.at}deg` }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ rotate: `${-o.mark.at}deg` }}>
                    <div className="motion-safe:animate-rock" style={sway(o, true)}>
                      <span className="grid size-9 place-items-center rounded-full border border-ink/[0.08] bg-white shadow-[0_0_0_4px_rgb(25_231_110/0.1),0_0_18px_rgb(25_231_110/0.4)]">
                        <Mark name={o.mark.icon} className="size-[1.05rem]" />
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            {o.dot !== undefined && (
              <div className="absolute inset-0" style={{ rotate: `${o.dot}deg` }}>
                <span className="absolute top-0 left-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/80" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroOrbits() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden xl:block">
      <Cluster side="left" />
      <Cluster side="right" />
    </div>
  );
}
