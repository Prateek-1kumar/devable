import { useId, type ReactNode } from "react";

// Line drawings for the four principles: brand green on charcoal, hairline strokes, no words. Each is plain
// SVG with SMIL animations on one shared DUR-second timeline (every animation spans it and places its beat
// with keyTimes) and loop on their own. Remounting a drawing restarts its story.
const DUR = 6;
const G = "var(--primary)";
const FAINT = "rgb(255 255 255 / 0.2)";
const BG = "#1a1918";

function A({ attr, values, times }: { attr: string; values: (string | number)[]; times: number[] }) {
  return (
    <animate
      attributeName={attr}
      dur={`${DUR}s`}
      repeatCount="indefinite"
      values={values.join(";")}
      keyTimes={times.join(";")}
      calcMode="spline"
      keySplines={Array(times.length - 1).fill("0.45 0 0.2 1").join(";")}
    />
  );
}
/** Opacity 0 → 1 between `a` and `b`. */
const In = ({ a, b }: { a: number; b: number }) => <A attr="opacity" values={[0, 0, 1, 1]} times={[0, a, b, 1]} />;
/** Strokes a `pathLength={1}` line on between `a` and `b`. */
const Draw = ({ a, b }: { a: number; b: number }) => <A attr="stroke-dashoffset" values={[1, 1, 0, 0]} times={[0, a, b, 1]} />;
const draw = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 } as const;

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 480 200"
      role="img"
      aria-label={label}
      className="h-full w-full overflow-visible"
      fill="none"
      strokeLinecap="round"
      ref={(svg) => {
        // Reduced motion: hold the finished picture.
        if (svg && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          svg.pauseAnimations();
          svg.setCurrentTime(DUR * 0.88);
        }
      }}
    >
      {/* Every beat is done by 0.88 of the loop; the picture then fades away so the next pass starts clean. */}
      <g>
        <A attr="opacity" values={[0, 1, 1, 0]} times={[0, 0.04, 0.9, 1]} />
        {children}
      </g>
    </svg>
  );
}

// 01 · A scan passes over the product and lights up how it works; only then do lines reach out to channels.
export function Understand() {
  const clip = useId();
  const code = [
    [56, 76, 92],
    [56, 92, 124],
    [70, 108, 84],
    [70, 124, 112],
    [56, 140, 70],
  ];
  const channels = [
    [404, 48],
    [424, 100],
    [404, 152],
  ];
  return (
    <Frame label="A scan reads the product first, then connects it to channels">
      <rect x={40} y={36} width={170} height={128} rx={10} stroke={FAINT} />
      <rect x={40} y={36} width={170} height={128} rx={10} stroke={G} opacity={0}>
        <In a={0.36} b={0.44} />
      </rect>
      <line x1={40} y1={58} x2={210} y2={58} stroke={FAINT} />
      {[52, 61, 70].map((x) => (
        <circle key={x} cx={x} cy={47} r={2} fill={FAINT} />
      ))}
      {code.map(([x, y, w]) => (
        <line key={y} x1={x} y1={y} x2={x + w} y2={y} stroke={FAINT} strokeWidth={4} />
      ))}
      <clipPath id={clip}>
        <rect x={40} y={36} width={0} height={128}>
          <A attr="width" values={[0, 0, 170, 170]} times={[0, 0.06, 0.4, 1]} />
        </rect>
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {code.map(([x, y, w]) => (
          <line key={y} x1={x} y1={y} x2={x + w} y2={y} stroke={G} strokeWidth={4} />
        ))}
      </g>
      <line y1={30} y2={170} stroke={G} strokeWidth={1.5} opacity={0}>
        <A attr="x1" values={[40, 40, 210, 210]} times={[0, 0.06, 0.4, 1]} />
        <A attr="x2" values={[40, 40, 210, 210]} times={[0, 0.06, 0.4, 1]} />
        <A attr="opacity" values={[0, 0, 1, 1, 0, 0]} times={[0, 0.05, 0.08, 0.38, 0.42, 1]} />
      </line>

      {channels.map(([x, y], i) => (
        <g key={y}>
          <path d={`M210 100 C 300 100, 310 ${y}, ${x - 10} ${y}`} stroke={G} strokeOpacity={0.7} {...draw}>
            <Draw a={0.44 + i * 0.05} b={0.62 + i * 0.05} />
          </path>
          <circle cx={x} cy={y} r={8} stroke={FAINT} />
          <circle cx={x} cy={y} r={8} fill={G} opacity={0}>
            <In a={0.6 + i * 0.05} b={0.68 + i * 0.05} />
          </circle>
        </g>
      ))}
    </Frame>
  );
}

// 02 · A probe drops past the dashed surface plane, lighting each layer below, and settles at the core.
// Deeper layers glow a little more, so depth reads without labels.
export function GoDeep() {
  const ys = [44, 80, 116, 152];
  const arrive = [0.2, 0.36, 0.52, 0.68];
  const drop = { values: [4, 4, 44, 44, 80, 80, 116, 116, 152, 152], times: [0, 0.08, 0.2, 0.26, 0.36, 0.42, 0.52, 0.58, 0.68, 1] };
  const plane = (cy: number) => `110,${cy} 240,${cy - 24} 370,${cy} 240,${cy + 24}`;
  return (
    <Frame label="Going past the surface, layer by layer, down to the core">
      {/* Bottom plane first, so each one above overlaps it like a stack. */}
      {[3, 2, 1, 0].map((i) => (
        <g key={i}>
          <polygon points={plane(ys[i])} fill={BG} stroke={FAINT} strokeDasharray={i === 0 ? "3 5" : undefined} />
          <polygon points={plane(ys[i])} stroke={G} fill={G} fillOpacity={0.05 * i} opacity={0}>
            <In a={arrive[i]} b={arrive[i] + 0.05} />
          </polygon>
        </g>
      ))}
      <line x1={240} y1={4} x2={240} y2={4} stroke={G} strokeWidth={1.5}>
        <A attr="y2" {...drop} />
      </line>
      <circle cx={240} cy={4} r={4.5} fill={G}>
        <A attr="cy" {...drop} />
      </circle>
      <circle cx={240} cy={152} r={4} stroke={G} opacity={0}>
        <A attr="r" values={[4, 4, 22, 22]} times={[0, 0.68, 0.86, 1]} />
        <A attr="opacity" values={[0, 0, 1, 0, 0]} times={[0, 0.67, 0.69, 0.86, 1]} />
      </circle>
    </Frame>
  );
}

// 03 · Your team is a ring of people with one open seat. Devable glides in from outside and takes it,
// wires into every member, and the ring closes round all of you: one team, not a vendor at arm's length.
export function OwnIt() {
  const cx = 240;
  const cy = 100;
  const R = 70;
  // Six seats round the ring; seat 0 (3 o'clock) is the open one we take.
  const seats = Array.from({ length: 6 }, (_, k) => [cx + R * Math.cos((k * Math.PI) / 3), cy + R * Math.sin((k * Math.PI) / 3)]);
  const team = seats.slice(1);
  const [sx, sy] = seats[0];
  return (
    <Frame label="Devable takes the open seat in your team and connects to everyone">
      <circle cx={cx} cy={cy} r={R} stroke={FAINT} />
      {/* The ring closing in green, starting from our seat. */}
      <circle cx={cx} cy={cy} r={R} stroke={G} {...draw}>
        <Draw a={0.56} b={0.74} />
      </circle>
      {/* The team already talks to itself… */}
      {team.flatMap(([x1, y1], i) =>
        team.slice(i + 1).map(([x2, y2], j) => <line key={`${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(255 255 255 / 0.07)" />),
      )}
      {/* …and once seated, we wire into all of it. */}
      {team.map(([x, y], i) => (
        <path key={i} d={`M${sx} ${sy} L${x} ${y}`} stroke={G} strokeOpacity={0.5} {...draw}>
          <Draw a={0.42 + i * 0.03} b={0.56 + i * 0.03} />
        </path>
      ))}
      <circle cx={sx} cy={sy} r={9} stroke={FAINT} strokeDasharray="2 3" fill={BG} />
      {team.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={7} stroke="rgb(255 255 255 / 0.55)" fill={BG} />
          <circle cx={x} cy={y} r={7} stroke={G} opacity={0}>
            <In a={0.6 + i * 0.03} b={0.66 + i * 0.03} />
          </circle>
        </g>
      ))}
      <circle cx={sx + 130} cy={sy} r={9} fill={G}>
        <A attr="cx" values={[sx + 130, sx + 130, sx, sx]} times={[0, 0.06, 0.4, 1]} />
      </circle>
      {/* Together: one pulse round the whole team. */}
      <circle cx={cx} cy={cy} r={R} stroke={G} opacity={0}>
        <A attr="r" values={[R, R, R + 24, R + 24]} times={[0, 0.74, 0.88, 1]} />
        <A attr="opacity" values={[0, 0, 0.8, 0, 0]} times={[0, 0.73, 0.75, 0.88, 1]} />
      </circle>
    </Frame>
  );
}

// 04 · Reach spikes everywhere (dotted, grey); growth is the line that matters. Only the spikes that feed
// growth get connected to it as the line draws past them.
export function Measure() {
  const reach = [140, 112, 150, 74, 134, 120, 62, 146, 124, 92, 150, 116, 56, 140, 130, 100, 146, 120, 80, 134, 126];
  const growthY = (x: number) => 162 - 124 * ((x - 40) / 400) ** 1.7;
  const growth = Array.from({ length: 41 }, (_, k) => 40 + k * 10)
    .map((x, k) => `${k ? "L" : "M"}${x} ${growthY(x).toFixed(1)}`)
    .join(" ");
  const from = 0.24;
  const to = 0.8;
  return (
    <Frame label="Many reach spikes, but only the ones that feed growth count">
      <line x1={30} y1={176} x2={450} y2={176} stroke={FAINT} />
      <polyline points={reach.map((y, i) => `${40 + i * 20},${y}`).join(" ")} stroke={FAINT} strokeDasharray="2 4" strokeLinejoin="round" opacity={0}>
        <In a={0.02} b={0.2} />
      </polyline>

      {[6, 12, 18].map((i) => {
        const x = 40 + i * 20;
        const t = from + ((x - 40) / 400) * (to - from);
        return (
          <g key={i}>
            <path d={`M${x} ${reach[i]} L${x} ${growthY(x)}`} stroke={G} strokeDasharray="2 3" opacity={0}>
              <In a={t} b={t + 0.04} />
            </path>
            <circle cx={x} cy={reach[i]} r={3.5} fill={G} opacity={0}>
              <In a={t} b={t + 0.04} />
            </circle>
          </g>
        );
      })}

      <path d={growth} stroke={G} strokeWidth={2} {...draw}>
        {/* Linear, like the dot's motion, so the dot stays on the line's tip. */}
        <animate attributeName="stroke-dashoffset" dur={`${DUR}s`} repeatCount="indefinite" values="1;1;0;0" keyTimes={`0;${from};${to};1`} />
      </path>
      <circle r={5} fill={G}>
        <animateMotion dur={`${DUR}s`} repeatCount="indefinite" path={growth} keyPoints="0;0;1;1" keyTimes={`0;${from};${to};1`} calcMode="linear" />
      </circle>
    </Frame>
  );
}
