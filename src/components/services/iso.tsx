"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// A tiny isometric kit in CSS 3D (no WebGL), for the service-page illustrations: a tinted floor with a
// dashed grid, flat tiles, standing panels, boxes and soft-edged shadows, all with real HTML on them so text
// and avatars stay crisp.
//
// Coordinates are floor pixels: x runs up-right on screen, y runs down-right, z lifts toward the viewer.
// The visible sides of anything standing face +y (lower right) and −x (lower left).

const FLOOR = "rotateX(60deg) rotateZ(-45deg)";
const preserve: CSSProperties = { transformStyle: "preserve-3d" };

/**
 * A fixed-size drawing (`w`×`h` design pixels) scaled to fit its container's width, so a scene is authored
 * once and stays sharp at any size. The floor is centered and can be nudged with `shift`.
 */
export function IsoScene({
  w,
  h,
  floor,
  shift = [0, 0],
  grid = 48,
  tone = "#e3eee6",
  line = "rgb(23 44 33 / 0.14)",
  className = "",
  children,
}: {
  w: number;
  h: number;
  /** Floor size in floor pixels. */
  floor: number;
  shift?: [number, number];
  grid?: number;
  tone?: string;
  line?: string;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  const place: CSSProperties = {
    ...preserve,
    position: "absolute",
    width: floor,
    height: floor,
    left: w / 2 - floor / 2 + shift[0],
    top: h / 2 - floor / 2 + shift[1],
    transform: FLOOR,
  };
  return (
    <div ref={box} aria-hidden="true" className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${w} / ${h}`, background: tone }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${k})` }}>
        {/* The dashed grid, fading out toward the floor's edges; the scene sits on its own layer above. */}
        <div style={{ ...place, maskImage: "radial-gradient(closest-side, #000 60%, transparent)" }}>
          <GridLines size={floor} step={grid} line={line} />
        </div>
        <div style={place}>{children}</div>
      </div>
    </div>
  );
}

function GridLines({ size, step, line }: { size: number; step: number; line: string }) {
  const n = Math.floor(size / step);
  const dashes = `repeating-linear-gradient(90deg, ${line} 0 6px, transparent 6px 12px)`;
  const dashesV = `repeating-linear-gradient(180deg, ${line} 0 6px, transparent 6px 12px)`;
  return (
    <>
      {Array.from({ length: n + 1 }, (_, i) => (
        <span key={`h${i}`} className="absolute left-0 h-px w-full" style={{ top: i * step, backgroundImage: dashes }} />
      ))}
      {Array.from({ length: n + 1 }, (_, i) => (
        <span key={`v${i}`} className="absolute top-0 h-full w-px" style={{ left: i * step, backgroundImage: dashesV }} />
      ))}
    </>
  );
}

type Place = { x: number; y: number; z?: number; className?: string; style?: CSSProperties; children?: ReactNode };

/** Anything placed on the floor at (x, y), lifted by z. */
export function At({ x, y, z = 0, className = "", style, children }: Place) {
  return (
    <div className={`absolute ${className}`} style={{ ...preserve, left: x, top: y, transform: `translateZ(${z}px)`, transition: "transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 500ms", ...style }}>
      {children}
    </div>
  );
}

/** A flat card lying on the floor (or floating at z), with a hard shadow under it like the references. */
export function Tile({ x, y, z = 0, w, h, shadow = true, className = "", style, children }: Place & { w: number; h: number; shadow?: boolean }) {
  return (
    <>
      {shadow && (
        <At x={x + 7} y={y + 7} style={{ opacity: style?.opacity }}>
          <div className="rounded-[3px] bg-ink/70" style={{ width: w, height: h }} />
        </At>
      )}
      <At x={x} y={y} z={z + 1} style={style}>
        <div className={`rounded-[3px] ${className}`} style={{ width: w, height: h }}>
          {children}
        </div>
      </At>
    </>
  );
}

/** An upright panel standing on its bottom edge along x at (x, y), facing the viewer's lower right. */
export function Panel({ x, y, z = 0, w, h, shadow = true, className = "", style, children }: Place & { w: number; h: number; shadow?: boolean }) {
  return (
    <>
      {shadow && (
        <At x={x + 4} y={y} style={{ opacity: style?.opacity }}>
          <div className="bg-ink/75" style={{ width: w, height: 22 }} />
        </At>
      )}
      <At x={x} y={y} z={z} style={style}>
        <div
          className={className}
          style={{ position: "absolute", left: 0, top: -h, width: w, height: h, transformOrigin: "bottom", transform: "rotateX(-90deg)" }}
        >
          {children}
        </div>
      </At>
    </>
  );
}

/** A box w (x) × d (y) × h (z): top face (with `children` on it), front face (+y) and side face (−x). */
export function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  top = "#ffffff",
  front = "#e4e9e5",
  side = "#c9d3cc",
  shadow = true,
  style,
  children,
  frontChildren,
}: Place & { w: number; d: number; h: number; top?: string; front?: string; side?: string; shadow?: boolean; frontChildren?: ReactNode }) {
  const edge = "1px solid rgb(23 44 33 / 0.55)";
  return (
    <>
      {shadow && (
        <At x={x + 10} y={y + 10} style={{ opacity: style?.opacity }}>
          <div className="bg-ink/80" style={{ width: w, height: d }} />
        </At>
      )}
      <At x={x} y={y} z={z} style={style}>
        <div style={{ position: "absolute", width: w, height: d, transform: `translateZ(${h}px)`, background: top, border: edge }} className="grid place-items-center">
          {children}
        </div>
        <div
          style={{ position: "absolute", left: 0, top: d - h, width: w, height: h, transformOrigin: "bottom", transform: "rotateX(-90deg)", background: front, border: edge }}
          className="grid place-items-center"
        >
          {frontChildren}
        </div>
        <div style={{ position: "absolute", left: -h, top: 0, width: h, height: d, transformOrigin: "right", transform: "rotateY(90deg)", background: side, border: edge }} />
      </At>
    </>
  );
}

/** A small floating label flag (like "Report", "Table" in the references), standing up at z. */
export function Flag({ x, y, z = 0, children, tone = "bg-[#e7f9d9]", style }: Place & { tone?: string }) {
  return (
    <At x={x} y={y} z={z} style={style}>
      <div
        className={`absolute bottom-0 left-0 border border-ink/60 px-2 py-[3px] font-mono text-[11px] tracking-[0.04em] whitespace-nowrap text-ink ${tone}`}
        style={{ transformOrigin: "bottom left", transform: "rotateX(-90deg)" }}
      >
        {children}
      </div>
    </At>
  );
}
