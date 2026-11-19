import { useId } from "react";

// A Reddit-style user avatar: a snoo character (antenna, ears, a big oval head) with its own hair or headwear,
// eyes, mouth, facial hair and outfit, cropped head-and-shoulders on a coloured disc the way Reddit shows avatars
// next to comments. Every part is picked from the username, so the same user always looks the same (server and
// browser agree) and every commenter in a thread looks different. Drawn as outlined illustration, like Reddit's
// own avatar art; the characters are original, built from simple shapes.

const LINE = "#1a1a1b";
const BG = ["#ffd8c2", "#cfe3ff", "#d8f8e5", "#e9ddff", "#fff1b8", "#cdeff3", "#ffd6e3", "#e3e7e4", "#ffe2a8"];
const SKIN = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#f6dccb", "#cfe6ff", "#d6f5d9", "#e8ddff", "#ffe9b0"];
const OUTFIT = ["#ff4500", "#0079d3", "#2fae55", "#7193ff", "#ffb000", "#2b2b2c", "#ff66ac", "#24a0ed", "#8a5cf6", "#0d7a5f"];
const HAIR = ["#1a1a1b", "#6b3e26", "#ffb000", "#7a5af5", "#3f51ff", "#ff4500", "#e7e7e7", "#ff66ac", "#2fae55"];

type Pick = { bg: string; skin: string; outfit: string; trim: string; hair: string; top: number; eyes: number; mouth: number; face: number; wear: number };

/** Deterministic picks from a string. */
function pick(seed: string): Pick {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const next = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const of = <T,>(a: readonly T[]) => a[Math.floor(next() * a.length)];
  const outfit = of(OUTFIT);
  return {
    bg: of(BG),
    skin: of(SKIN),
    outfit,
    trim: of(OUTFIT.filter((c) => c !== outfit)),
    hair: of(HAIR),
    top: Math.floor(next() * 6), // spiky, swoop, beanie, cap, headphones, bare
    eyes: Math.floor(next() * 5), // snoo, sunglasses, round glasses, visor, happy
    mouth: Math.floor(next() * 4), // smile, grin, smirk, small
    face: Math.floor(next() * 5), // none, goatee, moustache, blush, none
    wear: Math.floor(next() * 4), // tee, hoodie, jacket, stripes
  };
}

const S = { stroke: LINE, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Outfit({ p }: { p: Pick }) {
  const body = "M12 70 C12 55 21 49 32 49 C43 49 52 55 52 70 Z";
  return (
    <g>
      {p.wear === 1 && <path d="M19 55 C21 48 43 48 45 55 C40 52 24 52 19 55 Z" fill={p.trim} {...S} />}
      <path d={body} fill={p.outfit} {...S} />
      {p.wear === 0 && <path d="M26 50 Q32 55 38 50" fill="none" {...S} />}
      {p.wear === 1 && (
        <g {...S} fill="none">
          <path d="M29 52 V59" />
          <path d="M35 52 V58" />
        </g>
      )}
      {p.wear === 2 && (
        <g>
          <path d="M27 49.6 L32 60 L37 49.6 Z" fill={p.trim} {...S} />
          <path d="M32 60 V70" {...S} />
        </g>
      )}
      {p.wear === 3 && (
        <g fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2.4">
          <path d="M14 59 H50" />
          <path d="M13 65 H51" />
        </g>
      )}
    </g>
  );
}

function Eyes({ p }: { p: Pick }) {
  const iris = "#ff4500";
  switch (p.eyes) {
    case 1: // sunglasses
      return (
        <g>
          <path d="M30 32.5 H34" {...S} />
          <rect x="18.5" y="29.5" width="12" height="7" rx="3" fill="#111" {...S} />
          <rect x="33.5" y="29.5" width="12" height="7" rx="3" fill="#111" {...S} />
          <path d="M21 31.5 L24 31.5" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M36 31.5 L39 31.5" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    case 2: // round glasses
      return (
        <g>
          <ellipse cx="25" cy="33.5" rx="2.1" ry="2.6" fill={iris} />
          <ellipse cx="39" cy="33.5" rx="2.1" ry="2.6" fill={iris} />
          <circle cx="25" cy="33.5" r="5" fill="#fff" fillOpacity="0.25" {...S} strokeWidth={1.3} />
          <circle cx="39" cy="33.5" r="5" fill="#fff" fillOpacity="0.25" {...S} strokeWidth={1.3} />
          <path d="M30 33 Q32 31.8 34 33" fill="none" {...S} strokeWidth={1.3} />
        </g>
      );
    case 3: // visor
      return (
        <g>
          <rect x="17" y="29.5" width="30" height="7.5" rx="3.75" fill="#3ee6d6" {...S} />
          <path d="M20.5 32 H31" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );
    case 4: // happy squint
      return (
        <g fill="none" {...S} strokeWidth={1.8}>
          <path d="M22 34.5 Q25 31 28 34.5" />
          <path d="M36 34.5 Q39 31 42 34.5" />
        </g>
      );
    default: // the snoo's own orange eyes
      return (
        <g>
          <ellipse cx="25" cy="33.5" rx="2.7" ry="3.3" fill={iris} />
          <ellipse cx="39" cy="33.5" rx="2.7" ry="3.3" fill={iris} />
          <circle cx="25.8" cy="32.4" r="0.8" fill="#fff" />
          <circle cx="39.8" cy="32.4" r="0.8" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ p }: { p: Pick }) {
  switch (p.mouth) {
    case 1:
      return <path d="M27 39.5 Q32 45.5 37 39.5 Z" fill="#fff" {...S} strokeWidth={1.4} />;
    case 2:
      return <path d="M28 41 Q33 42.5 36.5 39.5" fill="none" {...S} strokeWidth={1.4} />;
    case 3:
      return <ellipse cx="32" cy="41" rx="1.6" ry="1.3" fill={LINE} />;
    default:
      return <path d="M27.5 40 Q32 43.6 36.5 40" fill="none" {...S} strokeWidth={1.4} />;
  }
}

function Face({ p }: { p: Pick }) {
  if (p.face === 1) return <path d="M29 44 Q32 49.5 35 44 Q32 45.4 29 44 Z" fill={p.hair === "#e7e7e7" ? "#9aa0a6" : p.hair} {...S} strokeWidth={1.2} />;
  if (p.face === 2) return <path d="M26.5 39 Q29.5 36.8 32 38.6 Q34.5 36.8 37.5 39 Q34.5 40 32 39.4 Q29.5 40 26.5 39 Z" fill={p.hair === "#e7e7e7" ? "#9aa0a6" : p.hair} {...S} strokeWidth={1.1} />;
  if (p.face === 3)
    return (
      <g fill="#ff7aa8" fillOpacity="0.45">
        <ellipse cx="20.5" cy="38.5" rx="2.6" ry="1.6" />
        <ellipse cx="43.5" cy="38.5" rx="2.6" ry="1.6" />
      </g>
    );
  return null;
}

/** Hair or headwear. Returns [behind-the-head layer, in-front layer]; `antenna` says whether the antenna shows. */
function Top({ p }: { p: Pick }) {
  const c = p.hair;
  switch (p.top) {
    case 0: // spiky
      return <path d="M17 27 L18.5 17.5 L22.5 22 L24.5 13.5 L28.5 20 L31.5 11.5 L34.5 19.5 L38.5 13 L40.5 21.5 L45 16.5 L45.5 25.5 Q40 22.5 32 22.5 Q23 22.5 17 27 Z" fill={c} {...S} />;
    case 1: // swoop fringe
      return <path d="M16.5 28 Q15.5 18 27 17 Q40 15.5 47 23 Q48.5 26 47 28.5 Q42 24 36 25.5 Q30 27 24 25 Q20 25.5 16.5 28 Z" fill={c} {...S} />;
    case 2: // beanie
      return (
        <g>
          <path d="M15.5 26 Q16 12 32 12 Q48 12 48.5 26 Z" fill={p.trim} {...S} />
          <rect x="14.5" y="23.5" width="35" height="5" rx="2.5" fill={p.trim} {...S} />
          <path d="M19 24.5 V27.5 M23 24.5 V27.5 M27 24.5 V27.5 M31 24.5 V27.5 M35 24.5 V27.5 M39 24.5 V27.5 M43 24.5 V27.5" stroke={LINE} strokeOpacity="0.35" strokeWidth="1" />
          <circle cx="32" cy="10.5" r="3.2" fill="#fff" {...S} />
        </g>
      );
    case 3: // cap, brim to the side
      return (
        <g>
          <path d="M16 25.5 Q16.5 13 32 13 Q47.5 13 48 25.5 Z" fill={p.trim} {...S} />
          <path d="M44 24.5 Q52 23 56 25.5 Q52 27.5 44 27 Z" fill={p.trim} {...S} />
          <path d="M16 25.5 H48" {...S} />
          <circle cx="32" cy="13.4" r="1.3" fill={LINE} />
        </g>
      );
    case 4: // headphones over the head
      return (
        <g>
          <path d="M14 30 Q14 12 32 12 Q50 12 50 30" fill="none" stroke={LINE} strokeWidth="5" strokeLinecap="round" />
          <path d="M14 30 Q14 12 32 12 Q50 12 50 30" fill="none" stroke={p.trim} strokeWidth="2.6" strokeLinecap="round" />
          <rect x="9.5" y="25" width="7.5" height="11" rx="3.5" fill={p.trim} {...S} />
          <rect x="47" y="25" width="7.5" height="11" rx="3.5" fill={p.trim} {...S} />
        </g>
      );
    default:
      return null;
  }
}

/** A Reddit-style avatar for `seed` (a username). */
export function Snoovatar({ seed, className = "size-7" }: { seed: string; className?: string }) {
  const id = useId();
  const p = pick(seed);
  const antenna = p.top !== 2 && p.top !== 3; // hats hide it
  return (
    <svg viewBox="0 0 64 64" className={`${className} shrink-0`} aria-hidden="true">
      <clipPath id={id}>
        <circle cx="32" cy="32" r="32" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="64" height="64" fill={p.bg} />
        <Outfit p={p} />
        {antenna && (
          <g>
            <path d="M32 21 L35.5 10.5 L41 12" fill="none" {...S} />
            <circle cx="43" cy="11" r="3" fill={p.skin} {...S} />
          </g>
        )}
        {/* Ears, then the head over them. */}
        <circle cx="16" cy="25.5" r="4.2" fill={p.skin} {...S} />
        <circle cx="48" cy="25.5" r="4.2" fill={p.skin} {...S} />
        <ellipse cx="32" cy="34" rx="17.5" ry="13.2" fill={p.skin} {...S} />
        <Top p={p} />
        <Eyes p={p} />
        <Face p={p} />
        <Mouth p={p} />
      </g>
    </svg>
  );
}
