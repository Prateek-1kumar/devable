import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import {
  Color,
  CubicBezierCurve3,
  CurvePath,
  LineCurve3,
  Object3D,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type MeshBasicMaterial,
} from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { CHIP } from "./EngineCore";
import { FACING_YAW, STACK_TOP, onScreen } from "./layout";
import { materials, palette } from "./palette";
import { clamp01, easeOutBack, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the story ends: the chip's own display. Once the top block lands, the
// Devable chip reaches out a glossy black arm (its own material) from its back
// edge, growing along its path: back over the top block, a sweep right and up
// into a neck, where the growth screen then rises from its hinge. Chip and
// screen read as one object. Once the chip powers up, emerald energy streams
// along the arm. Then the leads ride the arm up into the screen and become the
// chart: each one flies from where the arm enters onto the chart's tip, in its
// channel's color, and the curve grows one step as it merges, the figure
// counting up. By the time the intro's leads have landed, pipeline growth
// stands as a hockey stick in the four block colors.

const PANEL = { w: 2.1, h: 1.25, d: 0.07 };
const TILT = -0.08; // leans back slightly
const TEX = {
  w: 1024,
  h: Math.round((1024 * (PANEL.h - 0.08)) / (PANEL.w - 0.08)),
};
const GROWTH = 312; // % shown once the chart has drawn
const MAX_PEARLS = 48;
const ENERGY = "#34d399";
const INK = "#0b0c0e"; // the chip's black
// The block colors in stack order (periwinkle → sky → mint → apricot).
const STOPS = CHANNELS.map(({ fade }) => fade[0]);

// ── The arm: out of the chip's back edge, back over the block, a sweep, then up the neck ──
const ARM_R = 0.075;
const Y0 = STACK_TOP + 0.005 + CHIP.h / 2; // the chip's mid-height
const ROOT = new Vector3(0.31, Y0, -CHIP.w / 2 + 0.05); // starts inside the package
const BACK = new Vector3(0.31, Y0, -1.75);
const BEND = new Vector3(0.9, Y0 + 0.28, -2.9);
const NECK = new Vector3(0.9, Y0 + 0.55, -2.9); // top of the neck: the screen's hinge
const ARM = new CurvePath<Vector3>();
ARM.add(new LineCurve3(ROOT, BACK));
ARM.add(new CubicBezierCurve3(BACK, BACK.clone().setZ(-2.5), BEND.clone().setY(Y0), BEND));
ARM.add(new LineCurve3(BEND, NECK));
// The energy line rides the arm's camera-facing, upper side.
const FACE = onScreen(0, 0, 1)
  .multiplyScalar(ARM_R * 0.85)
  .add(new Vector3(0, ARM_R * 0.45, 0));

// The chart's shape: a true hockey stick with a few small, fixed wobbles so it reads as real data.
const growth = (x: number) => {
  const base = (Math.exp(3.1 * x) - 1) / (Math.exp(3.1) - 1);
  return clamp01(base + Math.sin(x * 19) * 0.012 * (1 - x) + Math.sin(x * 7.3) * 0.01);
};

export default function GrowthScreen() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const arm = useMemo(() => new TubeGeometry(ARM, 140, ARM_R, 20, false), []);
  useEffect(() => () => arm.dispose(), [arm]);
  const energyPoints = useMemo(() => ARM.getSpacedPoints(160).map((pt) => pt.add(FACE)), []);
  const view = useRef({
    r: -1,
    flare: 0,
    flying: [] as { k: number; color: string }[],
  });
  const flow = useRef<Line2>(null);
  const led = useRef<MeshBasicMaterial>(null);
  const display = useRef<Group>(null);
  const pearls = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tints = useMemo(() => CHANNELS.map(({ color }) => new Color(color)), []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const { r, flare, flying } = view.current;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#12151a");
      bg.addColorStop(1, "#0a0c0f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const pad = w * 0.06;
      // Label and the growth figure.
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `500 ${h * 0.055}px ${p.bodyFont}`;
      ctx.letterSpacing = `${h * 0.004}px`;
      ctx.fillText("Pipeline growth", pad, pad + h * 0.05);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${h * 0.16}px ${p.bodyFont}`;
      ctx.fillText(`+${Math.round(GROWTH * Math.max(0, r))}%`, pad, pad + h * 0.23);

      // Chart area with faint grid lines.
      const left = pad;
      const right = w - pad;
      const top = h * 0.36;
      const bottom = h - pad;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      for (let i = 0; i <= 3; i++) {
        const y = top + ((bottom - top) * i) / 3;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }
      const X = (x: number) => left + (right - left) * x;
      const Y = (x: number) => bottom - (bottom - top) * growth(x);
      const steps = Math.max(2, Math.round(160 * r));
      const tx = X(r);
      const ty = Y(r);
      if (r > 0.001) drawChart();
      // Leads arriving, on top: each flies from where the arm enters (bottom middle) onto the tip, in its channel's color.
      const from = { x: w / 2, y: h - pad * 0.2 };
      for (const { k, color } of flying) {
        const e = k * k * (3 - 2 * k);
        const x = from.x + (tx - from.x) * e;
        const y = from.y + (ty - from.y) * e - Math.sin(Math.PI * e) * h * 0.08;
        const halo = ctx.createRadialGradient(x, y, 0, x, y, h * 0.045);
        halo.addColorStop(0, color);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, h * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, h * 0.013, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawChart() {
        const across = ctx.createLinearGradient(left, 0, right, 0);
        STOPS.forEach((color, i) => across.addColorStop(i / (STOPS.length - 1), color));

        // Area under the curve, fading down.
        ctx.beginPath();
        ctx.moveTo(X(0), bottom);
        for (let i = 0; i <= steps; i++) ctx.lineTo(X((r * i) / steps), Y((r * i) / steps));
        ctx.lineTo(X(r), bottom);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = across;
        ctx.globalAlpha = 0.28;
        ctx.fillRect(left, top - h * 0.1, right - left, bottom - top + h * 0.1);
        const fade = ctx.createLinearGradient(0, top, 0, bottom);
        fade.addColorStop(0, "rgba(10,12,15,0)");
        fade.addColorStop(1, "rgba(10,12,15,1)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = fade;
        ctx.fillRect(left, top - h * 0.1, right - left, bottom - top + h * 0.1);
        ctx.restore();

        // The line.
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const x = (r * i) / steps;
          if (i) ctx.lineTo(X(x), Y(x));
          else ctx.moveTo(X(x), Y(x));
        }
        ctx.strokeStyle = across;
        ctx.lineWidth = h * 0.012;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();

        // The tip: a white dot in a soft glow that flares as leads arrive.
        const glowR = h * (0.06 + 0.05 * Math.max(0, flare));
        const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, glowR);
        glow.addColorStop(0, "rgba(255,255,255,0.9)");
        glow.addColorStop(0.3, "rgba(255,190,140,0.45)");
        glow.addColorStop(1, "rgba(255,176,122,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tx, ty, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(tx, ty, h * 0.014, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [p],
  );
  const screen = useCanvasTexture(TEX.w, TEX.h, draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const r = story.built(t); // the chart is as far along as the leads that have landed

    // After the chip lands, its arm grows out along its path, then the screen rises onto the neck.
    const grown = easeOutCubic(story.armIn(t));
    arm.setDrawRange(0, Math.floor(((arm.index?.count ?? 0) * grown) / 6) * 6);
    const up = story.screenIn(t);
    if (display.current) {
      display.current.visible = up > 0;
      display.current.scale.setScalar(Math.max(1e-4, easeOutBack(up)));
    }

    // Energy streams along the arm once the chip is powered.
    const power = story.powerIn(t);
    const surge = story.core(t);
    if (flow.current) {
      flow.current.material.opacity = power * (0.65 + surge * 0.35);
      flow.current.material.dashOffset = -t * (0.45 + surge * 1.4);
    }
    if (led.current) led.current.opacity = 0.2 + power * 0.8;

    // Leads ride the arm up into the screen.
    let i = 0;
    const mesh = pearls.current;
    story.leads(t, (token, q) => {
      if (!mesh || i >= MAX_PEARLS) return;
      ARM.getPointAt(q, dummy.position).add(FACE);
      dummy.scale.setScalar(Math.min(1, q / 0.04, (1 - q) / 0.04));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i++, tints[token]);
    });
    if (mesh) {
      mesh.count = i;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // On the screen: leads flying onto the tip, which flares as each merges.
    const flying: { k: number; color: string }[] = [];
    let flare = 0;
    story.landing(t, (token, k) => {
      flying.push({ k, color: CHANNELS[token].color });
      flare = Math.max(flare, clamp01((k - 0.6) / 0.4));
    });

    // Repaint while leads are landing or the chart has moved; skip idle frames.
    const v = view.current;
    const rq = Math.round(r * 400) / 400;
    if (flying.length || v.flying.length || rq !== v.r) {
      view.current = { r: rq, flare, flying };
      screen.paint();
    }
  });

  return (
    <group>
      {/* The chip's arm, in the chip's own glossy black. */}
      <mesh geometry={arm} castShadow>
        <meshPhysicalMaterial color={INK} roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <Line ref={flow} points={energyPoints} color={ENERGY} lineWidth={2.4} dashed dashSize={0.09} gapSize={0.08} transparent opacity={0} />
      <instancedMesh ref={pearls} args={[undefined, undefined, MAX_PEARLS]} frustumCulled={false}>
        <sphereGeometry args={[0.042, 16, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* The hinge at the top of the neck, and the screen it holds, facing the camera. */}
      <group ref={display} position={NECK} rotation-y={FACING_YAW} visible={false}>
        <RoundedBox args={[0.3, 0.12, 0.2]} radius={0.04} smoothness={3} castShadow>
          <meshPhysicalMaterial color={INK} roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} />
        </RoundedBox>
        {/* Power light on the hinge. */}
        <mesh position={[0, 0, 0.101]}>
          <circleGeometry args={[0.022, 20]} />
          <meshBasicMaterial ref={led} color={ENERGY} transparent opacity={0.2} toneMapped={false} />
        </mesh>
        <group position-y={0.06} rotation-x={TILT}>
          <RoundedBox
            args={[PANEL.w + 0.04, PANEL.h + 0.04, PANEL.d - 0.02]}
            radius={0.02}
            smoothness={3}
            position-y={PANEL.h / 2}
            material={m.alu}
            castShadow
          />
          <RoundedBox args={[PANEL.w, PANEL.h, PANEL.d]} radius={0.03} smoothness={3} position={[0, PANEL.h / 2, 0.012]} castShadow>
            <meshPhysicalMaterial color="#111317" roughness={0.3} clearcoat={1} clearcoatRoughness={0.06} />
          </RoundedBox>
          <mesh position={[0, PANEL.h / 2, 0.012 + PANEL.d / 2 + 0.002]}>
            <planeGeometry args={[PANEL.w - 0.08, PANEL.h - 0.08]} />
            <meshBasicMaterial map={screen.texture} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
