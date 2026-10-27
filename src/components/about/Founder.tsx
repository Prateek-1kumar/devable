import Image from "next/image";
import photo from "../../../public/about/founder.jpg";
import { PlatformIcon, type Platform } from "../services/kit";

// TODO(founder): real URLs, and the AI Engineering logo in place of the generic newsletter mark.
const LINKS: { label: string; platform: Platform; href: string }[] = [
  { label: "LinkedIn", platform: "linkedin", href: "#" },
  { label: "X", platform: "x", href: "#" },
  { label: "AI Engineering newsletter", platform: "newsletter", href: "#" },
];

// The founder as an editorial spread: a large, square-cut black-and-white portrait with a magazine-style
// caption, and the brief's words beside it, tops aligned so it reads as one block, ending on a hairline with
// the audience and his links.
export default function Founder() {
  return (
    <section aria-labelledby="founder-title" className="@container px-6 py-32 sm:px-12 sm:py-44 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] gap-14 lg:grid-cols-12 lg:items-start lg:gap-10">
        <figure className="lg:col-span-5">
          <div className="relative aspect-[4/5] w-full max-w-[30rem] bg-black">
            <Image
              src={photo}
              alt="Sumanth Papareddy"
              fill
              sizes="(min-width: 1024px) 30rem, 100vw"
              placeholder="blur"
              className="object-cover object-[50%_35%]"
            />
          </div>
          <figcaption className="mt-4 flex max-w-[30rem] items-baseline justify-between gap-4 font-mono text-[0.68rem] tracking-[0.1em] text-ink/50 uppercase">
            <span>Sumanth Papareddy</span>
            <span>Founder &amp; CEO, Devable</span>
          </figcaption>
        </figure>

        <div className="max-w-[38rem] lg:col-span-7 lg:col-start-6 lg:pl-4">
          <p className="w-fit rounded-[4px] bg-ink/[0.06] px-2.5 py-1 text-[0.8rem] tracking-[0.04em] text-ink/80 uppercase">
            Founder
          </p>
          <h2
            id="founder-title"
            className="mt-8 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink"
          >
            From the developer community, for the companies building for it.
          </h2>
          <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-ink/70">
            <p>
              Sumanth is an ML engineer, Developer Advocate, technical creator, and growth operator who has spent years
              building for and writing to AI and developer audiences.
            </p>
            <p>
              Across X, LinkedIn, and the AI Engineering newsletter, he writes for more than 500K developers, engineers,
              founders, CTOs, and AI practitioners. He reaches millions every week through his work.
            </p>
            <p>
              The gap was clear: great technical products were being built for developers, but marketed with playbooks
              that were never built for them.
            </p>
            <p>He started Devable to build the growth partner technical companies were missing.</p>
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t border-ink/15 pt-6">
            <p className="leading-none">
              <span className="text-[2.6rem] font-medium tracking-[-0.05em] text-ink">500K+</span>
              <span className="mt-2 block text-[0.85rem] text-ink/50">developers and AI practitioners</span>
            </p>
            <nav aria-label="Sumanth online" className="flex gap-3">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  aria-label={l.label}
                  title={l.label}
                  className="grid size-12 place-items-center rounded-full border border-ink/15 text-ink/75 transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-ink focus-visible:border-primary focus-visible:bg-primary focus-visible:text-ink focus-visible:outline-none"
                >
                  <PlatformIcon platform={l.platform} className="size-5" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
