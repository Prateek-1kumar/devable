import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";

// Scene colors come from the page tokens so the 3D matches the UI.
// Amber and ink are local accents, like ArcButton's sweep colors.
// Client-only: read on first use inside the (ssr: false) scene.

function read() {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();
  return {
    cream: token("--pixel-light"),
    stone: token("--pixel-stone"),
    teal: token("--accent"),
    coral: token("--coral"),
    amber: "#fcb401",
    ink: "#031819",
    bodyFont: getComputedStyle(document.body).fontFamily,
    headingFont: token("--font-outfit"),
  };
}

/** Ink outline width in pixels, on silhouettes and main seams. */
export const INK_PX = 1.5;

let colors: ReturnType<typeof read> | null = null;
export const palette = () => (colors ??= read());

function build() {
  const p = palette();
  return {
    /** Glazed ceramic: the cream bodies. */
    ceramic: new MeshPhysicalMaterial({ color: p.cream, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    /** Anodized teal trim and rail. */
    metal: new MeshStandardMaterial({ color: p.teal, metalness: 0.55, roughness: 0.32 }),
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
