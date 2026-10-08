import ClientProof from "./ClientProof";
import { LogoCloud } from "@/components/ui/logo-cloud-2";

const OPERATOR_AVATARS = [
  { src: "/clients/people/landingai.jpg", alt: "Operator Priya Raman" },
  { src: "/clients/people/glean.jpg", alt: "Operator Marcus Bell" },
  { src: "/clients/people/webai.jpg", alt: "Operator Elena Park" },
  { src: "/clients/people/orqai.jpg", alt: "Operator Daan Visser" },
  { src: "/clients/people/langwatch.jpg", alt: "Operator Sofia Lindqvist" },
];

/**
 * Embedded execution:
 * Upper half: Logo cloud grid with tech partners / client stack.
 * Lower half: Editorial value proposition on the left, interactive client proof card on the right.
 */
export default function EmbeddedExecution() {
  return (
    <section id="embedded-execution" className="relative py-10 sm:py-14 lg:py-16">
      {/* Upper half: Logo Cloud */}
      <div className="relative mx-auto max-w-5xl px-6 sm:px-10 lg:px-8">
        <LogoCloud />
      </div>

      {/* Lower half: Two-column layout matching inspiration */}
      <div className="mx-auto mt-8 max-w-6xl px-6 sm:mt-10 lg:mt-12 lg:px-12">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left Column: Clean editorial typography */}
          <div className="max-w-xl">
            <h2 className="text-[clamp(1.85rem,2.8vw,2.65rem)] leading-[1.12] font-medium tracking-[-0.035em] text-ink">
              We embed into your team to own the execution.
            </h2>
            <p className="mt-4 text-[0.96rem] leading-relaxed text-muted sm:text-[1.02rem]">
              We are a team of engineers, technical writers, creators, and marketers building growth and distribution for AI-native and developer companies.
            </p>

            {/* Overlapping operator avatars */}
            <div className="mt-6 flex items-center gap-3.5 pt-1">
              <div className="flex -space-x-2 overflow-hidden py-0.5">
                {OPERATOR_AVATARS.map((op, i) => (
                  <img
                    key={i}
                    src={op.src}
                    alt={op.alt}
                    className="inline-block size-8 sm:size-9 rounded-full ring-2 ring-paper object-cover grayscale-[20%] transition-transform duration-200 hover:scale-110 hover:z-10"
                  />
                ))}
              </div>
              <p className="text-xs sm:text-[0.82rem] font-medium text-muted">
                <span className="font-semibold text-ink">15+</span> specialized technical operators
              </p>
            </div>
          </div>

          {/* Right Column: Client Testimonial Card */}
          <div className="flex justify-center lg:justify-end">
            <ClientProof />
          </div>
        </div>
      </div>
    </section>
  );
}

