import Link from "next/link";
import { hrefOf, type Guide } from "@/lib/resources";
import ArcButton from "../ArcButton";
import { Label } from "../services/kit";
import { Byline, Cover, Meta, TopicChip, UNDERLINE } from "./parts";

// Guides & Playbooks: the blog's system dressed up a step. The lead guide sits on the inset charcoal stage
// (About's "How we operate") with its cover as a small stack of pages; the rest are off-white cards holding a
// white tile, the case studies' treatment, two to a row so each gets room. No filters until there's enough
// to filter.

const PAD = "px-6 sm:px-12 xl:px-[6vw]";
const WRAP = "mx-auto max-w-[76rem]";
const chapters = (g: Guide) => (g.chapters ? `${g.chapters} chapters` : g.format);

export function GuidesHeader({ count }: { count: number }) {
  return (
    <section className={`${PAD} pt-36 pb-14 sm:pt-40 sm:pb-16`}>
      <div className={`${WRAP} grid gap-8 lg:grid-cols-12 lg:items-end`}>
        <div className="lg:col-span-8">
          <Label>Guides &amp; Playbooks</Label>
          <h1 className="mt-6 text-[clamp(2.6rem,5vw,4.5rem)] leading-[1] font-medium tracking-[-0.055em] text-ink">
            <span className="block text-ink/30">The long-form version</span>
            <span className="block">of how we work.</span>
          </h1>
        </div>
        <div className="max-w-[24rem] lg:col-span-4 lg:justify-self-end">
          <p className="text-[1.05rem] leading-relaxed text-ink/60">
            Step-by-step guides and playbooks for reaching developers and technical buyers, written from real launches.
          </p>
          <p className="mt-4 font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">{count} guides &amp; playbooks</p>
        </div>
      </div>
    </section>
  );
}

export function FeaturedGuide({ guide }: { guide: Guide }) {
  return (
    <section aria-labelledby="featured-guide-title" className="mx-[2.5vw] rounded-[1.25rem] bg-[#1a1918] px-6 py-14 text-white sm:px-12 sm:py-20 xl:px-[6vw]">
      <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-12 lg:gap-x-10`}>
        <div className="lg:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[4px] bg-primary px-2 py-1 font-mono text-[0.62rem] tracking-[0.14em] text-ink uppercase">Featured {guide.format}</span>
            <TopicChip item={guide} dark />
          </div>
          <h2 id="featured-guide-title" className="mt-6 text-[clamp(2.2rem,4vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.05em]">
            {guide.title}
          </h2>
          <p className="mt-5 max-w-[30rem] text-[1.05rem] leading-relaxed text-white/60 sm:text-lg">{guide.excerpt}</p>

          <dl className="mt-8 grid max-w-[26rem] grid-cols-3 border-y border-white/10 font-mono text-[0.68rem] tracking-[0.1em] uppercase">
            {[
              ["Chapters", guide.chapters ?? "–"],
              ["Read", guide.readMinutes ? `${guide.readMinutes} min` : "–"],
              ["Updated", new Date(guide.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })],
            ].map(([k, v], i) => (
              <div key={k} className={`py-4 ${i ? "border-l border-white/10 pl-4" : ""}`}>
                <dt className="text-white/40">{k}</dt>
                <dd className="mt-1.5 text-[0.82rem] tracking-[0.04em] text-white">{v}</dd>
              </div>
            ))}
          </dl>

          <ArcButton href={hrefOf(guide)} tone="light" arrow className="mt-9">
            Read the {guide.format.toLowerCase()}
          </ArcButton>
        </div>

        {/* The cover as the top sheet of a small stack: two pages fanned out behind it. */}
        <Link href={hrefOf(guide)} tabIndex={-1} aria-hidden="true" className="group relative block lg:col-span-6 lg:col-start-7">
          <span className="absolute inset-0 translate-x-3 translate-y-3 rotate-[2.5deg] rounded-2xl bg-white/[0.06] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-5 group-hover:rotate-[4deg]" />
          <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[1.2deg] rounded-2xl bg-white/[0.1] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2.5 group-hover:rotate-[2deg]" />
          <Cover item={guide} priority label={guide.format} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] rounded-2xl ring-1 ring-white/10" />
        </Link>
      </div>
    </section>
  );
}

export function GuideGrid({ guides }: { guides: Guide[] }) {
  if (!guides.length) return null;
  return (
    <section aria-labelledby="all-guides-title" className={`${PAD} py-24 sm:py-32`}>
      <div className={WRAP}>
        <div className="flex items-end justify-between gap-6 border-b border-line pb-6">
          <h2 id="all-guides-title" className="text-[clamp(1.75rem,2.5vw,2.35rem)] leading-[1.1] font-medium tracking-[-0.04em] text-ink">
            More guides &amp; playbooks
          </h2>
          <span className="font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">{guides.length} more</span>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {guides.map((guide, i) => (
            <li key={guide.slug}>
              <Link href={hrefOf(guide)} className="group flex h-full flex-col rounded-3xl bg-[#f6f5f1] p-2 outline-offset-4">
                <Cover item={guide} label={guide.format} sizes="(min-width: 768px) 45vw, 100vw" className="aspect-[16/9] rounded-2xl" />
                <div className="flex flex-1 flex-col px-5 pt-6 pb-5 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <TopicChip item={guide} />
                    <span className="font-mono text-[0.68rem] tracking-[0.1em] text-muted uppercase">
                      {String(i + 2).padStart(2, "0")} · {chapters(guide)}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[clamp(1.4rem,2vw,1.75rem)] leading-[1.12] font-medium tracking-[-0.04em] text-ink">
                    <span className={UNDERLINE}>{guide.title}</span>
                  </h3>
                  <p className="mt-3 max-w-[34rem] text-[0.98rem] leading-relaxed text-ink/60">{guide.excerpt}</p>
                  <div className="mt-auto pt-8">
                    <div className="flex items-center justify-between gap-4 border-t border-ink/[0.08] pt-5">
                      <Byline item={guide} />
                      <Meta item={guide} className="hidden text-muted sm:inline" />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
