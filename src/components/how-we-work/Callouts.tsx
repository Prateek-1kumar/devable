"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STEPS } from "./content";
import * as W from "./model";
import { boardPoint } from "./survey";

// In-scene callouts: the active include's label pinned to the prop its beat animates, so each include reads on the
// prop that shows it. One world anchor per step × include (from the layout constants the station modules build from).
type P3 = readonly number[];
const C = W.CHART;
/** A point on the 02 chart, given in world (x, z) (the chart is a map of this world), lifted off the slanted top. */
const onChart = (x: number, z: number, lift = 0.02) => W.chartToWorld(...W.chartPx(x, z), lift);
/** A point on the 02 chart in plane units from the lighthouse mark (x right, y up-slope). */
const onPlane = (x: number, y: number) => W.chartToWorld(C.cx + x * W.PX_PER_PLANE, C.cy - y * W.PX_PER_PLANE, 0.02);
const wedge = -W.chartAngle(60); // the middle of the priority fan
const course = W.polar(W.COURSE02.bearing, 3 * W.COURSE02.step);
const lane = [(W.BUOYS[0][0] + W.BUOYS[3][0]) / 2, (W.BUOYS[0][2] + W.BUOYS[3][2]) / 2];
const deck1 = W.LAMP1 - W.LAMP_ABOVE_DECK;
const flag = W.polar(W.FLAGSTAFF.bearing, W.FLAGSTAFF.r, deck1 + W.FLAGSTAFF.h - 0.4);
const pane = W.polar(W.DRUM_FRONT, 0.5, W.LAMP0);

const ANCHORS: P3[][] = [
  // 01: the exploded housing, the vessels the telescope spots, a neighbour light, the board's fix, the reach ring
  [
    [0, W.DECK0 + 0.3, 0],
    [W.VESSELS[1].pos[0], 0.9, W.VESSELS[1].pos[2]],
    [W.NEIGHBOURS[0].pos[0], W.NEIGHBOURS[0].h + 0.1, W.NEIGHBOURS[0].pos[2]],
    boardPoint(W.BOARD_MARKS.fix[0], W.BOARD_MARKS.fix[1], 0.01),
    W.polar(160, 1.8, W.GROUND + 0.02),
  ],
  // 02: the priority wedges, the roadmap course, the reading-disc lane, the cove, the islets
  [
    onPlane(Math.cos(wedge) * 0.3, Math.sin(wedge) * 0.3),
    onChart(course[0], course[2]),
    onChart(lane[0], lane[1]),
    onChart(W.ANCHORAGE.center[0], W.ANCHORAGE.center[2]),
    onChart(W.ISLETS[0].pos[0], W.ISLETS[0].pos[2]),
  ],
  // 03: the lens pane facing the camera plays every beat
  [pane, pane, pane, pane, pane],
  // 04: the buoys, the loom, the anchorage's r/ disc, the islet beacon, the flag hoist
  [
    [W.BUOYS[2][0], 1.08, W.BUOYS[2][2]],
    [W.LOOM.pos[0] + W.LOOM.starOff[0], W.LOOM.pos[1] + W.LOOM.starOff[1], W.LOOM.pos[2]],
    [W.ANCHORAGE.center[0], W.R_MARK.post + W.R_MARK.r, W.ANCHORAGE.center[2] + 0.2],
    [W.ISLETS[0].pos[0], 0.55 + W.ISLETS[0].beacon, W.ISLETS[0].pos[2]],
    flag,
  ],
  // 05: the recorder trace, the content strip, the approach lane, the chart page's leg, the new cove
  [
    W.caseToWorld(0.9, 0.5, 0.02),
    W.caseToWorld(0.9, -0.8, 0.02),
    W.LANE_KINK,
    W.caseToWorld(-0.9, -0.3, 0.02),
    [W.NEW_COVE.pos[0], 1.2, W.NEW_COVE.pos[2]],
  ],
];
const LEGS = ["L0", "L1", "L2", "L3", "L4", "L5"] as const;
/** Shown only near a step's dwell (leg u ≥ 0.85 in, ≤ 0.15 out): during fast travel the label would only streak. */
const near = (k: number, p: number) => p >= W.at(LEGS[k - 1], 0.85) && p <= W.at(LEGS[k], 0.15);

const v = new THREE.Vector3();
/** Safe zone, as fractions of the stage: the world area minus the bottom-right step card (x > 0.66 and y > 0.62). */
const SAFE = { x0: 0.06, x1: 0.94, y0: 0.13, y1: 0.88, cardX: 0.66, cardY: 0.62 };
const GAP = 28; // px from the dot to the pill's near corner (the leader runs the diagonal)
/** Pill placements in preference order: up-right, up-left, down-right, down-left ([sx, sy] of the pill's offset). */
const PLACES = [[1, -1], [-1, -1], [1, 1], [-1, 1]] as const;

type UI = { root: HTMLDivElement; line: HTMLSpanElement; pill: HTMLSpanElement; sq: HTMLSpanElement; text: HTMLSpanElement };

// ponytail: a plain DOM node, not drei <Html>: Html's second React root failed to mount under React 19 dev StrictMode
// ("synchronously unmount a root while React was already rendering"), and the text only changes on a beat change.
export default function Callouts() {
  const gl = useThree((s) => s.gl);
  const ui = useRef<UI | null>(null);
  const last = useRef("");

  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;
    const root = document.createElement("div");
    root.setAttribute("aria-hidden", "true");
    root.className = "pointer-events-none absolute left-0 top-0 z-[4] opacity-0 transition-opacity duration-200";
    root.innerHTML =
      '<span class="absolute -left-1 -top-1 size-2 rounded-full bg-white ring-2 ring-foreground/70"></span>' +
      '<span class="absolute left-0 top-0 h-px origin-left bg-foreground/40"></span>' +
      '<span class="absolute flex items-center gap-2 whitespace-nowrap rounded-full border border-foreground/10 bg-white/90 px-3.5 py-2 font-sans text-[14px] font-medium leading-none text-foreground shadow-[0_4px_16px_rgb(15_26_20/0.12)] backdrop-blur-md">' +
      '<span class="size-[7px] shrink-0"></span><span></span></span>';
    const [, line, pill] = root.children as unknown as HTMLSpanElement[];
    ui.current = { root, line, pill, sq: pill.children[0] as HTMLSpanElement, text: pill.children[1] as HTMLSpanElement };
    host.appendChild(root);
    last.current = "";
    return () => {
      root.remove();
      ui.current = null;
    };
  }, [gl]);

  useFrame(({ camera, size }) => {
    const j = W.journey, k = j.phase, p = j.forced ?? j.progress, u = ui.current;
    if (!u) return;
    const live = k >= 1 && k <= 5 && near(k, p) && (j.frozenLoop !== null || j.latchedAt[k - 1] !== null);
    const t = j.loopT[k - 1] ?? 0;
    const beat = live ? W.beatAt(t) : -1, b = beat as 0 | 1 | 2 | 3 | 4;
    // Dark for the last ~200 ms of each beat, so the label fades out and back in on the next prop instead of jumping.
    let show = beat >= 0 && W.beatP(t) < 0.83;
    if (show) {
      const key = `${k}.${beat}`;
      if (key !== last.current) {
        last.current = key;
        const step = STEPS[k - 1];
        u.text.textContent = step.includes[b];
        u.sq.style.background = step.squares[b];
      }
      v.set(...(ANCHORS[k - 1][b] as [number, number, number])).project(camera);
      const W_ = size.width, H = size.height, x = ((v.x + 1) / 2) * W_, y = ((1 - v.y) / 2) * H;
      const pw = u.pill.offsetWidth, ph = u.pill.offsetHeight;
      const inCard = (bx: number, by: number) => bx > SAFE.cardX * W_ && by > SAFE.cardY * H;
      const fits = (x0: number, y0: number) =>
        x0 >= SAFE.x0 * W_ && x0 + pw <= SAFE.x1 * W_ && y0 >= SAFE.y0 * H && y0 + ph <= SAFE.y1 * H && !inCard(x0 + pw, y0 + ph);
      const place = PLACES.find(([sx, sy]) => fits(x + (sx > 0 ? GAP : -GAP - pw), y + (sy > 0 ? GAP : -GAP - ph)));
      show = v.z < 1 && fits(x, y) && !!place; // the dot itself must sit in the safe zone too (a 0×0 box at the dot)
      if (show && place) {
        const [sx, sy] = place;
        u.root.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        u.pill.style.left = `${sx > 0 ? GAP : -GAP - pw}px`;
        u.pill.style.top = `${sy > 0 ? GAP : -GAP - ph}px`;
        u.line.style.width = `${GAP * Math.SQRT2}px`;
        u.line.style.rotate = `${Math.atan2(sy, sx)}rad`;
      }
    }
    u.root.style.opacity = show ? "1" : "0";
  });

  return null;
}
