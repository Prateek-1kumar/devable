import { createContext, useContext } from "react";
import { Quaternion, Vector3, type Object3D } from "three";
import { craftR, craftTheta, vehicleScale } from "./timeline";
import { craftPosition, craftQuaternion } from "./world";

/**
 * Per-frame shared state, computed once at the start of every frame from the
 * smoothed scroll progress. Parts read it; only its own methods write it.
 */
export class MissionFrame {
  p = 0;
  t = 0;
  still = false;
  /** Camera distance to its target, for pixel-constant dashes. */
  dist = 14;
  craft = new Vector3();
  quat = new Quaternion();
  scale = 1;
  theta = 0;
  r = 0;
  /** World positions of the four array tips (valid after the vehicle pass). */
  tips = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  /** World position of the downlink dish (valid after the satellite pass): contact beams start here. */
  dish = new Vector3();
  /** World position of the payload instrument's aperture, the head of the craft (valid after the satellite pass). */
  head = new Vector3();
  /**
   * Ground stations (valid after the stations pass): the pin's world position, whether it faces the camera
   * (front), whether it has been lit by a first contact, and its contact envelope (0 out of contact, 1 locked).
   */
  stations = Array.from({ length: 5 }, () => ({ pos: new Vector3(), front: false, lit: false, live: 0 }));

  update(p: number, t: number, still: boolean) {
    this.p = p;
    this.t = t;
    this.still = still;
    craftPosition(p, this.craft);
    craftQuaternion(p, this.quat);
    this.scale = vehicleScale(p);
    this.theta = craftTheta(p);
    this.r = craftR(p);
  }
  setDist(d: number) {
    this.dist = d;
  }
  setTip(i: number, obj: Object3D) {
    obj.getWorldPosition(this.tips[i]);
  }
}

export const FrameContext = createContext<MissionFrame | null>(null);

export function useMission() {
  const frame = useContext(FrameContext);
  if (!frame) throw new Error("useMission must be used inside the mission scene");
  return frame;
}
