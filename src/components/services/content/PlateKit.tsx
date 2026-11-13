"use client";

import type { PointerEvent, ReactNode } from "react";

// A bar growing up from its base: used by the Improve tile and the Monthly execution calendar.
const KEYFRAMES = `
@keyframes grow { from { transform: scaleY(0); } }
`;

// The 3D plate kit shared by the Process tiles and the Search page's Commitment cards. A plate has real thickness
// and a floor shadow, tilts toward the pointer, and carries artwork split into `Layer`s at different heights, so the
// tilt separates them in parallax. A card that holds a plate is a `group`, and passes `tilt` / `untilt` to its
// pointer handlers: they set --rx, --ry, --mx and --my on the card, which the plate reads.

/** Points the plate's tilt and glare at the pointer: the variables are read by the plate inside this card. */
export function tilt(e: PointerEvent<HTMLLIElement>) {
  if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const li = e.currentTarget;
  const plate = li.querySelector("[data-plate]");
  if (!plate) return;
  const r = plate.getBoundingClientRect();
  const dx = clamp((e.clientX - (r.left + r.width / 2)) / 110);
  const dy = clamp((e.clientY - (r.top + r.height / 2)) / 90);
  li.style.setProperty("--ry", `${dx * 24}deg`);
  li.style.setProperty("--rx", `${-dy * 24}deg`);
  li.style.setProperty("--mx", `${clamp((e.clientX - r.left) / r.width, 0, 1) * 100}%`);
  li.style.setProperty("--my", `${clamp((e.clientY - r.top) / r.height, 0, 1) * 100}%`);
}
export function untilt(e: PointerEvent<HTMLLIElement>) {
  for (const v of ["--rx", "--ry", "--mx", "--my"]) e.currentTarget.style.removeProperty(v);
}
const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));


export const INK = "#172c21";
export const GREEN = "var(--primary)";
export const SPRING = "ease-[cubic-bezier(0.34,1.56,0.64,1)]";
/** A transform that eases with a little overshoot, and not at all with reduced motion. */
export const MOVE = `transition-transform duration-700 ${SPRING} motion-reduce:transition-none`;
export const SVG = "size-[3.8rem] overflow-visible";
export const LINE = { fill: "none", stroke: INK, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const SOFT = { filter: "blur(1.6px)" } as const;


/**
 * The tile: a plate with real thickness and a floor shadow, tilted toward the pointer. Its artwork is a stack of
 * `Layer`s at different heights; a green glare follows the cursor across the face.
 */
export function Plate({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" data-plate="" className="relative block size-[5.5rem] shrink-0 self-start [perspective:650px]">
<style href="plate-kit" precedence="default">{KEYFRAMES}</style>
      <span
        className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-300 ease-out group-hover:[--lift:-6px] motion-reduce:transition-none"
        style={{ transform: "translateY(var(--lift, 0px)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
      >
        <span className="absolute inset-x-2 bottom-0 h-7 rounded-[50%] bg-[rgb(23_44_33/0.38)] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" style={{ transform: "translateZ(-46px) translateY(14px)" }} />
        {[-1, -2, -3, -4, -5, -6, -7, -8].map((z) => (
          <span key={z} className="absolute inset-0 rounded-[24px]" style={{ transform: `translateZ(${z}px)`, background: z > -5 ? "#e3e1d9" : "#d3d1c8" }} />
        ))}
        <span className="absolute inset-0 rounded-[24px] border border-line bg-[linear-gradient(150deg,#ffffff_0%,#f4f3ee_100%)] shadow-[inset_0_1px_0_#fff]">
          <span
            className="absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
            style={{ background: "radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgb(25 231 110 / 0.2), transparent 58%)" }}
          />
        </span>
        {children}
      </span>
    </span>
  );
}

/** One layer of a tile's artwork, lifted `z` px off the plate. */
export function Layer({ z, children }: { z: number; children: ReactNode }) {
  return (
    <span className="absolute inset-0 grid place-items-center" style={{ transform: `translateZ(${Math.round(z * 1.4)}px)` }}>
      <svg viewBox="0 0 48 48" className={SVG}>
        {children}
      </svg>
    </span>
  );
}

