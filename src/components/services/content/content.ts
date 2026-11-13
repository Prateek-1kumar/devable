import type { Icon } from "../parts";

// Copy for the Technical Content service page, from the copy doc.
//
// SAMPLE DATA: the article mid-production in the hero, the reviewer comments, and the small figures inside the
// visuals (problem examples, step artifacts) are placeholders to judge the design. The three shipped articles
// are real LandingAI pieces.

export const HERO = {
  label: "Technical Content",
  title: "Technical content built for developers, search engines, and LLMs.",
  body: "We combine technical writers, engineers, and growth expertise to build content that resonates with developers, ranks in search, gets cited in AI answers, and supports pipeline.",
  primary: "Speak with the Team",
  secondary: "See Our Work",
  // The four beats of the hero's animation, from the client's brief.
  beats: ["Inputs", "Brief", "Build & review", "Published"],
  // SAMPLE: a neutral example, built from four inputs. `dot` ties each input to the brief field it becomes.
  inputs: [
    { name: "Product / feature context", mark: "github", dot: "#1f9e8f" },
    { name: "Developer pain points", mark: "stackoverflow", dot: "#3e6fd8" },
    { name: "Search + AI opportunities", mark: "google", dot: "#7a5af5" },
    { name: "Technical research", mark: "docs", dot: "#e8833a" },
  ] as { name: string; mark: Icon; dot: string }[],
  // In the order the inputs send them, so the brief fills top to bottom.
  brief: [
    { field: "Product relevance", value: "Agent evaluation tooling", input: 0 },
    { field: "Topic / angle", value: "Evaluating agents pre-launch", input: 1 },
    { field: "Search intent", value: "how to evaluate ai agents", input: 2 },
    { field: "Key technical points", value: "Test sets · traces · scoring", input: 3 },
  ],
  // The review layers added to the draft, in order.
  reviews: [
    { name: "Writer + developer input", short: "Writing" },
    { name: "SME / engineering review", short: "Engineering" },
    { name: "Editorial review", short: "Editorial" },
    { name: "Search + AI optimization", short: "Search + AI" },
  ],
  // The article the hero builds: a tag, a title and placeholder lines, nothing heavier.
  guide: { blog: "Company blog", tag: "Technical Guide", title: "How to Evaluate AI Agents Before Production" },
  article: {
    client: "LandingAI",
    title: "Splitting Multi-Document PDFs at Scale with ADE Split",
    code: "client.split(\"bundle.pdf\", classify=True)",
    intro: "Bundled scans often arrive as one 400-page PDF. ADE Split classifies every page and returns each document in one API call.",
    tested: "Tested against API v2",
    url: "landing.ai/blog/splitting-multi-document-pdfs…",
  },
  // Where the published article starts creating value.
  outcomes: [
    { name: "Developers", icon: "docs", line: "Discovering and reading it", dot: "#1f9e8f" },
    { name: "Google", icon: "google", line: "Ranking it for relevant searches", dot: "#3e6fd8" },
    { name: "AI search", icon: "chatgpt", line: "Citing or surfacing it in answers", dot: "#7a5af5" },
  ] as { name: string; icon: Icon; line: string; dot: string }[],
};

// The client quote under the hero, from the content team. The photo is a PLACEHOLDER until the real one is added at
// `photo`; until then an initials avatar shows.
export const TESTIMONIAL = {
  quote:
    "Working with Sumanth and the Devable team was a real pleasure. The content was technically sharp and written for exactly the developer audience we wanted to reach, and it drove strong, engaged traffic around our launch. Thoughtful, reliable, and easy to collaborate with, we\u2019d gladly work together again.",
  // The phrases that stay inked and get the highlight sweep; the rest of the quote sits softer. In reading order.
  lit: ["technically sharp", "strong, engaged traffic"],
  name: "Anahit Hovelyan",
  initials: "AH",
  role: "Growth Marketer",
  company: "Krisp",
  logo: "/clients/krisp.svg",
  photo: "/clients/people/krisp.jpg",
};

export const PROBLEM = {
  label: "The problem",
  title: "Developer content is easy to publish. Hard to get right.",
  items: [
    { name: "Technical depth", body: "Developers notice quickly when content is written without understanding the product or technology." },
    {
      name: "Strategic direction",
      body: "Publishing consistently means little if the topics do not align with product priorities, search demand, or what your audience actually needs.",
    },
    { name: "Distribution", body: "Even strong content needs a path to discovery across search, AI answers, communities, and the channels developers follow." },
  ],
  // The three visuals. The copy in them comes from the content team's concept images.
  visuals: {
    // One article, shallow, then built up on four layers of understanding.
    depth: {
      tag: "Technical Guide",
      shallow: { name: "Shallow content", title: "Introducing Faster Inference", layer: "Product summary" },
      deep: { name: "Technical content", title: "How Faster Inference Affects Production Workloads" },
      layers: [
        { label: "Product understanding", icon: "product" },
        { label: "API / docs", icon: "docs" },
        { label: "Developer use cases", icon: "users" },
        { label: "Edge cases", icon: "edge" },
      ],
    },
    // Product relevance against audience / search demand. `rel` and `dem` are 1 for high and 0 for low.
    direction: {
      y: { name: "Product relevance", high: "High", low: "Low" },
      x: { name: "Audience / search demand", high: "High", low: "Low" },
      topics: [
        { title: "Q3 product roadmap", rel: 1, dem: 0 },
        { title: "How to reduce inference latency in production", rel: 1, dem: 1, win: true },
        { title: "What we learned building our engineering team", rel: 0, dem: 0 },
        { title: "Top AI infrastructure trends for 2026", rel: 0, dem: 1 },
      ],
    },
    // A published article with no path to any channel.
    distribution: { badge: "Published", channels: [{ name: "Search", icon: "search" }, { name: "AI search", icon: "ai" }, { name: "Communities", icon: "people" }] },
  },
};

export const ENGINE = {
  label: "What we build",
  title: "A technical content engine built around your product.",
  body: "From strategy and research to technical production, optimization, and distribution, we run the content workflow end to end.",
  parts: [
    { name: "Strategy & Research", body: "What your audience needs, where the opportunities are, and what is worth creating." },
    { name: "Technical Production", body: "Content created by people who understand the technology behind it." },
    { name: "Search & AI Optimization", body: "Every relevant piece is structured to improve discovery across traditional and AI search." },
    { name: "Distribution & Compounding", body: "Publishing is the beginning, not the end of the content lifecycle." },
  ],
  loopNote: "Feeds the next cycle",
  // SAMPLE: the artifact shown for each stage (LandingAI topics).
  samples: {
    topics: {
      caption: "Topic priorities",
      rows: [
        { topic: "Split multi-document PDFs by type", score: 92, tag: "Gap" },
        { topic: "ADE vs. traditional OCR APIs", score: 74 },
        { topic: "Automate KYC document parsing", score: 68 },
      ],
    },
    doc: { title: "Splitting multi-document PDFs with ADE Split", code: "client.split(\"bundle.pdf\", classify=True)", check: "Run against API v2" },
    serp: {
      url: "landing.ai › blog",
      title: "Splitting Multi-Document PDFs at Scale with ADE Split",
      snippet: "Separate a bundled PDF into classified documents with one API call.",
      ai: "Use ADE Split to separate a bundled PDF into classified documents.",
      cite: "landing.ai",
    },
    channels: {
      rows: [
        { name: "Search", value: "3.1k", w: 82, mark: "google" },
        { name: "AI answers", value: "412", w: 46, mark: "chatgpt" },
        { name: "Reddit", value: "1.2k", w: 64, mark: "reddit" },
      ] as { name: string; value: string; w: number; mark: Icon }[],
      refresh: "Top performer refreshed · next brief updated",
    },
  },
};

export const PROCESS = {
  label: "How the work gets done",
  title: "From your product to publish-ready technical content.",
  // The step that sets us apart (0-based), shown raised and expanded.
  signature: 3,
  steps: [
    { name: "Understand", body: "We learn the product, audience, positioning, technical environment, and growth priorities." },
    { name: "Prioritize", body: "We identify the topics, formats, and opportunities most worth pursuing." },
    { name: "Build", body: "A technical writer or engineer researches the topic, tests the product hands-on, and writes the piece." },
    { name: "Review", body: "Technical and editorial review make sure the content is accurate, useful, and aligned with your brand." },
    { name: "Optimize & Publish", body: "The piece is optimized for search and AI visibility, then prepared for publishing and distribution." },
    { name: "Improve", body: "We track performance, refresh existing content, and use what we learn to shape the next cycle." },
  ],
  // SAMPLE: what the review catches on one draft.
  review: {
    file: "ade-split-guide.md",
    comments: [
      { who: "Editor", kind: "editorial", text: "Lead with the use case, then the API. Matches the LandingAI voice guide.", resolved: true },
      { who: "Engineer", kind: "technical", text: "Ran every snippet against API v2. Updated the split() call; v1 params were removed.", resolved: true },
      { who: "Engineer", kind: "technical", text: "Benchmark re-run on a 400-page bundle: 38s, not 52s.", resolved: true },
    ],
  },
  // SAMPLE: the artifact shown for each step.
  samples: {
    understand: {
      title: "Discovery · ADE Split",
      cmd: "curl -X POST api.landing.ai/v2/split -F file=@bundle.pdf",
      out: ['{ "documents": 3,', '  "classes": ["invoice", "id", "contract"],', '  "latency_ms": 1840 }'],
      notes: [
        { k: "Product", v: "Document extraction API" },
        { k: "Audience", v: "ML and platform engineers" },
        { k: "Positioning", v: "Agentic document intelligence" },
        { k: "Environment", v: "Python SDK · REST · API v2" },
        { k: "Priorities", v: "Developer adoption, AI citations" },
      ],
    },
    prioritize: {
      title: "Topic backlog",
      rows: [
        { topic: "ADE vs. traditional OCR APIs", format: "Comparison", score: 74 },
        { topic: "Split multi-document PDFs by type", format: "Guide", score: 92 },
        { topic: "Document AI glossary", format: "Reference", score: 31 },
        { topic: "Automate KYC document parsing", format: "Use case", score: 68 },
        { topic: "Why we built ADE", format: "Thought", score: 45 },
        { topic: "Parse invoices in Python", format: "Tutorial", score: 81 },
      ],
      cut: "Q4 plan",
    },
    build: {
      title: "Tested draft",
      lines: [
        "Bundled scans often arrive as one 400-page PDF. ADE Split classifies every page and returns each document in one API call.",
        "Install the SDK, point it at a bundle, and ask for classes. The response lists every document it found, page ranges included.",
      ],
      cmd: "python split.py bundle.pdf",
      out: ["✓ 3 documents · invoice, id, contract", "✓ 400 pages in 38s"],
      sources: ["ADE API reference", "Split changelog"],
    },
    publish: {
      title: "Publish checklist",
      checks: ["Title and meta description", "FAQ + HowTo schema", "Internal links", "Code samples as text", "Answer-first summary"],
      score: [58, 94],
      scoreLabel: "Search + AI readiness",
      url: "landing.ai/blog/splitting-multi-document-pdfs…",
      channels: ["Newsletter", "X", "Reddit"],
    },
    improve: {
      title: "Performance · last 12 weeks",
      weeks: [4, 7, 11, 12, 11, 10, 9, 22, 31, 36, 38, 41],
      refreshAt: 7,
      refreshLabel: "Refreshed for API v2",
      queue: [
        { title: "Splitting PDFs guide", note: "Rank 9 → 3 after refresh" },
        { title: "KYC parsing walkthrough", note: "Update for new fields" },
        { title: "OCR vs. ADE comparison", note: "Add benchmark" },
      ],
      next: "Learnings go into the next brief",
    },
  },
};

export type Shipped = { client: string; logo: string; type: "guide" | "use-case" | "thought"; typeLabel: string; title: string; body: string; href: string };

// Real articles. Add a card by adding an entry; `type` picks the card's cover.
export const SHIPPED = {
  label: "Content we've shipped",
  title: "Technical content in production.",
  articles: [
    {
      client: "LandingAI",
      logo: "/clients/landingai.png",
      type: "guide",
      typeLabel: "Technical guide",
      title: "Splitting Multi-Document PDFs at Scale with ADE Split",
      body: "A hands-on walkthrough for separating bundled PDFs into classified documents through the API.",
      href: "https://landing.ai/blog/splitting-multi-document-pdfs-at-scale-with-ade-split",
    },
    {
      client: "LandingAI",
      logo: "/clients/landingai.png",
      type: "use-case",
      typeLabel: "Use-case content",
      title: "How to Automate KYC Document Parsing at Scale with ADE",
      body: "How layout-aware extraction speeds up identity and onboarding workflows in finance.",
      href: "https://landing.ai/blog/how-to-automate-kyc-document-parsing-at-scale-with-ade",
    },
    {
      client: "LandingAI",
      logo: "/clients/landingai.png",
      type: "thought",
      typeLabel: "Thought leadership",
      title: "OCR to Agentic Document Extraction: The Evolution of Document Intelligence",
      body: "How document processing evolved from OCR to agentic extraction, and why the shift matters now.",
      href: "https://landing.ai/blog/ocr-to-agentic-document-extraction-a-look-into-the-evolution-of-document-intelligence",
    },
  ] as Shipped[],
};

export const TYPES = {
  label: "Content types",
  title: "Built for every stage of developer discovery and adoption.",
  types: [
    { name: "Technical Articles", body: "Deep technical content around problems your audience is actively trying to solve." },
    { name: "Tutorials & Developer Guides", body: "Hands-on education showing developers how to build, integrate, and solve real problems." },
    { name: "Product-Led Content", body: "Content that teaches something useful while naturally showing where your product fits." },
    { name: "Comparisons & Alternatives", body: "High-intent pages helping developers understand how products and approaches differ." },
    { name: "Integration Content", body: "Practical content around the technologies, frameworks, and ecosystems your product connects with." },
    { name: "Thought Leadership", body: "Technical perspectives, industry shifts, and ideas worth associating with your brand." },
  ],
};

export const WAYS = {
  label: "Ways to work with us",
  title: "Plug us into your content team or hand us the engine.",
  options: [
    {
      name: "Full Content Program",
      body: "We own the content engine from strategy through execution, optimization, and distribution.",
      listLabel: "Best for teams that need support across:",
      items: ["Strategy and research", "Editorial planning", "Technical content production", "SEO and AI optimization", "Distribution", "Reporting and iteration"],
    },
    {
      name: "Extend Your Content Team",
      body: "Already have a strategy or internal content lead? We plug into your existing workflow and add the technical expertise and production capacity you need.",
      listLabel: "Depending on your setup, we can support:",
      items: ["Technical writing and tutorials", "Code examples and demos", "Technical review", "SEO/GEO optimization", "Content refreshes", "Additional production capacity"],
    },
  ],
  // Who runs each stage of the engine under each option (drawn as an ownership strip on each card).
  ownership: {
    stages: ["Strategy", "Planning", "Production", "Review", "Optimization", "Distribution"],
    full: ["us", "us", "us", "us", "us", "us"],
    extend: ["you", "you", "us", "us", "us", "you"],
  } as { stages: string[]; full: ("us" | "you")[]; extend: ("us" | "you")[] },
  pilot: { title: "Not sure yet?", body: "Start with a pilot article and judge the work on your own product." },
};

export const CTA = {
  title: "Build a content engine developers actually want to read.",
  body: "Tell us what you are building and where you want content to contribute to growth. We will help identify the highest-impact opportunities.",
  button: "Speak with the Team",
};
