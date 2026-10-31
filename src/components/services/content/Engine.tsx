"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Label } from "../kit";
import { Mark, Tick } from "../parts";
import { ENGINE } from "./content";
import { clamp01, io3 } from "./play";

const { topics, doc, serp, channels } = ENGINE.samples;
const N = ENGINE.parts.length;
const DWELL = 3.6; // s the article rests at each stage
const MOVE = 1.4; // s between stages
const R = 38; // the ring's radius, as a share of the diagram's width
const CORAL = "var(--accent)";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * Where the article is on the loop, as a float 0–4 (stage k at k; 3→4 is the return to stage 0). It rests at each stage,
 * then eases to the next, forever while on screen. `pin(k)` sends it to stage k and holds it there (hover, focus or
 * tap on the list); `unpin()` lets it carry on. Reduced motion jumps straight to the stage and never moves by itself.
 */
function useLoop(on: boolean) {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
  const [pos, setPos] = useState(0);
  const st = useRef({ at: 0, next: -1, u: 0, dwell: DWELL, pin: -1 });

  useEffect(() => {
    if (!on || still) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const s = st.current;
      if (s.next >= 0) {
        s.u += dt / (s.pin >= 0 ? MOVE * 0.7 : MOVE);
        if (s.u >= 1) {
          s.at = s.next;
          s.next = -1;
          s.u = 0;
          s.dwell = DWELL;
        }
      } else if (s.pin >= 0) {
        if (s.pin !== s.at) s.next = (s.at + 1) % N;
      } else {
        s.dwell -= dt;
        if (s.dwell <= 0) s.next = (s.at + 1) % N;
      }
      setPos(s.next >= 0 ? s.at + io3(s.u) : s.at);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, still]);

  const pin = (k: number) => {
    st.current.pin = k;
    if (still) setPos(k);
  };
  const unpin = () => {
    st.current.pin = -1;
    st.current.dwell = 2;
  };
  return { pos, pin, unpin };
}

// The idea is an engine, so the section draws one: four stages on a ring, an article riding round it, and a
// return arc that closes the loop, because each cycle's results shape the next. The card in the middle shows
// what the current stage actually produces (a prioritised topic list, a tested doc, a search result with an AI
// citation, channel results). On the left the four parts as a list, the active one opened; hovering or tapping
// one sends the article there. Phones keep the list and the card and drop the ring.
export default function Engine() {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const { pos, pin, unpin } = useLoop(visible);

  const active = Math.round(pos) % N;
  // How much of each stage's card shows: the loop is circular, so 3.9 is close to stage 0.
  const w = Array.from({ length: N }, (_, k) => {
    const d = Math.abs(pos - k);
    return clamp01(2 - 4 * Math.min(d, N - d)); // one face at a time: the card clears briefly between stages
  });
  const angle = ((-90 + pos * 90) * Math.PI) / 180;
  const tx = 50 + R * Math.cos(angle);
  const ty = 50 + R * Math.sin(angle);
  // The ring's ink arc follows the article from stage 0 to 3; the coral return arc draws on the way home.
  const reset = 1 - clamp01((pos - 3.7) / 0.3);
  const arc = Math.min(pos, 3) / 4;
  const back = clamp01(pos - 3);

  return (
    <section aria-labelledby="engine-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <Label>{ENGINE.label}</Label>
          <h2 id="engine-title" className="mt-6 max-w-[20ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
            {ENGINE.title}
          </h2>
          <p className="mt-5 max-w-[34rem] text-[1.05rem] leading-relaxed text-ink/65">{ENGINE.body}</p>

          <ol className="mt-10 border-t border-line" onPointerLeave={unpin}>
            {ENGINE.parts.map((part, i) => {
              const on = i === active;
              return (
                <li key={part.name} className="border-b border-line">
                  <button
                    type="button"
                    onPointerEnter={() => pin(i)}
                    onFocus={() => pin(i)}
                    onBlur={unpin}
                    onClick={() => pin(i)}
                    aria-current={on ? "step" : undefined}
                    className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-2 py-5 text-left"
                  >
                    <span className={`pt-1.5 font-mono text-[0.75rem] tracking-[0.08em] transition-colors duration-500 ${on ? "text-ink" : "text-ink/30"}`}>0{i + 1}</span>
                    <span>
                      <span className={`block text-[1.25rem] leading-snug font-medium tracking-[-0.025em] transition-colors duration-500 ${on ? "text-ink" : "text-ink/40"}`}>{part.name}</span>
                      <span
                        className="grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                      >
                        <span className="overflow-hidden">
                          <span className="block max-w-[30rem] pt-2 text-[0.98rem] leading-relaxed text-ink/65">{part.body}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* The loop. Below lg only the card shows. */}
        <div ref={box} aria-hidden="true" className="relative mx-auto w-full max-w-[40rem] lg:aspect-square">
          <svg viewBox="0 0 100 100" className="absolute inset-0 hidden h-full w-full overflow-visible lg:block">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--ink)" strokeOpacity={0.1} strokeWidth={0.3} />
            <circle
              cx="50"
              cy="50"
              r={R}
              transform="rotate(-90 50 50)"
              pathLength={1}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity={0.7 * reset}
              strokeWidth={0.4}
              strokeLinecap="round"
              strokeDasharray={`${arc} 1`}
            />
            <path d={`M${50 - R} 50 A${R} ${R} 0 0 1 50 ${50 - R}`} pathLength={1} fill="none" stroke={CORAL} strokeOpacity={reset} strokeWidth={0.45} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - back} />
          </svg>

          {/* Stations and their numbers. */}
          {ENGINE.parts.map((_, k) => {
            const a = ((-90 + k * 90) * Math.PI) / 180;
            const done = k < pos - 0.05 && pos <= 3.7 ? true : false;
            return (
              <span key={k} className="absolute hidden lg:block" style={{ left: `${50 + R * Math.cos(a)}%`, top: `${50 + R * Math.sin(a)}%` }}>
                <span className={`absolute size-3 -translate-1/2 rounded-full border-[1.5px] bg-white transition-colors duration-500 ${done || k === active ? "border-ink" : "border-ink/25"}`} />
                <span
                  className={`absolute font-mono text-[0.7rem] tracking-[0.08em] transition-colors duration-500 ${k === active ? "text-ink" : "text-ink/35"}`}
                  style={{ left: `${Math.cos(a) * 30}px`, top: `${Math.sin(a) * 30}px`, transform: "translate(-50%,-50%)" }}
                >
                  0{k + 1}
                </span>
              </span>
            );
          })}

          {/* The return arc's note, top left. */}
          <p className="absolute top-[8%] left-[2%] hidden items-center gap-1.5 font-mono text-[0.68rem] tracking-[0.08em] uppercase lg:flex" style={{ color: CORAL, opacity: 0.45 + 0.55 * back }}>
            <span aria-hidden="true">↺</span>
            {ENGINE.loopNote}
          </p>

          {/* The article riding the loop. */}
          <span
            className="absolute hidden size-9 -translate-1/2 place-items-center rounded-[10px] border border-black/[0.07] bg-white shadow-[0_1px_2px_rgb(23_44_33/0.06),0_10px_22px_-8px_rgb(23_44_33/0.35)] lg:grid"
            style={{ left: `${tx}%`, top: `${ty}%` }}
          >
            <FileText className="size-[17px] text-ink/70" strokeWidth={1.7} />
          </span>

          {/* The card: what the current stage produces. */}
          <div className="w-full lg:absolute lg:top-1/2 lg:left-1/2 lg:w-[56%] lg:-translate-x-1/2 lg:-translate-y-1/2">
            <Card active={active} w={w} />
          </div>
        </div>
      </div>
    </section>
  );
}

const fade = (v: number) => ({ opacity: v, transform: `translateY(${(1 - v) * 8}px)`, pointerEvents: "none" as const });

/** One card whose four faces cross-fade as the article moves. */
function Card({ active, w }: { active: number; w: number[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgb(23_44_33/0.05),0_30px_60px_-30px_rgb(23_44_33/0.4)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[0.76rem]">
        <span className="text-ink/80">{ENGINE.parts[active].name}</span>
        <span className="font-mono text-[0.68rem] text-ink/35">0{active + 1} / 04</span>
      </div>
      <div className="relative h-[12.75rem]">
        <Face v={w[0]}>
          <p className="text-[0.68rem] tracking-[0.08em] text-ink/40 uppercase">{topics.caption}</p>
          <ul className="mt-2.5 space-y-3">
            {topics.rows.map((r, i) => (
              <li key={r.topic}>
                <p className="flex items-center justify-between gap-3 text-[0.82rem] text-ink">
                  <span className="truncate">{r.topic}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {r.tag && <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-1.5 py-px text-[0.64rem] text-[color-mix(in_srgb,var(--accent)_85%,var(--ink))]">{r.tag}</span>}
                    <span className="font-mono text-[0.74rem] text-ink/55 tabular-nums">{Math.round(r.score * clamp01(w[0] * 1.3 - i * 0.1))}</span>
                  </span>
                </p>
                <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-ink/[0.07]">
                  <span className="block h-full rounded-full" style={{ width: `${r.score * clamp01(w[0] * 1.3 - i * 0.1)}%`, background: i === 0 ? CORAL : "var(--ink)", opacity: i === 0 ? 1 : 0.55 }} />
                </span>
              </li>
            ))}
          </ul>
        </Face>

        <Face v={w[1]}>
          <p className="text-[0.88rem] leading-snug font-semibold tracking-[-0.01em] text-ink">{doc.title}</p>
          <span className="mt-3 block space-y-[7px]">
            {[100, 90, 62].map((x) => (
              <span key={x} style={{ width: `${x}%` }} className="block h-[4.5px] rounded-full bg-ink/[0.12]" />
            ))}
          </span>
          <p className="mt-3 rounded-lg bg-paper px-3 py-2.5 font-mono text-[0.68rem] leading-relaxed [overflow-wrap:anywhere] text-ink/75">{doc.code}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--primary)_40%,var(--line))] bg-[color-mix(in_srgb,var(--light-green-soft)_75%,white)] px-2.5 py-1 text-[0.7rem] text-[#1a7f47]">
            <Tick className="size-3.5" />
            {doc.check}
          </span>
        </Face>

        <Face v={w[2]}>
          <div className="flex items-center gap-2 text-[0.72rem] text-ink/50">
            <Mark name="google" className="size-3.5" />
            {serp.url}
          </div>
          <p className="mt-1 text-[0.9rem] leading-snug text-[#1a4fb0]">{serp.title}</p>
          <p className="mt-1 text-[0.76rem] leading-snug text-ink/60">{serp.snippet}</p>
          <div className="mt-3.5 border-t border-line pt-3">
            <p className="flex items-center gap-2 text-[0.72rem] text-ink/50">
              <Mark name="chatgpt" className="size-3.5" />
              AI answer
            </p>
            <p className="mt-1 text-[0.78rem] leading-snug text-ink/80">
              {serp.ai}{" "}
              <span className="inline-flex translate-y-[-1px] items-center rounded-full border border-line bg-paper px-1.5 text-[0.66rem] text-ink/60">{serp.cite}</span>
            </p>
          </div>
        </Face>

        <Face v={w[3]}>
          <ul className="space-y-3.5">
            {channels.rows.map((c, i) => (
              <li key={c.name} className="grid grid-cols-[5.2rem_minmax(0,1fr)_2.4rem] items-center gap-3 text-[0.78rem]">
                <span className="flex items-center gap-2 text-ink/80">
                  <Mark name={c.mark} className="size-3.5" />
                  {c.name}
                </span>
                <span className="h-[5px] overflow-hidden rounded-full bg-ink/[0.07]">
                  <span className="block h-full rounded-full bg-ink/70" style={{ width: `${c.w * clamp01(w[3] * 1.3 - i * 0.12)}%` }} />
                </span>
                <span className="text-right font-mono text-[0.72rem] text-ink/60 tabular-nums">{c.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-[0.76rem] text-ink/75" style={{ background: "color-mix(in srgb, var(--accent) 8%, white)" }}>
            <span aria-hidden="true" style={{ color: CORAL }}>↺</span>
            {channels.refresh}
          </p>
        </Face>
      </div>
    </div>
  );
}

function Face({ v, children }: { v: number; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 px-4 pt-4" style={fade(v)}>
      {children}
    </div>
  );
}
