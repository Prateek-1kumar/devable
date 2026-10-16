import { useId } from "react";

// Live line drawings for the four principles: brand green on charcoal, hairline strokes. Each is plain SVG
// with SMIL animations on one shared 6s loop (every animation spans the full loop and places its beat
// with keyTimes), so the beats stay in sync with no JS. Remounting a drawing restarts its story.
const DUR = 6;
const G = "var(--primary)";
const FAINT = "rgb(255 255 255 / 0.2)";
const LABEL = "rgb(255 255 255 / 0.4)";
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
/** Opacity 0 → 1 between `a` and `b`, held to the end of the loop. */
const In = ({ a, b }: { a: number; b: number }) => <A attr="opacity" values={[0, 0, 1, 1]} times={[0, a, b, 1]} />;
/** Strokes a `pathLength={1}` line on between `a` and `b`. */
const Draw = ({ a, b }: { a: number; b: number }) => <A attr="stroke-dashoffset" values={[1, 1, 0, 0]} times={[0, a, b, 1]} />;
const draw = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 } as const;

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 480 200"
      role="img"
      aria-label={label}
      className="h-full w-full overflow-visible"
      fill="none"
      strokeLinecap="round"
      fontFamily="var(--font-geist-mono), ui-monospace, monospace"
      fontSize={10}
      letterSpacing="0.08em"
      ref={(svg) => {
        // Reduced motion: hold the finished picture.
        if (svg && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          svg.pauseAnimations();
          svg.setCurrentTime(DUR * 0.85);
        }
      }}
    >
      {/* The whole story fades up at the start of each loop and away at its end, so it restarts cleanly. */}
      <g>
        <A attr="opacity" values={[0, 1, 1, 0]} times={[0, 0.05, 0.92, 1]} />
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
          <A attr="width" values={[0, 0, 170, 170]} times={[0, 0.08, 0.4, 1]} />
        </rect>
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {code.map(([x, y, w]) => (
          <line key={y} x1={x} y1={y} x2={x + w} y2={y} stroke={G} strokeWidth={4} />
        ))}
      </g>
      <line y1={30} y2={170} stroke={G} strokeWidth={1.5} opacity={0}>
        <A attr="x1" values={[40, 40, 210, 210]} times={[0, 0.08, 0.4, 1]} />
        <A attr="x2" values={[40, 40, 210, 210]} times={[0, 0.08, 0.4, 1]} />
        <A attr="opacity" values={[0, 0, 1, 1, 0, 0]} times={[0, 0.07, 0.1, 0.38, 0.42, 1]} />
      </line>
      <text x={40} y={188} fill={LABEL}>PRODUCT</text>

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
      <text x={404} y={188} fill={LABEL} textAnchor="middle">CHANNELS</text>
    </Frame>
  );
}

// 02 · A probe drops past the marketing surface, through the product and its API, down to the core.
export function GoDeep() {
  const layers = ["SURFACE", "PRODUCT", "API", "CORE"];
  const ys = [44, 80, 116, 152];
  const arrive = [0.2, 0.36, 0.52, 0.68];
  const plane = (cy: number) => `${70},${cy} ${200},${cy - 24} ${330},${cy} ${200},${cy + 24}`;
  return (
    <Frame label="Going past the surface, through the product and API, to the core">
      {/* Bottom plane first, so each one above overlaps it like a stack. */}
      {[3, 2, 1, 0].map((i) => (
        <g key={i}>
          <polygon points={plane(ys[i])} fill={BG} stroke={FAINT} strokeDasharray={i === 0 ? "3 5" : undefined} />
          <polygon points={plane(ys[i])} stroke={G} opacity={0}>
            <In a={arrive[i]} b={arrive[i] + 0.05} />
          </polygon>
          <line x1={338} y1={ys[i]} x2={352} y2={ys[i]} stroke={FAINT} />
          <text x={360} y={ys[i] + 3.5} fill={LABEL}>{layers[i]}</text>
          <text x={360} y={ys[i] + 3.5} fill={G} opacity={0}>
            {layers[i]}
            <In a={arrive[i]} b={arrive[i] + 0.05} />
          </text>
        </g>
      ))}
      <line x1={200} y1={4} x2={200} y2={4} stroke={G} strokeWidth={1.5}>
        <A attr="y2" values={[4, 4, 44, 44, 80, 80, 116, 116, 152, 152]} times={[0, 0.08, 0.2, 0.26, 0.36, 0.42, 0.52, 0.58, 0.68, 1]} />
      </line>
      <circle cx={200} cy={4} r={4.5} fill={G}>
        <A attr="cy" values={[4, 4, 44, 44, 80, 80, 116, 116, 152, 152]} times={[0, 0.08, 0.2, 0.26, 0.36, 0.42, 0.52, 0.58, 0.68, 1]} />
      </circle>
      <circle cx={200} cy={152} r={4} stroke={G} opacity={0}>
        <A attr="r" values={[4, 4, 22, 22]} times={[0, 0.68, 0.86, 1]} />
        <A attr="opacity" values={[0, 0, 1, 0, 0]} times={[0, 0.67, 0.69, 0.86, 1]} />
      </circle>
    </Frame>
  );
}

// 03 · Devable starts outside your team; it moves in, the boundary grows round it, and it wires into everyone.
export function OwnIt() {
  const team = [
    [122, 80],
    [158, 68],
    [140, 120],
    [180, 110],
  ];
  const at = 268; // where our dot settles
  const widen = <A attr="width" values={[128, 128, 228, 228]} times={[0, 0.3, 0.52, 1]} />;
  return (
    <Frame label="Devable joins your team instead of sitting outside it as a vendor">
      <rect x={86} y={44} width={128} height={112} rx={56} stroke={FAINT} strokeDasharray="3 5">
        {widen}
      </rect>
      <rect x={86} y={44} width={128} height={112} rx={56} stroke={G} opacity={0}>
        {widen}
        <In a={0.5} b={0.58} />
      </rect>
      <text x={86} y={30} fill={LABEL}>
        YOUR TEAM
        <A attr="opacity" values={[1, 1, 0, 0]} times={[0, 0.56, 0.62, 1]} />
      </text>
      <text x={86} y={30} fill={G} opacity={0}>
        ONE TEAM
        <In a={0.6} b={0.66} />
      </text>
      {team.map(([x, y], i) => (
        <path key={i} d={`M${at} 100 L${x} ${y}`} stroke={G} strokeOpacity={0.55} {...draw}>
          <Draw a={0.56 + i * 0.03} b={0.7 + i * 0.03} />
        </path>
      ))}
      {team.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} stroke="rgb(255 255 255 / 0.5)" fill={BG} />
      ))}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          dur={`${DUR}s`}
          repeatCount="indefinite"
          values={`0 0;0 0;${at - 430} 0;${at - 430} 0`}
          keyTimes="0;0.1;0.42;1"
          calcMode="spline"
          keySplines="0.45 0 0.2 1;0.45 0 0.2 1;0.45 0 0.2 1"
        />
        <circle cx={430} cy={100} r={7} fill={G} />
        <text x={430} y={128} fill={LABEL} textAnchor="middle">DEVABLE</text>
      </g>
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
      <polyline points={reach.map((y, i) => `${40 + i * 20},${y}`).join(" ")} stroke={FAINT} strokeDasharray="2 4" strokeLinejoin="round">
        <In a={0.04} b={0.2} />
      </polyline>
      <text x={452} y={130} fill={LABEL}>REACH</text>

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
        <animate
          attributeName="stroke-dashoffset"
          dur={`${DUR}s`}
          repeatCount="indefinite"
          values="1;1;0;0"
          keyTimes={`0;${from};${to};1`}
        />
      </path>
      <circle r={5} fill={G}>
        <animateMotion
          dur={`${DUR}s`}
          repeatCount="indefinite"
          path={growth}
          keyPoints="0;0;1;1"
          keyTimes={`0;${from};${to};1`}
          calcMode="linear"
        />
      </circle>
      <text x={452} y={46} fill={G} opacity={0}>
        GROWTH
        <In a={to} b={to + 0.05} />
      </text>
    </Frame>
  );
}
