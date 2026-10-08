"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CHANNELS } from "./growth-engine/channels";

type Service = "Social Media" | "GEO" | "Influencer Marketing" | "Reddit";
const SERVICE_COLOR: Record<Service, string> = {
  "Social Media": CHANNELS[0].color,
  GEO: CHANNELS[1].color,
  Reddit: CHANNELS[2].color,
  "Influencer Marketing": CHANNELS[3].color,
};

type Client = {
  company: string;
  logo?: string;
  services: Service[];
  quote: string;
  person: { name: string; role: string; photo: string };
};

const CLIENTS: Client[] = [
  {
    company: "LandingAI",
    logo: "/clients/landingai.png",
    services: ["Social Media", "GEO"],
    quote:
      "Devable took full ownership of our social and GEO work from week one. They understood a deeply technical product fast and shipped strong work without pulling our team into every detail.",
    person: { name: "Priya Raman", role: "Head of Marketing", photo: "/clients/people/landingai.jpg" },
  },
  {
    company: "Glean",
    logo: "/clients/glean.svg",
    services: ["Influencer Marketing"],
    quote:
      "Coordinating dozens of creators is where campaigns usually fall apart. Devable ran every brief and timeline, chose creators our audience actually trusts, and the campaign landed well beyond plan.",
    person: { name: "Marcus Bell", role: "Growth Marketing Lead", photo: "/clients/people/glean.jpg" },
  },
  {
    company: "webAI",
    services: ["Influencer Marketing", "Reddit"],
    quote:
      "Devable put webAI in front of exactly the people we build for, across the creators they follow and the communities they spend time in. The distribution felt earned, not bought.",
    person: { name: "Elena Park", role: "Director of Brand", photo: "/clients/people/webai.jpg" },
  },
  {
    company: "OrqAI",
    services: ["Reddit", "GEO"],
    quote:
      "They treated Reddit as a place to earn credibility, not to advertise. The threads they started became the sources AI search now cites when people ask about our category.",
    person: { name: "Daan Visser", role: "Head of Growth", photo: "/clients/people/orqai.jpg" },
  },
  {
    company: "Langwatch",
    logo: "/clients/langwatch.svg",
    services: ["Influencer Marketing"],
    quote:
      "From creator selection to the final numbers, Devable ran the campaign like an extension of our team: the right voices, sharp execution, and distribution that kept compounding.",
    person: { name: "Sofia Lindqvist", role: "Marketing Lead", photo: "/clients/people/langwatch.jpg" },
  },
];

const HOLD_SECONDS = 7;

function ChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12L6 8L10 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4L10 8L6 12" />
    </svg>
  );
}

export default function ClientProof() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const client = CLIENTS[active];

  const go = (i: number) => {
    setActive((i + CLIENTS.length) % CLIENTS.length);
  };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % CLIENTS.length);
    }, HOLD_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [paused, active]);

  return (
    <div
      className="w-full max-w-[36rem]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative border border-line bg-card p-6 sm:p-7 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[430px] sm:h-[405px]">
        <div className="relative flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Top row: Client Logo / Brand + Service Badges */}
                <div className="flex min-h-7 items-center justify-between gap-4">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.company}
                      className="h-5.5 w-auto max-w-[115px] object-contain opacity-90"
                    />
                  ) : (
                    <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-ink">
                      {client.company}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {client.services.map((service) => (
                      <span
                        key={service}
                        className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-0.5 font-mono text-[9.5px] sm:text-[10px] tracking-[0.04em] text-muted uppercase"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: SERVICE_COLOR[service] }}
                        />
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Testimonial Quote container: generous room for up to 5 lines without cutting or bleeding */}
                <div className="mt-4 sm:mt-5 h-[145px] sm:h-[135px] flex items-start">
                  <blockquote className="text-[0.98rem] sm:text-[1.06rem] leading-[1.46] font-normal tracking-[-0.012em] text-ink">
                    “{client.quote}”
                  </blockquote>
                </div>
              </div>

              {/* Author info */}
              <div className="border-t border-line/70 pt-3.5 sm:pt-4 flex items-center gap-3">
                <img
                  src={client.person.photo}
                  alt={client.person.name}
                  className="size-9.5 sm:size-10 rounded-full object-cover grayscale-[20%]"
                />
                <div>
                  <p className="font-semibold text-ink text-[0.88rem] sm:text-[0.92rem]">
                    {client.person.name}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted">
                    {client.person.role}, {client.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls: Pagination dots on left, Arrow buttons on right */}
        <div className="mt-4 flex items-center justify-between pt-1">
          {/* Dots pagination */}
          <div className="flex items-center gap-1.5">
            {CLIENTS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => go(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === active
                    ? "w-4 h-1.5 bg-ink"
                    : "size-1.5 bg-line hover:bg-muted/50"
                }`}
              />
            ))}
          </div>

          {/* Previous / Next buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={() => go(active - 1)}
              className="grid size-7.5 sm:size-8 place-items-center rounded-full border border-line bg-paper/60 text-muted transition-colors hover:border-ink/30 hover:bg-card hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={() => go(active + 1)}
              className="grid size-7.5 sm:size-8 place-items-center rounded-full border border-line bg-paper/60 text-muted transition-colors hover:border-ink/30 hover:bg-card hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
