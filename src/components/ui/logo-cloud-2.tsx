import { cn } from "@/lib/utils";

type Logo = { src: string; alt: string; h: number };

// Each logo gets its own height so they read at about the same visual weight: wide wordmarks sit
// shorter, compact marks (Glean) taller. ponytail: tuned by eye; re-tune when a logo is swapped.
const LOGOS: Logo[] = [
  { src: "/clients/vercel.svg", alt: "Vercel", h: 20 },
  { src: "/clients/glean.svg", alt: "Glean", h: 30 },
  { src: "/clients/mistral.svg", alt: "Mistral AI", h: 22 },
  { src: "/clients/assemblyai.svg", alt: "AssemblyAI", h: 24 },
  { src: "/clients/statsig.png", alt: "Statsig", h: 21 },
  { src: "/clients/langwatch.svg", alt: "LangWatch", h: 26 },
  { src: "/clients/twelvelabs.svg", alt: "Twelve Labs", h: 24 },
  { src: "/clients/apify.png", alt: "Apify", h: 27 },
  { src: "/clients/krisp.svg", alt: "Krisp", h: 30 },
  { src: "/clients/telnyx.svg", alt: "Telnyx", h: 25 },
  { src: "/clients/firecrawl.svg", alt: "Firecrawl", h: 26 },
  { src: "/clients/qodo.svg", alt: "Qodo", h: 30 },
  { src: "/clients/kilo.svg", alt: "Kilo Code", h: 34 },
  { src: "/clients/byterover.svg", alt: "ByteRover", h: 24 },
  { src: "/clients/reflex.svg", alt: "Reflex", h: 18 },
];

// One white surface split by hairlines: 5 across × 3 rows on desktop, 3 across on small screens.
export function LogoCloud({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-3 gap-px border border-line bg-line md:grid-cols-5", className)}
      {...props}
    >
      {LOGOS.map((logo) => (
        <div key={logo.alt} className="group flex h-16 items-center justify-center bg-white px-4 sm:h-19 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logos, mixed svg/png */}
          <img
            src={logo.src}
            alt={logo.alt}
            style={{ height: logo.h }}
            className="w-auto max-w-[80%] object-contain opacity-85 transition-transform duration-300 ease-out select-none group-hover:scale-105 max-sm:scale-90 motion-reduce:transition-none"
          />
        </div>
      ))}
    </div>
  );
}
