import { CatmullRomCurve3, Vector3 } from "three";

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

// The signal rail is set into the stack's front-left corner; the cable feeds its foot.
export const RAIL = new Vector3(-1.47, 0, 1.47);
const CABLE_Y = 0.07;
const cableStart = TERMINAL.position
  .clone()
  .add(new Vector3(Math.cos(TERMINAL.yaw), 0, -Math.sin(TERMINAL.yaw)).multiplyScalar(TERMINAL.size[0] / 2 + 0.05))
  .setY(CABLE_Y);
const cableEnd = RAIL.clone().setY(CABLE_Y);
const cableMid = cableStart.clone().lerp(cableEnd, 0.5).addScaledVector(TOWARD, 0.5).setY(CABLE_Y);
export const CABLE = new CatmullRomCurve3([cableStart, cableMid, cableEnd]);
