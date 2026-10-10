// The growth engine's geometry and view, shared by the 3D scene and the 2D
// stage, so pipes, device and DOM cards line up to the pixel. Pure maths, no
// three.js, so the server stage can use it.
//
// The device is seen through a fixed orthographic camera from the front-right,
// like the hero's growth engine but a little higher, so the mark on its top
// reads clearly. Its square body then reads as a diamond: the port housing in
// the middle of each side points at a channel card, and the posts on its left
// and right corners take the product signal in and send outcomes out.

/** A brighter mint used only in this section, as energy: light pipes, port lights, packets. */
export const MINT = "#3ddc97";

/** Camera elevation above the floor. */
export const ELEVATION = (40 * Math.PI) / 180;
/** Pixels per world unit. */
export const ZOOM = 82;

/**
 * Device dimensions (world units). y = 0 is the height of the ports: the
 * middle of each side's port housing and of the corner posts.
 */
export const DEVICE = {
  base: { half: 1.3, top: -0.58, h: 0.12 },
  body: { half: 1.0, bottom: -0.58, top: 0.4 },
  port: { w: 0.44, h: 0.5, d: 0.2 },
  plate: { half: 1.03, bottom: 0.45, h: 0.13, chamfer: 0.2 },
  post: { r: 0.085, at: 1.07, h: 0.62 },
} as const;

const s = Math.sin(ELEVATION);
const c = Math.cos(ELEVATION);

/** Where a world point lands on the canvas, in px from its centre (x right, y down). */
export function project(x: number, y: number, z: number) {
  const u = (x - z) / Math.SQRT2;
  const v = (-s * (x + z)) / Math.SQRT2 + y * c;
  return { x: u * ZOOM, y: -v * ZOOM };
}

/**
 * The inverse of `project` on the horizontal plane at height y: the world
 * point that lands `px`, `py` from the device's centre on screen.
 */
export function toWorld(px: number, py: number, y = 0): [number, number, number] {
  const a = (Math.SQRT2 * px) / ZOOM; // x − z
  const b = (Math.SQRT2 * (y * c + py / ZOOM)) / s; // x + z
  return [(a + b) / 2, y, (b - a) / 2];
}

const face = DEVICE.body.half + DEVICE.port.d;
const { at, r } = DEVICE.post;

/** The ports' world points and outward normals (on the plane y = 0). */
export const PORT_WORLD = {
  tl: { at: [-face, 0, 0], n: [-1, 0, 0] },
  tr: { at: [0, 0, -face], n: [0, 0, -1] },
  bl: { at: [0, 0, face], n: [0, 0, 1] },
  br: { at: [face, 0, 0], n: [1, 0, 0] },
} as const;

/** The ports, in px from the device's centre on the stage. */
export const PORTS = {
  tl: project(-face, 0, 0),
  tr: project(0, 0, -face),
  bl: project(0, 0, face),
  br: project(face, 0, 0),
  in: { x: project(-at, 0, at).x - r * ZOOM, y: 0 },
  out: { x: project(at, 0, -at).x + r * ZOOM, y: 0 },
};
