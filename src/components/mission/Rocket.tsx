import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  NormalBlending,
  Object3D,
  Quaternion,
  RepeatWrapping,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
  type MeshStandardMaterial,
  type PointLight,
  type ShaderMaterial,
  type Sprite,
  type SpriteMaterial,
} from "three";
import { drawMark } from "../growth-engine/EngineCore";
import { palette } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { frost, gridFin, igniterFlash, lerp, mvacHeat, mvacThrottle, plumeAlt, R, seg, smooth, throttle1 } from "./timeline";
import { boosterPose, C, fairingPose, mulberry32, ROCKET_BASE, ROCKET_K, stage2Pose } from "./world";

// DVB-01's launcher, a two-stage kerosene rocket in real proportions (L/D ≈ 14.5): nine sea-level
// engines under an octaweb skirt, a satin-white first stage with folded carbon legs, stowed titanium
// grid fins and a carbon interstage over the vacuum engine, the second stage, the hammerhead adapter
// and an ogive fairing in two halves. Built from lathe profiles, livery painted into per-section maps.
// Units: rocket units, y measured from the engine exit plane. Every group here is placed in the stack's
// craft-point frame and drawn at ROCKET_K, its engine exit ROCKET_BASE below the craft point.

const D2R = Math.PI / 180;
const BODY_R = 0.145;
const SEG = 48;
const INK = "#111111";

// ── Geometry ─────────────────────────────────────────────────────────────
/** A lathe whose v runs linearly with height (so painted maps read in body units) and whose u = 0.5 faces +Z. */
function lathe(profile: readonly (readonly [number, number])[], segs = SEG, phiStart = -Math.PI, phiLength = Math.PI * 2) {
  const g = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    segs,
    phiStart,
    phiLength,
  );
  const [pos, uv] = [g.attributes.position, g.attributes.uv];
  const [y0, y1] = [profile[0][1], profile[profile.length - 1][1]];
  for (let i = 0; i < pos.count; i++) uv.setY(i, (pos.getY(i) - y0) / (y1 - y0));
  uv.needsUpdate = true;
  return g;
}
/** A bell from its exit (radius re at y0) up to its throat (rt at y1): flat near the lip, steep near the throat. */
const bellProfile = (re: number, rt: number, y0: number, y1: number, n = 14) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [rt + (re - rt) * (1 - t ** 1.8), y0 + (y1 - y0) * t] as const;
  });
/** Fairing: a 0.20 cylinder over 3.46–3.72, then a tangent ogive to the tip at 4.20. */
const FAIRING: readonly (readonly [number, number])[] = (() => {
  const [R, L, y0] = [0.2, 0.48, 3.72];
  const rho = (R * R + L * L) / (2 * R);
  const pts: [number, number][] = [
    [R, 3.46],
    [R, y0],
  ];
  for (let i = 1; i <= 16; i++) {
    const h = (L * i) / 16;
    pts.push([Math.max(0, Math.sqrt(rho * rho - h * h) + R - rho), y0 + h]);
  }
  return pts;
})();
const inset = (profile: readonly (readonly [number, number])[], d: number) => profile.map(([r, y]) => [Math.max(0, r - d), y] as const);

// ── Shared tiling value noise ────────────────────────────────────────────
let noiseTex: CanvasTexture | null = null;
/** A 128 px tiling value-noise texture (three octaves, linear), shared by the plume layers. */
function noiseTexture() {
  if (noiseTex) return noiseTex;
  const N = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rand = mulberry32(11);
    const img = ctx.createImageData(N, N);
    const octaves = [
      { cells: 8, w: 0.55 },
      { cells: 16, w: 0.3 },
      { cells: 32, w: 0.15 },
    ].map((o) => ({ ...o, grid: Array.from({ length: o.cells * o.cells }, () => rand()) }));
    const fade = (t: number) => t * t * (3 - 2 * t);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let v = 0;
        for (const { cells, w, grid } of octaves) {
          const [fx, fy] = [(x / N) * cells, (y / N) * cells];
          const [x0, y0] = [Math.floor(fx), Math.floor(fy)];
          const [tx, ty] = [fade(fx - x0), fade(fy - y0)];
          const at = (i: number, j: number) => grid[(j % cells) * cells + (i % cells)];
          const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
          const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
          v += w * (a + (b - a) * ty);
        }
        const k = (y * N + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(255 * v);
        img.data[k + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }
  noiseTex = new CanvasTexture(canvas);
  noiseTex.wrapS = noiseTex.wrapT = RepeatWrapping;
  return noiseTex;
}

// ── Livery (canvas maps; flipY, so canvas y 0 is the section's top) ───────
const S1 = { y0: 0.1, y1: 2.5, w: 1024, h: 2048 };
const S2 = { y0: 2.86, y1: 3.4, w: 1024, h: 256 };
const FAIR = { y0: 3.46, y1: 4.2, w: 512, h: 512 };
/** Livery column: the wordmark and the mark face 10° to the lit side of the camera. */
const FRONT_PHI = -10;

function stage1Livery(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pu = w / (2 * Math.PI * BODY_R); // px per unit around
  const pv = h / (S1.y1 - S1.y0); // px per unit along
  const X = (phi: number) => ((phi + 180) / 360) * w;
  const Y = (y: number) => (1 - (y - S1.y0) / (S1.y1 - S1.y0)) * h;
  const font = palette().bodyFont;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  // Panel seams every 0.4 (tank weld lines), with a faint shadow side.
  for (let y = 0.5; y < S1.y1; y += 0.4) {
    ctx.fillStyle = "#d6d8d6";
    ctx.fillRect(0, Y(y) - 1.5, w, 3);
    ctx.fillStyle = "rgba(0,0,0,0.035)";
    ctx.fillRect(0, Y(y) + 1.5, w, 6);
  }
  // Wordmark: vertical, reading bottom to top, cap height 0.16, from 0.9 above the base.
  ctx.save();
  ctx.translate(X(FRONT_PHI), Y(0.9));
  ctx.rotate(-Math.PI / 2);
  ctx.scale(pv / pu, 1); // text x runs along the body (pv), text y around it (pu)
  const cap = 0.16 * pu;
  ctx.font = `600 ${cap / 0.7}px ${font}`;
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("DEVABLE", 0, 0);
  const len = (ctx.measureText("DEVABLE").width * (pv / pu)) / pv; // wordmark length in units
  ctx.restore();
  // The Devable mark 0.2 above the wordmark: a black rounded square with the white striped D.
  const size = 0.2;
  const my = 0.9 + len + 0.2;
  ctx.save();
  ctx.translate(X(FRONT_PHI) - (size * pu) / 2, Y(my + size));
  ctx.scale(pu / 512, pv / 512);
  const s = size * 512; // the mark painter's 512 space, scaled to 'size' units
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * 0.18);
  ctx.fill();
  ctx.scale(s / 512, s / 512);
  drawMark(ctx, 512);
  ctx.restore();
  // Stencil near the base and two small hazard chevrons at the umbilical ports.
  ctx.save();
  ctx.translate(X(FRONT_PHI), Y(0.3));
  ctx.scale(pu / pv, 1);
  ctx.font = `600 ${(0.045 * pv) / 0.7}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DVB‑01", 0, 0);
  ctx.restore();
  for (const [phi, y] of [
    [-62, 0.42],
    [-62, 2.36],
  ]) {
    ctx.save();
    const [cw, ch] = [0.03 * pu, 0.03 * pv];
    ctx.translate(X(phi) - cw / 2, Y(y) - ch / 2);
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.clip();
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#e0a712";
    for (let k = -2; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(k * cw * 0.4, ch);
      ctx.lineTo(k * cw * 0.4 + cw * 0.2, ch);
      ctx.lineTo(k * cw * 0.4 + cw * 0.2 + ch, 0);
      ctx.lineTo(k * cw * 0.4 + ch, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function stage2Livery(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const Y = (y: number) => (1 - (y - S2.y0) / (S2.y1 - S2.y0)) * h;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = INK; // the black ring at the top
  ctx.fillRect(0, 0, w, Y(3.37));
  ctx.fillStyle = "#d6d8d6";
  ctx.fillRect(0, Y(3.1) - 1, w, 2);
  ctx.restore();
}

/** One fairing half's map: the seam edges, the ogive joint and (right half) the mission roundel. */
function fairingLivery(roundel: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const pu = w / (Math.PI * 0.2);
    const pv = h / (FAIR.y1 - FAIR.y0);
    const Y = (y: number) => (1 - (y - FAIR.y0) / (FAIR.y1 - FAIR.y0)) * h;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#9da1a5";
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(w - 2, 0, 2, h);
    ctx.fillStyle = "#dadcda";
    ctx.fillRect(0, Y(3.72) - 1, w, 2);
    ctx.fillRect(0, Y(3.475) - 1, w, 2);
    if (roundel) {
      // Right half: phi 0..180 maps to u 0..1; the roundel sits 24° round from the seam, toward the camera.
      ctx.save();
      ctx.translate((24 / 180) * w, Y(3.6));
      ctx.scale(1, pv / pu);
      const r = 0.06 * pu;
      ctx.strokeStyle = INK;
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.lineWidth = r * 0.025;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${r * 0.36}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText("DVB‑01", 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };
}
const FAIRING_R = fairingLivery(true);
const FAIRING_L = fairingLivery(false);

/** Frost: streaky, patchy, with a torn noisy top and bottom edge (white = frost). */
function drawFrost(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  let seed = 5;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  // Patches, then vertical run-off streaks; thinner toward the torn edges.
  for (let i = 0; i < 160; i++) {
    const [x, y, r] = [rand() * w, rand() * h, 8 + rand() * 30];
    const edge = Math.min(1, (Math.min(y, h - y) / h) * 5);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.5 * edge})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  for (let i = 0; i < 1400; i++) {
    const [x, y] = [rand() * w, rand() * h];
    const edge = Math.min(1, (Math.min(y, h - y) / h) * 6);
    ctx.fillStyle = `rgba(255,255,255,${(0.15 + 0.35 * rand()) * edge})`;
    ctx.fillRect(x, y, 1 + rand() * 3, 12 + rand() * 70);
  }
  ctx.restore();
}

/** Grid-fin lattice: a solid frame and an 8 × 8 lattice of thin blades (white = metal). */
function drawLattice(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = w * 0.06;
  ctx.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94);
  ctx.lineWidth = w * 0.045;
  ctx.beginPath();
  for (let i = 1; i < 16; i++) {
    const k = (i / 16) * 2 * w;
    ctx.moveTo(k - w, 0);
    ctx.lineTo(k, h);
    ctx.moveTo(k, 0);
    ctx.lineTo(k - w, h);
  }
  ctx.stroke();
  ctx.restore();
}

/** MVac emissive: black at the throat (top of the map), bright at the lip. */
function drawBellHeat(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#000");
  g.addColorStop(0.45, "#2a2a2a");
  g.addColorStop(1, "#fff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** The nozzle glow: a soft radial falloff. */
function drawGlow(ctx: CanvasRenderingContext2D, w: number) {
  ctx.save();
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.12, "rgba(255,236,200,0.75)");
  g.addColorStop(0.4, "rgba(255,190,120,0.22)");
  g.addColorStop(1, "rgba(255,160,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  ctx.restore();
}

// ── Plume shader ─────────────────────────────────────────────────────────
// Open cones hanging from the engine plane. Premultiplied "over" (NormalBlending, premultipliedAlpha):
// rgb = colour × I, alpha = I × k, so the plume tints a pale day sky instead of washing it white,
// and still brightens black space. The core may add.
const PLUME_VERT = /* glsl */ `
  uniform float uL0, uLen, uWiden, uTime, uWobble;
  uniform sampler2D uNoise;
  varying float vS, vAng, vBelow;
  varying vec3 vN, vV;
  void main() {
    float s = clamp(-position.y / uL0, 0., 1.);
    vec3 p = position;
    // Turbulent boundary: the radius breathes with flowing noise, more toward the tail.
    float ang = atan(position.z, position.x);
    float w = texture2D(uNoise, vec2(ang * .159 + s * .2, s * 1.3 - uTime * 1.7)).r - .5;
    p.xz *= mix(1., uWiden, s) * (1. + uWobble * w * (.25 + s));
    p.y *= uLen;
    vBelow = -p.y;
    vS = s;
    vAng = atan(position.z, position.x);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vV = -mv.xyz;
    vN = normalize(normalMatrix * vec3(normal.x, 0., normal.z));
    gl_Position = projectionMatrix * mv;
  }
`;
const PLUME_FRAG = /* glsl */ `
  uniform vec3 uC0, uC1, uC2, uC3, uFlashCol;
  uniform float uI, uAlphaK, uPow, uDiamonds, uDia, uSoot, uFlash, uTime, uTail, uHead, uGround;
  uniform sampler2D uNoise;
  varying float vS, vAng, vBelow;
  varying vec3 vN, vV;
  void main() {
    float s = vS;
    float facing = abs(dot(normalize(vN), normalize(vV)));
    vec3 col = s < .12 ? mix(uC0, uC1, s / .12) : s < .4 ? mix(uC1, uC2, (s - .12) / .28) : mix(uC2, uC3, clamp((s - .4) / .45, 0., 1.));
    vec2 nuv = vec2(vAng * .318 + s * .35, s * 1.6 - uTime * 2.2);
    float turb = texture2D(uNoise, nuv).r * .65 + texture2D(uNoise, nuv * 2.7 + .31).r * .35;
    float I = uI * pow(facing, uPow) * (1. - smoothstep(uTail, 1., s)) * smoothstep(0., uHead, s + .002) * (.55 + .9 * turb);
    // Shock diamonds: bright lenses along the axis while the air is thick.
    float dia = uDia * pow(.5 + .5 * cos(6.2832 * uDiamonds * s), 12.) * (1. - smoothstep(.15, .85, s)) * smoothstep(.05, .12, s) * pow(facing, 6.);
    I *= 1. + 2.2 * dia;
    // Dissipates before it reaches the ground it would otherwise cut into (the planet, once the vehicle is off the pad).
    I *= 1. - smoothstep(uGround - .8, uGround, vBelow);
    col = mix(col, vec3(1., .97, .9), clamp(dia, 0., 1.) * .8);
    col *= 1. - uSoot * .35 * smoothstep(.55, .95, s);
    col = mix(col, uFlashCol, uFlash);
    gl_FragColor = vec4(col * I, clamp(I * uAlphaK, 0., 1.));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type LayerSpec = {
  rTop: number;
  rBot: number;
  len: number;
  ramp: [string, string, string, string];
  I: number;
  alphaK: number;
  pow: number;
  tail: number;
  head?: number;
  diamonds?: number;
  soot?: number;
  additive?: boolean;
  wobble?: number;
};
const RP1: LayerSpec[] = [
  { rTop: 0.16, rBot: 0.42, len: 2.6, ramp: ["#ffc880", "#ff9448", "#cc5c2a", "#6e5242"], I: 0.9, alphaK: 0.85, pow: 1.8, tail: 0.25, head: 0.04, soot: 1, wobble: 0.35 },
  { rTop: 0.14, rBot: 0.22, len: 1.4, ramp: ["#fff8ec", "#ffe2a8", "#ffb060", "#d05a24"], I: 1.7, alphaK: 0.8, pow: 1.1, tail: 0.35, head: 0.02, diamonds: 5, wobble: 0.2 },
  { rTop: 0.1, rBot: 0.11, len: 0.35, ramp: ["#ffffff", "#fffaf0", "#ffe6b8", "#ffc680"], I: 1.8, alphaK: 0.6, pow: 0.5, tail: 0.45, diamonds: 1.5, additive: true, wobble: 0.06 },
];
// The vacuum plume: a very wide, faint "jellyfish" veil and a short hot core.
const MVAC: LayerSpec[] = [
  { rTop: 0.12, rBot: 1.2, len: 2.4, ramp: ["#fff1dc", "#ffe4c4", "#ffd0a0", "#ffb070"], I: 0.35, alphaK: 0.5, pow: 2.2, tail: 0.05, head: 0.06, wobble: 0.12 },
  { rTop: 0.1, rBot: 0.07, len: 0.3, ramp: ["#ffffff", "#fff4e4", "#ffd9a8", "#ffb070"], I: 1.4, alphaK: 0.5, pow: 0.6, tail: 0.3, additive: true, wobble: 0.04 },
];
/** The veil's share of its nominal intensity: both faces of a cone this wide add up. */
const VEIL = 0.16;

function plumeUniforms(l: LayerSpec) {
  const c = l.ramp.map((h) => new Color(h));
  return {
    uL0: { value: l.len },
    uWobble: { value: l.wobble ?? 0.3 },
    uLen: { value: 1 },
    uWiden: { value: 1 },
    uC0: { value: c[0] },
    uC1: { value: c[1] },
    uC2: { value: c[2] },
    uC3: { value: c[3] },
    uFlashCol: { value: new Color("#48ff9a") },
    uI: { value: 0 },
    uAlphaK: { value: l.alphaK },
    uPow: { value: l.pow },
    uDiamonds: { value: l.diamonds ?? 0 },
    uDia: { value: 0 },
    uSoot: { value: l.soot ?? 0 },
    uFlash: { value: 0 },
    uTime: { value: 0 },
    uTail: { value: l.tail },
    uHead: { value: l.head ?? 0.001 },
    uGround: { value: 99 },
    uNoise: { value: noiseTexture() },
  };
}

function PlumeLayer({ spec, order, matRef }: { spec: LayerSpec; order: number; matRef: (m: ShaderMaterial | null) => void }) {
  const geometry = useMemo(() => new CylinderGeometry(spec.rTop, spec.rBot, spec.len, 32, 24, true).translate(0, -spec.len / 2, 0), [spec]);
  const uniforms = useMemo(() => plumeUniforms(spec), [spec]);
  return (
    <mesh geometry={geometry} renderOrder={order} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={PLUME_VERT}
        fragmentShader={PLUME_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
        side={DoubleSide}
        blending={spec.additive ? AdditiveBlending : NormalBlending}
        premultipliedAlpha={!spec.additive}
      />
    </mesh>
  );
}

// ── Parts ────────────────────────────────────────────────────────────────
const BELL_RING = [
  [0, 0],
  ...Array.from({ length: 8 }, (_, i) => [Math.sin((i / 8) * 2 * Math.PI) * 0.1, Math.cos((i / 8) * 2 * Math.PI) * 0.1]),
];
const LEGS = [45, 135, 225, 315];
const FINS = [0, 90, 180, 270];
/** Grid-fin hinge height: stowed flush on the interstage, as on a real booster. */
const FIN_Y = 2.56;

const scratch = { v: new Vector3(), q: new Quaternion(), o: new Object3D(), e: new Vector3(), d: new Vector3() };

/**
 * How far below the engine exit, along the plume axis, the planet (plus a little air) lies, in rocket units.
 * The planet is not to scale next to the vehicle, so the plume must fade before this.
 */
function groundBelow(craft: Vector3, quat: Quaternion, scale: number, e: Vector3, d: Vector3) {
  e.set(0, ROCKET_BASE, 0).multiplyScalar(scale).applyQuaternion(quat).add(craft).sub(C);
  d.set(0, -1, 0).applyQuaternion(quat);
  const b = e.dot(d);
  const c = e.lengthSq() - (R + 0.02) ** 2;
  const disc = b * b - c;
  return disc <= 0 ? 99 : Math.max(0, -b - Math.sqrt(disc)) / (scale * ROCKET_K);
}
const GLOW = new Color("#ffd2a0");
const FIRE = new Color("#ffb46b");
const GREEN = new Color("#48ff9a");

export default function Rocket() {
  const frame = useMission();
  const booster = useRef<Group>(null);
  const stage2 = useRef<Group>(null);
  const halves = useRef<(Group | null)[]>([]);
  const fins = useRef<(Group | null)[]>([]);
  const frostMat = useRef<MeshStandardMaterial>(null);
  const bellMat = useRef<MeshStandardMaterial>(null);
  const plume1 = useRef<Group>(null);
  const plume2 = useRef<Group>(null);
  const layers1 = useRef<(ShaderMaterial | null)[]>([]);
  const layers2 = useRef<(ShaderMaterial | null)[]>([]);
  const glow = useRef<Sprite>(null);
  const glowMat = useRef<SpriteMaterial>(null);
  const light1 = useRef<PointLight>(null);
  const light2 = useRef<PointLight>(null);
  const bellsOut = useRef<InstancedMesh>(null);
  const bellsIn = useRef<InstancedMesh>(null);

  const geo = useMemo(
    () => ({
      skirt: lathe([
        [0.132, 0.045],
        [0.14, 0.075],
        [BODY_R, 0.1],
      ]),
      stage1: lathe([
        [BODY_R, S1.y0],
        [BODY_R, S1.y1],
      ]),
      frost: lathe([
        [BODY_R + 0.001, 1.55],
        [BODY_R + 0.001, 2.35],
      ]),
      interstage: lathe([
        [BODY_R + 0.0005, 2.5],
        [BODY_R + 0.0005, 2.86],
      ]),
      stage2: lathe([
        [BODY_R, S2.y0],
        [BODY_R, S2.y1],
      ]),
      adapter: lathe([
        [BODY_R, 3.4],
        [0.2, 3.46],
      ]),
      bell: lathe(bellProfile(0.034, 0.014, 0, 0.07), 24),
      mvac: lathe(bellProfile(0.12, 0.03, 2.56, 2.84, 20), SEG),
      fairingR: lathe(FAIRING, 32, 0, Math.PI),
      fairingL: lathe(FAIRING, 32, Math.PI, Math.PI),
      fairingInR: lathe(inset(FAIRING, 0.006), 32, 0, Math.PI),
      fairingInL: lathe(inset(FAIRING, 0.006), 32, Math.PI, Math.PI),
    }),
    [],
  );

  const liv1 = useCanvasTexture(S1.w, S1.h, stage1Livery);
  const liv2 = useCanvasTexture(S2.w, S2.h, stage2Livery);
  const livR = useCanvasTexture(FAIR.w, FAIR.h, FAIRING_R);
  const livL = useCanvasTexture(FAIR.w, FAIR.h, FAIRING_L);
  const frostTex = useCanvasTexture(256, 512, drawFrost);
  const lattice = useCanvasTexture(128, 128, drawLattice);
  const heat = useCanvasTexture(4, 128, drawBellHeat);
  const glowTex = useCanvasTexture(256, 256, drawGlow);

  useLayoutEffect(() => {
    const { o } = scratch;
    BELL_RING.forEach(([x, z], i) => {
      o.position.set(x, 0, z);
      o.updateMatrix();
      bellsOut.current?.setMatrixAt(i, o.matrix);
      bellsIn.current?.setMatrixAt(i, o.matrix);
    });
    if (bellsOut.current) bellsOut.current.instanceMatrix.needsUpdate = true;
    if (bellsIn.current) bellsIn.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    const { p, t, scale } = frame;
    const { v, q } = scratch;
    const b = booster.current;
    if (b) {
      b.visible = boosterPose(p, v, q);
      b.position.copy(v);
      b.quaternion.copy(q);
      b.scale.setScalar(scale);
    }
    const s2 = stage2.current;
    if (s2) {
      s2.visible = stage2Pose(p, v, q);
      s2.position.copy(v);
      s2.quaternion.copy(q);
      s2.scale.setScalar(scale);
    }
    // Fairing halves about their hinges on the base ring.
    const f = fairingPose(p);
    halves.current.forEach((h, i) => {
      if (!h) return;
      const side = i === 0 ? 1 : -1;
      h.visible = f.visible;
      h.rotation.z = -side * f.open * D2R;
      h.position.set(side * (0.202 + f.out), 3.46 - f.back, 0);
    });
    const fin = gridFin(p);
    fins.current.forEach((g) => {
      if (g) g.rotation.x = fin;
    });
    if (frostMat.current) frostMat.current.opacity = frost(p);

    // Stage 1 plume, nozzle glow and the light it throws on the deck and the smoke.
    const th = throttle1(p);
    const alt = plumeAlt(p);
    const green = igniterFlash(p);
    // On the pad the deck hides the plume's lower part; off the pad it eases to fading before the planet.
    const off = smooth(seg(p, 0.2, 0.3));
    const ground = off > 0 ? Math.exp(lerp(Math.log(8), Math.log(Math.max(0.05, groundBelow(frame.craft, frame.quat, scale, scratch.e, scratch.d))), off)) : 8;
    const flicker = 1 + 0.06 * Math.sin(31 * t) + 0.04 * Math.sin(17.3 * t + 1.3);
    if (plume1.current) plume1.current.visible = p >= 0.1175 && p < 0.359;
    layers1.current.forEach((m, i) => {
      if (!m) return;
      const u = m.uniforms;
      const spec = RP1[i];
      u.uI.value = spec.I * th * flicker * (i === 0 ? lerp(1, 0.45, alt) : 1);
      u.uLen.value = lerp(1, 1.6, alt) * (0.55 + 0.45 * th);
      u.uWiden.value = lerp(1, 4, alt * alt);
      u.uDia.value = 1 - Math.min(1, alt / 0.3);
      u.uFlash.value = i === 2 ? green : i === 1 ? 0.5 * green : 0;
      u.uTime.value = t;
      u.uGround.value = ground;
    });
    if (glow.current && glowMat.current) {
      glow.current.visible = th > 0.001;
      glowMat.current.opacity = Math.min(1, th * flicker * lerp(1, 0.6, alt));
      glowMat.current.color.lerpColors(GLOW, GREEN, green * 1.6);
    }
    // Intensity scales with the vehicle's drawn size so the illumination is the same at every scale.
    const lit = (scale * ROCKET_K) ** 2;
    if (light1.current) {
      light1.current.intensity = 10 * th * flicker * lit;
      light1.current.color.lerpColors(FIRE, GREEN, green * 1.4);
    }

    // MVac: the bell heats through the burn and cools through orange and cherry; the vacuum veil.
    const heatNow = mvacHeat(p);
    const bm = bellMat.current;
    if (bm) {
      bm.emissiveIntensity = heatNow.i;
      bm.emissive.setRGB(lerp(0.26, 1, heatNow.hot), lerp(0.012, 0.19, heatNow.hot), lerp(0.003, 0.023, heatNow.hot));
    }
    const mt = mvacThrottle(p);
    if (plume2.current) plume2.current.visible = mt > 0.001;
    layers2.current.forEach((m, i) => {
      if (!m) return;
      m.uniforms.uI.value = MVAC[i].I * mt * flicker * (i === 0 ? VEIL : 1);
      m.uniforms.uTime.value = t;
    });
    if (light2.current) light2.current.intensity = 6 * mt * lit;
  }, -2);

  // A lower environment share than the scene default, so the shaded side reads as a hard sun terminator.
  const white = { color: "#f3f4f2", roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.35, envMapIntensity: 0.45 } as const;
  const carbon = { color: "#16181b", roughness: 0.55 } as const;

  return (
    <group>
      {/* ── First stage: engines, tank, legs, grid fins and the interstage. ── */}
      <group ref={booster}>
        <group position-y={ROCKET_BASE} scale={ROCKET_K}>
          <instancedMesh ref={bellsOut} args={[geo.bell, undefined, 9]} castShadow>
            <meshStandardMaterial color="#3b3d40" metalness={0.9} roughness={0.35} />
          </instancedMesh>
          <instancedMesh ref={bellsIn} args={[geo.bell, undefined, 9]}>
            <meshStandardMaterial color="#1a1b1d" roughness={0.7} side={BackSide} />
          </instancedMesh>
          <mesh position-y={0.07} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.134, SEG]} />
            <meshStandardMaterial color="#2c2a27" roughness={0.95} />
          </mesh>
          <mesh geometry={geo.skirt} castShadow receiveShadow>
            <meshStandardMaterial color="#303234" roughness={0.7} metalness={0.2} side={DoubleSide} />
          </mesh>
          <mesh geometry={geo.stage1} castShadow receiveShadow>
            <meshPhysicalMaterial {...white} map={liv1.texture} />
          </mesh>
          <mesh geometry={geo.frost} renderOrder={1}>
            <meshStandardMaterial
              ref={frostMat}
              color="#c8d4df"
              roughness={0.9}
              alphaMap={frostTex.texture}
              transparent
              opacity={0.85}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
          {/* Folded landing legs, foot pads up. */}
          {LEGS.map((az) => (
            <group key={az} rotation-y={az * D2R}>
              <mesh position={[0, 0.525, BODY_R + 0.006]} castShadow receiveShadow>
                <boxGeometry args={[0.06, 0.85, 0.012]} />
                <meshStandardMaterial {...carbon} />
              </mesh>
              <mesh position={[0, 0.74, BODY_R + 0.017]} castShadow>
                <cylinderGeometry args={[0.006, 0.006, 0.38, 8]} />
                <meshStandardMaterial color="#8d9196" metalness={0.8} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.94, BODY_R + 0.012]} castShadow>
                <boxGeometry args={[0.075, 0.018, 0.024]} />
                <meshStandardMaterial {...carbon} />
              </mesh>
            </group>
          ))}
          {/* Grid fins, stowed flush; they swing out 90° about their lower hinge. */}
          {FINS.map((az, i) => (
            <group key={az} rotation-y={az * D2R}>
              <group
                ref={(g) => {
                  fins.current[i] = g;
                }}
                position={[0, FIN_Y, BODY_R + 0.008]}
              >
                <mesh position-y={0.05} castShadow>
                  <planeGeometry args={[0.12, 0.1]} />
                  <meshStandardMaterial color="#5a5e63" metalness={1} roughness={0.45} alphaMap={lattice.texture} alphaTest={0.5} side={DoubleSide} />
                </mesh>
              </group>
              <mesh position={[0, FIN_Y - 0.005, BODY_R + 0.004]}>
                <boxGeometry args={[0.03, 0.012, 0.008]} />
                <meshStandardMaterial color="#5a5e63" metalness={1} roughness={0.45} />
              </mesh>
            </group>
          ))}
          {/* Cable raceway, +40° round from the livery column. */}
          <group rotation-y={40 * D2R}>
            <mesh position={[0, 1.3, BODY_R + 0.007]} castShadow>
              <boxGeometry args={[0.018, 2.4, 0.012]} />
              <meshPhysicalMaterial {...white} />
            </mesh>
          </group>
          <mesh position-y={2.5} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[BODY_R, SEG]} />
            <meshStandardMaterial color="#3a3d40" roughness={0.6} />
          </mesh>
          <mesh geometry={geo.interstage} castShadow receiveShadow>
            <meshStandardMaterial {...carbon} roughness={0.6} side={DoubleSide} />
          </mesh>
          <pointLight ref={light1} position-y={-0.08} color="#ffb46b" distance={12 * ROCKET_K} decay={2} intensity={0} />
          <group ref={plume1} visible={false}>
            {RP1.map((spec, i) => (
              <PlumeLayer
                key={i}
                spec={spec}
                order={4 + i}
                matRef={(m) => {
                  layers1.current[i] = m;
                }}
              />
            ))}
          </group>
          <sprite ref={glow} position-y={-0.04} scale={1.2} visible={false} renderOrder={7}>
            <spriteMaterial ref={glowMat} map={glowTex.texture} color="#ffd2a0" blending={AdditiveBlending} transparent depthWrite={false} toneMapped={false} opacity={0} />
          </sprite>
        </group>
      </group>

      {/* ── Second stage, vacuum engine, adapter and the fairing. ── */}
      <group ref={stage2}>
        <group position-y={ROCKET_BASE} scale={ROCKET_K}>
          <mesh geometry={geo.mvac} castShadow>
            <meshStandardMaterial ref={bellMat} color="#34302d" metalness={0.75} roughness={0.4} emissiveMap={heat.texture} emissive="#000000" side={DoubleSide} />
          </mesh>
          <mesh position-y={2.87}>
            <cylinderGeometry args={[0.035, 0.03, 0.06, 20]} />
            <meshStandardMaterial color="#3b3d40" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position-y={2.86} rotation-x={Math.PI / 2}>
            <circleGeometry args={[BODY_R, SEG]} />
            <meshStandardMaterial color="#4a4d50" roughness={0.6} />
          </mesh>
          <mesh geometry={geo.stage2} castShadow receiveShadow>
            <meshPhysicalMaterial {...white} map={liv2.texture} />
          </mesh>
          <group rotation-y={40 * D2R}>
            <mesh position={[0, 3.13, BODY_R + 0.007]}>
              <boxGeometry args={[0.018, 0.54, 0.012]} />
              <meshPhysicalMaterial {...white} />
            </mesh>
          </group>
          <mesh geometry={geo.adapter} castShadow receiveShadow>
            <meshPhysicalMaterial {...white} />
          </mesh>
          <mesh position-y={3.461} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.2, SEG]} />
            <meshStandardMaterial color="#b9bdc4" metalness={0.6} roughness={0.4} />
          </mesh>
          <pointLight ref={light2} position-y={2.3} color="#ffc890" distance={6 * ROCKET_K} decay={2} intensity={0} />
          <group ref={plume2} position-y={2.56} visible={false}>
            {MVAC.map((spec, i) => (
              <PlumeLayer
                key={i}
                spec={spec}
                order={4 + i}
                matRef={(m) => {
                  layers2.current[i] = m;
                }}
              />
            ))}
          </group>
          {/* Fairing halves: each hinges on the base ring on its own side (right +X, left −X). */}
          {[0, 1].map((i) => {
            const side = i === 0 ? 1 : -1;
            return (
              <group
                key={i}
                ref={(g) => {
                  halves.current[i] = g;
                }}
                position={[side * 0.202, 3.46, 0]}
              >
                <group position={[-side * 0.2, -3.46, 0]}>
                  <mesh geometry={i === 0 ? geo.fairingR : geo.fairingL} castShadow receiveShadow>
                    <meshPhysicalMaterial {...white} map={(i === 0 ? livR : livL).texture} />
                  </mesh>
                  <mesh geometry={i === 0 ? geo.fairingInR : geo.fairingInL}>
                    <meshStandardMaterial color="#c9ccd0" roughness={0.9} side={BackSide} />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}
