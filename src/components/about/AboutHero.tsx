import ArcButton from "../ArcButton";
import { LOGOS } from "../ui/logo-cloud-2";

// Editorial opener, centred: a two-tone headline (the quiet setup in grey, the claim in ink), who we are and
// who we help, the CTA, then a quiet row of client logos as proof. Lines rise in once on load.
const RISE = "animate-fade-up motion-reduce:animate-none";
// A handful of the homepage's clients, at their tuned heights; the full wall lives on the homepage.
const CLIENTS = ["Vercel", "Glean", "Mistral AI", "AssemblyAI", "Statsig", "Twelve Labs"].map((alt) => LOGOS.find((l) => l.alt === alt)!);

export default function AboutHero() {
  return (
    <section className="px-6 pt-28 pb-12 sm:px-12 sm:pt-28 sm:pb-12 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem] text-center">
        <h1 className="mt-8 text-[clamp(2.5rem,5.2vw,5.25rem)] leading-[0.98] font-medium tracking-[-0.055em] text-ink">
          <span style={{ animationDelay: "80ms" }} className={`block text-ink/30 ${RISE}`}>
            The growth partner
          </span>
          <span style={{ animationDelay: "180ms" }} className={`block ${RISE}`}>
            technical companies were missing.
          </span>
        </h1>

        <div style={{ animationDelay: "320ms" }} className={`mt-8 lg:mt-10 ${RISE}`}>
          <p className="mx-auto max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-balance text-ink/70 sm:text-xl">
            Engineers, technical writers, creators, and growth operators under one roof, helping AI&#8209;native
            devtools and platforms reach the developers and technical buyers they&rsquo;re built for.
          </p>
          <ArcButton href="/#contact" arrow className="mt-8">
            Speak with the Team
          </ArcButton>
        </div>

        <div style={{ animationDelay: "440ms" }} className={`mt-12 sm:mt-14 ${RISE}`}>
          <p className="text-sm font-medium text-muted">Trusted by AI-native devtools and platforms</p>
          <ul className="mx-auto mt-6 grid grid-cols-3 place-items-center gap-y-6 lg:flex lg:items-center lg:justify-center lg:gap-x-12">
            {CLIENTS.map((logo) => (
              <li key={logo.alt} className="flex w-full justify-center lg:w-auto">
                {/* eslint-disable-next-line @next/next/no-img-element -- static logos, mixed svg/png */}
                <img src={logo.src} alt={logo.alt} style={{ height: logo.h }} className="w-auto max-w-[85%] object-contain opacity-70 select-none lg:max-w-none" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
