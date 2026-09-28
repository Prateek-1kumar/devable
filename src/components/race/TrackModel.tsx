import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, BufferAttribute, CanvasTexture, ExtrudeGeometry, Object3D, RepeatWrapping, SRGBColorSpace, Shape, ShapeGeometry, type InstancedMesh, type Mesh, type MeshBasicMaterial, type MeshPhysicalMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHANNELS } from "../growth-engine/channels";
import { channelFocus } from "../growth-engine/channelFocus";
import { drawBadge, drawMark, type Mark } from "../growth-engine/marks";
import { materials, palette } from "../growth-engine/palette";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { C, look, lerp3, rgb } from "./look";
import { store } from "./store";
import { drawTo, sweep, twoLap, wall } from "./sweep";
import { T, boardTint, damp, laneWindow, smoothstep } from "./timeline";
import { HALF, LANE_R, LINE_R, START, STANDS_END, TRACK_IN, TRACK_OUT, frac, lengthOfStation, ovalAt, type P3 } from "./track";

// The track as a finished architectural model on a porcelain site plinth:
// emerald turf with mowing bands and a mowed Devable D, a porcelain curb, four
// whisper-tinted lanes whose gradient fills are poured in behind the runners,
// a checkered finish, the apron with its railing, and an LED ribbon board that
// runs along the foot of the stands and names the platforms.

const DEEP = CHANNELS.map((c) => c.deep);
const decal = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, depthWrite: false } as const;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** A closed outline at radius r as a Shape (shape y = −world z, so rotation-x −π/2 lays it flat). */
function ovalShape(r: number, n = 256) {
  const s = new Shape();
  const p: P3 = { x: 0, y: 0, z: 0 };
  for (let i = 0; i <= n; i++) {
    ovalAt(i / n, r, p);
    if (i === 0) s.moveTo(p.x, -p.z);
    else s.lineTo(p.x, -p.z);
  }
  return s;
}

/** The site plinth: a stadium-shaped porcelain slab with a thin emerald seam at its foot. */
function Plinth() {
  const R = 6.1; // just outside the mast footings (5.95), so the slab frames the model instead of crowding it
  const [slab, seam] = useMemo(() => {
    // Total height 0.16 (0.10 + two 0.03 bevels), top at y −0.003.
    const g = new ExtrudeGeometry(ovalShape(R, 192), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 4 });
    g.rotateX(-Math.PI / 2);
    g.computeBoundingBox();
    g.translate(0, -0.003 - (g.boundingBox?.max.y ?? 0), 0);
    // The seam stands 0.015 proud of the slab's side (which sits at R + bevel).
    const b = new ExtrudeGeometry(ovalShape(R + 0.045, 192), { depth: 0.02, bevelEnabled: false, curveSegments: 4 });
    b.rotateX(-Math.PI / 2);
    b.translate(0, -0.163, 0);
    return [g, b];
  }, []);
  return (
    <group>
      <mesh geometry={slab} material={look().plinth} receiveShadow />
      <mesh geometry={seam} material={look().seam} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.165} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.07} />
      </mesh>
    </group>
  );
}

/** Emerald turf, darker at the start end, with the mowed D and a chalk line inside the curb. */
function Turf() {
  const geometry = useMemo(() => {
    const g = new ShapeGeometry(ovalShape(TRACK_IN - 0.06), 1);
    const pos = g.attributes.position;
    const [lo, hi] = [rgb(C.TURF_LOW), rgb(C.TURF_HIGH)];
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      // Linear in x and z, so the triangle interpolation is exact: 0.35 sweep across the width.
      const x = (pos.getX(i) + 5.4) / 10.8;
      const z = (-pos.getY(i) + 2) / 4;
      col.set(lerp3(lo, hi, Math.min(1, Math.max(0, 0.65 * x + 0.35 * z))), i * 3);
    }
    g.setAttribute("color", new BufferAttribute(col, 3));
    return g;
  }, []);
  const drawD = useCallback((ctx: CanvasRenderingContext2D, w: number) => drawMark(ctx, w, Array(4).fill("rgba(255,255,255,0.14)")) /* mown grass lightens */, []);
  const d = useCanvasTexture(1024, 1024, drawD);
  const chalk = useMemo(() => sweep({ from: 0, to: 1, steps: 512, inner: TRACK_IN - 0.081, outer: TRACK_IN - 0.069, y1: 0.0128 }), []);
  return (
    <group>
      <mesh geometry={geometry} material={look().turf} rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0125, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial map={d.texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh geometry={chalk} material={look().line} />
    </group>
  );
}

/** Curb, the four unpoured lane bands, lane lines and the apron. */
function Ring() {
  const m = materials();
  const L = look();
  const curb = useMemo(() => sweep({ from: 0, to: 1, steps: 512, inner: TRACK_IN - 0.06, outer: TRACK_IN, y1: 0.05, box: true }), []);
  const bands = useMemo(
    () =>
      mergeGeometries(
        CHANNELS.map(({ pastel }, k) => {
          // A whisper of the channel: its pastel, mostly white, a touch deeper on the outer edge.
          const tint = lerp3(rgb(pastel), [1, 1, 1], 0.45);
          const [a, b] = [tint, lerp3(tint, [0, 0, 0], 0.06)];
          return sweep({ from: 0, to: 1, steps: 512, inner: LINE_R[k], outer: LINE_R[k + 1], y1: 0.02, box: true, color: (_u, v) => (v ? b : a) });
        }),
      ),
    [],
  );
  const lines = useMemo(
    () => mergeGeometries(LINE_R.map((r) => sweep({ from: 0, to: 1, steps: 512, inner: r - 0.006, outer: r + 0.006, y0: 0.02, y1: 0.033, box: true }))),
    [],
  );
  const apron = useMemo(() => sweep({ from: 0, to: 1, steps: 512, inner: TRACK_OUT, outer: 3.66, y1: 0.018, box: true }), []);
  return (
    <group>
      <mesh geometry={curb} material={m.porcelain} receiveShadow />
      <mesh geometry={bands} material={L.laneBand} receiveShadow />
      <mesh geometry={lines} material={L.line} receiveShadow />
      <mesh geometry={apron} material={L.apron} receiveShadow />
    </group>
  );
}

/** Lane fills: raised gradient slabs in each channel's light fade. Hovering a channel in the hero copy lights its lane. */
function LaneFills() {
  const m = materials();
  const invalidate = useThree((s) => s.invalidate);
  const focus = useSyncExternalStore(channelFocus.subscribe, channelFocus.get, () => null);
  const geoms = useMemo(
    () =>
      CHANNELS.map(({ fade, color }, k) => {
        const [a, b, vivid] = [rgb(fade[0]), rgb(fade[1]), rgb(color)];
        return twoLap(LANE_R[k], 0.33, 0.03, {
          y0: 0.02,
          box: true,
          color: (u, v) => {
            const along = lerp3(a, b, smoothstep(frac(u - START)));
            return v ? along : lerp3(along, vivid, 0.2); // the inner edge leans toward the vivid color
          },
        });
      }),
    [],
  );
  const meshes = useRef<(Mesh | null)[]>([]);
  const reveal = useRef([0, 0, 0, 0]);
  const focusRef = useRef<number | null>(null);

  useEffect(() => {
    focusRef.current = focus;
    invalidate();
  }, [focus, invalidate]);

  useFrame((_, delta) => {
    const p = store.p;
    const dt = Math.min(delta, 1 / 30);
    let settling = false;
    for (let k = 0; k < 4; k++) {
      const target = p < 0.05 && focusRef.current === k ? 1 : 0;
      const r = reveal.current;
      r[k] = Math.abs(r[k] - target) < 1e-3 ? target : damp(r[k], target, 8, dt);
      if (r[k] !== target) settling = true;
      const mesh = meshes.current[k];
      if (!mesh) continue;
      const [a, b] = laneWindow(k, p);
      const empty = b <= a;
      const lo = empty ? 0 : a;
      const hi = Math.max(empty ? 0 : b, r[k]);
      mesh.visible = hi > lo;
      drawTo(mesh.geometry, lo / 2, hi / 2);
    }
    if (settling) invalidate();
  });

  return (
    <group>
      {geoms.map((g, k) => (
        <mesh
          key={k}
          ref={(el) => {
            meshes.current[k] = el;
          }}
          geometry={g}
          material={m.frost}
          visible={false}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}

/** Lane numerals in each channel's deep color over a white keyline, stretched against foreshortening. */
function Numerals({ x, length = 1 }: { x: number; length?: number }) {
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.font = `500 300px ${palette().bodyFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 20; // a 10px keyline outside the glyph
    ctx.strokeStyle = "#ffffff";
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate((i + 0.5) * (w / 4), h / 2);
      ctx.scale(1, 1.35);
      ctx.strokeText(String(i + 1), 0, 8);
      ctx.fillStyle = DEEP[i];
      ctx.fillText(String(i + 1), 0, 8);
      ctx.restore();
    }
    ctx.restore();
  }, []);
  const tex = useCanvasTexture(1024, 712, draw);
  // Texture up = +x (toward the finish), texture right = +z (lane 1 → lane 4).
  return (
    <group position={[x, 0.0335, (TRACK_IN + TRACK_OUT) / 2]} rotation-y={-Math.PI / 2}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[TRACK_OUT - TRACK_IN, length]} />
        <meshBasicMaterial map={tex.texture} transparent {...decal} />
      </mesh>
    </group>
  );
}

/** The checkered finish line and the white start line. */
function Lines() {
  const checker = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx)
      for (let col = 0; col < 16; col++)
        for (let row = 0; row < 2; row++) {
          ctx.fillStyle = (col + row) % 2 ? "#ffffff" : C.INK;
          ctx.fillRect(col * 16, row * 16, 16, 16);
        }
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = RepeatWrapping;
    t.repeat.x = (TRACK_OUT - TRACK_IN) / 0.05 / 8; // square checks
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => () => checker.dispose(), [checker]);
  const mid = (TRACK_IN + TRACK_OUT) / 2;
  return (
    <group>
      <group position={[HALF, 0.0335, mid]} rotation-y={Math.PI / 2}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[TRACK_OUT - TRACK_IN, 0.05]} />
          <meshStandardMaterial map={checker} roughness={0.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      </group>
      <mesh position={[-2.4, 0.0335, mid]} rotation-x={-Math.PI / 2} material={look().line}>
        <planeGeometry args={[0.03, TRACK_OUT - TRACK_IN]} />
      </mesh>
    </group>
  );
}

// The LED ribbon board: an aluminum body (so it never reads as a black outline round the oval) with a
// black LED face of five cells (badge + name) scrolling as a pure function of p.
const RIBBON: { mark: Mark; name: string }[] = [
  { mark: "hackernews", name: "HACKER NEWS" },
  { mark: "google", name: "GOOGLE" },
  { mark: "chatgpt", name: "CHATGPT" },
  { mark: "reddit", name: "REDDIT" },
  { mark: "youtube", name: "YOUTUBE" },
];
const BOARD = { from: 0.004, to: STANDS_END, r: 3.5285, face: [0.02, 0.062] as const, led: [0.062, 0.07] as const };

function Board() {
  const m = materials();
  const body = useMemo(() => sweep({ from: BOARD.from, to: BOARD.to, steps: 240, inner: 3.53, outer: 3.58, y1: 0.07, box: true }), []);
  const face = useMemo(() => wall({ from: BOARD.from, to: BOARD.to, steps: 240, r: BOARD.r, y0: BOARD.face[0], y1: BOARD.face[1], facing: "in" }), []);
  const led = useMemo(() => wall({ from: BOARD.from, to: BOARD.to, steps: 240, r: BOARD.r, y0: BOARD.led[0], y1: BOARD.led[1], facing: "in" }), []);
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.fillStyle = C.INK;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `600 28px ${MONO}`;
    ctx.letterSpacing = "4px";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    RIBBON.forEach(({ mark, name }, i) => {
      const x = i * 512 + 40;
      ctx.save();
      ctx.translate(x, (h - 48) / 2);
      drawBadge(ctx, 48, 48, mark);
      ctx.restore();
      ctx.fillText(name, x + 68, h / 2 + 1);
    });
    ctx.restore();
  }, []);
  const ribbon = useCanvasTexture(2560, 64, draw);
  const ledMat = useRef<MeshBasicMaterial>(null);
  const faceMat = useRef<MeshBasicMaterial>(null);
  // Cells at their true aspect; the face runs "in", against the station direction, so a negative repeat reads left to right.
  const repeat = useMemo(() => {
    const len = lengthOfStation(BOARD.to, BOARD.r) - lengthOfStation(BOARD.from, BOARD.r);
    return Math.round(len / ((BOARD.face[1] - BOARD.face[0]) * 40));
  }, []);
  useFrame(() => {
    const p = store.p;
    const map = faceMat.current?.map;
    if (map) {
      if (map.wrapS !== RepeatWrapping) {
        map.wrapS = RepeatWrapping;
        map.needsUpdate = true;
      }
      map.repeat.x = -repeat;
      map.offset.x = frac(4 * p);
    }
    ledMat.current?.color.set(boardTint(p));
  });
  return (
    <group>
      <mesh geometry={body} material={m.alu} castShadow receiveShadow />
      <mesh geometry={face}>
        <meshBasicMaterial ref={faceMat} map={ribbon.texture} toneMapped={false} fog={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh geometry={led}>
        <meshBasicMaterial ref={ledMat} color="#ffffff" toneMapped={false} fog={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
  );
}

/** The open side's railing: aluminum posts and a champagne rail along the apron. */
function Railing() {
  const m = materials();
  const R = 3.6;
  const posts = useMemo(() => {
    // Stations 0.5 → 1 (the far bend and the home straight), a post every 0.35u of arc.
    const out: [number, number][] = [];
    const [p, q]: P3[] = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
    ovalAt(0.5, R, q);
    let run = 0.175;
    for (let i = 1; i <= 4000; i++) {
      ovalAt(0.5 + (0.5 * i) / 4000, R, p);
      run -= Math.hypot(p.x - q.x, p.z - q.z);
      if (run <= 0) {
        out.push([p.x, p.z]);
        run += 0.35;
      }
      q.x = p.x;
      q.z = p.z;
    }
    return out;
  }, []);
  const rail = useMemo(() => {
    const g = sweep({ from: 0.5, to: 1, steps: 256, inner: R - 0.01, outer: R + 0.01, y0: 0.08, y1: 0.1, box: true });
    return g;
  }, []);
  const inst = useRef<InstancedMesh>(null);
  useEffect(() => {
    const mesh = inst.current;
    if (!mesh) return;
    const o = new Object3D();
    posts.forEach(([x, z], i) => {
      o.position.set(x, 0.045 + 0.009, z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [posts]);
  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, posts.length]} material={m.alu} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.09, 8]} />
      </instancedMesh>
      <mesh geometry={rail} material={m.champagne} castShadow />
    </group>
  );
}

/** Starting blocks: an ink rail, two pedals in the lane's color that glow as its start light comes on, an alu knob. */
function Blocks() {
  const m = materials();
  const L = look();
  const pedals = useRef<(MeshPhysicalMaterial | null)[]>([]);
  // Both pedals (at 50°) in one geometry, so each lane has one material to light.
  const pedalGeometry = useMemo(() => {
    const tilt = (50 * Math.PI) / 180;
    return mergeGeometries([
      new BoxGeometry(0.05, 0.075, 0.09).rotateZ(tilt).translate(-0.08, 0.045, 0.04),
      new BoxGeometry(0.05, 0.075, 0.09).rotateZ(tilt).translate(0.06, 0.045, -0.04),
    ]);
  }, []);
  useFrame(() => {
    const p = store.p;
    pedals.current.forEach((mat, k) => {
      if (mat) mat.emissiveIntensity = p >= T.stripeOn(k) && p < T.go ? 0.6 : 0;
    });
  });
  return (
    <group>
      {LANE_R.map((r, k) => {
        const color = CHANNELS[k].color;
        return (
          <group key={r} position={[-2.72, 0.02, r]}>
            <mesh position-y={0.009} material={L.ink} castShadow>
              <boxGeometry args={[0.3, 0.018, 0.05]} />
            </mesh>
            <mesh geometry={pedalGeometry} castShadow>
              <meshPhysicalMaterial
                ref={(el) => {
                  pedals.current[k] = el;
                }}
                color={color}
                roughness={0.3}
                clearcoat={0.8}
                clearcoatRoughness={0.15}
                emissive={color}
                emissiveIntensity={0}
              />
            </mesh>
            <mesh position={[-0.16, 0.009, 0]} rotation-z={Math.PI / 2} material={m.alu}>
              <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function TrackModel() {
  return (
    <group>
      <Plinth />
      <Turf />
      <Ring />
      <LaneFills />
      <Numerals x={2.15} />
      <Numerals x={-1.75} length={0.8} />
      <Lines />
      <Board />
      <Railing />
      <Blocks />
    </group>
  );
}
