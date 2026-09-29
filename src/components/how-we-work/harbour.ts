// 05 harbour: quay, lanterns, the chart case on the quay head (trace, leg, arc, strips), the approach buoys,
// the loop ships and their pearls, the lane, the new cove and the harbour lights.
import * as THREE from "three";
import { basic, col, cyl, flat, paintHeight, rockGeo, safeLine, setHull, tex, type Kit } from "./kit";
import { MIST, WORLD } from "./look";
import * as W from "./model";
import type { Frame } from "./world";

const PEN: Record<string, string> = { azure: WORLD.azure, emerald: WORLD.emeraldCh, sun: WORLD.sunCh, indigo: WORLD.indigo };
const KINDS = ["freighter", "sloop", "dinghy"] as const;

export function createHarbour(k: Kit) {
  const { add, M, root } = k;
  const { DEG } = W;
  const H = W.HARBOUR;
  {
    const a = H.quay.from, b = H.quay.to, dx = b[0] - a[0], dz = b[2] - a[2];
    add(new THREE.BoxGeometry(H.quay.w, H.quay.h, Math.hypot(dx, dz)), M.stone, [(a[0] + b[0]) / 2, H.quay.h / 2 - 0.05, (a[2] + b[2]) / 2], [0, Math.atan2(dx, dz), 0], root, true);
    // coping stone: a pale lip that catches the light along the quay's edge
    add(new THREE.BoxGeometry(H.quay.w + 0.08, 0.06, Math.hypot(dx, dz) + 0.08), M.porcelain, [(a[0] + b[0]) / 2, H.quay.h - 0.03, (a[2] + b[2]) / 2], [0, Math.atan2(dx, dz), 0]);
  }
  const QTOP = H.quay.h, QOFF = W.QUAY.w / 2 - 0.1;
  // bollards along both faces (the south pair moor the first ship)
  for (const [s, off] of [[1.05, QOFF], [2.85, QOFF], [1.2, -QOFF], [2.75, -QOFF]]) {
    const q = W.quayAt(s, off, QTOP);
    add(cyl(0.06, 0.08, 0.16, 12), M.lacquer, [q[0], QTOP + 0.08, q[2]], null, root, true);
    add(cyl(0.095, 0.095, 0.035, 12), M.lacquer, [q[0], QTOP + 0.17, q[2]]);
  }
  const lineMat = new THREE.LineBasicMaterial({ color: "#8a7a5c" });
  const mooring = [[1.05, 1.3], [2.85, 2.6]].map(([s, hs]) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...W.quayAt(s, QOFF, QTOP + 0.15)), new THREE.Vector3(...W.quayAt(hs, 0.75, 0.3))]), lineMat);
    root.add(l);
    return l;
  });
  // warm lamp posts on the north edge: soft by day, full at the close as the harbour lights up
  const posts = [0.6, 2.0, 3.45].map((s, i) => {
    const q = W.quayAt(s, -QOFF + 0.05, QTOP);
    add(cyl(0.022, 0.03, 1.15, 8), M.lacquer, [q[0], QTOP + 0.575, q[2]]);
    add(new THREE.ConeGeometry(0.1, 0.1, 10), M.lacquer, [q[0], QTOP + 1.28, q[2]]);
    const bulb = add(new THREE.SphereGeometry(0.065, 12, 8), new THREE.MeshBasicMaterial({ color: "#ffd98a" }), [q[0], QTOP + 1.2, q[2]]);
    const h = k.sprite(k.HALO.warm, 26);
    h.position.set(q[0], QTOP + 1.2, q[2]);
    root.add(h);
    return { bulb, h, lamp: 3 + 4 * i };
  });
  // moored boats on the north berths: one from the start, two more come in as the harbour lights spread (compounding)
  const moored = ([["dinghy", 1.3, 1.1, WORLD.sunCh], ["sloop", 1.9, 2.75, WORLD.emeraldCh]] as const).map(([kind, len, s, pen], i) => {
    const h = k.hullKind(kind, len, pen);
    setHull(h, W.quayAt(s, -0.95), 100);
    return { h, lamp: i === 0 ? -1 : 8 };
  });
  const lanterns = H.lanterns.map(({ pos, color }) => {
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    root.add(g);
    add(cyl(0.16, 0.2, 0.7, 12), M.porcelain, [0, 0.35, 0], null, g, true);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      add(cyl(0.01, 0.01, 0.3, 4), M.lacquer, [Math.sin(a) * 0.12, 0.85, Math.cos(a) * 0.12], null, g);
    }
    add(cyl(0.15, 0.15, 0.04, 12), M.lacquer, [0, 1.02, 0], null, g);
    add(new THREE.ConeGeometry(0.15, 0.14, 12), M.lacquer, [0, 1.1, 0], null, g);
    add(cyl(0.11, 0.11, 0.28, 12), new THREE.MeshBasicMaterial({ color: col(color, "#ffffff", 0.15).clone(), toneMapped: false }), [0, 0.85, 0], null, g);
    const hs = k.sprite(color === "#ec544b" ? k.HALO.coral : k.HALO.emerald, 44);
    hs.position.set(0, 0.85, 0);
    g.add(hs);
    return hs;
  });
  // the chart case
  const CS = W.CASE;
  const caseFace = k.faceGroup((x, y, lift) => W.caseToWorld(x, y, lift));
  const base = W.caseToWorld(0, -CS.face[1] / 2);
  const casePlinth = add(new THREE.BoxGeometry(CS.face[0] + 0.3, CS.plinth, 0.6), M.porcelain, [base[0], CS.pos[1] + CS.plinth / 2, base[2]], [0, -(CS.faces - 180) * DEG, 0], root, true);
  add(new THREE.BoxGeometry(CS.face[0] + 0.24, CS.face[1] + 0.24, CS.depth), M.porcelain, [0, 0, -CS.depth / 2 - 0.004], null, caseFace, true);
  for (const [w, h, x, y] of [[CS.face[0] + 0.24, CS.frame, 0, CS.face[1] / 2 + 0.085], [CS.face[0] + 0.24, CS.frame, 0, -CS.face[1] / 2 - 0.085], [CS.frame, CS.face[1] + 0.24, CS.face[0] / 2 + 0.085, 0], [CS.frame, CS.face[1] + 0.24, -CS.face[0] / 2 - 0.085, 0], [0.03, CS.face[1], 0, 0]])
    add(new THREE.BoxGeometry(w, h, 0.03), M.lacquer, [x, y, 0.012], null, caseFace);
  const FW = 1024, FH = Math.round((1024 * CS.face[1]) / CS.face[0]);
  const fpx = (fx: number) => (fx / CS.face[0] + 0.5) * FW, fpy = (fy: number) => (0.5 - fy / CS.face[1]) * FH;
  const caseTex = tex(FW, FH, (x, w, h) => {
    x.fillStyle = "#fbfdf9"; x.fillRect(0, 0, w, h);
    // left page: the 02 chart simplified (land hint, 2 contours, the 4 sector arcs at their true bearings, the mark)
    const m = W.CHART05.mark, mx = fpx(m[0]), my = fpy(m[1]), sc = w / CS.face[0];
    const Ch = CS.chart;
    x.fillStyle = "#eef7f1"; x.fillRect(fpx(Ch.x[0]), fpy(Ch.y[1]), fpx(Ch.x[1]) - fpx(Ch.x[0]), fpy(Ch.y[0]) - fpy(Ch.y[1])); // sea tint
    x.fillStyle = "#cfe6d6"; x.beginPath(); x.arc(mx - 40, my + 60, 90, 0, 7); x.fill();
    x.strokeStyle = "rgba(23,154,85,.35)"; x.lineWidth = 3; for (const r of [130, 190]) { x.beginPath(); x.arc(mx - 40, my + 60, r, -1.6, 0.2); x.stroke(); }
    W.SECTORS.forEach((q) => { x.fillStyle = q.solid + "66"; x.strokeStyle = q.solid; x.lineWidth = 3; x.beginPath(); x.moveTo(mx, my); x.arc(mx, my, q.chartR * sc * 1.6, W.chartAngle(q.from), W.chartAngle(q.to)); x.closePath(); x.fill(); x.stroke(); });
    x.fillStyle = "#fcb401"; x.strokeStyle = "#0c3b29"; x.lineWidth = 4; x.beginPath(); x.arc(mx, my, 14, 0, 7); x.fill(); x.stroke();
    // right page: trace area + strip slot, and small caps labels so each panel reads as a dashboard tile
    const T = CS.trace, St = CS.strip;
    x.fillStyle = "#f3faf5"; x.fillRect(fpx(T.x[0]), fpy(T.y[1]), fpx(T.x[1]) - fpx(T.x[0]), fpy(T.y[0]) - fpy(T.y[1]));
    x.strokeStyle = "rgba(12,59,41,.35)"; x.lineWidth = 3;
    x.strokeRect(fpx(T.x[0]), fpy(T.y[1]), fpx(T.x[1]) - fpx(T.x[0]), fpy(T.y[0]) - fpy(T.y[1]));
    x.strokeRect(fpx(St.x[0]), fpy(St.y[1]), fpx(St.x[1]) - fpx(St.x[0]), fpy(St.y[0]) - fpy(St.y[1]));
    x.font = "700 26px ui-sans-serif, system-ui, sans-serif"; x.textBaseline = "top";
    const label = (s: string, px: number, py: number, c: string) => { x.fillStyle = c; x.fillRect(px, py + 4, 14, 14); x.fillStyle = "#0c3b29"; x.fillText(s, px + 22, py); };
    label("PERFORMANCE", fpx(T.x[0]) + 14, fpy(T.y[1]) + 12, "#10b981");
    label("CONTENT", fpx(St.x[0]), fpy(St.y[1]) - 34, "#4f46e5");
    label("STRATEGY", fpx(Ch.x[0]) + 14, fpy(Ch.y[1]) + 12, "#f5b301");
  });
  add(new THREE.PlaneGeometry(CS.face[0], CS.face[1]), basic(caseTex), [0, 0, 0.001], null, caseFace);
  const TA = CS.trace, tx = (u: number) => TA.x[0] + (TA.x[1] - TA.x[0]) * u, ty = (u: number) => TA.y[0] + (TA.y[1] - TA.y[0]) * u;
  const gridLines = [...Array(8)].map(() => add(new THREE.PlaneGeometry(TA.x[1] - TA.x[0], 0.012), flat(WORLD.forest, 0.2), [0, 0, 0.004], null, caseFace));
  const traceLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...Array(49)].map(() => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: "#1f8f6a" }));
  caseFace.add(traceLine);
  const traceArea = add(new THREE.PlaneGeometry(1, 1, 48, 1), flat("#34d399", 0.28), [0, 0, 0.005], null, caseFace); // growth fill under the curve
  const traceRibbon = add(new THREE.PlaneGeometry(1, 1, 48, 1), flat("#10b981"), [0, 0, 0.006], null, caseFace);
  const inkDots = [0, 1, 2].map(() => {
    const d = add(new THREE.CircleGeometry(0.085, 20), flat(WORLD.azure), [0, 0, 0.008], null, caseFace);
    add(new THREE.CircleGeometry(0.115, 20), flat("#ffffff"), [0, 0, -0.001], null, d); // white rim
    return d;
  });
  const penTipM = add(new THREE.CircleGeometry(0.06, 16), flat(WORLD.forest), [0, 0, 0.009], null, caseFace);
  // header plate over the board: the keeper's log
  add(new THREE.BoxGeometry(1.9, 0.36, 0.08), M.lacquer, [0, CS.face[1] / 2 + 0.33, -0.02], null, caseFace, true);
  add(new THREE.PlaneGeometry(1.76, 0.26), basic(tex(512, 76, (x, w, h) => {
    x.fillStyle = "#0c3b29"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#c6ef5c"; x.beginPath(); x.arc(34, h / 2, 10, 0, 7); x.fill();
    x.fillStyle = "#f7f3ea"; x.font = "700 36px ui-sans-serif, system-ui, sans-serif"; x.textBaseline = "middle"; x.fillText("KEEPER'S LOG", 58, h / 2 + 2);
    x.fillStyle = "#34d399"; x.fillRect(w - 118, h / 2 + 6, 18, 14); x.fillRect(w - 94, h / 2 - 4, 18, 24); x.fillRect(w - 70, h / 2 - 16, 18, 36); // mini bars
  })), [0, CS.face[1] / 2 + 0.33, 0.022], null, caseFace);
  const C5 = W.CHART05;
  const legG = new THREE.Group();
  legG.position.set(C5.mark[0], C5.mark[1], 0.006);
  caseFace.add(legG);
  const legMat = flat(WORLD.forest);
  const legM = add(new THREE.PlaneGeometry(C5.leg.len, 0.055), legMat, [C5.leg.len / 2, 0, 0], null, legG);
  const arcMat = flat("#f5b301", 0.78);
  const arcMesh = add(new THREE.BufferGeometry(), arcMat, [C5.mark[0], C5.mark[1], 0.005], null, caseFace);
  let arcKey = NaN;
  const stripSize = [CS.strip.x[1] - CS.strip.x[0] - 0.08, CS.strip.y[1] - CS.strip.y[0] - 0.08] as const;
  // content cards: an aged (grey, faded thumb) card is replaced by a fresh one (colour thumb, title, big ↻)
  const card = (fresh: boolean) => tex(512, 176, (x, w, h) => {
    x.fillStyle = fresh ? "#ffffff" : "#e9eeea"; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(20, 20, 150, 156);
    g.addColorStop(0, fresh ? "#ec544b" : "#c9d1cb"); g.addColorStop(1, fresh ? "#fcb401" : "#dde3de");
    x.fillStyle = g; x.fillRect(20, 20, 136, 136);
    x.fillStyle = fresh ? "#4f46e5" : "rgba(15,26,20,.25)"; x.fillRect(178, 28, 200, 26);
    for (let i = 0; i < 3; i++) { x.fillStyle = fresh ? "rgba(15,26,20,.5)" : "rgba(15,26,20,.2)"; x.fillRect(178, 76 + i * 26, 190 - i * 50, 13); }
    if (!fresh) return;
    x.strokeStyle = "#10b981"; x.lineWidth = 12; x.lineCap = "round"; x.beginPath(); x.arc(448, 88, 34, -0.9, 4.4); x.stroke();
    x.fillStyle = "#10b981"; x.beginPath(); x.moveTo(476, 42); x.lineTo(490, 80); x.lineTo(452, 70); x.closePath(); x.fill(); // ↻ arrowhead
  });
  const stripDull = add(new THREE.PlaneGeometry(...stripSize), basic(card(false)), [0, 0, 0.007], null, caseFace);
  const stripClear = add(new THREE.PlaneGeometry(...stripSize), basic(card(true)), [0, 0, 0.008], null, caseFace);
  const stripMid = [(CS.strip.x[0] + CS.strip.x[1]) / 2, (CS.strip.y[0] + CS.strip.y[1]) / 2];
  H.approach.forEach((b) => {
    add(cyl(0.18, 0.28, 0.75, 16), M.porcelain, [b[0], 0.3, b[2]], null, root, true);
    add(cyl(0.19, 0.19, 0.14, 16), M.lacquer, [b[0], 0.62, b[2]]);
    add(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: "#fcb401" }), [b[0], 1.0, b[2]]);
  });
  const loopShips = KINDS.map((kind) => k.hullKind(kind, { freighter: 2.6, sloop: 1.9, dinghy: 1.3 }[kind], WORLD.azure));
  const laneGeo = new THREE.BufferGeometry();
  laneGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(80 * 3), 3));
  const laneMat = safeLine(new THREE.LineDashedMaterial({ color: WORLD.forest, transparent: true, opacity: 0.55, dashSize: 0.35, gapSize: 0.22 }));
  const lane = new THREE.Line(laneGeo, laneMat);
  root.add(lane);
  const span = (W.PULSE_ARC[1] - W.PULSE_ARC[0] + 360) % 360;
  const pulse05 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([...Array(129)].map((_, i) => { const q = W.polar(W.PULSE_ARC[0] + (span * i) / 128, 1); return new THREE.Vector3(q[0], 0, q[2]); })),
    safeLine(new THREE.LineDashedMaterial({ color: WORLD.emerald, transparent: true, opacity: 0.6, dashSize: 0.012, gapSize: 0.008 })),
  );
  pulse05.computeLineDistances();
  root.add(pulse05);
  const cove = new THREE.Group();
  root.add(cove);
  cove.position.set(W.NEW_COVE.pos[0], 0, W.NEW_COVE.pos[2]);
  {
    const g = rockGeo(60);
    paintHeight(g, WORLD.rockLow, WORLD.rockHigh, -0.5, 0.8);
    add(g, M.rock, [0, 0.1, 0], null, cove).scale.set(W.NEW_COVE.islet[0] / 2, W.NEW_COVE.islet[1], W.NEW_COVE.islet[2] / 2);
    W.NEW_COVE.vessels.forEach((v) => {
      const h = k.hullKind(v.kind, v.len, v.kind === "freighter" ? WORLD.sunCh : WORLD.emeraldCh);
      cove.add(h); // re-parents from the root
      h.position.set(v.off[0], 0, v.off[1]);
      h.rotation.y = -(v.heading - 90) * DEG;
    });
  }
  const pearlMat = new THREE.MeshBasicMaterial({ color: WORLD.azure });
  const pearlMesh = add(new THREE.SphereGeometry(0.18, 16, 12), pearlMat, [0, 0, 0]);
  const pearlHalo = k.sprite(k.HALO.warm, 48);
  root.add(pearlHalo);
  const lights = W.HARBOUR_LIGHTS.map((q) => {
    const m = add(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: "#e8e2cf" }), [q[0], q[1], q[2]]);
    const h = k.sprite(k.HALO.warm, W.HARBOUR_LIGHT_HALO);
    h.position.set(q[0], q[1], q[2]);
    root.add(h);
    return { m, h };
  });

  const pts = [...Array(49)].map(() => new THREE.Vector3());
  const lpts: THREE.Vector3[] = [];
  return {
    pose(f: Frame) {
      const { p, b } = f;
      const t05 = f.t[4];
      const in05 = W.cove05(p) > 0.5;
      lanterns.forEach((hs) => { hs.visible = b.lanterns05 > 0.01; hs.material.opacity = b.lanterns05; });
      caseFace.visible = b.case05 > 0.01;
      casePlinth.visible = caseFace.visible;
      const tr = W.trace05(p, t05, 48);
      tr.pts.forEach(([u, v], i) => pts[i].set(tx(u), ty(Math.min(1, v)), 0.007));
      if (caseFace.visible) {
        traceLine.geometry.setFromPoints(pts);
        const pos = traceRibbon.geometry.attributes.position;
        const area = traceArea.geometry.attributes.position, y0 = ty(0);
        for (let i = 0; i <= 48; i++) {
          pos.setXYZ(i, pts[i].x, pts[i].y + 0.03, 0);
          pos.setXYZ(i + 49, pts[i].x, pts[i].y - 0.03, 0);
          area.setXYZ(i, pts[i].x, pts[i].y, 0);
          area.setXYZ(i + 49, pts[i].x, y0, 0);
        }
        pos.needsUpdate = true;
        area.needsUpdate = true;
      }
      inkDots.forEach((m, i) => {
        const d = tr.dots[i];
        m.visible = !!d;
        if (!d) return;
        m.position.set(tx(d.x), ty(Math.min(1, d.y)), 0.009);
        m.material.color.set(PEN[d.pennant]);
      });
      penTipM.position.copy(pts[48]).setZ(0.01);
      gridLines.forEach((m, i) => {
        const gh = W.lerp(1, 0.5, tr.gridHalf) * W.lerp(1, 0.5, tr.closeGrid), y = (i + 1) * 0.25 * gh;
        m.visible = y <= 1.001 && (i < 4 || tr.gridHalf > 0.01 || tr.closeGrid > 0.01);
        m.position.set((TA.x[0] + TA.x[1]) / 2, ty(y), 0.004);
        m.material.opacity = 0.2 * (i % 2 === 1 && i > 0 && tr.oddFade > 0 ? 1 - tr.oddFade : 1);
      });
      const c5 = W.chart05(p, t05);
      legG.rotation.z = (C5.leg.angle + C5.leg.swing * c5.swing) * DEG;
      legMat.color.copy(col(WORLD.forest, WORLD.lime, c5.flashLeg));
      legM.scale.y = W.lerp(0.5, 1, c5.solid);
      if (c5.widen !== arcKey) {
        arcKey = c5.widen;
        const a0 = C5.arc.from * DEG, a1 = (C5.arc.to + C5.arc.widen * c5.widen) * DEG;
        const ap = [new THREE.Vector2(0, 0)];
        for (let i = 0; i <= 20; i++) { const aa = a0 + ((a1 - a0) * i) / 20; ap.push(new THREE.Vector2(Math.cos(aa) * C5.arc.r, Math.sin(aa) * C5.arc.r)); }
        arcMesh.geometry.dispose();
        arcMesh.geometry = new THREE.ShapeGeometry(new THREE.Shape(ap));
      }
      arcMat.color.copy(col("#f5b301", WORLD.lime, c5.flashArc));
      const st = W.strip05(p, t05);
      stripDull.position.set(stripMid[0] - 0.3 * st.out, stripMid[1], 0.007);
      stripDull.visible = st.out < 0.99 || st.age > 0.5;
      stripClear.position.set(stripMid[0] + 0.3 * (1 - st.in), stripMid[1], 0.008);
      stripClear.visible = st.in > 0.01 && st.age < 0.5;
      const ls = W.loopShip05(t05);
      const clsIdx = ls.visible && ls.cls ? KINDS.indexOf(ls.cls.kind as (typeof KINDS)[number]) : -1;
      loopShips.forEach((h, i) => {
        h.visible = in05 && ls.visible && i === clsIdx && (ls.fade ?? 0) > 0.2;
        if (h.visible && ls.pos && ls.heading !== undefined) {
          setHull(h, ls.pos, ls.heading);
          h.userData.pen.material.color.set(PEN[ls.pennant ?? "azure"]);
        }
      });
      const pr = W.pearl05(p, t05);
      pearlMesh.visible = in05 && pr.visible;
      pearlHalo.visible = pearlMesh.visible;
      if (pr.visible && pr.pos) {
        pearlMesh.position.set(...pr.pos);
        pearlHalo.position.set(...pr.pos);
        pearlMat.color.set(PEN[ls.pennant ?? "azure"]);
      }
      const a5 = W.approach05(t05), L = a5.lane;
      // Only rebuilt while shown: computeLineDistances allocates a fresh attribute every call.
      lane.visible = in05 && p < W.WIN.L5.from + 0.3 * (W.WIN.L5.to - W.WIN.L5.from);
      if (lane.visible) {
        const n = (L.length - 1) * 16 + 1;
        while (lpts.length < n) lpts.push(new THREE.Vector3());
        lpts.length = n;
        for (let i = 0; i < L.length - 1; i++) for (let j = 0; j < 16; j++) { const u = j / 16; lpts[i * 16 + j].set(W.lerp(L[i][0], L[i + 1][0], u), 0.03, W.lerp(L[i][2], L[i + 1][2], u)); }
        const last = L[L.length - 1];
        lpts[n - 1].set(last[0], 0.03, last[2]);
        laneGeo.setFromPoints(lpts);
        lane.computeLineDistances();
        const from = Math.floor(n * (a5.from ?? 0)), to = Math.floor(n * a5.drawIn);
        laneGeo.setDrawRange(from, Math.max(0, to - from));
      }
      laneMat.color.copy(col(WORLD.forest, WORLD.lime, a5.flash));
      const g5 = W.newGrowth05(p, t05);
      pulse05.visible = in05 && g5.ring !== null && g5.ringAlpha > 0.01;
      if (pulse05.visible && g5.ring !== null) {
        pulse05.scale.setScalar(g5.ring);
        pulse05.material.opacity = 0.6 * g5.ringAlpha;
        pulse05.position.y = 0.04;
      }
      MIST.uHoles.value[3].set(W.NEW_COVE.pos[0], W.NEW_COVE.pos[2], 7, in05 ? g5.hole : 0);
      const rise = W.coveRise(p, t05);
      cove.visible = rise > 0.001;
      cove.scale.set(1, Math.max(rise, 0.001), 1);
      lights.forEach(({ m, h }, i) => {
        const kl = W.harbourLight(p, i);
        m.material.color.copy(col("#e8e2cf", "#ffc23d", kl));
        h.visible = kl > 0.01;
        h.material.opacity = kl;
      });
      const docked = W.harbourLight(p, W.BERTH_LAMP) > 0.5;
      mooring.forEach((l) => (l.visible = docked));
      posts.forEach(({ bulb, h, lamp }) => {
        const kl = 0.45 + 0.55 * W.harbourLight(p, lamp);
        bulb.material.color.copy(col("#fff1cf", "#ffc23d", kl));
        h.material.opacity = kl;
      });
      moored.forEach(({ h, lamp }) => (h.visible = lamp < 0 || W.harbourLight(p, lamp) > 0.5));
    },
  };
}
