"use client";

import { useInView } from "../kit";
import { TESTIMONIAL, type TestimonialData } from "./content";

// A credibility band under the hero, centred and quiet: the quote at a comfortable display size with its own curly
// quotes, set wide, and the author beneath it (photo, name and role, their company's logo beside them). No frame,
// no rules; the standard section padding. It fades up once when scrolled into view; reduced motion shows it as is.
// Used by the Technical Content and Influencer Marketing pages, each with its own client's quote.
export default function Testimonial({ data: T = TESTIMONIAL }: { data?: TestimonialData }) {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const show = seen ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0";

  return (
    <section ref={ref} aria-label="Client testimonial" className="bg-white px-6 py-14 sm:px-12 lg:py-20 xl:px-[6vw]">
      <figure className="mx-auto flex max-w-[76rem] flex-col items-center text-center">
        <blockquote className={`text-[clamp(1.3rem,2.1vw,1.85rem)] leading-[1.35] font-normal tracking-[-0.025em] text-balance text-ink ${show}`} style={{ animationDelay: "0s" }}>
          &ldquo;{T.quote}&rdquo;
        </blockquote>

        <figcaption className={`mt-9 flex items-center gap-3.5 text-left ${show}`} style={{ animationDelay: "0.12s" }}>
          <Avatar t={T} />
          <span>
            <span className="block text-[0.95rem] leading-tight font-medium tracking-[-0.01em] text-ink">{T.name}</span>
            <span className="mt-1 block text-[0.825rem] leading-tight text-ink/60">{T.role}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- a small SVG logo from /public */}
          <img src={T.logo} alt={T.company} className="ml-3 h-[22px] w-auto opacity-80" />
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
    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-light-green-soft text-[0.9rem] font-medium tracking-[0.04em] text-[#1a7f47] ring-1 ring-black/[0.06]">
      {T.initials}
      {/* eslint-disable-next-line @next/next/no-img-element -- the photo may not exist yet; the initials show instead */}
      <img src={T.photo} alt="" ref={hideIfMissing} onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 size-full object-cover" />
    </span>
  );
}
