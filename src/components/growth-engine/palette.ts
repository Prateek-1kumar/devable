import { BufferAttribute, Color, MeshPhysicalMaterial, MeshStandardMaterial, type Mesh } from "three";
import { CHANNELS } from "./channels";

// A neutral stage (porcelain, graphite, soft white) so the four channel colors
// are the only vivid things in the scene. Page tokens where they apply.
// Client-only: read on first use inside the (ssr: false) scene.

function read() {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();
  return {
    cream: token("--ceramic"),
    stone: "#dcdfe3", // soft neutral grey: the cable, unlit lights
    ink: "#16191d", // graphite: device outlines, screens
    slate: "#8a94a0", // soft edge for light neutral parts (rail)
    signal: "#ffffff", // your devtool's signal is white light until a channel colors it
    live: "#34d399", // the monitor's live dot
    bodyFont: getComputedStyle(document.body).fontFamily,
    headingFont: token("--font-geist-sans"),
  };
}

// Soft satin: mostly matte with a light clearcoat, so shapes read by form, not gloss.
const GLOSS = { roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3 };
// A little self-glow keeps pastels and whites luminous on the shaded faces instead of greying.
const LIFT = { emissive: "#ffffff", emissiveIntensity: 0.12 };

/** Ink outline width in pixels: thin, technical-illustration lines. */
export const INK_PX = 1;

/**
 * Paints a fade onto a centered mesh's vertices (use a `vertexColors` material):
 * `low` at the bottom into `high` at the top. `sweep` (0..1) blends in a diagonal
 * across the front and right faces, so the fade also travels around the visible corner.
 */
export function paintFade(mesh: Mesh, low: string, high: string, height: number, sweep = 0) {
  const pos = mesh.geometry.attributes.position;
  mesh.geometry.computeBoundingBox();
  const width = mesh.geometry.boundingBox?.max.x ?? 1;
  const colors = new Float32Array(pos.count * 3);
  const from = new Color(low);
  const to = new Color(high);
  const c = new Color();
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  for (let i = 0; i < pos.count; i++) {
    const rise = clamp(pos.getY(i) / height + 0.5); // 0 at the bottom, 1 at the top
    const across = clamp((pos.getX(i) - pos.getZ(i)) / (4 * width) + 0.5); // front-left edge → back-right edge
    const k = (1 - sweep) * rise + sweep * across;
    c.lerpColors(from, to, k * k * (3 - 2 * k));
    c.toArray(colors, i * 3);
  }
  mesh.geometry.setAttribute("color", new BufferAttribute(colors, 3));
}

/** `a` moved toward `b` by `k` (0..1), as a hex string. */
export const mix = (a: string, b: string, k: number) => `#${new Color(a).lerp(new Color(b), k).getHexString()}`;

/**
 * Block tones per channel: the body fades from `low` to `high`, `seam` is the thin
 * band that separates it from the block below, `panel` its label plate and `edge`
 * a deep tone for fine lines (the route pucks).
 */
export const TONES = CHANNELS.map(({ color, pastel, deep }) => ({
  low: mix(color, "#ffffff", 0.3),
  high: mix(pastel, "#ffffff", 0.25),
  seam: mix(color, "#ffffff", 0.05),
  panel: mix(pastel, "#ffffff", 0.75),
  edge: mix(deep, color, 0.25),
}));

let colors: ReturnType<typeof read> | null = null;
export const palette = () => (colors ??= read());

function build() {
  const p = palette();
  return {
    /** Glazed ceramic: the cream bodies. */
    ceramic: new MeshPhysicalMaterial({ color: p.cream, ...GLOSS }),
    /** Block bodies: white, tinted per vertex with the channel's fade; a crisp clearcoat glints on the edges. */
    frost: new MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.12, ...LIFT }),
    /** Label panels, a whisper of their channel's tint. */
    panelTint: TONES.map(({ panel }) => new MeshStandardMaterial({ color: panel, roughness: 0.5, emissive: "#ffffff", emissiveIntensity: 0.12 })),
    /** The thin seam under each block, in the channel's full tone. */
    seam: TONES.map(({ seam }) => new MeshStandardMaterial({ color: seam, roughness: 0.35, metalness: 0.2 })),
    /** White label panels on the slab fronts. */
    panel: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, emissive: "#ffffff", emissiveIntensity: 0.18 }),
    /** Brushed aluminum: the signal rail and cable collars. */
    alu: new MeshStandardMaterial({ color: "#e4e7eb", metalness: 0.45, roughness: 0.35 }),
    /**
     * The devices (terminal, monitor): warm glossy porcelain.
     * A small self-glow lifts the shaded faces so white reads as white, not grey.
     */
    porcelain: new MeshPhysicalMaterial({
      color: "#f7f3ea",
      emissive: "#f7f3ea",
      emissiveIntensity: 0.2,
      roughness: 0.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    }),
    /** Brushed champagne metal: device trim and the frame around each screen. */
    champagne: new MeshStandardMaterial({ color: "#dcc08a", metalness: 0.6, roughness: 0.3 }),
    /** Neutral black glass behind the device screens. */
    glass: new MeshStandardMaterial({ color: "#0d1012", roughness: 0.15, metalness: 0.2 }),
    /** Dark glossy panels and screens. */
    screen: new MeshStandardMaterial({ color: p.ink, roughness: 0.3, metalness: 0.15 }),
    stone: new MeshStandardMaterial({ color: p.stone, roughness: 0.6 }),
    /** Glowing white pearls: the signal on its way up the cable and rail. */
    pearl: new MeshPhysicalMaterial({
      color: p.signal,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: p.signal,
      emissiveIntensity: 0.6,
    }),
  };
}

let shared: ReturnType<typeof build> | null = null;
/** Materials shared by every part of the scene. */
export const materials = () => (shared ??= build());
