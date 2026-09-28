import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import {
  BackSide,
  BufferAttribute,
  Color,
  DoubleSide,
  LatheGeometry,
  Quaternion,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshPhysicalMaterial,
  type Object3D,
} from "three";
import { channelFocus } from "../growth-engine/channelFocus";
import { CHANNELS } from "../growth-engine/channels";
import { damp } from "../growth-engine/ease";
import { drawMark } from "../growth-engine/EngineCore";
import { glowFromWithin, materials, paintFade, palette, TONES } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { explodeArray, explodeCapsule, explodeModule, hingeAngle, latched, seg } from "./timeline";
import { boosterPose } from "./world";

// DVB-01. The Devable service module (black, the striped D) carries your
// devtool (the porcelain capsule) the whole way; four channel arrays hinge off
// its lower corners; the black launch stage below drops away at MECO.
// Units: module-local, origin at the module centre, +Y is the nose.

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const BLACK = "#0b0c0e";
const CAVITY = "#1a1d20";
const D2R = Math.PI / 180;
const PANEL = { w: 0.16, h: 0.85, t: 0.018 };
const ROLE = ["CONTENT", "SEARCH", "REDDIT", "CREATORS"];

/** Shared black gloss for the module and the stage. */
function BlackGloss() {
  return <meshPhysicalMaterial color={BLACK} roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} />;
}

// ── Flame ────────────────────────────────────────────────────────────────
const FLAME_STOPS: [number, string][] = [
  [0, "#fff8ee"],
  [0.16, "#ffe2c2"],
  [0.5, "#ffb07a"],
  [0.8, "#ffcfa6"],
  [1, "#ffeede"],
];
function flameGeometry() {
  const profile = [
    [0, 0.02],
    [0.09, 0],
    [0.125, -0.1],
    [0.13, -0.3],
    [0.105, -0.6],
    [0.06, -0.9],
    [0.02, -1.1],
    [0, -1.16],
  ].map(([r, y]) => new Vector2(r, y));
  const g = new LatheGeometry(profile, 32);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const stops = FLAME_STOPS.map(([t, c]) => [t, new Color(c)] as const);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, -pos.getY(i) / 1.16));
    let j = 0;
    while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
    const [[t0, c0], [t1, c1]] = [stops[j], stops[j + 1]];
    c.lerpColors(c0, c1, (t - t0) / (t1 - t0));
    c.toArray(colors, i * 3);
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  return g;
}

function Flame({ flameRef, y }: { flameRef: (m: Mesh | null) => void; y: number }) {
  const geometry = useMemo(() => flameGeometry(), []);
  return (
    <mesh ref={flameRef} geometry={geometry} position-y={y} visible={false}>
      <meshBasicMaterial vertexColors toneMapped={false} side={DoubleSide} />
    </mesh>
  );
}

// ── Canvas faces ─────────────────────────────────────────────────────────
function drawStencil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 2); // reads top to bottom, like a stage stencil
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.textBaseline = "middle";
  ctx.font = `600 ${w * 0.42}px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("DVB‑01", -h * 0.44, 0);
  ctx.font = `500 ${w * 0.2}px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText("LAUNCH STAGE", h * 0.44, 0);
  // Ticks between the two words.
  for (let i = 0; i < 9; i++) {
    const x = -h * 0.06 + i * h * 0.03;
    ctx.beginPath();
    ctx.moveTo(x, -w * (i % 4 === 0 ? 0.2 : 0.1));
    ctx.lineTo(x, w * (i % 4 === 0 ? 0.2 : 0.1));
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrayFace(i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { color, deep, n } = CHANNELS[i];
    ctx.save();
    // A 12 × 2 cell grid in white hairlines, like a solar array.
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    const [cols, rows] = [12, 2];
    const [x0, x1, y0, y1] = [w * 0.3, w - 8, 8, h - 8];
    ctx.beginPath();
    for (let c = 1; c < cols; c++) {
      const x = x0 + ((x1 - x0) * c) / cols;
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
    }
    for (let r = 1; r < rows; r++) {
      const y = y0 + ((y1 - y0) * r) / rows;
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    ctx.fillStyle = deep;
    ctx.font = `600 ${h * 0.34}px ${MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillText(`${n} · ${ROLE[i]}`, w * 0.035, h / 2);
    ctx.restore();
  };
}
const ARRAY_FACES = [0, 1, 2, 3].map(drawArrayFace);

// ── The vehicle ──────────────────────────────────────────────────────────
export default function Vehicle() {
  const frame = useMission();
  const m = materials();
  const ink = palette().ink;
  const craft = useRef<Group>(null);
  const capsule = useRef<Group>(null);
  const booster = useRef<Group>(null);
  const seat = useRef<Group>(null);
  const status = useRef<MeshBasicMaterial>(null);
  const sheen = useRef<Mesh>(null);
  const sheenMat = useRef<MeshBasicMaterial>(null);
  const stageFlame = useRef<Mesh | null>(null);
  const orbitFlame = useRef<Mesh | null>(null);
  const hinges = useRef<(Group | null)[]>([]);
  const swings = useRef<(Group | null)[]>([]);
  const tips = useRef<(Object3D | null)[]>([]);
  const panels = useRef<(Mesh | null)[]>([]);
  const mats = useRef<(MeshPhysicalMaterial | null)[]>([]);
  const lift = useRef([0, 0, 0, 0]);
  const glow = useRef([0, 0, 0, 0]);
  const cursorOn = useRef(true);
  const scratch = useMemo(() => ({ q: new Quaternion(), v: new Vector3(), off: new Color("#23272c"), on: new Color("#34d399") }), []);

  const mark = useCanvasTexture(1024, 1024, drawMark);
  const stencil = useCanvasTexture(128, 1024, drawStencil);
  const drawWindow = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#0d1012";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e8ece9";
    ctx.font = `500 ${h * 0.46}px ${MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillText("$", w * 0.3, h * 0.54);
    if (cursorOn.current) {
      ctx.fillStyle = "#34d399";
      ctx.fillRect(w * 0.3 + h * 0.42, h * 0.3, h * 0.24, h * 0.44);
    }
  }, []);
  const screen = useCanvasTexture(512, 128, drawWindow);

  useLayoutEffect(() => {
    panels.current.forEach((panel, i) => {
      if (panel) paintFade(panel, CHANNELS[i].fade[1], CHANNELS[i].fade[0], PANEL.h);
    });
  }, []);

  useFrame((_, delta) => {
    const { p, t, still } = frame;
    const dt = Math.min(delta, 1 / 20);
    const em = explodeModule(p);
    const ec = explodeCapsule(p);
    const focus = channelFocus.get();

    const g = craft.current;
    if (g) {
      const bob = 0.012 * frame.scale * Math.sin(1.1 * t) * (p < 0.125 ? em : 1);
      g.position.copy(frame.craft).setY(frame.craft.y + bob);
      g.quaternion.copy(frame.quat);
      g.scale.setScalar(frame.scale);
    }
    if (capsule.current) capsule.current.position.y = 0.34 * ec + 0.012 * ec * Math.sin(1.1 * t + 2.1);

    // Launch stage: seated while the module floats, then falls away at MECO.
    const b = booster.current;
    if (b) {
      const { v, q } = scratch;
      b.visible = boosterPose(p, v, q);
      if (b.visible) {
        const flying = p >= 0.125 && p < 0.355;
        b.position.copy(v).setY(v.y + (flying ? 0.012 * frame.scale * Math.sin(1.1 * t) : 0));
        b.quaternion.copy(q);
        b.scale.setScalar(p < 0.355 ? frame.scale : 0.6);
      }
    }
    if (seat.current) seat.current.position.y = -0.16 * em;

    // Engines.
    const flicker = 1 + 0.05 * Math.sin(31 * t) + 0.03 * Math.sin(17.3 * t);
    const flare = 1 + 0.03 * Math.sin(23 * t);
    const sf = stageFlame.current;
    if (sf) {
      sf.visible = p >= 0.1175 && p < 0.355;
      const grow = 0.2 + 0.8 * seg(p, 0.1175, 0.125);
      const k = seg(p, 0.26, 0.34); // the plume widens in vacuum
      sf.scale.set(grow * flare * (1 + 1.2 * k), grow * flicker * (1 + 0.5 * k), grow * flare * (1 + 1.2 * k));
    }
    const of = orbitFlame.current;
    if (of) {
      of.visible = (p >= 0.37 && p < 0.4) || (p >= 0.826 && p < 0.84);
      of.scale.set(0.3 * flare, 0.3 * flicker, 0.3 * flare);
    }

    // Devable online: the status line lights emerald and a sheen crosses the D; it flashes at the burn.
    if (status.current) {
      const on = seg(p, 0.465, 0.475);
      const burn = p >= 0.825 && p < 0.84 ? Math.sin(Math.PI * seg(p, 0.825, 0.84)) : 0;
      status.current.color.lerpColors(scratch.off, scratch.on, on).multiplyScalar(1 + 0.6 * burn);
    }
    if (sheen.current && sheenMat.current) {
      const s = seg(p, 0.465, 0.48);
      sheen.current.visible = s > 0 && s < 1;
      sheen.current.position.x = -0.2 + 0.4 * s;
      sheenMat.current.opacity = Math.sin(Math.PI * s) * 0.25;
    }

    // The four channel arrays.
    for (let i = 0; i < 4; i++) {
      const h = hinges.current[i];
      const sw = swings.current[i];
      const ex = explodeArray(p, i);
      const focused = focus === i;
      lift.current[i] = still ? (focused ? 0.06 : 0) : damp(lift.current[i], focused ? 0.06 : 0, 10, dt);
      const latchAt = 0.505 + 0.012 * i;
      const target = (latched(p, i) ? 0.22 + 0.45 * (1 - seg(p, latchAt, latchAt + 0.012)) : 0) + (focused ? 0.3 : 0);
      glow.current[i] = still ? target : damp(glow.current[i], target, 10, dt);
      if (h) {
        const a = (-45 + 90 * i) * D2R;
        const r = 0.304 + 0.26 * ex;
        h.position.set(Math.sin(a) * r, -0.17 + 0.012 * ex * Math.sin(1.3 * t + 1.7 * i) + lift.current[i], Math.cos(a) * r);
      }
      if (sw) sw.rotation.x = -hingeAngle(p, i);
      const mat = mats.current[i];
      if (mat) mat.emissiveIntensity = glow.current[i];
    }

    // Tip positions for links, pearls and labels.
    if (g) {
      g.updateMatrixWorld(true);
      tips.current.forEach((tip, i) => {
        if (tip) frame.setTip(i, tip);
      });
    }

    // The capsule's prompt cursor blinks at 1 Hz.
    const on = still || t % 1 < 0.5;
    if (on !== cursorOn.current) {
      cursorOn.current = on;
      screen.paint();
    }
  }, -2);

  return (
    <group>
      <group ref={craft}>
        {/* Service module: the Devable mark. */}
        <RoundedBox args={[0.5, 0.34, 0.5]} radius={0.06} smoothness={5} castShadow>
          <BlackGloss />
        </RoundedBox>
        <mesh position={[0, 0.01, 0.2535]}>
          <planeGeometry args={[0.34, 0.34]} />
          <meshBasicMaterial map={mark.texture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.125, 0.2505]}>
          <boxGeometry args={[0.28, 0.01, 0.004]} />
          <meshBasicMaterial ref={status} color="#23272c" toneMapped={false} />
        </mesh>
        <mesh ref={sheen} position={[0, 0.005, 0.2545]} visible={false}>
          <planeGeometry args={[0.08, 0.22]} />
          <meshBasicMaterial ref={sheenMat} color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* Orbital engine, hidden inside the stage adapter until separation. */}
        <group position-y={-0.21}>
          <mesh material={m.champagne}>
            <cylinderGeometry args={[0.035, 0.065, 0.08, 24, 1, true]} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.035, 0.065, 0.08, 24, 1, true]} />
            <meshStandardMaterial color={CAVITY} roughness={0.6} side={BackSide} />
          </mesh>
        </group>
        <Flame
          y={-0.25}
          flameRef={(el) => {
            orbitFlame.current = el;
          }}
        />

        {/* Payload: your devtool, a porcelain capsule with a prompt in its window. */}
        <group ref={capsule}>
          <mesh position-y={0.1825} material={m.champagne} castShadow>
            <cylinderGeometry args={[0.215, 0.215, 0.025, 48]} />
          </mesh>
          <mesh position-y={0.34} material={m.porcelain} castShadow>
            <cylinderGeometry args={[0.1, 0.21, 0.34, 48]} />
            <Outlines thickness={1} color={ink} />
          </mesh>
          <mesh position-y={0.32}>
            <cylinderGeometry args={[0.1548, 0.1742, 0.06, 24, 1, true, -0.6, 1.2]} />
            <meshBasicMaterial map={screen.texture} toneMapped={false} />
          </mesh>
          <mesh position-y={0.53} material={m.alu} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
          </mesh>
        </group>

        {/* Channel arrays: stowed like strakes, deployed as an X. */}
        {CHANNELS.map((channel, i) => (
          <group
            key={channel.n}
            ref={(el) => {
              hinges.current[i] = el;
            }}
            rotation-y={(-45 + 90 * i) * D2R}
          >
            <group
              ref={(el) => {
                swings.current[i] = el;
              }}
            >
              <mesh position-y={-0.02} material={m.alu}>
                <cylinderGeometry args={[0.01, 0.01, 0.04, 12]} />
              </mesh>
              <RoundedBox
                ref={(el: Mesh | null) => {
                  panels.current[i] = el;
                }}
                args={[PANEL.w, PANEL.h, PANEL.t]}
                radius={0.007}
                smoothness={3}
                position={[0, -0.465, 0.012]}
                castShadow
              >
                <meshPhysicalMaterial
                  ref={(mat: MeshPhysicalMaterial | null) => {
                    if (mat) glowFromWithin(mat);
                    mats.current[i] = mat;
                  }}
                  vertexColors
                  color="#ffffff"
                  roughness={0.45}
                  clearcoat={0.35}
                  clearcoatRoughness={0.2}
                  emissive={channel.color}
                  emissiveIntensity={0}
                />
                <Outlines thickness={1} color={TONES[i].edge} />
              </RoundedBox>
              <ArrayFace index={i} />
              <object3D
                ref={(el) => {
                  tips.current[i] = el;
                }}
                position={[0, -0.89, 0.012]}
              />
            </group>
          </group>
        ))}
      </group>

      {/* Launch stage: a sibling, so separation never re-parents anything. */}
      <group ref={booster}>
        <group ref={seat}>
          <mesh position-y={-0.21} material={m.champagne} castShadow>
            <cylinderGeometry args={[0.24, 0.17, 0.08, 64]} />
          </mesh>
          <mesh position-y={-1.0} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 1.5, 64]} />
            <BlackGloss />
          </mesh>
          <mesh position-y={-1.0}>
            <cylinderGeometry args={[0.173, 0.173, 1.2, 24, 1, true, -0.45, 0.9]} />
            <meshBasicMaterial map={stencil.texture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position-y={-1.81} castShadow>
            <cylinderGeometry args={[0.17, 0.2, 0.12, 64]} />
            <BlackGloss />
          </mesh>
          <mesh position-y={-1.94} material={m.champagne}>
            <cylinderGeometry args={[0.05, 0.11, 0.14, 32, 1, true]} />
          </mesh>
          <mesh position-y={-1.94}>
            <cylinderGeometry args={[0.05, 0.11, 0.14, 32, 1, true]} />
            <meshStandardMaterial color={CAVITY} roughness={0.6} side={BackSide} />
          </mesh>
          <Flame
            y={-2.01}
            flameRef={(el) => {
              stageFlame.current = el;
            }}
          />
        </group>
      </group>
    </group>
  );
}

/** Each array's face: a cell grid, a channel-coloured border and its number. */
function ArrayFace({ index }: { index: number }) {
  const face = useCanvasTexture(1024, 176, ARRAY_FACES[index]);
  return (
    <mesh position={[0, -0.465, 0.012 + PANEL.t / 2 + 0.002]} rotation-z={Math.PI / 2}>
      <planeGeometry args={[0.82, 0.14]} />
      <meshBasicMaterial map={face.texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
