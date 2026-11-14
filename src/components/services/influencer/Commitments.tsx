import { CircleCheck, Coins, Layers, Mail, Users } from "lucide-react";
import { Label, PlatformIcon, type Platform } from "../kit";
import { COMMITMENTS, PROCESS_CREATORS } from "./content";

// The hover motion: the line drawing on, and what follows it fading in.
const KEYFRAMES = `
@keyframes draw-line { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes soft-in { from { opacity: 0; } }
`;

// What we commit to: three promises, one per phrase of the headline, each a warm card. The top of each card
// shows, small and static, the thing the client actually gets for that promise (the agreed objective and its
// metrics; the campaign summary approved before spend, with who is involved, where it runs and the budget; the result read against the goal), so each one reads as
// something you can check rather than a claim. At rest it is still; on hover each card comes a little alive (a light colour
// shift, then its own example plays: the metric chips light one by one, the summary's icons light in turn and its status turns green, the line
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

// SAMPLE: illustrative values for a campaign summary, not a standard package. The point is what the client sees
// settled before anything goes live: who is involved, where it runs, what is approved.
const PLAN = { creators: 12, shown: 3, budget: "$25,000 total approved", channels: ["x", "linkedin", "newsletter"] as Platform[] };

/** 02 · The plan: a campaign summary the client signs off before spend starts: the creators, where it runs, the budget, and its approval. */
function Spend() {
  const rows = [
    { Icon: Users, label: "Creator mix", value: <span>{PLAN.creators} creators selected</span> },
    {
      Icon: Layers,
      label: "Campaign plan",
      value: (
        <span className="flex items-center gap-1.5">
          {PLAN.channels.map((p, i) => (
            <span key={p} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink/40">·</span>}
              {p === "newsletter" ? <Mail aria-hidden="true" strokeWidth={1.8} className="size-4 text-ink" /> : <PlatformIcon platform={p} className={`size-[0.95rem] ${p === "linkedin" ? "text-[#0a66c2]" : "text-ink"}`} />}
            </span>
          ))}
        </span>
      ),
    },
    { Icon: Coins, label: "Budget", value: <span>{PLAN.budget}</span> },
    {
      Icon: CircleCheck,
      label: "Status",
      value: (
        <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-ink/75 transition-colors duration-500 group-hover:bg-[color-mix(in_srgb,var(--primary)_22%,white)] group-hover:text-[#14653a] group-hover:delay-[700ms]">Approved before launch</span>
      ),
    },
  ];
  return (
    <div className={SHEET}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center -space-x-2 transition-[gap] duration-500 group-hover:-space-x-1">
          {PROCESS_CREATORS.slice(0, PLAN.shown).map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- creator photos
            <img key={c.photo} src={c.photo} alt="" className="size-7 rounded-full object-cover ring-2 ring-white transition-[margin] duration-500" />
          ))}
          <span className="grid size-7 place-items-center rounded-full bg-ink/[0.07] text-[0.72rem] font-medium text-ink/70 ring-2 ring-white">+{PLAN.creators - PLAN.shown}</span>
        </span>
        <span className="rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,white)] px-2.5 py-1 text-[0.72rem] font-medium text-[#14653a]">Campaign plan</span>
      </div>
      <ul className="mt-2.5 border-t border-line">
        {rows.map(({ Icon, label, value }, i) => (
          <li key={label} className={`flex items-center gap-2 py-2 text-[0.78rem] ${i ? "border-t border-line" : ""}`}>
            <Icon aria-hidden="true" strokeWidth={1.8} style={{ ["--d" as string]: `${i * 170}ms` }} className="size-4 shrink-0 text-ink/50 transition-colors duration-300 group-hover:text-[#1a9a55] group-hover:delay-(--d)" />
            <span className="flex-1 text-ink/65">{label}</span>
            <span className="font-medium text-ink">{value}</span>
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
<style href="influencer-commitments" precedence="default">{KEYFRAMES}</style>
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
