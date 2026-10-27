"use client";

import Image from "next/image";
import mark from "../../../../public/brand/devable-mark.png";
import { Label, useInView } from "../kit";
import { delay, rise } from "../parts";
import { COMMUNITIES } from "./content";

// Why a technical team runs this, in the homepage Channel Problems language: three statements in hairline
// cells on near-black. The pledge closes the grid as its own full-width row, set as one two-tone statement
// signed with the Devable mark, so it reads as a promise rather than small print. Rises once when seen; then still.
export default function Communities() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  return (
    <section aria-labelledby="communities-title" className="bg-[#0b0b0b] px-6 py-20 sm:px-12 lg:py-24 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label dark>{COMMUNITIES.label}</Label>
        <h2 id="communities-title" className="mt-6 max-w-[24ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-white">
          {COMMUNITIES.title}
        </h2>

        <div ref={ref} className="mt-12 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 md:grid-cols-3">
          {COMMUNITIES.points.map((p, i) => (
            <div key={p.name} style={delay(i * 120)} className={`${rise(seen)} flex flex-col bg-black p-6 lg:p-8`}>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-white/70">
                <span className="size-1.5 rounded-full bg-light-green" />
                0{i + 1}
              </span>
              <h3 className="mt-8 text-[1.05rem] font-medium tracking-[-0.015em] text-white lg:mt-12">{p.name}</h3>
              <p className="mt-2 text-[0.875rem] leading-[1.55] text-white/55">{p.body}</p>
            </div>
          ))}

          {/* The pledge: the grid's closing row, set as one statement in the site's two-tone headline style. */}
          <div style={delay(420)} className={`${rise(seen)} flex items-start gap-5 bg-black p-6 md:col-span-3 lg:items-center lg:px-8 lg:py-9`}>
            {/* Signed with the Devable mark: it's our promise. */}
            <Image src={mark} alt="" className="size-11 shrink-0 rounded-xl ring-1 ring-white/10" />
            <p className="text-[clamp(1.15rem,1.7vw,1.55rem)] leading-[1.3] font-medium tracking-[-0.025em] text-white">
              {COMMUNITIES.pledge.slice(0, -1).join(" ")} <span className="text-white/45">{COMMUNITIES.pledge.at(-1)}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
