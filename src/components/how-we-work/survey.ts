// 01 survey: the brass telescope on its tripod, the positioning map on its easel, the three vessels and a dashed sight line, the pulse sweep and reach rings.
import * as THREE from "three";
import { basic, cyl, flat, safeLine, setHull, tex, type Kit } from "./kit";
import { MIST, WORLD, withMist } from "./look";
import * as W from "./model";
import type { Frame } from "./world";

/** Face-local point on the plane-table (u 0..1 left → right, v 0..1 top → bottom, as the 01 viewer sees it). */
export function boardPoint(u: number, v: number, lift = 0) {
  const B = W.BOARD, f = W.dir(B.faces), right = W.dir(B.faces - 90), t = B.tilt * W.DEG;
  const c = [B.pos[0], W.GROUND + B.stand + 0.3, B.pos[2]];
  const fx = (u - 0.5) * B.w, fy = (0.5 - v) * B.h;
  return [c[0] + right[0] * fx - f[0] * fy * Math.cos(t) + f[0] * lift, c[1] + fy * Math.sin(t), c[2] + right[2] * fx - f[2] * fy * Math.cos(t) + f[2] * lift];
}

export function createSurvey(k: Kit) {
  const { add, M, root } = k;
  // local instrument materials: lacquered teak, polished brass, a dark objective glass
  const WOOD = withMist(new THREE.MeshPhysicalMaterial({ color: "#8a5634", roughness: 0.38, clearcoat: 0.85, clearcoatRoughness: 0.2 }), "physical");
  const BRASS = withMist(new THREE.MeshStandardMaterial({ color: "#d4a444", metalness: 0.85, roughness: 0.24 }), "brass");
  const GLASS = withMist(new THREE.MeshPhysicalMaterial({ color: "#1d4f5e", emissive: "#2f8fa8", emissiveIntensity: 0.25, roughness: 0.05, clearcoat: 1 }), "physical");
  /** Tripod leg (wood, brass foot + clamp) at angle a, radius r, splayed s rad so the feet sit wider than the head. */
  const leg = (parent: THREE.Object3D, a: number, r: number, h: number, s: number, t: number) => {
    const m = add(cyl(t * 0.8, t, h, 8), WOOD, [Math.sin(a) * r, h / 2, Math.cos(a) * r], [-Math.cos(a) * s, 0, Math.sin(a) * s], parent, true);
    add(cyl(t * 1.25, t * 1.45, 0.05, 8), BRASS, [0, -h / 2 + 0.025, 0], null, m);
    add(cyl(t * 1.2, t * 1.2, 0.035, 8), BRASS, [0, -h * 0.18, 0], null, m);
    return m;
  };
  const scope = new THREE.Group();
  scope.position.set(...W.TELESCOPE.pos);
  root.add(scope);
  for (let i = 0; i < 3; i++) leg(scope, i * 2.094, 0.2, W.TELESCOPE.legs, 0.24, 0.024);
  add(cyl(0.1, 0.11, 0.05, 20), BRASS, [0, W.TELESCOPE.legs - 0.02, 0], null, scope, true); // tripod head
  const tubeG = new THREE.Group();
  tubeG.position.y = W.TELESCOPE.legs;
  scope.add(tubeG);
  add(cyl(0.035, 0.045, 0.07, 12), BRASS, [0, 0.025, 0], null, tubeG); // pan post
  // brass draw-tube telescope along local −z (objective at −z, eyepiece at +z); rotation.y = −bearing aims it
  const tube = new THREE.Group();
  tube.position.y = 0.06;
  tube.rotation.x = 0.03;
  tubeG.add(tube);
  const seg = (r0: number, r1: number, z0: number, z1: number, m: THREE.Material, n = 20) =>
    add(cyl(r1, r0, z0 - z1, n), m, [0, 0, (z0 + z1) / 2], [-Math.PI / 2, 0, 0], tube, true); // r0 at z0 (+z end), r1 at z1
  seg(0.03, 0.03, 0.33, 0.29, M.lacquer, 12); // eye cup
  seg(0.022, 0.022, 0.29, 0.19, BRASS, 12); // eyepiece
  seg(0.034, 0.034, 0.19, 0.02, BRASS); // draw tube
  seg(0.046, 0.046, 0.02, -0.02, BRASS); // collar
  seg(0.045, 0.045, -0.02, -0.26, BRASS); // draw tube
  seg(0.062, 0.062, -0.26, -0.3, BRASS); // band
  seg(0.058, 0.074, -0.3, -0.8, M.lacquer); // lacquered forest barrel
  seg(0.08, 0.08, -0.52, -0.56, BRASS); // mid band
  seg(0.084, 0.086, -0.8, -0.9, BRASS); // objective cell
  add(new THREE.CircleGeometry(0.07, 24), GLASS, [0, 0, -0.902], [0, Math.PI, 0], tube);
  const sightMat = new THREE.LineDashedMaterial({ color: WORLD.forest, transparent: true, opacity: 0.5, dashSize: 0.35, gapSize: 0.22 });
  const sight = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), sightMat);
  root.add(sight);
  // plane-table: face group from boardPoint (u right, v down) → local x right, y up
  const boardFace = k.faceGroup((x, y, lift) => boardPoint(0.5 + x / W.BOARD.w, 0.5 - y / W.BOARD.h, lift));
  const boardLegs = new THREE.Group();
  boardLegs.position.set(...W.BOARD.pos);
  root.add(boardLegs);
  for (let i = 0; i < 3; i++) leg(boardLegs, i * 2.094 + 0.5, 0.2, W.BOARD.stand + 0.1, 0.2, 0.02);
  add(cyl(0.07, 0.07, 0.05, 16), BRASS, [0, W.BOARD.stand + 0.1, 0], null, boardLegs); // easel head
  // the positioning map: warm paper, fine grid, a 2×2 with double-headed axes; crowded top-left, open bottom-right
  const boardTex = tex(512, 390, (x, w, h) => {
    x.fillStyle = "#fbf8ef"; x.fillRect(0, 0, w, h);
    x.fillStyle = "rgba(120,132,125,.13)"; x.fillRect(0, 0, w / 2, h / 2);
    x.fillStyle = "rgba(23,154,85,.10)"; x.fillRect(w / 2, h / 2, w / 2, h / 2);
    x.strokeStyle = "rgba(12,59,41,.08)"; x.lineWidth = 1.5; x.beginPath();
    for (let gx = 0; gx <= w; gx += 32) { x.moveTo(gx, 0); x.lineTo(gx, h); }
    for (let gy = 3; gy <= h; gy += 32) { x.moveTo(0, gy); x.lineTo(w, gy); }
    x.stroke();
    x.strokeStyle = x.fillStyle = "#0c3b29"; x.lineWidth = 4; x.lineCap = "round";
    x.beginPath(); x.moveTo(w / 2, 26); x.lineTo(w / 2, h - 26); x.moveTo(26, h / 2); x.lineTo(w - 26, h / 2); x.stroke();
    const head = (px: number, py: number, dx: number, dy: number) => { x.beginPath(); x.moveTo(px + dx * 16, py + dy * 16); x.lineTo(px - dy * 9, py + dx * 9); x.lineTo(px + dy * 9, py - dx * 9); x.closePath(); x.fill(); };
    head(w / 2, 22, 0, -1); head(w / 2, h - 22, 0, 1); head(22, h / 2, -1, 0); head(w - 22, h / 2, 1, 0);
    x.lineWidth = 3;
    for (let i = 1; i < 8; i++) if (i !== 4) { const tx = (w * i) / 8, ty = (h * i) / 8; x.beginPath(); x.moveTo(tx, h / 2 - 7); x.lineTo(tx, h / 2 + 7); x.moveTo(w / 2 - 7, ty); x.lineTo(w / 2 + 7, ty); x.stroke(); }
    x.font = "700 26px system-ui"; x.fillStyle = "rgba(12,59,41,.7)";
    x.textAlign = "left"; x.fillText("CROWDED", 30, h / 2 - 16);
    x.fillStyle = "#179a55"; x.fillText("OPEN", w / 2 + 16, h - 20); // clear of the ⊙ fix and its ticks
  });
  add(new THREE.BoxGeometry(W.BOARD.w + 0.1, W.BOARD.h + 0.1, 0.045), WOOD, [0, 0, -0.026], null, boardFace, true); // teak frame
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.BoxGeometry(0.07, 0.07, 0.052), BRASS, [sx * (W.BOARD.w / 2 + 0.03), sy * (W.BOARD.h / 2 + 0.03), -0.022], null, boardFace); // corner caps
  add(new THREE.BoxGeometry(W.BOARD.w + 0.14, 0.035, 0.09), WOOD, [0, -W.BOARD.h / 2 - 0.065, 0.02], null, boardFace, true); // easel ledge
  add(new THREE.PlaneGeometry(W.BOARD.w, W.BOARD.h), basic(boardTex), [0, 0, 0.001], null, boardFace);
  const bx = (u: number) => (u - 0.5) * W.BOARD.w, by = (v: number) => (0.5 - v) * W.BOARD.h;
  const dotR = W.BOARD.dot * 0.6; // ponytail: shrunk locally so the four competitors read as separate pins, not one blob
  const dots = W.BOARD_MARKS.dots.map(([u, v]) => {
    const m = add(new THREE.CircleGeometry(dotR, 20), flat("#8f9993"), [bx(u), by(v), 0.004], null, boardFace);
    add(new THREE.RingGeometry(dotR, dotR * 1.2, 24), flat("#56615b"), [0, 0, 0.0005], null, m);
    return m;
  });
  const fixP = W.BOARD_MARKS.fix;
  const fixG = new THREE.Group();
  fixG.position.set(bx(fixP[0]), by(fixP[1]), 0.005);
  boardFace.add(fixG);
  const R = W.BOARD_MARKS.fixR;
  add(new THREE.CircleGeometry(R * 0.9, 32), flat(WORLD.amber, 0.18), [0, 0, -0.0005], null, fixG); // glow
  add(new THREE.CircleGeometry(R * 0.42, 24), flat(WORLD.amber), [0, 0, 0], null, fixG);
  add(new THREE.RingGeometry(R * 0.86, R, 40), flat(WORLD.amber), [0, 0, 0], null, fixG);
  for (let i = 0; i < 4; i++) add(new THREE.PlaneGeometry(R * 0.32, 0.012), flat("#a86f00"), [Math.cos((i * Math.PI) / 2) * R * 1.2, Math.sin((i * Math.PI) / 2) * R * 1.2, 0], [0, 0, (i * Math.PI) / 2], fixG); // fix ticks
  const hairlines = [[0.04, 0.96], [0.96, 0.96], [0.5, 0.04]].map(([u, v]) => {
    const g = new THREE.Group();
    g.position.set(bx(u), by(v), 0.003);
    boardFace.add(g);
    const dx = bx(fixP[0]) - bx(u), dy = by(fixP[1]) - by(v);
    g.rotation.z = Math.atan2(dy, dx);
    add(new THREE.PlaneGeometry(1, 0.011), flat("#b07d1e"), [0.5, 0, 0], null, g); // pencilled bearing
    return { g, L: Math.hypot(dx, dy) };
  });
  const vessels = W.VESSELS.map((v) => {
    const h = k.hullKind(v.kind, v.len);
    setHull(h, v.pos, v.heading);
    h.userData.pen.visible = false;
    return h;
  });
  const pulse01 = k.dashedRing(WORLD.forest, 0.6);
  // visibility sweep: a soft emerald band riding the pulse out to the rock's edge (copy-safe like the rings)
  const bandMat = safeLine(new THREE.MeshBasicMaterial({ color: WORLD.emerald, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }) as unknown as THREE.LineBasicMaterial);
  const band = add(new THREE.RingGeometry(0.9, 1, 128), bandMat, null, [-Math.PI / 2, 0, 0]);
  const tick = add(new THREE.BoxGeometry(0.03, 0.12, 0.03), M.lacquer, W.polar(70, 1.8, W.GROUND + 0.06));
  const reach = k.dashedRing(WORLD.forest, 0.5);
  const drift = k.hullKind("sloop", 1.9, WORLD.azure);
  drift.userData.pen.visible = false;

  const eye = new THREE.Vector3(W.TELESCOPE.pos[0], W.TELESCOPE.pos[1] + W.TELESCOPE.legs + 0.06, W.TELESCOPE.pos[2]);
  return {
    pose(f: Frame) {
      const { p, b, a } = f;
      const t01 = f.t[0];
      const u01 = b.unfold01;
      scope.scale.setScalar(Math.max(1e-3, u01));
      const tel = W.telescope01(p, t01);
      tubeG.rotation.y = -tel.aim * W.DEG;
      const fold = b.board01Fold;
      boardFace.visible = u01 > 0.01 && fold < 0.99;
      boardLegs.visible = boardFace.visible;
      boardLegs.scale.set(1, Math.max(1e-3, u01 * (1 - fold)), 1);
      const bd = W.board01(p, t01);
      dots.forEach((m, i) => {
        m.scale.setScalar(Math.max(1e-3, bd.dots[i]));
        m.position.y = by(W.BOARD_MARKS.dots[i][1]) + W.BOARD.drop * (1 - Math.min(1, bd.dots[i]));
        m.material.opacity = bd.dotDim;
        m.material.transparent = true;
      });
      hairlines.forEach(({ g, L }, i) => {
        g.scale.set(Math.max(1e-3, bd.lines[i] * L), 1, 1);
        g.visible = bd.lines[i] > 0.01;
      });
      fixG.scale.setScalar(Math.max(1e-3, bd.fix * (1 + 0.35 * Math.sin(Math.PI * bd.pulse))));
      fixG.visible = bd.fix > 0.01;
      const holes = W.holes01(p, t01);
      holes.forEach((h, i) => MIST.uHoles.value[i].set(h[0], h[1], h[2], h[3]));
      vessels.forEach((v, i) => { v.visible = p < W.WIN.L3.to && holes[i][3] > 0.05; });
      const dr = W.sloopDrift(p);
      drift.visible = dr.visible && p >= W.WIN.L1.from;
      if (drift.visible && dr.pos && dr.heading !== undefined) {
        setHull(drift, dr.pos, dr.heading);
        vessels[1].visible = false;
      }
      const spot = tel.spotted.findIndex((v, i) => v > 0.5 && (i === 2 || tel.spotted[i + 1] < 0.5));
      sight.visible = spot >= 0 && W.beatAt(t01) === 1;
      if (sight.visible) {
        const v = W.VESSELS[spot].pos;
        sight.geometry.setFromPoints([eye, new THREE.Vector3(v[0], 0.5, v[2])]);
        sight.computeLineDistances();
      }
      const pu = W.pulse01(p, t01);
      pulse01.visible = pu.alpha > 0.01;
      pulse01.scale.setScalar(pu.r);
      pulse01.position.y = W.GROUND + 0.025;
      pulse01.rotation.y = pu.dash / pu.r; // crawling dashes
      pulse01.material.opacity = 0.6 * pu.alpha;
      band.visible = pulse01.visible;
      band.scale.setScalar(pu.r);
      band.position.y = W.GROUND + 0.022;
      bandMat.opacity = 0.32 * pu.alpha;
      tick.visible = (pu.tick ?? 0) > 0.01;
      tick.scale.y = Math.max(1e-3, pu.tick ?? 0);
      const rr = W.reachRing(p);
      reach.visible = rr > 0.01;
      reach.scale.setScalar(a.R);
      reach.position.y = a.R < 2.9 ? W.GROUND + 0.02 : 0.03;
      reach.material.opacity = 0.5 * rr;
    },
  };
}
