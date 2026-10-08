import ArcButton from "./ArcButton";
import ChannelParagraph from "./ChannelParagraph";
import GrowthEngine from "./growth-engine/GrowthEngine";

// Each block rises in with a soft blur.
const rise = "animate-fade-up motion-reduce:animate-none";

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-center gap-12 px-6 pt-32 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr] lg:px-[8vw]">
      {/* Light, precise type: the weight comes from size and tracking, not boldness. */}
      <div className="relative z-10 max-w-[38rem] text-foreground">
        <h1 className={`text-[clamp(2.6rem,4.6vw,4.4rem)] leading-[1.02] font-normal tracking-[-0.045em] ${rise}`} style={{ animationDelay: "0.1s" }}>
          Growth Marketing for AI&#8209;Native DevTools and Platforms
        </h1>
        <ChannelParagraph
          className={`mt-6 max-w-[30rem] text-lg leading-relaxed tracking-[-0.01em] text-foreground/60 sm:text-xl ${rise}`}
          style={{ animationDelay: "0.25s" }}
        />
        <div className={`mt-10 flex flex-wrap items-center gap-4 ${rise}`} style={{ animationDelay: "0.4s" }}>
          <ArcButton href="#contact" arrow>
            Speak with the team
          </ArcButton>
          <ArcButton href="#case-studies" tone="secondary">
            View case studies
          </ArcButton>
        </div>
      </div>
      {/* Spans the right side and reaches in behind the text on large screens. */}
      <GrowthEngine className="relative aspect-square w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[72%]" />
    </section>
  );
}
