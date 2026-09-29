// 02 chart table: built directly from chartToWorld, so the chart, its marks and the mark alignment agree.
import * as THREE from "three";
import { basic, cyl, flat, hash, tex, type Kit } from "./kit";
import { WORLD, withMist } from "./look";
import * as W from "./model";
import type { Frame } from "./world";

const TAU = Math.PI * 2;

export function createChart(k: Kit) {
  const { add, M, root, GLYPH } = k;
  const C = W.CHART;
  const chartFace = k.faceGroup((x, y, lift) => W.chartToWorld(C.cx + x * W.PX_PER_PLANE, C.cy - y * W.PX_PER_PLANE, lift));
  const cxy = (px: number, py: number) => [(px - C.cx) / W.PX_PER_PLANE, (C.cy - py) / W.PX_PER_PLANE] as const;
  const cc = cxy(C.w / 2, C.h / 2);
  const [TW, TD] = W.TABLE.size;

  // ── the table: honey-oak top and apron, a forest-lacquer rim, turned lacquer legs ──
  const woodTex = tex(256, 256, (x, w, h) => {
    x.fillStyle = "#dcbd93"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const y0 = hash(i, 1) * h;
      x.strokeStyle = `rgba(134,88,44,${0.06 + 0.14 * hash(i, 2)})`; x.lineWidth = 0.6 + 2.6 * hash(i, 3);
      x.beginPath(); x.moveTo(0, y0);
      for (let s = 1; s <= 16; s++) x.lineTo((s * w) / 16, y0 + Math.sin(s * 0.7 + i) * 3 * hash(i, 4));
      x.stroke();
    }
  });
  const wood = withMist(new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: woodTex, roughness: 0.45, clearcoat: 0.55, clearcoatRoughness: 0.3 }), "wood");
  add(new THREE.BoxGeometry(TW, TD, 0.05), wood, [cc[0], cc[1], -0.03], null, chartFace, true);
  const RIM = 0.034;
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(TW, RIM, 0.032), M.lacquer, [cc[0], cc[1] + s * (TD / 2 - RIM / 2), 0.006], null, chartFace);
    add(new THREE.BoxGeometry(RIM, TD - 2 * RIM, 0.032), M.lacquer, [cc[0] + s * (TW / 2 - RIM / 2), cc[1], 0.006], null, chartFace);
    add(new THREE.BoxGeometry(1.7, 0.024, 0.08), wood, [cc[0], cc[1] + s * 0.52, -0.095], null, chartFace); // apron
    add(new THREE.BoxGeometry(0.024, 1.04, 0.08), wood, [cc[0] + s * 0.85, cc[1], -0.095], null, chartFace);
  }
  const chartTex = tex(1024, 650, (x, w, h) => paintChart(x, w, h));
  const chartMat = basic(chartTex); // opaque: the table always arrives with its chart, never a blank slab
  const chartPlane = add(new THREE.PlaneGeometry(C.w / W.PX_PER_PLANE, C.h / W.PX_PER_PLANE), chartMat, [cc[0], cc[1], 0.001], null, chartFace);
  const tableLegs = new THREE.Group();
  root.add(tableLegs);
  const PROFILE = [[0.034, 0], [0.036, 0.015], [0.028, 0.04], [0.021, 0.08], [0.016, 0.5], [0.023, 0.62], [0.03, 0.66], [0.02, 0.7], [0.03, 0.74], [0.033, 0.77], [0.033, 1]];
  for (const [a, b] of [[-0.85, -0.52], [0.85, -0.52], [-0.85, 0.52], [0.85, 0.52]]) {
    const top = W.chartToWorld(C.w / 2 + a * W.PX_PER_PLANE, C.h / 2 - b * W.PX_PER_PLANE);
    const hgt = top[1] - W.GROUND - 0.05;
    const pts = [...PROFILE.map(([r, y]) => new THREE.Vector2(r, y * hgt)), new THREE.Vector2(0, hgt)];
    add(new THREE.LatheGeometry(pts, 18), M.lacquer, [top[0], W.GROUND, top[2]], null, tableLegs, true);
  }

  // ── the lighthouse mark ──
  const markG = new THREE.Group();
  chartFace.add(markG);
  markG.position.z = 0.004;
  add(new THREE.CircleGeometry(0.09, 32), flat(WORLD.amber, 0.22), [0, 0, 0], null, markG);
  add(new THREE.CircleGeometry(0.028, 24), flat(WORLD.amber), [0, 0, 0.001], null, markG);
  add(new THREE.RingGeometry(0.046, 0.054, 40), flat(WORLD.amber), [0, 0, 0.001], null, markG);

  // ── 1 channel prioritization: four saturated wedges at the real sector bearings, sized by priority ──
  const wedgeMats = W.SECTORS.map((q) => {
    const pts = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 16; i++) {
      const a = -W.chartAngle(q.from + ((q.to - q.from) * i) / 16);
      pts.push(new THREE.Vector2(Math.cos(a) * q.chartR, Math.sin(a) * q.chartR));
    }
    const fill = flat(q.solid, 0.55), rim = flat(q.solid);
    add(new THREE.ShapeGeometry(new THREE.Shape(pts)), fill, [0, 0, 0.003], null, chartFace);
    add(new THREE.RingGeometry(q.chartR - 0.014, q.chartR, 24, 1, -W.chartAngle(q.to), (q.to - q.from) * W.DEG), rim, [0, 0, 0.0035], null, chartFace);
    return [fill, rim] as const;
  });

  const onChart = (wx: number, wz: number, lift = 0.004) => {
    const c = cxy(...W.chartPx(wx, wz));
    return new THREE.Vector3(c[0], c[1], lift);
  };
  const O = new THREE.Vector3(0, 0, 0.005);
  /** A unit strip along +x (world width w) that `span` stretches from a to b on the chart. */
  const strip = (m: THREE.Material, w: number, z: number) => add(new THREE.PlaneGeometry(1, w).translate(0.5, 0, 0), m, [0, 0, z], null, chartFace);
  const span = (m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, period = 0) => {
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    m.position.set(a.x, a.y, m.position.z);
    m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    m.scale.x = Math.max(1e-4, L);
    const map = (m.material as THREE.MeshBasicMaterial).map;
    if (period && map) map.repeat.x = L / period;
    return L;
  };
  const dashMat = (color: string, dot: boolean) => {
    const map = tex(64, 16, (x) => { x.fillStyle = color; if (dot) { x.beginPath(); x.arc(16, 8, 7, 0, TAU); x.fill(); } else x.fillRect(0, 3, 40, 10); });
    map.wrapS = THREE.RepeatWrapping;
    return basic(map, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  };
  const starGeo = (R: number) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? R * 0.34 : R, a = (i / 8) * TAU + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    return new THREE.ShapeGeometry(s);
  };
  const standing = (map: THREE.Texture, pos: readonly number[]) => {
    const s = k.billboard(map, W.TILE02);
    s.position.set(pos[0], pos[1], pos[2]);
    root.add(s);
    return s;
  };

  // ── 2 content roadmap: brass dividers walk an indigo dashed course and stamp ▤ pages ──
  const courseAt = (i: number) => { const q = W.polar(W.COURSE02.bearing, i * W.COURSE02.step); return onChart(q[0], q[2]); };
  const course = strip(dashMat(WORLD.indigo, false), 0.016, 0.005);
  const stamps = W.COURSE02.tiles.map((i) => add(new THREE.PlaneGeometry(0.06, 0.06), flat(WORLD.indigo, 0.85), [courseAt(i).x, courseAt(i).y, 0.006], null, chartFace));
  const roadTiles = W.COURSE02.tiles.map((i) => { const q = W.polar(W.COURSE02.bearing, i * W.COURSE02.step); return standing(GLYPH["▤"], W.chartToWorld(...W.chartPx(q[0], q[2]))); });
  const steel = withMist(new THREE.MeshStandardMaterial({ color: "#b7c0bc", metalness: 0.85, roughness: 0.25 }), "steel");
  const dividers = new THREE.Group();
  chartFace.add(dividers);
  const DIV_H = 0.34, SPAN = (W.COURSE02.step * C.S) / W.PX_PER_PLANE; // legs straddle one pivot step
  for (const s of [-1, 1]) {
    const hinge = new THREE.Vector3(0, 0, DIV_H), d = new THREE.Vector3((s * SPAN) / 2, 0, 0.004).sub(hinge), L = d.length();
    d.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    const leg = add(cyl(0.007, 0.012, L * 0.84, 10), M.champagne, null, null, dividers, true);
    leg.quaternion.copy(q); leg.position.copy(hinge).addScaledVector(d, L * 0.42);
    const pt = add(cyl(0.0008, 0.005, L * 0.16, 8), steel, null, null, dividers);
    pt.quaternion.copy(q); pt.position.copy(hinge).addScaledVector(d, L * 0.92);
  }
  add(new THREE.SphereGeometry(0.024, 16, 12), M.champagne, [0, 0, DIV_H], null, dividers, true);
  add(cyl(0.009, 0.012, 0.075, 12), M.champagne, [0, 0, DIV_H + 0.055], [Math.PI / 2, 0, 0], dividers);

  // ── 3 search & AI: a brass reading lens reveals an azure deep-water lane with ✦ marks ──
  const a0 = onChart(W.BUOYS[0][0], W.BUOYS[0][2], 0.02), a1 = onChart(W.BUOYS[3][0], W.BUOYS[3][2], 0.02);
  const laneGlow = strip(flat(WORLD.azure, 0.22), 0.16, 0.0045), lane = strip(flat(WORLD.azure, 0.95), 0.055, 0.005);
  const laneStars = [1, 2].map((i) => {
    const g = new THREE.Group(), p = onChart(W.BUOYS[i][0], W.BUOYS[i][2]);
    g.position.set(p.x, p.y, 0.006);
    add(starGeo(0.06), flat(WORLD.azure), [0, 0, 0], null, g);
    add(starGeo(0.034), flat("#ffffff"), [0, 0, 0.0005], null, g);
    chartFace.add(g);
    return { g, at: i / 3 };
  });
  const lens = new THREE.Group();
  chartFace.add(lens);
  const glass = add(new THREE.CircleGeometry(0.17, 48), flat("#e6f6ff", 0.28, { depthWrite: false }), [0, 0, 0.02], null, lens);
  add(new THREE.TorusGeometry(0.175, 0.013, 10, 56), M.champagne, [0, 0, 0.02], null, lens, true);
  add(cyl(0.016, 0.02, 0.2, 12), M.lacquer, [0.26 * Math.cos(-0.7), 0.26 * Math.sin(-0.7), 0.02], [0, 0, -0.7 - Math.PI / 2], lens, true);
  const starTile = standing(GLYPH["✦"], W.chartToWorld(...W.chartPx(W.LOOM.pos[0], W.LOOM.pos[2])));

  // ── 4 community: an emerald cove with a dot-cluster and an r/ pin ──
  const cp = onChart(W.ANCHORAGE.center[0], W.ANCHORAGE.center[2], 0.005);
  const coveDisc = add(new THREE.CircleGeometry(0.12, 40), flat(WORLD.emeraldCh, 0.5), [cp.x, cp.y, 0.005], null, chartFace);
  const coveRim = add(new THREE.RingGeometry(0.112, 0.124, 48), flat(WORLD.emeraldCh), [cp.x, cp.y, 0.0055], null, chartFace);
  const coveDots = [[0, 0], [0.05, 0.02], [-0.045, 0.03], [0.02, -0.052], [-0.035, -0.04], [0.068, -0.03], [-0.07, -0.005]].map(([dx, dy]) =>
    add(new THREE.CircleGeometry(0.013, 14), flat(WORLD.forest), [cp.x + dx, cp.y + dy, 0.006], null, chartFace));
  const rTile = standing(GLYPH["r/"], W.chartToWorld(...W.chartPx(W.ANCHORAGE.center[0], W.ANCHORAGE.center[2])));

  // ── 5 creators: sun islets with ▶ flags and a dotted relay line to the light ──
  const isletPts = W.ISLETS.map((s) => onChart(s.pos[0], s.pos[2], 0.005));
  const isletDiscs = isletPts.map((p) => [
    add(new THREE.CircleGeometry(0.085, 32), flat(WORLD.sunCh, 0.75), [p.x, p.y, 0.005], null, chartFace),
    add(new THREE.RingGeometry(0.08, 0.092, 40), flat(WORLD.sunCh), [p.x, p.y, 0.0055], null, chartFace),
  ]);
  const playTiles = W.ISLETS.map((s) => { const [px, py] = W.chartPx(s.pos[0], s.pos[2]); return standing(GLYPH["▶"], W.chartToWorld(px + s.tile * W.PX_PER_PLANE, py)); });
  const relays = isletPts.map(() => strip(dashMat(WORLD.sunCh, true), 0.02, 0.0052));

  // marks draw after the (fading) chart; overlapping marks keep a fixed stack
  chartFace.traverse((o) => { o.renderOrder = Math.max(o.renderOrder, 2); });
  chartPlane.renderOrder = 1;
  lane.renderOrder = 3;
  laneStars.forEach((s) => s.g.traverse((o) => { o.renderOrder = 4; }));
  glass.renderOrder = 5;
  const cpos = new THREE.Vector3(), end = new THREE.Vector3();

  return {
    pose(f: Frame) {
      const { p, b } = f;
      const tf = W.tableFold(p);
      chartFace.visible = b.table02 > 0.01 && tf < 0.95;
      tableLegs.visible = chartFace.visible;
      tableLegs.scale.set(1, Math.max(0.05, b.table02), 1);
      const c2 = W.chart02(p, f.t[1]);
      // the plan builds up: each include's marks hold once drawn and all fade together at 7.4–7.9 s (spec)
      const x = W.loopX(f.t[1]);
      const hold = (x < 7.4 ? 1 : 1 - W.smooth(W.sub(x, 7.4, 7.9))) * c2.gain;
      const on = (beat: number) => { const a = 1.2 * (beat - 1) + 0.2; return W.smooth(W.sub(x, a, a + 0.15)) * hold; };
      const b2 = on(2), b3 = on(3), b4 = on(4), b5 = on(5);
      markG.visible = b.mark02 > 0.01;
      markG.scale.setScalar(Math.max(1e-3, b.mark02));
      const fan = Math.max(c2.fan, hold);
      wedgeMats.forEach(([fill, rim], i) => { fill.opacity = 0.55 * c2.wedges[i] * fan; rim.opacity = c2.wedges[i] * fan; });

      course.visible = dividers.visible = b2 > 0.01;
      (course.material as THREE.MeshBasicMaterial).opacity = b2;
      span(course, O, courseAt(c2.dividers), 0.034);
      dividers.position.copy(courseAt(Math.min(c2.dividers, 4) + 0.5)).setZ(0);
      stamps.forEach((m, i) => { m.visible = c2.stamped[i] * b2 > 0.01; m.scale.setScalar(Math.max(0.01, c2.stamped[i])); m.material.opacity = 0.85 * b2; });
      roadTiles.forEach((s, i) => {
        s.material.opacity = b2;
        s.visible = c2.stamped[i] * b2 > 0.01;
        s.scale.set(W.TILE02 * Math.max(0.01, c2.stamped[i]), W.TILE02 * Math.max(0.01, c2.stamped[i]), 1);
      });

      cpos.copy(a0).lerp(a1, c2.glide);
      lens.position.set(cpos.x, cpos.y, 0);
      lens.visible = b3 > 0.01;
      const lit = b3 > 0.01 && c2.glide > 0.002;
      lane.visible = laneGlow.visible = lit;
      span(lane, a0, cpos); span(laneGlow, a0, cpos);
      lane.material.opacity = 0.95 * b3; laneGlow.material.opacity = 0.22 * b3;
      laneStars.forEach((s) => { const k2 = W.easeOutBack(W.sub(c2.glide, s.at - 0.04, s.at + 0.12)); s.g.visible = k2 * b3 > 0.01; s.g.scale.setScalar(Math.max(0.01, k2)); });
      starTile.visible = c2.star * b3 > 0.01;
      starTile.scale.setScalar(W.TILE02 * Math.max(0.01, c2.star));
      starTile.material.opacity = b3;

      coveDisc.visible = coveRim.visible = b4 > 0.01;
      coveDisc.material.opacity = (0.35 + 0.35 * c2.cove) * b4;
      coveRim.material.opacity = c2.cove * b4;
      coveDots.forEach((d, i) => { d.visible = c2.cove > 0.2 + i * 0.1 && b4 > 0.01; });
      rTile.visible = c2.rTile * b4 > 0.01;
      rTile.scale.setScalar(W.TILE02 * Math.max(0.01, c2.rTile));
      rTile.material.opacity = b4;

      isletDiscs.forEach(([d, r]) => { d.visible = r.visible = b5 > 0.01; d.material.opacity = 0.75 * c2.islets * b5; r.material.opacity = c2.islets * b5; });
      playTiles.forEach((s) => { s.visible = c2.play * b5 > 0.01; s.scale.setScalar(W.TILE02 * Math.max(0.01, c2.play)); s.material.opacity = b5; });
      relays.forEach((l, i) => {
        l.visible = c2.relay * b5 > 0.01;
        (l.material as THREE.MeshBasicMaterial).opacity = b5;
        span(l, isletPts[i], end.copy(isletPts[i]).lerp(O, c2.relay), 0.03);
      });
    },
  };
}

/** The chart itself: a real nautical chart of this world in brand colours (paper, soundings, shoals, contours, rose). */
function paintChart(x: CanvasRenderingContext2D, w: number, h: number) {
  const C = W.CHART, S = C.S, P = (wx: number, wz: number) => W.chartPx(wx, wz);
  const lands = [
    ...W.LOBES.map((l) => [l[0], l[1], l[2]]),
    ...W.ISLETS.map((s) => [s.pos[0], s.pos[2], s.r]),
    ...W.EAST_STACKS.map((s) => [s.pos[0], s.pos[2], s.r]),
  ];
  const union = (ctx: CanvasRenderingContext2D, grow: number) => {
    ctx.beginPath();
    for (const [a, b, r] of lands) { const [u, v] = P(a, b), R = Math.max(0.5, (r + grow) * S); ctx.moveTo(u + R, v); ctx.arc(u, v, R, 0, TAU); }
  };
  const fillUnion = (grow: number, color: string) => { x.fillStyle = color; union(x, grow); x.fill(); };
  const edge = (grow: number, color: string, alpha: number, lw: number) => {
    const c2 = document.createElement("canvas"); c2.width = w; c2.height = h; const y = c2.getContext("2d")!;
    y.fillStyle = color; union(y, grow); y.fill();
    y.globalCompositeOperation = "destination-out"; union(y, grow - lw / S); y.fill();
    x.globalAlpha = alpha; x.drawImage(c2, 0, 0); x.globalAlpha = 1;
  };
  // water: pale aqua offshore, deepening to mint-aqua over the shoals (as a real chart tints its shallows)
  x.fillStyle = "#eaf6f4"; x.fillRect(0, 0, w, h);
  fillUnion(6.2, "#dff2ee"); fillUnion(3.9, "#d0ece5"); fillUnion(1.9, "#c0e5da"); fillUnion(0.8, "#b1ddcf");
  for (const d of [0.8, 1.9, 3.9, 6.2]) edge(d, "#1f7f6c", 0.3, 1.4);
  // graticule
  x.strokeStyle = "rgba(12,59,41,.07)"; x.lineWidth = 1;
  for (let u = 64; u < w; u += 64) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, h); x.stroke(); }
  for (let v = h - 74; v > 0; v -= 64) { x.beginPath(); x.moveTo(0, v); x.lineTo(w, v); x.stroke(); }
  // range rings about the light, and today's reach (01) dashed
  x.strokeStyle = "rgba(12,59,41,.14)"; x.lineWidth = 1.5; x.setLineDash([3, 6]);
  for (let r = 3.2; r < 15; r += 3.2) { x.beginPath(); x.arc(C.cx, C.cy, r * S, 0, TAU); x.stroke(); }
  x.setLineDash([10, 8]); x.strokeStyle = "rgba(12,59,41,.45)"; x.lineWidth = 2; x.beginPath(); x.arc(C.cx, C.cy, 1.8 * S, 0, TAU); x.stroke(); x.setLineDash([]);
  // compass rose (north = bearing 0), clear of every mark
  const rose = [178, 262], R = 96;
  // soundings: depth grows with distance from land; none on land, the rose or the cartouche
  x.font = "italic 15px Georgia, 'Times New Roman', serif"; x.textAlign = "center"; x.fillStyle = "rgba(12,59,41,.4)";
  for (let gy = 0; gy < 9; gy++) for (let gx = 0; gx < 14; gx++) {
    const i = gy * 14 + gx, u = 44 + gx * 72 + (hash(i, 1) - 0.5) * 36, v = 40 + gy * 72 + (hash(i, 2) - 0.5) * 36;
    let d = Infinity;
    for (const [a, b, r] of lands) { const [cx, cy] = P(a, b); d = Math.min(d, Math.hypot(u - cx, v - cy) / S - r); }
    if (d < 0.6 || hash(i, 3) < 0.3 || Math.hypot(u - rose[0], v - rose[1]) < R + 16 || (u < 300 && v < 110)) continue;
    x.fillText(String(Math.round(2 + d * 1.7 + hash(i, 4) * 3)), u, v);
  }
  // land: forest coastline, sage lowland, greener high ground
  fillUnion(0.07, "rgba(12,59,41,.7)"); fillUnion(0, "#d6e1d2"); fillUnion(-0.9, "#c7d9c2"); fillUnion(-2.2, "#b6cfb0");
  edge(-0.9, "#0c3b29", 0.14, 1.2);
  // buoys and the quay
  W.BUOYS.forEach((bu) => { const [a, c] = P(bu[0], bu[2]); x.fillStyle = "#0ea5e9"; x.beginPath(); x.arc(a, c, 8, 0, TAU); x.fill(); x.strokeStyle = "#ffffff"; x.lineWidth = 2.5; x.stroke(); });
  x.strokeStyle = "rgba(12,59,41,.5)"; x.lineWidth = 10; x.beginPath(); x.moveTo(...P(W.HARBOUR.quay.from[0], W.HARBOUR.quay.from[2])); x.lineTo(...P(W.HARBOUR.quay.to[0], W.HARBOUR.quay.to[2])); x.stroke();
  // the rose
  x.save(); x.translate(rose[0], rose[1]);
  x.fillStyle = "rgba(251,253,249,.75)"; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
  x.strokeStyle = "rgba(12,59,41,.6)"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, R - 12, 0, TAU); x.stroke();
  x.rotate(W.chartAngle(0) + Math.PI / 2); // local −y = north
  for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU, l = i % 18 === 0 ? 12 : i % 2 === 0 ? 7 : 4; x.beginPath(); x.moveTo(Math.sin(a) * (R - 12), -Math.cos(a) * (R - 12)); x.lineTo(Math.sin(a) * (R - 12 + l), -Math.cos(a) * (R - 12 + l)); x.stroke(); }
  for (const main of [false, true]) for (let kk = main ? 0 : 1; kk < 8; kk += 2) {
    const len = main ? R * 0.84 : R * 0.5, wd = main ? 12 : 8;
    x.save(); x.rotate((kk / 8) * TAU);
    x.fillStyle = kk === 0 ? "#fcb401" : "#0c3b29"; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -len); x.lineTo(-wd, -wd); x.closePath(); x.fill();
    x.fillStyle = kk === 0 ? "#ffe7a6" : "#fbfdf9"; x.strokeStyle = "rgba(12,59,41,.7)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -len); x.lineTo(wd, -wd); x.closePath(); x.fill(); x.stroke();
    x.restore();
  }
  x.fillStyle = "#0c3b29"; x.beginPath(); x.arc(0, 0, 4, 0, TAU); x.fill();
  x.font = "700 17px Georgia, serif"; x.fillText("N", 0, -R - 6);
  x.restore();
  // cartouche and scale bar
  x.fillStyle = "rgba(251,253,249,.92)"; x.strokeStyle = "rgba(12,59,41,.55)"; x.lineWidth = 1.5;
  x.beginPath(); x.roundRect(26, 24, 250, 66, 6); x.fill(); x.stroke();
  x.textAlign = "left"; x.fillStyle = "#0c3b29"; x.font = "600 20px Georgia, serif"; x.fillText("Growth Chart", 42, 52);
  x.font = "italic 13px Georgia, serif"; x.fillStyle = "rgba(12,59,41,.65)"; x.fillText("The headland & its approaches", 42, 74);
  for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? "#fbfdf9" : "#0c3b29"; x.fillRect(34 + i * 26, 606, 26, 6); }
  x.strokeStyle = "#0c3b29"; x.lineWidth = 1; x.strokeRect(34, 606, 130, 6);
  x.font = "11px Georgia, serif"; x.fillStyle = "rgba(12,59,41,.7)"; x.fillText("0", 31, 626); x.fillText("5 u", 154, 626);
  // three-sided neatline (the near edge is the table's rim) and a paper vignette
  x.strokeStyle = "rgba(12,59,41,.7)"; x.lineWidth = 2; x.beginPath(); x.moveTo(8, h); x.lineTo(8, 8); x.lineTo(w - 8, 8); x.lineTo(w - 8, h); x.stroke();
  x.fillStyle = "rgba(12,59,41,.55)";
  for (let s = 16, i = 0; s < w - 16; s += 32, i++) if (i % 2) x.fillRect(s, 10, Math.min(32, w - 16 - s), 4);
  for (let s = 16, i = 0; s < h; s += 32, i++) if (i % 2) { x.fillRect(10, s, 4, Math.min(32, h - s)); x.fillRect(w - 14, s, 4, Math.min(32, h - s)); }
  const vg = x.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.72);
  vg.addColorStop(0, "rgba(12,59,41,0)"); vg.addColorStop(1, "rgba(12,59,41,.07)");
  x.fillStyle = vg; x.fillRect(0, 0, w, h);
}
