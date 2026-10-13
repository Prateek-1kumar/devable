"use client";

import { useEffect, useRef } from "react";

// "Compounding visibility": a quiet field of soft squares on a light canvas. Now and then one square
// glows green, and the glow spreads to a few neighbours before fading, like reach compounding.
// The pointer lights squares too. Fills its nearest positioned parent and listens to the pointer there.

type Props = { className?: string };

// ── Tuning knobs ─────────────────────────────────────────────
const PITCH = 22; // grid spacing in px
const SIZE = 12; // square size in px
const RADIUS = 3; // square corner radius
const BASE_CHANCE = 0.26; // share of cells that show a faint resting square
const BASE_COLOR = "rgba(23, 44, 33, 0.05)"; // ink at a whisper, reads as stone on the off-white
const GLOW_RGB = "26, 196, 102"; // a calmer cousin of the brand green
const SPAWN_EVERY = 0.35; // seconds between new seeds
const SPREAD_AFTER = 0.45; // seconds before a lit square passes light to neighbours
const SPREAD_CHANCE = 0.45; // chance per neighbour
const SPREAD_FALLOFF = 0.62; // each generation is this much dimmer
const MAX_GEN = 3;
const RISE = 0.7; // seconds
const FADE = 2.4; // seconds
const POINTER_EVERY = 0.07; // seconds between pointer-lit squares
// ──────────────────────────────────────────────────────────────

type Glow = { i: number; peak: number; t: number; gen: number; spread: boolean };

export function SignalGrid({ className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0;
    let rows = 0;
    let base: boolean[] = [];
    let glows: Glow[] = [];
    const level = new Map<number, number>();

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / PITCH);
      rows = Math.ceil(height / PITCH);
      base = Array.from({ length: cols * rows }, () => Math.random() < BASE_CHANCE);
      glows = [];
    };

    const light = (i: number, peak: number, gen: number) => {
      if (i < 0 || i >= cols * rows) return;
      if (glows.some((g) => g.i === i && g.t < RISE)) return; // already rising
      glows.push({ i, peak, t: 0, gen, spread: false });
    };

    const alphaOf = (g: Glow) => {
      if (g.t < RISE) return g.peak * (g.t / RISE);
      return g.peak * Math.max(0, 1 - (g.t - RISE) / FADE);
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      // Grid is centered so the margins match on both sides.
      const ox = (width - (cols - 1) * PITCH - SIZE) / 2;
      const oy = (height - (rows - 1) * PITCH - SIZE) / 2;

      level.clear();
      for (const g of glows) level.set(g.i, Math.max(level.get(g.i) ?? 0, alphaOf(g)));

      ctx.fillStyle = BASE_COLOR;
      for (let i = 0; i < base.length; i++) {
        if (!base[i] || level.has(i)) continue;
        ctx.beginPath();
        ctx.roundRect(ox + (i % cols) * PITCH, oy + Math.floor(i / cols) * PITCH, SIZE, SIZE, RADIUS);
        ctx.fill();
      }

      for (const [i, a] of level) {
        const x = ox + (i % cols) * PITCH;
        const y = oy + Math.floor(i / cols) * PITCH;
        ctx.shadowColor = `rgba(${GLOW_RGB}, ${a * 0.55})`;
        ctx.shadowBlur = 14 * a;
        ctx.fillStyle = `rgba(${GLOW_RGB}, ${0.12 + a * 0.6})`;
        ctx.beginPath();
        ctx.roundRect(x, y, SIZE, SIZE, RADIUS);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    if (still) {
      // Reduced motion: a single frozen moment with a few lit clusters.
      for (let n = 0; n < 6; n++) light(Math.floor(Math.random() * cols * rows), 0.8, 0);
      glows.forEach((g) => (g.t = RISE));
      draw();
      return () => ro.disconnect();
    }

    let pointerAt = -1;
    let lastPointer = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const ox = (r.width - (cols - 1) * PITCH - SIZE) / 2;
      const oy = (r.height - (rows - 1) * PITCH - SIZE) / 2;
      const c = Math.round((e.clientX - r.left - ox - SIZE / 2) / PITCH);
      const rr = Math.round((e.clientY - r.top - oy - SIZE / 2) / PITCH);
      if (c >= 0 && c < cols && rr >= 0 && rr < rows) pointerAt = rr * cols + c;
    };
    const onLeave = () => (pointerAt = -1);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(host);

    let raf = 0;
    let prev = performance.now();
    let spawnClock = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      if (!visible) return;

      spawnClock += dt;
      if (spawnClock > SPAWN_EVERY) {
        spawnClock = 0;
        light(Math.floor(Math.random() * cols * rows), 0.75 + Math.random() * 0.25, 0);
      }
      if (pointerAt >= 0 && now / 1000 - lastPointer > POINTER_EVERY) {
        lastPointer = now / 1000;
        light(pointerAt, 0.7, 1);
      }

      for (const g of glows) {
        g.t += dt;
        if (!g.spread && g.t > SPREAD_AFTER && g.gen < MAX_GEN) {
          g.spread = true;
          const c = g.i % cols;
          const next = [c > 0 ? g.i - 1 : -1, c < cols - 1 ? g.i + 1 : -1, g.i - cols, g.i + cols];
          for (const n of next) if (n >= 0 && Math.random() < SPREAD_CHANCE) light(n, g.peak * SPREAD_FALLOFF, g.gen + 1);
        }
      }
      glows = glows.filter((g) => g.t < RISE + FADE);
      draw();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
