import { Beacon, C, Card, Mark, Mono, PanelSvg, blip, clamp01, easeInOut, easeOut, ramp } from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 04 Distribution Engine. The article published in step 03 fans out to the
// channels that drive discovery (the mirror of step 01, where sources fan in).
// Each channel in turn makes a round trip: the article travels out along its
// wire, the channel shows what distribution means there (our result lands on a
// search page, an AI answer cites us, our reply joins a Reddit thread, creators
// line up), then a signal travels back and lights that channel's segment in
// the plan. Creators are still launching, so that wire and segment stay coral.

const BEAT = 4.5;
// Within each beat: the article travels out, lands, the channel responds, the result reports back.
const OUT_AT = 0.2;
const LAND = 1.4;
const BACK_AT = 3.3;
const REPORT = 4.1;

// ── Hub: the distribution plan ──────────────────────────────────────────────
const HUB = { x: 12, y: 133, w: 152, h: 134 };
const OUT: [number, number] = [HUB.x + HUB.w, HUB.y + HUB.h / 2];

// ── Channels ────────────────────────────────────────────────────────────────
type Kind = "active" | "monitoring" | "launching";
const CHANNELS: { label: string; mark: MarkName; title: string; status: string; kind: Kind; Micro: (p: MicroProps) => React.ReactNode }[] = [
  { label: "Search", mark: "google", title: "Capture intent", status: "Active", kind: "active", Micro: SearchMicro },
  { label: "AI answers", mark: "chatgpt", title: "Improve citations", status: "Monitoring", kind: "monitoring", Micro: AnswerMicro },
  { label: "Reddit", mark: "reddit", title: "Join relevant threads", status: "Active", kind: "active", Micro: RedditMicro },
  { label: "Creators", mark: "youtube", title: "Expand reach", status: "Launching", kind: "launching", Micro: CreatorsMicro },
];
const DURATION = CHANNELS.length * BEAT;
const CH = { x: 222, w: 244, h: 76, pitch: 86, y: 33 };
const chanY = (i: number) => CH.y + i * CH.pitch;
const inlet = (i: number): [number, number] => [CH.x, chanY(i) + CH.h / 2];
const MICRO = { dx: CH.w - 16 - 62, dy: 16 };

const WASH = "color-mix(in srgb, var(--light-green-soft) 75%, var(--card))";
const EDGE = "color-mix(in srgb, var(--primary) 40%, var(--line))";
const WIRE = "color-mix(in srgb, var(--sage) 60%, transparent)";
const ink = (o: number) => `color-mix(in srgb, var(--ink) ${o}%, transparent)`;

const bez = (i: number, u: number) => {
  const [sx, sy] = OUT;
  const [ex, ey] = inlet(i);
  const m = (ex - sx) * 0.6;
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  return [a * sx + b * (sx + m) + c * (ex - m) + d * ex, a * sy + b * sy + c * ey + d * ey];
};
const curve = (i: number) => {
  const [sx, sy] = OUT;
  const [ex, ey] = inlet(i);
  const m = (ex - sx) * 0.6;
  return `M${sx} ${sy} C${sx + m} ${sy} ${ex - m} ${ey} ${ex} ${ey}`;
};

function Panel({ t }: { t: number }) {
  const tt = t % DURATION;
  const focus = Math.floor(tt / BEAT);
  const local = tt - focus * BEAT;
  const out = easeInOut(clamp01((local - OUT_AT) / (LAND - OUT_AT)));
  const ripple = clamp01((local - LAND) / 0.5);
  const back = easeInOut(clamp01((local - BACK_AT) / (REPORT - BACK_AT)));
  const report = Math.min(ramp(local, REPORT - 0.1, 0.15), 1 - ramp(local, REPORT + 0.1, 0.3));

  return (
    <PanelSvg t={t}>
      {/* Wires: quiet sage; Creators stays coral and drifting while it launches. */}
      {CHANNELS.map((ch, i) => {
        const launching = ch.kind === "launching";
        const on = i === focus;
        const [ix, iy] = inlet(i);
        return (
          <g key={ch.label}>
            {launching ? (
              <path d={curve(i)} fill="none" stroke={C.accentLine} strokeWidth={1.2} strokeDasharray="2 3" strokeDashoffset={-t * 3} />
            ) : (
              <path d={curve(i)} fill="none" stroke={on && local > OUT_AT && local < REPORT + 0.3 ? EDGE : WIRE} strokeWidth={1.2} />
            )}
            {on && ripple > 0 && ripple < 1 && (
              <circle cx={ix} cy={iy} r={3 + ripple * 9} fill="none" stroke={launching ? C.accent : C.green} opacity={(1 - ripple) * 0.5} />
            )}
          </g>
        );
      })}

      <Hub t={t} report={focus} k={report} send={blip(local, 0, 0.2, 0.2)} />
      <circle cx={OUT[0]} cy={OUT[1]} r={3} fill={C.card} stroke={WIRE} strokeWidth={1.2} />

      {CHANNELS.map((ch, i) => {
        const y = chanY(i);
        const on = i === focus;
        const launching = ch.kind === "launching";
        const lit = on ? Math.min(ramp(local, LAND - 0.1, 0.3), 1 - ramp(local, BEAT - 0.4, 0.3)) : 0;
        // The focused channel's sketch fades out, resets unseen, then replays as the article lands.
        const o = on ? Math.max(1 - ramp(local, 0.1, 0.3), ramp(local, LAND - 0.3, 0.3)) : 1;
        const k = on && local >= 0.45 ? clamp01((local - LAND) / (BACK_AT - LAND - 0.1)) : 1;
        const [ix, iy] = inlet(i);
        return (
          <g key={ch.label}>
            <Card x={CH.x} y={y} w={CH.w} h={CH.h} r={12} stroke={launching ? C.accentLine : C.line} />
            <rect x={CH.x} y={y} width={CH.w} height={CH.h} rx={12} fill="none" stroke={launching ? C.accent : EDGE} opacity={lit * (launching ? 0.6 : 1)} />
            <circle cx={ix} cy={iy} r={3} fill={C.card} stroke={launching ? C.accentLine : on ? EDGE : WIRE} strokeWidth={1.2} />

            <Mark name={ch.mark} x={CH.x + 21} y={y + 19} size={10} />
            <Mono x={CH.x + 31} y={y + 22} size={8} letterSpacing="0.18em" fill={C.muted}>
              {ch.label}
            </Mono>
            <text x={CH.x + 16} y={y + 42} fontSize={11.5} fontWeight={600} letterSpacing="-0.01em" fill={C.ink}>
              {ch.title}
            </text>
            <Status x={CH.x + 19} y={y + 56} kind={ch.kind} t={t} />
            <text x={CH.x + 28} y={y + 59.5} fontSize={9.5} fill={launching ? C.accent : C.muted}>
              {ch.status}
            </text>

            <g opacity={o}>
              <ch.Micro x={CH.x + MICRO.dx} y={y + MICRO.dy} k={k} t={t} />
            </g>
          </g>
        );
      })}

      {/* The round trip, drawn over everything: the article goes out, the result comes back. */}
      {local > OUT_AT && local < LAND && <Article at={bez(focus, out)} edge={CHANNELS[focus].kind === "launching" ? C.accentLine : EDGE} />}
      {local > BACK_AT && local < REPORT &&
        Array.from({ length: 6 }, (_, j) => {
          const [x, y] = bez(focus, clamp01(1 - back + j * 0.03));
          const f = 1 - j / 6;
          const color = CHANNELS[focus].kind === "launching" ? C.accent : C.green;
          return <circle key={j} cx={x} cy={y} r={j ? 1.8 * f : 2.4} fill={color} opacity={j ? 0.4 * f * f : 1} />;
        })}
    </PanelSvg>
  );
}

/** The article in transit: a tiny published page riding the wire. */
function Article({ at: [x, y], edge }: { at: number[]; edge: string }) {
  return (
    <g transform={`translate(${x - 6} ${y - 7.5})`}>
      <rect width={12} height={15} rx={2.5} fill={C.card} stroke={edge} />
      <rect x={3} y={4.5} width={6} height={1.6} rx={0.8} fill={C.ink} />
      <rect x={3} y={8} width={5} height={1.2} rx={0.6} fill={ink(25)} />
      <rect x={3} y={10.6} width={4} height={1.2} rx={0.6} fill={ink(25)} />
      <circle cx={10.5} cy={1.5} r={2} fill={C.green} stroke={C.card} />
    </g>
  );
}

/** The plan: the published article (from step 03) and how many channels carry it. */
function Hub({ t, report, k, send }: { t: number; report: number; k: number; send: number }) {
  const { x, y, w } = HUB;
  const seg = (w - 32 - 9) / 4;
  const launch = 0.4 + 0.12 * Math.sin(t * 0.8);
  return (
    <g>
      <Card x={x} y={y} w={w} h={HUB.h} r={14} />
      <Mono x={x + 16} y={y + 26} size={8} letterSpacing="0.18em" fill={C.muted}>
        Distribution plan
      </Mono>
      {/* The article: a page thumbnail, published, with its headline. */}
      <rect x={x + 16} y={y + 40} width={24} height={30} rx={4} fill={C.paper} stroke={C.hair} />
      <rect x={x + 16} y={y + 40} width={24} height={30} rx={4} fill="none" stroke={EDGE} opacity={send} />
      {[14, 12, 9].map((lw, i) => (
        <rect key={i} x={x + 21} y={y + 49 + i * 5} width={lw} height={2} rx={1} fill={ink(25)} />
      ))}
      <circle cx={x + 38} cy={y + 42} r={3.2} fill={C.green} stroke={C.card} strokeWidth={1.2} />
      <rect x={x + 48} y={y + 44} width={86} height={7} rx={3.5} fill={C.ink} />
      <rect x={x + 48} y={y + 56} width={54} height={7} rx={3.5} fill={C.ink} />

      <line x1={x + 16} x2={x + w - 16} y1={y + 86} y2={y + 86} stroke={C.hair} />
      <text x={x + 16} y={y + 106} fontSize={10} fill={C.muted}>
        <tspan fill={C.ink} fontWeight={600}>
          3 of 4
        </tspan>{" "}
        channels active
      </text>
      {[0, 1, 2, 3].map((i) => {
        const sx = x + 16 + i * (seg + 3);
        const last = i === 3;
        // The segment whose channel just reported back glows and lifts.
        const r = i === report ? k : 0;
        return (
          <g key={i}>
            {r > 0 && <rect x={sx - 2} y={y + 113} width={seg + 4} height={9} rx={4.5} fill={last ? C.accent : C.green} opacity={0.18 * r} />}
            <rect x={sx} y={y + 115} width={seg} height={5} rx={2.5} fill={last ? C.accentWash : WASH} />
            <rect x={sx} y={y + 115} width={seg * (last ? launch : 1)} height={5} rx={2.5} fill={last ? C.accent : C.green} opacity={last ? 0.8 : 1} />
          </g>
        );
      })}
    </g>
  );
}

/** Active: a steady green dot. Monitoring: a green ring that breathes. Launching: the coral beacon. */
function Status({ x, y, kind, t }: { x: number; y: number; kind: Kind; t: number }) {
  if (kind === "launching") return <Beacon x={x} y={y} t={t} />;
  if (kind === "monitoring") {
    const b = 0.5 + 0.5 * Math.sin(t * 2);
    return (
      <g>
        <circle cx={x} cy={y} r={4.5 + b} fill="none" stroke={C.green} strokeOpacity={0.25} />
        <circle cx={x} cy={y} r={2.6} fill="none" stroke={C.green} strokeWidth={1.3} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill={C.green} opacity={0.15} />
      <circle cx={x} cy={y} r={2.6} fill={C.green} />
    </g>
  );
}

// ── Channel sketches (62 × 44, drawn at k = 1 when settled) ─────────────────
type MicroProps = { x: number; y: number; k: number; t: number };

/** A query is typed; results load; ours lands on top. */
function SearchMicro({ x, y, k }: MicroProps) {
  return (
    <g>
      <rect x={x} y={y} width={62} height={13} rx={6.5} fill={C.paper} stroke={C.hair} />
      <circle cx={x + 7} cy={y + 6} r={2.5} fill="none" stroke={C.muted} strokeWidth={1} />
      <path d={`M${x + 8.8} ${y + 7.8} L${x + 10.6} ${y + 9.6}`} stroke={C.muted} strokeWidth={1} strokeLinecap="round" />
      <rect x={x + 14} y={y + 5} width={Math.max(0.1, 34 * ramp(k, 0, 0.35, (v) => v))} height={3} rx={1.5} fill={ink(45)} />
      {[40, 34, 28].map((w, r) => {
        const ours = r === 0;
        const ry = y + 21 + r * 8.5;
        return (
          <g key={r} opacity={ramp(k, ours ? 0.62 : 0.4 + r * 0.1, 0.2)}>
            {ours && <rect x={x - 2} y={ry - 4} width={66} height={8} rx={3} fill={WASH} opacity={ramp(k, 0.8, 0.2)} />}
            <circle cx={x + 3} cy={ry} r={1.6} fill={ours ? C.green : C.line} />
            <rect x={x + 8} y={ry - 1.5} width={w} height={3} rx={1.5} fill={ours ? C.green : ink(16)} />
          </g>
        );
      })}
    </g>
  );
}

/** An AI answer writes itself and cites us. */
function AnswerMicro({ x, y, k }: MicroProps) {
  return (
    <g>
      <rect x={x} y={y} width={62} height={44} rx={8} fill={C.paper} />
      {[44, 50, 30].map((w, i) => (
        <rect key={i} x={x + 7} y={y + 9 + i * 8} width={Math.max(0.1, w * ramp(k, i * 0.18, 0.25, (v) => v))} height={3} rx={1.5} fill={ink(22)} />
      ))}
      <g opacity={ramp(k, 0.7, 0.2)} transform={`translate(${x + 40} ${y + 23})`}>
        <rect width={15} height={9} rx={4.5} fill={WASH} stroke={EDGE} />
        <circle cx={7.5} cy={4.5} r={1.8} fill={C.green} />
      </g>
      <rect x={x + 7} y={y + 35} width={22} height={3} rx={1.5} fill={ink(10)} opacity={ramp(k, 0.55, 0.2)} />
    </g>
  );
}

/** Our reply joins the thread and the post is upvoted. */
function RedditMicro({ x, y, k }: MicroProps) {
  const vote = ramp(k, 0.8, 0.2);
  return (
    <g>
      <path d={`M${x + 4} ${y + 1} L${x + 7.5} ${y + 5.5} L${x + 0.5} ${y + 5.5} Z`} fill={vote > 0.5 ? "#FF4500" : C.line} />
      <rect x={x + 1} y={y + 8} width={6} height={2.5} rx={1.25} fill={vote > 0.5 ? "#FF4500" : ink(16)} opacity={0.7} />
      <rect x={x + 12} y={y + 2} width={46} height={3.5} rx={1.75} fill={ink(45)} />
      <rect x={x + 12} y={y + 9} width={36} height={3} rx={1.5} fill={ink(16)} />
      <line x1={x + 14} x2={x + 14} y1={y + 16} y2={y + 42} stroke={C.line} />
      <rect x={x + 19} y={y + 18} width={30} height={3} rx={1.5} fill={ink(16)} />
      <g opacity={ramp(k, 0.4, 0.25)} transform={`translate(0 ${(1 - ramp(k, 0.4, 0.3, easeOut)) * 3})`}>
        <rect x={x + 18} y={y + 26} width={44} height={16} rx={4} fill={WASH} stroke={EDGE} />
        <rect x={x + 22} y={y + 30.5} width={30} height={2.5} rx={1.25} fill={ink(40)} />
        <rect x={x + 22} y={y + 35.5} width={20} height={2.5} rx={1.25} fill={ink(20)} />
      </g>
    </g>
  );
}

/** Creators line up one by one as the article lands; reach builds. Still launching, so the last isn't confirmed yet. */
function CreatorsMicro({ x, y, k }: MicroProps) {
  const tones = ["var(--sage)", ink(18), "color-mix(in srgb, var(--accent) 35%, var(--card))"];
  const rings = [1, 1, 0.55];
  return (
    <g>
      {tones.map((fill, i) => {
        const cx = x + 10 + i * 21;
        const p = ramp(k, i * 0.3, 0.35) * rings[i];
        const face = 0.45 + 0.55 * ramp(k, i * 0.3, 0.2);
        return (
          <g key={i}>
            <circle cx={cx} cy={y + 16} r={8} fill={fill} opacity={face} />
            <circle cx={cx} cy={y + 13.8} r={2.6} fill={C.card} opacity={0.7 * face} />
            <path d={`M${cx - 4.5} ${y + 21.5} Q${cx} ${y + 16.5} ${cx + 4.5} ${y + 21.5}`} fill={C.card} opacity={0.7 * face} />
            {p > 0 && (
              <circle
                cx={cx}
                cy={y + 16}
                r={10}
                fill="none"
                stroke={C.accent}
                strokeWidth={1.2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={`${p} 1`}
                transform={`rotate(-90 ${cx} ${y + 16})`}
              />
            )}
          </g>
        );
      })}
      <rect x={x + 2} y={y + 36} width={58} height={3} rx={1.5} fill={C.accentWash} />
      <rect x={x + 2} y={y + 36} width={Math.max(0.1, 58 * (0.15 + 0.45 * easeOut(k)))} height={3} rx={1.5} fill={C.accent} opacity={0.75} />
    </g>
  );
}

// The still frame (reduced motion): Reddit just joined, every sketch settled.
const distribution: PanelModule = { duration: DURATION, settle: 2 * BEAT + 3.2, Panel };
export default distribution;
