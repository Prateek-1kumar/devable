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
      "Animation: sources like docs, the GitHub repo, sales calls, Reddit, competitors and Google light up one by one and feed a product model, which briefly runs the product's quickstart in a terminal and then checks off who it's for, core use cases, the competitor landscape, the visibility baseline, content gaps and where it wins.",
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
      "Animation: a growth plan finds four specific opportunities (a vector-DB search query on Google and ChatGPT, creators for the v2 launch, r/LocalLLaMA, and LangChain and LlamaIndex guides), ranks them by impact, and turns them into an engine mix that shifts towards creators when the v2 launch comes up.",
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
      "Animation: a production checklist ticks off brief, research, tested code and an engineer's technical review while the article beside it fills in with a title, a working code example and a Reviewed by an engineer badge, then gets published.",
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
      "Animation: one published article gets picked up by four channels in turn (it ranks #2 on Google, ChatGPT cites it, a r/devops thread recommends it, and a creator posts about it on X) until it is live in 4 of 4 channels.",
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
      "Animation: a 12-week traffic chart draws itself through a launch-week spike and keeps rising; as it passes key weeks a signal appears (page climbing from #9 to #3, a new AI prompt gap, a creator performing 3x better) that turns into a next action (double down, write an answer page, rebook).",
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
