import type { Icon } from "../parts";

// Copy for the Reddit service page, from the copy doc.
//
// SAMPLE DATA: every thread, username, vote count, subreddit figure and reply below is a placeholder to judge
// the design. "Your product" stands in for the client. Replace with real threads (with permission) before
// this ships; the case-study slots stay flagged until the case studies are finalized.

/** A stretch of a comment. `product` is the product's name, `point` is the useful part the reader should notice. */
export type Part = { t: string; mark?: "product" | "point" };

export type Thread = {
  sub: string;
  /** What kind of conversation it is, for the screen-reader description. */
  kind: string;
  /** The question that started the thread. */
  title: string;
  /** The thread's own score and size. */
  meta: { score: string; comments: number };
  /** The helpful comment: useful first, the product second. `badge` is set where it earned one. */
  reply: { user: string; age: string; parts: Part[]; votes: number; from: number; badge?: "Top comment" | "OP replied" };
  /** What sits under it: a reply shown in full, or only how many replies there are. */
  under: { user: string; text: string; op?: boolean } | { replies: number };
};

export const HERO = {
  label: "Reddit",
  title: "Become the product people recommend when your category comes up.",
  body: "We help AI-native and technical companies build a credible Reddit presence in the communities their buyers trust, then turn that presence into stronger recommendations, search visibility, and AI discovery.",
  cta: "Speak with the Team",
  // SAMPLE: three kinds of real conversation (a category recommendation, a problem someone is solving, an
  // experience comparing options), each with a useful comment that mentions the product second. They differ on
  // purpose in length, votes, age and what sits under the comment, so the row doesn't read as a template.
  threads: [
    {
      sub: "r/LocalLLaMA",
      kind: "a recommendation thread",
      title: "Anyone here doing evals for agents before pushing to prod? Curious what you’re using.",
      meta: { score: "312", comments: 48 },
      reply: {
        user: "u/ml_ops_k",
        age: "4h",
        parts: [
          { t: "We ended up using " },
          { t: "Your Product", mark: "product" },
          { t: " after trying a couple of internal scripts. " },
          { t: "The useful part for us was being able to run the same eval set on every release and catch regressions before they hit prod.", mark: "point" },
          { t: " Took a bit of setup, but it’s been solid." },
        ],
        votes: 214,
        from: 168,
        badge: "Top comment",
      },
      under: { user: "u/tensor_ish", text: "Same here. One eval set on every release is the whole point." },
    },
    {
      sub: "r/MachineLearning",
      kind: "a problem-solving thread",
      title: "How are people handling multi-document PDFs in production?",
      meta: { score: "1.2k", comments: 96 },
      reply: {
        user: "u/doc_nerd",
        age: "1d",
        parts: [
          { t: "We stopped treating the whole bundle as one document. Now we split it first, classify the docs, then run extraction separately. " },
          { t: "Your Product", mark: "product" },
          { t: " " },
          { t: "handled the layout-heavy stuff better than the OCR pipeline we had before, especially tables and checkboxes.", mark: "point" },
        ],
        votes: 87,
        from: 61,
        badge: "OP replied",
      },
      under: { user: "u/pdf_pipeline", text: "Splitting first is the part we skipped. Trying this.", op: true },
    },
    {
      sub: "r/llms",
      kind: "an experience thread",
      title: "Anyone using AI observability tools in prod? Which ones are actually useful?",
      meta: { score: "87", comments: 23 },
      reply: {
        user: "u/agent_dev",
        age: "2d",
        parts: [
          { t: "We tried a few. " },
          { t: "Your Product", mark: "product" },
          { t: " " },
          { t: "has been the easiest one to keep around so far, mostly because the tracing is useful without adding a ton of noise.", mark: "point" },
          { t: " Still not perfect for really custom workflows, but for normal agent debugging it’s been solid." },
        ],
        votes: 38,
        from: 24,
      },
      under: { replies: 3 },
    },
  ] as Thread[],
};

export const CONTRAST = {
  label: "Reddit does not want your marketing",
  title: "The fastest way to lose Reddit is to treat it like another content channel.",
  body: "Reddit rewards useful contributions and punishes forced promotion.",
  body2: "The brands that earn trust understand the communities, contribute to conversations that matter, and introduce their product only when it genuinely belongs.",
  // SAMPLE: one question, two answers. The useful one is upvoted to the top; the plug is downvoted, then collapsed.
  thread: { sub: "r/MachineLearning", title: "How are people handling scanned PDFs with tables and mixed layouts in production?", meta: { score: "1.8k", comments: 112 } },
  helpful: {
    user: "u/layout_nerd",
    age: "2h",
    parts: [
      { t: "We stopped relying on plain OCR for this. For messy PDFs, especially invoices and forms, layout-aware parsing made a big difference. We’re using " },
      { t: "Your Product", mark: "product" },
      { t: " for the extraction step now and " },
      { t: "it’s been much more reliable on tables, checkboxes, and multi-column docs.", mark: "point" },
    ] as Part[],
    votes: 214,
    from: 1,
  },
  forced: { user: "u/YourProduct_Official", age: "1m", text: "🚀 Your Product is the #1 Document AI platform for OCR and extraction. Try it free today.", votes: -14, from: 1 },
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
