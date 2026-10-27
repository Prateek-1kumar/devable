import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import Cases from "@/components/services/reddit/Cases";
import Communities from "@/components/services/reddit/Communities";
import { CTA, HERO } from "@/components/services/reddit/content";
import Contrast from "@/components/services/reddit/Contrast";
import Hero from "@/components/services/reddit/Hero";
import Journey from "@/components/services/reddit/Journey";
import Measure from "@/components/services/reddit/Measure";

export const metadata: Metadata = {
  title: "Reddit · Devable",
  description: HERO.body,
};

// Structured data for search engines and AI answers (escaped per the Next JSON-LD guide).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Reddit",
  serviceType: "Reddit community marketing for technical products",
  description: HERO.body,
  provider: { "@type": "Organization", name: "Devable" },
};

export default function Reddit() {
  return (
    <main className="overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <Contrast />
      <Journey />
      <Communities />
      <Measure />
      <Cases />
      <FinalCta title={CTA.title} subtitle="" body={CTA.body} ctaLabel={CTA.button} caseStudiesHref="#case-studies" caseStudiesLabel="See case studies" />
      <Footer />
    </main>
  );
}
