// The whole world as one three.js group: every section built once, posed as a pure function of (p, clocks).
// World owns the camera, the sun, the hemisphere, the environment and the mist uniforms; sections pose their own parts.
import * as THREE from "three";
import { createChart } from "./chart";
import { createCoast } from "./coast";
import { createHarbour } from "./harbour";
import { createKit } from "./kit";
import { MIST, WORLD } from "./look";
import * as W from "./model";
import { createSurvey } from "./survey";
import { createTargets } from "./targets";
import { createTower } from "./tower";

type Clocks = readonly [number, number, number, number, number];
/** The copy moved into a bottom-right card, so every shot anchor slides left by one constant (SHOTS stay as verified). */
const AX_SHIFT = 0.12;

/** Everything a section's pose reads, computed once per frame. */
export interface Frame {
  p: number;
  time: number; // ambient clock (breathing, sea, mist)
  t: Clocks; // station loop clocks 01–05
  lit: number; // lamp ignition 0..1
  a: W.Atmos;
  b: W.Builds;
  ts: W.TowerState;
  bm: W.BeamCue;
  r4: ReturnType<typeof W.response04>;
  sunDir: THREE.Vector3;
  camera: THREE.PerspectiveCamera;
  dpr: number;
}

export interface PoseInput {
  p: number;
  time: number;
  loopT: Clocks;
  lit: number;
  camera: THREE.PerspectiveCamera;
  width: number;
  height: number;
  dpr: number;
}

export function createWorld() {
  const root = new THREE.Group();
  const kit = createKit(root);
  const hemi = new THREE.HemisphereLight("#eef6fb", WORLD.bounce, 0.9);
  const sun = new THREE.DirectionalLight(WORLD.sun, 1.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  root.add(hemi, sun, sun.target);
  const sections = [createCoast(kit), createTower(kit), createSurvey(kit), createChart(kit), createTargets(kit), createHarbour(kit)];

  const sunDir = new THREE.Vector3();
  const focusEarly = new THREE.Vector3(0, 1, 1.2), focusLate = new THREE.Vector3(1.2, 1, 3.0);
  let shadowHalf = 0;

  return {
    root,
    /** The studio environment (soft window + top light), baked once into the scene's PMREM. */
    attach(scene: THREE.Scene, gl: THREE.WebGLRenderer) {
      const pm = new THREE.PMREMGenerator(gl);
      const env = new THREE.Scene();
      env.background = new THREE.Color("#e6ebe8"); // a touch below white so porcelain keeps its form
      const l1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide }));
      l1.position.set(-4, 5, 4);
      l1.lookAt(0, 0, 0);
      const l2 = new THREE.Mesh(new THREE.CircleGeometry(2, 24), new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide }));
      l2.position.set(0, 8, 0);
      l2.lookAt(0, 0, 0);
      env.add(l1, l2);
      const target = pm.fromScene(env, 0.04);
      scene.environment = target.texture;
      pm.dispose();
      for (const m of [l1, l2]) {
        m.geometry.dispose();
        m.material.dispose();
      }
      return () => {
        if (scene.environment === target.texture) scene.environment = null;
        target.dispose();
      };
    },
    pose({ p, time, loopT, lit, camera, width, height, dpr }: PoseInput) {
      kit.resize(height);
      // camera: the shot, the lens shift that lands the target at (ax, ay), and the aspect guard below 1.6
      const s = W.shotAt(p), aspect = width / Math.max(1, height);
      const cp = W.camPos({ ...s, dist: s.dist * Math.max(1, 1.6 / aspect) });
      camera.fov = s.fov;
      camera.position.set(...cp);
      camera.lookAt(...s.target);
      camera.setViewOffset(width, height, (0.5 - (s.ax - AX_SHIFT)) * width, (0.5 - s.ay) * height, width, height);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      // sun, hemisphere and the mist
      const a = W.atmosAt(p);
      const el = a.elev * W.DEG, az = W.SUN_AZIMUTH * W.DEG;
      sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      const early = p < W.WIN.L3.from + W.RISE.frustum * (W.WIN.L3.to - W.WIN.L3.from);
      const focus = early ? focusEarly : focusLate, half = early ? 9 : 20;
      sun.position.copy(focus).addScaledVector(sunDir, 40);
      sun.target.position.copy(focus);
      if (half !== shadowHalf) {
        shadowHalf = half;
        const c = sun.shadow.camera;
        c.left = -half; c.right = half; c.top = half; c.bottom = -half; c.near = 1; c.far = 90;
        c.updateProjectionMatrix();
      }
      sun.color.set(a.sun);
      sun.intensity = a.sunI;
      hemi.intensity = a.hemi;
      MIST.uReach.value = a.R;
      MIST.uBank.value = a.bank;
      MIST.uSeaMist.value = W.seaMist(a.R);
      MIST.uMistTime.value = time;
      MIST.uHaze.value.set(s.dist + a.hazeN, s.dist + a.hazeF);
      MIST.uView.value.set(width * dpr, height * dpr);
      const bm = W.beamAt(p, loopT[3]);
      MIST.uBeam.value.set(bm.bearing * W.DEG, 7 * W.DEG, W.mistBeamStrength(p, bm.light));
      const f: Frame = {
        p, time, t: loopT, lit, a, b: W.builds(p), ts: W.towerState(p), bm, r4: W.response04(p, loopT[3], a.bank), sunDir, camera, dpr,
      };
      for (const sec of sections) sec.pose(f);
    },
    dispose() {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Sprite) {
          o.geometry.dispose();
          const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
            m.dispose();
          }
        }
      });
      sun.shadow.map?.dispose();
    },
  };
}
export type World = ReturnType<typeof createWorld>;
