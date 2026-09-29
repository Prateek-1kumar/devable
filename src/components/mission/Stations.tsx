import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { AdditiveBlending, Color, Vector3, type Points } from "three";
import type { Line2 } from "three-stdlib";
import { CHANNELS } from "../growth-engine/channels";
import { easeOutCubic } from "../growth-engine/ease";
import { useMission } from "./frame";
import PointSet, { pointWriter, SOFT } from "./PointSet";
import { contact, CONTACT_HALF, firstLit, PEARLS, R, seg, smooth, STATIONS } from "./timeline";
import { C, STATION_N, sunDir } from "./world";

// Ground stations, as a flight-dynamics display draws them: a 3 px pin in the channel's colour on the
// real place (dim until its first contact, then ringed in white, with one pulse as it lights), and a
// faint warm halo where the station sits on the night side, like a city light. No geometry on the
// planet: the brand marks live in the DOM chips (frame.stations feeds them). While the craft is in
// contact, a hairline beam in the channel colour runs from the dish down to the pin, its dashes
// flowing out to the station, and leads come back up it as small bright pulses, more on every pass.

const PIN_R = R * 1.0015;
const WHITE = new Color("#ffffff");
const CITY = new Color("#ffd9a3");
const COLORS = STATIONS.map((s) => new Color(CHANNELS[s.channel].color));
/** The pulses are white, tinted by the channel. */
const TINTS = COLORS.map((c) => WHITE.clone().lerp(c, 0.35));
const PIN_POS = STATION_N.map((n) => n.clone().multiplyScalar(PIN_R).add(C));
/** θ at which each station first lights (the timeline's firstLit threshold). */
const LIT_THETA = STATIONS.map((s) => s.theta + 360 - CONTACT_HALF + 0.35 * 2 * CONTACT_HALF);
const UNIT = [new Vector3(0, 0, 0), new Vector3(0, 0, 1)];
const Z = new Vector3(0, 0, 1);
/** Beam dashes in css px, and how fast they flow out to the station. */
const DASH = { on: 7, off: 5, speed: 36 } as const;
/** Pulses per second, as a share of the beam. */
const PULSE_RATE = 0.4;

const v = { sun: new Vector3(), cam: new Vector3(), to: new Vector3(), end: new Vector3(), dir: new Vector3(), a: new Vector3(), b: new Vector3(), q: new Vector3() };

export default function Stations() {
  const frame = useMission();
  const pins = useRef<Points>(null);
  const glows = useRef<Points>(null);
  const beams = useRef<(Line2 | null)[]>([]);
  const halos = useRef<(Line2 | null)[]>([]);
  const colors = useMemo(() => STATIONS.map((s) => CHANNELS[s.channel].color), []);

  useFrame((state) => {
    const { p, t, still } = frame;
    const th = frame.theta;
    const { width, height } = state.size;
    const cam = state.camera;
    const on = smooth(seg(p, 0.575, 0.6));
    const pin = pointWriter(pins.current);
    const glow = pointWriter(glows.current);
    sunDir(p, v.sun);
    v.cam.copy(cam.position);

    STATIONS.forEach((_, k) => {
      const n = STATION_N[k];
      const P = PIN_POS[k];
      const facing = n.dot(v.to.subVectors(v.cam, P).normalize());
      const lit = firstLit(k, th);
      const hit = contact(k, th);
      const env = hit ? smooth(Math.min(seg(hit.c, 0, 0.15), 1 - seg(hit.c, 0.85, 1))) : 0;
      const st = frame.stations[k];
      st.pos.copy(P);
      // ponytail: on a sphere, a surface point facing the camera is never hidden by the sphere, so this
      // also passes the ray-sphere test.
      st.front = on > 0.5 && facing > 0.12;
      st.lit = lit;
      st.live = on * env;

      // Pins fade out toward the limb (the depth test hides the far side).
      const a = on * smooth(seg(facing, 0, 0.18));
      if (pin && glow && a > 0) {
        pin.put(P.x, P.y, P.z, 3, COLORS[k], a * (lit ? 1 : 0.35));
        if (lit) pin.put(P.x, P.y, P.z, 7, WHITE, 0.7 * a, 1);
        const q = seg(th, LIT_THETA[k], LIT_THETA[k] + 9); // the one pulse as it lights
        if (q > 0 && q < 1) pin.put(P.x, P.y, P.z, 4 + 14 * easeOutCubic(q), COLORS[k], 0.9 * (1 - q) * a, 1);
        const night = smooth(seg(-n.dot(v.sun), -0.1, 0.05));
        glow.put(P.x, P.y, P.z, 10, CITY, 0.25 * night * a, SOFT);
      }

      // The contact beam: drawn out from the dish over the first 15% of the pass, faded at both ends.
      const beam = beams.current[k];
      const halo = halos.current[k];
      const live = on * env;
      for (const l of [beam, halo]) if (l) l.visible = live > 0.002;
      if (!beam || !halo || !hit || live <= 0.002) return;
      const reach = easeOutCubic(seg(hit.c, 0, 0.15));
      v.end.lerpVectors(frame.dish, P, reach);
      v.dir.subVectors(v.end, frame.dish);
      const len = Math.max(1e-4, v.dir.length());
      v.dir.divideScalar(len);
      for (const l of [beam, halo]) {
        l.position.copy(frame.dish);
        l.quaternion.setFromUnitVectors(Z, v.dir);
        l.scale.set(1, 1, len);
      }
      // Dashes in screen pixels: the unit segment's line distance, scaled by its projected length.
      v.a.copy(frame.dish).project(cam);
      v.b.copy(v.end).project(cam);
      const px = Math.hypot(((v.b.x - v.a.x) * width) / 2, ((v.b.y - v.a.y) * height) / 2);
      beam.material.dashScale = Math.max(1, px);
      beam.material.dashOffset = -DASH.speed * t;
      beam.material.opacity = 0.9 * live;
      halo.material.opacity = 0.1 * live;

      // Leads coming back: pulses travelling station to satellite, a bright head with a short tail.
      if (!glow || still) return;
      const count = PEARLS[Math.min(hit.pass, PEARLS.length - 1)];
      for (let j = 0; j < count; j++) {
        const u = (PULSE_RATE * t + j / count) % 1; // 0 at the station, 1 at the dish
        if (1 - u > reach) continue;
        const fade = live * smooth(seg(u, 0, 0.08)) * (1 - smooth(seg(u, 0.9, 1)));
        for (let s = 0; s < 3; s++) {
          v.q.lerpVectors(P, frame.dish, Math.max(0, u - 0.018 * s));
          glow.put(v.q.x, v.q.y, v.q.z, [5, 4, 3][s], TINTS[k], [0.95, 0.4, 0.18][s] * fade, SOFT);
        }
      }
    });
    pin?.done();
    glow?.done();
  }, -1.2); // after the satellite pass (the dish), before the label writer (the chips)

  return (
    <group>
      <PointSet ref={pins} max={16} />
      <PointSet ref={glows} max={96} additive />
      {STATIONS.map((s, k) => (
        <group key={s.mark}>
          <Line
            ref={(l: Line2 | null) => {
              halos.current[k] = l;
              if (l) l.visible = false; // not a prop: drei spreads props onto the material too
            }}
            points={UNIT}
            color={colors[k]}
            lineWidth={5}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            frustumCulled={false}
            renderOrder={3}
          />
          <Line
            ref={(l: Line2 | null) => {
              beams.current[k] = l;
              if (l) l.visible = false;
            }}
            points={UNIT}
            color={colors[k]}
            lineWidth={1}
            dashed
            dashSize={DASH.on}
            gapSize={DASH.off}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            frustumCulled={false}
            renderOrder={3}
          />
        </group>
      ))}
    </group>
  );
}
