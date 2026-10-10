import ArcButton from "./ArcButton";
import ClientProof from "./ClientProof";
import PixelField from "./PixelField";
import { LogoCloud } from "./ui/logo-cloud-2";

// ponytail: sample faces until real team photos exist.
const OPERATORS = ["landingai", "glean", "webai", "orqai", "langwatch"];

// Three groups: the claim and who trusts it on one centered axis, then the team beside what clients say.
// Space inside a group is tight (16–40px) and between groups is wide (80–96px),
// so the eye reads three blocks rather than a stack of parts.
export default function Hero() {
  return (
    <section className="px-4 pt-24 pb-20 sm:px-8 sm:pt-28 lg:pb-28">
      {/* The first viewport as one framed panel: claim and logos together, the pixel field quietly behind them. */}
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden border border-line bg-card px-6 pt-20 pb-12 sm:px-12 sm:pt-24 sm:pb-14">
        <PixelField className="-z-10" />
        <div className="mx-auto max-w-4xl text-center text-ink">
          <h1 className="text-[clamp(2.25rem,4.2vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.045em]">
            Growth Marketing for AI&#8209;Native DevTools and Platforms
          </h1>
          <p className="mx-auto mt-6 max-w-[36rem] text-lg leading-relaxed tracking-[-0.01em] text-ink/60 sm:text-xl">
            We build visibility and pipeline through technical content, organic search, AI visibility, Reddit, and
            creator distribution.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ArcButton href="#contact" arrow>
              Speak with the team
            </ArcButton>
            <ArcButton href="#case-studies" tone="secondary">
              View case studies
            </ArcButton>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
          <p className="mb-5 text-center text-sm text-muted">Trusted by AI-native dev tools and platforms</p>
          <LogoCloud className="bg-card/70 backdrop-blur-[2px]" />
        </div>
      </div>

      {/* Who does the work, beside what clients say about it. */}
      <div className="mx-auto mt-24 grid max-w-6xl items-center gap-12 sm:mt-24 lg:grid-cols-[5fr_6fr] lg:gap-16">
        <div className="text-ink">
          <h2 className="text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.08] font-medium tracking-[-0.035em]">
            We plug into your team and own the execution.
          </h2>
          <p className="mt-5 max-w-[30rem] text-lg leading-relaxed text-ink/60">
            Engineers, technical writers, creators, and marketers building growth and distribution for AI-native and
            developer companies.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {OPERATORS.map((id) => (
                // eslint-disable-next-line @next/next/no-img-element -- sample photos, swapped for the real team
                <img key={id} src={`/clients/people/${id}.jpg`} alt="" className="size-10 rounded-full object-cover ring-2 ring-background grayscale" />
              ))}
            </div>
            <p className="text-sm text-muted">
              <span className="font-medium text-ink">15+</span> technical operators
            </p>
          </div>
        </div>
        <ClientProof />
      </div>
    </section>
  );
}
