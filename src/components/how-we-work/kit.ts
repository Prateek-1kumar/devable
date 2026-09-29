// The build kit: mesh helpers, canvas textures, halos, glyph tiles and the three hull silhouettes.
// Everything is created against one root group (the world) and one viewport height (for constant-pixel sprites).
import * as THREE from "three";
import { MIST, WORLD, materials, withMist } from "./look";
import * as W from "./model";

type V3 = [number, number, number];
type Stop = [number, string];
export type HullKind = "dinghy" | "sloop" | "freighter";
export type Hull = THREE.Group & { userData: { pen: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial> } };

export const cyl = (rt: number, rb: number, h: number, seg = 48, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
export const hash = (i: number, n: number) => {
  const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function paintHeight<G extends THREE.BufferGeometry>(g: G, low: string, high: string, y0: number, y1: number) {
  const pos = g.attributes.position, c = new Float32Array(pos.count * 3);
  const a = new THREE.Color(low), b = new THREE.Color(high), t = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const k = Math.min(1, Math.max(0, (pos.getY(i) - y0) / (y1 - y0)));
    t.lerpColors(a, b, k * k * (3 - 2 * k)).toArray(c, i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}

export function tex(w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export const basic = (map: THREE.Texture, extra: THREE.MeshBasicMaterialParameters = {}) =>
  withMist(new THREE.MeshBasicMaterial({ map, toneMapped: false, ...extra }), "basic"); // keyed by type, never per instance
export const flat = (color: THREE.ColorRepresentation, opacity = 1, extra: THREE.MeshBasicMaterialParameters = {}) =>
  withMist(new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false, side: THREE.DoubleSide, ...extra }), "basic");

export const radial = (stops: Stop[]) =>
  tex(128, 128, (x) => {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
  });

export function rockGeo(i: number, sy = 0.72) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const pos = g.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    const s = 0.8 + 0.4 * hash(k + i * 17, 3);
    pos.setXYZ(k, pos.getX(k) * s, pos.getY(k) * s * sy, pos.getZ(k) * s);
  }
  g.computeVertexNormals();
  return g;
}

/** A filled ↻ head where a clockwise arc of radius r about (cx, cy) ends at angle a; s is its size. */
export function arrowHead(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, a: number, s: number) {
  const ex = cx + r * Math.cos(a), ey = cy + r * Math.sin(a), tx = -Math.sin(a), ty = Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
  x.beginPath(); x.moveTo(ex + tx * s, ey + ty * s); x.lineTo(ex + nx * s * 0.9, ey + ny * s * 0.9); x.lineTo(ex - nx * s * 0.9, ey - ny * s * 0.9); x.closePath(); x.fill();
}

/** Glyph tiles (drawn as paths or text). */
function glyphTex(g: string, fg = "#4f46e5", bg = "rgba(251,253,249,.96)") {
  return tex(128, 128, (x) => {
    x.fillStyle = bg; x.beginPath(); x.roundRect(6, 6, 116, 116, 18); x.fill(); x.strokeStyle = fg; x.lineWidth = 5; x.stroke();
    x.fillStyle = fg; x.strokeStyle = fg; x.lineWidth = 8; x.lineCap = "round"; x.lineJoin = "round"; x.textAlign = "center"; x.font = "700 56px system-ui";
    if (g === "▤") { x.lineWidth = 6; x.strokeRect(34, 30, 60, 68); for (const y of [48, 64, 80]) { x.beginPath(); x.moveTo(44, y); x.lineTo(84, y); x.stroke(); } }
    else if (g === "✦") { x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 14 : 42, a = (i / 8) * Math.PI * 2 - Math.PI / 2; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.closePath(); x.fill(); }
    else if (g === "▶") { x.beginPath(); x.moveTo(46, 36); x.lineTo(92, 64); x.lineTo(46, 92); x.closePath(); x.fill(); }
    else if (g === "↻") { x.beginPath(); x.arc(64, 66, 28, -Math.PI * 0.35, Math.PI * 1.35); x.stroke(); arrowHead(x, 64, 66, 28, Math.PI * 1.35, 16); }
    else x.fillText(g, 64, 84);
  });
}

const hullShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, -0.17); s.lineTo(0.2, -0.2); s.quadraticCurveTo(0.5, -0.16, 0.62, 0); s.quadraticCurveTo(0.5, 0.16, 0.2, 0.2); s.lineTo(-0.5, 0.17); s.quadraticCurveTo(-0.55, 0, -0.5, -0.17);
  return s;
};

export const setHull = (h: THREE.Object3D, pos: readonly number[], heading: number) => {
  h.position.set(pos[0], 0, pos[2]);
  h.rotation.y = -(heading - 90) * W.DEG;
};

/** Copy-safe line: fades under the copy column and the rail band, and into the distance haze. */
export function safeLine<T extends THREE.LineBasicMaterial>(mat: T) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uView: MIST.uView, uHaze: MIST.uHaze });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vLineDist;").replace("#include <fog_vertex>", "#include <fog_vertex>\n  vLineDist = -mvPosition.z;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vLineDist; uniform vec2 uView; uniform vec2 uHaze;").replace("#include <fog_fragment>", "#include <fog_fragment>\n  gl_FragColor.a *= smoothstep(0.43, 0.49, gl_FragCoord.x / uView.x) * (1.0 - smoothstep(0.84, 0.88, 1.0 - gl_FragCoord.y / uView.y)) * (1.0 - 0.92 * smoothstep(uHaze.x, uHaze.y, vLineDist));");
  };
  mat.customProgramCacheKey = () => "safe-line";
  return mat;
}

/** The kit bound to a root group; sprites registered here keep a constant pixel size (see `resize`). */
export function createKit(root: THREE.Group) {
  const M = materials();
  let H = 900;
  const fixedPx: [THREE.Sprite, number][] = [];
  /** Constant-pixel sprite (sizeAttenuation false): scale = px / (3.157 · viewport height). */
  const pxScale = (px: number) => px / (3.157 * H);

  // castShadow allowlist: only named casters cast; everything else is false
  const add = <G extends THREE.BufferGeometry, Mt extends THREE.Material | THREE.Material[]>(geo: G, m: Mt, pos?: V3 | null, rot?: V3 | null, parent: THREE.Object3D = root, cast = false) => {
    const o = new THREE.Mesh(geo, m);
    if (pos) o.position.set(...pos);
    if (rot) o.rotation.set(...rot);
    o.castShadow = cast;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const sprite = (map: THREE.Texture, px: number, extra: { depthTest?: boolean; renderOrder?: number } = {}) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, depthTest: extra.depthTest ?? true, sizeAttenuation: false, toneMapped: false, fog: false }));
    s.scale.setScalar(pxScale(px));
    s.renderOrder = extra.renderOrder ?? 6;
    fixedPx.push([s, px]);
    return s;
  };
  const HALO = {
    amber: radial([[0, "rgba(255,250,235,1)"], [0.18, "rgba(255,226,150,.9)"], [0.5, "rgba(252,180,1,.35)"], [1, "rgba(252,180,1,0)"]]),
    neutral: radial([[0, "rgba(255,243,218,1)"], [0.45, "rgba(255,243,218,.85)"], [0.7, "rgba(230,220,200,.75)"], [1, "rgba(230,220,200,0)"]]),
    azure: radial([[0, "rgba(255,255,255,1)"], [0.2, "rgba(111,208,255,.95)"], [0.55, "rgba(14,165,233,.35)"], [1, "rgba(14,165,233,0)"]]),
    sun: radial([[0, "rgba(255,255,240,1)"], [0.2, "rgba(255,228,138,.95)"], [0.55, "rgba(245,179,1,.35)"], [1, "rgba(245,179,1,0)"]]),
    warm: radial([[0, "rgba(255,250,235,1)"], [0.25, "rgba(255,207,77,.8)"], [1, "rgba(255,207,77,0)"]]),
    emerald: radial([[0, "rgba(255,255,255,1)"], [0.25, "rgba(16,185,129,.7)"], [1, "rgba(16,185,129,0)"]]),
    coral: radial([[0, "rgba(255,255,255,1)"], [0.25, "rgba(236,84,75,.7)"], [1, "rgba(236,84,75,0)"]]),
  };
  const RETICLE = tex(128, 128, (x) => {
    x.strokeStyle = "rgba(12,59,41,.6)"; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.stroke();
    for (const a of [0, 1, 2, 3]) { x.save(); x.translate(64, 64); x.rotate((a * Math.PI) / 2); x.beginPath(); x.moveTo(52, 0); x.lineTo(62, 0); x.stroke(); x.restore(); }
  });
  const GLYPH: Record<"▤" | "✦" | "r/" | "▶", THREE.CanvasTexture> = {
    "▤": glyphTex("▤", "#4f46e5"), "✦": glyphTex("✦", "#0ea5e9"), "r/": glyphTex("r/", "#10b981"), "▶": glyphTex("▶", "#f5b301"),
  };
  /** Upright billboard tile (world size s, bottom on the point). */
  const billboard = (map: THREE.Texture, s: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }));
    sp.center.set(0.5, 0);
    sp.scale.set(s, s, 1);
    sp.renderOrder = 7;
    return sp;
  };
  /** A group whose local axes are a face's (x right, y up, z out), from a mapping f(x, y, lift) → world. */
  const faceGroup = (f: (x: number, y: number, lift: number) => readonly number[], unit = 1) => {
    const v = (a: readonly number[]) => new THREE.Vector3(a[0], a[1], a[2]);
    const o = v(f(0, 0, 0)), xa = v(f(unit, 0, 0)).sub(o), ya = v(f(0, unit, 0)).sub(o), za = v(f(0, 0, unit)).sub(o);
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    g.matrix.makeBasis(xa, ya, za).setPosition(o);
    root.add(g);
    return g;
  };
  const dashedRing = (color: string, opacity: number, dash = 0.012) => {
    const pts = [...Array(256)].map((_, i) => new THREE.Vector3(Math.cos((i / 256) * Math.PI * 2), 0, Math.sin((i / 256) * Math.PI * 2)));
    const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), safeLine(new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: dash, gapSize: dash * 0.66 })));
    l.computeLineDistances();
    root.add(l);
    return l;
  };

  // Hull kit (unit hull: bow at +x, beam ±0.2, keel 0.04 under the water; `inner` scales it by len):
  // dinghy = solo dev (decked hull, one amber sail), sloop = startup team (cabin, main + jib),
  // freighter = enterprise buyer (forest hull, containers in channel colours, deckhouse + funnel aft).
  const shape = hullShape();
  const BT = 0.015; // bevel = the rounded gunwale
  const P = (o: THREE.MeshPhysicalMaterialParameters, key = "physical") => withMist(new THREE.MeshPhysicalMaterial(o), key);
  const LOOK = {
    dinghy: { depth: 0.11, sheer: 0.05, top: WORLD.porcelain, boot: WORLD.amber, stripe: WORLD.amber, rim: WORLD.forest, deck: "#dcc08a" },
    sloop: { depth: 0.16, sheer: 0.06, top: WORLD.porcelain, boot: WORLD.emerald, stripe: WORLD.forest, rim: WORLD.forest, deck: "#d9bf92" },
    freighter: { depth: 0.2, sheer: 0.035, top: WORLD.forest, boot: WORLD.coral, stripe: WORLD.porcelain, rim: WORLD.forest, deck: "#b9cbbd" },
  } as const;
  const sheerAt = (kind: HullKind, x: number) => LOOK[kind].sheer * (x > 0 ? (x / 0.62) ** 2 : 0.45 * (x / 0.55) ** 2);
  const deckY = (kind: HullKind, x: number) => LOOK[kind].depth + BT - 0.045 + sheerAt(kind, x);
  /** Extruded plan, bent into a boat: sheer rising to the bow, flared sides, raked stem and transom. */
  const hullGeo = (kind: HullKind) => {
    const depth = LOOK[kind].depth;
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: BT, bevelSize: BT, bevelSegments: 2, curveSegments: 12 });
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), k = Math.min(1, Math.max(0, (y + BT) / (depth + 2 * BT)));
      const rake = x > 0.3 ? (1 - k) * 0.14 * ((x - 0.3) / 0.32) : x < -0.45 ? -(1 - k) * 0.04 : 0;
      p.setXYZ(i, x - rake, y + sheerAt(kind, x) * k * k, p.getZ(i) * (0.62 + 0.38 * Math.sqrt(k)));
    }
    g.computeVertexNormals();
    return g;
  };
  /** Side-wall paint bands by height above the keel (extrude side UV v = 1 − height): antifouling, boot-top, topsides, sheer stripe, gunwale. */
  const topsides = (kind: HullKind) => {
    const L = LOOK[kind], S = L.depth + 2 * BT, row = (z: number) => ((z + BT) / S) * 128;
    const t = tex(4, 128, (x) => {
      const band = (c: string, z0: number, z1: number) => { x.fillStyle = c; x.fillRect(0, row(z0), 4, row(z1) - row(z0) + 1); };
      band("#b3463d", -BT, 0.034);
      band(L.boot, 0.034, 0.078);
      band(L.top, 0.078, L.depth + BT);
      band(L.stripe, L.depth - 0.03, L.depth - 0.018); // cove stripe, a gap of topsides above it
      band(L.rim, L.depth - 0.004, L.depth + BT); // gunwale
    });
    t.repeat.set(1, 1 / S);
    t.offset.set(0, (S - 1 - BT) / S);
    return P({ map: t, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.16, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  };
  const HULL = (["dinghy", "sloop", "freighter"] as const).reduce(
    (o, kd) => ({ ...o, [kd]: [P({ color: LOOK[kd].deck, roughness: 0.75 }), topsides(kd)] }),
    {} as Record<HullKind, THREE.Material[]>,
  ); // groups: 0 = deck caps, 1 = side walls
  const seams = tex(64, 64, (x) => { x.fillStyle = "#fffdf6"; x.fillRect(0, 0, 64, 64); x.fillStyle = "rgba(140,120,90,.3)"; for (let y = 0; y < 64; y += 8) x.fillRect(0, y, 64, 1); });
  seams.wrapS = seams.wrapT = THREE.RepeatWrapping; // sail UVs are shape units: a panel seam every 1/8
  const sail = (c: string) => withMist(new THREE.MeshStandardMaterial({ color: c, map: seams, side: THREE.DoubleSide, roughness: 0.85, emissive: c, emissiveIntensity: 0.4 }), "sail");
  const SAIL = { white: sail("#fbf7ee"), amber: sail("#ffd978") };
  const glass = P({ color: "#1d3a32", roughness: 0.12, clearcoat: 1 });
  const wood = P({ color: "#b8966a", roughness: 0.8 });
  const ribs = tex(32, 32, (x) => { x.fillStyle = "#fff"; x.fillRect(0, 0, 32, 32); x.fillStyle = "rgba(0,0,0,.16)"; for (let i = 2; i < 32; i += 4) x.fillRect(i, 0, 1.5, 32); x.strokeStyle = "rgba(0,0,0,.22)"; x.lineWidth = 2; x.strokeRect(1, 1, 30, 30); });
  const cargo = [WORLD.indigo, WORLD.azure, WORLD.emeraldCh, WORLD.sunCh].map((c) => P({ color: c, map: ribs, roughness: 0.5 }));
  const funnel = P({ color: WORLD.amber, roughness: 0.4, clearcoat: 0.5 });
  const roof = P({ color: WORLD.emerald, roughness: 0.35, clearcoat: 0.6 });
  const box = (sx: number, sy: number, sz: number) => new THREE.BoxGeometry(sx, sy, sz);
  /** Mainsail with a little roach (luff up the mast at x = 0, foot aft along the boom). */
  const mainsail = (foot: number, luff: number) => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-foot, 0); s.quadraticCurveTo(-foot * 0.6, luff * 0.58, 0, luff); s.closePath();
    return new THREE.ShapeGeometry(s, 8);
  };
  /** Mast + boom + mainsail at x on the deck; the boom swings out by `swing` rad. Returns the masthead height. */
  const rig = (inner: THREE.Group, D: number, x: number, h: number, foot: number, luff: number, m: THREE.Material, swing: number) => {
    add(cyl(0.011, 0.014, h, 6), M.lacquer, [x, D + h / 2, 0], null, inner);
    const b = new THREE.Group();
    b.position.set(x, D + 0.1, 0);
    b.rotation.y = swing;
    inner.add(b);
    add(cyl(0.008, 0.008, foot, 5), M.lacquer, [-foot / 2, 0, 0], [0, 0, Math.PI / 2], b);
    add(mainsail(foot, luff), m, [0, 0.01, 0], null, b);
    return D + h;
  };
  const hullKind = (kind: HullKind, len: number, pennant: string = WORLD.coral): Hull => {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    inner.scale.setScalar(len);
    g.add(inner);
    add(hullGeo(kind), HULL[kind], [0, -0.04, 0], null, inner, true);
    let top: number, penX: number;
    if (kind === "dinghy") {
      const D = deckY(kind, 0.14);
      add(box(0.26, 0.01, 0.13), wood, [-0.16, deckY(kind, -0.16), 0], null, inner); // cockpit well
      top = rig(inner, D, 0.14, 0.8, 0.5, 0.68, SAIL.amber, 0.3);
      penX = 0.14;
    } else if (kind === "sloop") {
      const D = deckY(kind, -0.1);
      add(box(0.3, 0.09, 0.2), M.porcelain, [-0.1, D + 0.045, 0], null, inner); // cabin
      add(box(0.22, 0.028, 0.206), glass, [-0.1, D + 0.052, 0], null, inner); // cabin windows
      add(box(0.32, 0.022, 0.22), roof, [-0.1, D + 0.1, 0], null, inner); // cabin roof
      add(box(0.14, 0.01, 0.15), wood, [-0.38, deckY(kind, -0.38), 0], null, inner); // cockpit
      const Dm = deckY(kind, 0.08);
      top = rig(inner, Dm, 0.08, 1.0, 0.44, 0.84, SAIL.white, 0.24);
      const j = new THREE.Shape(); j.moveTo(0, 0); j.lineTo(-0.45, 0.8); j.lineTo(-0.41, 0.05); j.closePath(); // jib: tack at the bow, head up the forestay
      const jg = new THREE.Group();
      jg.position.set(0.55, deckY(kind, 0.55), 0);
      jg.rotation.y = 0.12;
      inner.add(jg);
      add(new THREE.ShapeGeometry(j), SAIL.white, [0, 0.02, 0.004], null, jg);
      penX = 0.08;
    } else {
      const xh = -0.38, D = deckY(kind, xh);
      add(box(0.2, 0.2, 0.3), M.porcelain, [xh, D + 0.1, 0], null, inner, true); // deckhouse
      add(box(0.206, 0.035, 0.306), glass, [xh, D + 0.16, 0], null, inner); // bridge windows
      add(box(0.22, 0.02, 0.36), M.lacquer, [xh, D + 0.21, 0], null, inner); // bridge roof + wings
      add(cyl(0.04, 0.046, 0.13, 12), funnel, [-0.445, D + 0.26, 0], null, inner);
      add(cyl(0.042, 0.042, 0.03, 12), M.lacquer, [-0.445, D + 0.315, 0], null, inner); // funnel band
      add(cyl(0.006, 0.008, 0.2, 5), M.lacquer, [-0.33, D + 0.32, 0], null, inner); // signal mast
      [-0.18, -0.02, 0.14, -0.18].forEach((cx, i) => add(box(0.15, 0.1, 0.26), cargo[i], [cx, deckY(kind, cx) + 0.05 + (i === 3 ? 0.1 : 0), 0], null, inner, true)); // containers
      top = D + 0.42;
      penX = -0.33;
    }
    const pg = new THREE.Shape(); pg.moveTo(0, 0); pg.lineTo(-0.3, -0.06); pg.lineTo(0, -0.12);
    const pen = add(new THREE.ShapeGeometry(pg), flat(pennant), [penX, top, 0], null, inner);
    root.add(g);
    g.userData.pen = pen;
    return g as Hull;
  };

  return {
    root, M, HALO, RETICLE, GLYPH, add, sprite, billboard, faceGroup, dashedRing, hullKind, pxScale,
    /** Keeps every constant-pixel sprite at its size for a new viewport height. */
    resize(h: number) {
      if (h === H || h <= 0) return;
      H = h;
      for (const [s, px] of fixedPx) s.scale.setScalar(pxScale(px));
    },
  };
}
export type Kit = ReturnType<typeof createKit>;

/** Colour lerp between two hex colours. Returns a shared scratch: callers copy it into a material. */
const _ca = new THREE.Color(), _cb = new THREE.Color();
export const col = (a: THREE.ColorRepresentation, b: THREE.ColorRepresentation, k: number) => _ca.set(a).lerp(_cb.set(b), k);
