// The four channels, bottom (foundation) to top. Each is a solid label band in
// the stack; bands alternate deep green and ink, and turn coral (the accent)
// while the signal passes or the channel is pointed at.
// `color` is the channel's swatch for DOM use (hover card dot, client proof
// squares), as a CSS colour so it follows the page tokens.
export const CHANNELS = [
  {
    n: "01",
    cap: "depth",
    name: "Technical Content",
    short: "Content",
    glyph: "code",
    line: "Docs, tutorials and deep dives developers actually bookmark.",
    color: "var(--primary)",
    band: "primary",
  },
  {
    n: "02",
    cap: "discovery",
    name: "SEO + AI Search",
    short: "Search",
    glyph: "search",
    line: "Found on Google, and cited by ChatGPT, Perplexity and Claude.",
    color: "var(--ink)",
    band: "ink",
  },
  {
    n: "03",
    cap: "trust",
    name: "Reddit",
    short: "Reddit",
    glyph: "reddit",
    line: "Real conversations in the communities your users already live in.",
    color: "var(--accent)",
    band: "primary",
  },
  {
    n: "04",
    cap: "reach",
    name: "Creator Distribution",
    short: "Creators",
    glyph: "play",
    line: "Creators your audience follows, showing your tool in action.",
    color: "var(--sage)",
    band: "ink",
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
