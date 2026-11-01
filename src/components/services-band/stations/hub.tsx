import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  DoubleSide,
  RepeatWrapping,
  SRGBColorSpace,
  TubeGeometry,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { mix } from "../../growth-engine/palette";
import { span, storyOf } from "../content";
import type { LabelSpec } from "../label-store";
import {
  Print,
  Shadow,
  Solid,
  block,
  colors,
  cylinder,
  easeInOut,
  easeOut,
  panel,
  pop,
  rrect,
  setFont,
  useBand,
  useStatic,
} from "../kit";
import {
  AT,
  DIRS,
  LANE_NAMES,
  PIPE,
  PLATFORM,
  PORT_MODULE,
  ROUTES,
} from "../layout";
import { fibreMaterial, routePath, shellMaterial } from "../fibre";

// Beat 0, the hub: the Devable engine. Your product (a small white display showing its app) is lowered onto
// the engine's tray; a scanning gantry slides over it, casting a light curtain (we learn it inside out); then
// the four port modules light one by one, each printed with its channel, and light starts down their pipes.
// The pipes: glass tubes with a green fibre inside, carrying pulses of light out to each station.
// Beat 5 also lives here: the light reverses, flowing back from every station to the hub, and the outcome
// columns rise from the deck's free corners.

type Ctx = CanvasRenderingContext2D;

const TOP = PLATFORM.h; // deck surface
const TRAY = { size: 2.5, h: 0.02 };
/** The product: a display on a small stand, centred on the tray. */
const DEVICE = { w: 1.62, h: 1.1, t: 0.14, lift: 0.24 };
/**
 * The gantry: two pillars on carriages running in rails either side of the tray, bridged by a beam whose
 * emitter casts the light curtain. It glides to and fro on its own (not with scroll) while the band is in view.
 */
const GANTRY = {
  span: 3.0,
  pillar: 0.26,
  depth: 0.5,
  h: 1.95,
  beam: 0.32,
  travel: 1.0,
  period: 11.5,
};
const RAIL = {
  x: GANTRY.span / 2 - GANTRY.pillar / 2,
  len: 2.62,
  w: 0.2,
  h: 0.035,
};
/** The outcome columns in the deck's free corners: reach, demand and (tallest, mint) pipeline. */
const BARS = [
  { at: [1.6, 1.6], h: 0.9, name: "Reach" },
  { at: [1.65, -1.65], h: 1.5, name: "Demand" },
  { at: [-1.65, -1.65], h: 2.55, name: "Pipeline", you: true },
] as const;
const DROP = 1.7;
const drop = (s: number) => easeOut(span(s, 0, 0.3));
/** Ports light in visiting order as the hub's story ends. */
const portLit = (s: number, i: number) =>
  span(s, 0.62 + i * 0.07, 0.72 + i * 0.07);

const GLYPHS = ["</>", "search", "r/", "play"] as const;

// ── Prints ──

function drawApp(ctx: Ctx, w: number, h: number) {
  const c = colors();
  const k = w / 600;
  ctx.save();
  ctx.scale(k, k);
  const W = 600;
  const H = h / k;
  rrect(ctx, 0, 0, W, H, 26, "#ffffff");
  // Window bar.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 26);
  ctx.clip();
  ctx.fillStyle = c.shade;
  ctx.fillRect(0, 0, W, 50);
  ctx.restore();
  [28, 48, 68].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 25, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#dcd8cd";
    ctx.fill();
  });
  // Brand: a green diamond mark, the name.
  const mx = 44;
  const my = 106;
  rrect(ctx, mx - 24, my - 24, 48, 48, 13, c.ink);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(Math.PI / 4);
  rrect(ctx, -10, -10, 20, 20, 4, c.primary);
  ctx.restore();
  setFont(ctx, 40, 620);
  ctx.letterSpacing = "-1.2px";
  ctx.fillStyle = c.ink;
  ctx.fillText("Your product", 84, my + 14);
  ctx.letterSpacing = "0px";
  // UI: a sidebar of rows, a chart card.
  ctx.fillStyle = c.soft;
  [0.6, 0.45, 0.52, 0.38].forEach((f, i) =>
    rrect(
      ctx,
      22,
      160 + i * 34,
      150 * f,
      12,
      6,
      i === 0 ? c.lightGreenSoft : c.soft,
    ),
  );
  rrect(ctx, 200, 152, W - 222, H - 174, 16, undefined, c.line, 2);
  const bars = [0.35, 0.5, 0.42, 0.66, 0.58, 0.8, 0.95];
  const bw = (W - 262) / bars.length;
  bars.forEach((f, i) => {
    const bh = (H - 220) * f;
    rrect(
      ctx,
      220 + i * bw,
      H - 42 - bh,
      bw - 10,
      bh,
      5,
      i === bars.length - 1 ? c.primary : c.lightGreenSoft,
    );
  });
  ctx.restore();
}

function drawPlate(ctx: Ctx, w: number, h: number, i: number) {
  const c = colors();
  const k = h / 140;
  ctx.save();
  ctx.scale(k, k);
  const W = w / k;
  // Engraved plate: a soft inset panel, an icon tile, the port number and the channel on two lines.
  rrect(ctx, 4, 4, W - 8, 132, 18, "#fbfaf7", c.line, 2);
  rrect(ctx, 20, 26, 88, 88, 16, c.ink);
  ctx.fillStyle = c.primary;
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const g = GLYPHS[i];
  if (g === "search") {
    ctx.beginPath();
    ctx.arc(60, 66, 16, 0, Math.PI * 2);
    ctx.moveTo(72, 78);
    ctx.lineTo(84, 90);
    ctx.stroke();
  } else if (g === "play") {
    ctx.beginPath();
    ctx.moveTo(52, 48);
    ctx.lineTo(82, 70);
    ctx.lineTo(52, 92);
    ctx.closePath();
    ctx.fill();
  } else {
    setFont(ctx, 34, 600, true);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g, 64, 72);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  setFont(ctx, 18, 500, true);
  ctx.letterSpacing = "3px";
  ctx.fillStyle = c.muted;
  ctx.fillText(`PORT 0${i + 1}`, 130, 54);
  setFont(ctx, 30, 600);
  ctx.letterSpacing = "-0.6px";
  ctx.fillStyle = c.ink;
  const name = LANE_NAMES[i];
  const words = name.split(" ");
  // Fits on one line where it can; otherwise breaks before the last word.
  if (ctx.measureText(name).width < W - 150) ctx.fillText(name, 130, 96);
  else {
    setFont(ctx, 26, 600);
    ctx.fillText(words.slice(0, -1).join(" "), 130, 86);
    ctx.fillText(words[words.length - 1], 130, 116);
  }
  // A status line: lit when the port is.
  ctx.restore();
}

/** The tray's top: registration marks at the corners and a faint dot grid, like a machine bed. */
function drawTray(ctx: Ctx, w: number, h: number) {
  const c = colors();
  ctx.fillStyle = c.line;
  ctx.globalAlpha = 0.35;
  const step = w / 14;
  for (let x = step; x < w - step / 2; x += step)
    for (let y = step; y < h - step / 2; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, w * 0.003, 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = w * 0.004;
  const m = w * 0.05;
  const l = w * 0.08;
  for (const [x, y, dx, dy] of [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * l, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBaseFront(ctx: Ctx, w: number, h: number) {
  const c = colors();
  // Left: the engraved name. Right: vent slots.
  setFont(ctx, h * 0.34, 500, true);
  ctx.letterSpacing = `${h * 0.12}px`;
  ctx.fillStyle = c.muted;
  ctx.textBaseline = "middle";
  ctx.fillText("DEVABLE · GROWTH SYSTEM", h * 0.3, h / 2 + 1);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 9; i++)
    rrect(
      ctx,
      w * 0.66 + i * h * 0.34,
      h * 0.28,
      h * 0.12,
      h * 0.44,
      h * 0.06,
      c.line,
    );
  ctx.globalAlpha = 1;
}

function drawBeam(ctx: Ctx, w: number, h: number) {
  const c = colors();
  ctx.beginPath();
  ctx.arc(h * 0.5, h / 2, h * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  setFont(ctx, h * 0.34, 500, true);
  ctx.letterSpacing = `${h * 0.12}px`;
  ctx.fillStyle = c.muted;
  ctx.textBaseline = "middle";
  ctx.fillText("PRODUCT SCAN", h * 0.9, h / 2 + 1);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 5; i++)
    rrect(
      ctx,
      w - h * 0.6 - i * h * 0.3,
      h * 0.3,
      h * 0.1,
      h * 0.4,
      h * 0.05,
      c.line,
    );
  ctx.globalAlpha = 1;
}

/** The scanner's light: mint from the beam, fading toward the tray, with fine scan lines. */
let curtainMap: CanvasTexture | null = null;
function curtainTexture() {
  if (curtainMap) return curtainMap;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(25,231,110,0.55)");
  g.addColorStop(0.5, "rgba(25,231,110,0.18)");
  g.addColorStop(1, "rgba(25,231,110,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let y = 0; y < 256; y += 8) ctx.fillRect(0, y, 64, 2);
  curtainMap = new CanvasTexture(canvas);
  curtainMap.colorSpace = SRGBColorSpace;
  curtainMap.wrapT = RepeatWrapping;
  return curtainMap;
}

// ── Labels ──

const portModuleAt = (i: number) =>
  DIRS[i].clone().multiplyScalar((PORT_MODULE.from + PORT_MODULE.reach) / 2);
/** A port module's printed side: icon, port number and channel name. */
function PortPlate({
  index,
  along,
  len,
}: {
  index: number;
  along: boolean;
  len: number;
}) {
  const map = useStatic(
    len - 0.1,
    PORT_MODULE.h - 0.1,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawPlate(ctx, w, h, index),
      [index],
    ),
  );
  return (
    <Print
      w={len - 0.1}
      h={PORT_MODULE.h - 0.1}
      map={map}
      position={
        along
          ? [0, PORT_MODULE.h / 2, PORT_MODULE.w / 2 + 0.003]
          : [PORT_MODULE.w / 2 + 0.003, PORT_MODULE.h / 2, 0]
      }
      rotation-y={along ? 0 : Math.PI / 2}
    />
  );
}

export function Hub() {
  const bandRef = useBand();
  const c = colors();
  const product = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const gantry = useRef<Group>(null);
  const curtain = useRef<MeshBasicMaterial>(null);
  const amber = useRef<Mesh>(null);
  const lamps = useRef<(Group | null)[]>([]);
  const bars = useRef<(Group | null)[]>([]);
  const app = useStatic(
    DEVICE.w - 0.12,
    DEVICE.h - 0.12,
    useCallback((ctx: Ctx, w: number, h: number) => drawApp(ctx, w, h), []),
  );
  const front = useStatic(
    PLATFORM.size - 0.9,
    PLATFORM.base * 0.8,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawBaseFront(ctx, w, h),
      [],
    ),
  );
  const tray = useStatic(
    TRAY.size - 0.1,
    TRAY.size - 0.1,
    useCallback((ctx: Ctx, w: number, h: number) => drawTray(ctx, w, h), []),
  );
  const beam = useStatic(
    GANTRY.span - 0.2,
    GANTRY.beam * 0.8,
    useCallback((ctx: Ctx, w: number, h: number) => drawBeam(ctx, w, h), []),
  );

  useFrame((state) => {
    const x = bandRef.current;
    const s = storyOf(x, 0);
    const t = state.clock.elapsedTime;
    // The product is lowered onto the tray, swaying slightly while it hangs.
    const d = drop(s);
    if (product.current) {
      product.current.position.y = (1 - d) * DROP;
      product.current.rotation.y = (1 - d) * Math.sin(t * 1.3) * 0.06;
    }
    if (shadow.current) {
      shadow.current.scale.set(2.2 - d * 0.5, 1.4 - d * 0.4, 1);
      (shadow.current.material as MeshBasicMaterial).opacity = 0.06 + d * 0.12;
    }
    // The gantry glides to and fro on its own; the curtain shimmers and its scan lines drift; the amber
    // status light blinks.
    const gz = Math.sin((t / GANTRY.period) * Math.PI * 2) * GANTRY.travel;
    if (gantry.current) gantry.current.position.z = gz;
    if (curtain.current) {
      curtain.current.opacity = 0.62 + 0.12 * Math.sin(t * 2.3);
      if (curtain.current.map) curtain.current.map.offset.y = -t * 0.12;
    }
    if (amber.current) amber.current.visible = Math.sin(t * 4.2) > -0.2;
    lamps.current.forEach((g, i) => {
      if (!g) return;
      const k = portLit(s, i);
      g.visible = k > 0;
      g.scale.setScalar(pop(k));
    });
    // The outcome columns rise at the last beat, shortest first.
    const out = storyOf(x, 5);
    BARS.forEach((bar, i) => {
      const g = bars.current[i];
      if (!g) return;
      const k = easeOut(span(out, 0.05 + i * 0.12, 0.5 + i * 0.12));
      g.visible = k > 0.001;
      g.scale.y = Math.max(0.001, k * bar.h);
    });
  });

  return (
    <group>
      <Shadow
        w={PLATFORM.size + 1.8}
        d={PLATFORM.size + 1.8}
        opacity={0.09}
        position-y={0.001}
      />
      {/* Two-tier plinth: base with an engraved front, stepped deck, recessed tray, corner screws. */}
      <Solid
        geometry={block(PLATFORM.size, PLATFORM.size, PLATFORM.base, 0.55)}
        color="#f6f5f1"
      />
      <Print
        w={PLATFORM.size - 0.9}
        h={PLATFORM.base * 0.8}
        map={front}
        position={[0, PLATFORM.base / 2, PLATFORM.size / 2 + 0.003]}
      />
      <Solid
        geometry={block(
          PLATFORM.deck,
          PLATFORM.deck,
          PLATFORM.h - PLATFORM.base,
          0.45,
        )}
        position-y={PLATFORM.base}
      />
      <Solid
        geometry={block(TRAY.size, TRAY.size, TRAY.h, 0.32)}
        color={mix(c.primary, "#ffffff", 0.9)}
        position-y={TOP}
      />
      <Print
        w={TRAY.size - 0.1}
        h={TRAY.size - 0.1}
        map={tray}
        position={[0, TOP + TRAY.h + 0.002, 0]}
        rotation-x={-Math.PI / 2}
      />
      {[-1, 1].flatMap((a) =>
        [-1, 1].map((b) => (
          <Solid
            key={`${a}${b}`}
            geometry={cylinder(0.055, 0.025)}
            color="#eeeeea"
            position={[a * 1.78, TOP, b * 1.78]}
          />
        )),
      )}

      {/* Port modules: docked on each edge, printed with their channel, a lamp, and a coupling for the pipe. */}
      {DIRS.map((dir, i) => {
        const along = dir.x !== 0;
        const len = PORT_MODULE.reach - PORT_MODULE.from;
        const centre = portModuleAt(i);
        // The printed side faces the camera: +z for modules running along x, +x for those along z.
        return (
          <group key={i} position={centre}>
            <Solid
              geometry={block(
                along ? len : PORT_MODULE.w,
                along ? PORT_MODULE.w : len,
                PORT_MODULE.h,
                0.1,
              )}
            />
            <PortPlate index={i} along={along} len={len} />
            <group
              position={[
                dir.x * (len / 2 - 0.2),
                PORT_MODULE.h,
                dir.z * (len / 2 - 0.2),
              ]}
            >
              <Solid geometry={cylinder(0.12, 0.03)} color="#eeeeea" />
              <group
                ref={(g) => void (lamps.current[i] = g)}
                visible={false}
                position-y={0.03}
              >
                <Solid geometry={cylinder(0.085, 0.045)} color={c.primary} />
              </group>
            </group>
            <group
              position={[dir.x * (len / 2), PIPE.r + 0.01, dir.z * (len / 2)]}
              rotation={along ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}
            >
              <Solid
                geometry={cylinder(PIPE.r + 0.05, 0.12)}
                position-y={-0.06}
              />
            </group>
          </group>
        );
      })}

      {/* Your product, lowered onto the tray. */}
      <group ref={product}>
        <Shadow ref={shadow} w={1} d={1} position-y={TOP + TRAY.h + 0.002} />
        <group position-y={TOP + TRAY.h}>
          <Solid geometry={block(0.9, 0.46, 0.06, 0.2)} />
          <Solid
            geometry={panel(0.18, DEVICE.lift + 0.2, 0.08, 0.06)}
            position-z={-0.07}
          />
          <Solid
            geometry={panel(DEVICE.w, DEVICE.h, DEVICE.t, 0.14)}
            position-y={DEVICE.lift}
          />
          <Print
            w={DEVICE.w - 0.12}
            h={DEVICE.h - 0.12}
            map={app}
            position={[0, DEVICE.lift + DEVICE.h / 2, DEVICE.t / 2 + 0.003]}
          />
        </group>
      </group>

      {/* The scanning gantry's rails, either side of the tray, with a green inlay. */}
      {[-1, 1].map((a) => (
        <group key={a} position={[a * RAIL.x, TOP, 0]}>
          <Solid
            geometry={block(RAIL.w, RAIL.len, RAIL.h, 0.06)}
            color="#e6e4dd"
          />
          <mesh position-y={RAIL.h + 0.002} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.03, RAIL.len - 0.2]} />
            <meshBasicMaterial color={c.primary} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* The gantry: carriages, pillars with light strips, a beam with its emitter and status lights. */}
      <group ref={gantry}>
        {[-1, 1].map((a) => (
          <group key={a} position={[a * RAIL.x, TOP, 0]}>
            <Solid
              geometry={block(0.36, GANTRY.depth + 0.14, 0.12, 0.06)}
              color={c.ink}
            />
            <Solid
              geometry={block(GANTRY.pillar, GANTRY.depth, GANTRY.h, 0.09)}
              position-y={0.12}
            />
            <mesh position={[0, 0.12 + GANTRY.h / 2, GANTRY.depth / 2 + 0.004]}>
              <planeGeometry args={[0.04, GANTRY.h - 0.5]} />
              <meshBasicMaterial color={c.primary} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <Solid
          geometry={block(GANTRY.span, GANTRY.depth, GANTRY.beam, 0.12)}
          position-y={TOP + 0.12 + GANTRY.h}
        />
        <Print
          w={GANTRY.span - 0.2}
          h={GANTRY.beam * 0.8}
          map={beam}
          position={[
            0,
            TOP + 0.12 + GANTRY.h + GANTRY.beam / 2,
            GANTRY.depth / 2 + 0.003,
          ]}
        />
        <group
          position={[
            GANTRY.span / 2 - 0.3,
            TOP + 0.12 + GANTRY.h + GANTRY.beam,
            0,
          ]}
        >
          <Solid geometry={cylinder(0.07, 0.03)} color="#eeeeea" />
          <mesh ref={amber} position-y={0.04}>
            <sphereGeometry args={[0.045, 16, 12]} />
            <meshBasicMaterial color={c.secondary} toneMapped={false} />
          </mesh>
        </group>
        {/* Emitter under the beam, and the curtain it casts. */}
        <group position-y={TOP + 0.12 + GANTRY.h}>
          <Solid
            geometry={block(
              GANTRY.span - GANTRY.pillar * 2 - 0.16,
              0.18,
              0.07,
              0.05,
            )}
            color={c.ink}
            position-y={-0.07}
          />
          <mesh position-y={-0.075}>
            <boxGeometry
              args={[GANTRY.span - GANTRY.pillar * 2 - 0.3, 0.012, 0.05]}
            />
            <meshBasicMaterial color={c.primary} toneMapped={false} />
          </mesh>
        </group>
        <mesh
          position={[0, TOP + 0.12 + GANTRY.h / 2 - 0.02, 0]}
          renderOrder={3}
        >
          <planeGeometry
            args={[GANTRY.span - GANTRY.pillar * 2 - 0.12, GANTRY.h - 0.12]}
          />
          <meshBasicMaterial
            ref={curtain}
            map={curtainTexture()}
            transparent
            opacity={0.6}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Beat 5: the outcome columns. */}
      {BARS.map((bar, i) => (
        <group
          key={bar.name}
          ref={(g) => void (bars.current[i] = g)}
          position={[bar.at[0], TOP, bar.at[1]]}
          visible={false}
        >
          <Solid
            geometry={block(0.56, 0.56, 1, 0.14)}
            color={"you" in bar ? c.mint : "#ffffff"}
          />
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────── Pipes ───────────────────────────────

/**
 * Pipes from the hub's ports into the back of each station. Each one's fibre lights from the hub outward
 * as the camera first travels to its station; pulses keep flowing out, and reverse home at the last beat.
 */
export function Pipes() {
  const bandRef = useBand();
  const c = colors();
  const pipes = useMemo(
    () =>
      ROUTES.map((route) => {
        const path = routePath(route);
        const length = path.getLength();
        const segs = Math.ceil(length * 14);
        return {
          shell: new TubeGeometry(path, segs, PIPE.r, 16, false),
          fibre: new TubeGeometry(path, segs, PIPE.fibre, 10, false),
          material: fibreMaterial(mix(c.primary, c.ink, 0.22), "#e2e6df", mix(c.primary, "#ffffff", 0.45), length),
        };
      }),
    [c.primary, c.ink],
  );
  const shell = useMemo(() => shellMaterial(c.line), [c.line]);
  const phase = useRef(0);

  useFrame((_, delta) => {
    const x = bandRef.current;
    // Out to the stations, then home to the hub for the closing beat (easing through a stop).
    const dir = 1 - 2 * easeInOut(span(x, 4.4, 4.75));
    phase.current += Math.min(delta, 1 / 30) * 0.85 * dir;
    pipes.forEach((pipe, i) => {
      // Lights while the camera travels to station i + 1.
      pipe.material.uniforms.lit.value = easeInOut(span(x, i + 0.36, i + 0.64));
      pipe.material.uniforms.phase.value = phase.current;
    });
  });

  return (
    <group>
      {pipes.map((pipe, i) => (
        <group key={i}>
          <mesh geometry={pipe.fibre} material={pipe.material} />
          <mesh geometry={pipe.shell} material={shell} renderOrder={2} />
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────── Beat 5: every station named ───────────────────────────────

/** Each station's name, pinned just above its tallest piece. */
const STATION_LABELS: [string, [number, number, number]][] = [
  ["01 · Technical Content", [AT.content.x - 0.2, 2.75, AT.content.z - 1.7]],
  ["02 · Search & AI Visibility", [AT.search.x, 4.0, AT.search.z]],
  ["03 · Reddit", [AT.reddit.x, 3.4, AT.reddit.z - 0.4]],
  ["04 · Creator Distribution", [AT.creators.x, 3.0, AT.creators.z]],
];
export const OVERVIEW_LABELS: LabelSpec[] = [
  ...STATION_LABELS.map(([name, p], i): LabelSpec => ({
    key: `station-${i}`,
    at: p,
    text: name,
    beat: 5,
    from: 0.1 + i * 0.06,
  })),
];
