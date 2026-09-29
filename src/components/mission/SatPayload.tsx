import { useMemo, type RefObject } from "react";
import { BackSide, DoubleSide, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type Object3D } from "three";

// "Your devtool": the payload instrument on the deck (satin white anodised barrel, black baffle, the
// lens at the aperture), with a star-tracker baffle, an S-band patch and two stub omni antennas.

/** A shallow parabolic dish (r .07, depth .02) with a little thickness, opening toward +Y. */
export const DISH_GEO = (() => {
  const [r, depth, n] = [0.07, 0.02, 14];
  const pts: Vector2[] = [];
  for (let i = 0; i <= n; i++) pts.push(new Vector2((r * i) / n, depth * (i / n) ** 2));
  for (let i = n; i >= 0; i--) pts.push(new Vector2((r * i) / n, depth * (i / n) ** 2 - 0.003));
  return new LatheGeometry(pts, 40);
})();

const BARREL = { r: 0.05, h: 0.1, x: 0.022, z: -0.018 } as const;

export default function SatPayload({ apertureRef, y }: { apertureRef: RefObject<Object3D | null>; y: number }) {
  const m = useMemo(
    () => ({
      anodised: new MeshStandardMaterial({ color: "#e9e9e6", roughness: 0.35, metalness: 0.1 }),
      baffle: new MeshStandardMaterial({ color: "#050506", roughness: 0.9, side: BackSide }),
      baffleOut: new MeshStandardMaterial({ color: "#0b0c0e", roughness: 0.7, side: DoubleSide }),
      lens: new MeshPhysicalMaterial({ color: "#0d2a2f", roughness: 0.05, clearcoat: 1, metalness: 0.2 }),
      patch: new MeshStandardMaterial({ color: "#e4dfcf", roughness: 0.6 }),
      whip: new MeshStandardMaterial({ color: "#d9dade", roughness: 0.4, metalness: 0.6 }),
    }),
    [],
  );
  const top = y + BARREL.h;
  return (
    <group>
      <group position={[BARREL.x, 0, BARREL.z]}>
        <mesh position={[0, y + BARREL.h / 2, 0]} material={m.anodised} castShadow receiveShadow>
          <cylinderGeometry args={[BARREL.r, BARREL.r, BARREL.h, 40, 1, true]} />
        </mesh>
        <mesh position={[0, y + BARREL.h / 2 + 0.002, 0]} material={m.baffle}>
          <cylinderGeometry args={[BARREL.r - 0.005, BARREL.r - 0.005, BARREL.h - 0.004, 40, 1, true]} />
        </mesh>
        <mesh position={[0, top, 0]} rotation-x={-Math.PI / 2} material={m.anodised}>
          <ringGeometry args={[BARREL.r - 0.005, BARREL.r, 40]} />
        </mesh>
        {/* The lens, recessed behind its baffle. */}
        <mesh position={[0, top - 0.035, 0]} rotation-x={-Math.PI / 2} material={m.lens}>
          <circleGeometry args={[BARREL.r - 0.005, 40]} />
        </mesh>
        <object3D position={[0, top, 0]} ref={apertureRef} />
      </group>
      {/* Star-tracker baffle, canted off the deck corner. */}
      <mesh position={[-0.064, y + 0.014, 0.062]} rotation={[0.35, 0, 0.35]} material={m.baffleOut}>
        <cylinderGeometry args={[0.016, 0.007, 0.03, 20, 1, true]} />
      </mesh>
      {/* S-band patch, raised 2 mm. */}
      <mesh position={[-0.052, y + 0.001, -0.052]} material={m.patch} receiveShadow>
        <boxGeometry args={[0.05, 0.002, 0.05]} />
      </mesh>
      {/* Two stub omni antennas. */}
      {[
        [0.084, 0.084],
        [-0.084, -0.006],
      ].map(([x, z]) => (
        <mesh key={x} position={[x, y + 0.04, z]} material={m.whip}>
          <cylinderGeometry args={[0.002, 0.002, 0.08, 6]} />
        </mesh>
      ))}
    </group>
  );
}
