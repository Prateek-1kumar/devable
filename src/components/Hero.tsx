import PixelField from "./PixelField";
import StrokeText from "./StrokeText";

export default function Hero() {
  return (
    <section className="relative isolate grid min-h-svh items-start gap-12 px-6 pt-[16svh] pb-16 sm:px-12 lg:grid-cols-2">
      <PixelField className="-z-10" />
      <div className="text-foreground">
        <h1 className="font-display">
          <StrokeText lines={["DEVABLE"]} fontWeight={800} />
        </h1>
        {/* Two lines on offset indents for an asymmetric rhythm under the wordmark. */}
        <p className="mt-8 flex flex-col gap-4">
          <span className="ml-[28%] max-w-md text-xl sm:text-2xl">
            Growth marketing for AI-native dev tools and platforms.
          </span>
          <span className="ml-[8%] max-w-lg text-base sm:text-lg">
            We build visibility and pipeline through technical content, organic search, AI visibility,
            Reddit, and creator distribution.
          </span>
        </p>
      </div>
      {/* Reserved for the upcoming animation. */}
      <div aria-hidden="true" className="aspect-square w-full" />
    </section>
  );
}
