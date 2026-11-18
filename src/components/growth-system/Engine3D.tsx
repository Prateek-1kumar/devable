"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, MathUtils, Shape, type Group, type LineBasicMaterial, type PointLight } from "three";

// The engine's body in 3D: a machined ink tile turned 45°, with a soft bevel catching studio light, a satin top,
// and a hairline rim in the brand green that brightens as each service docks (`lit` of 4). It leans a few
// degrees toward the cursor and swings gently when a service lands. The D mark and wordmark are DOM, laid over
// the canvas by the parent so they stay crisp. Drawn only while `active` (the band is on screen).

const SIDE = 1; // tile side, scene units
const RADIUS = 0.2;
const DEPTH = 0.16;
const BEVEL = 0.07;

function rounded(side: number, r: number) {
  const h = side / 2;
  const s = new Shape();
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.absarc(h - r, -h + r, r, -Math.PI / 2, 0, false);
  s.lineTo(h, h - r);
  s.absarc(h - r, h - r, r, 0, Math.PI / 2, false);
  s.lineTo(-h + r, h);
  s.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-h, -h + r);
  s.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

// The pointer, shared by every frame without re-rendering.
const pointer = { x: 0, y: 0 };

function Tile({ lit }: { lit: number }) {
  const group = useRef<Group>(null);
  const rim = useRef<LineBasicMaterial>(null);
  const glint = useRef<PointLight>(null);
  const swing = useRef(0);
  const shown = useRef(lit);

  const body = useMemo(() => {
    const g = new ExtrudeGeometry(rounded(SIDE, RADIUS), { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 10, curveSegments: 28 });
    g.translate(0, 0, -DEPTH / 2);
    return g;
  }, []);
  // The rim: the tile's outline at the front edge of the bevel.
  const outline = useMemo(() => {
    const pts = rounded(SIDE + BEVEL * 1.1, RADIUS + BEVEL * 0.55).getPoints(48);
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pts.flatMap((p) => [p.x, p.y, DEPTH / 2 + BEVEL * 0.35]), 3));
    return g;
  }, []);

  useEffect(() => () => (body.dispose(), outline.dispose()), [body, outline]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    if (lit > shown.current) swing.current = 1; // a service just landed
    shown.current = lit;
    swing.current = MathUtils.damp(swing.current, 0, 2.6, dt);
    const t = state.clock.elapsedTime;
    const sway = Math.sin(t * 0.45) * 0.035;
    g.rotation.x = MathUtils.damp(g.rotation.x, -pointer.y * 0.16 + sway * 0.6 + swing.current * 0.08 * Math.sin(t * 9), 4, dt);
    g.rotation.y = MathUtils.damp(g.rotation.y, pointer.x * 0.2 + sway, 4, dt);
    const k = lit / 4;
    if (rim.current) rim.current.opacity = MathUtils.damp(rim.current.opacity, 0.22 + 0.78 * k, 3, dt);
    if (glint.current) glint.current.intensity = MathUtils.damp(glint.current.intensity, 0.4 + 2.2 * k + swing.current * 2, 3, dt);
  });

  return (
    <>
      <pointLight ref={glint} position={[0.9, -0.9, 0.9]} distance={3} color="#19e76e" intensity={0.4} />
      <group ref={group}>
        <group rotation={[0, 0, Math.PI / 4]}>
          <mesh geometry={body}>
            <meshPhysicalMaterial color="#13261a" roughness={0.38} metalness={0.25} clearcoat={1} clearcoatRoughness={0.28} envMapIntensity={1.35} />
          </mesh>
          <lineLoop geometry={outline}>
            <lineBasicMaterial ref={rim} color="#19e76e" transparent opacity={0.22} />
          </lineLoop>
        </group>
      </group>
    </>
  );
}

export default function Engine3D({ lit, active, size, onReady }: { lit: number; active: boolean; size: number; onReady: () => void }) {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // Scene units → px: the turned tile's half-diagonal fills about 40% of the canvas.
  const zoom = (size * 0.4) / (((SIDE / 2 + BEVEL) * Math.SQRT2));
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 6], zoom }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      resize={{ offsetSize: true }}
      frameloop={active ? "always" : "never"}
      onCreated={onReady}
      style={{ width: size, height: size }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[-2.5, 3, 5]} intensity={1.1} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2.4} position={[-2.5, 2.5, 3]} scale={[4, 2.2, 1]} />
        <Lightformer form="rect" intensity={0.9} position={[3, -2, 2.5]} scale={[3, 1.2, 1]} />
        <Lightformer form="circle" intensity={1} position={[0, 0, 4]} scale={2.4} />
      </Environment>
      <Tile lit={lit} />
    </Canvas>
  );
}
