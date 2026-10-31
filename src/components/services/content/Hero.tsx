import ArcButton from "../../ArcButton";
import { Label } from "../kit";
import { HERO } from "./content";
import HeroStage from "./HeroStage";

// The first viewport: the claim across the top, then one article built, reviewed and put to work across the full
// width of the panel, read left to right (see HeroStage).
export default function Hero() {
  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="mx-auto max-w-[76rem] rounded-2xl bg-[#f9f8f4] px-5 py-10 sm:px-12 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <Label>{HERO.label}</Label>
            <h1 className="mt-6 text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.03] font-medium tracking-[-0.05em] text-balance text-ink">{HERO.title}</h1>
          </div>
          <div>
            <p className="max-w-[30rem] text-[1.05rem] leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <ArcButton href="#contact" arrow tone="primary">
                {HERO.primary}
              </ArcButton>
              <ArcButton href="#work" tone="secondary">
                {HERO.secondary}
              </ArcButton>
            </div>
          </div>
        </div>

        <figure
          className="mt-9 lg:mt-10"
          aria-label="Example: a LandingAI guide built from product context, developer pain points, search and AI opportunities and technical research, turned into a brief, written, reviewed by an engineer and an editor, optimised for search and AI, then published, read by developers, ranked by Google and cited by AI tools."
        >
          <HeroStage />
        </figure>
      </div>
    </section>
  );
}
