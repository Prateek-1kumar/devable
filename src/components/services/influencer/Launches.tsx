import { Label, PLATFORM_NAME, PlatformIcon } from "../kit";
import { CREATORS, LAUNCHES, LOGOS, type Post } from "./content";

// Fade a rail out at both edges.
const EDGES = "[mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]";

// Proof first: the clients drift right to left on one slow rail (like Baseten's), and under them a rail of
// the creator posts from those launches, each with its view count. Both repeat their list once so the
// −50% loop is seamless (the copy is hidden from screen readers); hovering a rail pauses it.
export default function Launches() {
  return (
    <section id="launches" aria-labelledby="launches-title" className="scroll-mt-24 py-20 lg:py-28">
      <div className="mx-auto max-w-[76rem] px-6 sm:px-12 xl:px-0">
        <Label>{LAUNCHES.label}</Label>
        <h2 id="launches-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink">
          {LAUNCHES.title}
        </h2>
      </div>

      <div className={`group mt-14 flex overflow-hidden ${EDGES}`}>
        <ul className="flex w-max shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <li key={i} aria-hidden={i >= LOGOS.length || undefined} className="grid h-16 w-44 place-items-center px-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- static logos, mixed svg/png */}
              <img
                src={logo.src}
                alt={i >= LOGOS.length ? "" : logo.alt}
                style={{ height: logo.h }}
                className="w-auto max-w-full object-contain opacity-60 grayscale"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className={`group mt-10 flex overflow-hidden py-4 ${EDGES}`}>
        <ul className="flex w-max shrink-0 animate-marquee gap-4 pr-4 [animation-duration:80s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[...LAUNCHES.posts, ...LAUNCHES.posts].map((post, i) => (
            <PostCard key={i} post={post} copy={i >= LAUNCHES.posts.length} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function PostCard({ post, copy }: { post: Post; copy: boolean }) {
  const c = CREATORS[post.creator];
  return (
    <li aria-hidden={copy || undefined} className="flex w-[19rem] flex-col rounded-xl border border-line bg-white p-5">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- sample creator photos */}
        <img src={c.photo} alt="" className="size-9 rounded-full object-cover" />
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[0.85rem] font-semibold text-ink">{c.name}</span>
          <span className="block truncate text-[0.74rem] text-muted">{c.handle}</span>
        </p>
        <PlatformIcon platform={post.platform} className="size-4 text-ink/80" />
        <span className="sr-only">on {PLATFORM_NAME[post.platform]}</span>
      </div>
      <p className="mt-3.5 mb-5 line-clamp-4 text-[0.88rem] leading-snug text-ink/85">{post.text}</p>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3.5">
        <span className="rounded-full bg-[#f4f2eb] px-2.5 py-1 text-[0.72rem] font-medium text-ink/75">for {post.client}</span>
        <span className="text-right leading-none">
          <span className="block text-[1.35rem] font-medium tracking-[-0.04em] text-ink">{post.views}</span>
          <span className="mt-1 block font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">views</span>
        </span>
      </div>
    </li>
  );
}
