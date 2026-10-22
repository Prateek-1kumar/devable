import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import Cases from "@/components/services/influencer/Cases";
import { CTA, HERO } from "@/components/services/influencer/content";
import Fit from "@/components/services/influencer/Fit";
import Hero from "@/components/services/influencer/Hero";
import Launches from "@/components/services/influencer/Launches";
import Measure from "@/components/services/influencer/Measure";
import Process from "@/components/services/influencer/Process";
import TwoWays from "@/components/services/influencer/TwoWays";

export const metadata: Metadata = {
  title: "Influencer Marketing · Devable",
  description: HERO.body,
};

export default function InfluencerMarketing() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <Launches />
      <TwoWays />
      <Cases />
      <Process />
      <Fit />
      <Measure />
      <FinalCta title={CTA.title} subtitle="" body={CTA.body} caseStudiesHref="#case-studies" />
      <Footer />
    </main>
  );
}
