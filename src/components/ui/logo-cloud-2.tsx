import { cn } from "@/lib/utils";

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

type LogoCloudProps = React.ComponentProps<"div">;

function PlusIcon({ className, strokeWidth = 1, ...props }: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function LogoCloud({ className, ...props }: LogoCloudProps) {
  return (
    <div
      className={cn(
        "relative grid grid-cols-2 border border-line md:grid-cols-4",
        className
      )}
      {...props}
    >
      {/* 1. LandingAI */}
      <LogoCard
        className="relative border-r border-b border-line bg-surface/30"
        logo={{
          src: "/clients/landingai.png",
          alt: "LandingAI Logo",
        }}
      >
        <PlusIcon
          className="-right-[12px] -bottom-[12px] absolute z-10 size-6 text-line"
          strokeWidth={1}
        />
      </LogoCard>

      {/* 2. Glean */}
      <LogoCard
        className="border-b border-line md:border-r"
        logo={{
          src: "/clients/glean.svg",
          alt: "Glean Logo",
        }}
      />

      {/* 3. Twelve Labs */}
      <LogoCard
        className="relative border-r border-b border-line md:bg-surface/30"
        logo={{
          src: "/clients/twelvelabs.svg",
          alt: "Twelve Labs Logo",
        }}
      >
        <PlusIcon
          className="-right-[12px] -bottom-[12px] absolute z-10 size-6 text-line"
          strokeWidth={1}
        />
        <PlusIcon
          className="-bottom-[12px] -left-[12px] absolute z-10 hidden size-6 text-line md:block"
          strokeWidth={1}
        />
      </LogoCard>

      {/* 4. Langwatch */}
      <LogoCard
        className="relative border-b border-line bg-surface/30 md:bg-transparent"
        logo={{
          src: "/clients/langwatch.svg",
          alt: "Langwatch Logo",
        }}
      />

      {/* 5. Statsig */}
      <LogoCard
        className="relative border-r border-b border-line bg-surface/30 md:border-b-0 md:bg-transparent"
        logo={{
          src: "/clients/statsig.png",
          alt: "Statsig Logo",
        }}
      >
        <PlusIcon
          className="-right-[12px] -bottom-[12px] md:-left-[12px] absolute z-10 size-6 text-line md:hidden"
          strokeWidth={1}
        />
      </LogoCard>

      {/* 6. Comet ML */}
      <LogoCard
        className="border-b border-line bg-transparent md:border-r md:border-b-0 md:bg-surface/30"
        logo={{
          src: "/clients/comet.svg",
          alt: "Comet ML Logo",
        }}
      />

      {/* 7. Apify */}
      <LogoCard
        className="border-r border-line"
        logo={{
          src: "/clients/apify.png",
          alt: "Apify Logo",
        }}
      />

      {/* 8. Confident AI */}
      <LogoCard
        className="bg-surface/30"
        logo={{
          src: "/clients/confident-ai.png",
          alt: "Confident AI Logo",
        }}
      />
    </div>
  );
}

type LogoCardProps = React.ComponentProps<"div"> & {
  logo: Logo;
};

function LogoCard({ logo, className, children, ...props }: LogoCardProps) {
  return (
    <div
      className={cn(
        "flex h-16 sm:h-19 items-center justify-center bg-card/60 px-4 py-3 sm:px-6 transition-colors duration-200 hover:bg-card",
        className
      )}
      {...props}
    >
      <img
        alt={logo.alt}
        className={cn(
          "pointer-events-none max-h-5 sm:max-h-6.5 w-auto max-w-[100px] sm:max-w-[125px] object-contain select-none opacity-85 transition-opacity duration-200 hover:opacity-100",
          logo.className
        )}
        height={logo.height || "auto"}
        src={logo.src}
        width={logo.width || "auto"}
      />
      {children}
    </div>
  );
}
