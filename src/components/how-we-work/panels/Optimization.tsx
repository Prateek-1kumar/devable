import { C, Card, Check, Mark, Mono, PanelSvg, easeInOut, easeOut, lerp, outro, polyline, ramp, usePanelId } from "../kit";
import type { MarkName } from "../marks";
import type { PanelModule } from "../PanelPlayer";

// 05 Optimization Loop. One chart card: twelve weeks of organic sessions draw
// left → right, with a spike at launch week and a line that keeps climbing.
// As the line reaches a week that taught us something, a signal pops up over
// it, turns into a next action, and settles to green. Earlier signals stay as
// small green dots on the line; the status ends on "3 next actions".

const DURATION = 9.8;
const SETTLE = 8.1;

type Pt = readonly [number, number];
const rise = (k: number) => `translate(0 ${(1 - k) * 5})`;

// ── Layout ────────────────────────────────────────────────────────────────────
const CARD = { x: 52, y: 44, w: 376, h: 304 };
const PLOT = { x: 78, y: 160, w: 324, h: 140 }; // value 0 → y 300, value 100 → y 160
const VALS = [8, 10, 44, 27, 29, 34, 40, 48, 57, 66, 76, 88];
const wx = (i: number) => PLOT.x + (i * PLOT.w) / (VALS.length - 1);
const vy = (v: number) => PLOT.y + PLOT.h - (v / 100) * PLOT.h;
const PTS: Pt[] = VALS.map((v, i) => [wx(i), vy(v)]);
const BASE = PLOT.y + PLOT.h;
const LAUNCH = 2;

// ── Timeline ──────────────────────────────────────────────────────────────────
// The line draws in legs and pauses at each signal week while the signal plays.
const LEGS = [
  { at: 0.4, dur: 2.2, from: 0, to: 5 },
  { at: 3.4, dur: 1.2, from: 5, to: 8 },
  { at: 5.4, dur: 1.0, from: 8, to: 10 },
  { at: 7.0, dur: 0.8, from: 10, to: 11 },
];
function progress(t: number) {
  let p = 0;
  for (const l of LEGS) if (t >= l.at) p = lerp(l.from, l.to, ramp(t, l.at, l.dur, easeInOut));
  return p;
}

type Signal = { week: number; at: number; mark: MarkName; text: string; action: string; x: number | "right"; out: number };
const PILL_R = CARD.x + CARD.w - 14;
/** Status text is mono 9.5 with 0.08em tracking: about 6.5 units a character. */
const monoW = (s: string) => s.length * 6.5;
const PILL_Y = 94;
const SIGNALS: Signal[] = [
  { week: 5, at: 2.6, mark: "googlesearchconsole", text: "Page climbing: #9 → #3", action: "Double down", x: 128, out: 4.05 },
  { week: 8, at: 4.6, mark: "chatgpt", text: "New AI prompt gap found", action: "Write answer page", x: "right", out: 6.05 },
  { week: 10, at: 6.4, mark: "youtube", text: "Creator B performed 3× better", action: "Rebook", x: "right", out: Infinity },
];
const STATUS = [
  { text: "Tracking rankings…", from: 0.35, to: 3.7 },
  { text: "Reading AI answers…", from: 3.7, to: 5.7 },
  { text: "Comparing creators…", from: 5.7, to: 7.75 },
];
const DONE_AT = 7.75;

/** The polyline up to fractional week `p`. */
function upTo(p: number): Pt[] {
  const n = Math.floor(p);
  const pts = PTS.slice(0, n + 1);
  if (p > n && n + 1 < PTS.length) pts.push([lerp(PTS[n][0], PTS[n + 1][0], p - n), lerp(PTS[n][1], PTS[n + 1][1], p - n)]);
  return pts;
}

function Panel({ t }: { t: number }) {
  const o = outro(t, DURATION);
  const grad = usePanelId("opt-area");
  const p = progress(t);
  const pts = upTo(p);
  const tip = pts[pts.length - 1];
  const drawing = LEGS.some((l) => t > l.at && t < l.at + l.dur);
  const launch = ramp(t, 1.25, 0.45, easeOut);
  const done = ramp(t, DONE_AT, 0.4, easeOut);

  return (
    <PanelSvg t={t}>
      <defs>
        <linearGradient id={grad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity={0.16} />
          <stop offset="1" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>

      <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} />

      {/* Header: the source, and a status line that says what's being read. */}
      <Mark name="googleanalytics" x={CARD.x + 25} y={CARD.y + 26} size={14} />
      <text x={CARD.x + 40} y={CARD.y + 30.5} fontSize={12.5} fontWeight={550} fill={C.ink}>
        Organic sessions
      </text>
      {STATUS.map((s) => {
        const k = Math.min(ramp(t, s.from, 0.25), 1 - ramp(t, s.to - 0.25, 0.25)) * o;
        if (k <= 0) return null;
        return (
          <g key={s.text} opacity={k}>
            <circle cx={CARD.x + CARD.w - 18 - monoW(s.text) - 8} cy={CARD.y + 26.5} r={3} fill={C.accent} />
            <Mono x={CARD.x + CARD.w - 18} y={CARD.y + 30} size={9.5} textAnchor="end">
              {s.text}
            </Mono>
          </g>
        );
      })}
      <g opacity={done * o} transform={rise(done)}>
        <Check x={CARD.x + CARD.w - 18 - monoW("3 next actions") - 9} y={CARD.y + 26.5} r={5.5} k={done} />
        <Mono x={CARD.x + CARD.w - 18} y={CARD.y + 30} size={9.5} fill={C.primary} textAnchor="end">
          3 next actions
        </Mono>
      </g>

      {/* Minimal axes: two faint guides, a baseline, first and last week. */}
      {[40, 80].map((v) => (
        <line key={v} x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={vy(v)} y2={vy(v)} stroke={C.hair} strokeDasharray="2 4" />
      ))}
      <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={BASE} y2={BASE} stroke={C.line} />
      <Mono x={PLOT.x} y={BASE + 22} size={9.5} textAnchor="middle">
        W1
      </Mono>
      <Mono x={PLOT.x + PLOT.w} y={BASE + 22} size={9.5} textAnchor="middle">
        W12
      </Mono>

      {/* Launch week marker at the spike. */}
      <g opacity={launch * o}>
        <line x1={PTS[LAUNCH][0]} x2={PTS[LAUNCH][0]} y1={PTS[LAUNCH][1] + 6} y2={BASE} stroke={C.line} strokeDasharray="2 3" />
        <Mono x={PTS[LAUNCH][0]} y={PTS[LAUNCH][1] - 13} size={9} textAnchor="middle" transform={rise(launch)}>
          Launch week
        </Mono>
        <Mono x={PTS[LAUNCH][0]} y={BASE + 22} size={9.5} textAnchor="middle">
          W3
        </Mono>
      </g>

      {/* The key line, its soft area, and the pen at its tip. */}
      {p > 0 && (
        <g opacity={o}>
          <path d={`${polyline(pts)} L${tip[0]} ${BASE} L${PLOT.x} ${BASE} Z`} fill={`url(#${grad})`} />
          <path d={polyline(pts)} fill="none" stroke={C.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {/* Signals: leader + point under the pill. */}
      {SIGNALS.map((s) => (
        <SignalView key={s.text} s={s} t={t} o={o} />
      ))}

      {t > 0.1 && (
        <g opacity={ramp(t, 0.1, 0.3) * o} transform={`translate(${tip[0]} ${tip[1]})`}>
          <circle r={7} fill={C.accent} opacity={drawing ? 0.16 : 0.1} />
          <circle r={3.5} fill={C.accent} stroke={C.card} strokeWidth={1.2} />
        </g>
      )}
    </PanelSvg>
  );
}

function SignalView({ s, t, o }: { s: Signal; t: number; o: number }) {
  const [px, py] = PTS[s.week];
  const reached = ramp(t, s.at - 0.05, 0.3, easeOut);
  if (reached <= 0) return null;
  const pill = ramp(t, s.at, 0.4, easeOut);
  const chip = ramp(t, s.at + 0.45, 0.35, easeOut);
  const green = ramp(t, s.at + 0.95, 0.35);
  const gone = ramp(t, s.out, 0.3);
  const show = pill * (1 - gone) * o;
  const h = lerp(32, 60, chip);
  const bottom = PILL_Y + h;
  const chipW = s.action.length * 6.3 + 34;
  const w = 33 + s.text.length * 6.2 + 14;
  const x = s.x === "right" ? PILL_R - w : s.x;
  const ring = ramp(t, s.at, 0.8, easeOut);

  return (
    <g>
      {/* Leader from the pill down to the week. */}
      {show > 0 && (
        <line x1={px} x2={px} y1={bottom} y2={py - 7} stroke={green < 1 ? C.accentLine : C.line} strokeDasharray="2 3" opacity={show} />
      )}
      {/* The point: a soft ring as the line arrives, then a dot that settles to green. */}
      <g opacity={o}>
        {ring < 1 && <circle cx={px} cy={py} r={4 + 9 * ring} fill="none" stroke={C.accentLine} opacity={1 - ring} />}
        <circle cx={px} cy={py} r={4} fill={C.accent} stroke={C.card} strokeWidth={1.2} opacity={reached * (1 - green)} />
        <circle cx={px} cy={py} r={4} fill={C.primary} stroke={C.card} strokeWidth={1.2} opacity={green} />
      </g>
      {show > 0 && (
        <g opacity={show} transform={rise(pill)}>
          <Card x={x} y={PILL_Y} w={w} h={h} r={10} />
          <rect x={x + 0.5} y={PILL_Y + 0.5} width={w - 1} height={h - 1} rx={9.5} fill="none" stroke={C.accentLine} opacity={1 - green} />
          <Mark name={s.mark} x={x + 19} y={PILL_Y + 16} size={13} />
          <text x={x + 33} y={PILL_Y + 20.2} fontSize={12} fontWeight={500} fill={C.ink}>
            {s.text}
          </text>
          {/* Next action chip: coral while proposed, deep green once queued. */}
          <g opacity={chip} transform={`translate(${x + 10} ${PILL_Y + 31 + (1 - chip) * 4})`}>
            <rect width={chipW} height={21} rx={10.5} fill={C.accentWash} stroke={C.accentLine} opacity={1 - green} />
            <rect width={chipW} height={21} rx={10.5} fill={C.primarySoft} opacity={green} />
            <text x={10} y={14.6} fontSize={11.5} fontWeight={550} fill={C.accent} opacity={1 - green}>
              {`→ ${s.action}`}
            </text>
            <g opacity={green}>
              <Check x={14} y={10.5} r={5.5} k={green} />
              <text x={24} y={14.6} fontSize={11.5} fontWeight={550} fill={C.primary}>
                {s.action}
              </text>
            </g>
          </g>
        </g>
      )}
    </g>
  );
}

const optimization: PanelModule = { duration: DURATION, settle: SETTLE, Panel };
export default optimization;
