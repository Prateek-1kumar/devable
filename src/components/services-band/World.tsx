import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import {
  Color,
  ShaderMaterial,
  Vector3,
  type OrthographicCamera as OrthoCam,
} from "three";
import { damp } from "../growth-engine/story";
import { clamp01, shown, span, storyOf } from "./content";
import {
  BandContext,
  RIGHT,
  UP,
  VIEW,
  colors,
  easeInOut,
  easeOut,
  useBand,
} from "./kit";
import { labelStore, offset, type LabelSpec } from "./label-store";
import { AT } from "./layout";
import { ContentStation } from "./stations/content";
import { CreatorStation } from "./stations/creators";
import { Hub, OVERVIEW_LABELS, Pipes } from "./stations/hub";
import { RedditStation } from "./stations/reddit";
import { SearchStation } from "./stations/search";

type Props = {
  /** Scroll position in beats, written by the page on scroll. */
  trackRef: RefObject<number>;
  /** Reduced motion: follow scroll exactly, no easing lag. */
  still: boolean;
  /** Pause rendering while the band is off screen. */
  active: boolean;
};

export default function World({ trackRef, still, active }: Props) {
  const bandRef = useRef(-0.5);
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true }}
    >
      <BandContext.Provider value={bandRef}>
        <Rig trackRef={trackRef} still={still} />
        {/* Flat illustration light: tops white, the front a shade down, the right side a little darker. */}
        <ambientLight intensity={2.3} />
        <directionalLight position={[2, 9, 4]} intensity={0.95} />
        <Floor />
        <Pipes />
        <Hub />
        <ContentStation />
        <SearchStation />
        <RedditStation />
        <CreatorStation />
        <Projector />
      </BandContext.Provider>
    </Canvas>
  );
}

const SAFE = 16;
const LABELS: LabelSpec[] = OVERVIEW_LABELS;

/**
 * Publishes the labels to the page (which renders them as HTML over the canvas), then pins each one to its
 * point every frame, fading and lifting it in with its part of the story.
 */
function Projector() {
  const bandRef = useBand();
  const v = useMemo(() => new Vector3(), []);
  useEffect(() => {
    labelStore.set(LABELS);
    return () => labelStore.set([]);
  }, []);
  useFrame(({ camera, size }) => {
    const x = bandRef.current;
    for (const spec of LABELS) {
      const el = labelStore.els.get(spec.key);
      if (!el) continue;
      const k = clamp01(shown(x, spec.beat, spec.from, spec.to));
      if (k < 0.01) {
        if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
        continue;
      }
      const p = spec.at;
      v.set(p[0], p[1], p[2]).project(camera);
      const px = ((v.x + 1) / 2) * size.width;
      const py =
        ((1 - v.y) / 2) * size.height +
        (1 - easeOut(k)) * (spec.side === "down" ? -8 : 10);
      // Kept inside a 16px safe area: a label that would run off the stage slides back in, dot and all.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const [ox, oy] = offset(spec, w, h);
      const left = Math.min(Math.max(px + ox, SAFE), size.width - SAFE - w);
      const top = Math.min(Math.max(py + oy, SAFE), size.height - SAFE - h);
      el.style.visibility = "visible";
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
    }
  });
  return null;
}

/**
 * What the camera frames at each beat: a world point and the area around it (screen units) that must fit.
 * The last beat pulls back over the whole floor.
 */
const FRAMES = [
  { at: new Vector3(0, 1.0, 0), w: 8.8, h: 6.2 },
  { at: AT.content.clone().add(new Vector3(0.4, 1.0, -0.2)), w: 9.8, h: 6.4 },
  { at: AT.search.clone().add(new Vector3(-1.4, 1.4, 0.5)), w: 10.2, h: 6.6 },
  { at: AT.reddit.clone().add(new Vector3(0, 1.5, 0)), w: 7.6, h: 5.4 },
  { at: AT.creators.clone().add(new Vector3(0.1, 0.9, 0.9)), w: 10.4, h: 6.8 },
  { at: new Vector3(0.2, 2.1, 0.6), w: 33, h: 18 },
];

/**
 * Eases the scroll position, then flies the camera from frame to frame: it holds on each beat and travels
 * between them, pulling back a little mid-flight. The station sits a touch right of and below centre, clear of
 * the headline; on phones it fills more of the width.
 */
function Rig({
  trackRef,
  still,
}: {
  trackRef: RefObject<number>;
  still: boolean;
}) {
  const bandRef = useBand();
  const camera = useRef<OrthoCam>(null);
  const size = useThree((s) => s.size);
  const at = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const cam = camera.current;
    if (!cam) return;
    bandRef.current = still
      ? trackRef.current
      : damp(bandRef.current, trackRef.current, 2.1, Math.min(delta, 1 / 30));
    const x = Math.min(FRAMES.length - 1, Math.max(0, bandRef.current));
    const i = Math.min(Math.floor(x), FRAMES.length - 2);
    // A long, soft sine ease between beats (no hard acceleration).
    const f = 0.5 - 0.5 * Math.cos(Math.PI * span(x - i, 0.22, 0.78));
    const a = FRAMES[i];
    const b = FRAMES[i + 1];
    at.lerpVectors(a.at, b.at, f);
    const w = a.w + (b.w - a.w) * f;
    const h = a.h + (b.h - a.h) * f;
    const phone = size.width < 640;
    // Phones crop each station's sides to keep it large; the closing overview shows everything.
    const crop = phone
      ? 0.7 + 0.05 * span(x, FRAMES.length - 2, FRAMES.length - 1)
      : 1;
    // Pull back a little mid-flight; push in gently while a beat's story plays.
    const beat = Math.round(x);
    const push =
      beat < FRAMES.length - 1
        ? 1 +
          0.05 *
            easeInOut(storyOf(bandRef.current, beat)) *
            (1 - span(Math.abs(x - beat), 0.2, 0.3))
        : 1;
    const zoom =
      (Math.min(
        size.width / (w * crop),
        (size.height * (phone ? 0.62 : 0.8)) / h,
      ) /
        (1 + 0.09 * Math.sin(Math.PI * f))) *
      push;
    // Shift the framed point off centre (in pixels), then convert to world units along the screen axes.
    const dx = phone ? 0 : -size.width * 0.02;
    const dy = phone ? -size.height * 0.06 : -size.height * 0.01;
    at.addScaledVector(RIGHT, -dx / zoom).addScaledVector(UP, dy / zoom);
    cam.left = -size.width / 2 / zoom;
    cam.right = size.width / 2 / zoom;
    cam.top = size.height / 2 / zoom;
    cam.bottom = -size.height / 2 / zoom;
    cam.position.copy(VIEW).multiplyScalar(50).add(at);
    cam.lookAt(at);
    cam.updateProjectionMatrix();
  });

  return (
    <OrthographicCamera ref={camera} makeDefault manual near={1} far={120} />
  );
}

/** A faint drafting grid on the floor, fading out away from the stations. Crisp one-pixel lines at any zoom. */
function Floor() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { color: { value: new Color(colors().ink) } },
        vertexShader: /* glsl */ `
          varying vec2 vPos;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vPos = world.xz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 color;
          varying vec2 vPos;
          void main() {
            vec2 g = abs(fract(vPos - 0.5) - 0.5) / fwidth(vPos);
            float line = 1.0 - min(min(g.x, g.y), 1.0);
            float fade = 1.0 - smoothstep(9.0, 19.0, length(vPos));
            gl_FragColor = vec4(color, line * fade * 0.07);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={-0.002}
      material={material}
      renderOrder={-2}
    >
      <planeGeometry args={[48, 48]} />
    </mesh>
  );
}
