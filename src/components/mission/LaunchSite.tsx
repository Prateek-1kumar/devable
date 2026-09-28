import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import {
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Object3D,
  QuadraticBezierCurve3,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type ShaderMaterial,
  type Texture,
} from "three";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { noiseTexture } from "./Smoke";
import { clampsOpen, CUT_P, MODULE_Y0, seg, skyHorizonLinear, strongbackTilt, VEHICLE_BASE } from "./timeline";
import { craftPosition, craftQuaternion, mulberry32, PLINTH_H, sunDir } from "./world";

// Pad 01 in pad units (1 u ≈ 16.7 m), the ground at y 0: a concrete hardstand fading into scrub and
// then into the haze of the CSS sky, the launch mount (two plinth blocks either side of the flame
// trench, hold-down clamps), the graphite strongback that tilts back before ignition, four lightning
// masts with their catenary wires, a distant water tower, and the exhaust trail the vehicle lays.

const D2R = Math.PI / 180;
const BODY_R = 0.145;

// ── Ground ───────────────────────────────────────────────────────────────
const SPAN = 40; // the painted ground canvas covers ±20 u around the pad
const SCRUB_A = "#6f7155";
const SCRUB_B = "#8a8a67";

function drawGround(ctx: CanvasRenderingContext2D, w: number) {
  const K = w / SPAN;
  const rand = mulberry32(23);
  ctx.save();
  ctx.clearRect(0, 0, w, w);
  ctx.translate(w / 2, w / 2); // canvas x = world x, canvas y = world z
  // Scrub out to 20 u, fading out from 16 u (the shader's tiled scrub continues beyond).
  ctx.fillStyle = "#7c7d5e";
  ctx.beginPath();
  ctx.arc(0, 0, 20 * K, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 2600; i++) {
    const a = rand() * Math.PI * 2;
    const r = (10 + rand() * 10) * K;
    ctx.fillStyle = rand() < 0.5 ? SCRUB_A : SCRUB_B;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, (0.1 + rand() * 0.35) * K, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createRadialGradient(0, 0, 16 * K, 0, 0, 20 * K);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(-w / 2, -w / 2, w, w);
  ctx.globalCompositeOperation = "source-over";
  // The concrete hardstand: an octagon with low-contrast stains and expansion joints.
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * 11.5 * K, Math.sin(a) * 11.5 * K);
  }
  ctx.closePath();
  ctx.fillStyle = "#cfccc5";
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 140; i++) {
    const [x, y, r] = [(rand() * 2 - 1) * 11 * K, (rand() * 2 - 1) * 11 * K, (0.4 + rand() * 2.2) * K];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand() < 0.7;
    g.addColorStop(0, dark ? "rgba(70,64,56,0.07)" : "rgba(255,255,250,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  ctx.strokeStyle = "rgba(60,56,50,0.12)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = -11; k <= 11; k += 1.5) {
    ctx.moveTo(k * K, -12 * K);
    ctx.lineTo(k * K, 12 * K);
    ctx.moveTo(-12 * K, k * K);
    ctx.lineTo(12 * K, k * K);
  }
  ctx.stroke();
  ctx.restore();
  // Darker, sootier apron ring around the mount.
  const apron = ctx.createRadialGradient(0, 0, 0.4 * K, 0, 0, 2.4 * K);
  apron.addColorStop(0, "rgba(60,55,48,0.22)");
  apron.addColorStop(0.8, "rgba(60,55,48,0.12)");
  apron.addColorStop(1, "rgba(60,55,48,0)");
  ctx.fillStyle = apron;
  ctx.beginPath();
  ctx.arc(0, 0, 2.4 * K, 0, Math.PI * 2);
  ctx.fill();
  // The flame trench slots along ±X, with soot fans at their mouths.
  ctx.fillStyle = "#23221f";
  ctx.fillRect(-1.7 * K, -0.25 * K, 3.4 * K, 0.5 * K);
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx * 1.7 * K, -0.25 * K);
    ctx.lineTo(sx * 6 * K, -2.6 * K);
    ctx.lineTo(sx * 6 * K, 2.6 * K);
    ctx.lineTo(sx * 1.7 * K, 0.25 * K);
    ctx.closePath();
    ctx.clip();
    const soot = ctx.createRadialGradient(sx * 1.7 * K, 0, 0, sx * 1.7 * K, 0, 4.4 * K);
    soot.addColorStop(0, "rgba(38,34,30,0.55)");
    soot.addColorStop(0.5, "rgba(38,34,30,0.2)");
    soot.addColorStop(1, "rgba(38,34,30,0)");
    ctx.fillStyle = soot;
    ctx.fillRect(-7 * K, -3 * K, 14 * K, 6 * K);
    ctx.restore();
  }
  ctx.restore();
}

/** Ground: the painted pad over tiled scrub, alpha out over 40–200 u (the fog carries it into the CSS horizon). */
function groundMaterial(pad: Texture) {
  const m = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, transparent: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uPad = { value: pad };
    shader.uniforms.uNoise = { value: noiseTexture() };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGW;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGW;\nuniform sampler2D uPad, uNoise;")
      .replace(
        "#include <map_fragment>",
        `vec4 pc = texture2D(uPad, vec2(vGW.x / ${SPAN.toFixed(1)} + .5, .5 - vGW.z / ${SPAN.toFixed(1)}));
         float nz = texture2D(uNoise, vGW.xz * .23).r * .45 + texture2D(uNoise, vGW.xz * .031).r * .35 + texture2D(uNoise, vGW.xz * 1.3).r * .2;
         vec3 scrub = mix(vec3(.159, .162, .095), vec3(.254, .254, .136), smoothstep(.3, .7, nz));
         diffuseColor.rgb *= mix(scrub, pc.rgb * (.9 + .2 * nz), pc.a);
         diffuseColor.a *= 1. - smoothstep(40., 200., length(vGW.xz));`,
      );
  };
  return m;
}

// ── Strongback ───────────────────────────────────────────────────────────
const SB = { w: 0.28, d: 0.22, h: 4.3, bays: 15, member: 0.018 };
/** Where the strongback stands: behind the vehicle from the camera, a little to screen-left, its face 0.24 off the body. */
const SB_AT = new Vector3(-0.388, PLINTH_H, -0.303);
const SB_YAW = Math.atan2(-SB_AT.x, -SB_AT.z);
const SB_REACH = Math.hypot(SB_AT.x, SB_AT.z); // truss centre → vehicle axis
/** Clamp arms, at pad-world heights on the body (first stage, interstage, second stage). */
const ARMS = [1.4, 2.8, 3.5];

/** Truss members as instance matrices: four chords, ring members at every bay and X-bracing on all four faces. */
function trussMatrices(mesh: InstancedMesh) {
  const [a, b] = [SB.w / 2 - 0.01, SB.d / 2 - 0.01];
  const corners = [
    [-a, -b],
    [a, -b],
    [a, b],
    [-a, b],
  ];
  const o = new Object3D();
  const up = new Vector3(0, 1, 0);
  const [p0, p1, d] = [new Vector3(), new Vector3(), new Vector3()];
  let n = 0;
  const member = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, t: number) => {
    p0.set(x0, y0, z0);
    p1.set(x1, y1, z1);
    d.subVectors(p1, p0);
    o.position.addVectors(p0, p1).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(up, d.clone().normalize());
    o.scale.set(t, d.length(), t);
    o.updateMatrix();
    mesh.setMatrixAt(n++, o.matrix);
  };
  const bay = SB.h / SB.bays;
  for (const [x, z] of corners) member(x, 0, z, x, SB.h, z, SB.member * 1.4);
  for (let k = 0; k <= SB.bays; k++)
    for (let f = 0; f < 4; f++) {
      const [c0, c1] = [corners[f], corners[(f + 1) % 4]];
      member(c0[0], k * bay, c0[1], c1[0], k * bay, c1[1], SB.member);
    }
  // X-bracing on the front and back faces only: under the long lens both project onto one clean lattice.
  for (let k = 0; k < SB.bays; k++)
    for (const f of [0, 2]) {
      const [c0, c1] = [corners[f], corners[(f + 1) % 4]];
      member(c0[0], k * bay, c0[1], c1[0], (k + 1) * bay, c1[1], SB.member * 0.7);
      member(c1[0], k * bay, c1[1], c0[0], (k + 1) * bay, c0[1], SB.member * 0.7);
    }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
}
const TRUSS_COUNT = 4 + (SB.bays + 1) * 4 + SB.bays * 4;

/** A drooping umbilical from the truss face to the body (strongback-local). */
function hose(yFrom: number, yTo: number, x: number) {
  const start = new Vector3(x, yFrom, SB.d / 2);
  const end = new Vector3(x * 0.3, yTo, SB_REACH - BODY_R - 0.003);
  const mid = start.clone().lerp(end, 0.5).add(new Vector3(0, -0.22, 0));
  return new TubeGeometry(new QuadraticBezierCurve3(start, mid, end), 20, 0.011, 8, false);
}

// ── Masts and wires ──────────────────────────────────────────────────────
/** The mast square (±5.2) sits behind the pad from the camera, so no mast or wire crosses the copy column. */
const MAST_C = [3, -6] as const;
const MASTS = [
  [5.2, 5.2],
  [-5.2, 5.2],
  [-5.2, -5.2],
  [5.2, -5.2],
].map(([x, z]) => [MAST_C[0] + x, MAST_C[1] + z] as const);
const MAST_H = 7.2;
/** Every catenary span as line-segment pairs: each cap to its two neighbours and to two ground anchors. */
function wirePoints() {
  const pts: [number, number, number][] = [];
  const span = (a: Vector3, b: Vector3, sag: number) => {
    let prev: [number, number, number] | null = null;
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const q: [number, number, number] = [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t), a.z + (b.z - a.z) * t];
      if (prev) pts.push(prev, q);
      prev = q;
    }
  };
  MASTS.forEach(([x, z], i) => {
    const cap = new Vector3(x, MAST_H, z);
    const [nx, nz] = MASTS[(i + 1) % 4];
    span(cap, new Vector3(nx, MAST_H, nz), 0.7);
    // Guy anchors fan out away from the camera and to screen-right, so no wire runs down across the copy.
    for (const a of [150, 190]) {
      const [ax, az] = [Math.sin(a * D2R), Math.cos(a * D2R)];
      span(cap, new Vector3(x + ax * 4.5, 0, z + az * 4.5), 0.12);
    }
  });
  return pts;
}

// ── Exhaust trail ────────────────────────────────────────────────────────
const TRAIL = { from: 0.125, to: CUT_P, samples: 80, segs: 180, radial: 12 };
const TRAIL_VERT = /* glsl */ `
  attribute float aLaid;
  uniform float uP, uFogDensity;
  uniform vec3 uWind;
  varying float vLaid, vAge, vFog, vAng;
  varying vec3 vNw, vNv, vV;
  void main() {
    vec3 c = position - normal;
    float age = clamp((uP - aLaid) / ${(TRAIL.to - TRAIL.from).toFixed(3)}, 0., 1.);
    float h = clamp(c.y / 70., 0., 1.);
    float rad = mix(.15, .6, sqrt(age)) * (.8 + .5 * h);
    vec3 p = c + normal * rad + uWind * 1.5 * age * (.35 + .65 * h);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vLaid = aLaid;
    vAge = age;
    vAng = uv.y;
    vNw = normal;
    vNv = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    vFog = 1. - exp(-uFogDensity * uFogDensity * mv.z * mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const TRAIL_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uSun, uLit, uShade, uHaze;
  uniform float uP, uTs, uFade;
  varying float vLaid, vAge, vFog, vAng;
  varying vec3 vNw, vNv, vV;
  void main() {
    if (vLaid > uP - .0012) discard;
    float facing = abs(dot(normalize(vNv), normalize(vV)));
    float along = vLaid / ${(TRAIL.to - TRAIL.from).toFixed(3)};
    float n = texture2D(uNoise, vec2(along * 20. - uTs * .04, vAng * 2.)).r * .6 + texture2D(uNoise, vec2(along * 55., vAng * 3. + .3)).r * .4;
    float a = pow(facing, 1.5) * (.35 + 1.1 * n) * smoothstep(0., .05, vAge) * .55 * uFade;
    float hl = .5 + .5 * dot(normalize(vNw), uSun);
    vec3 col = mix(uShade, uLit, hl);
    col = mix(col, uHaze, vFog);
    gl_FragColor = vec4(col, clamp(a, 0., 1.));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** The flown bell path over the pad climb as a unit-radius tube, each ring tagged with the p it was laid at. */
function trailGeometry() {
  const bell = new Vector3(0, -(MODULE_Y0 - VEHICLE_BASE), 0);
  const [pos, q] = [new Vector3(), craftQuaternion(0)];
  const pts: Vector3[] = [];
  const ps: number[] = [];
  for (let i = 0; i <= TRAIL.samples; i++) {
    const p = TRAIL.from + ((TRAIL.to - 1e-4 - TRAIL.from) * i) / TRAIL.samples;
    craftPosition(p, pos);
    craftQuaternion(p, q);
    pts.push(bell.clone().applyQuaternion(q).add(pos));
    ps.push(p);
  }
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = lens[lens.length - 1];
  const g = new TubeGeometry(new CatmullRomCurve3(pts), TRAIL.segs, 1, TRAIL.radial, false);
  const laid = new Float32Array(g.attributes.position.count);
  for (let i = 0; i <= TRAIL.segs; i++) {
    const L = (total * i) / TRAIL.segs;
    let j = 0;
    while (j < lens.length - 2 && lens[j + 1] < L) j++;
    const t = (L - lens[j]) / Math.max(1e-6, lens[j + 1] - lens[j]);
    const p = ps[j] + (ps[j + 1] - ps[j]) * t;
    for (let k = 0; k <= TRAIL.radial; k++) laid[i * (TRAIL.radial + 1) + k] = p;
  }
  g.setAttribute("aLaid", new Float32BufferAttribute(laid, 1));
  return g;
}

const lin = (hex: string) => new Color(hex);
const sun = new Vector3();

export default function LaunchSite() {
  const frame = useMission();
  const strongback = useRef<Group>(null);
  const clamps = useRef<(Group | null)[]>([]);
  const truss = useRef<InstancedMesh>(null);
  const trail = useRef<ShaderMaterial>(null);
  const trailMesh = useRef<Group>(null);
  const padTex = useCanvasTexture(2048, 2048, drawGround);
  const ground = useMemo(() => groundMaterial(padTex.texture), [padTex.texture]);
  const hoses = useMemo(() => [hose(2.72, 2.62, -0.07), hose(3.3, 3.2, 0.07)], []);
  const wires = useMemo(() => wirePoints(), []);
  const trailGeo = useMemo(() => trailGeometry(), []);
  const trailUniforms = useMemo(
    () => ({
      uNoise: { value: noiseTexture() },
      uP: { value: 0 },
      uTs: { value: 0 },
      uFade: { value: 1 },
      uFogDensity: { value: 0.009 },
      uWind: { value: new Vector3(0.55, 0, -0.83) },
      uSun: { value: new Vector3(0, 1, 0) },
      uLit: { value: lin("#f3eee6") },
      uShade: { value: lin("#8a97a8") },
      uHaze: { value: new Color() },
    }),
    [],
  );

  useLayoutEffect(() => {
    if (truss.current) trussMatrices(truss.current);
  }, []);
  useLayoutEffect(() => () => ground.dispose(), [ground]);

  useFrame(() => {
    const p = frame.p;
    if (strongback.current) strongback.current.rotation.x = -strongbackTilt(p);
    const open = clampsOpen(p);
    clamps.current.forEach((c, i) => {
      if (c) c.rotation.x = (i < 2 ? 1 : -1) * 25 * D2R * open;
    });
    const m = trail.current;
    if (m && trailMesh.current) {
      trailMesh.current.visible = p > TRAIL.from + 0.002 && p < CUT_P;
      const u = m.uniforms;
      u.uP.value = p;
      u.uTs.value = ((p - 0.117) / (0.26 - 0.117)) * 10;
      // The trail thins out with the air before the cut, so the cut never pops it away.
      u.uFade.value = 1 - seg(p, 0.245, 0.266);
      (u.uSun.value as Vector3).copy(sunDir(p, sun));
      const [r, g, b] = skyHorizonLinear(p);
      (u.uHaze.value as Color).setRGB(r, g, b);
    }
  });

  const graphite = { color: "#2b2f33", metalness: 0.6, roughness: 0.55 } as const;
  const concrete = { color: "#bdbab3", roughness: 0.9 } as const;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={ground} receiveShadow>
        <circleGeometry args={[600, 64]} />
      </mesh>

      {/* Launch mount: two plinth blocks either side of the flame trench, and its soot-black floor. */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[1.6, PLINTH_H, 0.63]} radius={0.02} smoothness={2} position={[0, PLINTH_H / 2, s * 0.485]} castShadow receiveShadow>
          <meshStandardMaterial {...concrete} />
        </RoundedBox>
      ))}
      <mesh position-y={0.004} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1.6, 0.34]} />
        <meshStandardMaterial color="#1c1b1a" roughness={1} />
      </mesh>
      {/* Hold-down clamps on the block edges, gripping the skirt; they tip outward at release. */}
      {[
        [0.075, 1],
        [-0.075, 1],
        [0.075, -1],
        [-0.075, -1],
      ].map(([x, s], i) => (
        <group
          key={i}
          ref={(g) => {
            clamps.current[i] = g;
          }}
          position={[x, PLINTH_H, s * 0.23]}
        >
          <mesh position-y={0.06} castShadow>
            <boxGeometry args={[0.045, 0.12, 0.05]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <mesh position={[0, 0.105, -s * 0.035]} castShadow>
            <boxGeometry args={[0.04, 0.028, 0.075]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
        </group>
      ))}

      {/* Strongback: graphite truss, clamp arms with cradles, two umbilicals; it tilts back about its base. */}
      <group position={SB_AT} rotation-y={SB_YAW}>
        <group ref={strongback}>
          <instancedMesh ref={truss} args={[undefined, undefined, TRUSS_COUNT]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial {...graphite} />
          </instancedMesh>
          {ARMS.map((y) => {
            const ly = y - PLINTH_H;
            const len = SB_REACH - BODY_R - 0.012 - SB.d / 2;
            return (
              <group key={y}>
                <mesh position={[0, ly, SB.d / 2 + len / 2]} castShadow>
                  <boxGeometry args={[0.035, 0.03, len]} />
                  <meshStandardMaterial {...graphite} />
                </mesh>
                <mesh position={[0, ly, SB_REACH]} rotation-x={-Math.PI / 2} castShadow>
                  <torusGeometry args={[BODY_R + 0.009, 0.007, 6, 28, Math.PI]} />
                  <meshStandardMaterial {...graphite} />
                </mesh>
              </group>
            );
          })}
          {hoses.map((g, i) => (
            <mesh key={i} geometry={g} castShadow>
              <meshStandardMaterial color="#141516" roughness={0.6} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Lightning masts and their catenary wires (one draw), faint in the haze. */}
      {MASTS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position-y={MAST_H / 2}>
            <cylinderGeometry args={[0.02, 0.032, MAST_H, 10]} />
            <meshStandardMaterial {...graphite} color="#737a82" />
          </mesh>
          <mesh position-y={MAST_H + 0.08}>
            <coneGeometry args={[0.045, 0.16, 10]} />
            <meshStandardMaterial {...graphite} color="#737a82" />
          </mesh>
        </group>
      ))}
      <Line points={wires} segments color="#3a3f45" lineWidth={1} transparent opacity={0.45} depthWrite={false} />

      {/* The water tower, far back: the haze makes it read as distance. */}
      <group position={[-62, 0, -93]}>
        <mesh position-y={5}>
          <sphereGeometry args={[1.1, 32, 20]} />
          <meshStandardMaterial color="#e9e9e6" roughness={0.6} />
        </mesh>
        {[
          [0.7, 0.7],
          [-0.7, 0.7],
          [-0.7, -0.7],
          [0.7, -0.7],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * 0.85, 2.3, z * 0.85]} rotation={[z * -0.06, 0, x * 0.06]}>
            <cylinderGeometry args={[0.06, 0.08, 4.8, 8]} />
            <meshStandardMaterial color="#d8d8d4" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Exhaust trail: the flown path as a soft sheared column, lit warm on the sun side. */}
      <group ref={trailMesh} visible={false}>
        <mesh geometry={trailGeo} renderOrder={2} frustumCulled={false}>
          <shaderMaterial ref={trail} vertexShader={TRAIL_VERT} fragmentShader={TRAIL_FRAG} uniforms={trailUniforms} transparent depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
