"use client";

import { Label, useInView } from "../kit";
import { EXPANDED, STATUS_LABEL, type Status } from "./content";
import { Beacon, CANVAS, FRAME, GAP, MarkStack, SHEET, SheetHead, Tick, delay, rise } from "./parts";

// Discovery now happens on five surfaces, so the visual is one product checked across all five, as a sheet
// on the How We Work canvas with an earlier check stacked behind it. Each surface shows where buyers meet
// you (its brand marks) and how you're represented there: checked, out of date, or missing. Rows land one
// by one, then only the out-of-date row's coral beacon keeps breathing: being shown wrongly is the point.
export default function Expanded() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <section aria-labelledby="expanded-title" className="px-6 py-20 sm:px-12 lg:py-28 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <Label>{EXPANDED.label}</Label>
          <h2 id="expanded-title" className="mt-6 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
            {EXPANDED.title}
          </h2>
          <p className="mt-6 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink/65">{EXPANDED.body}</p>
          <p className="mt-4 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink">{EXPANDED.challenge}</p>
        </div>

        <div ref={ref} className={`${FRAME} ${CANVAS} px-4 pt-8 pb-6 sm:px-10 sm:pt-12 sm:pb-10`}>
          <div className="relative">
            {/* Last quarter's check, stacked behind for depth. */}
            <div aria-hidden="true" className={`${SHEET} absolute inset-x-5 -top-3 bottom-3 opacity-70`} />
            <div style={delay(100)} className={`${SHEET} ${rise(seen)} relative overflow-hidden`}>
              <SheetHead title="Where buyers find your product">
                <span className="text-[11px] text-ink/45">5 surfaces</span>
              </SheetHead>
              <ul className="divide-y divide-line">
                {EXPANDED.surfaces.map((s, i) => (
                  <li key={s.name} style={delay(350 + i * 240)} className={`${rise(seen)} flex items-center gap-3 px-4 py-3.5 sm:gap-4`}>
                    <span className="w-[3.25rem] shrink-0">
                      <MarkStack names={s.marks} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">{s.name}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-ink/55">{s.seen}</p>
                    </div>
                    <span style={delay(1700 + i * 120)} className={rise(seen)}>
                      <State status={s.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function State({ status }: { status: Status }) {
  if (status === "shown")
    return (
      <span className="flex items-center gap-1.5 text-[11.5px] text-ink/60">
        <Tick />
        <span className="max-sm:sr-only">{STATUS_LABEL.shown}</span>
      </span>
    );
  if (status === "stale")
    return (
      <span className={GAP}>
        <Beacon />
        {STATUS_LABEL.stale}
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] text-ink/45">
      <span className="size-[18px] rounded-full border-[1.5px] border-ink/15 bg-white" />
      <span className="max-sm:sr-only">{STATUS_LABEL.missing}</span>
    </span>
  );
}
