// The section's words, verbatim from the brief and in reading order. The DOM
// column, the step nav and the panels' metric strips all read from here, so the
// panels stay aria-hidden: `panel` is each animation's text equivalent.

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
      "Animation: product docs, the GitHub repo, sales calls, Reddit threads, competitor sites and existing content feed a product model that confirms ICP, positioning, competitor gaps and a visibility baseline, then places the product in an open space on a positioning map.",
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
      "Animation: Google Search, AI answers, Reddit, developer communities and creators are scored on impact and effort and re-sorted by priority, then a six-week content roadmap fills with articles.",
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
      "Animation: a content brief with a target query, audience and outline becomes a published technical article with a code example and a comparison table, and its SEO and AI-readiness scores rise until it is marked optimized.",
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
      "Animation: the published article fans out to Google, where it climbs to the second result, to ChatGPT and Perplexity answers that cite it, to a Reddit thread gaining upvotes, to a creator video and to social posts.",
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
      "Animation: a dashboard shows organic and AI-referred traffic and pipeline rising week over week; an insight flags a comparison page losing rank, the page is refreshed as version two, and the loop starts again.",
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
