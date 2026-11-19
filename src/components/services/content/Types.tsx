"use client";

import type { ReactNode } from "react";
import { Label, useInView } from "../kit";
import { Mark } from "../parts";
import { TYPES } from "./content";

// The six formats as one board, all visible at once. Each column has a mono label strip with its number, a dashed
// rule, a small scene, another dashed rule, then the name and one line. Each scene is the format itself, shot like a
// film still: fine ink-line frames holding real developer UI, set in 3D perspective with depth (a focal piece, a
// second piece floating in front or softened behind, soft key shadows and a ground shadow). Hovering a column tints
// it green, eases the camera round to face the scene, and plays one small gesture:
//   Technical Articles   an article about a real problem; its key line of code lights up
//   Tutorials & Guides   a step list beside a terminal; the current step ticks and the command returns
//   Product-Led Content  a guide that teaches chunking; its import of your product lights and is called out
//   Comparisons          your product against an alternative, line by line; your column glows
//   Integration Content  your product plugged into the frameworks developers use; the connections run
//   Thought Leadership   an essay with a byline and a pull quote; its reach line draws upward
// The cards rise in once, as they scroll into view. Reduced motion: no camera move, no gestures.

export default function Types() {
  const [ref, seen] = useInView<HTMLUListElement>(0.12);
  const scenes = [Article, Tutorial, ProductLed, Comparison, Integration, Thought];
  return (
    <section aria-labelledby="types-title" className="px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{TYPES.label}</Label>
        <h2 id="types-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {TYPES.title}
        </h2>

        <ul ref={ref} className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {TYPES.types.map((t, i) => {
            const Scene = scenes[i];
            return (
              <li
                key={t.name}
                className={`group flex flex-col bg-[#f9f8f4] transition-[background-color,box-shadow] duration-500 hover:bg-[#f0fbf4] hover:shadow-[inset_0_0_0_1px_rgb(25_231_110/0.45)] ${seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0"}`}
                style={{ animationDelay: `${(i % 3) * 0.08 + Math.floor(i / 3) * 0.12}s` }}
              >
                <div className="flex items-center justify-between border-b border-dashed border-ink/15 px-6 py-4 font-mono text-[0.7rem] tracking-[0.06em] text-ink/80 uppercase">
                  <span className="flex items-center gap-2.5">
                    <span className="size-[7px] bg-primary transition-transform duration-500 group-hover:scale-125" />
                    {t.tag}
                  </span>
                  <span className="text-ink/45">[{String(i + 1).padStart(2, "0")}]</span>
                </div>
                <div aria-hidden="true" className="relative grid h-60 place-items-center overflow-hidden border-b border-dashed border-ink/15">
                  {["top-4 left-5", "top-4 right-5", "bottom-4 left-5", "bottom-4 right-5"].map((c) => (
                    <span key={c} className={`absolute font-mono text-[0.85rem] leading-none text-ink/35 ${c}`}>
                      +
                    </span>
                  ))}
                  <Scene />
                </div>
                <div className="flex-1 p-6 pb-8">
                  <h3 className="text-[1.45rem] leading-[1.1] font-medium tracking-[-0.035em] text-ink">{t.name}</h3>
                  <p className="mt-3 max-w-[22rem] text-[0.98rem] leading-relaxed text-ink/60">{t.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ── The scene kit ─────────────────────────────────────────────────────────────────────────────────────────────

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const MONO = "font-mono";
/** A drawn frame: an ink hairline on white, lit from above, with a soft key shadow. */
const FRAME =
  "absolute rounded-[10px] border-[1.4px] border-ink bg-[linear-gradient(170deg,#ffffff_0%,#fbfbf8_100%)] shadow-[inset_0_1px_0_#fff,0_2px_3px_rgb(23_44_33/0.08),0_22px_34px_-20px_rgb(23_44_33/0.5)]";
/** A muted text bar. */
const Bar = ({ w, o = 0.14 }: { w: string; o?: number }) => <span className="block h-[5px] rounded-full bg-ink" style={{ width: w, opacity: o }} />;

/**
 * The stage: a camera angle on the scene. The pieces live in 3D (each `Depth` at its own z); a ground shadow sits
 * under them. On hover the camera eases round toward face-on.
 */
function Stage({ children, tilt = "rotateX(16deg) rotateY(-18deg) rotateZ(3deg)" }: { children: ReactNode; tilt?: string }) {
  return (
    <div className="relative h-[12.75rem] w-[19rem] max-w-[86%] [perspective:1000px]">
      <span className="absolute inset-x-6 -bottom-1 h-8 rounded-[50%] bg-[rgb(23_44_33/0.22)] blur-xl" />
      <div
        className={`absolute inset-0 [transform-style:preserve-3d] transition-transform duration-[1100ms] ${EASE} group-hover:[transform:rotateX(7deg)_rotateY(-7deg)_rotateZ(0.5deg)] motion-reduce:transition-none motion-reduce:group-hover:[transform:none]`}
        style={{ transform: tilt }}
      >
        {children}
      </div>
    </div>
  );
}

/** A piece of the scene, lifted `z` px toward the camera. */
const Depth = ({ z, className = "", children }: { z: number; className?: string; children: ReactNode }) => (
  <div className={`absolute inset-0 [transform-style:preserve-3d] ${className}`} style={{ transform: `translateZ(${z}px)` }}>
    {children}
  </div>
);

/** A line of code: a muted line number, then tokens. */
function Code({ n, children, className = "" }: { n: number; children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2 px-2 leading-[1.75] whitespace-nowrap ${className}`}>
      <span className="w-2 text-right text-ink/30">{n}</span>
      <span>{children}</span>
    </p>
  );
}
const K = ({ children }: { children: ReactNode }) => <span className="text-[#7c4dbd]">{children}</span>; // keyword
const F = ({ children }: { children: ReactNode }) => <span className="text-[#12894b]">{children}</span>; // function
const S = ({ children }: { children: ReactNode }) => <span className="text-[#a15c00]">{children}</span>; // string

/** Technical Articles: an article about a problem developers actually have; on hover its key line lights up. */
function Article() {
  return (
    <Stage>
      {/* A second article, softened behind. */}
      <Depth z={-40}>
        <div className={`${FRAME} top-0 right-0 h-[70%] w-[62%] opacity-50 blur-[0.6px]`}>
          <div className="space-y-1.5 p-3 pt-4">
            <Bar w="70%" o={0.3} />
            <Bar w="90%" />
            <Bar w="80%" />
          </div>
        </div>
      </Depth>
      <Depth z={0}>
        <div className={`${FRAME} top-3 bottom-1 left-0 w-[86%] p-3.5`}>
          <p className="flex items-center gap-1.5 text-[0.56rem] text-ink/45">
            <span className={`${MONO} rounded-[3px] bg-light-green-soft px-1 py-px font-semibold tracking-[0.06em] text-[#1a7f47]`}>DEBUGGING</span>
            8 min read
          </p>
          <p className="mt-1.5 text-[0.92rem] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">Why your RAG pipeline loses its tables</p>
          <div className="mt-2 space-y-1">
            <Bar w="96%" />
            <Bar w="78%" />
          </div>
          <div className={`${MONO} mt-2.5 overflow-hidden rounded-md border border-ink/15 bg-[#f6f7f4] py-1 text-[0.56rem] text-ink`}>
            <Code n={1}>
              doc = <F>parse</F>(<S>&quot;report.pdf&quot;</S>)
            </Code>
            <Code
              n={2}
              className={`bg-[linear-gradient(rgb(25_231_110/0.22),rgb(25_231_110/0.22))] bg-no-repeat [background-size:0%_100%] transition-[background-size] duration-700 ${EASE} group-hover:[background-size:100%_100%]`}
            >
              rows = doc.<F>tables</F>[<K>0</K>].<F>to_markdown</F>()
            </Code>
          </div>
          <div className="mt-2.5 space-y-1">
            <Bar w="92%" />
            <Bar w="64%" />
          </div>
        </div>
      </Depth>
    </Stage>
  );
}

/** Tutorials & Developer Guides: a step list beside a terminal; on hover the current step ticks and the command returns. */
function Tutorial() {
  const steps = ["Install the SDK", "Add your API key", "Query your docs", "Deploy"];
  return (
    <Stage>
      <Depth z={0}>
        <div className={`${FRAME} top-0 left-0 w-[64%] p-3`}>
          <p className="text-[0.78rem] leading-tight font-semibold tracking-[-0.02em] text-ink">Build a RAG app</p>
          <p className={`${MONO} mt-0.5 text-[0.5rem] text-ink/45`}>Step 3 of 4</p>
          <ol className="mt-2 space-y-1.5">
            {steps.map((st, i) => {
              const done = i < 2;
              const current = i === 2;
              return (
                <li key={st} className={`flex items-center gap-1.5 text-[0.62rem] ${current ? "font-medium text-ink" : done ? "text-ink/60" : "text-ink/35"}`}>
                  <span
                    className={`relative grid size-3.5 shrink-0 place-items-center rounded-full border text-[0.45rem] font-bold ${done ? "border-ink bg-primary text-ink" : current ? "border-ink bg-white text-ink transition-colors duration-500 group-hover:bg-primary" : "border-ink/30 text-ink/40"}`}
                  >
                    {done ? "✓" : current ? <span className="transition-opacity duration-300 group-hover:opacity-0">3</span> : i + 1}
                    {current && <span className="absolute opacity-0 transition-opacity delay-200 duration-300 group-hover:opacity-100">✓</span>}
                  </span>
                  {st}
                </li>
              );
            })}
          </ol>
        </div>
      </Depth>
      {/* The terminal, floating in front. */}
      <Depth z={46}>
        <div className={`${FRAME} right-0 bottom-1 w-[60%] overflow-hidden border-ink bg-ink bg-none`}>
          <div className="flex h-4 items-center gap-1 border-b border-white/10 px-2">
            {[0, 1, 2].map((k) => (
              <span key={k} className="size-[5px] rounded-full bg-white/30" />
            ))}
          </div>
          <div className={`${MONO} space-y-0.5 p-2 text-[0.55rem] leading-snug text-white/85`}>
            <p>
              <span className="text-primary">$</span> npm i your-sdk
            </p>
            <p className="text-white/45">+ your-sdk@2.4.0</p>
            <p>
              <span className="text-primary">$</span> node query.js
            </p>
            <p className={`text-primary transition-[opacity,translate] duration-500 ${EASE} translate-y-0.5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100`}>✓ 3 answers, 412ms</p>
          </div>
        </div>
      </Depth>
    </Stage>
  );
}

/** Product-Led Content: a guide that teaches something useful (chunking long PDFs); your product is in its code,
 *  and on hover that import lights and a callout names it. */
function ProductLed() {
  return (
    <Stage tilt="rotateX(16deg) rotateY(18deg) rotateZ(-3deg)">
      <Depth z={0}>
        <div className={`${FRAME} top-2 right-0 bottom-0 w-[88%] p-3.5`}>
          <p className={`${MONO} text-[0.5rem] text-ink/45`}>Guides / Long documents</p>
          <p className="mt-1 text-[0.88rem] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">Chunking strategies for 500-page PDFs</p>
          <div className="mt-2 space-y-1">
            <Bar w="94%" />
            <Bar w="70%" />
          </div>
          <div className={`${MONO} mt-2.5 rounded-md border border-ink/15 bg-[#f6f7f4] py-1 text-[0.56rem] text-ink`}>
            <Code n={1}>
              <K>import</K> {"{ chunk }"} <K>from</K>{" "}
              <span className="rounded-[3px] px-0.5 transition-[background-color,box-shadow] duration-500 group-hover:bg-[rgb(25_231_110/0.28)] group-hover:shadow-[inset_0_0_0_1px_rgb(25_150_80/0.5)]">
                <S>&quot;your-product&quot;</S>
              </span>
            </Code>
            <Code n={2}>
              parts = <F>chunk</F>(doc, size=<K>800</K>)
            </Code>
          </div>
          <div className="mt-2.5 space-y-1">
            <Bar w="90%" />
            <Bar w="58%" />
          </div>
        </div>
      </Depth>
      {/* The callout, in front. */}
      <Depth z={40}>
        <span
          className={`absolute top-[46%] -left-1 flex items-center gap-1.5 rounded-full border-[1.4px] border-ink bg-white py-1 pr-2.5 pl-1.5 text-[0.62rem] font-medium text-ink shadow-[0_14px_22px_-14px_rgb(23_44_33/0.55)] transition-[translate,box-shadow] duration-700 ${EASE} group-hover:-translate-y-1`}
        >
          <span className="grid size-4 place-items-center rounded-full bg-primary text-[0.5rem] font-bold text-ink">Y</span>
          Your Product
        </span>
      </Depth>
    </Stage>
  );
}

/** Comparisons & Alternatives: your product against an alternative, feature by feature; on hover your column glows. */
function Comparison() {
  const rows: [string, string, string][] = [
    ["Table parsing", "✓", "✕"],
    ["Self-hosted", "✓", "✕"],
    ["Streaming", "✓", "✓"],
    ["Per 1K pages", "$4", "$12"],
  ];
  return (
    <Stage>
      <Depth z={0}>
        <div className={`${FRAME} inset-x-0 top-2 bottom-1 overflow-hidden`}>
          <div className="grid grid-cols-[1.25fr_1fr_1fr] border-b border-ink/15 text-[0.6rem] font-semibold text-ink">
            <span className="px-2.5 py-2 text-ink/40">Feature</span>
            <span className="flex items-center gap-1 bg-[rgb(25_231_110/0.12)] px-2 py-2">
              <span className="size-1.5 rounded-full bg-primary" />
              Your Product
            </span>
            <span className="px-2 py-2 text-ink/55">Alternative</span>
          </div>
          {rows.map(([f, a, b]) => (
            <div key={f} className="grid grid-cols-[1.25fr_1fr_1fr] border-b border-ink/[0.07] text-[0.6rem] last:border-0">
              <span className="px-2.5 py-[0.42rem] text-ink/65">{f}</span>
              <span className={`bg-[rgb(25_231_110/0.12)] px-2 py-[0.42rem] font-semibold text-[#13804a] transition-colors duration-500 group-hover:bg-[rgb(25_231_110/0.24)]`}>{a}</span>
              <span className={`px-2 py-[0.42rem] ${b === "✕" ? "text-[#c2410c]" : "text-ink/55"}`}>{b}</span>
            </div>
          ))}
        </div>
      </Depth>
      {/* The verdict, in front. */}
      <Depth z={44}>
        <span className={`absolute right-3 bottom-4 flex items-center gap-1 rounded-full border-[1.4px] border-ink bg-primary px-2 py-0.5 text-[0.56rem] font-semibold text-ink shadow-[0_14px_22px_-14px_rgb(23_44_33/0.55)] transition-[translate] duration-700 ${EASE} group-hover:-translate-y-1`}>
          Best for RAG
        </span>
      </Depth>
    </Stage>
  );
}

/** Integration Content: your product plugged into the frameworks developers already use, with the install line;
 *  on hover the connections start to run. */
function Integration() {
  const around = [
    { mark: "langchain" as const, x: 14, y: 16 },
    { mark: "python" as const, x: 14, y: 50 },
    { mark: "typescript" as const, x: 14, y: 84 },
    { mark: "vercel" as const, x: 86, y: 16 },
    { mark: "huggingface" as const, x: 86, y: 50 },
    { mark: "docker" as const, x: 86, y: 84 },
  ];
  return (
    <Stage tilt="rotateX(18deg) rotateY(-14deg) rotateZ(2deg)">
      <Depth z={0}>
        <div className={`${FRAME} inset-0 overflow-hidden bg-[radial-gradient(circle,rgb(23_44_33/0.1)_1px,transparent_1.2px)] bg-[length:12px_12px]`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            {around.map((a) => (
              <path
                key={a.mark}
                d={`M${a.x} ${a.y * 0.82} C${(a.x + 50) / 2} ${a.y * 0.82} ${(a.x + 50) / 2} 41 50 41`}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                className="[stroke-dasharray:1_6] group-hover:animate-dash-flow motion-reduce:animate-none"
              />
            ))}
          </svg>
          {around.map((a) => (
            <span key={a.mark} className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border border-ink/20 bg-white shadow-[0_4px_8px_-4px_rgb(23_44_33/0.3)]" style={{ left: `${a.x}%`, top: `${a.y * 0.82}%` }}>
              <Mark name={a.mark} className="size-3.5" />
            </span>
          ))}
          <p className={`${MONO} absolute inset-x-3 bottom-2.5 rounded-md border border-ink/15 bg-white px-2 py-1 text-[0.52rem] whitespace-nowrap text-ink`}>
            <span className="text-[#12894b]">$</span> pip install langchain-yourproduct
          </p>
        </div>
      </Depth>
      {/* Your product, the hub, in front. */}
      <Depth z={42}>
        <span className="absolute top-[41%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-xl border-[1.4px] border-ink bg-white py-1.5 pr-2.5 pl-1.5 text-[0.62rem] font-semibold whitespace-nowrap text-ink shadow-[0_16px_24px_-14px_rgb(23_44_33/0.6)] transition-shadow duration-500 group-hover:shadow-[0_0_0_4px_rgb(25_231_110/0.25),0_16px_24px_-14px_rgb(23_44_33/0.6)]">
          <span className="grid size-5 place-items-center rounded-md bg-primary text-[0.55rem] font-bold text-ink">Y</span>
          Your Product
        </span>
      </Depth>
    </Stage>
  );
}

/** Thought Leadership: an essay with a byline and a pull quote, and how far it travelled; on hover the reach line draws. */
function Thought() {
  return (
    <Stage tilt="rotateX(16deg) rotateY(18deg) rotateZ(-3deg)">
      <Depth z={0}>
        <div className={`${FRAME} top-1 right-0 bottom-1 w-[86%] p-3.5`}>
          <p className={`${MONO} text-[0.5rem] font-semibold tracking-[0.12em] text-[#1a7f47]`}>PERSPECTIVE</p>
          <p className="mt-1 font-heading text-[1rem] leading-[1.1] tracking-[-0.02em] text-ink">The context window was never the bottleneck</p>
          <p className="mt-2 flex items-center gap-1.5 text-[0.55rem] text-ink/50">
            <span className="grid size-4 place-items-center rounded-full bg-ink text-[0.42rem] font-bold text-white">SR</span>
            CTO, Your Product &middot; Nov 2026
          </p>
          <p className="mt-2 border-l-2 border-primary pl-2 text-[0.6rem] leading-snug text-ink/70 italic">&ldquo;Retrieval quality, not model size, decides what ships.&rdquo;</p>
        </div>
      </Depth>
      {/* How far it travelled, in front. */}
      <Depth z={44}>
        <div className="absolute bottom-0 left-0 w-[46%] rounded-lg border-[1.4px] border-ink bg-white p-2 shadow-[0_16px_24px_-14px_rgb(23_44_33/0.6)]">
          <p className="flex items-baseline justify-between text-[0.5rem] text-ink/50">
            Shared
            <b className="text-[0.66rem] font-semibold text-ink">2.1K</b>
          </p>
          <svg viewBox="0 0 80 24" className="mt-1 h-6 w-full overflow-visible">
            <path d="M2 21 L18 18 L32 19 L48 11 L62 9 L78 3" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className={`[stroke-dasharray:1] [stroke-dashoffset:0.55] transition-[stroke-dashoffset] duration-1000 ${EASE} group-hover:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0]`} />
          </svg>
        </div>
      </Depth>
    </Stage>
  );
}
