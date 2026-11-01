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
  products: ["Your Product", "Category Leader", "Competitor A", "Competitor B", "Competitor C"],
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
    { engine: 3, source: 2, page: "G2 · Category Leader alternatives" },
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

// Copy from the client; the visual's rows and numbers are SAMPLE data to judge the design. Each shows one
// product's journey on both surfaces, from where it starts to where the work gets it: a query's position in
// Google, and whether each AI engine mentions, cites and recommends it.
export const EXPANDED = {
  label: "Search has expanded beyond Google",
  title: "Search and AI visibility now work together.",
  body: "We help your product get discovered across traditional search and AI answers, then strengthen the content, authority, and third-party signals that influence both.",
  search: {
    name: "Search Visibility",
    title: "Win the searches that matter.",
    body: "Build visibility across category, comparison, and high-intent queries tied to your product.",
    // Position in Google before and after (rank 1 is first), and the page that ranks.
    queries: [
      { q: "vector database for RAG", kind: "Category", url: "/docs/vector-search-rag", from: 9, to: 4 },
      { q: "category leader alternative", kind: "Comparison", url: "/compare/category-leader", from: 14, to: 3 },
      { q: "hybrid search api", kind: "High-intent", url: "/api/hybrid-search", from: 21, to: 6 },
    ],
    pageOne: { label: "Queries on page one", from: 14, to: 31 },
  },
  ai: {
    name: "AI Visibility",
    title: "Show up in the answers that shape decisions.",
    body: "Improve how your product is mentioned, cited, and recommended across ChatGPT, Perplexity, Claude, and other AI search experiences.",
    steps: ["Mentioned", "Cited", "Recommended"],
    // Per engine: the three steps before and after, and its share of answers (%) before and after.
    engines: [
      { name: "ChatGPT", mark: "chatgpt", from: [true, false, false], to: [true, true, true], share: [12, 38] },
      { name: "Perplexity", mark: "perplexity", from: [true, false, false], to: [true, true, true], share: [9, 33] },
      { name: "Claude", mark: "claude", from: [false, false, false], to: [true, true, false], share: [0, 24] },
    ] as { name: string; mark: Icon; from: boolean[]; to: boolean[]; share: number[] }[],
  },
  // What feeds both.
  signals: {
    label: "Strengthening the signals that influence both",
    items: [
      { name: "Content", note: "Technical pages and docs", marks: ["docs"] },
      { name: "Authority", note: "Links and press coverage", marks: ["news"] },
      { name: "Third-party signals", note: "Reddit, reviews, comparisons", marks: ["reddit", "g2"] },
    ] as { name: string; note: string; marks: Icon[] }[],
  },
};

export type Area = { name: string; tagline: string; summary: string; body?: string; listLabel: string; items: string[] };

export const AREAS = {
  label: "How we improve search & AI visibility",
  title: "Start with the opportunity, not a checklist.",
  body: "We map the searches and AI questions that influence how your audience discovers, compares, and chooses products. Then we build the signals that make your product easier to find, understand, and recommend.",
  // `tagline` is the step's place in the sequence: understand, build, strengthen, unblock.
  areas: [
    {
      name: "Search Intelligence",
      tagline: "Understand the product and find the opportunity",
      summary: "Understand the product and the search market before deciding what to prioritize.",
      body: "We first get into the product, use cases, audience, integrations, and technical category. From there, we map high-intent searches, relevant AI prompts, current visibility, competitor coverage, citation sources, and commercial gaps to identify where the strongest opportunities are.",
      listLabel: "We map",
      items: ["High-intent search demand", "Relevant AI prompts", "Current visibility", "Competitor coverage", "Citation sources", "Commercial content gaps"],
    },
    {
      name: "Content & Pages",
      tagline: "Build or improve what’s needed",
      summary: "Build and improve the pages needed to win the searches and questions that matter.",
      listLabel: "Includes",
      items: ["Technical content", "Product and use-case pages", "Integration pages", "Comparison and alternative pages", "Content refreshes", "On-page optimization"],
    },
    {
      name: "Third-Party Visibility",
      tagline: "Strengthen external visibility",
      summary: "Strengthen the external sources already shaping search and AI recommendations in your category.",
      listLabel: "Includes",
      // ponytail: "Reddit and community visibility" links to /services/reddit once that page ships.
      items: ["Relevant third-party mentions", "Comparison and listicle opportunities", "Industry publications", "Reddit and community visibility", "Citation opportunities"],
    },
    {
      name: "Technical Foundation",
      tagline: "Remove technical blockers",
      summary: "Fix the technical and structural issues limiting discovery.",
      listLabel: "Includes",
      items: ["Technical SEO", "Site architecture", "Crawlability and indexation", "Internal linking", "Page structure", "Search performance improvements"],
    },
  ] as Area[],
};

// SAMPLE: what each area's work looks like. Each area has its own scene and its own shape of information (see
// the scenes beside Workbench). Labels are neutral on purpose: Your Product, Competitor A, Category Leader.
export const ARTIFACTS = {
  // 01: Product understanding → Search & AI signals → Opportunity → Priority
  intelligence: {
    stages: ["Product understanding", "Search & AI signals", "Opportunity", "Priority"],
    product: [
      { label: "Use cases", value: "RAG, agents, semantic search" },
      { label: "Audience", value: "ML engineers, platform teams" },
      { label: "Integrations", value: "LangChain, LlamaIndex, +6" },
      { label: "Category", value: "Vector database" },
    ],
    signals: [
      { label: "High-intent searches", value: 214 },
      { label: "AI prompts", value: 60 },
      { label: "Current visibility", value: 12, suffix: "%" },
      { label: "Competitors covered", value: 5 },
      { label: "Citation sources", value: 18 },
      { label: "Commercial gaps", value: 7 },
    ] as { label: string; value: number; suffix?: string }[],
    opportunities: [
      { label: "Comparison vs. Competitor A", score: 94 },
      { label: "Integration pages", score: 81 },
      { label: "“Category Leader alternative”", score: 76 },
    ],
    priority: [
      { label: "Comparison page", when: "Now" },
      { label: "Integration pages", when: "Next" },
      { label: "Use-case refresh", when: "Then" },
    ],
  },
  // 02: Opportunity → Page → what happens to it
  content: {
    head: ["Opportunity", "Page", "Action"],
    plan: [
      { signal: "Comparison opportunity", page: "Comparison page", path: "/compare/competitor-a", note: "Targets “competitor a alternative”", action: "New" },
      { signal: "Integration demand", page: "Integration page", path: "/integrations/langchain", note: "Top framework in your category", action: "New" },
      { signal: "Existing use-case page", page: "Use-case page", path: "/use-cases/rag", note: "Last updated 14 months ago", action: "Refresh" },
      { signal: "Docs gap", page: "Technical docs", path: "/docs/quickstart", note: "", action: "Optimize" },
    ] as { signal: string; page: string; path: string; note: string; action: "New" | "Refresh" | "Optimize" }[],
    checks: ["Title", "Schema", "Internal links"],
  },
  // 03: where the product is present, weak or missing among the external sources that shape search and AI
  thirdParty: {
    hub: { name: "Your Product", label: "Coverage", value: 50 },
    // `kind` picks the icon; `opportunity` marks where the work is worth pursuing.
    sources: [
      { name: "Reddit / communities", kind: "reddit", state: "missing", opportunity: true },
      { name: "Review platforms", kind: "g2", state: "present" },
      { name: "Partner / ecosystem pages", kind: "partner", state: "weak" },
      { name: "Comparison pages", kind: "compare", state: "weak", opportunity: true },
      { name: "Industry publications", kind: "news", state: "present" },
      { name: "Creator / expert content", kind: "youtube", state: "missing" },
    ] as { name: string; kind: string; state: "present" | "weak" | "missing"; opportunity?: boolean }[],
  },
  // 04: Diagnose → Fix → Improve discovery
  technical: {
    stages: ["Diagnose", "Fix", "Improve discovery"],
    issues: [
      { issue: "Pages not indexed", count: 214 },
      { issue: "Weak internal linking", count: 38 },
      { issue: "Duplicate pages", count: 42 },
      { issue: "Crawl issues", count: 17 },
      { issue: "Slow or inaccessible pages", count: 9 },
    ],
    discovery: { label: "Discoverable pages", from: 61, to: 96 },
  },
};

// The sentence the client moved out of the "How we improve" section into a section of its own, word for word,
// and the visual that makes it land: the five kinds of work it names, as a share of the whole.
export const MIX = {
  lead: "The mix of work changes based on where the strongest opportunity is,",
  rest: "whether that means technical fixes, new pages, content refreshes, third-party visibility, or stronger AI coverage.",
  tag: "Strongest opportunity",
  parts: ["Technical fixes", "New pages", "Content refreshes", "Third-party visibility", "AI coverage"],
  // SAMPLE: the share of the work (%) in each part, in `parts` order, when each in turn is where the strongest opportunity is.
  mixes: [
    [44, 18, 12, 14, 12],
    [14, 42, 14, 14, 16],
    [12, 18, 40, 14, 16],
    [12, 16, 12, 44, 16],
    [10, 16, 10, 22, 42],
  ],
};

// Copy from the client: the commitment we make when we work with a client. Text-led on purpose.
export const COMMITMENT = {
  label: "Our commitment to you",
  // "A 90-day plan prioritized by commercial impact." with its two key phrases picked out in green.
  title: { a: "A", plan: "90-day plan", b: "prioritized by", impact: "commercial impact", end: "." },
  body: "We turn the opportunities we identify into a clear 90-day plan, then break that into monthly sprints with specific performance objectives.",
  // The three horizons, longest first, each in its own lane of a twelve-month timeline (see Commitment).
  horizons: ["Long-term strategy.", "90-day priorities.", "Monthly execution."],
};

export const MEASURE = {
  label: "What we measure",
  title: "Measure what changed and what it contributed to.",
  signals: [
    { name: "Search", items: ["Commercial rankings", "Organic visibility", "Qualified organic traffic", "High-intent page performance"] },
    { name: "AI", items: ["Mentions", "Recommendations", "Citations", "Share of voice"] },
  ],
  outcome: { name: "Business", items: ["Signups", "Demo requests", "Pipeline contribution", "Revenue where measurable"] },
  // SAMPLE: the same account on day 1 and day 90 of a plan, for the live measurement view. Each metric has the
  // two values it moves between; `series` is its trend. The metrics follow the order of the lists above.
  figures: {
    window: "Last 90 days",
    search: {
      rank: {
        query: "vector database for RAG",
        from: 8,
        to: 3,
        series: [8, 8, 7, 6, 5, 4, 3],
        // Two more tracked rankings, smaller.
        more: [
          { query: "category leader alternative", from: 14, to: 5 },
          { query: "hybrid search api", from: 21, to: 6 },
        ],
      },
      visibility: { from: 18, to: 31, series: [18, 19, 21, 20, 24, 27, 31] },
      traffic: { from: 2140, to: 3860, bars: [2140, 2290, 2510, 2860, 3120, 3490, 3860] },
      performance: { from: 2.1, to: 3.4, note: "Visit to signup", series: [2.1, 2.2, 2.2, 2.6, 2.9, 3.1, 3.4] },
    },
    ai: {
      // Per brand: visibility (share of answers that mention it), average position in an answer, and the tone of how it's described.
      brands: [
        { name: "Your Product", visibility: [12, 31], position: [5.1, 1.8], tone: ["Neutral", "Positive"] },
        { name: "Category Leader", visibility: [41, 36], position: [1.4, 1.6], tone: ["Positive", "Positive"] },
        { name: "Competitor A", visibility: [22, 19], position: [3.0, 3.2], tone: ["Neutral", "Neutral"] },
      ] as { name: string; visibility: number[]; position: number[]; tone: ("Positive" | "Neutral" | "Negative")[] }[],
      mentions: {
        from: 140,
        to: 612,
        models: [
          { name: "ChatGPT", mark: "chatgpt", count: [62, 268] },
          { name: "Perplexity", mark: "perplexity", count: [48, 201] },
          { name: "Claude", mark: "claude", count: [30, 143] },
        ] as { name: string; mark: Icon; count: number[] }[],
      },
      recommendations: { from: 4, to: 19, tone: [[50, 40, 10], [74, 21, 5]] }, // positive, neutral, negative, %
      citations: {
        from: 12,
        to: 94,
        sources: [
          { name: "Your docs", mark: "docs", type: "Corporate", count: [5, 41] },
          { name: "r/LocalLLaMA", mark: "reddit", type: "UGC", count: [4, 27] },
          { name: "G2", mark: "g2", type: "Reviews", count: [3, 26] },
        ] as { name: string; mark: Icon; type: string; count: number[] }[],
      },
    },
    // Where the pipeline came from: Search and AI, as a share of it (%), on day 1 and day 90. AI's share grows.
    pipelineSplit: { search: [88, 61], ai: [12, 39] },
    business: [
      { from: 128, to: 312 },
      { from: 9, to: 22 },
      { from: 48, to: 186, prefix: "$", suffix: "K" },
      { from: 12, to: 41, prefix: "$", suffix: "K" },
    ] as { from: number; to: number; prefix?: string; suffix?: string }[],
  },
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
