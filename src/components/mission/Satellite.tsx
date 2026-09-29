import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type Group, type Object3D } from "three";
import { useCanvasTexture } from "../growth-engine/useCanvasTexture";
import { useMission } from "./frame";
import { missionMaps } from "./materials";
import SatArrays from "./SatArrays";
import { BUS, FACE, FACE_OFF, goldGeometry, SKIN, standoffGeometry, thrusterGeometry } from "./satelliteGeometry";
import { drawCells, drawFront, drawGold, drawOSR, drawPanelBack } from "./satelliteMaps";
import SatPayload, { DISH_GEO } from "./SatPayload";
import { satelliteAttitude, dishAim } from "./satelliteMotion";

// DVB-01, the Devable spacecraft (bus-local pad units at scale 1; it rides in the craft group, which
// carries vehicleScale). A 0.20 × 0.26 × 0.20 bus in real blankets: black MLI front with the Devable
// mark, gold MLI sides and deck, a white OSR radiator on the back, a champagne Marman ring and four
// thrusters underneath. On the deck, your devtool: the payload instrument. On the back, the downlink
// dish on its boom. Four channel wings (SatArrays) make the X.


export default function Satellite() {
  const frame = useMission();
  const root = useRef<Group>(null);
  const boom = useRef<Group>(null);
  const dish = useRef<Group>(null);
  const aperture = useRef<Object3D>(null);
  const led = useRef<MeshStandardMaterial>(null);
  const tips = useRef<(Object3D | null)[]>([]);

  const cellsTex = useCanvasTexture(1024, 512, drawCells);
  const backTex = useCanvasTexture(256, 128, drawPanelBack);
  const frontTex = useCanvasTexture(376, 496, drawFront);
  const goldTex = useCanvasTexture(256, 256, drawGold);
  const osrTex = useCanvasTexture(256, 336, drawOSR);

  const geo = useMemo(() => ({ gold: goldGeometry(), thrusters: thrusterGeometry(), standoffs: standoffGeometry() }), []);
  const mats = useMemo(() => {
    const maps = missionMaps();
    return {
      core: new MeshStandardMaterial({ color: "#16171a", roughness: 0.6, metalness: 0.2 }),
      front: new MeshStandardMaterial({ map: frontTex.texture, normalMap: maps.blackCrinkle, normalScale: new Vector2(0.35, 0.35), metalness: 0.3, roughness: 0.55 }),
      gold: new MeshStandardMaterial({ map: goldTex.texture, normalMap: maps.goldCrinkle, normalScale: new Vector2(0.6, 0.6), metalness: 1, roughness: 0.38, envMapIntensity: 2.5 }),
      osr: new MeshStandardMaterial({ map: osrTex.texture, metalness: 0.3, roughness: 0.1 }),
      champagne: new MeshStandardMaterial({ color: "#c9b27c", metalness: 1, roughness: 0.3, envMapIntensity: 2.5 }),
      niobium: new MeshStandardMaterial({ color: "#3b3d40", metalness: 0.9, roughness: 0.35, side: DoubleSide }),
      wing: {
        cells: new MeshPhysicalMaterial({
          map: cellsTex.texture,
          metalness: 0.2,
          roughness: 0.18,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          iridescence: 0.35,
          iridescenceIOR: 1.6,
          iridescenceThicknessRange: [250, 600],
        }),
        back: new MeshStandardMaterial({ map: backTex.texture, roughness: 0.8 }),
        alu: new MeshStandardMaterial({ color: "#b9bdc4", metalness: 0.8, roughness: 0.35, envMapIntensity: 2 }),
        carbon: new MeshStandardMaterial({ color: "#1c1d20", metalness: 0.3, roughness: 0.45 }),
      },
    };
  }, [cellsTex.texture, backTex.texture, frontTex.texture, goldTex.texture, osrTex.texture]);

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const p = frame.p;
    satelliteAttitude(p, frame.craft, frame.quat, g.quaternion);
    const out = boom.current;
    const deployed = dishAim.deploy(p);
    if (out) out.rotation.x = -(Math.PI / 2) * deployed;
    g.updateMatrixWorld(true);
    const d = dish.current;
    if (d?.parent) {
      dishAim.aim(p, frame.theta, d.parent, deployed, d.quaternion);
      d.updateMatrixWorld(true);
      d.getWorldPosition(frame.dish);
    }
    aperture.current?.getWorldPosition(frame.head);
    tips.current.forEach((tip, i) => {
      if (tip) frame.setTip(i, tip);
    });
    if (led.current) led.current.emissiveIntensity = p >= 0.465 ? 1.5 : 0;
  }, -1.5);

  const [t, f] = [SKIN, FACE_OFF];

  return (
    <group ref={root}>
      <RoundedBox args={[BUS.w, BUS.h, BUS.w]} radius={0.01} smoothness={3} material={mats.core} castShadow receiveShadow />
      {/* Blankets, each standing 1 mm proud of the core so nothing is coplanar. */}
      <mesh position={[0, 0, f]} material={mats.front} castShadow receiveShadow>
        <boxGeometry args={[FACE, 0.248, t]} />
      </mesh>
      <mesh position={[0, 0, -f]} rotation-y={Math.PI} material={mats.osr} receiveShadow>
        <boxGeometry args={[FACE, 0.248, t]} />
      </mesh>
      <mesh geometry={geo.gold} material={mats.gold} receiveShadow />
      <mesh geometry={geo.standoffs} material={mats.wing.carbon} />
      {/* Status LED under the mark: lights at DEVABLE ONLINE. */}
      <mesh position={[0, -0.062, f + 0.002]}>
        <boxGeometry args={[0.006, 0.004, 0.002]} />
        <meshStandardMaterial ref={led} color="#0b0c0d" emissive="#179a55" emissiveIntensity={0} />
      </mesh>
      {/* Marman separation ring and the four thrusters at the lower corners. */}
      <mesh position={[0, -BUS.h / 2 - 0.009, 0]} material={mats.champagne} castShadow>
        <cylinderGeometry args={[0.078, 0.086, 0.018, 48]} />
      </mesh>
      <mesh geometry={geo.thrusters} material={mats.niobium} />
      <SatPayload apertureRef={aperture} y={BUS.h / 2 + t} />
      {/* Downlink dish: its boom hinges at the foot of the radiator, folded up the face until deployed. */}
      <group position={[0, -0.11, -f - 0.004]} ref={boom}>
        <mesh position={[0, 0.06, 0]} material={mats.wing.alu}>
          <cylinderGeometry args={[0.004, 0.004, 0.12, 10]} />
        </mesh>
        <group position={[0, 0.12, 0]} ref={dish}>
          <mesh geometry={DISH_GEO} castShadow receiveShadow>
            <meshStandardMaterial color="#f1f1ee" roughness={0.5} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.03, 0]} material={mats.wing.carbon}>
            <cylinderGeometry args={[0.003, 0.006, 0.04, 8]} />
          </mesh>
        </group>
      </group>
      <SatArrays
        mats={mats.wing}
        tipRef={(i, o) => {
          tips.current[i] = o;
        }}
      />
    </group>
  );
}
