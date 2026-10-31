import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import { BlogHeader, Browse, Spotlight } from "@/components/resources/Blog";
import { getPosts, getTopics, spotlight } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Blog · Devable",
  description: "Field notes on search, AI answers, creators and developer communities.",
};

export default async function Blog({ searchParams }: { searchParams: Promise<{ topic?: string | string[] }> }) {
  const [{ topic }, posts, topics] = await Promise.all([searchParams, getPosts(), getTopics()]);
  const [featured, rest] = spotlight(posts, 3);
  const active = topics.find((t) => t.slug === topic);
  const list = active ? posts.filter((p) => p.topic.slug === active.slug) : rest;

  return (
    <main className="overflow-x-clip">
      <BlogHeader />
      <Spotlight posts={featured} />
      <Browse topics={topics} all={posts} list={list} active={active} />
      <FinalCta caseStudiesHref="/#case-studies" />
      <Footer />
    </main>
  );
}
