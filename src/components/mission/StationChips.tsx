import { useId } from "react";
import { CHANNELS } from "../growth-engine/channels";
import { MARK_STYLE, MARKS, type Mark } from "../growth-engine/marks";
import type { Bind } from "./MissionHud";
import { STATIONS } from "./timeline";

// The platforms, named where the craft reaches them: a dark-glass chip on a 1 px leader rising from each
// station's pin, with the brand mark in its own colours, the name, and the channel that works it. The
// scene's chip writer places them (st0..st4), sets --rise for stacking and --dx to keep them in the panel.
// Each chip flies right of its leader like a flag, so a stacked chip's leader never crosses its neighbours.

const MONO = "font-mono uppercase tracking-[0.12em] tabular-nums";
const CHIP_NAMES = ["HACKER NEWS", "GOOGLE", "CHATGPT", "REDDIT", "YOUTUBE"];

// Google's G in its four colours: wedges about the centre (degrees, y down), blue also takes the crossbar.
const WEDGES: [string, number, number][] = [
  ["#ea4335", 200, 325],
  ["#fbbc05", 145, 200],
  ["#34a853", 40, 145],
  ["#4285f4", -35, 40],
];
const at = (deg: number) => `${(12 + 14 * Math.cos((deg * Math.PI) / 180)).toFixed(2)} ${(12 + 14 * Math.sin((deg * Math.PI) / 180)).toFixed(2)}`;
const wedge = (a: number, b: number) => `M12 12L${at(a)}A14 14 0 0 1 ${at(b)}Z`;

/** A platform mark in its brand colours, for a dark chip (ChatGPT's black mark turns white). */
export function BrandMark({ mark, size }: { mark: Mark; size: number }) {
  const clip = useId();
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className="shrink-0">
      {mark === "google" ? (
        <>
          <clipPath id={clip}>
            <path d={MARKS.google} />
          </clipPath>
          <g clipPath={`url(#${clip})`}>
            {WEDGES.map(([c, a, b]) => (
              <path key={c} d={wedge(a, b)} fill={c} />
            ))}
            <rect x="12" y="9.5" width="12" height="5" fill="#4285f4" />
          </g>
        </>
      ) : (
        <>
          {mark === "hackernews" && <rect x="1" y="1" width="22" height="22" fill="#fff" />}
          <path d={MARKS[mark]} fill={mark === "chatgpt" ? "#f3f5f7" : MARK_STYLE[mark].color} />
        </>
      )}
    </svg>
  );
}

export default function StationChips({ bind }: { bind: Bind }) {
  return STATIONS.map((s, k) => (
    <div
      key={s.mark}
      ref={bind(`st${k}`)}
      data-lit="false"
      className="group invisible absolute top-0 left-0 opacity-0 transition-opacity duration-300 will-change-transform [--dx:0px] [--rise:28px]"
    >
      <span className="absolute bottom-[5px] left-[-0.5px] h-[calc(var(--rise)-5px)] w-px bg-white/25" />
      <div
        className="absolute bottom-(--rise) left-[calc(var(--dx)-0.5px)] flex items-center gap-1.5 rounded-[6px] rounded-bl-none border border-white/12 bg-[rgba(8,12,20,0.6)] px-2 py-[5px] whitespace-nowrap backdrop-blur-[6px]"
      >
        {/* Until its first contact lights it, a station's chip shows dimmed content on the same glass. */}
        <span className="flex items-center gap-1.5 opacity-45 transition-opacity duration-500 group-data-[lit=true]:opacity-100">
          <BrandMark mark={s.mark} size={14} />
          <span className={`${MONO} text-[10px] leading-3 text-white/80`}>{CHIP_NAMES[k]}</span>
          <span className="ml-0.5 size-1 rounded-full" style={{ background: CHANNELS[s.channel].color }} />
          <span className={`${MONO} text-[10px] leading-3 text-white/50`}>{CHANNELS[s.channel].n}</span>
        </span>
      </div>
    </div>
  ));
}
