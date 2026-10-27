"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, createContext, useContext, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Edges, Line, OrthographicCamera } from "@react-three/drei";
import { RingGeometry, Vector3, type Group, type Mesh, type MeshBasicMaterial, type OrthographicCamera as OrthoCam } from "three";
import type { Line2, LineMaterial } from "three-stdlib";
import { FACE_CAMERA, VIEW_DIR, toScreen } from "../../growth-engine/layout";
import { MARKS } from "../../growth-engine/marks";
import { boxFaces, edgeColor, palette } from "../../growth-engine/palette";
import { useCanvasTexture } from "../../growth-engine/useCanvasTexture";
import type { Platform } from "../kit";
import { CREATORS } from "./content";

// The two engagement models as small 3D diagrams, drawn like the homepage's growth engine: a fixed
// isometric view, flat faces shaded per side, soft ink outlines, crisp canvas-texture text, plus soft contact
// shadows so the pieces sit on the floor. Each tells its model in its shape, so it reads without the title:
//   Launch: one fixed post at the centre of a 48-hour dial. A hand sweeps the launch window; as it passes each
//   creator's hour their post rises out of the dial, each a different angle, and a pulse runs in to the launch.
//   Campaign: four channel lanes running Week 1 → 12. Different creators' posts in different formats land
//   along them week by week, and every one feeds a single objective at the far end, whose line climbs.
// SAMPLE creators, angles and formats; one clock per scene; a settled still frame for reduced motion.

const StillContext = createContext(false);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - (1 - v) ** 3;
const phase = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Cycle position 0–1 from the clock, or the settled frame when still. */
function useClock(cycle: number, settled: number) {
  const still = useContext(StillContext);
  return useCallback((elapsed: number) => (still ? settled : (elapsed / cycle) % 1), [still, cycle, settled]);
}

// Channel glyphs (24×24) for canvas: X and LinkedIn as in the footer, YouTube from the marks, a newspaper.
const GLYPH: Record<Platform, string> = {
  x: "M17.75 3h3.06l-6.69 7.65L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.16-8.18L2 3h6.33l4.37 5.78L17.75 3Zm-1.07 16.17h1.7L7.4 4.73H5.58l11.1 14.44Z",
  linkedin:
    "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm7 0h3.8v1.5h.05c.53-1 1.83-1.75 3.4-1.75 3.6 0 4.25 2.2 4.25 5.05v6.2h-4v-5.5c0-1.3 0-2.95-1.85-2.95-1.85 0-2.15 1.4-2.15 2.85v5.6H10v-11Z",
  youtube: MARKS.youtube,
  newsletter:
    "M22 3l-1.67 1.67L18.67 3 17 4.67 15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3 7 4.67 5.33 3 3.67 4.67 2 3v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V3zM11 19H4v-6h7v6zm9 0h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4H4V8h16v3z",
};

// ── Shared stage ──────────────────────────────────────────────────────────────────────────────────────

/** A transparent canvas over the scene's box, framing `fit` (world points) at any size; paused off screen. */
function Stage({ still, fit, children }: { still: boolean; fit: Vector3[]; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className="absolute inset-0">
      <Canvas flat dpr={[1, 2]} frameloop={still ? "demand" : active ? "always" : "never"} gl={{ antialias: true, alpha: true }}>
        <StillContext value={still}>
          <Camera fit={fit} />
          {children}
        </StillContext>
      </Canvas>
    </div>
  );
}

function Camera({ fit }: { fit: Vector3[] }) {
  const camera = useRef<OrthoCam>(null);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const cam = camera.current;
    if (!cam) return;
    const pts = fit.map(toScreen);
    const [u0, u1] = [Math.min(...pts.map((p) => p.u)), Math.max(...pts.map((p) => p.u))];
    const [v0, v1] = [Math.min(...pts.map((p) => p.v)), Math.max(...pts.map((p) => p.v))];
    const zoom = Math.min((size.width * 0.94) / (u1 - u0), (size.height * 0.9) / (v1 - v0));
    const cu = (u0 + u1) / 2;
    const cv = (v0 + v1) / 2;
    cam.left = cu - size.width / 2 / zoom;
    cam.right = cu + size.width / 2 / zoom;
    cam.top = cv + size.height / 2 / zoom;
    cam.bottom = cv - size.height / 2 / zoom;
    cam.position.copy(VIEW_DIR).multiplyScalar(40);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [size, fit]);
  return <OrthographicCamera ref={camera} makeDefault manual near={1} far={100} />;
}

function Shadows() {
  const p = palette();
  return <ContactShadows position={[0, -0.001, 0]} scale={12} resolution={512} blur={2.4} far={1.6} opacity={0.32} color={p.ink} />;
}

/**
 * A small pill that rides a moving part (the dial's hand, the "now" bar) and says where the clock is, so the
 * time reads inside the scene rather than in an overlay. `follow` places it and returns its text, or null to hide.
 */
function ClockTag({ follow, clock }: { follow: (t: number, at: Vector3) => string | null; clock: (e: number) => number }) {
  const p = palette();
  const mesh = useRef<Mesh>(null);
  const text = useRef("");
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      begin(ctx);
      const W = TAG.w * 100;
      const H = TAG.h * 100;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(23,44,33,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(1, 1, W - 2, H - 2, (H - 2) / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.arc(14, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.ink;
      ctx.font = `600 13px ${p.bodyFont}`;
      ctx.textBaseline = "middle";
      ctx.fillText(text.current, 24, H / 2 + 0.5);
    },
    [p],
  );
  const tex = useCanvasTexture(Math.round(TAG.w * PX), Math.round(TAG.h * PX), draw);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const label = follow(clock(state.clock.elapsedTime), m.position);
    m.visible = label !== null;
    if (label !== null && label !== text.current) {
      text.current = label;
      tex.paint();
    }
  });
  return (
    <mesh ref={mesh} quaternion={FACE_CAMERA} renderOrder={20} visible={false}>
      <planeGeometry args={[TAG.w, TAG.h]} />
      <meshBasicMaterial map={tex.texture} transparent toneMapped={false} depthTest={false} />
    </mesh>
  );
}
const TAG = { w: 0.92, h: 0.3 };

/** The creator photos, loaded once for drawing into textures. */
const PHOTOS = CREATORS.map((c) => c.photo);
function usePhotos() {
  const [imgs, setImgs] = useState<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    let live = true;
    Promise.all(
      PHOTOS.map(
        (src) =>
          new Promise<[string, HTMLImageElement]>((done) => {
            const im = new Image();
            im.onload = im.onerror = () => done([src, im]);
            im.src = src;
          }),
      ),
    ).then((list) => live && setImgs(Object.fromEntries(list)));
    return () => {
      live = false;
    };
  }, []);
  return imgs;
}

// Canvas drawing helpers. Textures are drawn in "card units": 100 units = 1 world unit.
const PX = 440; // texture pixels per world unit
const begin = (ctx: CanvasRenderingContext2D) => ctx.setTransform(PX / 100, 0, 0, PX / 100, 0, 0);
function avatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#e9e7e1";
  ctx.fill();
  if (img?.naturalWidth) {
    ctx.clip();
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}
function glyph(ctx: CanvasRenderingContext2D, platform: Platform, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(GLYPH[platform]));
  ctx.restore();
}
function card(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.fill();
}
const fmt = (n: number) => (n < 1e6 ? `${Math.round(n / 1e3)}K` : `${(n / 1e6).toFixed(1)}M`);

/** A standing slab (a card with real thickness) whose front face carries a canvas texture. */
function Slab({ w, h, d, draw, face }: { w: number; h: number; d: number; draw: (ctx: CanvasRenderingContext2D) => void; face?: (paint: () => void) => void }) {
  const faces = useMemo(() => boxFaces("#ffffff", { top: "#ffffff" }), []);
  const drawFace = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      begin(ctx);
      draw(ctx);
    },
    [draw],
  );
  const tex = useCanvasTexture(Math.round(w * PX), Math.round(h * PX), drawFace);
  useEffect(() => face?.(tex.paint), [face, tex.paint]);
  return (
    <group>
      <mesh position={[0, h / 2, 0]} material={faces}>
        <boxGeometry args={[w, h, d]} />
        <Edges color={edgeColor()} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 + 0.002]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex.texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * A pulse running a polyline while `at(t)` runs 0→1 (hidden outside, and in the still frame): a small green
 * bead with a white rim on a hairline ring, trailed by a few fading specks.
 */
const TAIL = 5;
const TAIL_GAP = 0.07; // world units between specks
function Pulse({ points, at, clock }: { points: Vector3[]; at: (t: number) => number; clock: (e: number) => number }) {
  const p = palette();
  const still = useContext(StillContext);
  const beads = useRef<(Group | null)[]>([]);
  const lengths = useMemo(() => points.reduce<number[]>((acc, q, i) => [...acc, i ? acc[i - 1] + q.distanceTo(points[i - 1]) : 0], []), [points]);
  useFrame((state) => {
    const k = at(clock(state.clock.elapsedTime));
    const total = lengths[lengths.length - 1];
    beads.current.forEach((g, j) => {
      if (!g) return;
      const d = k * total - j * TAIL_GAP;
      g.visible = !still && k > 0 && k < 1 && d >= 0;
      if (!g.visible) return;
      const i = Math.max(1, lengths.findIndex((l) => l >= d));
      const span = lengths[i] - lengths[i - 1] || 1;
      g.position.lerpVectors(points[i - 1], points[i], (d - lengths[i - 1]) / span);
    });
  });
  const flat = { toneMapped: false, transparent: true, depthTest: false } as const;
  return (
    <group>
      {Array.from({ length: TAIL }, (_, j) => (
        <group
          key={j}
          ref={(el) => {
            beads.current[j] = el;
          }}
          visible={false}
          quaternion={FACE_CAMERA}
        >
          {j === 0 ? (
            <>
              <mesh renderOrder={20}>
                <circleGeometry args={[0.076, 32]} />
                <meshBasicMaterial color="#d3cfc6" {...flat} />
              </mesh>
              <mesh renderOrder={21}>
                <circleGeometry args={[0.068, 32]} />
                <meshBasicMaterial color="#ffffff" {...flat} />
              </mesh>
              <mesh renderOrder={22}>
                <circleGeometry args={[0.046, 32]} />
                <meshBasicMaterial color={p.primary} {...flat} />
              </mesh>
            </>
          ) : (
            <mesh renderOrder={19}>
              <circleGeometry args={[0.03 * (1 - j / TAIL) + 0.008, 20]} />
              <meshBasicMaterial color={p.primary} {...flat} opacity={0.5 * (1 - j / TAIL)} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ── Launch: the 48-hour dial ───────────────────────────────────────────────────────────────────────────

const R = 2.3; // dial radius
const PLATE = 0.16; // dial thickness
const WINDOW = 48; // hours on the dial
const LAUNCH_CYCLE = 22;
const SWEEP = [0.06, 0.8] as const; // the hand runs 0→48h
const SLANT = 0.5; // cards turn a little to the reader's left, so their thickness shows

// SAMPLE: the creators who picked the launch up, each with their own angle, at their hour.
const ANGLES: { creator: number; platform: Platform; tag: string; hour: number; views: number }[] = [
  { creator: 1, platform: "x", tag: "Live demo", hour: 1, views: 410_000 },
  { creator: 3, platform: "linkedin", tag: "Use case", hour: 6, views: 186_000 },
  { creator: 0, platform: "x", tag: "Thread", hour: 11, views: 320_000 },
  { creator: 6, platform: "x", tag: "Benchmark", hour: 17, views: 140_000 },
  { creator: 7, platform: "linkedin", tag: "Hot take", hour: 23, views: 144_000 },
  { creator: 2, platform: "x", tag: "Deep dive", hour: 30, views: 96_000 },
];
const LAUNCH_VIEWS = 120_000;

// Where hour h sits on the dial: clockwise on screen from the upper right, so the hours the posts land in
// stay clear of the back of the dial, which the launch card hides.
const BACK = new Vector3(-1, 0, -1).normalize();
const RIGHT = new Vector3(1, 0, -1).normalize();
const alpha = (h: number) => Math.PI / 4 + (h / WINDOW) * Math.PI * 2;
const onDial = (h: number, r: number) => {
  const a = alpha(h);
  return BACK.clone().multiplyScalar(Math.cos(a) * r).addScaledVector(RIGHT, Math.sin(a) * r);
};
/** The same direction as a rotation about y for something whose local +x should point along it. */
const yaw = (h: number) => (3 * Math.PI) / 4 - alpha(h);

const LAUNCH_CARD = { w: 1.55, h: 1.14, d: 0.08 };
const ANGLE_CARD = { w: 1.26, h: 0.56, d: 0.06 };
const LAUNCH_SCALE = 0.86; // the slabs are drawn at these sizes and scaled to sit on the dial
const ANGLE_SCALE = 0.84;
const CARD_R = 0.8 * R;

const LAUNCH_FIT = [
  ...Array.from({ length: 24 }, (_, i) => onDial((i / 24) * WINDOW, R)),
  new Vector3(0, PLATE + LAUNCH_CARD.h * LAUNCH_SCALE + 0.1, 0),
  ...Array.from({ length: 12 }, (_, i) => onDial((i / 12) * WINDOW, R).setY(PLATE + 0.36 + 0.3)),
  ...ANGLES.map((a) => onDial(a.hour, CARD_R).setY(PLATE + ANGLE_CARD.h * ANGLE_SCALE)),
];

export function LaunchDialScene({ still }: { still: boolean }) {
  return (
    <Stage still={still} fit={LAUNCH_FIT}>
      <Shadows />
      <LaunchDial />
    </Stage>
  );
}

function LaunchDial() {
  const p = palette();
  const clock = useClock(LAUNCH_CYCLE, 0.86);
  const photos = usePhotos();
  const hourAt = useCallback((t: number) => WINDOW * ease(phase(t, SWEEP[0], SWEEP[1]) ** 1.15) * (1 - phase(t, 0.93, 0.99)), []);

  // The plate: a solid disc with the hours engraved on its face.
  const plateFaces = useMemo(
    () => [
      { color: "#e4e1d9" }, // side
      { color: "#fdfcf9" }, // top (the face texture sits on it)
      { color: "#e4e1d9" },
    ],
    [],
  );
  const drawFace = useCallback(
    (ctx: CanvasRenderingContext2D, w: number) => {
      const c = w / 2;
      const k = c / R; // canvas px per world unit; canvas x ↔ world x, canvas y ↔ world z
      const at = (h: number, r: number) => {
        const v = onDial(h, r);
        return [c + v.x * k, c + v.z * k] as const;
      };
      ctx.fillStyle = "#fdfcf9";
      ctx.beginPath();
      ctx.arc(c, c, c, 0, Math.PI * 2);
      ctx.fill();
      // The track the hours run around.
      ctx.fillStyle = "#f2f0ea";
      ctx.beginPath();
      ctx.arc(c, c, c * 0.985, 0, Math.PI * 2);
      ctx.arc(c, c, c * 0.83, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.strokeStyle = "rgba(23,44,33,0.12)";
      ctx.lineWidth = k * 0.012;
      ctx.beginPath();
      ctx.arc(c, c, c * 0.83, 0, Math.PI * 2);
      ctx.stroke();
      // Hour ticks: every hour, longer every six.
      for (let h = 0; h < WINDOW; h++) {
        const major = h % 6 === 0;
        const [x0, y0] = at(h, R * (major ? 0.86 : 0.91));
        const [x1, y1] = at(h, R * 0.965);
        ctx.strokeStyle = major ? "rgba(23,44,33,0.55)" : "rgba(23,44,33,0.22)";
        ctx.lineWidth = k * (major ? 0.022 : 0.012);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(23,44,33,0.6)";
      ctx.font = `500 ${k * 0.15}px ${p.monoFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const h of [0, 12, 24, 36]) {
        const [x, y] = at(h, R * 0.72);
        ctx.fillText(`${h}H`, x, y);
      }
    },
    [p],
  );
  const face = useCanvasTexture(1024, 1024, drawFace);

  // The elapsed part of the window: the hour track fills in green behind the hand (a full ring, drawn up to it).
  const SEG = 240;
  const sector = useMemo(() => new RingGeometry(R * 0.83, R * 0.985, SEG, 1, Math.PI / 2 - Math.PI * 2, Math.PI * 2), []);
  const hand = useRef<Group>(null);
  const standFaces = useMemo(() => boxFaces("#e9e6df"), []);
  const tip = useRef<Mesh>(null);

  // The launch card's view count climbs as each angle lands; repaint only when it changes.
  const viewsRef = useRef(LAUNCH_VIEWS);
  const launchPaint = useRef<() => void>(() => {});
  const drawLaunch = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const W = LAUNCH_CARD.w * 100;
      const H = LAUNCH_CARD.h * 100;
      card(ctx, W, H, 7);
      // Header: the product.
      ctx.fillStyle = p.ink;
      ctx.beginPath();
      ctx.roundRect(10, 10, 22, 22, 5);
      ctx.fill();
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.arc(21, 21, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = p.ink;
      ctx.font = `600 14px ${p.bodyFont}`;
      ctx.fillText("Your product", 39, 26);
      // The post, in one short sentence.
      ctx.textAlign = "left";
      ctx.fillStyle = p.ink;
      ctx.font = `500 12.5px ${p.bodyFont}`;
      ctx.fillText("Introducing v2: ship AI", 10, 54);
      ctx.fillText("features in an afternoon.", 10, 70);
      // Footer: views, climbing.
      ctx.strokeStyle = "rgba(23,44,33,0.1)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(10, 82);
      ctx.lineTo(W - 10, 82);
      ctx.stroke();
      ctx.fillStyle = p.muted;
      ctx.font = `500 8.5px ${p.monoFont}`;
      ctx.fillText("LAUNCH VIEWS", 10, 103);
      ctx.fillStyle = p.ink;
      ctx.textAlign = "right";
      ctx.font = `600 22px ${p.bodyFont}`;
      ctx.fillText(fmt(viewsRef.current), W - 10, 105);
    },
    [p],
  );
  const onLaunchFace = useCallback((paint: () => void) => {
    launchPaint.current = paint;
  }, []);

  useFrame((state) => {
    const t = clock(state.clock.elapsedTime);
    const hour = hourAt(t);
    const k = hour / WINDOW;
    sector.setDrawRange((SEG - Math.round(SEG * k)) * 6, Math.round(SEG * k) * 6);
    if (hand.current) {
      hand.current.rotation.y = yaw(hour);
      hand.current.visible = t < 0.985;
    }
    if (tip.current) tip.current.visible = hour > 0.05;
    const views = LAUNCH_VIEWS + ANGLES.reduce((sum, a) => sum + (hour >= a.hour + 1 ? a.views : 0), 0);
    if (views !== viewsRef.current) {
      viewsRef.current = views;
      launchPaint.current();
    }
  });

  return (
    <group>
      {/* The dial plate. */}
      <mesh position={[0, PLATE / 2, 0]}>
        <cylinderGeometry args={[R, R, PLATE, 128]} />
        {plateFaces.map((m, i) => (
          <meshBasicMaterial key={i} attach={`material-${i}`} color={m.color} toneMapped={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        ))}
        <Edges color={edgeColor()} threshold={20} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, PLATE + 0.001, 0]}>
        <circleGeometry args={[R, 128]} />
        <meshBasicMaterial map={face.texture} toneMapped={false} />
      </mesh>
      <mesh geometry={sector} rotation-x={-Math.PI / 2} position={[0, PLATE + 0.003, 0]}>
        <meshBasicMaterial color={p.primary} transparent opacity={0.32} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* The hand, sweeping the window. */}
      <group ref={hand} position={[0, PLATE + 0.006, 0]}>
        <mesh position={[(R * 0.965) / 2, 0.008, 0]}>
          <boxGeometry args={[R * 0.965, 0.016, 0.022]} />
          <meshBasicMaterial color={p.ink} toneMapped={false} transparent opacity={0.75} />
        </mesh>
        <mesh ref={tip} position={[R * 0.965, 0.03, 0]}>
          <sphereGeometry args={[0.07, 20, 12]} />
          <meshBasicMaterial color={p.primary} toneMapped={false} />
        </mesh>
      </group>

      {/* The launch itself, fixed at the centre on a small stand. */}
      <group position={[0, PLATE, 0]} rotation-y={SLANT} scale={LAUNCH_SCALE}>
        <mesh position={[0, 0.03, 0]} material={standFaces}>
          <boxGeometry args={[0.7, 0.06, 0.34]} />
          <Edges color={edgeColor()} />
        </mesh>
        <group position={[0, 0.06, 0]}>
          <Slab w={LAUNCH_CARD.w} h={LAUNCH_CARD.h} d={LAUNCH_CARD.d} draw={drawLaunch} face={onLaunchFace} />
        </group>
      </group>

      <ClockTag
        clock={clock}
        follow={(t, at) => {
          const hour = hourAt(t);
          if (hour < 0.5 || t > 0.93) return null;
          at.copy(onDial(hour, R * 0.965)).setY(PLATE + 0.36);
          return `Hour ${Math.min(WINDOW, Math.floor(hour))}`;
        }}
      />

      {ANGLES.map((a, i) => (
        <AngleCard key={i} a={a} photo={photos[CREATORS[a.creator].photo]} hourAt={hourAt} clock={clock} />
      ))}
    </group>
  );
}

function AngleCard({
  a,
  photo,
  hourAt,
  clock,
}: {
  a: (typeof ANGLES)[number];
  photo: HTMLImageElement | undefined;
  hourAt: (t: number) => number;
  clock: (e: number) => number;
}) {
  const p = palette();
  const rise = useRef<Group>(null);
  const line = useRef<Line2>(null);
  const at = useMemo(() => onDial(a.hour, CARD_R), [a.hour]);
  // The inward path: from in front of the card to the foot of the launch stand.
  const path = useMemo(() => [onDial(a.hour, CARD_R - 0.22).setY(PLATE + 0.01), onDial(a.hour, 0.55).setY(PLATE + 0.01)], [a.hour]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const W = ANGLE_CARD.w * 100;
      const H = ANGLE_CARD.h * 100;
      card(ctx, W, H, 6);
      // The angle, big: the reason this post is different from the others.
      avatar(ctx, photo, 18, 19, 10);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      // Fit the tag to the room right of the avatar: a long angle steps its size down rather than spill.
      const room = W - 33 - 9 - 16;
      let size = 13;
      ctx.font = `600 ${size}px ${p.bodyFont}`;
      while (ctx.measureText(a.tag).width > room && size > 9) ctx.font = `600 ${(size -= 0.5)}px ${p.bodyFont}`;
      const tw = ctx.measureText(a.tag).width;
      ctx.fillStyle = "#dcf7e7";
      ctx.beginPath();
      ctx.roundRect(33, 9, tw + 16, 21, 10.5);
      ctx.fill();
      ctx.fillStyle = p.ink;
      ctx.fillText(a.tag, 41, 19.5 + size * 0.35);
      // When it landed, where, and how far it went.
      ctx.fillStyle = p.muted;
      ctx.font = `500 10px ${p.monoFont}`;
      ctx.fillText(`+${a.hour}H`, 9, H - 10);
      ctx.textAlign = "right";
      ctx.fillStyle = p.ink;
      ctx.font = `600 12px ${p.bodyFont}`;
      ctx.fillText(fmt(a.views), W - 9, H - 9.5);
      const vw = ctx.measureText(fmt(a.views)).width;
      glyph(ctx, a.platform, W - 9 - vw - 15, H - 20.5, 11, a.platform === "linkedin" ? "#0a66c2" : p.ink);
    },
    [p, a, photo],
  );

  const colors = useMemo(() => ({ rest: "#d9d6cf", on: p.primary }), [p]);
  useFrame((state) => {
    const t = clock(state.clock.elapsedTime);
    const hour = hourAt(t);
    const k = ease(clamp01((hour - a.hour) / 2.4));
    if (rise.current) {
      rise.current.position.y = PLATE - (ANGLE_CARD.h * ANGLE_SCALE + 0.04) * (1 - k);
      rise.current.visible = k > 0;
    }
    const mat = line.current?.material as LineMaterial | undefined;
    mat?.color.set(hour >= a.hour + 0.6 ? colors.on : colors.rest);
  });

  return (
    <group>
      <Line ref={line} points={path} color={colors.rest} lineWidth={1.5} />
      <Pulse points={path} clock={clock} at={(t) => clamp01((hourAt(t) - a.hour - 0.6) / 3.2)} />
      <group ref={rise} position={[at.x, PLATE, at.z]} rotation-y={SLANT} scale={ANGLE_SCALE} visible={false}>
        <Slab w={ANGLE_CARD.w} h={ANGLE_CARD.h} d={ANGLE_CARD.d} draw={draw} />
      </group>
    </group>
  );
}

// ── Campaign: channel lanes over twelve weeks, into one objective ──────────────────────────────────────

const CAMPAIGN_CYCLE = 24;
const WEEKS = [0.06, 0.8] as const; // the cursor runs week 1 → 12
const LANES: Platform[] = ["x", "linkedin", "youtube", "newsletter"];
const LANE = { w: 0.6, gap: 0.14, h: 0.05, front: 2.1, back: -2.1 };
const laneX = (i: number) => (i - (LANES.length - 1) / 2) * (LANE.w + LANE.gap);
const weekZ = (w: number) => LANE.front - ((w - 0.5) / 12) * (LANE.front - LANE.back);
const OBJECTIVE = { w: 2.1, h: 1.36, d: 0.08, z: LANE.back - 1.2 };
const MERGE = new Vector3(0, LANE.h, LANE.back - 0.6); // where the lanes' wires join
const INLET = new Vector3(0, LANE.h, OBJECTIVE.z + 0.2); // the front of the objective's stand
/** The wire from lane i's end: on along the lane's line, then a smooth turn into the trunk at MERGE. */
function wire(i: number) {
  const a = new Vector3(laneX(i), LANE.h, LANE.back);
  const c = new Vector3(laneX(i), LANE.h, MERGE.z);
  return Array.from({ length: 21 }, (_, k) => {
    const u = k / 20;
    return a
      .clone()
      .multiplyScalar((1 - u) ** 2)
      .addScaledVector(c, 2 * u * (1 - u))
      .addScaledVector(MERGE, u * u);
  });
}
const WIRES = LANES.map((_, i) => wire(i));



// SAMPLE: one program, many creators and formats, spread across the channels.
// Spread so no two labels sit on top of each other: neighbouring lanes never post in neighbouring weeks.
const PROGRAM: { lane: number; week: number; creator: number; format: string }[] = [
  { lane: 0, week: 1, creator: 1, format: "Thread" },
  { lane: 2, week: 2, creator: 6, format: "Video" },
  { lane: 1, week: 4, creator: 3, format: "Post" },
  { lane: 3, week: 4, creator: 4, format: "Issue" },
  { lane: 0, week: 6, creator: 0, format: "Demo" },
  { lane: 2, week: 7, creator: 2, format: "Tutorial" },
  { lane: 1, week: 9, creator: 7, format: "Case study" },
  { lane: 3, week: 9, creator: 5, format: "Issue" },
  { lane: 0, week: 11, creator: 1, format: "Thread" },
  { lane: 2, week: 12, creator: 6, format: "Video" },
];

// The objective's line: each post lifts it once its pulse arrives, eased over a couple of weeks, weighted a little
// by format. The chart runs LAG weeks behind the lanes (the pulse's trip), so the lift lands with the pulse.
const LAG = 1.3;
const LIFT = 2.4; // wide enough that neighbouring lifts blend into one smooth climb
const WEIGHT: Record<string, number> = { Video: 1.3, Tutorial: 1.25, "Case study": 1.2 };
const TOTAL_WEIGHT = PROGRAM.reduce((sum, q) => sum + (WEIGHT[q.format] ?? 1), 0);
const smooth = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const adoption = (w: number) => 0.06 + (0.86 * PROGRAM.reduce((sum, q) => sum + (WEIGHT[q.format] ?? 1) * smooth((w - q.week) / LIFT), 0)) / TOTAL_WEIGHT;

const CAMPAIGN_FIT = [
  new Vector3(laneX(0) - LANE.w / 2 - 0.5, 0, LANE.front + 0.7),
  new Vector3(laneX(3) + LANE.w / 2, 0, LANE.front + 0.7),
  new Vector3(laneX(0) - LANE.w / 2, 0, LANE.back),
  new Vector3(laneX(3) + LANE.w / 2 + 0.2, 0, LANE.back),
  new Vector3(0, OBJECTIVE.h + 0.08, OBJECTIVE.z),
  new Vector3(OBJECTIVE.w / 2 + 0.3, OBJECTIVE.h + 0.5, OBJECTIVE.z - 0.3),
  new Vector3(-OBJECTIVE.w / 2, OBJECTIVE.h, OBJECTIVE.z + 0.3),
];

export function CampaignLanesScene({ still }: { still: boolean }) {
  return (
    <Stage still={still} fit={CAMPAIGN_FIT}>
      <Shadows />
      <CampaignLanes />
    </Stage>
  );
}

function CampaignLanes() {
  const p = palette();
  const clock = useClock(CAMPAIGN_CYCLE, 0.9);
  const photos = usePhotos();
  const weekAt = useCallback((t: number) => 0.5 + 12 * phase(t, WEEKS[0], WEEKS[1]), []);
  const out = useCallback((t: number) => 1 - phase(t, 0.93, 0.99), []);
  const length = LANE.front - LANE.back;

  const laneFaces = useMemo(() => boxFaces("#ebe8e1", { top: "#fdfcf9" }), []);
  const blockFaces = useMemo(() => boxFaces("#ffffff"), []);
  const standFaces = useMemo(() => boxFaces("#e2dfd7"), []);

  // The weeks, ruled across each lane's top: a hairline every week, a stronger one every four.
  const drawLane = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    for (let wk = 0; wk <= 12; wk++) {
      const y = (wk / 12) * h;
      ctx.fillStyle = wk % 4 === 0 ? "rgba(23,44,33,0.22)" : "rgba(23,44,33,0.09)";
      ctx.fillRect(0, Math.min(h - 3, y), w, wk % 4 === 0 ? 3 : 2);
    }
  }, []);
  const laneTex = useCanvasTexture(128, 1024, drawLane);

  const cursor = useRef<Group>(null);
  const chartPaint = useRef<() => void>(() => {});
  const drawn = useRef(12.5); // how far the line has drawn, in weeks (full until the loop runs)
  const drawObjective = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const W = OBJECTIVE.w * 100;
      const H = OBJECTIVE.h * 100;
      card(ctx, W, H, 6);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = p.muted;
      ctx.font = `500 8px ${p.monoFont}`;
      ctx.fillText("ONE OBJECTIVE", 11, 18);
      ctx.fillStyle = p.ink;
      ctx.font = `600 16px ${p.bodyFont}`;
      ctx.fillText("Product adoption", 11, 37);
      // The line, drawn week by week up to where the chart has reached, eased between posts.
      const upTo = drawn.current;
      const x0 = 11;
      const x1 = W - 11;
      const y0 = H - 18;
      const y1 = 62;
      const xAt = (w: number) => x0 + ((w - 0.5) / 12) * (x1 - x0);
      const yAt = (w: number) => y0 - (y0 - y1) * adoption(w);
      ctx.strokeStyle = "rgba(23,44,33,0.07)";
      ctx.lineWidth = 0.6;
      for (const y of [y0, (y0 + y1) / 2, y1]) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      if (upTo > 0.55) {
        const pts: [number, number][] = [];
        for (let w = 0.5; w < upTo; w += 0.08) pts.push([xAt(w), yAt(w)]);
        pts.push([xAt(upTo), yAt(upTo)]);
        const [lx, ly] = pts[pts.length - 1];
        const g = ctx.createLinearGradient(0, y1, 0, y0);
        g.addColorStop(0, "rgba(25,231,110,0.22)");
        g.addColorStop(1, "rgba(25,231,110,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(lx, y0);
        ctx.fill();
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        // The head: a green bead with a white rim, like the pulses that feed it.
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(lx, ly, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(23,44,33,0.18)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.fillStyle = p.primary;
        ctx.beginPath();
        ctx.arc(lx, ly, 2.7, 0, Math.PI * 2);
        ctx.fill();
      }
      const n = PROGRAM.filter((q) => q.week <= upTo).length;
      ctx.fillStyle = p.muted;
      ctx.font = `500 7.5px ${p.monoFont}`;
      ctx.fillText("WEEK 1", x0, H - 6);
      ctx.textAlign = "right";
      ctx.fillText("WEEK 12", x1, H - 6);
      ctx.fillStyle = p.muted;
      ctx.font = `500 10px ${p.bodyFont}`;
      ctx.fillText(`${n} posts · ${new Set(PROGRAM.filter((q) => q.week <= upTo).map((q) => q.creator)).size} creators`, x1, 54);
    },
    [p],
  );
  const onObjective = useCallback((paint: () => void) => {
    chartPaint.current = paint;
  }, []);

  useFrame((state) => {
    const t = clock(state.clock.elapsedTime);
    const week = weekAt(t);
    const o = out(t);
    if (cursor.current) {
      cursor.current.position.z = weekZ(Math.min(12.5, week));
      cursor.current.visible = o > 0.5 && t > WEEKS[0];
    }
    // The chart trails the lanes by the pulse's trip; repaint as it moves (a hair at a time, so it glides).
    const upTo = o < 1 ? 0.5 : Math.min(12.5, Math.max(0.5, 0.5 + 12 * ((t - WEEKS[0]) / (WEEKS[1] - WEEKS[0])) - LAG));
    if (Math.abs(upTo - drawn.current) > 0.02) {
      drawn.current = upTo;
      chartPaint.current();
    }
  });

  return (
    <group>
      {LANES.map((c, i) => (
        <group key={c} position={[laneX(i), 0, 0]}>
          {/* The lane, ruled in weeks. */}
          <mesh position={[0, LANE.h / 2, (LANE.front + LANE.back) / 2]} material={laneFaces}>
            <boxGeometry args={[LANE.w, LANE.h, length]} />
            <Edges color={edgeColor()} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, LANE.h + 0.001, (LANE.front + LANE.back) / 2]}>
            <planeGeometry args={[LANE.w, length]} />
            <meshBasicMaterial map={laneTex.texture} transparent toneMapped={false} depthWrite={false} />
          </mesh>
          {/* The channel, a block at the head of its lane. */}
          <ChannelBlock platform={c} faces={blockFaces} />
        </group>
      ))}

      {/* The wiring: each lane's end curves into one trunk, joined at a node, into the objective. */}
      {WIRES.map((w, i) => (
        <Line key={i} points={w} color={WIRE} lineWidth={1.4} />
      ))}
      <Line points={[MERGE, INLET]} color={WIRE} lineWidth={1.4} />
      <Joint at={MERGE} />

      {/* Square to the reader (just off, so its edge shows): a slant would tilt the chart's baseline and flatten its climb. */}
      <group position={[0, 0, OBJECTIVE.z]} rotation-y={0.7}>
        <mesh position={[0, 0.03, 0]} material={standFaces}>
          <boxGeometry args={[0.9, 0.06, 0.36]} />
          <Edges color={edgeColor()} />
        </mesh>
        <group position={[0, 0.06, 0]}>
          <Slab w={OBJECTIVE.w} h={OBJECTIVE.h} d={OBJECTIVE.d} draw={drawObjective} face={onObjective} />
        </group>
      </group>

      {/* The time axis: where it starts, and a tag riding the "now" bar to where it is. */}
      <WeekMark week={1} />
      <ClockTag
        clock={clock}
        follow={(t, at) => {
          const week = weekAt(t);
          if (week < 2.4 || out(t) < 1) return null;
          at.set(laneX(LANES.length - 1) + LANE.w / 2 + 0.62, 0.16, weekZ(Math.min(12.5, week)));
          return `Week ${Math.min(12, Math.floor(week + 0.5))}`;
        }}
      />

      {/* Now: a bar across every lane, moving down the weeks. */}
      <group ref={cursor} position={[0, LANE.h + 0.012, weekZ(1)]}>
        <mesh>
          <boxGeometry args={[laneX(3) - laneX(0) + LANE.w + 0.16, 0.02, 0.035]} />
          <meshBasicMaterial color={p.primary} toneMapped={false} />
        </mesh>
      </group>

      {PROGRAM.map((q, i) => (
        <ProgramPost key={i} q={q} photo={photos[CREATORS[q.creator].photo]} weekAt={weekAt} out={out} clock={clock} />
      ))}
    </group>
  );
}

function ChannelBlock({ platform, faces }: { platform: Platform; faces: MeshBasicMaterial[] }) {
  const p = palette();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, w);
      // Turned 45° so it reads upright from the viewer's corner (canvas up is the floor's −z).
      ctx.save();
      ctx.translate(w / 2, w / 2);
      ctx.rotate(-Math.PI / 4);
      glyph(ctx, platform, -w * 0.22, -w * 0.22, w * 0.44, p.ink);
      ctx.restore();
    },
    [platform, p],
  );
  const top = useCanvasTexture(256, 256, draw);
  const H = 0.36;
  const z = LANE.front + 0.18 + LANE.w / 2;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, H / 2, 0]} material={faces}>
        <boxGeometry args={[LANE.w, H, LANE.w]} />
        <Edges color={edgeColor()} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, H + 0.001, 0]}>
        <planeGeometry args={[LANE.w, LANE.w]} />
        <meshBasicMaterial map={top.texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

const CHIP = { w: 1.08, h: 0.34 };
const WIRE = "#cdc9c0";
/** The weeks on an unclamped clock, so pulses and the chart carry on past week 12 into the hold. */
const flowAt = (t: number) => 0.5 + 12 * ((t - WEEKS[0]) / (WEEKS[1] - WEEKS[0]));

/** A wiring joint: a small white node with a hairline ring, square to the screen. */
function Joint({ at }: { at: Vector3 }) {
  const flat = { toneMapped: false, transparent: true, depthTest: false } as const;
  return (
    <group position={at} quaternion={FACE_CAMERA}>
      <mesh renderOrder={9}>
        <circleGeometry args={[0.064, 32]} />
        <meshBasicMaterial color={WIRE} {...flat} />
      </mesh>
      <mesh renderOrder={10}>
        <circleGeometry args={[0.05, 32]} />
        <meshBasicMaterial color="#ffffff" {...flat} />
      </mesh>
    </group>
  );
}

function WeekMark({ week }: { week: number }) {
  const p = palette();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      begin(ctx);
      ctx.fillStyle = p.muted;
      ctx.font = `500 12px ${p.monoFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`WEEK ${week}`, 2, 11);
    },
    [p, week],
  );
  const tex = useCanvasTexture(Math.round(0.8 * PX), Math.round(0.22 * PX), draw);
  return (
    <mesh position={[laneX(LANES.length - 1) + LANE.w / 2 + 0.48, 0.02, weekZ(week)]} quaternion={FACE_CAMERA}>
      <planeGeometry args={[0.8, 0.22]} />
      <meshBasicMaterial map={tex.texture} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function ProgramPost({
  q,
  photo,
  weekAt,
  out,
  clock,
}: {
  q: (typeof PROGRAM)[number];
  photo: HTMLImageElement | undefined;
  weekAt: (t: number) => number;
  out: (t: number) => number;
  clock: (e: number) => number;
}) {
  const p = palette();
  const faces = useMemo(() => boxFaces("#ffffff", { top: "#ffffff" }), []);
  const accent = useMemo(() => boxFaces(p.primary), [p]);
  const drop = useRef<Group>(null);
  const x = laneX(q.lane);
  const z = weekZ(q.week);
  const depth = 6 + Math.round((x + z) * 10 + 100); // nearer the reader draws later
  const route = useMemo(() => [new Vector3(x, LANE.h, z), ...WIRES[q.lane], INLET], [x, z, q.lane]);

  // A label that faces the reader: who, and in what format.
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      begin(ctx);
      const W = CHIP.w * 100;
      const H = CHIP.h * 100;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(23,44,33,0.16)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(0.5, 0.5, W - 1, H - 1, H / 2);
      ctx.fill();
      ctx.stroke();
      avatar(ctx, photo, H / 2, H / 2, H / 2 - 3);
      ctx.fillStyle = p.ink;
      ctx.font = `600 12.5px ${p.bodyFont}`;
      ctx.textBaseline = "middle";
      ctx.fillText(q.format, H + 1, H / 2 + 0.5);
    },
    [p, q.format, photo],
  );
  const chip = useCanvasTexture(Math.round(CHIP.w * PX), Math.round(CHIP.h * PX), draw);

  useFrame((state) => {
    const t = clock(state.clock.elapsedTime);
    const k = ease(clamp01((weekAt(t) - q.week) / 0.5)) * out(t);
    const g = drop.current;
    if (!g) return;
    g.visible = k > 0.01;
    g.position.y = 0.9 * (1 - k);
  });

  return (
    <group>
      <group ref={drop} position={[0, 0.9, 0]} visible={false}>
        <group position={[x, LANE.h, z]}>
          {/* The post: a white block in its week, with a green edge. */}
          <mesh position={[0, 0.05, 0]} material={faces}>
            <boxGeometry args={[LANE.w - 0.1, 0.1, 0.3]} />
            <Edges color={edgeColor()} />
          </mesh>
          <mesh position={[0, 0.103, 0.11]} material={accent}>
            <boxGeometry args={[LANE.w - 0.1, 0.006, 0.06]} />
          </mesh>
          {/* Its label, floating just above and to the left of the block. */}
          <mesh position={[0, 0.36, 0]} quaternion={FACE_CAMERA} renderOrder={depth}>
            <planeGeometry args={[CHIP.w, CHIP.h]} />
            <meshBasicMaterial map={chip.texture} transparent toneMapped={false} depthTest={false} />
          </mesh>
        </group>
      </group>
      <Pulse points={route} clock={clock} at={(t) => (out(t) < 1 ? 0 : clamp01((flowAt(t) - q.week - 0.3) / (LAG - 0.3)))} />
    </group>
  );
}
