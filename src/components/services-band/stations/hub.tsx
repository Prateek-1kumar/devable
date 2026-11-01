import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { toCreasedNormals } from "three-stdlib";
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
  easeOut,
  panel,
  pop,
  rrect,
  setFont,
  useBand,
  useStatic,
} from "../kit";
import { AT, DIRS, LANE_NAMES, PLATFORM, PORT_MODULE, ROUTES } from "../layout";
import { Channel } from "../fibre";

// Beat 0, the hub: the Devable engine. Your product (a small white display showing its app) is lowered onto
// the engine's tray; a scanning gantry slides over it, casting a light curtain (we learn it inside out); then
// the four port modules light one by one, each printed with its channel, and light starts down their pipes.
// The pipes: glass tubes with a green fibre inside, carrying pulses of light out to each station.
// Beat 5 also lives here: the light reverses, flowing back from every station to the hub, and the outcome
// columns rise from the deck's free corners.

type Ctx = CanvasRenderingContext2D;

const TOP = PLATFORM.h; // deck surface
/** The brand green's deep variant, for the machine's structural parts. */
const FOREST = "#1d5c3a";
const TRAY = { size: 2.5, h: 0.02 };
/** The product: a display on a small stand, centred on the tray. */
const DEVICE = { w: 1.62, h: 1.1, t: 0.14, lift: 0.24 };
/**
 * The scanner: a deep-green ring arch (like a CT scanner) on carriages that run in rails either side of the
 * tray. Its mint inner lip glows and it casts a light curtain; it glides to and fro on its own (not with
 * scroll) while the band is in view.
 */
const RING = {
  r: 1.84,
  band: 0.26,
  depth: 0.36,
  lift: 0.14,
  travel: 1.0,
  period: 11.5,
};
const RAIL = { x: RING.r - RING.band / 2, len: 2.7, w: 0.22, h: 0.04 };

/** Half an annulus in the x–y plane (outer radius `r`, `band` thick), extruded `depth` along z (centred). */
function archGeometry(r: number, band: number, depth: number, bevel = 0.03) {
  const shape = new Shape();
  shape.absarc(0, 0, r, 0, Math.PI, false);
  shape.lineTo(-(r - band), 0);
  shape.absarc(0, 0, r - band, Math.PI, 0, true);
  shape.lineTo(r, 0);
  const g = new ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
    curveSegments: 72,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return toCreasedNormals(g, Math.PI / 5);
}
const ARCH = archGeometry(RING.r, RING.band, RING.depth);
const LIP = archGeometry(RING.r - RING.band + 0.025, 0.03, 0.1, 0);

/** The outcome columns in the deck's free corners: reach, demand and (tallest, mint) pipeline. */
const BARS = [
  { at: [-1.6, 1.6], h: 0.9, name: "Reach" },
  { at: [1.65, -1.65], h: 1.5, name: "Demand" },
  { at: [-1.65, -1.65], h: 2.55, name: "Pipeline", you: true },
] as const;
const DROP = 0.42;
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
  // A light engraved label: an inset panel, a mint icon tile, the port number and the channel, large.
  rrect(ctx, 3, 4, W - 6, 132, 20, "#f4f3ee", "rgba(23,44,33,0.12)", 2);
  rrect(ctx, 16, 32, 76, 76, 18, c.lightGreenSoft);
  ctx.fillStyle = c.deep;
  ctx.strokeStyle = c.deep;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const g = GLYPHS[i];
  if (g === "search") {
    ctx.beginPath();
    ctx.arc(50, 66, 14, 0, Math.PI * 2);
    ctx.moveTo(60, 76);
    ctx.lineTo(71, 87);
    ctx.stroke();
  } else if (g === "play") {
    ctx.beginPath();
    ctx.moveTo(44, 50);
    ctx.lineTo(68, 70);
    ctx.lineTo(44, 90);
    ctx.closePath();
    ctx.fill();
  } else {
    setFont(ctx, 30, 650, true);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g, 54, 72);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  setFont(ctx, 16, 500, true);
  ctx.letterSpacing = "2.5px";
  ctx.fillStyle = c.muted;
  ctx.fillText(`PORT 0${i + 1}`, 108, 34);
  ctx.letterSpacing = "-0.8px";
  ctx.fillStyle = c.ink;
  setFont(ctx, 36, 620);
  const words = LANE_NAMES[i].split(" ");
  const lines =
    words.length > 1
      ? [words.slice(0, -1).join(" "), words[words.length - 1]]
      : words;
  lines.forEach((line, n) =>
    ctx.fillText(line, 108, lines.length > 1 ? 76 + n * 40 : 92),
  );
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
  // An inset nameplate on the left, a status light, panel seams either side of the port, and vents.
  const pw = h * 9.5;
  rrect(
    ctx,
    h * 0.1,
    h * 0.12,
    pw,
    h * 0.76,
    h * 0.2,
    "#efeee8",
    "rgba(23,44,33,0.14)",
    Math.max(1.5, h * 0.02),
  );
  ctx.beginPath();
  ctx.arc(h * 0.5, h / 2, h * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  ctx.textBaseline = "middle";
  setFont(ctx, h * 0.38, 650);
  ctx.letterSpacing = `${h * 0.02}px`;
  ctx.fillStyle = c.ink;
  ctx.fillText("Devable", h * 0.8, h / 2 + 1);
  const dw = ctx.measureText("Devable").width;
  setFont(ctx, h * 0.26, 500, true);
  ctx.letterSpacing = `${h * 0.08}px`;
  ctx.fillStyle = c.muted;
  ctx.fillText("GROWTH SYSTEM · GS-01", h * 1.1 + dw, h / 2 + 1);
  ctx.letterSpacing = "0px";
  seams(ctx, w, h, [0.38, 0.62]);
  vents(ctx, w - h * 0.5, h, 14);
}

/** Vertical panel seams at the given fractions of the width: a dark hairline with a light one beside it. */
function seams(ctx: Ctx, w: number, h: number, at: number[]) {
  for (const f of at) {
    ctx.fillStyle = "rgba(23,44,33,0.16)";
    ctx.fillRect(w * f, 0, Math.max(1.5, h * 0.02), h);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(
      w * f + Math.max(1.5, h * 0.02),
      0,
      Math.max(1.5, h * 0.02),
      h,
    );
  }
}

/** `n` machined vent slots ending at x = `right`. */
function vents(ctx: Ctx, right: number, h: number, n: number) {
  const c = colors();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < n; i++)
    rrect(
      ctx,
      right - (i + 1) * h * 0.32,
      h * 0.26,
      h * 0.12,
      h * 0.48,
      h * 0.06,
      c.line,
    );
  ctx.globalAlpha = 1;
}

/** The base's right side: seams either side of the port, vents, a serial plate and two screws. */
function drawBaseSide(ctx: Ctx, w: number, h: number) {
  const c = colors();
  seams(ctx, w, h, [0.36, 0.64]);
  vents(ctx, w * 0.3, h, 8);
  rrect(
    ctx,
    w * 0.7,
    h * 0.18,
    h * 4.2,
    h * 0.64,
    h * 0.16,
    "#efeee8",
    "rgba(23,44,33,0.14)",
    Math.max(1.5, h * 0.02),
  );
  setFont(ctx, h * 0.24, 500, true);
  ctx.letterSpacing = `${h * 0.06}px`;
  ctx.fillStyle = c.muted;
  ctx.textBaseline = "middle";
  ctx.fillText("SN 0042 · REV B", w * 0.7 + h * 0.3, h / 2 + 1);
  ctx.letterSpacing = "0px";
  for (const x of [w * 0.96, w * 0.04]) {
    ctx.beginPath();
    ctx.arc(x, h / 2, h * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = "#e4e2db";
    ctx.fill();
    ctx.strokeStyle = "rgba(23,44,33,0.25)";
    ctx.lineWidth = Math.max(1, h * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - h * 0.06, h / 2);
    ctx.lineTo(x + h * 0.06, h / 2);
    ctx.stroke();
  }
}

/** The deck's top: an engraved hairline border inset from its edge, with registration ticks. */
function drawDeckTop(ctx: Ctx, w: number) {
  const m = w * 0.035;
  ctx.strokeStyle = "rgba(23,44,33,0.12)";
  ctx.lineWidth = Math.max(1.5, w * 0.0025);
  ctx.beginPath();
  ctx.roundRect(m, m, w - m * 2, w - m * 2, w * 0.08);
  ctx.stroke();
  ctx.strokeStyle = "rgba(23,44,33,0.18)";
  for (let i = 1; i < 12; i++) {
    const x = (w * i) / 12;
    ctx.beginPath();
    ctx.moveTo(x, m * 0.25);
    ctx.lineTo(x, m * (i % 3 === 0 ? 0.85 : 0.6));
    ctx.moveTo(m * 0.25, x);
    ctx.lineTo(m * (i % 3 === 0 ? 0.85 : 0.6), x);
    ctx.stroke();
  }
}

/** A rounded-rectangle outline as a flat ring: `size` across, `r` corner radius, `width` thick. */
function outline(size: number, r: number, width: number) {
  const rect = (w: number, rr: number) => {
    const sh = new Shape();
    const x = -w / 2;
    sh.moveTo(x + rr, x);
    sh.lineTo(-x - rr, x);
    sh.absarc(-x - rr, x + rr, rr, -Math.PI / 2, 0, false);
    sh.lineTo(-x, -x - rr);
    sh.absarc(-x - rr, -x - rr, rr, 0, Math.PI / 2, false);
    sh.lineTo(x + rr, -x);
    sh.absarc(x + rr, -x - rr, rr, Math.PI / 2, Math.PI, false);
    sh.lineTo(x, x + rr);
    sh.absarc(x + rr, x + rr, rr, Math.PI, Math.PI * 1.5, false);
    return sh;
  };
  const outer = rect(size, r);
  outer.holes.push(rect(size - width * 2, r - width));
  return new ShapeGeometry(outer, 24);
}
const SKIRT = { h: 0.05, inset: 0.07 };
const GLOW_LINE = outline(PLATFORM.size - 0.24, 0.43, 0.012);

/**
 * The ring's front face: "PRODUCT SCAN" set along the arch's curve (centred on its crown), with a green
 * status dot leading it. Drawn on a canvas covering the arch's half-disc; the centre is the bottom middle.
 */
function drawBeam(ctx: Ctx, w: number, h: number) {
  const c = colors();
  const unit = w / (RING.r * 2);
  const cx = w / 2;
  const cy = h;
  const radius = (RING.r - RING.band / 2) * unit;
  const size = RING.band * 0.4 * unit;
  const text = "PRODUCT SCAN";
  setFont(ctx, size, 600, true);
  const track = size * 0.32;
  const widths = [...text].map((ch) => ctx.measureText(ch).width + track);
  const total = widths.reduce((a, b) => a + b, 0) - track;
  const dot = size * 0.9;
  // Angles run clockwise from the left; the run (dot + text) is centred on the crown.
  let angle = -Math.PI / 2 - (total + dot) / radius / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.save();
  ctx.rotate(angle + Math.PI / 2 + (size * 0.2) / radius);
  ctx.beginPath();
  ctx.arc(0, -radius, size * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  ctx.restore();
  angle += dot / radius;
  ctx.fillStyle = c.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  [...text].forEach((ch, i) => {
    const a = angle + widths[i] / 2 / radius;
    ctx.save();
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, -radius);
    ctx.restore();
    angle += widths[i] / radius;
  });
  ctx.restore();
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
/** The part of a port module that stands clear of the base, where its label goes (module-local). */
const PLATE = {
  len: PORT_MODULE.reach - PLATFORM.size / 2 - 0.12,
  at:
    (PORT_MODULE.reach + PLATFORM.size / 2) / 2 -
    (PORT_MODULE.from + PORT_MODULE.reach) / 2,
};

function PortPlate({
  index,
  along,
}: {
  index: number;
  along: boolean;
  len?: number;
}) {
  const len = PLATE.len + 0.1;
  const d = DIRS[index];
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
          ? [d.x * PLATE.at, PORT_MODULE.h / 2, PORT_MODULE.w / 2 + 0.003]
          : [PORT_MODULE.w / 2 + 0.003, PORT_MODULE.h / 2, d.z * PLATE.at]
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
  const lamps = useRef<(Group | null)[]>([]);
  const bars = useRef<(Group | null)[]>([]);
  const app = useStatic(
    DEVICE.w - 0.12,
    DEVICE.h - 0.12,
    useCallback((ctx: Ctx, w: number, h: number) => drawApp(ctx, w, h), []),
  );
  const front = useStatic(
    PLATFORM.size - 0.9,
    (PLATFORM.base - SKIRT.h) * 0.8,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawBaseFront(ctx, w, h),
      [],
    ),
  );
  const side = useStatic(
    PLATFORM.size - 0.9,
    (PLATFORM.base - SKIRT.h) * 0.8,
    useCallback(
      (ctx: Ctx, w: number, h: number) => drawBaseSide(ctx, w, h),
      [],
    ),
  );
  const deckTop = useStatic(
    PLATFORM.deck - 0.1,
    PLATFORM.deck - 0.1,
    useCallback((ctx: Ctx, w: number) => drawDeckTop(ctx, w), []),
    0.8,
  );
  const tray = useStatic(
    TRAY.size - 0.1,
    TRAY.size - 0.1,
    useCallback((ctx: Ctx, w: number, h: number) => drawTray(ctx, w, h), []),
  );
  const beam = useStatic(
    RING.r * 2,
    RING.r,
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
    // The scanner glides to and fro on its own; the curtain shimmers and its scan lines drift.
    const gz = Math.sin((t / RING.period) * Math.PI * 2) * RING.travel;
    if (gantry.current) gantry.current.position.z = gz;
    if (curtain.current) {
      curtain.current.opacity = 0.62 + 0.12 * Math.sin(t * 2.3);
      if (curtain.current.map) curtain.current.map.offset.y = -t * 0.12;
    }
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
      {/* Two-tier plinth. The base stands on a recessed skirt (a shadow gap at the floor), with seamed and
          vented sides, a nameplate, and a soft light line round its top; a gasket line separates it from the
          deck, whose top carries an engraved border. */}
      <Solid
        geometry={block(
          PLATFORM.size - SKIRT.inset * 2,
          PLATFORM.size - SKIRT.inset * 2,
          SKIRT.h,
          0.5,
        )}
        color="#d9d6cd"
      />
      <Solid
        geometry={block(
          PLATFORM.size,
          PLATFORM.size,
          PLATFORM.base - SKIRT.h,
          0.55,
        )}
        color="#f1efe9"
        position-y={SKIRT.h}
      />
      <Print
        w={PLATFORM.size - 0.9}
        h={(PLATFORM.base - SKIRT.h) * 0.8}
        map={front}
        position={[0, (PLATFORM.base + SKIRT.h) / 2, PLATFORM.size / 2 + 0.003]}
      />
      <Print
        w={PLATFORM.size - 0.9}
        h={(PLATFORM.base - SKIRT.h) * 0.8}
        map={side}
        position={[PLATFORM.size / 2 + 0.003, (PLATFORM.base + SKIRT.h) / 2, 0]}
        rotation-y={Math.PI / 2}
      />
      <mesh
        geometry={GLOW_LINE}
        rotation-x={-Math.PI / 2}
        position-y={PLATFORM.base + 0.002}
      >
        <meshBasicMaterial
          color={mix(c.primary, "#ffffff", 0.35)}
          toneMapped={false}
        />
      </mesh>
      <Solid
        geometry={block(
          PLATFORM.deck + 0.05,
          PLATFORM.deck + 0.05,
          0.022,
          0.47,
        )}
        color="#d9d6cd"
        position-y={PLATFORM.base}
      />
      <Solid
        geometry={block(
          PLATFORM.deck,
          PLATFORM.deck,
          PLATFORM.h - PLATFORM.base - 0.022,
          0.45,
        )}
        position-y={PLATFORM.base + 0.022}
      />
      <Print
        w={PLATFORM.deck - 0.1}
        h={PLATFORM.deck - 0.1}
        map={deckTop}
        position={[0, TOP + 0.002, 0]}
        rotation-x={-Math.PI / 2}
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

      {/* The scanner's rails, either side of the tray, with a mint inlay. */}
      {[-1, 1].map((a) => (
        <group key={a} position={[a * RAIL.x, TOP, 0]}>
          <Solid
            geometry={block(RAIL.w, RAIL.len, RAIL.h, 0.08)}
            color="#e6e4dd"
          />
          <mesh position-y={RAIL.h + 0.002} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.035, RAIL.len - 0.24]} />
            <meshBasicMaterial color={c.primary} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* The scanner ring: deep-green carriages, the arch with its glowing lip, crown plate and indicator
          button, and the light curtain it casts. */}
      <group ref={gantry}>
        {[-1, 1].map((a) => (
          <Solid
            key={a}
            geometry={block(0.42, RING.depth + 0.2, RING.lift, 0.08)}
            color={FOREST}
            position={[a * RAIL.x, TOP, 0]}
          />
        ))}
        <group position-y={TOP + RING.lift}>
          <Solid geometry={ARCH} color="#f3f2ed" />
          <mesh geometry={LIP}>
            <meshBasicMaterial color={c.primary} toneMapped={false} />
          </mesh>
          <Print
            w={RING.r * 2}
            h={RING.r}
            map={beam}
            position={[0, RING.r / 2, RING.depth / 2 + 0.004]}
          />
          {/* Indicator button, flush on the ring's front face: a bezel and a domed orange cap. */}
          <group
            position={[
              Math.cos(Math.PI / 3.2) * (RING.r - RING.band / 2),
              Math.sin(Math.PI / 3.2) * (RING.r - RING.band / 2),
              RING.depth / 2,
            ]}
            rotation-x={Math.PI / 2}
          >
            <Solid geometry={cylinder(0.09, 0.025)} color="#e6e4dd" />
            <Solid
              geometry={cylinder(0.065, 0.05)}
              color={c.secondary}
              position-y={0.012}
            />
          </group>
          <mesh renderOrder={3}>
            <circleGeometry
              args={[RING.r - RING.band - 0.01, 72, 0, Math.PI]}
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
/** The four channels from the hub to the stations: always lit, light flowing outward while in view. */
export function Pipes() {
  return (
    <group>
      {ROUTES.map((route, i) => (
        <Channel key={i} route={route} />
      ))}
    </group>
  );
}

// ─────────────────────────────── Beat 5: every station named ───────────────────────────────

/** Each station's name, pinned just above its tallest piece. */
/** Each station's name for the overview, pinned to a point with clear sky above it (the pill sits above). */
const STATION_LABELS: [string, string, [number, number, number]][] = [
  ["01", "Technical Content", [AT.content.x - 0.2, 2.5, AT.content.z - 1.7]],
  ["02", "Search & AI Visibility", [AT.search.x, 3.35, AT.search.z]],
  ["03", "Reddit", [AT.reddit.x, 3.45, AT.reddit.z]],
  [
    "04",
    "Creator Distribution",
    [AT.creators.x - 1.8, 1.9, AT.creators.z + 0.8],
  ],
];
export const OVERVIEW_LABELS: LabelSpec[] = STATION_LABELS.map(
  ([n, name, p], i): LabelSpec => ({
    key: `station-${i}`,
    at: p,
    n,
    text: name,
    beat: 5,
    from: 0.1 + i * 0.08,
  }),
);
