import { Label } from "../kit";
import { Mark, SHEET } from "../parts";
import { CASES } from "./content";

// The homepage case-study language, as on the Search page: each client is an off-white card holding white
// tiles (story, then the thread). Only the client and services are real so far; the result, description and
// thread screenshot are visible placeholder slots (flagged Sample) until each case study is finalized.
const CARD = "flex flex-col gap-2 rounded-3xl bg-[#f6f5f1] p-2";
const TILE = "rounded-xl bg-white p-6 shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_6px_18px_-10px_rgb(23_44_33_/_0.1)]";
const DOT: Record<string, string> = { Reddit: "bg-[#ff4500]", "Search & AI Visibility": "bg-[#14b85a]", "Creator Distribution": "bg-[#7a5af5]" };

export default function Cases() {
  return (
    <section id="case-studies" aria-labelledby="cases-title" className="scroll-mt-24 px-6 pb-20 sm:px-12 lg:pb-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{CASES.label}</Label>
        <h2 id="cases-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {CASES.title}
        </h2>
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {CASES.cases.map((c) => (
            <li key={c.client} className={CARD}>
              <div className={`${TILE} flex flex-1 flex-col`}>
                <div className="flex h-6 items-center">
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- static logo
                    <img src={c.logo} alt={c.client} className="h-5 w-auto max-w-[9rem] object-contain object-left" />
                  ) : (
                    <span className="text-[1.35rem] leading-none font-semibold tracking-[-0.04em] text-ink">{c.client.toLowerCase()}</span>
                  )}
                </div>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Services">
                  {c.services.map((s) => (
                    <li key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2eb] px-2.5 py-1 text-[0.75rem] font-medium tracking-[-0.005em] text-ink">
                      <span aria-hidden="true" className={`size-1.5 rounded-full ${DOT[s] ?? "bg-ink/40"}`} />
                      {s}
                    </li>
                  ))}
                </ul>
                <Slot className="mt-5 text-[1.2rem] leading-snug font-normal tracking-[-0.025em]">{CASES.slots.result}</Slot>
                <Slot className="mt-3 text-[0.88rem] leading-[1.6]">{CASES.slots.summary}</Slot>
                <a href={c.href} className="group mt-auto inline-flex w-fit items-center gap-2 pt-6 text-[0.88rem] font-medium text-ink">
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
                    View case study
                  </span>
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              </div>

              {/* SAMPLE: where the real thread screenshot goes; a skeleton thread, not invented content. */}
              <div className={`${TILE} bg-[#f4f6f4]! p-4!`}>
                <div aria-hidden="true" className={`${SHEET} p-3.5`}>
                  <p className="flex items-center gap-2">
                    <Mark name="reddit" className="size-3.5" />
                    <span className="h-1.5 w-16 rounded-full bg-ink/15" />
                  </p>
                  <span className="mt-3 block h-2 w-[85%] rounded-full bg-ink/20" />
                  {[72, 58].map((w) => (
                    <span key={w} className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
                      <span className="flex flex-col items-center gap-0.5 text-ink/25">
                        <svg viewBox="0 0 10 6" className="h-1.5 w-2.5">
                          <path d="M1 5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span className="h-1 w-3 rounded-full bg-ink/15" />
                      </span>
                      <span className="h-1.5 rounded-full bg-ink/12" style={{ width: `${w}%` }} />
                    </span>
                  ))}
                </div>
                <Slot className="mt-3 text-[0.8rem] leading-snug">{CASES.slots.thread}</Slot>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// SAMPLE: a placeholder slot, greyed and flagged so it can't be mistaken for a real result.
function Slot({ children, className }: { children: string; className: string }) {
  return (
    <p className={`text-ink/35 ${className}`}>
      <span className="mr-2 inline-block rounded-full bg-[color-mix(in_srgb,var(--accent)_9%,white)] px-2 py-0.5 align-middle text-[0.68rem] font-medium tracking-normal text-[color-mix(in_srgb,var(--accent)_85%,var(--ink))]">
        Sample
      </span>
      {children}
    </p>
  );
}
