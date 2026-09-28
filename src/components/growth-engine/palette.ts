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
// The flying tokens: a touch shinier, like soft vinyl toys.
const VINYL = { roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.15 };
// A little self-glow keeps pastels and whites luminous on the shaded faces instead of greying.
const LIFT = { emissive: "#ffffff", emissiveIntensity: 0.12 };

/** Ink outline width in pixels: thin, technical-illustration lines. */
export const INK_PX = 1;

/** Paints a vertical fade onto a centered mesh's vertices: `low` at the bottom into `high` at the top (use a `vertexColors` material). */
export function paintFade(mesh: Mesh, low: string, high: string, height: number) {
  const pos = mesh.geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const from = new Color(low);
  const to = new Color(high);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const k = Math.min(1, Math.max(0, pos.getY(i) / height + 0.5)); // 0 at the bottom, 1 at the top
    c.lerpColors(from, to, k * k * (3 - 2 * k));
    c.toArray(colors, i * 3);
  }
  mesh.geometry.setAttribute("color", new BufferAttribute(colors, 3));
}

/** `a` moved toward `b` by `k` (0..1), as a hex string. */
export const mix = (a: string, b: string, k: number) => `#${new Color(a).lerp(new Color(b), k).getHexString()}`;

/**
 * Glass-block tones per channel: the core fades from `low` (bottom) to `high` (top),
 * `edge` outlines it and its panel and trim, so borders blend with the color.
 */
export const GLASS_TONES = CHANNELS.map(({ color, pastel, deep }) => ({
  low: mix(color, "#ffffff", 0.35),
  high: mix(pastel, "#ffffff", 0.2),
  edge: mix(deep, color, 0.25),
  panel: mix(pastel, "#ffffff", 0.7),
  trim: mix(pastel, "#ffffff", 0.35),
}));

let colors: ReturnType<typeof read> | null = null;
export const palette = () => (colors ??= read());

function build() {
  const p = palette();
  return {
    /** Glazed ceramic: the cream bodies. */
    ceramic: new MeshPhysicalMaterial({ color: p.cream, ...GLOSS }),
    /** Glass-block cores: white, tinted per vertex with the channel's fade. */
    frost: new MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3, ...LIFT }),
    /**
     * Frosted glass shells around the cores, one pastel tint per channel: translucent,
     * glossy edges and a soft white rim. No outline: through glass an outline's
     * backing hull shows as a dark fill.
     */
    shell: CHANNELS.map(
      ({ pastel }) =>
        new MeshPhysicalMaterial({
          color: mix(pastel, "#ffffff", 0.5),
          transparent: true,
          opacity: 0.4,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          sheen: 1,
          sheenColor: "#ffffff",
          sheenRoughness: 0.4,
          depthWrite: false,
        }),
    ),
    /** Label panels, a whisper of their channel's tint. */
    panelTint: GLASS_TONES.map(({ panel }) => new MeshStandardMaterial({ color: panel, roughness: 0.5, emissive: "#ffffff", emissiveIntensity: 0.12 })),
    /** Trim bands under each block, in a light tint of the channel. */
    trimTint: GLASS_TONES.map(({ trim }) => new MeshStandardMaterial({ color: trim, metalness: 0.3, roughness: 0.35, emissive: "#ffffff", emissiveIntensity: 0.08 })),
    /** Puffy token bodies, one pastel per channel. */
    vinyl: CHANNELS.map(({ pastel }) => new MeshPhysicalMaterial({ color: pastel, ...VINYL, ...LIFT })),
    /** White vinyl for token details (arrows, play discs, search fields). */
    vinylWhite: new MeshPhysicalMaterial({ color: "#ffffff", ...VINYL, emissive: "#ffffff", emissiveIntensity: 0.2 }),
    /** Deep channel shades for small token accents (play triangle, sparkle core). */
    deep: CHANNELS.map(({ deep }) => new MeshPhysicalMaterial({ color: deep, ...VINYL })),
    /** Magnifier lens: faintly frosted glass. */
    lens: new MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, roughness: 0.1, clearcoat: 1, depthWrite: false }),
    /** White label panels on the slab fronts. */
    panel: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, emissive: "#ffffff", emissiveIntensity: 0.18 }),
    /** Brushed aluminum trim between slabs: light, so the seams stay crisp without weight. */
    alu: new MeshStandardMaterial({ color: "#e4e7eb", metalness: 0.45, roughness: 0.35 }),
    /** Anodized graphite rail: the one dark vertical accent. */
    metal: new MeshStandardMaterial({ color: p.ink, metalness: 0.55, roughness: 0.32 }),
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
    /** Lead pearls: white base so per-instance channel colors show true. */
    lead: new MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 }),
  };
}

let shared: ReturnType<typeof build> | null = null;
/** Materials shared by every part of the scene. */
export const materials = () => (shared ??= build());
