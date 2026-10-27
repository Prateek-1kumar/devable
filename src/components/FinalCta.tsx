"use client";

import { useEffect, useRef, useState } from "react";
import ArcButton from "./ArcButton";
import DotButton from "./DotButton";

const TITLE = "Developers are already searching.";
const SUBTITLE = "Let's make sure they find you.";
const BODY =
  "Talk to our team about where your product shows up today across search, AI answers, communities, and creators, and what to build first.";

// The closing frame: a full-bleed dark band (the Channel Problems near-black) at least half the viewport
// tall. Copy on the left, two stacked actions on the right: the primary with the site's green-box hover,
// the secondary plain white. The copy fades in once on first view, then nothing moves.
// Copy defaults to the homepage's; other pages pass their own (subtitle and body are optional).
export default function FinalCta({
  title = TITLE,
  subtitle = SUBTITLE,
  body = BODY,
  caseStudiesHref = "#case-studies",
  caseStudiesLabel = "View case studies",
  ctaLabel = "Speak with the team",
}: {
  title?: string;
  subtitle?: string;
  body?: string;
  caseStudiesHref?: string;
  caseStudiesLabel?: string;
  ctaLabel?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = `${shown ? "animate-fade-up" : "opacity-0"} motion-reduce:animate-none motion-reduce:opacity-100`;

  return (
    <section
      ref={section}
      id="contact"
      aria-labelledby="final-cta-title"
      className="flex min-h-[50svh] scroll-mt-24 items-center bg-[#0b0b0b] px-6 py-20 sm:px-12 xl:px-[6vw]"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2
            id="final-cta-title"
            style={{ animationDelay: "0ms" }}
            className={`text-[clamp(1.75rem,2.5vw,2.25rem)] leading-[1.1] font-medium tracking-[-0.035em] text-white ${reveal}`}
          >
            <span className={subtitle ? "lg:whitespace-nowrap" : "block max-w-[24ch]"}>{title}</span>
            {subtitle && <span className="block text-white/45">{subtitle}</span>}
          </h2>
          {body && (
            <p
              style={{ animationDelay: "200ms" }}
              className={`mt-6 max-w-[36rem] text-[1.02rem] leading-[1.65] text-white/60 ${reveal}`}
            >
              {body}
            </p>
          )}
        </div>

        <div
          style={{ animationDelay: "300ms" }}
          className={`flex w-full flex-col gap-3 lg:max-w-[20rem] lg:justify-self-end ${reveal}`}
        >
          <DotButton href="#contact" className="w-full">
            {ctaLabel}
          </DotButton>
          <ArcButton href={caseStudiesHref} tone="white" className="w-full">
            {caseStudiesLabel}
          </ArcButton>
        </div>
      </div>
    </section>
  );
}
