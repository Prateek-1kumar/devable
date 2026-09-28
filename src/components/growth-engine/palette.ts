import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
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
    ink: "#16191d", // graphite: outlines, rail, trim, panels
    signal: "#ffffff", // your devtool's signal is white light until a channel colors it
    live: "#34d399", // the monitor's live dot
    bodyFont: getComputedStyle(document.body).fontFamily,
    headingFont: token("--font-geist-sans"),
  };
}

// Glossy glaze: a soft base with a sharp clearcoat that catches the studio lights.
const GLOSS = { roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.18 };
// Vinyl-toy gloss for the flying tokens: smoother and shinier than the slabs.
const VINYL = { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 };

/** Ink outline width in pixels, on silhouettes and main seams. */
export const INK_PX = 1.5;

let colors: ReturnType<typeof read> | null = null;
export const palette = () => (colors ??= read());

function build() {
  const p = palette();
  return {
    /** Glazed ceramic: the cream bodies. */
    ceramic: new MeshPhysicalMaterial({ color: p.cream, ...GLOSS }),
    /** One glaze per stack layer, in its channel's color. */
    glaze: CHANNELS.map(({ color }) => new MeshPhysicalMaterial({ color, ...GLOSS })),
    /** Puffy token bodies, one per channel. */
    vinyl: CHANNELS.map(({ color }) => new MeshPhysicalMaterial({ color, ...VINYL })),
    /** White vinyl for token details (arrows, play discs, search fields). */
    vinylWhite: new MeshPhysicalMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.15, ...VINYL }),
    /** Anodized graphite trim and rail: crisp dark seams between the glazed slabs. */
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
