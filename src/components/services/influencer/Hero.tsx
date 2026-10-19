"use client";

import ArcButton from "../../ArcButton";
import { SignalGrid } from "../../ui/signal-grid";
import { Label, PLATFORM_NAME, PlatformIcon, type Platform } from "../kit";
import { HERO } from "./content";
import HeroPosts from "./HeroPosts";

// Each channel's own brand colour; newsletters take Substack's orange as the familiar newsletter mark.
const BRAND: Record<Platform, string> = { x: "#000000", linkedin: "#0a66c2", youtube: "#ff0000", newsletter: "#ff6719" };

// The first viewport, framed like the homepage hero (warm off-white panel over the pixel field), split in
// two: the claim, the numbers and the channels on the left; on the right, one launch as it showed up across
// channels, as a fanned stack of posts (see HeroPosts).
export default function Hero() {
  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="relative isolate mx-auto grid max-w-[76rem] items-center gap-14 overflow-hidden rounded-2xl bg-[#f9f8f4] px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
        {/* The homepage hero's pixel field, eased back behind the copy so the text stays clean. */}
        <SignalGrid className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_55%_75%_at_22%_50%,transparent_35%,rgb(0_0_0_/_0.35)_65%,black_100%)]" />
        <div>
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] font-medium tracking-[-0.05em] text-ink">
            {HERO.title}
          </h1>
          <p className="mt-6 max-w-[32rem] text-lg leading-relaxed tracking-[-0.01em] text-ink/70 sm:text-xl">{HERO.body}</p>

          <dl className="mt-10 grid max-w-[30rem] grid-cols-3 divide-x divide-ink/10 border-y border-ink/10">
            {HERO.stats.map((s) => (
              <div key={s.label} className="py-4 pr-4 [&:not(:first-child)]:pl-4">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-[1.75rem] leading-none font-medium tracking-[-0.045em] text-ink">{s.value}</dd>
                <dd className="mt-1.5 text-[0.82rem] text-ink/50">{s.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-5 flex items-center gap-5" aria-label="Channels">
            {HERO.channels.map((c) => (
              <li key={c} title={PLATFORM_NAME[c]}>
                <PlatformIcon platform={c} className="size-5" style={{ color: BRAND[c] }} />
                <span className="sr-only">{PLATFORM_NAME[c]}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <ArcButton href="#contact" arrow tone="primary">
              Speak with the Team
            </ArcButton>
            <ArcButton href="#launches" tone="secondary">
              See our launches
            </ArcButton>
          </div>
        </div>

        <HeroPosts />
      </div>
    </section>
  );
}
