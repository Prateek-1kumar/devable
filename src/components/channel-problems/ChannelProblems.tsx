"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// The 3D bundle loads after the page, so the copy paints instantly.
const CardScene = dynamic(() => import("./scenes"), { ssr: false });

const TITLE = "You know developer growth matters.";
const SUBTITLE = "But every channel demands a different kind of expertise.";

const PROBLEMS = [
  {
    title: "Technical depth is hard to fake.",
    body: "When the work gets technical, surface-level content does not hold up.",
  },
  {
    title: "Search is no longer one surface.",
    body: "Ranking still matters. So does showing up in the AI answers shaping how buyers discover and evaluate solutions.",
  },
  {
    title: "Reddit punishes forced promotion.",
    body: "The brands that do well contribute genuinely, understand the community, and introduce their product when it belongs in the conversation.",
  },
  {
    title: "Reach is easy to buy. Trust is not.",
    body: "Your audience listens to creators who know the space. The right creators, narrative, and timing decide whether a campaign builds lasting reach or real launch momentum.",
  },
];

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export default function ChannelProblems() {
  return (
    <section aria-labelledby="channel-problems-title" className="bg-[#0b0b0b] px-6 py-16 sm:px-12 lg:py-20 xl:px-[6vw]">
      <h2
        id="channel-problems-title"
        className="max-w-[60ch] text-[clamp(1.6rem,2.4vw,2.25rem)] leading-[1.14] font-normal tracking-[-0.03em] text-white"
      >
        {TITLE} <span className="block text-white/45">{SUBTITLE}</span>
      </h2>

      <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 md:grid-cols-2 lg:mt-12">
        {PROBLEMS.map((p, i) => (
          <ProblemCard key={p.title} index={i} {...p} />
        ))}
      </div>
    </section>
  );
}

function ProblemCard({ index, title, body }: { index: number; title: string; body: string }) {
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED_QUERY).matches, () => true);
  const box = useRef<HTMLDivElement>(null);
  const hover = useRef(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: "100px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      onPointerEnter={() => (hover.current = true)}
      onPointerLeave={() => (hover.current = false)}
      className="flex flex-col bg-black"
    >
      <div className="px-6 pt-6">
        <h3 className="text-[1.05rem] font-medium tracking-[-0.015em] text-white">{title}</h3>
        <p className="mt-2 text-[0.875rem] leading-[1.55] text-white/55">{body}</p>
      </div>
      <div ref={box} aria-hidden="true" className="relative min-h-[290px] flex-1 lg:min-h-[360px]">
        <CardScene key={String(still)} index={index} still={still} active={onScreen} hover={hover} />
      </div>
    </article>
  );
}
