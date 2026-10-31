import { Label } from "../kit";
import { COMMITMENTS, CREATORS } from "./content";

// What we commit to: three promises, one per phrase of the headline, each a warm card. The top of each card
// shows, small and static, the thing the client actually gets for that promise (the agreed objective and its
// metrics; the budget split across the plan; the result read against the goal), so each one reads as
// something you can check rather than a claim. At rest it is still; on hover each card comes a little alive (a light colour
// shift, then its own example plays: the metric chips light one by one, the budget segments fill in from the left, the line
// draws up to the goal), in CSS only and off for reduced motion. SAMPLE figures in the examples.
export default function Commitments() {
  return (
    <section aria-labelledby="commit-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{COMMITMENTS.label}</Label>
        {/* The headline's three phrases each stay whole, so it only ever breaks between them. */}
        <h2 id="commit-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {COMMITMENTS.title.split(/(?<=\.)\s+/).map((phrase, i) => (
            <span key={i} className="inline-block whitespace-nowrap">
              {phrase}
              {"\u00a0"}
            </span>
          ))}
        </h2>

        <ol className="mt-14 grid gap-5 lg:grid-cols-3">
          {COMMITMENTS.items.map((c, i) => {
            const Example = EXAMPLES[i];
            return (
              <li
                key={c.tag}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-[#f9f8f4] transition-[background-color,box-shadow] duration-500 hover:bg-[color-mix(in_srgb,var(--primary)_8%,#f9f8f4)] hover:shadow-[0_22px_44px_-30px_rgb(23_44_33/0.4)]"
              >
                <div aria-hidden="true" className="flex h-[17rem] items-center justify-center px-6 py-7">
                  <Example />
                </div>
                <div className="flex flex-1 flex-col border-t border-line bg-white px-7 pt-6 pb-8">
                  <p className="flex items-center gap-2.5">
                    <span className="grid h-6 min-w-6 place-items-center rounded-[5px] bg-ink/[0.06] px-1.5 font-mono text-[0.68rem] text-ink/70 tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="text-[0.9rem] font-medium tracking-[-0.01em] text-ink/75">{c.tag}</span>
                  </p>
                  <h3 className="mt-3 text-[1.25rem] leading-snug font-medium tracking-[-0.025em] text-ink">{c.title}</h3>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-ink/65">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const SHEET = "w-full max-w-[18.5rem] rounded-xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgb(23_44_33/0.04),0_14px_30px_-18px_rgb(23_44_33/0.3)]";
const CAPTION = "font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase";

/** 01 · The brief: one objective, the metrics it's measured by, agreed before launch. */
function Goals() {
  return (
    <div className={SHEET}>
      <p className={CAPTION}>Objective</p>
      <p className="mt-1 text-[1.05rem] font-medium tracking-[-0.02em] text-ink">Product adoption</p>
      <p className={`${CAPTION} mt-4`}>Measured by</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {["Signups", "Activation", "Demo requests"].map((m, i) => (
          <li
            key={m}
            style={{ ["--d" as string]: `${i * 170}ms` }}
            className="rounded-full border border-ink/12 px-2.5 py-1 text-[0.72rem] whitespace-nowrap text-ink/80 transition-[background-color,border-color,color] duration-300 group-hover:border-primary/60 group-hover:bg-light-green-soft group-hover:text-[#1a7f47] group-hover:delay-(--d)"
          >
            {m}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[0.72rem] text-ink/65">
        <span className="size-1.5 rounded-full bg-primary" />
        Agreed before launch
      </p>
    </div>
  );
}

const SPLIT = [
  { name: "Creators", share: 62, tone: "bg-ink" },
  { name: "Content production", share: 24, tone: "bg-ink/40" },
  { name: "Amplification", share: 14, tone: "bg-primary" },
];

/** 02 · The plan: the budget split, and the creator mix it pays for. */
function Spend() {
  return (
    <div className={SHEET}>
      <div className="flex items-center justify-between">
        <p className={CAPTION}>Budget allocation</p>
        <span className="flex -space-x-1.5">
          {CREATORS.slice(0, 4).map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- sample creator photos
            <img key={c.photo} src={c.photo} alt="" className="size-5 rounded-full object-cover ring-2 ring-white" />
          ))}
        </span>
      </div>
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {SPLIT.map((s, i) => (
          <span
            key={s.name}
            className={`${s.tone} origin-left motion-safe:group-hover:animate-fill`}
            style={{ width: `${s.share}%`, animationDuration: "700ms", animationDelay: `${i * 180}ms`, animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
          />
        ))}
      </div>
      <ul className="mt-3.5 space-y-1.5">
        {SPLIT.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-[0.75rem] text-ink/75">
            <span className={`size-2 rounded-[2px] ${s.tone}`} />
            <span className="flex-1">{s.name}</span>
            <span className="font-medium text-ink tabular-nums">{s.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 03 · The report: the result read against the goal set at the start. */
function Accountability() {
  return (
    <div className={SHEET}>
      <div className="flex items-baseline justify-between">
        <p className={CAPTION}>Result vs. goal</p>
        <p className="text-[0.75rem] font-medium text-ink tabular-nums">107%</p>
      </div>
      <svg viewBox="0 0 240 86" className="mt-3 w-full overflow-visible">
        <defs>
          <linearGradient id="commit-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgb(25 231 110)" stopOpacity="0.2" />
            <stop offset="1" stopColor="rgb(25 231 110)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* The goal, agreed up front. */}
        <line x1="0" x2="240" y1="22" y2="22" stroke="var(--ink)" strokeOpacity="0.35" strokeDasharray="3 4" />
        <text x="0" y="14" className="fill-muted font-mono text-[8px] tracking-[0.08em]">
          GOAL
        </text>
        <path d="M0 80 C 40 76, 70 66, 110 52 S 190 26, 234 17 L 234 86 L 0 86 Z" fill="url(#commit-area)" className="motion-safe:group-hover:animate-[soft-in_900ms_ease_350ms_both]" />
        <path
          d="M0 80 C 40 76, 70 66, 110 52 S 190 26, 234 17"
          pathLength={1}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="[stroke-dasharray:1] motion-safe:group-hover:animate-[draw-line_1200ms_cubic-bezier(0.22,1,0.36,1)_both]"
        />
        <g className="motion-safe:group-hover:animate-[soft-in_450ms_ease_1000ms_both]">
          <circle cx="234" cy="17" r="4.5" fill="#fff" stroke="var(--ink)" strokeOpacity="0.2" />
          <circle cx="234" cy="17" r="2.8" fill="var(--primary)" />
        </g>
      </svg>
      <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[0.72rem] text-ink/65">
        <span className="size-1.5 rounded-full bg-primary" />
        Judged on the objective, not the views
      </p>
    </div>
  );
}

const EXAMPLES = [Goals, Spend, Accountability];
