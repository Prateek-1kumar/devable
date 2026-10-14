"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Logo = { src: string; alt: string; h: number };

// Each logo gets its own height so they read at about the same visual weight: wide wordmarks sit
// shorter, compact marks (Glean, Comet) taller. ponytail: tuned by eye; re-tune when a logo is swapped.
const LOGOS: Logo[] = [
  { src: "/clients/landingai.png", alt: "LandingAI", h: 24 },
  { src: "/clients/glean.svg", alt: "Glean", h: 30 },
  { src: "/clients/twelvelabs.svg", alt: "Twelve Labs", h: 24 },
  { src: "/clients/langwatch.svg", alt: "LangWatch", h: 26 },
  { src: "/clients/statsig.png", alt: "Statsig", h: 21 },
  { src: "/clients/comet.svg", alt: "Comet", h: 38 },
  { src: "/clients/apify.png", alt: "Apify", h: 27 },
  { src: "/clients/confident-ai.png", alt: "Confident AI", h: 34 },
  { src: "/clients/assemblyai.svg", alt: "AssemblyAI", h: 24 },
  { src: "/clients/telnyx.svg", alt: "Telnyx", h: 25 },
  { src: "/clients/krisp.svg", alt: "Krisp", h: 30 },
  { src: "/clients/webai.svg", alt: "webAI", h: 19 },
  { src: "/clients/liner.svg", alt: "Liner", h: 25 },
  { src: "/clients/vercel.svg", alt: "Vercel", h: 20 },
  { src: "/clients/evenrealities.svg", alt: "Even Realities", h: 15 },
  { src: "/clients/apodex.svg", alt: "Apodex", h: 42 },
  { src: "/clients/mistral.svg", alt: "Mistral AI", h: 22 },
  { src: "/clients/kilo.svg", alt: "Kilo Code", h: 34 },
  { src: "/clients/minimax.png", alt: "MiniMax", h: 26 },
  { src: "/clients/firecrawl.svg", alt: "Firecrawl", h: 26 },
  { src: "/clients/qodo.svg", alt: "Qodo", h: 30 },
  { src: "/clients/reflex.svg", alt: "Reflex", h: 18 },
  { src: "/clients/byterover.svg", alt: "ByteRover", h: 24 },
  { src: "/clients/rockset.svg", alt: "Rockset", h: 24 },
];

const TILES = 8;
const EVERY = 2600; // ms between flips
const TURN = 1100; // ms for one flip

// A tile is a two-faced card. `turns` counts half-turns, so the face showing is turns % 2 and the other
// face is out of sight on the back, where the next logo is loaded just before the card turns.
type Tile = { faces: [number, number]; turns: number };

const start = (): Tile[] => Array.from({ length: TILES }, (_, i) => ({ faces: [i, i], turns: 0 }));
const showing = (t: Tile) => t.faces[t.turns % 2];

// One white surface split by hairlines. Every few seconds a single tile tumbles over on its horizontal
// axis to a logo that isn't on screen, so all eight are always different.
export function LogoCloud({ className, ...props }: React.ComponentProps<"div">) {
  const [tiles, setTiles] = useState(start);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || LOGOS.length <= TILES || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    let last = -1;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const id = setInterval(() => {
      if (!visible || document.hidden) return;
      // Random draws happen here, not in the updater, which React may run twice in dev.
      let pick: number;
      do pick = Math.floor(Math.random() * TILES);
      while (pick === last);
      last = pick;
      const roll = Math.random();
      setTiles((all) => {
        // The last flip has landed by now (EVERY > TURN), so the back faces it turned away from are free:
        // load each back face with its front logo, out of sight, before choosing.
        const prev = all.map((t): Tile => ({ ...t, faces: [showing(t), showing(t)] }));
        const used = new Set(prev.map(showing));
        const free = LOGOS.map((_, i) => i).filter((i) => !used.has(i));
        if (!free.length) return prev;
        const next = free[Math.floor(roll * free.length)];
        return prev.map((t, i) => {
          if (i !== pick) return t;
          const faces: [number, number] = [...t.faces];
          faces[(t.turns + 1) % 2] = next;
          return { faces, turns: t.turns + 1 };
        });
      });
    }, EVERY);

    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, []);

  return (
    <div
      ref={root}
      className={cn("grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4", className)}
      {...props}
    >
      {tiles.map((t, i) => (
        <div key={i} className="h-16 overflow-hidden bg-white [perspective:500px] sm:h-19">
          <div
            className="relative size-full [transform-style:preserve-3d] motion-reduce:transition-none"
            style={{
              transform: `rotateX(${t.turns * -180}deg)`,
              transition: `transform ${TURN}ms cubic-bezier(0.3, 1.25, 0.45, 1)`,
            }}
          >
            {t.faces.map((logo, f) => (
              <Face key={f} logo={LOGOS[logo]} back={f === 1} hidden={t.turns % 2 !== f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Face({ logo, back, hidden }: { logo: Logo; back: boolean; hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className="absolute inset-0 flex items-center justify-center bg-white px-4 [backface-visibility:hidden] sm:px-6"
      style={back ? { transform: "rotateX(180deg)" } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static logos, mixed svg/png */}
      <img
        src={logo.src}
        alt={hidden ? "" : logo.alt}
        style={{ height: logo.h }}
        className="pointer-events-none w-auto max-w-[80%] object-contain opacity-85 select-none max-sm:scale-90"
      />
    </div>
  );
}
