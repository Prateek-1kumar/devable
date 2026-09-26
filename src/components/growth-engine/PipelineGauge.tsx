import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { LatheGeometry, Vector2, type Group, type Mesh } from "three";
import { FACING_YAW, GAUGE_DIAL as DIAL, GAUGE_POSITION } from "./layout";
import { INK_PX, materials, palette } from "./palette";
import { INTRO_LEADS, clamp01, easeOutBack, useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// The progress arc runs clockwise around the rim with its gap at the bottom,
// where the tether plugs in. Angles are canvas angles (y down).
const ARC = { from: (3 * Math.PI) / 4, sweep: (3 * Math.PI) / 2, radius: 0.43 }; // radius as a share of the face texture
const FACE_RADIUS = DIAL.radius - 0.08;

/** A soap-bar puck profile: flat faces, filleted rim, spun into a solid of revolution. */
function puckGeometry() {
  const { radius: r, depth: d, fillet: f } = DIAL;
  const pts = [new Vector2(0, d / 2), new Vector2(r - f, d / 2)];
  for (let i = 1; i <= 8; i++) {
    const a = (Math.PI / 2) * (1 - i / 8);
    pts.push(new Vector2(r - f + f * Math.cos(a), d / 2 - f + f * Math.sin(a)));
  }
  for (let i = 0; i <= 8; i++) {
    const a = -(Math.PI / 2) * (i / 8);
    pts.push(new Vector2(r - f + f * Math.cos(a), -d / 2 + f + f * Math.sin(a)));
  }
  pts.push(new Vector2(0, -d / 2));
  // Lathe normals face outward when the profile runs bottom → top.
  return new LatheGeometry(pts.reverse(), 96);
}

/** Round PIPELINE dial: counts leads up as pearls land, with an amber arc filling around the rim. */
export default function PipelineGauge() {
  const story = useStory();
  const p = palette();
  const group = useRef<Group>(null);
  const tip = useRef<Mesh>(null);
  const view = useRef({ leads: 0, drawn: 0 });
  const puck = useMemo(() => puckGeometry(), []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number) => {
      const { leads, drawn } = view.current;
      const c = w / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = p.ink;

      // Arc track, then the filled part.
      ctx.lineCap = "round";
      ctx.lineWidth = w * 0.03;
      ctx.strokeStyle = p.stone;
      ctx.beginPath();
      ctx.arc(c, c, w * ARC.radius, ARC.from, ARC.from + ARC.sweep);
      ctx.stroke();
      if (drawn > 0) {
        ctx.strokeStyle = p.amber;
        ctx.beginPath();
        ctx.arc(c, c, w * ARC.radius, ARC.from, ARC.from + ARC.sweep * drawn);
        ctx.stroke();
      }

      ctx.font = `600 ${w * 0.2}px ${p.headingFont}`;
      ctx.fillText(`+${Math.round(leads).toLocaleString("en-US")}`, c, w * 0.54);
      ctx.font = `500 ${w * 0.07}px ${p.bodyFont}`;
      ctx.fillText("leads", c, w * 0.65);
    },
    [p],
  );
  const face = useCanvasTexture(1024, 1024, draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const appear = story.gaugeIn(t);
    if (group.current) {
      group.current.visible = appear > 0;
      group.current.scale.setScalar(Math.max(1e-4, easeOutBack(appear)));
    }

    const leads = Math.round(story.count(t));
    const drawn = Math.round(clamp01(leads / INTRO_LEADS) * 120) / 120;
    if (leads === view.current.leads && drawn === view.current.drawn) return;
    view.current = { leads, drawn };
    face.paint();

    // A 3D amber pearl rides the tip of the arc.
    if (tip.current) {
      const angle = ARC.from + ARC.sweep * drawn;
      const r = ARC.radius * 2 * FACE_RADIUS;
      tip.current.visible = drawn > 0;
      tip.current.position.set(r * Math.cos(angle), -r * Math.sin(angle), DIAL.depth / 2 + 0.04);
    }
  });

  return (
    <group ref={group} position={GAUGE_POSITION} rotation-y={FACING_YAW} visible={false}>
      <mesh geometry={puck} rotation-x={Math.PI / 2} material={materials().ceramic} castShadow>
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
      <mesh position-z={DIAL.depth / 2 + 0.002}>
        <circleGeometry args={[FACE_RADIUS, 96]} />
        <meshBasicMaterial map={face.texture} transparent toneMapped={false} />
      </mesh>
      <mesh ref={tip} material={materials().pearl} visible={false}>
        <sphereGeometry args={[0.055, 24, 18]} />
      </mesh>
      {/* Nub where the tether from the core attaches. */}
      <mesh position-y={-DIAL.radius - 0.06} material={materials().ceramic} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 24]} />
        <Outlines thickness={INK_PX} color={p.ink} />
      </mesh>
    </group>
  );
}
