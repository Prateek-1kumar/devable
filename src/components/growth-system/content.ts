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
    { mark: "stackoverflow", label: "Tables break in RAG?", note: "Dev pain" },
    { mark: "google", label: "website to llm data", note: "2.9K/mo" },
    { mark: "docs", label: "docs/quickstart", note: "Research" },
  ],
  title: "How to Turn Any Website Into LLM-Ready Data",
  outline: ["Crawl the site", "Clean and convert to Markdown", "Chunk for retrieval"],
  draft: "Most RAG failures start before retrieval: messy HTML and lost tables.",
  code: [
    [["const ", "#8a63d2"], ["pages", "#24352b"], [" = ", "#7a857e"], ["await ", "#8a63d2"], ["crawl", "#12894b"], ["(url)", "#5b6a61"]],
    [["const ", "#8a63d2"], ["docs", "#24352b"], [" = ", "#7a857e"], ["toMarkdown", "#12894b"], ["(pages)", "#5b6a61"]],
    [["const ", "#8a63d2"], ["chunks", "#24352b"], [" = ", "#7a857e"], ["chunk", "#12894b"], ["(docs)", "#5b6a61"]],
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
  // The answer, kept visual: Your Product as the top pick (a short tag and its sources), the rest faded out.
  pick: { name: "Your Product", tag: "Best for RAG parsing", sources: ["yourproduct.dev", "r/LocalLLaMA"] },
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
  // David Stout's post announcing TwIL-8B: https://x.com/Davidstout/status/2118035011236397350
  // Shown as X's post view, cut where X folds a long post ("Show more"). The post's video is left out to keep
  // the card compact.
  post: {
    name: "David Stout",
    handle: "@Davidstout",
    avatar: "/growth-system/david-stout.jpg",
    time: "5:37 PM · Nov 4, 2026",
    paragraphs: ["Modest intelligence is arriving faster than most people realize.", "Today, we\u2019re open-sourcing TwIL-8B."],
    // The post's public counts (2026-11-19).
    stats: { replies: 167, reposts: 321, likes: 3460, bookmarks: 4440, views: 902716 },
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
