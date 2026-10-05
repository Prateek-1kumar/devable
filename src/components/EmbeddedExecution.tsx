import ClientProof from "./ClientProof";

/** Embedded execution: who we are on the left, client proof on the right. */
export default function EmbeddedExecution() {
  return (
    <section className="grid items-center gap-12 px-6 py-24 sm:px-12 lg:grid-cols-2 lg:px-20 xl:px-28">
      <div>
        {/* Dark pill, then a deep green badge beside a coral pill; the live badge matches the pill height. */}
        <h2 className="flex flex-col items-start gap-[0.12em] font-heading text-2xl leading-none font-bold tracking-[-0.03em] whitespace-nowrap sm:text-3xl xl:text-4xl">
          <span className="rounded-full bg-foreground px-[0.55em] py-[0.3em] text-white">We plug into your team</span>
          <span className="flex items-center gap-[0.12em]">
            {/* Circular badge matching pill height */}
            <span aria-hidden="true" className="size-[1.6em] shrink-0 rounded-full bg-primary" />
            <span className="rounded-full bg-coral px-[0.55em] py-[0.3em] text-foreground">and own the execution.</span>
          </span>
        </h2>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
          We are a team of engineers, technical writers, creators, and marketers building growth and distribution for AI-native and developer companies.
        </p>
      </div>
      <ClientProof />
    </section>
  );
}
