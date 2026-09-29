// The section's look: Porcelain Dawn materials, the analytic mist, and the sea, beam and sky shaders.
import * as THREE from "three";

export const WORLD = {
  white: "#ffffff", porcelain: "#f8f6f0", forest: "#0c3b29", ink: "#0f1a14", emerald: "#179a55", lime: "#c6ef5c",
  sage: "#cfdad1", coral: "#ec544b", champagne: "#dcc08a", rockLow: "#9a8a74", rockHigh: "#dccdb3", haze: "#e4f1ee",
  sand: "#f1e3c2", pebble: "#d9c9a8", grassLow: "#b7d4a8", grassHigh: "#93c79a", stoneWarm: "#e6d6ba", sky: "#b9e0ef", skyGlow: "#ffd9b3",
  sun: "#ffe2b8", bounce: "#cfe2cf", shallow: "#b4e8d8", deep: "#72cbb8", far: "#2f9a8e", trough: "#9edccb", foam: "#ffffff",
  beam: "#ffbb2e", beamNear: "#fff0c4", beamCore: "#ffdc8a", lamp: "#fffbea", lens: "#fff6dc", lensGlow: "#ffc94a",
  amber: "#fcb401", energy: "#34d399",
  indigo: "#4f46e5", azure: "#0ea5e9", emeraldCh: "#10b981", sunCh: "#f5b301",
  fadeIndigo: ["#9d9aff", "#f0c8ff"], fadeAzure: ["#6fd0ff", "#a8f4f0"], fadeEmerald: ["#6ee8b5", "#d6f78c"], fadeSun: ["#ffb07a", "#ffe48a"],
} as const;

/** One uniform block shared by every material: the mist (fog wall + bank + haze), updated once per frame. */
export const MIST = {
  uMistColor: { value: new THREE.Color(WORLD.haze) },
  uReach: { value: 1.8 }, // clear radius around the light (the reach ring = the fog wall)
  uReachSoft: { value: 2.6 },
  uSeaMist: { value: 1.0 }, // low mist lying on the water beyond the reach
  uBank: { value: 1.0 }, // bank density (slab)
  uBankY: { value: new THREE.Vector2(4.8, 6.0) },
  uHaze: { value: new THREE.Vector2(20, 120) }, // linear distance haze near/far
  uBeam: { value: new THREE.Vector3(0, 0, 0) }, // bearing (rad), half-width (rad), strength 0..1
  uMistTime: { value: 0 },
  uHoles: { value: Array.from({ length: 6 }, () => new THREE.Vector4()) }, // x, z, radius, amount: local clearings
  uView: { value: new THREE.Vector2(1440, 900) }, // drawing-buffer size, for the copy-safe mask
};

export const MIST_GLSL = /* glsl */ `
uniform vec3 uMistColor;
uniform float uReach, uReachSoft, uSeaMist, uBank, uMistTime;
uniform vec2 uBankY, uHaze;
uniform vec3 uBeam;
uniform vec4 uHoles[6];
uniform vec2 uView;
float mh12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float mnoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mh12(i), mh12(i + vec2(1, 0)), u.x), mix(mh12(i + vec2(0, 1)), mh12(i + vec2(1, 1)), u.x), u.y); }
float mistWedge(vec2 p) {
  float a = atan(p.x, -p.y);
  float d = abs(mod(a - uBeam.x + 3.14159265, 6.2831853) - 3.14159265);
  return uBeam.z * (1.0 - smoothstep(uBeam.y, uBeam.y * 2.2, d)) * smoothstep(3.0, 8.0, length(p));
}
/** 0 inside the reach (clear), 1 beyond it; the beam pushes a clear wedge further out. */
float mistOut(vec2 p) {
  float r = length(p) + (mnoise(p * 0.35 + uMistTime * 0.02) - 0.5) * 1.2;
  float o = smoothstep(uReach, uReach + uReachSoft, r) * (1.0 - mistWedge(p));
  for (int i = 0; i < 6; i++) { vec4 h = uHoles[i]; o *= 1.0 - h.w * (1.0 - smoothstep(h.z * 0.6, h.z, length(p - h.xy))); }
  return o;
}
float mistAmt(vec3 wpos) {
  vec3 ro = cameraPosition; vec3 rd = wpos - ro; float L = length(rd); rd /= max(L, 1e-4);
  // 1. distance haze: far things melt into the page
  float haze = smoothstep(uHaze.x, uHaze.y, L) * 0.88;
  // 2. low sea mist beyond the reach: evaluated at the surface, so it reads from any camera
  float sea = 0.42 * uSeaMist * mistOut(wpos.xz) * (1.0 - smoothstep(0.15, 1.7, wpos.y)); // a veil, never a white-out
  // 3. the bank: analytic path length of the view ray inside the slab beyond the reach, continuous over land and sea
  float t0 = 0.0, t1 = 0.0;
  if (abs(rd.y) < 1e-4) { if (ro.y > uBankY.x && ro.y < uBankY.y) { t0 = 0.0; t1 = L; } }
  else { float ta = (uBankY.x - ro.y) / rd.y, tb = (uBankY.y - ro.y) / rd.y; t0 = clamp(min(ta, tb), 0.0, L); t1 = clamp(max(ta, tb), 0.0, L); }
  float seg = max(0.0, t1 - t0);
  vec3 mp = ro + rd * (0.5 * (t0 + t1));
  float over = mistOut(mp.xz);
  float n = 0.45 + 0.55 * smoothstep(0.25, 0.75, mnoise(mp.xz * 0.16 + vec2(uMistTime * 0.015, 0.0)));
  float bank = 0.8 * (1.0 - exp(-uBank * 0.16 * seg * over * n)); // capped: the bank veils, never whites out
  return 1.0 - (1.0 - haze) * (1.0 - sea) * (1.0 - bank);
}
vec3 mistApply(vec3 col, vec3 wpos) { return mix(col, uMistColor, mistAmt(wpos)); }
/** 1 in the world area, 0 under the top-left step card (x < ~0.38, y < ~0.44 from the top). */
float copySafe() { vec2 q = vec2(gl_FragCoord.x / uView.x, 1.0 - gl_FragCoord.y / uView.y);
  return 1.0 - (1.0 - smoothstep(0.36, 0.40, q.x)) * (1.0 - smoothstep(0.42, 0.46, q.y)); }
`;

type Compile = (shader: THREE.WebGLProgramParametersWithUniforms, renderer: THREE.WebGLRenderer) => void;

/** Adds the mist to any built-in material (composes with an existing onBeforeCompile). */
export function withMist<T extends THREE.Material>(material: T, key = "m"): T {
  const prev: Compile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    prev.call(material, shader, r);
    if (!shader.vertexShader.includes("#include <project_vertex>") || !shader.fragmentShader.includes("#include <colorspace_fragment>")) throw new Error(`withMist(${key}): ${material.type} lacks the chunks it injects into`);
    Object.assign(shader.uniforms, MIST);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMistWorld;")
      .replace("#include <project_vertex>", `#include <project_vertex>
  vec4 mistW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    mistW = instanceMatrix * mistW;
  #endif
  vMistWorld = (modelMatrix * mistW).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMistWorld;\n" + MIST_GLSL)
      .replace("#include <colorspace_fragment>", "gl_FragColor.rgb = mistApply(gl_FragColor.rgb, vMistWorld);\n  #include <colorspace_fragment>");
  };
  const prevKey = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => `mist-${key}-${prevKey()}`;
  return material;
}

function glowFromWithin<T extends THREE.Material>(material: T, amount: number): T {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * ${amount.toFixed(2)};`);
  };
  material.customProgramCacheKey = () => `glow-${amount}`;
  return material;
}

export function materials() {
  const P = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o);
  return {
    porcelain: withMist(P({ color: WORLD.porcelain, emissive: WORLD.porcelain, emissiveIntensity: 0.025, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25 }), "porcelain"),
    lacquer: withMist(P({ color: WORLD.forest, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.3 }), "lacquer"),
    champagne: withMist(new THREE.MeshStandardMaterial({ color: WORLD.champagne, metalness: 0.6, roughness: 0.3 }), "champ"),
    stone: withMist(P({ color: WORLD.stoneWarm, roughness: 0.75, clearcoat: 0.1, clearcoatRoughness: 0.3 }), "stone"),
    rock: withMist(glowFromWithin(P({ color: "#ffffff", vertexColors: true, flatShading: true, roughness: 0.85, clearcoat: 0.05, clearcoatRoughness: 0.5 }), 0.02), "rock"),
    grass: withMist(P({ color: "#ffffff", vertexColors: true, roughness: 0.9 }), "grass"),
    glass: withMist(P({ color: WORLD.forest, transparent: true, opacity: 0.5, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04 }), "glass"),
    lens: withMist(P({ color: WORLD.lens, emissive: WORLD.lensGlow, emissiveIntensity: 0.45, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.8 }), "lens"),
    lamp: new THREE.MeshBasicMaterial({ color: WORLD.lamp, toneMapped: false }),
  };
}

const NOISE = /* glsl */ `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y); }
`;
export const MAX_SHORE = 13;

/** The sea: world-locked stroke cells turned to the camera's right vector (horizontal on screen, never swimming),
 * the fog wall, the shore foam and the beam's path. */
export function seaMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...MIST,
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(WORLD.shallow) },
      uDeep: { value: new THREE.Color(WORLD.deep) },
      uFar: { value: new THREE.Color(WORLD.far) },
      uTrough: { value: new THREE.Color(WORLD.trough) },
      uFoam: { value: new THREE.Color(WORLD.foam) },
      uBeamColor: { value: new THREE.Color(WORLD.beam) },
      uShore: { value: Array.from({ length: MAX_SHORE }, () => new THREE.Vector4()) },
      uCapsules: { value: Array.from({ length: 2 }, () => new THREE.Vector4()) },
      uCapR: { value: new THREE.Vector2(0.35, 0.3) },
      uCamRight: { value: new THREE.Vector2(1, 0) },
      uBeamDir: { value: new THREE.Vector2(0, -1) },
      uBeamStrength: { value: 0 },
      uBoat: { value: new THREE.Vector4(0, 0, 1, 0) },
      uStrokePx: { value: 1.1 },
      uDpr: { value: 1 },
      uSky: { value: new THREE.Color(WORLD.haze) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      #define SHORE ${MAX_SHORE}
      uniform float uTime, uStrokePx, uDpr, uBeamStrength;
      uniform vec3 uShallow, uDeep, uFar, uTrough, uFoam, uBeamColor, uSky;
      uniform vec4 uShore[SHORE];
      uniform vec4 uCapsules[2];
      uniform vec2 uCapR, uCamRight, uBeamDir;
      uniform vec4 uBoat;
      varying vec3 vWorld;
      ${NOISE}
      ${MIST_GLSL}
      float capsule(vec2 p, vec2 a, vec2 b, float r) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
      float shore(vec2 p) {
        float d = 1e4;
        for (int i = 0; i < SHORE; i++) { vec4 r = uShore[i]; if (r.z <= 0.0) continue; float k = length(p - r.xy) - r.z;
          float h = clamp(0.5 + 0.5 * (d - k) / 0.8, 0.0, 1.0); d = mix(d, k, h) - 0.8 * h * (1.0 - h); }
        for (int i = 0; i < 2; i++) { vec4 c = uCapsules[i]; if (c.x == 0.0 && c.y == 0.0) continue; d = min(d, capsule(p, c.xy, c.zw, i == 0 ? uCapR.x : uCapR.y)); }
        return d;
      }
      // World-locked square brick cells; each stroke is drawn along the camera's right vector (exactly horizontal on screen).
      float strokes(vec2 p, float S, float t) {
        vec2 u = p / S;
        vec2 g = u; g.x += floor(g.y) * 0.5;
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;
        float h = hash12(id), h2 = hash12(id + 17.31), h3 = hash12(id + 5.7);
        float life = sin(t * (0.25 + 0.2 * h2) + h * 6.2831);
        float len = (0.12 + 0.16 * h2) * smoothstep(0.2, 0.85, life) * step(0.45, h3);
        f -= vec2(h2 - 0.5, h - 0.5) * 0.12;
        vec2 cr = uCamRight, cn = vec2(-cr.y, cr.x);
        vec2 q = vec2(dot(f, cr), dot(f, cn));            // stroke frame: x along the camera's right
        q.y += 0.5 * q.x * q.x / max(len, 0.06);          // a shallow crest
        vec2 fwq = vec2(length(fwidth(u)) * 0.7);
        vec2 dpx = vec2(max(abs(q.x) - len, 0.0), q.y) / max(fwq, vec2(1e-5));
        float lod = smoothstep(5.0, 12.0, 1.0 / (fwq.y * uDpr));
        return (1.0 - smoothstep((uStrokePx - 0.7) * uDpr, (uStrokePx + 0.7) * uDpr, length(dpx))) * step(0.001, len) * lod;
      }
      float beamPath(vec2 p, vec2 dir) {
        float along = dot(p, dir); float side = abs(p.x * dir.y - p.y * dir.x);
        float halfW = max(along, 0.0) * 0.09 + 0.15;
        return (1.0 - smoothstep(0.25, 1.0, side / halfW)) * smoothstep(2.5, 6.0, along) * (1.0 - smoothstep(10.0, 30.0, along));
      }
      void main() {
        vec2 p = vWorld.xz;
        float d = shore(p) + (vnoise(p * 1.6 + uTime * 0.06) - 0.5) * 0.22;
        vec3 col = mix(uShallow, uDeep, smoothstep(0.1, 7.0, d));
        col = mix(col, uFar, smoothstep(6.0, 34.0, d) * 0.85);
        col = mix(col, uTrough, (1.0 - smoothstep(0.0, 0.8, d)) * 0.5);
        col = mix(col, uShallow, smoothstep(0.35, 0.8, vnoise(p * 0.07 + uTime * 0.01)) * 0.18);
        float grazing = 1.0 - clamp(normalize(cameraPosition - vWorld).y, 0.0, 1.0);
        col = mix(col, uSky, pow(grazing, 8.0) * 0.7);
        vec2 drift = vec2(0.0, -uTime * 0.08);
        float s = max(strokes(p + drift, 1.45, uTime), 0.6 * strokes(p * 1.6 + drift + 7.3, 1.45, uTime * 1.3));
        s *= smoothstep(0.35, 1.2, d) * copySafe();
        col = mix(col, uFoam, s * 0.8);
        float dn = d + (vnoise(p * 7.0 + uTime * 0.4) - 0.5) * 0.08;
        float band = 1.0 - smoothstep(0.05, 0.05 + max(fwidth(dn) * 1.5, 0.03), dn);
        float rc = d - uTime * 0.25;
        float rpx = abs(fract(rc + 0.5) - 0.5) / fwidth(rc);
        float fade = smoothstep(0.05, 2.1, d);
        float rw = mix(1.6, 0.6, fade) * uDpr;
        float ring = (1.0 - smoothstep(rw - 0.7 * uDpr, rw + 0.7 * uDpr, rpx)) * (1.0 - fade) * step(0.06, d);
        ring *= 0.55 + 0.45 * vnoise(p * 2.5 - uTime * 0.2);
        col = mix(col, uFoam, max(band, ring * 0.9 * copySafe()));
        // wake behind the tracked boat
        vec2 v = p - uBoat.xy; vec2 qb = vec2(dot(v, uBoat.zw), v.x * uBoat.w - v.y * uBoat.z);
        float behind = -qb.x; float arms = abs(abs(qb.y) - behind * 0.34 - 0.12);
        float wpx = arms / max(fwidth(arms), 1e-4);
        float wake = (1.0 - smoothstep(0.6 * uDpr, (1.8 + behind * 0.4) * uDpr, wpx)) * smoothstep(0.0, 0.5, behind) * (1.0 - smoothstep(0.8, 3.6, behind));
        col = mix(col, uFoam, wake * 0.7 * step(0.001, dot(uBoat.zw, uBoat.zw)));
        float b = beamPath(p, uBeamDir) * uBeamStrength;
        col = mix(col, uBeamColor, b * 0.3);
        gl_FragColor = vec4(mistApply(col, vWorld), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** The beam cone shader plus a channel tint and a light (0 = occulted). */
export function beamMaterial(color: string, near: string, opacity: number) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...MIST, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uNear: { value: new THREE.Color(near) }, uTint: { value: new THREE.Color("#ffffff") }, uTintAmt: { value: 0 }, uOpacity: { value: opacity }, uLight: { value: 1 } },
    vertexShader: /* glsl */ `
      varying float vAlong; varying float vAround; varying vec3 vNormalV; varying vec3 vPosV; varying vec3 vW;
      void main() { vAlong = 1.0 - uv.y; vAround = uv.x; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vPosV = mv.xyz;
        vNormalV = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uOpacity, uTintAmt, uLight; uniform vec3 uColor, uNear, uTint;
      varying float vAlong; varying float vAround; varying vec3 vNormalV; varying vec3 vPosV; varying vec3 vW;
      ${MIST_GLSL}
      void main() {
        float facing = abs(dot(normalize(vNormalV), normalize(-vPosV)));
        float core = smoothstep(0.0, 0.45, facing) * (0.55 + 0.45 * facing);
        float len = smoothstep(0.0, 0.06, vAlong) * (pow(1.0 - vAlong, 1.3) + 0.5 * exp(-vAlong * 12.0));
        float streak = 0.8 + 0.2 * sin(vAround * 6.2831 * 9.0 + uTime * 0.6) * sin(vAround * 6.2831 * 4.0 - uTime * 0.35);
        float ground = smoothstep(0.0, 1.4, vW.y);
        vec3 col = mix(uNear, uColor, smoothstep(0.0, 0.45, vAlong));
        col = mix(col, uTint, uTintAmt * smoothstep(0.1, 0.6, vAlong));
        float m = mistAmt(vW);
        gl_FragColor = vec4(mix(col, uMistColor, m * 0.35), min(1.0, 1.3 * uOpacity * uLight * core * len * streak * ground * (1.0 - 0.55 * m)));
        #include <colorspace_fragment>
      }
    `,
  });
}

export function skyMaterial() {
  return new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color(WORLD.white) }, uSky: { value: new THREE.Color(WORLD.sky) }, uHaze: { value: new THREE.Color(WORLD.haze) }, uGlow: { value: new THREE.Color(WORLD.skyGlow) }, uSun: { value: new THREE.Vector3(-0.7, 0.2, -0.6) },
      uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uSpread: { value: 0.1 }, uGlowAmt: { value: 0.2 } },
    vertexShader: `varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uSky, uHaze, uGlow, uSun; uniform mat4 uInvProj, uCamWorld; uniform float uSpread, uGlowAmt; varying vec2 vNdc;
      void main() {
        vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
        vec3 dir = normalize(mat3(uCamWorld) * (v.xyz / v.w));
        float e = dir.y;
        vec3 col = mix(uHaze, uSky, smoothstep(0.0, uSpread, e));                 // tinted horizon haze → pale aqua sky
        col = mix(col, uGlow, 0.2 * uGlowAmt * (1.0 - smoothstep(0.0, 0.05, abs(e)))); // a thin warm band all round the horizon
        float sun = pow(max(dot(dir.xz, normalize(uSun.xz)), 0.0), 2.0) * (1.0 - smoothstep(-0.02, 0.1, e));
        col = mix(col, uGlow, sun * uGlowAmt);                                    // warm dawn glow on the sun side
        col = mix(col, uTop, smoothstep(0.35, 0.95, vNdc.y));                     // white where the canvas meets the page
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}
