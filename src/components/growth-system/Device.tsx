import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { CanvasTexture, CatmullRomCurve3, Color, RepeatWrapping, SRGBColorSpace, Shape, Vector3, type Group, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { DEVICE, MINT } from "./core-view";

// The Devable engine at the centre of the section: a small piece of real
// hardware in the page's light palette, quietly running. A warm aluminium body
// on a stepped base plate; on each side a port housing anodised in the brand
// green (where that channel's pipe locks in) between a heatsink fin bank and a
// turbine rotor; a mint light pipe round the body; and on top a bead-blasted
// plate with the Devable D standing proud in anodised green.
//
// "Working" is ambient and slow: light flows round the body, the rotors turn,
// the port lights show activity, and the glow under the plate breathes.
// `still` (reduced motion) freezes all of it.

const { base, body, port, plate, post } = DEVICE;
const BEVEL = 0.012;
const PLATE_TOP = plate.bottom + plate.h + BEVEL;
const SIDE = body.half; // the body's faces

// ── Materials: the page's warm whites, the brand green, mint only as light. ──
export const FINISH = {
  body: { color: "#dcd9d2", roughness: 0.45, metalness: 0.3 },
  base: { color: "#cfcbc2", roughness: 0.5, metalness: 0.25 },
  step: { color: "#aba79d", roughness: 0.55, metalness: 0.3 },
  aluminium: { color: "#efede8", roughness: 0.3, metalness: 0.5 },
  fins: { color: "#c5c7c2", roughness: 0.34, metalness: 0.55 },
  green: { color: "#26644b", roughness: 0.42, metalness: 0.35 },
  plate: { color: "#f3f1ec", roughness: 0.6, metalness: 0.15 },
  dark: { color: "#1c2622", roughness: 0.7, metalness: 0.2 },
} as const;

// ── Textures ────────────────────────────────────────────────────────────────
/** A canvas texture built once and disposed with the component. `draw` and `setup` must be module-level. */
function useTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, setup: (t: CanvasTexture) => void) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) draw(ctx);
    const t = new CanvasTexture(canvas);
    setup(t);
    return t;
  }, [w, h, draw, setup]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Bead-blast grain: fine grey noise that breaks up roughness, plus a hair of bump. */
function drawGrain(ctx: CanvasRenderingContext2D) {
  const img = ctx.createImageData(256, 256);
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 165 + rand() * 60;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
const tileGrain = (t: CanvasTexture) => {
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(3, 3);
};

/** Energy in the light pipe: a soft mint with a brighter pulse, tiled along the tube. */
function drawFlow(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "#2aa874");
  g.addColorStop(0.42, "#2aa874");
  g.addColorStop(0.5, "#c8ffe4");
  g.addColorStop(0.58, "#2aa874");
  g.addColorStop(1, "#2aa874");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 8);
}

// ── Geometry helpers ────────────────────────────────────────────────────────
function chamferSquare(half: number, ch: number, s = new Shape()) {
  s.moveTo(-half + ch, -half);
  s.lineTo(half - ch, -half);
  s.lineTo(half, -half + ch);
  s.lineTo(half, half - ch);
  s.lineTo(half - ch, half);
  s.lineTo(-half + ch, half);
  s.lineTo(-half, half - ch);
  s.lineTo(-half, -half + ch);
  s.closePath();
  return s;
}

/** A rounded square centred on the origin, for the mark's tile. */
function roundedSquare(half: number, r: number) {
  const s = new Shape();
  s.moveTo(-half + r, -half);
  s.lineTo(half - r, -half);
  s.quadraticCurveTo(half, -half, half, -half + r);
  s.lineTo(half, half - r);
  s.quadraticCurveTo(half, half, half - r, half);
  s.lineTo(-half + r, half);
  s.quadraticCurveTo(-half, half, -half, half - r);
  s.lineTo(-half, -half + r);
  s.quadraticCurveTo(-half, -half, -half + r, -half);
  return s;
}

/** The D's four stripes as flat shapes, `height` world units tall and centred (proportions as the hero's drawMark). */
function markStripes(height: number) {
  const [left, top, bottom, bend, rx] = [130, 123, 388, 265, 130];
  const ry = (bottom - top) / 2;
  const cy = top + ry;
  const k = height / (bottom - top);
  const cx = (left + bend + rx) / 2;
  const X = (x: number) => (x - cx) * k;
  const Y = (y: number) => -(y - cy) * k;
  const edge = (y: number) => bend + rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
  const stripe = (bottom - top) / (4 + 1);
  return [0, 1, 2, 3].map((i) => {
    const y0 = top + i * stripe * (4 / 3);
    const y1 = y0 + stripe;
    const s = new Shape();
    s.moveTo(X(left), Y(y0));
    for (let j = 0; j <= 12; j++) {
      const y = y0 + ((y1 - y0) * j) / 12;
      s.lineTo(X(edge(y)), Y(y));
    }
    s.lineTo(X(left), Y(y1));
    s.closePath();
    return s;
  });
}

/** A closed rounded-square loop at height y, for the light pipe. */
function loopCurve(half: number, y: number, r = 0.14) {
  const pts: Vector3[] = [];
  [
    [half, half],
    [-half, half],
    [-half, -half],
    [half, -half],
  ].forEach(([cx, cz], i) => {
    const a0 = (i * Math.PI) / 2;
    for (let j = 0; j <= 6; j++) {
      const a = a0 + (j / 6) * (Math.PI / 2);
      pts.push(new Vector3(cx - Math.sign(cx) * r + Math.cos(a) * r, y, cz - Math.sign(cz) * r + Math.sin(a) * r));
    }
  });
  return new CatmullRomCurve3(pts, true, "centripetal");
}

// ── Moving parts ────────────────────────────────────────────────────────────
const LED_REST = new Color("#1f8a5c");
const LED_ON = new Color("#b4ffd9");

/** A status light, blinking with activity. */
function Led({ position, size, blink, still }: { position: [number, number, number]; size: [number, number, number]; blink: [number, number]; still: boolean }) {
  const mat = useRef<MeshBasicMaterial>(null);
  const initial = useMemo(() => LED_REST.clone().lerp(LED_ON, 0.6), []);
  useFrame(({ clock }) => {
    if (still || !mat.current) return;
    const k = Math.sin(clock.elapsedTime * blink[0] + blink[1]) > 0.25 ? 0.95 : 0.35;
    mat.current.color.lerpColors(LED_REST, LED_ON, k);
  });
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial ref={mat} color={initial} toneMapped={false} />
    </mesh>
  );
}

/** A ribbed rotor between aluminium end rings, along the local z axis, turning slowly. */
function Turbine({ position, length, still, speed }: { position: [number, number, number]; length: number; still: boolean; speed: number }) {
  const rotor = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!still && rotor.current) rotor.current.rotation.y += dt * speed;
  });
  const r = 0.115;
  return (
    <group position={position} rotation-x={Math.PI / 2}>
      <group ref={rotor}>
        <mesh>
          <cylinderGeometry args={[r * 0.82, r * 0.82, length, 24]} />
          <meshStandardMaterial {...FINISH.step} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.9, 0, Math.sin(a) * r * 0.9]} rotation-y={-a}>
              <boxGeometry args={[r * 0.36, length * 0.92, r * 0.16]} />
              <meshStandardMaterial {...FINISH.fins} />
            </mesh>
          );
        })}
      </group>
      {[-1, 1].map((k) => (
        <mesh key={k} position-y={(k * length) / 2}>
          <cylinderGeometry args={[r * 1.28, r * 1.28, 0.05, 32]} />
          <meshStandardMaterial {...FINISH.green} />
        </mesh>
      ))}
    </group>
  );
}

/** The flow texture, sliding round the light pipe while the device runs. */
function useFlow(still: boolean) {
  const flow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (ctx) drawFlow(ctx);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(5, 1);
    return t;
  }, []);
  useEffect(() => () => flow.dispose(), [flow]);
  useFrame((_, dt) => {
    // three.js objects are meant to be mutated per frame; React never reads this value.
    // eslint-disable-next-line react-hooks/immutability
    if (!still) flow.offset.x -= dt * 0.12;
  });
  return flow;
}

function PipeMaterial({ flow }: { flow: CanvasTexture }) {
  return <meshStandardMaterial color="#2aa874" emissive="#ffffff" emissiveMap={flow} emissiveIntensity={0.9} roughness={0.3} metalness={0} />;
}

// ── The device ──────────────────────────────────────────────────────────────
/** One side's kit, in a frame where local +x is the face normal and z runs along the face. */
function SideKit({ flow, grain, still, seed }: { flow: CanvasTexture; grain: CanvasTexture; still: boolean; seed: number }) {
  const front = SIDE + port.d;
  return (
    <group>
      {/* Port housing, anodised green: where this channel's pipe locks in. */}
      <RoundedBox args={[port.d, port.h, port.w]} radius={0.025} smoothness={4} position={[SIDE + port.d / 2, 0, 0]}>
        <meshStandardMaterial {...FINISH.green} roughnessMap={grain} />
      </RoundedBox>
      <RoundedBox args={[0.02, 0.1, 0.27]} radius={0.008} smoothness={2} position={[front, 0.12, 0]}>
        <meshStandardMaterial {...FINISH.dark} />
      </RoundedBox>
      {[-0.08, 0, 0.08].map((z, i) => (
        <Led key={z} position={[front + 0.004, -0.14, z]} size={[0.01, 0.026, 0.046]} blink={[1.1 + i * 0.37 + seed * 0.21, seed * 1.7 + i]} still={still} />
      ))}

      {/* Heatsink fin bank toward one corner. */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[SIDE + 0.07, 0.02, 0.34 + i * 0.054]}>
          <boxGeometry args={[0.14, 0.46, 0.016]} />
          <meshStandardMaterial {...FINISH.fins} />
        </mesh>
      ))}

      {/* Turbine toward the other. */}
      <Turbine position={[SIDE + 0.14, 0, -0.54]} length={0.42} still={still} speed={0.5 + seed * 0.08} />

      {/* Light pipes rising from the lower loop into the housing. */}
      {[-0.14, 0.14].map((z) => (
        <mesh key={z} position={[SIDE + 0.05, -0.32, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.13, 12]} />
          <PipeMaterial flow={flow} />
        </mesh>
      ))}
    </group>
  );
}

const CORNERS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

export default function Device({ still }: { still: boolean }) {
  const grain = useTexture(256, 256, drawGrain, tileGrain);
  const flow = useFlow(still);
  const stripes = useMemo(() => markStripes(0.84), []);
  const tile = useMemo(() => roundedSquare(0.72, 0.16), []);
  const plateShape = useMemo(() => chamferSquare(plate.half, plate.chamfer), []);
  const groove = useMemo(() => {
    const s = chamferSquare(plate.half - 0.1, plate.chamfer - 0.04);
    s.holes.push(chamferSquare(plate.half - 0.115, plate.chamfer - 0.046));
    return s;
  }, []);
  const glowRing = useMemo(() => {
    const s = chamferSquare(body.half + 0.025, 0.05);
    s.holes.push(chamferSquare(body.half - 0.12, 0.05));
    return s;
  }, []);
  const lowerLoop = useMemo(() => loopCurve(SIDE + 0.04, -0.38), []);
  const glow = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!still && glow.current) glow.current.emissiveIntensity = 0.9 + 0.2 * Math.sin(clock.elapsedTime * 0.9);
  });

  const grained = { roughnessMap: grain, bumpMap: grain, bumpScale: 0.4 };

  return (
    <group>
      {/* Two-step base plate with mounting holes. */}
      <RoundedBox args={[base.half * 2 - 0.2, 0.07, base.half * 2 - 0.2]} radius={0.03} smoothness={3} position-y={base.top - base.h - 0.035}>
        <meshStandardMaterial {...FINISH.step} />
      </RoundedBox>
      <RoundedBox args={[base.half * 2, base.h, base.half * 2]} radius={0.04} smoothness={4} position-y={base.top - base.h / 2}>
        <meshStandardMaterial {...FINISH.base} {...grained} />
      </RoundedBox>
      {CORNERS.map(([x, z]) => (
        <group key={`hole${x}${z}`} position={[x * (base.half - 0.14), base.top + 0.002, z * (base.half - 0.14)]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.004, 32]} />
            <meshStandardMaterial {...FINISH.aluminium} />
          </mesh>
          <mesh position-y={0.002}>
            <cylinderGeometry args={[0.045, 0.045, 0.004, 32]} />
            <meshBasicMaterial color="#3b4440" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Body. */}
      <RoundedBox args={[body.half * 2, body.top - body.bottom, body.half * 2]} radius={0.04} smoothness={4} position-y={(body.top + body.bottom) / 2}>
        <meshStandardMaterial {...FINISH.body} {...grained} />
      </RoundedBox>

      {/* The lower light pipe, round the whole body. */}
      <mesh>
        <tubeGeometry args={[lowerLoop, 160, 0.024, 12, true]} />
        <PipeMaterial flow={flow} />
      </mesh>

      {/* A kit on each side, local +x turned to face each channel. */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => (
        <group key={a} rotation-y={a}>
          <SideKit flow={flow} grain={grain} still={still} seed={i} />
        </group>
      ))}

      {/* Corner brackets front and back, with a pair of status lights. */}
      {[-1, 1].map((k) => (
        <group key={`bracket${k}`} position={[k * SIDE, -0.1, k * SIDE]}>
          <RoundedBox args={[0.2, 0.86, 0.2]} radius={0.03} smoothness={3}>
            <meshStandardMaterial {...FINISH.aluminium} roughnessMap={grain} />
          </RoundedBox>
          {[0, 1].map((j) => (
            <Led key={j} position={[k * 0.101, 0.3 - j * 0.06, k * 0.04]} size={[0.004, 0.02, 0.03]} blink={[0.7 + j * 0.5, k + j * 2]} still={still} />
          ))}
        </group>
      ))}

      {/* In and out posts on the left and right corners, anodised green with a light ring at port height. */}
      {[
        [-1, 1],
        [1, -1],
      ].map(([x, z]) => (
        <group key={`post${x}`} position={[x * post.at, 0, z * post.at]}>
          <mesh position-y={-0.04}>
            <cylinderGeometry args={[post.r, post.r, post.h, 32]} />
            <meshStandardMaterial {...FINISH.green} />
          </mesh>
          <mesh position-y={0.27}>
            <cylinderGeometry args={[post.r * 0.8, post.r * 0.8, 0.02, 32]} />
            <meshStandardMaterial {...FINISH.aluminium} />
          </mesh>
          <Led position={[0, 0, 0]} size={[post.r * 2.2, 0.03, post.r * 2.2]} blink={[1.6, x * 2]} still={still} />
        </group>
      ))}

      {/* Mint glow escaping between the body and the top plate. */}
      <mesh rotation-x={-Math.PI / 2} position-y={body.top}>
        <extrudeGeometry args={[glowRing, { depth: plate.bottom - body.top, bevelEnabled: false }]} />
        <meshStandardMaterial ref={glow} color={MINT} emissive={MINT} emissiveIntensity={0.9} roughness={0.5} />
      </mesh>

      {/* Chamfered bead-blasted top plate, a machined groove, and four hex screws. */}
      <mesh rotation-x={-Math.PI / 2} position-y={plate.bottom}>
        <extrudeGeometry args={[plateShape, { depth: plate.h, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 2 }]} />
        <meshStandardMaterial {...FINISH.plate} {...grained} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={PLATE_TOP + 0.001}>
        <shapeGeometry args={[groove]} />
        <meshBasicMaterial color="#c9c5bb" toneMapped={false} />
      </mesh>
      {CORNERS.map(([x, z]) => (
        <group key={`screw${x}${z}`} position={[x * 0.8, PLATE_TOP, z * 0.8]}>
          <mesh position-y={0.008}>
            <cylinderGeometry args={[0.05, 0.052, 0.016, 32]} />
            <meshStandardMaterial {...FINISH.aluminium} />
          </mesh>
          <mesh position-y={0.017}>
            <cylinderGeometry args={[0.022, 0.022, 0.002, 6]} />
            <meshBasicMaterial color="#59625d" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* The Devable mark (a white D on a dark rounded tile, as public/brand/devable-mark.png), filling the lid
          and laid square to its edges rather than to the screen. */}
      <Lid y={PLATE_TOP}>
        <group>
          <mesh>
            <extrudeGeometry args={[tile, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }]} />
            <meshStandardMaterial {...FINISH.dark} />
          </mesh>
          {stripes.map((st, i) => (
            <mesh key={i} position-z={0.026}>
              <extrudeGeometry args={[st, { depth: 0.012, bevelEnabled: false }]} />
              <meshStandardMaterial {...FINISH.aluminium} />
            </mesh>
          ))}
        </group>
      </Lid>
    </group>
  );
}

/**
 * Lays its children flat on the top plate, square to its edges. Seen from the
 * front-right camera, local x runs up-right along the lid and local y up-left.
 */
function Lid({ y, children }: { y: number; children: ReactNode }) {
  return (
    <group position-y={y} rotation-y={Math.PI / 2}>
      <group rotation-x={-Math.PI / 2}>{children}</group>
    </group>
  );
}

/** A small studio of soft panels, rendered once into the environment map (no HDR file). */
export function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      <Lightformer form="rect" intensity={3} position={[-5, 2.5, 2]} rotation-y={Math.PI / 2.4} scale={[6, 1, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[3, 2, 5]} rotation-y={-Math.PI / 5} scale={[5, 1.6, 1]} />
      <Lightformer form="rect" intensity={0.8} color="#d8f5e6" position={[0, 1, -6]} scale={[8, 2, 1]} />
    </Environment>
  );
}
