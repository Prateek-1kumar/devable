import ArcButton from "../ArcButton";

// Editorial opener: a wide two-tone headline (the quiet setup in grey, the claim in ink), then the who
// and the CTA stepped in under its right side. Lines rise in once on load.
const RISE = "animate-fade-up motion-reduce:animate-none";

export default function AboutHero() {
  return (
    <section className="px-6 pt-40 pb-24 sm:px-12 sm:pt-48 sm:pb-32 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <p className={`flex items-center gap-2.5 text-sm font-medium tracking-[0.14em] text-muted uppercase ${RISE}`}>
          <span aria-hidden="true" className="size-2 rounded-[2px] bg-primary" />
          About Devable
        </p>

        <h1 className="mt-8 text-[clamp(2.5rem,5.2vw,5.25rem)] leading-[0.98] font-medium tracking-[-0.055em] text-ink">
          <span style={{ animationDelay: "80ms" }} className={`block text-ink/30 ${RISE}`}>
            The growth partner
          </span>
          <span style={{ animationDelay: "180ms" }} className={`block ${RISE}`}>
            technical companies were missing.
          </span>
        </h1>

        <div style={{ animationDelay: "320ms" }} className={`mt-12 lg:mt-16 lg:ml-[58%] ${RISE}`}>
          <p className="max-w-[28rem] text-lg leading-relaxed tracking-[-0.01em] text-ink/70 sm:text-xl">
            Engineers, technical writers, creators, and growth operators under one roof, helping AI&#8209;native and
            technical companies reach the people who matter.
          </p>
          <ArcButton href="/#contact" arrow className="mt-8">
            Speak with the Team
          </ArcButton>
        </div>
      </div>
    </section>
  );
}
