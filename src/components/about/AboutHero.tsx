import ArcButton from "../ArcButton";

// Editorial opener: a wide two-tone headline (the quiet setup in grey, the claim in ink), then one row under
// it: who's on the team at the left, the who-we-help and the CTA stepped in under the headline's right side.
// Lines rise in once on load.
const RISE = "animate-fade-up motion-reduce:animate-none";
const TEAM = ["Engineers", "Technical writers", "Creators", "Growth operators"];

export default function AboutHero() {
  return (
    <section className="px-6 pt-32 pb-14 sm:px-12 sm:pt-32 sm:pb-14 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">

        <h1 className="mt-8 text-[clamp(2.5rem,5.2vw,5.25rem)] leading-[0.98] font-medium tracking-[-0.055em] text-ink">
          <span style={{ animationDelay: "80ms" }} className={`block text-ink/30 ${RISE}`}>
            The growth partner
          </span>
          <span style={{ animationDelay: "180ms" }} className={`block ${RISE}`}>
            technical companies were missing.
          </span>
        </h1>

        <div className="mt-10 grid gap-14 lg:mt-12 lg:grid-cols-12 lg:items-end lg:gap-0">
          <div style={{ animationDelay: "320ms" }} className={`lg:col-span-5 lg:col-start-8 lg:row-start-1 ${RISE}`}>
            <p className="max-w-[28rem] text-lg leading-relaxed tracking-[-0.01em] text-ink/70 sm:text-xl">
              Engineers, technical writers, creators, and growth operators under one roof, helping AI&#8209;native and
              technical companies reach the people who matter.
            </p>
            <ArcButton href="/#contact" arrow className="mt-8">
              Speak with the Team
            </ArcButton>
          </div>

          {/* The team at a glance, on the CTA's line: a spec-sheet count and the disciplines, each led by a
              brand-green cell. */}
          <div
            style={{ animationDelay: "420ms" }}
            className={`border-t border-line pt-6 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:max-w-[22rem] ${RISE}`}
          >
            <p className="text-[clamp(3rem,5vw,4.5rem)] leading-none font-medium tracking-[-0.05em] text-ink">15+</p>
            <p className="mt-2 text-lg tracking-[-0.01em] text-ink/70">technical operators</p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-[0.7rem] tracking-[0.12em] text-ink/50 uppercase">
              {TEAM.map((role) => (
                <li key={role} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-[1px] bg-primary" />
                  {role}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
