import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";
import { mulberry32 } from "./world";

// The mission's own materials, on top of the shared studio set in palette.ts
// (champagne, alu, porcelain, panel tints, seams). Client-only, built on first use.

/**
 * Crinkled foil: seeded random facets in greys lo..hi on a mid-grey ground. The same facets
 * (same seed) feed the roughness map and, compressed to a light tint, the colour map, so the
 * crinkle reads as facets at a distance and not only in the highlight.
 */
function crinkle(lo: number, hi: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rand = mulberry32(3);
    ctx.save();
    const bg = Math.round((lo + hi) / 2);
    ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const g = Math.round(lo + (hi - lo) * rand());
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      const [x, y] = [rand() * 256, rand() * 256];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 120, y + (rand() - 0.5) * 120);
      ctx.lineTo(x + (rand() - 0.5) * 120, y + (rand() - 0.5) * 120);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  return new CanvasTexture(canvas);
}

const srgb = (t: CanvasTexture) => ((t.colorSpace = SRGBColorSpace), t);

function build() {
  return {
    /** The main chip's black: deep gloss under a crisp clearcoat. */
    blackGloss: new MeshPhysicalMaterial({ color: "#0b0c0e", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }),
    graphite: new MeshStandardMaterial({ color: "#23272c", roughness: 0.5, metalness: 0.3 }),
    glassBlack: new MeshPhysicalMaterial({ color: "#111317", roughness: 0.15, metalness: 0.2, clearcoat: 1 }),
    // Less metal than real foil and a little self-glow: against the studio's mostly dark environment
    // a metallic gold reflects black on the side faces and reads brown or khaki.
    goldFoil: new MeshStandardMaterial({
      color: "#e2b95a",
      metalness: 0.35,
      roughness: 0.4,
      map: srgb(crinkle(217, 255)),
      roughnessMap: crinkle(90, 200),
      emissive: "#e2b95a",
      emissiveIntensity: 0.22,
    }),
    towerSteel: new MeshPhysicalMaterial({ color: "#0f3d2b", roughness: 0.5, metalness: 0.25, clearcoat: 0.3 }),
    lens: new MeshPhysicalMaterial({ color: "#0d2a2f", roughness: 0.05, clearcoat: 1 }),
  };
}

let shared: ReturnType<typeof build> | null = null;
export const missionMaterials = () => (shared ??= build());

// ── Flame colour ramp ────────────────────────────────────────────────────
const FLAME_STOPS: [number, string][] = [
  [0, "#fffdf5"],
  [0.12, "#fff0c2"],
  [0.35, "#ffc65c"],
  [0.62, "#ff8a3d"],
  [0.85, "#ff6a3d"],
  [1, "#ffb48a"],
];
const STOPS = FLAME_STOPS.map(([t, c]) => [t, new Color(c)] as const);
/** Writes the plume colour at t (0 nozzle → 1 tail) into `out` and returns its alpha (solid to 0.7, then fading out). */
export function flameRamp(t: number, out: Color) {
  const u = Math.min(1, Math.max(0, t));
  let j = 0;
  while (j < STOPS.length - 2 && u > STOPS[j + 1][0]) j++;
  const [[t0, c0], [t1, c1]] = [STOPS[j], STOPS[j + 1]];
  out.lerpColors(c0, c1, (u - t0) / (t1 - t0));
  return u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
}
