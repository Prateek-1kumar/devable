import ArcButton from "./ArcButton";
import ChannelParagraph from "./ChannelParagraph";
import GrowthEngine from "./growth-engine/GrowthEngine";
import PixelField from "./PixelField";
import RotatingText from "./RotatingText";

// Each line rises in with a soft blur.
const rise = "animate-fade-up motion-reduce:animate-none";
const line = `block ${rise}`;
// Keep each heading line whole on desktop (it may run behind the 3D, which sits beneath it).
const headingLine = `${line} lg:whitespace-nowrap`;

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-start gap-12 px-6 pt-36 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr]">
      <PixelField className="-z-10" />
      <div className="relative z-10 self-center text-foreground">
        {/* Debossed display headline with a rotating audience pill. */}
        <h1 className="font-hero text-5xl leading-[1.02] font-bold tracking-[-0.02em] text-deboss sm:text-6xl xl:text-7xl">
          <span className={headingLine} style={{ animationDelay: "0.1s" }}>
            Growth marketing
          </span>
          <span className={`${headingLine} mt-[0.12em]`} style={{ animationDelay: "0.25s" }}>
            for AI-native{" "}
            <RotatingText
              texts={["dev tools", "APIs", "AI agents", "platforms"]}
              className="align-bottom"
            />
          </span>
        </h1>
        <ChannelParagraph
          className={`mt-9 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg ${line}`}
          style={{ animationDelay: "0.45s" }}
        />
        <div className={`mt-10 flex flex-wrap gap-3 ${rise}`} style={{ animationDelay: "0.7s" }}>
          <ArcButton href="#contact" depth>
            Speak with the Team
          </ArcButton>
          <ArcButton href="#case-studies" tone="amber" depth>
            View Case Studies
          </ArcButton>
        </div>
      </div>
      {/* Spans the right side and reaches in behind the headline on large screens. */}
      <GrowthEngine className="relative aspect-square w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[72%]" />
    </section>
  );
}
