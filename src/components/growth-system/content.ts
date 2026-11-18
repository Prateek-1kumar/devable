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

// SAMPLE: one tutorial's journey from inputs to a live post. The inputs follow the Technical Content page
// (product context, developer pain points, search + AI opportunities, technical research).
export const CONTENT = {
  name: "Technical Content",
  line: "Built for developers, search engines, and LLMs.",
  steps: [
    { icon: "folder", name: "Inputs", status: "Gathering inputs" },
    { icon: "doc", name: "Brief", status: "Brief" },
    { icon: "code", name: "Build & Review", status: "In review" },
    { icon: "rocket", name: "Published", status: "Published" },
  ],
  file: "content / llm-ready-data.md",
  sources: [
    { mark: "github", label: "your-org/parser", note: "Product" },
    { mark: "stackoverflow", label: "Keep table structure in RAG?", note: "Dev pain" },
    { mark: "google", label: "website to llm data", note: "2.9K/mo" },
    { mark: "docs", label: "docs/quickstart", note: "Research" },
  ],
  title: "How to Turn Any Website Into LLM-Ready Data",
  outline: ["Crawl the site", "Clean and convert to Markdown", "Chunk for retrieval"],
  draft: "Most RAG failures start before retrieval: messy HTML and lost tables.",
  code: [
    [["const ", "#7dd3fc"], ["pages", "#e5f2ea"], [" = await ", "#7dd3fc"], ["crawl", "#86efac"], ["(url)", "#e5f2ea"]],
    [["const ", "#7dd3fc"], ["docs", "#e5f2ea"], [" = ", "#7dd3fc"], ["toMarkdown", "#86efac"], ["(pages)", "#e5f2ea"]],
  ],
  review: { who: "AK", role: "Engineering", text: "Verified against the v2 API" },
  page: {
    url: "yourproduct.dev/blog/llm-ready-data",
    tag: "Tutorial",
    author: "Your Team",
    date: "Nov 18",
    read: "8 min read",
  },
  signals: { reads: 2400, rank: 3 },
} as const;

// SAMPLE: one buyer question, answered in ChatGPT, then recommended across the other engines. Competitor names
// are neutral on purpose.
export const SEARCH = {
  name: "Search + AI Visibility",
  line: "Win the searches and AI answers that shape decisions.",
  prompt: "What are the best document parsing tools for RAG?",
  lead: "Here are the strongest options right now:",
  picks: [
    { name: "Your Product", text: "layout-aware parsing for PDFs, tables and forms, built for RAG pipelines.", sources: ["yourproduct.dev", "r/LocalLLaMA"] },
    { name: "Competitor A", text: "solid OCR, weaker on complex tables." },
  ],
  searched: 4,
  engines: [
    { key: "chatgpt", mark: "chatgpt", name: "ChatGPT" },
    { key: "perplexity", mark: "perplexity", name: "Perplexity" },
    { key: "gemini", mark: "gemini", name: "Gemini" },
    { key: "claude", mark: "claude", name: "Claude" },
    { key: "grok", mark: "grok", name: "Grok" },
    { key: "google", mark: "google", name: "Google AI Overviews" },
  ],
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
