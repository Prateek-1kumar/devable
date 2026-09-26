import GrowthEngine from "./growth-engine/GrowthEngine";
import PixelField from "./PixelField";

// Each line rises in with a soft blur.
const line = "block animate-fade-up motion-reduce:animate-none";
// Keep each heading line whole on desktop (it may run behind the 3D, which sits beneath it).
const headingLine = `${line} lg:whitespace-nowrap`;

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-start gap-12 px-6 pt-36 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr]">
      <PixelField className="-z-10" />
      <div className="relative z-10 text-foreground">
        <h1 className="flex flex-col gap-[0.15em] text-4xl leading-[1.2] font-medium sm:text-5xl xl:text-6xl">
          <span className={headingLine} style={{ animationDelay: "0.1s" }}>
            Growth marketing for AI-native
          </span>
          <span className={headingLine} style={{ animationDelay: "0.25s" }}>
            dev tools and platforms.
          </span>
        </h1>
        <p className={`mt-10 max-w-xl text-base leading-relaxed sm:text-lg ${line}`} style={{ animationDelay: "0.45s" }}>
          We build visibility and pipeline through technical content, organic search, AI visibility,
          Reddit, and creator distribution.
        </p>
      </div>
      {/* Spans the right side and reaches in behind the headline on large screens. */}
      <GrowthEngine className="relative aspect-square w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[72%]" />
    </section>
  );
}
