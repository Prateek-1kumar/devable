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
  // SAMPLE: one article (a real LandingAI guide we shipped) built from four inputs. `dot` ties each input to the
  // brief field it becomes.
  inputs: [
    { name: "Product context", detail: "POST /v2/split", mark: "github", dot: "#1f9e8f" },
    { name: "Developer pain points", detail: "“Bundled PDFs break our parser”", mark: "stackoverflow", dot: "#3e6fd8" },
    { name: "Search + AI opportunities", detail: "split pdf api · 2.4k / mo", mark: "google", dot: "#7a5af5" },
    { name: "Technical research", detail: "ADE Split changelog", mark: "docs", dot: "#e8833a" },
  ] as { name: string; detail: string; mark: Icon; dot: string }[],
  // In the order the inputs send them, so the brief fills top to bottom.
  brief: [
    { field: "Product relevance", value: "ADE Split endpoint", input: 0 },
    { field: "Topic / angle", value: "Splitting bundled PDFs", input: 1 },
    { field: "Search intent", value: "how to split a pdf by type", input: 2 },
    { field: "Key technical points", value: "split() · classify=True", input: 3 },
  ],
  // The review layers added to the draft, in order.
  reviews: [
    { name: "Writer + developer input", short: "Writer + dev", note: "A technical writer and a developer draft it from the brief." },
    { name: "SME / engineering review", short: "Engineering", note: "An engineer runs every snippet against the product." },
    { name: "Editorial review", short: "Editorial", note: "An editor sharpens the structure, voice and claims." },
    { name: "Search + AI optimization", short: "Search + AI", note: "Structured to rank in search and be cited in AI answers." },
  ],
  article: {
    client: "LandingAI",
    title: "Splitting Multi-Document PDFs at Scale with ADE Split",
    code: "client.split(\"bundle.pdf\", classify=True)",
    intro: "Bundled scans often arrive as one 400-page PDF. ADE Split classifies every page and returns each document in one API call.",
    tested: "Tested against API v2",
    url: "landing.ai/blog/splitting-multi-document-pdfs…",
  },
  // Where the published article starts creating value (`proof` is SAMPLE).
  outcomes: [
    { name: "Developers", icon: "docs", line: "read it, run the code", proof: "✓ 3 documents · split.py" },
    { name: "Google", icon: "google", line: "ranks it for the query", proof: "#1 · split multi-document pdf" },
    { name: "AI tools", icon: "chatgpt", line: "cite it as the source", proof: "Cited · landing.ai" },
  ] as { name: string; icon: Icon; line: string; proof: string }[],
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
  // SAMPLE: the artifact beside each failure.
  examples: {
    // The tell: a code sample that doesn't run.
    depth: {
      file: "quickstart.py",
      pre: "client = Client(api_key=KEY)",
      code: "result = client.parse(file, mode=\"auto\")",
      broken: "mode=\"auto\"",
      cmd: "python quickstart.py",
      error: "TypeError: parse() got an unexpected keyword argument 'mode'",
    },
    // A busy calendar of topics nobody searches for.
    direction: [
      { day: "Mon", topic: "5 AI trends for 2026", searches: 30, demand: 6 },
      { day: "Wed", topic: "Why we love our team", searches: 10, demand: 2 },
      { day: "Fri", topic: "Our Q3 product recap", searches: 20, demand: 4 },
    ],
    // A good article, published to silence.
    distribution: { title: "Deep dive: streaming inference", views: 212, days: 90, channels: ["google", "chatgpt", "reddit"] as Icon[] },
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
