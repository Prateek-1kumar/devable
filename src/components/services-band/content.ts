// What the services band says, one beat per stop of the camera. Pure data and maths (no three.js),
// so the page shell can import it without pulling in the 3D bundle.

/** One step of a beat's story: what the scene label (and the phone card) says, and when in the story it shows. */
export type Step = { text: string; from: number };
export type Beat = {
  n: string;
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
  steps: Step[];
};

export const BEATS: Beat[] = [
  {
    n: "00",
    eyebrow: "Product understanding",
    title: "It starts with your product",
    body: "We get inside what you build, who it's for and where those people already look, before we touch a channel.",
    steps: [
      { text: "Your product", from: -0.1 },
      { text: "We learn it inside out", from: 0.3 },
      { text: "Routed into four channels", from: 0.62 },
    ],
  },
  {
    n: "01",
    eyebrow: "Technical Content",
    title: "Content developers actually read",
    body: "Tutorials, blogs and docs built for developers, search engines and LLMs.",
    href: "/services/technical-content",
    steps: [
      { text: "Engineers write the tutorial", from: -0.1 },
      { text: "Developers, Google and LLMs pick it up", from: 0.4 },
    ],
  },
  {
    n: "02",
    eyebrow: "Search & AI Visibility",
    title: "Ranked, and cited in the answer",
    body: "We help you win SEO and AI search: the results page and the AI overview above it.",
    href: "/services/search-ai-visibility",
    steps: [
      { text: "A developer searches", from: -0.1 },
      { text: "You climb to #1", from: 0.34 },
      { text: "Cited in the AI answer", from: 0.8 },
    ],
  },
  {
    n: "03",
    eyebrow: "Reddit",
    title: "The product people recommend",
    body: "Show up in the threads where your category comes up, as the answer people upvote.",
    href: "/services/reddit",
    steps: [
      { text: "A developer asks the community", from: -0.1 },
      { text: "Your product comes up", from: 0.36 },
      { text: "Upvoted to the top", from: 0.72 },
    ],
  },
  {
    n: "04",
    eyebrow: "Creator Distribution",
    title: "Reach through voices they trust",
    body: "The technical creators your audience already follows, on X, LinkedIn and YouTube.",
    href: "/services/influencer-marketing",
    steps: [
      { text: "A creator developers trust posts", from: -0.1 },
      { text: "Shared across X, LinkedIn and YouTube", from: 0.42 },
      { text: "248K developers reached", from: 0.78 },
    ],
  },
  {
    n: "05",
    eyebrow: "Learn · Improve · Compound",
    title: "Visibility that compounds",
    body: "Every channel feeds the next: more reach, more qualified demand, more pipeline.",
    steps: [
      { text: "Four channels, one system", from: 0.1 },
      { text: "Results flow back to the hub", from: 0.35 },
      { text: "Pipeline compounds", from: 0.55 },
    ],
  },
];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Where `v` sits between `a` and `b`, as 0..1. */
export const span = (v: number, a: number, b: number) =>
  clamp01((v - a) / (b - a));

/** Where the scroll starts, in beats: a short lead-in on the first beat before its story begins. */
const START = -0.75;
/**
 * Scroll position in beats: START when the stage pins, BEATS.length − 0.5 when it lets go, so each beat owns
 * one unit centred on its index. The camera holds on beat i over i ± 0.3 and travels in between.
 */
export const beatAt = (progress: number) =>
  START + progress * (BEATS.length - 0.5 - START);
/** How far beat i's story has played (0..1). It plays while the camera holds there, and stays played. */
export const storyOf = (x: number, i: number) => span(x, i - 0.32, i + 0.24);

/**
 * How visible something in beat `i` is (0..1): it fades in as the story reaches `from`, out at `to` if given,
 * and out again as the camera leaves the beat (only on arrival for the last beat, which never leaves).
 */
export function shown(x: number, i: number, from: number, to = 2) {
  const s = storyOf(x, i);
  // The first beat is already in place during the lead-in; the last never leaves.
  const arrive = i === 0 ? 1 : span(x, i - 0.48, i - 0.32);
  const leave = i === BEATS.length - 1 ? 1 : 1 - span(x, i + 0.32, i + 0.48);
  return (
    span(s, from, from + 0.1) * (1 - span(s, to, to + 0.1)) * arrive * leave
  );
}
