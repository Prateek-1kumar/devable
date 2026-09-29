import { Quaternion, Vector3, type Object3D } from "three";
import { contact, eio, latchAt, R, seg, smooth, STATIONS, SUN_ORBIT } from "./timeline";
import { C, STATION_N } from "./world";

// The satellite's own motion, pure functions of p (scrubbing backwards is exact): after the last wing
// latches, the array normal (the bus's +Y) slews toward the sun, held within 40° of the local vertical;
// the dish swings out on its boom and tracks the active ground station, nadir between contacts.

const Y = new Vector3(0, 1, 0);
const SUN = new Vector3(...SUN_ORBIT).normalize();
const MAX_OFF = (40 * Math.PI) / 180;
const radial = new Vector3();
const up = new Vector3();
const craftUp = new Vector3();
const qa = new Quaternion();
const qb = new Quaternion();
const qi = new Quaternion();

/** The satellite's attitude relative to the craft group (whose world attitude is craftQuat). */
export function satelliteAttitude(p: number, craft: Vector3, craftQuat: Quaternion, out: Quaternion) {
  const w = eio(seg(p, latchAt(3) + 0.003, 0.585));
  if (w <= 0) return out.identity();
  radial.subVectors(craft, C).normalize();
  const ang = radial.angleTo(SUN);
  qa.setFromUnitVectors(radial, SUN);
  qi.identity().slerp(qa, ang > 1e-6 ? Math.min(1, MAX_OFF / ang) : 0);
  up.copy(radial).applyQuaternion(qi); // the sun direction, clamped to 40° off the vertical
  craftUp.copy(Y).applyQuaternion(craftQuat);
  qb.setFromUnitVectors(craftUp, up);
  qi.identity().slerp(qb, w); // the world-space slew, part way by w
  return out.copy(craftQuat).invert().multiply(qi).multiply(craftQuat);
}

const STOWED = new Quaternion().setFromUnitVectors(Y, new Vector3(0, 0, -1)); // folded flat on the radiator, facing out
const pos = new Vector3();
const dir = new Vector3();
const toStation = new Vector3();
const parentQ = new Quaternion();
const aimQ = new Quaternion();

export const dishAim = {
  /** The boom swings out after DEVABLE ONLINE, before the wings. */
  deploy: (p: number) => smooth(seg(p, 0.47, 0.49)),
  /** The dish's local quaternion under `parent` (the boom): nadir, slewing onto the station in contact. */
  aim(p: number, th: number, parent: Object3D, deployed: number, out: Quaternion) {
    parent.getWorldPosition(pos);
    dir.subVectors(C, pos).normalize();
    let best = 0;
    let bestK = -1;
    STATIONS.forEach((_, k) => {
      const hit = contact(k, th);
      if (!hit) return;
      const env = eio(seg(hit.c, 0, 0.12)) * (1 - eio(seg(hit.c, 0.88, 1)));
      if (env > best) [best, bestK] = [env, k];
    });
    if (bestK >= 0) {
      toStation.copy(C).addScaledVector(STATION_N[bestK], R).sub(pos).normalize();
      dir.lerp(toStation, best).normalize();
    }
    parent.getWorldQuaternion(parentQ).invert();
    aimQ.setFromUnitVectors(Y, dir.applyQuaternion(parentQ));
    return out.slerpQuaternions(STOWED, aimQ, deployed);
  },
};
