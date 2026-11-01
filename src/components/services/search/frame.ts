import { VIS } from "./content";

// One moment of the hero dashboard: the sample numbers of a view, moved by slow organic noise so the dashboard
// breathes like a live tracker (scores tick, rivals trade places, citations climb and settle).
// `view` 0 is all engines, 1-4 an engine; time `u` is in loop steps (one step is a tick of the clock).
// The `*At` functions are continuous in `u`, so charts can scroll smoothly; `frame` reads them at a whole
// step, so every number on screen sits on the same lines the charts draw. Pure: same (view, u), same value.

/** Smooth noise in -1..1: three slow waves that never line up, so a line reads as data, not a sine. */
const nz = (u: number, seed: number) => 0.55 * Math.sin(u * 0.83 + seed * 2.1) + 0.3 * Math.sin(u * 1.9 + seed * 4.7) + 0.15 * Math.sin(u * 3.7 + seed * 1.3);
const r1 = (n: number) => Math.round(n * 10) / 10;
const rankOf = (xs: number[]) => xs.map((x) => xs.filter((y) => y > x).length); // 0 = first

export const sovAt = (view: number, i: number, u: number) => VIS.views[view].sov[i] + nz(u, view * 7 + i) * 1.4 + Math.sin(u * 0.22 + (view * 7 + i) * 1.7) * 2.6; // + a slow swell, so the trend curves
export const sourceAt = (view: number, i: number, u: number) => {
  const x = VIS.views[view].sources[i];
  return x + nz(u, view * 7 + 20 + i) * x * 0.06;
};
export const citationsAt = (view: number, u: number) => VIS.sources.reduce((sum, _, i) => sum + sourceAt(view, i, u), 0);
export const mentionsAt = (view: number, u: number) => VIS.views[view].mentions * (1 + nz(u, view * 7 + 10) * 0.025);

export function frame(view: number, step: number) {
  const v = VIS.views[view];
  const nzs = (seed: number, amp: number) => nz(step, view * 7 + seed) * amp;

  const sov = v.sov.map((_, i) => r1(sovAt(view, i, step)));
  const sources = v.sources.map((_, i) => Math.round(sourceAt(view, i, step)));
  const citations = sources.reduce((a, b) => a + b, 0);
  const mentions = Math.round(mentionsAt(view, step));
  const you = v.you.map((x, i) => Math.round(x + nzs(30 + i, 4)));
  const field = v.field.map((x, i) => Math.round(x + nzs(40 + i, 2)));
  const pos = Math.round(v.tone[0] + nzs(50, 2.5));
  const neg = Math.round(v.tone[2] + nzs(51, 1));

  return {
    sov,
    rank: rankOf(sov), // each product's place now…
    rankPrev: rankOf(v.sovPrev), // …and 30 days ago
    sovDelta: r1(sov[0] - v.sovPrev[0]), // points
    citations,
    citationsDelta: citations / v.citationsPrev - 1,
    mentions,
    mentionsDelta: mentions / v.mentionsPrev - 1,
    sources,
    position: r1(v.position + nzs(60, 0.15)),
    top3: Math.round(v.top3 + nzs(61, 2)),
    you,
    field,
    tone: [pos, 100 - pos - neg, neg],
    claims: v.claims,
  };
}

/** The latest `n` citations at `step`, newest first: all engines, or just the chosen engine's. Event `k` lands at step `k`. */
export function eventsFor(view: number, step: number, n: number) {
  const L = VIS.events.length;
  const out: { k: number; engine: number; source: number; page: string }[] = [];
  for (let k = step; out.length < n && k > step - 80; k--) {
    const e = VIS.events[((k % L) + L) % L];
    if (!view || e.engine === view - 1) out.push({ k, ...e });
  }
  return out;
}
