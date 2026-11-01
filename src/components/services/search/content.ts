import type { Icon } from "../parts";

// Copy for the Search & AI Visibility service page, from the copy doc.
//
// SAMPLE DATA: the hero dashboard's numbers (`VIS`), the snapshot rows in "Search has
// expanded", every row in the four work-area artifacts, and the case-study slots are placeholders to judge
// the design. Replace them with a real client's answer, audit and approved results before this ships.

export const HERO = {
  label: "Search & AI Visibility",
  title: "We help you win SEO and AI search, measured in pipeline.",
  body: "Built for AI-native companies. We grow your visibility across Google and AI search through technical content, SEO, and the sources shaping how your product is understood and recommended.",
  cta: "Speak with the Team",
};

// SAMPLE: one product's AI visibility dashboard (the hero visual). Values are placeholders to judge the design;
// swap in a real client's tracked numbers before this ships. `views[0]` is all engines together and
// `views[1..4]` follow `engines` (so a view's index is its engine's index + 1). Per view:
//   sov / sovPrev   share of voice per product (`products[0]` is you; each view adds up to 100), now and 30 days ago, %
//   mentions        answers that name you (citations are the sum of `sources`), and both 30 days ago
//   position / top3 / prompts   your average place in an answer, the share of answers that put you in the top three, prompts tracked
//   sources         citations to your docs, Reddit, G2 comparisons and press (`SOURCES` order)
//   you / field     perception by `axes`, 0-100: your product vs the average competitor
//   tone            how answers describe you: positive, neutral, negative %
//   claims          three things AI says about you, and whether each is current
export type View = {
  sov: number[];
  sovPrev: number[];
  mentions: number;
  mentionsPrev: number;
  citationsPrev: number;
  position: number;
  top3: number;
  prompts: number;
  sources: number[];
  you: number[];
  field: number[];
  tone: number[];
  claims: { text: string; ok: boolean }[];
};

export const VIS = {
  title: "AI visibility",
  period: "Last 30 days",
  engines: [
    { name: "ChatGPT", mark: "chatgpt" },
    { name: "Perplexity", mark: "perplexity" },
    { name: "Google AI", mark: "google" },
    { name: "Claude", mark: "claude" },
  ] as { name: string; mark: Icon }[],
  products: ["Your product", "Northwind DB", "Lattice", "Meridian", "Orbit"],
  axes: ["Awareness", "Features", "Pricing", "Integrations", "Docs", "Reputation"],
  sources: [
    { label: "Your docs", mark: "docs" },
    { label: "r/LocalLLaMA", mark: "reddit" },
    { label: "G2 comparison", mark: "g2" },
    { label: "Press", mark: "news" },
  ] as { label: string; mark: Icon }[],
  // SAMPLE: the latest citations feed, cycled in order; each is one AI engine citing one of `sources`.
  events: [
    { engine: 0, source: 0, page: "docs/quickstart/hybrid-search" },
    { engine: 1, source: 1, page: "r/LocalLLaMA · Vector DB for prod RAG?" },
    { engine: 2, source: 2, page: "G2 · Best vector databases 2026" },
    { engine: 3, source: 0, page: "docs/guides/metadata-filtering" },
    { engine: 0, source: 3, page: "TechPress · Hybrid search, explained" },
    { engine: 1, source: 0, page: "docs/api/query" },
    { engine: 2, source: 1, page: "r/MachineLearning · pgvector or hosted?" },
    { engine: 0, source: 2, page: "G2 · Your product reviews" },
    { engine: 3, source: 1, page: "r/devops · Scaling RAG in prod" },
    { engine: 1, source: 3, page: "TechPress · The vector DB shortlist" },
    { engine: 2, source: 0, page: "docs/integrations/langchain" },
    { engine: 3, source: 2, page: "G2 · Northwind DB alternatives" },
  ] as { engine: number; source: number; page: string }[],
  views: [
    {
      sov: [34.2, 33.0, 14.6, 10.2, 8.0],
      sovPrev: [22.4, 36.8, 18.2, 12.6, 10.0],
      mentions: 2168,
      mentionsPrev: 1540,
      citationsPrev: 902,
      position: 2.1,
      top3: 78,
      prompts: 240,
      sources: [412, 338, 294, 240],
      you: [82, 76, 58, 71, 88, 74],
      field: [70, 68, 64, 66, 60, 72],
      tone: [68, 25, 7],
      claims: [
        { text: "Hybrid search built in", ok: true },
        { text: "Managed scaling", ok: true },
        { text: "Last year’s pricing", ok: false },
      ],
    },
    {
      sov: [38.6, 30.2, 13.4, 10.0, 7.8],
      sovPrev: [24.1, 35.8, 17.0, 12.5, 10.6],
      mentions: 812,
      mentionsPrev: 576,
      citationsPrev: 331,
      position: 1.7,
      top3: 84,
      prompts: 60,
      sources: [168, 121, 98, 81],
      you: [86, 78, 52, 74, 90, 76],
      field: [72, 70, 66, 67, 58, 73],
      tone: [72, 22, 6],
      claims: [
        { text: "Hybrid search built in", ok: true },
        { text: "Managed scaling", ok: true },
        { text: "Last year’s pricing", ok: false },
      ],
    },
    {
      sov: [31.4, 34.0, 15.8, 10.6, 8.2],
      sovPrev: [18.9, 37.5, 19.6, 13.8, 10.2],
      mentions: 604,
      mentionsPrev: 431,
      citationsPrev: 266,
      position: 2.4,
      top3: 74,
      prompts: 60,
      sources: [101, 126, 84, 61],
      you: [78, 72, 63, 66, 86, 70],
      field: [68, 66, 62, 64, 62, 70],
      tone: [66, 27, 7],
      claims: [
        { text: "Hybrid search built in", ok: true },
        { text: "Managed scaling", ok: true },
        { text: "Free tier limits", ok: false },
      ],
    },
    {
      sov: [36.9, 28.8, 15.2, 10.1, 9.0],
      sovPrev: [26.0, 32.4, 18.6, 13.0, 10.0],
      mentions: 489,
      mentionsPrev: 348,
      citationsPrev: 197,
      position: 1.9,
      top3: 81,
      prompts: 60,
      sources: [88, 48, 86, 59],
      you: [84, 80, 60, 72, 84, 78],
      field: [71, 69, 65, 68, 60, 71],
      tone: [70, 24, 6],
      claims: [
        { text: "Hybrid search built in", ok: true },
        { text: "Managed scaling", ok: true },
        { text: "Pricing by usage", ok: true },
      ],
    },
    {
      sov: [29.7, 32.6, 16.8, 12.0, 8.9],
      sovPrev: [18.2, 35.4, 20.9, 14.8, 10.7],
      mentions: 263,
      mentionsPrev: 185,
      citationsPrev: 108,
      position: 2.6,
      top3: 69,
      prompts: 60,
      sources: [55, 43, 26, 39],
      you: [80, 74, 57, 70, 92, 72],
      field: [69, 67, 63, 65, 59, 72],
      tone: [62, 30, 8],
      claims: [
        { text: "Hybrid search built in", ok: true },
        { text: "Self-hosting docs", ok: false },
        { text: "Managed scaling", ok: true },
      ],
    },
  ] as View[],
};

export type Status = "shown" | "stale" | "missing";
export const STATUS_LABEL: Record<Status, string> = { shown: "Shown", stale: "Out of date", missing: "Not shown" };

export const EXPANDED = {
  label: "Search has expanded beyond Google",
  title: "Search is no longer just rankings.",
  body: "Buyers and developers discover products through search engines, AI answers, technical content, comparisons, and trusted third-party sources.",
  challenge: "The challenge is making sure your product appears in those moments and is represented accurately when it does.",
  // SAMPLE: how one product shows up on each surface.
  surfaces: [
    { name: "Search engines", marks: ["google"], seen: "Position 4 for “vector database for RAG”", status: "shown" },
    { name: "AI answers", marks: ["chatgpt", "perplexity", "claude"], seen: "Described with last year’s pricing", status: "stale" },
    { name: "Technical content", marks: ["github", "docs"], seen: "Quickstart tutorial cited in answers", status: "shown" },
    { name: "Comparisons", marks: ["g2"], seen: "Missing from “Best vector databases”", status: "missing" },
    { name: "Third-party sources", marks: ["reddit", "hackernews"], seen: "Recommended in a top Reddit thread", status: "shown" },
  ] as { name: string; marks: Icon[]; seen: string; status: Status }[],
};

export type Area = { name: string; summary: string; listLabel: string; items: string[] };

export const AREAS = {
  label: "How we improve search & AI visibility",
  title: "Start with the opportunity, not a checklist.",
  body: "We map the searches and AI questions that influence how your audience discovers, compares, and chooses products. Then we build the signals that make your product easier to find, understand, and recommend.",
  areas: [
    {
      name: "Search Intelligence",
      summary: "Understand the search market before deciding what to change.",
      listLabel: "We map",
      items: ["High-intent search demand", "Relevant AI prompts", "Current visibility", "Competitor coverage", "Citation sources", "Commercial content gaps"],
    },
    {
      name: "Content & Pages",
      summary: "Build and improve the pages needed to win the searches and questions that matter.",
      listLabel: "Includes",
      items: ["Technical content", "Product and use-case pages", "Integration pages", "Comparison and alternative pages", "Content refreshes", "On-page optimization"],
    },
    {
      name: "Third-Party Visibility",
      summary: "Strengthen the external sources already shaping search and AI recommendations in your category.",
      listLabel: "Includes",
      // ponytail: "Reddit and community visibility" links to /services/reddit once that page ships.
      items: ["Relevant third-party mentions", "Comparison and listicle opportunities", "Industry publications", "Reddit and community visibility", "Citation opportunities"],
    },
    {
      name: "Technical Foundation",
      summary: "Fix the technical and structural issues limiting discovery.",
      listLabel: "Includes",
      items: ["Technical SEO", "Site architecture", "Crawlability and indexation", "Internal linking", "Page structure", "Search performance improvements"],
    },
  ] as Area[],
  note: "The mix of work changes based on where the strongest opportunity is, whether that means technical fixes, new pages, content refreshes, third-party visibility, or stronger AI coverage.",
};

// SAMPLE: what each area's work looks like, one scene per area (see Workbench).
export const ARTIFACTS = {
  intelligence: {
    metrics: [
      { label: "High-intent queries", value: "214" },
      { label: "AI prompts tracked", value: "60" },
    ],
    rows: [
      { query: "vector database for RAG", mark: "google", you: "#9", leader: "Northwind #1", priority: true },
      { query: "Best vector DB for AI agents?", mark: "chatgpt", you: "Not mentioned", leader: "Northwind" },
      { query: "pgvector alternative", mark: "google", you: "#3", leader: "You" },
      { query: "Hybrid search with filters?", mark: "perplexity", you: "1 of 5", leader: "Lattice" },
    ] as { query: string; mark: Icon; you: string; leader: string; priority?: boolean }[],
  },
  content: {
    pages: [
      { path: "/compare/northwind", type: "Comparison", action: "New" },
      { path: "/integrations/langchain", type: "Integration", action: "New" },
      { path: "/use-cases/rag", type: "Use case", action: "Refresh" },
      { path: "/docs/quickstart", type: "Technical", action: "Optimize" },
    ],
    // The first page in the plan, drafted.
    draft: { title: "Your product vs. Northwind", target: "northwind alternative" },
  },
  thirdParty: {
    sources: [
      { name: "Reddit threads", mark: "reddit", share: 34, present: false },
      { name: "Comparison listicles", mark: "g2", share: 26, present: false },
      { name: "Product docs", mark: "docs", share: 21, present: true },
      { name: "Industry publications", mark: "news", share: 12, present: true },
    ] as { name: string; mark: Icon; share: number; present: boolean }[],
    thread: { sub: "r/LocalLLaMA", title: "What vector DB are you running RAG on in prod?", votes: 214 },
  },
  technical: {
    before: 61,
    after: 96,
    // Share of pages indexed, month by month.
    series: [61, 63, 70, 82, 91, 96],
    issues: [
      { issue: "Docs pages blocked from indexing", count: 214, fixed: true },
      { issue: "Integration pages with no internal links", count: 18, fixed: true },
      { issue: "Duplicate titles across versions", count: 42, fixed: true },
      { issue: "Slow pages on mobile", count: 9, fixed: false },
    ],
  },
};

export const TECHNICAL = {
  label: "Built for technical products",
  title: "Search strategy without the technical learning curve.",
  points: [
    {
      title: "Product understanding comes first",
      body: "We understand the product, APIs, use cases, integrations, and technical category before deciding what to optimize.",
    },
    {
      title: "Technical content is part of execution",
      body: "Our technical writers and engineers can create the tutorials, comparisons, use-case pages, and content the strategy requires.",
    },
    {
      title: "Search and AI work as one system",
      body: "SEO, AI visibility, content, and external authority are managed together instead of as disconnected channels.",
    },
  ],
};

export const MEASURE = {
  label: "What we measure",
  title: "Measure what changed and what it contributed to.",
  signals: [
    { name: "Search", items: ["Commercial rankings", "Organic visibility", "Qualified organic traffic", "High-intent page performance"] },
    { name: "AI", items: ["Mentions", "Recommendations", "Citations", "Share of voice"] },
  ],
  outcome: { name: "Business", items: ["Signups", "Demo requests", "Pipeline contribution", "Revenue where measurable"] },
};

export type Case = { client: string; logo?: string; services: string[]; href: string };

// Real clients; result, description and quote stay as flagged slots until the case studies are finalized.
export const CASES = {
  label: "Client proof",
  title: "Search and AI visibility in action.",
  slots: {
    result: "Key result, e.g. AI citations or rankings before and after",
    summary: "Short description of the work",
    quote: "Client quote if available",
  },
  cases: [
    { client: "LandingAI", logo: "/clients/landingai.png", services: ["Search & AI Visibility"], href: "#" },
    { client: "Orq.ai", services: ["Search & AI Visibility", "Reddit"], href: "#" },
    { client: "Superlinked", services: ["Search & AI Visibility"], href: "#" },
  ] as Case[],
};

export const CTA = {
  title: "Build visibility where your audience searches.",
  body: "We'll show you where your product stands today, where competitors are ahead, and what we would prioritize first.",
  button: "Get your AI visibility snapshot",
};
