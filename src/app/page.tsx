import FallingPill from "@/components/FallingPill";
import EmbeddedExecution from "@/components/EmbeddedExecution";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main>
      <FallingPill landed={<TrustedBy />}>
        <Hero />
      </FallingPill>
      <EmbeddedExecution />
    </main>
  );
}
