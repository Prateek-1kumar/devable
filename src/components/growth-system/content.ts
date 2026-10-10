// Everything the Growth System section says, in one place. Channel names follow
// growth-engine/channels.ts; edit copy here, not in the components.


export const PRODUCT = {
  eyebrow: "Technical companies",
  title: "Your Product",
  line: "An AI-native devtool or platform with real technical depth.",
  rows: [
    { icon: "cube", label: "Product", sub: "What you build" },
    { icon: "users", label: "Audience", sub: "Developers and technical users" },
    { icon: "target", label: "Market", sub: "Category and opportunity" },
  ],
} as const;

export const LINKS = {
  in: { label: "Product understanding", caption: "We understand your product and market to build the right growth strategy." },
  out: { label: "Distribution and growth", caption: "Your product shows up where developers search, learn, and build." },
} as const;

export const CHANNELS = {
  content: { n: "01", name: "Technical Content", line: "Tutorials. Blogs. Docs." },
  search: { n: "02", name: "Search + AI Visibility", line: "Rankings. Citations. Discovery." },
  reddit: { n: "03", name: "Reddit", line: "Community. Conversations. Trust." },
  creators: { n: "04", name: "Creator Distribution", line: "X. LinkedIn. Dev creators." },
} as const;

export const MOCKS = {
  article: { title: "Build a RAG pipeline with your own data", tags: ["Tutorial", "Deep dive", "Docs"] },
  search: { query: "best document parsing tools", result: "Your Product", url: "yourproduct.dev", cite: "Your Product" },
  reddit: {
    sub: "r/MachineLearning",
    age: "3d",
    title: "Best tools for processing PDFs at scale?",
    body: ["Switched to ", "Your Product", " a few weeks ago. It handles messy, multi-column layouts better than anything we tried."],
    votes: "142",
    comments: "37",
  },
  creator: {
    name: "Alex Chen",
    handle: "@alexbuilds",
    body: ["Been testing ", "Your Product", " for the past month. Really impressed with how well it handles complex document layouts."],
    link: { title: "Parse any document into clean data", url: "yourproduct.dev" },
    replies: "42",
    reposts: "128",
    likes: "1.4K",
  },
} as const;

export const OUTCOMES = {
  eyebrow: "Real outcomes",
  title: "Visibility that compounds",
  line: ["More developer reach.", "More qualified demand.", "More pipeline."],
  rows: [
    { label: "Search + AI visibility", level: 0.62 },
    { label: "Audience reach", level: 0.74 },
    { label: "Qualified demand", level: 0.84 },
  ],
  highlight: "Pipeline",
} as const;

export const LOOP = ["Learn", "Improve", "Compound"] as const;
