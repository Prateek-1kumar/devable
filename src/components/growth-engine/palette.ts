import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";

// Scene colors come from the page tokens so the 3D matches the UI.
// Client-only: read on first use inside the (ssr: false) scene.

function read() {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();
  return {
    cream: token("--pixel-light"),
    stone: token("--pixel-stone"),
    teal: token("--accent"),
    coral: token("--coral"),
    amber: token("--amber"),
    ink: token("--forest"),
    lime: token("--lime"),
    bodyFont: getComputedStyle(document.body).fontFamily,
    headingFont: token("--font-geist-sans"),
  };
}

/**
 * The stack's glaze, 01 depth → 04 reach: deep emerald rising to mint, so the
 * slabs literally read from depth to reach. `cap` inks the side caption.
 */
export const GLAZE = [
  { color: "#2e8a57", cap: "#ffffff" },
  { color: "#56a877", cap: "#ffffff" },
  { color: "#93cfa3", cap: "#0c3b29" },
  { color: "#d4efd9", cap: "#0c3b29" },
];

// Glossy glaze: a soft base with a sharp clearcoat that catches the studio lights.
const GLOSS = { roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.18 };

/** Ink outline width in pixels, on silhouettes and main seams. */
export const INK_PX = 1.5;

let colors: ReturnType<typeof read> | null = null;
export const palette = () => (colors ??= read());

function build() {
  const p = palette();
  return {
    /** Glazed ceramic: the cream bodies. */
    ceramic: new MeshPhysicalMaterial({ color: p.cream, ...GLOSS }),
    /** One glaze per stack layer, by index. */
    glaze: GLAZE.map(({ color }) => new MeshPhysicalMaterial({ color, ...GLOSS })),
    /** Anodized forest trim and rail: crisp dark seams between the glazed slabs. */
    metal: new MeshStandardMaterial({ color: p.ink, metalness: 0.55, roughness: 0.32 }),
    /**
     * The devices (terminal, monitor): warm glossy porcelain, deliberately not green.
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
    stone: new MeshStandardMaterial({ color: p.stone, roughness: 0.75 }),
    coralEnamel: new MeshPhysicalMaterial({ color: p.coral, roughness: 0.35, clearcoat: 0.6 }),
    tealEnamel: new MeshPhysicalMaterial({ color: p.teal, roughness: 0.35, clearcoat: 0.6 }),
    /** Glassy amber pearls: the signal and the leads. */
    pearl: new MeshPhysicalMaterial({
      color: p.amber,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: p.amber,
      emissiveIntensity: 0.45,
    }),
  };
}

let shared: ReturnType<typeof build> | null = null;
/** Materials shared by every part of the scene. */
export const materials = () => (shared ??= build());
