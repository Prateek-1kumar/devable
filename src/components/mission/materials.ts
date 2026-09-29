import { CanvasTexture, RepeatWrapping } from "three";
import { mulberry32 } from "./world";

// The satellite's surface maps that are not paint: crinkled MLI foil as a tangent-space normal map.
// Client-only, built on first use and shared.

/**
 * Crinkled foil: seeded random triangular facets, each tilted up to `tilt` (radians) in a random
 * direction, drawn as tangent-space normals on a flat (128,128,255) ground; a second, finer octave
 * of creases goes on top at lower contrast. Repeat-wrapped so faces can tile it.
 */
function crinkleNormal(seed: number, facets: number, tilt: number) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rand = mulberry32(seed);
    ctx.save();
    ctx.fillStyle = "rgb(128,128,255)";
    ctx.fillRect(0, 0, S, S);
    const octave = (n: number, size: number, t: number, alpha: number) => {
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const k = Math.sin(t * rand());
        const [nx, ny] = [Math.cos(a) * k, Math.sin(a) * k];
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        ctx.fillStyle = `rgba(${Math.round((nx * 0.5 + 0.5) * 255)},${Math.round((ny * 0.5 + 0.5) * 255)},${Math.round((nz * 0.5 + 0.5) * 255)},${alpha})`;
        const [x, y] = [rand() * S, rand() * S];
        // Drawn at the wrap offsets too, so the tile has no seam.
        for (const [ox, oy] of [[0, 0], [-S, 0], [0, -S], [-S, -S]]) {
          ctx.beginPath();
          ctx.moveTo(x + ox, y + oy);
          ctx.lineTo(x + ox + (rand() - 0.5) * size, y + oy + (rand() - 0.5) * size);
          ctx.lineTo(x + ox + (rand() - 0.5) * size, y + oy + (rand() - 0.5) * size);
          ctx.closePath();
          ctx.fill();
        }
      }
    };
    octave(facets, 220, tilt, 1);
    octave(facets * 3, 60, tilt * 0.6, 0.55); // the fine-crease octave
    ctx.restore();
  }
  const t = new CanvasTexture(canvas); // normals: no colour space
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function build() {
  return {
    /** Gold MLI: big soft crinkles. */
    goldCrinkle: crinkleNormal(3, 70, 0.5),
    /** Black MLI on the front face: fewer, flatter crinkles. */
    blackCrinkle: crinkleNormal(11, 45, 0.35),
  };
}

let shared: ReturnType<typeof build> | null = null;
export const missionMaps = () => (shared ??= build());
