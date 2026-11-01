import { Vector3 } from "three";

/** Where each station stands on the floor. The camera visits them in this order, round the hub. */
export const AT = {
  hub: new Vector3(0, 0, 0),
  content: new Vector3(-11, 0, 0),
  search: new Vector3(0, 0, -11),
  reddit: new Vector3(11, 0, 0),
  creators: new Vector3(0, 0, 11),
};

/** The hub's platform: a base with a stepped deck on it. `h` is the deck's top. */
export const PLATFORM = { size: 4.6, base: 0.22, deck: 4.1, h: 0.36 };
/** Port modules dock on the base's edges and run out along their pipe to `reach` from the centre. */
export const PORT_MODULE = { from: 2.0, reach: 3.55, w: 0.56, h: 0.5 };

/** The four lanes leave the hub in visiting order: content (−x), search (−z), Reddit (+x), creators (+z). */
export const DIRS = [
  new Vector3(-1, 0, 0),
  new Vector3(0, 0, -1),
  new Vector3(1, 0, 0),
  new Vector3(0, 0, 1),
];
/** Pipe radius: the glass shell, and the fibre running down its middle. */
export const PIPE = { r: 0.085, fibre: 0.032 };
const R = PIPE.r;
const PORT = PORT_MODULE.reach;
/**
 * Each pipe's route over the floor (world points, corners rounded when built): from its hub port out to its
 * station, round behind it, and into the back of the station's main piece. Hidden ends tuck behind solids.
 */
export const ROUTES: [number, number, number][][] = [
  // Technical Content: up the back of the monitor's stand.
  [
    [-PORT, R, 0],
    [-8.05, R, 0],
    [-8.05, R, -2.6],
    [-11.2, R, -2.6],
    [-11.2, R, -1.95],
    [-11.2, 1.0, -1.95],
  ],
  // Search: round behind the results rack, into the back of its base.
  [
    [0, R, -PORT],
    [0, R, -8.7],
    [2.6, R, -8.7],
    [2.6, R, -11.85],
    [0.6, R, -11.85],
    [0.6, R, -11.6],
  ],
  // Reddit: round behind the board, into its foot.
  [
    [PORT, R, 0],
    [8.6, R, 0],
    [8.6, R, -1.5],
    [11.4, R, -1.5],
    [11.4, R, -0.94],
  ],
  // Creators: round the audience stand, into the back of the creator's desk.
  [
    [0, R, PORT],
    [0, R, 8.7],
    [-1.8, R, 8.7],
    [-1.8, R, 11.2],
  ],
];
export const LANE_NAMES = [
  "Technical Content",
  "Search & AI Visibility",
  "Reddit",
  "Creator Distribution",
];

/** A point given relative to a station, in world coordinates (for labels). */
export const at = (
  base: Vector3,
  x: number,
  y: number,
  z: number,
): [number, number, number] => [base.x + x, base.y + y, base.z + z];
