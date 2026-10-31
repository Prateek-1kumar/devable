// The Resources data layer: the shapes the blog, guides and nav read, and the getters that fill them.
// Content model: sanity/schemaTypes.ts. The queries below project Sanity documents into exactly these types.
// ponytail: getters return placeholder content until Sanity is connected; then each body becomes
// `client.fetch(QUERY)` (next-sanity) and resources-placeholder.ts is deleted. Nothing else changes.

import { GUIDES, NAV_FEATURE, POSTS, TOPICS } from "./resources-placeholder";

export type Tone = "green" | "orange" | "sage" | "ink";
export type Topic = { slug: string; title: string; tone: Tone };
export type Author = { name: string; role?: string; avatar?: string };
export type Cover = { url: string; alt: string };

type Base = {
  slug: string;
  title: string;
  excerpt: string;
  cover?: Cover;
  topic: Topic;
  author: Author;
  /** ISO date. */
  publishedAt: string;
  readMinutes?: number;
  featured: boolean;
};
export type Post = Base & { kind: "post" };
export type Guide = Base & { kind: "guide"; format: "Guide" | "Playbook"; chapters?: number };
export type Resource = Post | Guide;

export const hrefOf = (r: Resource) => (r.kind === "post" ? `/blog/${r.slug}` : `/guides/${r.slug}`);

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export const formatDate = (iso: string) => DATE.format(new Date(iso));

const newestFirst = <T extends Resource>(items: T[]) => [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/** The `n` items for a featured slot (featured first, topped up with the newest) and everything else. */
export function spotlight<T extends Resource>(items: T[], n: number): [T[], T[]] {
  const picked = [...items.filter((i) => i.featured), ...items.filter((i) => !i.featured)].slice(0, n);
  return [picked, items.filter((i) => !picked.includes(i))];
}

export async function getTopics(): Promise<Topic[]> {
  return TOPICS; // client.fetch(TOPICS_QUERY)
}

export async function getPosts(): Promise<Post[]> {
  return newestFirst(POSTS); // client.fetch(POSTS_QUERY)
}

export async function getGuides(): Promise<Guide[]> {
  return newestFirst(GUIDES); // client.fetch(GUIDES_QUERY)
}

/** The Resources menu's featured card: the one picked in settings, else the lead guide. */
export async function getNavFeature(): Promise<Resource | null> {
  return NAV_FEATURE ?? spotlight(await getGuides(), 1)[0][0] ?? null; // client.fetch(NAV_FEATURE_QUERY) ?? …
}

// GROQ, ready for next-sanity. `card` is the shared projection: one place to add a field to every card.
const card = `
  title, "slug": slug.current, excerpt, "featured": coalesce(featured, false), publishedAt, readMinutes,
  "cover": coverImage{ "url": asset->url, alt },
  "topic": topic->{ title, "slug": slug.current, tone },
  "author": author->{ name, role, "avatar": image.asset->url }`;

export const TOPICS_QUERY = `*[_type == "topic"] | order(order asc) { title, "slug": slug.current, tone }`;
export const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) { "kind": "post", ${card} }`;
export const GUIDES_QUERY = `*[_type == "guide" && defined(slug.current)] | order(publishedAt desc) { "kind": "guide", format, chapters, ${card} }`;
export const NAV_FEATURE_QUERY = `*[_id == "resourcesSettings"][0].navFeature->{ "kind": _type, format, chapters, ${card} }`;
