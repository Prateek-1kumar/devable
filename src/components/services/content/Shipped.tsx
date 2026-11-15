"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Label, useInView } from "../kit";
import { SHEET, Tick, delay, rise } from "../parts";
import { SHIPPED, type Shipped as Article } from "./content";
import { clamp01, io3, seg, useStill } from "./play";

// Three shipped articles for one client, each a white card in the structure of the content team's reference: the client's
// logo and the article's format on the top row, a designed cover on a fine dotted panel that says what the article is
// about before you read a word (a PDF bundle splitting into classified documents, an ID with verified fields, OCR
// evolving into agentic extraction), then the article: title, summary, link out. The covers are drawn large and dark
// enough to read at a glance. Data-driven: a new entry is a new card. Cards rise in once, staggered; hovering lifts one.
const CARD = "group flex flex-col rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgb(23_44_33/0.06),0_1px_2px_rgb(23_44_33/0.04),0_18px_36px_-26px_rgb(23_44_33/0.22)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgb(23_44_33/0.08),0_2px_4px_rgb(23_44_33/0.04),0_28px_46px_-26px_rgb(23_44_33/0.3)] motion-reduce:transition-none";
const PANEL = "bg-[#fbfaf7] bg-[radial-gradient(rgb(23_44_33/0.1)_1px,transparent_1px)] [background-size:14px_14px] shadow-[inset_0_0_0_1px_rgb(23_44_33/0.06)]";
// One dot colour per format, from the panel kit's data palette.
const DOT: Record<Article["type"], string> = { guide: "#1f9e8f", "use-case": "#3e6fd8", thought: "#7a5af5" };

export default function Shipped() {
  const [ref, seen] = useInView<HTMLUListElement>(0.2);
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-24 px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <div>
            <Label>{SHIPPED.label}</Label>
            <h2 id="work-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
              {SHIPPED.title}
            </h2>
          </div>
          <p className="max-w-[28rem] text-[1rem] leading-relaxed text-ink/65 lg:border-l lg:border-ink/15 lg:pl-8">{SHIPPED.body}</p>
        </div>
        <ul ref={ref} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHIPPED.articles.map((a, i) => {
            const Cover = COVERS[a.type];
            return (
              <li key={a.href} style={delay(i * 150)} className={`${CARD} ${rise(seen)}`}>
                <div className="flex items-center justify-between gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
                  <img src={a.logo} alt={a.client} className="h-5 w-fit max-w-[9rem] object-contain object-left" />
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2eb] px-2.5 py-1 text-[0.75rem] font-medium tracking-[-0.005em] text-ink">
                    <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: DOT[a.type] }} />
                    {a.typeLabel}
                  </p>
                </div>
                <div aria-hidden="true" className={`${PANEL} mt-4 flex h-52 items-center justify-center overflow-hidden rounded-xl px-4`}>
                  <Cover />
                </div>
                <article className="flex flex-1 flex-col pt-6">
                  <h3 className="text-[clamp(1.2rem,1.5vw,1.4rem)] leading-[1.22] font-medium tracking-[-0.025em] text-ink">{a.title}</h3>
                  <p className="mt-3 text-[0.92rem] leading-[1.6] text-ink/65">{a.body}</p>
                  <a
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-[0.9rem] font-medium text-ink"
                  >
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px]">
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

// ── The covers ───────────────────────────────────────────────────────────────────────────────────────────────
// Each one tells its article as a short, calm sequence on a loop while it is on screen (the three out of step), with a
// long hold on the finished picture; reduced motion shows that picture. Each is drawn on a 280 × 170 stage.
const CYCLE = 9; // seconds
const HOLD = 6.2; // the finished picture, as a time in the cycle
const reset = (t: number) => 1 - seg(t, 8.2, 8.9); // everything cools back to the start before the loop begins again
const GREEN = "#19e76e";

/** One card's clock: seconds into its cycle, running only while it is on screen, offset so the three are out of step. */
function useClock(offset: number) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useStill();
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    let raf = 0;
    let origin = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    const tick = (now: number) => {
      origin ||= now;
      if (visible) setT(((now - origin) / 1000 + offset) % CYCLE);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [still, offset]);
  return { ref, t: still ? HOLD : t };
}

function Stage({ offset, children }: { offset: number; children: (t: number) => ReactNode }) {
  const { ref, t } = useClock(offset);
  return (
    <div ref={ref} className="relative h-[170px] w-[280px] shrink-0">
      {children(t)}
    </div>
  );
}

const lines = (widths: number[], tone = "bg-ink/22") =>
  widths.map((w, i) => <span key={i} style={{ width: `${w}%` }} className={`block h-[4px] rounded-full ${tone}`} />);
const mix = (a: string, b: string, k: number) => `color-mix(in srgb, ${a} ${Math.round(clamp01(k) * 100)}%, ${b})`;

/** Guide: a scan runs down the bundle, then its pages peel away one by one into Invoice, ID and Contract, each lighting as it lands. */
function SplitCover() {
  const docs = [
    { label: "Invoice", tone: "#1f9e8f" },
    { label: "ID", tone: "#3e6fd8" },
    { label: "Contract", tone: "#7a5af5" },
  ];
  const tops = [20, 67, 114];
  return (
    <Stage offset={0}>
      {(t) => {
        const rs = reset(t);
        const intro = seg(t, 0, 0.7);
        const scan = seg(t, 0.8, 2.1, io3);
        const beam = Math.sin(Math.PI * clamp01((t - 0.8) / 1.3));
        return (
          <>
            <div className="absolute top-[29px] left-0 h-[112px] w-[86px]" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 8}px)` }}>
              <span className={`${SHEET} absolute inset-0 translate-x-2 -translate-y-2 opacity-60`} />
              <span className={`${SHEET} absolute inset-0 translate-x-1 -translate-y-1 opacity-80`} />
              <span className={`${SHEET} absolute inset-0 flex flex-col gap-1.5 overflow-hidden p-2.5`}>
                <span className="font-mono text-[11px] text-ink/70">bundle.pdf</span>
                {lines([90, 70, 80, 55])}
                <span aria-hidden="true" className="absolute inset-x-0 h-6 -translate-y-1/2" style={{ top: `${scan * 100}%`, opacity: beam, background: `linear-gradient(180deg, transparent, rgb(25 231 110 / 0.4), transparent)` }} />
              </span>
            </div>
            <svg viewBox="0 0 24 24" className="absolute top-[78px] left-[98px] size-[1.15rem] text-ink/45" style={{ opacity: intro }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            {docs.map((d, i) => {
              const lit = seg(t, 3.0 + 0.6 * i, 3.45 + 0.6 * i) * rs;
              const fly = seg(t, 2.2 + 0.6 * i, 3.1 + 0.6 * i, io3);
              return (
                <div key={d.label}>
                  <span
                    className={`${SHEET} absolute left-[138px] flex h-9 w-[142px] items-center gap-2.5 rounded-[10px] px-3.5`}
                    style={{ top: tops[i], opacity: 0.35 + 0.65 * intro, boxShadow: `0 1px 1.6px rgb(15 26 20 / 0.04), 0 8px 24px rgb(15 26 20 / 0.06)${lit ? `, 0 0 0 1px ${mix(d.tone, "transparent", 0.5 * lit)}` : ""}` }}
                  >
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: d.tone, boxShadow: `0 0 0 ${3 * lit}px ${mix(d.tone, "transparent", 0.2)}` }} />
                    <span className="text-[12.5px] font-medium text-ink">{d.label}</span>
                    <span className="ml-auto flex w-8 flex-col gap-[3px]" style={{ opacity: 1 - lit }}>
                      {lines([100, 60])}
                    </span>
                    <span className="absolute inset-y-0 right-2.5 grid place-items-center" style={{ opacity: lit, transform: `scale(${0.6 + 0.4 * lit})` }}>
                      <Tick className="size-4" />
                    </span>
                  </span>
                  {/* the page that peels off the bundle and drops into its place */}
                  <span
                    aria-hidden="true"
                    className={`${SHEET} absolute top-0 left-0 block h-7 w-[22px] rounded-md p-1`}
                    style={{ opacity: seg(fly, 0, 0.15) * (1 - seg(fly, 0.82, 1)), transform: `translate(${62 + (150 - 62) * fly}px, ${85 - 14 + (tops[i] + 18 - 85) * fly}px) rotate(${(1 - fly) * -6}deg) scale(${1 - 0.3 * fly})` }}
                  >
                    <span className="flex flex-col gap-[3px]">{lines([100, 70, 85], "bg-ink/25")}</span>
                  </span>
                </div>
              );
            })}
          </>
        );
      }}
    </Stage>
  );
}

/** Use case: a beam reads down an ID card and each field fills in and is ticked as it passes. */
function KycCover() {
  const fields = ["Name", "Date of birth", "ID number"];
  const rowTop = [88, 117, 146]; // px, the centre of each field row
  return (
    <Stage offset={1.4}>
      {(t) => {
        const rs = reset(t);
        const intro = seg(t, 0, 0.7);
        const beamAt = seg(t, 1.0, 4.0, io3); // 0 → 1 down the card
        const beamOn = Math.sin(Math.PI * clamp01((t - 1.0) / 3.0));
        return (
          <div className={`${SHEET} absolute inset-x-[8px] top-[8px] bottom-[8px] overflow-hidden p-3.5`} style={{ opacity: intro, transform: `translateY(${(1 - intro) * 8}px)` }}>
            <div className="flex gap-2.5 border-b border-line pb-2.5">
              <span className="h-11 w-9 shrink-0 rounded-[5px] bg-ink/[0.1]" />
              <span className="flex flex-1 flex-col justify-center gap-1.5">{lines([80, 55, 65])}</span>
            </div>
            <ul className="mt-2.5 space-y-2">
              {fields.map((f, i) => {
                const read = seg(t, 1.0 + 3.0 * ((rowTop[i] - 8) / 154) - 0.25, 1.0 + 3.0 * ((rowTop[i] - 8) / 154) + 0.5) * rs;
                const tick = seg(t, 1.0 + 3.0 * ((rowTop[i] - 8) / 154) + 0.35, 1.0 + 3.0 * ((rowTop[i] - 8) / 154) + 0.75, (v) => 1 - (1 - v) ** 3 * Math.cos(v * 6)) * rs;
                return (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-[5.4rem] text-[11.5px] text-ink/70">{f}</span>
                    <span className="relative block h-[4px] flex-1 rounded-full bg-ink/10">
                      <span className="absolute inset-y-0 left-0 w-[75%] origin-left rounded-full bg-ink/35" style={{ transform: `scaleX(${read})` }} />
                    </span>
                    <span className="grid size-4 place-items-center" style={{ opacity: clamp01(tick), transform: `scale(${0.5 + 0.5 * tick})` }}>
                      <Tick className="size-4" />
                    </span>
                  </li>
                );
              })}
            </ul>
            <span aria-hidden="true" className="absolute inset-x-0 h-9 -translate-y-1/2" style={{ top: `${beamAt * 100}%`, opacity: beamOn * (1 - seg(t, 8.2, 8.7)), background: "linear-gradient(180deg, transparent, rgb(25 231 110 / 0.28), transparent)" }} />
            <span aria-hidden="true" className="absolute inset-x-0 h-px -translate-y-1/2" style={{ top: `${beamAt * 100}%`, opacity: beamOn * (1 - seg(t, 8.2, 8.7)), background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }} />
          </div>
        );
      }}
    </Stage>
  );
}

/** Thought leadership: OCR, then layout-aware, then agentic; a green light runs along each link, each step takes on its tick as it is reached, and the last fills in dark. */
function EvolutionCover() {
  const steps = ["OCR", "Layout-aware", "Agentic"];
  return (
    <Stage offset={2.8}>
      {(t) => {
        const rs = 1; // the cover fades out as a whole at the end of the loop, so no state is caught half-way
        const intro = seg(t, 0, 0.7);
        const on = [seg(t, 0.7, 1.2), seg(t, 2.2, 2.7), seg(t, 3.7, 4.3)].map((v) => v * rs);
        const link = [seg(t, 1.2, 2.2, io3), seg(t, 2.7, 3.7, io3)].map((v) => v * rs);
        const ring = clamp01((t - 4.3) / 1.4);
        return (
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: intro * (1 - seg(t, 8.4, 8.95)), transform: `translateY(${(1 - intro) * 8}px)` }}>
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                {i > 0 && (
                  <span aria-hidden="true" className="relative mx-0.5 block h-px w-3.5 bg-ink/25">
                    <span className="absolute inset-y-0 left-0 block w-full origin-left" style={{ transform: `scaleX(${link[i - 1]})`, background: GREEN }} />
                  </span>
                )}
                <span className="relative block">
                  {/* a soft green light all round the pill: it swells in as the pill fills, and breathes out once */}
                  {i === 2 && <span aria-hidden="true" className="absolute inset-0 block rounded-full" style={{ opacity: on[2], boxShadow: `0 0 ${14 + 10 * Math.sin(Math.PI * ring)}px ${3 + 3 * Math.sin(Math.PI * ring)}px rgb(25 231 110 / ${0.3 + 0.12 * Math.sin(Math.PI * ring)}), 0 0 36px 6px rgb(25 231 110 / 0.14)` }} />}
                  <span
                    className={`${SHEET} relative flex items-center gap-1.5 rounded-full! px-3 py-2 text-[12px] font-medium whitespace-nowrap`}
                    style={{ color: i === 2 ? (on[2] > 0.5 ? "#ffffff" : "rgb(15 26 20 / 0.7)") : "rgb(15 26 20 / 0.85)", boxShadow: i === 2 && on[2] > 0.5 ? "0 1px 1.6px rgb(15 26 20 / 0.1)" : undefined }}
                  >
                    {i === 2 && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#172c21]" style={{ opacity: on[2] }} />}
                    <span aria-hidden="true" className="relative size-1.5 rounded-full" style={{ background: mix(GREEN, "rgb(15 26 20 / 0.2)", on[i]), boxShadow: `0 0 0 ${2.5 * on[i]}px rgb(25 231 110 / 0.2)` }} />
                    <span className="relative">{s}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        );
      }}
    </Stage>
  );
}

const COVERS: Record<Article["type"], () => React.JSX.Element> = { guide: SplitCover, "use-case": KycCover, thought: EvolutionCover };
