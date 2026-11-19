"use client";

import { Check, Mail } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Label, PATHS, PLATFORM_COLOR, useInView } from "../kit";
import { Mark } from "../parts";
import { ENGINE } from "./content";

// The engine as four cards in a 2×2 board: a title, one short line, and an illustration that says the same thing
// at a glance, in the landing page's line-and-dot style (ink outlines, brand-green accents, dotted green wires).
// Each has a quiet hover, and the cards rise in once as they scroll into view.
//   Strategy & Research        a lens over a field of signals: inside it one stands out, green, "worth creating"
//   Technical Production       an article with real code in it, the checked line marked, signed by an engineer
//   Search & AI Optimization   one well-structured page at the centre, with Google and five AI assistants circling
//                              it on an orbit (behind it along the back, in front along the front), each having
//                              found it
//   Distribution & Compounding the published article, sending wires to Reddit, LinkedIn, X and email

const GREEN = "var(--primary)";
const INK = "#172c21";

export default function Engine() {
  const glyphs = [Research, Production, Search, Distribute];
  return (
    <section aria-labelledby="engine-title" className="bg-white px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{ENGINE.label}</Label>
        <h2 id="engine-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {ENGINE.title}
        </h2>
        <p className="mt-5 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{ENGINE.body}</p>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:mt-14">
          {ENGINE.parts.map((part, i) => {
            const Glyph = glyphs[i];
            return (
              <Card key={part.name} i={i} {...part}>
                <Glyph />
              </Card>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Card({ i, name, body, children }: { i: number; name: string; body: string; children: ReactNode }) {
  const [ref, seen] = useInView<HTMLLIElement>(0.2);
  return (
    <li
      ref={ref}
      className={`group flex flex-col gap-7 rounded-2xl border border-line bg-[#f9f8f4] p-7 min-[1360px]:flex-row min-[1360px]:items-center min-[1360px]:justify-between min-[1360px]:gap-6 min-[1360px]:p-9 ${seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0"}`}
      style={{ animationDelay: `${(i % 2) * 0.1 + Math.floor(i / 2) * 0.15}s` }}
    >
      <div className="max-w-[16.5rem]">
        <h3 className="text-[1.5rem] leading-[1.1] font-medium tracking-[-0.035em] text-ink">{name}</h3>
        <p className="mt-3 text-[1rem] leading-relaxed text-ink/60">{body}</p>
      </div>
      <div aria-hidden="true" className="shrink-0 self-center">
        {children}
      </div>
    </li>
  );
}

// ── The glyph kit ────────────────────────────────────────────────────────────────────────────────────────────

/** Strategy & Research: a lens over a field of signals (what people ask, search for, compare). Inside it the
 *  signals come into focus and one stands out, green: the opportunity worth creating. The lens drifts on hover. */
function Research() {
  const id = useId();
  // A quiet field of signals, their strength varying.
  const field: { x: number; y: number; o: number }[] = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 11; c++) field.push({ x: 14 + c * 20 + (r % 2) * 10, y: 20 + r * 22, o: 0.12 + (((c * 7 + r * 13) % 9) / 9) * 0.22 });
  const LX = 86;
  const LY = 98;
  const LR = 46;
  return (
    <div className="relative h-44 w-[15.5rem]">
      <svg viewBox="0 0 248 176" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <clipPath id={`${id}lens`}>
            <circle cx={LX} cy={LY} r={LR} />
          </clipPath>
        </defs>
        {field.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="2" fill={INK} fillOpacity={d.o} />
        ))}
        <g className="transition-transform duration-500 ease-out group-hover:-translate-x-1.5 group-hover:-translate-y-1 motion-reduce:transition-none">
          {/* The lens: what's under it, magnified and sorted. */}
          <circle cx={LX} cy={LY} r={LR} fill="#fff" />
          <g clipPath={`url(#${id}lens)`}>
            {[-2, -1, 0, 1, 2].map((c) =>
              [-1, 0, 1].map((r) => {
                const hit = c === 1 && r === -1;
                return hit ? null : <circle key={`${c}${r}`} cx={LX + c * 22 + (r === 0 ? 11 : 0)} cy={LY + r * 24} r="3.6" fill={INK} fillOpacity={0.14 + ((c + 2 + (r + 1) * 3) % 3) * 0.08} />;
              }),
            )}
            {/* The one worth creating. */}
            <circle cx={LX + 22} cy={LY - 24} r="12" fill={GREEN} fillOpacity="0.18" />
            <circle cx={LX + 22} cy={LY - 24} r="6" fill={GREEN} stroke={INK} strokeWidth="1.4" />
          </g>
          <circle cx={LX} cy={LY} r={LR} fill="none" stroke={INK} strokeWidth="1.8" />
          <circle cx={LX} cy={LY} r={LR - 5} fill="none" stroke={INK} strokeOpacity="0.12" strokeWidth="1" />
          {/* The handle. */}
          <path d={`M${LX + 34} ${LY + 34} L${LX + 64} ${LY + 64}`} stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path d={`M${LX + 34} ${LY + 34} L${LX + 64} ${LY + 64}`} stroke="#f9f8f4" strokeWidth="5.4" strokeLinecap="round" />
          {/* A dotted lead from the find to its label. */}
          <path d={`M${LX + 30} ${LY - 31} Q${LX + 40} ${LY - 50} ${LX + 54} ${LY - 56}`} fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" className={WIRE} />
        </g>
      </svg>
      <span className={`${PILL} top-[24px] left-[142px] h-[40px] -translate-y-1/2 flex-col items-start justify-center gap-[4px] px-2.5 whitespace-nowrap`}>
        <span className="flex items-center gap-1 text-[0.72rem] leading-none font-medium text-ink">
          <span className="size-1.5 rounded-full bg-primary" />
          Worth creating
        </span>
        <span className="font-mono text-[0.6rem] leading-none text-ink/50">2.9K searches/mo</span>
      </span>
    </div>
  );
}

/** Technical Production: an article with real code in it. The line an engineer checked is marked, and the piece is
 *  signed by them: written and tested hands-on. The badge lifts on hover. */
function Production() {
  return (
    <div className="relative h-44 w-[15.5rem]">
      <svg viewBox="0 0 248 176" className="absolute inset-0 size-full overflow-visible">
        {/* The article. */}
        <rect x="22" y="8" width="150" height="160" rx="9" fill="#fff" stroke={INK} strokeWidth="1.6" />
        <path d="M36 28 H128" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M36 42 H104" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <g stroke={INK} strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round">
          <path d="M36 58 H156 M36 67 H148" />
          <path d="M36 152 H150 M36 161 H120" />
        </g>
        {/* Its code block: syntax in ink and green, line numbers, the checked line marked. */}
        <rect x="34" y="78" width="124" height="62" rx="6" fill="#f3f5f2" stroke={INK} strokeOpacity="0.3" strokeWidth="1.2" />
        <rect x="35" y="98" width="122" height="13" fill={GREEN} fillOpacity="0.16" />
        <path d="M35 98 V111" stroke={GREEN} strokeWidth="2.4" />
        <g fontFamily="var(--font-mono)" fontSize="7" fill={INK} fillOpacity="0.35">
          <text x="40" y="92">1</text>
          <text x="40" y="107.5">2</text>
          <text x="40" y="122">3</text>
          <text x="40" y="136">4</text>
        </g>
        <g strokeWidth="3" strokeLinecap="round">
          <path d="M52 89.5 H66" stroke={INK} strokeOpacity="0.55" />
          <path d="M71 89.5 H96" stroke={GREEN} />
          <path d="M52 104.5 H62" stroke={INK} strokeOpacity="0.55" />
          <path d="M67 104.5 H112" stroke={INK} />
          <path d="M117 104.5 H134" stroke={GREEN} />
          <path d="M60 119 H90" stroke={INK} strokeOpacity="0.55" />
          <path d="M95 119 H116" stroke={GREEN} />
          <path d="M52 133 H58" stroke={INK} strokeOpacity="0.55" />
        </g>
      </svg>
      {/* Signed by the engineer who wrote and tested it. */}
      <span className={`${PILL} top-[118px] left-[96px] h-[42px] gap-2 pr-3 pl-1.5 shadow-[0_1px_2px_rgb(23_44_33/0.06),0_10px_20px_-12px_rgb(23_44_33/0.35)] group-hover:-translate-y-1`}>
        <span className="grid size-7 place-items-center rounded-full bg-light-green-soft text-[0.62rem] font-semibold text-[#1a7f47]">AK</span>
        <span className="flex flex-col gap-[3px]">
          <span className="text-[0.72rem] leading-none font-medium whitespace-nowrap text-ink">Engineer-written</span>
          <span className="flex items-center gap-1 text-[0.62rem] leading-none whitespace-nowrap text-ink/55">
            <Check className="size-2.5 text-[#16a34a]" strokeWidth={3} />
            Tested hands-on
          </span>
        </span>
      </span>
    </div>
  );
}

const WIRE = "[stroke-dasharray:1_6] group-hover:animate-dash-flow motion-reduce:animate-none";

/** A dotted green wire from one point to another, with a dot at each end. It starts to march on hover. */
function Wire({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const mx = (x0 + x1) / 2;
  return (
    <>
      <path d={`M${x0} ${y0} C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`} fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" className={WIRE} />
      <circle cx={x1} cy={y1} r="2.6" fill={GREEN} />
    </>
  );
}

const PILL = "absolute flex items-center rounded-lg border border-line bg-white shadow-[0_1px_2px_rgb(23_44_33/0.05)] transition-[border-color,transform] duration-300 group-hover:border-[color-mix(in_srgb,var(--primary)_65%,transparent)] group-hover:translate-x-0.5 motion-reduce:transition-none";

/** The orbit the engines travel (an ellipse around the page), in the illustration's own px. */
const ORBIT = "M18 106 A106 36 0 1 0 230 106 A106 36 0 1 0 18 106";
// One lap. 0% is the orbit's left end; the first half runs along the front (over the page), the second half up and
// over the back (behind it), so z-index steps at the two ends. The depth scale (a touch larger at the front,
// smaller at the back) runs on an inner layer: scaling the element that sits on the path would also scale its
// position along it and pull it off the ring.
const ORBIT_CSS = `
@keyframes engine-orbit {
  0% { offset-distance: 0%; z-index: 20 }
  49.9% { z-index: 20 }
  50% { z-index: 1 }
  99.9% { z-index: 1 }
  100% { offset-distance: 100%; z-index: 20 }
}
@keyframes engine-depth { 0% { scale: 0.94 } 25% { scale: 1.06 } 50% { scale: 0.94 } 75% { scale: 0.8 } 100% { scale: 0.94 } }`;
const LAP = 24; // seconds
const ENGINES = [
  { name: "Google", mark: "google" as const },
  { name: "ChatGPT", mark: "chatgpt" as const },
  { name: "Gemini", mark: "gemini" as const },
  { name: "Claude", mark: "claude" as const },
  { name: "Perplexity", mark: "perplexity" as const },
  { name: "Grok", mark: "grok" as const },
].map((e, i) => ({ ...e, at: i / 6 })); // evenly round; the two at the back rest either side of the page, peeking out
/** A small four-point sparkle. */
const Sparkle = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <path d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`} fill={GREEN} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
);

/** Search & AI: one well-structured page at the centre of the search world. Six engines (Google and the AI
 *  assistants) circle it on an orbit, each with a green "found" dot: along the back they pass behind the page,
 *  along the front in front of it. A couple of sparkles say it's ready for AI. On hover they set off round. */
function Search() {
  return (
    <div className="relative isolate h-44 w-[15.5rem]">
      <style>{ORBIT_CSS}</style>
      {/* The orbit, behind everything. */}
      <svg viewBox="0 0 248 176" className="absolute inset-0 size-full overflow-visible">
        <path d={ORBIT} fill="none" stroke={INK} strokeOpacity="0.22" strokeWidth="1.3" strokeDasharray="2 5" strokeLinecap="round" />
      </svg>
      {/* The page, between the back and the front of the orbit. */}
      <svg viewBox="0 0 248 176" className="absolute inset-0 z-10 size-full overflow-visible">
        <g transform="translate(92 24)">
          <rect x="0" y="0" width="64" height="88" rx="7" fill="#fff" stroke={INK} strokeWidth="1.6" />
          <rect x="9" y="11" width="15" height="9" rx="2.5" fill={GREEN} fillOpacity="0.2" stroke={GREEN} strokeWidth="1" />
          <text x="16.5" y="18" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="5.6" fontWeight="700" fill="#1a7f47">
            H1
          </text>
          <path d="M28 15.5 H55" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <g stroke={INK} strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 31 H55 M9 39 H48" />
            <path d="M9 64 H55 M9 72 H40" />
          </g>
          {/* An FAQ block: a question row. */}
          <rect x="9" y="46" width="46" height="11" rx="3" fill="#f3f5f2" stroke={INK} strokeOpacity="0.25" strokeWidth="1" />
          <path d="M13 51.5 H38" stroke={INK} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M47 50 l2 2 2-2" fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <Sparkle x={168} y={26} r={7} />
        <Sparkle x={181} y={40} r={4} />
        <Sparkle x={80} y={36} r={4.5} />
      </svg>
      {ENGINES.map((e) => (
        <span
          key={e.name}
          title={e.name}
          className="absolute top-0 left-0 size-8 motion-safe:animate-[engine-orbit_var(--lap)_linear_infinite_paused] group-hover:[animation-play-state:running]"
          style={{ offsetPath: `path("${ORBIT}")`, offsetRotate: "0deg", offsetAnchor: "50% 50%", offsetDistance: `${e.at * 100}%`, zIndex: e.at < 0.5 ? 20 : 1, ["--lap" as string]: `${LAP}s`, animationDelay: `${-e.at * LAP}s` }}
        >
          <span
            className="relative grid size-full place-items-center rounded-full border border-line bg-white shadow-[0_1px_2px_rgb(23_44_33/0.06),0_8px_16px_-10px_rgb(23_44_33/0.4)] motion-safe:animate-[engine-depth_var(--lap)_linear_infinite_paused] group-hover:[animation-play-state:running]"
            style={{ animationDelay: `${-e.at * LAP}s` }}
          >
            <Mark name={e.mark} className={`size-[15px] ${e.mark === "grok" ? "[&>path]:fill-ink" : ""}`} />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-white" />
          </span>
        </span>
      ))}
    </div>
  );
}

/** The published article: a page with a green Live badge. */
function Published({ className }: { className: string }) {
  return (
    <span className={`absolute ${className}`}>
      <svg viewBox="0 0 64 88" className="size-full overflow-visible">
        <rect x="1.5" y="1.5" width="61" height="85" rx="6" fill="#fff" stroke={INK} strokeWidth="1.6" />
        <path d="M12 30 H52" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        <g stroke={INK} strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 42 H52 M12 51 H52 M12 60 H52 M12 69 H34" />
        </g>
      </svg>
      <span className="absolute top-[7px] left-[7px] flex items-center gap-[3px] rounded-full bg-light-green-soft px-1.5 py-[2px] text-[0.55rem] leading-none font-semibold text-[#1a7f47]">
        <span className="size-1 rounded-full bg-primary" />
        Live
      </span>
    </span>
  );
}

const CHANNELS = [
  { name: "Reddit", node: <Mark name="reddit" className="size-4" /> },
  {
    name: "LinkedIn",
    node: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill={PLATFORM_COLOR.linkedin}>
        {PATHS.linkedin}
      </svg>
    ),
  },
  { name: "X", node: <Mark name="x" className="size-3.5" /> },
  { name: "Email", node: <Mail aria-hidden="true" className="size-4 text-ink/70" strokeWidth={1.8} /> },
];

/** Distribution & Compounding: the published article, and four channels it keeps reaching. */
function Distribute() {
  const ys = [22, 66, 110, 154];
  return (
    <div className="relative h-44 w-[15.5rem]">
      <Published className="top-[44px] left-[44px] h-[88px] w-16" />
      <svg viewBox="0 0 104 176" className="absolute top-0 left-[108px] h-44 w-[104px] overflow-visible">
        <circle cx="0" cy="88" r="2.6" fill={GREEN} />
        {ys.map((y) => (
          <Wire key={y} x0={0} y0={88} x1={104} y1={y} />
        ))}
      </svg>
      {CHANNELS.map((c, k) => (
        <span key={c.name} title={c.name} className={`${PILL} left-[212px] size-9 -translate-y-1/2 justify-center`} style={{ top: ys[k] }}>
          {c.node}
        </span>
      ))}
    </div>
  );
}
