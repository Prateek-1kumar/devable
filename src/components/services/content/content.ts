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
  body: "From research to distribution, we turn your product depth into content that developers trust, discover, and keep coming back to.",
  parts: [
    { name: "Strategy & Research", body: "Find the right topics and angles from your product, users, and market demand." },
    { name: "Technical Production", body: "Turn product depth into clear, accurate, and developer-friendly content." },
    { name: "Search & AI Optimization", body: "Make your content discoverable on Google and across AI search." },
    { name: "Distribution & Compounding", body: "Get the content in front of the right audiences and build long-term visibility." },
  ],
};

export const PROCESS = {
  label: "How the work gets done",
  title: "From your product to publish-ready technical content.",
  body: "A focused, end-to-end process that turns product understanding into content with real reach and impact.",
  // The six steps, in order; the copy is from the content team's board.
  steps: [
    { name: "Understand", body: "We learn the product, audience, positioning, technical environment, and growth priorities." },
    { name: "Prioritize", body: "We identify high-impact topics and create a focused content plan based on demand and opportunity." },
    { name: "Build", body: "We turn product depth into clear, accurate, and developer-friendly content." },
    { name: "Review", body: "We review for technical accuracy, clarity, and search and AI visibility." },
    { name: "Optimize & Publish", body: "We optimize for search and AI, then publish across the right surfaces." },
    { name: "Improve", body: "We track performance, learn from results, and keep compounding what works." },
  ],
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
  // `tag` is the mono label on each column's header strip. The copy is from the content team's board.
  types: [
    { tag: "Technical Articles", name: "Technical Articles", body: "In-depth content that explains concepts, solves problems, and ranks for high-intent searches." },
    { tag: "Tutorials & Guides", name: "Tutorials & Developer Guides", body: "Hands-on, step-by-step content that shows developers how to build and integrate." },
    { tag: "Product-Led Content", name: "Product-Led Content", body: "Use cases and workflows that demonstrate real product value." },
    { tag: "Comparisons", name: "Comparisons & Alternatives", body: "Objective, technical comparisons that help buyers evaluate options with confidence." },
    { tag: "Integration Content", name: "Integration Content", body: "Implementation guides, APIs, and tutorials for popular tools and platforms." },
    { tag: "Thought Leadership", name: "Thought Leadership", body: "Technical perspectives on market trends, new approaches, and what's next in the space." },
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
