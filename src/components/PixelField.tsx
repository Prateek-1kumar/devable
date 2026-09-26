"use client";

import { useEffect, useRef } from "react";

// Subtle decorative background: a cluster of tiny rounded blocks and pluses
// dissolves and re-forms around the center, and a hidden layer of the same
// shapes is uncovered softly around the cursor.
// Fills its nearest positioned parent (give it `relative`) and listens to
// the pointer there. Colors come from the --pixel-light, --pixel-stone
// and --accent tokens.

type Props = {
  /** Grid spacing in px. */
  gap?: number;
  className?: string;
};

type Cell = {
  x: number;
  y: number;
  kind: "block" | "dot" | "plus";
  color: string;
  hidden: boolean; // part of the cursor-revealed layer
  inCluster: boolean;
  inDelay: number;
  outDelay: number;
  alpha: number;
};

// ── Tuning knobs ─────────────────────────────────────────────
// Visibility
const MAX_ALPHA = 0.8; // peak opacity of any shape (0–1)

// Center cluster
const CLUSTER_RADIUS = 14; // in grid cells; area (≈ count) grows with the square
const CLUSTER_DENSITY_EDGE = 0.35; // fill chance at the cluster's edge
const CLUSTER_DENSITY_CENTER = 0.8; // fill chance at the cluster's center
const CLUSTER_AREA = 0.4; // center wanders within the middle 40% of the area

// Cursor reveal
const CURSOR_RADIUS = 400; // px
const HIDDEN_DENSITY = 0.9; // share of cells the cursor can uncover
const CURSOR_FOLLOW = 0.5; // 0–1, higher follows faster

// Shape mix (chances per cell)
const ACCENT_CHANCE = 0.035; // green pluses
const PLUS_CHANCE = 0.2; // all pluses, incl. green
const BLOCK_CHANCE = 0.4; // blocks; the rest are dots
const LIGHT_CHANCE = 0.55; // off-white vs stone

// Shape sizes in px
const BLOCK_SIZE = 12;
const DOT_SIZE = 6;
const PLUS_SIZE = 10;
const PLUS_STROKE = 2;

// Cluster timeline in seconds
const FADE = 0.6; // each shape's fade
const STAGGER = 1.2; // max random delay per shape
const HOLD_UNTIL = 4.5; // when the dissolve starts
const CYCLE = 7; // when it re-forms elsewhere
// ──────────────────────────────────────────────────────────────

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => v * v * (3 - 2 * v);

export default function PixelField({ gap = 26, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const css = getComputedStyle(canvas);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const light = token("--pixel-light");
    const stone = token("--pixel-stone");
    const accent = token("--accent");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let cells: Cell[] = [];
    let cycleStart = 0;
    const pointer = { x: 0, y: 0, ex: 0, ey: 0, on: false, presence: 0 };

    const newCluster = (now: number) => {
      const cx = w * (0.5 - CLUSTER_AREA / 2 + Math.random() * CLUSTER_AREA);
      const cy = h * (0.5 - CLUSTER_AREA / 2 + Math.random() * CLUSTER_AREA);
      const radius = gap * CLUSTER_RADIUS;
      for (const c of cells) {
        const d = Math.hypot(c.x - cx, c.y - cy) / radius;
        // Denser in the middle, sparse at the edges.
        c.inCluster = d < 1 && Math.random() < CLUSTER_DENSITY_EDGE + (CLUSTER_DENSITY_CENTER - CLUSTER_DENSITY_EDGE) * (1 - d);
        c.inDelay = Math.random() * STAGGER;
        c.outDelay = Math.random() * STAGGER;
      }
      cycleStart = now;
    };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cells = [];
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const r = Math.random();
          const isAccent = r < ACCENT_CHANCE;
          cells.push({
            x,
            y,
            kind: isAccent || r < PLUS_CHANCE ? "plus" : r < PLUS_CHANCE + BLOCK_CHANCE ? "block" : "dot",
            color: isAccent ? accent : Math.random() < LIGHT_CHANCE ? light : stone,
            hidden: Math.random() < HIDDEN_DENSITY,
            inCluster: false,
            inDelay: 0,
            outDelay: 0,
            alpha: 0,
          });
        }
      }
      newCluster(performance.now());
    };

    const drawCell = (c: Cell) => {
      const s = 0.6 + 0.4 * c.alpha; // grow in as it appears
      ctx.globalAlpha = c.alpha * MAX_ALPHA;
      if (c.kind === "plus") {
        const l = (PLUS_SIZE / 2) * s;
        ctx.strokeStyle = c.color;
        ctx.lineWidth = PLUS_STROKE;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(c.x - l, c.y);
        ctx.lineTo(c.x + l, c.y);
        ctx.moveTo(c.x, c.y - l);
        ctx.lineTo(c.x, c.y + l);
        ctx.stroke();
      } else {
        const size = (c.kind === "block" ? BLOCK_SIZE : DOT_SIZE) * s;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.roundRect(c.x - size / 2, c.y - size / 2, size, size, size * 0.28);
        ctx.fill();
      }
    };

    let raf = 0;
    const frame = (now: number) => {
      const t = (now - cycleStart) / 1000;
      if (t > CYCLE) newCluster(now);

      pointer.ex += (pointer.x - pointer.ex) * CURSOR_FOLLOW;
      pointer.ey += (pointer.y - pointer.ey) * CURSOR_FOLLOW;
      pointer.presence += ((pointer.on ? 1 : 0) - pointer.presence) * 0.05;

      ctx.clearRect(0, 0, w, h);
      for (const c of cells) {
        let target = 0;
        if (c.inCluster) {
          const fadeIn = ease(clamp01((t - c.inDelay) / FADE));
          const fadeOut = ease(clamp01((t - HOLD_UNTIL - c.outDelay) / FADE));
          target = fadeIn * (1 - fadeOut);
        }
        if (c.hidden && pointer.presence > 0.01) {
          const d = Math.hypot(c.x - pointer.ex, c.y - pointer.ey);
          target = Math.max(target, pointer.presence * ease(clamp01(1 - d / CURSOR_RADIUS)));
        }
        c.alpha += (target - c.alpha) * 0.12;
        if (c.alpha > 0.01) drawCell(c);
      }
      raf = requestAnimationFrame(frame);
    };

    // Reduced motion: one static cluster, no cycling or cursor tracking.
    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      for (const c of cells) {
        c.alpha = c.inCluster ? 1 : 0;
        if (c.inCluster) drawCell(c);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (!pointer.on) {
        // Start the eased position at the entry point so it doesn't sweep in from a corner.
        pointer.ex = pointer.x;
        pointer.ey = pointer.y;
        pointer.on = true;
      }
    };
    const onLeave = () => {
      pointer.on = false;
    };

    const observer = new ResizeObserver(() => {
      build();
      if (reduced) drawStatic();
    });
    observer.observe(host);

    if (!reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [gap]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
