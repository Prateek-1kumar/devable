import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DASH_CARD, DASH_NODE, cardCenter } from "./layout";
import { edgeColor, palette } from "./palette";
import { CARD_PX, CardPlane, DESIGN_ZOOM } from "./parts";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the story ends: a product-style pipeline dashboard pinned above the
// collector. Each cycle the signal's results arrive and the chart ticks up one
// week: the window scrolls left, the newest point rises in coral and the
// pipeline figure counts up. The data is a steady compounding trend with small
// fixed wobbles, so every week reads as real but the shape stays familiar.

const [W, H] = [DASH_CARD.w, DASH_CARD.h];
const WEEKS = 12;
const START = 14; // the week shown first
const RATE = 1.0373; // weekly growth: ≈ +61% over a quarter (13 weeks)
const wobble = (j: number) => 1 + 0.035 * Math.sin(j * 2.1) + 0.02 * Math.sin(j * 5.3);
const weekly = (j: number) => 0.62 * RATE ** j * wobble(j); // $M
/** The value at fractional week w, interpolated between whole weeks. */
const valueAt = (w: number) => {
  const j = Math.floor(w);
  return weekly(j) + (weekly(j + 1) - weekly(j)) * (w - j);
};
const money = (m: number) => `$${m.toFixed(2)}M`;

export default function GrowthScreen() {
  const story = useStory();
  const p = palette();
  const view = useRef({ week: -1, live: false });
  const center = useMemo(() => cardCenter(DASH_NODE, DASH_CARD), []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const { week, live } = view.current;
      const now = START + Math.max(0, week);
      const u = CARD_PX / DESIGN_ZOOM;
      const pad = 12 * u;
      // Card.
      ctx.fillStyle = p.card;
      ctx.strokeStyle = edgeColor();
      ctx.lineWidth = u;
      ctx.beginPath();
      ctx.roundRect(u, u, w - 2 * u, h - 2 * u, 9 * u);
      ctx.fill();
      ctx.stroke();

      // Header: label and live marker.
      ctx.textBaseline = "middle";
      ctx.font = `500 ${8.4 * u}px ${p.monoFont}`;
      ctx.letterSpacing = `${0.7 * u}px`;
      ctx.fillStyle = p.muted;
      ctx.fillText("PIPELINE · 12 WK", pad, 15 * u);
      ctx.textAlign = "right";
      ctx.fillStyle = live ? p.accent : p.muted;
      ctx.fillText("LIVE", w - pad, 15 * u);
      ctx.beginPath();
      ctx.arc(w - pad - 26 * u, 15 * u, 2.6 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.letterSpacing = "0px";

      // KPI: pipeline now, and the quarter's growth.
      const value = valueAt(now);
      ctx.fillStyle = p.ink;
      ctx.font = `600 ${19 * u}px ${p.bodyFont}`;
      ctx.fillText(money(value), pad, 36 * u);
      const kpiW = ctx.measureText(money(value)).width;
      const growth = Math.round((RATE ** 13 - 1) * 100); // the trend over a quarter, not the week-to-week wobble
      const chip = `+${growth}%`;
      ctx.font = `500 ${8.6 * u}px ${p.monoFont}`;
      const chipW = ctx.measureText(chip).width + 10 * u;
      const chipX = pad + kpiW + 7 * u;
      ctx.fillStyle = "#dfe8e2";
      ctx.beginPath();
      ctx.roundRect(chipX, 29.5 * u, chipW, 13 * u, 6.5 * u);
      ctx.fill();
      ctx.fillStyle = p.primary;
      ctx.fillText(chip, chipX + 5 * u, 36.5 * u);
      ctx.fillStyle = p.muted;
      ctx.fillText("vs last qtr", chipX + chipW + 6 * u, 36.5 * u);

      // Chart: the last 12 weeks, scaled so the window always spans the same height.
      const left = pad;
      const right = w - pad;
      const top = 54 * u;
      const bottom = h - 21 * u;
      ctx.strokeStyle = p.line;
      ctx.lineWidth = u;
      for (let i = 0; i <= 3; i++) {
        const y = top + ((bottom - top) * i) / 3;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }
      const lo = valueAt(now - WEEKS + 1) * 0.9;
      const hi = value * 1.05;
      const X = (j: number) => left + ((j - (now - WEEKS + 1)) / (WEEKS - 1)) * (right - left);
      const Y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
      const points: [number, number][] = [];
      for (let j = Math.floor(now - WEEKS); j <= Math.floor(now); j++) points.push([X(j), Y(weekly(j))]);
      if (now % 1) points.push([X(now), Y(value)]);

      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top - 4 * u, right - left, bottom - top + 8 * u);
      ctx.clip();
      // Area, then the line in coral: the key data line.
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.lineTo(points[points.length - 1][0], bottom);
      ctx.lineTo(points[0][0], bottom);
      ctx.closePath();
      ctx.fillStyle = "rgba(232,96,60,0.09)";
      ctx.fill();
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.7 * u;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
      // The newest week: a dot with a white ring.
      const [tx, ty] = [X(now), Y(value)];
      ctx.fillStyle = p.card;
      ctx.beginPath();
      ctx.arc(tx, ty, 4 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(tx, ty, 2.6 * u, 0, Math.PI * 2);
      ctx.fill();

      // Axis: the window's first and last week.
      ctx.font = `500 ${7.6 * u}px ${p.monoFont}`;
      ctx.fillStyle = p.muted;
      ctx.fillText(`W${Math.floor(now) - WEEKS + 1}`, left, h - 11 * u);
      ctx.textAlign = "right";
      ctx.fillText(`W${Math.floor(now)}`, right, h - 11 * u);
      ctx.textAlign = "center";
      ctx.fillText("SEARCH · AI · REDDIT · CREATORS", w / 2, h - 11 * u);
      ctx.textAlign = "left";
    },
    [p],
  );
  const screen = useCanvasTexture(Math.round(W * CARD_PX), Math.round(H * CARD_PX), draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const week = Math.round(story.week(t) * 200) / 200;
    const live = story.ticking(t);
    const v = view.current;
    if (week !== v.week || live !== v.live) {
      view.current = { week, live };
      screen.paint();
    }
  });

  return <CardPlane center={center} w={W} h={H} texture={screen.texture} />;
}
