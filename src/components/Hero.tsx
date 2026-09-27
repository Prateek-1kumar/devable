import Link from "next/link";
import ArcButton from "./ArcButton";
import ChannelParagraph from "./ChannelParagraph";
import GrowthEngine from "./growth-engine/GrowthEngine";

// Each block rises in with a soft blur.
const rise = "animate-fade-up motion-reduce:animate-none";

export default function Hero() {
  return (
    // The top padding leaves room for the hero-size wordmark, which lives in the Navbar.
    <section className="relative isolate grid min-h-svh gap-12 px-6 pt-56 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr] lg:pt-80">
      {/* One story block anchored to the bottom, with "GROWTH" pressed into its spine. */}
      <div className={`relative z-10 grid max-w-2xl grid-cols-[auto_1fr] gap-x-6 self-end font-heading text-foreground sm:gap-x-8 ${rise}`} style={{ animationDelay: "0.2s" }}>
        <span aria-hidden="true" className="rotate-180 text-[3.4rem] leading-[0.78] font-bold tracking-[-0.05em] uppercase select-none text-deboss [writing-mode:vertical-rl] sm:text-[4.6rem]">
          Growth
        </span>
        <div>
          <h1 className="text-3xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[2.6rem]">
            You ship the tool.
            <br />
            <span className="text-foreground/45">We ship the demand.</span>
          </h1>
          <hr className="my-6 border-foreground/15" />
          <ChannelParagraph className="max-w-md text-base leading-relaxed text-foreground/70 sm:text-lg" />
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ArcButton href="#contact" tone="coral" sweep={["#ec544b", "#fcb401", "#2a9093", "#f4f2ee"]}>
              Speak with the team
            </ArcButton>
            <Link href="#case-studies" className="text-sm font-semibold tracking-[0.14em] uppercase underline-offset-[6px] hover:underline">
              Case studies ↗
            </Link>
          </div>
        </div>
      </div>
      {/* Spans the right side and reaches in behind the text on large screens. */}
      <GrowthEngine className="relative aspect-square w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[72%]" />
    </section>
  );
}
