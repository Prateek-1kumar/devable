import ArcButton from "../../ArcButton";
import { Label } from "../kit";
import { HERO } from "./content";
import HeroStage from "./HeroStage";

// The first viewport, stacked like the homepage hero: the claim centered on the warm panel, and under it, inside
// the same panel, one AI visibility dashboard across the engines we track (see HeroStage).
export default function Hero() {
  return (
    <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-28 lg:pb-24">
      <div className="mx-auto max-w-[76rem] rounded-2xl bg-[#f9f8f4] px-3 pt-14 pb-3 sm:px-8 sm:pt-20 sm:pb-8">
        <div className="mx-auto flex max-w-[50rem] flex-col items-center px-3 text-center sm:px-4">
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.3rem,4.6vw,4.1rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink">
            {HERO.title}
          </h1>
          <p className="mt-6 max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
          <div className="mt-9">
            <ArcButton href="#contact" arrow tone="primary">
              {HERO.cta}
            </ArcButton>
          </div>
        </div>

        <HeroStage />
      </div>
    </section>
  );
}
