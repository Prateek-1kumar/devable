import FallingPill from "@/components/FallingPill";
import EmbeddedExecution from "@/components/EmbeddedExecution";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main>
      <FallingPill landed={<TrustedBy />} below={<Stats />}>
        <Hero />
      </FallingPill>
      <EmbeddedExecution />
    </main>
  );
}
