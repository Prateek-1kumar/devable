"use client";

import { HaloReel, type HaloReelItem } from "@/components/ui/halo-reel";

// ponytail: demo cards from the component's own CDN; swap for client proof items.
const CDN = "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev";
const CARDS: HaloReelItem[] = [
  { src: `${CDN}/stock-images/767d99bb371a54d0d36751e8cecae43c.jpg`, alt: "Diver silhouetted inside a sunset seascape shaped like a profile" },
  { src: `${CDN}/gradients/hero_gradient/hero-gradients-01.png`, alt: "Soft multi-tone gradient wash" },
  { src: `${CDN}/stock-images/821d815affa6496c39cbdeeec7a84603.jpg`, alt: "Double-exposure portrait blended with a city skyline at dusk" },
  { src: `${CDN}/gradients/moon/moon-grade-03.png`, alt: "Moon-toned gradient" },
  { src: `${CDN}/stock-images/937438c560ada1c83317f2c11b3454b0.jpg`, alt: "Motion-blurred side-profile portrait against a deep orange backdrop" },
  { src: `${CDN}/gradients/shade_shiters/shade-shifters-05.png`, alt: "Shifting shade gradient" },
  { src: `${CDN}/stock-images/98f89cb9994f5c382ab964062c4039db.jpg`, alt: "Figure holding a racket that dissolves into a swirling colourful cloud" },
  { src: `${CDN}/gradients/shade_shiters/shade-shifters-09.png`, alt: "Shifting shade gradient" },
  { src: `${CDN}/stock-images/ddcbee38be8b7274e19e132d7ab35b53.jpg`, alt: "Hand gesture with a colourful cutout of a bird flying through the fingers" },
  { src: `${CDN}/gradients/moon/moon-grade-06.png`, alt: "Moon-toned gradient" },
];

/** Embedded execution: who we are on the left, client proof reel on the right. */
export default function EmbeddedExecution() {
  return (
    <section className="grid items-center gap-12 px-6 py-24 sm:px-12 lg:grid-cols-2">
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
        aria-label="Recent work"
        cardWidth={130}
        cardHeight={180}
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
