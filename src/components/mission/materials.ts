import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { glowFromWithin } from "../growth-engine/palette";
import { mulberry32 } from "./world";

// The mission's own materials, on top of the shared studio set in palette.ts
// (champagne, alu, porcelain, panel tints, seams). Client-only, built on first use.

/** Crinkled foil: a roughness map of seeded random facets, so the gold breaks the light up. */
function crinkle() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rand = mulberry32(3);
    ctx.save();
    ctx.fillStyle = "rgb(140,140,140)";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const g = Math.round(90 + 110 * rand());
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

function build() {
  return {
    /** The main chip's black: deep gloss under a crisp clearcoat. */
    blackGloss: new MeshPhysicalMaterial({ color: "#0b0c0e", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }),
    graphite: new MeshStandardMaterial({ color: "#23272c", roughness: 0.5, metalness: 0.3 }),
    glassBlack: new MeshPhysicalMaterial({ color: "#111317", roughness: 0.15, metalness: 0.2, clearcoat: 1 }),
    // Less metal than real foil and a little self-glow: against the studio's mostly dark environment
    // a fully metallic gold reflects black on the side faces and reads brown.
    goldFoil: new MeshStandardMaterial({ color: "#d4a94f", metalness: 0.6, roughness: 0.55, roughnessMap: crinkle(), emissive: "#d4a94f", emissiveIntensity: 0.14 }),
    towerSteel: new MeshPhysicalMaterial({ color: "#0f3d2b", roughness: 0.5, metalness: 0.25, clearcoat: 0.3 }),
    livery: new MeshPhysicalMaterial({ color: "#179a55", roughness: 0.35, clearcoat: 0.5 }),
    /** Pearls glow in their instance colour (instanceColor feeds vColor). */
    pearl: glowFromWithin(new MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 })),
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
