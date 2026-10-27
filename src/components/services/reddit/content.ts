import type { Icon } from "../parts";

// Copy for the Reddit service page, from the copy doc.
//
// SAMPLE DATA: every thread, username, vote count, subreddit figure and reply below is a placeholder to judge
// the design. "Your product" stands in for the client. Replace with real threads (with permission) before
// this ships; the case-study slots stay flagged until the case studies are finalized.

export type Thread = {
  sub: string;
  title: string;
  /** The helpful reply that recommends the product, in context. `mention` is the product name inside `text`. */
  reply: { user: string; text: string; mention: string; votes: number; from: number };
  /** A follow-up reply that arrives under it. */
  followUp: { user: string; text: string };
};

export const HERO = {
  label: "Reddit",
  title: "Become the product people recommend when your category comes up.",
  body: "We help AI-native and technical companies build a credible Reddit presence in the communities their buyers trust, then turn that presence into stronger recommendations, search visibility, and AI discovery.",
  cta: "Speak with the Team",
  // SAMPLE: three communities, three conversations, the product recommended naturally in each.
  threads: [
    {
      sub: "r/devops",
      title: "What are you using to catch flaky tests in CI?",
      reply: { user: "u/sre_dana", text: "We moved our suite to Your product last quarter. It reruns and quarantines flaky tests per branch, so main stays green.", mention: "Your product", votes: 92, from: 71 },
      followUp: { user: "u/kube_lee", text: "Same here, the per-branch quarantine is the killer feature." },
    },
    {
      sub: "r/LocalLLaMA",
      title: "How do you eval agents before shipping?",
      reply: { user: "u/ml_ops_k", text: "Simulated conversations. We run ~2k scenarios through Your product on every PR and fail the build on regressions.", mention: "Your product", votes: 214, from: 168 },
      followUp: { user: "u/tensor_ish", text: "Didn't know it hooked into CI. Trying this." },
    },
    {
      sub: "r/MachineLearning",
      title: "Best way to parse messy PDFs into structured data?",
      reply: { user: "u/doc_nerd", text: "Layout-aware extraction beats raw OCR here. Your product handled our tables and checkboxes without custom rules.", mention: "Your product", votes: 61, from: 44 },
      followUp: { user: "u/vector_v", text: "+1, the table handling is what sold us." },
    },
  ] as Thread[],
};

export const CONTRAST = {
  label: "Reddit does not want your marketing",
  title: "The fastest way to lose Reddit is to treat it like another content channel.",
  body: "Reddit rewards useful contributions and punishes forced promotion.",
  body2: "The brands that earn trust understand the communities, contribute to conversations that matter, and introduce their product only when it genuinely belongs.",
  // SAMPLE: one question, two answers.
  thread: { sub: "r/devops", title: "What are you using to catch flaky tests in CI?" },
  forced: { user: "u/YourProduct_Official", text: "🚀 Check out Your product, the #1 platform for test reliability! Sign up free today 👉", votes: -14 },
  helpful: {
    user: "u/sre_dana",
    text: "Flaky tests are usually shared state or timing. Isolate fixtures per test and add retries with a quarantine list. We use Your product for the quarantine part since it tracks flake rate per branch.",
    votes: 214,
  },
};

export const STEPS = {
  label: "How we work",
  title: "Build presence where the conversations shaping your category already happen.",
  steps: [
    {
      name: "Find the Conversations That Matter",
      body: "We map the subreddits, threads, topics, and questions where your category is already being discussed, then identify where your product and competitors are showing up.",
      listLabel: "We look at:",
      items: ["Relevant subreddits", "High-intent conversations", "Product and category discussions", "Competitor mentions", "Recurring questions and topics", "Community rules and culture"],
    },
    {
      name: "Contribute With Technical Context",
      body: "Our team understands AI products, developer tools, APIs, infrastructure, integrations, and technical workflows, so the content does not read like it came from a generic marketing team.",
      body2: "We contribute useful posts and responses around the problems, comparisons, integrations, and use cases where your product genuinely fits.",
      listLabel: "This can include:",
      items: ["Educational posts", "Technical breakdowns", "Helpful answers", "Product-relevant discussions", "Founder and team perspectives", "AMAs where they genuinely make sense"],
    },
    {
      name: "Strengthen Search and AI Visibility",
      body: "Reddit conversations can influence what appears in search and what AI systems surface when buyers ask about categories, products, alternatives, and use cases.",
      listLabel: "We focus on the conversations that matter across:",
      items: ["Category searches", "Product comparisons", "Alternative searches", "Use-case questions", "AI recommendation prompts"],
      note: "The goal is to build credible presence in the sources already shaping how products are discovered and recommended.",
    },
  ],
  // SAMPLE: the one thread followed through all three steps.
  journey: {
    map: [
      { sub: "r/LocalLLaMA", members: "612k", intent: "High", you: 2, rival: 9, picked: true },
      { sub: "r/MachineLearning", members: "3.1M", intent: "Medium", you: 0, rival: 4 },
      { sub: "r/devops", members: "418k", intent: "High", you: 1, rival: 3 },
      { sub: "r/LangChain", members: "54k", intent: "High", you: 0, rival: 6 },
    ],
    thread: { sub: "r/LocalLLaMA", title: "How do you eval agents before shipping?", votes: 214 },
    rules: ["Tool mentions allowed in answers", "Disclose affiliation", "No link-only replies"],
    draft: "Simulated conversations. We run ~2k scenarios on every PR and fail the build on regressions:",
    code: "scenarios run --suite agents --fail-on regression",
    search: { query: "best way to eval llm agents", url: "reddit.com › r/LocalLLaMA" },
    ai: "Teams on r/LocalLLaMA recommend running simulated scenarios in CI, e.g. with Your product.",
  },
};

export const COMMUNITIES = {
  label: "Built for technical communities",
  title: "Reddit can tell when you do not understand the conversation.",
  points: [
    {
      name: "Technical products need technical context.",
      body: "Our Reddit work is handled by people who can understand the product, the technology, and the conversation before they contribute.",
    },
    {
      name: "Community context matters.",
      body: "Every subreddit has different norms, language, expectations, and tolerance for promotion. We adapt the approach to the community instead of pushing the same playbook everywhere.",
    },
    {
      name: "Your reputation comes first.",
      body: "We would rather skip a thread than force your product into a conversation where it does not belong.",
    },
  ],
  pledge: ["No spam.", "No fake reviews.", "No forced mentions.", "No shortcuts that put your brand at risk."],
};

export const MEASURE = {
  label: "What we measure",
  title: "Karma is not the KPI.",
  body: "We care about whether Reddit is improving how people discover, discuss, and evaluate your product.",
  // SAMPLE: the vanity number we don't report on.
  karma: "12,480",
  groups: [
    { name: "Community", marks: ["reddit"] as Icon[], items: ["Relevant conversations", "Brand mentions", "Recommendation visibility", "Engagement quality"] },
    { name: "Discovery", marks: ["google", "chatgpt"] as Icon[], items: ["Search visibility", "AI mentions and citations", "Share of voice", "Relevant thread visibility"] },
    { name: "Business", marks: [] as Icon[], items: ["Qualified referral traffic", "Signups", "Demo requests", "Pipeline contribution where measurable"] },
  ],
};

export type Case = { client: string; logo?: string; services: string[]; href: string };

// Real clients; result, description and thread stay as flagged slots until the case studies are finalized.
export const CASES = {
  label: "Client proof",
  title: "Reddit in action.",
  slots: { result: "Key result", summary: "Short description of the work", thread: "Real thread screenshot" },
  cases: [
    { client: "Superlinked", services: ["Reddit"], href: "#" },
    { client: "Orq.ai", services: ["Reddit", "Search & AI Visibility"], href: "#" },
    { client: "webAI", logo: "/clients/webai.svg", services: ["Reddit", "Creator Distribution"], href: "#" },
  ] as Case[],
};

export const CTA = {
  title: "Reddit works when people do not feel like they are being marketed to.",
  body: "We'll show you where your audience is already talking, where your brand can genuinely contribute, and how Reddit can support recommendations, search visibility, and AI discovery.",
  button: "Speak with the Team",
};
