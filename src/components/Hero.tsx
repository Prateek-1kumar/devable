import ArcButton from "./ArcButton";
import ChannelParagraph from "./ChannelParagraph";
import HeroHeadline from "./HeroHeadline";
import GrowthEngine from "./growth-engine/GrowthEngine";

// Each line rises in with a soft blur.
const rise = "animate-fade-up motion-reduce:animate-none";
const line = `block ${rise}`;

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-start gap-12 px-6 pt-36 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr]">
      <div className="relative z-10 self-center text-foreground">
        {/* Debossed display headline with a rotating audience pill. */}
        {/* Same scale as the section headings; line two never wraps. */}
        <HeroHeadline
          className="font-heading text-3xl leading-[1.15] font-bold tracking-[-0.03em] text-deboss sm:text-[2.35rem] xl:text-[2.8rem]"
          lineClassName={rise}
        />
        <ChannelParagraph
          className={`mt-9 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg ${line}`}
          style={{ animationDelay: "0.45s" }}
        />
        <div className={`mt-10 flex flex-wrap gap-3 ${rise}`} style={{ animationDelay: "0.7s" }}>
          <ArcButton href="#contact">
            Speak with the Team
          </ArcButton>
          <ArcButton href="#case-studies" tone="coral">
            View Case Studies
          </ArcButton>
        </div>
      </div>
      {/* Spans the right side and reaches in behind the headline on large screens. */}
      <GrowthEngine className="relative aspect-square w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[72%]" />
    </section>
  );
}
