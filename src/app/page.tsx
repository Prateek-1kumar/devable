// import FallingPill from "@/components/FallingPill";
import GrowthSystem from "@/components/growth-system/GrowthSystem";
import Hero from "@/components/Hero";
import HowWeWork from "@/components/how-we-work/HowWeWork";
// import Stats from "@/components/Stats";
// import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      {/* <GrowthSystem /> */}
      <HowWeWork />
    </main>
  );
}
