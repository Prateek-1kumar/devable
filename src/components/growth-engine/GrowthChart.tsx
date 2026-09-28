import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import { CatmullRomCurve3, Color, Quaternion, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "./channels";
import { PIPELINE } from "./layout";
import { TONES, materials, paintFade } from "./palette";
import { INTRO_LEADS, easeOutBack, easeOutCubic, useStory } from "./story";

// Where the story ends: pipeline that compounds. Five weekly bars on the floor
// behind the platforms, oldest at the front, each taller than the last and
// stacked in the four channel colors (01 at the bottom, like the stack). The
// past weeks build in once; this week's bar grows as each channel's leads
// arrive along the rail, split by the leads it actually brought in.

const PAST = [0.45, 0.7, 1.05, 1.55]; // heights of the four past weeks
const NOW = 2.3; // this week's height once the intro's leads have landed
const BASE = 0.03; // plinth height
// Past weeks' channel mix: content-led at first, reach growing as it compounds.
const MIX = [
  [0.46, 0.3, 0.16, 0.08],
  [0.4, 0.3, 0.18, 0.12],
  [0.36, 0.29, 0.2, 0.15],
  [0.33, 0.28, 0.21, 0.18],
];
const GAP = 0.012; // between a bar's bands
const NOW_Z = PIPELINE.weeks[PIPELINE.weeks.length - 1];
/** Where the light bridge lands: the top of this week's bar once it is full. */
export const NOW_TOP = new Vector3(PIPELINE.chartX, BASE + NOW, NOW_Z);
const SPECTRUM = CHANNELS.map(({ color }) => new Color(color));

/** The dawn spectrum at u (0..1): indigo → azure → emerald → sun. */
export function spectrum(u: number, out: Color) {
  const x = Math.min(1, Math.max(0, u)) * (SPECTRUM.length - 1);
  const i = Math.min(SPECTRUM.length - 2, Math.floor(x));
  return out.lerpColors(SPECTRUM[i], SPECTRUM[i + 1], x - i);
}

// The trend: just above each bar's top (this week at its full height), then on up past it.
const LIFT = 0.12;
const TREND = new CatmullRomCurve3(
  [
    ...PIPELINE.weeks.map((z, w) => new Vector3(PIPELINE.chartX, BASE + (w < PAST.length ? PAST[w] : NOW) + LIFT, z)),
    new Vector3(PIPELINE.chartX, BASE + NOW + LIFT + 0.55, NOW_Z - 0.5),
  ],
  false,
  "centripetal",
);

/** One band of a bar: a unit-tall box with the channel's fade, scaled to its share. */
function Band({ k, bandRef }: { k: number; bandRef: (el: Mesh | null) => void }) {
  const m = materials();
  const mesh = useRef<Mesh>(null);
  useLayoutEffect(() => {
    if (mesh.current) paintFade(mesh.current, TONES[k].low, TONES[k].high, 1);
  }, [k]);
  return (
    <mesh
      ref={(el) => {
        mesh.current = el;
        bandRef(el);
      }}
      material={m.frost}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[PIPELINE.bar, 1, PIPELINE.bar]} />
    </mesh>
  );
}

/** A week's bar: four bands stacked to `height`, split by `mix`. */
function stackBands(bands: (Mesh | null)[], height: number, mix: number[]) {
  const total = mix.reduce((a, b) => a + b, 0) || 1;
  let y = 0;
  bands.forEach((band, k) => {
    if (!band) return;
    const h = Math.max(0, (height * mix[k]) / total - GAP);
    band.visible = h > 0.001;
    band.scale.y = Math.max(h, 1e-4);
    band.position.y = y + h / 2;
    y += h + GAP;
  });
}

function Week({ w }: { w: number }) {
  const story = useStory();
  const bands = useRef<(Mesh | null)[]>([]);
  const group = useRef<Group>(null);
  const now = w === PIPELINE.weeks.length - 1;

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    if (now) {
      const by = story.countBy(t);
      const leads = by.reduce((a, b) => a + b, 0);
      if (group.current) group.current.visible = leads > 0;
      stackBands(bands.current, NOW * Math.min(1, leads / INTRO_LEADS), by);
    } else {
      const grow = story.weekIn(w, t);
      if (group.current) group.current.visible = grow > 0;
      stackBands(bands.current, PAST[w] * Math.max(0, easeOutBack(grow)), MIX[w]);
    }
  });

  return (
    <group ref={group} position={[PIPELINE.chartX, BASE, PIPELINE.weeks[w]]} visible={false}>
      {CHANNELS.map((channel, k) => (
        <Band
          key={channel.n}
          k={k}
          bandRef={(el) => {
            bands.current[k] = el;
          }}
        />
      ))}
    </group>
  );
}

/** The compounding curve: draws on as the weeks build, then its arrowhead lights. */
function Trend() {
  const story = useStory();
  const points = useMemo(() => TREND.getSpacedPoints(90), []);
  const colors = useMemo(() => points.map((_, i) => spectrum(i / (points.length - 1), new Color())), [points]);
  const core = useRef<Line2>(null);
  const glow = useRef<Line2>(null);
  const arrow = useRef<Mesh>(null);
  const arrowInk = useRef<MeshBasicMaterial>(null);
  const tip = useMemo(() => {
    const at = TREND.getPointAt(1);
    const turn = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), TREND.getTangentAt(1));
    return { at, turn };
  }, []);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const leads = story.countBy(t).reduce((a, b) => a + b, 0);
    const built = PAST.reduce((sum, _, w) => sum + story.weekIn(w, t), 0) + Math.min(1, leads / INTRO_LEADS);
    const reveal = built / (PAST.length + 1);
    const segments = points.length - 1;
    for (const line of [core.current, glow.current]) if (line) line.geometry.instanceCount = Math.floor(segments * reveal);
    const full = reveal >= 0.999;
    if (arrow.current) {
      arrow.current.visible = full;
      arrow.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.06);
    }
    if (arrowInk.current) arrowInk.current.opacity = full ? 0.85 + Math.sin(state.clock.elapsedTime * 2.4) * 0.15 : 0;
  });

  return (
    <group>
      <Line ref={glow} points={points} vertexColors={colors} lineWidth={9} transparent opacity={0.14} depthWrite={false} />
      <Line ref={core} points={points} vertexColors={colors} lineWidth={2.4} />
      <mesh ref={arrow} position={tip.at} quaternion={tip.turn} visible={false}>
        <coneGeometry args={[0.1, 0.26, 32]} />
        <meshBasicMaterial ref={arrowInk} color={CHANNELS[CHANNELS.length - 1].color} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function GrowthChart() {
  const story = useStory();
  const m = materials();
  const plinth = useRef<Group>(null);
  const first = PIPELINE.weeks[0];
  const last = PIPELINE.weeks[PIPELINE.weeks.length - 1];
  const length = first - last + PIPELINE.bar + 0.24;

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    if (plinth.current) {
      const s = easeOutCubic(story.weekIn(0, t));
      plinth.current.visible = s > 0;
      plinth.current.scale.set(1, 1, Math.max(1e-4, s));
    }
  });

  return (
    <group>
      {/* A slim white plinth the weeks stand on, drawing out from the oldest week. */}
      <group ref={plinth} position={[PIPELINE.chartX, 0, first + PIPELINE.bar / 2 + 0.12]} visible={false}>
        <RoundedBox args={[PIPELINE.bar + 0.2, 0.03, length]} radius={0.012} smoothness={2} position={[0, 0.015, -length / 2]} material={m.panel} receiveShadow />
      </group>
      {PIPELINE.weeks.map((_, w) => (
        <Week key={w} w={w} />
      ))}
      <Trend />
    </group>
  );
}
