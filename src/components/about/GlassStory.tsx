"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const GlassMark = dynamic(() => import("./GlassMark"), { ssr: false });

const STATEMENT =
  "Most marketing partners never really understand the product. So we built the team that does: we learn the product deeply, know exactly who it’s for, and own the execution across every channel that drives growth.";
const WORDS = STATEMENT.split(" ");

// Where each beat of the scroll lands (0 → 1 across the pinned stage). GlassMark uses the same timeline.
const REVEAL_FROM = 0.62;
const REVEAL_TO = 0.94;

// "Why Devable exists" as a pinned, scroll-driven stage on near-black (the site's dark band):
// 1. Two glass halves of the Devable "D", one mirrored, glide in bar by bar and lock into one lens:
//    product and audience, understood together.
// 2. The lens splits; the halves swing out to frame the screen.
// 3. The statement between them lights up word by word.
// Scroll position is written to `--p` on the stage, so the DOM reveal is pure CSS and the 3D reads a ref.
export default function GlassStory() {
  const track = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      progress.current = p;
      el.style.setProperty("--p", p.toFixed(4));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      io.disconnect();
    };
  }, []);

  const step = (REVEAL_TO - REVEAL_FROM) / WORDS.length;

  return (
    <section
      ref={track}
      aria-labelledby="why-devable-title"
      style={{ "--p": 0 } as CSSProperties}
      className="relative h-[340svh] bg-[#0b0b0b] text-white"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {onScreen && <GlassMark progress={progress} />}
        </div>

        {/* Beat 1: the premise, under the forming lens; it steps aside as the lens splits. */}
        <div
          className="absolute inset-x-0 bottom-[9svh] px-6 text-center"
          style={{
            opacity: "clamp(0, calc((0.56 - var(--p)) * 9), 1)",
            transform: "translateY(calc(clamp(0, (var(--p) - 0.45) * 9, 1) * -1.5rem))",
          }}
        >
          <p className="flex items-center justify-center gap-2.5 text-xs font-medium tracking-[0.18em] text-white/45 uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-primary" />
            Why Devable exists
          </p>
          <h2
            id="why-devable-title"
            className="mx-auto mt-4 max-w-[22ch] text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.08] font-medium tracking-[-0.04em]"
          >
            Technical products deserve more than generic marketing.
          </h2>
        </div>

        {/* Beats 2–3: the statement, framed by the split halves, lighting up as you scroll. */}
        <div
          className="absolute inset-0 grid place-items-center px-6"
          style={{ opacity: "clamp(0, calc((var(--p) - 0.56) * 10), 1)" }}
        >
          <p className="max-w-[min(34rem,72vw)] text-center text-[clamp(1.45rem,2.9vw,2.6rem)] leading-[1.15] font-medium tracking-[-0.035em] text-balance max-sm:max-w-full">
            {WORDS.map((word, i) => (
              <span
                key={i}
                style={{
                  opacity: `clamp(0.16, calc(0.16 + (var(--p) - ${(REVEAL_FROM + i * step).toFixed(4)}) * ${(1 / (step * 3)).toFixed(2)}), 1)`,
                }}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
