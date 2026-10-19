"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SOCIAL } from "../Footer";

// Small shared parts for the service pages.

/** True once the element has scrolled into view (and stays true), for one-time entrance animations. */
export function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/** The site's small grey label chip; `dark` for use on the near-black bands. */
export function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`w-fit rounded-[4px] px-2.5 py-1 text-[0.8rem] tracking-[0.04em] uppercase ${
        dark ? "bg-white/10 text-white/80" : "bg-ink/[0.06] text-ink/80"
      }`}
    >
      {children}
    </p>
  );
}

export type Platform = "x" | "linkedin" | "youtube" | "newsletter";

const PATHS: Record<Platform, ReactNode> = {
  linkedin: SOCIAL[0].icon,
  x: SOCIAL[1].icon,
  youtube: (
    <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
  ),
  newsletter: (
    <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2.4V17h16V7.4l-8 5.3-8-5.3ZM5.6 7 12 11.2 18.4 7H5.6Z" />
  ),
};

export const PLATFORM_NAME: Record<Platform, string> = {
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  newsletter: "Newsletters",
};

export function PlatformIcon({ platform, className = "size-4", style }: { platform: Platform; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 fill-current ${className}`} style={style}>
      {PATHS[platform]}
    </svg>
  );
}
