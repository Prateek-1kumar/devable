// import FallingPill from "@/components/FallingPill";
import EmbeddedExecution from "@/components/EmbeddedExecution";
import Hero from "@/components/Hero";
import HowWeWork from "@/components/how-we-work/HowWeWork";
// import Stats from "@/components/Stats";
// import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <EmbeddedExecution />
      <HowWeWork />
    </main>
  );
}
