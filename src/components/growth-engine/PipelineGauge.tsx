import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { CHANNELS } from "./channels";
import { FACING_YAW, GAUGE_DIAL as DIAL, GAUGE_POSITION } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { INTRO_LEADS, clamp01, easeOutBack, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// A slim LCD panel, a sibling of the devtool terminal. Its bottom edge sits
// where the old dial's did, so the tether still plugs into the nub below.
const W = 2.3;
const H = 1.25;
const D = DIAL.depth;
const BEZEL = 0.12;
const TEX = { w: 1024, h: Math.round((1024 * (H - 2 * BEZEL)) / (W - 2 * BEZEL)) };
const TILT = -0.3; // radians the panel leans back from its base, so the screen faces up at the viewer
// The sparkline's fixed path (x, y in 0..1, y up): a steady climb with small dips.
// It draws itself left to right as the intro's leads land, then stays whole.
const PATH = [
  [0, 0.05], [0.1, 0.14], [0.2, 0.1], [0.3, 0.28], [0.4, 0.24],
  [0.5, 0.45], [0.6, 0.4], [0.7, 0.62], [0.8, 0.58], [0.9, 0.8], [1, 0.95],
];

/** PIPELINE readout: lead count plus a stacked, channel-colored area that climbs as pearls land. */
export default function PipelineGauge() {
  const story = useStory();
  const p = palette();
  const m = materials();
  const group = useRef<Group>(null);
  const view = useRef({ leads: 0, drawn: 0, by: [0, 0, 0, 0] });
  const counts = useRef([0, 0, 0, 0]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const { leads, drawn, by } = view.current;
      const pad = w * 0.06;
      ctx.textBaseline = "alphabetic";

      // Header: label left, live dot right.
      ctx.font = `500 ${h * 0.085}px ${p.bodyFont}`;
      ctx.fillStyle = p.cream;
      ctx.globalAlpha = 0.55;
      ctx.fillText("PIPELINE", pad, pad + h * 0.07);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.live;
      ctx.beginPath();
      ctx.arc(w - pad - h * 0.025, pad + h * 0.045, h * 0.025, 0, Math.PI * 2);
      ctx.fill();

      // Count.
      ctx.fillStyle = p.cream;
      ctx.font = `600 ${h * 0.26}px ${p.headingFont}`;
      const num = `+${Math.round(leads).toLocaleString("en-US")}`;
      ctx.fillText(num, pad, h * 0.47);
      ctx.font = `500 ${h * 0.085}px ${p.bodyFont}`;
      ctx.globalAlpha = 0.55;
      ctx.fillText("leads", pad, h * 0.6);
      ctx.globalAlpha = 1;

      // The fixed PATH (0..1 in both axes), cut off at `drawn` with an interpolated tip.
      const line = PATH.filter(([x]) => x < drawn);
      const n = PATH.findIndex(([x]) => x >= drawn);
      if (n > 0) {
        const [x0, y0] = PATH[n - 1];
        const [x1, y1] = PATH[n];
        line.push([drawn, y0 + ((y1 - y0) * (drawn - x0)) / (x1 - x0)]);
      } else line.push(PATH[0]); // nothing landed yet: just the start dot
      const top = h * 0.66;
      const bottom = h - pad;
      const X = (x: number) => pad + (w - 2 * pad) * x;
      const Y = (y: number) => bottom - (bottom - top) * y;

      // Stacked area: one band per channel, 01 at the bottom like the stack,
      // each as thick as that channel's share of the leads so far.
      if (leads > 0 && line.length > 1) {
        let below = 0;
        CHANNELS.forEach((channel, k) => {
          const above = below + by[k] / leads;
          ctx.beginPath();
          line.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y * above)) : ctx.moveTo(X(x), Y(y * above))));
          for (let i = line.length - 1; i >= 0; i--) ctx.lineTo(X(line[i][0]), Y(line[i][1] * below));
          ctx.closePath();
          ctx.fillStyle = channel.color;
          ctx.globalAlpha = 0.92;
          ctx.fill();
          below = above;
        });
        ctx.globalAlpha = 1;
      }

      // White edge along the total, and the tip.
      ctx.beginPath();
      line.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      ctx.strokeStyle = p.signal;
      ctx.lineWidth = h * 0.012;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      const [tx, ty] = line[line.length - 1];
      ctx.beginPath();
      ctx.arc(X(tx), Y(ty), h * 0.026, 0, Math.PI * 2);
      ctx.fillStyle = p.signal;
      ctx.fill();
    },
    [p],
  );
  const screen = useCanvasTexture(TEX.w, TEX.h, draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const appear = story.gaugeIn(t);
    if (group.current) {
      group.current.visible = appear > 0;
      group.current.scale.setScalar(Math.max(1e-4, easeOutBack(appear)));
    }

    const by = story.countBy(t, counts.current);
    const leads = Math.round(by.reduce((a, b) => a + b, 0));
    if (leads === view.current.leads) return;
    view.current = { leads, drawn: clamp01(leads / INTRO_LEADS), by: [...by] };
    screen.paint();
  });

  return (
    <group ref={group} position={GAUGE_POSITION} rotation-y={FACING_YAW} visible={false}>
      {/* Hinged at its bottom edge so the tether nub stays put. */}
      <group position-y={-DIAL.radius} rotation-x={TILT}>
        <RoundedBox args={[W, H, D]} radius={0.1} smoothness={4} position-y={H / 2} material={m.porcelain} castShadow>
          <Outlines thickness={INK_PX} color={p.ink} />
        </RoundedBox>
        {/* Champagne frame, then the glass inset in it. RoundedBox radius must stay under half the thinnest side, or the box swells over the screen. */}
        <RoundedBox args={[W - BEZEL * 1.4 + 0.05, H - BEZEL * 1.4 + 0.05, 0.024]} radius={0.011} smoothness={3} position={[0, H / 2, D / 2]} material={m.champagne} />
        <RoundedBox args={[W - BEZEL * 1.4, H - BEZEL * 1.4, 0.02]} radius={0.05} smoothness={3} position={[0, H / 2, D / 2 + 0.004]} material={m.glass} />
        <mesh position={[0, H / 2, D / 2 + 0.016]}>
          <planeGeometry args={[W - 2 * BEZEL, H - 2 * BEZEL]} />
          <meshBasicMaterial map={screen.texture} transparent toneMapped={false} />
        </mesh>
      </group>
      {/* Nub where the tether from the core attaches. */}
      <mesh position-y={-DIAL.radius - 0.06} material={m.champagne} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 24]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
    </group>
  );
}
