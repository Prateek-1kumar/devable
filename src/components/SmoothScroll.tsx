"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

// Site-wide smooth scrolling. Module-level options: the provider re-creates Lenis when they change.
// Lenis respects prefers-reduced-motion by default (1:1 scroll, instant scrollTo); touch stays native.
const OPTIONS = { lerp: 0.09, smoothWheel: true, syncTouch: false, anchors: { duration: 1.4 }, autoRaf: true, stopInertiaOnNavigate: true };

export default function SmoothScroll() {
  return <ReactLenis root options={OPTIONS} />;
}
