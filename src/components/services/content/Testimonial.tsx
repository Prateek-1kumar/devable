"use client";

import { useInView } from "../kit";
import { TESTIMONIAL, type TestimonialData } from "./content";

// A credibility band under the hero, centred and quiet: the quote at display size with its own curly quotes, set
// wide, and the author beneath it (photo, name and role, their company's logo beside them). No frame, no rules. On
// large screens it takes the whole viewport, the content centred with room above and below. It fades up once when scrolled into view; reduced motion shows it as is.
// Used by the Technical Content and Influencer Marketing pages, each with its own client's quote.
export default function Testimonial({ data: T = TESTIMONIAL }: { data?: TestimonialData }) {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const show = seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0";

  return (
    <section ref={ref} aria-label="Client testimonial" className="flex items-center bg-white px-6 py-20 sm:px-12 lg:min-h-[100svh] lg:py-28 xl:px-[6vw]">
      <figure className="mx-auto flex w-full max-w-[76rem] flex-col items-center text-center">
        <blockquote className={`text-[clamp(1.45rem,2.75vw,2.6rem)] leading-[1.3] font-normal tracking-[-0.03em] text-balance text-ink ${show}`} style={{ animationDelay: "0s" }}>
          &ldquo;{T.quote}&rdquo;
        </blockquote>

        <figcaption className={`mt-12 flex items-center gap-4 text-left ${show}`} style={{ animationDelay: "0.12s" }}>
          <Avatar t={T} />
          <span>
            <span className="block text-[1.05rem] leading-tight font-medium tracking-[-0.01em] text-ink">{T.name}</span>
            <span className="mt-1 block text-[0.9rem] leading-tight text-ink/60">{T.role}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- a small SVG logo from /public */}
          <img src={T.logo} alt={T.company} className="ml-4 h-7 w-auto opacity-80" />
        </figcaption>
      </figure>
    </section>
  );
}

/** The client's photo in a circle; their initials sit underneath and show until a photo exists at `t.photo`. */
function Avatar({ t: T }: { t: TestimonialData }) {
  const hideIfMissing = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) img.style.display = "none";
  };
  return (
    <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-light-green-soft text-[0.9rem] font-medium tracking-[0.04em] text-[#1a7f47] ring-1 ring-black/[0.06]">
      {T.initials}
      {/* eslint-disable-next-line @next/next/no-img-element -- the photo may not exist yet; the initials show instead */}
      <img src={T.photo} alt="" ref={hideIfMissing} onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 size-full object-cover" />
    </span>
  );
}
