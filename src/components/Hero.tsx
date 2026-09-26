import Highlight from "./Highlight";
import PixelField from "./PixelField";

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-start gap-12 px-6 pt-36 pb-16 sm:px-12 lg:grid-cols-[3fr_2fr]">
      <PixelField className="-z-10" />
      <div className="text-foreground">
        {/* Line breaks from sm up keep the three-line structure; phones wrap naturally. */}
        <h1 className="text-4xl leading-[1.3] font-semibold sm:text-5xl xl:text-6xl">
          <Highlight tone="accent" delay={0.2}>Growth marketing</Highlight> for
          <br className="hidden sm:block" /> AI-native{" "}
          <Highlight tone="coral" delay={0.45}>dev tools</Highlight>
          <br className="hidden sm:block" /> and{" "}
          <Highlight tone="white" delay={0.7}>platforms</Highlight>.
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed sm:text-lg">
          We build visibility and pipeline through technical content, organic search, AI visibility,
          Reddit, and creator distribution.
        </p>
      </div>
      {/* Reserved for the upcoming animation. */}
      <div aria-hidden="true" className="aspect-square w-full" />
    </section>
  );
}
