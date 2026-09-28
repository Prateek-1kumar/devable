import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CatmullRomCurve3, Color, CurvePath, LineCurve3, Object3D, TubeGeometry, Vector3, type InstancedMesh } from "three";
import { CHANNELS } from "./channels";
import { FACING_YAW, LAYER, onScreen } from "./layout";
import { materials, palette } from "./palette";
import { clamp01, easeOutCubic, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the story ends: the output. A slim graphite display on an aluminum
// stand behind the stack's right side, mirroring the terminal on the left
// (your tool goes in, growth comes out). An output cable leaves the stack's
// back-right side, runs the floor to the stand and climbs into the screen.
// The screen shows pipeline growth: a hockey-stick area chart in the four block
// colors that draws on once the last slab lands, with the figure counting up;
// then leads travel the cable into it and the chart's tip flares as they arrive.

const STAND = onScreen(3.6, 0, -2.6); // floor point of the stand, right of and behind the stack
const POLE = 0.95; // screen bottom height
const PANEL = { w: 2.3, h: 1.4, d: 0.07 };
const TILT = -0.08; // leans back slightly
const TEX = { w: 1024, h: Math.round((1024 * (PANEL.h - 0.08)) / (PANEL.w - 0.08)) };
const GROWTH = 312; // % shown once the chart has drawn
const CABLE_R = 0.05;
const MAX_PEARLS = 48;
// The block colors in stack order (periwinkle → sky → mint → apricot).
const STOPS = CHANNELS.map(({ fade }) => fade[0]);

// The output cable: out of the back of the base, along the floor, into the stand, up the pole.
const FROM = new Vector3(STAND.x - 0.2, CABLE_R, -LAYER.baseWidth / 2);
const CABLE = new CatmullRomCurve3([
  FROM,
  FROM.clone().add(new Vector3(0, 0, -0.5)),
  new Vector3(STAND.x - 0.05, CABLE_R, (FROM.z + STAND.z) / 2),
  new Vector3(STAND.x, CABLE_R, STAND.z + 0.45),
  new Vector3(STAND.x, CABLE_R, STAND.z + 0.12),
]);
const RISER = new LineCurve3(new Vector3(STAND.x, CABLE_R, STAND.z + 0.12), new Vector3(STAND.x, POLE, STAND.z + 0.12));
const FEED = new CurvePath<Vector3>();
FEED.add(CABLE);
FEED.add(RISER);

// The chart's shape: a true hockey stick with a few small, fixed wobbles so it reads as real data.
const growth = (x: number) => {
  const base = (Math.exp(3.1 * x) - 1) / (Math.exp(3.1) - 1);
  return clamp01(base + Math.sin(x * 19) * 0.012 * (1 - x) + Math.sin(x * 7.3) * 0.01);
};

export default function GrowthScreen() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const cable = useMemo(() => new TubeGeometry(CABLE, 90, CABLE_R, 12, false), []);
  useEffect(() => () => cable.dispose(), [cable]);
  const view = useRef({ r: -1, flare: -1 });
  const pearls = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tints = useMemo(() => CHANNELS.map(({ color }) => new Color(color)), []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const { r, flare } = view.current;
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
      if (r <= 0) return;

      const X = (x: number) => left + (right - left) * x;
      const Y = (x: number) => bottom - (bottom - top) * growth(x);
      const steps = Math.max(2, Math.round(160 * r));
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
      const tx = X(r);
      const ty = Y(r);
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
    },
    [p],
  );
  const screen = useCanvasTexture(TEX.w, TEX.h, draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const r = easeOutCubic(story.growthIn(t));

    // Leads travel the cable up into the screen; the tip flares as they arrive.
    let flare = 0;
    let i = 0;
    const mesh = pearls.current;
    story.leads(t, (token, q) => {
      if (!mesh || i >= MAX_PEARLS) return;
      FEED.getPointAt(q, dummy.position);
      dummy.scale.setScalar(Math.min(1, q / 0.04, (1 - q) / 0.04));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i++, tints[token]);
      flare = Math.max(flare, clamp01((q - 0.85) / 0.15));
    });
    if (mesh) {
      mesh.count = i;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // Repaint only when what the screen shows has changed.
    const v = view.current;
    const rq = Math.round(r * 200) / 200;
    const fq = Math.round(flare * 20) / 20;
    if (rq !== v.r || fq !== v.flare) {
      view.current = { r: rq, flare: fq };
      screen.paint();
    }
  });

  return (
    <group>
      {/* Output cable, floor to pole. */}
      <mesh geometry={cable} material={m.stone} castShadow receiveShadow />
      <instancedMesh ref={pearls} args={[undefined, undefined, MAX_PEARLS]} frustumCulled={false}>
        <sphereGeometry args={[CABLE_R * 1.25, 16, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <group position={[STAND.x, 0, STAND.z]}>
        {/* Stand: a round foot and a slim pole, brushed aluminum. */}
        <mesh position-y={0.015} material={m.alu} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.36, 0.03, 48]} />
        </mesh>
        <mesh position={[0, POLE / 2, 0.12]} material={m.alu} castShadow>
          <cylinderGeometry args={[0.035, 0.035, POLE, 16]} />
        </mesh>

        {/* The display, facing the camera and leaning back a touch. */}
        <group position={[0, POLE, 0.12]} rotation-y={FACING_YAW}>
          <group rotation-x={TILT}>
            <RoundedBox args={[PANEL.w + 0.04, PANEL.h + 0.04, PANEL.d - 0.02]} radius={0.02} smoothness={3} position-y={PANEL.h / 2} material={m.alu} castShadow />
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
    </group>
  );
}
