import Link from "next/link";
import { hrefOf, type Post, type Topic } from "@/lib/resources";
import { Label } from "../services/kit";
import { Byline, Cover, Meta, TopicChip, UNDERLINE, toneDot } from "./parts";

// The blog, top to bottom: a two-tone header, the featured block (one lead story with two more beside it,
// split by a hairline), then topic filters over the full listing. Everything is fed from src/lib/resources.

const PAD = "px-6 sm:px-12 xl:px-[6vw]";
const WRAP = "mx-auto max-w-[76rem]";

export function BlogHeader() {
  return (
    <section className={`${PAD} pt-36 sm:pt-40`}>
      <div className={`${WRAP} grid gap-8 border-b border-line pb-12 lg:grid-cols-12 lg:items-end lg:pb-14`}>
        <div className="lg:col-span-8">
          <Label>Blog</Label>
          <h1 className="mt-6 text-[clamp(2.6rem,5vw,4.5rem)] leading-[1] font-medium tracking-[-0.055em] text-ink">
            <span className="block text-ink/30">Field notes on reaching</span>
            <span className="block">technical audiences.</span>
          </h1>
        </div>
        <p className="max-w-[24rem] text-[1.05rem] leading-relaxed text-ink/60 lg:col-span-4 lg:justify-self-end">
          What we&rsquo;re learning about search, AI answers, creators and developer communities, from the work itself.
        </p>
      </div>
    </section>
  );
}

/** The lead story large on the left; the next two stacked on the right as thumbnail rows. */
export function Spotlight({ posts }: { posts: Post[] }) {
  const [lead, ...side] = posts;
  if (!lead) return null;
  return (
    <section aria-label="Featured articles" className={`${PAD} pt-12 lg:pt-14`}>
      <div className={`${WRAP} grid gap-x-12 gap-y-12 lg:grid-cols-12`}>
        <Link href={hrefOf(lead)} className="group block outline-offset-8 lg:col-span-7">
          <Cover item={lead} priority label="Featured" sizes="(min-width: 1024px) 58vw, 100vw" className="aspect-[16/10] rounded-2xl" />
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            <TopicChip item={lead} />
            <Meta item={lead} className="text-muted" />
          </div>
          <h2 className="mt-5 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.06] font-medium tracking-[-0.045em] text-ink">
            <span className={UNDERLINE}>{lead.title}</span>
          </h2>
          <p className="mt-4 max-w-[36rem] text-[1.05rem] leading-relaxed text-ink/60">{lead.excerpt}</p>
          <div className="mt-6">
            <Byline item={lead} />
          </div>
        </Link>

        <aside className="flex flex-col lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <p className="font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">Also featured</p>
          <ul className="mt-5">
            {side.map((post) => (
              <li key={post.slug} className="border-t border-line first:border-t-0 first:pt-0 pt-7 pb-7">
                <Link href={hrefOf(post)} className="group grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-5 outline-offset-4">
                  <Cover item={post} sizes="(min-width: 1024px) 16vw, 45vw" className="aspect-[4/3] rounded-xl" />
                  <div className="flex flex-col">
                    <TopicChip item={post} />
                    <h3 className="mt-3 text-[1.15rem] leading-[1.22] font-medium tracking-[-0.025em] text-ink">
                      <span className={UNDERLINE}>{post.title}</span>
                    </h3>
                    <Meta item={post} className="mt-auto pt-3 text-muted" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* A quiet way across to the deeper material, filling the column under the two stories. */}
          <Link href="/guides" className="group mt-auto flex items-center justify-between gap-6 rounded-xl bg-[#1a1918] p-5 text-white outline-offset-4">
            <span>
              <span className="block font-mono text-[0.62rem] tracking-[0.14em] text-white/45 uppercase">Guides &amp; Playbooks</span>
              <span className="mt-1.5 block text-[1.02rem] leading-snug tracking-[-0.015em]">Looking for something deeper?</span>
            </span>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-white/10 transition-colors duration-300 group-hover:bg-primary group-hover:text-ink">
              →
            </span>
          </Link>
        </aside>
      </div>
    </section>
  );
}

/**
 * Topic filters over the listing. Filters are links (?topic=slug), so a topic view can be shared and needs
 * no client JS. "All" lists everything not already featured above; a topic lists all of its posts.
 */
export function Browse({ topics, all, list, active }: { topics: Topic[]; all: Post[]; list: Post[]; active?: Topic }) {
  const count = (slug?: string) => (slug ? all.filter((p) => p.topic.slug === slug).length : all.length);
  const filters = [{ slug: undefined, title: "All", dot: undefined }, ...topics.map((t) => ({ slug: t.slug, title: t.title, dot: toneDot(t.tone) }))];

  return (
    <section id="topics" aria-labelledby="browse-title" className={`${PAD} scroll-mt-28 py-24 sm:py-32`}>
      <div className={WRAP}>
        <div className="flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="browse-title" className="text-[clamp(1.75rem,2.5vw,2.35rem)] leading-[1.1] font-medium tracking-[-0.04em] text-ink">
            {active ? active.title : "Latest articles"}
          </h2>
          <nav aria-label="Topics" className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <ul className="flex w-max gap-1.5 lg:flex-wrap lg:justify-end">
              {filters.map((f) => {
                const on = f.slug === active?.slug;
                return (
                  <li key={f.title}>
                    <Link
                      href={f.slug ? `/blog?topic=${f.slug}#topics` : "/blog#topics"}
                      scroll={false}
                      aria-current={on ? "page" : undefined}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.85rem] font-medium whitespace-nowrap transition-colors duration-200 ${
                        on ? "border-ink bg-ink text-white" : "border-line text-ink/75 hover:border-ink/25 hover:text-ink"
                      }`}
                    >
                      {f.dot && <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: f.dot }} />}
                      {f.title}
                      <span className={`font-mono text-[0.68rem] ${on ? "text-white/55" : "text-ink/35"}`}>{count(f.slug)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {list.length ? (
          <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-12 text-ink/55">Nothing in {active?.title ?? "this topic"} yet. Check back soon.</p>
        )}
      </div>
    </section>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={hrefOf(post)} className="group flex h-full flex-col outline-offset-4">
      <Cover item={post} className="aspect-[16/10] rounded-xl" />
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <TopicChip item={post} />
        <Meta item={post} className="text-muted" />
      </div>
      <h3 className="mt-4 text-[1.3rem] leading-[1.2] font-medium tracking-[-0.03em] text-ink">
        <span className={UNDERLINE}>{post.title}</span>
      </h3>
      <p className="mt-2.5 line-clamp-2 text-[0.95rem] leading-relaxed text-ink/60">{post.excerpt}</p>
      <div className="mt-auto pt-5">
        <Byline item={post} />
      </div>
    </Link>
  );
}
