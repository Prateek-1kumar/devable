import type { ReactNode } from "react";
import { PATHS } from "../services/kit";

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

// 01 · A probe drops past the dashed surface plane, lighting each layer below, and settles at the core.
// Deeper layers glow a little more, so depth reads without labels.
export function Understand() {
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

// The platforms Connect branches out to (24-unit icons): search and AI answer engines up top, creator
// platforms below. Reddit, Google and Perplexity from simple-icons, OpenAI from lobehub/icons.
const PLATFORMS: { name: string; icon: ReactNode }[] = [
  { name: "Google", icon: <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /> },
  { name: "Reddit", icon: <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z" /> },
  { name: "ChatGPT", icon: <path fillRule="evenodd" d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z" /> },
  { name: "Perplexity", icon: <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" /> },
  { name: "X", icon: PATHS.x },
  { name: "LinkedIn", icon: PATHS.linkedin },
];

// 02 · The product lights up at the source, then branches reach out one by one and each platform at the
// end of a branch lights up: the product, connected to where its audience is.
export function Connect() {
  // Two groups with a gap between them: search and answer engines, then creator platforms.
  const ys = [22, 54, 86, 118, 158, 190];
  const x = 420;
  return (
    <Frame label="The product branching out to Google, Reddit, ChatGPT, Perplexity, X and LinkedIn">
      <rect x={40} y={52} width={150} height={100} rx={10} stroke={FAINT} />
      <rect x={40} y={52} width={150} height={100} rx={10} stroke={G} fill={G} fillOpacity={0.06} opacity={0}>
        <In a={0.04} b={0.14} />
      </rect>
      <line x1={40} y1={72} x2={190} y2={72} stroke={FAINT} />
      {[52, 61, 70].map((cx) => (
        <circle key={cx} cx={cx} cy={62} r={2} fill={FAINT} />
      ))}

      {PLATFORMS.map(({ name, icon }, i) => {
        const at = 0.18 + i * 0.07;
        return (
          <g key={name}>
            <path d={`M190 102 C 290 102, 300 ${ys[i]}, ${x - 18} ${ys[i]}`} stroke={G} strokeOpacity={0.7} {...draw}>
              <Draw a={at} b={at + 0.16} />
            </path>
            <circle cx={x} cy={ys[i]} r={15} stroke={FAINT} fill={BG} />
            <circle cx={x} cy={ys[i]} r={15} stroke={G} opacity={0}>
              <In a={at + 0.14} b={at + 0.2} />
            </circle>
            <g transform={`translate(${x - 8} ${ys[i] - 8}) scale(${16 / 24})`} fill="rgb(255 255 255 / 0.35)">
              {icon}
            </g>
            <g transform={`translate(${x - 8} ${ys[i] - 8}) scale(${16 / 24})`} fill="#fff" opacity={0}>
              <In a={at + 0.14} b={at + 0.2} />
              {icon}
            </g>
          </g>
        );
      })}
    </Frame>
  );
}

// 03 · Your team is a ring of people with one open seat. Devable glides in from outside and takes it,
// wires into every member, and the ring closes round all of you: one team, not a vendor at arm's length.
export function OwnIt() {
  const cx = 240;
  const cy = 100;
  const R = 70;
  // Six seats round the ring; seat 0 (3 o'clock) is the open one we take. Rounded so the server and the
  // browser print the same attribute strings (their trig can differ in the last digit).
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const seats = Array.from({ length: 6 }, (_, k) => [r2(cx + R * Math.cos((k * Math.PI) / 3)), r2(cy + R * Math.sin((k * Math.PI) / 3))]);
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
            <path d={`M${x} ${reach[i]} L${x} ${growthY(x).toFixed(1)}`} stroke={G} strokeDasharray="2 3" opacity={0}>
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
