import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import { CHANNELS } from "../growth-engine/channels";
import { glowFromWithin } from "../growth-engine/palette";

// The race's own look: solid colored bodies with the main hero's materials
// (porcelain, champagne, aluminum, gold, glossy black). Color comes from the
// objects themselves: turf, tinted lanes, section-tinted concrete, seat shells.
// Client-only: materials are built on first use inside the (ssr: false) scene.

export const C = {
  PAGE: "#ffffff",
  CERAMIC: "#fbfdf9",
  PORCELAIN: "#f7f3ea",
  APRON: "#f2f4f1",
  CONCRETE_LOW: "#dde3ea",
  CONCRETE_HIGH: "#f6f7f9",
  TREAD: "#eef1f4",
  SEAT_EMPTY: "#c3cbd4",
  INK: "#0b0c0e",
  GLASS: "#0d1012",
  GOLD: "#d9b872",
  GOLD_GLOW: "#ffd98a",
  ALU: "#e4e7eb",
  TURF_LOW: "#34b877",
  TURF_HIGH: "#8fe3b4",
  FOREST: "#0c3b29",
  EMERALD: "#179a55",
  MINT: "#34d399",
  LIGHT_ON: "#fff4d6",
  LIGHT_OFF: "#2a2f36",
  AMBER: "#f5b301",
} as const;

export type RGB = [number, number, number];
/** A hex color as linear RGB (vertex colors are linear). */
export const rgb = (hex: string) => new Color(hex).toArray() as RGB;
/** Linear RGB a → b by k. */
export const lerp3 = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Glossy black: the monolith, board body, rails, posts. Ignores fog so black stays black. */
const inkParams = { color: C.INK, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, fog: false } as const;

/** Mowing bands: white and #e2e2e2 halves with a soft 1px blend, multiplied into the turf color. */
function mowing() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(31 / 64, "#ffffff");
    g.addColorStop(33 / 64, "#e2e2e2");
    g.addColorStop(63 / 64, "#e2e2e2");
    g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 8);
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(1 / 0.8, 1); // ShapeGeometry UVs are world units: 0.4u bands across the straights
  return t;
}

function build() {
  return {
    turf: glowFromWithin(new MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, map: mowing(), roughness: 0.8 }), 0.22),
    laneBand: glowFromWithin(new MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.4 }), 0.2),
    line: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.4, emissive: "#ffffff", emissiveIntensity: 0.35 }),
    apron: new MeshStandardMaterial({ color: C.APRON, roughness: 0.6, emissive: "#ffffff", emissiveIntensity: 0.15 }),
    ink: new MeshPhysicalMaterial(inkParams),
    /** The monolith's body: glossy black that flashes faintly white as the baton docks. */
    chip: new MeshPhysicalMaterial({ ...inkParams, emissive: "#ffffff", emissiveIntensity: 0 }),
    /** Cut faces and the die: glossy black, pulled forward so they never z-fight the tier ends. */
    poche: new MeshPhysicalMaterial({ ...inkParams, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    concrete: glowFromWithin(new MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.35 }), 0.32),
    fascia: new MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.35, metalness: 0.2 }),
    seat: glowFromWithin(new MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.2 }), 0.28),
    pilaster: new MeshStandardMaterial({ color: "#eef1f4", roughness: 0.5 }),
    runner: glowFromWithin(new MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }), 0.28),
    pearl: CHANNELS.map(
      ({ color }) =>
        new MeshPhysicalMaterial({ color, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, emissive: color, emissiveIntensity: 0.6 }),
    ),
    /** The site plinth: glazed ceramic with a little self-glow, so its broad top reads as white card under the low key. */
    plinth: new MeshPhysicalMaterial({ color: C.CERAMIC, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3, emissive: C.CERAMIC, emissiveIntensity: 0.32 }),
    seam: new MeshStandardMaterial({ color: C.EMERALD, roughness: 0.35, metalness: 0.2 }),
    cable: new MeshStandardMaterial({ color: C.INK, roughness: 0.45, fog: false }),
    mint: new MeshStandardMaterial({ color: C.MINT, roughness: 0.3, emissive: C.MINT, emissiveIntensity: 0.8 }),
  };
}

let shared: ReturnType<typeof build> | null = null;
/** The race's shared materials. */
export const look = () => (shared ??= build());
