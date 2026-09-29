// 04 targets: the buoyed channel (search), the loom on the fog wall (AI), the anchorage (community), the islet
// beacons with their relay beams (creators), and ship one sailing the lit sector.
import * as THREE from "three";
import { basic, col, cyl, flat, paintHeight, radial, rockGeo, setHull, tex, type Kit } from "./kit";
import { MIST, WORLD, beamMaterial, withMist } from "./look";
import * as W from "./model";
import type { Frame } from "./world";

export function createTargets(k: Kit) {
  const { add, M, root } = k;
  const { DEG } = W;
  const t04 = new THREE.Group();
  root.add(t04);
  // channel paints (local): glossy, a touch self-lit so they stay saturated in the bright haze
  const paint = (c: string, e = 0.18) => withMist(new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: e, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }), "physical");
  const azurePaint = paint(WORLD.azure), sunPaint = paint(WORLD.sunCh), emeraldPaint = paint(WORLD.emeraldCh);
  const foamMat = flat("#ffffff", 0.55);
  const foam = (r: number, parent: THREE.Object3D, y = 0.02) => add(new THREE.RingGeometry(r, r * 1.45, 40), foamMat, [0, y, 0], [-Math.PI / 2, 0, 0], parent);

  // (1) search: a line of real channel buoys (can float, fender, banded body, lantern), lit 1→5 like a ranking
  const buoys = W.BUOYS.map((b) => {
    const g = new THREE.Group();
    g.position.set(b[0], 0, b[2]);
    t04.add(g);
    add(cyl(0.3, 0.26, 0.3, 24), azurePaint, [0, 0.07, 0], null, g, true); // can float
    add(new THREE.TorusGeometry(0.3, 0.035, 8, 32), M.lacquer, [0, 0.2, 0], [Math.PI / 2, 0, 0], g); // fender
    add(cyl(0.12, 0.22, 0.55, 20), M.porcelain, [0, 0.5, 0], null, g, true); // body
    add(cyl(0.172, 0.184, 0.14, 20), azurePaint, [0, 0.5, 0], null, g); // colour band
    add(cyl(0.14, 0.14, 0.05, 20), M.lacquer, [0, 0.8, 0], null, g); // deck
    for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2; add(cyl(0.012, 0.012, 0.24, 5), M.lacquer, [Math.sin(a) * 0.08, 0.93, Math.cos(a) * 0.08], null, g); } // lamp cage
    const lamp = add(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshBasicMaterial({ color: "#dfe7e2" }), [0, 0.98, 0], null, g);
    add(new THREE.ConeGeometry(0.1, 0.1, 16), M.lacquer, [0, 1.11, 0], null, g); // lamp hood
    foam(0.3, g);
    const h = k.sprite(k.HALO.azure, W.BUOY_HALO);
    h.position.set(0, 0.98, 0);
    g.add(h);
    return { g, lamp, h };
  });

  // (2) AI: a soft azure loom above the fog, the ✦ spark in it (seen before it is visited)
  const loomTex = radial([[0, "rgba(240,250,255,1)"], [0.22, "rgba(111,208,255,.9)"], [0.55, "rgba(14,165,233,.4)"], [1, "rgba(14,165,233,0)"]]);
  const loom = new THREE.Sprite(new THREE.SpriteMaterial({ map: loomTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  loom.scale.set(W.LOOM.w, W.LOOM.h, 1);
  loom.position.set(...W.LOOM.pos);
  loom.renderOrder = 3;
  t04.add(loom);
  const starAt = [W.LOOM.pos[0] + W.LOOM.starOff[0], W.LOOM.pos[1] + W.LOOM.starOff[1], W.LOOM.pos[2]] as const;
  const starGlow = k.sprite(k.HALO.azure, W.LOOM.star * 2.2, { renderOrder: 5 });
  starGlow.position.set(...starAt);
  t04.add(starGlow);
  const loomStar = k.sprite(k.GLYPH["✦"], W.LOOM.star);
  loomStar.position.set(...starAt);
  t04.add(loomStar);

  // (3) community: a cove of moored boats (mooring balls, pennants running up) and the r/ sign on a pile
  const anchorBoats = W.ANCHORAGE.boats.map(([dx, dz, a]) => {
    const h = k.hullKind("sloop", 1.3, WORLD.emeraldCh);
    h.position.set(W.ANCHORAGE.center[0] + dx * 1.1, 0, W.ANCHORAGE.center[2] + dz * 1.1);
    t04.add(h);
    h.userData.pen.scale.setScalar(1.5);
    const ball = new THREE.Group();
    ball.position.set(h.position.x + Math.cos(a * DEG) * 1.15, 0, h.position.z + Math.sin(a * DEG) * 1.15);
    t04.add(ball);
    add(new THREE.SphereGeometry(0.11, 16, 10), emeraldPaint, [0, 0.05, 0], null, ball);
    foam(0.1, ball);
    return h;
  });
  const penTop = anchorBoats.map((h) => h.userData.pen.position.y);
  const [rx, , rz] = W.ANCHORAGE.center;
  const rSign = new THREE.Group();
  rSign.position.set(rx, 0, rz + 0.2);
  t04.add(rSign);
  add(cyl(0.1, 0.12, 0.34, 12), M.lacquer, [0, 0.1, 0], null, rSign, true); // pile
  foam(0.12, rSign);
  add(cyl(0.035, 0.035, W.R_MARK.post, 8), M.lacquer, [0, W.R_MARK.post / 2, 0], null, rSign, true);
  const rTex = tex(128, 128, (x) => { x.fillStyle = "#10b981"; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "700 64px system-ui"; x.textAlign = "center"; x.fillText("r/", 64, 86); });
  const rTexOff = tex(128, 128, (x) => { x.fillStyle = "#eef7f1"; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.strokeStyle = "rgba(16,185,129,.7)"; x.lineWidth = 6; x.stroke(); x.fillStyle = "rgba(23,154,85,.75)"; x.font = "700 64px system-ui"; x.textAlign = "center"; x.fillText("r/", 64, 86); });
  const rMat = basic(rTexOff);
  const disc = new THREE.Group();
  disc.position.set(0, W.R_MARK.post + W.R_MARK.r, 0);
  disc.rotation.y = -20 * DEG;
  rSign.add(disc);
  add(new THREE.CircleGeometry(W.R_MARK.r, 40), rMat, [0, 0, 0.012], null, disc);
  add(new THREE.CircleGeometry(W.R_MARK.r, 40), M.porcelain, [0, 0, -0.012], [0, Math.PI, 0], disc); // back plate
  add(new THREE.TorusGeometry(W.R_MARK.r, 0.035, 8, 48), M.lacquer, null, null, disc); // rim
  const rGlow = k.sprite(k.HALO.emerald, 150, { renderOrder: 2 });
  rGlow.position.set(0, 0, -0.2);
  disc.add(rGlow);
  const anchorRing = k.dashedRing(WORLD.emeraldCh, 0.6);
  t04.add(anchorRing);

  // (4) creators: islets with small banded beacon towers that flare sun-yellow and relay the beam onward
  const beacons = W.ISLETS.map((s, i) => {
    const g = rockGeo(40 + i);
    paintHeight(g, WORLD.rockLow, WORLD.rockHigh, -0.5, 0.8);
    add(g, M.rock, [s.pos[0], 0.0, s.pos[2]]).scale.set(s.r * 1.4, s.r * 0.7, s.r * 1.4);
    const turf = paintHeight(rockGeo(60 + i, 0.3), WORLD.grassLow, WORLD.grassHigh, -0.2, 0.3);
    add(turf, M.grass, [s.pos[0] + 0.1, s.r * 0.36, s.pos[2] - 0.05]).scale.set(s.r * 0.95, s.r * 0.6, s.r * 0.95);
    const c = new THREE.Group();
    c.position.set(s.pos[0], 0.4, s.pos[2]);
    t04.add(c);
    const hb = s.beacon, rAt = (y: number) => 0.19 - 0.07 * (y / hb);
    add(cyl(0.26, 0.3, 0.2, 20), M.stone, [0, 0.05, 0], null, c, true); // plinth
    add(cyl(0.12, 0.19, hb, 20), M.porcelain, [0, hb / 2, 0], null, c, true); // tower
    for (const y of [0.3, 0.62]) add(cyl(rAt(y * hb + 0.1) + 0.008, rAt(y * hb - 0.1) + 0.008, 0.2, 20), sunPaint, [0, y * hb, 0], null, c); // day-mark bands
    add(cyl(0.22, 0.2, 0.05, 20), M.lacquer, [0, hb, 0], null, c); // gallery
    add(new THREE.TorusGeometry(0.2, 0.012, 6, 32), M.lacquer, [0, hb + 0.1, 0], [Math.PI / 2, 0, 0], c); // rail
    const lamp = add(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshBasicMaterial({ color: "#e8e2cf" }), [0, 0.15 + hb, 0], null, c);
    add(new THREE.ConeGeometry(0.15, 0.16, 16), M.lacquer, [0, hb + 0.33, 0], null, c); // cap
    const h = k.sprite(k.HALO.sun, 72);
    h.position.set(0, 0.15 + hb, 0);
    c.add(h);
    return { c, lamp, h };
  });
  const relayMat = beamMaterial(WORLD.sunCh, "#fff1c8", W.RELAY.opacity * 2.2);
  const relays = W.ISLETS.map((s) => {
    const g = new THREE.CylinderGeometry(0.06, W.RELAY.endR, W.RELAY.len, 32, 1, true);
    g.translate(0, -W.RELAY.len / 2, 0);
    g.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, relayMat);
    m.renderOrder = 4;
    m.position.set(s.pos[0], 0.55 + s.beacon, s.pos[2]);
    m.rotation.y = -(W.bearingOf(s.pos[0], s.pos[2]) + W.RELAY.swing - 90) * DEG;
    t04.add(m);
    return m;
  });
  const ship1 = k.hullKind("sloop", 1.9, WORLD.azure);

  return {
    pose(f: Frame) {
      const { p, b, r4, time } = f;
      const k4 = b.targets04;
      t04.visible = k4 > 0.001;
      buoys.forEach(({ g, lamp, h }, i) => {
        g.position.y = -0.9 * (1 - k4) + 0.03 * Math.sin(time * 1.7 + i * 1.3); // riding the swell
        g.rotation.set(0.05 * Math.sin(time * 1.1 + i * 2.1), 0, 0.06 * Math.sin(time * 1.3 + i));
        lamp.material.color.copy(col("#dfe7e2", WORLD.azure, r4.lamps[i]));
        h.material.opacity = r4.lamps[i];
        h.visible = r4.lamps[i] > 0.01;
      });
      loom.material.opacity = r4.loom;
      loomStar.visible = r4.star > 0.01;
      loomStar.scale.setScalar(k.pxScale(W.LOOM.star) * Math.max(0.2, r4.star));
      starGlow.visible = loomStar.visible;
      starGlow.material.opacity = Math.min(1, r4.star);
      anchorBoats.forEach((h, i) => {
        h.visible = k4 > 0.5;
        h.rotation.y = -(W.ANCHORAGE.boats[i][2] - 35 * r4.swing) * DEG;
        const pen = h.userData.pen;
        pen.visible = r4.pennants04 > 0.02;
        pen.position.y = W.lerp(0.3, penTop[i], r4.pennants04); // run up the mast
      });
      rSign.visible = k4 > 0.5;
      const map = r4.rLit > 0.5 ? rTex : rTexOff;
      if (rMat.map !== map) rMat.map = map;
      rGlow.visible = r4.rLit > 0.01;
      rGlow.material.opacity = r4.rLit;
      anchorRing.visible = r4.ring.alpha > 0.01;
      anchorRing.scale.setScalar(r4.ring.r);
      anchorRing.position.set(W.ANCHORAGE.center[0], 0.03, W.ANCHORAGE.center[2]);
      anchorRing.material.opacity = 0.6 * r4.ring.alpha;
      beacons.forEach(({ c, lamp, h }) => {
        c.scale.set(1, Math.max(0.02, k4), 1);
        lamp.material.color.copy(col("#e8e2cf", WORLD.sunCh, r4.flare));
        h.material.opacity = r4.flare;
        h.visible = r4.flare > 0.01;
      });
      relays.forEach((m) => { m.visible = r4.relay > 0.01; });
      relayMat.uniforms.uLight.value = r4.relay;
      relayMat.uniforms.uTime.value = time;
      W.ISLETS.forEach((s, i) => {
        const d = W.dir(W.bearingOf(s.pos[0], s.pos[2]) + W.RELAY.swing);
        MIST.uHoles.value[4 + i].set(s.pos[0] + d[0] * W.RELAY.len, s.pos[2] + d[2] * W.RELAY.len, W.RELAY.hole, r4.relay);
      });
      const sh = W.shipOne(p, f.t[3]);
      setHull(ship1, sh.pos, sh.heading);
      ship1.visible = sh.visible && sh.alpha > 0.3;
    },
  };
}
