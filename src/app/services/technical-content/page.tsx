import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import { CTA, HERO } from "@/components/services/content/content";
import Engine from "@/components/services/content/Engine";
import Hero from "@/components/services/content/Hero";
import Problem from "@/components/services/content/Problem";
import Process from "@/components/services/content/Process";
import Shipped from "@/components/services/content/Shipped";
import Types from "@/components/services/content/Types";
import Ways from "@/components/services/content/Ways";

export const metadata: Metadata = {
  title: "Technical Content · Devable",
  description: HERO.body,
};

// Structured data for search engines and AI answers (escaped per the Next JSON-LD guide).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Technical Content",
  serviceType: "Technical content for developer products",
  description: HERO.body,
  provider: { "@type": "Organization", name: "Devable" },
};

export default function TechnicalContent() {
  return (
    <main className="overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <Problem />
      <Engine />
      <Process />
      <Shipped />
      <Types />
      <Ways />
      <FinalCta title={CTA.title} subtitle="" body={CTA.body} ctaLabel={CTA.button} caseStudiesHref="#work" caseStudiesLabel="See our work" />
      <Footer />
    </main>
  );
}
