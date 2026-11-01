import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { span, storyOf } from "../content";
import {
  Print,
  Shadow,
  Solid,
  block,
  colors,
  drawMark,
  easeInOut,
  easeOut,
  panel,
  paragraph,
  rrect,
  setFont,
  upvote,
  useBand,
  useLive,
  useStatic,
  wrap,
} from "../kit";
import { AT } from "../layout";

// Beat 3, Reddit. ① A developer asks on the thread board. ② Replies arrive and mount on it, one recommending
// your product. ③ That reply is voted up: its count climbs, orange upvotes rise, and it slides out and up
// past the others to the top.

type Ctx = CanvasRenderingContext2D;

const BOARD = { w: 3.3, h: 2.8, t: 0.16, lift: 0.25, z: -0.4 };
const HEAD_H = 0.98;
const REPLIES = [
  {
    user: "u/ml_ops_jane",
    body: ["Tables were always the pain for us."],
    votes: 31,
  },
  {
    user: "u/data_eng",
    body: ["Switched to ", "Your Product", ". Best by far."],
    votes: 142,
  },
  { user: "u/kpatel", body: ["+1, we need self-hosted too."], votes: 9 },
];
const REPLY = { w: 2.9, h: 0.52, t: 0.08 };
/** Reply slot j's resting base height on the board. */
const slotY = (j: number) => BOARD.lift + 1.5 - j * 0.62;
const arrive = (s: number, j: number) =>
  easeOut(span(s, 0.18 + 0.12 * j, 0.36 + 0.12 * j));
const voted = (s: number) => easeInOut(span(s, 0.62, 0.86));

function drawThread(ctx: Ctx, w: number, h: number) {
  const c = colors();
  rrect(ctx, 0, 0, w, h, w * 0.04, "#ffffff");
  const k = (w / (BOARD.w - 0.2)) * (HEAD_H / 350);
  ctx.save();
  ctx.scale(k, k);
  drawMark(ctx, "reddit", 50, 52, 50);
  setFont(ctx, 25, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("r/MachineLearning", 92, 46);
  setFont(ctx, 20, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText("Posted by u/pdf_wrangler · 3d", 92, 74);
  setFont(ctx, 44, 600);
  ctx.letterSpacing = "-0.8px";
  ctx.fillStyle = c.ink;
  wrap(ctx, "Best tools for processing PDFs at scale?", w / k - 60).forEach(
    (line, i) => ctx.fillText(line, 28, 150 + i * 52),
  );
  ctx.letterSpacing = "0px";
  setFont(ctx, 19, 500, true);
  ctx.fillStyle = c.muted;
  ctx.fillText("▲ 86   ·   37 COMMENTS", 28, 270);
  ctx.fillStyle = c.line;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(28, 300, w / k - 56, 2);
  ctx.restore();
}

function drawReply(
  ctx: Ctx,
  w: number,
  h: number,
  r: (typeof REPLIES)[number],
  votes: number,
  you: boolean,
) {
  const c = colors();
  const k = h / 168;
  ctx.save();
  ctx.scale(k, k);
  const W = w / k;
  rrect(ctx, 0, 0, W, 168, 24, you ? "#f3fdf7" : "#ffffff");
  if (you) rrect(ctx, 0, 14, 9, 140, 4.5, c.primary);
  ctx.beginPath();
  ctx.arc(48, 46, 17, 0, Math.PI * 2);
  ctx.fillStyle = you ? c.ink : c.shade;
  ctx.fill();
  setFont(ctx, 22, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText(r.user, 76, 54);
  // Votes, in a pill on the right.
  setFont(ctx, 22, 600, true);
  const label = `▲ ${votes}`;
  const vw = ctx.measureText(label).width + 30;
  rrect(ctx, W - vw - 22, 26, vw, 38, 19, you ? "#fbe6de" : c.shade);
  ctx.fillStyle = you ? c.secondary : c.muted;
  ctx.fillText(label, W - vw - 7, 53);
  paragraph(ctx, r.body, 30, 126, W - 60, 36);
  ctx.restore();
}

function Reply({ index, ref }: { index: number; ref: React.Ref<Group> }) {
  const r = REPLIES[index];
  const you = index === 1;
  const render = useCallback(
    (ctx: Ctx, w: number, h: number, v: number) =>
      drawReply(ctx, w, h, r, you ? v : r.votes, you),
    [r, you],
  );
  const [tex, setVotes] = useLive(REPLY.w - 0.06, REPLY.h - 0.06, render);
  const bandRef = useBand();
  useFrame(() => {
    if (you)
      setVotes(
        Math.round(
          12 + 130 * easeOut(span(storyOf(bandRef.current, 3), 0.6, 0.94)),
        ),
      );
  });
  return (
    <group ref={ref} visible={false}>
      <Solid geometry={panel(REPLY.w, REPLY.h, REPLY.t, 0.12)} />
      <Print
        w={REPLY.w - 0.06}
        h={REPLY.h - 0.06}
        map={tex}
        position={[0, REPLY.h / 2, REPLY.t / 2 + 0.003]}
      />
    </group>
  );
}

const MOUNT = BOARD.z + BOARD.t / 2 + REPLY.t / 2 + 0.02;
export function RedditStation() {
  const bandRef = useBand();
  const c = colors();
  const thread = useStatic(
    BOARD.w - 0.2,
    BOARD.h - 0.2,
    useCallback((ctx: Ctx, w: number, h: number) => drawThread(ctx, w, h), []),
  );
  const replies = useRef<(Group | null)[]>([]);
  const arrows = useRef<(Group | null)[]>([]);
  const mount = MOUNT;

  useFrame(() => {
    const s = storyOf(bandRef.current, 3);
    const v = voted(s);
    REPLIES.forEach((_, j) => {
      const g = replies.current[j];
      if (!g) return;
      const f = arrive(s, j);
      g.visible = f > 0;
      let y = slotY(j);
      let z = mount;
      // Yours swaps with the top reply, sliding out in front of it to pass.
      if (j === 1) {
        y = slotY(1) + (slotY(0) - slotY(1)) * v;
        z += 0.5 * Math.sin(Math.PI * Math.min(1, v * 1.4)) + 0.12 * v;
      }
      if (j === 0) y = slotY(0) + (slotY(1) - slotY(0)) * v;
      g.position.set(0, y + (1 - f) * 0.35, z + (1 - f) * 1.2);
      g.scale.setScalar(0.92 + 0.08 * f);
    });
    arrows.current.forEach((g, j) => {
      if (!g) return;
      const a = span(s, 0.6 + 0.08 * j, 0.84 + 0.08 * j);
      g.visible = a > 0 && a < 1;
      const yourTop = slotY(1) + (slotY(0) - slotY(1)) * v + REPLY.h;
      g.position.set(
        0.55 + j * 0.42,
        yourTop + 0.12 + easeOut(a) * 0.9,
        mount + 0.45,
      );
      g.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * a) * 0.8));
    });
  });

  return (
    <group position={AT.reddit}>
      <Shadow w={4.6} d={1.8} position-z={BOARD.z} />
      <Solid
        geometry={block(BOARD.w + 0.3, 0.9, BOARD.lift, 0.2)}
        position-z={BOARD.z}
      />
      <Solid
        geometry={panel(BOARD.w, BOARD.h, BOARD.t, 0.2)}
        position={[0, BOARD.lift, BOARD.z]}
      />
      <Print
        w={BOARD.w - 0.2}
        h={BOARD.h - 0.2}
        map={thread}
        position={[0, BOARD.lift + BOARD.h / 2, BOARD.z + BOARD.t / 2 + 0.003]}
      />
      {REPLIES.map((_, j) => (
        <Reply key={j} index={j} ref={(g) => void (replies.current[j] = g)} />
      ))}
      {[0, 1, 2].map((j) => (
        <group
          key={j}
          ref={(g) => void (arrows.current[j] = g)}
          visible={false}
        >
          <Solid geometry={upvote()} color={c.secondary} />
        </group>
      ))}
    </group>
  );
}
