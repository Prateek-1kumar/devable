import ArcButton from "../../ArcButton";
import { Label } from "../kit";
import { HERO } from "./content";
import HeroWave from "./HeroWave";
import HeroSurfaces from "./HeroSurfaces";

// The first viewport: the claim centred on the page (chip, headline, body, one button), and under it the six places
// buyers look, as real marks on six tiles (see HeroSurfaces). No panel and no dashboard: the headline is the focal
// point, and one streamline carries the page's idea from one side to the other (see HeroWave).
export default function Hero() {
  return (
    <section className="relative isolate px-4 pt-24 pb-14 sm:px-8 sm:pt-28 lg:pb-20">
      <HeroWave />
      <div className="mx-auto max-w-[76rem] px-3 pt-14 sm:px-8 sm:pt-20">
        <div className="mx-auto flex max-w-[50rem] flex-col items-center px-3 text-center sm:px-4">
          <Label>{HERO.label}</Label>
          <h1 className="mt-7 text-[clamp(2.3rem,4.6vw,4.1rem)] leading-[1.02] font-medium tracking-[-0.05em] text-balance text-ink">
            {HERO.title}
          </h1>
          <p className="mt-6 max-w-[40rem] text-lg leading-relaxed tracking-[-0.01em] text-pretty text-ink/70">{HERO.body}</p>
          <div className="mt-9">
            <ArcButton href="/book" arrow tone="primary">
              {HERO.cta}
            </ArcButton>
          </div>
        </div>

        <HeroSurfaces />
      </div>
    </section>
  );
}
