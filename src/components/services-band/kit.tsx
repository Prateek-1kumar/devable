import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useRef,
  type Ref,
  type RefObject,
} from "react";
import { useThree, type ThreeElements } from "@react-three/fiber";
import { Edges, Outlines } from "@react-three/drei";
import { toCreasedNormals } from "three-stdlib";
import {
  CanvasTexture,
  CustomBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  CylinderGeometry,
  ExtrudeGeometry,
  Matrix4,
  Quaternion,
  Shape,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type BufferGeometry,
  type ColorRepresentation,
  type Group,
  type Texture,
} from "three";
import { drawGlyph } from "../growth-engine/channels";
import { paintMark } from "../growth-engine/marks";
import { mix, palette } from "../growth-engine/palette";
import { MARKS, MARK_COLOR } from "../how-we-work/marks";

// The band's drawing kit. The look is a technical illustration: white solids rounded in plan, flat-lit, with
// thin soft-ink rims and silhouettes and soft contact shadows, on a faint floor grid. Mint carries "yours",
// brand green is kept for small accents (lines, dots, strips), orange for votes and sparks.

// ── The camera: orthographic, 30° above the floor, turned 30° off the front so screens read almost square. ──
const AZIMUTH = (30 * Math.PI) / 180;
const ELEVATION = (30 * Math.PI) / 180;
export const VIEW = new Vector3(
  Math.sin(AZIMUTH) * Math.cos(ELEVATION),
  Math.sin(ELEVATION),
  Math.cos(AZIMUTH) * Math.cos(ELEVATION),
);
export const RIGHT = new Vector3(Math.cos(AZIMUTH), 0, -Math.sin(AZIMUTH));
export const UP = new Vector3().crossVectors(VIEW, RIGHT);
/** Turns a plane to face the camera, square to the screen. */
export const FACE = new Quaternion().setFromRotationMatrix(
  new Matrix4().makeBasis(RIGHT, UP, VIEW),
);

// ── Colours (read from the page tokens on first use; the scene is client-only). ──
export const colors = () => {
  const p = palette();
  return {
    ...p,
    /** Outlines and rims: ink, softened. */
    line: mix(p.ink, "#ffffff", 0.38),
    /** Off-white panels inside screens (the site's #f4f2eb). */
    shade: "#f4f2eb",
    /** Faint ink for placeholder text bars. */
    soft: mix(p.ink, "#ffffff", 0.88),
    /** "Yours" as a solid: a fresh mint, softer than the brand green on white. */
    mint: mix(p.primary, "#ffffff", 0.62),
    /** Deeper green for text and strokes on light grounds. */
    deep: mix(p.primary, p.ink, 0.45),
  };
};

/** The scroll position in beats, damped by the camera rig each frame; stations read it in useFrame. */
export const BandContext = createContext<RefObject<number>>({ current: 0 });
export const useBand = () => useContext(BandContext);

// ── Motion helpers ──
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
/** Overshoots a touch and settles: for things that pop into place. */
export const easeBack = (t: number) => {
  const c = 1.5;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};
/** A size that pops from nothing to 1 (never exactly 0, which three dislikes). */
export const pop = (t: number) =>
  Math.max(0.0001, t <= 0 ? 0 : t >= 1 ? 1 : easeBack(t));

// ── Geometry: rounded rectangles extruded, cached by size. Normals are smoothed round the rounded corners
// (no facet banding) and kept sharp at the rims. ──
function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

const cache = new Map<string, BufferGeometry>();
const cached = (key: string, make: () => BufferGeometry) => {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = make()));
  return g;
};

/** A block rounded in plan: `w` along x, `d` along z, `h` tall, standing on y = 0. */
export const block = (w: number, d: number, h: number, r = 0.14) =>
  cached(`b${w},${d},${h},${r}`, () => {
    const g = new ExtrudeGeometry(roundedRect(w, d, r), {
      depth: h,
      bevelEnabled: false,
      curveSegments: 12,
    });
    g.rotateX(-Math.PI / 2);
    return toCreasedNormals(g, Math.PI / 4);
  });

/** A panel rounded in its face: `w` wide, `h` tall from y = 0, `t` thick along z (centred), face toward +z. */
export const panel = (w: number, h: number, t: number, r = 0.12) =>
  cached(`p${w},${h},${t},${r}`, () => {
    const g = new ExtrudeGeometry(roundedRect(w, h, r), {
      depth: t,
      bevelEnabled: false,
      curveSegments: 12,
    });
    g.translate(0, h / 2, -t / 2);
    return toCreasedNormals(g, Math.PI / 4);
  });

/** A round column `r` across, `h` tall, standing on y = 0. */
export const cylinder = (r: number, h: number) =>
  cached(`c${r},${h}`, () =>
    new CylinderGeometry(r, r, h, 56).translate(0, h / 2, 0),
  );

/** Reddit's upvote arrow, extruded a little, centred on its middle. */
export const upvote = () =>
  cached("upvote", () => {
    const pts = [
      [0, 0.28],
      [0.25, 0.03],
      [0.1, 0.03],
      [0.1, -0.22],
      [-0.1, -0.22],
      [-0.1, 0.03],
      [-0.25, 0.03],
    ];
    const g = new ExtrudeGeometry(
      new Shape(pts.map(([x, y]) => new Vector2(x, y))),
      { depth: 0.08, bevelEnabled: false },
    );
    return g.translate(0, 0, -0.04);
  });

/**
 * A solid in the illustration style: flat-lit fill, soft-ink rims where faces meet at an angle, and a
 * silhouette a little over a pixel wide.
 */
export function Solid({
  geometry,
  color = "#fbfaf7",
  ref,
  ...props
}: {
  geometry: BufferGeometry;
  color?: ColorRepresentation;
  ref?: Ref<Group>;
} & Omit<ThreeElements["group"], "ref">) {
  const dpr = useThree((s) => s.viewport.dpr);
  const line = colors().line;
  return (
    <group ref={ref} {...props}>
      <mesh geometry={geometry}>
        <meshLambertMaterial
          color={color}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
        <Edges threshold={35} color={line} lineWidth={1} />
        <Outlines thickness={1.2 * dpr} color={line} />
      </mesh>
    </group>
  );
}

// A soft radial falloff, shared by every contact shadow.
let shadowMap: Texture | null = null;
export function shadowTexture() {
  if (shadowMap) return shadowMap;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.45, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowMap = new CanvasTexture(canvas);
  shadowMap.colorSpace = SRGBColorSpace;
  return shadowMap;
}

/** A soft contact shadow on the floor (or on a slab), `w` × `d` across. */
export function Shadow({
  w,
  d,
  opacity = 0.11,
  ...props
}: { w: number; d: number; opacity?: number } & ThreeElements["mesh"]) {
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      scale={[w, d, 1]}
      renderOrder={-1}
      {...props}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={colors().ink}
        alphaMap={shadowTexture()}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Canvas drawing: textures are drawn at PX pixels per world unit in the page's own fonts. ──
export const PX = 480;
type Ctx = CanvasRenderingContext2D;

export function setFont(ctx: Ctx, size: number, weight = 500, mono = false) {
  const p = palette();
  ctx.font = `${weight} ${size}px ${mono ? p.monoFont : p.bodyFont}`;
}

export function rrect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string,
  lw = 2,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Wraps `text` into lines no wider than `maxW` (in the current font). */
export function wrap(ctx: Ctx, text: string, maxW: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draws a wrapped sentence whose odd parts ("Your Product") are picked out on a soft green highlight, as in
 * every mockup on the site. `y` is the first baseline; returns the last one.
 */
export function paragraph(
  ctx: Ctx,
  parts: readonly string[],
  x: number,
  y: number,
  maxW: number,
  size: number,
  lineH = size * 1.35,
) {
  const c = colors();
  const words = parts.flatMap((part, i) =>
    part
      .split(/(?<= )/)
      .filter(Boolean)
      .map((w) => ({ w, you: i % 2 === 1 })),
  );
  let cx = x;
  for (const { w, you } of words) {
    setFont(ctx, size, you ? 600 : 450);
    const full = ctx.measureText(w).width;
    const bare = ctx.measureText(w.trimEnd()).width;
    if (cx + bare > x + maxW && cx > x) {
      cx = x;
      y += lineH;
    }
    if (you)
      rrect(
        ctx,
        cx - size * 0.12,
        y - size * 0.86,
        (w.endsWith(" ") ? full : bare) + size * 0.24,
        size * 1.18,
        size * 0.2,
        c.lightGreenSoft,
      );
    ctx.fillStyle = c.ink;
    ctx.fillText(w, cx, y);
    cx += full;
  }
  return y;
}

export type BadgeMark =
  | "google"
  | "chatgpt"
  | "reddit"
  | "youtube"
  | "x"
  | "linkedin"
  | "code"
  | "perplexity";

/** A brand mark centred at (cx, cy), `size` across. */
export function drawMark(
  ctx: Ctx,
  mark: BadgeMark,
  cx: number,
  cy: number,
  size: number,
) {
  const c = colors();
  if (mark === "code")
    return drawGlyph(
      ctx,
      "code",
      cx,
      cy + size * 0.04,
      size * 0.62,
      c.ink,
      c.monoFont,
    );
  if (mark === "linkedin") {
    rrect(
      ctx,
      cx - size / 2,
      cy - size / 2,
      size,
      size,
      size * 0.18,
      "#0A66C2",
    );
    ctx.fillStyle = "#ffffff";
    setFont(ctx, size * 0.62, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("in", cx, cy + size * 0.04);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return;
  }
  const s = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  if (mark === "google") paintMark(ctx, "google");
  else {
    ctx.fillStyle = MARK_COLOR[mark];
    ctx.fill(new Path2D(MARKS[mark]));
  }
  ctx.restore();
}

/** A round brand badge that always faces the camera: white disc, soft hairline, the mark in its colours. */
export function Badge({
  mark,
  r = 0.28,
  ref,
  ...props
}: { mark: BadgeMark; r?: number; ref?: Ref<Group> } & Omit<
  ThreeElements["group"],
  "ref"
>) {
  const draw = useCallback(
    (ctx: Ctx, w: number) => {
      const c = colors();
      ctx.beginPath();
      ctx.arc(w / 2, w / 2, w / 2 - 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = c.line;
      ctx.stroke();
      drawMark(ctx, mark, w / 2, w / 2, w * 0.44);
    },
    [mark],
  );
  const { texture } = useCanvas(256, 256, draw);
  return (
    <group ref={ref} {...props}>
      <group quaternion={FACE}>
        <mesh renderOrder={6}>
          <circleGeometry args={[r, 48]} />
          <meshBasicMaterial
            map={texture}
            transparent
            toneMapped={false}
            {...PREMULTIPLIED}
          />
        </mesh>
      </group>
    </group>
  );
}

/** A picture on a face: a plane carrying a canvas texture, a hair in front of the surface it sits on. */
export function Print({
  w,
  h,
  map,
  ...props
}: { w: number; h: number; map: Texture } & ThreeElements["mesh"]) {
  return (
    <mesh {...props}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        map={map}
        transparent
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

type Render = (ctx: Ctx, w: number, h: number, v: number) => void;
type Draw = (ctx: Ctx, w: number, h: number) => void;

/**
 * Blending for canvas textures uploaded premultiplied: text and shapes keep clean edges instead of picking up
 * a dark fringe from the canvas's transparent (black) pixels.
 */
export const PREMULTIPLIED = {
  blending: CustomBlending,
  blendSrc: OneFactor,
  blendDst: OneMinusSrcAlphaFactor,
} as const;

const upload = (texture: Texture) => {
  texture.needsUpdate = true;
};

/**
 * A 2D-canvas texture for crisp text on 3D faces, in the page's own fonts: uploaded premultiplied (use
 * PREMULTIPLIED on its material) and sharply filtered at grazing angles. `draw` must be stable; call `paint()`
 * to redraw.
 */
export function useCanvas(width: number, height: number, draw: Draw) {
  const invalidate = useThree((s) => s.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.premultiplyAlpha = true;
    t.anisotropy = 16;
    return t;
  }, [width, height]);
  const paint = useCallback(() => {
    const ctx = (texture.image as HTMLCanvasElement).getContext("2d");
    if (!ctx) return;
    // Start every repaint from a clean state (a draw that leaves a transform behind can't stack up).
    ctx.reset();
    draw(ctx, width, height);
    upload(texture);
    invalidate();
  }, [texture, width, height, draw, invalidate]);
  useEffect(() => {
    paint();
    // Repaint once web fonts are ready so text never sticks in a fallback face.
    document.fonts.ready.then(paint);
  }, [paint]);
  useEffect(() => () => texture.dispose(), [texture]);
  return { texture, paint };
}

/**
 * A canvas texture `w` × `h` world units (at `scale` × the usual density) that redraws only when its live
 * value changes. `render` must be stable. Returns the texture and a setter to call every frame.
 */
export function useLive(w: number, h: number, render: Render, scale = 1) {
  const value = useRef(0);
  const draw = useCallback(
    (ctx: Ctx, cw: number, ch: number) => render(ctx, cw, ch, value.current),
    [render],
  );
  const { texture, paint } = useCanvas(
    Math.round(w * PX * scale),
    Math.round(h * PX * scale),
    draw,
  );
  const set = useCallback(
    (v: number) => {
      if (v === value.current) return;
      value.current = v;
      paint();
    },
    [paint],
  );
  return [texture, set] as const;
}

/** A canvas texture `w` × `h` world units (at `scale` × the usual density), drawn once. */
export function useStatic(w: number, h: number, draw: Draw, scale = 1) {
  return useCanvas(Math.round(w * PX * scale), Math.round(h * PX * scale), draw)
    .texture;
}
