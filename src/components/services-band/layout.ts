import { Vector3 } from "three";

/** Where each station stands on the floor. The camera visits them in this order, round the hub. */
export const AT = {
  hub: new Vector3(0, 0, 0),
  content: new Vector3(-11, 0, 0),
  search: new Vector3(0, 0, -11),
  reddit: new Vector3(11, 0, 0),
  creators: new Vector3(0, 0, 11),
};

/** The hub's plinth: `size` across, its top plate's surface at `h`. */
export const PLATFORM = { size: 4.4, h: 0.2 };
/** Port connectors dock on the plinth's edges and run out along their trace to `reach` from the centre. */
export const PORT_MODULE = { from: 2.16, reach: 2.9, w: 0.4, h: 0.32 };

/** The four lanes leave the hub in visiting order: content (−x), search (−z), Reddit (+x), creators (+z). */
export const DIRS = [
  new Vector3(-1, 0, 0),
  new Vector3(0, 0, -1),
  new Vector3(1, 0, 0),
  new Vector3(0, 0, 1),
];
/** Height routes are given (the traces always lie in the floor). */
const R = 0.02;
// Traces start under the port connectors, so they emerge from beneath them.
const PORT = PORT_MODULE.from + 0.4;
/**
 * Each pipe's route over the floor (world points, corners rounded when built): from its hub port out to its
 * station, round behind it, and into the back of the station's main piece. Hidden ends tuck behind solids.
 */
export const ROUTES: [number, number, number][][] = [
  // Technical Content: round behind the station, ending under the monitor's stand.
  [
    [-PORT, R, 0],
    [-8.05, R, 0],
    [-8.05, R, -2.6],
    [-11.2, R, -2.6],
    [-11.2, R, -1.75],
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
  // Reddit: out to the station, then into the foot of the research board, where the work starts.
  [
    [PORT, R, 0],
    [8.75, R, 0],
    [8.75, R, 1.35],
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
