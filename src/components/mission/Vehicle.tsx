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
  type MeshStandardMaterial,
  type Object3D,
  type PointLight,
} from "three";
import { channelFocus } from "../growth-engine/channelFocus";
import { CHANNELS, drawGlyph } from "../growth-engine/channels";
import { damp } from "../growth-engine/ease";
import { drawMark } from "../growth-engine/EngineCore";
import { glowFromWithin, materials, paintFade, palette, TONES } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { flameRamp, missionMaterials } from "./materials";
import { explodeArray, explodeCapsule, explodeModule, hingeAngle, latchAt, latched, MODULE_Y0, seg } from "./timeline";
import { boosterPose, PAD_TOP } from "./world";

// DVB-01. The Devable service module (black gloss, gold foil, the striped D on
// a glass plate) carries your devtool (the porcelain capsule) the whole way;
// four channel arrays hinge off its lower corners; the black launch stage with
// its emerald livery drops away at MECO.
// Units: module-local, origin at the module centre, +Y is the nose.

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const CAVITY = "#1a1d20";
const D2R = Math.PI / 180;
const PANEL = { w: 0.2, h: 0.9, t: 0.016, y: -0.49, z: 0.012 };
const TIP_Y = -0.94;
const CELLS_Z = PANEL.z + PANEL.t / 2 + 0.0015;
const ROLE = ["CONTENT", "SEARCH", "REDDIT", "CREATORS"];
const OFF = new Color("#23272c");
// Interim until the WS2 launcher: this model's module centre sits 2.1 above its base, the contract's at MODULE_Y0.
const SEAT = MODULE_Y0 - 2.1;
const seatAxis = new Vector3();

// ── Flame ────────────────────────────────────────────────────────────────
const FLAME_PROFILE = [
  [0, 0.02],
  [0.09, 0],
  [0.125, -0.1],
  [0.13, -0.3],
  [0.105, -0.6],
  [0.06, -0.9],
  [0.02, -1.1],
  [0, -1.16],
];
function flameGeometry() {
  const g = new LatheGeometry(
    FLAME_PROFILE.map(([r, y]) => new Vector2(r, y)),
    32,
  );
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 4);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const alpha = flameRamp(-pos.getY(i) / 1.16, c);
    c.toArray(colors, i * 4);
    colors[i * 4 + 3] = alpha;
  }
  g.setAttribute("color", new BufferAttribute(colors, 4));
  return g;
}
const coreGeometry = () =>
  new LatheGeometry(
    FLAME_PROFILE.map(([r, y]) => new Vector2(r * 0.55, y * 0.6)),
    24,
  );

/** The plume: a translucent colour lathe, a white-hot core and three shock diamonds drawn through it. */
function Flame({ flameRef, y }: { flameRef: (g: Group | null) => void; y: number }) {
  const geometry = useMemo(() => flameGeometry(), []);
  const core = useMemo(() => coreGeometry(), []);
  return (
    <group ref={flameRef} position-y={y} visible={false}>
      <mesh geometry={geometry} renderOrder={4}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      {/* Drawn after the plume (which writes no depth), so the core shows through it. */}
      <mesh geometry={core} renderOrder={5}>
        <meshBasicMaterial color="#fffbe8" transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {[-0.18, -0.32, -0.46].map((d) => (
        <mesh key={d} position-y={d} scale={[1, 1.8, 1]} renderOrder={5}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshBasicMaterial color="#fff3d0" transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
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
  for (let i = 0; i < 9; i++) {
    const x = -h * 0.06 + i * h * 0.03;
    ctx.beginPath();
    ctx.moveTo(x, -w * (i % 4 === 0 ? 0.2 : 0.1));
    ctx.lineTo(x, w * (i % 4 === 0 ? 0.2 : 0.1));
    ctx.stroke();
  }
  ctx.restore();
}

/** Capsule panel lines: four seams, a ring seam above the window and the payload stencil on the back. */
function drawCapsuleSkin(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "#d9d4c8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const u of [0.125, 0.375, 0.625, 0.875]) {
    ctx.moveTo(u * w, 0);
    ctx.lineTo(u * w, h);
  }
  ctx.moveTo(0, 0.4 * h);
  ctx.lineTo(w, 0.4 * h);
  ctx.stroke();
  ctx.fillStyle = "#16191d";
  ctx.font = `600 ${h * 0.075}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAYLOAD · YOUR DEVTOOL", 0.5 * w, 0.6 * h);
  ctx.restore();
}

/** Solar-cell grid: 2 × 9 cells with a highlight each, busbars and gaps in the channel's edge tone. */
function drawCells(i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const [cols, rows, pad] = [2, 9, 6];
    const [cw, ch] = [(w - 2 * pad) / cols, (h - 2 * pad) / rows];
    ctx.save();
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        const [x, y] = [pad + c * cw, pad + r * ch];
        const g = ctx.createLinearGradient(x, y, x + cw, y);
        g.addColorStop(0, "rgba(255,255,255,0.18)");
        g.addColorStop(0.45, "rgba(255,255,255,0.05)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (const k of [0.33, 0.66]) ctx.fillRect(x + cw * k - 1, y + 4, 2, ch - 8);
      }
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = TONES[i].edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      ctx.moveTo(pad + c * cw, pad);
      ctx.lineTo(pad + c * cw, h - pad);
    }
    for (let r = 0; r <= rows; r++) {
      ctx.moveTo(pad, pad + r * ch);
      ctx.lineTo(w - pad, pad + r * ch);
    }
    ctx.stroke();
    ctx.restore();
  };
}
const CELL_FACES = [0, 1, 2, 3].map(drawCells);

/** Root label: the channel glyph and "01 CONTENT" in its deep tone. */
function drawLabel(i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { deep, glyph, n } = CHANNELS[i];
    const font = palette().bodyFont;
    ctx.save();
    drawGlyph(ctx, glyph, h * 0.55, h / 2, h * 0.5, deep, font);
    const label = `${n} ${ROLE[i]}`;
    ctx.fillStyle = deep;
    ctx.font = `600 ${h * 0.4}px ${font}`;
    // Shrink to fit the plate after the glyph ("04 CREATORS" is the widest).
    const size = Math.min(h * 0.4, (h * 0.4 * (w - h * 1.05 - 16)) / ctx.measureText(label).width);
    ctx.font = `600 ${size}px ${font}`;
    ctx.textBaseline = "middle";
    ctx.fillText(label, h * 1.05, h * 0.53);
    ctx.restore();
  };
}
const LABELS = [0, 1, 2, 3].map(drawLabel);

/** A shallow parabolic dish with a little thickness, opening toward +Y. */
function dishGeometry(r: number, depth: number) {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 12; i++) pts.push(new Vector2((r * i) / 12, depth * (i / 12) ** 2));
  for (let i = 12; i >= 0; i--) pts.push(new Vector2((r * i) / 12, depth * (i / 12) ** 2 - 0.004 * (r / 0.085)));
  return new LatheGeometry(pts, 32);
}

// ── The vehicle ──────────────────────────────────────────────────────────
export default function Vehicle() {
  const frame = useMission();
  const m = materials();
  const mm = missionMaterials();
  const ink = palette().ink;
  const craft = useRef<Group>(null);
  const capsule = useRef<Group>(null);
  const booster = useRef<Group>(null);
  const seat = useRef<Group>(null);
  const status = useRef<MeshBasicMaterial>(null);
  const sheen = useRef<Mesh>(null);
  const sheenMat = useRef<MeshBasicMaterial>(null);
  const beacon = useRef<MeshStandardMaterial>(null);
  const stageFlame = useRef<Group | null>(null);
  const orbitFlame = useRef<Group | null>(null);
  const stageLight = useRef<PointLight>(null);
  const orbitLight = useRef<PointLight>(null);
  const hinges = useRef<(Group | null)[]>([]);
  const swings = useRef<(Group | null)[]>([]);
  const tips = useRef<(Object3D | null)[]>([]);
  const panels = useRef<(Mesh | null)[]>([]);
  const mats = useRef<(MeshPhysicalMaterial | null)[]>([]);
  const leds = useRef<(MeshStandardMaterial | null)[]>([]);
  const pips = useRef<(MeshStandardMaterial | null)[]>([]);
  const sheens = useRef<(Mesh | null)[]>([]);
  const sheenMats = useRef<(MeshBasicMaterial | null)[]>([]);
  const lift = useRef([0, 0, 0, 0]);
  const glow = useRef([0, 0, 0, 0]);
  const cursorOn = useRef(true);
  const scratch = useMemo(() => ({ q: new Quaternion(), v: new Vector3(), on: new Color("#34d399") }), []);
  const dish = useMemo(() => dishGeometry(0.085, 0.025), []);

  const mark = useCanvasTexture(1024, 1024, drawMark);
  const stencil = useCanvasTexture(128, 1024, drawStencil);
  const skin = useCanvasTexture(1024, 256, drawCapsuleSkin);
  const drawWindow = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
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
    ctx.restore();
  }, []);
  const screen = useCanvasTexture(512, 128, drawWindow);

  useLayoutEffect(() => {
    panels.current.forEach((panel, i) => {
      if (panel) paintFade(panel, CHANNELS[i].fade[1], CHANNELS[i].fade[0], PANEL.h, 0.35);
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
      g.position.addScaledVector(seatAxis.set(0, 1, 0).applyQuaternion(frame.quat), -SEAT * frame.scale);
      g.quaternion.copy(frame.quat);
      g.scale.setScalar(frame.scale);
    }
    if (capsule.current) capsule.current.position.y = 0.34 * ec + 0.012 * ec * Math.sin(1.1 * t + 2.1);
    if (beacon.current) beacon.current.emissiveIntensity = still || t % 1 < 0.5 ? 1.6 : 0.15;

    // Launch stage: seated while the module floats, then falls away at MECO.
    const b = booster.current;
    if (b) {
      const { v, q } = scratch;
      b.visible = boosterPose(p, v, q);
      if (b.visible) {
        const flying = p >= 0.125 && p < 0.355;
        b.position.copy(v).setY(v.y + (flying ? 0.012 * frame.scale * Math.sin(1.1 * t) : 0));
        b.quaternion.copy(q);
        b.position.addScaledVector(seatAxis.set(0, 1, 0).applyQuaternion(q), -SEAT * frame.scale);
        b.scale.setScalar(p < 0.355 ? frame.scale : 0.6);
      }
    }
    if (seat.current) seat.current.position.y = -0.16 * em;

    // Engines, and the warm light they throw.
    const flicker = 1 + 0.05 * Math.sin(31 * t) + 0.03 * Math.sin(17.3 * t);
    const flare = 1 + 0.03 * Math.sin(23 * t);
    const sf = stageFlame.current;
    const stageOn = p >= 0.1175 && p < 0.355;
    const grow = 0.2 + 0.8 * seg(p, 0.1175, 0.125);
    if (sf) {
      sf.visible = stageOn;
      const k = seg(p, 0.26, 0.34); // the plume widens in vacuum
      // Near the pad the plume is squashed to the gap (its full colour ramp stays in view), then stretches out.
      const gap = (frame.craft.y - 2.01 * frame.scale - PAD_TOP) / frame.scale;
      const len = p < 0.26 ? Math.min(1, Math.max(0.35, (gap + 0.3) / 1.16)) : 1;
      sf.scale.set(grow * flare * (1 + 1.2 * k), grow * flicker * len * (1 + 0.5 * k), grow * flare * (1 + 1.2 * k));
    }
    if (stageLight.current) {
      // Intensity 0 rather than hidden: toggling a light's visibility recompiles every material.
      stageLight.current.intensity = stageOn ? 1.6 * grow * flicker : 0;
    }
    const of = orbitFlame.current;
    const orbitOn = (p >= 0.37 && p < 0.4) || (p >= 0.826 && p < 0.84);
    if (of) {
      of.visible = orbitOn;
      of.scale.set(0.3 * flare, 0.3 * flicker, 0.3 * flare);
    }
    if (orbitLight.current) {
      orbitLight.current.intensity = orbitOn ? 0.3 * 1.6 * flicker : 0;
    }

    // Devable online: the status strip lights mint and a sheen crosses the D; it flashes at the burn.
    if (status.current) {
      const on = seg(p, 0.465, 0.475);
      const burn = p >= 0.825 && p < 0.84 ? Math.sin(Math.PI * seg(p, 0.825, 0.84)) : 0;
      status.current.color.lerpColors(OFF, scratch.on, on).multiplyScalar(1 + 0.6 * burn);
    }
    if (sheen.current && sheenMat.current) {
      const s = seg(p, 0.465, 0.48);
      sheen.current.visible = s > 0 && s < 1;
      sheen.current.position.x = -0.18 + 0.36 * s;
      sheenMat.current.opacity = Math.sin(Math.PI * s) * 0.3;
    }

    // The four channel arrays.
    for (let i = 0; i < 4; i++) {
      const h = hinges.current[i];
      const sw = swings.current[i];
      const ex = explodeArray(p, i);
      const focused = focus === i;
      lift.current[i] = still ? (focused ? 0.06 : 0) : damp(lift.current[i], focused ? 0.06 : 0, 10, dt);
      const at = latchAt(i);
      const on = latched(p, i);
      const target = (on ? 0.22 + 0.45 * (1 - seg(p, at, at + 0.012)) : 0) + (focused ? 0.3 : 0);
      glow.current[i] = still ? target : damp(glow.current[i], target, 10, dt);
      if (h) {
        const a = (-45 + 90 * i) * D2R;
        const r = 0.304 + 0.26 * ex;
        h.position.set(Math.sin(a) * r, -0.17 + 0.012 * ex * Math.sin(1.3 * t + 1.7 * i) + lift.current[i], Math.cos(a) * r);
      }
      if (sw) sw.rotation.x = -hingeAngle(p, i);
      const mat = mats.current[i];
      if (mat) mat.emissiveIntensity = glow.current[i];
      const led = leds.current[i];
      if (led) led.emissiveIntensity = on ? 1.4 : 0;
      const pip = pips.current[i];
      if (pip) pip.emissiveIntensity = on ? 1.4 : 0;
      // A sheen runs root to tip as the array latches.
      const s = seg(p, at, at + 0.02);
      const sh = sheens.current[i];
      if (sh) {
        sh.visible = s > 0 && s < 1;
        sh.position.y = -0.1 + (TIP_Y + 0.16) * s;
      }
      const shm = sheenMats.current[i];
      if (shm) shm.opacity = Math.sin(Math.PI * s) * 0.3;
    }

    // Tip positions for links, pearls and labels.
    if (g) {
      g.updateMatrixWorld(true);
      tips.current.forEach((tip, i) => {
        if (tip) frame.setTip(i, tip);
      });
    }

    // The capsule's prompt cursor blinks at 1 Hz.
    const cursor = still || t % 1 < 0.5;
    if (cursor !== cursorOn.current) {
      cursorOn.current = cursor;
      screen.paint();
    }
  }, -2);

  return (
    <group>
      <group ref={craft}>
        {/* Service module: black gloss, gold foil on the sides and back, the D on a glass plate. */}
        <RoundedBox args={[0.5, 0.34, 0.5]} radius={0.06} smoothness={5} material={mm.blackGloss} castShadow />
        <RoundedBox args={[0.4, 0.24, 0.006]} radius={0.002} smoothness={2} position={[0, 0.025, 0.2535]} material={mm.glassBlack} />
        <mesh position={[0, 0.025, 0.258]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial map={mark.texture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        {[
          [-0.19, 0.135],
          [0.19, 0.135],
          [-0.19, -0.085],
          [0.19, -0.085],
        ].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.2585]} rotation-x={Math.PI / 2} material={m.champagne}>
            <cylinderGeometry args={[0.006, 0.006, 0.004, 12]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.004, 0.26, 0.4]} radius={0.0015} smoothness={2} position={[s * 0.2525, 0, 0]} material={mm.goldFoil} />
        ))}
        <RoundedBox args={[0.4, 0.26, 0.004]} radius={0.0015} smoothness={2} position={[0, 0, -0.2525]} material={mm.goldFoil} />
        {/* Status bar and its four channel pips. */}
        <mesh position={[0, -0.125, 0.2505]} material={mm.glassBlack}>
          <boxGeometry args={[0.3, 0.014, 0.004]} />
        </mesh>
        <mesh position={[0, -0.125, 0.2545]}>
          <planeGeometry args={[0.28, 0.006]} />
          <meshBasicMaterial ref={status} color="#23272c" toneMapped={false} />
        </mesh>
        {CHANNELS.map((c, i) => (
          <mesh key={c.n} position={[-0.045 + 0.03 * i, -0.105, 0.2525]}>
            <sphereGeometry args={[0.006, 12, 8]} />
            <meshStandardMaterial
              ref={(mat: MeshStandardMaterial | null) => {
                pips.current[i] = mat;
              }}
              color="#23272c"
              roughness={0.3}
              emissive={c.color}
              emissiveIntensity={0}
              toneMapped={false}
            />
          </mesh>
        ))}
        <mesh ref={sheen} position={[0, 0.025, 0.2595]} visible={false}>
          <planeGeometry args={[0.08, 0.22]} />
          <meshBasicMaterial ref={sheenMat} color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* RCS quads on the four top corners, each with two nozzles pointing out. */}
        {[
          [1, 1],
          [1, -1],
          [-1, -1],
          [-1, 1],
        ].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[sx * 0.21, 0.13, sz * 0.21]}>
            <mesh material={m.alu}>
              <boxGeometry args={[0.035, 0.035, 0.035]} />
            </mesh>
            <mesh position-x={sx * 0.027} rotation-z={-sx * (Math.PI / 2)} material={m.champagne}>
              <cylinderGeometry args={[0.008, 0.003, 0.02, 12, 1, true]} />
            </mesh>
            <mesh position-z={sz * 0.027} rotation-x={sz * (Math.PI / 2)} material={m.champagne}>
              <cylinderGeometry args={[0.008, 0.003, 0.02, 12, 1, true]} />
            </mesh>
          </group>
        ))}
        {/* High-gain antenna off the back, and a star tracker on the top. */}
        <mesh position={[0, 0.06, -0.31]} rotation-x={Math.PI / 2} material={m.alu}>
          <cylinderGeometry args={[0.006, 0.006, 0.12, 10]} />
        </mesh>
        <mesh geometry={dish} position={[0, 0.06, -0.37]} rotation-x={-Math.PI / 2} material={m.porcelain} castShadow />
        <mesh position={[0, 0.06, -0.405]} rotation-x={Math.PI / 2} material={m.champagne}>
          <cylinderGeometry args={[0.002, 0.008, 0.02, 12]} />
        </mesh>
        <group position={[0.16, 0.175, 0.16]} rotation={[30 * D2R, 0, -30 * D2R]}>
          <mesh position-y={0.01} material={mm.glassBlack}>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 20]} />
          </mesh>
          <mesh position-y={0.028} material={mm.lens}>
            <sphereGeometry args={[0.018, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
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
        <pointLight ref={orbitLight} position-y={-0.3} color="#ff9d4d" distance={2.5} decay={2} intensity={0} />

        {/* Payload: your devtool, a porcelain capsule with a prompt in its window. */}
        <group ref={capsule}>
          <mesh position-y={0.164} material={mm.blackGloss}>
            <cylinderGeometry args={[0.212, 0.212, 0.01, 48]} />
          </mesh>
          <mesh position-y={0.1825} material={m.champagne} castShadow>
            <cylinderGeometry args={[0.215, 0.215, 0.025, 48]} />
          </mesh>
          <mesh position-y={0.34} material={m.porcelain} castShadow>
            <cylinderGeometry args={[0.1, 0.21, 0.34, 48]} />
            <Outlines thickness={1} color={ink} />
          </mesh>
          <mesh position-y={0.34}>
            <cylinderGeometry args={[0.1015, 0.2115, 0.34, 64, 1, true]} />
            <meshBasicMaterial map={skin.texture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position-y={0.32}>
            <cylinderGeometry args={[0.1548, 0.1742, 0.06, 24, 1, true, -0.6, 1.2]} />
            <meshBasicMaterial map={screen.texture} toneMapped={false} />
          </mesh>
          {/* Window bezel: champagne bands just above and below the glass. */}
          <mesh position-y={0.3535} material={m.champagne}>
            <cylinderGeometry args={[0.1546, 0.1565, 0.006, 24, 1, true, -0.66, 1.32]} />
          </mesh>
          <mesh position-y={0.2865} material={m.champagne}>
            <cylinderGeometry args={[0.1763, 0.1783, 0.006, 24, 1, true, -0.66, 1.32]} />
          </mesh>
          <mesh position-y={0.53} material={m.alu} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
          </mesh>
          <mesh position-y={0.56}>
            <sphereGeometry args={[0.012, 16, 10]} />
            <meshStandardMaterial ref={beacon} color="#23272c" emissive="#34d399" emissiveIntensity={1.6} toneMapped={false} />
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
              {/* Hinge knuckle and yoke. */}
              <mesh rotation-z={Math.PI / 2} position-z={PANEL.z} material={m.champagne}>
                <cylinderGeometry args={[0.014, 0.014, 0.05, 16]} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.022, -0.035, PANEL.z]} material={m.alu}>
                  <cylinderGeometry args={[0.006, 0.006, 0.07, 8]} />
                </mesh>
              ))}
              {/* Frame: an aluminium rim, so the lip shows on every edge and the back still shows the substrate's colour. */}
              {[-1, 1].map((s) => (
                <mesh key={`x${s}`} position={[s * 0.103, PANEL.y, PANEL.z - 0.001]} material={m.alu}>
                  <boxGeometry args={[0.006, 0.912, 0.018]} />
                </mesh>
              ))}
              {[-1, 1].map((s) => (
                <mesh key={`y${s}`} position={[0, PANEL.y + s * 0.453, PANEL.z - 0.001]} material={m.alu}>
                  <boxGeometry args={[0.212, 0.006, 0.018]} />
                </mesh>
              ))}
              <RoundedBox
                ref={(el: Mesh | null) => {
                  panels.current[i] = el;
                }}
                args={[PANEL.w, PANEL.h, PANEL.t]}
                radius={0.006}
                smoothness={3}
                position={[0, PANEL.y, PANEL.z]}
                castShadow
              >
                <meshPhysicalMaterial
                  ref={(mat: MeshPhysicalMaterial | null) => {
                    if (mat) glowFromWithin(mat);
                    mats.current[i] = mat;
                  }}
                  vertexColors
                  color="#ffffff"
                  roughness={0.28}
                  clearcoat={0.8}
                  clearcoatRoughness={0.12}
                  emissive={channel.color}
                  emissiveIntensity={0}
                />
              </RoundedBox>
              <ArrayFace index={i} />
              <mesh position={[0, TIP_Y + 0.025, CELLS_Z + 0.004]}>
                <sphereGeometry args={[0.012, 12, 8]} />
                <meshStandardMaterial
                  ref={(mat: MeshStandardMaterial | null) => {
                    leds.current[i] = mat;
                  }}
                  color="#23272c"
                  roughness={0.3}
                  emissive={channel.color}
                  emissiveIntensity={0}
                  toneMapped={false}
                />
              </mesh>
              <mesh
                ref={(el) => {
                  sheens.current[i] = el;
                }}
                position={[0, -0.1, CELLS_Z + 0.0015]}
                visible={false}
              >
                <planeGeometry args={[0.2, 0.12]} />
                <meshBasicMaterial
                  ref={(mat: MeshBasicMaterial | null) => {
                    sheenMats.current[i] = mat;
                  }}
                  color="#ffffff"
                  transparent
                  opacity={0}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <object3D
                ref={(el) => {
                  tips.current[i] = el;
                }}
                position={[0, TIP_Y, PANEL.z]}
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
          <mesh position-y={-1.0} material={mm.blackGloss} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 1.5, 64]} />
          </mesh>
          <mesh position-y={-0.32} material={mm.livery}>
            <cylinderGeometry args={[0.172, 0.172, 0.03, 64]} />
          </mesh>
          {[-0.55, -1.45].map((y) => (
            <mesh key={y} position-y={y} material={mm.graphite}>
              <cylinderGeometry args={[0.1715, 0.1715, 0.006, 64]} />
            </mesh>
          ))}
          <mesh position-y={-0.395}>
            <cylinderGeometry args={[0.1735, 0.1735, 0.09, 16, 1, true, -0.27, 0.54]} />
            <meshBasicMaterial map={mark.texture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position-y={-1.0}>
            <cylinderGeometry args={[0.173, 0.173, 1.2, 24, 1, true, -0.45, 0.9]} />
            <meshBasicMaterial map={stencil.texture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[-0.172, -1.0, 0]} material={mm.graphite}>
            <boxGeometry args={[0.014, 1.25, 0.018]} />
          </mesh>
          {/* Folded landing legs. */}
          {[45, 135, 225, 315].map((az) => (
            <group key={az} rotation-y={az * D2R}>
              <mesh position={[0, -1.55, 0.176]} material={mm.graphite} castShadow>
                <boxGeometry args={[0.02, 0.5, 0.012]} />
              </mesh>
              <mesh position={[0, -1.805, 0.185]} material={m.champagne}>
                <boxGeometry args={[0.05, 0.01, 0.03]} />
              </mesh>
            </group>
          ))}
          <mesh position-y={-1.81} material={mm.blackGloss} castShadow>
            <cylinderGeometry args={[0.17, 0.2, 0.12, 64]} />
          </mesh>
          <mesh position-y={-1.875} material={m.alu}>
            <cylinderGeometry args={[0.2, 0.2, 0.012, 64]} />
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
          <pointLight ref={stageLight} position-y={-2.06} color="#ff9d4d" distance={2.5} decay={2} intensity={0} />
        </group>
      </group>
    </group>
  );
}

/** Each array's face: the cell grid over the substrate, and the root label plate. */
function ArrayFace({ index }: { index: number }) {
  const m = materials();
  const cells = useCanvasTexture(256, 1152, CELL_FACES[index]);
  const label = useCanvasTexture(512, 160, LABELS[index]);
  // Deployed, the label runs root-ward; arrays 02 and 03 point to screen right in every
  // camera pose after the deploy, so theirs run the other way to stay upright.
  const turn = index === 1 || index === 2 ? -Math.PI / 2 : Math.PI / 2;
  return (
    <>
      <mesh position={[0, PANEL.y, CELLS_Z]}>
        <planeGeometry args={[PANEL.w, PANEL.h]} />
        <meshBasicMaterial map={cells.texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group position={[0, -0.16, CELLS_Z + 0.0075]} rotation-z={turn}>
        <RoundedBox args={[0.18, 0.06, 0.01]} radius={0.004} smoothness={2} material={m.panelTint[index]} />
        <mesh position-z={0.0065}>
          <planeGeometry args={[0.18, 0.05625]} />
          <meshBasicMaterial map={label.texture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
