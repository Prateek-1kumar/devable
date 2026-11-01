import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { Line2 } from "three-stdlib";
import { span, storyOf } from "../content";
import { FACE, PREMULTIPLIED, PX, Print, RIGHT, Shadow, Solid, block, colors, cylinder, drawMark, easeInOut, easeOut, panel, paragraph, pop, rrect, setFont, shadowTexture, upvote, useBand, useCanvas, wrap } from "../kit";
import { AT } from "../layout";
import { face, usePhotos } from "../photos";

// Beat 3, Reddit, as a community roundtable. ① A developer asks the subreddit: their question stands at the
// centre of the table and the members around it arrive. ② Replies rise above the members who answer, and one
// genuinely recommends your product. ③ The others send upvotes flying into that reply; its count climbs and it
// lifts to the top as the top comment.

type Ctx = CanvasRenderingContext2D;

const TABLE = { r: 1.5, h: 0.62, top: 0.06 };
const SEAT_R = 2.12;
const HEAD_Y = 1.12;
/** Six members round the table, at θ around the y axis (0 = +z); the camera looks from θ ≈ 30°. */
const MEMBERS = [
  { theta: 0, user: "u/sam_k", photo: "/services/creators/c5.jpg" },
  { theta: 60, user: "u/nora_w", photo: "/services/creators/c8.jpg" },
  { theta: 120, user: "u/kpatel", photo: "/services/creators/c3.jpg" },
  { theta: 180, user: "u/data_eng", photo: "/services/creators/c7.jpg" },
  { theta: 240, user: "u/leo_p", photo: "/services/creators/c1.jpg" },
  { theta: 300, user: "u/ml_ops_jane", photo: "/services/creators/c4.jpg" },
].map((m) => {
  const a = (m.theta * Math.PI) / 180;
  return { ...m, a, x: Math.sin(a) * SEAT_R, z: Math.cos(a) * SEAT_R };
});
const ALL_PHOTOS = MEMBERS.map((m) => m.photo);

/** The three replies, each above the member who wrote it: left, middle (yours) and right on screen. */
const CARD = { w: 2.35, h: 0.94, t: 0.07, y: 2.3 };
const REPLIES = [
  { member: 5, u: -2.6, y: 1.68, body: ["Tables were always the pain for us."], votes: 31, you: false },
  { member: 3, u: 0, y: 2.36, body: ["Switched to ", "Your Product", " last month. Best on messy layouts by far."], votes: 142, you: true },
  { member: 2, u: 2.6, y: 1.68, body: ["+1, we need self-hosted too."], votes: 9, you: false },
];
const cardAt = (u: number, y = CARD.y) => RIGHT.clone().multiplyScalar(u).setY(y);
const VOTERS = [0, 1, 2, 4, 5];

// The story, 0..1 while the camera holds.
const question = (s: number) => span(s, 0.0, 0.14);
const arrive = (s: number, i: number) => span(s, 0.06 + 0.035 * i, 0.16 + 0.035 * i);
const reply = (s: number, j: number) => span(s, 0.26 + 0.09 * j, 0.36 + 0.09 * j);
const vote = (s: number, k: number) => span(s, 0.56 + 0.05 * k, 0.72 + 0.05 * k);
const crowned = (s: number) => span(s, 0.78, 0.92);
const yourVotes = (s: number) => 12 + 130 * easeOut(span(s, 0.58, 0.84));

// ── Prints ──

function drawTableTop(ctx: Ctx, w: number) {
  const c = colors();
  const r = w / 2;
  ctx.save();
  ctx.translate(r, r);
  // Inlaid rings with the subreddit engraved round them, and a soft centre medallion.
  ctx.strokeStyle = "rgba(23,44,33,0.12)";
  ctx.lineWidth = r * 0.006;
  for (const k of [0.96, 0.8]) {
    ctx.beginPath();
    ctx.arc(0, 0, r * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  const text = "R/MACHINELEARNING  ·  2.4M DEVELOPERS  ·  ".repeat(2);
  setFont(ctx, r * 0.075, 500, true);
  ctx.fillStyle = c.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate(i * step);
    ctx.translate(0, -r * 0.88);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = "#fbe9df";
  ctx.fill();
  ctx.globalAlpha = 0.85;
  drawMark(ctx, "reddit", 0, 0, r * 0.3);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawQuestion(ctx: Ctx, w: number, h: number) {
  const c = colors();
  const k = w / 600;
  ctx.save();
  ctx.scale(k, k);
  const H = h / k;
  rrect(ctx, 0, 0, 600, H, 26, "#ffffff");
  drawMark(ctx, "reddit", 50, 52, 46);
  setFont(ctx, 24, 650);
  ctx.fillStyle = c.ink;
  ctx.fillText("r/MachineLearning", 88, 46);
  setFont(ctx, 19, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText("Posted by u/pdf_wrangler · 3h", 88, 72);
  setFont(ctx, 40, 650);
  ctx.letterSpacing = "-0.8px";
  ctx.fillStyle = c.ink;
  wrap(ctx, "Best tools for processing PDFs at scale?", 540).forEach((line, i) => ctx.fillText(line, 30, 146 + i * 48));
  ctx.letterSpacing = "0px";
  rrect(ctx, 30, H - 62, 120, 38, 19, "#f4f2eb");
  rrect(ctx, 162, H - 62, 170, 38, 19, "#f4f2eb");
  setFont(ctx, 19, 600);
  ctx.fillStyle = c.ink;
  ctx.fillText("▲ 86  ▼", 48, H - 37);
  ctx.fillText("37 comments", 186, H - 37);
  ctx.restore();
}

function drawReply(ctx: Ctx, w: number, h: number, j: number, s: number) {
  const c = colors();
  const r = REPLIES[j];
  const m = MEMBERS[r.member];
  const top = r.you && crowned(s) > 0.3;
  const k = w / 640;
  ctx.save();
  ctx.scale(k, k);
  const H = h / k;
  rrect(ctx, 0, 0, 640, H, 26, r.you ? "#f3fcf6" : "#ffffff", r.you ? "rgba(25,231,110,0.45)" : undefined, 3);
  if (r.you) rrect(ctx, 0, 22, 8, H - 44, 4, c.primary);
  face(ctx, m.photo, 52, 50, 22);
  setFont(ctx, 22, 650);
  ctx.fillStyle = c.ink;
  ctx.fillText(m.user, 86, 46);
  setFont(ctx, 17, 450);
  ctx.fillStyle = c.muted;
  ctx.fillText(r.you ? "2h · Contributor" : "2h", 86, 70);
  if (top) {
    setFont(ctx, 17, 650);
    const label = "Top comment";
    const tw = ctx.measureText(label).width + 44;
    rrect(ctx, 640 - tw - 24, 28, tw, 36, 18, c.primary);
    ctx.fillStyle = c.ink;
    ctx.beginPath();
    ctx.arc(640 - tw - 4, 46, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(label, 640 - tw + 6, 52);
  }
  paragraph(ctx, r.body, 32, 128, 576, 27, 36);
  // Votes.
  const votes = r.you ? yourVotes(s) : r.votes;
  const hot = r.you && votes > 12.5;
  setFont(ctx, 20, 650);
  const label = `▲ ${Math.round(votes)}  ▼`;
  const vw = ctx.measureText(label).width + 32;
  rrect(ctx, 28, H - 58, vw, 38, 19, hot ? "#fbe6de" : "#f4f2eb");
  ctx.fillStyle = hot ? c.secondary : c.muted;
  ctx.fillText(label, 44, H - 33);
  setFont(ctx, 18, 500);
  ctx.fillStyle = c.muted;
  ctx.fillText("Reply     Share", 28 + vw + 22, H - 33);
  ctx.restore();
}

function drawAvatar(ctx: Ctx, w: number, src: string) {
  const r = w / 2;
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  face(ctx, src, r, r, r * 0.84);
}

function drawSilhouette(ctx: Ctx, w: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#e8e6df";
  ctx.fill();
  ctx.fillStyle = "#d4d1c8";
  ctx.beginPath();
  ctx.arc(r, r * 0.8, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r, r * 1.62, r * 0.55, r * 0.42, 0, Math.PI, 0);
  ctx.fill();
}

// ── Pieces ──

/** A member at the table: chair, and their face at head height (a silhouette until they arrive). */
function Member({ i }: { i: number }) {
  const bandRef = useBand();
  const m = MEMBERS[i];
  const photoTex = useCanvas(256, 256, useCallback((ctx: Ctx, w: number) => drawAvatar(ctx, w, m.photo), [m.photo]));
  usePhotos(ALL_PHOTOS, photoTex.paint);
  const ghost = useCanvas(256, 256, useCallback((ctx: Ctx, w: number) => drawSilhouette(ctx, w), []));
  const lit = useRef<MeshBasicMaterial>(null);
  const head = useRef<Group>(null);
  useFrame((state) => {
    const k = arrive(storyOf(bandRef.current, 3), i);
    if (lit.current) lit.current.opacity = k;
    if (head.current) head.current.position.y = HEAD_Y + Math.sin(state.clock.elapsedTime * 1.1 + i * 1.3) * 0.015 - (1 - easeOut(k)) * 0.06;
  });
  return (
    <group position={[m.x, 0, m.z]}>
      <group rotation-y={m.a}>
        <Shadow w={0.8} d={0.8} opacity={0.08} />
        <Solid geometry={cylinder(0.2, 0.02)} />
        <Solid geometry={cylinder(0.035, 0.4)} color="#e3e1da" />
        <Solid geometry={block(0.52, 0.5, 0.07, 0.1)} position-y={0.4} />
        <Solid geometry={panel(0.5, 0.48, 0.05, 0.1)} position={[0, 0.47, 0.25]} rotation-y={Math.PI} />
      </group>
      <group ref={head} position-y={HEAD_Y}>
        <group quaternion={FACE}>
          <mesh renderOrder={5}>
            <circleGeometry args={[0.24, 48]} />
            <meshBasicMaterial map={ghost.texture} transparent toneMapped={false} {...PREMULTIPLIED} />
          </mesh>
          <mesh renderOrder={6} position-z={0.002}>
            <circleGeometry args={[0.24, 48]} />
            <meshBasicMaterial ref={lit} map={photoTex.texture} transparent opacity={0} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** A reply card, risen above its author, with a hairline down to them. */
function Reply({ j }: { j: number }) {
  const bandRef = useBand();
  const c = colors();
  const r = REPLIES[j];
  const m = MEMBERS[r.member];
  const value = useRef(-1);
  const draw = useCallback((ctx: Ctx, w: number, h: number) => drawReply(ctx, w, h, j, Math.max(0, value.current)), [j]);
  const tex = useCanvas(Math.round((CARD.w - 0.06) * PX * 1.4), Math.round((CARD.h - 0.06) * PX * 1.4), draw);
  usePhotos(ALL_PHOTOS, tex.paint);
  const card = useRef<Group>(null);
  const glow = useRef<MeshBasicMaterial>(null);
  const line = useRef<Line2>(null);
  const home = useMemo(() => cardAt(r.u, r.y), [r.u, r.y]);
  const points = useMemo(() => [new Vector3(m.x, HEAD_Y + 0.26, m.z), home.clone().setY(r.y - 0.02)], [m, home, r.y]);
  useFrame(() => {
    const s = storyOf(bandRef.current, 3);
    const k = reply(s, j);
    const g = card.current;
    if (g) {
      g.visible = k > 0;
      const crown = r.you ? easeInOut(crowned(s)) : 0;
      g.position.copy(home).setY(r.y - (1 - easeOut(k)) * 0.5 + 0.32 * crown);
      g.scale.setScalar(pop(k) * (1 + 0.06 * crown));
    }
    if (line.current) {
      line.current.visible = k > 0;
      line.current.material.opacity = 0.45 * k;
    }
    if (glow.current) glow.current.opacity = 0.55 * crowned(s);
    const q = Math.round(s * 120) / 120;
    if (q === value.current) return;
    value.current = q;
    tex.paint();
  });
  return (
    <group>
      <Line ref={line} points={points} color={c.line} lineWidth={1} transparent visible={false} />
      <group ref={card} visible={false}>
        <group rotation-y={Math.PI / 6}>
          {r.you && (
            <mesh position={[0, CARD.h / 2, -0.05]} scale={[CARD.w * 1.9, CARD.h * 2.6, 1]} renderOrder={-1}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial ref={glow} color={c.primary} alphaMap={shadowTexture()} transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
          )}
          <Solid geometry={panel(CARD.w, CARD.h, CARD.t, 0.12)} color={r.you ? "#f3fcf6" : "#fbfaf7"} />
          <Print w={CARD.w - 0.06} h={CARD.h - 0.06} map={tex.texture} position={[0, CARD.h / 2, CARD.t / 2 + 0.003]} />
        </group>
      </group>
    </group>
  );
}

/** An upvote flying from a member into your reply. */
function Vote({ k }: { k: number }) {
  const bandRef = useBand();
  const c = colors();
  const g = useRef<Group>(null);
  const from = useMemo(() => new Vector3(MEMBERS[VOTERS[k]].x, HEAD_Y + 0.3, MEMBERS[VOTERS[k]].z), [k]);
  const to = useMemo(() => cardAt(0, REPLIES[1].y + 0.1), []);
  useFrame(() => {
    const f = vote(storyOf(bandRef.current, 3), k);
    const o = g.current;
    if (!o) return;
    o.visible = f > 0 && f < 1;
    const e = easeInOut(f);
    o.position.lerpVectors(from, to, e);
    o.position.y += Math.sin(Math.PI * e) * 0.9;
    o.scale.setScalar(0.7 * Math.sin(Math.PI * Math.min(1, f * 1.15)) + 0.001);
  });
  return (
    <group ref={g} visible={false} rotation-y={Math.PI / 6}>
      <Solid geometry={upvote()} color={c.secondary} />
    </group>
  );
}

export function RedditStation() {
  const bandRef = useBand();
  const top = useCanvas(1024, 1024, useCallback((ctx: Ctx, w: number) => drawTableTop(ctx, w), []));
  const q = useCanvas(Math.round(2.0 * PX * 1.4), Math.round(1.24 * PX * 1.4), useCallback((ctx: Ctx, w: number, h: number) => drawQuestion(ctx, w, h), []));
  const stand = useRef<Group>(null);
  const halo = useRef<Mesh>(null);

  useFrame(() => {
    const k = question(storyOf(bandRef.current, 3));
    if (stand.current) {
      stand.current.visible = k > 0;
      stand.current.scale.setScalar(pop(k));
    }
    if (halo.current) (halo.current.material as MeshBasicMaterial).opacity = 0.25 * k;
  });

  return (
    <group position={AT.reddit}>
      {/* A round rug and the table: base, pedestal and an engraved top. */}
      <Shadow w={6.6} d={6.6} opacity={0.06} />
      <Solid geometry={cylinder(2.95, 0.03)} color="#f0eee8" />
      <Shadow w={3.6} d={3.6} opacity={0.1} position-y={0.032} />
      <Solid geometry={cylinder(0.62, 0.05)} position-y={0.03} />
      <Solid geometry={cylinder(0.16, TABLE.h - 0.05)} color="#e3e1da" position-y={0.08} />
      <Solid geometry={cylinder(TABLE.r, TABLE.top)} position-y={TABLE.h} />
      <mesh rotation-x={-Math.PI / 2} position-y={TABLE.h + TABLE.top + 0.002}>
        <circleGeometry args={[TABLE.r - 0.04, 96]} />
        <meshBasicMaterial map={top.texture} transparent toneMapped={false} {...PREMULTIPLIED} polygonOffset polygonOffsetFactor={-1} />
      </mesh>

      {/* The question, standing at the centre of the table, a warm glow beneath it. */}
      <mesh ref={halo} rotation-x={-Math.PI / 2} position-y={TABLE.h + TABLE.top + 0.004} scale={[2.2, 1.4, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ff4500" alphaMap={shadowTexture()} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={stand} position-y={TABLE.h + TABLE.top} visible={false}>
        <group rotation-y={Math.PI / 6}>
          <Solid geometry={block(0.8, 0.32, 0.03, 0.12)} />
          <Solid geometry={panel(0.1, 0.24, 0.05, 0.03)} position-z={-0.05} />
          <Solid geometry={panel(2.06, 1.3, 0.07, 0.12)} position-y={0.14} />
          <Print w={2.0} h={1.24} map={q.texture} position={[0, 0.14 + 0.65, 0.038]} />
        </group>
      </group>

      {MEMBERS.map((m, i) => (
        <Member key={m.user} i={i} />
      ))}
      {REPLIES.map((r, j) => (
        <Reply key={r.member} j={j} />
      ))}
      {VOTERS.map((_, k) => (
        <Vote key={k} k={k} />
      ))}
    </group>
  );
}
