import ArcButton from "../../ArcButton";
import { Label } from "../kit";
import { HERO } from "./content";
import HeroBackdrop from "./HeroBackdrop";
import HeroStage from "./HeroStage";

// The first viewport, stacked like the Search hero: the claim centred on the page (chip, headline, body, two
// buttons), then, with room around it, one article built, reviewed and put to work, read left to right (see
// HeroStage). The text rises in line by line, then the stage.
const at = (delay: number) => ({ animationDelay: `${delay}s` });

export default function Hero() {
  return (
    <section className="relative isolate px-4 pt-24 pb-14 sm:px-8 sm:pt-28 lg:pb-20">
      <HeroBackdrop />
      <div className="mx-auto max-w-[76rem] px-4 pt-14 pb-12 sm:px-10 sm:pt-20 sm:pb-16">
        <div className="mx-auto flex max-w-[50rem] flex-col items-center text-center">
          <div className="motion-safe:animate-fade-up">
            <Label>{HERO.label}</Label>
          </div>
          <h1 style={at(0.08)} className="mt-7 text-[clamp(2.3rem,4.6vw,4.1rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink motion-safe:animate-fade-up">
            {HERO.title}
          </h1>
          <p style={at(0.2)} className="mt-6 max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70 motion-safe:animate-fade-up">
            {HERO.body}
          </p>
          <div style={at(0.32)} className="mt-9 flex flex-wrap justify-center gap-4 motion-safe:animate-fade-up">
            <ArcButton href="/book" arrow tone="primary">
              {HERO.primary}
            </ArcButton>
            <ArcButton href="#work" tone="secondary">
              {HERO.secondary}
            </ArcButton>
          </div>
        </div>

        <figure
          style={at(0.5)}
          className="mt-14 lg:mt-20 motion-safe:animate-fade-up"
          aria-label="Example: an article built from product context, developer pain points, search and AI opportunities and technical research, turned into a brief, written, reviewed by an engineer and an editor, optimised for search and AI, then published, read by developers, ranked by Google and cited in AI search."
        >
          <HeroStage />
        </figure>
      </div>
    </section>
  );
}
