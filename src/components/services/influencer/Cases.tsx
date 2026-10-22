import { Label } from "../kit";
import { CASES, type Case } from "./content";

// Case studies, led by their numbers: each card puts the outcome headline and the story on the left and a
// column of stat rows on the right (big number left, label right), with the client's quote under the story.
export default function Cases() {
  return (
    <section id="case-studies" aria-labelledby="cases-title" className="scroll-mt-24 px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{CASES.label}</Label>
        <h2 id="cases-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {CASES.title}
        </h2>
        <div className="mt-14 space-y-5">
          {CASES.cases.map((c) => (
            <CaseCard key={c.client} study={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseCard({ study }: { study: Case }) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[minmax(0,1fr)_minmax(19rem,26rem)]">
      <div className="flex flex-col p-7 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
          <img src={study.logo} alt={study.client} className="h-6 w-auto max-w-[9rem] object-contain object-left" />
          <span className="font-mono text-[0.66rem] tracking-[0.12em] text-muted uppercase">Case study</span>
        </div>
        <h3 className="mt-8 max-w-[24ch] text-[clamp(1.4rem,2.1vw,1.9rem)] leading-[1.15] font-medium tracking-[-0.035em] text-ink">
          {study.outcome}
        </h3>
        <p className="mt-4 max-w-[34rem] text-[1rem] leading-relaxed text-ink/65">{study.summary}</p>
        {study.quote && (
          <blockquote className="mt-8 max-w-[34rem] border-l-2 border-primary pl-5">
            <p className="text-[1.05rem] leading-relaxed text-ink/85">“{study.quote.text}”</p>
            <footer className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] text-muted uppercase">{study.quote.by}</footer>
          </blockquote>
        )}
        <a href={study.href} className="group mt-auto inline-flex w-fit items-center gap-2 pt-9 text-[0.92rem] font-medium text-ink">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
            Read the case study
          </span>
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </a>
      </div>

      {/* Each stat as a row: the number left, its label right on the same baseline, so the panel fills. */}
      <dl className="grid divide-y divide-line border-t border-line bg-[#f9f8f4] lg:border-t-0 lg:border-l">
        {study.stats.map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-6 px-7 py-6 sm:px-9 lg:items-center lg:py-0">
            <dt className="order-last max-w-[9rem] text-right text-[0.85rem] leading-snug text-ink/55">{s.label}</dt>
            <dd className="text-[clamp(2rem,3.2vw,2.9rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
