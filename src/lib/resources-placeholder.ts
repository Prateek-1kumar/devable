// PLACEHOLDER CONTENT. Stand-ins so the layouts can be judged with realistic lengths; none of these
// articles exist. Delete this file once src/lib/resources.ts reads from Sanity.

import type { Author, Guide, Post, Resource, Topic } from "./resources";

const T = {
  search: { slug: "search-ai-visibility", title: "Search & AI Visibility", tone: "green" },
  creators: { slug: "influencer-marketing", title: "Influencer Marketing", tone: "orange" },
  community: { slug: "reddit-community", title: "Reddit & Community", tone: "sage" },
  technical: { slug: "technical-content", title: "Technical Content", tone: "ink" },
} satisfies Record<string, Topic>;

export const TOPICS: Topic[] = [T.search, T.creators, T.community, T.technical];

const TEAM: Author = { name: "Devable Team", avatar: "/brand/devable-mark.png" };

const post = (p: Omit<Post, "kind" | "author" | "featured"> & { featured?: boolean }): Post => ({
  kind: "post",
  author: TEAM,
  featured: false,
  ...p,
});

export const POSTS: Post[] = [
  post({
    slug: "how-developers-find-tools-in-ai-answers",
    title: "How developers actually find tools in AI answers",
    excerpt: "What shows up when an engineer asks ChatGPT or Perplexity for a recommendation, and what decides which products get named.",
    topic: T.search,
    publishedAt: "2026-10-28",
    readMinutes: 9,
    featured: true,
  }),
  post({
    slug: "technical-creator-partnerships",
    title: "What makes a technical creator partnership work",
    excerpt: "The briefs, formats and expectations that separate a real launch from a sponsored mention nobody remembers.",
    topic: T.creators,
    publishedAt: "2026-10-22",
    readMinutes: 7,
    featured: true,
  }),
  post({
    slug: "earning-trust-on-reddit",
    title: "Earning trust on Reddit without getting banned",
    excerpt: "Developers can smell marketing from a mile away. How to show up in the threads that matter as a useful participant.",
    topic: T.community,
    publishedAt: "2026-10-16",
    readMinutes: 8,
    featured: true,
  }),
  post({
    slug: "docs-as-a-growth-channel",
    title: "Docs as a growth channel",
    excerpt: "Your documentation is read by more evaluators than your homepage. Treating it like it.",
    topic: T.technical,
    publishedAt: "2026-10-12",
    readMinutes: 11,
  }),
  post({
    slug: "share-of-voice-in-llm-answers",
    title: "Measuring share of voice in LLM answers",
    excerpt: "A practical way to track how often, and how well, models describe your product against the alternatives.",
    topic: T.search,
    publishedAt: "2026-10-06",
    readMinutes: 6,
  }),
  post({
    slug: "briefing-a-developer-creator",
    title: "Briefing a developer creator: what to include",
    excerpt: "Enough context to be accurate, enough freedom to sound like themselves. A template we keep coming back to.",
    topic: T.creators,
    publishedAt: "2026-09-29",
    readMinutes: 5,
  }),
  post({
    slug: "subreddits-that-matter-for-devtools",
    title: "Which subreddits matter for devtools",
    excerpt: "Where buying conversations happen, which communities to leave alone, and how to tell the difference.",
    topic: T.community,
    publishedAt: "2026-09-22",
    readMinutes: 6,
  }),
  post({
    slug: "tutorials-that-rank-and-get-used",
    title: "Writing tutorials that rank and get used",
    excerpt: "Search intent, working code and a clear finish line: the three things every tutorial we publish has to pass.",
    topic: T.technical,
    publishedAt: "2026-09-15",
    readMinutes: 9,
  }),
  post({
    slug: "programmatic-pages-for-developer-products",
    title: "Programmatic pages for developer products",
    excerpt: "When integration and comparison pages at scale help, and when they quietly hurt the rest of the site.",
    topic: T.search,
    publishedAt: "2026-09-08",
    readMinutes: 7,
  }),
  post({
    slug: "launch-week-distribution-checklist",
    title: "A launch week distribution checklist",
    excerpt: "Five days, every channel, in the right order. What we line up before a developer product goes live.",
    topic: T.creators,
    publishedAt: "2026-09-01",
    readMinutes: 5,
  }),
];

const guide = (g: Omit<Guide, "kind" | "author" | "featured"> & { featured?: boolean }): Guide => ({
  kind: "guide",
  author: TEAM,
  featured: false,
  ...g,
});

export const GUIDES: Guide[] = [
  guide({
    slug: "ai-visibility-playbook",
    format: "Playbook",
    title: "The AI Visibility Playbook",
    excerpt: "How to get a developer product named, described accurately and recommended in AI answers, from audit to the content that moves it.",
    topic: T.search,
    publishedAt: "2026-10-20",
    readMinutes: 32,
    chapters: 6,
    featured: true,
  }),
  guide({
    slug: "technical-creator-playbook",
    format: "Playbook",
    title: "The Technical Creator Playbook",
    excerpt: "Finding, briefing and measuring creators developers already trust, without turning them into ad reads.",
    topic: T.creators,
    publishedAt: "2026-10-02",
    readMinutes: 24,
    chapters: 5,
  }),
  guide({
    slug: "reddit-for-developer-tools",
    format: "Guide",
    title: "Reddit for Developer Tools",
    excerpt: "A field guide to the communities, norms and formats that make Reddit a channel rather than a risk.",
    topic: T.community,
    publishedAt: "2026-09-18",
    readMinutes: 18,
    chapters: 4,
  }),
  guide({
    slug: "docs-that-convert",
    format: "Guide",
    title: "Docs That Convert",
    excerpt: "Structuring documentation so evaluators reach their first success, and tell their team about it.",
    topic: T.technical,
    publishedAt: "2026-09-04",
    readMinutes: 21,
    chapters: 5,
  }),
  guide({
    slug: "launch-week-distribution",
    format: "Playbook",
    title: "Launch Week Distribution",
    excerpt: "The day-by-day plan we run across creators, communities and search when a devtool ships something big.",
    topic: T.creators,
    publishedAt: "2026-08-21",
    readMinutes: 15,
    chapters: 4,
  }),
];

/** What resourcesSettings.navFeature would hold; null falls back to the featured guide. */
export const NAV_FEATURE: Resource | null = null;
