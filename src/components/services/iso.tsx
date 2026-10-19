"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// A tiny isometric kit in CSS 3D (no WebGL), for the service-page illustrations: a tinted floor with a
// dashed grid, flat tiles, standing panels, boxes and soft-edged shadows, all with real HTML on them so text
// and avatars stay crisp.
//
// Coordinates are floor pixels: x runs up-right on screen, y runs down-right, z lifts toward the viewer.
// The visible sides of anything standing face +y (lower right) and −x (lower left).

const FLOOR = "rotateX(60deg) rotateZ(-45deg)";
const preserve: CSSProperties = { transformStyle: "preserve-3d" };

// Light scenes sit on tinted panels; dark scenes melt into a dark section (the floor is the background).
const THEMES = {
  light: {
    tone: "#e3eee6",
    line: "rgb(23 44 33 / 0.14)",
    shadow: "rgb(23 44 33 / 0.72)",
    edge: "1px solid rgb(23 44 33 / 0.55)",
    box: { top: "#ffffff", front: "#e4e9e5", side: "#c9d3cc" },
    flag: "border-ink/15 bg-white text-ink",
  },
  dark: {
    tone: "#1a1918",
    line: "rgb(255 255 255 / 0.07)",
    shadow: "rgb(0 0 0 / 0.55)",
    edge: "1px solid rgb(255 255 255 / 0.14)",
    box: { top: "#2c2b29", front: "#232220", side: "#1c1b19" },
    flag: "border-white/12 bg-[#232220] text-white/85",
  },
};
type Theme = (typeof THEMES)["light"];
const ThemeContext = createContext<Theme>(THEMES.light);
/** The active scene theme, for scenes that colour their own pieces. */
export const useIsoTheme = () => useContext(ThemeContext);

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
  theme = "light",
  className = "",
  children,
}: {
  w: number;
  h: number;
  /** Floor size in floor pixels. */
  floor: number;
  shift?: [number, number];
  grid?: number;
  theme?: keyof typeof THEMES;
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

  const t = THEMES[theme];
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
    <div ref={box} aria-hidden="true" className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${w} / ${h}`, background: t.tone }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${k})` }}>
        {/* The dashed grid, fading out toward the floor's edges; the scene sits on its own layer above. */}
        <div style={{ ...place, maskImage: "radial-gradient(closest-side, #000 60%, transparent)" }}>
          <GridLines size={floor} step={grid} line={t.line} />
        </div>
        <div style={place}>
          <ThemeContext value={t}>{children}</ThemeContext>
        </div>
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

/**
 * Splits a piece's style: the 3D wrapper takes position and motion, the visible leaf takes the fade.
 * Opacity below 1 on an element flattens its 3D subtree (CSS spec), so a fade on a wrapper lays standing
 * panels and labels flat mid-fade and snaps them upright at the end. Fading the leaf keeps them upright.
 */
function split(style?: CSSProperties) {
  const { opacity, transitionDelay, ...wrap } = style ?? {};
  const look: CSSProperties =
    opacity === undefined
      ? {}
      : { opacity, transition: wrap.transition === "none" ? "none" : `opacity 450ms ease-out ${transitionDelay ?? "0ms"}` };
  return { wrap, look };
}

/** A flat card lying on the floor (or floating at z), with a hard shadow under it like the references. */
export function Tile({ x, y, z = 0, w, h, shadow = true, className = "", style, children }: Place & { w: number; h: number; shadow?: boolean }) {
  const t = useIsoTheme();
  const { wrap, look } = split(style);
  return (
    <>
      {shadow && (
        <At x={x + 7} y={y + 7}>
          <div className="rounded-[3px]" style={{ width: w, height: h, background: t.shadow, ...look }} />
        </At>
      )}
      <At x={x} y={y} z={z + 1} style={wrap}>
        <div className={`rounded-[3px] ${className}`} style={{ width: w, height: h, ...look }}>
          {children}
        </div>
      </At>
    </>
  );
}

/** An upright panel standing on its bottom edge along x at (x, y), facing the viewer's lower right. */
export function Panel({ x, y, z = 0, w, h, shadow = true, className = "", style, children }: Place & { w: number; h: number; shadow?: boolean }) {
  const t = useIsoTheme();
  const { wrap, look } = split(style);
  return (
    <>
      {shadow && (
        <At x={x + 4} y={y}>
          <div style={{ width: w, height: 22, background: t.shadow, ...look }} />
        </At>
      )}
      <At x={x} y={y} z={z} style={wrap}>
        <div
          className={className}
          style={{ position: "absolute", left: 0, top: -h, width: w, height: h, transformOrigin: "bottom", transform: "rotateX(-90deg)", ...look }}
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
  top,
  front,
  side,
  shadow = true,
  style,
  children,
  frontChildren,
}: Place & { w: number; d: number; h: number; top?: string; front?: string; side?: string; shadow?: boolean; frontChildren?: ReactNode }) {
  const t = useIsoTheme();
  const { wrap, look } = split(style);
  const edge = t.edge;
  top ??= t.box.top;
  front ??= t.box.front;
  side ??= t.box.side;
  return (
    <>
      {shadow && (
        <At x={x + 10} y={y + 10}>
          <div style={{ width: w, height: d, background: t.shadow, ...look }} />
        </At>
      )}
      <At x={x} y={y} z={z} style={wrap}>
        <div style={{ position: "absolute", width: w, height: d, transform: `translateZ(${h}px)`, background: top, border: edge, ...look }} className="grid place-items-center">
          {children}
        </div>
        <div
          style={{ position: "absolute", left: 0, top: d - h, width: w, height: h, transformOrigin: "bottom", transform: "rotateX(-90deg)", background: front, border: edge, ...look }}
          className="grid place-items-center"
        >
          {frontChildren}
        </div>
        <div style={{ position: "absolute", left: -h, top: 0, width: h, height: d, transformOrigin: "right", transform: "rotateY(90deg)", background: side, border: edge, ...look }} />
      </At>
    </>
  );
}

/**
 * A label pinned to a point in the scene but always facing the reader (it undoes the floor's tilt), so it
 * stays upright and easy to read however the scene is drawn. Its bottom-left corner sits on the point.
 */
export function Flag({ x, y, z = 0, children, tone, style }: Place & { tone?: string }) {
  const t = useIsoTheme();
  const { wrap, look } = split(style);
  return (
    <At x={x} y={y} z={z} style={wrap}>
      <div
        className={`absolute bottom-0 left-0 flex items-center gap-2 rounded-[4px] border px-2.5 py-1.5 font-mono text-[10.5px] leading-none tracking-[0.08em] whitespace-nowrap uppercase ${tone ?? t.flag}`}
        style={{ transformOrigin: "bottom left", transform: "rotateZ(45deg) rotateX(-60deg)", ...look }}
      >
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
        {children}
      </div>
    </At>
  );
}
