import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const STIFFNESS = 26;
const DAMPING = 6.5; // slightly under-damped: a small settling bounce

/**
 * Turns a group a few degrees toward the cursor anywhere on the page, on a
 * spring, so the object feels heavy. Returns the ref for the group.
 */
export function useCursorTilt({ yaw = 0.14, pitch = 0.05, enabled = true } = {}) {
  const ref = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const spring = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group || !enabled) return;
    const dt = Math.min(delta, 1 / 30);
    const s = spring.current;
    s.vx += (STIFFNESS * (target.current.x - s.x) - DAMPING * s.vx) * dt;
    s.vy += (STIFFNESS * (target.current.y - s.y) - DAMPING * s.vy) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    group.rotation.y = s.x * yaw;
    group.rotation.x = s.y * pitch;
  });

  return ref;
}
