import { CatmullRomCurve3, QuadraticBezierCurve3, Vector3 } from "three";

// World-space layout for the growth engine. 1 unit ≈ 95px at a 900px-tall hero.

export const LAYER = { width: 3, baseWidth: 3.2, height: 0.5, gap: 0.14, radius: 0.09 };
export const layerWidth = (i: number) => (i === 0 ? LAYER.baseWidth : LAYER.width);
export const layerY = (i: number) => i * (LAYER.height + LAYER.gap) + LAYER.height / 2;
export const STACK_TOP = layerY(3) + LAYER.height / 2;

// Camera looks down ~30° from the front-right through a long lens, so the
// scene reads almost isometric (like an illustration) while tilting in real 3D.
const VIEW_DIR = new Vector3(1, 0.85, 1.25).normalize();
export const TARGET = new Vector3(0, 2.3, 0);
export const CAMERA_POSITION = TARGET.clone().addScaledVector(VIEW_DIR, 30);
export const CAMERA_FOV = 18;
/** Y rotation that turns an object's front (+z) face toward the camera. */
export const FACING_YAW = Math.atan2(VIEW_DIR.x, VIEW_DIR.z);

// Screen-aligned placement: a = right, b = up, c = toward the viewer.
const RIGHT = new Vector3(VIEW_DIR.z, 0, -VIEW_DIR.x).normalize();
const TOWARD = new Vector3(VIEW_DIR.x, 0, VIEW_DIR.z).normalize();
export const onScreen = (a: number, b: number, c = 0) =>
  new Vector3().addScaledVector(RIGHT, a).addScaledVector(TOWARD, c).setY(b);

/** Where each channel's token drifts to, by layer index (01 → 04). */
export const TOKEN_DEST = [onScreen(-4.4, 3.4), onScreen(-2.6, 4.9), onScreen(3.3, 3.5), onScreen(4.1, 1.3)];
export const GAUGE_POSITION = onScreen(2.1, 5.1);

export const TERMINAL = { position: onScreen(-3.4, 0, 1.6), yaw: FACING_YAW - 0.25, size: [1.7, 0.42, 1.1] as const };

// The signal rail is set into the stack's front-left corner.
export const RAIL = new Vector3(-1.47, 0, 1.47);

// The cable plugs into the terminal's right side and a socket on the base's
// front face, next to the rail; both ends get metal collars (see SignalPath).
const TERMINAL_RIGHT = new Vector3(Math.cos(TERMINAL.yaw), 0, -Math.sin(TERMINAL.yaw));
const FRONT = new Vector3(0, 0, 1);
export const CABLE_RADIUS = 0.07;
export const PORTS = {
  terminal: { at: TERMINAL.position.clone().addScaledVector(TERMINAL_RIGHT, TERMINAL.size[0] / 2).setY(0.2), dir: TERMINAL_RIGHT },
  stack: { at: new Vector3(-1.39, 0.28, LAYER.baseWidth / 2), dir: FRONT },
};
const ground = (v: Vector3) => v.setY(CABLE_RADIUS);
export const CABLE = new CatmullRomCurve3([
  PORTS.terminal.at.clone(),
  ground(PORTS.terminal.at.clone().addScaledVector(TERMINAL_RIGHT, 0.4)),
  ground(PORTS.terminal.at.clone().lerp(PORTS.stack.at, 0.5).addScaledVector(TOWARD, 0.45)),
  ground(PORTS.stack.at.clone().addScaledVector(FRONT, 0.45)),
  PORTS.stack.at.clone(),
]);

/** Control-point offset for each token's single-file pearl line to the gauge. */
export const LEAD_BOW = [onScreen(0.6, 1.2), onScreen(0.4, 0.9), onScreen(-0.3, 0.8), onScreen(-0.6, 1.4)];

// Tether from the core's socket up to the nub under the PIPELINE dial.
export const GAUGE_DIAL = { radius: 0.95, depth: 0.3, fillet: 0.1 };
export const TETHER_FROM = new Vector3(0, STACK_TOP + 0.3, 0);
export const TETHER_TO = GAUGE_POSITION.clone().setY(GAUGE_POSITION.y - GAUGE_DIAL.radius - 0.12);

/** The stack's right-hand edge, where the hover card pins itself. */
export const STACK_RIGHT = { x: LAYER.baseWidth / 2, z: -LAYER.baseWidth / 2 };
export const TETHER = new QuadraticBezierCurve3(
  TETHER_FROM,
  TETHER_FROM.clone().lerp(TETHER_TO, 0.5).add(onScreen(-0.7, 0.6)),
  TETHER_TO,
);
