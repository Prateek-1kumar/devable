// import FallingPill from "@/components/FallingPill";
import CaseStudies from "@/components/case-studies/CaseStudies";
import ChannelProblems from "@/components/channel-problems/ChannelProblems";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import GrowthSystem from "@/components/growth-system/GrowthSystem";
import Hero from "@/components/Hero";
import HowWeWork from "@/components/how-we-work/HowWeWork";
import WhyDevable from "@/components/WhyDevable";
// import Stats from "@/components/Stats";
// import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <ChannelProblems />
      {/* <GrowthSystem /> */}
      <HowWeWork />
      <CaseStudies />
      <WhyDevable />
      <FinalCta />
      <Footer />
    </main>
  );
}
