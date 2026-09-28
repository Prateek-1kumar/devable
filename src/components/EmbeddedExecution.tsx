import ClientProof from "./ClientProof";

/** Embedded execution: who we are on the left, client proof on the right. */
export default function EmbeddedExecution() {
  return (
    <section id="contact" className="grid items-center gap-12 px-6 py-24 sm:px-12 lg:grid-cols-2 lg:px-20 xl:px-28">
      <div>
        {/* Dark pill, then an amber dot beside a coral pill; the live badge matches the pill height. */}
        <h2 className="flex flex-col items-start gap-[0.12em] font-heading text-2xl leading-none font-bold tracking-[-0.03em] whitespace-nowrap sm:text-3xl xl:text-4xl">
          <span className="rounded-full bg-foreground px-[0.55em] py-[0.3em] text-white">We plug into your team</span>
          <span className="flex items-center gap-[0.12em]">
            {/* Live badge: an amber scalloped flower turning slowly. */}
            <span aria-hidden="true" className="relative grid size-[1.6em] shrink-0 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_14s_linear_infinite] fill-amber motion-reduce:animate-none">
                <path d="M65.7 12.1 Q89.6 10.4 87.9 34.3 Q106.0 50.0 87.9 65.7 Q89.6 89.6 65.7 87.9 Q50.0 106.0 34.3 87.9 Q10.4 89.6 12.1 65.7 Q-6.0 50.0 12.1 34.3 Q10.4 10.4 34.3 12.1 Q50.0 -6.0 65.7 12.1Z" />
              </svg>
            </span>
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
