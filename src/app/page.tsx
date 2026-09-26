import FallingPill from "@/components/FallingPill";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main>
      <FallingPill landed={<TrustedBy />}>
        <Hero />
      </FallingPill>
    </main>
  );
}
