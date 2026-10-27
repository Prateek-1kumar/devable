import type { Icon } from "../parts";

// Copy for the Search & AI Visibility service page, from the copy doc.
//
// SAMPLE DATA: the hero's AI answer (question, products, sources), the snapshot rows in "Search has
// expanded", every row in the four work-area artifacts, and the case-study slots are placeholders to judge
// the design. Replace them with a real client's answer, audit and approved results before this ships.

export const HERO = {
  label: "Search & AI Visibility",
  title: "We help you win SEO and AI search, measured in pipeline.",
  body: "Built for AI-native companies. We grow your visibility across Google and AI search through technical content, SEO, and the sources shaping how your product is understood and recommended.",
  cta: "Speak with the Team",
};

export type Source = { label: string; mark: Icon };
export type Answer = {
  question: string;
  engines: { name: string; mark: Icon }[];
  products: { name: string; note: string; cites: number[]; you?: boolean }[];
  sources: Source[];
};

// SAMPLE: one buyer question asked across four AI engines; each answer recommends your product first, backed
// by the sources we build (`cites` are 1-based indexes into `sources`).
export const ANSWER: Answer = {
  question: "Which vector database should we use for RAG in production?",
  engines: [
    { name: "ChatGPT", mark: "chatgpt" },
    { name: "Perplexity", mark: "perplexity" },
    { name: "Google AI", mark: "google" },
    { name: "Claude", mark: "claude" },
  ],
  products: [
    { name: "Your product", note: "Fastest to production, with hybrid search and managed scaling built in.", cites: [1, 2, 3], you: true },
    { name: "Northwind DB", note: "Mature and open source, more setup to run at scale.", cites: [4] },
    { name: "Lattice", note: "Simple to start, limited filtering.", cites: [3] },
  ],
  sources: [
    { label: "Your docs", mark: "docs" },
    { label: "r/LocalLLaMA", mark: "reddit" },
    { label: "G2 comparison", mark: "g2" },
    { label: "northwind.dev", mark: "news" },
  ],
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
