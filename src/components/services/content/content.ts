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
  // The workflow from the copy doc's design direction, in order.
  stages: ["Research", "Technical brief", "Build & test", "Editorial review", "Publish", "Search, AI & distribution"],
  // SAMPLE: the article moving through it (a real LandingAI guide we shipped).
  article: {
    client: "LandingAI",
    title: "Splitting Multi-Document PDFs at Scale with ADE Split",
    sources: ["ADE API reference", "Split endpoint changelog"],
    code: "client.split(\"bundle.pdf\", classify=True)",
    review: "Tested against API v2 · output verified",
    surfaces: ["google", "chatgpt", "reddit"] as Icon[],
    // SAMPLE: how each of its three readers (the headline's developers, search engines, LLMs) uses it.
    readers: {
      developer: { cmd: "python split.py bundle.pdf", out: "3 documents · invoice, id, contract" },
      search: { query: "split multi-document pdf", url: "landing.ai › blog" },
      llm: { answer: "Use ADE Split to separate a bundled PDF into classified documents through one API call.", cite: "landing.ai" },
    },
  },
};

export const PROBLEM = {
  label: "The problem",
  title: "Developer content is easy to publish. Hard to get right.",
  items: [
    {
      name: "Technical depth",
      body: "Developers notice quickly when content is written without understanding the product or technology.",
      // SAMPLE: the tell, a code sample that doesn't run.
      example: { code: "client.parse(file, mode=\"auto\")", error: "TypeError: unexpected keyword 'mode'" },
    },
    {
      name: "Strategic direction",
      body: "Publishing consistently means little if the topics do not align with product priorities, search demand, or what your audience actually needs.",
      // SAMPLE: a busy calendar of topics nobody searches for.
      example: [
        { topic: "5 AI trends for 2026", demand: 6 },
        { topic: "Why we love our team", demand: 2 },
        { topic: "Our Q3 product recap", demand: 4 },
      ],
    },
    {
      name: "Distribution",
      body: "Even strong content needs a path to discovery across search, AI answers, communities, and the channels developers follow.",
      // SAMPLE: a good article, published to silence.
      example: { title: "Deep dive: streaming inference", views: "212 views", days: "90 days" },
    },
  ],
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
