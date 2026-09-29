// The lighthouse: drums, head (plinth, corbel, deck), the 01 housing, the core and halo, the 03 lens drum,
// the crown, lantern, gallery rail, flagstaff with the 04 signal hoist, and the beam.
import * as THREE from "three";
import { arrowHead, cyl, flat, tex, basic, type Kit } from "./kit";
import { WORLD, beamMaterial, withMist } from "./look";
import * as W from "./model";
import type { Frame } from "./world";

const { DEG } = W;

/** 8 panes of 256 × 512: 0 article, 1 product terminal, 2 comparison, 3 code, 4 refresh, 5–7 Fresnel glass. */
function drawPanes(x: CanvasRenderingContext2D, w: number, h: number) {
  const cw = w / 8, IND = "#4f46e5", INK = "#0c3b29", GREY = "#9aa3b5";
  const rr = (X: number, Y: number, W2: number, H2: number, r: number, fill: string | CanvasGradient) => { x.fillStyle = fill; x.beginPath(); x.roundRect(X, Y, W2, H2, r); x.fill(); };
  const line = (X0: number, Y0: number, X1: number, Y1: number, c: string, lw: number) => { x.strokeStyle = c; x.lineWidth = lw; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X1, Y1); x.stroke(); };
  x.lineCap = "round"; x.lineJoin = "round"; x.textAlign = "center";
  for (let i = 0; i < 8; i++) {
    const ox = i * cw, cx = ox + cw / 2;
    if (i >= 5) {
      // Fresnel glass: pale amber prism rings, no chrome
      const g = x.createLinearGradient(ox, 0, ox + cw, h); g.addColorStop(0, "#fff8e6"); g.addColorStop(1, "#fde9b8");
      rr(ox + 8, 8, cw - 16, h - 16, 18, g);
      for (let k = 1; k < 7; k++) { x.strokeStyle = k % 2 ? "#f2c96b" : "#fff3cf"; x.lineWidth = 7; x.beginPath(); x.arc(cx, h / 2, k * 20, 0, 7); x.stroke(); }
      x.strokeStyle = "#c9a24a"; x.lineWidth = 5; x.beginPath(); x.roundRect(ox + 10, 10, cw - 20, h - 20, 16); x.stroke();
      continue;
    }
    const dark = i === 1 || i === 3;
    // glass sheet + window chrome (indigo title bar with three dots)
    rr(ox + 8, 8, cw - 16, h - 16, 18, dark ? "#13233a" : "#fffdf7");
    rr(ox + 8, 8, cw - 16, 50, 18, IND); x.fillRect(ox + 8, 40, cw - 16, 18);
    ["#fbfdf9", "#c6ef5c", "#fcb401"].forEach((c, k) => { x.fillStyle = c; x.beginPath(); x.arc(ox + 36 + k * 24, 33, 7, 0, 7); x.fill(); });
    if (i === 0) {
      // article: headline, byline, hero figure, body lines
      rr(ox + 30, 82, 190, 22, 6, INK); rr(ox + 30, 114, 140, 22, 6, INK);
      rr(ox + 30, 150, 80, 10, 5, IND);
      rr(ox + 30, 176, 196, 110, 10, "#b3dcc1");
      x.fillStyle = "#179a55"; x.beginPath(); x.moveTo(ox + 40, 276); x.lineTo(ox + 100, 214); x.lineTo(ox + 140, 252); x.lineTo(ox + 170, 228); x.lineTo(ox + 216, 276); x.closePath(); x.fill();
      x.fillStyle = "#fcb401"; x.beginPath(); x.arc(ox + 190, 204, 13, 0, 7); x.fill();
      for (let k = 0; k < 6; k++) rr(ox + 30, 308 + k * 28, k === 5 ? 110 : 196 - (k % 3) * 18, 10, 5, GREY);
    } else if (i === 1) {
      // product: terminal prompt
      x.font = "800 96px ui-monospace, Menlo, monospace"; x.fillStyle = "#c6ef5c"; x.fillText(">_", cx, 200);
      rr(ox + 30, 250, 150, 14, 7, "#34d399"); rr(ox + 30, 282, 196, 14, 7, "#6fd0ff"); rr(ox + 30, 314, 120, 14, 7, "#9d9aff");
      rr(ox + 30, 362, 196, 88, 12, "#1e3a5f"); x.font = "700 30px ui-monospace, Menlo, monospace"; x.fillStyle = "#c6ef5c"; x.textAlign = "left"; x.fillText("$ run", ox + 46, 418); x.textAlign = "center";
      rr(ox + 150, 396, 14, 30, 3, "#fbfdf9");
    } else if (i === 2) {
      // comparison: two columns, ✓ vs ✕
      rr(ox + 28, 80, 94, 36, 10, "#179a55"); rr(ox + 134, 80, 94, 36, 10, "#e5e7eb");
      x.font = "800 24px system-ui"; x.fillStyle = "#fbfdf9"; x.fillText("US", ox + 75, 106); x.fillStyle = "#6b7280"; x.fillText("THEM", ox + 181, 106);
      line(cx, 128, cx, 470, "#e5e7eb", 3);
      for (let k = 0; k < 4; k++) {
        const y = 170 + k * 80;
        line(ox + 24, y + 40, ox + cw - 24, y + 40, "#eef0f3", 2);
        line(ox + 52, y, ox + 70, y + 18, "#179a55", 12); line(ox + 70, y + 18, ox + 102, y - 18, "#179a55", 12);
        line(ox + 164, y - 14, ox + 196, y + 18, "#ec544b", 12); line(ox + 196, y - 14, ox + 164, y + 18, "#ec544b", 12);
      }
    } else if (i === 3) {
      // code: line numbers + syntax-coloured lines
      x.font = "800 56px ui-monospace, Menlo, monospace"; x.fillStyle = "#9d9aff"; x.fillText("</>", cx, 124);
      const L: [number, number, string][] = [[0, 120, "#c084fc"], [1, 150, "#6fd0ff"], [2, 110, "#34d399"], [2, 70, "#fcb401"], [1, 130, "#6fd0ff"], [2, 96, "#f87171"], [1, 60, "#34d399"], [0, 40, "#c084fc"]];
      L.forEach(([ind, len, c], k) => { const y = 164 + k * 38; x.fillStyle = "#475569"; x.font = "600 20px ui-monospace, Menlo, monospace"; x.fillText(String(k + 1), ox + 34, y + 12); rr(ox + 58 + ind * 24, y, len, 14, 7, c); });
    } else {
      // refresh: ↻ over a "v2" badge and an updated-date line
      x.strokeStyle = IND; x.fillStyle = IND; x.lineWidth = 20; x.beginPath(); x.arc(cx, 220, 70, -Math.PI * 0.35, Math.PI * 1.35); x.stroke(); arrowHead(x, cx, 220, 70, Math.PI * 1.35, 36);
      rr(cx - 46, 330, 92, 40, 20, "#c6ef5c"); x.font = "800 26px system-ui"; x.fillStyle = INK; x.fillText("v2", cx, 359);
      rr(ox + 40, 400, 176, 10, 5, GREY); rr(ox + 70, 426, 116, 10, 5, GREY);
    }
    // glass edge: indigo rim + inner highlight
    x.strokeStyle = IND; x.lineWidth = 6; x.beginPath(); x.roundRect(ox + 10, 10, cw - 20, h - 20, 16); x.stroke();
    x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2; x.beginPath(); x.roundRect(ox + 16, 16, cw - 32, h - 32, 12); x.stroke();
  }
}

/** A texture repeated n times around a cylinder. */
const wrapX = (w: number, h: number, draw: Parameters<typeof tex>[2], n: number) => {
  const t = tex(w, h, draw);
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(n, 1);
  return t;
};
/** Masonry courses (base course) and faint panel seams (drums). */
const stoneTex = () => wrapX(512, 64, (x, w, h) => {
  x.fillStyle = "#d8cbb0"; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) {
    const bx = c * 64 - (r ? 32 : 0), shade = 200 + ((c * 37 + r * 11) % 5) * 8;
    x.fillStyle = `rgb(${shade + 20},${shade + 8},${shade - 18})`; x.fillRect(bx + 2, r * 32 + 2, 60, 28);
  }
}, 4);
const seamTex = () => wrapX(64, 256, (x, w, h) => {
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { x.fillStyle = "#e2dccd"; x.fillRect(0, r * 64, w, 3); x.fillStyle = "#f3efe6"; x.fillRect(0, r * 64 + 3, w, 3); x.fillStyle = "#ebe5d8"; x.fillRect(r % 2 ? 0 : 32, r * 64, 2, 64); }
}, 14);
/** Arched door and small windows, drawn with a transparent surround (alphaTest). */
const doorTex = () => tex(128, 256, (x) => {
  x.fillStyle = "#e4dac7"; x.beginPath(); x.moveTo(6, 256); x.lineTo(6, 70); x.arc(64, 70, 58, Math.PI, 0); x.lineTo(122, 256); x.fill();
  x.fillStyle = "#0c3b29"; x.beginPath(); x.moveTo(22, 256); x.lineTo(22, 74); x.arc(64, 74, 42, Math.PI, 0); x.lineTo(106, 256); x.fill();
  x.strokeStyle = "#1c5a40"; x.lineWidth = 3; for (const X of [43, 64, 85]) { x.beginPath(); x.moveTo(X, 60); x.lineTo(X, 250); x.stroke(); }
  x.fillStyle = "#ffe7a8"; x.beginPath(); x.arc(64, 74, 30, Math.PI, 0); x.fill(); // fanlight
  x.fillStyle = "#dcc08a"; x.beginPath(); x.arc(92, 170, 6, 0, 7); x.fill();
});
const windowTex = () => tex(96, 160, (x) => {
  x.fillStyle = "#e4dac7"; x.beginPath(); x.moveTo(6, 150); x.lineTo(6, 48); x.arc(48, 48, 42, Math.PI, 0); x.lineTo(90, 150); x.fill();
  const g = x.createLinearGradient(0, 16, 0, 140); g.addColorStop(0, "#9fd3e6"); g.addColorStop(0.5, "#2d5a4c"); g.addColorStop(1, "#16372c");
  x.fillStyle = g; x.beginPath(); x.moveTo(18, 138); x.lineTo(18, 50); x.arc(48, 50, 30, Math.PI, 0); x.lineTo(78, 138); x.fill();
  x.strokeStyle = "#f7f3ea"; x.lineWidth = 4; x.beginPath(); x.moveTo(48, 22); x.lineTo(48, 138); x.moveTo(18, 84); x.lineTo(78, 84); x.stroke();
  x.fillStyle = "#cbbd9f"; x.fillRect(0, 142, 96, 14); // sill
});
/** Tinted sector glass: mullions, a top highlight and a diagonal sheen (multiplied by the sector colour). */
const crownTex = () => tex(256, 32, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffffff"); g.addColorStop(0.3, "#d9d9d9"); g.addColorStop(1, "#bdbdbd");
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "rgba(255,255,255,.85)"; for (let s = 0; s < 4; s++) { x.beginPath(); x.moveTo(s * 64 + 10, h); x.lineTo(s * 64 + 26, 0); x.lineTo(s * 64 + 34, 0); x.lineTo(s * 64 + 18, h); x.fill(); }
  x.fillStyle = "#4a4a4a"; for (let s = 0; s <= 4; s++) x.fillRect(s * 64 - 2, 0, 4, h);
});

/** The pane mask: glass glows, strokes do not. */
function maskOf(src: HTMLCanvasElement) {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext("2d")!;
  x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = 0.2126 * d.data[i] + 0.7152 * d.data[i + 1] + 0.0722 * d.data[i + 2];
    d.data[i] = d.data[i + 1] = d.data[i + 2] = l > 215 ? 255 : 0;
  }
  x.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createTower(k: Kit) {
  const { add, M, root } = k;
  add(new THREE.RingGeometry(W.COLLAR.r0, W.COLLAR.r1, 64), M.stone, [0, W.COLLAR.y, 0], [-Math.PI / 2, 0, 0]);
  // masonry base course: the stone socket the drums telescope out of
  add(cyl(1.04, 1.08, 0.14, 64), withMist(new THREE.MeshPhysicalMaterial({ map: stoneTex(), roughness: 0.85 }), "physical"), [0, W.GROUND + 0.05, 0], null, root, true);
  const drumMat = withMist(new THREE.MeshPhysicalMaterial({ map: seamTex(), color: WORLD.porcelain, emissive: WORLD.porcelain, emissiveIntensity: 0.07, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.3 }), "physical");
  const detailMat = (map: THREE.Texture) => withMist(new THREE.MeshPhysicalMaterial({ map, alphaTest: 0.5, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }), "physical");
  const doorM = detailMat(doorTex()), winM = detailMat(windowTex());
  const drums = W.DRUM.radii.map(([rb, rt], i) => {
    const d = add(cyl(rt, rb, W.DRUM.h, 56), i === 2 ? M.lacquer : drumMat, [0, 0, 0], null, root, true);
    add(new THREE.TorusGeometry(rt + 0.004, 0.014, 6, 64), M.stone, [0, W.DRUM.h / 2 - 0.01, 0], [Math.PI / 2, 0, 0], d); // course band at the joint
    // a curved patch on the tapered wall (bearing b, local y0 → y1, width wd): exact fit, so nothing clips
    const patch = (b: number, y0: number, y1: number, wd: number, m: THREE.Material) => {
      const r = (y: number) => W.lerp(rb, rt, y / W.DRUM.h + 0.5) + 0.006, len = wd / r((y0 + y1) / 2);
      add(new THREE.CylinderGeometry(r(y1), r(y0), y1 - y0, 8, 1, true, Math.PI - b * DEG - len / 2, len), m, [0, (y0 + y1) / 2, 0], null, d);
    };
    if (i === 0) patch(192, -0.5, -0.08, 0.24, doorM);
    if (i === 1) patch(212, -0.1, 0.18, 0.13, winM);
    if (i === 3) patch(186, -0.2, 0.08, 0.13, winM);
    return d;
  });
  const head = new THREE.Group();
  root.add(head);
  add(cyl(W.PLINTH.rT, W.PLINTH.rB, W.PLINTH.h), M.porcelain, [0, -W.DECKD.h - W.CORBEL.h - W.PLINTH.h / 2, 0], null, head, true);
  const corbel = add(cyl(1, W.PLINTH.rT / W.CORBEL.r1, W.CORBEL.h), M.porcelain, [0, -W.DECKD.h - W.CORBEL.h / 2, 0], null, head, true);
  const deck = add(cyl(1, 1, W.DECKD.h), M.porcelain, [0, -W.DECKD.h / 2, 0], null, head, true);
  // >_ plate on the plinth face at bearing 226
  {
    const d = W.dir(226);
    const plateTex = tex(128, 72, (x, w) => { x.fillStyle = "#0c3b29"; x.fillRect(0, 0, w, 72); x.fillStyle = "#fbfdf9"; x.font = "700 40px ui-monospace"; x.textAlign = "center"; x.fillText(">_", w / 2, 50); });
    add(new THREE.PlaneGeometry(0.22, 0.13), basic(plateTex), [d[0] * 0.745, -W.DECKD.h - W.CORBEL.h - 0.31, d[2] * 0.745], [0, -226 * DEG + Math.PI, 0], head);
  }
  // the product's housing (01): spindle + 3 layers with glyph labels on the 226-facing rim
  add(cyl(W.HOUSING.spindle, W.HOUSING.spindle, W.HOUSING.top, 12), M.lacquer, [0, W.HOUSING.top / 2, 0], null, head);
  const labelTex = W.HOUSING.glyphs.map((g) => tex(512, 172, (x, w, h) => {
    x.scale(2, 2); w /= 2; h /= 2; // 2× for crisp glyphs
    x.fillStyle = "#0c3b29"; x.fillRect(0, 0, w, h); x.fillStyle = "#fbfdf9"; x.beginPath(); x.roundRect(5, 5, w - 10, h - 10, 8); x.fill();
    x.fillStyle = "#179a55"; x.beginPath(); x.arc(22, h / 2, 5, 0, 7); x.fill(); // status LED
    x.strokeStyle = "#0c3b29"; x.fillStyle = "#0c3b29"; x.textAlign = "center"; x.font = "800 56px ui-monospace, Menlo, monospace";
    if (g === "▤") { x.lineWidth = 7; x.strokeRect(84, 14, 88, 58); for (const y of [30, 43, 56]) { x.beginPath(); x.moveTo(98, y); x.lineTo(158, y); x.stroke(); } } else x.fillText(g, w / 2, 64);
  }));
  // circuit traces on each plate's top face: the stack reads as a precise module
  const traceTex = tex(256, 256, (x) => {
    x.fillStyle = "#f7f3ea"; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill();
    x.strokeStyle = "#8fb8a0"; x.lineWidth = 3; x.lineCap = "round";
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, r0 = 30, r1 = 70 + (k % 3) * 18, bend = a + (k % 2 ? 0.25 : -0.25);
      x.beginPath(); x.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); x.lineTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1); x.lineTo(128 + Math.cos(bend) * (r1 + 24), 128 + Math.sin(bend) * (r1 + 24)); x.stroke();
      x.fillStyle = k % 4 ? "#179a55" : "#fcb401"; x.beginPath(); x.arc(128 + Math.cos(bend) * (r1 + 24), 128 + Math.sin(bend) * (r1 + 24), 5, 0, 7); x.fill(); }
    x.strokeStyle = "#0c3b29"; x.lineWidth = 4; x.beginPath(); x.arc(128, 128, 24, 0, 7); x.stroke();
  });
  const traceMat = withMist(new THREE.MeshPhysicalMaterial({ map: traceTex, roughness: 0.4, clearcoat: 0.5 }), "physical");
  const layers = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    head.add(g);
    add(cyl(W.HOUSING.r, W.HOUSING.r, W.HOUSING.h, 48), M.porcelain, [0, 0, 0], null, g, true);
    [-1, 1].forEach((sy) => add(new THREE.TorusGeometry(W.HOUSING.r, 0.012, 6, 48), M.lacquer, [0, (sy * W.HOUSING.h) / 2, 0], [Math.PI / 2, 0, 0], g)); // lacquer edges
    add(new THREE.CircleGeometry(W.HOUSING.r - 0.012, 48), traceMat, [0, W.HOUSING.h / 2 + 0.002, 0], [-Math.PI / 2, 0, 0], g);
    // label as a curved patch on the rim (a flat plane would sink into the curve at its edges)
    const rl = W.HOUSING.r + 0.004, len = W.HOUSING.label[0] / rl;
    add(new THREE.CylinderGeometry(rl, rl, W.HOUSING.label[1], 12, 1, true, Math.PI - 226 * DEG - len / 2, len), basic(labelTex[i]), [0, 0, 0], null, g);
    return g;
  });
  const scanRing = add(new THREE.TorusGeometry(0.47, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: "#ffc21a", toneMapped: false }), [0, 0, 0], [Math.PI / 2, 0, 0], head);
  add(new THREE.TorusGeometry(0.47, 0.055, 8, 64), new THREE.MeshBasicMaterial({ color: "#fcb401", transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }), null, null, scanRing); // soft glow
  add(new THREE.CircleGeometry(0.47, 64), new THREE.MeshBasicMaterial({ color: "#ffd36b", transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), null, null, scanRing); // the scan plane
  const core = add(new THREE.SphereGeometry(W.CORE_R, 24, 16), M.lamp, [0, W.LAMP_ABOVE_DECK, 0], null, head);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: k.HALO.amber, transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: false, toneMapped: false }));
  halo.renderOrder = 8;
  head.add(halo);
  halo.position.y = W.LAMP_ABOVE_DECK;
  const haloOcc = new THREE.Sprite(new THREE.SpriteMaterial({ map: k.HALO.amber, transparent: true, depthWrite: false, depthTest: true, sizeAttenuation: false, toneMapped: false })); // the occluded twin (03 window)
  haloOcc.renderOrder = 8;
  head.add(haloOcc);
  haloOcc.position.y = W.LAMP_ABOVE_DECK;
  // lens drum: 8 panes with pictograms (03)
  const paneTex = tex(2048, 512, drawPanes);
  const paneMask = maskOf(paneTex.image as HTMLCanvasElement);
  const lens = new THREE.Group();
  head.add(lens);
  lens.position.y = W.LAMP_ABOVE_DECK;
  const paneMats: THREE.MeshPhysicalMaterial[] = [];
  const panes = [...Array(8)].map((_, i) => {
    const g = new THREE.PlaneGeometry(0.38, 0.62);
    const uv = g.attributes.uv;
    for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / 8);
    const mat = withMist(new THREE.MeshPhysicalMaterial({ map: paneTex, emissiveMap: paneMask, color: "#ffffff", emissive: WORLD.lensGlow, emissiveIntensity: 0.2, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.96 }), "physical"); // front faces only: the far panes never ghost through
    paneMats.push(mat);
    const a = (i / 8) * Math.PI * 2;
    const m = add(g, mat, [Math.sin(a) * 0.47, 0, Math.cos(a) * 0.47], [0, a, 0], lens);
    m.renderOrder = 1;
    return m;
  });
  [-0.33, 0.33].forEach((y) => add(new THREE.TorusGeometry(0.5, 0.016, 6, 48), M.lacquer, [0, y, 0], [Math.PI / 2, 0, 0], lens));
  for (let i = 0; i < 8; i++) { const a = ((i + 0.5) / 8) * Math.PI * 2; add(cyl(0.011, 0.011, 0.66, 6), M.lacquer, [Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5], null, lens); } // lens mullions
  // crown → sector panes
  const crown = new THREE.Group();
  head.add(crown);
  const sheen = crownTex();
  [WORLD.fadeAzure[0], WORLD.fadeEmerald[0], WORLD.fadeSun[1], WORLD.fadeIndigo[0]].forEach((c, i) => {
    const mat = withMist(new THREE.MeshPhysicalMaterial({ map: sheen, color: c, emissive: c, emissiveIntensity: 0.3, transparent: true, opacity: 0.78, roughness: 0.08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }), "physical");
    add(new THREE.CylinderGeometry(0.52, 0.52, 0.09, 24, 1, true, (i * 90 + 4) * DEG, 82 * DEG), mat, [0, W.LAMP_ABOVE_DECK + 0.42, 0], null, crown).renderOrder = 3;
  });
  [-0.045, 0.045].forEach((dy) => add(new THREE.TorusGeometry(0.52, 0.008, 6, 48), M.lacquer, [0, W.LAMP_ABOVE_DECK + 0.42 + dy, 0], [Math.PI / 2, 0, 0], crown));
  // lantern (glass depthWrite false: the drum inside stays visible)
  const lantern = new THREE.Group();
  head.add(lantern);
  add(cyl(0.66, 0.68, 0.3), M.lacquer, [0, 0.15, 0], null, lantern, true);
  // clearer, lightly green glass so the warm lamp reads through it (a local material; the shared one stays as is)
  const glass = withMist(new THREE.MeshPhysicalMaterial({ color: "#3d6b5a", transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, depthWrite: false }), "physical");
  add(cyl(0.6, 0.6, 0.74, 48, true), glass, [0, 0.67, 0], null, lantern).renderOrder = 2;
  [0.52, 0.82].forEach((y) => add(new THREE.TorusGeometry(0.606, 0.009, 6, 48), M.lacquer, [0, y, 0], [Math.PI / 2, 0, 0], lantern)); // glazing bars
  add(cyl(0.035, 0.07, 0.24, 16), M.champagne, [0, 0.42, 0], null, lantern); // lamp pedestal
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    add(cyl(0.018, 0.018, 0.8, 6), M.lacquer, [Math.sin(a) * 0.605, 0.67, Math.cos(a) * 0.605], [0.45 * Math.cos(a), 0, -0.45 * Math.sin(a)], lantern);
  }
  add(cyl(0.66, 0.66, 0.06), M.lacquer, [0, 1.07, 0], null, lantern, true);
  const prof = [[0.82, 0], [0.8, 0.05], [0.7, 0.16], [0.55, 0.3], [0.34, 0.44], [0.14, 0.51], [0, 0.53]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(prof, 48), M.lacquer, [0, 1.1, 0], null, lantern, true);
  add(new THREE.TorusGeometry(0.82, 0.022, 8, 64), M.lacquer, [0, 1.1, 0], [Math.PI / 2, 0, 0], lantern); // dome drip edge
  add(cyl(0.05, 0.07, 0.08, 16), M.lacquer, [0, 1.65, 0], null, lantern); // vent collar under the ball
  add(new THREE.SphereGeometry(0.09, 16, 12), M.champagne, [0, 1.72, 0], null, lantern);
  add(cyl(0.01, 0.016, 0.4, 6), M.lacquer, [0, 1.95, 0], null, lantern);
  const rail = new THREE.Group();
  head.add(rail);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    add(cyl(0.014, 0.014, 0.36, 6), M.lacquer, [Math.sin(a) * 1.08, 0.18, Math.cos(a) * 1.08], null, rail);
  }
  add(new THREE.TorusGeometry(1.08, 0.026, 8, 96), M.lacquer, [0, 0.36, 0], [Math.PI / 2, 0, 0], rail);
  add(new THREE.TorusGeometry(1.08, 0.011, 6, 96), M.lacquer, [0, 0.19, 0], [Math.PI / 2, 0, 0], rail); // mid rail
  add(new THREE.TorusGeometry(1, 0.03, 8, 96), M.stone, [0, -0.05, 0], [Math.PI / 2, 0, 0], deck); // gallery lip: the overhang reads
  // flagstaff + signal hoist (04 social)
  const staff = new THREE.Group();
  head.add(staff);
  {
    const [x, , z] = W.polar(W.FLAGSTAFF.bearing, W.FLAGSTAFF.r);
    staff.position.set(x, 0, z);
    add(cyl(0.022, 0.026, W.FLAGSTAFF.h, 8), M.lacquer, [0, W.FLAGSTAFF.h / 2, 0], null, staff);
    add(new THREE.SphereGeometry(0.035, 12, 8), M.champagne, [0, W.FLAGSTAFF.h + 0.02, 0], null, staff); // truck
    add(cyl(0.004, 0.004, W.FLAGSTAFF.h - 0.1, 4), M.lacquer, [0.03, W.FLAGSTAFF.h / 2 + 0.05, 0], null, staff); // halyard
  }
  // five signal pennants of varied cut (long / short / swallowtail), indigo and periwinkle
  const CUT: [number, number, boolean][] = [[0.5, 0.14, false], [0.36, 0.12, true], [0.46, 0.14, false], [0.3, 0.13, true], [0.42, 0.12, false]];
  const pennants = CUT.map(([len, ht, fork], i) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(len, -ht * 0.5 + (fork ? ht * 0.3 : 0)); if (fork) { s.lineTo(len * 0.72, -ht * 0.5); s.lineTo(len, -ht * 0.8); } s.lineTo(0, -ht);
    return add(new THREE.ShapeGeometry(s), flat(i % 2 ? WORLD.fadeIndigo[0] : WORLD.indigo), [0.034, 0, 0], [0, 0, 0], staff);
  });
  // beam: two cones at the lamp
  const beam = new THREE.Group();
  head.add(beam);
  beam.position.y = W.LAMP_ABOVE_DECK;
  const glowMat = beamMaterial(WORLD.beam, WORLD.beamNear, 0.28), coreMat = beamMaterial(WORLD.beamCore, WORLD.beamNear, 0.3);
  const cone = (end: number, len = 16) => {
    const g = new THREE.CylinderGeometry(0.1, end, len, 64, 1, true);
    g.translate(0, -len / 2, 0);
    g.rotateZ(Math.PI / 2);
    return g;
  };
  const tiltG = new THREE.Group();
  beam.add(tiltG);
  const glowCone = new THREE.Mesh(cone(1.9), glowMat);
  glowCone.renderOrder = 4;
  tiltG.add(glowCone);
  const coreCone = new THREE.Mesh(cone(0.55), coreMat);
  coreCone.renderOrder = 5;
  tiltG.add(coreCone);

  const tint = new THREE.Color();
  const PANE = W.SECTORS.map((s) => new THREE.Color(s.pane)), beamMats = [glowMat, coreMat];
  return {
    pose(f: Frame) {
      const { p, b, ts, time, bm } = f;
      const [t01, , t03, t04] = f.t;
      drums.forEach((d, i) => {
        d.position.y = ts.drumBottoms[i] + W.DRUM.h / 2;
        d.visible = ts.drumBottoms[i] + W.DRUM.h > W.GROUND + 0.002;
      });
      head.position.y = ts.deck;
      const cr = W.lerp(W.CORBEL.r0, W.CORBEL.r1, ts.unfold), dr = W.lerp(W.DECKD.r0, W.DECKD.r1, ts.unfold);
      corbel.scale.set(cr, 1, cr);
      deck.scale.set(dr, 1, dr);
      rail.visible = ts.unfold > 0.01;
      rail.scale.set(1, Math.max(1e-3, ts.unfold), 1);
      lantern.visible = ts.lantern > 0.01;
      lantern.scale.set(1, Math.max(1e-3, ts.lantern), 1);
      staff.visible = ts.lantern > 0.6;
      // 01 housing: builds up the spindle during L0, explodes down and out at B1
      const hs = W.housing01(p, t01), H0 = W.HOUSING, out = W.dir(H0.outBearing);
      layers.forEach((g, i) => {
        const bk = b.housing01[i], mid = H0.top - (i + 0.5) * H0.h - i * H0.seam;
        g.visible = bk > 0.01;
        g.position.set(out[0] * i * H0.out * hs.explode, W.lerp(0.02 + H0.h / 2, mid - i * H0.down * hs.explode, bk), out[2] * i * H0.out * hs.explode);
        g.scale.set(W.lerp(0.4, 1, bk), 1, W.lerp(0.4, 1, bk));
      });
      scanRing.visible = hs.scan !== null;
      if (hs.scan !== null) scanRing.position.y = hs.scan;
      // core and halo (capped while the drum encloses the core during 03); the one-time ignition scales both
      const lit = f.lit;
      core.scale.setScalar(Math.max(1e-3, lit * W.breathe(time) * (1 + 0.15 * W.corePulse03(p, t03))));
      halo.scale.setScalar(0.034);
      haloOcc.scale.copy(halo.scale);
      const base = lit * W.haloCap(p) * (0.85 + 0.15 * W.breathe(time)), fr = W.haloFree(p);
      halo.material.opacity = base * fr;
      halo.visible = fr > 0.001 && lit > 0;
      haloOcc.material.opacity = base * (1 - fr);
      haloOcc.visible = fr < 0.999 && lit > 0;
      // 03 drum
      lens.visible = b.lens03 > 0.01;
      lens.scale.setScalar(Math.max(1e-3, b.lens03));
      lens.rotation.y = -W.drumAngle(p, t03, t04) * DEG + Math.PI;
      const ld = W.lensDrum(t03), g3 = W.loopGain(2, p);
      panes.forEach((m, i) => {
        const a2 = (i / 8) * Math.PI * 2, outK = g3 > 0.5 && i === ld.pane ? ld.out * 0.12 : 0;
        m.position.set(Math.sin(a2) * (0.47 + outK), 0, Math.cos(a2) * (0.47 + outK));
      });
      const pulse = W.corePulse03(p, t03);
      paneMats.forEach((m) => { m.emissiveIntensity = 0.2 + 0.15 * pulse; });
      const crownIn = W.smooth(W.sub(W.legU("L2", p), 0.2, 0.6));
      crown.visible = crownIn > 0.01 && ts.lantern < 0.99;
      crown.scale.set(1 + 0.16 * ts.lantern, 1 + 7 * ts.lantern, 1 + 0.16 * ts.lantern);
      // beam
      const tw = W.sectorTint(bm.bearing), tinted = bm.state === "escapement" || bm.state === "continuous";
      if (tinted) tw.reduce((acc, w, i) => acc.lerp(PANE[i], w), tint.set("#ffffff"));
      beam.visible = bm.light * lit > 0.01;
      beam.rotation.y = -(bm.bearing - 90) * DEG;
      tiltG.rotation.z = bm.tilt * DEG;
      for (const m of beamMats) {
        m.uniforms.uLight.value = bm.light * lit;
        m.uniforms.uTime.value = time;
        m.uniforms.uTintAmt.value = tinted ? 0.4 * tw.reduce((x, y) => x + y, 0) : 0;
        if (tinted) m.uniforms.uTint.value.copy(tint);
      }
      // 04 signal hoist
      const r4 = f.r4;
      pennants.forEach((m, i) => {
        m.position.y = W.lerp(0.25, W.FLAGSTAFF.h - 0.12 - i * 0.28, r4.hoist[i]);
        m.rotation.y = 0.22 * Math.sin(time * 2.6 + i * 1.3); // flutter
        m.visible = ts.lantern > 0.6;
      });
    },
  };
}
