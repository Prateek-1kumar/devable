// Everything the Devable Growth System band says, in one place. Card copy is the client's, verbatim.
//
// SAMPLE: the search query and results, the blog post, and the Reddit thread are illustrative ("Your Product"
// stands in for the client's product). The X post is real: https://x.com/kimmonismus/status/2105911541384224800

export const HEAD = {
  title: "The Devable Growth System",
  sub: "Technical expertise and distribution for visibility, awareness, qualified demand, and pipeline.",
};

/** What the status line under the heading says at each beat of the scroll. */
export const BEATS = [
  "Scroll to see how it works",
  "01 / 04 \u00b7 Technical Content",
  "02 / 04 \u00b7 Search + AI Visibility",
  "03 / 04 \u00b7 Influencer Marketing",
  "04 / 04 \u00b7 Reddit",
  "Built on product understanding",
  "One system, compounding outcomes",
];

export const INPUTS = {
  label: "Product understanding",
  rows: [
    { icon: "cube", name: "Product", line: "Use cases · Differentiation · Technical depth" },
    { icon: "users", name: "Audience", line: "Developers · Users · Technical buyers" },
    { icon: "target", name: "Market", line: "Category · Competitors · Demand" },
  ],
} as const;

export const OUTCOMES = {
  label: "Business outcomes",
  rows: [
    { icon: "search", name: "Search + AI visibility" },
    { icon: "users", name: "Audience reach" },
    { icon: "target", name: "Qualified demand" },
    { icon: "bars", name: "Pipeline" },
  ],
} as const;

export const CONTENT = {
  name: "Technical Content",
  line: "Built for developers, search engines, and LLMs.",
  steps: [
    { icon: "folder", name: "Inputs" },
    { icon: "doc", name: "Brief" },
    { icon: "code", name: "Build & Review" },
    { icon: "rocket", name: "Published" },
  ],
  post: {
    tag: "Tutorial",
    title: "How to Turn Any Website Into LLM-Ready Data",
    site: "yourproduct.dev/blog",
    read: "8 min read",
  },
} as const;

export const SEARCH = {
  name: "Search + AI Visibility",
  line: "Win the searches and AI answers that shape decisions.",
  engines: [
    { mark: "chatgpt", name: "ChatGPT" },
    { mark: "google", name: "Google" },
    { mark: "claude", name: "Claude" },
    { mark: "gemini", name: "Gemini" },
    { mark: "perplexity", name: "Perplexity" },
  ],
  query: "best document parsing tools",
  result: {
    site: "yourproduct.dev",
    title: "Your Product – Document Parsing API",
    snippet: "Parse PDFs, tables, and complex layouts for AI workflows.",
  },
  overview: ["", "Your Product", " supports layout-aware parsing for PDFs, tables, and forms."],
} as const;

export const CREATORS = {
  name: "Influencer Marketing",
  line: "Creators. Campaigns. Distribution.",
  post: {
    name: "Chubby♨️",
    handle: "@kimmonismus",
    date: "Oct 2",
    avatar: "/growth-system/chubby.jpg",
    media: "/growth-system/webai-post.png",
    text: "webAI has released a 3.66B model for formal logic that can run locally on a laptop.\n\nIn webAI’s tests, TwIL-LM3-Pro is roughly level with Qwen3-8B on the headline formal-logic composite, with less than half the parameters.",
    // Replies and likes are the post's public counts (2026-11-18).
    // TODO(client): reposts and views aren't in X's public data. Replace these placeholders with the numbers
    // from a screenshot of the live post.
    stats: { replies: 22, reposts: 31, likes: 142, views: 18000 },
  },
} as const;

export const REDDIT = {
  name: "Reddit",
  line: "Community. Conversations. Trust.",
  thread: {
    sub: "r/MachineLearning",
    age: "3d ago",
    title: "What are people using for evals once agents hit prod?",
    votes: 312,
    comments: 48,
  },
  comment: {
    user: "u/mlops_dan",
    age: "2d",
    text: ["We moved off internal scripts once the eval set got big. ", "Your Product", "’s been solid so far."],
    votes: 74,
  },
} as const;
