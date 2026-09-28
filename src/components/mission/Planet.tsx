import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, FrontSide, MeshPhysicalMaterial, Vector3, Vector4, type Mesh, type ShaderMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { useMission } from "./frame";
import { eio, KARMAN, R, seg, STATIONS, windowed } from "./timeline";
import { C, mulberry32, polar, stationNormal } from "./world";

// The planet. On the pad the ground glows page white; as the ascent pulls
// back the glow drains and the painted globe shows through: an emerald ocean
// with white ceramic continents (the pad and every station sit on land), a
// mint shoreline and a mint halo at the limb.

const T = 0.12; // land threshold
const GLOW = 3;
/** The key light's direction, so the continents and the ocean brighten on the sun side. */
const SUN = new Vector3(-0.43, 0.72, 0.57).normalize();
const INNER_GLOW = 0.28; // as glowFromWithin: the surface colour glows a little, so shaded faces keep their hue

/**
 * The land field: a seeded sum of sines over a gently warped sphere (8 continent-scale terms,
 * 5 finer ones for ragged coasts), plus a soft bump under the pad and every station so they all
 * sit on land. Evaluated per fragment, so coastlines stay crisp at every distance.
 */
function landField() {
  const rand = mulberry32(11);
  const terms: { d: Vector3; f: number; ph: number; a: number }[] = [];
  for (let k = 0; k < 8; k++) {
    const d = new Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    terms.push({ d, f: 3 + 4 * rand(), ph: 2 * Math.PI * rand(), a: (k + 1) ** -0.4 });
  }
  const sumA = terms.reduce((s, t) => s + t.a, 0);
  for (let k = 0; k < 5; k++) {
    const d = new Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    terms.push({ d, f: 8 + 6 * rand(), ph: 2 * Math.PI * rand(), a: (0.18 * sumA) / 5 });
  }
  const caps = [{ n: new Vector3(0, 1, 0), r: 14 }, ...STATIONS.map((_, k) => ({ n: stationNormal(k), r: 12 }))];
  return {
    uTermA: { value: terms.map((t) => new Vector4(t.d.x, t.d.y, t.d.z, t.f)) },
    uTermB: { value: terms.map((t) => new Vector4(t.ph, t.a / sumA, 0, 0)) },
    uCaps: { value: caps.map((c) => new Vector4(c.n.x, c.n.y, c.n.z, c.r)) },
    uSun: { value: SUN },
    uDeep: { value: new Color("#0e5e41") },
    uShallow: { value: new Color("#25b47a") },
    uDay: { value: new Color("#5fe0a6") },
    uCoast: { value: new Color("#9ff0cc") },
    uLow: { value: new Color("#dfe8e1") },
    uHigh: { value: new Color("#fbfdf9") },
  };
}

const PLANET_PARS = /* glsl */ `
  uniform vec4 uTermA[13];
  uniform vec4 uTermB[13];
  uniform vec4 uCaps[6];
  uniform vec3 uSun, uDeep, uShallow, uDay, uCoast, uLow, uHigh;
  varying vec3 vObjN;
  vec3 planetColor() {
    vec3 n = normalize(vObjN);
    vec3 m = normalize(n + 0.3 * vec3(sin(5.1 * n.y + 1.3), sin(4.7 * n.z + 0.2), sin(5.3 * n.x + 2.2)));
    float land = 0.0;
    for (int i = 0; i < 13; i++) land += uTermB[i].y * sin(uTermA[i].w * dot(m, uTermA[i].xyz) + uTermB[i].x);
    for (int i = 0; i < 6; i++) {
      float ang = degrees(acos(clamp(dot(n, uCaps[i].xyz), -1.0, 1.0))) / uCaps[i].w;
      land += 0.45 * exp(-ang * ang);
    }
    float w = max(fwidth(land) * 0.8, 0.0015); // about a pixel, whatever the distance
    float coast = smoothstep(${T.toFixed(3)} - w, ${T.toFixed(3)} + w, land);
    float depth = 1.0 - smoothstep(${(T - 0.3).toFixed(3)}, ${(T - 0.02).toFixed(3)}, land);
    float sun = smoothstep(-0.4, 0.95, dot(n, uSun));
    vec3 ocean = mix(mix(uShallow, uDeep, depth), uDay, 0.35 * sun);
    float shore = 1.0 - smoothstep(max(0.012, 2.5 * w), max(0.012, 2.5 * w) + w, ${T.toFixed(3)} - land);
    ocean = mix(ocean, uCoast, shore);
    return mix(ocean, mix(uLow, uHigh, sun), coast);
  }
`;

function planetMaterial(uniforms: ReturnType<typeof landField>) {
  const mat = new MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.55,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
    emissive: "#ffffff",
    emissiveIntensity: GLOW,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjN;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjN = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${PLANET_PARS}`)
      .replace("#include <color_fragment>", "#include <color_fragment>\nvec3 surface = planetColor();\ndiffuseColor.rgb *= surface;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>\ntotalEmissiveRadiance += surface * ${INNER_GLOW.toFixed(2)};`,
      );
  };
  mat.customProgramCacheKey = () => "mission-planet";
  return mat;
}

const ATMOS_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const ATMOS_FRAG = /* glsl */ `
  uniform float uReveal;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    vec3 rgb = mix(vec3(0.624, 0.910, 0.816), vec3(0.812, 0.933, 1.0), fres);
    gl_FragColor = vec4(rgb, 0.6 * fres * uReveal);
  }
`;

export default function Planet() {
  const frame = useMission();
  const atmos = useRef<Mesh>(null);
  const atmosMat = useRef<ShaderMaterial>(null);
  const karman = useRef<Line2>(null);
  const body = useMemo(() => planetMaterial(landField()), []);
  const bodyRef = useRef<MeshPhysicalMaterial>(body);
  const uniforms = useMemo(() => ({ uReveal: { value: 0 } }), []);
  const karmanPts = useMemo(() => Array.from({ length: 128 }, (_, i) => polar(-20 + (90 * i) / 127, KARMAN)), []);

  useFrame(() => {
    const p = frame.p;
    // Page white on the pad. 3 (not 1.4): at grazing angles the clearcoat dims the base layer,
    // emissive included, and a lower value let the ocean show as a mint rim along the horizon.
    bodyRef.current.emissiveIntensity = GLOW * (1 - eio(seg(p, 0.28, 0.4)));
    // The halo stays out until the pull-back: on the pad its shell floats 0.63 above the ground.
    if (atmos.current) atmos.current.visible = p >= 0.3;
    // (It steps out during the deploy close-up, where only its edge would peek in under the copy.)
    if (atmosMat.current) atmosMat.current.uniforms.uReveal.value = seg(p, 0.3, 0.42) * (1 - windowed(p, 0.42, 0.44, 0.56, 0.6));
    const ka = karman.current;
    if (ka) {
      const o = 0.35 * windowed(p, 0.22, 0.27, 0.5, 0.56);
      ka.visible = o > 0.001;
      ka.material.opacity = o;
      ka.material.dashSize = 0.0031 * frame.dist;
      ka.material.gapSize = 0.0023 * frame.dist;
    }
  });

  return (
    <group>
      <mesh position={C} material={body}>
        <sphereGeometry args={[R, 192, 128]} />
      </mesh>
      <mesh ref={atmos} position={C} visible={false} renderOrder={-1}>
        <sphereGeometry args={[R * 1.045, 128, 96]} />
        <shaderMaterial ref={atmosMat} vertexShader={ATMOS_VERT} fragmentShader={ATMOS_FRAG} uniforms={uniforms} transparent depthWrite={false} side={FrontSide} />
      </mesh>
      <Line ref={karman} points={karmanPts} color="#0ea5e9" lineWidth={1} dashed dashSize={0.05} gapSize={0.035} transparent opacity={0} />
    </group>
  );
}
