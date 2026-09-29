// The coast: sky, sea, the headland's rock lobes, boulders, east stacks and the two neighbour lights.
import * as THREE from "three";
import { col, cyl, hash, rockGeo, tex, type Kit } from "./kit";
import { WORLD, seaMaterial, skyMaterial } from "./look";
import * as W from "./model";
import type { Frame } from "./world";

/** Vertex colours by height through a list of [y, colour] stops (sand rim → warm stone → grass cap). */
function paintStops<G extends THREE.BufferGeometry>(g: G, stops: [number, string][]) {
  const pos = g.attributes.position, c = new Float32Array(pos.count * 3), cs = stops.map(([, h]) => new THREE.Color(h)), t = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    let j = 0;
    while (j < stops.length - 2 && y > stops[j + 1][0]) j++;
    const k = Math.min(1, Math.max(0, (y - stops[j][0]) / (stops[j + 1][0] - stops[j][0])));
    t.lerpColors(cs[j], cs[j + 1], k * k * (3 - 2 * k)).toArray(c, i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}
const rockPaint = (y0: number, y1: number): [number, string][] => [[y0, WORLD.sand], [y0 + 0.3 * (y1 - y0), WORLD.pebble], [y0 + 0.42 * (y1 - y0), WORLD.rockLow], [y1, WORLD.rockHigh]];

function cliff(r: number, seed: number) {
  const prof = [[r + 0.5, -0.7], [r + 0.42, -0.1], [r + 0.3, 0.28], [r + 0.1, 0.58], [r - 0.12, 0.8], [r - 0.3, 0.93], [r - 0.42, 0.97]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(prof, 40);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const m = 1 - Math.min(1, Math.max(0, (y - 0.5) / 0.4));
    const k = 1 + 0.12 * (hash(Math.floor(x * 3 + seed), Math.floor(z * 3)) - 0.5) * m;
    pos.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return paintStops(g, [[-0.12, WORLD.sand], [0.1, WORLD.sand], [0.2, WORLD.pebble], [0.3, WORLD.rockLow], [0.62, WORLD.rockHigh], [0.76, WORLD.grassLow], [0.97, WORLD.grassHigh]]);
}

export function createCoast(k: Kit) {
  const { add, M, root } = k;
  // ── sky, sea, shadow plane ──
  const skyGeo = new THREE.BufferGeometry();
  skyGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const skyMat = skyMaterial();
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  root.add(sky);
  const seaMat = seaMaterial();
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.renderOrder = -1;
  root.add(sea);
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: WORLD.forest, opacity: 0.14, transparent: true }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.004;
  shadowPlane.receiveShadow = true;
  root.add(shadowPlane);
  // shore SDF: lobes [0..5], islets [6..7], quay [capsule 0], east stacks [10..12]
  const U = seaMat.uniforms;
  W.LOBES.forEach(([x, z, r], i) => U.uShore.value[i].set(x, z, r, 0));
  W.ISLETS.forEach((s, i) => U.uShore.value[6 + i].set(s.pos[0], s.pos[2], s.r * 1.1, 0));
  W.EAST_STACKS.forEach((q, i) => U.uShore.value[10 + i].set(q.pos[0], q.pos[2], q.r * 0.95, 0));
  U.uCapsules.value[0].set(W.HARBOUR.quay.from[0], W.HARBOUR.quay.from[2], W.HARBOUR.quay.to[0], W.HARBOUR.quay.to[2]);
  U.uCapR.value.set(0.4, 0.3);

  // ── land ──
  W.LOBES.forEach(([x, z, r], i) => {
    add(cliff(r, i), M.rock, [x, 0.05, z], null, root, true);
    add(paintStops(cyl(r - 0.4, r - 0.34, 0.08, 48), [[-1, WORLD.grassHigh], [1, WORLD.grassHigh]]), M.grass, [x, W.GROUND - 0.03, z]);
  });
  W.BOULDERS.forEach(([x, z, r], i) => {
    const g = rockGeo(i);
    paintStops(g, rockPaint(-0.4, 0.7));
    add(g, M.rock, [x, 0.05, z], [0, i, 0]).scale.setScalar(r);
  });
  W.EAST_STACKS.forEach((q, i) => {
    const g = rockGeo(i + 20, 1);
    paintStops(g, rockPaint(-0.6, 0.9));
    add(g, M.rock, [q.pos[0], q.h * 0.35, q.pos[2]], [0, i * 1.7, 0]).scale.set(q.r, q.h * 0.75, q.r);
  });
  // static AO decal at the tower foot
  const aoTex = tex(128, 128, (x) => {
    const g = x.createRadialGradient(64, 64, 26, 64, 64, 64);
    g.addColorStop(0, "rgba(12,59,41,.12)");
    g.addColorStop(1, "rgba(12,59,41,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
  });
  const ao = add(new THREE.RingGeometry(W.AO_DECAL.r0, W.AO_DECAL.r1, 48), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, toneMapped: false }), [0, W.AO_DECAL.y, 0], [-Math.PI / 2, 0, 0]);
  ao.renderOrder = 1;
  // neighbour lights: ghost towers, lamps (off) and a neutral halo that pulses with the blink
  const nBody = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
  const nCap = new THREE.MeshStandardMaterial({ color: "#2f5a48", roughness: 0.45 });
  const nRock = new THREE.MeshStandardMaterial({ color: WORLD.rockLow, roughness: 0.9, flatShading: true });
  const neighbours = W.NEIGHBOURS.map((n, i) => {
    const c = "#ec6b62", w = "#fbf8f2";
    const band: [number, string][] = [[-n.h / 2, w], [-0.35, w], [-0.34, c], [-0.02, c], [-0.01, w], [0.3, w], [0.31, c], [0.62, c], [0.63, w], [n.h / 2, w]];
    add(paintStops(new THREE.CylinderGeometry(0.2, 0.3, n.h, 20, 40), band), nBody, [n.pos[0], n.h / 2, n.pos[2]]);
    add(rockGeo(40 + i), nRock, [n.pos[0], 0.05, n.pos[2]]).scale.set(0.75, 0.4, 0.75); // its own rock, foam in shore slots 8–9
    U.uShore.value[8 + i].set(n.pos[0], n.pos[2], 0.6, 0);
    add(cyl(0.34, 0.3, 0.06, 20), nCap, [n.pos[0], n.h + 0.02, n.pos[2]]); // gallery
    add(new THREE.ConeGeometry(0.26, 0.28, 20), nCap, [n.pos[0], n.h + 0.36, n.pos[2]]);
    const lamp = add(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: W.NEIGHBOUR_LAMP.off }), [n.pos[0], n.h + 0.1, n.pos[2]]);
    const halo = k.sprite(k.HALO.neutral, W.NEIGHBOUR_LAMP.halo);
    halo.position.copy(lamp.position);
    root.add(halo);
    return { lamp, halo };
  });

  const right = new THREE.Vector3();
  return {
    sky,
    pose(f: Frame) {
      const { p, a, time } = f;
      U.uShallow.value.copy(col("#cdebe0", WORLD.shallow, a.sea));
      U.uDeep.value.copy(col("#9fd6c6", WORLD.deep, a.sea));
      U.uFar.value.copy(col("#6fb5a8", WORLD.far, a.sea));
      U.uTrough.value.copy(col("#bfe5d8", WORLD.trough, a.sea));
      U.uTime.value = time;
      right.setFromMatrixColumn(f.camera.matrixWorld, 0);
      U.uCamRight.value.set(right.x, right.z).normalize();
      U.uDpr.value = f.dpr;
      skyMat.uniforms.uInvProj.value.copy(f.camera.projectionMatrixInverse);
      skyMat.uniforms.uCamWorld.value.copy(f.camera.matrixWorld);
      skyMat.uniforms.uSun.value.copy(f.sunDir);
      skyMat.uniforms.uGlowAmt.value = W.lerp(0.55, 0.25, p);
      U.uBeamDir.value.set(Math.sin(f.bm.bearing * W.DEG), -Math.cos(f.bm.bearing * W.DEG));
      U.uBeamStrength.value = f.bm.light;
      const sh = W.shipOne(p, f.t[3]);
      U.uBoat.value.set(sh.pos[0], sh.pos[2], Math.sin(sh.heading * W.DEG), -Math.cos(sh.heading * W.DEG));
      const kb = W.neighbourBlink(p, f.t[0]);
      neighbours.forEach(({ lamp, halo }) => {
        lamp.material.color.copy(col(W.NEIGHBOUR_LAMP.off, W.NEIGHBOUR_LAMP.on, kb));
        halo.material.opacity = kb;
        halo.visible = kb > 0.01;
      });
    },
  };
}
