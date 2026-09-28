"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHANNELS } from "./growth-engine/channels";

// Client proof, typographic and quiet: one card, the quote in large even type,
// services as small monospace labels with square swatches in the hero's channel
// colors (the site's pixel-block language), and an index of the five clients
// underneath whose hairlines fill as each quote plays.
//
// ponytail: quotes, names, roles and photos are SAMPLE CONTENT for layout only.
// Replace them with real, approved client quotes and photos before launch.

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
const EASE = [0.22, 1, 0.36, 1] as const;

// The quote rises in word by word with a whisper of blur; everything else cross-fades.
const words: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.014 } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
};
const word: Variants = {
  enter: { opacity: 0, y: "0.35em", filter: "blur(3px)" },
  center: { opacity: 1, y: "0em", filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
};
const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.45, ease: EASE, delay: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

/**
 * A client logo at a steady visual weight, sized from its natural aspect. Falls
 * back to the name as a wordmark when there is no file or it fails to load,
 * including a failure that happened before React hydrated.
 */
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
  if (failed) return <span className="font-heading text-[1.2rem] font-semibold tracking-[-0.03em] text-foreground">{client.company}</span>;
  const height = ratio ? Math.sqrt(area / ratio) : 26;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- sized from its natural aspect once loaded
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
  "grid size-9 place-items-center rounded-[8px] border border-foreground/12 text-foreground/70 transition-colors hover:border-foreground/35 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40";
const mono = "font-mono text-[0.68rem] tracking-[0.14em] uppercase";

export default function ClientProof() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const client = CLIENTS[active];
  const progress = useMotionValue(0);
  const fill = useTransform(progress, (v) => `${v * 100}%`);

  const go = (i: number) => {
    const next = (i + CLIENTS.length) % CLIENTS.length;
    if (next !== active) setActive(next);
  };

  // Each quote plays for HOLD seconds, its hairline filling, then the next one comes in.
  // Hover or focus pauses it where it is; reduced motion never autoplays.
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
      onComplete: () => setActive((a) => (a + 1) % CLIENTS.length),
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
      <motion.figure
        layout
        transition={{ layout: { duration: 0.5, ease: EASE } }}
        aria-roledescription="carousel"
        className="rounded-[14px] border border-foreground/[0.09] bg-white px-8 pt-8 pb-7 sm:px-10 sm:pt-10"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={active} initial="enter" animate="center" exit="exit">
            <motion.div variants={fade} className="flex min-h-9 items-center justify-between gap-6">
              <Logo client={client} area={1600} />
              <ul className="flex flex-wrap justify-end gap-x-5 gap-y-1">
                {client.services.map((service) => (
                  <li key={service} className={`flex items-center gap-2 text-foreground/60 ${mono}`}>
                    <span className="size-[7px]" style={{ backgroundColor: SERVICE_COLOR[service] }} />
                    {service}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.blockquote
              variants={reduced ? fade : words}
              className="mt-10 text-[1.35rem] leading-[1.42] font-normal tracking-[-0.02em] text-foreground sm:text-[1.6rem]"
            >
              {reduced
                ? `“${client.quote}”`
                : `“${client.quote}”`.split(" ").map((w, i) => (
                    <motion.span key={i} variants={word} className="inline-block whitespace-pre">
                      {w}{" "}
                    </motion.span>
                  ))}
            </motion.blockquote>

            <motion.figcaption variants={fade} className="mt-10 flex items-center gap-3.5 border-t border-foreground/[0.08] pt-6 pr-24">
              {/* pr-24 keeps the person clear of the prev/next controls on the same line. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- sample photo, swapped for the real one */}
              <img src={client.person.photo} alt="" className="size-11 rounded-[6px] object-cover grayscale-[35%]" />
              <span className="text-[0.95rem] leading-snug">
                <span className="block font-medium text-foreground">{client.person.name}</span>
                <span className="block text-foreground/55">
                  {client.person.role}, {client.company}
                </span>
              </span>
            </motion.figcaption>
          </motion.div>
        </AnimatePresence>

        {/* Controls sit outside the transition, on the attribution line. */}
        <div className="relative">
          {/* Centered on the 44px photo row that ends right above this line. */}
          <div className="absolute right-0 bottom-1 flex items-center gap-2">
            <button type="button" aria-label="Previous client" onClick={() => go(active - 1)} className={control}>
              <Arrow flip />
            </button>
            <button type="button" aria-label="Next client" onClick={() => go(active + 1)} className={control}>
              <Arrow />
            </button>
          </div>
        </div>
      </motion.figure>

      {/* The index: every client by name, the playing one's hairline filling; past ones full, upcoming empty. */}
      <div role="tablist" aria-label="Clients" className="mt-5 grid grid-cols-5 gap-3">
        {CLIENTS.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={c.company}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => go(i)}
              className="group text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40"
            >
              <span className={`block truncate transition-colors duration-300 ${mono} ${on ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/70"}`}>
                {String(i + 1).padStart(2, "0")} {c.company}
              </span>
              <span className="relative mt-2.5 block h-px bg-foreground/[0.12]">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-foreground"
                  style={{ width: on ? (reduced ? "100%" : fill) : i < active ? "100%" : "0%" }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
