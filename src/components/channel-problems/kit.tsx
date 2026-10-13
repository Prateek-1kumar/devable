"use client";

import { createContext, useContext, useLayoutEffect, useRef, type ReactNode, type Ref, type RefObject } from "react";
import { extend, useFrame, useThree, type ThreeElement } from "@react-three/fiber";
import { Html, shaderMaterial } from "@react-three/drei";
import { Color, Group, Quaternion, ShaderMaterial, Vector3, type ColorRepresentation } from "three";
import { palette } from "../growth-engine/palette";

// Shared bits for the four channel-problem scenes: a 1-bit dot-dither
// material (the "printed on a terminal" look), a story clock, and crisp
// HTML tags pinned to points in the scene.

export const WHITE = "#f2f2ee";
export const BG = "#000000";
export const green = () => palette().primary;

// ── Timing ───────────────────────────────────────────────────
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Eased 0→1 progress of `t` between `a` and `b`. */
export const seg = (t: number, a: number, b: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ── Dither material ──────────────────────────────────────────
const CELL = 2.5; // CSS px per dot

const vertexShader = /* glsl */ `
  varying vec3 vN;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Lambert shade → 4×4 Bayer threshold → round dot per screen cell.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBg;
  uniform float uLevel;
  uniform float uCell;
  uniform vec3 uLight;
  varying vec3 vN;
  float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  void main() {
    float shade = (max(dot(normalize(vN), uLight), 0.0) * 0.95 + 0.06) * uLevel;
    vec2 c = gl_FragCoord.xy / uCell;
    float on = step(bayer4(floor(c)) + 0.03, shade);
    float d = length(fract(c) - 0.5);
    float dotMask = 1.0 - smoothstep(0.32, 0.46, d);
    gl_FragColor = vec4(mix(uBg, uColor, on * dotMask), 1.0);
    #include <colorspace_fragment>
  }
`;

// Top reads near-solid, front mid, right side sparse, so each face stays distinct.
const LIGHT = new Vector3(0.3, 1, 0.55).normalize();

const DitherMaterial = shaderMaterial(
  { uColor: new Color(WHITE), uBg: new Color(BG), uLevel: 1, uCell: CELL, uLight: LIGHT },
  vertexShader,
  fragmentShader,
);
extend({ DitherMaterial });
declare module "@react-three/fiber" {
  interface ThreeElements {
    ditherMaterial: ThreeElement<typeof DitherMaterial>;
  }
}
/** Animate through a ref: `m.current.uColor.lerpColors(…)`, `m.current.uLevel = …`. */
export type DitherMat = ShaderMaterial & { uColor: Color; uLevel: number };

export function Dither({ color = WHITE, level = 1, ref }: { color?: ColorRepresentation; level?: number; ref?: Ref<DitherMat> }) {
  const dpr = useThree((s) => s.viewport.dpr);
  return <ditherMaterial ref={ref as Ref<never>} uColor={color} uLevel={level} uCell={CELL * dpr} />;
}

// ── Stage: iso camera, story clock, hover boost ──────────────
type Clock = RefObject<number>;
const ClockContext = createContext<Clock | null>(null);
export const useStory = () => useContext(ClockContext)!;
// CSS px per world unit, so HTML text can be sized to a part of the scene.
const ZoomContext = createContext(100);
export const useZoom = () => useContext(ZoomContext);

type StageProps = {
  /** Loop length in seconds. */
  loop: number;
  /** Frame shown when motion is reduced. */
  poster: number;
  still: boolean;
  hover: RefObject<boolean>;
  /** World [width, height] that must fit the canvas. */
  view: readonly [number, number];
  children: ReactNode;
};

const FADE = 0.5; // s, canvas fade in/out around each loop so the reset never jumps

export function Stage({ loop, poster, still, hover, view, children }: StageProps) {
  const clock = useRef(still ? poster : 0);
  const speed = useRef(1);
  const root = useRef<Group>(null);
  const { width, height } = useThree((s) => s.size);
  const get = useThree((s) => s.get);
  const zoom = Math.min(width / view[0], height / view[1]);

  useLayoutEffect(() => {
    const { camera, invalidate } = get();
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, zoom]);

  useFrame(({ events }, dt) => {
    if (still) return;
    const on = hover.current;
    speed.current = lerp(speed.current, on ? 1.8 : 1, 0.08);
    clock.current = (clock.current + Math.min(dt, 0.1) * speed.current) % loop;
    const t = clock.current;
    // Fades the canvas and its HTML tags together (both live in the connected element).
    const box = events.connected as HTMLElement | undefined;
    if (box) box.style.opacity = String(Math.min(seg(t, 0, FADE), 1 - seg(t, loop - FADE, loop)));
    if (root.current) root.current.rotation.y = lerp(root.current.rotation.y, on ? -0.14 : 0, 0.06);
  });

  return (
    <ClockContext value={clock}>
      <ZoomContext value={zoom}>
        <group ref={root}>{children}</group>
      </ZoomContext>
    </ClockContext>
  );
}

// ── Tag: crisp HTML text pinned to a point in the scene ─────
const TONES = {
  dim: "border-white/15 text-white/70",
  white: "border-white/30 text-white",
  green: "border-primary/45 text-primary",
};
const ANCHOR = { center: "-50%,-50%", left: "0,-50%", right: "-100%,-50%", above: "-50%,-100%", top: "-50%,0" };

type TagProps = {
  children: ReactNode;
  position: [number, number, number];
  tone?: keyof typeof TONES;
  anchor?: keyof typeof ANCHOR;
  /** Drop the chip border/fill, for text that sits on a dark card. */
  bare?: boolean;
  className?: string;
  /** Keep the text's own case instead of the chip's uppercase. */
  plain?: boolean;
  /** Wrap the text at this width (CSS px) instead of keeping it on one line. */
  width?: number;
  ref?: Ref<HTMLSpanElement>;
};

export function Tag({ children, position, tone = "dim", anchor = "center", bare, plain, className = "", width, ref }: TagProps) {
  return (
    <Html position={position} zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
      <span
        ref={ref}
        style={{ transform: `translate(${ANCHOR[anchor]})`, width }}
        className={`block ${width ? "whitespace-normal" : "whitespace-nowrap"} font-mono text-[12px] leading-none tracking-[0.06em] ${
          bare ? "" : `rounded-[3px] border bg-black/85 px-1.5 py-[5px] ${plain ? "" : "uppercase"}`
        } ${TONES[tone]} ${className}`}
      >
        {children}
      </span>
    </Html>
  );
}

/** Sets a tag's opacity from a frame loop. */
export const show = (el: HTMLElement | null, k: number) => {
  if (el) el.style.opacity = String(k);
};

/** A thin box from `a` to `b`, for struts and beams. */
export function strut(a: Vector3, b: Vector3) {
  const dir = b.clone().sub(a);
  const length = dir.length();
  return {
    position: a.clone().add(b).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()),
    length,
  };
}
