import Highlight from "./Highlight";
import PixelField from "./PixelField";

// Each line rises in with a soft blur, then its pill sweeps in.
const line = "block animate-fade-up motion-reduce:animate-none";

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-start gap-12 px-6 pt-36 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr]">
      <PixelField className="-z-10" />
      <div className="text-foreground">
        <h1 className="flex flex-col gap-[0.25em] text-4xl leading-[1.3] font-semibold sm:text-5xl xl:text-6xl">
          <span className={line} style={{ animationDelay: "0.1s" }}>
            <Highlight tone="accent" delay={0.4}>Growth marketing</Highlight> for
          </span>
          <span className={line} style={{ animationDelay: "0.25s" }}>
            AI-native <Highlight tone="coral" delay={0.6}>dev tools</Highlight>
          </span>
          <span className={line} style={{ animationDelay: "0.4s" }}>
            and <Highlight tone="white" delay={0.8}>platforms</Highlight>.
          </span>
        </h1>
        <p className={`mt-10 max-w-xl text-base leading-relaxed sm:text-lg ${line}`} style={{ animationDelay: "0.6s" }}>
          We build visibility and pipeline through technical content, organic search, AI visibility,
          Reddit, and creator distribution.
        </p>
      </div>
      {/* Reserved for the upcoming animation. */}
      <div aria-hidden="true" className="aspect-square w-full" />
    </section>
  );
}
