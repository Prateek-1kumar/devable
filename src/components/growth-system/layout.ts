import { PORT_WORLD, PORTS, project, toWorld } from "./core-view";

// The desktop stage: one fixed 1232px frame where the DOM cards, the 3D device
// and the 3D pipes share a coordinate system. Card boxes are in stage px; pipe
// routes are world points on the ports' plane (y = 0), designed in screen space
// so they meet the cards' edges exactly.

export const W = 1232;
export const SIDE_W = 224; // product and outcomes cards
export const SIDE_H = 460;
export const MID_X = 324; // left edge of the channel grid
export const CARD_W = 282;
export const GAP = 20;
export const ROW_H = 248;
export const BAND = 350; // the device's row, between the two card rows
export const CX = W / 2;
export const CY = ROW_H + BAND / 2;
export const BOTTOM_Y = ROW_H + BAND;
export const SIDE_Y = CY - SIDE_H / 2;
/** The device sits a touch above the band's centre: it is taller below its ports than above. */
export const CORE_Y = CY - 14;
export const LOOP_Y = BOTTOM_Y + ROW_H + 58;
export const H = LOOP_Y + 30;

export const CARDS = {
  content: { x: MID_X, y: 0 },
  search: { x: MID_X + CARD_W + GAP, y: 0 },
  reddit: { x: MID_X, y: BOTTOM_Y },
  creators: { x: MID_X + CARD_W + GAP, y: BOTTOM_Y },
} as const;

type V3 = readonly [number, number, number];

/** A stage point (px) as a world point on the ports' plane. */
const at = (x: number, y: number): V3 => toWorld(x - CX, y - CORE_Y);

/** Each channel pipe leaves its port square to the housing, then turns straight to its card's edge. */
const LEAD = 0.34;
function channel(port: keyof typeof PORT_WORLD, edgeY: number): V3[] {
  const { at: p, n } = PORT_WORLD[port];
  const bend: V3 = [p[0] + n[0] * LEAD, 0, p[2] + n[2] * LEAD];
  const screen = project(...bend);
  return [p, bend, at(CX + screen.x, edgeY)];
}

/** Pipe routes, in the direction their contents flow. */
export const ROUTES = {
  in: [at(SIDE_W, CORE_Y), at(CX + PORTS.in.x, CORE_Y)],
  channels: [channel("tl", ROW_H), channel("tr", ROW_H), channel("bl", BOTTOM_Y), channel("br", BOTTOM_Y)],
  out: [at(CX + PORTS.out.x, CORE_Y), at(W - SIDE_W, CORE_Y)],
  loop: [at(W - SIDE_W / 2, SIDE_Y + SIDE_H), at(W - SIDE_W / 2, LOOP_Y), at(SIDE_W / 2, LOOP_Y), at(SIDE_W / 2, SIDE_Y + SIDE_H)],
};
