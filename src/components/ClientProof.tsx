"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHANNELS } from "./growth-engine/channels";
import StatusIndicator, { type StatusItem } from "@/components/ui/status-indicator";

// Client proof: a self-contained, luxury card with zero height shift,
// fluid directional cross-fade, and the morphing status indicator anchored
// inside the card footer. Autoplays every 6 seconds in sync.

type Service = "Social Media" | "GEO" | "Influencer Marketing" | "Reddit";
const SERVICE_COLOR: Record<Service, string> = {
  "Social Media": CHANNELS[0].color, // content
  GEO: CHANNELS[1].color, // search + AI visibility
  Reddit: CHANNELS[2].color,
  "Influencer Marketing": CHANNELS[3].color, // creators
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

const CLIENT_STATUSES: StatusItem[] = CLIENTS.map((c, i) => ({
  id: String(i),
  label: c.company,
  color: "#1f4d3a", // deep green
  icon: "circle-check",
}));

const HOLD = 6; // auto-advance every 6 seconds

const cardVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 14,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      x: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.26, ease: "easeOut" },
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -14,
    transition: {
      x: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.14, ease: "easeIn" },
    },
  }),
};

const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

function Logo({ client, area }: { client: Client; area: number }) {
  const img = useRef<HTMLImageElement>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(!client.logo);
  useEffect(() => {
    const el = img.current;
    if (el?.complete) {
      if (el.naturalWidth > 0) setRatio(el.naturalWidth / el.naturalHeight);
      else setFailed(true);
    }
  }, []);
  if (failed) return <span className="font-heading text-[1.2rem] font-semibold tracking-[-0.03em] text-ink">{client.company}</span>;
  const height = ratio ? Math.sqrt(area / ratio) : 26;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={client.logo}
      alt={client.company}
      style={{ height, width: ratio ? height * ratio : "auto", opacity: ratio ? 1 : 0 }}
      className="transition-opacity duration-300"
      onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
      onError={() => setFailed(true)}
    />
  );
}

export default function ClientProof() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const client = CLIENTS[active];

  const go = (i: number) => {
    const next = (i + CLIENTS.length) % CLIENTS.length;
    if (next !== active) {
      setDirection(next > active || (active === CLIENTS.length - 1 && next === 0) ? 1 : -1);
      setActive(next);
    }
  };

  // Auto-advance every 6 seconds in sync with active state
  useEffect(() => {
    if (reduced || paused) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setActive((a) => (a + 1) % CLIENTS.length);
    }, HOLD * 1000);
    return () => clearTimeout(timer);
  }, [active, paused, reduced]);

  return (
    <div
      className="w-full max-w-[39rem] justify-self-end"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Locked height figure: stable across all quotes, never resizes */}
      <figure
        aria-roledescription="carousel"
        className="relative flex h-[25rem] sm:h-[22.5rem] flex-col justify-between overflow-hidden rounded-[20px] border border-line bg-card p-7 sm:p-9 shadow-[0_2px_8px_rgb(15_26_20/0.04),0_1px_2px_rgb(15_26_20/0.02)]"
      >
        {/* Transitioning Card Content */}
        <div className="relative flex flex-1 flex-col justify-between overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={reduced ? reducedVariants : cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex h-full flex-col justify-between"
            >
              {/* Top row: Brand Logo and Service Badge */}
              <div className="flex min-h-8 items-center justify-between gap-6">
                <Logo client={client} area={1500} />
                <div className="flex flex-wrap justify-end gap-1.5">
                  {client.services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-3 py-1 shadow-[0_1px_2px_rgb(15_26_20/0.03),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xs transition-colors hover:border-black/[0.14]"
                    >
                      <span className="relative flex size-2 items-center justify-center">
                        <span
                          className="absolute size-2 rounded-full opacity-30"
                          style={{ backgroundColor: SERVICE_COLOR[service] }}
                        />
                        <span
                          className="relative size-1.5 rounded-full"
                          style={{ backgroundColor: SERVICE_COLOR[service] }}
                        />
                      </span>
                      <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-ink/75 uppercase">
                        {service}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Middle row: Editorial Quote */}
              <div className="my-auto flex items-center py-3">
                <blockquote className="text-[1.3rem] leading-[1.4] font-normal tracking-[-0.025em] text-ink sm:text-[1.5rem]">
                  “{client.quote}”
                </blockquote>
              </div>

              {/* Bottom footer: Person info */}
              <figcaption className="flex items-center gap-3 border-t border-line/80 pt-5 pr-44 sm:pr-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={client.person.photo}
                  alt=""
                  className="size-10.5 rounded-[9px] object-cover ring-1 ring-black/[0.06] grayscale-[20%]"
                />
                <span className="text-[0.92rem] leading-snug truncate">
                  <span className="block font-medium text-ink truncate">{client.person.name}</span>
                  <span className="block text-xs text-muted mt-0.5 truncate">
                    {client.person.role}, {client.company}
                  </span>
                </span>
              </figcaption>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Anchored Persistent StatusIndicator: OUTSIDE AnimatePresence so it never resets or falls out of sync */}
        <div className="pointer-events-auto absolute right-7 bottom-6 sm:right-9 sm:bottom-8 z-10 flex items-center">
          <StatusIndicator
            value={String(active)}
            statuses={CLIENT_STATUSES}
            ariaLabel="Client testimonials"
            onChange={(_, idx) => go(idx)}
            className="[--si-pill-bg:var(--primary-soft)] [--si-label:var(--ink)] [--si-dot:#cfdad1] [--si-dot-hover-bg:rgba(31,77,58,0.08)]"
          />
        </div>
      </figure>
    </div>
  );
}
