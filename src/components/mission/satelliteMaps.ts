import { drawMark } from "../growth-engine/EngineCore";
import { mulberry32 } from "./world";

// Canvas painters for the satellite (module-level so useCanvasTexture gets stable functions).
// Every painter saves and restores its own state: the canvas is reused on repaint.

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const rgb = ([r, g, b]: number[]) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

/** Cell grid on one array panel: 8 cells along the wing (canvas x) by 6 across (canvas y). */
export const CELLS_ALONG = 8;
export const CELLS_ACROSS = 6;

/**
 * One solar panel's cell side: rectangular cells with chamfered corners in deep blue with a little
 * jitter, silver busbars and faint fingers, dark gaps, inside the aluminium frame.
 */
export function drawCells(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = mulberry32(7);
  const [lo, hi] = [hex("#1b2447"), hex("#22305e")];
  ctx.save();
  ctx.fillStyle = "#15171c";
  ctx.fillRect(0, 0, w, h);
  // Frame: 0.006 of 0.24 along, of 0.18 across.
  const [fx, fy] = [w * 0.025, h * 0.034];
  ctx.fillStyle = "#b9bdc4";
  ctx.fillRect(0, 0, w, fy);
  ctx.fillRect(0, h - fy, w, fy);
  ctx.fillRect(0, 0, fx, h);
  ctx.fillRect(w - fx, 0, fx, h);
  const gap = 4;
  const cw = (w - 2 * fx - gap) / CELLS_ALONG;
  const ch = (h - 2 * fy - gap) / CELLS_ACROSS;
  for (let i = 0; i < CELLS_ALONG; i++)
    for (let j = 0; j < CELLS_ACROSS; j++) {
      const x = fx + gap + i * cw;
      const y = fy + gap + j * ch;
      const [cw1, ch1] = [cw - gap, ch - gap];
      const k = 0.14 * Math.min(cw1, ch1); // the chamfer
      const t = rand();
      const jit = 1 + (rand() - 0.5) * 0.08;
      ctx.fillStyle = rgb(lo.map((v, n) => (v + (hi[n] - v) * t) * jit));
      ctx.beginPath();
      ctx.moveTo(x + k, y);
      ctx.lineTo(x + cw1 - k, y);
      ctx.lineTo(x + cw1, y + k);
      ctx.lineTo(x + cw1, y + ch1 - k);
      ctx.lineTo(x + cw1 - k, y + ch1);
      ctx.lineTo(x + k, y + ch1);
      ctx.lineTo(x, y + ch1 - k);
      ctx.lineTo(x, y + k);
      ctx.closePath();
      ctx.fill();
      // Fingers: 1 px, faint, across the cell; two busbars along it.
      ctx.fillStyle = "rgba(154,163,181,0.3)";
      for (let fxi = x + 5; fxi < x + cw1 - 3; fxi += 6) ctx.fillRect(fxi, y + 2, 1, ch1 - 4);
      ctx.fillStyle = "#9aa3b5";
      ctx.fillRect(x + 2, y + ch1 * 0.3, cw1 - 4, 2);
      ctx.fillRect(x + 2, y + ch1 * 0.7 - 2, cw1 - 4, 2);
    }
  ctx.restore();
}

/** The white back of a panel with a faint grid. */
export function drawPanelBack(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#e9e9e6";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  for (let i = 1; i < CELLS_ALONG; i++) {
    ctx.beginPath();
    ctx.moveTo((i / CELLS_ALONG) * w, 0);
    ctx.lineTo((i / CELLS_ALONG) * w, h);
    ctx.stroke();
  }
  for (let j = 1; j < CELLS_ACROSS; j++) {
    ctx.beginPath();
    ctx.moveTo(0, (j / CELLS_ACROSS) * h);
    ctx.lineTo(w, (j / CELLS_ACROSS) * h);
    ctx.stroke();
  }
  ctx.fillStyle = "#b9bdc4"; // the frame shows on the back too
  ctx.fillRect(0, 0, w, h * 0.034);
  ctx.fillRect(0, h * 0.966, w, h * 0.034);
  ctx.fillRect(0, 0, w * 0.025, h);
  ctx.fillRect(w * 0.975, 0, w * 0.025, h);
  ctx.restore();
}

/** Optical solar reflector radiator: 8 × 8 mirror tiles with thin dark grout. */
export function drawOSR(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = mulberry32(19);
  ctx.save();
  ctx.fillStyle = "#3a3d42";
  ctx.fillRect(0, 0, w, h);
  const [tw, th] = [w / 8, h / 8];
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      const v = 226 + (rand() - 0.5) * 10;
      ctx.fillStyle = rgb([v, v + 3, v + 8]);
      ctx.fillRect(i * tw + 1.5, j * th + 1.5, tw - 3, th - 3);
    }
  ctx.restore();
}

/** Gold MLI side blanket: the foil with its dark tape seams at the edges and across the middle. */
export function drawGold(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#d4a94f";
  ctx.fillRect(0, 0, w, h);
  const t = w * 0.03;
  ctx.fillStyle = "#8a6420";
  ctx.fillRect(0, 0, w, t);
  ctx.fillRect(0, h - t, w, t);
  ctx.fillRect(0, 0, t, h);
  ctx.fillRect(w - t, 0, t, h);
  ctx.fillRect(0, h * 0.5 - t / 3, w, t * 0.66);
  ctx.restore();
}

/**
 * The front face: black MLI with the Devable mark printed at 42% of the face width, upper centre
 * (the mark's own black rounded square shows as a faint edge on the black blanket), and the
 * registration stencil under it.
 */
export function drawFront(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#0d0e10";
  ctx.fillRect(0, 0, w, h);
  const s = w * 0.42;
  const [x, y] = [(w - s) / 2, h * 0.14];
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = w * 0.004;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, s * 0.18);
  ctx.stroke();
  ctx.translate(x, y);
  ctx.scale(s / 512, s / 512);
  drawMark(ctx, 512);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(233,236,240,0.55)";
  ctx.font = `600 ${w * 0.045}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("DVB-01", w / 2, h * 0.86);
  ctx.restore();
}
