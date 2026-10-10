import ArcButton from "./ArcButton";
import ClientProof from "./ClientProof";
import { FlickeringGrid } from "./ui/flickering-grid";
import { LogoCloud } from "./ui/logo-cloud-2";

// ponytail: sample faces until real team photos exist.
const OPERATORS = ["landingai", "glean", "webai", "orqai", "langwatch"];

// Three groups: the claim and who trusts it on one centered axis, then the team beside what clients say.
// Space inside a group is tight (16–40px) and between groups is wide (80–96px),
// so the eye reads three blocks rather than a stack of parts.
export default function Hero() {
  return (
    <section className="px-4 pt-24 pb-20 sm:px-8 sm:pt-28 lg:pb-28">
      {/* The first viewport as one framed panel: radiant emerald green with soft ambient lighting and flickering grid */}
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#1db85e] px-6 pt-20 pb-12 sm:px-12 sm:pt-24 sm:pb-14 shadow-2xl">
        {/* Soft, natural ambient glow from the top */}
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(25,231,110,0.35),transparent_75%)]" />
        <FlickeringGrid
          className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_38%,rgba(0,0,0,0.3)_0%,black_90%)]"
          squareSize={2.8}
          gridGap={5}
          colors={["#ffffff", "#e6fbf0", "#bbf7d0", "#86efac"]}
          maxOpacity={0.45}
          flickerChance={0.15}
        />
        <div className="mx-auto max-w-4xl text-center text-white">
          <h1 className="text-[clamp(2.25rem,4.2vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.045em] text-white [text-shadow:_0_2px_12px_rgb(0_0_0_/_25%)]">
            Growth Marketing for AI&#8209;Native DevTools and Platforms
          </h1>
          <p className="mx-auto mt-6 max-w-[36rem] text-lg leading-relaxed tracking-[-0.01em] text-white/95 [text-shadow:_0_1px_8px_rgb(0_0_0_/_20%)] sm:text-xl">
            We build visibility and pipeline through technical content, organic search, AI visibility, Reddit, and
            creator distribution.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ArcButton href="#contact" arrow tone="primary">
              Speak with the team
            </ArcButton>
            <ArcButton href="#case-studies" tone="secondary">
              View case studies
            </ArcButton>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
          <p className="mb-5 text-center text-sm font-medium text-white/95 [text-shadow:_0_1px_6px_rgb(0_0_0_/_20%)]">Trusted by AI-native dev tools and platforms</p>
          <LogoCloud className="bg-card" />
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
