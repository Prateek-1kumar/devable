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

export const PATHS: Record<Platform, ReactNode> = {
  linkedin: SOCIAL[0].icon,
  x: SOCIAL[1].icon,
  youtube: (
    <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
  ),
  newsletter: (
    // A newspaper (Material Icons, Apache 2.0), not an envelope, which reads as "email us".
    <path d="M22 3l-1.67 1.67L18.67 3 17 4.67 15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3 7 4.67 5.33 3 3.67 4.67 2 3v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V3zM11 19H4v-6h7v6zm9 0h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4H4V8h16v3z" />
  ),
};

/** Each channel's brand colour; newsletters take Substack's orange, the familiar newsletter mark. */
export const PLATFORM_COLOR: Record<Platform, string> = { x: "#000000", linkedin: "#0a66c2", youtube: "#ff0000", newsletter: "#ff6719" };

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
