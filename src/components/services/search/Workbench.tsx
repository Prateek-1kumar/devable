"use client";

import { useEffect, useRef, useState } from "react";
import { Label, useInView } from "../kit";
import { CANVAS, FRAME, PILL, StepChip } from "../parts";
import { AREAS } from "./content";
import PagePlan from "./PagePlan";
import Presence from "./Presence";
import SiteFix from "./SiteFix";
import Understand from "./Understand";
import type { SceneProps } from "./scene";

// The page's signature section, in How We Work's language: the four areas of work down the left (step chip
// and where it sits in the sequence, title, copy, mono "includes" pills), and on the right, pinned while you
// scroll, a How We Work card whose dotted canvas shows what that area does. The four scenes are deliberately
// four different shapes, because the work is four different kinds of work:
//   01 a staircase    Product understanding → Search & AI signals → Opportunity → Priority
//   02 a mapping      Opportunity → Page → New, Refresh or Optimize
//   03 a map          the product at the centre of the external sources, present, weak or missing
//   04 a site graph   Diagnose → Fix → Improve discovery
// The area crossing the middle of the screen is active and its scene plays through once; scroll to another
// and the card crossfades to that one. Below xl the scenes sit under their own areas and play when seen.
const SCENES: ((p: SceneProps) => React.ReactNode)[] = [Understand, PagePlan, Presence, SiteFix];

export default function Workbench() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false); // the pinned card is on screen: scenes wait until then
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const pin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    blocks.current.forEach((el) => el && io.observe(el));
    const seen = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    if (pin.current) seen.observe(pin.current);
    return () => {
      io.disconnect();
      seen.disconnect();
    };
  }, []);

  return (
    <section aria-labelledby="areas-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label>{AREAS.label}</Label>
        <h2 id="areas-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {AREAS.title}
        </h2>
        <p className="mt-6 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/65">{AREAS.body}</p>

        <div className="mt-14 grid gap-16 xl:mt-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-14">
          <div className="min-w-0">
            {AREAS.areas.map((a, i) => (
              <div
                key={a.name}
                data-i={i}
                ref={(el) => {
                  blocks.current[i] = el;
                }}
                className={`transition-opacity duration-500 motion-reduce:transition-none max-xl:mt-16 max-xl:first:mt-0 xl:flex xl:min-h-[66vh] xl:flex-col xl:justify-center ${
                  active === i ? "" : "xl:opacity-35"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <StepChip n={i + 1} />
                  <span className="text-[0.82rem] text-ink/50">{a.tagline}</span>
                </div>
                <h3 className="mt-5 text-[clamp(1.5rem,2.1vw,2.05rem)] leading-[1.12] font-normal tracking-[-0.03em] text-ink">{a.name}</h3>
                <p className="mt-4 max-w-[30rem] text-[0.97rem] leading-relaxed text-ink/70">{a.summary}</p>
                {a.body && <p className="mt-3 max-w-[30rem] text-[0.93rem] leading-relaxed text-ink/60">{a.body}</p>}
                <p className="mt-6 text-[0.82rem] text-ink/50">{a.listLabel}</p>
                <ul className="mt-2.5 flex max-w-[30rem] flex-wrap gap-1.5">
                  {a.items.map((item) => (
                    <li key={item} className={PILL}>
                      {item}
                    </li>
                  ))}
                </ul>
                <InlineScene i={i} />
              </div>
            ))}
          </div>

          {/* Pinned scene, wide screens only. All four share one cell and crossfade, so nothing jumps. */}
          <div aria-hidden="true" className="hidden xl:block">
            <div ref={pin} className={`${FRAME} sticky top-[calc(50vh-18rem)] h-[36rem]`}>
              <div className={`${CANVAS} grid h-full`}>
                {SCENES.map((Scene, i) => (
                  <div
                    key={i}
                    className={`[grid-area:1/1] flex items-center justify-center p-8 transition-opacity duration-500 motion-reduce:transition-none ${
                      active === i ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <Scene on={inView && active === i} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Narrower screens: the area's scene in its own card, playing once it scrolls into view. */
function InlineScene({ i }: { i: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const Scene = SCENES[i];
  return (
    <div ref={ref} aria-hidden="true" className={`${FRAME} mt-8 xl:hidden`}>
      <div className={`${CANVAS} px-3 py-6 sm:p-8`}>
        <Scene on={seen} />
      </div>
    </div>
  );
}
