import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group, type MeshBasicMaterial } from "three";
import { BEATS, span, storyOf } from "../content";
import type { LabelSpec } from "../label-store";
import {
  Print,
  Shadow,
  Sheet,
  Solid,
  block,
  colors,
  easeInOut,
  eyebrow,
  panel,
  rrect,
  rule,
  setFont,
  tick,
  useBand,
  useLive,
  useStatic,
} from "../kit";
import { AT, DIRS, PLATFORM, PORT_MODULE, ROUTES } from "../layout";
import { Channel } from "../fibre";

// Beat 0, the hub: Devable's growth system as a precision instrument. Your product stands on the plinth; a slim
// gantry sweeps a scan plane over it, and as it passes, a product brief fills beside it: what you build, who
// it's for, and where those people already look. Each of those places is one of the four channels, so as its
// row confirms, its port at the plinth's edge lights and the trace runs out to that channel's station.
// Beat 5 also lives here: the traces run home, and the brief turns into the results the channels returned.

type Ctx = CanvasRenderingContext2D;

const TOP = PLATFORM.h;
const SKIRT = 0.03;
const BODY = 0.14;
/** Your product: a slim display on a stand, back-left on the plinth. */
const PRODUCT = { x: -1.15, z: -0.3, w: 1.4, h: 0.92, lift: 0.2 };
/**
 * The scan gantry: two posts riding rails either side of the product, joined by a bar the scan plane hangs from.
 * It rests behind the product, framing it, and sweeps forward over it to scan.
 */
const GANTRY = { half: 0.75, h: 1.26, back: -1.2, front: 0.65 };
/** The brief, standing front-right, clear of the product and of every port on screen. */
const BRIEF = { x: 1.15, z: 0.95, w: 1.6, h: 1.78 };

/** The story (0..1 while the camera holds on the hub). */
const sweep = (s: number) => span(s, 0.1, 0.52);
/** Brief fields confirm as the scan passes; the four places, and their ports, after it. */
const FIELD = [0.24, 0.4];
const placeAt = (i: number) => 0.6 + i * 0.075;

// What the scan reads off the product. "Where they look" is one place per channel, in port order.
const BUILD = "Document parsing API";
const AUDIENCE = "ML and platform engineers";
const PLACES = [
  "Docs and tutorials",
  "Google and AI answers",
  "Reddit threads",
  "Creators they follow",
];
/** Short channel names for the port faces. */
const PORTS = ["Content", "Search & AI", "Reddit", "Creators"];
/** Beat 5's readout: what each channel returned (share of pipeline), in port order. */
const RETURNS = [
  { name: "Technical Content", share: 0.27 },
  { name: "Search & AI", share: 0.34 },
  { name: "Reddit", share: 0.16 },
  { name: "Creators", share: 0.23 },
];

// ── Prints ──

/** Your product's screen: a dense app view. As the scan passes, detection brackets frame what it reads. */
function drawApp(ctx: Ctx, w: number, h: number, v: number) {
  const c = colors();
  const k = w / 600;
  ctx.save();
  ctx.scale(k, k);
  const W = 600;
  const H = h / k;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 14);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  // Sidebar.
  ctx.fillStyle = "#f7f6f2";
  ctx.fillRect(0, 0, 150, H);
  ctx.fillStyle = "rgba(23,44,33,0.07)";
  ctx.fillRect(150, 0, 2, H);
  rrect(ctx, 18, 20, 34, 34, 9, c.ink);
  ctx.save();
  ctx.translate(35, 37);
  ctx.rotate(Math.PI / 4);
  rrect(ctx, -7, -7, 14, 14, 3, c.primary);
  ctx.restore();
  ["Parse", "Extract", "Classify", "Usage"].forEach((label, i) => {
    if (i === 0) rrect(ctx, 12, 80, 126, 34, 8, "#ebe9e3");
    setFont(ctx, 17, i === 0 ? 600 : 450);
    ctx.fillStyle = i === 0 ? c.ink : c.muted;
    ctx.fillText(label, 26, 103 + i * 42);
  });
  // Header.
  setFont(ctx, 15, 500, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("yourproduct.dev", 176, 38);
  setFont(ctx, 38, 620);
  ctx.letterSpacing = "-0.8px";
  ctx.fillStyle = c.ink;
  ctx.fillText("Your Product", 176, 80);
  ctx.letterSpacing = "0px";
  setFont(ctx, 18, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText("Parse any document into JSON", 176, 106);
  // Stats.
  const stats = [
    ["Pages parsed", "1.2M"],
    ["Accuracy", "99.1%"],
    ["p95 latency", "0.4s"],
  ];
  stats.forEach(([label, value], i) => {
    const x = 176 + i * 138;
    setFont(ctx, 14, 500, true);
    ctx.fillStyle = c.muted;
    ctx.fillText(label.toUpperCase(), x, 144);
    setFont(ctx, 26, 600);
    ctx.fillStyle = c.ink;
    ctx.fillText(value, x, 176);
  });
  // A request log, the last rows of the product in use.
  const rows = [
    ["invoice_0423.pdf", "200", "38 ms"],
    ["kyc_bundle.pdf", "200", "412 ms"],
    ["contract_v2.docx", "200", "96 ms"],
  ];
  ctx.fillStyle = "rgba(23,44,33,0.07)";
  ctx.fillRect(176, 198, W - 200, 2);
  rows.forEach(([file, code, ms], i) => {
    const y = 232 + i * 38;
    setFont(ctx, 16, 450, true);
    ctx.fillStyle = c.ink;
    ctx.fillText(file, 176, y);
    ctx.fillStyle = c.deep;
    ctx.fillText(code, 400, y);
    ctx.fillStyle = c.muted;
    ctx.textAlign = "right";
    ctx.fillText(ms, W - 24, y);
    ctx.textAlign = "left";
  });
  // Detection brackets: what it is (the header), then who uses it (the usage), as the scan reaches them.
  const box = (x: number, y: number, bw: number, bh: number, a: number) => {
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.strokeStyle = c.deep;
    ctx.lineWidth = 2.5;
    const l = 14;
    for (const [px, py, dx, dy] of [
      [x, y, 1, 1],
      [x + bw, y, -1, 1],
      [x, y + bh, 1, -1],
      [x + bw, y + bh, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(px + dx * l, py);
      ctx.lineTo(px, py);
      ctx.lineTo(px, py + dy * l);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  box(166, 14, 360, 100, span(v, FIELD[0] - 0.08, FIELD[0]));
  box(166, 124, W - 182, H - 136, span(v, FIELD[1] - 0.08, FIELD[1]));
  ctx.restore();
}

/** Text revealed up to fraction `k` of its length. */
const typed = (text: string, k: number) =>
  text.slice(0, Math.round(text.length * Math.min(1, Math.max(0, k))));

/** The product brief, filling as the scan reads the product (beat 0). */
function drawBrief(ctx: Ctx, W: number, s: number) {
  const c = colors();
  const pad = 44;
  const done = s >= placeAt(3);
  eyebrow(ctx, "Product brief", pad, 62, 26);
  // Status, right-aligned: reading while the scan runs, routed once every place has its channel.
  const status = done ? "Routed" : sweep(s) > 0 ? "Reading" : "Ready";
  setFont(ctx, 27, 560);
  const sw = ctx.measureText(status).width;
  ctx.beginPath();
  ctx.arc(W - pad - sw - 20, 53, 7, 0, Math.PI * 2);
  ctx.fillStyle = done ? c.primary : "#b9b6ad";
  ctx.fill();
  ctx.fillStyle = c.ink;
  ctx.fillText(status, W - pad - sw, 62);
  rule(ctx, pad, 92, W - pad * 2);

  // The two read fields.
  [
    ["What you build", BUILD],
    ["Who it's for", AUDIENCE],
  ].forEach(([label, value], i) => {
    const y = 150 + i * 128;
    const k = span(s, FIELD[i] - 0.1, FIELD[i]);
    eyebrow(ctx, label, pad, y, 22);
    setFont(ctx, 42, 580);
    ctx.letterSpacing = "-0.8px";
    ctx.fillStyle = k > 0 ? c.ink : "rgba(23,44,33,0.16)";
    ctx.fillText(k > 0 ? typed(value, k) : "—", pad, y + 52);
    ctx.letterSpacing = "0px";
    tick(ctx, W - pad - 18, y + 36, 18, k >= 1);
  });

  // Where they look: one row per place, each routed to its port.
  const top = 432;
  eyebrow(ctx, "Where they look", pad, top, 22);
  PLACES.forEach((place, i) => {
    const y = top + 70 + i * 82;
    const k = span(s, placeAt(i) - 0.05, placeAt(i));
    const on = k >= 1;
    rrect(ctx, pad - 14, y - 46, W - pad * 2 + 28, 70, 14, on ? "#eef8f2" : "#f6f5f1");
    setFont(ctx, 36, on ? 580 : 500);
    ctx.fillStyle = k > 0 ? c.ink : "rgba(23,44,33,0.34)";
    ctx.fillText(place, pad + 4, y);
    // The port it routes to: a mono chip, filled once routed.
    const label = `0${i + 1}`;
    setFont(ctx, 26, 600, true);
    const cw = ctx.measureText(label).width + 30;
    rrect(ctx, W - pad - cw, y - 33, cw, 44, 10, on ? c.primary : "#e9e7e0");
    ctx.fillStyle = on ? c.ink : c.muted;
    ctx.fillText(label, W - pad - cw + 15, y);
  });
}

/** Beat 5: the same sheet as a readout of what came back, each channel's share of pipeline filling in. */
function drawReturns(ctx: Ctx, W: number, s: number) {
  const c = colors();
  const pad = 40;
  eyebrow(ctx, "Results · 90 days", pad, 62, 26);
  rule(ctx, pad, 92, W - pad * 2);
  const total = 186 * span(s, 0.3, 0.8);
  setFont(ctx, 96, 620);
  ctx.letterSpacing = "-3px";
  ctx.fillStyle = c.ink;
  ctx.fillText(`$${Math.round(total)}K`, pad, 196);
  ctx.letterSpacing = "0px";
  setFont(ctx, 26, 480);
  ctx.fillStyle = c.muted;
  ctx.fillText("pipeline influenced", pad, 238);
  RETURNS.forEach((r, i) => {
    const y = 330 + i * 92;
    const k = easeInOut(span(s, 0.3 + i * 0.08, 0.62 + i * 0.08));
    setFont(ctx, 26, 520);
    ctx.fillStyle = c.ink;
    ctx.fillText(r.name, pad, y);
    setFont(ctx, 22, 600, true);
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(r.share * 100 * k)}%`, W - pad, y);
    ctx.textAlign = "left";
    rrect(ctx, pad, y + 18, W - pad * 2, 12, 6, "#efede7");
    if (k > 0.01)
      rrect(ctx, pad, y + 18, (W - pad * 2) * r.share * 2.4 * k, 12, 6, i === 1 ? c.primary : c.ink);
  });
}

/** A port connector's camera-facing side: its number and channel, engraved. */
function drawPort(ctx: Ctx, w: number, h: number, i: number) {
  const c = colors();
  const u = h / 100;
  // The name sits on the upper line, clear of the plinth that hides the lower part of the back ports.
  rrect(ctx, 2, 2, w - 4, h - 4, 10 * u, "#f6f5f1", "rgba(23,44,33,0.1)", 2);
  setFont(ctx, 36 * u, 600);
  ctx.letterSpacing = `${-0.6 * u}px`;
  ctx.fillStyle = c.ink;
  ctx.fillText(PORTS[i], 14 * u, 46 * u);
  ctx.letterSpacing = "0px";
  eyebrow(ctx, `Port 0${i + 1}`, 14 * u, 80 * u, 17 * u);
}

/** The plinth's top plate: an engraved border with ticks, and the gantry's rail grooves. */
function drawTop(ctx: Ctx, w: number) {
  const unit = w / (PLATFORM.size - 0.16);
  const m = w * 0.03;
  ctx.strokeStyle = "rgba(23,44,33,0.11)";
  ctx.lineWidth = Math.max(1.5, w * 0.0018);
  ctx.beginPath();
  ctx.roundRect(m, m, w - m * 2, w - m * 2, w * 0.02);
  ctx.stroke();
  ctx.strokeStyle = "rgba(23,44,33,0.16)";
  for (let i = 1; i < 16; i++) {
    const x = (w * i) / 16;
    const l = m * (i % 4 === 0 ? 0.8 : 0.5);
    ctx.beginPath();
    ctx.moveTo(x, m * 0.2);
    ctx.lineTo(x, l);
    ctx.moveTo(m * 0.2, x);
    ctx.lineTo(l, x);
    ctx.stroke();
  }
  // Rail grooves, either side of the product, along the gantry's travel.
  const toX = (x: number) => (x + (PLATFORM.size - 0.16) / 2) * unit;
  const z0 = toX(GANTRY.back - 0.25);
  const z1 = toX(GANTRY.front + 0.25);
  for (const side of [-1, 1]) {
    const x = toX(PRODUCT.x + side * GANTRY.half);
    rrect(ctx, x - unit * 0.05, z0, unit * 0.1, z1 - z0, unit * 0.05, "rgba(23,44,33,0.05)", "rgba(23,44,33,0.14)", Math.max(1.5, w * 0.0016));
  }
}

/** The plinth's front: an engraved nameplate and a row of vent slots. */
function drawFront(ctx: Ctx, w: number, h: number) {
  const c = colors();
  ctx.textBaseline = "middle";
  ctx.beginPath();
  ctx.arc(h * 0.45, h / 2, h * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  setFont(ctx, h * 0.36, 620);
  ctx.fillStyle = c.ink;
  ctx.fillText("Devable", h * 0.75, h / 2 + 1);
  const dw = ctx.measureText("Devable").width;
  setFont(ctx, h * 0.24, 500, true);
  ctx.letterSpacing = `${h * 0.08}px`;
  ctx.fillStyle = c.muted;
  ctx.fillText("GROWTH SYSTEM · GS-01", h * 1.05 + dw, h / 2 + 1);
  ctx.letterSpacing = "0px";
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 12; i++)
    rrect(ctx, w - h * 0.5 - (i + 1) * h * 0.3, h * 0.28, h * 0.1, h * 0.44, h * 0.05, c.line);
  ctx.globalAlpha = 1;
}

// ── Pieces ──

function Port({ i }: { i: number }) {
  const bandRef = useBand();
  const c = colors();
  const dir = DIRS[i];
  const along = dir.x !== 0;
  const len = PORT_MODULE.reach - PORT_MODULE.from;
  const centre = dir.clone().multiplyScalar((PORT_MODULE.from + PORT_MODULE.reach) / 2);
  const face = useStatic(
    len - 0.12,
    PORT_MODULE.h - 0.1,
    useCallback((ctx: Ctx, w: number, h: number) => drawPort(ctx, w, h, i), [i]),
    1.6,
  );
  const led = useRef<MeshBasicMaterial>(null);
  useFrame(() => {
    const x = bandRef.current;
    const lit = x > 4.5 || storyOf(x, 0) >= placeAt(i);
    led.current?.color.set(lit ? c.primary : c.line);
  });
  // The printed side faces the camera: +z for connectors along x, +x for those along z.
  return (
    <group position={centre}>
      <Shadow w={along ? len + 0.5 : 0.9} d={along ? 0.9 : len + 0.5} opacity={0.07} position-y={0.002} />
      <Solid
        geometry={block(along ? len : PORT_MODULE.w, along ? PORT_MODULE.w : len, PORT_MODULE.h, 0.04)}
        color="#f6f5f1"
      />
      <Print
        w={len - 0.12}
        h={PORT_MODULE.h - 0.1}
        map={face}
        position={
          along
            ? [0, PORT_MODULE.h / 2, PORT_MODULE.w / 2 + 0.003]
            : [PORT_MODULE.w / 2 + 0.003, PORT_MODULE.h / 2, 0]
        }
        rotation-y={along ? 0 : Math.PI / 2}
      />
      {/* A flush status strip on top, toward the outer end: grey until its channel is routed. */}
      <mesh
        position={[dir.x * (len / 2 - 0.2), PORT_MODULE.h + 0.002, dir.z * (len / 2 - 0.2)]}
        rotation-x={-Math.PI / 2}
        rotation-z={along ? 0 : Math.PI / 2}
      >
        <planeGeometry args={[0.16, 0.04]} />
        <meshBasicMaterial ref={led} color={c.line} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Hub() {
  const bandRef = useBand();
  const c = colors();
  const gantry = useRef<Group>(null);
  const plane = useRef<MeshBasicMaterial>(null);
  const line = useRef<MeshBasicMaterial>(null);
  const renderApp = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) => drawApp(ctx, w, h, v),
    [],
  );
  const [app, setApp] = useLive(PRODUCT.w - 0.08, PRODUCT.h - 0.08, renderApp, 1.4);
  // The brief's value: its story (0..1), plus 2 once it shows beat 5's returns.
  const renderBrief = useCallback((ctx: Ctx, w: number, h: number, v: number) => {
    const k = w / 720;
    ctx.save();
    ctx.scale(k, k);
    rrect(ctx, 0, 0, 720, h / k, 18, "#ffffff");
    if (v >= 2) drawReturns(ctx, 720, v - 2);
    else drawBrief(ctx, 720, v);
    ctx.restore();
  }, []);
  const [brief, setBrief] = useLive(BRIEF.w - 0.05, BRIEF.h - 0.05, renderBrief, 1.3);
  const top = useStatic(
    PLATFORM.size - 0.16,
    PLATFORM.size - 0.16,
    useCallback((ctx: Ctx, w: number) => drawTop(ctx, w), []),
    0.8,
  );
  const front = useStatic(
    PLATFORM.size - 0.8,
    BODY * 0.72,
    useCallback((ctx: Ctx, w: number, h: number) => drawFront(ctx, w, h), []),
    1.4,
  );

  useFrame(() => {
    const x = bandRef.current;
    const s = storyOf(x, 0);
    const q = Math.round(s * 90) / 90;
    setApp(q);
    setBrief(x > 4.5 ? 2 + Math.round(storyOf(x, BEATS.length - 1) * 90) / 90 : q);
    // The gantry sweeps back to front over the product, then returns to rest at the back.
    const out = easeInOut(sweep(s));
    const home = easeInOut(span(s, 0.54, 0.66));
    const z = GANTRY.back + (GANTRY.front - GANTRY.back) * out * (1 - home);
    if (gantry.current) gantry.current.position.z = z;
    const scanning = span(s, 0.08, 0.12) * (1 - span(s, 0.5, 0.54));
    if (plane.current) plane.current.opacity = 0.09 * scanning;
    if (line.current) line.current.opacity = scanning;
  });

  return (
    <group>
      <Shadow w={PLATFORM.size + 1.6} d={PLATFORM.size + 1.6} opacity={0.08} position-y={0.001} />
      {/* Plinth: a shadow-gap skirt, the body with its engraved front, and a top plate. */}
      <Solid geometry={block(PLATFORM.size - 0.1, PLATFORM.size - 0.1, SKIRT, 0.1)} color="#dcd9d0" />
      <Solid
        geometry={block(PLATFORM.size, PLATFORM.size, BODY, 0.12)}
        color="#f1efe9"
        position-y={SKIRT}
      />
      <Print
        w={PLATFORM.size - 0.8}
        h={BODY * 0.72}
        map={front}
        position={[0, SKIRT + BODY / 2, PLATFORM.size / 2 + 0.003]}
      />
      <Solid
        geometry={block(PLATFORM.size - 0.16, PLATFORM.size - 0.16, TOP - SKIRT - BODY, 0.1)}
        color="#fbfaf7"
        position-y={SKIRT + BODY}
      />
      <Print
        w={PLATFORM.size - 0.16}
        h={PLATFORM.size - 0.16}
        map={top}
        position={[0, TOP + 0.002, 0]}
        rotation-x={-Math.PI / 2}
      />

      {DIRS.map((_, i) => (
        <Port key={i} i={i} />
      ))}

      {/* Your product. */}
      <group position={[PRODUCT.x, TOP, PRODUCT.z]}>
        <Shadow w={1.5} d={0.8} opacity={0.1} position-y={0.002} />
        <Solid geometry={block(0.62, 0.3, 0.025, 0.06)} />
        <Solid geometry={panel(0.07, PRODUCT.lift + 0.15, 0.05, 0.02)} position-z={-0.05} />
        <Solid geometry={panel(PRODUCT.w, PRODUCT.h, 0.06, 0.05)} position-y={PRODUCT.lift} />
        <Print
          w={PRODUCT.w - 0.08}
          h={PRODUCT.h - 0.08}
          map={app}
          position={[0, PRODUCT.lift + PRODUCT.h / 2, 0.033]}
        />
      </group>

      {/* The gantry: two posts on rails, a bar, and the scan plane hanging from it with a crisp line where it meets
          the plate. */}
      <group ref={gantry} position={[PRODUCT.x, TOP, GANTRY.back]}>
        {[-1, 1].map((side) => (
          <group key={side} position-x={side * GANTRY.half}>
            <Solid geometry={block(0.14, 0.2, 0.03, 0.02)} color="#e9e7e0" />
            <Solid geometry={block(0.07, 0.1, GANTRY.h, 0.015)} position-y={0.03} />
          </group>
        ))}
        <Solid
          geometry={block(GANTRY.half * 2 + 0.16, 0.12, 0.08, 0.02)}
          position-y={GANTRY.h + 0.02}
        />
        <mesh position-y={(GANTRY.h + 0.02) / 2} renderOrder={3}>
          <planeGeometry args={[GANTRY.half * 2 - 0.1, GANTRY.h - 0.02]} />
          <meshBasicMaterial
            ref={plane}
            color={c.primary}
            transparent
            opacity={0}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh position-y={0.004} rotation-x={-Math.PI / 2} renderOrder={3}>
          <planeGeometry args={[GANTRY.half * 2 - 0.1, 0.014]} />
          <meshBasicMaterial ref={line} color={c.deep} transparent opacity={0} toneMapped={false} />
        </mesh>
      </group>

      {/* The brief. */}
      <Sheet w={BRIEF.w} h={BRIEF.h} map={brief} position={[BRIEF.x, TOP, BRIEF.z]} />
    </group>
  );
}

// ─────────────────────────────── Traces ───────────────────────────────

/** The four traces from the hub's ports into each station. */
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

/** Each station's name for the overview, pinned to a point with clear sky above it (the pill sits above). */
const STATION_LABELS: [string, string, [number, number, number]][] = [
  // Below its station: above it, the tag would run into the headline.
  ["01", "Technical Content", [AT.content.x + 0.6, 0, AT.content.z + 1.45]],
  ["02", "Search & AI Visibility", [AT.search.x, 3.35, AT.search.z]],
  ["03", "Reddit", [AT.reddit.x + 0.1, 2.75, AT.reddit.z]],
  ["04", "Creator Distribution", [AT.creators.x - 1.8, 1.9, AT.creators.z + 0.8]],
];
export const OVERVIEW_LABELS: LabelSpec[] = STATION_LABELS.map(
  ([n, name, p], i): LabelSpec => ({
    key: `station-${i}`,
    at: p,
    n,
    text: name,
    side: i === 0 ? "down" : "up",
    beat: 5,
    from: 0.1 + i * 0.08,
  }),
);
