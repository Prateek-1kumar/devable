import { Euler, Matrix4, Quaternion, Vector3 } from "three";

// World layout for the growth engine, seen through a fixed orthographic
// isometric camera (no rotation, no tilt). The stack stands at the origin; the
// devtool's terminal sits in front of it, the destinations in a row on the
// floor to its right, and the pipeline dashboard above them.
//
//   terminal ─▶ riser up the stack's front ─▶ each band's port ─▶ its tiles ─▶ collector ─▶ dashboard

/** Each channel layer: a solid label band with a frosted glass slab above it. */
export const LAYER = { width: 3, band: 0.3, glass: 0.24 } as const;
export const LAYER_H = LAYER.band + LAYER.glass;
export const HALF = LAYER.width / 2;
/** Bottom of layer i. */
export const layerY = (i: number) => i * LAYER_H;
/** Centre height of layer i's label band. */
export const bandY = (i: number) => layerY(i) + LAYER.band / 2;
export const STACK_TOP = 4 * LAYER_H;

// ── The camera: isometric-style, 30° above the floor, looking from the front-right. ──
const ELEVATION = (30 * Math.PI) / 180;
export const VIEW_DIR = new Vector3(Math.SQRT1_2 * Math.cos(ELEVATION), Math.sin(ELEVATION), Math.SQRT1_2 * Math.cos(ELEVATION));
export const CAMERA_DISTANCE = 40;
/** Screen axes in world space: right and up. */
export const SCREEN_RIGHT = new Vector3(1, 0, -1).normalize();
export const SCREEN_UP = new Vector3().crossVectors(VIEW_DIR, SCREEN_RIGHT).normalize();
/** Rotation that turns a plane (facing +z) to face the camera, square to the screen. */
export const FACE_CAMERA = new Quaternion().setFromRotationMatrix(
  new Matrix4().makeBasis(SCREEN_RIGHT, SCREEN_UP, VIEW_DIR.clone()),
);
export const FACE_CAMERA_EULER = new Euler().setFromQuaternion(FACE_CAMERA);
/** A world point in screen units (u right, v up), as the orthographic camera sees it. */
export const toScreen = (p: Vector3) => ({ u: p.dot(SCREEN_RIGHT), v: p.dot(SCREEN_UP) });

/** The part of the screen the whole diagram occupies (screen units), so the camera can frame it at any size. */
export const CONTENT = { u: [-4.4, 5.1], v: [-1.95, 3.05] } as const;

// ── The input: your devtool's terminal, in front of the stack. ──
const RISER_X = -HALF + 0.2;
export const TERMINAL_NODE = new Vector3(RISER_X, 0, 3.35);
export const TERMINAL_CARD = { w: 2.15, h: 1.02, lift: 0.4 };
/** Floor route from the terminal to the stack, then up the front face to the top. */
export const IN_ROUTE = [TERMINAL_NODE.clone().setY(TERMINAL_CARD.lift), TERMINAL_NODE, new Vector3(RISER_X, 0, HALF)];
export const RISER = [new Vector3(RISER_X, 0, HALF), new Vector3(RISER_X, STACK_TOP, HALF)];
/** Across the top to the engine core. */
export const CORE = { size: 1.25, h: 0.07 };
export const TOP_ROUTE = [new Vector3(RISER_X, STACK_TOP, HALF), new Vector3(RISER_X, STACK_TOP, 0), new Vector3(-CORE.size / 2, STACK_TOP, 0)];

// ── The destinations: a row of logo tiles on the floor, right of the stack. ──
export const TILE = { size: 0.5, h: 0.07, x: 2.95 };
export const DESTINATIONS = [
  { mark: "hackernews", channel: 0, z: 1.2 },
  { mark: "google", channel: 1, z: 0.6 },
  { mark: "chatgpt", channel: 1, z: 0 },
  { mark: "reddit", channel: 2, z: -0.6 },
  { mark: "youtube", channel: 3, z: -1.2 },
] as const;
/** Down the stack's right face from the channel's port, then out along the floor to the tile. */
export const outRoute = (d: (typeof DESTINATIONS)[number]) => [
  new Vector3(HALF, bandY(d.channel), d.z),
  new Vector3(HALF, 0, d.z),
  new Vector3(TILE.x - TILE.size / 2, 0, d.z),
];

// ── The output: every tile feeds a collector that rises into the pipeline dashboard. ──
const COLLECTOR_X = TILE.x + TILE.size / 2 + 0.32;
export const DASH_NODE = new Vector3(COLLECTOR_X, 0, -1.5);
export const DASH_CARD = { w: 2.5, h: 1.58, lift: 1.25 };
export const collectRoute = (d: (typeof DESTINATIONS)[number]) => [
  new Vector3(TILE.x + TILE.size / 2, 0, d.z),
  new Vector3(COLLECTOR_X, 0, d.z),
  DASH_NODE,
  DASH_NODE.clone().setY(DASH_CARD.lift),
];

/** Where a card's bottom-centre sits: straight above its floor node. Its centre is half a card higher on screen. */
export const cardCenter = (node: Vector3, card: { h: number; lift: number }) =>
  node.clone().setY(card.lift).addScaledVector(SCREEN_UP, card.h / 2);

/** Where the hover card pins: the front corner of the destination row, so it opens into the empty floor below. */
export const HOVER_ANCHOR = new Vector3(TILE.x - TILE.size / 2, 0, DESTINATIONS[0].z + TILE.size / 2);
