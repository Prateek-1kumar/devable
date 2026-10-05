"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHANNELS } from "./growth-engine/channels";

// Client proof: one quiet card with fluid directional transitions, and a
// minimal, premium progress track at the bottom.

type Service = "Social Media" | "GEO" | "Influencer Marketing" | "Reddit";
const SERVICE_COLOR: Record<Service, string> = {
  "Social Media": CHANNELS[0].color, // content
  GEO: CHANNELS[1].color, // search + AI visibility
  Reddit: CHANNELS[2].color,
  "Influencer Marketing": CHANNELS[3].color, // creators
};

type Client = {
  company: string;
  /** Logo file in /public; without one the company name is set as a wordmark. */
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

const HOLD = 7; // seconds each quote plays before the next

// Directional slide and soft fade for card transitions.
const cardVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 18,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      x: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.3, ease: "easeOut" },
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -18,
    transition: {
      x: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.18, ease: "easeIn" },
    },
  }),
};

const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
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
    // eslint-disable-next-line @next/next/no-img-element -- sized from natural aspect
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

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-3.5 ${flip ? "rotate-180" : ""}`}>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const control =
  "grid size-9 place-items-center rounded-full border border-line bg-card/80 text-ink/70 transition-colors hover:border-ink/25 hover:bg-card hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const mono = "font-mono text-[0.68rem] tracking-[0.14em] uppercase";

export default function ClientProof() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const client = CLIENTS[active];
  const progress = useMotionValue(0);
  const fill = useTransform(progress, (v) => `${v * 100}%`);

  const go = (i: number) => {
    const next = (i + CLIENTS.length) % CLIENTS.length;
    if (next !== active) {
      setDirection(next > active || (active === CLIENTS.length - 1 && next === 0) ? 1 : -1);
      progress.set(0);
      setActive(next);
    }
  };

  useEffect(() => {
    if (reduced) return;
    progress.set(0);
  }, [active, reduced, progress]);

  useEffect(() => {
    if (reduced || paused) return;
    const remaining = HOLD * (1 - progress.get());
    const controls = animate(progress, 1, {
      duration: remaining,
      ease: "linear",
      onComplete: () => {
        setDirection(1);
        progress.set(0);
        setActive((a) => (a + 1) % CLIENTS.length);
      },
    });
    return () => controls.stop();
  }, [active, paused, reduced, progress]);

  return (
    <div
      className="w-full max-w-[38rem] justify-self-end"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <figure
        aria-roledescription="carousel"
        className="rounded-[16px] border border-line bg-card px-8 pt-8 pb-7 shadow-[0_1px_3px_rgb(15_26_20/0.04)] sm:px-10 sm:pt-10"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            variants={reduced ? reducedVariants : cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="flex min-h-9 items-center justify-between gap-6">
              <Logo client={client} area={1600} />
              <ul className="flex flex-wrap justify-end gap-x-5 gap-y-1">
                {client.services.map((service) => (
                  <li key={service} className={`flex items-center gap-2 text-muted ${mono}`}>
                    <span className="size-[7px] rounded-[1.5px]" style={{ backgroundColor: SERVICE_COLOR[service] }} />
                    {service}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex min-h-[7.5rem] items-center sm:min-h-[8.5rem]">
              <blockquote className="text-[1.3rem] leading-[1.42] font-normal tracking-[-0.025em] text-ink sm:text-[1.58rem]">
                “{client.quote}”
              </blockquote>
            </div>

            <figcaption className="mt-8 flex items-center gap-3.5 border-t border-line pt-6 pr-24">
              {/* pr-24 keeps the person clear of the prev/next controls on the same line */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={client.person.photo} alt="" className="size-11 rounded-[8px] object-cover grayscale-[25%]" />
              <span className="text-[0.95rem] leading-snug">
                <span className="block font-medium text-ink">{client.person.name}</span>
                <span className="block text-xs text-muted mt-0.5">
                  {client.person.role}, {client.company}
                </span>
              </span>
            </figcaption>
          </motion.div>
        </AnimatePresence>

        {/* Controls sit outside the transition, on the attribution line */}
        <div className="relative">
          <div className="absolute right-0 bottom-1 flex items-center gap-2">
            <button type="button" aria-label="Previous client" onClick={() => go(active - 1)} className={control}>
              <Arrow flip />
            </button>
            <button type="button" aria-label="Next client" onClick={() => go(active + 1)} className={control}>
              <Arrow />
            </button>
          </div>
        </div>
      </figure>

      {/* The index: every client by name, the active one's refined hairline filling smoothly */}
      <div role="tablist" aria-label="Clients" className="mt-7 grid grid-cols-5 gap-2.5 sm:gap-4">
        {CLIENTS.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={c.company}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => go(i)}
              className="group flex flex-col gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`font-mono text-[10px] tracking-[0.1em] transition-colors duration-300 ${
                    on ? "font-semibold text-primary" : "text-muted/45 group-hover:text-muted"
                  }`}
                >
                  0{i + 1}
                </span>
                <span
                  className={`truncate font-mono text-[10.5px] tracking-[0.08em] uppercase transition-colors duration-300 ${
                    on ? "font-medium text-ink" : "text-muted/60 group-hover:text-ink"
                  }`}
                >
                  {c.company}
                </span>
              </div>
              <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-ink/[0.08] transition-colors duration-300 group-hover:bg-ink/[0.14]">
                {on && (
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: reduced ? "100%" : fill }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
