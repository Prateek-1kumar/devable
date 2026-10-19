import Image from "next/image";
import photo from "../../../public/about/founder.jpg";

// TODO(founder): real URLs; add a Newsletter link if it's separate from AI Engineering.
const LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "X / Twitter", href: "#" },
  { label: "AI Engineering", href: "#" },
];

// The founder as an editorial spread: a large, square-cut black-and-white portrait with a magazine-style
// caption, and the brief's words set low beside it, ending on a hairline with the audience and his links.
// Same columns as the page's other label/text sections.
export default function Founder() {
  return (
    <section aria-labelledby="founder-title" className="@container px-6 py-32 sm:px-12 sm:py-44 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] gap-14 lg:grid-cols-12 lg:items-end lg:gap-10">
        <figure className="lg:col-span-5 lg:ml-[calc(min(0px,(76rem-100cqw)/2)+2.5vw)]">
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

        <div className="max-w-[38rem] lg:col-span-6 lg:col-start-7 lg:pb-10">
          <p className="w-fit rounded-[4px] bg-ink/[0.06] px-2.5 py-1 text-[0.8rem] tracking-[0.04em] text-ink/80 uppercase">
            Founder
          </p>
          <h2
            id="founder-title"
            className="mt-8 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink"
          >
            Built by someone who understands both the product and the audience.
          </h2>
          <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-ink/70">
            <p>
              Sumanth is a developer, technical creator, and growth operator who has spent years building and creating
              for AI and developer audiences.
            </p>
            <p>
              Through his personal platforms and AI Engineering, he has built an audience of more than 200K developers,
              engineers, and AI practitioners across LinkedIn, X, and the newsletter.
            </p>
            <p>
              That experience became the foundation for Devable: a growth partner built specifically for companies
              selling technical products to technical audiences.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t border-ink/15 pt-6">
            <p className="leading-none">
              <span className="text-[2.6rem] font-medium tracking-[-0.05em] text-ink">200K+</span>
              <span className="mt-2 block text-[0.85rem] text-ink/50">developers and AI practitioners</span>
            </p>
            <nav aria-label="Sumanth online" className="flex flex-wrap gap-x-6 gap-y-2">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="group text-[0.95rem] font-medium text-ink/70 underline decoration-ink/20 underline-offset-[6px] transition-colors hover:text-ink hover:decoration-ink"
                >
                  {l.label}
                  <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
