"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Adapted from React Bits <StrokeText />: multi-line, every glyph draws at
// once (no stagger), then the fill fades in. Colors come from `currentColor`,
// so set them with a text color class (e.g. `text-foreground`).
type Props = {
  lines: string[];
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  className?: string;
};

type Box = { x: number; y: number; width: number; height: number };

export default function StrokeText({
  lines,
  fontSize = 128,
  fontWeight = 600,
  lineHeight = 1.1,
  strokeWidth = 1,
  drawDuration = 1.8,
  fillDelay = 0.6,
  className = "",
}: Props) {
  const strokeRef = useRef<SVGTextElement>(null);
  const fillRef = useRef<SVGTextElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  // Large enough to cover the longest glyph outline.
  const dash = fontSize * 7;

  // Measure after the font loads so the viewBox fits the real glyphs.
  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const node = strokeRef.current;
      if (cancelled || !node) return;
      const b = node.getBBox();
      if (!b.width) return;
      const pad = strokeWidth * 2;
      setBox({ x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 });
    };
    measure();
    document.fonts.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [lines, fontSize, fontWeight, lineHeight, strokeWidth]);

  useLayoutEffect(() => {
    const stroke = strokeRef.current;
    const fill = fillRef.current;
    if (!box || !stroke || !fill) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(stroke, { strokeDashoffset: 0 });
      gsap.set(fill, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo(stroke, { strokeDashoffset: dash }, { strokeDashoffset: 0, duration: drawDuration, ease: "power2.inOut" }, 0)
      .fromTo(fill, { opacity: 0 }, { opacity: 1, duration: drawDuration * 0.6, ease: "power1.out" }, fillDelay + drawDuration * 0.4);
    return () => {
      tl.kill();
    };
  }, [box, dash, drawDuration, fillDelay]);

  const viewBox = box
    ? `${box.x} ${box.y} ${box.width} ${box.height}`
    : `0 ${-fontSize} ${fontSize * 10} ${fontSize * lineHeight * lines.length}`;

  const tspans = lines.map((line, i) => (
      <tspan key={i} x="0" dy={i === 0 ? 0 : `${lineHeight}em`}>
        {line}
      </tspan>
  ));

  return (
    <span className={`block ${className}`}>
      <span className="sr-only">{lines.join(" ")}</span>
      <svg
        viewBox={viewBox}
        className="block h-auto w-full overflow-visible"
        style={{ visibility: box ? "visible" : "hidden" }}
        aria-hidden="true"
      >
        {/* Starts hidden (dashed out / transparent) so nothing flashes before the timeline runs. */}
        <text
          ref={strokeRef}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={dash}
          style={{ fontSize, fontWeight }}
        >
          {tspans}
        </text>
        <text
          ref={fillRef}
          fill="currentColor"
          opacity={0}
          style={{ fontSize, fontWeight }}
        >
          {tspans}
        </text>
      </svg>
    </span>
  );
}
