"use client";

import { Link2, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Label, useInView } from "../kit";
import { Mark, MarkStack, Tick } from "../parts";
import { EXPANDED } from "./content";

// The core idea, as a quiet board: Search Visibility and AI Visibility side by side, joined by a plus, then a line
// that says they work together and the three signals that feed both. Each card is a real surface (a lit edge, layered
// shadow, a white UI panel inset in it) holding only the one picture that tells the two apart:
//   Search   a results page where the green result climbs from third place to first
//   AI       an answer that fills in, with the green source cited in it
// Nothing else is drawn: no numbers, no trackers. Both loop slowly (about ten seconds, resting on the finished
// picture for most of it) once the board is on screen; reduced motion shows the finished picture, still.
const { search, ai, together, signals } = EXPANDED;

const CARD =
  "relative flex flex-col rounded-[28px] bg-[#faf9f5] p-6 shadow-[0_0_0_1px_rgb(23_44_33/0.03),0_22px_40px_-40px_rgb(23_44_33/0.1)] sm:p-9";
const PANEL =
  "rounded-2xl bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.035),0_14px_26px_-22px_rgb(23_44_33/0.16)]";
const BAR = "block h-[7px] rounded-full bg-ink/[0.1]";

export default function Expanded() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  // Literal class names, so Tailwind can see them; the loops only start once the board is on screen.
  const climb = seen ? "motion-safe:animate-climb" : "";
  const settle = seen ? "motion-safe:animate-settle" : "";
  const answer = seen ? "motion-safe:animate-answer" : "";
  const cite = seen ? "motion-safe:animate-cite" : "";
  const rise = seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0";

  return (
    <section
      aria-labelledby="expanded-title"
      className="bg-white px-6 py-16 sm:px-12 lg:py-24 xl:px-[6vw]"
    >
      <div className="mx-auto max-w-[76rem]">
        <Label>{EXPANDED.label}</Label>
        <h2
          id="expanded-title"
          className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink"
        >
          {EXPANDED.title}
        </h2>
        <p className="mt-4 max-w-[44rem] text-[1.05rem] leading-relaxed text-ink/65">
          {EXPANDED.body}
        </p>

        <div ref={ref} className="mt-12 lg:mt-14">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] lg:gap-0">
            {/* Search */}
            <article className={`${CARD} ${rise}`}>
              <Head
                name={search.name}
                logo={<Mark name="google" className="size-9" />}
              />
              <h3 className="mt-6 text-[1.4rem] leading-tight font-semibold tracking-[-0.03em] text-ink">
                {search.title}
              </h3>
              <p className="mt-2 max-w-[28rem] text-[1rem] leading-relaxed text-ink/60">
                {search.body}
              </p>

              <div aria-hidden="true" className="mt-auto pt-7">
                <div className={`${PANEL} p-4 sm:p-5`}>
                  <div className="flex items-center gap-3 rounded-full bg-[#f6f5f1] px-4 py-3 shadow-[inset_0_0_0_1px_rgb(23_44_33/0.03)]">
                    <Search
                      className="size-4 shrink-0 text-ink/45"
                      strokeWidth={2}
                    />
                    <span className="h-[7px] w-40 rounded-full bg-ink/[0.14]" />
                  </div>
                  {/* Three results, 40px each with 8px between: the green one (last by position) climbs to the top. */}
                  <ul className="mt-4 flex flex-col gap-2 overflow-hidden">
                    {[
                      { w: ["w-3/5", "w-4/5"], win: true },
                      { w: ["w-1/2", "w-3/4"] },
                      { w: ["w-2/3", "w-3/5"] },
                    ].map((r, i) => (
                      <li
                        key={i}
                        className={`relative flex h-10 items-center gap-3 rounded-xl px-3 ${r.win ? "z-10 bg-[color-mix(in_srgb,var(--primary)_10%,white)] shadow-[inset_0_0_0_1px_rgb(25_231_110/0.2)] " + climb : "bg-[#f9f8f4] " + settle}`}
                      >
                        <span
                          className={`size-4 shrink-0 rounded-[5px] ${r.win ? "bg-primary" : "bg-ink/[0.12]"}`}
                        />
                        <span className="flex flex-1 flex-col gap-1.5">
                          <span
                            className={`${BAR} ${r.w[0]} ${r.win ? "bg-primary/80" : ""}`}
                          />
                          <span
                            className={`${BAR} ${r.w[1]} h-[5px] bg-ink/[0.07]`}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            {/* The plus: only a glyph in the gutter. */}
            <span aria-hidden="true" className="select-none text-center text-[1.6rem] leading-none font-light text-ink/25 max-lg:-my-1 lg:self-center">
              +
            </span>

            {/* AI */}
            <article
              className={`${CARD} ${rise}`}
              style={{ animationDelay: "0.12s" }}
            >
              <Head
                name={ai.name}
                logo={
                  <MarkStack
                    names={["chatgpt", "perplexity", "claude"]}
                    size="size-9"
                  />
                }
              />
              <h3 className="mt-6 text-[1.4rem] leading-tight font-semibold tracking-[-0.03em] text-ink">
                {ai.title}
              </h3>
              <p className="mt-2 max-w-[30rem] text-[1rem] leading-relaxed text-ink/60">
                {ai.body}
              </p>

              <div aria-hidden="true" className="mt-auto pt-7">
                <div className={`${PANEL} p-4 sm:p-5`}>
                  <div className="flex items-center gap-3 rounded-full bg-[#f6f5f1] px-4 py-3 shadow-[inset_0_0_0_1px_rgb(23_44_33/0.03)]">
                    <Sparkles
                      className="size-4 shrink-0 text-[#4285f4]"
                      strokeWidth={2}
                      fill="currentColor"
                    />
                    <span className="h-[7px] w-32 rounded-full bg-ink/[0.14]" />
                  </div>
                  <div className="mt-4 space-y-3 rounded-xl bg-[#f9f8f4] p-4">
                    {/* the answer fills in, left to right */}
                    {["w-full", "w-11/12", "w-3/5"].map((w, i) => (
                      <span
                        key={w}
                        className={`block h-[7px] rounded-full ${w} origin-left bg-ink/[0.1] ${answer}`}
                        style={{ animationDelay: `${0.18 * i}s` }}
                      />
                    ))}
                    {/* the source it cites */}
                    <div className="flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,white)] px-3 py-2.5 shadow-[inset_0_0_0_1px_rgb(25_231_110/0.2)]">
                      <span className="size-4 shrink-0 rounded-[5px] bg-primary" />
                      <span className="flex flex-1 flex-col gap-1.5">
                        <span
                          className={`h-[7px] w-3/4 origin-left rounded-full bg-primary/80 ${answer}`}
                          style={{ animationDelay: "0.7s" }}
                        />
                        <span className="h-[5px] w-1/2 rounded-full bg-ink/[0.07]" />
                      </span>
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full bg-primary font-mono text-[0.6rem] font-semibold text-ink ${cite}`}
                      >
                        1
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Together */}
          <div className="mt-8 flex items-center gap-5">
            <span aria-hidden="true" className="h-px flex-1 bg-ink/[0.07]" />
            <p className="flex items-center gap-2.5 text-[0.98rem] font-medium text-ink/80">
              <Tick className="size-5" />
              {together}
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-ink/[0.07]" />
          </div>

          {/* The signals that feed both */}
          <div className="mt-6 grid gap-3 rounded-[24px] bg-[#faf9f5] p-3 lg:grid-cols-[13rem_repeat(3,minmax(0,1fr))] lg:items-stretch">
            <p className="flex items-center px-3 py-2 text-[0.9rem] leading-snug text-ink/55 lg:border-r lg:border-ink/[0.06] lg:pr-5">
              {signals.label}
            </p>
            {signals.items.map((s) => (
              <div
                key={s.name}
                className="group flex items-center gap-3.5 rounded-2xl bg-white px-4 py-4 shadow-[0_0_0_1px_rgb(23_44_33/0.03)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(25_231_110/0.28),0_14px_24px_-18px_rgb(25_231_110/0.4)]"
              >
                <span className="flex shrink-0 -space-x-2">
                  {s.marks.map((m) => (
                    <span
                      key={m}
                      className="grid size-10 place-items-center rounded-full bg-[#f6f5f1] shadow-[0_0_0_2px_#fff]"
                    >
                      {m === "link" ? (
                        <Link2
                          className="size-[1.15rem] text-ink/70"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Mark name={m} className="size-[1.15rem]" />
                      )}
                    </span>
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1rem] leading-tight font-medium tracking-[-0.015em] text-ink">
                    {s.name}
                  </span>
                  <span className="mt-1 block text-[0.86rem] leading-snug text-ink/55">
                    {s.note}
                  </span>
                </span>
                <Tick className="size-6 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A card's head: its logo and its name, large. */
function Head({ name, logo }: { name: string; logo: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      {logo}
      <h3 className="text-[1.5rem] leading-none font-semibold tracking-[-0.035em] text-ink">
        {name}
      </h3>
    </div>
  );
}
