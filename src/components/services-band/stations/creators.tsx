import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line, Outlines } from "@react-three/drei";
import {
  Color,
  Object3D,
  Vector3,
  type Group,
  type InstancedMesh,
} from "three";
import type { Line2 } from "three-stdlib";
import { span, storyOf } from "../content";
import {
  Badge,
  Print,
  Shadow,
  Solid,
  block,
  colors,
  cylinder,
  easeOut,
  panel,
  paragraph,
  pop,
  rrect,
  setFont,
  useBand,
  useLive,
  type BadgeMark,
} from "../kit";
import { AT } from "../layout";

// Beat 4, Creator Distribution. ① A creator developers trust posts about your product. ② Its reach ripples
// out across the floor; each audience it meets lights up, and its platform (X, LinkedIn, YouTube) pops up
// over it. ③ The post's impressions count up.

type Ctx = CanvasRenderingContext2D;

const PHONE = { w: 1.35, h: 2.5, t: 0.12, lift: 0.28 };
const POST = {
  name: "Alex Chen",
  handle: "@alexbuilds · AI engineer",
  body: [
    "Been testing ",
    "Your Product",
    " for a month. It nails complex layouts.",
  ],
};

function drawPost(ctx: Ctx, w: number, h: number, views: number) {
  const c = colors();
  const k = w / 370;
  ctx.save();
  ctx.scale(k, k);
  const W = 370;
  const H = h / k;
  rrect(ctx, 0, 0, W, H, 36, "#ffffff");
  rrect(ctx, W / 2 - 42, 16, 84, 15, 7.5, c.ink);
  // Author.
  ctx.beginPath();
  ctx.arc(48, 86, 24, 0, Math.PI * 2);
  ctx.fillStyle = c.secondary;
  ctx.fill();
  setFont(ctx, 19, 600);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("AC", 48, 92);
  ctx.textAlign = "left";
  setFont(ctx, 22, 650);
  ctx.fillStyle = c.ink;
  ctx.fillText(POST.name, 82, 82);
  setFont(ctx, 16, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText(POST.handle, 82, 104);
  const end = paragraph(ctx, POST.body, 24, 166, W - 48, 27, 36);
  // Link card.
  const y = end + 28;
  rrect(ctx, 24, y, W - 48, 156, 18, c.shade);
  rrect(ctx, 24, y, W - 48, 84, 18, "#1a1918");
  ctx.fillStyle = "#1a1918";
  ctx.fillRect(24, y + 60, W - 48, 24);
  setFont(ctx, 20, 500, true);
  ctx.fillStyle = c.primary;
  ctx.fillText("PDF → { json }", 44, y + 50);
  setFont(ctx, 20, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("Parse any document", 42, y + 116);
  setFont(ctx, 15, 450, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("yourproduct.dev", 42, y + 140);
  // Reach.
  const label = views >= 1000 ? `${Math.round(views / 1000)}K` : String(views);
  ctx.fillStyle = c.line;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(24, H - 112, W - 48, 2);
  ctx.globalAlpha = 1;
  setFont(ctx, 16, 500, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("♡ 1.4K    ⟲ 128", 24, H - 76);
  ctx.fillText("IMPRESSIONS", 24, H - 38);
  setFont(ctx, 36, 650);
  ctx.letterSpacing = "-0.8px";
  ctx.fillStyle = c.ink;
  ctx.textAlign = "right";
  ctx.fillText(label, W - 24, H - 32);
  ctx.restore();
}

/** Three audiences round the creator, each on one platform. */
const CLUSTERS: { at: [number, number]; mark: BadgeMark }[] = [
  { at: [-2.7, 1.3], mark: "x" },
  { at: [0.6, 2.9], mark: "linkedin" },
  { at: [2.9, 0.3], mark: "youtube" },
];
const SPOTS = [
  [0, 0],
  [0.34, 0.05],
  [-0.33, -0.04],
  [0.16, 0.33],
  [-0.18, 0.31],
];
const PEOPLE = CLUSTERS.flatMap((cl, ci) =>
  SPOTS.map(([dx, dz]) => {
    const x = cl.at[0] + dx;
    const z = cl.at[1] + dz;
    return { x, z, d: Math.hypot(x, z), cluster: ci };
  }),
);
const RIPPLE = { from: 1.0, to: 4.8 };
const ripple = (s: number, j: number) =>
  span(s, 0.2 + 0.11 * j, 0.74 + 0.11 * j);
const radius = (f: number) =>
  RIPPLE.from + (RIPPLE.to - RIPPLE.from) * easeOut(f);
const CIRCLE = Array.from(
  { length: 129 },
  (_, i) =>
    new Vector3(
      Math.cos((i / 128) * Math.PI * 2),
      0,
      Math.sin((i / 128) * Math.PI * 2),
    ),
);

export function CreatorStation() {
  const bandRef = useBand();
  const c = colors();
  const dpr = useThree((st) => st.viewport.dpr);
  const render = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) => drawPost(ctx, w, h, v),
    [],
  );
  const [post, setViews] = useLive(PHONE.w - 0.12, PHONE.h - 0.12, render);
  const phone = useRef<Group>(null);
  const rings = useRef<(Group | null)[]>([]);
  const lines = useRef<(Line2 | null)[]>([]);
  const bodies = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const badges = useRef<(Group | null)[]>([]);
  const tint = useMemo(
    () => ({
      white: new Color("#ffffff"),
      mint: new Color(c.mint),
      out: new Color(),
    }),
    [c.mint],
  );
  const tmp = useMemo(() => new Object3D(), []);

  useEffect(() => {
    PEOPLE.forEach((_, i) => {
      bodies.current?.setColorAt(i, tint.white);
      heads.current?.setColorAt(i, tint.white);
    });
  }, [tint]);

  useFrame((state) => {
    const s = storyOf(bandRef.current, 4);
    const t = state.clock.elapsedTime;
    if (phone.current)
      phone.current.position.y = PHONE.lift + Math.sin(t * 1.2) * 0.025;
    setViews(Math.round(248 * easeOut(span(s, 0.25, 0.95))) * 1000);
    rings.current.forEach((g, j) => {
      const f = ripple(s, j);
      if (g) {
        g.visible = f > 0 && f < 1;
        g.scale.setScalar(radius(f));
      }
      const line = lines.current[j];
      if (line) line.material.opacity = Math.sin(Math.PI * f) * 0.85;
    });
    // Each person lights as the first ripple reaches them, with a little hop.
    const reach = s > 0.2 ? radius(ripple(s, 0)) : 0;
    PEOPLE.forEach((p, i) => {
      const lit = span(reach - p.d, -0.05, 0.3);
      const hop = Math.sin(Math.PI * lit) * 0.12;
      tmp.position.set(p.x, hop, p.z);
      tmp.updateMatrix();
      bodies.current?.setMatrixAt(i, tmp.matrix);
      tmp.position.y = 0.38 + hop;
      tmp.updateMatrix();
      heads.current?.setMatrixAt(i, tmp.matrix);
      tint.out.lerpColors(tint.white, tint.mint, lit);
      bodies.current?.setColorAt(i, tint.out);
      heads.current?.setColorAt(i, tint.out);
    });
    for (const m of [bodies.current, heads.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    CLUSTERS.forEach((cl, ci) => {
      const b = badges.current[ci];
      if (!b) return;
      b.scale.setScalar(pop(span(reach - Math.hypot(...cl.at), 0, 0.7)));
      b.position.y = 1.05 + Math.sin(t * 1.3 + ci * 2) * 0.03;
    });
  });

  return (
    <group position={AT.creators}>
      <Shadow w={2.8} d={2.8} />
      <Solid geometry={cylinder(0.95, PHONE.lift)} />
      <group ref={phone} position-y={PHONE.lift}>
        <Solid geometry={panel(PHONE.w, PHONE.h, PHONE.t, 0.22)} />
        <Print
          w={PHONE.w - 0.12}
          h={PHONE.h - 0.12}
          map={post}
          position={[0, PHONE.h / 2, PHONE.t / 2 + 0.003]}
        />
      </group>
      {[0, 1, 2].map((j) => (
        <group
          key={j}
          ref={(g) => void (rings.current[j] = g)}
          position-y={0.012}
          visible={false}
        >
          <Line
            ref={(l) => void (lines.current[j] = l as Line2 | null)}
            points={CIRCLE}
            color={c.primary}
            lineWidth={1.5}
            transparent
          />
        </group>
      ))}
      {CLUSTERS.map((cl) => (
        <Shadow
          key={cl.mark}
          w={1.5}
          d={1.5}
          opacity={0.06}
          position={[cl.at[0], 0.001, cl.at[1]]}
        />
      ))}
      <instancedMesh
        ref={bodies}
        args={[undefined, undefined, PEOPLE.length]}
        geometry={block(0.2, 0.2, 0.27, 0.1)}
      >
        <meshLambertMaterial />
        <Outlines thickness={1.2 * dpr} color={c.line} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, PEOPLE.length]}>
        <sphereGeometry args={[0.085, 24, 16]} />
        <meshLambertMaterial />
        <Outlines thickness={1.2 * dpr} color={c.line} />
      </instancedMesh>
      {CLUSTERS.map((cl, ci) => (
        <Badge
          key={cl.mark}
          ref={(g) => void (badges.current[ci] = g)}
          mark={cl.mark}
          position={[cl.at[0], 1.05, cl.at[1]]}
          scale={0.0001}
        />
      ))}
    </group>
  );
}
