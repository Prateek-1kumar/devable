"use client";

import { Label, useInView } from "../kit";
import { CANVAS, SHEET, Tick, delay, rise } from "../parts";
import { SHIPPED, type Shipped as Article } from "./content";

// The homepage case-study language: each article is an off-white card holding two white tiles. The top tile
// is a small designed cover on the How We Work canvas that hints at the format (a PDF bundle splitting into
// classified docs, a parsed ID with verified fields, OCR evolving into agentic extraction); the bottom tile
// is the real article: client, type, title, summary, link out. Data-driven: a new entry is a new card.
// Cards rise in once, staggered; nothing idles.
const CARD = "flex flex-col gap-2 rounded-3xl bg-[#f6f5f1] p-2";
const TILE = "rounded-xl bg-white shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_6px_18px_-10px_rgb(23_44_33_/_0.1)]";
// One dot colour per format, from the panel kit's data palette.
const DOT: Record<Article["type"], string> = { guide: "#1f9e8f", "use-case": "#3e6fd8", thought: "#7a5af5" };

export default function Shipped() {
  const [ref, seen] = useInView<HTMLUListElement>(0.2);
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-24 px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{SHIPPED.label}</Label>
        <h2 id="work-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {SHIPPED.title}
        </h2>
        <ul ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHIPPED.articles.map((a, i) => {
            const Cover = COVERS[a.type];
            return (
              <li key={a.href} style={delay(i * 150)} className={`${CARD} ${rise(seen)}`}>
                <div aria-hidden="true" className={`${TILE} ${CANVAS} flex h-48 items-center justify-center overflow-hidden px-4`}>
                  <Cover />
                </div>
                <article className={`${TILE} flex flex-1 flex-col p-6`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
                  <img src={a.logo} alt={a.client} className="h-5 w-fit max-w-[9rem] object-contain object-left" />
                  <p className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f4f2eb] px-2.5 py-1 text-[0.75rem] font-medium tracking-[-0.005em] text-ink">
                    <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: DOT[a.type] }} />
                    {a.typeLabel}
                  </p>
                  <h3 className="mt-4 text-[clamp(1.15rem,1.4vw,1.3rem)] leading-[1.25] font-normal tracking-[-0.02em] text-ink">{a.title}</h3>
                  <p className="mt-3 text-[0.88rem] leading-[1.6] text-ink/65">{a.body}</p>
                  <a
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-auto inline-flex w-fit items-center gap-2 pt-6 text-[0.88rem] font-medium text-ink"
                  >
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]">
                      Read the article
                    </span>
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const lines = (widths: number[], tone = "bg-ink/12") =>
  widths.map((w, i) => <span key={i} style={{ width: `${w}%` }} className={`block h-[3px] rounded-full ${tone}`} />);

/** Guide: one bundled PDF split into three classified documents. */
function SplitCover() {
  const docs = [
    { label: "Invoice", tone: "bg-[#1f9e8f]" },
    { label: "ID", tone: "bg-[#3e6fd8]" },
    { label: "Contract", tone: "bg-[#7a5af5]" },
  ];
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-[4.5rem]">
        <span className={`${SHEET} absolute inset-0 translate-x-2 -translate-y-2 opacity-60`} />
        <span className={`${SHEET} absolute inset-0 translate-x-1 -translate-y-1 opacity-80`} />
        <span className={`${SHEET} absolute inset-0 flex flex-col gap-1.5 p-2.5`}>
          <span className="font-mono text-[9px] text-ink/55">bundle.pdf</span>
          {lines([90, 70, 80, 55])}
        </span>
      </div>
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-ink/35" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      <div className="flex flex-col gap-1.5">
        {docs.map((d) => (
          <span key={d.label} className={`${SHEET} flex w-[7.5rem] items-center gap-2 rounded-[9px] px-2.5 py-1.5`}>
            <span className={`size-1.5 shrink-0 rounded-full ${d.tone}`} />
            <span className="text-[10.5px] text-ink">{d.label}</span>
            <span className="ml-auto flex w-7 flex-col gap-[3px]">{lines([100, 60])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Use case: an ID document, parsed into verified fields. */
function KycCover() {
  const fields = ["Name", "Date of birth", "ID number"];
  return (
    <div className={`${SHEET} w-[14.5rem] p-3`}>
      <div className="flex gap-2.5 border-b border-line pb-2.5">
        <span className="h-9 w-7 shrink-0 rounded-[4px] bg-ink/[0.07]" />
        <span className="flex flex-1 flex-col justify-center gap-1.5">{lines([80, 55, 65])}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {fields.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="w-[4.5rem] text-[10px] text-ink/50">{f}</span>
            <span className="flex-1">{lines([75], "bg-ink/20")}</span>
            <Tick className="size-3.5" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Thought leadership: OCR to layout-aware to agentic, the last step in focus. */
function EvolutionCover() {
  const steps = ["OCR", "Layout-aware", "Agentic"];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center">
          {i > 0 && <span className="h-px w-4 bg-ink/20 sm:w-5" />}
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] whitespace-nowrap ${
              i === steps.length - 1 ? "bg-ink text-white shadow-[0_6px_16px_-8px_rgb(15_26_20/0.5)]" : `${SHEET} rounded-full! text-ink/55`
            }`}
          >
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

const COVERS: Record<Article["type"], () => React.JSX.Element> = { guide: SplitCover, "use-case": KycCover, thought: EvolutionCover };
