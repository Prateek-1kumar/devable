import { Euler, Matrix4, Quaternion, Vector3 } from "three";

// World layout for the growth engine, seen through a fixed orthographic
// isometric camera (no rotation, no tilt). The stack stands at the origin; the
// devtool's terminal sits in front of it, the destinations in a row on the
// floor to its right, and the pipeline dashboard above them.
//
//   terminal ─▶ riser up the stack's front ─▶ each band's port ─▶ its tiles ─▶ collector ─▶ dashboard

/**
 * Each channel layer is one frosted slab with a thin coloured strip along its
 * base. The stack is "exploded": slabs float with clear gaps between them so
 * every channel reads as its own block.
 */
export const LAYER = { width: 2.8, slab: 0.56, strip: 0.09, gap: 0.36 } as const;
export const LAYER_H = LAYER.slab + LAYER.gap;
export const HALF = LAYER.width / 2;
/** Bottom of layer i. */
export const layerY = (i: number) => i * LAYER_H;
/** Height of layer i's port (the middle of its slab): where its route leaves. */
export const bandY = (i: number) => layerY(i) + LAYER.slab / 2;
export const STACK_TOP = 3 * LAYER_H + LAYER.slab;

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
export const CONTENT = { u: [-4.45, 5.25], v: [-2.35, 4.5] } as const;

// ── The input: your devtool's terminal, in front of the stack. ──
const RISER_X = -HALF + 0.18;
export const TERMINAL_NODE = new Vector3(RISER_X, 0, 3.4);
export const TERMINAL_CARD = { w: 2.15, h: 1.02, lift: 0.32 };
/** Floor route from the terminal to the stack, then up the front face to the top. */
export const IN_ROUTE = [TERMINAL_NODE.clone().setY(TERMINAL_CARD.lift), TERMINAL_NODE, new Vector3(RISER_X, 0, HALF)];
export const RISER = [new Vector3(RISER_X, 0, HALF), new Vector3(RISER_X, STACK_TOP, HALF)];
/** Across the top to the engine core. */
export const CORE = { size: 1.1, h: 0.07 };
export const TOP_ROUTE = [new Vector3(RISER_X, STACK_TOP, HALF), new Vector3(RISER_X, STACK_TOP, 0), new Vector3(-CORE.size / 2, STACK_TOP, 0)];

// ── The destinations: a row of logo tiles on the floor, right of the stack. ──
export const TILE = { size: 0.5, h: 0.07, x: HALF + 1.75 };
export const DESTINATIONS = [
  { mark: "hackernews", channel: 0, z: 1.12 },
  { mark: "google", channel: 1, z: 0.56 },
  { mark: "chatgpt", channel: 1, z: 0 },
  { mark: "reddit", channel: 2, z: -0.56 },
  { mark: "youtube", channel: 3, z: -1.12 },
] as const;
/** Down the stack's right face from the channel's port, then out along the floor to the tile. */
export const outRoute = (d: (typeof DESTINATIONS)[number]) => [
  new Vector3(HALF, bandY(d.channel), d.z),
  new Vector3(HALF, 0, d.z),
  new Vector3(TILE.x - TILE.size / 2, 0, d.z),
];

// ── The output: every tile feeds a collector that rises into the pipeline dashboard. ──
const COLLECTOR_X = TILE.x + TILE.size / 2 + 0.4;
export const DASH_NODE = new Vector3(COLLECTOR_X, 0, -1.12);
export const DASH_CARD = { w: 2.5, h: 1.58, lift: 2.1 };
export const collectRoute = (d: (typeof DESTINATIONS)[number]) => [
  new Vector3(TILE.x + TILE.size / 2, 0, d.z),
  new Vector3(COLLECTOR_X, 0, d.z),
  DASH_NODE,
  DASH_NODE.clone().setY(DASH_CARD.lift),
];

/** Where a card's bottom-centre sits: straight above its floor node. Its centre is half a card higher on screen. */
export const cardCenter = (node: Vector3, card: { h: number; lift: number }) =>
  node.clone().setY(card.lift).addScaledVector(SCREEN_UP, card.h / 2);

// ── Step captions: short mono labels that name each stage of the flow. ──
export const CAPTIONS: { n: string; text: string; at: () => Vector3; dx: number }[] = [
  { n: "01", text: "Your devtool", at: () => cardCenter(TERMINAL_NODE, TERMINAL_CARD).addScaledVector(SCREEN_UP, TERMINAL_CARD.h / 2 + 0.22), dx: -TERMINAL_CARD.w / 2 },
  { n: "02", text: "Devable growth engine", at: () => new Vector3(-HALF, STACK_TOP, -HALF).addScaledVector(SCREEN_UP, 0.3), dx: -1.0 },
  { n: "03", text: "Where developers discover", at: () => new Vector3(TILE.x, 0, DESTINATIONS[0].z + 0.62).addScaledVector(SCREEN_UP, -0.12), dx: 0 },
  { n: "04", text: "Returns as pipeline", at: () => cardCenter(DASH_NODE, DASH_CARD).addScaledVector(SCREEN_UP, DASH_CARD.h / 2 + 0.22), dx: -DASH_CARD.w / 2 },
];

/** Where the hover card pins: the front corner of the destination row, so it opens into the empty floor below. */
export const HOVER_ANCHOR = new Vector3(TILE.x - TILE.size / 2, 0, DESTINATIONS[0].z + TILE.size / 2);
