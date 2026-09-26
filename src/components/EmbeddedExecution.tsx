"use client";

import { HaloReel, type HaloReelItem } from "@/components/ui/halo-reel";

// Client logos. Each needs its artwork ratio (width ÷ height) so all render at the
// same visual size; `scale` nudges ones that still read small.
const CARDS: HaloReelItem[] = [
  { logo: true, src: "/clients/statsig.png", ratio: 118 / 20, alt: "Statsig" },
  { logo: true, src: "/clients/reflex.svg", ratio: 81 / 16, alt: "Reflex" },
  { logo: true, src: "/clients/landingai.png", ratio: 160 / 32, alt: "LandingAI" },
  { logo: true, src: "/clients/minimax.png", ratio: 560 / 129, alt: "MiniMax" },
  {
    // ponytail: Rockset's site is retired, so its bracketed wordmark is rebuilt here; swap for the file if you get one.
    alt: "Rockset",
    face: (
      <span aria-label="Rockset" className="flex items-center font-heading text-[1.55em] font-bold tracking-tight text-[#5b1d8c]">
        <span className="font-light text-[#7ac0dc]">[</span>ROCKSET<span className="font-light text-[#7ac0dc]">]</span>
      </span>
    ),
  },
  { logo: true, src: "/clients/twelvelabs.svg", ratio: 159 / 32, scale: 1.25, alt: "TwelveLabs" },
  { logo: true, src: "/clients/apify.png", ratio: 362 / 100, alt: "Apify" },
  { logo: true, src: "/clients/confident-ai.png", ratio: 967 / 265, scale: 1.25, alt: "Confident AI" },
  { logo: true, src: "/clients/comet.svg", ratio: 140 / 59, alt: "Comet" },
];

/** Embedded execution: who we are on the left, client proof reel on the right. */
export default function EmbeddedExecution() {
  return (
    <section className="grid items-center gap-12 px-6 py-24 sm:px-12 lg:grid-cols-2 lg:px-20 xl:px-28">
      <div>
        {/* Dark pill, then an amber dot beside a coral pill; the live badge matches the pill height. */}
        <h2 className="flex flex-col items-start gap-[0.12em] font-heading text-2xl leading-none font-bold tracking-[-0.03em] whitespace-nowrap sm:text-3xl xl:text-4xl">
          <span className="rounded-full bg-foreground px-[0.55em] py-[0.3em] text-white">We plug into your team</span>
          <span className="flex items-center gap-[0.12em]">
            {/* Live badge: an amber scalloped flower turning slowly. */}
            <span aria-hidden="true" className="relative grid size-[1.6em] shrink-0 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_14s_linear_infinite] fill-amber motion-reduce:animate-none">
                <path d="M65.7 12.1 Q89.6 10.4 87.9 34.3 Q106.0 50.0 87.9 65.7 Q89.6 89.6 65.7 87.9 Q50.0 106.0 34.3 87.9 Q10.4 89.6 12.1 65.7 Q-6.0 50.0 12.1 34.3 Q10.4 10.4 34.3 12.1 Q50.0 -6.0 65.7 12.1Z" />
              </svg>
            </span>
            <span className="rounded-full bg-coral px-[0.55em] py-[0.3em] text-foreground">and own the execution.</span>
          </span>
        </h2>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
          We are a team of engineers, technical writers, creators, and marketers building growth and distribution for AI-native and developer companies.
        </p>
      </div>
      <HaloReel
        items={CARDS}
        aria-label="Clients"
        cardWidth={220}
        cardHeight={120}
        minScale={0.4}
        radiusYRatio={0.36}
        holdDuration={1000}
        stepDuration={700}
        centerXRatio={1}
        mirror
        farBlur={1.5}
        // Ring centred on the right edge, front facing left; a soft fade where cards turn away.
        className="h-[560px] [mask-image:linear-gradient(to_left,transparent,black_14%)]"
      />
    </section>
  );
}
