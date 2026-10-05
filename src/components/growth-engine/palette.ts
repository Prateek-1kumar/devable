import { Color, MeshBasicMaterial } from "three";

// The scene's colours come from the page tokens in globals.css, so the 3D
// follows a brand swap with no edits here. Everything is drawn unlit, like a
// technical illustration: flat faces whose shade is set per face direction
// (top lightest, front true, right a step darker), with ink outlines.
// Client-only: read on first use inside the (ssr: false) scene.

function read() {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();
  return {
    ink: token("--ink"),
    paper: token("--paper"),
    primary: token("--primary"),
    accent: token("--accent"),
    secondary: token("--secondary"),
    coral: token("--coral") || token("--secondary"),
    line: token("--line"),
    muted: token("--muted"),
    card: token("--card"),
    sage: token("--sage"),
    bodyFont: getComputedStyle(document.body).fontFamily,
    monoFont: `${token("--font-geist-mono")}, ui-monospace, monospace`,
  };
}

let colors: ReturnType<typeof read> | null = null;
export const palette = () => (colors ??= read());

/** `a` moved toward `b` by `k` (0..1), as a hex string. */
export const mix = (a: string, b: string, k: number) => `#${new Color(a).lerp(new Color(b), k).getHexString()}`;

/** Outline width in CSS pixels: thin, uniform technical lines. */
export const INK_PX = 1;
/** Outlines are ink softened toward the page: present, never harsh. */
export const edgeColor = () => mix(palette().ink, palette().paper, 0.6);

/** The three visible faces of a box, from the fixed isometric view. */
export type Face = "top" | "front" | "right";
/** How each visible face is shaded: toward white (top) or ink (right). */
export const SHADE: Record<Face, (color: string) => string> = {
  top: (c) => mix(c, "#ffffff", 0.12),
  front: (c) => c,
  right: (c) => mix(c, palette().ink || "#0f1a14", 0.16),
};

/**
 * Flat materials for a box's six faces (three's BoxGeometry order: +x, −x, +y, −y, +z, −z),
 * pushed back a hair so the ink outlines drawn on their edges always win the depth test.
 */
export function boxFaces(color: string, opts: { opacity?: number; top?: string } = {}) {
  const make = (face: Face | null) =>
    new MeshBasicMaterial({
      color: face === "top" && opts.top ? opts.top : face ? SHADE[face](color) : color,
      transparent: opts.opacity !== undefined,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.opacity === undefined,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
  return [make("right"), make(null), make("top"), make(null), make("front"), make(null)];
}

/** Recolours box faces made by `boxFaces` in place (for highlights), keeping the per-face shading. */
export function tintFaces(faces: MeshBasicMaterial[], color: Color, top?: Color) {
  faces[0].color.copy(color).lerp(inkColor(), 0.16);
  if (top) faces[2].color.copy(top);
  else faces[2].color.copy(color).lerp(WHITE, 0.12);
  faces[4].color.copy(color);
}
const inkColor = () => new Color(palette().ink || "#0f1a14");
const WHITE = new Color("#ffffff");
