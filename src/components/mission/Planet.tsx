// Textures (public/textures/earth/):
//  day_*.webp       NASA Blue Marble Next Generation, July 2004 (world.topo.bathy.200407), public domain. Credit: NASA Earth Observatory / Reto Stöckli.
//  night_*.webp     NASA Black Marble 2016 (BlackMarble_2016_01deg), public domain. Credit: NASA Earth Observatory.
//  clouds_*.webp    NASA Visible Earth cloud_combined_2048, public domain.
//  height_2048.webp NASA Earth Observatory GEBCO_08 elevation (Jesse Allen, GEBCO/BODC data), public domain.
//  water_2048.webp  three.js r186 examples/textures/planets/earth_specular_2048.jpg, MIT (c) 2010-2026 three.js authors.
// No NASA endorsement implied; no NASA insignia used.

import { Suspense, useCallback, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  AddEquation,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  CustomBlending,
  OneFactor,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type Group,
  type PerspectiveCamera,
  type ShaderMaterial,
  type Texture,
} from "three";
import { useMission } from "./frame";
import { CUT_P, eio, lerp, R, scrimOpacity, seg, STILL_QUERY } from "./timeline";
import { C, EARTH_ROT, mulberry32, sunDir } from "./world";

// The Earth as a photograph: NASA day and night imagery lit by one hard sun, sharp ocean glint,
// relief from real elevation, a drifting cloud shell with its own shadows, and a thin
// impact-parameter atmosphere on the limb. No spin (the clouds drift instead), no glow halo.

const DIR = "/textures/earth/";
const DESKTOP = {
  day: `${DIR}day_2048.webp`,
  night: `${DIR}night_2048.webp`,
  clouds: `${DIR}clouds_2048.webp`,
  water: `${DIR}water_2048.webp`,
  height: `${DIR}height_2048.webp`,
} as const;
const STILL = { ...DESKTOP, day: `${DIR}day_1024.webp`, night: `${DIR}night_1024.webp`, clouds: `${DIR}clouds_1024.webp` } as const;
// Loaded with the lazy scene chunk, long before the Earth is on screen at p .27 (the still frame's set on phones).
if (typeof window !== "undefined") useTexture.preload(Object.values(window.matchMedia(STILL_QUERY).matches ? STILL : DESKTOP));

const REVEAL_MS = 600;
const ATMO_S = 1.025;
const CLOUD_S = 1.006;

/** Detail bias by shot: soft through the chase and the satellite close-ups, where the Earth reads as defocus, not pixels. */
const FOCUS_KEYS: readonly (readonly [number, number])[] = [
  [0.27, 1.5],
  [0.31, 0],
  [0.345, 0],
  [0.352, 2.5],
  [0.56, 2.5],
  [0.6, 0],
];
function focusBias(p: number) {
  if (p <= FOCUS_KEYS[0][0]) return FOCUS_KEYS[0][1];
  for (let i = 0; i < FOCUS_KEYS.length - 1; i++) {
    const [[a, va], [b, vb]] = [FOCUS_KEYS[i], FOCUS_KEYS[i + 1]];
    if (p <= b) return lerp(va, vb, seg(p, a, b));
  }
  return FOCUS_KEYS[FOCUS_KEYS.length - 1][1];
}

/**
 * Additive glow that stays valid premultiplied colour over the transparent canvas: the shaders write
 * alpha = max(rgb), so the CSS sky behind shows through as (1 − a), and over black space it reads as pure addition.
 */
const ADD_RGB = {
  blending: CustomBlending,
  blendEquation: AddEquation,
  blendSrc: OneFactor,
  blendDst: OneFactor,
  blendSrcAlpha: OneFactor,
  blendDstAlpha: OneFactor,
} as const;

// Object-space tangent frame on three's sphere: east = cross(Y, n), north = cross(n, east), carried to world space.
const SURFACE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN, vT, vB, vPosW;
  void main() {
    vUv = uv;
    vec3 n = normalize(position);
    vec3 t = cross(vec3(0.0, 1.0, 0.0), n);
    t = dot(t, t) < 1e-8 ? vec3(0.0, 0.0, -1.0) : normalize(t);
    vec3 b = cross(n, t);
    mat3 m = mat3(modelMatrix);
    vN = normalize(m * n);
    vT = normalize(m * t);
    vB = normalize(m * b);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vPosW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D uDay, uNight, uClouds, uWater, uHeight;
  uniform vec3 uSun, uPlaceholder, uAtmoDay, uAtmoTwilight;
  uniform float uCloudU, uReveal, uFocusBias, uRelief, uGain, uFade;
  varying vec2 vUv;
  varying vec3 vN, vT, vB, vPosW;
  const vec2 TX = vec2(1.0 / 2048.0, 1.0 / 1024.0);
  void main() {
    vec3 N = normalize(vN), T = normalize(vT), B = normalize(vB), V = normalize(cameraPosition - vPosW);
    // Relief from the elevation map, as a tangent-space normal.
    float hE = texture2D(uHeight, vUv + vec2(TX.x, 0.0), uFocusBias).r, hW = texture2D(uHeight, vUv - vec2(TX.x, 0.0), uFocusBias).r;
    float hN = texture2D(uHeight, vUv + vec2(0.0, TX.y), uFocusBias).r, hS = texture2D(uHeight, vUv - vec2(0.0, TX.y), uFocusBias).r;
    vec3 tn = normalize(vec3(-(hE - hW) * uRelief, -(hN - hS) * uRelief, 1.0));
    vec3 Nb = normalize(T * tn.x + B * tn.y + N * tn.z);
    float ndl = dot(N, uSun), lit = max(dot(Nb, uSun), 0.0);
    float day = smoothstep(-0.06, 0.20, ndl), twi = exp(-pow(ndl / 0.14, 2.0));
    // Clouds and the shadows they throw, offset toward the sun (RepeatWrapping, never fract()).
    vec2 cuv = vec2(vUv.x + uCloudU, vUv.y);
    vec2 toSun = vec2(dot(uSun, T), dot(uSun, B));
    float cloud = smoothstep(0.18, 0.85, texture2D(uClouds, cuv, uFocusBias).r);
    float cShadow = smoothstep(0.18, 0.85, texture2D(uClouds, cuv + toSun * vec2(0.0025, 0.005), uFocusBias).r);
    float water = texture2D(uWater, vUv).r;
    // The Blue Marble sea is composited bright; a camera in orbit sees it deeper.
    vec3 albedo = texture2D(uDay, vUv, uFocusBias).rgb * (1.0 - 0.45 * cShadow * day) * mix(1.0, 0.7, water);
    // Exposed for the lit Earth, as an orbital camera is: a softened Lambert, plus the faint blue in-scatter over the day side.
    vec3 col = albedo * (0.012 + uGain * pow(lit, 0.7)) + uAtmoDay * 0.012 * smoothstep(0.05, 0.6, ndl);
    // Sun glint on open water (the flat normal: the sea has no relief).
    vec3 H = normalize(uSun + V);
    float nh = max(dot(N, H), 0.0);
    vec3 glintTint = mix(vec3(1.0, 0.55, 0.3), vec3(1.0, 0.96, 0.9), smoothstep(0.0, 0.35, ndl));
    col += glintTint * (pow(nh, 160.0) * 0.8 + pow(nh, 18.0) * 0.05) * water * (1.0 - cloud) * day;
    // City lights on the night side, dimmed under cloud.
    vec3 night = max(texture2D(uNight, vUv, uFocusBias).rgb - 0.05, 0.0) * 2.4 * (1.0 - cloud * 0.85);
    col = mix(night, col, day);
    col *= mix(vec3(1.0), vec3(1.0, 0.62, 0.45), twi * 0.55);
    // Aerial perspective toward the limb, blue by day, amber at the terminator.
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    col = mix(col, mix(uAtmoTwilight, uAtmoDay, smoothstep(-0.05, 0.35, ndl)), fres * smoothstep(0.0, 1.0, ndl) * 0.45);
    gl_FragColor = vec4(mix(uPlaceholder, col, uReveal), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    // Out of the cut the limb comes up through the last of the blue sky: premultiplied, blending off.
    gl_FragColor *= uFade;
  }
`;

const CLOUD_FRAG = /* glsl */ `
  uniform sampler2D uClouds;
  uniform vec3 uSun;
  uniform float uCloudU, uReveal, uFocusBias, uFade;
  varying vec2 vUv;
  varying vec3 vN, vT, vB, vPosW;
  void main() {
    float ndl = dot(normalize(vN), uSun);
    float c = texture2D(uClouds, vec2(vUv.x + uCloudU, vUv.y), uFocusBias).r;
    float alpha = smoothstep(0.18, 0.85, c) * 0.92 * smoothstep(-0.25, 0.1, ndl) * uReveal * uFade;
    vec3 rgb = vec3(pow(clamp((ndl + 0.1) / 1.1, 0.0, 1.0), 0.6)) * mix(vec3(1.0, 0.7, 0.5), vec3(1.0), smoothstep(0.0, 0.3, ndl));
    gl_FragColor = vec4(rgb, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const ATMO_VERT = /* glsl */ `
  varying vec3 vPosW, vNW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vPosW = w.xyz;
    vNW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
// Impact parameter: how close the view ray passes to the centre. Rays that graze the surface cross
// the most air; density falls off toward the shell. The band is held to about uRimPx screen pixels
// (never more than the shell), so it reads as a hairline in the close limb shots and a thin rim in
// the wides. Pixels over the disc are behind the opaque Earth.
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uCenter, uSun, uDay, uTwilight;
  uniform float uR, uS, uReveal, uGain, uPixelAngle, uRimPx, uFade;
  varying vec3 vPosW, vNW;
  void main() {
    vec3 rd = normalize(vPosW - cameraPosition);
    float tca = dot(uCenter - cameraPosition, rd);
    vec3 closest = cameraPosition + rd * tca;
    vec3 off = closest - uCenter;
    float b = length(off);
    float band = min(uR * (uS - 1.0), uRimPx * uPixelAngle * max(tca, 0.0));
    float t = clamp((b - uR) / band, 0.0, 1.0);
    float dens = pow(1.0 - t, 1.6);
    float ndl = dot(off / b, uSun);
    vec3 col = mix(uTwilight, uDay, smoothstep(-0.12, 0.3, ndl));
    float lit = smoothstep(-0.2, 0.2, ndl) * mix(0.55, 1.0, smoothstep(0.0, 0.3, ndl)); // the night limb fades out
    col = mix(col, vec3(0.75, 0.88, 1.0), 0.35 * pow(1.0 - t, 6.0) * smoothstep(0.1, 0.5, ndl)); // paler where the air is thickest
    vec3 glow = col * dens * lit * uGain * uReveal * uFade;
    gl_FragColor = vec4(glow, min(1.0, max(glow.r, max(glow.g, glow.b))));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STAR_COUNT = 2000;
const STAR_VERT = /* glsl */ `
  attribute float aSize, aBright;
  uniform float uDpr, uOpacity, uEarthAng, uCopyX, uCopyFade;
  uniform vec3 uEarthDir;
  varying float vB;
  void main() {
    vec3 d = normalize(position);
    float ang = acos(clamp(dot(d, uEarthDir), -1.0, 1.0));
    float nearEarth = smoothstep(1.15, 1.6, ang / uEarthAng);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float x = clip.x / clip.w;
    float inCopy = 1.0 - smoothstep(uCopyX - 0.15, uCopyX, x);
    float px = aSize * uDpr;
    vB = aBright * nearEarth * uOpacity * (1.0 - uCopyFade * inCopy) * min(px, 1.0);
    gl_PointSize = max(px, 1.0);
    gl_Position = clip;
  }
`;
const STAR_FRAG = /* glsl */ `
  varying float vB;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float a = 1.0 - smoothstep(0.4, 1.0, dot(c, c));
    gl_FragColor = vec4(vec3(vB * a), vB * a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Star directions, sizes (0.6–1.4 px) and brightnesses (0.06–0.3, most near 0.1), seeded so every visit is the same sky. */
function starGeometry() {
  const rand = mulberry32(29);
  const pos = new Float32Array(STAR_COUNT * 3);
  const size = new Float32Array(STAR_COUNT);
  const bright = new Float32Array(STAR_COUNT);
  const v = new Vector3();
  for (let i = 0; i < STAR_COUNT; i++) {
    const z = 2 * rand() - 1;
    const a = 2 * Math.PI * rand();
    const s = Math.sqrt(1 - z * z);
    v.set(s * Math.cos(a), z, s * Math.sin(a)).toArray(pos, i * 3);
    const r = rand();
    size[i] = 0.6 + 0.8 * rand() ** 2;
    bright[i] = 0.06 + 0.24 * r ** 4 + 0.04 * rand();
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aSize", new BufferAttribute(size, 1));
  g.setAttribute("aBright", new BufferAttribute(bright, 1));
  return g;
}

function Stars() {
  const frame = useMission();
  const group = useRef<Group>(null);
  const mat = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => starGeometry(), []);
  const uniforms = useMemo(
    () => ({
      uDpr: { value: 1 },
      uOpacity: { value: 0 },
      uEarthAng: { value: 1 },
      uEarthDir: { value: new Vector3(0, -1, 0) },
      uCopyX: { value: 0 },
      uCopyFade: { value: 0 },
    }),
    [],
  );
  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const p = frame.p;
    const cam = state.camera as PerspectiveCamera;
    g.position.copy(cam.position);
    g.scale.setScalar(0.8 * cam.far);
    const u = m.uniforms;
    const dist = u.uEarthDir.value.subVectors(C, cam.position).length();
    u.uEarthDir.value.divideScalar(dist);
    u.uEarthAng.value = Math.asin(Math.min(1, R / dist));
    u.uDpr.value = state.gl.getPixelRatio();
    u.uOpacity.value = seg(p, 0.265, 0.29) * (p >= 0.345 && p < 0.56 ? 0.5 : 1);
    // The phone card is a clean diagram of the orbit: no stars.
    g.visible = !(frame.still && state.size.width / state.size.height < 1.2);
    // The copy column's right edge in NDC: it starts at 8vw (12px panel inset) and is at most 38rem wide.
    const vw = typeof window === "undefined" ? state.size.width : window.innerWidth;
    u.uCopyX.value = -1 + (2 * (0.08 * vw - 12 + 608)) / state.size.width;
    u.uCopyFade.value = 0.8 * (frame.still ? 0.5 : scrimOpacity(p)); // the copy scrim's opacity: the stars dim behind the copy column
  });
  return (
    <group ref={group}>
      <points geometry={geometry} renderOrder={-1} frustumCulled={false}>
        <shaderMaterial ref={mat} vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={uniforms} transparent depthWrite={false} toneMapped={false} {...ADD_RGB} />
      </points>
    </group>
  );
}

/** The per-frame uniforms of the surface shaders (each material gets its own objects). */
const liveUniforms = () => ({
  uSun: { value: new Vector3(0, 1, 0) },
  uCloudU: { value: 0 },
  uReveal: { value: 0 },
  uFocusBias: { value: 0 },
  uFade: { value: 1 },
});

/** Drops the textured Earth in over the placeholder once its maps have loaded. */
function Earth({ still }: { still: boolean }) {
  const frame = useMission();
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const reveal = useRef({ t: 0, done: false });
  const earthMat = useRef<ShaderMaterial>(null);
  const cloudMat = useRef<ShaderMaterial>(null);
  const atmoMat = useRef<ShaderMaterial>(null);

  const onLoad = useCallback(
    (maps: unknown) => {
      // drei hands over the loaded array in key order (its types say the keyed object; accept both).
      const list = (Array.isArray(maps) ? maps : Object.values(maps as object)) as Texture[];
      const [day, night, cloud] = list;
      const aniso = gl.capabilities.getMaxAnisotropy();
      for (const t of list) {
        t.anisotropy = aniso;
        t.needsUpdate = true;
      }
      day.colorSpace = SRGBColorSpace;
      night.colorSpace = SRGBColorSpace;
      cloud.wrapS = RepeatWrapping;
    },
    [gl],
  );
  const maps = useTexture(still ? STILL : DESKTOP, onLoad);

  const earthUniforms = useMemo(
    () => ({
      ...liveUniforms(),
      uDay: { value: maps.day },
      uNight: { value: maps.night },
      uClouds: { value: maps.clouds },
      uWater: { value: maps.water },
      uHeight: { value: maps.height },
      uPlaceholder: { value: new Color("#0b1d3a") },
      uAtmoDay: { value: new Color("#4db2ff") },
      uAtmoTwilight: { value: new Color("#bc490b") },
      uRelief: { value: 6 },
      uGain: { value: 1.8 },
    }),
    [maps],
  );
  const cloudUniforms = useMemo(() => ({ ...liveUniforms(), uClouds: { value: maps.clouds } }), [maps]);
  const atmoUniforms = useMemo(
    () => ({
      uSun: { value: new Vector3(0, 1, 0) },
      uReveal: { value: 0 },
      uFade: { value: 1 },
      uCenter: { value: C.clone() },
      uR: { value: R },
      uS: { value: ATMO_S },
      uDay: { value: new Color("#4db2ff") },
      uTwilight: { value: new Color("#bc490b") },
      uGain: { value: 1.3 },
      uPixelAngle: { value: 0.001 },
      uRimPx: { value: 6 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const p = frame.p;
    const m = earthMat.current;
    if (!m) return;
    if (!reveal.current.done) {
      reveal.current.t = frame.still ? 1 : Math.min(1, reveal.current.t + (delta * 1000) / REVEAL_MS);
      if (reveal.current.t >= 1) {
        reveal.current.done = true;
        state.gl.domElement.closest("section")?.setAttribute("data-earth-ready", "1");
        if (frame.still) invalidate();
      }
    }
    // Each material owns its uniform objects, so every one is written.
    const cloudU = 0.02 * p + 0.00012 * frame.t;
    const bias = focusBias(p);
    const fade = frame.still ? 1 : eio(seg(p, CUT_P, 0.29));
    const a = atmoMat.current;
    if (a) {
      const cam = state.camera as PerspectiveCamera;
      a.uniforms.uPixelAngle.value = (2 * Math.tan((cam.fov * Math.PI) / 360)) / state.size.height;
    }
    for (const mat of [m, cloudMat.current, a]) {
      if (!mat) continue;
      const u = mat.uniforms;
      sunDir(p, u.uSun.value);
      u.uReveal.value = reveal.current.t;
      u.uFade.value = fade;
      if (u.uCloudU) u.uCloudU.value = cloudU;
      if (u.uFocusBias) u.uFocusBias.value = bias;
    }
  });

  return (
    <group position={C} quaternion={EARTH_ROT}>
      <mesh renderOrder={0}>
        <sphereGeometry args={[R, 128, 64]} />
        <shaderMaterial ref={earthMat} vertexShader={SURFACE_VERT} fragmentShader={EARTH_FRAG} uniforms={earthUniforms} />
      </mesh>
      <mesh renderOrder={1} scale={CLOUD_S}>
        <sphereGeometry args={[R, 128, 64]} />
        <shaderMaterial ref={cloudMat} vertexShader={SURFACE_VERT} fragmentShader={CLOUD_FRAG} uniforms={cloudUniforms} transparent depthWrite={false} />
      </mesh>
      <mesh renderOrder={2} scale={ATMO_S}>
        <sphereGeometry args={[R, 96, 48]} />
        <shaderMaterial ref={atmoMat} vertexShader={ATMO_VERT} fragmentShader={ATMO_FRAG} uniforms={atmoUniforms} side={BackSide} transparent depthWrite={false} {...ADD_RGB} />
      </mesh>
    </group>
  );
}

/** Shown until the maps arrive: the same sphere in deep navy, so nothing pops. */
function Placeholder() {
  return (
    <mesh position={C}>
      <sphereGeometry args={[R, 64, 32]} />
      <meshBasicMaterial color="#0b1d3a" />
    </mesh>
  );
}

export default function Planet({ still }: { still: boolean }) {
  return (
    <>
      <Suspense fallback={<Placeholder />}>
        <Earth still={still} />
      </Suspense>
      <Stars />
    </>
  );
}
