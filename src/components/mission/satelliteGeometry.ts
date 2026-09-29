import { BoxGeometry, CylinderGeometry, Euler, Matrix4, Quaternion, Vector3, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MOUNTS } from "./SatArrays";

// Static bus parts that share a material, merged so each material is one draw.

export const BUS = { w: 0.2, h: 0.26 } as const;
export const SKIN = 0.002; // blanket thickness
export const FACE = 0.188; // blankets stop short of the rounded edges, which read as edge tape
/** Distance of a blanket's centre from the bus centre: 1 mm proud of the core so nothing is coplanar. */
export const FACE_OFF = BUS.w / 2 + SKIN / 2;

const placed = (g: BufferGeometry, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) =>
  g.applyMatrix4(new Matrix4().compose(new Vector3(...pos), new Quaternion().setFromEuler(new Euler(...rot)), new Vector3(1, 1, 1)));

/** Gold MLI: the two side blankets and the deck blanket (each a thin box whose +Z face looks outward). */
export function goldGeometry() {
  return mergeGeometries([
    placed(new BoxGeometry(FACE, 0.248, SKIN), [FACE_OFF, 0, 0], [0, Math.PI / 2, 0]),
    placed(new BoxGeometry(FACE, 0.248, SKIN), [-FACE_OFF, 0, 0], [0, -Math.PI / 2, 0]),
    placed(new BoxGeometry(FACE, FACE, SKIN), [0, BUS.h / 2 + SKIN / 2, 0], [-Math.PI / 2, 0, 0]),
  ]);
}

/** Four thruster bells at the lower corners, canted outward. */
export function thrusterGeometry() {
  return mergeGeometries(
    [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ].map(([x, z]) => placed(new CylinderGeometry(0.004, 0.012, 0.02, 16, 1, true), [x * 0.082, -BUS.h / 2 - 0.009, z * 0.082], [z * 0.25, 0, -x * 0.25])),
  );
}

/** The wing standoffs, from each gold face out to its hinge. */
export function standoffGeometry() {
  return mergeGeometries(
    MOUNTS.map((m) => {
      const len = m.x - BUS.w / 2;
      return placed(new BoxGeometry(len, 0.01, 0.014), [m.face * (BUS.w / 2 + len / 2), -0.02, m.z]);
    }),
  );
}
