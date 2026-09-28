"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

// Site-wide smooth scrolling. Module-level options: the provider re-creates Lenis when they change.
// Lenis respects prefers-reduced-motion by default (1:1 scroll, instant scrollTo); touch stays native.
const OPTIONS = { lerp: 0.09, smoothWheel: true, syncTouch: false, anchors: { duration: 1.4 }, autoRaf: true, stopInertiaOnNavigate: true };
const HERO = "section[aria-labelledby=hero-title]";

export default function SmoothScroll() {
  return (
    <>
      <ReactLenis root options={OPTIONS} />
      <HeroSkip />
    </>
  );
}

/**
 * An anchor that would glide across the pinned hero plays its whole story in about a second.
 * Such clicks jump straight past the pin instead, then glide the last viewport to the target.
 * (Handled on document as the click bubbles, before Lenis's own anchor handler on window, which then never sees it.)
 */
function HeroSkip() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const onClick = (e: MouseEvent) => {
      const hash = (e.target as Element | null)?.closest?.('a[href^="#"]')?.getAttribute("href");
      const target = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      const hero = document.querySelector<HTMLElement>(HERO);
      if (!target || !hero) return;
      const pinEnd = hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      const to = target.getBoundingClientRect().top + window.scrollY;
      const y = lenis.animatedScroll;
      if (to <= pinEnd || pinEnd - y < window.innerHeight) return; // not crossing much of the pinned story
      e.preventDefault();
      e.stopPropagation();
      lenis.scrollTo(Math.max(pinEnd, to - window.innerHeight), { immediate: true, force: true });
      lenis.scrollTo(target, { duration: 1.2, force: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);
  return null;
}
