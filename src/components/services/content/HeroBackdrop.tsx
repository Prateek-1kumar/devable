"use client";

import { useEffect, useRef } from "react";

// The hero's backdrop. The page promises content built for developers, search engines and LLMs, and all three read:
// a developer skims, a crawler scans, a model lifts passages. So beside the headline, in the two margins and nowhere
// else, sits a column of a technical page: short lines of word-shaped bars in ink, fading toward the middle, top and
// bottom. Very slowly a soft green read-line drifts down both columns, and every few seconds a few words are picked
// out in green and underlined, then let go (a passage being cited). Thin green traces come in from the page edges
// along the gaps between paragraphs, fold at the inner end and finish at a small port; a pulse travels each one and
// its port ripples when it arrives, the diagram's wire-and-port language, here as signals feeding the page. Nothing
// passes under the headline or the diagram. It is switched off below 1280px, where the headline reaches the margins, and holds still (with a
// passage already marked) for visitors who prefer reduced motion.

const ROW = 30; // px between lines of text
const BAR = 7; // px, a word's height
const SCAN_SPEED = 20; // px per second the read-line moves
const SCAN_SPREAD = 52; // px, how soft the read-line is
const CITE_EVERY = 4.2; // seconds between passages
const CITE_FOR = 5; // seconds a passage stays
const SPEED = 70; // px per second a pulse travels along a trace
const TAIL = 110; // px, how long a pulse is
const GREEN = "25, 231, 110";
const INK = "23, 44, 33";

type Word = { x: number; y: number; w: number; f: number }; // f: how much of the page shows here (0 at the fade)
type Cite = { words: Word[]; t0: number };
type Trace = { pts: [number, number][]; len: number; period: number; off: number };
const STEP = 2.5; // px between a trace's sample points

/** An orthogonal route through `W`, corners rounded, sampled every STEP px. */
function route(W: [number, number][], R = 12): { pts: [number, number][]; len: number } {
  const rough: [number, number][] = [W[0]];
  for (let i = 1; i < W.length - 1; i++) {
    const [px, py] = W[i - 1];
    const [cx, cy] = W[i];
    const [nx, ny] = W[i + 1];
    const d1 = Math.hypot(cx - px, cy - py);
    const d2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(R, d1 / 2, d2 / 2);
    const a: [number, number] = [cx - ((cx - px) / d1) * rr, cy - ((cy - py) / d1) * rr];
    const b: [number, number] = [cx + ((nx - cx) / d2) * rr, cy + ((ny - cy) / d2) * rr];
    rough.push(a);
    for (let k = 1; k <= 6; k++) {
      const u = k / 6;
      rough.push([(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cy + u * u * b[1]]);
    }
  }
  rough.push(W[W.length - 1]);
  const pts: [number, number][] = [rough[0]];
  let len = 0;
  for (let i = 1; i < rough.length; i++) {
    const [x0, y0] = rough[i - 1];
    const [x1, y1] = rough[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(d / STEP));
    for (let k = 1; k <= n; k++) pts.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
    len += d;
  }
  return { pts, len };
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function HeroBackdrop() {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let words: Word[] = [];
    let traces: Trace[] = [];
    let base: HTMLCanvasElement | null = null;
    const cites: Cite[] = [];
    let nextCite = 1.2;
    let raf = 0;
    let last = 0;
    let t = still ? 7 : 0;
    const pick = rng(23);

    const bar = (c: CanvasRenderingContext2D, x: number, y: number, ww: number) => {
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y - BAR / 2, ww, BAR, BAR / 2);
      else c.rect(x, y - BAR / 2, ww, BAR);
      c.fill();
    };

    /** Lay the document out: paragraphs of indented first lines, full lines, and a short last line, with gaps between. */
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const r = rng(5);
      const margin = Math.max(24, w * 0.035);
      const zone = Math.min(340, Math.max(120, w * 0.2)); // each column's width
      const yMin = 120;
      const yMax = Math.min(h * 0.46, 720); // stops above the diagram
      words = [];
      const gaps: number[][] = [[], []];
      const xs = [0, 0];
      for (const side of [0, 1]) {
        const x0 = side === 0 ? margin : w - margin - zone;
        xs[side] = x0;
        const rows = Math.ceil(yMax / ROW) + 1;
        for (let row = 0; row < rows; ) {
          const len = 3 + Math.floor(r() * 4);
          for (let k = 0; k < len && row < rows; k++, row++) {
            const y = row * ROW + ROW / 2;
            if (y < yMin || y > yMax) continue;
            let x = x0 + (k === 0 ? 20 : 0);
            const end = x0 + zone - (k === len - 1 ? r() * zone * 0.6 : r() * 24);
            while (x < end - 12) {
              const ww = Math.min(12 + r() * 34, end - x);
              // fade toward the middle of the page, and toward the top and bottom of the column
              const across = side === 0 ? 1 - (x - x0) / zone : 1 - (x0 + zone - (x + ww)) / zone;
              const down = smooth(yMin, yMin + 110, y) * (1 - smooth(yMax - 150, yMax, y));
              const f = smooth(0, 0.85, across) * down;
              if (f > 0.04) words.push({ x, y, w: ww, f });
              x += ww + 7;
            }
          }
          const skip = 1 + Math.floor(r() * 2);
          for (let g = 0; g < skip; g++) {
            const gy = (row + g) * ROW + ROW / 2;
            if (gy > yMin + 40 && gy < yMax - 60) gaps[side].push(gy);
          }
          row += skip;
        }
      }

      // Traces: in from the page edge along a gap, fold at the inner end, finish at a port. Two folds and a straight run a side.
      const r2 = rng(11);
      traces = [];
      for (const side of [0, 1]) {
        const x0 = xs[side];
        const outer = side === 0 ? -8 : w + 8;
        const inner = (f: number) => (side === 0 ? x0 + zone * f : x0 + zone * (1 - f));
        const stop = (f: number) => (side === 0 ? x0 + zone * f : x0 + zone * (1 - f));
        const g = gaps[side];
        const route2 = (ys: number[], end: number, fold = 0.7) => {
          const W: [number, number][] = [[outer, ys[0]]];
          if (ys.length === 2) W.push([inner(fold), ys[0]], [inner(fold), ys[1]], [stop(end), ys[1]]);
          else W.push([stop(end), ys[0]]);
          const { pts, len } = route(W);
          traces.push({ pts, len, period: 7 + r2() * 4, off: r2() * 10 });
        };
        if (g.length >= 3) route2([g[0], g[2]], 0.28, 0.72);
        if (g.length >= 5) route2([g[3], g[g.length - 1]], 0.34, 0.54);
        if (g.length >= 2) route2([g[1]], 0.62);
      }

      // The page itself, drawn once: ink at a whisper, lighter behind the headline.
      base = document.createElement("canvas");
      base.width = w * dpr;
      base.height = h * dpr;
      const b = base.getContext("2d")!;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const wd of words) {
        b.fillStyle = `rgba(${INK}, ${0.075 * wd.f})`;
        bar(b, wd.x, wd.y, wd.w);
      }
      draw(0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      if (base) ctx.drawImage(base, 0, 0, w, h);

      // The read-line: words near it take the green, softly.
      const span = 700 + 360;
      const sy = still ? 330 : ((time * SCAN_SPEED) % span) - 180 + 120;
      for (const wd of words) {
        const dy = (wd.y - sy) / SCAN_SPREAD;
        if (dy > 2.4 || dy < -2.4) continue;
        const a = Math.exp(-dy * dy) * 0.3 * wd.f;
        ctx.fillStyle = `rgba(${GREEN}, ${a})`;
        bar(ctx, wd.x, wd.y, wd.w);
      }

      // Cited passages: a few words picked out and underlined, then let go.
      for (const c of cites) {
        const age = time - c.t0;
        const a = smooth(0, 0.9, age) * (1 - smooth(CITE_FOR - 1.4, CITE_FOR, age));
        if (a <= 0) continue;
        for (const wd of c.words) {
          ctx.fillStyle = `rgba(${GREEN}, ${0.45 * a * wd.f})`;
          bar(ctx, wd.x, wd.y, wd.w);
        }
        const first = c.words[0];
        const end = c.words[c.words.length - 1];
        ctx.fillStyle = `rgba(${GREEN}, ${0.9 * a * Math.min(first.f, end.f)})`;
        ctx.fillRect(first.x, first.y + BAR / 2 + 3, (end.x + end.w - first.x) * smooth(0, 1.1, age), 2);
      }

      // Traces: a hairline, a port at the end, and a pulse that travels it and ripples the port on arrival.
      for (const tr of traces) {
        ctx.strokeStyle = `rgba(${GREEN}, 0.24)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        const [ex, ey] = tr.pts[tr.pts.length - 1];
        ctx.fillStyle = `rgba(${GREEN}, 0.9)`;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${GREEN}, 0.4)`;
        ctx.beginPath();
        ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
        ctx.stroke();
        if (still) continue;
        const head = (time * SPEED + tr.off * SPEED) % (SPEED * tr.period);
        const from = Math.max(0, head - TAIL);
        const to = Math.min(tr.len, head);
        if (to > from) {
          const i0 = Math.floor(from / STEP);
          const i1 = Math.min(tr.pts.length - 1, Math.floor(to / STEP));
          ctx.lineWidth = 1.8;
          for (let i = i0; i < i1; i++) {
            const a = Math.min(1, Math.max(0, (i * STEP - (head - TAIL)) / TAIL));
            ctx.strokeStyle = `rgba(${GREEN}, ${0.9 * a * a})`;
            ctx.beginPath();
            ctx.moveTo(tr.pts[i][0], tr.pts[i][1]);
            ctx.lineTo(tr.pts[i + 1][0], tr.pts[i + 1][1]);
            ctx.stroke();
          }
          if (head <= tr.len) {
            ctx.fillStyle = `rgba(${GREEN}, 0.95)`;
            ctx.beginPath();
            ctx.arc(tr.pts[i1][0], tr.pts[i1][1], 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const age = (head - tr.len) / SPEED;
        if (age >= 0 && age < 1.3) {
          ctx.strokeStyle = `rgba(${GREEN}, ${0.55 * (1 - age / 1.3)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(ex, ey, 5.5 + 13 * (age / 1.3), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    /** Choose a few neighbouring words in the upper part of the page. */
    const cite = (time: number) => {
      for (let tries = 0; tries < 20; tries++) {
        const i = Math.floor(pick() * words.length);
        const wd = words[i];
        if (wd.f < 0.6) continue; // only where the page is clearly there
        const run = [wd];
        for (let k = i + 1; k < words.length && run.length < 2 + Math.floor(pick() * 3) && words[k].y === wd.y; k++) run.push(words[k]);
        if (run.length < 2) continue;
        return { words: run, t0: time };
      }
      return null;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return; // 30 fps is plenty for something this slow
      t += last ? (now - last) / 1000 : 0;
      last = now;
      if (t > nextCite) {
        const c = cite(t);
        if (c) cites.push(c);
        nextCite = t + CITE_EVERY * (0.7 + pick() * 0.6);
      }
      while (cites.length && t - cites[0].t0 > CITE_FOR) cites.shift();
      draw(t);
    };

    build();
    if (still) {
      for (let k = 0; k < 3; k++) {
        const c = cite(7);
        if (c) cites.push(c);
      }
      draw(7);
    }
    const ro = new ResizeObserver(build);
    ro.observe(host);
    let io: IntersectionObserver | undefined;
    if (!still) {
      io = new IntersectionObserver(([e]) => {
        cancelAnimationFrame(raf);
        last = 0;
        if (e.isIntersecting) raf = requestAnimationFrame(loop);
      });
      io.observe(host);
    }
    return () => {
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={cv}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden size-full xl:block motion-safe:animate-fade-up"
    />
  );
}
