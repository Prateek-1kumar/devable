export const EYEBROW = "How we work";
export const TITLE = "A growth engine built around your product.";
export const INTRO =
  "From product understanding and growth strategy through to execution and optimization, we run a connected growth engine across content, organic search, AI visibility, Reddit, developer communities, and creator distribution. The goal: build visibility that compounds into pipeline.";
export const INCLUDES_LABEL = "Includes";
export const NAV_LABEL = "How we work steps";

export type Metric = { label: string; value: number; format: (v: number) => string };

const int = (v: number) => Math.round(v).toString();
const pct = (v: number) => `${Math.round(v)}%`;

export const STEPS = [
  {
    n: "01",
    title: "Product Intelligence",
    headline: "Understand the product before building the growth engine.",
    body: "Most marketing teams start with channels. We start by understanding what you built, who it is for, how the market sees it, and where the opportunities exist.",
    includes: [
      "Product and technical deep dive",
      "Audience and buyer research",
      "Competitive analysis",
      "Positioning analysis",
      "Existing content and visibility review",
    ],
    metrics: [
      { label: "Sources analysed", value: 42, format: int },
      { label: "Competitors mapped", value: 8, format: int },
    ],
    panel:
      "Animation: four groups of sources (product docs, website and GitHub; competitors and reviews; Reddit and Hacker News; Google and ChatGPT) are read one group at a time, sending signal into a Your product card that keeps re-checking priority use cases, buyer and user groups, competitive position and visibility gaps.",
  },
  {
    n: "02",
    title: "Growth Strategy",
    headline: "Find the opportunities that matter.",
    body: "We turn product intelligence into a clear growth direction by identifying the channels, narratives, and opportunities that align with your audience, market, and goals.",
    includes: ["Channel prioritization", "Content roadmap", "Search and AI visibility opportunities", "Community strategy", "Creator strategy"],
    metrics: [
      { label: "Keyword opportunities", value: 1.2, format: (v: number) => `${v.toFixed(1)}k` },
      { label: "AI citation gap", value: 38, format: pct },
    ],
    panel:
      "Animation: a growth priorities list ranks high-intent category visibility (search and AI, high impact), comparison and alternative demand (technical content, high impact) and technical creator distribution (medium impact); each priority's impact is re-measured in turn while its channel lights up in the recommended channel mix of content 35%, search and AI 30%, Reddit 15% and creators 20%.",
  },
  {
    n: "03",
    title: "Content Engine",
    headline: "Build content developers trust.",
    body: "Technical audiences do not respond to generic marketing content. We combine technical expertise, research, and growth strategy to create content that educates developers and improves search and AI visibility.",
    includes: [
      "Technical articles and tutorials",
      "Product-led content",
      "Comparison pages and guides",
      "Code examples and demos",
      "Content optimization and updates",
    ],
    metrics: [
      { label: "Articles shipped", value: 12, format: (v: number) => `${Math.round(v)}/mo` },
      { label: "Avg. time on page", value: 272, format: (v: number) => `${Math.floor(v / 60)}:${String(Math.round(v) % 60).padStart(2, "0")}` },
    ],
    panel:
      "Animation: a production checklist moves through brief, product research, draft, technical review (reviewing technical accuracy) and optimize and publish, while the draft beside it is outlined, written with a code example, swept by a technical review that stamps Sources verified and Product tested hands-on, then published before the next article starts.",
  },
  {
    n: "04",
    title: "Distribution Engine",
    headline: "Make your content discoverable across the channels that matter.",
    body: "We connect content with the channels that influence product discovery, from organic search and AI visibility to developer communities and trusted creators.",
    includes: [
      "Organic search optimization",
      "AI visibility strategy",
      "Reddit and community distribution",
      "Creator campaigns",
      "Social distribution",
    ],
    metrics: [
      { label: "Share of voice", value: 34, format: pct },
      { label: "AI citations", value: 43, format: pct },
    ],
    panel:
      "Animation: a distribution plan carrying the published article fans out to four channels in turn: search (capture intent, active) where our result lands on top, AI answers (improve citations, monitoring) where an answer cites us, Reddit (join relevant threads, active) where our reply joins the thread, and creators (expand reach, launching); 3 of 4 channels are active.",
  },
  {
    n: "05",
    title: "Optimization Loop",
    headline: "Learn, improve, and compound over time.",
    body: "Growth is not a one-time campaign. We continuously analyze performance, audience feedback, and market changes to improve what we create and how we distribute it.",
    includes: ["Performance analysis", "Content updates", "Campaign optimization", "Strategy refinement", "New growth opportunities"],
    metrics: [
      { label: "Pipeline influenced", value: 61, format: (v: number) => `+${Math.round(v)}%` },
      { label: "Content refreshed", value: 9, format: int },
    ],
    panel:
      "Animation: a radar sweeps continuously through four quadrants, one per stage of the loop: measure (visibility, engagement, pipeline), diagnose (a top performer climbing from #9 to #3 on Google, and a gap where ChatGPT doesn't cite us), improve (refresh, redistribute, rebalance) and scale (increase what works). Each completed sweep pulses the result in the centre: search visibility up 38% this month.",
  },
] as const satisfies readonly {
  n: string;
  title: string;
  headline: string;
  body: string;
  includes: readonly string[];
  metrics: readonly Metric[];
  panel: string;
}[];

export type Step = (typeof STEPS)[number];
