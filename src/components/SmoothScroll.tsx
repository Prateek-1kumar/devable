"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";

// Site-wide smooth scrolling. Lenis honors prefers-reduced-motion by itself
// (instant scrolling and jumps), and touch keeps native scrolling.

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** In-page "#…" links glide there. Capture phase + preventDefault, so next/link leaves them alone. */
function Anchors() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      const hash = a.getAttribute("href") ?? "#";
      if (hash === "#") return lenis.scrollTo(0, { duration: 1.4, easing: easeInOutCubic });
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) lenis.scrollTo(target, { duration: 1.4, easing: easeInOutCubic }); // ponytail: a missing target is a no-op
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [lenis]);
  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true, syncTouch: false, anchors: false, stopInertiaOnNavigate: true, autoRaf: true }}>
      <Anchors />
      {children}
    </ReactLenis>
  );
}
