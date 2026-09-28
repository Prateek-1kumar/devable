import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  InstancedBufferAttribute,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  Vector3,
  type InstancedMesh,
  type ShaderMaterial,
} from "three";
import { useMission } from "./frame";
import { CUT_P, MODULE_Y0, seg, skyHorizonLinear, throttle1, VEHICLE_BASE } from "./timeline";
import { boosterPose, mulberry32, sunDir } from "./world";

// One billboard smoke system for every puff in the mission: the ground cloud out of the flame
// trench, the vent wisps through the count, the booster's cold-gas puffs at separation and the RCS
// puffs of the correction burn. Every particle is a pure function of p (the vents of clock time),
// so scrubbing backwards is exact. Lit impostors: a sphere normal per quad, half-Lambert from the
// sun, warm underlight from the engines near the ground.

// ── Shared tiling value noise ────────────────────────────────────────────
let noiseTex: CanvasTexture | null = null;
/** A 128 px tiling value-noise texture (three octaves, linear), shared by the smoke, the plumes, the trail and the ground. */
export function noiseTexture() {
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

// ── Emitters ─────────────────────────────────────────────────────────────
const MAX = 96;
const WAVES = 8;
const PER_WAVE = 4; // per trench exit
const TRENCH_X = 1.7;
const VENT_PUFFS = 6;
const D2R = Math.PI / 180;

type Seeds = { a: number; v: number; z: number; g: number; f: number; s: number }[];
const cloudSeeds = (): Seeds => {
  const rand = mulberry32(7);
  return Array.from({ length: WAVES * 2 * PER_WAVE }, () => ({
    a: (rand() * 2 - 1) * 25 * D2R, // spread about ±X
    v: 5 + 6 * rand(), // outward speed, u/s
    z: (rand() * 2 - 1) * 0.35,
    g: 0.7 + 0.6 * rand(), // growth
    f: 4 + 2 * rand(), // fade-out age, s
    s: rand(),
  }));
};

type Particle = { x: number; y: number; z: number; size: number; alpha: number; seed: number; under: number; d: number };

const stackLocal = new Vector3();
const bPos = new Vector3();
const bQuat = new Quaternion();

/** Fills `out` with the live particles at p (t is clock time, only for the vents) and returns how many. */
function emit(p: number, t: number, craft: Vector3, quat: Quaternion, seeds: Seeds, out: Particle[]) {
  let n = 0;
  const put = (x: number, y: number, z: number, size: number, alpha: number, seed: number, under: number) => {
    if (n >= MAX || alpha < 0.004 || size < 1e-4) return;
    const q = out[n++];
    q.x = x;
    q.y = y;
    q.z = z;
    q.size = size;
    q.alpha = alpha;
    q.seed = seed;
    q.under = under;
  };

  if (p < CUT_P) {
    // Ground cloud: story seconds from just before ignition; eight waves out of both trench exits.
    const ts = ((p - 0.117) / (0.26 - 0.117)) * 10;
    if (ts > 0)
      for (let w = 0; w < WAVES; w++)
        for (let side = 0; side < 2; side++)
          for (let k = 0; k < PER_WAVE; k++) {
            const i = (w * 2 + side) * PER_WAVE + k;
            const sd = seeds[i];
            const age = ts - w * 0.42 - 0.08 * k;
            if (age <= 0) continue;
            const dist = (sd.v * (1 - Math.exp(-2 * age))) / 2;
            const sx = side === 0 ? 1 : -1;
            const size = (0.4 + 2.8 * (1 - Math.exp(-0.55 * age))) * sd.g;
            const x = sx * (TRENCH_X + dist * Math.cos(sd.a));
            const z = dist * Math.sin(sd.a) + sd.z;
            const y = 0.1 + 0.15 * age + 0.42 * size;
            const alpha = 0.75 * seg(age, 0, 0.3) * (1 - seg(age, sd.f - 1.5, sd.f));
            put(x, y, z, size, alpha, sd.s, Math.exp(-Math.hypot(x, z) / 2.2)); // underlight only near the flame
          }
    // Vent wisps through the count: LOX boil-off off both stages, drifting downwind (+X, down).
    const vent = 1 - seg(p, 0.118, 0.125);
    if (vent > 0)
      for (let v = 0; v < 3; v++) {
        const vy = VEHICLE_BASE + (v === 2 ? 3.3 : 2.3);
        const vz = v === 1 ? -0.06 : 0.04;
        // A stream of small puffs: dense at the vent, spreading, sinking and thinning downwind.
        for (let k = 0; k < VENT_PUFFS; k++) {
          const age = (t / 3.2 + v * 0.37 + k / VENT_PUFFS) % 1;
          const a = 0.35 * vent * (1 - age) ** 1.4 * seg(age, 0, 0.06);
          put(0.15 + 0.8 * age, vy - 0.28 * age * age, vz + 0.1 * age, 0.07 + 0.55 * age, a, 0.3 * v + k * 0.13, -1);
        }
      }
    return n;
  }

  // Cold-gas puffs off the booster's top as it separates (orbit space, pad units × 0.18).
  if (p >= 0.36 && p < 0.38 && boosterPose(p, bPos, bQuat)) {
    const s = 0.18;
    for (const pb of [0.36, 0.366, 0.372]) {
      const q = seg(p, pb, pb + 0.006);
      if (q <= 0 || q >= 1) continue;
      for (const side of [-1, 1]) {
        stackLocal.set(side * (0.17 + 0.5 * q), 2.72 - (MODULE_Y0 - VEHICLE_BASE) + 0.05 * q, 0.03 * side).multiplyScalar(s).applyQuaternion(bQuat).add(bPos);
        put(stackLocal.x, stackLocal.y, stackLocal.z, (0.18 + 0.55 * q) * s, 0.7 * seg(q, 0, 0.12) * (1 - q), pb * 40 + side, -1);
      }
    }
  }
  // RCS puffs through the correction burn, from the satellite's four lower corners.
  if (p >= 0.826 && p < 0.845) {
    const q = seg(p, 0.826, 0.845);
    const s = 1.1;
    for (let c = 0; c < 4; c++) {
      const a = (45 + 90 * c) * D2R;
      const r = 0.15 + 0.2 * q;
      stackLocal.set(Math.sin(a) * r, -0.13, Math.cos(a) * r).multiplyScalar(s).applyQuaternion(quat).add(craft);
      put(stackLocal.x, stackLocal.y, stackLocal.z, (0.06 + 0.22 * q) * s, 0.3 * Math.sin(Math.PI * q), c * 0.25, -1);
    }
  }
  return n;
}

// ── Shader ───────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  attribute float aAlpha;
  attribute float aSeed;
  attribute float aUnder;
  uniform float uFogDensity;
  varying vec2 vUv;
  varying float vAlpha, vSeed, vUnder, vFog, vH;
  void main() {
    vec4 c = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
    float s = length((modelMatrix * instanceMatrix * vec4(1., 0., 0., 0.)).xyz);
    vec4 mv = viewMatrix * c;
    mv.xy += position.xy * s;
    vUv = uv;
    vAlpha = aAlpha;
    vSeed = aSeed;
    vUnder = aUnder;
    vH = c.y;
    vFog = 1. - exp(-uFogDensity * uFogDensity * mv.z * mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uSunV, uTop, uUnder, uHaze, uFire;
  uniform float uThrottle;
  varying vec2 vUv;
  varying float vAlpha, vSeed, vUnder, vFog, vH;
  void main() {
    vec2 d = vUv * 2. - 1.;
    float r = length(d);
    if (r > 1.) discard;
    vec2 nuv = vUv * .55 + vSeed * vec2(7.31, 3.17);
    float f = texture2D(uNoise, nuv).r * .62 + texture2D(uNoise, nuv * 2.3 + .37).r * .38;
    // Billows: the noise eats into the rim, so the silhouette is feathered, never a disc.
    float dens = (1. - smoothstep(.55, 1., r + (.5 - f) * .55)) * smoothstep(.18, .62, f + .3 * (1. - r));
    vec3 n = normalize(vec3(d + (f - .5) * 1.1, sqrt(max(0., 1. - r * r))));
    float hl = .5 + .5 * dot(n, uSunV);
    vec3 col = mix(uUnder, uTop, hl * hl);
    col += uFire * uThrottle * exp(-vH * 1.5) * (1. - n.y) * .8 * max(vUnder, 0.);
    col = mix(col, uTop, step(vUnder, -.5) * .8); // vent vapour (under −1): thin and bright, barely shaded
    col = mix(col, uHaze, vFog);
    gl_FragColor = vec4(col, min(.75, dens * vAlpha));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const lin = (hex: string) => new Color(hex);
const mat4 = new Matrix4();
const sunW = new Vector3();

export default function Smoke() {
  const frame = useMission();
  const mesh = useRef<InstancedMesh>(null);
  const mat = useRef<ShaderMaterial>(null);
  const seeds = useMemo(() => cloudSeeds(), []);
  const pool = useRef<Particle[]>(Array.from({ length: MAX }, () => ({ x: 0, y: 0, z: 0, size: 0, alpha: 0, seed: 0, under: 0, d: 0 })));
  const order = useRef<Particle[]>([]);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    g.setAttribute("aAlpha", new InstancedBufferAttribute(new Float32Array(MAX), 1));
    g.setAttribute("aSeed", new InstancedBufferAttribute(new Float32Array(MAX), 1));
    g.setAttribute("aUnder", new InstancedBufferAttribute(new Float32Array(MAX), 1));
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({
      uNoise: { value: noiseTexture() },
      uSunV: { value: new Vector3(0, 1, 0) },
      uTop: { value: lin("#f2f0ec") },
      uUnder: { value: lin("#8c9bb0") },
      uHaze: { value: new Color() },
      uFire: { value: lin("#ffb46b") },
      uThrottle: { value: 0 },
      uFogDensity: { value: 0 },
    }),
    [],
  );

  useLayoutEffect(() => {
    if (mesh.current) mesh.current.count = 0;
  }, []);

  useFrame((state) => {
    const m = mesh.current;
    const sm = mat.current;
    if (!m || !sm) return;
    const { p, t } = frame;
    const list = pool.current;
    const n = emit(p, t, frame.craft, frame.quat, seeds, list);
    m.count = n;
    m.visible = n > 0;
    if (n === 0) return;
    // Back to front by camera distance.
    const cam = state.camera.position;
    const ord = order.current;
    ord.length = n;
    for (let i = 0; i < n; i++) {
      const q = list[i];
      q.d = (q.x - cam.x) ** 2 + (q.y - cam.y) ** 2 + (q.z - cam.z) ** 2;
      ord[i] = q;
    }
    ord.sort((a, b) => b.d - a.d);
    const g = m.geometry;
    const [aA, aS, aU] = [g.attributes.aAlpha, g.attributes.aSeed, g.attributes.aUnder] as InstancedBufferAttribute[];
    for (let i = 0; i < n; i++) {
      const q = ord[i];
      mat4.makeScale(q.size, q.size, q.size).setPosition(q.x, q.y, q.z);
      m.setMatrixAt(i, mat4);
      aA.setX(i, q.alpha);
      aS.setX(i, q.seed);
      aU.setX(i, q.under);
    }
    m.instanceMatrix.needsUpdate = true;
    aA.needsUpdate = aS.needsUpdate = aU.needsUpdate = true;

    const u = sm.uniforms;
    (u.uSunV.value as Vector3).copy(sunDir(p, sunW)).transformDirection(state.camera.matrixWorldInverse);
    const [r, gr, b] = skyHorizonLinear(p);
    (u.uHaze.value as Color).setRGB(r, gr, b);
    u.uFogDensity.value = p < CUT_P ? 0.009 : 0;
    u.uThrottle.value = throttle1(p);
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, MAX]} frustumCulled={false} renderOrder={3}>
      <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent depthWrite={false} />
    </instancedMesh>
  );
}
