import type { Mark } from "./marks";

// The four channels, bottom (foundation) to top.
// Colors tell the "dawn rise" story, deep to radiant: indigo → azure → emerald → sun.
// Your devtool's signal leaves as white light and each channel turns it into its
// own color: its layer, its token, its lead pearls and its band on the monitor.
// `color` is the vivid signal (pearls, traces, chart, lit lights), `pastel` the frosted
// body tint (slabs, tokens) and `deep` the text-safe shade for glyphs on white.
// `lands` are the destination tiles it wires to; `chip` labels its trace.
export const CHANNELS = [
  {
    n: "01",
    cap: "depth",
    name: "Technical Content",
    short: "Content",
    glyph: "code",
    line: "Docs, tutorials and deep dives developers actually bookmark.",
    color: "#4f46e5",
    pastel: "#d4d2ff",
    deep: "#4338ca",
    lands: ["hackernews"] as Mark[],
    chip: "front page · HN",
  },
  {
    n: "02",
    cap: "discovery",
    name: "SEO + AI Search",
    short: "Search",
    glyph: "search",
    line: "Found on Google, and cited by ChatGPT, Perplexity and Claude.",
    color: "#0ea5e9",
    pastel: "#c6e8fb",
    deep: "#0369a1",
    lands: ["google", "chatgpt", "perplexity", "claude"] as Mark[],
    chip: "#1 · cited by AI",
  },
  {
    n: "03",
    cap: "trust",
    name: "Reddit",
    short: "Reddit",
    glyph: "reddit",
    line: "Real conversations in the communities your users already live in.",
    color: "#10b981",
    pastel: "#c4f1dc",
    deep: "#047857",
    lands: ["reddit"] as Mark[],
    chip: "r/programming",
  },
  {
    n: "04",
    cap: "reach",
    name: "Creator Distribution",
    short: "Creators",
    glyph: "play",
    line: "Creators your audience follows, showing your tool in action.",
    color: "#f5b301",
    pastel: "#ffe9a8",
    deep: "#b45309",
    lands: ["youtube", "x"] as Mark[],
    chip: "48k views",
  },
] as const;

export type Glyph = (typeof CHANNELS)[number]["glyph"];

/**
 * Draws a channel glyph centered at (x, y). Arrows and triangles are drawn
 * as paths so no character falls back to a non-brand font.
 */
export function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, size: number, color: string, font: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.14;
  if (glyph === "code" || glyph === "reddit") {
    ctx.font = `600 ${size}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph === "code" ? "</>" : "r/", x, y);
  } else if (glyph === "search") {
    const r = size * 0.32;
    ctx.beginPath();
    ctx.moveTo(x - r, y + r);
    ctx.lineTo(x + r, y - r);
    ctx.moveTo(x - r * 0.1, y - r);
    ctx.lineTo(x + r, y - r);
    ctx.lineTo(x + r, y + r * 0.1);
    ctx.stroke();
  } else {
    const r = size * 0.34;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x - r * 0.7, y + r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
